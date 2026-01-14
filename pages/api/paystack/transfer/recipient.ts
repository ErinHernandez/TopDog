/**
 * Paystack Transfer Recipient API
 * 
 * Creates or manages transfer recipients for withdrawals.
 * Supports Nigerian bank accounts (NUBAN), Ghana mobile money,
 * South African bank accounts (BASA), and Kenya M-Pesa.
 * 
 * POST /api/paystack/transfer/recipient - Create new recipient
 * GET /api/paystack/transfer/recipient - List user's recipients
 * DELETE /api/paystack/transfer/recipient - Remove recipient
 * 
 * @module pages/api/paystack/transfer/recipient
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  createTransferRecipient,
  listBanks,
  resolveAccountNumber,
} from '../../../../lib/paystack';
import { getCurrencyForPaystackCountry } from '../../../../lib/paystack/currencyConfig';
import type {
  TransferRecipientType,
  PaystackTransferRecipient,
} from '../../../../lib/paystack/paystackTypes';
import { 
  withErrorHandling,
  validateMethod,
  validateBody,
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
  type ApiLogger,
} from '../../../../lib/apiErrorHandler';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';

// ============================================================================
// TYPES
// ============================================================================

interface CreateRecipientRequest {
  /** Firebase user ID */
  userId: string;
  /** Recipient type */
  type: 'nuban' | 'mobile_money' | 'basa';
  /** Recipient name */
  name: string;
  /** Account number or phone number */
  accountNumber: string;
  /** Bank code (for bank transfers) */
  bankCode?: string;
  /** Country code */
  country: 'NG' | 'GH' | 'ZA' | 'KE';
  /** Make this the default recipient */
  setAsDefault?: boolean;
}

interface RecipientResponse {
  ok: boolean;
  data?: {
    recipients?: PaystackTransferRecipient[];
    recipient?: PaystackTransferRecipient;
    banks?: Array<{ code: string; name: string }>;
    resolvedName?: string;
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
  res: NextApiResponse<RecipientResponse>
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['POST', 'GET', 'DELETE'], logger);
    
    logger.info('Paystack transfer recipient request', {
      component: 'paystack',
      operation: 'recipient',
      method: req.method,
    });
    
    switch (req.method) {
      case 'POST':
        return await handleCreate(req, res, logger);
      case 'GET':
        return await handleList(req, res, logger);
      case 'DELETE':
        return await handleDelete(req, res, logger);
      default:
        // This should never happen due to validateMethod, but TypeScript needs it
        const response = createErrorResponse(
          ErrorType.METHOD_NOT_ALLOWED,
          'Method not allowed',
          { allowedMethods: ['POST', 'GET', 'DELETE'] },
          res.getHeader('X-Request-ID') as string
        );
        res.setHeader('Allow', 'POST, GET, DELETE');
        return res.status(response.statusCode).json({
          ok: false,
          error: { code: 'method_not_allowed', message: 'Method not allowed' },
        });
    }
  });
}

// ============================================================================
// CREATE RECIPIENT
// ============================================================================

