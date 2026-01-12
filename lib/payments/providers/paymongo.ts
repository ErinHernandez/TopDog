/**
 * PayMongo Payment Provider
 * 
 * Implements the PaymentProvider interface for PayMongo.
 * Handles GCash, Maya, GrabPay, and card payments in the Philippines.
 * 
 * @module lib/payments/providers/paymongo
 */

import type {
  PaymentProvider,
  PaymentProviderName,
  PaymentMethod,
  CreatePaymentRequest,
  CreatePaymentResponse,
  CreateTransferRequest,
  CreateTransferResponse,
  TransactionStatus,
} from '../types';
import {
  PAYMONGO_PAYMENT_METHODS,
  PAYMONGO_COUNTRIES,
} from '../types';
import {
  createSource,
  createPayment,
  createPayout,
  verifyPayment,
  verifyWebhookSignature as verifyPayMongoWebhookSignature,
  createPayMongoTransaction,
  getSavedBankAccounts,
  generateReference,
} from '../../paymongo';
import { toDisplayAmount } from '../../paymongo/currencyConfig';
import type { PayMongoSourceType } from '../../paymongo/paymongoTypes';

// ============================================================================
// PROVIDER IMPLEMENTATION
// ============================================================================

/**
 * PayMongo payment provider implementation
 */
class PayMongoProvider implements PaymentProvider {
  readonly name: PaymentProviderName = 'paymongo';
  
  /**
   * Get countries supported by PayMongo
   */
  getSupportedCountries(): string[] {
    return [...PAYMONGO_COUNTRIES];
  }
  
  /**
   * Get currencies supported by PayMongo
   */
  getSupportedCurrencies(): string[] {
    return ['PHP'];
  }
  
  /**
   * Get payment methods available for a country
   */
  getPaymentMethodsForCountry(country: string): PaymentMethod[] {
    if (!PAYMONGO_COUNTRIES.includes(country as typeof PAYMONGO_COUNTRIES[number])) {
      return [];
    }
    return PAYMONGO_PAYMENT_METHODS.filter((m: PaymentMethod) => m.countries.includes(country));
  }
  
  /**
   * Create a payment (deposit)
   */
  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    try {
      // Determine source type from payment method
      const sourceType = this.getSourceType(request.paymentMethodType);
      
      if (!sourceType) {
        // For card payments, we would use a different flow
        // For now, return error
        return {
          success: false,
          error: 'Unsupported payment method',
        };
      }
      
      // Generate reference
      const reference = generateReference('DEP');
      
      // Build redirect URLs
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://topdog.gg';
      const successUrl = request.successUrl || `${baseUrl}/deposit/paymongo/callback?status=success`;
      const failureUrl = request.failureUrl || `${baseUrl}/deposit/paymongo/callback?status=failed`;
      
      // Create source for e-wallet payments
      const result = await createSource({
        userId: request.userId,
        amount: request.amountSmallestUnit,
        currency: request.currency,
        type: sourceType,
        redirect: {
          success: successUrl,
          failed: failureUrl,
        },
        billing: {
          email: request.email,
        },
        metadata: {
          firebaseUserId: request.userId,
          reference,
          ...(request.metadata || {}),
        },
      });
      
      // Create pending transaction
      const transaction = await createPayMongoTransaction({
        userId: request.userId,
        type: 'deposit',
        amountSmallestUnit: request.amountSmallestUnit,
        currency: request.currency,
        status: 'pending',
        provider: 'paymongo',
        providerReference: result.sourceId,
        paymentMethodType: sourceType,
        actionUrl: result.checkoutUrl,
        description: `Deposit via ${this.getPaymentMethodName(sourceType)}`,
        metadata: {
          paymongoSourceId: result.sourceId,
          reference,
        },
      });
      
      return {
        success: true,
        transactionId: transaction.id,
        providerReference: result.sourceId,
        authorizationUrl: result.checkoutUrl,
        status: 'pending',
      };
      
    } catch (error: unknown) {
      console.error('[PayMongoProvider] createPayment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment',
      };
    }
  }
  
  /**
   * Verify a payment
   */
  async verifyPayment(reference: string): Promise<{
    success: boolean;
    status: TransactionStatus;
    error?: string;
  }> {
    try {
      const result = await verifyPayment(reference);
      return {
        success: result.success,
        status: result.status,
        error: result.error,
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
   * Create a transfer (withdrawal/payout)
   */
  async createTransfer(request: CreateTransferRequest): Promise<CreateTransferResponse> {
    try {
      // Get saved bank accounts
      const savedAccounts = await getSavedBankAccounts(request.userId);
      const account = savedAccounts.find(a => a.id === request.recipientId);
      
      if (!account) {
        return {
          success: false,
          error: 'Bank account not found',
        };
      }
      
      // Generate reference
      const reference = generateReference('WTH');
      
      // Create payout
      const result = await createPayout({
        userId: request.userId,
        amount: request.amountSmallestUnit,
        currency: request.currency,
        bank_code: account.bankCode,
        account_number: account.accountNumber,
        account_holder_name: account.accountHolderName,
        description: request.reason || 'Withdrawal',
        metadata: {
          firebaseUserId: request.userId,
          reference,
          ...(request.metadata || {}),
        },
      });
      
      // Create transaction
      const transaction = await createPayMongoTransaction({
        userId: request.userId,
        type: 'withdrawal',
        amountSmallestUnit: request.amountSmallestUnit,
        currency: request.currency,
        status: 'pending',
        provider: 'paymongo',
        providerReference: result.payoutId,
        description: 'Withdrawal to bank account',
        metadata: {
          paymongoPayoutId: result.payoutId,
          reference,
          bankCode: account.bankCode,
          accountNumberMasked: account.accountNumberMasked,
        },
      });
      
      return {
        success: true,
        transactionId: transaction.id,
        providerTransferId: result.payoutId,
        status: 'pending',
      };
      
    } catch (error: unknown) {
      console.error('[PayMongoProvider] createTransfer error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create transfer',
      };
    }
  }
  
  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): boolean {
    return verifyPayMongoWebhookSignature(payload, signature);
  }
  
  // ============================================================================
  // HELPER METHODS
  // ============================================================================
  
  /**
   * Get PayMongo source type from payment method
   */
  private getSourceType(paymentMethodType?: string): PayMongoSourceType | null {
    switch (paymentMethodType) {
      case 'paymongo_gcash':
      case 'gcash':
        return 'gcash';
      case 'paymongo_maya':
      case 'maya':
      case 'paymaya':
        return 'paymaya';
      case 'paymongo_grabpay':
      case 'grab_pay':
      case 'grabpay':
        return 'grab_pay';
      default:
        return null;
    }
  }
  
  /**
   * Get display name for payment method
   */
  private getPaymentMethodName(type: PayMongoSourceType): string {
    switch (type) {
      case 'gcash':
        return 'GCash';
      case 'paymaya':
        return 'Maya';
      case 'grab_pay':
        return 'GrabPay';
      default:
        return type;
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * PayMongo provider singleton instance
 */
export const paymongoProvider = new PayMongoProvider();

export default paymongoProvider;


