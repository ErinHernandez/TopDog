/**
 * Paystack Transfer Initiation API
 * 
 * Initiates a withdrawal transfer to a user's saved recipient.
 * Verifies balance, applies security checks, and creates transfer.
 * 
 * POST /api/paystack/transfer/initiate
 * 
 * @module pages/api/paystack/transfer/initiate
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  initiateTransfer,
  generateReference,
  createPaystackTransaction,
} from '../../../../lib/paystack';
import {
  validatePaystackAmount,
  formatPaystackAmount,
  calculateTransferFee,
  validateTransferFee,
} from '../../../../lib/paystack/currencyConfig';
import type { PaystackTransferRecipient } from '../../../../lib/paystack/paystackTypes';
import { 
  withErrorHandling,
  validateMethod,
  validateBody,
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
  type ScopedLogger,
} from '../../../../lib/apiErrorHandler';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { getStripeExchangeRate, convertToUSD } from '../../../../lib/stripe/exchangeRates';

// ============================================================================
// TYPES
// ============================================================================

interface InitiateTransferRequest {
  /** Firebase user ID */
  userId: string;
  /** Amount in smallest unit */
  amountSmallestUnit: number;
  /** Currency code */
  currency: string;
  /** Recipient code (from saved recipients) */
  recipientCode: string;
  /** Transfer reason */
  reason?: string;
  /** 2FA token for verification (optional but recommended) */
  twoFactorToken?: string;
  /** Idempotency key to prevent duplicates */
  idempotencyKey?: string;
}

interface InitiateTransferResponse {
  ok: boolean;
  data?: {
    /** Transfer reference */
    reference: string;
    /** Transfer code from Paystack */
    transferCode: string;
    /** Transaction ID in our system */
    transactionId: string;
    /** Transfer status */
    status: string;
    /** Amount transferred */
    amountSmallestUnit: number;
    /** Currency */
    currency: string;
    /** Formatted amount */
    amountFormatted: string;
    /** Transfer fee (in smallest unit) */
    feeSmallestUnit: number;
    /** Formatted fee */
    feeFormatted: string;
    /** Recipient details */
    recipient: {
      name: string;
      accountNumber: string;
      bankName?: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InitiateTransferResponse>
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['POST'], logger);
    
    logger.info('Paystack transfer initiation request', {
      component: 'paystack',
      operation: 'transfer-initiate',
    });
    
    const {
      userId,
      amountSmallestUnit,
      currency,
      recipientCode,
      reason,
      twoFactorToken,
      idempotencyKey,
    } = req.body as InitiateTransferRequest;
    
    // Validate required fields
    validateBody(req, ['userId', 'amountSmallestUnit', 'currency', 'recipientCode'], logger);
    
    // Validate amount type and value
    if (typeof amountSmallestUnit !== 'number' || amountSmallestUnit <= 0) {
      const response = createErrorResponse(
        ErrorType.VALIDATION,
        'Valid amount is required. Must be a positive number',
        { amountSmallestUnit },
        res.getHeader('X-Request-ID') as string
      );
      return res.status(response.statusCode).json({
        ok: false,
        error: { code: 'invalid_amount', message: 'Valid amount is required' },
      });
    }
    
    // Validate currency
    const currencyUpper = currency?.toUpperCase();
    if (!currencyUpper || !['NGN', 'GHS', 'ZAR', 'KES'].includes(currencyUpper)) {
      const response = createErrorResponse(
        ErrorType.VALIDATION,
        'Valid currency (NGN, GHS, ZAR, KES) is required',
        { currency },
        res.getHeader('X-Request-ID') as string
      );
      return res.status(response.statusCode).json({
        ok: false,
        error: { code: 'invalid_currency', message: 'Valid currency (NGN, GHS, ZAR, KES) is required' },
      });
    }
    
    // Validate amount using Paystack rules
    const validation = validatePaystackAmount(amountSmallestUnit, currencyUpper);
    if (!validation.isValid) {
      const response = createErrorResponse(
        ErrorType.VALIDATION,
        validation.error || 'Invalid amount',
        { amountSmallestUnit, currency: currencyUpper },
        res.getHeader('X-Request-ID') as string
      );
      return res.status(response.statusCode).json({
        ok: false,
        error: { code: 'invalid_amount', message: validation.error || 'Invalid amount' },
      });
    }
    
    logger.info('Validating transfer request', {
      component: 'paystack',
      operation: 'transfer-initiate',
      userId,
      amountSmallestUnit,
      currency: currencyUpper,
      recipientCode,
    });
    
    // Get user data
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      const response = createErrorResponse(
        ErrorType.NOT_FOUND,
        'User not found',
        { userId },
        res.getHeader('X-Request-ID') as string
      );
      return res.status(response.statusCode).json({
        ok: false,
        error: { code: 'user_not_found', message: 'User not found' },
      });
    }
    
