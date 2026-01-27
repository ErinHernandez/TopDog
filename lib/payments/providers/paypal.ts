/**
 * PayPal Payment Provider
 *
 * Implements the PaymentProvider interface for PayPal integration.
 * This provides a unified interface for the payment routing system.
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
import {
  createPayPalOrder,
  capturePayPalOrder,
  isPayPalEnabled,
  verifyPayPalWebhookSignature,
  getPayPalOrder,
  PAYPAL_DEPOSIT_LIMITS,
} from '../../paypal';
import { serverLogger } from '../../logger/serverLogger';

/**
 * PayPal payment methods
 */
const PAYPAL_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'paypal',
    name: 'PayPal',
    category: 'wallet',
    provider: 'paypal' as any, // Type will be added to PaymentProviderName
    countries: ['US'], // Currently US only per plan
    currencies: ['USD'],
    isAsync: false,
    icon: 'paypal',
    description: 'Pay with your PayPal account',
  },
];

/**
 * PayPal Payment Provider Implementation
 */
class PayPalProvider implements PaymentProvider {
  readonly name = 'paypal' as any; // Type will be added to PaymentProviderName

  /**
   * Get countries supported by PayPal
   */
  getSupportedCountries(): string[] {
    return ['US']; // Currently US only
  }

  /**
   * Get currencies supported by PayPal
   */
  getSupportedCurrencies(): string[] {
    return ['USD'];
  }

  /**
   * Get available payment methods for a country
   */
  getPaymentMethodsForCountry(country: string): PaymentMethod[] {
    if (country === 'US' && isPayPalEnabled()) {
      return PAYPAL_PAYMENT_METHODS;
    }
    return [];
  }

  /**
   * Create a PayPal payment (order)
   */
  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    const {
      amountSmallestUnit,
      currency,
      userId,
      idempotencyKey,
      metadata,
    } = request;

    // Validate currency
    if (currency !== 'USD') {
      return {
        success: false,
        error: 'PayPal only supports USD payments',
      };
    }

    // Validate amount
    if (amountSmallestUnit < PAYPAL_DEPOSIT_LIMITS.minAmountCents) {
      return {
        success: false,
        error: `Minimum deposit is $${PAYPAL_DEPOSIT_LIMITS.minAmountCents / 100}`,
      };
    }

    if (amountSmallestUnit > PAYPAL_DEPOSIT_LIMITS.maxAmountCents) {
      return {
        success: false,
        error: `Maximum deposit is $${PAYPAL_DEPOSIT_LIMITS.maxAmountCents / 100}`,
      };
    }

    try {
      const order = await createPayPalOrder({
        amountCents: amountSmallestUnit,
        currency: 'USD',
        userId,
        idempotencyKey,
        metadata,
      });

      return {
        success: true,
        transactionId: order.orderId,
        providerReference: order.orderId,
        authorizationUrl: order.approvalUrl,
        status: 'pending' as TransactionStatus,
      };
    } catch (error) {
      serverLogger.error('PayPal createPayment error', error as Error, { userId });

      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Verify a PayPal payment
   */
  async verifyPayment(
    reference: string
  ): Promise<{ success: boolean; status: TransactionStatus; error?: string }> {
    try {
      const order = await getPayPalOrder(reference);

      if (!order) {
        return {
          success: false,
          status: 'failed',
          error: 'Order not found',
        };
      }

      // Map PayPal status to our status
      let status: TransactionStatus;
      switch (order.status) {
        case 'COMPLETED':
          status = 'completed';
          break;
        case 'APPROVED':
          status = 'requires_action';
          break;
        case 'CREATED':
        case 'SAVED':
        case 'PAYER_ACTION_REQUIRED':
          status = 'pending';
          break;
        case 'VOIDED':
          status = 'cancelled';
          break;
        default:
          status = 'pending';
      }

      return {
        success: status === 'completed',
        status,
      };
    } catch (error) {
      serverLogger.error('PayPal verifyPayment error', error as Error, { reference });

      return {
        success: false,
        status: 'failed',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Create a PayPal transfer (payout)
   *
   * Note: PayPal payouts are handled separately via the withdrawal system
   * which includes security tiers. This method is for the generic interface.
   */
  async createTransfer(request: CreateTransferRequest): Promise<CreateTransferResponse> {
    // PayPal transfers/payouts are handled by the withdrawal system
    // which includes security tiers and additional validation
    return {
      success: false,
      error: 'Use the withdrawal API for PayPal payouts',
    };
  }

  /**
   * Verify PayPal webhook signature
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): boolean {
    // PayPal webhook verification is more complex and requires the full headers
    // This is handled in the webhook handler directly
    // This method is provided for interface compatibility
    serverLogger.warn('PayPal webhook verification requires full headers, use verifyPayPalWebhookSignature');
    return false;
  }
}

// Export singleton instance
export const paypalProvider = new PayPalProvider();

// Export types
export { PAYPAL_PAYMENT_METHODS };