async function handleCreate(
  req: NextApiRequest,
  res: NextApiResponse<RecipientResponse>,
  logger: ApiLogger
) {
  const {
    userId,
    type,
    name,
    accountNumber,
    bankCode,
    country,
    setAsDefault,
  } = req.body as CreateRecipientRequest;
  
  // Validation
  validateBody(req, ['userId', 'type', 'name', 'accountNumber', 'country'], logger);
  
  if (!country || !['NG', 'GH', 'ZA', 'KE'].includes(country)) {
    const response = createErrorResponse(
      ErrorType.VALIDATION,
      'Valid country (NG, GH, ZA, KE) is required',
      { country },
      null
    );
    return res.status(response.statusCode).json({
      ok: false,
      error: { code: 'invalid_country', message: 'Valid country (NG, GH, ZA, KE) is required' },
    });
  }
  
  // For bank transfers, bank code is required
  if ((type === 'nuban' || type === 'basa') && !bankCode) {
    const response = createErrorResponse(
      ErrorType.VALIDATION,
      'Bank code is required for bank transfers',
      { type },
      null
    );
    return res.status(response.statusCode).json({
      ok: false,
      error: { code: 'missing_bank_code', message: 'Bank code is required for bank transfers' },
    });
  }
  
  // Get currency for country
  const currency = getCurrencyForPaystackCountry(country);
  
  // Determine recipient type for Paystack
  let paystackType: TransferRecipientType;
  switch (type) {
    case 'nuban':
      paystackType = 'nuban';
      break;
    case 'basa':
      paystackType = 'basa';
      break;
    case 'mobile_money':
      paystackType = 'mobile_money';
      break;
    default:
      const invalidTypeResponse = createErrorResponse(
        ErrorType.VALIDATION,
        'Invalid recipient type',
        { type, allowedTypes: ['nuban', 'basa', 'mobile_money'] },
        null
      );
      return res.status(invalidTypeResponse.statusCode).json({
        ok: false,
        error: { code: 'invalid_type', message: 'Invalid recipient type' },
      });
  }
  
  logger.info('Creating Paystack transfer recipient', {
    component: 'paystack',
    operation: 'create_recipient',
    type: paystackType,
    country,
    userId,
  });
  
  // Create recipient with Paystack
  const result = await createTransferRecipient({
    type: paystackType,
    name,
    account_number: accountNumber,
    bank_code: bankCode,
    currency: currency as 'NGN' | 'GHS' | 'ZAR' | 'KES',
    metadata: { firebaseUserId: userId },
    userId,
  });
  
  // Build recipient object
  const newRecipient: PaystackTransferRecipient = {
    code: result.recipientCode,
    type: paystackType,
    bankCode: result.recipientData.details.bank_code,
    bankName: result.recipientData.details.bank_name,
    accountNumber: result.recipientData.details.account_number,
    accountName: result.recipientData.details.account_name || name,
    currency,
    isDefault: setAsDefault,
    createdAt: new Date().toISOString(),
  };
  
  // If setting as default, update user doc
  if (setAsDefault) {
    if (!db) {
      const response = createErrorResponse(
        ErrorType.CONFIGURATION,
        'Firebase Firestore is not initialized',
        {},
        null
      );
      return res.status(response.statusCode).json({ 
        ok: false,
        error: { code: 'DATABASE_ERROR', message: 'Database not available' }
      });
    }
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      defaultPaystackRecipient: result.recipientCode,
    }, { merge: true });
    
    logger.info('Set recipient as default', {
      component: 'paystack',
      operation: 'set_default_recipient',
      recipientCode: result.recipientCode,
      userId,
    });
  }
  
  logger.info('Transfer recipient created successfully', {
    component: 'paystack',
    operation: 'create_recipient',
    recipientCode: result.recipientCode,
    country,
    userId,
  });
  
  return res.status(200).json({
    ok: true,
    data: { recipient: newRecipient },
  });
}

// ============================================================================
// LIST RECIPIENTS
// ============================================================================

async function handleList(
  req: NextApiRequest,
  res: NextApiResponse<RecipientResponse>,
  logger: ApiLogger
) {
  const userId = req.query.userId as string;
  const listBanksFor = req.query.banks as string; // 'nigeria', 'ghana', 'south_africa', 'kenya'
  const resolve = req.query.resolve === 'true';
  const accountNumber = req.query.accountNumber as string;
  const bankCode = req.query.bankCode as string;
  
  // If requesting bank list
  if (listBanksFor) {
    const countryMap: Record<string, 'nigeria' | 'ghana' | 'south_africa' | 'kenya'> = {
      NG: 'nigeria',
      GH: 'ghana',
      ZA: 'south_africa',
      KE: 'kenya',
      nigeria: 'nigeria',
      ghana: 'ghana',
      south_africa: 'south_africa',
      kenya: 'kenya',
    };
    
    const country = countryMap[listBanksFor];
    if (!country) {
      const response = createErrorResponse(
        ErrorType.VALIDATION,
        'Invalid country for bank list',
        { listBanksFor, allowedCountries: ['NG', 'GH', 'ZA', 'KE', 'nigeria', 'ghana', 'south_africa', 'kenya'] },
        null
      );
      return res.status(response.statusCode).json({
        ok: false,
        error: { code: 'invalid_country', message: 'Invalid country for bank list' },
      });
    }
    
    logger.info('Fetching bank list', {
      component: 'paystack',
      operation: 'list_banks',
      country,
    });
    
    const banks = await listBanks(country);
    
    logger.info('Bank list fetched', {
      component: 'paystack',
      operation: 'list_banks',
      country,
      bankCount: banks.length,
    });
    
    return res.status(200).json({
      ok: true,
      data: {
        banks: banks.map(b => ({ code: b.code, name: b.name })),
      },
    });
  }
  
  // If resolving account number
  if (resolve && accountNumber && bankCode) {
    logger.info('Resolving account number', {
      component: 'paystack',
      operation: 'resolve_account',
      bankCode,
      accountNumber: '***', // Don't log full account number
    });
    
    const resolved = await resolveAccountNumber(accountNumber, bankCode);
    
    logger.info('Account number resolved', {
      component: 'paystack',
      operation: 'resolve_account',
      bankCode,
      resolved: true,
    });
    
    return res.status(200).json({
      ok: true,
      data: {
        resolvedName: resolved.accountName,
      },
    });
  }
  
  // List user's recipients
  if (!userId) {
    const response = createErrorResponse(
      ErrorType.VALIDATION,
      'User ID is required',
      {},
      null
    );
    return res.status(response.statusCode).json({
      ok: false,
      error: { code: 'missing_user_id', message: 'User ID is required' },
    });
  }
  
  logger.info('Fetching user recipients', {
    component: 'paystack',
    operation: 'list_recipients',
    userId,
  });
  
  if (!db) {
    const response = createErrorResponse(
      ErrorType.CONFIGURATION,
      'Firebase Firestore is not initialized',
      {},
      null
    );
    return res.status(response.statusCode).json({ 
      ok: false,
      error: { code: 'DATABASE_ERROR', message: 'Database not available' } 
    });
  }
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    const response = createErrorResponse(
      ErrorType.NOT_FOUND,
      'User not found',
      { userId },
      null
    );
    return res.status(response.statusCode).json({
      ok: false,
      error: { code: 'user_not_found', message: 'User not found' },
    });
  }
  
  const recipients = (userDoc.data().paystackTransferRecipients || []) as PaystackTransferRecipient[];
  
  logger.info('User recipients fetched', {
    component: 'paystack',
    operation: 'list_recipients',
    userId,
    recipientCount: recipients.length,
  });
  
  return res.status(200).json({
    ok: true,
    data: { recipients },
  });
}

