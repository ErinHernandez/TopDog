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
import { 
  withErrorHandling,
  validateMethod,
  validateBody,
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from '../../../lib/apiErrorHandler';
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
  await withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['POST'], logger);
    
    logger.info('PayMongo payout request', {
      component: 'paymongo',
      operation: 'createPayout',
    });
    
    const body = req.body as CreatePayoutBody;
    
    // Validate required fields
    validateBody(req, ['amount', 'userId', 'bankAccountId'], logger);
    
    // Validate amount type and value
    if (typeof body.amount !== 'number' || body.amount <= 0) {
      const response = createErrorResponse(
        ErrorType.VALIDATION,
        'Invalid amount. Must be a positive number',
        { amount: body.amount },
        null
      );
      return res.status(response.statusCode).json({ 
        success: false, 
        error: 'Invalid amount' 
      });
    }
    
    // Validate userId type
    if (typeof body.userId !== 'string') {
      const response = createErrorResponse(
        ErrorType.VALIDATION,
        'User ID must be a string',
        {},
        null
      );
      return res.status(response.statusCode).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }
    
    logger.info('Validating payout request', {
      component: 'paymongo',
      operation: 'createPayout',
      userId: body.userId,
      amount: body.amount,
      bankAccountId: body.bankAccountId,
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
    
    // Convert to centavos and validate
    const amountCentavos = toSmallestUnit(body.amount);
    const balanceCentavos = toSmallestUnit(currentBalance);
    
    const amountValidation = validateWithdrawalAmount(amountCentavos, balanceCentavos);
    if (!amountValidation.isValid) {
      const response = createErrorResponse(
        ErrorType.VALIDATION,
        amountValidation.error || 'Invalid withdrawal amount',
        { 
          amount: body.amount,
          amountCentavos,
          balance: currentBalance,
          balanceCentavos,
        },
        null
      );
      return res.status(response.statusCode).json({ 
        success: false, 
        error: amountValidation.error 
      });
    }
    
    // Get bank account details
    let bankCode: string;
    let accountNumber: string;
    let accountHolderName: string;
    
    if (body.bankAccountId === 'new') {
      if (!body.newBankAccount) {
        const response = createErrorResponse(
          ErrorType.VALIDATION,
          'New bank account details required when bankAccountId is "new"',
          {},
          null
        );
        return res.status(response.statusCode).json({ 
          success: false, 
          error: 'New bank account details required' 
        });
      }
      
      // Validate new bank account fields
      if (!body.newBankAccount.bankCode || !body.newBankAccount.accountNumber || !body.newBankAccount.accountHolderName) {
        const response = createErrorResponse(
          ErrorType.VALIDATION,
          'Bank code, account number, and account holder name are required for new bank accounts',
          {},
          null
        );
        return res.status(response.statusCode).json({ 
          success: false, 
          error: 'New bank account details required' 
        });
      }
      
      bankCode = body.newBankAccount.bankCode;
      accountNumber = body.newBankAccount.accountNumber;
      accountHolderName = body.newBankAccount.accountHolderName;
      
      logger.info('Using new bank account for payout', {
        component: 'paymongo',
        operation: 'createPayout',
        userId: body.userId,
        saveForFuture: body.newBankAccount.saveForFuture,
      });
      
      // TODO: Save for future if requested
      // Note: This TODO should be addressed in a future update
      // Implementation would involve saving the bank account to user's saved accounts
    } else {
      logger.info('Fetching saved bank account', {
        component: 'paymongo',
        operation: 'createPayout',
        userId: body.userId,
        bankAccountId: body.bankAccountId,
      });
      
      const savedAccounts = await getSavedBankAccounts(body.userId);
      const account = savedAccounts.find(a => a.id === body.bankAccountId);
      
      if (!account) {
        const response = createErrorResponse(
          ErrorType.NOT_FOUND,
          'Bank account not found',
          { userId: body.userId, bankAccountId: body.bankAccountId },
          null
        );
        return res.status(response.statusCode).json({ 
          success: false, 
          error: 'Bank account not found' 
        });
      }
      
      bankCode = account.bankCode;
      accountNumber = account.accountNumber;
      accountHolderName = account.accountHolderName;
      
      logger.info('Using saved bank account for payout', {
        component: 'paymongo',
        operation: 'createPayout',
        userId: body.userId,
        bankAccountId: body.bankAccountId,
      });
    }
    
    // Generate reference
    const reference = generateReference('PAY');
    
    logger.info('Creating PayMongo payout', {
      component: 'paymongo',
      operation: 'createPayout',
      userId: body.userId,
      amountCentavos,
      reference,
      bankCode,
      accountNumberMasked: `****${accountNumber.slice(-4)}`,
    });
    
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
    
    logger.info('PayMongo payout created', {
      component: 'paymongo',
      operation: 'createPayout',
      userId: body.userId,
      payoutId: result.payoutId,
      status: result.status,
      reference,
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
    
    logger.info('PayMongo payout transaction created', {
      component: 'paymongo',
      operation: 'createPayout',
      userId: body.userId,
      payoutId: result.payoutId,
      transactionId: transaction.id,
      status: result.status,
    });
    
    const response = createSuccessResponse({
      success: true,
      payoutId: result.payoutId,
      transactionId: transaction.id,
      status: result.status,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
}


