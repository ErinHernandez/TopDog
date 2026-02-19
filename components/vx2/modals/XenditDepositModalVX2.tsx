/**
 * XenditDepositModalVX2 - Xendit Payment Modal
 * 
 * Multi-step deposit flow for Indonesia:
 * 1. Amount Selection - IDR quick amounts + custom
 * 2. Payment Method - Virtual Account or E-Wallet
 * 3. Payment Details - Bank selection or e-wallet flow
 * 4. Instructions - VA number display or redirect
 * 
 * @module components/vx2/modals/XenditDepositModalVX2
 */

import React, { useState, useCallback, useMemo } from 'react';

import { cn } from '@/lib/styles';

import { createScopedLogger } from '../../../lib/clientLogger';
import {
  formatIdrAmount,
  validateDepositAmount,
  getQuickDepositAmounts,
  IDR_CONFIG,
  parseIdrInput,
} from '../../../lib/xendit/currencyConfig';
import {
  ID_BANK_CODES,
  EWALLET_NAMES,
  getBankName,
  getEWalletName,
} from '../../../lib/xendit/xenditTypes';
import type { XenditBankCode, XenditEWalletChannel } from '../../../lib/xendit/xenditTypes';
import { Close, ChevronLeft } from '../components/icons';

import styles from './XenditDepositModalVX2.module.css';

const logger = createScopedLogger('[XenditDeposit]');

// ============================================================================
// TYPES
// ============================================================================

export interface XenditDepositModalVX2Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  userName?: string;
  userPhone?: string;
  onSuccess?: (transactionId: string, amount: number) => void;
}

type PaymentCategory = 'virtual_account' | 'ewallet';
type DepositStep = 'amount' | 'category' | 'method' | 'processing' | 'instructions' | 'success' | 'error';

// ============================================================================
// CONSTANTS
// ============================================================================

const VA_BANKS: { code: XenditBankCode; name: string }[] = [
  { code: 'BCA', name: 'BCA' },
  { code: 'MANDIRI', name: 'Mandiri' },
  { code: 'BNI', name: 'BNI' },
  { code: 'BRI', name: 'BRI' },
  { code: 'PERMATA', name: 'Permata' },
];

