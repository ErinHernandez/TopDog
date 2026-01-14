/**
 * Webhook Test Utilities
 * 
 * Provides utilities for testing webhook handlers across all payment providers:
 * - Stripe
 * - PayMongo
 * - Paystack
 * - Xendit
 */

const crypto = require('crypto');

// ============================================================================
// STRIPE WEBHOOK MOCKS
// ============================================================================

/**
 * Create a valid Stripe webhook signature
 */
function createStripeSignature(payload, secret, timestamp = null) {
  const ts = timestamp || Math.floor(Date.now() / 1000);
  const signedPayload = `${ts}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  return `t=${ts},v1=${signature}`;
}

/**
 * Create a Stripe webhook event
 */
function createStripeEvent(type, data, overrides = {}) {
  return {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    type,
    created: Math.floor(Date.now() / 1000),
    data: {
      object: data,
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: `req_test_${Date.now()}`,
      idempotency_key: null,
    },
    ...overrides,
  };
}

/**
 * Create Stripe payment_intent.succeeded event
 */
function createStripePaymentIntentSucceededEvent(overrides = {}) {
  const paymentIntent = {
    id: 'pi_test_123456',
    object: 'payment_intent',
    amount: 5000,
    currency: 'usd',
    status: 'succeeded',
    metadata: {
      userId: 'user-123',
    },
    ...overrides.paymentIntent,
  };
  
  return createStripeEvent('payment_intent.succeeded', paymentIntent, overrides);
}

/**
 * Create Stripe payment_intent.payment_failed event
 */
function createStripePaymentFailedEvent(overrides = {}) {
  const paymentIntent = {
    id: 'pi_test_123456',
    object: 'payment_intent',
    amount: 5000,
    currency: 'usd',
    status: 'payment_failed',
    last_payment_error: {
      type: 'card_error',
      code: 'card_declined',
      message: 'Your card was declined.',
    },
    ...overrides.paymentIntent,
  };
  
  return createStripeEvent('payment_intent.payment_failed', paymentIntent, overrides);
}

/**
 * Create Stripe payout.paid event
 */
function createStripePayoutPaidEvent(overrides = {}) {
  const payout = {
    id: 'po_test_123456',
    object: 'payout',
    amount: 10000,
    currency: 'usd',
    status: 'paid',
    metadata: {
      userId: 'user-123',
      transactionId: 'txn_123',
    },
    ...overrides.payout,
  };
  
  return createStripeEvent('payout.paid', payout, overrides);
}

// ============================================================================
// PAYMONGO WEBHOOK MOCKS
// ============================================================================

/**
 * Create a valid PayMongo webhook signature
 */
function createPayMongoSignature(payload, secret, timestamp = null) {
  const ts = timestamp || Math.floor(Date.now() / 1000);
  const signedPayload = `${ts}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  return `t=${ts},li=${signature},te=${signature}`;
}

/**
 * Create PayMongo webhook payload
 */
function createPayMongoWebhookPayload(type, data, overrides = {}) {
  return {
    data: {
      id: `evt_${Date.now()}`,
      type: 'event',
      attributes: {
        type,
        data,
        created: Math.floor(Date.now() / 1000),
        ...overrides.attributes,
      },
    },
    ...overrides,
  };
}

/**
 * Create PayMongo source.chargeable event
 */
function createPayMongoSourceChargeableEvent(overrides = {}) {
  const source = {
    id: 'src_test_123456',
    type: 'source',
    attributes: {
      type: 'gcash',
      amount: 5000,
      currency: 'PHP',
      status: 'chargeable',
      ...overrides.source,
    },
  };
  
  return createPayMongoWebhookPayload('source.chargeable', source, overrides);
}

/**
 * Create PayMongo payment.paid event
 */
function createPayMongoPaymentPaidEvent(overrides = {}) {
  const payment = {
    id: 'pay_test_123456',
    type: 'payment',
    attributes: {
      amount: 5000,
      currency: 'PHP',
      status: 'paid',
      source: {
        id: 'src_test_123456',
        type: 'gcash',
      },
      ...overrides.payment,
    },
  };
  
  return createPayMongoWebhookPayload('payment.paid', payment, overrides);
}

// ============================================================================
// PAYSTACK WEBHOOK MOCKS
// ============================================================================

