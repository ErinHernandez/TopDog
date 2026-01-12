/**
 * Stripe Service Layer
 * 
 * Centralized Stripe operations with idempotency, error handling, and logging.
 * This service wraps all Stripe API calls and integrates with our logging/error tracking.
 */

import Stripe from 'stripe';
import { getDb } from '../firebase-utils';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { captureError } from '../errorTracking';
import type {
  CreateCustomerRequest,
  CustomerWithPaymentMethods,
  CreatePaymentIntentRequest,
  PaymentIntentResponse,
  CreateSetupIntentRequest,
  SetupIntentResponse,
  CreateConnectAccountRequest,
  ConnectAccountStatus,
  CreatePayoutRequest,
  PayoutResponse,
  CreateTransactionInput,
  Transaction,
  TransactionStatus,
  UserPaymentData,
  RiskAssessment,
  RiskContext,
} from './stripeTypes';

// ============================================================================
// INITIALIZATION
// ============================================================================

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_CONNECT_CLIENT_ID = process.env.STRIPE_CONNECT_CLIENT_ID;

if (!STRIPE_SECRET_KEY) {
  console.warn('[StripeService] STRIPE_SECRET_KEY not configured');
}

/**
 * Stripe client instance
 * Initialized lazily to avoid issues in browser context
 */
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  
  if (!stripeInstance) {
    stripeInstance = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-07-30.basil',
      typescript: true,
    });
  }
  
  return stripeInstance;
}

// ============================================================================
// CUSTOMER OPERATIONS
// ============================================================================

/**
 * Get or create a Stripe Customer for a Firebase user
 * Idempotent - returns existing customer if found
 */
export async function getOrCreateCustomer(
  request: CreateCustomerRequest
): Promise<Stripe.Customer> {
  const stripe = getStripe();
  const { userId, email, name, metadata = {} } = request;
  
  try {
    // Check if user already has a Stripe customer ID in Firebase
    const db = getDb();
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserPaymentData;
      
      if (userData.stripeCustomerId) {
        // Retrieve existing customer
        try {
          const customer = await stripe.customers.retrieve(userData.stripeCustomerId);
          if (!customer.deleted) {
            return customer as Stripe.Customer;
          }
        } catch (err: unknown) {
          // Customer might have been deleted, create a new one
          console.warn('[StripeService] Stored customer ID invalid, creating new customer');
        }
      }
    }
    
    // Search for existing customer by email (fallback)
    if (email) {
      const existingCustomers = await stripe.customers.list({
        email,
        limit: 1,
      });
      
      if (existingCustomers.data.length > 0) {
        const customer = existingCustomers.data[0];
        
        // Update/create Firebase record with the found customer ID (use merge for anonymous users)
        await setDoc(userRef, {
          stripeCustomerId: customer.id,
        }, { merge: true });
        
        return customer;
      }
    }
    
    // Create new customer
    const customer = await stripe.customers.create({
      email: email || undefined,
      name,
      metadata: {
        firebaseUserId: userId,
        ...metadata,
      },
    });
    
    // Store customer ID in Firebase (use merge to handle anonymous users without existing documents)
    await setDoc(userRef, {
      stripeCustomerId: customer.id,
    }, { merge: true });
    
    return customer;
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'getOrCreateCustomer' },
      extra: { userId, email },
    });
    throw error;
  }
}

/**
 * Get customer with their saved payment methods
 */
export async function getCustomerWithPaymentMethods(
  customerId: string
): Promise<CustomerWithPaymentMethods> {
  const stripe = getStripe();
  
  try {
    const [customer, paymentMethods] = await Promise.all([
      stripe.customers.retrieve(customerId),
      stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      }),
    ]);
    
    if (customer.deleted) {
      throw new Error('Customer has been deleted');
    }
    
    const typedCustomer = customer as Stripe.Customer;
    
    return {
      customer: typedCustomer,
      paymentMethods: paymentMethods.data,
      defaultPaymentMethodId: typeof typedCustomer.invoice_settings?.default_payment_method === 'string'
        ? typedCustomer.invoice_settings.default_payment_method
        : undefined,
    };
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'getCustomerWithPaymentMethods' },
      extra: { customerId },
    });
    throw error;
  }
}

/**
 * Set default payment method for a customer
 */
