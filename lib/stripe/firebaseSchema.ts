/**
 * Firebase Schema for Payment Integration
 * 
 * This file documents and provides utilities for the Firebase collections
 * used in payment integrations (Stripe and Paystack).
 * 
 * Collections:
 * - users/{userId} - Extended with payment data (Stripe + Paystack)
 * - transactions/{transactionId} - Payment/withdrawal records (unified)
 * - audit_log/{logId} - Security audit trail
 */

import { getDb } from '../firebase-utils';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import type { Transaction, TransactionType, TransactionStatus, UserPaymentData } from './stripeTypes';
import type { PaystackTransferRecipient, PaystackChannel } from '../paystack/paystackTypes';

// ============================================================================
// USER PAYMENT DATA
// ============================================================================

/**
 * Full user document schema (extends existing user fields)
 */
export interface UserDocument {
  // Existing fields
  id: string;
  email?: string;
  username?: string;
  displayName?: string;
  createdAt?: Timestamp;
  lastActive?: Timestamp;
  balance: number;
  
  // Stripe payment fields
  stripeCustomerId?: string;
  stripeConnectAccountId?: string;
  stripeConnectOnboarded?: boolean;
  defaultPaymentMethodId?: string;
  
  // Paystack payment fields
  paystackCustomerCode?: string;
  paystackTransferRecipients?: PaystackTransferRecipient[];
  defaultPaystackRecipient?: string;
  
  // Provider preference (determined by user's country)
  preferredPaymentProvider?: 'stripe' | 'paystack';
  
  // Statistics (existing, extended)
  totalDeposits?: number;
  totalWithdrawals?: number;
  depositCount?: number;
  withdrawalCount?: number;
  lastDeposit?: Timestamp;
  lastWithdrawal?: Timestamp;
  firstDeposit?: Timestamp;
  
  // Security fields
  registrationCountry?: string;
  lastPaymentCountry?: string;
  deviceFingerprints?: string[];
  paymentFlagged?: boolean;
  paymentFlagReason?: string;
}

/**
 * Initialize or update payment-related fields for a user
 */
export async function initializeUserPaymentData(
  userId: string,
  data: Partial<UserPaymentData>
): Promise<void> {
  const db = getDb();
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    await updateDoc(userRef, {
      ...data,
      lastActive: serverTimestamp(),
    });
  } else {
    await setDoc(userRef, {
      id: userId,
      balance: 0,
      ...data,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
    });
  }
}

/**
 * Get user's payment data (Stripe)
 */
export async function getUserPaymentData(userId: string): Promise<UserPaymentData | null> {
  const db = getDb();
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    return null;
  }
  
  const data = userDoc.data();
  return {
    stripeCustomerId: data.stripeCustomerId,
    stripeConnectAccountId: data.stripeConnectAccountId,
    stripeConnectOnboarded: data.stripeConnectOnboarded,
    defaultPaymentMethodId: data.defaultPaymentMethodId,
  };
}

/**
 * User Paystack data interface
 */
export interface UserPaystackData {
  paystackCustomerCode?: string;
  paystackTransferRecipients?: PaystackTransferRecipient[];
  defaultPaystackRecipient?: string;
}

/**
 * Get user's Paystack data
 */
export async function getUserPaystackData(userId: string): Promise<UserPaystackData | null> {
  const db = getDb();
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    return null;
  }
  
  const data = userDoc.data();
  return {
    paystackCustomerCode: data.paystackCustomerCode,
    paystackTransferRecipients: data.paystackTransferRecipients,
    defaultPaystackRecipient: data.defaultPaystackRecipient,
  };
}

// ============================================================================
// TRANSACTIONS COLLECTION
// ============================================================================

/**
 * Transaction document schema (unified for Stripe and Paystack)
 * Collection: transactions/{transactionId}
 */
export interface TransactionDocument {
  id: string;
  userId: string;
  type: TransactionType;
  amountCents: number;
  currency?: string; // Added for multi-currency support
  status: TransactionStatus;
  
  // Provider identification
  provider: 'stripe' | 'paystack';
  
  // Stripe references
  stripePaymentIntentId?: string;
  stripePayoutId?: string;
  stripeTransferId?: string;
  stripeChargeId?: string;
  
  // Paystack references
  paystackReference?: string;
  paystackTransferCode?: string;
  paystackChannel?: PaystackChannel;
  paystackAuthorizationCode?: string;
  paystackFees?: number;
  ussdCode?: string;
  
  // Display info
  paymentMethod?: string;
  paymentMethodBrand?: string;
  paymentMethodLast4?: string;
  description?: string;
  
  // Related entities
  referenceId?: string;
  referenceType?: 'tournament' | 'draft' | 'refund' | 'other';
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  
  // Error handling
  errorMessage?: string;
  errorCode?: string;
  
  // Metadata
  metadata?: Record<string, unknown>;
  
  // Security
  ipAddress?: string;
  deviceId?: string;
  riskScore?: number;
  riskFactors?: string[];
  
  // Currency conversion (for non-USD deposits)
  originalAmountSmallest?: number;
  originalCurrency?: string;
  exchangeRate?: number;
  usdEquivalentCents?: number;
}

// ============================================================================
// AUDIT LOG COLLECTION
// ============================================================================

