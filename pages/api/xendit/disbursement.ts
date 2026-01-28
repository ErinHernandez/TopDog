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
  saveDisbursementAccount,
  generateReference,
} from '../../../lib/xendit';
import { validateWithdrawalAmount } from '../../../lib/xendit/currencyConfig';
import { 
  withErrorHandling,
  validateMethod,
  validateBody,
  validateRequestBody,
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from '../../../lib/apiErrorHandler';
import { xenditCreateDisbursementSchema } from '../../../lib/validation/schemas';
import { db } from '../../../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { withAuth } from '../../../lib/apiAuth';
import { withRateLimit, createPaymentRateLimiter } from '../../../lib/rateLimitConfig';

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

// Create rate limiter for Xendit disbursements (10 per hour)
const xenditDisbursementLimiter = createPaymentRateLimiter('xenditDisbursement');

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateDisbursementResponse>
): Promise<void> {
  await withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['POST'], logger);
    
    logger.info('Xendit disbursement request', {
      component: 'xendit',
      operation: 'createDisbursement',
    });
    
    // SECURITY: Validate request body using Zod schema
    const body = validateRequestBody(req, xenditCreateDisbursementSchema, logger);
    
    logger.info('Validating disbursement request', {
      component: 'xendit',
      operation: 'createDisbursement',
      userId: body.userId,
      amount: body.amount,
      accountId: body.accountId,
    });
    
    // Get user balance
    if (!db) {
      const response = createErrorResponse(
        ErrorType.CONFIGURATION,
        'Firebase Firestore is not initialized',
        {},
        null
      );
      return res.status(response.statusCode).json({ 
        success: false, 
        error: 'Database not available' 
      });
    }
    const userRef = doc(db, 'users', body.userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      const response = createErrorResponse(
        ErrorType.NOT_FOUND,
        'User not found',
        { userId: body.userId },
        null
      );
      return res.status(response.statusCode).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    const userData = userDoc.data();
    const currentBalance = (userData.balance || 0) as number;
    
    // Validate amount
    const amountValidation = validateWithdrawalAmount(body.amount, currentBalance);
    if (!amountValidation.isValid) {
      const response = createErrorResponse(
        ErrorType.VALIDATION,
        amountValidation.error || 'Invalid withdrawal amount',
        { 
          amount: body.amount,
          balance: currentBalance,
        },
        null
      );
      return res.status(response.statusCode).json({ 
        success: false, 
        error: amountValidation.error 
      });
    }
    
    // Get account details
    let bankCode: string;
    let accountNumber: string;
    let accountHolderName: string;
    
    if (body.accountId === 'new') {
      if (!body.newAccount) {
        const response = createErrorResponse(
          ErrorType.VALIDATION,
          'New account details required when accountId is "new"',
          {},
          null
        );
        return res.status(response.statusCode).json({ 
          success: false, 
          error: 'New account details required' 
        });
      }
      
      // Validate new account fields
      if (!body.newAccount.bankCode || !body.newAccount.accountNumber || !body.newAccount.accountHolderName) {
        const response = createErrorResponse(
          ErrorType.VALIDATION,
          'Bank code, account number, and account holder name are required for new accounts',
          {},
          null
        );
        return res.status(response.statusCode).json({ 
          success: false, 
          error: 'New account details required' 
        });
      }
      
      bankCode = body.newAccount.bankCode;
      accountNumber = body.newAccount.accountNumber;
      accountHolderName = body.newAccount.accountHolderName;
      
      logger.info('Using new account for disbursement', {
        component: 'xendit',
        operation: 'createDisbursement',
        userId: body.userId,
        saveForFuture: body.newAccount.saveForFuture,
      });

      // Save account for future use if requested
      if (body.newAccount.saveForFuture) {
        try {
          // Create masked account number for display (show last 4 digits)
          const accountNumberMasked = accountNumber.length > 4
            ? '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4)
            : accountNumber;

          // Determine account type and channel name
          const isEwallet = ['GCASH', 'GRABPAY', 'PAYMAYA', 'SHOPEEPAY'].includes(bankCode.toUpperCase());
          const type = isEwallet ? 'ewallet' : 'bank' as const;

          // Map channel code to channel name
          const channelNames: Record<string, string> = {
            // Banks
            'BCA': 'Bank Central Asia',
            'BNI': 'Bank Negara Indonesia',
            'BRI': 'Bank Rakyat Indonesia',
            'MANDIRI': 'Bank Mandiri',
            'CIMB': 'CIMB Niaga',
            'PERMATA': 'PermataBank',
            'BSI': 'Bank Syariah Indonesia',
            // E-wallets
            'GCASH': 'GCash',
            'GRABPAY': 'GrabPay',
            'PAYMAYA': 'PayMaya',
            'SHOPEEPAY': 'ShopeePay',
            'OVO': 'OVO',
            'DANA': 'DANA',
          };
          const channelName = channelNames[bankCode.toUpperCase()] || bankCode;

          const savedAccount = await saveDisbursementAccount(body.userId, {
            type,
            channelCode: bankCode,
            channelName,
            accountNumber,
            accountNumberMasked,
            accountHolderName,
            isDefault: false, // Don't automatically make it default
          });
          logger.info('Disbursement account saved for future use', {
            component: 'xendit',
            operation: 'saveDisbursementAccount',
            userId: body.userId,
            accountId: savedAccount.id,
          });
        } catch (saveError) {
          // Log but don't fail the disbursement - saving is optional
          logger.warn('Failed to save disbursement account for future use', {
            component: 'xendit',
            operation: 'saveDisbursementAccount',
            userId: body.userId,
            error: saveError instanceof Error ? saveError.message : String(saveError),
          });
        }
      }
    } else {
      logger.info('Fetching saved disbursement account', {
        component: 'xendit',
        operation: 'createDisbursement',
        userId: body.userId,
        accountId: body.accountId,
      });
      
      const savedAccounts = await getSavedDisbursementAccounts(body.userId);
      const account = savedAccounts.find(a => a.id === body.accountId);
      
      if (!account) {
        const response = createErrorResponse(
          ErrorType.NOT_FOUND,
          'Account not found',
          { userId: body.userId, accountId: body.accountId },
          null
        );
        return res.status(response.statusCode).json({ 
          success: false, 
          error: 'Account not found' 
        });
      }
      
      bankCode = account.channelCode;
      accountNumber = account.accountNumber;
      accountHolderName = account.accountHolderName;
      
      logger.info('Using saved account for disbursement', {
        component: 'xendit',
        operation: 'createDisbursement',
        userId: body.userId,
        accountId: body.accountId,
      });
    }
    
    // Generate reference
    const reference = generateReference('DIS');
    
    logger.info('Debiting user balance', {
      component: 'xendit',
      operation: 'createDisbursement',
      userId: body.userId,
      amount: body.amount,
      currentBalance,
      newBalance: currentBalance - body.amount,
    });
    
    // Debit user balance first
    const newBalance = currentBalance - body.amount;
    await setDoc(userRef, {
      balance: newBalance,
      lastBalanceUpdate: serverTimestamp(),
    }, { merge: true });
    
    // Declare transaction variable outside try block for error handler access
    // Transaction will be created after disbursement is successful
    let transaction: { id: string } | null = null;
    
    try {
      logger.info('Creating Xendit disbursement', {
        component: 'xendit',
        operation: 'createDisbursement',
        userId: body.userId,
        amount: body.amount,
        reference,
        bankCode,
        accountNumberMasked: `****${accountNumber.slice(-4)}`,
      });
      
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
      
      logger.info('Xendit disbursement created', {
        component: 'xendit',
        operation: 'createDisbursement',
        userId: body.userId,
        disbursementId: result.disbursementId,
        status: result.status,
        reference,
      });
      
      // Create transaction record
      transaction = await createXenditTransaction({
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
      
      logger.info('Xendit disbursement transaction created', {
        component: 'xendit',
        operation: 'createDisbursement',
        userId: body.userId,
        disbursementId: result.disbursementId,
        transactionId: transaction.id,
        status: result.status,
      });
      
      return res.status(200).json({
        success: true,
        disbursementId: result.disbursementId,
        transactionId: transaction.id,
        status: result.status,
      });
      
    } catch (disbursementError) {
      // Restore balance if disbursement fails
      logger.error('Disbursement creation failed, verifying and restoring balance', disbursementError, {
        component: 'xendit',
        operation: 'createDisbursement',
        userId: body.userId,
        originalBalance: currentBalance,
      });
      
      try {
        // Verify balance was actually debited before restoring
        const userSnapshot = await getDoc(userRef);
        const currentBalanceAfterDebit = (userSnapshot.data()?.balance || 0) as number;
        
        if (currentBalanceAfterDebit < currentBalance) {
          // Balance was debited, restore it
          await setDoc(userRef, {
            balance: currentBalance,
            lastBalanceUpdate: serverTimestamp(),
          }, { merge: true });
          
          logger.info('Balance restored after disbursement failure', {
            component: 'xendit',
            operation: 'createDisbursement',
            userId: body.userId,
            restoredBalance: currentBalance,
            balanceBeforeRestore: currentBalanceAfterDebit,
            amountRestored: currentBalance - currentBalanceAfterDebit,
          });
        } else {
          // Balance was never debited, no need to restore
          logger.info('Balance not debited, skipping restoration', {
            component: 'xendit',
            operation: 'createDisbursement',
            userId: body.userId,
            currentBalance: currentBalanceAfterDebit,
            originalBalance: currentBalance,
          });
        }
      } catch (restoreError) {
        // Critical: Balance restoration failed - log for manual intervention
        logger.error('CRITICAL: Balance restoration failed', restoreError, {
          component: 'xendit',
          operation: 'createDisbursement',
          userId: body.userId,
          originalBalance: currentBalance,
        });
        
        // Update transaction to indicate manual review needed
        // Note: transaction may not exist if disbursement failed before creation
        if (transaction?.id) {
          const transactionRef = doc(db!, 'transactions', transaction.id);
          await updateDoc(transactionRef, {
            status: 'failed',
            errorMessage: 'Disbursement failed and balance restoration failed - manual review required',
            requiresManualReview: true,
            updatedAt: serverTimestamp(),
          });
        }
        
        // Re-throw to trigger alert
        throw new Error(
          `Disbursement failed and balance restoration failed: ${restoreError instanceof Error ? restoreError.message : 'Unknown error'}`
        );
      }
      
      // Re-throw original error to be handled by withErrorHandling
      throw disbursementError;
    }
  });
}

// Export with authentication and rate limiting
// Cast to any to resolve type mismatch between NextApiRequest and AuthenticatedRequest
export default withAuth(
  withRateLimit(handler, xenditDisbursementLimiter) as any,
  { required: true, allowAnonymous: false }
);


