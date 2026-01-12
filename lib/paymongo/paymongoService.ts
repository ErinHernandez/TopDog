/**
 * PayMongo Service Layer
 * 
 * Centralized PayMongo operations with error handling and logging.
 * Handles sources, payments, webhooks, and payouts.
 * 
 * @module lib/paymongo/paymongoService
 */

import crypto from 'crypto';
import { getDb } from '../firebase-utils';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { captureError } from '../errorTracking';
import type {
  PayMongoSource,
  PayMongoPayment,
  PayMongoPayout,
  PayMongoApiResponse,
  PayMongoApiError,
  CreateSourceRequest,
  CreatePaymentRequest,
  CreatePayoutRequest,
  PayMongoWebhookPayload,
  PayMongoSourceAttributes,
  PayMongoPaymentAttributes,
  PayMongoPayoutAttributes,
  PayMongoSavedBankAccount,
  UserPayMongoData,
} from './paymongoTypes';
import { validateDepositAmount, toDisplayAmount } from './currencyConfig';
import type { TransactionStatus, UnifiedTransaction } from '../payments/types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_PUBLIC_KEY = process.env.PAYMONGO_PUBLIC_KEY;
const PAYMONGO_WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET;

const PAYMONGO_BASE_URL = 'https://api.paymongo.com/v1';

if (!PAYMONGO_SECRET_KEY) {
  console.warn('[PayMongoService] PAYMONGO_SECRET_KEY not configured');
}

// ============================================================================
// HTTP CLIENT
// ============================================================================

/**
 * Make authenticated request to PayMongo API
 */