/**
 * Audit log severity levels
 */
export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Audit log action types
 */
export type AuditAction = 
  | 'payment_initiated'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'payment_disputed'
  | 'payout_initiated'
  | 'payout_succeeded'
  | 'payout_failed'
  | 'payment_method_added'
  | 'payment_method_removed'
  | 'connect_account_created'
  | 'connect_onboarding_complete'
  | 'risk_flag_raised'
  | 'balance_updated'
  | 'refund_processed'
  // Paystack-specific actions
  | 'paystack_charge_initiated'
  | 'paystack_charge_success'
  | 'paystack_charge_failed'
  | 'paystack_transfer_initiated'
  | 'paystack_transfer_success'
  | 'paystack_transfer_failed'
  | 'paystack_recipient_created'
  | 'paystack_recipient_deleted';

/**
 * Audit log document schema
 * Collection: audit_log/{logId}
 */
export interface AuditLogDocument {
  id: string;
  userId: string;
  action: AuditAction;
  severity: AuditSeverity;
  
  // Context
  resourceType: 'payment' | 'payout' | 'payment_method' | 'account' | 'balance';
  resourceId?: string;
  
  // Details
  amountCents?: number;
  previousValue?: unknown;
  newValue?: unknown;
  description?: string;
  
  // Request context
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  country?: string;
  
  // Risk info
  riskScore?: number;
  riskFactors?: string[];
  
  // Timestamps
  timestamp: Timestamp;
  
  // Metadata
  metadata?: Record<string, unknown>;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  data: Omit<AuditLogDocument, 'id' | 'timestamp'>
): Promise<string> {
  // Filter out undefined values to avoid Firestore errors
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );
  
  const logData = {
    ...cleanData,
    timestamp: serverTimestamp(),
  };
  
  const db = getDb();
  const docRef = await addDoc(collection(db, 'audit_log'), logData);
  return docRef.id;
}

/**
 * Log a payment event
 */
export async function logPaymentEvent(
  userId: string,
  action: AuditAction,
  details: {
    transactionId?: string;
    amountCents?: number;
    severity?: AuditSeverity;
    ipAddress?: string;
    deviceId?: string;
    riskScore?: number;
    riskFactors?: string[];
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await createAuditLog({
    userId,
    action,
    severity: details.severity || 'low',
    resourceType: 'payment',
    resourceId: details.transactionId,
    amountCents: details.amountCents,
    ipAddress: details.ipAddress,
    deviceId: details.deviceId,
    riskScore: details.riskScore,
    riskFactors: details.riskFactors,
    metadata: details.metadata,
  });
}

// ============================================================================
// FIRESTORE SECURITY RULES (Documentation)
// ============================================================================

/**
 * Recommended Firestore security rules for payment collections.
 * Add these to your firestore.rules file:
 * 
 * ```
 * // Transactions - read only for owner, write only via backend
 * match /transactions/{transactionId} {
 *   allow read: if request.auth != null && resource.data.userId == request.auth.uid;
 *   allow write: if false; // Only backend can write
 * }
 * 
 * // Audit log - no client access
 * match /audit_log/{logId} {
 *   allow read, write: if false; // Backend only
 * }
 * 
 * // User payment fields - restricted
 * match /users/{userId} {
 *   // Users can read their own data
 *   allow read: if request.auth != null && request.auth.uid == userId;
 *   
 *   // Users cannot directly modify payment fields
 *   allow update: if request.auth != null 
 *     && request.auth.uid == userId
 *     && !request.resource.data.diff(resource.data).affectedKeys()
 *         .hasAny(['stripeCustomerId', 'stripeConnectAccountId', 'balance']);
 * }
 * ```
 */
export const FIRESTORE_RULES_DOCUMENTATION = `
See the JSDoc comment above for recommended Firestore security rules.
Payment-related fields should only be writable by the backend.
`;

// ============================================================================
// INDEXES (Documentation)
// ============================================================================

/**
 * Recommended Firestore indexes for payment queries.
 * Add these to your firestore.indexes.json:
 * 
 * {
 *   "indexes": [
 *     {
 *       "collectionGroup": "transactions",
 *       "queryScope": "COLLECTION",
 *       "fields": [
 *         { "fieldPath": "userId", "order": "ASCENDING" },
 *         { "fieldPath": "createdAt", "order": "DESCENDING" }
 *       ]
 *     },
 *     {
 *       "collectionGroup": "transactions",
 *       "queryScope": "COLLECTION",
 *       "fields": [
 *         { "fieldPath": "userId", "order": "ASCENDING" },
 *         { "fieldPath": "type", "order": "ASCENDING" },
 *         { "fieldPath": "createdAt", "order": "DESCENDING" }
 *       ]
 *     },
 *     {
 *       "collectionGroup": "audit_log",
 *       "queryScope": "COLLECTION",
 *       "fields": [
 *         { "fieldPath": "userId", "order": "ASCENDING" },
 *         { "fieldPath": "timestamp", "order": "DESCENDING" }
 *       ]
 *     }
 *   ]
 * }
 */
export const FIRESTORE_INDEXES_DOCUMENTATION = `
See the JSDoc comment above for recommended Firestore indexes.
`;

