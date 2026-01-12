/**
 * Xendit Payment Provider
 * 
 * Implements the PaymentProvider interface for Xendit.
 * Handles Virtual Accounts and E-Wallets in Indonesia.
 * 
 * @module lib/payments/providers/xendit
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
  XENDIT_PAYMENT_METHODS,
  XENDIT_COUNTRIES,
} from '../types';
import {
  createVirtualAccount,
  createEWalletCharge,
  createDisbursement,
  verifyWebhookToken,
  createXenditTransaction,
  getSavedDisbursementAccounts,
  generateReference,
  mapXenditStatus,
  getEWalletCharge,
} from '../../xendit';
import type { XenditBankCode, XenditEWalletChannel } from '../../xendit/xenditTypes';

// ============================================================================
// PROVIDER IMPLEMENTATION
// ============================================================================

/**
 * Xendit payment provider implementation
 */
class XenditProvider implements PaymentProvider {
  readonly name: PaymentProviderName = 'xendit';
  
  /**
   * Get countries supported by Xendit
   */
  getSupportedCountries(): string[] {
    return [...XENDIT_COUNTRIES];
  }
  
  /**
   * Get currencies supported by Xendit
   */
  getSupportedCurrencies(): string[] {
    return ['IDR'];
  }
  
  /**
   * Get payment methods available for a country
   */
  getPaymentMethodsForCountry(country: string): PaymentMethod[] {
    if (!XENDIT_COUNTRIES.includes(country as typeof XENDIT_COUNTRIES[number])) {
      return [];
    }
    return XENDIT_PAYMENT_METHODS.filter((m: PaymentMethod) => m.countries.includes(country));
  }
  
