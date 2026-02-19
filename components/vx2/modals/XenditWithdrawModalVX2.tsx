/**
 * XenditWithdrawModalVX2 - Xendit Withdrawal Modal
 * 
 * Multi-step withdrawal flow for Indonesia:
 * 1. Amount Selection - IDR amounts with balance check
 * 2. Bank Account - Select saved or add new bank account
 * 3. Confirmation - Review and confirm withdrawal
 * 4. Success/Error - Result display
 * 
 * @module components/vx2/modals/XenditWithdrawModalVX2
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';

import { cn } from '@/lib/styles';

import { createScopedLogger } from '../../../lib/clientLogger';
import {
  formatIdrAmount,
  validateWithdrawalAmount,
  IDR_CONFIG,
  parseIdrInput,
} from '../../../lib/xendit/currencyConfig';
import { ID_BANK_CODES, getBankName } from '../../../lib/xendit/xenditTypes';
import type { XenditSavedDisbursementAccount } from '../../../lib/xendit/xenditTypes';
import { Close, ChevronLeft } from '../components/icons';

import styles from './XenditWithdrawModalVX2.module.css';


const logger = createScopedLogger('[XenditWithdraw]');

// ============================================================================
// TYPES
// ============================================================================

export interface XenditWithdrawModalVX2Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  /** Current balance in IDR */
  currentBalance: number;
  onSuccess?: (transactionId: string, amount: number) => void;
}

type WithdrawStep = 'amount' | 'bank' | 'confirm' | 'processing' | 'success' | 'error';

// ============================================================================
// COMPONENT
// ============================================================================