    const userData = userDoc.data();
    
    // Find the recipient
    const recipients = (userData.paystackTransferRecipients || []) as PaystackTransferRecipient[];
    const recipient = recipients.find(r => r.code === recipientCode);
    
    if (!recipient) {
      const response = createErrorResponse(
        ErrorType.VALIDATION,
        'Recipient not found. Please add a withdrawal method first.',
        { userId, recipientCode },
        res.getHeader('X-Request-ID') as string
      );
      return res.status(response.statusCode).json({
        ok: false,
        error: { code: 'recipient_not_found', message: 'Recipient not found. Please add a withdrawal method first.' },
      });
    }
    
    // Check currency matches
    if (recipient.currency.toUpperCase() !== currencyUpper) {
      const response = createErrorResponse(
        ErrorType.VALIDATION,
        `Recipient is for ${recipient.currency}, but withdrawal requested in ${currencyUpper}`,
        { recipientCurrency: recipient.currency, requestedCurrency: currencyUpper },
        res.getHeader('X-Request-ID') as string
      );
      return res.status(response.statusCode).json({
        ok: false,
        error: {
          code: 'currency_mismatch',
          message: `Recipient is for ${recipient.currency}, but withdrawal requested in ${currencyUpper}`,
        },
      });
    }
    
    // Calculate fee
    const recipientType = recipient.type === 'mobile_money' ? 'mobile_money' : 'bank';
    const feeSmallestUnit = calculateTransferFee(amountSmallestUnit, currencyUpper, recipientType);
    
    // Validate transfer fee calculation
    // Ensure fee is reasonable and matches expected structure
    if (feeSmallestUnit < 0) {
      const response = createErrorResponse(
        ErrorType.VALIDATION,
        'Invalid transfer fee calculated',
        { amountSmallestUnit, currency: currencyUpper, recipientType, feeSmallestUnit },
        res.getHeader('X-Request-ID') as string
      );
      return res.status(response.statusCode).json({
        ok: false,
        error: { code: 'fee_calculation_error', message: 'Transfer fee calculation failed' },
      });
    }
    
    // Validate fee against expected ranges for currency using validateTransferFee
    const feeValidation = validateTransferFee(
      feeSmallestUnit,
      amountSmallestUnit,
      currencyUpper,
      recipientType
    );
    
    if (!feeValidation.isValid) {
      logger.warn('Transfer fee outside expected range', {
        component: 'paystack',
        operation: 'transfer-initiate',
        currency: currencyUpper,
        recipientType,
        calculatedFee: feeSmallestUnit,
        expectedRange: feeValidation.expectedRange,
        amountSmallestUnit,
        validationError: feeValidation.error,
      });
      // Don't fail, but log for monitoring - fees may change
      // If fee is way outside range (e.g., > 2x expected), could add stricter validation
    }
    
    const totalAmountWithFee = amountSmallestUnit + feeSmallestUnit;
    
    logger.info('Transfer fee calculated', {
      component: 'paystack',
      operation: 'transfer-initiate',
      currency: currencyUpper,
      recipientType,
      amountSmallestUnit,
      feeSmallestUnit,
      totalAmountWithFee,
    });
    
    // Generate reference first (needed for idempotency)
    const reference = idempotencyKey || generateReference('TRF');
    
    // Local currency amounts
    const localAmountDisplay = amountSmallestUnit / 100;
    const localTotalWithFeeDisplay = totalAmountWithFee / 100;
    
