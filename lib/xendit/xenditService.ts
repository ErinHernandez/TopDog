/**
 * Xendit Service Layer
 * 
 * Centralized Xendit operations with error handling and logging.
 * Handles Virtual Accounts, E-Wallets, Disbursements, and Webhooks.
 * 
 * @module lib/xendit/xenditService
 */

import crypto from 'crypto';
import { getDb } from '../firebase-utils';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { captureError } from '../errorTracking';
import { serverLogger } from '../logger/serverLogger';
import type {
  XenditVirtualAccount,
  XenditEWalletCharge,
  XenditDisbursement,
  CreateVirtualAccountRequest,
  CreateEWalletChargeRequest,
  CreateDisbursementRequest,
  VirtualAccountPaymentCallback,
  DisbursementCallback,
  XenditBankCode,
  XenditEWalletChannel,
  XenditSavedDisbursementAccount,
  UserXenditData,
} from './xenditTypes';
import { validateDepositAmount } from './currencyConfig';
import type { TransactionStatus, UnifiedTransaction } from '../payments/types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY;
const XENDIT_PUBLIC_KEY = process.env.XENDIT_PUBLIC_KEY;
const XENDIT_WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN;

const XENDIT_BASE_URL = 'https://api.xendit.co';

if (!XENDIT_SECRET_KEY) {
  serverLogger.warn('XENDIT_SECRET_KEY not configured');
}

// ============================================================================
// HTTP CLIENT
// ============================================================================

/**
 * Make authenticated request to Xendit API
 */
async function xenditRequest<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
  } = {}
): Promise<T> {
  const { method = 'GET', body } = options;
  
  if (!XENDIT_SECRET_KEY) {
    throw new Error('XENDIT_SECRET_KEY is not configured');
  }
  
  // Xendit uses Basic auth with key as username and empty password
  const auth = Buffer.from(`${XENDIT_SECRET_KEY}:`).toString('base64');
  
  const response = await fetch(`${XENDIT_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    const error = new Error(data.message || data.error_code || 'Xendit API error');
    await captureError(error, {
      tags: { component: 'xendit', operation: endpoint },
      extra: { status: response.status, response: data },
    });
    throw error;
  }
  
  return data as T;
}

// ============================================================================
// VIRTUAL ACCOUNT OPERATIONS
// ============================================================================

/**
 * Create a Virtual Account for bank transfer payment
 */
export async function createVirtualAccount(
  request: CreateVirtualAccountRequest & { userId: string }
): Promise<{
  virtualAccountId: string;
  accountNumber: string;
  bankCode: string;
  expirationDate?: string;
}> {
  const { userId, ...vaRequest } = request;
  
  // Validate amount if provided
  if (vaRequest.expected_amount) {
    const validation = validateDepositAmount(vaRequest.expected_amount);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
  }
  
  const response = await xenditRequest<XenditVirtualAccount>('/callback_virtual_accounts', {
    method: 'POST',
    body: {
      ...vaRequest,
      // Ensure external_id contains user ID for tracking
      external_id: `${userId}_${vaRequest.external_id}`,
    },
  });
  
  return {
    virtualAccountId: response.id,
    accountNumber: response.account_number,
    bankCode: response.bank_code,
    expirationDate: response.expiration_date,
  };
}

/**
 * Get Virtual Account by ID
 */
export async function getVirtualAccount(vaId: string): Promise<XenditVirtualAccount> {
  return xenditRequest<XenditVirtualAccount>(`/callback_virtual_accounts/${vaId}`);
}

// ============================================================================
// E-WALLET OPERATIONS
// ============================================================================

/**
 * Create an e-wallet charge
 */
export async function createEWalletCharge(
  request: CreateEWalletChargeRequest & { userId: string }
): Promise<{
  chargeId: string;
  status: string;
  checkoutUrl?: string;
  mobileDeeplink?: string;
  qrString?: string;
}> {
  const { userId, ...chargeRequest } = request;
  
  // Validate amount
  const validation = validateDepositAmount(chargeRequest.amount);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  
  // Add user ID to metadata
  const metadata = {
    ...chargeRequest.metadata,
    firebaseUserId: userId,
  };
  
  const response = await xenditRequest<XenditEWalletCharge>('/ewallets/charges', {
    method: 'POST',
    body: {
      ...chargeRequest,
      metadata,
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/xendit/webhook`,
    },
  });
  
  return {
    chargeId: response.id,
    status: response.status,
    checkoutUrl: response.actions?.mobile_web_checkout_url || response.actions?.desktop_web_checkout_url,
    mobileDeeplink: response.actions?.mobile_deeplink_checkout_url,
    qrString: response.actions?.qr_checkout_string,
  };
}

