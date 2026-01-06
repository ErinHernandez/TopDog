/**
 * DepositModalVX2 - Stripe Payment Modal
 * 
 * Multi-step deposit flow with Stripe Elements:
 * 1. Amount Selection - Quick amounts + custom
 * 2. Payment Method - Saved cards or add new
 * 3. Confirmation - Review and submit
 * 4. Processing - Loading with 3DS handling
 * 5. Success/Error - Result display
 * 
 * Features:
 * - Stripe PaymentElement for secure card input
 * - Saved payment method selection
 * - Option to save new cards
 * - Risk assessment integration
 * - Responsive design
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useStripe, useElements, PaymentElement, ExpressCheckoutElement } from '@stripe/react-stripe-js';
import type { StripeExpressCheckoutElementConfirmEvent, AvailablePaymentMethods } from '@stripe/stripe-js';
import { BG_COLORS, TEXT_COLORS, STATE_COLORS, BORDER_COLORS } from '../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY, Z_INDEX } from '../core/constants/sizes';
import { Close, ChevronLeft, Plus } from '../components/icons';
import { formatSmallestUnit, toSmallestUnit, toDisplayAmount } from '../utils/formatting';
import { StripeProvider } from '../providers/StripeProvider';
import { createScopedLogger } from '../../../lib/clientLogger';
import { getCurrencyConfig, getCurrencyForCountry } from '../../../lib/stripe/currencyConfig';
import { VoucherStep, type VoucherInfo, type AsyncPaymentType } from './VoucherStep';
import { CurrencySelector } from '../components/CurrencySelector';
import { FXWarningBanner } from '../components/FXWarningBanner';
import { AmountStepper } from '../components/AmountStepper';
import { useStripeExchangeRate } from '../../../hooks/useStripeExchangeRate';

const logger = createScopedLogger('[DepositModal]');

// ============================================================================
// TYPES
// ============================================================================

export interface DepositModalVX2Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  userName?: string;
  /** User's country code (ISO 3166-1 alpha-2, e.g., 'US', 'GB', 'DE') */
  userCountry?: string;
  onSuccess?: (transactionId: string, amount: number, currency: string) => void;
}

