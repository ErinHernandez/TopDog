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
import { BG_COLORS, TEXT_COLORS, STATE_COLORS, BORDER_COLORS } from '../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../core/constants/sizes';
import { Close, ChevronLeft } from '../components/icons';
import {
  formatPhpAmount,
  toSmallestUnit,
  validateDepositAmount,
  getQuickDepositAmounts,
  PHP_CONFIG,
} from '../../../lib/paymongo/currencyConfig';
import { createScopedLogger } from '../../../lib/clientLogger';

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
    <div className="w-10 h-10 rounded-lg bg-[#007DFE] flex items-center justify-center">
      <span className="text-white font-bold text-sm">G</span>
    </div>
  );
}

function MayaIcon(): React.ReactElement {
  return (
    <div className="w-10 h-10 rounded-lg bg-[#00D563] flex items-center justify-center">
      <span className="text-white font-bold text-sm">M</span>
    </div>
  );
}

function GrabPayIcon(): React.ReactElement {
  return (
    <div className="w-10 h-10 rounded-lg bg-[#00B14F] flex items-center justify-center">
      <span className="text-white font-bold text-sm">G</span>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-md bg-[#101927] rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {step === 'method' && (
              <button
                onClick={handleBack}
                className="p-1 -ml-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
            )}
            <h2 className="text-lg font-semibold text-white">
              {step === 'amount' && 'Deposit'}
              {step === 'method' && 'Select Payment Method'}
              {step === 'processing' && 'Processing...'}
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
          {/* Amount Selection Step */}
          {step === 'amount' && (
            <div className="space-y-6">
              {/* Quick amounts */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Select Amount
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map(({ display }) => (
                    <button
                      key={display}
                      onClick={() => handleQuickAmount(display)}
                      className={`py-3 px-4 rounded-lg font-medium transition-all ${
                        amount === display
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#1a2537] text-gray-300 hover:bg-[#243044]'
                      }`}
                    >
                      {PHP_CONFIG.symbol}{display.toLocaleString()}
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
                    {PHP_CONFIG.symbol}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 bg-[#1a2537] border border-white/10 rounded-lg text-white text-lg focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Min: {formatPhpAmount(PHP_CONFIG.minimumDepositCentavos)} | 
                  Max: {formatPhpAmount(PHP_CONFIG.maximumDepositCentavos)}
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
                onClick={handleContinueToMethod}
                disabled={!amountValidation.isValid}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  amountValidation.isValid
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue with {amount > 0 ? formatPhpAmount(toSmallestUnit(amount)) : 'amount'}
              </button>
            </div>
          )}
          
          {/* Payment Method Step */}
          {step === 'method' && (
            <div className="space-y-4">
              {/* Amount display */}
              <div className="text-center py-4 bg-[#1a2537] rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Deposit Amount</p>
                <p className="text-2xl font-bold text-white">
                  {formatPhpAmount(toSmallestUnit(amount))}
                </p>
              </div>
              
              {/* Payment methods */}
              <div className="space-y-2">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => handleSelectMethod(method.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${
                      selectedMethod === method.id
                        ? 'bg-blue-600/10 border-blue-500'
                        : 'bg-[#1a2537] border-white/10 hover:border-white/20'
                    }`}
                  >
                    {method.icon}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{method.name}</span>
                        {method.popular && (
                          <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{method.description}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedMethod === method.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-600'
                    }`}>
                      {selectedMethod === method.id && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Error */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
              
              {/* Pay button */}
              <button
                onClick={handleSubmit}
                disabled={!selectedMethod || isLoading}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  selectedMethod && !isLoading
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? 'Processing...' : `Pay ${formatPhpAmount(toSmallestUnit(amount))}`}
              </button>
              
              {/* Security note */}
              <p className="text-xs text-gray-500 text-center">
                You will be redirected to complete payment securely
              </p>
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
              <h3 className="text-lg font-semibold text-white mb-2">Redirecting...</h3>
              <p className="text-gray-400">Please wait while we redirect you to complete your payment.</p>
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

export default PayMongoDepositModalVX2;


