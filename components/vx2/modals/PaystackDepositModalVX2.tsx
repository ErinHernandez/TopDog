/**
 * PaystackDepositModalVX2 - Paystack Payment Modal
 * 
 * Multi-step deposit flow for African markets:
 * 1. Amount Selection - Currency-specific quick amounts + custom
 * 2. Payment Method - Card, USSD (Nigeria), Mobile Money (Ghana/Kenya), EFT (SA)
 * 3. Processing - Handles async payment flows
 * 4. Success/Error - Result display
 * 
 * Features:
 * - Paystack Inline for card payments
 * - USSD code display with copy functionality
 * - Mobile money push notification flow
 * - Bank transfer (EFT) for South Africa
 * - Currency-aware formatting (NGN, GHS, ZAR, KES)
 * 
 * @module components/vx2/modals/PaystackDepositModalVX2
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BG_COLORS, TEXT_COLORS, STATE_COLORS, BORDER_COLORS } from '../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY, Z_INDEX } from '../core/constants/sizes';
import { Close, ChevronLeft, ChevronRight } from '../components/icons';
import {
  formatPaystackAmount,
  toSmallestUnit,
  toDisplayAmount,
  getQuickDepositAmounts,
  getPaystackCurrencyConfig,
  validatePaystackAmount,
  PAYSTACK_CURRENCIES,
} from '../../../lib/paystack/currencyConfig';
import type { PaystackCurrencyConfig } from '../../../lib/paystack/paystackTypes';
import { NIGERIAN_USSD_BANKS } from '../../../lib/paystack/paystackTypes';
import { createScopedLogger } from '../../../lib/clientLogger';
import { CurrencySelector } from '../components/CurrencySelector';
import { FXWarningBanner } from '../components/FXWarningBanner';
import { AmountStepper } from '../components/AmountStepper';
import { getCurrencyConfig, getCurrencyForCountry, toSmallestUnit as toSmallestUnitStripe } from '../../../lib/stripe/currencyConfig';
import { useStripeExchangeRate } from '../../../hooks/useStripeExchangeRate';

// Paystack-supported currency codes
const PAYSTACK_SUPPORTED_CURRENCIES = ['NGN', 'GHS', 'ZAR', 'KES'];

/**
 * Check if a currency is supported by Paystack
 */
function isPaystackCurrency(currency: string): boolean {
  return PAYSTACK_SUPPORTED_CURRENCIES.includes(currency.toUpperCase());
}

const logger = createScopedLogger('[PaystackDeposit]');

// ============================================================================
// TYPES
// ============================================================================

export interface PaystackDepositModalVX2Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  userName?: string;
  /** User's country code (NG, GH, ZA, KE) */
  userCountry: 'NG' | 'GH' | 'ZA' | 'KE';
  onSuccess?: (transactionId: string, amount: number, currency: string) => void;
}

type PaymentChannel = 'card' | 'ussd' | 'mobile_money' | 'bank_transfer';

interface PaymentMethodOption {
  id: PaymentChannel;
  name: string;
  description: string;
  icon: React.ReactNode;
  countries: string[];
}

type DepositStep = 'amount' | 'method' | 'processing' | 'ussd' | 'mobile_money' | 'success' | 'error';

interface MobileMoneyProvider {
  id: 'mtn' | 'vodafone' | 'tigo' | 'mpesa';
  name: string;
  countries: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MOBILE_MONEY_PROVIDERS: MobileMoneyProvider[] = [
  { id: 'mtn', name: 'MTN Mobile Money', countries: ['GH'] },
  { id: 'vodafone', name: 'Vodafone Cash', countries: ['GH'] },
  { id: 'tigo', name: 'AirtelTigo Money', countries: ['GH'] },
  { id: 'mpesa', name: 'M-Pesa', countries: ['KE'] },
];

const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'card',
    name: 'Card',
    description: 'Visa, Mastercard, Verve',
    icon: <CardIcon />,
    countries: ['NG', 'GH', 'ZA', 'KE'],
  },
  {
    id: 'ussd',
    name: 'USSD',
    description: 'Pay with USSD code - no internet needed',
    icon: <PhoneIcon />,
    countries: ['NG'],
  },
  {
    id: 'mobile_money',
    name: 'Mobile Money',
    description: 'MTN, Vodafone, AirtelTigo, M-Pesa',
    icon: <MobileIcon />,
    countries: ['GH', 'KE'],
  },
  {
    id: 'bank_transfer',
    name: 'Instant EFT',
    description: 'Direct bank transfer',
    icon: <BankIcon />,
    countries: ['ZA'],
  },
];

// ============================================================================
// ICONS
// ============================================================================

