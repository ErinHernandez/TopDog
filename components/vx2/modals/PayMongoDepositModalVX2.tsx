/**
 * PayMongoDepositModalVX2 - PayMongo Payment Modal
 * 
 * Multi-step deposit flow for Philippines:
 * 1. Amount Selection - PHP quick amounts + custom
 * 2. Payment Method - GCash, Maya, GrabPay, Card
 * 3. Processing - Redirect to e-wallet or show card form
 * 4. Success/Error - Result display
 * 
 * @module components/vx2/modals/PayMongoDepositModalVX2
 */

import React, { useState, useCallback, useMemo } from 'react';

import { cn } from '@/lib/styles';

import { createScopedLogger } from '../../../lib/clientLogger';
import {
  formatPhpAmount,
  toSmallestUnit,
  validateDepositAmount,
  getQuickDepositAmounts,
  PHP_CONFIG,
} from '../../../lib/paymongo/currencyConfig';
import { Close, ChevronLeft } from '../components/icons';
import { PAYMONGO_DEPOSIT_THEME } from '../core/constants/colors';

import styles from './PayMongoDepositModalVX2.module.css';

const logger = createScopedLogger('[PayMongoDeposit]');

// ============================================================================
// TYPES
// ============================================================================

export interface PayMongoDepositModalVX2Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  userName?: string;
  userPhone?: string;
  onSuccess?: (transactionId: string, amount: number) => void;
}

type PaymentMethod = 'gcash' | 'maya' | 'grabpay' | 'card';
type DepositStep = 'amount' | 'method' | 'processing' | 'success' | 'error';

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: React.ReactNode;
  popular?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'gcash',
    name: 'GCash',
    description: '75M+ users - Most popular in PH',
    icon: <GCashIcon />,
    popular: true,
  },
  {
    id: 'maya',
    name: 'Maya',
    description: 'Formerly PayMaya',
    icon: <MayaIcon />,
  },
  {
    id: 'grabpay',
    name: 'GrabPay',
    description: 'Pay with Grab wallet',
    icon: <GrabPayIcon />,
  },
];

// ============================================================================
// ICONS
// ============================================================================

function GCashIcon(): React.ReactElement {
  return (
    <div
      className={styles.paymentMethodIconBox}
      style={
        {
          '--paymongo-icon-bg': PAYMONGO_DEPOSIT_THEME.gcashBg,
          '--paymongo-icon-text': PAYMONGO_DEPOSIT_THEME.iconText,
        } as React.CSSProperties
      }
    >
      G
    </div>
  );
}

function MayaIcon(): React.ReactElement {
  return (
    <div
      className={styles.paymentMethodIconBox}
      style={
        {
          '--paymongo-icon-bg': PAYMONGO_DEPOSIT_THEME.mayaBg,
          '--paymongo-icon-text': PAYMONGO_DEPOSIT_THEME.iconText,
        } as React.CSSProperties
      }
    >
      M
    </div>
  );
}

