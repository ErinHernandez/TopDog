/**
 * PayMongoWithdrawModalVX2 - PayMongo Withdrawal Modal
 * 
 * Multi-step withdrawal flow for Philippines:
 * 1. Amount Selection - PHP amounts with balance check
 * 2. Bank Account - Select saved or add new bank account
 * 3. Confirmation - Review and confirm withdrawal
 * 4. Success/Error - Result display
 * 
 * @module components/vx2/modals/PayMongoWithdrawModalVX2
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';

import { cn } from '@/lib/styles';

import { createScopedLogger } from '../../../lib/clientLogger';
import {
  formatPhpAmount,
  toSmallestUnit,
  validateWithdrawalAmount,
  PHP_CONFIG,
} from '../../../lib/paymongo/currencyConfig';
import { PH_BANK_CODES, getBankName } from '../../../lib/paymongo/paymongoTypes';
import type { PayMongoSavedBankAccount } from '../../../lib/paymongo/paymongoTypes';
import { Close, ChevronLeft } from '../components/icons';


import styles from './PayMongoWithdrawModalVX2.module.css';

const logger = createScopedLogger('[PayMongoWithdraw]');

// ============================================================================
// TYPES
// ============================================================================

export interface PayMongoWithdrawModalVX2Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  /** Current balance in PHP */
  currentBalance: number;
  onSuccess?: (transactionId: string, amount: number) => void;
}

type WithdrawStep = 'amount' | 'bank' | 'confirm' | 'processing' | 'success' | 'error';

// ============================================================================
// COMPONENT
// ============================================================================

