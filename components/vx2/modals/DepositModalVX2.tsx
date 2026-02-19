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

import { useStripe, useElements, PaymentElement, ExpressCheckoutElement } from '@stripe/react-stripe-js';
import type { StripeExpressCheckoutElementConfirmEvent, AvailablePaymentMethods } from '@stripe/stripe-js';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { cn } from '@/lib/styles';

import { useStripeExchangeRate } from '../../../hooks/useStripeExchangeRate';
import { createScopedLogger } from '../../../lib/clientLogger';
import { getCurrencyConfig, getCurrencyForCountry } from '../../../lib/stripe/currencyConfig';
import { AmountStepper } from '../components/AmountStepper';
import { CurrencySelector } from '../components/CurrencySelector';
import { FXWarningBanner } from '../components/FXWarningBanner';
import { Close, ChevronLeft, Plus } from '../components/icons';
import { StripeProvider } from '../providers/StripeProvider';
import { formatSmallestUnit, toSmallestUnit, toDisplayAmount } from '../utils/formatting';

import styles from './DepositModalVX2.module.css';
import { VoucherStep, type VoucherInfo, type AsyncPaymentType } from './VoucherStep';


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
  const brandMap: Record<string, string> = {
    visa: 'visa',
    mastercard: 'mastercard',
    amex: 'amex',
    discover: 'discover',
  };

  const brandKey = brandMap[brand.toLowerCase()] || 'default';

  return (
    <div className={cn(styles.cardBrandIcon, styles[`brand-${brandKey}`])}>
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
    <div className={styles.amountStepContainer}>
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
        <div className={styles.currencyNotice}>
          <p className={styles.currencyNoticeTitle}>
            Your deposit will be converted to USD at no extra cost to you.
            Your account balance is always kept in USD.
          </p>
          <p className={styles.currencyNoticeSubtitle}>
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
        className={styles.continueButton}
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
    <div className={cn(styles.amountStepContainer)}>
      <div>
        <h3
          className={cn(styles.methodStepTitle)}
        >
          Payment Method
        </h3>

        {/* Express Checkout - Apple Pay / Google Pay */}
        <div className={styles.expressCheckoutContainer}>
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
          <div className={styles.dividerContainer}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>or pay with</span>
            <div className={styles.dividerLine} />
          </div>
        )}

        {/* Saved Payment Methods */}
        {savedMethods.length > 0 && (
          <div className={styles.savedMethodsSection}>
            <p className={styles.savedMethodsLabel}>
              Saved cards
            </p>
            {savedMethods.map(method => (
              <button
                key={method.id}
                onClick={() => onSelectMethod(method.id)}
                className={cn(
                  styles.methodButton,
                  selectedMethodId === method.id && styles.methodButtonSelected
                )}
              >
                <CardBrandIcon brand={method.card.brand} />
                <div className={styles.methodButtonContent}>
                  <p className={styles.methodCardBrand}>
                    {method.card.brand.charAt(0).toUpperCase() + method.card.brand.slice(1)} ****{method.card.last4}
                  </p>
                  <p className={styles.methodCardExpiry}>
                    Expires {method.card.expMonth}/{method.card.expYear}
                  </p>
                </div>
                {method.isDefault && (
                  <span className={styles.defaultBadge} data-default>
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
          className={cn(
            styles.addPaymentButton,
            useNewCard && styles.addPaymentButtonActive
          )}
        >
          <div className={styles.addPaymentIcon}>
            <span>
              <Plus className="w-3 h-3" />
            </span>
          </div>
          <span className={styles.addPaymentText}>Add new payment method</span>
        </button>

        {useNewCard && (
          <div className={styles.newCardSection}>
            <div className={styles.paymentElementContainer}>
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

            <label className={styles.saveCardLabel}>
              <input
                type="checkbox"
                checked={saveNewCard}
                onChange={onToggleSaveCard}
                className={styles.saveCardCheckbox}
              />
              <span className={styles.saveCardText}>
                Save this payment method for future deposits
              </span>
            </label>
          </div>
        )}
      </div>

      <div className={styles.methodButtonsContainer}>
        <button
          onClick={onBack}
          className={styles.backButton}
        >
          Back
        </button>
        <button
          onClick={onContinue}
          disabled={!canContinue || isLoading}
          className={styles.nextButton}
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
    <div className={cn(styles.amountStepContainer)}>
      <div>
        <h3
          className={styles.confirmStepTitle}
        >
          Confirm Deposit
        </h3>

        <div className={styles.summaryCard}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Amount</span>
            <span className={styles.summaryValue}>
              {formatSmallestUnit(amount, { currency })}
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Payment Method</span>
            <span className={styles.summaryPaymentMethod}>{paymentMethod}</span>
          </div>
          {isNonUSD && (
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Currency Conversion</span>
              <span className={styles.summaryConversionFree}>Free</span>
            </div>
          )}
          <div className={cn(styles.summaryDivider, styles.summaryRow)}>
            <span className={styles.totalLabel}>Total</span>
            <span className={styles.totalValue}>
              {formatSmallestUnit(amount, { currency })}
            </span>
          </div>
          {isNonUSD && (
            <p className={styles.conversionNote}>
              Will be converted to USD at the current exchange rate
            </p>
          )}
        </div>
      </div>

      <div className={styles.confirmButtonsContainer}>
        <button
          onClick={onBack}
          disabled={isProcessing}
          className={styles.confirmBackButton}
        >
          Back
        </button>
        <button
          onClick={onConfirm}
          disabled={isProcessing}
          className={cn(
            styles.depositButton,
            isProcessing && styles.depositButtonProcessing
          )}
        >
          {isProcessing ? (
            <>
              <span className={styles.processingSpinner} />
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
    <div className={styles.resultContainer}>
      <div className={cn(
        styles.resultIcon,
        success ? styles.resultIconSuccess : styles.resultIconError
      )}>
        {success ? (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>

      <div>
        <h3 className={cn(
          styles.resultTitle,
          success ? styles.resultTitleSuccess : styles.resultTitleError
        )}>
          {success ? 'Deposit Successful!' : 'Deposit Failed'}
        </h3>

        {success && amount && (
          <>
            <p className={styles.resultMessage}>
              {formatSmallestUnit(amount, { currency })} has been added to your balance
            </p>
            {currency !== 'USD' && (
              <p className={styles.resultSubtext}>
                Converted to USD at no extra cost
              </p>
            )}
          </>
        )}

        {!success && errorMessage && (
          <p className={styles.resultMessage}>{errorMessage}</p>
        )}

        {success && transactionId && (
          <p className={styles.resultTransactionId}>
            Transaction ID: {transactionId}
          </p>
        )}
      </div>

      <button
        onClick={onClose}
        className={styles.resultButton}
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

  // Load saved payment methods - wrapped in useCallback for proper dependency management
  const loadSavedMethods = useCallback(async () => {
    try {
      const response = await fetch(`/api/stripe/payment-methods?userId=${userId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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
  }, [userId]);

  // Load saved payment methods
  useEffect(() => {
    if (isOpen && userId) {
      loadSavedMethods();
    }
  }, [isOpen, userId, loadSavedMethods]);
  
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
    if (displayCurrency === 'MXN' && userCountry === 'MX') return true;
    if (displayCurrency === 'BRL' && userCountry === 'BR') return true;
    return false;
  }, [displayCurrency, userCountry]);
  
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
    <div className={styles.modalOverlay}>
      {/* Backdrop */}
      <div
        className={styles.backdrop}
        onClick={onClose}
      />

      {/* Modal */}
      <div className={styles.modalContent}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            {step !== 'amount' && step !== 'success' && step !== 'error' && (
              <button
                onClick={() => {
                  if (step === 'method') setStep('amount');
                  else if (step === 'confirm') setStep('method');
                }}
                className={styles.backNavButton}
              >
                <span className={styles.backNavIcon}>
                  <ChevronLeft className="w-5 h-5" />
                </span>
              </button>
            )}
            <h2
              className={styles.modalTitle}
            >
              Deposit Funds
            </h2>
          </div>
          <button
            onClick={onClose}
            className={styles.closeButton}
          >
            <span className={styles.closeIcon}>
              <Close className="w-5 h-5" />
            </span>
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalBody}>
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
    logger.debug('Currency changed', { from: selectedCurrency, to: newCurrency });
    setSelectedCurrency(newCurrency);
    // Reset payment intent to create new one with new currency
    setClientSecret(null);
    hasAttemptedRef.current = false;
    setError(null);
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

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

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
  }, [isOpen, userId, userEmail, userName, userCountry, selectedCurrency, currencyConfig, clientSecret, localCurrency]);
  
  const handleRetry = useCallback(() => {
    hasAttemptedRef.current = false;
    setError(null);
    setClientSecret(null);
  }, []);
  
  if (!isOpen) return null;

  // Show loading or error state
  if (!clientSecret || isCreatingIntent || error) {
    return (
      <div className={styles.loadingOverlay}>
        <div className={styles.loadingBackdrop} onClick={onClose} />
        <div className={styles.loadingBox}>
          {error ? (
            <div className={styles.errorContainer}>
              <div className={styles.errorIcon}>
                <span className={styles.errorIconContent}>!</span>
              </div>
              <div>
                <p className={styles.errorTitle}>Payment Setup Failed</p>
                <p className={styles.errorMessage}>{error}</p>
              </div>
              <div className={styles.errorButtonsContainer}>
                <button
                  onClick={onClose}
                  className={styles.errorCancelButton}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRetry}
                  className={styles.errorRetryButton}
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.loadingContainer}>
              <span className={styles.loadingSpinner} />
              <span className={styles.loadingText}>Preparing payment...</span>
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