/**
 * Create a valid Paystack webhook signature
 */
function createPaystackSignature(payload, secret) {
  return crypto
    .createHmac('sha512', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Create Paystack webhook payload
 */
function createPaystackWebhookPayload(event, data, overrides = {}) {
  return {
    event,
    data,
    ...overrides,
  };
}

/**
 * Create Paystack charge.success event
 */
function createPaystackChargeSuccessEvent(overrides = {}) {
  const transaction = {
    id: 123456789,
    domain: 'test',
    status: 'success',
    reference: 'ref_test_123456',
    amount: 500000, // 5000 NGN in kobo
    currency: 'NGN',
    customer: {
      id: 12345,
      email: 'user@example.com',
    },
    metadata: {
      userId: 'user-123',
    },
    ...overrides.transaction,
  };
  
  return createPaystackWebhookPayload('charge.success', transaction, overrides);
}

/**
 * Create Paystack transfer.success event
 */
function createPaystackTransferSuccessEvent(overrides = {}) {
  const transfer = {
    id: 987654321,
    domain: 'test',
    status: 'success',
    reference: 'ref_transfer_123456',
    amount: 100000, // 1000 NGN in kobo
    currency: 'NGN',
    recipient: {
      id: 54321,
      type: 'nuban',
      name: 'Test Recipient',
    },
    metadata: {
      userId: 'user-123',
      transactionId: 'txn_123',
    },
    ...overrides.transfer,
  };
  
  return createPaystackWebhookPayload('transfer.success', transfer, overrides);
}

// ============================================================================
// XENDIT WEBHOOK MOCKS
// ============================================================================

/**
 * Create Xendit webhook payload
 */
function createXenditWebhookPayload(event, data, overrides = {}) {
  return {
    id: `evt_${Date.now()}`,
    event,
    created: new Date().toISOString(),
    data,
    ...overrides,
  };
}

/**
 * Create Xendit disbursement.completed event
 */
function createXenditDisbursementCompletedEvent(overrides = {}) {
  const disbursement = {
    id: 'disb_test_123456',
    external_id: 'txn_123',
    amount: 100000, // 1000 IDR
    status: 'COMPLETED',
    bank_code: 'BCA',
    account_holder_name: 'Test User',
    account_number: '1234567890',
    ...overrides.disbursement,
  };
  
  return createXenditWebhookPayload('disbursement.completed', disbursement, overrides);
}

/**
 * Create Xendit disbursement.failed event
 */
function createXenditDisbursementFailedEvent(overrides = {}) {
  const disbursement = {
    id: 'disb_test_123456',
    external_id: 'txn_123',
    amount: 100000,
    status: 'FAILED',
    failure_code: 'INSUFFICIENT_BALANCE',
    ...overrides.disbursement,
  };
  
  return createXenditWebhookPayload('disbursement.failed', disbursement, overrides);
}

// ============================================================================
// REQUEST/RESPONSE HELPERS
// ============================================================================

/**
 * Create a webhook request with raw body
 */
function createWebhookRequest(payload, signature, signatureHeader = 'stripe-signature') {
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  
  return {
    method: 'POST',
    headers: {
      [signatureHeader]: signature,
      'content-type': 'application/json',
    },
    body: payloadString,
  };
}

/**
 * Create a buffer from string (for micro buffer())
 */
function createBufferFromString(str) {
  return Buffer.from(str);
}

module.exports = {
  // Stripe
  createStripeSignature,
  createStripeEvent,
  createStripePaymentIntentSucceededEvent,
  createStripePaymentFailedEvent,
  createStripePayoutPaidEvent,
  
  // PayMongo
  createPayMongoSignature,
  createPayMongoWebhookPayload,
  createPayMongoSourceChargeableEvent,
  createPayMongoPaymentPaidEvent,
  
  // Paystack
  createPaystackSignature,
  createPaystackWebhookPayload,
  createPaystackChargeSuccessEvent,
  createPaystackTransferSuccessEvent,
  
  // Xendit
  createXenditWebhookPayload,
  createXenditDisbursementCompletedEvent,
  createXenditDisbursementFailedEvent,
  
  // Helpers
  createWebhookRequest,
  createBufferFromString,
};