    logger.info('Converting currency to USD for balance debit', {
      component: 'paystack',
      operation: 'transfer-initiate',
      userId,
      localAmount: localAmountDisplay,
      localTotalWithFee: localTotalWithFeeDisplay,
      currency: currencyUpper,
      feeSmallestUnit,
    });
    
    // Convert local currency to USD for balance operations
    // User balance is stored in USD, so we must convert withdrawal amounts
    let exchangeRate: number;
    let usdAmountToDebit: number;
    
    try {
      const rateData = await getStripeExchangeRate(currencyUpper);
      exchangeRate = rateData.rate;
      usdAmountToDebit = convertToUSD(localTotalWithFeeDisplay, exchangeRate);
      
      logger.info('Currency conversion successful', {
        component: 'paystack',
        operation: 'transfer-initiate',
        localAmount: localTotalWithFeeDisplay,
        currency: currencyUpper,
        exchangeRate,
        usdAmount: usdAmountToDebit.toFixed(2),
      });
    } catch (error) {
      logger.error('Failed to get exchange rate', error as Error, {
        component: 'paystack',
        operation: 'transfer-initiate',
        currency: currencyUpper,
      });
      const response = createErrorResponse(
        ErrorType.EXTERNAL_API,
        'Unable to process withdrawal: exchange rate unavailable',
        { currency: currencyUpper },
        res.getHeader('X-Request-ID') as string
      );
      return res.status(response.statusCode).json({
        ok: false,
        error: {
          code: 'exchange_rate_failed',
          message: 'Unable to process withdrawal: exchange rate unavailable',
        },
      });
    }
    
    // TODO: Verify 2FA if enabled
    // Note: This feature should be implemented when 2FA is fully enabled
    // if (userData.twoFactorEnabled && !twoFactorToken) {
    //   const response = createErrorResponse(
    //     ErrorType.UNAUTHORIZED,
    //     'Two-factor authentication is required',
    //     { userId },
    //     logger
    //   );
    //   return res.status(response.statusCode).json({
    //     ok: false,
    //     error: { code: '2fa_required', message: 'Two-factor authentication is required' },
    //   });
    // }
    
    // Use Firestore transaction to atomically check and debit balance (in USD)
    // This prevents race conditions where concurrent requests both pass validation
    let newBalance: number;
    try {
      newBalance = await runTransaction(db, async (transaction) => {
        const userSnapshot = await transaction.get(userRef);
        
        if (!userSnapshot.exists()) {
          throw new Error('User not found');
        }
        
        const currentBalance = (userSnapshot.data().balance || 0) as number; // USD balance
        
        // Check balance within transaction (comparing USD to USD)
        if (currentBalance < usdAmountToDebit) {
          throw new Error(`Insufficient balance. Available: $${currentBalance.toFixed(2)} USD, Required: $${usdAmountToDebit.toFixed(2)} USD (${localTotalWithFeeDisplay.toFixed(2)} ${currency} including fee)`);
        }
        
        // Check for pending withdrawals within transaction
        const pendingWithdrawal = userSnapshot.data().pendingWithdrawalReference;
        if (pendingWithdrawal && pendingWithdrawal !== reference) {
          throw new Error('A withdrawal is already in progress. Please wait for it to complete.');
        }
        
        const calculatedNewBalance = currentBalance - usdAmountToDebit;
        
        // Atomically debit balance (USD) and set pending withdrawal reference
        transaction.update(userRef, {
          balance: calculatedNewBalance,
          pendingWithdrawalReference: reference,
          lastBalanceUpdate: serverTimestamp(),
        });
        
        return calculatedNewBalance;
      });
    } catch (txError) {
      const message = txError instanceof Error ? txError.message : 'Balance debit failed';
      
      // Check if this is a balance-related error
      if (message.includes('Insufficient balance') || message.includes('already in progress')) {
        const errorType = message.includes('Insufficient') ? ErrorType.VALIDATION : ErrorType.VALIDATION;
        const response = createErrorResponse(
          errorType,
          message,
          { userId, usdAmountToDebit },
          res.getHeader('X-Request-ID') as string
        );
        return res.status(response.statusCode).json({
          ok: false,
          error: {
            code: message.includes('Insufficient') ? 'insufficient_balance' : 'withdrawal_in_progress',
            message,
          },
        });
      }
      
      throw txError;
    }
    