async function paymongoRequest<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    usePublicKey?: boolean;
  } = {}
): Promise<T> {
  const { method = 'GET', body, usePublicKey = false } = options;
  
  const key = usePublicKey ? PAYMONGO_PUBLIC_KEY : PAYMONGO_SECRET_KEY;
  
  if (!key) {
    throw new Error(`PAYMONGO_${usePublicKey ? 'PUBLIC' : 'SECRET'}_KEY is not configured`);
  }
  
  // PayMongo uses Basic auth with key as username and empty password
  const auth = Buffer.from(`${key}:`).toString('base64');
  
  const response = await fetch(`${PAYMONGO_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    const error = new Error((data as PayMongoApiError).errors?.[0]?.detail || 'PayMongo API error');
    await captureError(error, {
      tags: { component: 'paymongo', operation: endpoint },
      extra: { status: response.status, response: data },
    });
    throw error;
  }
  
  return data as T;
}

// ============================================================================
// SOURCE OPERATIONS
// ============================================================================

/**
 * Create a PayMongo source for e-wallet payments (GCash, Maya, GrabPay)
 */
export async function createSource(
  request: CreateSourceRequest & { userId: string }
): Promise<{
  sourceId: string;
  checkoutUrl: string;
  status: string;
}> {
  const { userId, ...sourceRequest } = request;
  
  // Validate amount
  const validation = validateDepositAmount(sourceRequest.amount);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  
  // Add user ID to metadata
  const metadata = {
    ...sourceRequest.metadata,
    firebaseUserId: userId,
  };
  
  const response = await paymongoRequest<PayMongoApiResponse<PayMongoSource>>('/sources', {
    method: 'POST',
    body: {
      data: {
        attributes: {
          ...sourceRequest,
          metadata,
        },
      },
    },
  });
  
  return {
    sourceId: response.data.id,
    checkoutUrl: response.data.attributes.redirect.checkout_url || '',
    status: response.data.attributes.status,
  };
}

/**
 * Get source by ID
 */
export async function getSource(sourceId: string): Promise<PayMongoSource> {
  const response = await paymongoRequest<PayMongoApiResponse<PayMongoSource>>(
    `/sources/${sourceId}`
  );
  return response.data;
}

// ============================================================================
// PAYMENT OPERATIONS
// ============================================================================

/**
 * Create a payment from a chargeable source
 */
export async function createPayment(
  request: CreatePaymentRequest & { userId: string }
): Promise<{
  paymentId: string;
  status: string;
  paidAt?: number;
}> {
  const { userId, ...paymentRequest } = request;
  
  // Add user ID to metadata
  const metadata = {
    ...paymentRequest.metadata,
    firebaseUserId: userId,
  };
  
  const response = await paymongoRequest<PayMongoApiResponse<PayMongoPayment>>('/payments', {
    method: 'POST',
    body: {
      data: {
        attributes: {
          ...paymentRequest,
          metadata,
        },
      },
    },
  });
  
  return {
    paymentId: response.data.id,
    status: response.data.attributes.status,
    paidAt: response.data.attributes.paid_at,
  };
}

/**
 * Get payment by ID
 */
export async function getPayment(paymentId: string): Promise<PayMongoPayment> {
  const response = await paymongoRequest<PayMongoApiResponse<PayMongoPayment>>(
    `/payments/${paymentId}`
  );
  return response.data;
}

/**
 * Verify a payment's status
 */
export async function verifyPayment(
  paymentId: string
): Promise<{
  success: boolean;
  status: TransactionStatus;
  payment?: PayMongoPayment;
  error?: string;
}> {
  try {
    const payment = await getPayment(paymentId);
    const status = mapPayMongoPaymentStatus(payment.attributes.status);
    
    return {
      success: payment.attributes.status === 'paid',
      status,
      payment,
    };
  } catch (error: unknown) {
    return {
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

// ============================================================================
// PAYOUT OPERATIONS
// ============================================================================

/**
 * Create a payout (withdrawal)
 */
export async function createPayout(
  request: CreatePayoutRequest & { userId: string }
): Promise<{
  payoutId: string;
  status: string;
}> {
  const { userId, ...payoutRequest } = request;
  
  // Verify user has sufficient balance
  const db = getDb();
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  
  const userData = userDoc.data();
  const currentBalance = (userData.balance || 0) as number;
  const amountDisplay = toDisplayAmount(payoutRequest.amount);
  
  if (currentBalance < amountDisplay) {
    throw new Error('Insufficient balance');
  }
  
  // Add user ID to metadata
  const metadata = {
    ...payoutRequest.metadata,
    firebaseUserId: userId,
  };
  
  const response = await paymongoRequest<PayMongoApiResponse<PayMongoPayout>>('/payouts', {
    method: 'POST',
    body: {
      data: {
        attributes: {
          amount: payoutRequest.amount,
          currency: payoutRequest.currency,
          bank_account: {
            bank_code: payoutRequest.bank_code,
            account_number: payoutRequest.account_number,
            account_holder_name: payoutRequest.account_holder_name,
          },
          description: payoutRequest.description,
          metadata,
        },
      },
    },
  });
  
  return {
    payoutId: response.data.id,
    status: response.data.attributes.status,
  };
}

/**
 * Get payout by ID
 */
export async function getPayout(payoutId: string): Promise<PayMongoPayout> {
  const response = await paymongoRequest<PayMongoApiResponse<PayMongoPayout>>(
    `/payouts/${payoutId}`
  );
  return response.data;
}

// ============================================================================
// BANK ACCOUNT OPERATIONS
// ============================================================================

/**
 * Save a bank account for future payouts
 */
export async function saveBankAccount(
  userId: string,
  bankAccount: Omit<PayMongoSavedBankAccount, 'id' | 'createdAt'>
): Promise<PayMongoSavedBankAccount> {
  const db = getDb();
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  const existingAccounts: PayMongoSavedBankAccount[] = 
    (userDoc.exists() ? (userDoc.data() as UserPayMongoData)?.paymongoBankAccounts : []) || [];
  
  // Mask account number for display
  const accountNumberMasked = bankAccount.accountNumber.slice(-4).padStart(
    bankAccount.accountNumber.length,
    '*'
  );
  
  const newAccount: PayMongoSavedBankAccount = {
    id: generateReference('BA'),
    ...bankAccount,
    accountNumberMasked,
    isDefault: existingAccounts.length === 0,
    createdAt: new Date().toISOString(),
  };
  
  // If this is set as default, unset others
  const updatedAccounts = bankAccount.isDefault
    ? existingAccounts.map(a => ({ ...a, isDefault: false }))
    : existingAccounts;
  
  await setDoc(userRef, {
    paymongoBankAccounts: [...updatedAccounts, newAccount],
  }, { merge: true });
  
  return newAccount;
}

/**
 * Get saved bank accounts for a user
 */
export async function getSavedBankAccounts(userId: string): Promise<PayMongoSavedBankAccount[]> {
  const db = getDb();
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    return [];
  }
  
  return (userDoc.data() as UserPayMongoData)?.paymongoBankAccounts || [];
}

/**
 * Delete a saved bank account
 */
export async function deleteBankAccount(userId: string, accountId: string): Promise<void> {
  const db = getDb();
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  
  const existingAccounts: PayMongoSavedBankAccount[] = 
    (userDoc.data() as UserPayMongoData)?.paymongoBankAccounts || [];
  
  const updatedAccounts = existingAccounts.filter(a => a.id !== accountId);
  
  await setDoc(userRef, {
    paymongoBankAccounts: updatedAccounts,
  }, { merge: true });
}

// ============================================================================
// WEBHOOK HANDLING
// ============================================================================

/**
 * Verify PayMongo webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): boolean {
  if (!PAYMONGO_WEBHOOK_SECRET) {
    console.error('[PayMongoService] PAYMONGO_WEBHOOK_SECRET not configured');
    return false;
  }
  
  // PayMongo webhook signature format: t=timestamp,te=test_signature,li=live_signature
  const parts = signature.split(',');
  const signatureParts: Record<string, string> = {};
  
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key && value) {
      signatureParts[key] = value;
    }
  }
  
  const timestamp = signatureParts['t'];
  const liveSignature = signatureParts['li'];
  const testSignature = signatureParts['te'];
  
  if (!timestamp) {
    return false;
  }
  
  // Use live signature in production, test signature in development
  const expectedSignature = process.env.NODE_ENV === 'production' ? liveSignature : (liveSignature || testSignature);
  
  if (!expectedSignature) {
    return false;
  }
  
  // Compute signature
  const payloadString = typeof payload === 'string' ? payload : payload.toString();
  const signedPayload = `${timestamp}.${payloadString}`;
  
  const computedSignature = crypto
    .createHmac('sha256', PAYMONGO_WEBHOOK_SECRET)
    .update(signedPayload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(computedSignature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Process source.chargeable webhook
 * This is called when a source (GCash, Maya, etc.) is ready to be charged
 */
export async function handleSourceChargeable(
  data: PayMongoSourceAttributes & { id: string }
): Promise<{ success: boolean; actions: string[] }> {
  const actions: string[] = [];
  
  const userId = data.metadata?.firebaseUserId;
  if (!userId) {
    return { success: false, actions: ['missing_user_id'] };
  }
  
  // Check if already processed
  const existingTx = await findTransactionBySourceId(data.id);
  if (existingTx?.status === 'processing') {
    return { success: true, actions: ['already_processing'] };
  }
  
  // Update transaction status to processing
  if (existingTx) {
    await updateTransactionStatus(existingTx.id, 'processing');
    actions.push('status_updated_to_processing');
  }
  
  return { success: true, actions };
}

/**
 * Process payment.paid webhook
 */
export async function handlePaymentPaid(
  data: PayMongoPaymentAttributes & { id: string }
): Promise<{ success: boolean; actions: string[] }> {
  const actions: string[] = [];
  
  const userId = data.metadata?.firebaseUserId;
  if (!userId) {
    return { success: false, actions: ['missing_user_id'] };
  }
  
  // Check if already processed
  const existingTx = await findTransactionByPaymentId(data.id);
  if (existingTx?.status === 'completed') {
    return { success: true, actions: ['already_processed'] };
  }
  
  const amountDisplay = toDisplayAmount(data.amount);
  
  if (existingTx) {
    await updateTransactionStatus(existingTx.id, 'completed');
    actions.push('transaction_updated');
  } else {
    // Create transaction record
    await createPayMongoTransaction({
      userId,
      type: 'deposit',
      amountSmallestUnit: data.amount,
      currency: data.currency.toUpperCase(),
      status: 'completed',
      provider: 'paymongo',
      providerReference: data.id,
      paymentMethodType: 'ewallet',
      description: 'Deposit via PayMongo',
      metadata: {
        paymongoPaymentId: data.id,
        paidAt: data.paid_at,
      },
    });
    actions.push('transaction_created');
  }
  
  // Credit user balance
  await updateUserBalance(userId, amountDisplay, 'add');
  actions.push('balance_credited');
  
  return { success: true, actions };
}

/**
 * Process payment.failed webhook
 */
export async function handlePaymentFailed(
  data: PayMongoPaymentAttributes & { id: string }
): Promise<{ success: boolean; actions: string[] }> {
  const actions: string[] = [];
  
  const userId = data.metadata?.firebaseUserId;
  if (!userId) {
    return { success: false, actions: ['missing_user_id'] };
  }
  
  const existingTx = await findTransactionByPaymentId(data.id);
  if (existingTx) {
    await updateTransactionStatus(existingTx.id, 'failed', 'Payment failed');
    actions.push('transaction_failed');
  }
  
  return { success: true, actions };
}

/**
 * Process payout.paid webhook
 * 
 * Handles successful payout completion:
 * - Extracts userId from metadata
 * - Updates existing transaction to completed status
 * - Creates transaction record if missing (recovery scenario)
 * - Logs all actions for audit trail
 */
export async function handlePayoutPaid(
  data: PayMongoPayoutAttributes & { id: string }
): Promise<{ success: boolean; actions: string[] }> {
  const actions: string[] = [];
  
  // Extract userId from metadata
  const userId = data.metadata?.firebaseUserId;
  if (!userId) {
    // Log error but don't fail - payout succeeded, just missing userId for tracking
    await captureError(
      new Error('Payout paid webhook missing userId in metadata'),
      {
        tags: { component: 'paymongo', operation: 'handlePayoutPaid' },
        extra: {
          payoutId: data.id,
          metadata: data.metadata,
        },
      }
    );
    return { success: false, actions: ['missing_user_id'] };
  }
  
  // Find existing transaction
  const existingTx = await findTransactionByPayoutId(data.id);
  
  if (!existingTx) {
    // Transaction missing - this is a recovery scenario
    // Create transaction record to maintain audit trail
    await captureError(
      new Error('Payout paid but transaction not found - creating recovery transaction'),
      {
        tags: { component: 'paymongo', operation: 'handlePayoutPaid', severity: 'warning' },
        extra: {
          payoutId: data.id,
          userId,
          amount: data.amount,
          currency: data.currency,
          paidAt: data.paid_at,
        },
      }
    );
    
    try {
      await createPayMongoTransaction({
        userId,
        type: 'withdrawal',
        amountSmallestUnit: data.amount,
        currency: data.currency.toUpperCase(),
        status: 'completed',
        provider: 'paymongo',
        providerReference: data.id,
        description: 'Withdrawal to bank account',
        metadata: {
          paymongoPayoutId: data.id,
          paidAt: data.paid_at,
          recovered: true, // Flag as recovered transaction
          recoveryReason: 'Transaction record missing on payout.paid webhook',
        },
      });
      actions.push('transaction_recovered');
    } catch (recoveryError) {
      // Log critical error if recovery transaction creation fails
      await captureError(
        recoveryError instanceof Error ? recoveryError : new Error('Unknown error'),
        {
          tags: { component: 'paymongo', operation: 'handlePayoutPaid', severity: 'critical' },
          extra: {
            payoutId: data.id,
            userId,
            recoveryError: recoveryError instanceof Error ? recoveryError.message : 'Unknown error',
          },
        }
      );
      return { success: false, actions: ['recovery_transaction_failed'] };
    }
  } else {
    // Update existing transaction to completed
    try {
      await updateTransactionStatus(existingTx.id, 'completed');
      actions.push('payout_completed');
    } catch (updateError) {
      // Log error if status update fails
      await captureError(
        updateError instanceof Error ? updateError : new Error('Unknown error'),
        {
          tags: { component: 'paymongo', operation: 'handlePayoutPaid', severity: 'warning' },
          extra: {
            payoutId: data.id,
            userId,
            transactionId: existingTx.id,
            updateError: updateError instanceof Error ? updateError.message : 'Unknown error',
          },
        }
      );
      // Don't fail - payout succeeded, just couldn't update transaction
      actions.push('payout_completed_with_update_error');
    }
  }
  
  // Note: Balance is not credited here because it was already debited
  // when the payout was created. The payout.paid event just confirms
  // the payout was successfully processed by PayMongo.
  
  return { success: true, actions };
}

/**
 * Process payout.failed webhook
 */
export async function handlePayoutFailed(
  data: PayMongoPayoutAttributes & { id: string }
): Promise<{ success: boolean; actions: string[] }> {
  const actions: string[] = [];
  
  const userId = data.metadata?.firebaseUserId;
  if (!userId) {
    return { success: false, actions: ['missing_user_id'] };
  }
  
  const existingTx = await findTransactionByPayoutId(data.id);
  if (existingTx) {
    await updateTransactionStatus(existingTx.id, 'failed', 'Payout failed');
    actions.push('payout_failed');
    
    // Restore user balance
    const amountDisplay = toDisplayAmount(data.amount);
    await updateUserBalance(userId, amountDisplay, 'add');
    actions.push('balance_restored');
  }
  
  return { success: true, actions };
}

// ============================================================================
// TRANSACTION RECORD OPERATIONS
// ============================================================================

/**
 * Create a PayMongo transaction record
 */
export async function createPayMongoTransaction(
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
 * Find transaction by source ID
 */
export async function findTransactionBySourceId(
  sourceId: string
): Promise<UnifiedTransaction | null> {
  const db = getDb();
  const q = query(
    collection(db, 'transactions'),
    where('metadata.paymongoSourceId', '==', sourceId),
    where('provider', '==', 'paymongo')
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
 * Find transaction by payment ID
 */
export async function findTransactionByPaymentId(
  paymentId: string
): Promise<UnifiedTransaction | null> {
  const db = getDb();
  const q = query(
    collection(db, 'transactions'),
    where('providerReference', '==', paymentId),
    where('provider', '==', 'paymongo')
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
 * Find transaction by payout ID
 */
export async function findTransactionByPayoutId(
  payoutId: string
): Promise<UnifiedTransaction | null> {
  const db = getDb();
  const q = query(
    collection(db, 'transactions'),
    where('metadata.paymongoPayoutId', '==', payoutId),
    where('provider', '==', 'paymongo')
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
 * Map PayMongo payment status to unified status
 */
function mapPayMongoPaymentStatus(status: string): TransactionStatus {
  switch (status) {
    case 'paid':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'pending':
    default:
      return 'pending';
  }
}

/**
 * Map PayMongo source status to unified status
 */
export function mapPayMongoSourceStatus(status: string): TransactionStatus {
  switch (status) {
    case 'chargeable':
      return 'requires_action';
    case 'paid':
      return 'completed';
    case 'failed':
    case 'cancelled':
    case 'expired':
      return 'failed';
    case 'pending':
    default:
      return 'pending';
  }
}

/**
 * Generate unique reference
 */
export function generateReference(prefix: string = 'PM'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`.toUpperCase();
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  PAYMONGO_PUBLIC_KEY,
  mapPayMongoPaymentStatus,
};