/**
 * Get e-wallet charge by ID
 */
export async function getEWalletCharge(chargeId: string): Promise<XenditEWalletCharge> {
  return xenditRequest<XenditEWalletCharge>(`/ewallets/charges/${chargeId}`);
}

// ============================================================================
// DISBURSEMENT OPERATIONS
// ============================================================================

/**
 * Create a disbursement (withdrawal)
 */
export async function createDisbursement(
  request: CreateDisbursementRequest & { userId: string }
): Promise<{
  disbursementId: string;
  status: string;
}> {
  const { userId, ...disbursementRequest } = request;
  
  // Verify user has sufficient balance
  const db = getDb();
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  
  const userData = userDoc.data();
  const currentBalance = (userData.balance || 0) as number;
  
  if (currentBalance < disbursementRequest.amount) {
    throw new Error('Insufficient balance');
  }
  
  const response = await xenditRequest<XenditDisbursement>('/disbursements', {
    method: 'POST',
    body: {
      ...disbursementRequest,
      // Ensure external_id contains user ID for tracking
      external_id: `${userId}_${disbursementRequest.external_id}`,
    },
  });
  
  return {
    disbursementId: response.id,
    status: response.status,
  };
}

/**
 * Get disbursement by ID
 */
export async function getDisbursement(disbursementId: string): Promise<XenditDisbursement> {
  return xenditRequest<XenditDisbursement>(`/disbursements/${disbursementId}`);
}

// ============================================================================
// SAVED ACCOUNT OPERATIONS
// ============================================================================

/**
 * Save a disbursement account for future withdrawals
 */
export async function saveDisbursementAccount(
  userId: string,
  account: Omit<XenditSavedDisbursementAccount, 'id' | 'createdAt'>
): Promise<XenditSavedDisbursementAccount> {
  const db = getDb();
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  const existingAccounts: XenditSavedDisbursementAccount[] = 
    (userDoc.exists() ? (userDoc.data() as UserXenditData)?.xenditDisbursementAccounts : []) || [];
  
  // Mask account number for display
  const accountNumberMasked = account.accountNumber.slice(-4).padStart(
    account.accountNumber.length,
    '*'
  );
  
  const newAccount: XenditSavedDisbursementAccount = {
    id: generateReference('XA'),
    ...account,
    accountNumberMasked,
    isDefault: existingAccounts.length === 0,
    createdAt: new Date().toISOString(),
  };
  
  // If this is set as default, unset others
  const updatedAccounts = account.isDefault
    ? existingAccounts.map(a => ({ ...a, isDefault: false }))
    : existingAccounts;
  
  await setDoc(userRef, {
    xenditDisbursementAccounts: [...updatedAccounts, newAccount],
  }, { merge: true });
  
  return newAccount;
}

/**
 * Get saved disbursement accounts for a user
 */
export async function getSavedDisbursementAccounts(userId: string): Promise<XenditSavedDisbursementAccount[]> {
  const db = getDb();
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    return [];
  }
  
  return (userDoc.data() as UserXenditData)?.xenditDisbursementAccounts || [];
}

/**
 * Delete a saved disbursement account
 */
export async function deleteDisbursementAccount(userId: string, accountId: string): Promise<void> {
  const db = getDb();
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  
  const existingAccounts: XenditSavedDisbursementAccount[] = 
    (userDoc.data() as UserXenditData)?.xenditDisbursementAccounts || [];
  
  const updatedAccounts = existingAccounts.filter(a => a.id !== accountId);
  
  await setDoc(userRef, {
    xenditDisbursementAccounts: updatedAccounts,
  }, { merge: true });
}

// ============================================================================
// WEBHOOK HANDLING
// ============================================================================

/**
 * Verify Xendit webhook token using timing-safe comparison
 *
 * SECURITY: Uses crypto.timingSafeEqual to prevent timing attacks.
 * A timing attack could allow an attacker to guess the token byte-by-byte
 * by measuring response times when comparing tokens.
 */
