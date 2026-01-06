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
import { Close, ChevronLeft } from '../components/icons';
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
import { createScopedLogger } from '../../../lib/clientLogger';

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
      setError(amountValidation.error);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-md bg-[#101927] rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#101927]">
          <div className="flex items-center gap-3">
            {(step === 'category' || step === 'method') && (
              <button
                onClick={handleBack}
                className="p-1 -ml-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
            )}
            <h2 className="text-lg font-semibold text-white">
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
              {/* Quick amounts */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Select Amount
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map(({ amount: idrAmount, display }) => (
                    <button
                      key={idrAmount}
                      onClick={() => handleQuickAmount(idrAmount)}
                      className={`py-3 px-2 rounded-lg font-medium text-sm transition-all ${
                        amount === idrAmount
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#1a2537] text-gray-300 hover:bg-[#243044]'
                      }`}
                    >
                      {display}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Custom amount */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Or Enter Custom Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-3 bg-[#1a2537] border border-white/10 rounded-lg text-white text-lg focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Min: {formatIdrAmount(IDR_CONFIG.minimumDeposit)} | 
                  Max: {formatIdrAmount(IDR_CONFIG.maximumDeposit)}
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
                onClick={handleContinueToCategory}
                disabled={!amountValidation.isValid}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  amountValidation.isValid
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue with {amount > 0 ? formatIdrAmount(amount) : 'amount'}
              </button>
            </div>
          )}
          
          {/* Category Selection Step */}
          {step === 'category' && (
            <div className="space-y-4">
              {/* Amount display */}
              <div className="text-center py-4 bg-[#1a2537] rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Deposit Amount</p>
                <p className="text-2xl font-bold text-white">
                  {formatIdrAmount(amount)}
                </p>
              </div>
              
              {/* Payment categories */}
              <div className="space-y-3">
                <button
                  onClick={() => handleSelectCategory('virtual_account')}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border border-white/10 bg-[#1a2537] hover:border-blue-500/50 transition-all"
                >
                  <div className="w-12 h-12 rounded-lg bg-green-600/20 flex items-center justify-center">
                    <BankIcon />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-white">Virtual Account</p>
                    <p className="text-sm text-gray-400">Transfer from any bank - Most popular</p>
                  </div>
                  <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
                    60%+
                  </span>
                </button>
                
                <button
                  onClick={() => handleSelectCategory('ewallet')}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border border-white/10 bg-[#1a2537] hover:border-blue-500/50 transition-all"
                >
                  <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center">
                    <WalletIcon />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-white">E-Wallet</p>
                    <p className="text-sm text-gray-400">OVO, GoPay, DANA, ShopeePay</p>
                  </div>
                </button>
              </div>
            </div>
          )}
          
          {/* Method Selection Step */}
          {step === 'method' && category === 'virtual_account' && (
            <div className="space-y-4">
              <div className="text-center py-3 bg-[#1a2537] rounded-lg">
                <p className="text-sm text-gray-400">Depositing</p>
                <p className="text-xl font-bold text-white">{formatIdrAmount(amount)}</p>
              </div>
              
              <p className="text-sm font-medium text-gray-400">Select your bank</p>
              
              <div className="space-y-2">
                {VA_BANKS.map((bank) => (
                  <button
                    key={bank.code}
                    onClick={() => setSelectedBank(bank.code)}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${
                      selectedBank === bank.code
                        ? 'bg-blue-600/10 border-blue-500'
                        : 'bg-[#1a2537] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#243044] flex items-center justify-center">
                      <span className="text-white font-bold text-xs">{bank.code.slice(0, 3)}</span>
                    </div>
                    <span className="font-medium text-white">{bank.name}</span>
                    {selectedBank === bank.code && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
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
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  selectedBank && !isLoading
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? 'Creating...' : 'Get Virtual Account Number'}
              </button>
            </div>
          )}
          
          {step === 'method' && category === 'ewallet' && (
            <div className="space-y-4">
              <div className="text-center py-3 bg-[#1a2537] rounded-lg">
                <p className="text-sm text-gray-400">Depositing</p>
                <p className="text-xl font-bold text-white">{formatIdrAmount(amount)}</p>
              </div>
              
              <p className="text-sm font-medium text-gray-400">Select e-wallet</p>
              
              <div className="space-y-2">
                {EWALLETS.map((wallet) => (
                  <button
                    key={wallet.code}
                    onClick={() => setSelectedEWallet(wallet.code)}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${
                      selectedEWallet === wallet.code
                        ? 'bg-blue-600/10 border-blue-500'
                        : 'bg-[#1a2537] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#243044] flex items-center justify-center">
                      <span className="text-white font-bold text-xs">{wallet.name.slice(0, 2)}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-medium text-white">{wallet.name}</span>
                      {wallet.requiresPhone && (
                        <p className="text-xs text-gray-400">Phone number required</p>
                      )}
                    </div>
                    {selectedEWallet === wallet.code && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Phone number for OVO */}
              {requiresPhone && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-4 py-3 bg-[#1a2537] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Enter the phone number linked to your OVO account</p>
                </div>
              )}
              
              <button
                onClick={handleSubmit}
                disabled={!canProceed || isLoading}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  canProceed && !isLoading
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? 'Processing...' : `Pay with ${selectedEWallet ? getEWalletName(selectedEWallet) : 'E-Wallet'}`}
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
              <h3 className="text-lg font-semibold text-white mb-2">
                {category === 'virtual_account' ? 'Creating Virtual Account...' : 'Redirecting...'}
              </h3>
              <p className="text-gray-400">Please wait...</p>
            </div>
          )}
          
          {/* VA Instructions Step */}
          {step === 'instructions' && vaAccountNumber && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">Transfer exactly</p>
                <p className="text-3xl font-bold text-white">{formatIdrAmount(amount)}</p>
              </div>
              
              <div className="p-4 bg-[#1a2537] rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Bank</span>
                  <span className="font-semibold text-white">{selectedBank}</span>
                </div>
                
                <div className="border-t border-white/10" />
                
                <div>
                  <p className="text-sm text-gray-400 mb-2">Virtual Account Number</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-[#243044] rounded-lg text-lg font-mono text-white tracking-wider">
                      {vaAccountNumber}
                    </code>
                    <button
                      onClick={handleCopyVA}
                      className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      <CopyIcon />
                    </button>
                  </div>
                </div>
                
                {vaExpiresAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Expires</span>
                    <span className="text-yellow-400">
                      {new Date(vaExpiresAt).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-400">
                  Transfer the exact amount. Your balance will be credited automatically once payment is received.
                </p>
              </div>
              
              <button
                onClick={handleClose}
                className="w-full py-3 bg-[#1a2537] hover:bg-[#243044] text-white font-medium rounded-lg transition-colors"
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
              <h3 className="text-lg font-semibold text-white mb-2">Payment Failed</h3>
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


