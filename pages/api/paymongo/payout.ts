/**
 * PayMongo Payout API
 * 
 * Creates a payout (withdrawal) to a user's bank account.
 * 
 * POST /api/paymongo/payout
 * 
 * @module pages/api/paymongo/payout
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  createPayout,
  createPayMongoTransaction,
  getSavedBankAccounts,
  generateReference,
} from '../../../lib/paymongo';
import { toSmallestUnit, validateWithdrawalAmount, toDisplayAmount } from '../../../lib/paymongo/currencyConfig';
import { captureError } from '../../../lib/errorTracking';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// ============================================================================
// TYPES
// ============================================================================

interface CreatePayoutBody {
  /** Amount in PHP (display amount) */
  amount: number;
  /** Firebase user ID */
  userId: string;
  /** Bank account ID (from saved accounts) or 'new' */
  bankAccountId: string;
  /** New bank account details (if bankAccountId is 'new') */
  newBankAccount?: {
    bankCode: string;
    accountNumber: string;
    accountHolderName: string;
    saveForFuture?: boolean;
  };
}

interface CreatePayoutResponse {
  success: boolean;
  payoutId?: string;
  transactionId?: string;
  status?: string;
  error?: string;
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreatePayoutResponse>
): Promise<void> {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }
  
  try {
    const body = req.body as CreatePayoutBody;
    
    // Validate request
    if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0) {
      res.status(400).json({ success: false, error: 'Invalid amount' });
      return;
    }
    
    if (!body.userId || typeof body.userId !== 'string') {
      res.status(400).json({ success: false, error: 'User ID is required' });
      return;
    }
    
    if (!body.bankAccountId) {
      res.status(400).json({ success: false, error: 'Bank account is required' });
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
    
    // Convert to centavos and validate
    const amountCentavos = toSmallestUnit(body.amount);
    const balanceCentavos = toSmallestUnit(currentBalance);
    
    const amountValidation = validateWithdrawalAmount(amountCentavos, balanceCentavos);
    if (!amountValidation.isValid) {
      res.status(400).json({ success: false, error: amountValidation.error });
      return;
    }
    
    // Get bank account details
    let bankCode: string;
    let accountNumber: string;
    let accountHolderName: string;
    
    if (body.bankAccountId === 'new') {
      if (!body.newBankAccount) {
        res.status(400).json({ success: false, error: 'New bank account details required' });
        return;
      }
      
      bankCode = body.newBankAccount.bankCode;
      accountNumber = body.newBankAccount.accountNumber;
      accountHolderName = body.newBankAccount.accountHolderName;
      
      // TODO: Save for future if requested
    } else {
      const savedAccounts = await getSavedBankAccounts(body.userId);
      const account = savedAccounts.find(a => a.id === body.bankAccountId);
      
      if (!account) {
        res.status(404).json({ success: false, error: 'Bank account not found' });
        return;
      }
      
      bankCode = account.bankCode;
      accountNumber = account.accountNumber;
      accountHolderName = account.accountHolderName;
    }
    
    // Generate reference
    const reference = generateReference('PAY');
    
    // Create payout
    const result = await createPayout({
      userId: body.userId,
      amount: amountCentavos,
      currency: 'PHP',
      bank_code: bankCode,
      account_number: accountNumber,
      account_holder_name: accountHolderName,
      description: 'Withdrawal',
      metadata: {
        firebaseUserId: body.userId,
        reference,
      },
    });
    
    // Create transaction record
    const transaction = await createPayMongoTransaction({
      userId: body.userId,
      type: 'withdrawal',
      amountSmallestUnit: amountCentavos,
      currency: 'PHP',
      status: 'pending',
      provider: 'paymongo',
      providerReference: result.payoutId,
      description: 'Withdrawal to bank account',
      metadata: {
        paymongoPayoutId: result.payoutId,
        reference,
        bankCode,
        accountNumberMasked: `****${accountNumber.slice(-4)}`,
      },
    });
    
    res.status(200).json({
      success: true,
      payoutId: result.payoutId,
      transactionId: transaction.id,
      status: result.status,
    });
    
  } catch (error) {
    await captureError(error instanceof Error ? error : new Error('Unknown error'), {
      tags: { component: 'paymongo', operation: 'createPayout' },
    });
    
    console.error('[PayMongo Payout API] Error:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payout',
    });
  }
}