export function verifyWebhookToken(token: string): boolean {
  if (!XENDIT_WEBHOOK_TOKEN) {
    serverLogger.error('XENDIT_WEBHOOK_TOKEN not configured', new Error('Missing webhook token'));
    return false;
  }

  // Validate token format
  if (!token || typeof token !== 'string') {
    return false;
  }

  // Use timing-safe comparison to prevent timing attacks
  const tokenBuffer = Buffer.from(token, 'utf8');
  const expectedBuffer = Buffer.from(XENDIT_WEBHOOK_TOKEN, 'utf8');

  // If lengths differ, token is invalid (but still do constant-time check)
  if (tokenBuffer.length !== expectedBuffer.length) {
    // Perform a dummy comparison to maintain constant time
    crypto.timingSafeEqual(expectedBuffer, expectedBuffer);
    return false;
  }

  return crypto.timingSafeEqual(tokenBuffer, expectedBuffer);
}

/**
 * Process Virtual Account payment callback
 */
export async function handleVAPayment(
  data: VirtualAccountPaymentCallback
): Promise<{ success: boolean; actions: string[] }> {
  const actions: string[] = [];
  
  // Extract user ID from external_id
  const [userId] = data.external_id.split('_');
  if (!userId) {
    return { success: false, actions: ['missing_user_id'] };
  }
  
  // Check if already processed
  const existingTx = await findTransactionByVAPaymentId(data.payment_id);
  if (existingTx?.status === 'completed') {
    return { success: true, actions: ['already_processed'] };
  }
  
  const amount = data.amount;
  
  if (existingTx) {
    await updateTransactionStatus(existingTx.id, 'completed');
    actions.push('transaction_updated');
  } else {
    await createXenditTransaction({
      userId,
      type: 'deposit',
      amountSmallestUnit: amount, // IDR has no decimals
      currency: 'IDR',
      status: 'completed',
      provider: 'xendit',
      providerReference: data.payment_id,
      paymentMethodType: `va_${data.bank_code.toLowerCase()}`,
      description: `Deposit via ${data.bank_code} Virtual Account`,
      metadata: {
        xenditPaymentId: data.payment_id,
        xenditVAId: data.callback_virtual_account_id,
        bankCode: data.bank_code,
        accountNumber: data.account_number,
      },
    });
    actions.push('transaction_created');
  }
  
  // Credit user balance
  await updateUserBalance(userId, amount, 'add');
  actions.push('balance_credited');
  
  return { success: true, actions };
}

/**
 * Process e-wallet charge callback
 */
export async function handleEWalletCapture(
  data: XenditEWalletCharge
): Promise<{ success: boolean; actions: string[] }> {
  const actions: string[] = [];
  
  const userId = data.metadata?.firebaseUserId;
  if (!userId) {
    return { success: false, actions: ['missing_user_id'] };
  }
  
  // Only process successful charges
  if (data.status !== 'SUCCEEDED') {
    return { success: true, actions: ['not_succeeded', `status_${data.status}`] };
  }
  
  // Check if already processed
  const existingTx = await findTransactionByEWalletChargeId(data.id);
  if (existingTx?.status === 'completed') {
    return { success: true, actions: ['already_processed'] };
  }
  
  const amount = data.capture_amount || data.charge_amount;
  
  if (existingTx) {
    await updateTransactionStatus(existingTx.id, 'completed');
    actions.push('transaction_updated');
  } else {
    await createXenditTransaction({
      userId,
      type: 'deposit',
      amountSmallestUnit: amount,
      currency: 'IDR',
      status: 'completed',
      provider: 'xendit',
      providerReference: data.id,
      paymentMethodType: data.channel_code.toLowerCase(),
      description: `Deposit via ${data.channel_code.replace('ID_', '')}`,
      metadata: {
        xenditChargeId: data.id,
        channelCode: data.channel_code,
      },
    });
    actions.push('transaction_created');
  }
  
  // Credit user balance
  await updateUserBalance(userId, amount, 'add');
  actions.push('balance_credited');
  
  return { success: true, actions };
}

/**
 * Process disbursement callback
 * 
 * Handles disbursement status updates from Xendit webhooks:
 * - COMPLETED: Mark transaction as completed
 * - FAILED: Mark transaction as failed and restore balance
 * - PENDING: Update transaction to processing status
 * 
 * Includes transaction recovery for missing transactions.
 */
