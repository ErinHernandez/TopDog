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
import { Close, ChevronLeft } from '../components/icons';
import {
  formatIdrAmount,
  validateWithdrawalAmount,
  IDR_CONFIG,
  parseIdrInput,
} from '../../../lib/xendit/currencyConfig';
import { ID_BANK_CODES, getBankName } from '../../../lib/xendit/xenditTypes';
import type { XenditSavedDisbursementAccount } from '../../../lib/xendit/xenditTypes';
import { createScopedLogger } from '../../../lib/clientLogger';

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
  
  // Load saved accounts
  useEffect(() => {
    if (isOpen && userId) {
      loadSavedAccounts();
    }
  }, [isOpen, userId]);
  
  const loadSavedAccounts = async () => {
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
  };
  
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
      setError(amountValidation.error);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-md bg-[#101927] rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#101927]">
          <div className="flex items-center gap-3">
            {(step === 'bank' || step === 'confirm') && (
              <button
                onClick={handleBack}
                className="p-1 -ml-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
            )}
            <h2 className="text-lg font-semibold text-white">
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
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Close className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Amount Step */}
          {step === 'amount' && (
            <div className="space-y-6">
              {/* Balance display */}
              <div className="text-center py-4 bg-[#1a2537] rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Available Balance</p>
                <p className="text-2xl font-bold text-white">
                  {formatIdrAmount(currentBalance)}
                </p>
              </div>
              
              {/* Amount input */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Withdrawal Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0"
                    className="w-full pl-12 pr-24 py-3 bg-[#1a2537] border border-white/10 rounded-lg text-white text-lg focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button
                    onClick={handleWithdrawAll}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-md transition-colors"
                  >
                    Max
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Minimum: {formatIdrAmount(IDR_CONFIG.minimumWithdrawal)}
                </p>
              </div>
              
              {/* Error */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
              
              {/* Continue button */}
              <button
                onClick={handleContinueToBank}
                disabled={!canProceedToBank}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  canProceedToBank
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </div>
          )}
          
          {/* Bank Account Step */}
          {step === 'bank' && (
            <div className="space-y-4">
              {/* Amount display */}
              <div className="text-center py-3 bg-[#1a2537] rounded-lg">
                <p className="text-sm text-gray-400">Withdrawing</p>
                <p className="text-xl font-bold text-white">
                  {formatIdrAmount(amount)}
                </p>
              </div>
              
              {/* Saved accounts */}
              {savedAccounts.length > 0 && !isAddingNew && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-400">Saved Accounts</p>
                  {savedAccounts.map((account) => (
                    <button
                      key={account.id}
                      onClick={() => setSelectedAccountId(account.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${
                        selectedAccountId === account.id
                          ? 'bg-blue-600/10 border-blue-500'
                          : 'bg-[#1a2537] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#243044] flex items-center justify-center">
                        <span className="text-white font-bold text-xs">
                          {account.channelCode.slice(0, 3)}
                        </span>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-white">{account.channelName}</p>
                        <p className="text-sm text-gray-400">{account.accountNumberMasked}</p>
                      </div>
                      {account.isDefault && (
                        <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
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
                  className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-white/20 rounded-lg text-gray-400 hover:text-white hover:border-white/40 transition-colors"
                >
                  <span className="text-xl">+</span>
                  <span>Add New Bank Account</span>
                </button>
              ) : (
                <div className="space-y-4 p-4 bg-[#1a2537] rounded-lg">
                  <p className="font-medium text-white">New Bank Account</p>
                  
                  {/* Bank selection */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Bank</label>
                    <select
                      value={newBankCode}
                      onChange={(e) => setNewBankCode(e.target.value)}
                      className="w-full px-4 py-2 bg-[#243044] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select Bank</option>
                      {Object.entries(ID_BANK_CODES).map(([code, name]) => (
                        <option key={code} value={code}>{name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Account number */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Account Number</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newAccountNumber}
                      onChange={(e) => setNewAccountNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter account number"
                      className="w-full px-4 py-2 bg-[#243044] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Account name */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={newAccountName}
                      onChange={(e) => setNewAccountName(e.target.value)}
                      placeholder="Enter name as shown on account"
                      className="w-full px-4 py-2 bg-[#243044] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Save for future */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveNewAccount}
                      onChange={(e) => setSaveNewAccount(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-400">Save for future withdrawals</span>
                  </label>
                  
                  {/* Cancel */}
                  <button
                    onClick={() => setIsAddingNew(false)}
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              )}
              
              {/* Continue button */}
              <button
                onClick={handleContinueToConfirm}
                disabled={!canProceedToConfirm}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  canProceedToConfirm
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </div>
          )}
          
          {/* Confirm Step */}
          {step === 'confirm' && (
            <div className="space-y-6">
              <div className="space-y-4 p-4 bg-[#1a2537] rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount</span>
                  <span className="font-semibold text-white">{formatIdrAmount(amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bank</span>
                  <span className="text-white">
                    {isAddingNew ? getBankName(newBankCode) : selectedAccount?.channelName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Account</span>
                  <span className="text-white">
                    {isAddingNew 
                      ? `****${newAccountNumber.slice(-4)}` 
                      : selectedAccount?.accountNumberMasked}
                  </span>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">You will receive</span>
                    <span className="font-bold text-green-400">{formatIdrAmount(amount)}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 text-center">
                Withdrawals to major banks are typically instant.
                Other banks may take 1-2 hours.
              </p>
              
              {/* Error */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
              
              {/* Confirm button */}
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Confirm Withdrawal'}
              </button>
            </div>
          )}
          
          {/* Processing Step */}
          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-blue-600/20">
                <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Processing Withdrawal</h3>
              <p className="text-gray-400">Please wait...</p>
            </div>
          )}
          
          {/* Success Step */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-green-600/20">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Withdrawal Initiated</h3>
              <p className="text-gray-400 mb-6">
                Your withdrawal of {formatIdrAmount(amount)} is being processed.
                {selectedAccount?.channelCode && ['BCA', 'MANDIRI', 'BNI', 'BRI'].includes(selectedAccount.channelCode)
                  ? ' You should receive the funds within minutes.'
                  : ' You should receive the funds within 1-2 hours.'}
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          )}
          
          {/* Error Step */}
          {step === 'error' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-red-600/20">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Withdrawal Failed</h3>
              <p className="text-gray-400 mb-6">{error || 'An error occurred. Please try again.'}</p>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
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


