/**
 * Paystack Provider Implementation
 * 
 * Implements the PaymentProvider interface for Paystack.
 * 
 * @module lib/payments/providers/paystack
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
import { PAYSTACK_PAYMENT_METHODS, PAYSTACK_COUNTRIES } from '../types';
import {
  initializeTransaction,
  verifyTransaction,
  initiateTransfer,
  createPaystackTransaction,
  verifyWebhookSignature,
  generateReference,
} from '../../paystack/paystackService';
import { isPaystackCurrency, validatePaystackAmount } from '../../paystack/currencyConfig';

/**
 * Paystack payment provider implementation
 */
export const paystackProvider: PaymentProvider = {
  name: 'paystack',
  
  getSupportedCountries(): string[] {
    return [...PAYSTACK_COUNTRIES];
  },
  
  getSupportedCurrencies(): string[] {
    return ['NGN', 'GHS', 'ZAR', 'KES'];
  },
  
  getPaymentMethodsForCountry(country: string): PaymentMethod[] {
    return PAYSTACK_PAYMENT_METHODS.filter((m: PaymentMethod) => m.countries.includes(country));
  },
  
  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    const {
      amountSmallestUnit,
      currency,
      userId,
      email,
      paymentMethodType,
      metadata,
    } = request;
    
    // Validate currency
    if (!isPaystackCurrency(currency)) {
      return {
        success: false,
        error: `Currency ${currency} is not supported by Paystack`,
      };
    }
    
    // Validate amount
    const validation = validatePaystackAmount(amountSmallestUnit, currency);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      };
    }
    
    // Generate reference
    const reference = generateReference('TD');
    
    try {
      // Determine channels based on payment method type
      let channels: ('card' | 'bank' | 'ussd' | 'mobile_money' | 'bank_transfer')[] = ['card'];
      
      if (paymentMethodType?.includes('ussd')) {
        channels = ['ussd'];
      } else if (paymentMethodType?.includes('mobile_money') || paymentMethodType?.includes('mpesa')) {
        channels = ['mobile_money'];
      } else if (paymentMethodType?.includes('bank')) {
        channels = ['bank', 'bank_transfer'];
      }
      
      // Initialize transaction
      const result = await initializeTransaction({
        amount: amountSmallestUnit,
        email: email || '',
        currency: currency as 'NGN' | 'GHS' | 'ZAR' | 'KES',
        reference,
        channels,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/deposit/paystack/callback`,
        metadata: {
          custom_fields: Object.entries(metadata || {}).map(([key, value]: [string, unknown]) => ({
            display_name: key,
            variable_name: key,
            value: typeof value === 'string' || typeof value === 'number' ? value : String(value),
          })),
        },
        userId,
      });
      
      // Create pending transaction record
      const transaction = await createPaystackTransaction({
        userId,
        type: 'deposit',
        amountSmallestUnit,
        currency,
        status: 'pending',
        provider: 'paystack',
        providerReference: reference,
        paymentMethodType: paymentMethodType || 'card',
        description: 'Deposit via Paystack',
      });
      
      return {
        success: true,
        transactionId: transaction.id,
        providerReference: reference,
        clientSecret: result.accessCode,
        authorizationUrl: result.authorizationUrl,
        status: 'pending',
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize payment',
      };
    }
  },
  
  async verifyPayment(reference: string): Promise<{
    success: boolean;
    status: TransactionStatus;
    error?: string;
  }> {
    return verifyTransaction(reference);
  },
  
  async createTransfer(request: CreateTransferRequest): Promise<CreateTransferResponse> {
    const {
      amountSmallestUnit,
      currency,
      userId,
      recipientId,
      reason,
      idempotencyKey,
      metadata,
    } = request;
    
    try {
      // Create pending transaction record first
      const transaction = await createPaystackTransaction({
        userId,
        type: 'withdrawal',
        amountSmallestUnit: -amountSmallestUnit, // Negative for withdrawals
        currency,
        status: 'pending',
        provider: 'paystack',
        description: reason || 'Withdrawal via Paystack',
        metadata: {
          recipientId,
          ...metadata,
        },
      });
      
      // Initiate transfer
      const result = await initiateTransfer({
        source: 'balance',
        amount: amountSmallestUnit,
        recipient: recipientId,
        reason,
        reference: idempotencyKey || generateReference('TRF'),
        userId,
      });
      
      // Map Paystack transfer status to our unified status
      // Paystack can return: 'pending', 'success', 'failed', 'reversed', 'queued', 'processing'
      let mappedStatus: 'completed' | 'pending' | 'failed';
      switch (result.status) {
        case 'success':
          mappedStatus = 'completed';
          break;
        case 'failed':
        case 'reversed':
          mappedStatus = 'failed';
          break;
        case 'pending':
        case 'queued':
        case 'processing':
        default:
          mappedStatus = 'pending';
          break;
      }
      
      return {
        success: true,
        transactionId: transaction.id,
        providerTransferId: result.transferCode,
        status: mappedStatus,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate transfer',
      };
    }
  },
  
  verifyWebhookSignature(payload: string | Buffer, signature: string): boolean {
    return verifyWebhookSignature(payload, signature);
  },
};

export default paystackProvider;