// ============================================================================
// DELETE RECIPIENT
// ============================================================================

async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse<RecipientResponse>,
  logger: ApiLogger
) {
  validateBody(req, ['userId', 'recipientCode'], logger);
  
  const { userId, recipientCode } = req.body as {
    userId: string;
    recipientCode: string;
  };
  
  logger.info('Deleting transfer recipient', {
    component: 'paystack',
    operation: 'delete_recipient',
    userId,
    recipientCode,
  });
  
  if (!db) {
    const response = createErrorResponse(
      ErrorType.CONFIGURATION,
      'Firebase Firestore is not initialized',
      {},
      null
    );
    return res.status(response.statusCode).json({ 
      ok: false,
      error: { code: 'DATABASE_ERROR', message: 'Database not available' } 
    });
  }
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    const response = createErrorResponse(
      ErrorType.NOT_FOUND,
      'User not found',
      { userId },
      null
    );
    return res.status(response.statusCode).json({
      ok: false,
      error: { code: 'user_not_found', message: 'User not found' },
    });
  }
  
  const recipients = (userDoc.data().paystackTransferRecipients || []) as PaystackTransferRecipient[];
  const recipientExists = recipients.some(r => r.code === recipientCode);
  
  if (!recipientExists) {
    const response = createErrorResponse(
      ErrorType.NOT_FOUND,
      'Recipient not found',
      { recipientCode, userId },
      null
    );
    return res.status(response.statusCode).json({
      ok: false,
      error: { code: 'recipient_not_found', message: 'Recipient not found' },
    });
  }
  
  const updatedRecipients = recipients.filter(r => r.code !== recipientCode);
  
  // Check if we removed the default
  const defaultRecipient = userDoc.data().defaultPaystackRecipient;
  const removedDefault = defaultRecipient === recipientCode;
  
  const updates: Record<string, unknown> = {
    paystackTransferRecipients: updatedRecipients,
  };
  
  // If we removed the default, set a new one
  if (removedDefault && updatedRecipients.length > 0) {
    updates.defaultPaystackRecipient = updatedRecipients[0].code;
    updatedRecipients[0].isDefault = true;
    
    logger.info('Default recipient updated after deletion', {
      component: 'paystack',
      operation: 'delete_recipient',
      userId,
      newDefault: updatedRecipients[0].code,
    });
  } else if (removedDefault) {
    updates.defaultPaystackRecipient = null;
    
    logger.info('Default recipient removed (no remaining recipients)', {
      component: 'paystack',
      operation: 'delete_recipient',
      userId,
    });
  }
  
  await setDoc(userRef, updates, { merge: true });
  
  logger.info('Transfer recipient deleted successfully', {
    component: 'paystack',
    operation: 'delete_recipient',
    userId,
    recipientCode,
    remainingRecipients: updatedRecipients.length,
  });
  
  return res.status(200).json({
    ok: true,
    data: { recipients: updatedRecipients },
  });
}

