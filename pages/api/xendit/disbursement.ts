/**
 * Xendit Disbursement API
 * 
 * Creates a disbursement (withdrawal) to user's bank account.
 * 
 * POST /api/xendit/disbursement
 * 
 * @module pages/api/xendit/disbursement
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  createDisbursement,
  createXenditTransaction,
  getSavedDisbursementAccounts,
  generateReference,
} from '../../../lib/xendit';
import { validateWithdrawalAmount } from '../../../lib/xendit/currencyConfig';
import { captureError } from '../../../lib/errorTracking';
import { logger } from '../../../lib/structuredLogger';
import { db } from '../../../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// ============================================================================
// TYPES
// ============================================================================

interface CreateDisbursementBody {
  /** Amount in IDR */
  amount: number;
  /** Firebase user ID */
  userId: string;
  /** Saved account ID or 'new' */
  accountId: string;
  /** New account details (if accountId is 'new') */
  newAccount?: {
    bankCode: string;
    accountNumber: string;
    accountHolderName: string;
    saveForFuture?: boolean;
  };
}

interface CreateDisbursementResponse {
  success: boolean;
  disbursementId?: string;
  transactionId?: string;
  status?: string;
  error?: string;
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateDisbursementResponse>
): Promise<void> {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }
  
  try {
    const body = req.body as CreateDisbursementBody;
    
    // Validate request
    if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0) {
      res.status(400).json({ success: false, error: 'Invalid amount' });
      return;
    }
    
    if (!body.userId || typeof body.userId !== 'string') {
      res.status(400).json({ success: false, error: 'User ID is required' });
      return;
    }
    
    if (!body.accountId) {
      res.status(400).json({ success: false, error: 'Account is required' });
      return;
    }
    
    // Get user balance
    const userRef = doc(db, 'users', body.userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    
    const userData = userDoc.data();
    const currentBalance = (userData.balance || 0) as number;
    
    // Validate amount
    const amountValidation = validateWithdrawalAmount(body.amount, currentBalance);
    if (!amountValidation.isValid) {
      res.status(400).json({ success: false, error: amountValidation.error });
      return;
    }
    
    // Get account details
    let bankCode: string;
    let accountNumber: string;
    let accountHolderName: string;
    
    if (body.accountId === 'new') {
      if (!body.newAccount) {
        res.status(400).json({ success: false, error: 'New account details required' });
        return;
      }
      
      bankCode = body.newAccount.bankCode;
      accountNumber = body.newAccount.accountNumber;
      accountHolderName = body.newAccount.accountHolderName;
      
      // TODO: Save for future if requested
    } else {
      const savedAccounts = await getSavedDisbursementAccounts(body.userId);
      const account = savedAccounts.find(a => a.id === body.accountId);
      
      if (!account) {
        res.status(404).json({ success: false, error: 'Account not found' });
        return;
      }
      
      bankCode = account.channelCode;
      accountNumber = account.accountNumber;
      accountHolderName = account.accountHolderName;
    }
    
    // Generate reference
    const reference = generateReference('DIS');
    
    // Debit user balance first
    const newBalance = currentBalance - body.amount;
    await setDoc(userRef, {
      balance: newBalance,
      lastBalanceUpdate: serverTimestamp(),
    }, { merge: true });
    
    try {
      // Create disbursement
      const result = await createDisbursement({
        userId: body.userId,
        external_id: reference,
        amount: body.amount,
        bank_code: bankCode,
        account_number: accountNumber,
        account_holder_name: accountHolderName,
        description: 'TopDog Withdrawal',
      });
      
      // Create transaction record
      const transaction = await createXenditTransaction({
        userId: body.userId,
        type: 'withdrawal',
        amountSmallestUnit: body.amount,
        currency: 'IDR',
        status: 'pending',
        provider: 'xendit',
        providerReference: result.disbursementId,
        description: 'Withdrawal to bank account',
        metadata: {
          xenditDisbursementId: result.disbursementId,
          reference,
          bankCode,
          accountNumberMasked: `****${accountNumber.slice(-4)}`,
        },
      });
      
      res.status(200).json({
        success: true,
        disbursementId: result.disbursementId,
        transactionId: transaction.id,
        status: result.status,
      });
      
    } catch (disbursementError) {
      // Restore balance if disbursement fails
      await setDoc(userRef, {
        balance: currentBalance,
        lastBalanceUpdate: serverTimestamp(),
      }, { merge: true });
      
      throw disbursementError;
    }
    
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Disbursement creation error', err, {
      component: 'xendit',
      operation: 'createDisbursement',
    });
    await captureError(err, {
      tags: { component: 'xendit', operation: 'createDisbursement' },
    });
    
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to create disbursement',
    });
  }
}