export async function handleDisbursementCallback(
  data: DisbursementCallback
): Promise<{ success: boolean; actions: string[] }> {
  const actions: string[] = [];
  
  // Extract user ID from external_id
  // Format: userId_reference
  const [userId] = data.external_id.split('_');
  if (!userId) {
    await captureError(
      new Error('Disbursement callback missing userId in external_id'),
      {
        tags: { component: 'xendit', operation: 'handleDisbursementCallback' },
        extra: {
          disbursementId: data.id,
          externalId: data.external_id,
          status: data.status,
        },
      }
    );
    return { success: false, actions: ['missing_user_id'] };
  }
  
  // Find existing transaction
  const existingTx = await findTransactionByDisbursementId(data.id);
  
  if (data.status === 'COMPLETED') {
    if (existingTx) {
      try {
        await updateTransactionStatus(existingTx.id, 'completed');
        actions.push('disbursement_completed');
      } catch (updateError) {
        await captureError(
          updateError instanceof Error ? updateError : new Error('Unknown error'),
          {
            tags: { component: 'xendit', operation: 'handleDisbursementCallback', severity: 'warning' },
            extra: {
              disbursementId: data.id,
              userId,
              transactionId: existingTx.id,
              status: 'COMPLETED',
              updateError: updateError instanceof Error ? updateError.message : 'Unknown error',
            },
          }
        );
        actions.push('disbursement_completed_with_update_error');
      }
    } else {
      // Transaction missing - log for investigation
      await captureError(
        new Error('Disbursement completed but transaction not found'),
        {
          tags: { component: 'xendit', operation: 'handleDisbursementCallback', severity: 'warning' },
          extra: {
            disbursementId: data.id,
            userId,
            status: 'COMPLETED',
            amount: data.amount,
            externalId: data.external_id,
          },
        }
      );
      actions.push('transaction_missing');
    }
  } else if (data.status === 'FAILED') {
    if (existingTx) {
      try {
        await updateTransactionStatus(existingTx.id, 'failed', data.failure_code);
        actions.push('disbursement_failed');
        
        // Restore user balance only if transaction was pending
        // (balance was already debited when disbursement was created)
        if (existingTx.status === 'pending') {
          try {
            await updateUserBalance(userId, data.amount, 'add');
            actions.push('balance_restored');
          } catch (balanceError) {
            await captureError(
              balanceError instanceof Error ? balanceError : new Error('Unknown error'),
              {
                tags: { component: 'xendit', operation: 'handleDisbursementCallback', severity: 'critical' },
                extra: {
                  disbursementId: data.id,
                  userId,
                  transactionId: existingTx.id,
                  amount: data.amount,
                  failureCode: data.failure_code,
                  balanceError: balanceError instanceof Error ? balanceError.message : 'Unknown error',
                },
              }
            );
            actions.push('disbursement_failed_balance_restore_error');
          }
        } else {
          // Transaction already failed or completed - balance may have already been restored
          actions.push('disbursement_failed_no_balance_restore');
        }
      } catch (updateError) {
        await captureError(
          updateError instanceof Error ? updateError : new Error('Unknown error'),
          {
            tags: { component: 'xendit', operation: 'handleDisbursementCallback', severity: 'warning' },
            extra: {
              disbursementId: data.id,
              userId,
              transactionId: existingTx.id,
              status: 'FAILED',
              updateError: updateError instanceof Error ? updateError.message : 'Unknown error',
            },
          }
        );
        actions.push('disbursement_failed_with_update_error');
      }
    } else {
      // Transaction missing - log for investigation
      // Cannot restore balance without transaction record
      await captureError(
        new Error('Disbursement failed but transaction not found - cannot restore balance'),
        {
          tags: { component: 'xendit', operation: 'handleDisbursementCallback', severity: 'critical' },
          extra: {
            disbursementId: data.id,
            userId,
            status: 'FAILED',
            amount: data.amount,
            failureCode: data.failure_code,
            externalId: data.external_id,
          },
        }
      );
      actions.push('transaction_missing_critical');
    }
  } else if (data.status === 'PENDING') {
    // Update status but don't change balance
    if (existingTx) {
      try {
        await updateTransactionStatus(existingTx.id, 'processing');
        actions.push('disbursement_pending');
      } catch (updateError) {
        await captureError(
          updateError instanceof Error ? updateError : new Error('Unknown error'),
          {
            tags: { component: 'xendit', operation: 'handleDisbursementCallback', severity: 'warning' },
            extra: {
              disbursementId: data.id,
              userId,
              transactionId: existingTx.id,
              status: 'PENDING',
              updateError: updateError instanceof Error ? updateError.message : 'Unknown error',
            },
          }
        );
        actions.push('disbursement_pending_with_update_error');
      }
    } else {
      // Transaction missing for PENDING status - less critical but log it
      await captureError(
        new Error('Disbursement pending but transaction not found'),
        {
          tags: { component: 'xendit', operation: 'handleDisbursementCallback', severity: 'warning' },
          extra: {
            disbursementId: data.id,
            userId,
            status: 'PENDING',
            externalId: data.external_id,
          },
        }
      );
      actions.push('transaction_missing_pending');
    }
  } else {
    // Unknown status - log for investigation
    await captureError(
      new Error(`Unknown disbursement status: ${data.status}`),
      {
        tags: { component: 'xendit', operation: 'handleDisbursementCallback', severity: 'warning' },
        extra: {
          disbursementId: data.id,
          userId,
          status: data.status,
          externalId: data.external_id,
        },
      }
    );
    actions.push('unknown_status');
  }
  
  return { success: true, actions };
}

