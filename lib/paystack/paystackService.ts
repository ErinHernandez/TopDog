/**
 * Paystack Service Layer
 * 
 * Centralized Paystack operations with error handling and logging.
 * Handles transactions, transfers, webhooks, and bank operations.
 * 
 * @module lib/paystack/paystackService
 */

import crypto from 'crypto';
import { getDb } from '../firebase-utils';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { captureError } from '../errorTracking';
import type {
  PaystackApiResponse,
  InitializeTransactionRequest,
  InitializeTransactionData,
  VerifyTransactionData,
  ChargeUssdRequest,
  ChargeMobileMoneyRequest,
  ChargeResponseData,
  CreateTransferRecipientRequest,
  TransferRecipientData,
  InitiateTransferRequest,
  TransferData,
  PaystackBank,
  ResolveAccountData,
  PaystackCustomer,
  PaystackWebhookPayload,
  ChargeSuccessWebhookData,
  ChargeFailedWebhookData,
  TransferWebhookData,
  UserPaystackData,
  PaystackTransferRecipient,
  TransactionPaystackData,
} from './paystackTypes';
import { validatePaystackAmount, formatPaystackAmount, getCurrencyForPaystackCountry } from './currencyConfig';
import { getStripeExchangeRate, convertToUSD } from '../stripe/exchangeRates';
import type { TransactionStatus, UnifiedTransaction } from '../payments/types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

if (!PAYSTACK_SECRET_KEY) {
  console.warn('[PaystackService] PAYSTACK_SECRET_KEY not configured');
}

// ============================================================================
// HTTP CLIENT
// ============================================================================

/**
 * Make authenticated request to Paystack API
 */
