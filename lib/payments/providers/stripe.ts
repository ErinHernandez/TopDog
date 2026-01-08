/**
 * Stripe Provider Implementation
 * 
 * Wraps existing Stripe service to implement PaymentProvider interface.
 * 
 * @module lib/payments/providers/stripe
 */

import type {
  PaymentProvider,
  PaymentMethod,
  CreatePaymentRequest,
  CreatePaymentResponse,
  CreateTransferRequest,
  CreateTransferResponse,
  TransactionStatus,
} from '../types';
import { STRIPE_PAYMENT_METHODS } from '../types';
import {
  createPaymentIntent,
  createPayout,
  createTransaction,
} from '../../stripe/stripeService';
import { getCurrencyConfig, validateAmount } from '../../stripe/currencyConfig';
import Stripe from 'stripe';

// Stripe instance for webhook verification
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe | null {
  if (!STRIPE_SECRET_KEY) return null;
  if (!stripeInstance) {
    stripeInstance = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-07-30.basil',
    });
  }
  return stripeInstance;
}

/**
 * Stripe payment provider implementation
 */
export const stripeProvider: PaymentProvider = {
  name: 'stripe',
  
  getSupportedCountries(): string[] {
    // Stripe supports most countries globally
    return ['*']; // Wildcard indicates global support
  },
  
  getSupportedCurrencies(): string[] {
    // Major currencies supported
    return [
      'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK',
      'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'NZD', 'SGD', 'HKD', 'MXN',
      'BRL', 'MYR', 'THB', 'PHP', 'INR',
    ];
  },
  
  getPaymentMethodsForCountry(country: string): PaymentMethod[] {
    return STRIPE_PAYMENT_METHODS.filter(
      m => m.countries.includes('*') || m.countries.includes(country)
    );
  },
  
  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    const {
      amountSmallestUnit,
      currency,
      userId,
      email,
      country,
      savePaymentMethod,
      idempotencyKey,
      metadata,
    } = request;
    
    try {
      // Validate amount
      const validation = validateAmount(amountSmallestUnit, currency);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }
      
      // Create payment intent
      const result = await createPaymentIntent({
        amountCents: amountSmallestUnit,
        currency,
        userId,
        userCountry: country,
        paymentMethodTypes: ['card', 'link'], // Default to card and link
        savePaymentMethod,
        idempotencyKey,
        metadata,
      });
      
      // Create transaction record
      const transaction = await createTransaction({
        userId,
        type: 'deposit',
        amountCents: amountSmallestUnit,
        currency,
        stripePaymentIntentId: result.paymentIntentId,
        description: 'Deposit via Stripe',
      });
      
      return {
        success: true,
        transactionId: transaction.id,
        providerReference: result.paymentIntentId,
        clientSecret: result.clientSecret,
        status: mapStripeStatus(result.status),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment',
      };
    }
  },
  
  async verifyPayment(reference: string): Promise<{
    success: boolean;
    status: TransactionStatus;
    error?: string;
  }> {
    const stripe = getStripe();
    if (!stripe) {
      return { success: false, status: 'failed', error: 'Stripe not configured' };
    }
    
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(reference);
      const status = mapStripeStatus(paymentIntent.status);
      
      return {
        success: paymentIntent.status === 'succeeded',
        status,
      };
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  },
  
  async createTransfer(request: CreateTransferRequest): Promise<CreateTransferResponse> {
    const {
      amountSmallestUnit,
      currency,
      userId,
      reason,
      idempotencyKey,
      metadata,
    } = request;
    
    try {
      const result = await createPayout({
        userId,
        amountCents: amountSmallestUnit,
        currency,
        description: reason,
        idempotencyKey,
        metadata,
      });
      
      // Create transaction record
      const transaction = await createTransaction({
        userId,
        type: 'withdrawal',
        amountCents: -amountSmallestUnit, // Negative for withdrawals
        currency,
        stripeTransferId: result.payoutId,
        description: reason || 'Withdrawal via Stripe',
      });
      
      return {
        success: true,
        transactionId: transaction.id,
        providerTransferId: result.payoutId,
        status: result.status === 'paid' ? 'completed' : 'pending',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create transfer',
      };
    }
  },
  
  verifyWebhookSignature(payload: string | Buffer, signature: string): boolean {
    const stripe = getStripe();
    if (!stripe || !STRIPE_WEBHOOK_SECRET) return false;
    
    try {
      stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
      return true;
    } catch {
      return false;
    }
  },
};

/**
 * Map Stripe payment intent status to unified status
 */
function mapStripeStatus(stripeStatus: Stripe.PaymentIntent.Status): TransactionStatus {
  switch (stripeStatus) {
    case 'succeeded':
      return 'completed';
    case 'canceled':
      return 'cancelled';
    case 'processing':
      return 'processing';
    case 'requires_action':
    case 'requires_confirmation':
    case 'requires_payment_method':
      return 'requires_action';
    default:
      return 'pending';
  }
}

export default stripeProvider;