// ============================================================================
// TRANSACTION RECORD OPERATIONS
// ============================================================================

/**
 * Create a Xendit transaction record
 */
export async function createXenditTransaction(
  input: Omit<UnifiedTransaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<UnifiedTransaction> {
  const now = new Date().toISOString();
  
  const transaction: Omit<UnifiedTransaction, 'id'> = {
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  
  const db = getDb();
  const docRef = await addDoc(collection(db, 'transactions'), transaction);
  
  return {
    id: docRef.id,
    ...transaction,
  };
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(
  transactionId: string,
  status: TransactionStatus,
  errorMessage?: string
): Promise<void> {
  const db = getDb();
  const transactionRef = doc(db, 'transactions', transactionId);
  
  const updates: Partial<UnifiedTransaction> = {
    status,
    updatedAt: new Date().toISOString(),
  };
  
  if (errorMessage) {
    updates.errorMessage = errorMessage;
  }
  
  await updateDoc(transactionRef, updates);
}

/**
 * Find transaction by VA payment ID
 */
export async function findTransactionByVAPaymentId(
  paymentId: string
): Promise<UnifiedTransaction | null> {
  const db = getDb();
  const q = query(
    collection(db, 'transactions'),
    where('providerReference', '==', paymentId),
    where('provider', '==', 'xendit')
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  const docData = snapshot.docs[0];
  return {
    id: docData.id,
    ...docData.data(),
  } as UnifiedTransaction;
}

/**
 * Find transaction by e-wallet charge ID
 */
export async function findTransactionByEWalletChargeId(
  chargeId: string
): Promise<UnifiedTransaction | null> {
  const db = getDb();
  const q = query(
    collection(db, 'transactions'),
    where('metadata.xenditChargeId', '==', chargeId),
    where('provider', '==', 'xendit')
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  const docData = snapshot.docs[0];
  return {
    id: docData.id,
    ...docData.data(),
  } as UnifiedTransaction;
}

/**
 * Find transaction by disbursement ID
 */
export async function findTransactionByDisbursementId(
  disbursementId: string
): Promise<UnifiedTransaction | null> {
  const db = getDb();
  const q = query(
    collection(db, 'transactions'),
    where('metadata.xenditDisbursementId', '==', disbursementId),
    where('provider', '==', 'xendit')
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  const docData = snapshot.docs[0];
  return {
    id: docData.id,
    ...docData.data(),
  } as UnifiedTransaction;
}

// ============================================================================
// BALANCE OPERATIONS
// ============================================================================

/**
 * Update user balance
 */
async function updateUserBalance(
  userId: string,
  amount: number,
  operation: 'add' | 'subtract'
): Promise<number> {
  const db = getDb();
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  
  const currentBalance = (userDoc.data().balance || 0) as number;
  
  const newBalance = operation === 'add'
    ? currentBalance + amount
    : currentBalance - amount;
  
  if (newBalance < 0) {
    throw new Error('Insufficient balance');
  }
  
  await setDoc(userRef, {
    balance: newBalance,
    lastBalanceUpdate: serverTimestamp(),
  }, { merge: true });
  
  return newBalance;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map Xendit status to unified status
 */
export function mapXenditStatus(status: string): TransactionStatus {
  switch (status.toUpperCase()) {
    case 'COMPLETED':
    case 'SUCCEEDED':
    case 'ACTIVE':
      return 'completed';
    case 'FAILED':
    case 'VOIDED':
      return 'failed';
    case 'PENDING':
    default:
      return 'pending';
  }
}

/**
 * Generate unique reference
 */
export function generateReference(prefix: string = 'XN'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`.toUpperCase();
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  XENDIT_PUBLIC_KEY,
};