export function PayMongoWithdrawModalVX2({
  isOpen,
  onClose,
  userId,
  currentBalance,
  onSuccess,
}: PayMongoWithdrawModalVX2Props): React.ReactElement | null {
  // State
  const [step, setStep] = useState<WithdrawStep>('amount');
  const [amount, setAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [savedAccounts, setSavedAccounts] = useState<PayMongoSavedBankAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newBankCode, setNewBankCode] = useState<string>('');
  const [newAccountNumber, setNewAccountNumber] = useState<string>('');
  const [newAccountName, setNewAccountName] = useState<string>('');
  const [saveNewAccount, setSaveNewAccount] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  
  const loadSavedAccounts = useCallback(async () => {
    try {
      const response = await fetch(`/api/user/bank-accounts?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSavedAccounts(data.accounts || []);

        // Auto-select default account
        const defaultAccount = data.accounts?.find((a: PayMongoSavedBankAccount) => a.isDefault);
        if (defaultAccount) {
          setSelectedAccountId(defaultAccount.id);
        }
      }
    } catch (err) {
      logger.error('Failed to load bank accounts', err);
    }
  }, [userId]);

  // Load saved accounts
  useEffect(() => {
    if (isOpen && userId) {
      loadSavedAccounts();
    }
  }, [isOpen, userId, loadSavedAccounts]);
  
  // Validation
  const balanceCentavos = useMemo(() => toSmallestUnit(currentBalance), [currentBalance]);
  const amountCentavos = useMemo(() => toSmallestUnit(amount), [amount]);
  
  const amountValidation = useMemo(() => {
    if (amount <= 0) return { isValid: false, error: 'Please enter an amount' };
    return validateWithdrawalAmount(amountCentavos, balanceCentavos);
  }, [amount, amountCentavos, balanceCentavos]);
  
  const selectedAccount = useMemo(() => {
    return savedAccounts.find(a => a.id === selectedAccountId) || null;
  }, [savedAccounts, selectedAccountId]);
  
  const canProceedToBank = useMemo(() => {
    return amountValidation.isValid;
  }, [amountValidation]);
  
  const canProceedToConfirm = useMemo(() => {
    if (isAddingNew) {
      return newBankCode && newAccountNumber.length >= 10 && newAccountName.length >= 2;
    }
    return selectedAccountId !== null;
  }, [isAddingNew, newBankCode, newAccountNumber, newAccountName, selectedAccountId]);
  
  // Handlers
  const handleAmountChange = useCallback((value: string) => {
    setCustomAmount(value);
    const parsed = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed)) {
      setAmount(parsed);
    } else {
      setAmount(0);
    }
    setError(null);
  }, []);
  
  const handleWithdrawAll = useCallback(() => {
    setAmount(currentBalance);
    setCustomAmount(currentBalance.toString());
  }, [currentBalance]);
  
  const handleContinueToBank = useCallback(() => {
    if (!amountValidation.isValid) {
      setError(amountValidation.error ?? null);
      return;
    }
    setStep('bank');
  }, [amountValidation]);
  
  const handleContinueToConfirm = useCallback(() => {
    if (!canProceedToConfirm) return;
    setStep('confirm');
  }, [canProceedToConfirm]);
  
  const handleBack = useCallback(() => {
    if (step === 'bank') {
      setStep('amount');
    } else if (step === 'confirm') {
      setStep('bank');
    }
  }, [step]);
  
  const handleSubmit = useCallback(async () => {
    if (!canProceedToConfirm || !amountValidation.isValid) return;
    
    setIsLoading(true);
    setError(null);
    setStep('processing');
    
    try {
      const body: Record<string, unknown> = {
        amount,
        userId,
        bankAccountId: isAddingNew ? 'new' : selectedAccountId,
      };
      
      if (isAddingNew) {
        body.newBankAccount = {
          bankCode: newBankCode,
          accountNumber: newAccountNumber,
          accountHolderName: newAccountName,
          saveForFuture: saveNewAccount,
        };
      }
      
      const response = await fetch('/api/paymongo/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create withdrawal');
      }
      
      setTransactionId(data.transactionId);
      setStep('success');
      
      if (onSuccess) {
        onSuccess(data.transactionId, amount);
      }
      
    } catch (err) {
      logger.error('Withdrawal error', err);
      setError(err instanceof Error ? err.message : 'Failed to process withdrawal');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  }, [
    canProceedToConfirm, amountValidation, amount, userId,
    isAddingNew, selectedAccountId, newBankCode, newAccountNumber,
    newAccountName, saveNewAccount, onSuccess,
  ]);
  
  const handleReset = useCallback(() => {
    setStep('amount');
    setAmount(0);
    setCustomAmount('');
    setSelectedAccountId(null);
    setIsAddingNew(false);
    setNewBankCode('');
    setNewAccountNumber('');
    setNewAccountName('');
    setError(null);
    setTransactionId(null);
  }, []);
  
  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);
  
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            {(step === 'bank' || step === 'confirm') && (
              <button
                onClick={handleBack}
                className={styles.backButton}
              >
                <ChevronLeft className={cn(styles.backIcon, 'w-5 h-5')} />
              </button>
            )}
            <h2 className={styles.modalTitle}>
              {step === 'amount' && 'Withdraw'}
              {step === 'bank' && 'Select Bank Account'}
              {step === 'confirm' && 'Confirm Withdrawal'}
              {step === 'processing' && 'Processing...'}
              {step === 'success' && 'Withdrawal Initiated'}
              {step === 'error' && 'Error'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className={styles.closeButton}
          >
            <Close className={cn(styles.closeIcon, 'w-5 h-5')} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalBody}>
          {/* Amount Step */}
          {step === 'amount' && (
            <div className={styles.contentContainer}>
              {/* Balance display */}
              <div className={styles.balanceDisplay}>
                <p className={styles.balanceLabel}>Available Balance</p>
                <p className={styles.balanceAmount}>
                  {formatPhpAmount(balanceCentavos)}
                </p>
              </div>

              {/* Amount input */}
              <div className={styles.amountInputContainer}>
                <label className={styles.amountInputLabel}>
                  Withdrawal Amount
                </label>
                <div className={styles.amountInputWrapper}>
                  <span className={styles.amountCurrencySymbol}>
                    {PHP_CONFIG.symbol}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={customAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.00"
                    className={styles.amountInput}
                  />
                  <button
                    onClick={handleWithdrawAll}
                    className={styles.amountMaxButton}
                  >
                    Max
                  </button>
                </div>
                <p className={styles.amountMinimumNote}>
                  Minimum: {formatPhpAmount(PHP_CONFIG.minimumWithdrawalCentavos)}
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className={styles.errorContainer}>
                  <p className={styles.errorText}>{error}</p>
                </div>
              )}

              {/* Continue button */}
              <button
                onClick={handleContinueToBank}
                disabled={!canProceedToBank}
                className={cn(styles.continueButton, !canProceedToBank && styles.continueButtonDisabled)}
              >
                Continue
              </button>
            </div>
          )}


          {/* Bank Account Step */}
          {step === 'bank' && (
            <div className={styles.contentContainer}>
              {/* Amount display */}
              <div className={styles.amountDisplayContainer}>
                <p className={styles.amountDisplayLabel}>Withdrawing</p>
                <p className={styles.amountDisplayValue}>
                  {formatPhpAmount(amountCentavos)}
                </p>
              </div>

              {/* Saved accounts */}
              {savedAccounts.length > 0 && !isAddingNew && (
                <div className={styles.savedAccountsSection}>
                  <p className={styles.savedAccountsLabel}>Saved Accounts</p>
                  {savedAccounts.map((account) => (
                    <button
                      key={account.id}
                      onClick={() => setSelectedAccountId(account.id)}
                      className={cn(
                        styles.accountButton,
                        selectedAccountId === account.id && styles.selected
                      )}
                    >
                      <div className={styles.bankIconBox}>
                        <span className={styles.bankIconText}>
                          {account.bankCode.slice(0, 2)}
                        </span>
                      </div>
                      <div className={styles.accountInfo}>
                        <p className={styles.bankName}>{account.bankName}</p>
                        <p className={styles.accountNumber}>{account.accountNumberMasked}</p>
                      </div>
                      {account.isDefault && (
                        <span className={styles.defaultBadge}>
                          Default
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Add new account */}
              {!isAddingNew ? (
                <button
                  onClick={() => setIsAddingNew(true)}
                  className={styles.addNewBankButton}
                >
                  <span className={styles.addNewBankIcon}>+</span>
                  <span className={styles.addNewBankText}>Add New Bank Account</span>
                </button>
              ) : (
                <div className={styles.newBankForm}>
                  <p className={styles.formTitle}>New Bank Account</p>

                  {/* Bank selection */}
                  <div className={styles.formFieldGroup}>
                    <label className={styles.formLabel}>Bank</label>
                    <select
                      value={newBankCode}
                      onChange={(e) => setNewBankCode(e.target.value)}
                      className={styles.formSelect}
                    >
                      <option value="">Select Bank</option>
                      {Object.entries(PH_BANK_CODES).map(([code, name]) => (
                        <option key={code} value={code}>{name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Account number */}
                  <div className={styles.formFieldGroup}>
                    <label className={styles.formLabel}>Account Number</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newAccountNumber}
                      onChange={(e) => setNewAccountNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter account number"
                      className={styles.formInput}
                    />
                  </div>

                  {/* Account name */}
                  <div className={styles.formFieldGroup}>
                    <label className={styles.formLabel}>Account Holder Name</label>
                    <input
                      type="text"
                      value={newAccountName}
                      onChange={(e) => setNewAccountName(e.target.value)}
                      placeholder="Enter name as shown on account"
                      className={styles.formInput}
                    />
                  </div>

                  {/* Save for future */}
                  <label className={styles.saveCheckboxLabel}>
                    <input
                      type="checkbox"
                      checked={saveNewAccount}
                      onChange={(e) => setSaveNewAccount(e.target.checked)}
                      className={styles.saveCheckbox}
                    />
                    <span className={styles.saveCheckboxText}>Save for future withdrawals</span>
                  </label>

                  {/* Cancel */}
                  <button
                    onClick={() => setIsAddingNew(false)}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Continue button */}
              <button
                onClick={handleContinueToConfirm}
                disabled={!canProceedToConfirm}
                className={cn(styles.continueButton, !canProceedToConfirm && styles.continueButtonDisabled)}
              >
                Continue
              </button>
            </div>
          )}


          {/* Confirm Step */}
          {step === 'confirm' && (
            <div className={styles.contentContainer}>
              <div className={styles.confirmSummary}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Amount</span>
                  <span className={styles.summaryValue}>{formatPhpAmount(amountCentavos)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Bank</span>
                  <span className={styles.summaryValue}>
                    {isAddingNew ? getBankName(newBankCode) : selectedAccount?.bankName}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Account</span>
                  <span className={styles.summaryValue}>
                    {isAddingNew
                      ? `****${newAccountNumber.slice(-4)}`
                      : selectedAccount?.accountNumberMasked}
                  </span>
                </div>
                <div className={styles.summaryDivider}>
                  <div className={styles.summaryRow}>
                    <span className={styles.receivedLabel}>You will receive</span>
                    <span className={styles.receivedAmount}>{formatPhpAmount(amountCentavos)}</span>
                  </div>
                </div>
              </div>

              <p className={styles.processingNote}>
                Withdrawals are typically processed within 1-2 business days
              </p>

              {/* Error */}
              {error && (
                <div className={styles.errorContainer}>
                  <p className={styles.errorText}>{error}</p>
                </div>
              )}

              {/* Confirm button */}
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className={styles.confirmButton}
              >
                {isLoading ? 'Processing...' : 'Confirm Withdrawal'}
              </button>
            </div>
          )}


          {/* Processing Step */}
          {step === 'processing' && (
            <div className={styles.processingContainer}>
              <div className={styles.processingIconBox}>
                <svg className={styles.processingIcon} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <h3 className={styles.processingTitle}>Processing Withdrawal</h3>
              <p className={styles.processingText}>Please wait...</p>
            </div>
          )}


          {/* Success Step */}
          {step === 'success' && (
            <div className={styles.successContainer}>
              <div className={styles.successIconBox}>
                <svg className={styles.successIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className={styles.successTitle}>Withdrawal Initiated</h3>
              <p className={styles.successMessage}>
                Your withdrawal of {formatPhpAmount(amountCentavos)} is being processed.
                You will receive the funds within 1-2 business days.
              </p>
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
            <div className={styles.errorResultContainer}>
              <div className={styles.errorIconBox}>
                <svg className={styles.errorIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className={styles.errorTitle}>Withdrawal Failed</h3>
              <p className={styles.errorResultMessage}>{error || 'An error occurred. Please try again.'}</p>
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

export default PayMongoWithdrawModalVX2;


