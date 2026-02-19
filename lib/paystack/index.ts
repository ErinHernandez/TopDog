/**
 * Paystack Module
 * 
 * Exports all Paystack-related functionality.
 * 
 * @module lib/paystack
 */

// Types
export * from './paystackTypes';

// Currency utilities
export * from './currencyConfig';

// Service operations
export {
  // Transaction operations
  initializeTransaction,
  verifyTransaction,
  chargeUssd,
  chargeMobileMoney,
  
  // Transfer operations
  createTransferRecipient,
  initiateTransfer,
  getTransferStatus,
  
  // Bank operations
  listBanks,
  resolveAccountNumber,
  
  // Customer operations
  getOrCreateCustomer,
  
  // Webhook handling
  verifyWebhookSignature,
  handleChargeSuccess,
  handleChargeFailed,
  handleTransferSuccess,
  handleTransferFailed,
  
  // Transaction record operations
  createPaystackTransaction,
  updateTransactionStatus,
  findTransactionByReference,
  findTransactionByTransferCode,

  // Webhook event tracking (replay protection)
  findWebhookEventByReference,
  markWebhookEventAsProcessed,
  markWebhookEventAsFailed,
  createOrUpdateWebhookEvent,

  // Utilities
  generateReference,
  PAYSTACK_PUBLIC_KEY,
} from './paystackService';