function GrabPayIcon(): React.ReactElement {
  return (
    <div
      className={styles.paymentMethodIconBox}
      style={
        {
          '--paymongo-icon-bg': PAYMONGO_DEPOSIT_THEME.grabpayBg,
          '--paymongo-icon-text': PAYMONGO_DEPOSIT_THEME.iconText,
        } as React.CSSProperties
      }
    >
      G
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PayMongoDepositModalVX2({
  isOpen,
  onClose,
  userId,
  userEmail,
  userName,
  userPhone,
  onSuccess,
}: PayMongoDepositModalVX2Props): React.ReactElement | null {
  // State
  const [step, setStep] = useState<DepositStep>('amount');
  const [amount, setAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  
  // Quick amounts
  const quickAmounts = useMemo(() => getQuickDepositAmounts(), []);
  
  // Validation
  const amountValidation = useMemo(() => {
    if (amount <= 0) return { isValid: false, error: 'Please select an amount' };
    return validateDepositAmount(toSmallestUnit(amount));
  }, [amount]);
  
  // Handlers
  const handleQuickAmount = useCallback((phpAmount: number) => {
    setAmount(phpAmount);
    setCustomAmount('');
    setError(null);
  }, []);
  
  const handleCustomAmountChange = useCallback((value: string) => {
    setCustomAmount(value);
    const parsed = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed)) {
      setAmount(parsed);
    } else {
      setAmount(0);
    }
    setError(null);
  }, []);
  
  const handleSelectMethod = useCallback((method: PaymentMethod) => {
    setSelectedMethod(method);
  }, []);
  
  const handleContinueToMethod = useCallback(() => {
    if (!amountValidation.isValid) {
      setError(amountValidation.error ?? null);
      return;
    }
    setStep('method');
  }, [amountValidation]);
  
  const handleBack = useCallback(() => {
    if (step === 'method') {
      setStep('amount');
      setSelectedMethod(null);
    }
  }, [step]);
  
  const handleSubmit = useCallback(async () => {
    if (!selectedMethod || !amountValidation.isValid) return;
    
    setIsLoading(true);
    setError(null);
    setStep('processing');
    
    try {
      // Map method to PayMongo source type
      const typeMap: Record<PaymentMethod, string> = {
        gcash: 'gcash',
        maya: 'paymaya',
        grabpay: 'grab_pay',
        card: 'card',
      };
      
      const response = await fetch('/api/paymongo/source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          type: typeMap[selectedMethod],
          userId,
          email: userEmail,
          name: userName,
          phone: userPhone,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create payment');
      }
      
      setTransactionId(data.transactionId);
      
      // Redirect to checkout URL
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setStep('error');
        setError('No checkout URL received');
      }
      
    } catch (err) {
      logger.error('Payment error', err);
      setError(err instanceof Error ? err.message : 'Failed to process payment');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMethod, amount, amountValidation, userId, userEmail, userName, userPhone]);
  
  const handleReset = useCallback(() => {
    setStep('amount');
    setAmount(0);
    setCustomAmount('');
    setSelectedMethod(null);
    setError(null);
    setTransactionId(null);
  }, []);
  
  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);
  
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {step === 'method' && (
              <button
                onClick={handleBack}
                className={styles.backButton}
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
            )}
            <h2 className={styles.headerTitle}>
              {step === 'amount' && 'Deposit'}
              {step === 'method' && 'Select Payment Method'}
              {step === 'processing' && 'Processing...'}
              {step === 'success' && 'Success'}
              {step === 'error' && 'Error'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className={styles.closeButton}
          >
            <Close className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalContent}>
          {/* Amount Selection Step */}
          {step === 'amount' && (
            <div className={styles.amountSelectionStep}>
              {/* Quick amounts */}
              <div>
                <label className={styles.amountLabel}>
                  Select Amount
                </label>
                <div className={styles.quickAmountGrid}>
                  {quickAmounts.map(({ display }) => (
                    <button
                      key={display}
                      onClick={() => handleQuickAmount(display)}
                      className={cn(
                        styles.quickAmountButton,
                        amount === display ? styles.quickAmountButtonActive : styles.quickAmountButtonInactive
                      )}
                    >
                      {PHP_CONFIG.symbol}{display.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>


              {/* Custom amount */}
              <div className={styles.customAmountSection}>
                <label className={styles.amountLabel}>
                  Or Enter Custom Amount
                </label>
                <div className={styles.customAmountInputWrapper}>
                  <span className={styles.customAmountPrefix}>
                    {PHP_CONFIG.symbol}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    placeholder="0.00"
                    className={styles.customAmountInput}
                  />
                </div>
                <p className={styles.amountHint}>
                  Min: {formatPhpAmount(PHP_CONFIG.minimumDepositCentavos)} |
                  Max: {formatPhpAmount(PHP_CONFIG.maximumDepositCentavos)}
                </p>
              </div>


              {/* Error */}
              {error && (
                <div className={styles.errorAlert}>
                  <p className={styles.errorText}>{error}</p>
                </div>
              )}

              {/* Continue button */}
              <button
                onClick={handleContinueToMethod}
                disabled={!amountValidation.isValid}
                className={cn(
                  styles.continueButton,
                  amountValidation.isValid ? styles.continueButtonActive : styles.continueButtonDisabled
                )}
              >
                Continue with {amount > 0 ? formatPhpAmount(toSmallestUnit(amount)) : 'amount'}
              </button>
            </div>
          )}


          {/* Payment Method Step */}
          {step === 'method' && (
            <div className={styles.methodSelectionStep}>
              {/* Amount display */}
              <div className={styles.amountDisplayBox}>
                <p className={styles.amountDisplayLabel}>Deposit Amount</p>
                <p className={styles.amountDisplayValue}>
                  {formatPhpAmount(toSmallestUnit(amount))}
                </p>
              </div>

              {/* Payment methods */}
              <div className={styles.methodsContainer}>
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => handleSelectMethod(method.id)}
                    className={cn(
                      styles.methodButton,
                      selectedMethod === method.id && styles.methodButtonActive
                    )}
                  >
                    {method.icon}
                    <div className={styles.methodContent}>
                      <div className={styles.methodHeader}>
                        <span className={styles.methodName}>{method.name}</span>
                        {method.popular && (
                          <span className={styles.methodPopularBadge}>
                            Popular
                          </span>
                        )}
                      </div>
                      <p className={styles.methodDescription}>{method.description}</p>
                    </div>
                    <div className={cn(
                      styles.methodRadio,
                      selectedMethod === method.id && styles.methodRadioActive
                    )}>
                      {selectedMethod === method.id && (
                        <svg className={styles.methodRadioCheckmark} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>


              {/* Error */}
              {error && (
                <div className={styles.errorAlert}>
                  <p className={styles.errorText}>{error}</p>
                </div>
              )}

              {/* Pay button */}
              <button
                onClick={handleSubmit}
                disabled={!selectedMethod || isLoading}
                className={cn(
                  styles.payButton,
                  selectedMethod && !isLoading ? styles.payButtonActive : styles.payButtonDisabled
                )}
              >
                {isLoading ? 'Processing...' : `Pay ${formatPhpAmount(toSmallestUnit(amount))}`}
              </button>

              {/* Security note */}
              <p className={styles.securityNote}>
                You will be redirected to complete payment securely
              </p>
            </div>
          )}


          {/* Processing Step */}
          {step === 'processing' && (
            <div className={styles.processingStep}>
              <div className={styles.spinnerContainer}>
                <svg className={styles.spinner} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <h3 className={styles.processingTitle}>Redirecting...</h3>
              <p className={styles.processingText}>Please wait while we redirect you to complete your payment.</p>
            </div>
          )}


          {/* Error Step */}
          {step === 'error' && (
            <div className={styles.errorStep}>
              <div className={styles.errorIconContainer}>
                <svg className={styles.errorIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className={styles.errorTitle}>Payment Failed</h3>
              <p className={styles.errorMessage}>{error || 'An error occurred. Please try again.'}</p>
              <button
                onClick={handleReset}
                className={styles.tryAgainButton}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PayMongoDepositModalVX2;