export function XenditWithdrawModalVX2({
  isOpen,
  onClose,
  userId,
  currentBalance,
  onSuccess,
}: XenditWithdrawModalVX2Props): React.ReactElement | null {
  // State
  const [step, setStep] = useState<WithdrawStep>('amount');
  const [amount, setAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [savedAccounts, setSavedAccounts] = useState<XenditSavedDisbursementAccount[]>([]);
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
      const response = await fetch(`/api/user/disbursement-accounts?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSavedAccounts(data.accounts || []);

        // Auto-select default account
        const defaultAccount = data.accounts?.find((a: XenditSavedDisbursementAccount) => a.isDefault);
        if (defaultAccount) {
          setSelectedAccountId(defaultAccount.id);
        }
      }
    } catch (err) {
      logger.error('Failed to load accounts', err);
    }
  }, [userId]);

  // Load saved accounts
  useEffect(() => {
    if (isOpen && userId) {
      loadSavedAccounts();
    }
  }, [isOpen, userId, loadSavedAccounts]);
  
  // Validation
  const amountValidation = useMemo(() => {
    if (amount <= 0) return { isValid: false, error: 'Please enter an amount' };
    return validateWithdrawalAmount(amount, currentBalance);
  }, [amount, currentBalance]);
  
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
    const parsed = parseIdrInput(value);
    if (parsed !== null) {
      setAmount(parsed);
    } else {
      setAmount(0);
    }
    setError(null);
  }, []);
  
  const handleWithdrawAll = useCallback(() => {
    setAmount(currentBalance);
    setCustomAmount(formatIdrAmount(currentBalance, { showSymbol: false }));
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
        accountId: isAddingNew ? 'new' : selectedAccountId,
      };
      
      if (isAddingNew) {
        body.newAccount = {
          bankCode: newBankCode,
          accountNumber: newAccountNumber,
          accountHolderName: newAccountName,
          saveForFuture: saveNewAccount,
        };
      }
      
      const response = await fetch('/api/xendit/disbursement', {
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
    <div className={styles.overlay}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {(step === 'bank' || step === 'confirm') && (
              <button
                onClick={handleBack}
                className={styles.backButton}
              >
                <ChevronLeft className={styles.backIcon} />
              </button>
            )}
            <h2 className={styles.headerTitle}>
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
            <Close className={styles.closeIcon} />
          </button>
        </div>
        
        {/* Content */}
        <div className={styles.content}>
          {/* Amount Step */}
          {step === 'amount' && (
            <div className={styles.contentSection}>
              {/* Balance display */}
              <div className={styles.balanceDisplay}>
                <p className={styles.balanceLabel}>Available Balance</p>
                <p className={styles.balanceAmount}>
                  {formatIdrAmount(currentBalance)}
                </p>
              </div>

              {/* Amount input */}
              <div className={styles.amountInputGroup}>
                <label className={styles.amountLabel}>
                  Withdrawal Amount
                </label>
                <div className={styles.amountInputContainer}>
                  <span className={styles.amountPrefix}>
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0"
                    className={styles.amountInput}
                  />
                  <button
                    onClick={handleWithdrawAll}
                    className={styles.maxButton}
                  >
                    Max
                  </button>
                </div>
                <p className={styles.minimumHint}>
                  Minimum: {formatIdrAmount(IDR_CONFIG.minimumWithdrawal)}
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
                className={cn(
                  styles.continueButton,
                  canProceedToBank
                    ? styles.continueButtonEnabled
                    : styles.continueButtonDisabled
                )}
              >
                Continue
              </button>
            </div>
          )}
          
          {/* Bank Account Step */}
          {step === 'bank' && (
            <div className={styles.contentSectionSmall}>
              {/* Amount display */}
              <div className={styles.amountDisplaySmall}>
                <p className={styles.amountLabelSmall}>Withdrawing</p>
                <p className={styles.amountValueSmall}>
                  {formatIdrAmount(amount)}
                </p>
              </div>

              {/* Saved accounts */}
              {savedAccounts.length > 0 && !isAddingNew && (
                <div className={styles.savedAccountsContainer}>
                  <p className={styles.savedAccountsTitle}>Saved Accounts</p>
                  {savedAccounts.map((account) => (
                    <button
                      key={account.id}
                      onClick={() => setSelectedAccountId(account.id)}
                      className={cn(
                        styles.accountCard,
                        selectedAccountId === account.id && styles.accountCardActive
                      )}
                    >
                      <div className={styles.accountIcon}>
                        <span className={styles.accountIconText}>
                          {account.channelCode.slice(0, 3)}
                        </span>
                      </div>
                      <div className={styles.accountInfo}>
                        <p className={styles.accountName}>{account.channelName}</p>
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
                  className={styles.addNewAccountButton}
                >
                  <span className={styles.plusIcon}>+</span>
                  <span>Add New Bank Account</span>
                </button>
              ) : (
                <div className={styles.newAccountForm}>
                  <p className={styles.newAccountTitle}>New Bank Account</p>

                  {/* Bank selection */}
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Bank</label>
                    <select
                      value={newBankCode}
                      onChange={(e) => setNewBankCode(e.target.value)}
                      className={styles.formSelect}
                    >
                      <option value="">Select Bank</option>
                      {Object.entries(ID_BANK_CODES).map(([code, name]) => (
                        <option key={code} value={code}>{name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Account number */}
                  <div className={styles.formField}>
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
                  <div className={styles.formField}>
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
                  <label className={styles.checkboxContainer}>
                    <input
                      type="checkbox"
                      checked={saveNewAccount}
                      onChange={(e) => setSaveNewAccount(e.target.checked)}
                      className={styles.checkbox}
                    />
                    <span className={styles.checkboxLabel}>Save for future withdrawals</span>
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
                className={cn(
                  styles.continueButton,
                  canProceedToConfirm
                    ? styles.continueButtonEnabled
                    : styles.continueButtonDisabled
                )}
              >
                Continue
              </button>
            </div>
          )}
          
          {/* Confirm Step */}
          {step === 'confirm' && (
            <div className={styles.contentSection}>
              <div className={styles.confirmationBox}>
                <div className={styles.confirmationRow}>
                  <span className={styles.confirmationLabel}>Amount</span>
                  <span className={styles.confirmationValueBold}>{formatIdrAmount(amount)}</span>
                </div>
                <div className={styles.confirmationRow}>
                  <span className={styles.confirmationLabel}>Bank</span>
                  <span className={styles.confirmationValue}>
                    {isAddingNew ? getBankName(newBankCode) : selectedAccount?.channelName}
                  </span>
                </div>
                <div className={styles.confirmationRow}>
                  <span className={styles.confirmationLabel}>Account</span>
                  <span className={styles.confirmationValue}>
                    {isAddingNew
                      ? `****${newAccountNumber.slice(-4)}`
                      : selectedAccount?.accountNumberMasked}
                  </span>
                </div>
                <div className={styles.confirmationDivider}>
                  <div className={styles.confirmationRow}>
                    <span className={styles.confirmationLabel}>You will receive</span>
                    <span className={styles.confirmationValueGreen}>{formatIdrAmount(amount)}</span>
                  </div>
                </div>
              </div>

              <p className={styles.confirmationNote}>
                Withdrawals to major banks are typically instant.
                Other banks may take 1-2 hours.
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
            <div className={styles.stateContainer}>
              <div className={styles.spinnerContainer}>
                <svg className={styles.spinnerIcon} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <h3 className={styles.stateTitle}>Processing Withdrawal</h3>
              <p className={styles.stateMessage}>Please wait...</p>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className={styles.stateContainer}>
              <div className={styles.successIconContainer}>
                <svg className={styles.successIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className={styles.stateTitle}>Withdrawal Initiated</h3>
              <p className={styles.stateMessage}>
                Your withdrawal of {formatIdrAmount(amount)} is being processed.
                {selectedAccount?.channelCode && ['BCA', 'MANDIRI', 'BNI', 'BRI'].includes(selectedAccount.channelCode)
                  ? ' You should receive the funds within minutes.'
                  : ' You should receive the funds within 1-2 hours.'}
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
            <div className={styles.stateContainer}>
              <div className={styles.errorIconContainer}>
                <svg className={styles.errorIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className={styles.stateTitle}>Withdrawal Failed</h3>
              <p className={styles.stateMessage}>{error || 'An error occurred. Please try again.'}</p>
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

export default XenditWithdrawModalVX2;