async function paystackRequest<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
  } = {}
): Promise<PaystackApiResponse<T>> {
  const { method = 'GET', body } = options;
  
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured');
  }
  
  const response = await fetch(`${PAYSTACK_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  const data = await response.json();
  
  if (!response.ok || !data.status) {
    const error = new Error(data.message || 'Paystack API error');
    await captureError(error, {
      tags: { component: 'paystack', operation: endpoint },
      extra: { status: response.status, response: data },
    });
    throw error;
  }
  
  return data as PaystackApiResponse<T>;
}

// ============================================================================
// TRANSACTION OPERATIONS
// ============================================================================

/**
 * Initialize a Paystack transaction
 * 
 * Returns authorization URL or access code for Paystack Inline
 */
export async function initializeTransaction(
  request: InitializeTransactionRequest & { userId: string }
): Promise<{
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}> {
  const { userId, ...transactionParams } = request;
  
  // Validate amount
  const currency = transactionParams.currency || 'NGN';
  const validation = validatePaystackAmount(transactionParams.amount, currency);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  
  // Add user ID to metadata
  const metadata = {
    ...transactionParams.metadata,
    custom_fields: [
      ...(transactionParams.metadata?.custom_fields || []),
      { display_name: 'User ID', variable_name: 'firebaseUserId', value: userId },
    ],
  };
  
  const response = await paystackRequest<InitializeTransactionData>('/transaction/initialize', {
    method: 'POST',
    body: { ...transactionParams, metadata },
  });
  
  return {
    authorizationUrl: response.data.authorization_url,
    accessCode: response.data.access_code,
    reference: response.data.reference,
  };
}

/**
 * Verify a Paystack transaction
 */
export async function verifyTransaction(
  reference: string
): Promise<{
  success: boolean;
  status: TransactionStatus;
  data?: VerifyTransactionData;
  error?: string;
}> {
  try {
    const response = await paystackRequest<VerifyTransactionData>(
      `/transaction/verify/${encodeURIComponent(reference)}`
    );
    
    const status = mapPaystackStatus(response.data.status);
    
    return {
      success: response.data.status === 'success',
      status,
      data: response.data,
    };
  } catch (error: unknown) {
    return {
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

/**
 * Charge via USSD (Nigeria)
 */
export async function chargeUssd(
  request: ChargeUssdRequest & { userId: string }
): Promise<{
  reference: string;
  ussdCode?: string;
  displayText?: string;
  status: string;
}> {
  const { userId, ...chargeRequest } = request;
  
  // Add metadata
  const metadata = {
    ...chargeRequest.metadata,
    firebaseUserId: userId,
  };
  
  const response = await paystackRequest<ChargeResponseData>('/charge', {
    method: 'POST',
    body: { ...chargeRequest, metadata },
  });
  
  return {
    reference: response.data.reference,
    ussdCode: response.data.ussd_code,
    displayText: response.data.display_text,
    status: response.data.status,
  };
}

/**
 * Charge via Mobile Money (Ghana, Kenya)
 */
export async function chargeMobileMoney(
  request: ChargeMobileMoneyRequest & { userId: string }
): Promise<{
  reference: string;
  displayText?: string;
  status: string;
}> {
  const { userId, ...chargeRequest } = request;
  
  // Add metadata
  const metadata = {
    ...chargeRequest.metadata,
    firebaseUserId: userId,
  };
  
  const response = await paystackRequest<ChargeResponseData>('/charge', {
    method: 'POST',
    body: { ...chargeRequest, metadata },
  });
  
  return {
    reference: response.data.reference,
    displayText: response.data.display_text,
    status: response.data.status,
  };
}

// ============================================================================
// TRANSFER OPERATIONS
// ============================================================================

/**
 * Create a transfer recipient (for withdrawals)
 */
export async function createTransferRecipient(
  request: CreateTransferRecipientRequest & { userId: string }
): Promise<{
  recipientCode: string;
  recipientData: TransferRecipientData;
}> {
  const { userId, ...recipientRequest } = request;
  
  // Add metadata
  const metadata = {
    ...recipientRequest.metadata,
    firebaseUserId: userId,
  };
  
  const response = await paystackRequest<TransferRecipientData>('/transferrecipient', {
    method: 'POST',
    body: { ...recipientRequest, metadata },
  });
  
  // Store recipient in user's data
  const db = getDb();
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  const existingRecipients: PaystackTransferRecipient[] = 
    (userDoc.exists() ? userDoc.data()?.paystackTransferRecipients : []) || [];
  
  const newRecipient: PaystackTransferRecipient = {
    code: response.data.recipient_code,
    type: response.data.type,
    bankCode: response.data.details.bank_code,
    bankName: response.data.details.bank_name,
    accountNumber: response.data.details.account_number,
    accountName: response.data.details.account_name || undefined,
    currency: response.data.currency,
    isDefault: existingRecipients.length === 0, // First recipient is default
    createdAt: new Date().toISOString(),
  };
  
  await setDoc(userRef, {
    paystackTransferRecipients: [...existingRecipients, newRecipient],
  }, { merge: true });
  
  return {
    recipientCode: response.data.recipient_code,
    recipientData: response.data,
  };
}

/**
 * Initiate a transfer (withdrawal)
 */
export async function initiateTransfer(
  request: InitiateTransferRequest & { userId: string }
): Promise<{
  transferCode: string;
  reference: string;
  status: string;
}> {
  const { userId, ...transferRequest } = request;
  
  // Verify user has sufficient balance
  const db = getDb();
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  
  const userData = userDoc.data();
  const currentBalance = (userData.balance || 0) as number;
  const currency = transferRequest.currency || 'NGN';
  const amountDisplay = transferRequest.amount / 100; // Assuming smallest unit
  
  // TODO: Convert to USD equivalent for balance check
  // For now, assume balance is in user's local currency
  if (currentBalance < amountDisplay) {
    throw new Error('Insufficient balance');
  }
  
  const response = await paystackRequest<TransferData>('/transfer', {
    method: 'POST',
    body: {
      ...transferRequest,
      source: 'balance',
    },
  });
  
  return {
    transferCode: response.data.transfer_code,
    reference: response.data.reference,
    status: response.data.status,
  };
}

/**
 * Get transfer status
 */
export async function getTransferStatus(
  transferCodeOrId: string
): Promise<TransferData> {
  const response = await paystackRequest<TransferData>(
    `/transfer/${encodeURIComponent(transferCodeOrId)}`
  );
  return response.data;
}

// ============================================================================
// BANK OPERATIONS
// ============================================================================

/**
 * List banks for a country
 */
export async function listBanks(
  country: 'nigeria' | 'ghana' | 'south_africa' | 'kenya' = 'nigeria'
): Promise<PaystackBank[]> {
  const countryParam = country === 'nigeria' ? '' : `?country=${country}`;
  const response = await paystackRequest<PaystackBank[]>(`/bank${countryParam}`);
  return response.data;
}

/**
 * Resolve/verify bank account number
 */
export async function resolveAccountNumber(
  accountNumber: string,
  bankCode: string
): Promise<{
  accountNumber: string;
  accountName: string;
}> {
  const response = await paystackRequest<ResolveAccountData>(
    `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
  );
  
  return {
    accountNumber: response.data.account_number,
    accountName: response.data.account_name,
  };
}