    // Create pending transaction record with USD conversion details
    const transaction = await createPaystackTransaction({
      userId,
      type: 'withdrawal',
      amountSmallestUnit: -amountSmallestUnit, // Negative for withdrawals (in local currency)
      currency: currency.toUpperCase(),
      status: 'pending',
      provider: 'paystack',
      providerReference: reference,
      description: reason || 'Withdrawal to bank account',
      metadata: {
        recipientCode,
        recipientName: recipient.accountName || recipient.accountNumber,
        recipientBank: recipient.bankName,
        feeSmallestUnit,
        paystackTransferCode: '', // Will be updated after initiation
        // Store currency conversion details for auditing and balance restoration
        localAmount: localAmountDisplay,
        localTotalWithFee: localTotalWithFeeDisplay,
        localCurrency: currency.toUpperCase(),
        exchangeRate,
        usdAmountDebited: usdAmountToDebit, // USD amount debited from balance
      },
    });
    
    try {
      // Initiate transfer with Paystack
      const result = await initiateTransfer({
        source: 'balance',
        amount: amountSmallestUnit,
        recipient: recipientCode,
        reason: reason || 'Withdrawal',
        reference,
        currency: currency.toUpperCase(),
        userId,
      });
      
      // Update transaction with transfer code
      // Use updateDoc with dot notation for nested field updates (not setDoc which treats it as literal field name)
      const transactionRef = doc(db, 'transactions', transaction.id);
      await updateDoc(transactionRef, {
        'metadata.paystackTransferCode': result.transferCode,
        status: result.status === 'success' ? 'completed' : 'processing',
        updatedAt: new Date().toISOString(),
      });
      
      // Clear pending withdrawal reference since transfer was initiated successfully
      await updateDoc(userRef, {
        pendingWithdrawalReference: null,
      });
      
      logger.info('Transfer initiated successfully', {
        component: 'paystack',
        operation: 'transfer-initiate',
        userId,
        reference,
        transferCode: result.transferCode,
        transactionId: transaction.id,
        status: result.status,
        amountSmallestUnit,
        currency: currencyUpper,
        feeSmallestUnit,
      });
      
      const response = createSuccessResponse({
        ok: true,
        data: {
          reference,
          transferCode: result.transferCode,
          transactionId: transaction.id,
          status: result.status,
          amountSmallestUnit,
          currency: currencyUpper,
          amountFormatted: formatPaystackAmount(amountSmallestUnit, currencyUpper),
          feeSmallestUnit,
          feeFormatted: formatPaystackAmount(feeSmallestUnit, currencyUpper),
          recipient: {
            name: recipient.accountName || recipient.accountNumber,
            accountNumber: recipient.accountNumber,
            bankName: recipient.bankName,
          },
        },
      }, 200, logger);
      
      return res.status(response.statusCode).json(response.body);
      
    } catch (initiateError) {
      // Restore user balance on failure (add back the USD amount that was debited)
      // Also clear the pending withdrawal reference
      logger.error('Transfer initiation failed, restoring balance', initiateError instanceof Error ? initiateError : new Error('Unknown error'), {
        component: 'paystack',
        operation: 'transfer-initiate',
        userId,
        reference,
        originalBalance: newBalance,
        amountToRestore: usdAmountToDebit,
      });
      
      await updateDoc(userRef, {
        balance: newBalance + usdAmountToDebit, // Restore the original USD balance
        pendingWithdrawalReference: null,
        lastBalanceUpdate: serverTimestamp(),
      });
      
      logger.info('Balance restored after transfer failure', {
        component: 'paystack',
        operation: 'transfer-initiate',
        userId,
        restoredBalance: newBalance + usdAmountToDebit,
      });
      
      // Update transaction to failed
      const transactionRef = doc(db, 'transactions', transaction.id);
      await updateDoc(transactionRef, {
        status: 'failed',
        errorMessage: initiateError instanceof Error ? initiateError.message : 'Transfer initiation failed',
        updatedAt: new Date().toISOString(),
      });
      
      // Re-throw to be handled by withErrorHandling
      throw initiateError;
    }
  });
}