interface SavedPaymentMethod {
  id: string;
  type: 'card';
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

interface WalletAvailability {
  applePay: boolean;
  googlePay: boolean;
}

type DepositStep = 'amount' | 'method' | 'confirm' | 'processing' | 'voucher' | 'success' | 'error';

// ============================================================================
// CONSTANTS
// ============================================================================

const QUICK_AMOUNTS = [25, 50, 100, 250, 500, 1000];
const MIN_AMOUNT = 5;
const MAX_AMOUNT = 10000;

// ============================================================================
// CARD BRAND ICONS
// ============================================================================

function CardBrandIcon({ brand }: { brand: string }): React.ReactElement {
  const brandColors: Record<string, string> = {
    visa: '#1A1F71',
    mastercard: '#EB001B',
    amex: '#006FCF',
    discover: '#FF6000',
  };
  
  const color = brandColors[brand.toLowerCase()] || TEXT_COLORS.muted;
  
  return (
    <div 
      className="w-8 h-5 rounded flex items-center justify-center text-xs font-bold"
      style={{ backgroundColor: color, color: '#fff' }}
    >
      {brand.slice(0, 4).toUpperCase()}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface AmountStepProps {
  /** Amount in USD (whole dollars, not cents) */
  amountUSD: number;
  /** Selected display currency */
  currency: string;
  /** User's geolocated local currency */
  localCurrency: string;
  /** Exchange rate data */
  exchangeRate: number | null;
  rateDisplay: string | null;
  rateLoading: boolean;
  /** Whether this is a non-USD deposit (shows currency exchange notice) */
  showCurrencyExchangeNotice: boolean;
  /** Callbacks */
  onAmountChange: (usdAmount: number) => void;
  onCurrencyChange: (currency: string) => void;
  onContinue: () => void;
}

function AmountStep({
  amountUSD,
  currency,
  localCurrency,
  exchangeRate,
  rateDisplay,
  rateLoading,
  showCurrencyExchangeNotice,
  onAmountChange,
  onCurrencyChange,
  onContinue,
}: AmountStepProps): React.ReactElement {
  const isValid = amountUSD >= 25 && amountUSD <= 10000;
  const showFXWarning = currency !== localCurrency;
  
  return (
    <div className="space-y-6">
      {/* Currency Selector */}
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
      
      {/* Currency Exchange Notice for non-USD deposits */}
      {showCurrencyExchangeNotice && !showFXWarning && (
        <div 
          className="p-4 rounded-lg"
          style={{ 
            backgroundColor: `${STATE_COLORS.info}15`,
            border: `1px solid ${STATE_COLORS.info}40`,
          }}
        >
          <p style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, color: TEXT_COLORS.primary }}>
            Your deposit will be converted to USD at no extra cost to you. 
            Your account balance is always kept in USD.
          </p>
          <p 
            className="mt-2"
            style={{ fontSize: `${TYPOGRAPHY.fontSize.xs}px`, color: TEXT_COLORS.secondary }}
          >
            When you withdraw, we will ask your preferred currency and convert free of charge.
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
  savedMethods: SavedPaymentMethod[];
  selectedMethodId: string | null;
  useNewCard: boolean;
  saveNewCard: boolean;
  walletAvailability: WalletAvailability;
  amount: number;
  onSelectMethod: (id: string) => void;
  onUseNewCard: () => void;
  onToggleSaveCard: () => void;
  onBack: () => void;
  onContinue: () => void;
  onExpressCheckoutConfirm: (event: StripeExpressCheckoutElementConfirmEvent) => void;
  onWalletReady: (availability: WalletAvailability) => void;
  isLoading: boolean;
}

function MethodStep({
  savedMethods,
  selectedMethodId,
  useNewCard,
  saveNewCard,
  walletAvailability,
  amount,
  onSelectMethod,
  onUseNewCard,
  onToggleSaveCard,
  onBack,
  onContinue,
  onExpressCheckoutConfirm,
  onWalletReady,
  isLoading,
}: MethodStepProps): React.ReactElement {
  const canContinue = selectedMethodId || useNewCard;
  const hasWallets = walletAvailability.applePay || walletAvailability.googlePay;
  
  return (
    <div className="space-y-6">
      <div>
        <h3 
          className="font-semibold mb-4"
          style={{ fontSize: `${TYPOGRAPHY.fontSize.lg}px`, color: TEXT_COLORS.primary }}
        >
          Payment Method
        </h3>
        
        {/* Express Checkout - Apple Pay / Google Pay */}
        <div className="mb-4">
          <ExpressCheckoutElement
            options={{
              wallets: {
                applePay: 'auto',
                googlePay: 'auto',
              },
              buttonType: {
                applePay: 'plain',
                googlePay: 'plain',
              },
              buttonTheme: {
                applePay: 'black',
                googlePay: 'black',
              },
              buttonHeight: 48,
            }}
            onConfirm={onExpressCheckoutConfirm}
            onReady={({ availablePaymentMethods }) => {
              onWalletReady({
                applePay: availablePaymentMethods?.applePay ?? false,
                googlePay: availablePaymentMethods?.googlePay ?? false,
              });
            }}
          />
        </div>
        
        {/* Divider - only show if wallets are available */}
        {hasWallets && (
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ backgroundColor: BORDER_COLORS.default }} />
            <span style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>or pay with</span>
            <div className="flex-1 h-px" style={{ backgroundColor: BORDER_COLORS.default }} />
          </div>
        )}
        
        {/* Saved Payment Methods */}
        {savedMethods.length > 0 && (
          <div className="space-y-2 mb-4">
            <p 
              className="mb-2"
              style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, color: TEXT_COLORS.secondary }}
            >
              Saved cards
            </p>
            {savedMethods.map(method => (
              <button
                key={method.id}
                onClick={() => onSelectMethod(method.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg transition-all"
                style={{
                  backgroundColor: selectedMethodId === method.id 
                    ? `${STATE_COLORS.active}20` 
                    : BG_COLORS.tertiary,
                  border: `1px solid ${selectedMethodId === method.id 
                    ? STATE_COLORS.active 
                    : BORDER_COLORS.default}`,
                }}
              >
                <CardBrandIcon brand={method.card.brand} />
                <div className="flex-1 text-left">
                  <p style={{ color: TEXT_COLORS.primary }}>
                    {method.card.brand.charAt(0).toUpperCase() + method.card.brand.slice(1)} ****{method.card.last4}
                  </p>
                  <p style={{ fontSize: `${TYPOGRAPHY.fontSize.xs}px`, color: TEXT_COLORS.muted }}>
                    Expires {method.card.expMonth}/{method.card.expYear}
                  </p>
                </div>
                {method.isDefault && (
                  <span 
                    className="px-2 py-0.5 rounded text-xs"
                    style={{ backgroundColor: STATE_COLORS.active, color: '#000' }}
                  >
                    Default
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
        
        {/* Add New Payment Method */}
        <button
          onClick={onUseNewCard}
          className="w-full flex items-center gap-3 p-3 rounded-lg transition-all"
          style={{
            backgroundColor: useNewCard ? `${STATE_COLORS.active}20` : BG_COLORS.tertiary,
            border: `1px solid ${useNewCard ? STATE_COLORS.active : BORDER_COLORS.default}`,
          }}
        >
          <div 
            className="w-8 h-5 rounded flex items-center justify-center"
            style={{ backgroundColor: STATE_COLORS.active }}
          >
            <Plus className="w-3 h-3" style={{ color: '#000' }} />
          </div>
          <span style={{ color: TEXT_COLORS.primary }}>Add new payment method</span>
        </button>
        
        {useNewCard && (
          <div className="mt-4 space-y-4">
            <div 
              className="p-4 rounded-lg"
              style={{ backgroundColor: BG_COLORS.tertiary }}
            >
              {/* PaymentElement shows Card, PayPal, Link tabs based on what's enabled */}
              <PaymentElement 
                options={{
                  layout: 'tabs',
                  paymentMethodOrder: ['card', 'paypal', 'link'],
                  defaultValues: {
                    billingDetails: {
                      email: undefined,
                    },
                  },
                }}
              />
            </div>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={saveNewCard}
                onChange={onToggleSaveCard}
                className="w-4 h-4 rounded"
                style={{ accentColor: STATE_COLORS.active }}
              />
              <span style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, color: TEXT_COLORS.secondary }}>
                Save this payment method for future deposits
              </span>
            </label>
          </div>
        )}
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
          disabled={!canContinue || isLoading}
          className="flex-1 py-3 rounded-lg font-semibold transition-all"
          style={{
            backgroundColor: canContinue && !isLoading ? STATE_COLORS.active : BG_COLORS.tertiary,
            color: canContinue && !isLoading ? '#000' : TEXT_COLORS.muted,
            opacity: canContinue && !isLoading ? 1 : 0.5,
          }}
        >
          {isLoading ? 'Loading...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

interface ConfirmStepProps {
  amount: number;
  currency: string;
  paymentMethod: string;
  onBack: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

function ConfirmStep({
  amount,
  currency,
  paymentMethod,
  onBack,
  onConfirm,
  isProcessing,
}: ConfirmStepProps): React.ReactElement {
  const isNonUSD = currency !== 'USD';
  
  return (
    <div className="space-y-6">
      <div>
        <h3 
          className="font-semibold mb-4"
          style={{ fontSize: `${TYPOGRAPHY.fontSize.lg}px`, color: TEXT_COLORS.primary }}
        >
          Confirm Deposit
        </h3>
        
        <div 
          className="p-4 rounded-lg space-y-3"
          style={{ backgroundColor: BG_COLORS.tertiary }}
        >
          <div className="flex justify-between">
            <span style={{ color: TEXT_COLORS.secondary }}>Amount</span>
            <span className="font-semibold" style={{ color: TEXT_COLORS.primary }}>
              {formatSmallestUnit(amount, { currency })}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: TEXT_COLORS.secondary }}>Payment Method</span>
            <span style={{ color: TEXT_COLORS.primary }}>{paymentMethod}</span>
          </div>
          {isNonUSD && (
            <div className="flex justify-between">
              <span style={{ color: TEXT_COLORS.secondary }}>Currency Conversion</span>
              <span style={{ color: STATE_COLORS.success }}>Free</span>
            </div>
          )}
          <div 
            className="border-t pt-3 flex justify-between"
            style={{ borderColor: BORDER_COLORS.default }}
          >
            <span className="font-medium" style={{ color: TEXT_COLORS.primary }}>Total</span>
            <span className="font-bold text-lg" style={{ color: STATE_COLORS.success }}>
              {formatSmallestUnit(amount, { currency })}
            </span>
          </div>
          {isNonUSD && (
            <p 
              className="text-center"
              style={{ fontSize: `${TYPOGRAPHY.fontSize.xs}px`, color: TEXT_COLORS.muted }}
            >
              Will be converted to USD at the current exchange rate
            </p>
          )}
        </div>
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={isProcessing}
          className="flex-1 py-3 rounded-lg font-medium"
          style={{
            backgroundColor: BG_COLORS.tertiary,
            color: TEXT_COLORS.primary,
            border: `1px solid ${BORDER_COLORS.default}`,
            opacity: isProcessing ? 0.5 : 1,
          }}
        >
          Back
        </button>
        <button
          onClick={onConfirm}
          disabled={isProcessing}
          className="flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
          style={{
            backgroundColor: isProcessing ? BG_COLORS.tertiary : STATE_COLORS.success,
            color: isProcessing ? TEXT_COLORS.muted : '#fff',
          }}
        >
          {isProcessing ? (
            <>
              <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              Processing...
            </>
          ) : (
            `Deposit ${formatSmallestUnit(amount, { currency })}`
          )}
        </button>
      </div>
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
  currency = 'USD',
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
              {formatSmallestUnit(amount, { currency })} has been added to your balance
            </p>
            {currency !== 'USD' && (
              <p 
                className="mt-1"
                style={{ fontSize: `${TYPOGRAPHY.fontSize.xs}px`, color: TEXT_COLORS.muted }}
              >
                Converted to USD at no extra cost
              </p>
            )}
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
// MAIN MODAL CONTENT
// ============================================================================

interface DepositModalContentProps extends DepositModalVX2Props {
  clientSecret: string;
  /** User's display currency */
  displayCurrency: string;
  /** User's geolocated local currency */
  localCurrency: string;
  /** Currency symbol */
  currencySymbol: string;
  /** Callback when user changes currency */
  onCurrencyChange: (currency: string) => void;
}

function DepositModalContent({
  isOpen,
  onClose,
  userId,
  userEmail,
  userName,
  userCountry = 'US',
  onSuccess,
  clientSecret,
  displayCurrency,
  localCurrency,
  currencySymbol,
  onCurrencyChange,
}: DepositModalContentProps): React.ReactElement | null {
  const stripe = useStripe();
  const elements = useElements();
  
  // Get exchange rate for the selected currency
  const { 
    rate: exchangeRate, 
    rateDisplay, 
    loading: rateLoading,
    toLocal,
  } = useStripeExchangeRate(displayCurrency);
  
  // State - store amount in USD for consistency
  const [step, setStep] = useState<DepositStep>('amount');
  const [amountUSD, setAmountUSD] = useState(50); // Default $50 USD
  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [useNewCard, setUseNewCard] = useState(false);
  const [saveNewCard, setSaveNewCard] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [walletAvailability, setWalletAvailability] = useState<WalletAvailability>({
    applePay: false,
    googlePay: false,
  });
  const [voucherInfo, setVoucherInfo] = useState<VoucherInfo | null>(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>('card');
  
  // Calculate the amount in smallest currency units for payment
  const selectedAmount = useMemo(() => {
    // Convert USD to local currency, then to smallest units
    const localAmount = toLocal(amountUSD);
    return toSmallestUnit(localAmount, displayCurrency);
  }, [amountUSD, toLocal, displayCurrency]);
  
  // Load saved payment methods
  useEffect(() => {
    if (isOpen && userId) {
      loadSavedMethods();
    }
  }, [isOpen, userId]);
  
  const loadSavedMethods = async () => {
    try {
      const response = await fetch(`/api/stripe/payment-methods?userId=${userId}`);
      const data = await response.json();
      
      if (data.ok && data.data?.paymentMethods) {
        setSavedMethods(data.data.paymentMethods);
        
        // Auto-select default method if exists
        const defaultMethod = data.data.paymentMethods.find((m: SavedPaymentMethod) => m.isDefault);
        if (defaultMethod) {
          setSelectedMethodId(defaultMethod.id);
        }
      }
    } catch (err) {
      logger.error('Failed to load payment methods', err);
    }
  };
  
  // Handle USD amount change from stepper
  const handleAmountChange = useCallback((usdAmount: number) => {
    setAmountUSD(usdAmount);
  }, []);
  
  // Handle wallet availability update
  const handleWalletReady = useCallback((availability: WalletAvailability) => {
    setWalletAvailability(availability);
    logger.debug('Wallet availability updated', { applePay: availability.applePay, googlePay: availability.googlePay });
  }, []);
  
  // Handle Express Checkout (Apple Pay / Google Pay) confirmation
  const handleExpressCheckoutConfirm = useCallback(async (event: StripeExpressCheckoutElementConfirmEvent) => {
    if (!stripe || !elements) {
      setError('Payment system not ready');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      logger.debug('Express checkout confirm', { walletType: event.expressPaymentType });
      
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/deposit/complete`,
        },
        redirect: 'if_required',
      });
      
      if (confirmError) {
        throw new Error(confirmError.message);
      }
      
      if (paymentIntent?.status === 'succeeded') {
        setTransactionId(paymentIntent.id);
        setStep('success');
        onSuccess?.(paymentIntent.id, selectedAmount, displayCurrency);
      } else if (paymentIntent?.status === 'requires_action') {
        // Handle additional authentication if needed
        logger.debug('Payment requires additional action');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      logger.error('Express checkout failed', err);
      setError(message);
      setStep('error');
    } finally {
      setIsProcessing(false);
    }
  }, [stripe, elements, clientSecret, selectedAmount, displayCurrency, onSuccess]);
  
  // Payment method description for confirm screen
  const paymentMethodDescription = useMemo(() => {
    if (selectedMethodId) {
      const method = savedMethods.find(m => m.id === selectedMethodId);
      if (method) {
        return `${method.card.brand} ****${method.card.last4}`;
      }
    }
    return 'New card';
  }, [selectedMethodId, savedMethods]);
  
  // Determine async payment type based on currency and country
  const getAsyncPaymentType = useCallback((): AsyncPaymentType | null => {
    if (displayCurrency === 'MXN' && userCountry === 'MX') return 'oxxo';
    if (displayCurrency === 'BRL' && userCountry === 'BR') {
      // Check if user selected pix or boleto (for now default to pix as it's instant)
      return selectedPaymentType === 'boleto' ? 'boleto' : 'pix';
    }
    return null;
  }, [displayCurrency, userCountry, selectedPaymentType]);
  
  // Check if payment requires async flow (voucher/QR code)
  const isAsyncPayment = useMemo(() => {
    return getAsyncPaymentType() !== null;
  }, [getAsyncPaymentType]);
  
  // Process payment
  const processPayment = async () => {
    if (!stripe || !elements) {
      setError('Payment system not ready');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // If using saved payment method, confirm with payment method ID
      if (selectedMethodId) {
        const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
          clientSecret,
          confirmParams: {
            payment_method: selectedMethodId,
            return_url: `${window.location.origin}/deposit/complete`,
          },
          redirect: 'if_required',
        });
        
        if (confirmError) {
          throw new Error(confirmError.message);
        }
        
        if (paymentIntent?.status === 'succeeded') {
          setStep('success');
          onSuccess?.(paymentIntent.id, selectedAmount, displayCurrency);
        } else if (paymentIntent?.status === 'requires_action') {
          // Handle async payment (OXXO, Boleto)
          await handleAsyncPayment(paymentIntent);
        }
      } else {
        // Using new card via Elements
        const { error: submitError } = await elements.submit();
        if (submitError) {
          throw new Error(submitError.message);
        }
        
        const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
          elements,
          clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/deposit/complete`,
            save_payment_method: saveNewCard,
          },
          redirect: 'if_required',
        });
        
        if (confirmError) {
          throw new Error(confirmError.message);
        }
        
        if (paymentIntent?.status === 'succeeded') {
          setTransactionId(paymentIntent.id);
          setStep('success');
          onSuccess?.(paymentIntent.id, selectedAmount, displayCurrency);
        } else if (paymentIntent?.status === 'requires_action') {
          // Handle async payment (OXXO, Boleto, Pix)
          await handleAsyncPayment(paymentIntent);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      logger.error('Payment failed', err);
      setError(message);
      setStep('error');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle async payments (OXXO, Boleto, Pix) that require user action
  const handleAsyncPayment = async (paymentIntent: { 
    id: string; 
    next_action?: { 
      type: string;
      oxxo_display_details?: { hosted_voucher_url?: string; expires_after?: number };
      boleto_display_details?: { hosted_voucher_url?: string; expires_at?: number };
      pix_display_qr_code?: { hosted_instructions_url?: string; expires_at?: number };
    } | null;
  }) => {
    const nextAction = paymentIntent.next_action;
    if (!nextAction) {
      logger.warn('Payment requires action but no next_action provided');
      setError('Payment requires additional action');
      setStep('error');
      return;
    }
    
    let voucherUrl: string | undefined;
    let expiresAt: string | undefined;
    let paymentType: AsyncPaymentType = 'oxxo';
    
    // OXXO voucher
    if (nextAction.oxxo_display_details) {
      voucherUrl = nextAction.oxxo_display_details.hosted_voucher_url;
      if (nextAction.oxxo_display_details.expires_after) {
        expiresAt = new Date(nextAction.oxxo_display_details.expires_after * 1000).toISOString();
      }
      paymentType = 'oxxo';
    }
    
    // Boleto voucher
    if (nextAction.boleto_display_details) {
      voucherUrl = nextAction.boleto_display_details.hosted_voucher_url;
      if (nextAction.boleto_display_details.expires_at) {
        expiresAt = new Date(nextAction.boleto_display_details.expires_at * 1000).toISOString();
      }
      paymentType = 'boleto';
    }
    
    // Pix QR code
    if (nextAction.pix_display_qr_code) {
      voucherUrl = nextAction.pix_display_qr_code.hosted_instructions_url;
      if (nextAction.pix_display_qr_code.expires_at) {
        expiresAt = new Date(nextAction.pix_display_qr_code.expires_at * 1000).toISOString();
      }
      paymentType = 'pix';
    }
    
    if (voucherUrl && expiresAt) {
      setVoucherInfo({
        type: paymentType,
        voucherUrl,
        expiresAt,
        amount: selectedAmount,
        currency: displayCurrency,
      });
      setTransactionId(paymentIntent.id);
      setStep('voucher');
      logger.debug('Async payment voucher ready', { paymentType, voucherUrl });
    } else {
      logger.warn('Async payment missing voucher info', { nextAction });
      setError('Payment information incomplete. Please try again.');
      setStep('error');
    }
  };
  
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
        className="relative w-full max-w-md rounded-xl overflow-hidden"
        style={{ backgroundColor: BG_COLORS.secondary }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: BORDER_COLORS.default }}
        >
          <div className="flex items-center gap-3">
            {step !== 'amount' && step !== 'success' && step !== 'error' && (
              <button
                onClick={() => {
                  if (step === 'method') setStep('amount');
                  else if (step === 'confirm') setStep('method');
                }}
                className="p-1 rounded hover:bg-white/10"
              >
                <ChevronLeft className="w-5 h-5" style={{ color: TEXT_COLORS.primary }} />
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
            <Close className="w-5 h-5" style={{ color: TEXT_COLORS.muted }} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {step === 'amount' && (
            <AmountStep
              amountUSD={amountUSD}
              currency={displayCurrency}
              localCurrency={localCurrency}
              exchangeRate={exchangeRate}
              rateDisplay={rateDisplay}
              rateLoading={rateLoading}
              showCurrencyExchangeNotice={displayCurrency !== 'USD'}
              onAmountChange={handleAmountChange}
              onCurrencyChange={onCurrencyChange}
              onContinue={() => setStep('method')}
            />
          )}
          
          {step === 'method' && (
            <MethodStep
              savedMethods={savedMethods}
              selectedMethodId={selectedMethodId}
              useNewCard={useNewCard}
              saveNewCard={saveNewCard}
              walletAvailability={walletAvailability}
              amount={selectedAmount}
              onSelectMethod={(id) => {
                setSelectedMethodId(id);
                setUseNewCard(false);
              }}
              onUseNewCard={() => {
                setSelectedMethodId(null);
                setUseNewCard(true);
              }}
              onToggleSaveCard={() => setSaveNewCard(!saveNewCard)}
              onBack={() => setStep('amount')}
              onContinue={() => setStep('confirm')}
              onExpressCheckoutConfirm={handleExpressCheckoutConfirm}
              onWalletReady={handleWalletReady}
              isLoading={isLoading}
            />
          )}
          
          {step === 'confirm' && (
            <ConfirmStep
              amount={selectedAmount}
              currency={displayCurrency}
              paymentMethod={paymentMethodDescription}
              onBack={() => setStep('method')}
              onConfirm={processPayment}
              isProcessing={isProcessing}
            />
          )}
          
          {step === 'voucher' && voucherInfo && (
            <VoucherStep
              voucherInfo={voucherInfo}
              onClose={() => {
                // User chose to pay later - close modal
                onClose();
              }}
              onViewVoucher={() => {
                // User viewed voucher - they can close when ready
                logger.debug('User viewed voucher', { type: voucherInfo.type });
              }}
            />
          )}
          
          {(step === 'success' || step === 'error') && (
            <ResultStep
              success={step === 'success'}
              amount={selectedAmount}
              currency={displayCurrency}
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

// ============================================================================
// MAIN EXPORT (WITH STRIPE PROVIDER WRAPPER)
// ============================================================================

export function DepositModalVX2(props: DepositModalVX2Props): React.ReactElement | null {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAttemptedRef = useRef(false);
  
  const { isOpen, userId, userEmail, userName, userCountry = 'US', onClose } = props;
  
  // User's geolocated local currency (default for their country)
  const localCurrency = useMemo(() => getCurrencyForCountry(userCountry), [userCountry]);
  
  // Selected deposit currency (can differ from local if user changes it)
  const [selectedCurrency, setSelectedCurrency] = useState<string>(localCurrency);
  
  // Get config for the selected currency
  const currencyConfig = useMemo(() => getCurrencyConfig(selectedCurrency), [selectedCurrency]);
  
  // Handle currency change - recreate payment intent with new currency
  const handleCurrencyChange = useCallback((newCurrency: string) => {
    if (newCurrency !== selectedCurrency) {
      logger.debug('Currency changed', { from: selectedCurrency, to: newCurrency });
      setSelectedCurrency(newCurrency);
      // Reset payment intent to create new one with new currency
      setClientSecret(null);
      hasAttemptedRef.current = false;
      setError(null);
    }
  }, [selectedCurrency]);
  
  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Reset for new modal opening
      hasAttemptedRef.current = false;
      setError(null);
      // Reset to local currency when modal opens
      setSelectedCurrency(localCurrency);
    } else {
      // Clear state when modal closes
      setClientSecret(null);
      setError(null);
    }
  }, [isOpen, localCurrency]);
  
  // Create payment intent when modal opens or currency changes
  useEffect(() => {
    if (!isOpen || !userId || clientSecret || hasAttemptedRef.current) {
      return;
    }
    
    hasAttemptedRef.current = true;
    setIsCreatingIntent(true);
    setError(null);
    
    const createPaymentIntent = async () => {
      try {
        logger.debug('Creating payment intent', { userId, userEmail, selectedCurrency });
        
        const response = await fetch('/api/stripe/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amountCents: currencyConfig.minAmountSmallestUnit * 10, // ~$50 equivalent
            currency: selectedCurrency,
            country: userCountry,
            userId,
            email: userEmail || undefined,
            name: userName || undefined,
            // Enable card (includes Apple Pay/Google Pay via wallets) and Link
            // PayPal will be shown automatically in PaymentElement if enabled in Stripe Dashboard
            paymentMethodTypes: ['card', 'link'],
          }),
        });
        
        const data = await response.json();
        logger.debug('Payment intent response', { ok: data.ok, hasSecret: !!data.data?.clientSecret });
        
        if (data.ok && data.data?.clientSecret) {
          setClientSecret(data.data.clientSecret);
        } else {
          setError(data.error?.message || 'Failed to create payment');
          logger.error('Failed to create payment intent', data);
        }
      } catch (err) {
        setError('Network error - please try again');
        logger.error('Failed to create payment intent', err);
      } finally {
        setIsCreatingIntent(false);
      }
    };
    
    createPaymentIntent();
  }, [isOpen, userId, userEmail, userName, userCountry, selectedCurrency, currencyConfig, clientSecret]);
  
  const handleRetry = useCallback(() => {
    hasAttemptedRef.current = false;
    setError(null);
    setClientSecret(null);
  }, []);
  
  if (!isOpen) return null;
  
  // Show loading or error state
  if (!clientSecret || isCreatingIntent || error) {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center"
        style={{ zIndex: Z_INDEX.modal }}
      >
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div 
          className="relative p-8 rounded-xl max-w-sm mx-4"
          style={{ backgroundColor: BG_COLORS.secondary }}
        >
          {error ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: STATE_COLORS.error + '20' }}
              >
                <span style={{ color: STATE_COLORS.error, fontSize: '24px' }}>!</span>
              </div>
              <div>
                <p style={{ color: TEXT_COLORS.primary, fontWeight: 600 }}>Payment Setup Failed</p>
                <p style={{ color: TEXT_COLORS.secondary, fontSize: '14px', marginTop: '4px' }}>{error}</p>
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg"
                  style={{ 
                    backgroundColor: 'transparent',
                    border: `1px solid ${BORDER_COLORS.subtle}`,
                    color: TEXT_COLORS.secondary
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 rounded-lg"
                  style={{ 
                    backgroundColor: STATE_COLORS.info,
                    color: 'white'
                  }}
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
              <span style={{ color: TEXT_COLORS.primary }}>Preparing payment...</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <StripeProvider clientSecret={clientSecret}>
      <DepositModalContent 
        {...props} 
        clientSecret={clientSecret}
        displayCurrency={selectedCurrency}
        localCurrency={localCurrency}
        currencySymbol={currencyConfig.symbol}
        onCurrencyChange={handleCurrencyChange}
      />
    </StripeProvider>
  );
}

export default DepositModalVX2;