const EWALLETS: { code: XenditEWalletChannel; name: string; requiresPhone: boolean }[] = [
  { code: 'ID_OVO', name: 'OVO', requiresPhone: true },
  { code: 'ID_GOPAY', name: 'GoPay', requiresPhone: false },
  { code: 'ID_DANA', name: 'DANA', requiresPhone: false },
  { code: 'ID_SHOPEEPAY', name: 'ShopeePay', requiresPhone: false },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function XenditDepositModalVX2({
  isOpen,
  onClose,
  userId,
  userEmail,
  userName,
  userPhone: initialPhone,
  onSuccess,
}: XenditDepositModalVX2Props): React.ReactElement | null {
  // State
  const [step, setStep] = useState<DepositStep>('amount');
  const [amount, setAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [category, setCategory] = useState<PaymentCategory | null>(null);
  const [selectedBank, setSelectedBank] = useState<XenditBankCode | null>(null);
  const [selectedEWallet, setSelectedEWallet] = useState<XenditEWalletChannel | null>(null);
  const [userPhone, setUserPhone] = useState(initialPhone || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  
  // VA-specific state
  const [vaAccountNumber, setVaAccountNumber] = useState<string | null>(null);
  const [vaExpiresAt, setVaExpiresAt] = useState<string | null>(null);
  
  // Quick amounts
  const quickAmounts = useMemo(() => getQuickDepositAmounts(), []);
  
  // Validation
  const amountValidation = useMemo(() => {
    if (amount <= 0) return { isValid: false, error: 'Please select an amount' };
    return validateDepositAmount(amount);
  }, [amount]);
  
  const requiresPhone = useMemo(() => {
    return selectedEWallet === 'ID_OVO';
  }, [selectedEWallet]);
  
  const canProceed = useMemo(() => {
    if (step === 'method') {
      if (category === 'virtual_account') {
        return selectedBank !== null;
      }
      if (category === 'ewallet') {
        if (requiresPhone && (!userPhone || userPhone.length < 10)) {
          return false;
        }
        return selectedEWallet !== null;
      }
    }
    return true;
  }, [step, category, selectedBank, selectedEWallet, requiresPhone, userPhone]);
  
  // Handlers
  const handleQuickAmount = useCallback((idrAmount: number) => {
    setAmount(idrAmount);
    setCustomAmount('');
    setError(null);
  }, []);
  
  const handleCustomAmountChange = useCallback((value: string) => {
    setCustomAmount(value);
    const parsed = parseIdrInput(value);
    if (parsed !== null) {
      setAmount(parsed);
    } else {
      setAmount(0);
    }
    setError(null);
  }, []);
  
  const handleContinueToCategory = useCallback(() => {
    if (!amountValidation.isValid) {
      setError(amountValidation.error ?? null);
      return;
    }
    setStep('category');
  }, [amountValidation]);
  
  const handleSelectCategory = useCallback((cat: PaymentCategory) => {
    setCategory(cat);
    setStep('method');
  }, []);
  
  const handleBack = useCallback(() => {
    if (step === 'category') {
      setStep('amount');
      setCategory(null);
    } else if (step === 'method') {
      setStep('category');
      setSelectedBank(null);
      setSelectedEWallet(null);
    } else if (step === 'instructions') {
      // Can't go back from instructions
    }
  }, [step]);
  
  const handleSubmit = useCallback(async () => {
    if (!canProceed || !amountValidation.isValid) return;
    
    setIsLoading(true);
    setError(null);
    setStep('processing');
    
    try {
      if (category === 'virtual_account' && selectedBank) {
        // Create Virtual Account
        const response = await fetch('/api/xendit/virtual-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            bankCode: selectedBank,
            userId,
            name: userName || userEmail,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to create virtual account');
        }
        
        setTransactionId(data.transactionId);
        setVaAccountNumber(data.accountNumber);
        setVaExpiresAt(data.expirationDate);
        setStep('instructions');
        
      } else if (category === 'ewallet' && selectedEWallet) {
        // Create e-wallet charge
        const response = await fetch('/api/xendit/ewallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            channelCode: selectedEWallet,
            userId,
            mobileNumber: requiresPhone ? userPhone : undefined,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to create e-wallet charge');
        }
        
        setTransactionId(data.transactionId);
        
        // Redirect to checkout URL
        if (data.checkoutUrl || data.mobileDeeplink) {
          window.location.href = data.checkoutUrl || data.mobileDeeplink;
        } else {
          setStep('error');
          setError('No checkout URL received');
        }
      }
      
    } catch (err) {
      logger.error('Payment error', err);
      setError(err instanceof Error ? err.message : 'Failed to process payment');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  }, [
    canProceed, amountValidation, category, selectedBank, selectedEWallet,
    amount, userId, userName, userEmail, userPhone, requiresPhone,
  ]);
  
  const handleCopyVA = useCallback(() => {
    if (vaAccountNumber) {
      navigator.clipboard.writeText(vaAccountNumber);
      // Could add a toast notification here
    }
  }, [vaAccountNumber]);
  
  const handleReset = useCallback(() => {
    setStep('amount');
    setAmount(0);
    setCustomAmount('');
    setCategory(null);
    setSelectedBank(null);
    setSelectedEWallet(null);
    setError(null);
    setTransactionId(null);
    setVaAccountNumber(null);
    setVaExpiresAt(null);
  }, []);
  
  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className={styles.overlay}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {(step === 'category' || step === 'method') && (
              <button
                onClick={handleBack}
                className={styles.backButton}
              >
                <ChevronLeft className={styles.backButtonIcon} />
              </button>
            )}
            <h2 className={styles.headerTitle}>
              {step === 'amount' && 'Deposit'}
              {step === 'category' && 'Select Payment Type'}
              {step === 'method' && (category === 'virtual_account' ? 'Select Bank' : 'Select E-Wallet')}
              {step === 'processing' && 'Processing...'}
              {step === 'instructions' && 'Transfer Instructions'}
              {step === 'success' && 'Success'}
              {step === 'error' && 'Error'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className={styles.closeButton}
          >
            <Close className={styles.closeButtonIcon} />
          </button>
        </div>
        
        {/* Content */}
        <div className={styles.content}>
          {/* Amount Step */}
          {step === 'amount' && (
            <div className={styles.amountContainer}>
              {/* Quick amounts */}
              <div className={styles.quickAmountsSection}>
                <label className={styles.quickAmountsLabel}>
                  Select Amount
                </label>
                <div className={styles.quickAmountsGrid}>
                  {quickAmounts.map(({ amount: idrAmount, display }) => (
                    <button
                      key={idrAmount}
                      onClick={() => handleQuickAmount(idrAmount)}
                      className={cn(
                        styles.quickAmountButton,
                        amount === idrAmount
                          ? styles.quickAmountButtonActive
                          : styles.quickAmountButtonInactive
                      )}
                    >
                      {display}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom amount */}
              <div className={styles.customAmountSection}>
                <label className={styles.customAmountLabel}>
                  Or Enter Custom Amount
                </label>
                <div className={styles.customAmountInputWrapper}>
                  <span className={styles.customAmountPrefix}>
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    placeholder="0"
                    className={styles.customAmountInput}
                  />
                </div>
                <p className={styles.customAmountHint}>
                  Min: {formatIdrAmount(IDR_CONFIG.minimumDeposit)} |
                  Max: {formatIdrAmount(IDR_CONFIG.maximumDeposit)}
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className={styles.errorBox}>
                  <p className={styles.errorText}>{error}</p>
                </div>
              )}

              {/* Continue button */}
              <button
                onClick={handleContinueToCategory}
                disabled={!amountValidation.isValid}
                className={cn(
                  styles.continueButton,
                  amountValidation.isValid
                    ? styles.continueButtonEnabled
                    : styles.continueButtonDisabled
                )}
              >
                Continue with {amount > 0 ? formatIdrAmount(amount) : 'amount'}
              </button>
            </div>
          )}
          
          {/* Category Selection Step */}
          {step === 'category' && (
            <div className={styles.categoryContainer}>
              {/* Amount display */}
              <div className={styles.amountDisplayBox}>
                <p className={styles.amountDisplayLabel}>Deposit Amount</p>
                <p className={styles.amountDisplayValue}>
                  {formatIdrAmount(amount)}
                </p>
              </div>

              {/* Payment categories */}
              <div className={styles.categoryButtonsContainer}>
                <button
                  onClick={() => handleSelectCategory('virtual_account')}
                  className={styles.categoryButton}
                >
                  <div className={cn(
                    styles.categoryIconBox,
                    styles.categoryIconBoxVA
                  )}>
                    <BankIcon />
                  </div>
                  <div className={styles.categoryButtonContent}>
                    <p className={styles.categoryButtonTitle}>Virtual Account</p>
                    <p className={styles.categoryButtonDescription}>Transfer from any bank - Most popular</p>
                  </div>
                  <span className={styles.categoryBadge}>
                    60%+
                  </span>
                </button>

                <button
                  onClick={() => handleSelectCategory('ewallet')}
                  className={styles.categoryButton}
                >
                  <div className={cn(
                    styles.categoryIconBox,
                    styles.categoryIconBoxEWallet
                  )}>
                    <WalletIcon />
                  </div>
                  <div className={styles.categoryButtonContent}>
                    <p className={styles.categoryButtonTitle}>E-Wallet</p>
                    <p className={styles.categoryButtonDescription}>OVO, GoPay, DANA, ShopeePay</p>
                  </div>
                </button>
              </div>
            </div>
          )}
          
          {/* Method Selection Step */}
          {step === 'method' && category === 'virtual_account' && (
            <div className={styles.methodContainer}>
              <div className={styles.methodAmountDisplay}>
                <p className={styles.methodAmountLabel}>Depositing</p>
                <p className={styles.methodAmountValue}>{formatIdrAmount(amount)}</p>
              </div>

              <p className={styles.methodLabel}>Select your bank</p>

              <div className={styles.methodList}>
                {VA_BANKS.map((bank) => (
                  <button
                    key={bank.code}
                    onClick={() => setSelectedBank(bank.code)}
                    className={cn(
                      styles.methodButton,
                      selectedBank === bank.code
                        ? styles.methodButtonActive
                        : styles.methodButtonInactive
                    )}
                  >
                    <div className={styles.methodIconBox}>
                      <span className={styles.methodIconText}>{bank.code.slice(0, 3)}</span>
                    </div>
                    <span className={styles.methodButtonLabelText}>{bank.name}</span>
                    {selectedBank === bank.code && (
                      <div className={styles.methodCheckmark}>
                        <svg className={styles.methodCheckmarkIcon} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                disabled={!selectedBank || isLoading}
                className={cn(
                  styles.continueButton,
                  selectedBank && !isLoading
                    ? styles.continueButtonEnabled
                    : styles.continueButtonDisabled
                )}
              >
                {isLoading ? 'Creating...' : 'Get Virtual Account Number'}
              </button>
            </div>
          )}
          
          {step === 'method' && category === 'ewallet' && (
            <div className={styles.methodContainer}>
              <div className={styles.methodAmountDisplay}>
                <p className={styles.methodAmountLabel}>Depositing</p>
                <p className={styles.methodAmountValue}>{formatIdrAmount(amount)}</p>
              </div>

              <p className={styles.methodLabel}>Select e-wallet</p>

              <div className={styles.methodList}>
                {EWALLETS.map((wallet) => (
                  <button
                    key={wallet.code}
                    onClick={() => setSelectedEWallet(wallet.code)}
                    className={cn(
                      styles.methodButton,
                      selectedEWallet === wallet.code
                        ? styles.methodButtonActive
                        : styles.methodButtonInactive
                    )}
                  >
                    <div className={styles.methodIconBox}>
                      <span className={styles.methodIconText}>{wallet.name.slice(0, 2)}</span>
                    </div>
                    <div className={styles.methodButtonLabel}>
                      <span className={styles.methodButtonLabelText}>{wallet.name}</span>
                      {wallet.requiresPhone && (
                        <p className={styles.methodButtonSubtext}>Phone number required</p>
                      )}
                    </div>
                    {selectedEWallet === wallet.code && (
                      <div className={styles.methodCheckmark}>
                        <svg className={styles.methodCheckmarkIcon} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Phone number for OVO */}
              {requiresPhone && (
                <div className={styles.phoneSection}>
                  <label className={styles.phoneLabel}>Phone Number</label>
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className={styles.phoneInput}
                  />
                  <p className={styles.phoneHint}>Enter the phone number linked to your OVO account</p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!canProceed || isLoading}
                className={cn(
                  styles.continueButton,
                  canProceed && !isLoading
                    ? styles.continueButtonEnabled
                    : styles.continueButtonDisabled
                )}
              >
                {isLoading ? 'Processing...' : `Pay with ${selectedEWallet ? getEWalletName(selectedEWallet) : 'E-Wallet'}`}
              </button>
            </div>
          )}
          
          {/* Processing Step */}
          {step === 'processing' && (
            <div className={styles.processingContainer}>
              <div className={styles.spinnerWrapper}>
                <svg className={styles.spinnerIcon} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <h3 className={styles.processingTitle}>
                {category === 'virtual_account' ? 'Creating Virtual Account...' : 'Redirecting...'}
              </h3>
              <p className={styles.processingText}>Please wait...</p>
            </div>
          )}
          
          {/* VA Instructions Step */}
          {step === 'instructions' && vaAccountNumber && (
            <div className={styles.instructionsContainer}>
              <div className={styles.instructionsAmountDisplay}>
                <p className={styles.instructionsAmountLabel}>Transfer exactly</p>
                <p className={styles.instructionsAmountValue}>{formatIdrAmount(amount)}</p>
              </div>

              <div className={styles.instructionsBox}>
                <div className={styles.instructionRow}>
                  <span className={styles.instructionLabel}>Bank</span>
                  <span className={styles.instructionValue}>{selectedBank}</span>
                </div>

                <div className={styles.instructionDivider} />

                <div className={styles.vaNumberSection}>
                  <p className={styles.vaNumberLabel}>Virtual Account Number</p>
                  <div className={styles.vaNumberWrapper}>
                    <code className={styles.vaNumberCode}>
                      {vaAccountNumber}
                    </code>
                    <button
                      onClick={handleCopyVA}
                      className={styles.copyButton}
                    >
                      <CopyIcon />
                    </button>
                  </div>
                </div>

                {vaExpiresAt && (
                  <div className={styles.vaExpiresRow}>
                    <span className={styles.vaExpiresLabel}>Expires</span>
                    <span className={styles.vaExpiresValue}>
                      {new Date(vaExpiresAt).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.warningBox}>
                <p className={styles.warningText}>
                  Transfer the exact amount. Your balance will be credited automatically once payment is received.
                </p>
              </div>

              <button
                onClick={handleClose}
                className={styles.doneButton}
              >
                Done
              </button>
            </div>
          )}
          
          {/* Error Step */}
          {step === 'error' && (
            <div className={styles.errorContainer}>
              <div className={styles.errorIconWrapper}>
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

// ============================================================================
// ICONS
// ============================================================================

function BankIcon(): React.ReactElement {
  return (
    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function WalletIcon(): React.ReactElement {
  return (
    <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function CopyIcon(): React.ReactElement {
  return (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

export default XenditDepositModalVX2;


