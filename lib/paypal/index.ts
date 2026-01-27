/**
 * PayPal Module Index
 *
 * Export all PayPal-related functionality
 */

// Client
export {
  getPayPalAccessToken,
  paypalApiRequest,
  verifyPayPalWebhookSignature,
  centsToPayPalAmount,
  paypalAmountToCents,
  isPayPalEnabled,
  getPayPalMode,
  getPayPalConfig,
} from './paypalClient';

// Types
export type {
  CreatePayPalOrderRequest,
  PayPalOrderResponse,
  PayPalCaptureResult,
  PayPalOrder,
  PayPalOrderStatus,
  PayPalTransaction,
  PayPalRiskContext,
  PayPalRiskAssessment,
  LinkedPayPalAccount,
  WithdrawalRequest,
  WithdrawalResponse,
  WithdrawalSecurityTier,
  WithdrawalStatus,
  PendingWithdrawal,
  HeldWithdrawal,
  SupportReviewWithdrawal,
  PayPalPayoutRequest,
  PayPalPayoutResponse,
  PayPalOAuthState,
  PayPalUserInfo,
  PayPalWebhookEventType,
  WebhookProcessingResult,
} from './paypalTypes';

export {
  PAYPAL_DEPOSIT_LIMITS,
  PAYPAL_WITHDRAWAL_LIMITS,
  PAYPAL_ERROR_MESSAGES,
  getPayPalErrorMessage,
} from './paypalTypes';

// Service
export {
  createPayPalOrder,
  capturePayPalOrder,
  getPayPalOrder,
  refundPayPalCapture,
  createPayPalTransaction,
  updatePayPalTransactionStatus,
  updateUserBalance,
  assessPaymentRisk,
  logPaymentEvent,
  getWithdrawalCountLast24Hours,
  checkWithdrawalLimitWarning,
} from './paypalService';

// OAuth
export {
  getPayPalOAuthUrl,
  handlePayPalOAuthCallback,
  verifyAndConsumeOAuthState,
  getLinkedPayPalAccounts,
  getLinkedPayPalAccount,
  getPrimaryLinkedPayPalAccount,
  setPrimaryLinkedAccount,
  unlinkPayPalAccount,
} from './paypalOAuth';

// Withdrawals
export {
  requestWithdrawal,
  confirmWithdrawal,
  cancelHeldWithdrawal,
  processHeldWithdrawal,
  getSecurityTier,
} from './paypalWithdrawals';