// ============================================================================
// CUSTOMER OPERATIONS
// ============================================================================

/**
 * Get or create Paystack customer for a user
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  firstName?: string,
  lastName?: string
): Promise<PaystackCustomer> {
  // Check if user already has a customer code
  const db = getDb();
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    const userData = userDoc.data() as UserPaystackData;
    if (userData.paystackCustomerCode) {
      // Fetch existing customer
      try {
        const response = await paystackRequest<PaystackCustomer>(
          `/customer/${userData.paystackCustomerCode}`
        );
        return response.data;
      } catch (error: unknown) {
        // Customer might not exist, create new
        console.warn('[PaystackService] Stored customer code invalid, creating new');
      }
    }
  }
  
  // Create new customer
  const response = await paystackRequest<PaystackCustomer>('/customer', {
    method: 'POST',
    body: {
      email,
      first_name: firstName,
      last_name: lastName,
      metadata: { firebaseUserId: userId },
    },
  });
  
  // Store customer code
  await setDoc(userRef, {
    paystackCustomerCode: response.data.customer_code,
  }, { merge: true });
  
  return response.data;
}

// ============================================================================
// WEBHOOK HANDLING
// ============================================================================

/**
 * Verify Paystack webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): boolean {
  if (!PAYSTACK_WEBHOOK_SECRET) {
    console.error('[PaystackService] PAYSTACK_WEBHOOK_SECRET not configured');
    return false;
  }
  
  const hash = crypto
    .createHmac('sha512', PAYSTACK_WEBHOOK_SECRET)
    .update(typeof payload === 'string' ? payload : payload.toString())
    .digest('hex');
  
  return hash === signature;
}

/**
 * Process charge.success webhook
 * 
 * This is the SINGLE SOURCE OF TRUTH for balance updates on successful deposits.
 * The verify endpoint should NOT credit balance - it only checks/updates transaction status.
 * 
 * IMPORTANT: User balance is stored in USD. Paystack deposits are in local currencies
 * (NGN, GHS, ZAR, KES), so we must convert to USD before crediting the balance.
 */
