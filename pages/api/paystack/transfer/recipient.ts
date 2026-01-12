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
import { captureError } from '../../../../lib/errorTracking';
import { logger } from '../../../../lib/structuredLogger';
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
  try {
    switch (req.method) {
      case 'POST':
        return await handleCreate(req, res);
      case 'GET':
        return await handleList(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        res.setHeader('Allow', 'POST, GET, DELETE');
        return res.status(405).json({
          ok: false,
          error: { code: 'method_not_allowed', message: 'Method not allowed' },
        });
    }
  } catch (error) {
    logger.error('Recipient operation error', error as Error, {
      component: 'paystack',
      operation: 'recipient',
      method: req.method,
      query: req.query,
      body: req.body,
    });
    await captureError(error as Error, {
      tags: { component: 'paystack', operation: 'recipient' },
      extra: { method: req.method, query: req.query, body: req.body },
    });
    
    const message = error instanceof Error ? error.message : 'Operation failed';
    
    return res.status(500).json({
      ok: false,
      error: { code: 'operation_failed', message },
    });
  }
}

// ============================================================================
// CREATE RECIPIENT
// ============================================================================

async function handleCreate(
  req: NextApiRequest,
  res: NextApiResponse<RecipientResponse>
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
  if (!userId) {
    return res.status(400).json({
      ok: false,
      error: { code: 'missing_user_id', message: 'User ID is required' },
    });
  }
  
  if (!type || !name || !accountNumber) {
    return res.status(400).json({
      ok: false,
      error: { code: 'missing_fields', message: 'Type, name, and account number are required' },
    });
  }
  
  if (!country || !['NG', 'GH', 'ZA', 'KE'].includes(country)) {
    return res.status(400).json({
      ok: false,
      error: { code: 'invalid_country', message: 'Valid country (NG, GH, ZA, KE) is required' },
    });
  }
  
  // For bank transfers, bank code is required
  if ((type === 'nuban' || type === 'basa') && !bankCode) {
    return res.status(400).json({
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
      return res.status(400).json({
        ok: false,
        error: { code: 'invalid_type', message: 'Invalid recipient type' },
      });
  }
  
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
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      defaultPaystackRecipient: result.recipientCode,
    }, { merge: true });
  }
  
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
  res: NextApiResponse<RecipientResponse>
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
      return res.status(400).json({
        ok: false,
        error: { code: 'invalid_country', message: 'Invalid country for bank list' },
      });
    }
    
    const banks = await listBanks(country);
    
    return res.status(200).json({
      ok: true,
      data: {
        banks: banks.map(b => ({ code: b.code, name: b.name })),
      },
    });
  }
  
  // If resolving account number
  if (resolve && accountNumber && bankCode) {
    const resolved = await resolveAccountNumber(accountNumber, bankCode);
    
    return res.status(200).json({
      ok: true,
      data: {
        resolvedName: resolved.accountName,
      },
    });
  }
  
  // List user's recipients
  if (!userId) {
    return res.status(400).json({
      ok: false,
      error: { code: 'missing_user_id', message: 'User ID is required' },
    });
  }
  
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    return res.status(404).json({
      ok: false,
      error: { code: 'user_not_found', message: 'User not found' },
    });
  }
  
  const recipients = (userDoc.data().paystackTransferRecipients || []) as PaystackTransferRecipient[];
  
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
  res: NextApiResponse<RecipientResponse>
) {
  const { userId, recipientCode } = req.body as {
    userId: string;
    recipientCode: string;
  };
  
  if (!userId || !recipientCode) {
    return res.status(400).json({
      ok: false,
      error: { code: 'missing_fields', message: 'User ID and recipient code are required' },
    });
  }
  
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    return res.status(404).json({
      ok: false,
      error: { code: 'user_not_found', message: 'User not found' },
    });
  }
  
  const recipients = (userDoc.data().paystackTransferRecipients || []) as PaystackTransferRecipient[];
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
  } else if (removedDefault) {
    updates.defaultPaystackRecipient = null;
  }
  
  await setDoc(userRef, updates, { merge: true });
  
  return res.status(200).json({
    ok: true,
    data: { recipients: updatedRecipients },
  });
}

