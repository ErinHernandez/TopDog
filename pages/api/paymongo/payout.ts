/**
 * PayMongo Payout API
 * 
 * Creates a payout (withdrawal) to a user's bank account.
 * 
 * POST /api/paymongo/payout
 * 
 * @module pages/api/paymongo/payout
 */

import { doc, getDoc } from 'firebase/firestore';
import type { NextApiRequest, NextApiResponse } from 'next';

import { verifyAuthToken } from '../../../lib/apiAuth';
import {
  withErrorHandling,
  validateMethod,
  validateBody,
  validateRequestBody,
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from '../../../lib/apiErrorHandler';
import { withCSRFProtection } from '../../../lib/csrfProtection';
import { db } from '../../../lib/firebase';
import {
  createPayout,
  createPayMongoTransaction,
  getSavedBankAccounts,
  saveBankAccount,
  generateReference,
} from '../../../lib/paymongo';
import { toSmallestUnit, validateWithdrawalAmount, toDisplayAmount } from '../../../lib/paymongo/currencyConfig';
import { withRateLimit, createPaymentRateLimiter } from '../../../lib/rateLimitConfig';
import { paymongoCreatePayoutSchema } from '../../../lib/validation/schemas';

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

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreatePayoutResponse>
): Promise<void> {
  await withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['POST'], logger);

    // SECURITY: Verify user authentication
    const authResult = await verifyAuthToken(req.headers.authorization);
    if (!authResult.uid) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Use authenticated user ID, not from request body
    const userId = authResult.uid;

    logger.info('PayMongo payout request', {
      component: 'paymongo',
      operation: 'createPayout',
    });

    // SECURITY: Validate request body using Zod schema
    const body = validateRequestBody(req, paymongoCreatePayoutSchema, logger);

    logger.info('Validating payout request', {
      component: 'paymongo',
      operation: 'createPayout',
      userId,
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
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      const response = createErrorResponse(
        ErrorType.NOT_FOUND,
        'User not found',
        { userId: userId },
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
        userId: userId,
        saveForFuture: body.newBankAccount.saveForFuture,
      });

      // Save bank account for future use if requested
      if (body.newBankAccount.saveForFuture) {
        try {
          // Create masked account number for display (show last 4 digits)
          const accountNumberMasked = accountNumber.length > 4
            ? '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4)
            : accountNumber;

          // Map bank code to bank name
          const bankNames: Record<string, string> = {
            'BPI': 'Bank of the Philippine Islands',
            'BDO': 'BDO Unibank',
            'UNIONBANK': 'UnionBank of the Philippines',
            'METROBANK': 'Metropolitan Bank & Trust',
            'LANDBANK': 'Land Bank of the Philippines',
            'PNB': 'Philippine National Bank',
            'RCBC': 'Rizal Commercial Banking Corporation',
            'SECURITYBANK': 'Security Bank Corporation',
            'CHINABANK': 'China Banking Corporation',
            'EASTWEST': 'EastWest Banking Corporation',
          };
          const bankName = bankNames[bankCode.toUpperCase()] || bankCode;

          const savedAccount = await saveBankAccount(userId, {
            bankCode,
            bankName,
            accountNumber,
            accountNumberMasked,
            accountHolderName,
            isDefault: false, // Don't automatically make it default
          });
          logger.info('Bank account saved for future use', {
            component: 'paymongo',
            operation: 'saveBankAccount',
            userId: userId,
            accountId: savedAccount.id,
          });
        } catch (saveError) {
          // Log but don't fail the payout - saving is optional
          logger.warn('Failed to save bank account for future use', {
            component: 'paymongo',
            operation: 'saveBankAccount',
            userId: userId,
            error: saveError instanceof Error ? saveError.message : String(saveError),
          });
        }
      }
    } else {
      logger.info('Fetching saved bank account', {
        component: 'paymongo',
        operation: 'createPayout',
        userId: userId,
        bankAccountId: body.bankAccountId,
      });
      
      const savedAccounts = await getSavedBankAccounts(userId);
      const account = savedAccounts.find(a => a.id === body.bankAccountId);
      
      if (!account) {
        const response = createErrorResponse(
          ErrorType.NOT_FOUND,
          'Bank account not found',
          { userId: userId, bankAccountId: body.bankAccountId },
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
        userId: userId,
        bankAccountId: body.bankAccountId,
      });
    }
    
    // Generate reference
    const reference = generateReference('PAY');
    
    logger.info('Creating PayMongo payout', {
      component: 'paymongo',
      operation: 'createPayout',
      userId: userId,
      amountCentavos,
      reference,
      bankCode,
      accountNumberMasked: `****${accountNumber.slice(-4)}`,
    });
    
    // Create payout
    const result = await createPayout({
      userId: userId,
      amount: amountCentavos,
      currency: 'PHP',
      bank_code: bankCode,
      account_number: accountNumber,
      account_holder_name: accountHolderName,
      description: 'Withdrawal',
      metadata: {
        firebaseUserId: userId,
        reference,
      },
    });
    
    logger.info('PayMongo payout created', {
      component: 'paymongo',
      operation: 'createPayout',
      userId: userId,
      payoutId: result.payoutId,
      status: result.status,
      reference,
    });
    
    // Create transaction record
    const transaction = await createPayMongoTransaction({
      userId: userId,
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
      userId: userId,
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

// Create rate limiter for PayMongo payouts (5 per hour)
const paymongoPayoutLimiter = createPaymentRateLimiter('paymongoPayout');

// Export with CSRF protection and rate limiting
type CSRFHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;
export default withCSRFProtection(
  withRateLimit(handler, paymongoPayoutLimiter) as unknown as CSRFHandler
);