export async function handleChargeSuccess(
  data: ChargeSuccessWebhookData
): Promise<{ success: boolean; actions: string[] }> {
  const actions: string[] = [];
  
  const userId = data.metadata?.firebaseUserId;
  if (!userId) {
    return { success: false, actions: ['missing_user_id'] };
  }
  
  // Check if already processed - includes balance credit check
  const existingTx = await findTransactionByReference(data.reference);
  if (existingTx?.status === 'completed') {
    // Already completed means balance was already credited
    return { success: true, actions: ['already_processed'] };
  }
  
  // Check if balance was already credited for this transaction (idempotency)
  if (existingTx?.metadata?.balanceCredited === true) {
    // Balance already credited but status wasn't updated - just update status
    await updateTransactionStatus(existingTx.id, 'completed');
    return { success: true, actions: ['status_updated', 'balance_already_credited'] };
  }
  
  // Get currency and convert to USD
  const currency = data.currency.toUpperCase();
  const localAmountDisplay = data.amount / 100; // Amount in local currency (e.g., 1550 NGN)
  
  // Convert local currency to USD for balance crediting
  let usdAmount: number;
  let exchangeRate: number;
  
  try {
    const rateData = await getStripeExchangeRate(currency);
    exchangeRate = rateData.rate;
    usdAmount = convertToUSD(localAmountDisplay, exchangeRate);
    
    console.log(`[Paystack] Converting ${localAmountDisplay} ${currency} to USD: rate=${exchangeRate}, usdAmount=${usdAmount.toFixed(2)}`);
    actions.push(`converted_${currency}_to_usd`);
  } catch (error: unknown) {
    console.error('[Paystack] Failed to get exchange rate, cannot process deposit:', error);
    return { success: false, actions: ['exchange_rate_failed'] };
  }
  
  if (existingTx) {
    // Mark balance as credited in the same update to prevent double-credit
    await updateTransactionWithBalanceCredit(existingTx.id, 'completed');
    actions.push('transaction_updated');
  } else {
    await createPaystackTransaction({
      userId,
      type: 'deposit',
      amountSmallestUnit: data.amount,
      currency,
      status: 'completed',
      provider: 'paystack',
      providerReference: data.reference,
      paymentMethodType: data.channel,
      description: 'Deposit via Paystack',
      metadata: {
        paystackId: data.id,
        channel: data.channel,
        gatewayResponse: data.gateway_response,
        balanceCredited: true,
        // Store conversion details for auditing
        localAmount: localAmountDisplay,
        localCurrency: currency,
        exchangeRate,
        usdEquivalent: usdAmount,
      },
    });
    actions.push('transaction_created');
  }
  
  // Credit user balance in USD (balance is always stored in USD)
  // Note: usdAmount is already in display format (dollars, not cents)
  // updateUserBalance expects cents, so multiply by 100
  await updateUserBalance(userId, usdAmount * 100, 'add');
  actions.push('balance_credited_usd');
  
  return { success: true, actions };
}

/**
 * Update transaction status and mark balance as credited atomically
 */
async function updateTransactionWithBalanceCredit(
  transactionId: string,
  status: TransactionStatus
): Promise<void> {
  const db = getDb();
  const transactionRef = doc(db, 'transactions', transactionId);
  
  await updateDoc(transactionRef, {
    status,
    updatedAt: new Date().toISOString(),
    'metadata.balanceCredited': true,
  });
}

/**
 * Process charge.failed webhook
 * 
 * Updates transaction to failed status. No balance operations needed
 * since balance is only credited on success.
 */
export async function handleChargeFailed(
  data: ChargeFailedWebhookData
): Promise<{ success: boolean; actions: string[] }> {
  const actions: string[] = [];
  
  const userId = data.metadata?.firebaseUserId;
  if (!userId) {
    return { success: false, actions: ['missing_user_id'] };
  }
  
  // Find the transaction by reference
  const existingTx = await findTransactionByReference(data.reference);
  
  if (!existingTx) {
    // No transaction record found - this is unusual but not an error
    // The user may have never started the payment flow
    console.warn(`[Paystack] charge.failed: No transaction found for reference ${data.reference}`);
    return { success: true, actions: ['no_transaction_found'] };
  }
  
  // Only update if not already in a terminal state
  if (existingTx.status === 'completed' || existingTx.status === 'failed') {
    return { success: true, actions: ['already_terminal'] };
  }
  
  // Update transaction to failed
  const errorMessage = data.gateway_response || data.message || 'Payment failed';
  await updateTransactionStatus(existingTx.id, 'failed', errorMessage);
  actions.push('transaction_failed');
  
  // Log the failure reason for debugging
  console.log(`[Paystack] Charge failed for reference ${data.reference}: ${errorMessage}`);
  
  return { success: true, actions };
}

/**
 * Process transfer.success webhook
 */
export async function handleTransferSuccess(
  data: TransferWebhookData
): Promise<{ success: boolean; actions: string[] }> {
  const actions: string[] = [];
  
  const userId = data.recipient.metadata?.firebaseUserId;
  if (!userId) {
    return { success: false, actions: ['missing_user_id'] };
  }
  
  // Update transaction status
  const existingTx = await findTransactionByTransferCode(data.transfer_code);
  if (existingTx) {
    await updateTransactionStatus(existingTx.id, 'completed');
    actions.push('transaction_completed');
  }
  
  return { success: true, actions };
}

