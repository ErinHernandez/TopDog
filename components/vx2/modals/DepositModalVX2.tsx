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
import { formatDollars } from '../utils/formatting';
import { StripeProvider } from '../providers/StripeProvider';
import { createScopedLogger } from '../../../lib/clientLogger';

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
  onSuccess?: (transactionId: string, amount: number) => void;
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

type DepositStep = 'amount' | 'method' | 'confirm' | 'processing' | 'success' | 'error';

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
  selectedAmount: number;
  customAmount: string;
  onSelectAmount: (amount: number) => void;
  onCustomAmountChange: (value: string) => void;
  onContinue: () => void;
}

function AmountStep({
  selectedAmount,
  customAmount,
  onSelectAmount,
  onCustomAmountChange,
  onContinue,
}: AmountStepProps): React.ReactElement {
  const isCustom = !QUICK_AMOUNTS.includes(selectedAmount) && selectedAmount > 0;
  const isValid = selectedAmount >= MIN_AMOUNT * 100 && selectedAmount <= MAX_AMOUNT * 100;
  
  return (
    <div className="space-y-6">
      <div>
        <h3 
          className="font-semibold mb-4"
          style={{ fontSize: `${TYPOGRAPHY.fontSize.lg}px`, color: TEXT_COLORS.primary }}
        >
          Select Amount
        </h3>
        
        <div className="grid grid-cols-3 gap-3">
          {QUICK_AMOUNTS.map(amount => (
            <button
              key={amount}
              onClick={() => onSelectAmount(amount * 100)}
              className="py-3 px-4 rounded-lg font-medium transition-all"
              style={{
                backgroundColor: selectedAmount === amount * 100 
                  ? STATE_COLORS.active 
                  : BG_COLORS.tertiary,
                color: selectedAmount === amount * 100 
                  ? '#000' 
                  : TEXT_COLORS.primary,
                border: `1px solid ${selectedAmount === amount * 100 
                  ? STATE_COLORS.active 
                  : BORDER_COLORS.default}`,
              }}
            >
              ${amount}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <label 
          className="block mb-2"
          style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, color: TEXT_COLORS.secondary }}
        >
          Or enter custom amount
        </label>
        <div className="relative">
          <span 
            className="absolute left-4 top-1/2 -translate-y-1/2"
            style={{ color: TEXT_COLORS.muted }}
          >
            $
          </span>
          <input
            type="number"
            value={customAmount}
            onChange={(e) => onCustomAmountChange(e.target.value)}
            placeholder="0.00"
            min={MIN_AMOUNT}
            max={MAX_AMOUNT}
            className="w-full py-3 pl-8 pr-4 rounded-lg"
            style={{
              backgroundColor: BG_COLORS.tertiary,
              color: TEXT_COLORS.primary,
              border: `1px solid ${isCustom ? STATE_COLORS.active : BORDER_COLORS.default}`,
            }}
          />
        </div>
        <p 
          className="mt-2"
          style={{ fontSize: `${TYPOGRAPHY.fontSize.xs}px`, color: TEXT_COLORS.muted }}
        >
          Min: ${MIN_AMOUNT} / Max: ${MAX_AMOUNT.toLocaleString()}
        </p>
      </div>
      
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
        Continue with {formatDollars(selectedAmount / 100)}
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
  paymentMethod: string;
  onBack: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

function ConfirmStep({
  amount,
  paymentMethod,
  onBack,
  onConfirm,
  isProcessing,
}: ConfirmStepProps): React.ReactElement {
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
              {formatDollars(amount / 100)}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: TEXT_COLORS.secondary }}>Payment Method</span>
            <span style={{ color: TEXT_COLORS.primary }}>{paymentMethod}</span>
          </div>
          <div 
            className="border-t pt-3 flex justify-between"
            style={{ borderColor: BORDER_COLORS.default }}
          >
            <span className="font-medium" style={{ color: TEXT_COLORS.primary }}>Total</span>
            <span className="font-bold text-lg" style={{ color: STATE_COLORS.success }}>
              {formatDollars(amount / 100)}
            </span>
          </div>
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
            `Deposit ${formatDollars(amount / 100)}`
          )}
        </button>
      </div>
    </div>
  );
}

interface ResultStepProps {
  success: boolean;
  amount?: number;
  transactionId?: string;
  errorMessage?: string;
  onClose: () => void;
}

function ResultStep({
  success,
  amount,
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
          <p style={{ color: TEXT_COLORS.secondary }}>
            {formatDollars(amount / 100)} has been added to your balance
          </p>
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
}

function DepositModalContent({
  isOpen,
  onClose,
  userId,
  userEmail,
  userName,
  onSuccess,
  clientSecret,
}: DepositModalContentProps): React.ReactElement | null {
  const stripe = useStripe();
  const elements = useElements();
  
  // State
  const [step, setStep] = useState<DepositStep>('amount');
  const [selectedAmount, setSelectedAmount] = useState(5000); // $50 default
  const [customAmount, setCustomAmount] = useState('');
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
  
  // Handle custom amount input
  const handleCustomAmountChange = useCallback((value: string) => {
    setCustomAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= MIN_AMOUNT && numValue <= MAX_AMOUNT) {
      setSelectedAmount(Math.round(numValue * 100));
    }
  }, []);
  
  // Handle amount selection
  const handleSelectAmount = useCallback((amountCents: number) => {
    setSelectedAmount(amountCents);
    setCustomAmount('');
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
        onSuccess?.(paymentIntent.id, selectedAmount);
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
  }, [stripe, elements, clientSecret, selectedAmount, onSuccess]);
  
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
          onSuccess?.(paymentIntent.id, selectedAmount);
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
          onSuccess?.(paymentIntent.id, selectedAmount);
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
              selectedAmount={selectedAmount}
              customAmount={customAmount}
              onSelectAmount={handleSelectAmount}
              onCustomAmountChange={handleCustomAmountChange}
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
              paymentMethod={paymentMethodDescription}
              onBack={() => setStep('method')}
              onConfirm={processPayment}
              isProcessing={isProcessing}
            />
          )}
          
          {(step === 'success' || step === 'error') && (
            <ResultStep
              success={step === 'success'}
              amount={selectedAmount}
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
  
  const { isOpen, userId, userEmail, userName, onClose } = props;
  
  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Reset for new modal opening
      hasAttemptedRef.current = false;
      setError(null);
    } else {
      // Clear state when modal closes
      setClientSecret(null);
      setError(null);
    }
  }, [isOpen]);
  
  // Create payment intent when modal opens
  useEffect(() => {
    if (!isOpen || !userId || clientSecret || hasAttemptedRef.current) {
      return;
    }
    
    hasAttemptedRef.current = true;
    setIsCreatingIntent(true);
    setError(null);
    
    const createPaymentIntent = async () => {
      try {
        logger.debug('Creating payment intent', { userId, userEmail });
        
        const response = await fetch('/api/stripe/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amountCents: 5000, // Initial amount, will be updated
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
  }, [isOpen, userId, userEmail, userName, clientSecret]);
  
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
      <DepositModalContent {...props} clientSecret={clientSecret} />
    </StripeProvider>
  );
}

export default DepositModalVX2;