export async function setDefaultPaymentMethod(
  customerId: string,
  paymentMethodId: string
): Promise<void> {
  const stripe = getStripe();
  
  try {
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'setDefaultPaymentMethod' },
      extra: { customerId, paymentMethodId },
    });
    throw error;
  }
}

/**
 * Detach a payment method from a customer
 */
export async function detachPaymentMethod(
  paymentMethodId: string
): Promise<void> {
  const stripe = getStripe();
  
  try {
    await stripe.paymentMethods.detach(paymentMethodId);
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'detachPaymentMethod' },
      extra: { paymentMethodId },
    });
    throw error;
  }
}

// ============================================================================
// PAYMENT INTENT OPERATIONS
// ============================================================================

import { 
  getCurrencyConfig, 
  validateAmount, 
  toDisplayAmount,
  isZeroDecimalCurrency,
} from './currencyConfig';

/**
 * Create a PaymentIntent for a deposit
 * 
 * Supports multiple currencies with currency-specific validation.
 * Zero-decimal currencies (JPY, KRW, VND) are handled correctly.
 */
export async function createPaymentIntent(
  request: CreatePaymentIntentRequest
): Promise<PaymentIntentResponse> {
  const stripe = getStripe();
  const {
    amountCents,
    currency = 'usd',
    userId,
    userCountry,
    customerId,
    paymentMethodTypes = ['card'],
    savePaymentMethod = false,
    paymentMethodId,
    idempotencyKey,
    metadata = {},
  } = request;
  
  const currencyUpper = currency.toUpperCase();
  const currencyLower = currency.toLowerCase();
  const currencyConfig = getCurrencyConfig(currencyUpper);
  
  try {
    // Validate amount against currency-specific limits
    const validation = validateAmount(amountCents, currencyUpper);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    // Build payment intent params
    const params: Stripe.PaymentIntentCreateParams = {
      amount: amountCents,
      currency: currencyLower,
      customer: customerId,
      payment_method_types: paymentMethodTypes,
      metadata: {
        firebaseUserId: userId,
        originalCurrency: currencyUpper,
        userCountry: userCountry || '',
        ...metadata,
      },
    };
    
    // If saving payment method, set up for future usage
    if (savePaymentMethod) {
      params.setup_future_usage = 'off_session';
    }
    
    // If using existing payment method
    if (paymentMethodId) {
      params.payment_method = paymentMethodId;
      params.confirm = true;
      params.return_url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/deposit/complete`;
    }
    
    // Create with idempotency key if provided
    const paymentIntent = await stripe.paymentIntents.create(
      params,
      idempotencyKey ? { idempotencyKey } : undefined
    );
    
    // Build response with next action info for async payments
    const response: PaymentIntentResponse = {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amountCents: paymentIntent.amount,
      currency: currencyUpper,
    };
    
    // Add next action info for async payments (OXXO, Boleto, etc.)
    if (paymentIntent.next_action) {
      response.nextAction = {
        type: paymentIntent.next_action.type,
      };
      
      // Handle OXXO voucher
      if (paymentIntent.next_action.oxxo_display_details) {
        response.nextAction.voucherUrl = paymentIntent.next_action.oxxo_display_details.hosted_voucher_url || undefined;
        response.nextAction.expiresAt = paymentIntent.next_action.oxxo_display_details.expires_after 
          ? new Date(paymentIntent.next_action.oxxo_display_details.expires_after * 1000).toISOString()
          : undefined;
      }
      
      // Handle Boleto voucher
      if (paymentIntent.next_action.boleto_display_details) {
        response.nextAction.voucherUrl = paymentIntent.next_action.boleto_display_details.hosted_voucher_url || undefined;
        response.nextAction.expiresAt = paymentIntent.next_action.boleto_display_details.expires_at
          ? new Date(paymentIntent.next_action.boleto_display_details.expires_at * 1000).toISOString()
          : undefined;
      }
      
      // Handle redirect-based payments
      if (paymentIntent.next_action.redirect_to_url) {
        response.nextAction.redirectUrl = paymentIntent.next_action.redirect_to_url.url || undefined;
      }
    }
    
    return response;
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'createPaymentIntent' },
      extra: { userId, amountCents, currency: currencyUpper },
    });
    throw error;
  }
}

// ============================================================================
// SETUP INTENT OPERATIONS
// ============================================================================

/**
 * Create a SetupIntent for saving a payment method without charging
 */
export async function createSetupIntent(
  request: CreateSetupIntentRequest
): Promise<SetupIntentResponse> {
  const stripe = getStripe();
  const {
    userId,
    customerId,
    paymentMethodTypes = ['card'],
    idempotencyKey,
  } = request;
  
  try {
    const setupIntent = await stripe.setupIntents.create(
      {
        customer: customerId,
        payment_method_types: paymentMethodTypes,
        metadata: {
          firebaseUserId: userId,
        },
      },
      idempotencyKey ? { idempotencyKey } : undefined
    );
    
    return {
      clientSecret: setupIntent.client_secret!,
      setupIntentId: setupIntent.id,
    };
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'createSetupIntent' },
      extra: { userId, customerId },
    });
    throw error;
  }
}

// ============================================================================
// CONNECT OPERATIONS
// ============================================================================

/**
 * Create or retrieve a Stripe Connect account for payouts
 */
export async function getOrCreateConnectAccount(
  request: CreateConnectAccountRequest
): Promise<ConnectAccountStatus> {
  const stripe = getStripe();
  const {
    userId,
    email,
    type = 'express',
    country = 'US',
    businessType = 'individual',
  } = request;
  
  try {
    // Check if user already has a Connect account
    const db = getDb();
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserPaymentData;
      
      if (userData.stripeConnectAccountId) {
        // Retrieve existing account status
        return getConnectAccountStatus(userData.stripeConnectAccountId);
      }
    }
    
    // Create new Connect account
    const account = await stripe.accounts.create({
      type,
      country,
      email,
      business_type: businessType,
      capabilities: {
        transfers: { requested: true },
      },
      metadata: {
        firebaseUserId: userId,
      },
    });
    
    // Store account ID in Firebase (use merge for safety)
    await setDoc(userRef, {
      stripeConnectAccountId: account.id,
      stripeConnectOnboarded: false,
    }, { merge: true });
    
    return getConnectAccountStatus(account.id);
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'getOrCreateConnectAccount' },
      extra: { userId, email },
    });
    throw error;
  }
}

/**
 * Get Connect account status and onboarding link if needed
 */
export async function getConnectAccountStatus(
  accountId: string
): Promise<ConnectAccountStatus> {
  const stripe = getStripe();
  
  try {
    const account = await stripe.accounts.retrieve(accountId);
    
    const status: ConnectAccountStatus = {
      accountId: account.id,
      chargesEnabled: account.charges_enabled ?? false,
      payoutsEnabled: account.payouts_enabled ?? false,
      detailsSubmitted: account.details_submitted ?? false,
      requirements: account.requirements ? {
        currentlyDue: account.requirements.currently_due ?? [],
        eventuallyDue: account.requirements.eventually_due ?? [],
        pastDue: account.requirements.past_due ?? [],
      } : undefined,
    };
    
    // Generate onboarding link if not complete
    if (!status.detailsSubmitted || status.requirements?.currentlyDue?.length) {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/connect/refresh`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/connect/complete`,
        type: 'account_onboarding',
      });
      
      status.onboardingUrl = accountLink.url;
    }
    
    return status;
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'getConnectAccountStatus' },
      extra: { accountId },
    });
    throw error;
  }
}

/**
 * Create a payout to a user's Connect account
 * 
 * Supports multiple currencies. The payout currency typically matches
 * the user's account balance currency.
 */
export async function createPayout(
  request: CreatePayoutRequest
): Promise<PayoutResponse> {
  const stripe = getStripe();
  const {
    userId,
    amountCents,
    currency = 'usd',
    description = 'Withdrawal',
    idempotencyKey,
    metadata = {},
  } = request;
  
  const currencyLower = currency.toLowerCase();
  const currencyUpper = currency.toUpperCase();
  
  try {
    // Get user's Connect account
    const db = getDb();
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data() as UserPaymentData;
    
    if (!userData.stripeConnectAccountId) {
      throw new Error('No payout account configured');
    }
    
    // Check account status
    const accountStatus = await getConnectAccountStatus(userData.stripeConnectAccountId);
    
    if (!accountStatus.payoutsEnabled) {
      throw new Error('Payout account is not fully set up');
    }
    
    // Verify user has sufficient balance
    // Note: Balance is stored in USD. For non-USD withdrawals, we need to convert
    // the withdrawal amount to USD using an exchange rate before comparing.
    const currentBalance = (userDoc.data().balance || 0) as number;
    
    // Convert withdrawal amount to display amount in its currency
    const withdrawalDisplayAmount = toDisplayAmount(amountCents, currencyUpper);
    
    // TODO: Implement proper exchange rate conversion for non-USD withdrawals
    // For now, this only works correctly for USD withdrawals.
    // For other currencies, we need to:
    // 1. Get current exchange rate (e.g., from Stripe or external API)
    // 2. Convert withdrawalDisplayAmount * exchangeRate to get USD equivalent
    // 3. Compare USD equivalent to currentBalance
    if (currencyUpper !== 'USD') {
      throw new Error(
        `Currency conversion not yet implemented. ` +
        `Withdrawals in ${currencyUpper} require exchange rate conversion to USD. ` +
        `Please use USD for withdrawals until this feature is implemented.`
      );
    }
    
    // For USD, compare directly (balance is already in USD)
    if (currentBalance < withdrawalDisplayAmount) {
      throw new Error('Insufficient balance');
    }
    
    // Create a transfer to the Connect account
    const transfer = await stripe.transfers.create(
      {
        amount: amountCents,
        currency: currencyLower,
        destination: userData.stripeConnectAccountId,
        description,
        metadata: {
          firebaseUserId: userId,
          originalCurrency: currencyUpper,
          ...metadata,
        },
      },
      idempotencyKey ? { idempotencyKey } : undefined
    );
    
    return {
      payoutId: transfer.id,
      amountCents: transfer.amount,
      currency: currencyUpper,
      status: 'pending',
      arrivalDate: undefined, // Will be updated via webhook
    };
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'createPayout' },
      extra: { userId, amountCents, currency: currencyUpper },
    });
    throw error;
  }
}

// ============================================================================
// TRANSACTION OPERATIONS
// ============================================================================

/**
 * Create a transaction record in Firebase
 */
export async function createTransaction(
  input: CreateTransactionInput
): Promise<Transaction> {
  try {
    const now = new Date().toISOString();
    
    // Build transaction object, filtering out undefined values
    const transaction: Omit<Transaction, 'id'> = {
      userId: input.userId,
      type: input.type,
      amountCents: input.amountCents,
      currency: input.currency || 'USD',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    
    // Currency tracking fields
    if (input.originalAmountSmallestUnit !== undefined) {
      transaction.originalAmountSmallestUnit = input.originalAmountSmallestUnit;
    }
    if (input.usdEquivalentCents !== undefined) {
      transaction.usdEquivalentCents = input.usdEquivalentCents;
    }
    if (input.exchangeRate !== undefined) {
      transaction.exchangeRate = input.exchangeRate;
    }
    
    // Payment method tracking
    if (input.paymentMethodType) transaction.paymentMethodType = input.paymentMethodType;
    if (input.voucherUrl) transaction.voucherUrl = input.voucherUrl;
    if (input.expiresAt) transaction.expiresAt = input.expiresAt;
    
    // Standard optional fields
    if (input.stripePaymentIntentId) transaction.stripePaymentIntentId = input.stripePaymentIntentId;
    if (input.stripePayoutId) transaction.stripePayoutId = input.stripePayoutId;
    if (input.stripeTransferId) transaction.stripeTransferId = input.stripeTransferId;
    if (input.paymentMethod) transaction.paymentMethod = input.paymentMethod;
    if (input.description) transaction.description = input.description;
    if (input.referenceId) transaction.referenceId = input.referenceId;
    if (input.metadata) transaction.metadata = input.metadata;
    
    const db = getDb();
    const docRef = await addDoc(collection(db, 'transactions'), transaction);
    
    return {
      id: docRef.id,
      ...transaction,
    };
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'createTransaction' },
      extra: { userId: input.userId, type: input.type },
    });
    throw error;
  }
}

/**
 * Update a transaction's status
 */
export async function updateTransactionStatus(
  transactionId: string,
  status: TransactionStatus,
  errorMessage?: string
): Promise<void> {
  try {
    const db = getDb();
    const transactionRef = doc(db, 'transactions', transactionId);
    
    const updates: Partial<Transaction> = {
      status,
      updatedAt: new Date().toISOString(),
    };
    
    if (errorMessage) {
      updates.errorMessage = errorMessage;
    }
    
    await updateDoc(transactionRef, updates);
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'updateTransactionStatus' },
      extra: { transactionId, status },
    });
    throw error;
  }
}

/**
 * Find transaction by Stripe PaymentIntent ID
 */
export async function findTransactionByPaymentIntent(
  paymentIntentId: string
): Promise<Transaction | null> {
  try {
    const db = getDb();
    const q = query(
      collection(db, 'transactions'),
      where('stripePaymentIntentId', '==', paymentIntentId)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Transaction;
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'findTransactionByPaymentIntent' },
      extra: { paymentIntentId },
    });
    throw error;
  }
}

/**
 * Find transaction by Stripe Transfer ID
 */
export async function findTransactionByTransfer(
  transferId: string
): Promise<Transaction | null> {
  try {
    const db = getDb();
    const q = query(
      collection(db, 'transactions'),
      where('stripeTransferId', '==', transferId)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Transaction;
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'findTransactionByTransfer' },
      extra: { transferId },
    });
    throw error;
  }
}

// ============================================================================
// BALANCE OPERATIONS
// ============================================================================

/**
 * Update user's balance in Firebase (called by webhook handlers)
 */
export async function updateUserBalance(
  userId: string,
  amountCents: number,
  operation: 'add' | 'subtract'
): Promise<number> {
  try {
    const db = getDb();
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const currentBalance = (userDoc.data().balance || 0) as number;
    const amountDollars = amountCents / 100;
    
    const newBalance = operation === 'add'
      ? currentBalance + amountDollars
      : currentBalance - amountDollars;
    
    if (newBalance < 0) {
      throw new Error('Insufficient balance');
    }
    
    // Use setDoc with merge for safety
    await setDoc(userRef, {
      balance: newBalance,
      lastBalanceUpdate: serverTimestamp(),
    }, { merge: true });
    
    return newBalance;
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'updateUserBalance' },
      extra: { userId, amountCents, operation },
    });
    throw error;
  }
}

// ============================================================================
// RISK SCORING INTEGRATION
// ============================================================================

/**
 * Assess risk for a payment
 * Integrates with existing paymentSecurity.js
 */
export async function assessPaymentRisk(
  userId: string,
  amountCents: number,
  context: RiskContext
): Promise<RiskAssessment> {
  try {
    // Get user data for risk assessment
    const db = getDb();
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    const userData = userDoc.exists() ? userDoc.data() : {};
    
    let riskScore = 0;
    const factors: string[] = [];
    
    // Amount-based risk
    if (amountCents > 100000) { // > $1000
      riskScore += 20;
      factors.push('high_amount');
    }
    if (amountCents % 10000 === 0 && amountCents > 50000) { // Round amounts > $500
      riskScore += 15;
      factors.push('round_amount');
    }
    
    // Geographic risk
    if (context.country && context.country !== userData.registrationCountry) {
      riskScore += 25;
      factors.push('country_mismatch');
    }
    
    // New device risk
    if (context.newDevice) {
      riskScore += 20;
      factors.push('new_device');
    }
    
    // Velocity checks (would need transaction history query)
    // This is a simplified version
    
    // Time-based risk
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 6) {
      riskScore += 10;
      factors.push('unusual_time');
    }
    
    // Determine recommendation
    let recommendation: RiskAssessment['recommendation'];
    if (riskScore <= 30) {
      recommendation = 'approve';
    } else if (riskScore <= 50) {
      recommendation = 'review';
    } else if (riskScore <= 70) {
      recommendation = 'challenge';
    } else if (riskScore <= 90) {
      recommendation = 'manual_review';
    } else {
      recommendation = 'decline';
    }
    
    return {
      score: Math.min(riskScore, 100),
      factors,
      recommendation,
    };
  } catch (error: unknown) {
    // Don't fail the payment if risk assessment fails, just log
    console.error('[StripeService] Risk assessment failed:', error);
    return {
      score: 0,
      factors: ['assessment_failed'],
      recommendation: 'review',
    };
  }
}

