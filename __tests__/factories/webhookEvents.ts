/**
 * Webhook Event Factories
 *
 * Creates realistic webhook payloads for testing payment integrations.
 * Supports all four payment providers: Stripe, Paystack, PayMongo, Xendit
 */

import crypto from 'crypto';

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Generate a random ID with optional prefix
 */
export function randomId(prefix: string = ''): string {
  const id = crypto.randomBytes(12).toString('hex');
  return prefix ? `${prefix}_${id}` : id;
}

/**
 * Generate a timestamp (Unix seconds)
 */
export function timestamp(offsetSeconds: number = 0): number {
  return Math.floor(Date.now() / 1000) + offsetSeconds;
}

/**
 * Generate ISO timestamp
 */
export function isoTimestamp(offsetMs: number = 0): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

// ============================================================================
// STRIPE FACTORIES
// ============================================================================

export const stripeFactories = {
  /**
   * Create Stripe webhook signature
   */
  createSignature(payload: string, secret: string): string {
    const ts = timestamp();
    const signedPayload = `${ts}.${payload}`;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');
    return `t=${ts},v1=${signature}`;
  },

  /**
   * payment_intent.succeeded event
   */
  paymentIntentSucceeded(overrides: Record<string, unknown> = {}) {
    const paymentIntentId = randomId('pi');
    const customerId = randomId('cus');
    const paymentMethodId = randomId('pm');

    return {
      id: randomId('evt'),
      object: 'event',
      type: 'payment_intent.succeeded',
      created: timestamp(),
      livemode: false,
      api_version: '2025-07-30.basil',
      data: {
        object: {
          id: paymentIntentId,
          object: 'payment_intent',
          amount: 5000,
          currency: 'usd',
          status: 'succeeded',
          customer: customerId,
          payment_method: paymentMethodId,
          metadata: {
            firebaseUserId: randomId('user'),
            ...((overrides.metadata as Record<string, unknown>) || {}),
          },
          created: timestamp(-60),
          ...overrides,
        },
      },
      pending_webhooks: 1,
      request: {
        id: randomId('req'),
        idempotency_key: randomId('idem'),
      },
    };
  },

  /**
   * payment_intent.payment_failed event
   */
  paymentIntentFailed(overrides: Record<string, unknown> = {}) {
    return {
      id: randomId('evt'),
      object: 'event',
      type: 'payment_intent.payment_failed',
      created: timestamp(),
      livemode: false,
      api_version: '2025-07-30.basil',
      data: {
        object: {
          id: randomId('pi'),
          object: 'payment_intent',
          amount: 5000,
          currency: 'usd',
          status: 'requires_payment_method',
          last_payment_error: {
            code: 'card_declined',
            message: 'Your card was declined.',
            type: 'card_error',
          },
          metadata: {
            firebaseUserId: randomId('user'),
          },
          ...overrides,
        },
      },
      pending_webhooks: 1,
    };
  },

  /**
   * transfer.created event (payout initiated)
   */
  transferCreated(overrides: Record<string, unknown> = {}) {
    return {
      id: randomId('evt'),
      object: 'event',
      type: 'transfer.created',
      created: timestamp(),
      livemode: false,
      api_version: '2025-07-30.basil',
      data: {
        object: {
          id: randomId('tr'),
          object: 'transfer',
          amount: 10000,
          currency: 'usd',
          destination: randomId('acct'),
          metadata: {
            firebaseUserId: randomId('user'),
          },
          ...overrides,
        },
      },
      pending_webhooks: 1,
    };
  },

  /**
   * transfer.failed event
   */
  transferFailed(overrides: Record<string, unknown> = {}) {
    return {
      id: randomId('evt'),
      object: 'event',
      type: 'transfer.failed',
      created: timestamp(),
      livemode: false,
      api_version: '2025-07-30.basil',
      data: {
        object: {
          id: randomId('tr'),
          object: 'transfer',
          amount: 10000,
          currency: 'usd',
          destination: randomId('acct'),
          metadata: {
            firebaseUserId: randomId('user'),
          },
          ...overrides,
        },
      },
      pending_webhooks: 1,
    };
  },

  /**
   * charge.dispute.created event
   */
  disputeCreated(overrides: Record<string, unknown> = {}) {
    const chargeId = randomId('ch');
    const paymentIntentId = (overrides.paymentIntent as string) || randomId('pi');

    return {
      id: randomId('evt'),
      object: 'event',
      type: 'charge.dispute.created',
      created: timestamp(),
      livemode: false,
      api_version: '2025-07-30.basil',
      data: {
        object: {
          id: randomId('dp'),
          object: 'dispute',
          amount: 5000,
          currency: 'usd',
          reason: 'fraudulent',
          status: 'needs_response',
          charge: {
            id: chargeId,
            object: 'charge',
            payment_intent: paymentIntentId,
          },
          ...overrides,
        },
      },
      pending_webhooks: 1,
    };
  },

  /**
   * charge.refunded event
   */
  chargeRefunded(overrides: Record<string, unknown> = {}) {
    return {
      id: randomId('evt'),
      object: 'event',
      type: 'charge.refunded',
      created: timestamp(),
      livemode: false,
      api_version: '2025-07-30.basil',
      data: {
        object: {
          id: randomId('ch'),
          object: 'charge',
          amount: 5000,
          amount_refunded: 5000,
          currency: 'usd',
          payment_intent: randomId('pi'),
          refunded: true,
          ...overrides,
        },
      },
      pending_webhooks: 1,
    };
  },
};