function CardIcon(): React.ReactElement {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function PhoneIcon(): React.ReactElement {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function MobileIcon(): React.ReactElement {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function BankIcon(): React.ReactElement {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function CopyIcon(): React.ReactElement {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function CheckIcon(): React.ReactElement {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface AmountStepProps {
  /** Amount in USD (whole dollars) */
  amountUSD: number;
  currency: string;
  /** User's geolocated local currency */
  localCurrency: string;
  /** Whether selected currency is supported by Paystack */
  isPaystackSupported: boolean;
  /** Exchange rate data */
  exchangeRate: number | null;
  rateDisplay: string | null;
  rateLoading: boolean;
  onAmountChange: (usdAmount: number) => void;
  onCurrencyChange: (currency: string) => void;
  onContinue: () => void;
}

function AmountStep({
  amountUSD,
  currency,
  localCurrency,
  isPaystackSupported,
  exchangeRate,
  rateDisplay,
  rateLoading,
  onAmountChange,
  onCurrencyChange,
  onContinue,
}: AmountStepProps): React.ReactElement {
  // Get currency config - use Stripe config for all currencies
  const stripeCurrencyConfig = useMemo(() => getCurrencyConfig(currency), [currency]);
  
  const isValid = amountUSD >= 25 && amountUSD <= 10000;
  const showFXWarning = currency !== localCurrency;
  
  return (
    <div className="space-y-6">
      {/* Currency Selector - shows ALL currencies */}
      <CurrencySelector
        selectedCurrency={currency}
        localCurrency={localCurrency}
        onSelect={onCurrencyChange}
        label="Deposit Currency"
      />
      
      {/* FX Warning Banner - when currency differs from local */}
      {showFXWarning && (
        <FXWarningBanner
          selectedCurrency={currency}
          localCurrency={localCurrency}
          dismissible={true}
        />
      )}
      
      {/* Non-Paystack Currency Notice */}
      {!isPaystackSupported && (
        <div 
          className="p-4 rounded-lg"
          style={{ 
            backgroundColor: `${STATE_COLORS.info}15`,
            border: `1px solid ${STATE_COLORS.info}40`,
          }}
        >
          <p style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, color: TEXT_COLORS.primary }}>
            {stripeCurrencyConfig.name} ({currency}) will be processed via card payment.
          </p>
          <p 
            className="mt-2"
            style={{ fontSize: `${TYPOGRAPHY.fontSize.xs}px`, color: TEXT_COLORS.secondary }}
          >
            Local payment methods (USSD, Mobile Money, EFT) are only available for NGN, GHS, ZAR, and KES.
          </p>
        </div>
      )}
      
      {/* Currency info notice - only for Paystack currencies when NOT showing FX warning */}
      {isPaystackSupported && !showFXWarning && (
        <div 
          className="p-4 rounded-lg"
          style={{ 
            backgroundColor: `${STATE_COLORS.active}15`,
            border: `1px solid ${STATE_COLORS.active}40`,
          }}
        >
          <p style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, color: TEXT_COLORS.primary }}>
            Your deposit in {stripeCurrencyConfig.name} ({stripeCurrencyConfig.symbol}) will be converted to USD at no extra cost.
          </p>
          <p 
            className="mt-2"
            style={{ fontSize: `${TYPOGRAPHY.fontSize.xs}px`, color: TEXT_COLORS.secondary }}
          >
            Your account balance is kept in USD for tournament entries.
          </p>
        </div>
      )}
      
      {/* Amount Stepper with $25 increments */}
      <AmountStepper
        amountUSD={amountUSD}
        onChange={onAmountChange}
        displayCurrency={currency}
        exchangeRate={exchangeRate}
        rateDisplay={rateDisplay}
        rateLoading={rateLoading}
        minUSD={25}
        maxUSD={10000}
      />
      
      <button
        onClick={onContinue}
        disabled={!isValid}
        className="w-full py-3 rounded-lg font-semibold transition-all"
        style={{
          backgroundColor: isValid ? STATE_COLORS.active : BG_COLORS.tertiary,
          color: isValid ? '#000' : TEXT_COLORS.muted,
          opacity: isValid ? 1 : 0.5,
        }}
      >
        Continue with ${amountUSD}
      </button>
    </div>
  );
}

interface MethodStepProps {
  country: string;
  selectedMethod: PaymentChannel | null;
  /** Whether the selected currency is supported by Paystack */
  isPaystackSupported: boolean;
  onSelectMethod: (method: PaymentChannel) => void;
  onBack: () => void;
  onContinue: () => void;
}

function MethodStep({
  country,
  selectedMethod,
  isPaystackSupported,
  onSelectMethod,
  onBack,
  onContinue,
}: MethodStepProps): React.ReactElement {
  // For non-Paystack currencies, only card is available
  const availableMethods = useMemo(() => {
    if (!isPaystackSupported) {
      // Only show card option for non-Paystack currencies
      return PAYMENT_METHODS.filter(m => m.id === 'card');
    }
    // For Paystack currencies, filter by country
    return PAYMENT_METHODS.filter(m => m.countries.includes(country));
  }, [country, isPaystackSupported]);
  
  return (
    <div className="space-y-6">
      <div>
        <h3 
          className="font-semibold mb-4"
          style={{ fontSize: `${TYPOGRAPHY.fontSize.lg}px`, color: TEXT_COLORS.primary }}
        >
          Payment Method
        </h3>
        
        {/* Notice for non-Paystack currencies */}
        {!isPaystackSupported && (
          <div 
            className="p-3 rounded-lg mb-4"
            style={{ 
              backgroundColor: `${STATE_COLORS.info}15`,
              border: `1px solid ${STATE_COLORS.info}40`,
            }}
          >
            <p style={{ fontSize: `${TYPOGRAPHY.fontSize.xs}px`, color: TEXT_COLORS.secondary }}>
              Card payment is the only option for this currency. Local payment methods are available for NGN, GHS, ZAR, and KES.
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          {availableMethods.map(method => (
            <button
              key={method.id}
              onClick={() => onSelectMethod(method.id)}
              className="w-full flex items-center gap-4 p-4 rounded-lg transition-all"
              style={{
                backgroundColor: selectedMethod === method.id 
                  ? `${STATE_COLORS.active}20` 
                  : BG_COLORS.tertiary,
                border: `1px solid ${selectedMethod === method.id 
                  ? STATE_COLORS.active 
                  : BORDER_COLORS.default}`,
              }}
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ 
                  backgroundColor: selectedMethod === method.id 
                    ? STATE_COLORS.active 
                    : `${STATE_COLORS.active}30`,
                  color: selectedMethod === method.id 
                    ? '#000' 
                    : STATE_COLORS.active,
                }}
              >
                {method.icon}
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium" style={{ color: TEXT_COLORS.primary }}>
                  {method.name}
                </p>
                <p style={{ fontSize: `${TYPOGRAPHY.fontSize.xs}px`, color: TEXT_COLORS.muted }}>
                  {method.description}
                </p>
              </div>
              {selectedMethod === method.id && (
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: STATE_COLORS.active }}
                >
                  <CheckIcon />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-lg font-medium"
          style={{
            backgroundColor: BG_COLORS.tertiary,
            color: TEXT_COLORS.primary,
            border: `1px solid ${BORDER_COLORS.default}`,
          }}
        >
          Back
        </button>
        <button
          onClick={onContinue}
          disabled={!selectedMethod}
          className="flex-1 py-3 rounded-lg font-semibold transition-all"
          style={{
            backgroundColor: selectedMethod ? STATE_COLORS.active : BG_COLORS.tertiary,
            color: selectedMethod ? '#000' : TEXT_COLORS.muted,
            opacity: selectedMethod ? 1 : 0.5,
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

interface UssdStepProps {
  ussdCode: string;
  bankName: string;
  amount: number;
  currency: string;
  onCheckStatus: () => void;
  onBack: () => void;
  isChecking: boolean;
}

function UssdStep({
  ussdCode,
  bankName,
  amount,
  currency,
  onCheckStatus,
  onBack,
  isChecking,
}: UssdStepProps): React.ReactElement {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ussdCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error('Failed to copy USSD code', err);
    }
  };
  
  return (
    <div className="space-y-6 text-center">
      <div 
        className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
        style={{ backgroundColor: `${STATE_COLORS.active}20` }}
      >
        <PhoneIcon />
      </div>
      
      <div>
        <h3 
          className="font-semibold mb-2"
          style={{ fontSize: `${TYPOGRAPHY.fontSize.xl}px`, color: TEXT_COLORS.primary }}
        >
          Dial USSD Code
        </h3>
        <p style={{ color: TEXT_COLORS.secondary }}>
          Dial the code below on your phone to complete payment
        </p>
      </div>
      
      <div 
        className="p-4 rounded-lg"
        style={{ backgroundColor: BG_COLORS.tertiary }}
      >
        <p style={{ fontSize: `${TYPOGRAPHY.fontSize.xs}px`, color: TEXT_COLORS.muted, marginBottom: '8px' }}>
          {bankName}
        </p>
        <div className="flex items-center justify-center gap-3">
          <code 
            className="text-2xl font-mono font-bold"
            style={{ color: STATE_COLORS.active }}
          >
            {ussdCode}
          </code>
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: copied ? STATE_COLORS.success : TEXT_COLORS.muted }}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>
        <p 
          className="mt-2"
          style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, color: TEXT_COLORS.secondary }}
        >
          Amount: {formatPaystackAmount(amount, currency)}
        </p>
      </div>
      
      <div 
        className="p-4 rounded-lg text-left"
        style={{ backgroundColor: `${STATE_COLORS.warning}15`, border: `1px solid ${STATE_COLORS.warning}40` }}
      >
        <p className="font-medium" style={{ color: STATE_COLORS.warning, marginBottom: '8px' }}>
          Instructions
        </p>
        <ol className="list-decimal list-inside space-y-1" style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
          <li>Dial the USSD code on your phone</li>
          <li>Follow the prompts</li>
          <li>Enter your PIN to confirm</li>
          <li>Return here and check status</li>
        </ol>
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-lg font-medium"
          style={{
            backgroundColor: BG_COLORS.tertiary,
            color: TEXT_COLORS.primary,
            border: `1px solid ${BORDER_COLORS.default}`,
          }}
        >
          Cancel
        </button>
        <button
          onClick={onCheckStatus}
          disabled={isChecking}
          className="flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          style={{
            backgroundColor: STATE_COLORS.active,
            color: '#000',
          }}
        >
          {isChecking ? (
            <>
              <span className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full" />
              Checking...
            </>
          ) : (
            'Check Status'
          )}
        </button>
      </div>
    </div>
  );
}

interface MobileMoneyStepProps {
  provider: MobileMoneyProvider | null;
  phoneNumber: string;
  amount: number;
  currency: string;
  country: string;
  onSelectProvider: (provider: MobileMoneyProvider) => void;
  onPhoneChange: (phone: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isProcessing: boolean;
  displayText?: string;
}

function MobileMoneyStep({
  provider,
  phoneNumber,
  amount,
  currency,
  country,
  onSelectProvider,
  onPhoneChange,
  onSubmit,
  onBack,
  isProcessing,
  displayText,
}: MobileMoneyStepProps): React.ReactElement {
  const availableProviders = MOBILE_MONEY_PROVIDERS.filter(p => p.countries.includes(country));
  const isValid = provider && phoneNumber.length >= 10;
  
  return (
    <div className="space-y-6">
      {displayText ? (
        // Waiting for push notification
        <div className="text-center space-y-4">
          <div 
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center animate-pulse"
            style={{ backgroundColor: `${STATE_COLORS.active}20` }}
          >
            <MobileIcon />
          </div>
          
          <div>
            <h3 
              className="font-semibold mb-2"
              style={{ fontSize: `${TYPOGRAPHY.fontSize.lg}px`, color: TEXT_COLORS.primary }}
            >
              Approve on Your Phone
            </h3>
            <p style={{ color: TEXT_COLORS.secondary }}>
              {displayText}
            </p>
          </div>
          
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: BG_COLORS.tertiary }}
          >
            <p style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, color: TEXT_COLORS.muted }}>
              Amount: {formatPaystackAmount(amount, currency)}
            </p>
            <p className="mt-1" style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, color: TEXT_COLORS.muted }}>
              Phone: {phoneNumber}
            </p>
          </div>
          
          <button
            onClick={onBack}
            className="w-full py-3 rounded-lg font-medium"
            style={{
              backgroundColor: BG_COLORS.tertiary,
              color: TEXT_COLORS.primary,
              border: `1px solid ${BORDER_COLORS.default}`,
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        // Select provider and enter phone
        <>
          <div>
            <h3 
              className="font-semibold mb-4"
              style={{ fontSize: `${TYPOGRAPHY.fontSize.lg}px`, color: TEXT_COLORS.primary }}
            >
              Mobile Money
            </h3>
            
            {/* Provider selection */}
            <p 
              className="mb-2"
              style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, color: TEXT_COLORS.secondary }}
            >
              Select provider
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {availableProviders.map(p => (
                <button
                  key={p.id}
                  onClick={() => onSelectProvider(p)}
                  className="py-3 px-4 rounded-lg font-medium transition-all"
                  style={{
                    backgroundColor: provider?.id === p.id 
                      ? STATE_COLORS.active 
                      : BG_COLORS.tertiary,
                    color: provider?.id === p.id 
                      ? '#000' 
                      : TEXT_COLORS.primary,
                    border: `1px solid ${provider?.id === p.id 
                      ? STATE_COLORS.active 
                      : BORDER_COLORS.default}`,
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
            
            {/* Phone number */}
            <p 
              className="mb-2"
              style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, color: TEXT_COLORS.secondary }}
            >
              Phone number
            </p>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder={country === 'KE' ? '0712345678' : '0241234567'}
              className="w-full py-3 px-4 rounded-lg"
              style={{
                backgroundColor: BG_COLORS.tertiary,
                color: TEXT_COLORS.primary,
                border: `1px solid ${BORDER_COLORS.default}`,
              }}
            />
            <p 
              className="mt-2"
              style={{ fontSize: `${TYPOGRAPHY.fontSize.xs}px`, color: TEXT_COLORS.muted }}
            >
              Enter the phone number linked to your {provider?.name || 'mobile money'} account
            </p>
          </div>
          
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: `${STATE_COLORS.active}15`, border: `1px solid ${STATE_COLORS.active}40` }}
          >
            <p style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, color: TEXT_COLORS.primary }}>
              A push notification will be sent to your phone. Approve it with your PIN to complete the payment.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="flex-1 py-3 rounded-lg font-medium"
              style={{
                backgroundColor: BG_COLORS.tertiary,
                color: TEXT_COLORS.primary,
                border: `1px solid ${BORDER_COLORS.default}`,
              }}
            >
              Back
            </button>
            <button
              onClick={onSubmit}
              disabled={!isValid || isProcessing}
              className="flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
              style={{
                backgroundColor: isValid && !isProcessing ? STATE_COLORS.active : BG_COLORS.tertiary,
                color: isValid && !isProcessing ? '#000' : TEXT_COLORS.muted,
                opacity: isValid && !isProcessing ? 1 : 0.5,
              }}
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full" />
                  Sending...
                </>
              ) : (
                `Pay ${formatPaystackAmount(amount, currency)}`
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

interface ResultStepProps {
  success: boolean;
  amount?: number;
  currency?: string;
  transactionId?: string;
  errorMessage?: string;
  onClose: () => void;
}

function ResultStep({
  success,
  amount,
  currency = 'NGN',
  transactionId,
  errorMessage,
  onClose,
}: ResultStepProps): React.ReactElement {
  return (
    <div className="text-center space-y-6 py-8">
      <div 
        className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
        style={{ 
          backgroundColor: success ? `${STATE_COLORS.success}20` : `${STATE_COLORS.error}20` 
        }}
      >
        {success ? (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke={STATE_COLORS.success}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke={STATE_COLORS.error}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      
      <div>
        <h3 
          className="font-semibold mb-2"
          style={{ 
            fontSize: `${TYPOGRAPHY.fontSize.xl}px`, 
            color: success ? STATE_COLORS.success : STATE_COLORS.error 
          }}
        >
          {success ? 'Deposit Successful!' : 'Deposit Failed'}
        </h3>
        
        {success && amount && (
          <>
            <p style={{ color: TEXT_COLORS.secondary }}>
              {formatPaystackAmount(amount, currency)} has been added to your balance
            </p>
            <p 
              className="mt-1"
              style={{ fontSize: `${TYPOGRAPHY.fontSize.xs}px`, color: TEXT_COLORS.muted }}
            >
              Converted to USD at no extra cost
            </p>
          </>
        )}
        
        {!success && errorMessage && (
          <p style={{ color: TEXT_COLORS.secondary }}>{errorMessage}</p>
        )}
        
        {success && transactionId && (
          <p 
            className="mt-2"
            style={{ fontSize: `${TYPOGRAPHY.fontSize.xs}px`, color: TEXT_COLORS.muted }}
          >
            Transaction ID: {transactionId}
          </p>
        )}
      </div>
      
      <button
        onClick={onClose}
        className="w-full py-3 rounded-lg font-semibold"
        style={{
          backgroundColor: STATE_COLORS.active,
          color: '#000',
        }}
      >
        {success ? 'Done' : 'Try Again'}
      </button>
    </div>
  );
}

// ============================================================================
// USSD BANK SELECTOR
// ============================================================================

interface UssdBankSelectorProps {
  selectedBank: typeof NIGERIAN_USSD_BANKS[0] | null;
  onSelectBank: (bank: typeof NIGERIAN_USSD_BANKS[0]) => void;
  onContinue: () => void;
  onBack: () => void;
  isLoading: boolean;
}

function UssdBankSelector({
  selectedBank,
  onSelectBank,
  onContinue,
  onBack,
  isLoading,
}: UssdBankSelectorProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h3 
          className="font-semibold mb-4"
          style={{ fontSize: `${TYPOGRAPHY.fontSize.lg}px`, color: TEXT_COLORS.primary }}
        >
          Select Your Bank
        </h3>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {NIGERIAN_USSD_BANKS.map(bank => (
            <button
              key={bank.code}
              onClick={() => onSelectBank(bank)}
              className="w-full flex items-center justify-between p-3 rounded-lg transition-all"
              style={{
                backgroundColor: selectedBank?.code === bank.code 
                  ? `${STATE_COLORS.active}20` 
                  : BG_COLORS.tertiary,
                border: `1px solid ${selectedBank?.code === bank.code 
                  ? STATE_COLORS.active 
                  : BORDER_COLORS.default}`,
              }}
            >
              <span style={{ color: TEXT_COLORS.primary }}>{bank.name}</span>
              <span style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
                *{bank.ussdType}#
              </span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-lg font-medium"
          style={{
            backgroundColor: BG_COLORS.tertiary,
            color: TEXT_COLORS.primary,
            border: `1px solid ${BORDER_COLORS.default}`,
          }}
        >
          Back
        </button>
        <button
          onClick={onContinue}
          disabled={!selectedBank || isLoading}
          className="flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          style={{
            backgroundColor: selectedBank && !isLoading ? STATE_COLORS.active : BG_COLORS.tertiary,
            color: selectedBank && !isLoading ? '#000' : TEXT_COLORS.muted,
            opacity: selectedBank && !isLoading ? 1 : 0.5,
          }}
        >
          {isLoading ? (
            <>
              <span className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full" />
              Loading...
            </>
          ) : (
            'Continue'
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PaystackDepositModalVX2({
  isOpen,
  onClose,
  userId,
  userEmail,
  userName,
  userCountry,
  onSuccess,
}: PaystackDepositModalVX2Props): React.ReactElement | null {
  // User's geolocated local currency - use Stripe's getCurrencyForCountry for consistency
  const localCurrencyCode = useMemo(() => getCurrencyForCountry(userCountry), [userCountry]);
  
  // Selected currency (can differ from local if user changes it)
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>(localCurrencyCode);
  
  // Check if selected currency is supported by Paystack
  const isPaystackSupported = useMemo(() => isPaystackCurrency(selectedCurrencyCode), [selectedCurrencyCode]);
  
  // Currency config for selected currency (Paystack config if supported, otherwise null)
  const paystackCurrency = useMemo(() => {
    if (isPaystackSupported) {
      return PAYSTACK_CURRENCIES[selectedCurrencyCode as keyof typeof PAYSTACK_CURRENCIES] || null;
    }
    return null;
  }, [selectedCurrencyCode, isPaystackSupported]);
  
  // Stripe currency config (used for all currencies)
  const stripeCurrencyConfig = useMemo(() => getCurrencyConfig(selectedCurrencyCode), [selectedCurrencyCode]);
  
  const currencyCode = selectedCurrencyCode;
  
  // Get exchange rate for the selected currency
  const { 
    rate: exchangeRate, 
    rateDisplay, 
    loading: rateLoading,
    toLocal,
  } = useStripeExchangeRate(selectedCurrencyCode);
  
  // Handle currency change
  const handleCurrencyChange = useCallback((newCurrency: string) => {
    logger.debug('Paystack modal currency changed', { from: selectedCurrencyCode, to: newCurrency, isPaystack: isPaystackCurrency(newCurrency) });
    setSelectedCurrencyCode(newCurrency);
    // Amount stays in USD, no need to reset
  }, [selectedCurrencyCode]);
  
  // State - store amount in USD for consistency
  const [step, setStep] = useState<DepositStep>('amount');
  const [amountUSD, setAmountUSD] = useState(50); // Default $50 USD
  const [selectedMethod, setSelectedMethod] = useState<PaymentChannel | null>(null);
  const [selectedBank, setSelectedBank] = useState<typeof NIGERIAN_USSD_BANKS[0] | null>(null);
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState<MobileMoneyProvider | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [ussdCode, setUssdCode] = useState<string | null>(null);
  const [displayText, setDisplayText] = useState<string | null>(null);
  const [showBankSelector, setShowBankSelector] = useState(false);
  
  // Calculate the amount in smallest currency units for payment
  const selectedAmount = useMemo(() => {
    // Convert USD to local currency, then to smallest units
    const localAmount = toLocal(amountUSD);
    return toSmallestUnitStripe(localAmount, currencyCode);
  }, [amountUSD, toLocal, currencyCode]);
  
  // Handle USD amount change from stepper
  const handleAmountChange = useCallback((usdAmount: number) => {
    setAmountUSD(usdAmount);
  }, []);
  
  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('amount');
      setSelectedCurrencyCode(localCurrencyCode);
      setAmountUSD(50); // Default $50 USD
      setSelectedMethod(null);
      setSelectedBank(null);
      setMobileMoneyProvider(null);
      setPhoneNumber('');
      setError(null);
      setTransactionId(null);
      setReference(null);
      setUssdCode(null);
      setDisplayText(null);
      setShowBankSelector(false);
    }
  }, [isOpen, localCurrencyCode]);
  
  // Initialize card payment (opens Paystack popup for Paystack currencies, Stripe for others)
  const initializeCardPayment = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isPaystackSupported) {
        // Use Paystack for supported currencies
        const response = await fetch('/api/paystack/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amountSmallestUnit: selectedAmount,
            currency: currencyCode,
            userId,
            email: userEmail,
            country: userCountry,
            channel: 'card',
          }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.ok) {
          throw new Error(data.error?.message || 'Failed to initialize payment');
        }
        
        setTransactionId(data.data.transactionId);
        setReference(data.data.reference);
        
        // Open Paystack popup
        if (data.data.authorizationUrl) {
          window.location.href = data.data.authorizationUrl;
        }
      } else {
        // Use Stripe for non-Paystack currencies
        const response = await fetch('/api/stripe/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amountCents: selectedAmount,
            currency: currencyCode,
            country: userCountry,
            userId,
            email: userEmail,
            paymentMethodTypes: ['card'],
          }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.ok) {
          throw new Error(data.error?.message || 'Failed to initialize payment');
        }
        
        // For Stripe, we need to redirect to a checkout page or open Stripe Elements
        // For now, redirect to Stripe's hosted checkout
        if (data.data?.checkoutUrl) {
          window.location.href = data.data.checkoutUrl;
        } else if (data.data?.clientSecret) {
          // Store client secret and redirect to Stripe checkout page
          // This could also open a modal with Stripe Elements
          const checkoutUrl = `/deposit/checkout?secret=${encodeURIComponent(data.data.clientSecret)}&amount=${selectedAmount}&currency=${currencyCode}`;
          window.location.href = checkoutUrl;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment initialization failed';
      logger.error('Card payment init failed', err);
      setError(message);
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAmount, currencyCode, userId, userEmail, userCountry, isPaystackSupported]);
  
  // Initialize USSD payment
  const initializeUssdPayment = useCallback(async () => {
    if (!selectedBank) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountSmallestUnit: selectedAmount,
          currency: currencyCode,
          userId,
          email: userEmail,
          country: userCountry,
          channel: 'ussd',
          ussdType: selectedBank.ussdType,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(data.error?.message || 'Failed to initialize USSD payment');
      }
      
      setTransactionId(data.data.transactionId);
      setReference(data.data.reference);
      setUssdCode(data.data.ussdCode || `*${selectedBank.ussdType}*${selectedAmount}#`);
      setStep('ussd');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'USSD initialization failed';
      logger.error('USSD payment init failed', err);
      setError(message);
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAmount, currencyCode, userId, userEmail, userCountry, selectedBank]);
  
  // Poll payment status
  const pollPaymentStatus = useCallback(async (ref: string, attempts: number = 0) => {
    if (attempts >= 30) { // Max 5 minutes (30 * 10s)
      setError('Payment verification timed out. Please check your transaction history.');
      setStep('error');
      return;
    }

    try {
      const response = await fetch(`/api/paystack/verify?reference=${ref}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.ok && data.data?.status === 'success') {
        setStep('success');
        onSuccess?.(transactionId || ref, selectedAmount, currencyCode);
        return;
      }

      if (data.data?.status === 'failed') {
        setError(data.data.gatewayResponse || 'Payment failed');
        setStep('error');
        return;
      }

      // Still pending, poll again
      setTimeout(() => pollPaymentStatus(ref, attempts + 1), 10000);
    } catch (err) {
      logger.error('Status poll failed', err);
      // Continue polling
      setTimeout(() => pollPaymentStatus(ref, attempts + 1), 10000);
    }
  }, [onSuccess, selectedAmount, currencyCode, transactionId]);

  // Initialize mobile money payment
  const initializeMobileMoneyPayment = useCallback(async () => {
    if (!mobileMoneyProvider || !phoneNumber) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountSmallestUnit: selectedAmount,
          currency: currencyCode,
          userId,
          email: userEmail,
          country: userCountry,
          channel: 'mobile_money',
          mobileMoneyPhone: phoneNumber,
          mobileMoneyProvider: mobileMoneyProvider.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error?.message || 'Failed to initialize mobile money payment');
      }

      setTransactionId(data.data.transactionId);
      setReference(data.data.reference);
      setDisplayText(data.data.displayText || 'Please approve the payment on your phone');

      // Start polling for status
      pollPaymentStatus(data.data.reference);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Mobile money initialization failed';
      logger.error('Mobile money payment init failed', err);
      setError(message);
      setStep('error');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedAmount, currencyCode, userId, userEmail, userCountry, mobileMoneyProvider, phoneNumber, pollPaymentStatus]);
  
  // Check USSD status manually
  const checkUssdStatus = useCallback(async () => {
    if (!reference) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/paystack/verify?reference=${reference}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.ok && data.data?.status === 'success') {
        setStep('success');
        onSuccess?.(transactionId || reference, selectedAmount, currencyCode);
      } else if (data.data?.status === 'failed') {
        setError(data.data.gatewayResponse || 'Payment failed');
        setStep('error');
      } else {
        // Still pending
        setError('Payment not yet completed. Please dial the USSD code and try again.');
      }
    } catch (err) {
      logger.error('Status check failed', err);
      setError('Failed to check status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, reference, selectedAmount, currencyCode, transactionId]);
  
  // Handle method continue
  const handleMethodContinue = useCallback(() => {
    if (!selectedMethod) return;

    switch (selectedMethod) {
      case 'card':
        setStep('processing');
        initializeCardPayment();
        break;
      case 'ussd':
        setShowBankSelector(true);
        break;
      case 'mobile_money':
        setStep('mobile_money');
        break;
      case 'bank_transfer':
        // Redirect to Paystack for EFT
        setStep('processing');
        initializeCardPayment(); // Uses same flow with different channel
        break;
    }
  }, [selectedMethod, initializeCardPayment, setStep, setShowBankSelector]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: Z_INDEX.modal }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md rounded-xl overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: BG_COLORS.secondary }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b sticky top-0"
          style={{ 
            borderColor: BORDER_COLORS.default,
            backgroundColor: BG_COLORS.secondary,
          }}
        >
          <div className="flex items-center gap-3">
            {step !== 'amount' && step !== 'success' && step !== 'error' && !showBankSelector && (
              <button
                onClick={() => {
                  if (step === 'method') setStep('amount');
                  else if (step === 'ussd' || step === 'mobile_money') setStep('method');
                }}
                className="p-1 rounded hover:bg-white/10"
              >
                <span style={{ color: TEXT_COLORS.primary, display: 'inline-block' }}>
                  <ChevronLeft className="w-5 h-5" />
                </span>
              </button>
            )}
            {showBankSelector && (
              <button
                onClick={() => setShowBankSelector(false)}
                className="p-1 rounded hover:bg-white/10"
              >
                <span style={{ color: TEXT_COLORS.primary, display: 'inline-block' }}>
                  <ChevronLeft className="w-5 h-5" />
                </span>
              </button>
            )}
            <h2 
              className="font-semibold"
              style={{ fontSize: `${TYPOGRAPHY.fontSize.lg}px`, color: TEXT_COLORS.primary }}
            >
              Deposit Funds
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10"
          >
            <span style={{ color: TEXT_COLORS.muted, display: 'inline-block' }}>
              <Close className="w-5 h-5" />
            </span>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {step === 'amount' && (
            <AmountStep
              amountUSD={amountUSD}
              currency={currencyCode}
              localCurrency={localCurrencyCode}
              isPaystackSupported={isPaystackSupported}
              exchangeRate={exchangeRate}
              rateDisplay={rateDisplay}
              rateLoading={rateLoading}
              onAmountChange={handleAmountChange}
              onCurrencyChange={handleCurrencyChange}
              onContinue={() => setStep('method')}
            />
          )}
          
          {step === 'method' && !showBankSelector && (
            <MethodStep
              country={userCountry}
              selectedMethod={selectedMethod}
              isPaystackSupported={isPaystackSupported}
              onSelectMethod={setSelectedMethod}
              onBack={() => setStep('amount')}
              onContinue={handleMethodContinue}
            />
          )}
          
          {step === 'method' && showBankSelector && (
            <UssdBankSelector
              selectedBank={selectedBank}
              onSelectBank={setSelectedBank}
              onContinue={initializeUssdPayment}
              onBack={() => setShowBankSelector(false)}
              isLoading={isLoading}
            />
          )}
          
          {step === 'processing' && (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-white/20 border-t-white rounded-full mx-auto mb-4" />
              <p style={{ color: TEXT_COLORS.primary }}>Preparing payment...</p>
            </div>
          )}
          
          {step === 'ussd' && ussdCode && (
            <UssdStep
              ussdCode={ussdCode}
              bankName={selectedBank?.name || 'Your Bank'}
              amount={selectedAmount}
              currency={currencyCode}
              onCheckStatus={checkUssdStatus}
              onBack={() => {
                setStep('method');
                setShowBankSelector(true);
              }}
              isChecking={isLoading}
            />
          )}
          
          {step === 'mobile_money' && (
            <MobileMoneyStep
              provider={mobileMoneyProvider}
              phoneNumber={phoneNumber}
              amount={selectedAmount}
              currency={currencyCode}
              country={userCountry}
              onSelectProvider={setMobileMoneyProvider}
              onPhoneChange={setPhoneNumber}
              onSubmit={initializeMobileMoneyPayment}
              onBack={() => setStep('method')}
              isProcessing={isProcessing}
              displayText={displayText || undefined}
            />
          )}
          
          {(step === 'success' || step === 'error') && (
            <ResultStep
              success={step === 'success'}
              amount={selectedAmount}
              currency={currencyCode}
              transactionId={transactionId || undefined}
              errorMessage={error || undefined}
              onClose={() => {
                if (step === 'error') {
                  setStep('method');
                  setError(null);
                } else {
                  onClose();
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default PaystackDepositModalVX2;