/**
 * Process transfer.failed webhook
 * 
 * When a transfer fails, we need to restore the user's balance.
 * The balance is stored in USD, and the original USD amount debited
 * is stored in the transaction metadata.
 */
export async function handleTransferFailed(
  data: TransferWebhookData
): Promise<{ success: boolean; actions: string[] }> {
  const actions: string[] = [];
  
  const userId = data.recipient.metadata?.firebaseUserId;
  if (!userId) {
    return { success: false, actions: ['missing_user_id'] };
  }
  
  // Update transaction status
  const existingTx = await findTransactionByTransferCode(data.transfer_code);
  if (existingTx) {
    // Check if balance was already restored (idempotency)
    if (existingTx.metadata?.balanceRestored === true) {
      return { success: true, actions: ['already_restored'] };
    }
    
    await updateTransactionStatus(existingTx.id, 'failed', 'Transfer failed');
    actions.push('transaction_failed');
    
    // Restore user balance using the USD amount that was originally debited
    // This is stored in transaction metadata.usdAmountDebited
    const usdAmountDebited = existingTx.metadata?.usdAmountDebited;
    
    if (typeof usdAmountDebited === 'number' && usdAmountDebited > 0) {
      // Restore the exact USD amount that was debited
      // Note: usdAmountDebited is in display format (dollars), updateUserBalance expects cents
      await updateUserBalance(userId, usdAmountDebited * 100, 'add');
      actions.push('balance_restored_usd');
      
      // Mark balance as restored to prevent double-restoration
      const db = getDb();
      const transactionRef = doc(db, 'transactions', existingTx.id);
      await updateDoc(transactionRef, {
        'metadata.balanceRestored': true,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Fallback: Convert local currency to USD if usdAmountDebited not stored
      // This shouldn't happen for new transactions but handles legacy data
      console.warn(`[Paystack] No usdAmountDebited found for transfer ${data.transfer_code}, falling back to conversion`);
      
      const currency = existingTx.currency || data.currency.toUpperCase();
      const localAmountDisplay = data.amount / 100;
      
      try {
        const rateData = await getStripeExchangeRate(currency);
        const usdAmount = convertToUSD(localAmountDisplay, rateData.rate);
        await updateUserBalance(userId, usdAmount * 100, 'add');
        actions.push('balance_restored_converted');
      } catch (error: unknown) {
        console.error('[Paystack] Failed to get exchange rate for balance restoration:', error);
        actions.push('balance_restoration_failed');
        return { success: false, actions };
      }
    }
  }
  
  return { success: true, actions };
}

// ============================================================================
// TRANSACTION RECORD OPERATIONS
// ============================================================================

/**
 * Create a Paystack transaction record
 */
export async function createPaystackTransaction(
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
 * Find transaction by Paystack reference
 */
export async function findTransactionByReference(
  reference: string
): Promise<UnifiedTransaction | null> {
  const db = getDb();
  const q = query(
    collection(db, 'transactions'),
    where('providerReference', '==', reference),
    where('provider', '==', 'paystack')
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
 * Find transaction by Paystack transfer code
 */
export async function findTransactionByTransferCode(
  transferCode: string
): Promise<UnifiedTransaction | null> {
  const db = getDb();
  const q = query(
    collection(db, 'transactions'),
    where('metadata.paystackTransferCode', '==', transferCode),
    where('provider', '==', 'paystack')
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
 * Map Paystack status to unified status
 */
function mapPaystackStatus(paystackStatus: string): TransactionStatus {
  switch (paystackStatus) {
    case 'success':
      return 'completed';
    case 'failed':
    case 'abandoned':
    case 'reversed':
      return 'failed';
    case 'pending':
    case 'queued':
      return 'pending';
    case 'processing':
      return 'processing';
    default:
      return 'pending';
  }
}

/**
 * Generate unique reference
 */
export function generateReference(prefix: string = 'TD'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`.toUpperCase();
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  PAYSTACK_PUBLIC_KEY,
  mapPaystackStatus,
};