// ============================================================================
// PAYSTACK FACTORIES
// ============================================================================

export const paystackFactories = {
  /**
   * Create Paystack webhook signature
   */
  createSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha512', secret)
      .update(payload)
      .digest('hex');
  },

  /**
   * charge.success event
   */
  chargeSuccess(overrides: Record<string, unknown> = {}) {
    return {
      event: 'charge.success',
      data: {
        id: Math.floor(Math.random() * 1000000000),
        reference: randomId('ref'),
        amount: 500000, // Amount in kobo (NGN)
        currency: 'NGN',
        status: 'success',
        gateway_response: 'Successful',
        channel: 'card',
        customer: {
          id: Math.floor(Math.random() * 1000000),
          email: `user${randomId()}@example.com`,
          customer_code: randomId('CUS'),
        },
        metadata: {
          firebaseUserId: randomId('user'),
          ...((overrides.metadata as Record<string, unknown>) || {}),
        },
        paid_at: isoTimestamp(),
        created_at: isoTimestamp(-60000),
        ...overrides,
      },
    };
  },

  /**
   * charge.failed event
   */
  chargeFailed(overrides: Record<string, unknown> = {}) {
    return {
      event: 'charge.failed',
      data: {
        id: Math.floor(Math.random() * 1000000000),
        reference: randomId('ref'),
        amount: 500000,
        currency: 'NGN',
        status: 'failed',
        gateway_response: 'Declined',
        channel: 'card',
        metadata: {
          firebaseUserId: randomId('user'),
        },
        ...overrides,
      },
    };
  },

  /**
   * transfer.success event
   */
  transferSuccess(overrides: Record<string, unknown> = {}) {
    return {
      event: 'transfer.success',
      data: {
        id: Math.floor(Math.random() * 1000000000),
        transfer_code: randomId('TRF'),
        amount: 500000,
        currency: 'NGN',
        status: 'success',
        recipient: {
          recipient_code: randomId('RCP'),
        },
        metadata: {
          firebaseUserId: randomId('user'),
        },
        ...overrides,
      },
    };
  },

  /**
   * transfer.failed event
   */
  transferFailed(overrides: Record<string, unknown> = {}) {
    return {
      event: 'transfer.failed',
      data: {
        id: Math.floor(Math.random() * 1000000000),
        transfer_code: randomId('TRF'),
        amount: 500000,
        currency: 'NGN',
        status: 'failed',
        reason: 'Could not process transfer',
        metadata: {
          firebaseUserId: randomId('user'),
        },
        ...overrides,
      },
    };
  },

  /**
   * transfer.reversed event
   */
  transferReversed(overrides: Record<string, unknown> = {}) {
    return {
      event: 'transfer.reversed',
      data: {
        id: Math.floor(Math.random() * 1000000000),
        transfer_code: randomId('TRF'),
        amount: 500000,
        currency: 'NGN',
        status: 'reversed',
        metadata: {
          firebaseUserId: randomId('user'),
        },
        ...overrides,
      },
    };
  },
};

// ============================================================================
// PAYMONGO FACTORIES
// ============================================================================

