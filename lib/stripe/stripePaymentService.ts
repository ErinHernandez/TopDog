/**
 * Stripe Payment Service
 *
 * Manages payment intents and setup intents for deposits and payment method management.
 */

import Stripe from 'stripe';

import { requireAppUrl } from '../envHelpers';
import { captureError } from '../errorTracking';

import {
  getCurrencyConfig,
  validateAmount,
  isZeroDecimalCurrency,
} from './currencyConfig';
import { getStripeInstance } from './stripeInstance';
import type {
  CreatePaymentIntentRequest,
  PaymentIntentResponse,
  CreateSetupIntentRequest,
  SetupIntentResponse,
} from './stripeTypes';

/**
 * Create a PaymentIntent for a deposit
 *
 * Supports multiple currencies with currency-specific validation.
 * Zero-decimal currencies (JPY, KRW, VND) are handled correctly.
 */
export async function createPaymentIntent(
  request: CreatePaymentIntentRequest
): Promise<PaymentIntentResponse> {
  const stripe = getStripeInstance();
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
      params.return_url = `${requireAppUrl()}/deposit/complete`;
    }

    // Create with idempotency key if provided
    const paymentIntent = await stripe.paymentIntents.create(
      params,
      idempotencyKey ? { idempotencyKey } : undefined
    );

    // Stripe always returns client_secret for PaymentIntent, but handle gracefully if missing
    if (!paymentIntent.client_secret) {
      throw new Error('PaymentIntent missing client_secret - cannot proceed with payment');
    }

    // Build response with next action info for async payments
    const response: PaymentIntentResponse = {
      clientSecret: paymentIntent.client_secret,
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

/**
 * Create a SetupIntent for saving a payment method without charging
 */
export async function createSetupIntent(
  request: CreateSetupIntentRequest
): Promise<SetupIntentResponse> {
  const stripe = getStripeInstance();
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

    // Stripe always returns client_secret for SetupIntent, but handle gracefully if missing
    if (!setupIntent.client_secret) {
      throw new Error('SetupIntent missing client_secret - cannot proceed with setup');
    }

    return {
      clientSecret: setupIntent.client_secret,
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