  /**
   * Create a payment (deposit)
   */
  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    try {
      const reference = generateReference('DEP');
      
      // Determine if this is a Virtual Account or E-Wallet payment
      const paymentType = this.getPaymentType(request.paymentMethodType);
      
      if (paymentType === 'virtual_account') {
        return await this.createVAPayment(request, reference);
      } else if (paymentType === 'ewallet') {
        return await this.createEWalletPayment(request, reference);
      } else {
        return {
          success: false,
          error: 'Unsupported payment method',
        };
      }
      
    } catch (error: unknown) {
      console.error('[XenditProvider] createPayment error:', error);
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
      // For e-wallet charges, we can verify via API
      const charge = await getEWalletCharge(reference);
      return {
        success: charge.status === 'SUCCEEDED',
        status: mapXenditStatus(charge.status),
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
   * Create a transfer (withdrawal/disbursement)
   */
  async createTransfer(request: CreateTransferRequest): Promise<CreateTransferResponse> {
    try {
      // Get saved disbursement accounts
      const savedAccounts = await getSavedDisbursementAccounts(request.userId);
      const account = savedAccounts.find(a => a.id === request.recipientId);
      
      if (!account) {
        return {
          success: false,
          error: 'Disbursement account not found',
        };
      }
      
      // Generate reference
      const reference = generateReference('DIS');
      
      // Create disbursement
      const result = await createDisbursement({
        userId: request.userId,
        external_id: reference,
        amount: request.amountSmallestUnit, // IDR has no decimals
        bank_code: account.channelCode,
        account_number: account.accountNumber,
        account_holder_name: account.accountHolderName,
        description: request.reason || 'TopDog Withdrawal',
      });
      
      // Create transaction
      const transaction = await createXenditTransaction({
        userId: request.userId,
        type: 'withdrawal',
        amountSmallestUnit: request.amountSmallestUnit,
        currency: request.currency,
        status: 'pending',
        provider: 'xendit',
        providerReference: result.disbursementId,
        description: 'Withdrawal to bank account',
        metadata: {
          xenditDisbursementId: result.disbursementId,
          reference,
          bankCode: account.channelCode,
          accountNumberMasked: account.accountNumberMasked,
        },
      });
      
      return {
        success: true,
        transactionId: transaction.id,
        providerTransferId: result.disbursementId,
        status: 'pending',
      };
      
    } catch (error: unknown) {
      console.error('[XenditProvider] createTransfer error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create transfer',
      };
    }
  }
  
  /**
   * Verify webhook signature/token
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): boolean {
    return verifyWebhookToken(signature);
  }
  
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  
  /**
   * Create Virtual Account payment
   */
  private async createVAPayment(
    request: CreatePaymentRequest,
    reference: string
  ): Promise<CreatePaymentResponse> {
    const bankCode = this.getBankCode(request.paymentMethodType);
    
    if (!bankCode) {
      return {
        success: false,
        error: 'Invalid bank code',
      };
    }
    
    // Calculate expiration (24 hours)
    const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // Create Virtual Account
    const result = await createVirtualAccount({
      userId: request.userId,
      external_id: reference,
      bank_code: bankCode,
      name: request.email || 'TopDog User', // Use email as name fallback
      expected_amount: request.amountSmallestUnit,
      is_single_use: true,
      is_closed: true,
      expiration_date: expirationDate.toISOString(),
    });
    
    // Create pending transaction
    const transaction = await createXenditTransaction({
      userId: request.userId,
      type: 'deposit',
      amountSmallestUnit: request.amountSmallestUnit,
      currency: request.currency,
      status: 'pending',
      provider: 'xendit',
      providerReference: result.virtualAccountId,
      paymentMethodType: `va_${bankCode.toLowerCase()}`,
      actionUrl: result.accountNumber,
      expiresAt: expirationDate.toISOString(),
      description: `Deposit via ${bankCode} Virtual Account`,
      metadata: {
        xenditVAId: result.virtualAccountId,
        bankCode: result.bankCode,
        accountNumber: result.accountNumber,
        reference,
      },
    });
    
    return {
      success: true,
      transactionId: transaction.id,
      providerReference: result.virtualAccountId,
      virtualAccountNumber: result.accountNumber,
      virtualAccountBank: result.bankCode,
      status: 'pending',
      expiresAt: expirationDate.toISOString(),
    };
  }
  
  /**
   * Create E-Wallet payment
   */
  private async createEWalletPayment(
    request: CreatePaymentRequest,
    reference: string
  ): Promise<CreatePaymentResponse> {
    const channelCode = this.getEWalletChannel(request.paymentMethodType);
    
    if (!channelCode) {
      return {
        success: false,
        error: 'Invalid e-wallet channel',
      };
    }
    
    // Build redirect URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://topdog.gg';
    const successUrl = request.successUrl || `${baseUrl}/deposit/xendit/callback?status=success`;
    const failureUrl = request.failureUrl || `${baseUrl}/deposit/xendit/callback?status=failed`;
    
    // Build channel properties
    const channelProperties: Record<string, string> = {
      success_redirect_url: successUrl,
      failure_redirect_url: failureUrl,
    };
    
    // Add mobile number for OVO
    if (request.phone && channelCode === 'ID_OVO') {
      let phone = request.phone.replace(/\D/g, '');
      if (phone.startsWith('0')) {
        phone = '62' + phone.substring(1);
      }
      if (!phone.startsWith('62')) {
        phone = '62' + phone;
      }
      channelProperties.mobile_number = '+' + phone;
    }
    
    // Create e-wallet charge
    const result = await createEWalletCharge({
      userId: request.userId,
      reference_id: reference,
      currency: 'IDR',
      amount: request.amountSmallestUnit,
      checkout_method: 'ONE_TIME_PAYMENT',
      channel_code: channelCode,
      channel_properties: channelProperties,
      metadata: {
        firebaseUserId: request.userId,
        reference,
      },
    });
    
    // Create pending transaction
    const transaction = await createXenditTransaction({
      userId: request.userId,
      type: 'deposit',
      amountSmallestUnit: request.amountSmallestUnit,
      currency: request.currency,
      status: 'pending',
      provider: 'xendit',
      providerReference: result.chargeId,
      paymentMethodType: channelCode.toLowerCase(),
      actionUrl: result.checkoutUrl || result.mobileDeeplink,
      description: `Deposit via ${channelCode.replace('ID_', '')}`,
      metadata: {
        xenditChargeId: result.chargeId,
        channelCode,
        reference,
      },
    });
    
    return {
      success: true,
      transactionId: transaction.id,
      providerReference: result.chargeId,
      authorizationUrl: result.checkoutUrl,
      qrCodeString: result.qrString,
      status: 'pending',
    };
  }
  
  /**
   * Determine payment type from method
   */
  private getPaymentType(paymentMethodType?: string): 'virtual_account' | 'ewallet' | null {
    if (!paymentMethodType) return null;
    
    const method = paymentMethodType.toLowerCase();
    
    if (method.includes('va_') || method.includes('virtual')) {
      return 'virtual_account';
    }
    
    if (method.includes('id_') || 
        ['ovo', 'gopay', 'dana', 'shopeepay', 'linkaja'].some(w => method.includes(w))) {
      return 'ewallet';
    }
    
    return null;
  }
  
  /**
   * Get bank code from payment method
   */
  private getBankCode(paymentMethodType?: string): XenditBankCode | null {
    if (!paymentMethodType) return null;
    
    const method = paymentMethodType.toLowerCase();
    
    if (method.includes('bca')) return 'BCA';
    if (method.includes('mandiri')) return 'MANDIRI';
    if (method.includes('bni')) return 'BNI';
    if (method.includes('bri')) return 'BRI';
    if (method.includes('permata')) return 'PERMATA';
    
    return null;
  }
  
  /**
   * Get e-wallet channel from payment method
   */
  private getEWalletChannel(paymentMethodType?: string): XenditEWalletChannel | null {
    if (!paymentMethodType) return null;
    
    const method = paymentMethodType.toLowerCase();
    
    if (method.includes('ovo') || method === 'id_ovo') return 'ID_OVO';
    if (method.includes('gopay') || method === 'id_gopay') return 'ID_GOPAY';
    if (method.includes('dana') || method === 'id_dana') return 'ID_DANA';
    if (method.includes('shopeepay') || method === 'id_shopeepay') return 'ID_SHOPEEPAY';
    if (method.includes('linkaja') || method === 'id_linkaja') return 'ID_LINKAJA';
    
    return null;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Xendit provider singleton instance
 */
export const xenditProvider = new XenditProvider();

export default xenditProvider;