export const paymongoFactories = {
  /**
   * Create PayMongo webhook signature
   */
  createSignature(payload: string, secret: string, timestamp: number): string {
    const signedPayload = `${timestamp}.${payload}`;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');
    return `t=${timestamp},te=,li=${signature}`;
  },

  /**
   * payment.paid event
   */
  paymentPaid(overrides: Record<string, unknown> = {}) {
    return {
      data: {
        id: randomId('evt'),
        type: 'event',
        attributes: {
          type: 'payment.paid',
          livemode: false,
          data: {
            id: randomId('pay'),
            type: 'payment',
            attributes: {
              amount: 50000, // Amount in centavos (PHP)
              currency: 'PHP',
              status: 'paid',
              source: {
                type: 'gcash',
              },
              metadata: {
                firebaseUserId: randomId('user'),
                ...((overrides.metadata as Record<string, unknown>) || {}),
              },
              paid_at: Math.floor(Date.now() / 1000),
              ...overrides,
            },
          },
          created_at: Math.floor(Date.now() / 1000),
        },
      },
    };
  },

  /**
   * payment.failed event
   */
  paymentFailed(overrides: Record<string, unknown> = {}) {
    return {
      data: {
        id: randomId('evt'),
        type: 'event',
        attributes: {
          type: 'payment.failed',
          livemode: false,
          data: {
            id: randomId('pay'),
            type: 'payment',
            attributes: {
              amount: 50000,
              currency: 'PHP',
              status: 'failed',
              metadata: {
                firebaseUserId: randomId('user'),
              },
              ...overrides,
            },
          },
          created_at: Math.floor(Date.now() / 1000),
        },
      },
    };
  },
};

// ============================================================================
// XENDIT FACTORIES
// ============================================================================

export const xenditFactories = {
  /**
   * Create Xendit webhook signature (callback token validation)
   */
  createSignature(callbackToken: string): string {
    return callbackToken;
  },

  /**
   * Virtual Account paid callback
   */
  virtualAccountPaid(overrides: Record<string, unknown> = {}) {
    return {
      id: randomId(''),
      external_id: randomId('va'),
      user_id: randomId('user'),
      is_high: false,
      status: 'COMPLETED',
      bank_code: 'BCA',
      account_number: '1234567890',
      name: 'Test User',
      amount: 500000, // IDR
      transaction_timestamp: isoTimestamp(),
      payment_id: randomId('pay'),
      merchant_code: '12345',
      currency: 'IDR',
      metadata: {
        firebaseUserId: randomId('user'),
        ...((overrides.metadata as Record<string, unknown>) || {}),
      },
      ...overrides,
    };
  },

  /**
   * E-wallet payment completed callback
   */
  ewalletCompleted(overrides: Record<string, unknown> = {}) {
    return {
      data: {
        id: randomId('ewc'),
        business_id: randomId('biz'),
        reference_id: randomId('ref'),
        status: 'SUCCEEDED',
        currency: 'IDR',
        charge_amount: 500000,
        capture_amount: 500000,
        channel_code: 'ID_OVO',
        channel_properties: {
          mobile_number: '+628123456789',
        },
        metadata: {
          firebaseUserId: randomId('user'),
          ...((overrides.metadata as Record<string, unknown>) || {}),
        },
        created: isoTimestamp(-60000),
        updated: isoTimestamp(),
        ...overrides,
      },
      event: 'ewallet.capture',
    };
  },

  /**
   * Disbursement completed callback
   */
  disbursementCompleted(overrides: Record<string, unknown> = {}) {
    return {
      id: randomId('disb'),
      external_id: randomId('ext'),
      user_id: randomId('user'),
      amount: 500000,
      bank_code: 'BCA',
      account_holder_name: 'Test User',
      status: 'COMPLETED',
      disbursement_description: 'Withdrawal',
      metadata: {
        firebaseUserId: randomId('user'),
      },
      ...overrides,
    };
  },

  /**
   * Disbursement failed callback
   */
  disbursementFailed(overrides: Record<string, unknown> = {}) {
    return {
      id: randomId('disb'),
      external_id: randomId('ext'),
      user_id: randomId('user'),
      amount: 500000,
      bank_code: 'BCA',
      account_holder_name: 'Test User',
      status: 'FAILED',
      failure_code: 'INVALID_DESTINATION',
      metadata: {
        firebaseUserId: randomId('user'),
      },
      ...overrides,
    };
  },
};

// ============================================================================
// COMBINED EXPORTS
// ============================================================================

export const webhookFactories = {
  stripe: stripeFactories,
  paystack: paystackFactories,
  paymongo: paymongoFactories,
  xendit: xenditFactories,
  utils: {
    randomId,
    timestamp,
    isoTimestamp,
  },
};

export default webhookFactories;
