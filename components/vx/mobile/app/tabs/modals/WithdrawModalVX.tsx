/**
 * WithdrawModalVX - Withdrawal Modal for VX Profile
 * 
 * Enterprise-grade withdrawal system with:
 * - Global accessibility (works for users anywhere)
 * - No ID/document requirements
 * - Free withdrawals
 * - 6-digit confirmation code security
 * 
 * Design principle: If someone in rural Haiti can't withdraw in 60 seconds, we failed.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { TEXT_COLORS, BG_COLORS, STATE_COLORS } from '../../../../constants/colors';

// ============================================================================
// TYPES
// ============================================================================

export interface WithdrawModalVXProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PayoutMethod {
  id: string;
  type: 'paypal' | 'bank';
  label: string;
  detail: string;  // Masked email or account number
  isDefault: boolean;
}

type WithdrawStep = 'amount' | 'confirm' | 'code' | 'success' | 'error';

// ============================================================================
// CONSTANTS
// ============================================================================

const ACCENT_COLOR = STATE_COLORS.active;

const LIMITS = {
  minWithdrawal: 10,
  fee: 0,  // Always free
};

const QUICK_AMOUNTS = [50, 100, 250, 500];

// Mock data - in production, comes from user context
const MOCK_BALANCE = 425.00;
const MOCK_PAYOUT_METHODS: PayoutMethod[] = [
  {
    id: 'pp_1',
    type: 'paypal',
    label: 'PayPal',
    detail: 'j***e@email.com',
    isDefault: true,
  },
];

const MOCK_USER_CONTACT = {
  type: 'email' as const,
  masked: 'j***e@email.com',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatAmount(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function generateMockCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ============================================================================
// PAYOUT METHOD ICON
// ============================================================================

function PayoutMethodIcon({ type }: { type: 'paypal' | 'bank' }): React.ReactElement {
  if (type === 'paypal') {
    return (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.646h6.803c2.254 0 4.026.612 5.136 1.773 1.048 1.095 1.423 2.605 1.114 4.49-.32 1.967-1.244 3.59-2.674 4.693-1.402 1.082-3.261 1.631-5.524 1.631H8.008a.769.769 0 0 0-.758.646l-1.174 5.63z"/>
      </svg>
    );
  }
  
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3" />
    </svg>
  );
}

// ============================================================================
// AMOUNT STEP
// ============================================================================

interface AmountStepProps {
  balance: number;
  amount: string;
  setAmount: (amount: string) => void;
  selectedMethod: PayoutMethod | null;
  setSelectedMethod: (method: PayoutMethod) => void;
  payoutMethods: PayoutMethod[];
  onContinue: () => void;
  onClose: () => void;
}

function AmountStep({
  balance,
  amount,
  setAmount,
  selectedMethod,
  setSelectedMethod,
  payoutMethods,
  onContinue,
  onClose,
}: AmountStepProps): React.ReactElement {
  const numericAmount = parseFloat(amount) || 0;
  const isValidAmount = numericAmount >= LIMITS.minWithdrawal && numericAmount <= balance;
  const canContinue = isValidAmount && selectedMethod !== null;

  const handleQuickAmount = (quickAmount: number) => {
    if (quickAmount <= balance) {
      setAmount(quickAmount.toString());
    }
  };

  const handleMaxAmount = () => {
    setAmount(balance.toString());
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
      >
        <h2 
          className="text-lg font-bold"
          style={{ color: TEXT_COLORS.primary }}
        >
          Withdraw Funds
        </h2>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          style={{ color: TEXT_COLORS.secondary }}
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: 'none' }}>
        {/* Available Balance */}
        <div 
          className="rounded-xl p-4 mb-6"
          style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
        >
          <div 
            className="text-xs font-medium mb-1"
            style={{ color: TEXT_COLORS.secondary }}
          >
            Available Balance
          </div>
          <div 
            className="text-2xl font-bold"
            style={{ color: '#10B981' }}
          >
            ${formatAmount(balance)}
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label 
            className="block text-sm font-medium mb-3"
            style={{ color: TEXT_COLORS.primary }}
          >
            How much would you like to withdraw?
          </label>
          
          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {QUICK_AMOUNTS.map(quickAmount => (
              <button
                key={quickAmount}
                onClick={() => handleQuickAmount(quickAmount)}
                disabled={quickAmount > balance}
                className="py-3 rounded-lg font-semibold text-sm transition-all"
                style={{
                  backgroundColor: parseFloat(amount) === quickAmount 
                    ? ACCENT_COLOR 
                    : 'rgba(255, 255, 255, 0.05)',
                  color: parseFloat(amount) === quickAmount 
                    ? '#000000' 
                    : quickAmount > balance 
                      ? TEXT_COLORS.disabled 
                      : TEXT_COLORS.primary,
                  opacity: quickAmount > balance ? 0.5 : 1,
                }}
              >
                ${quickAmount}
              </button>
            ))}
            <button
              onClick={handleMaxAmount}
              className="py-3 rounded-lg font-semibold text-sm transition-all"
              style={{
                backgroundColor: parseFloat(amount) === balance 
                  ? ACCENT_COLOR 
                  : 'rgba(255, 255, 255, 0.05)',
                color: parseFloat(amount) === balance 
                  ? '#000000' 
                  : TEXT_COLORS.primary,
              }}
            >
              MAX
            </button>
          </div>

          {/* Custom Amount Input */}
          <div className="relative">
            <span 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold"
              style={{ color: TEXT_COLORS.secondary }}
            >
              $
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min={LIMITS.minWithdrawal}
              max={balance}
              step="0.01"
              className="w-full pl-8 pr-4 py-4 rounded-xl text-lg font-semibold outline-none"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: TEXT_COLORS.primary,
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            />
          </div>

          {/* Validation Message */}
          {amount && numericAmount < LIMITS.minWithdrawal && (
            <p className="text-sm mt-2" style={{ color: '#EF4444' }}>
              Minimum withdrawal is ${LIMITS.minWithdrawal}
            </p>
          )}
          {amount && numericAmount > balance && (
            <p className="text-sm mt-2" style={{ color: '#EF4444' }}>
              Exceeds available balance
            </p>
          )}
        </div>

        {/* Payout Method Selection */}
        <div className="mb-6">
          <label 
            className="block text-sm font-medium mb-3"
            style={{ color: TEXT_COLORS.primary }}
          >
            Where should we send it?
          </label>

          <div className="space-y-2">
            {payoutMethods.map(method => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method)}
                className="w-full flex items-center gap-3 p-4 rounded-xl transition-all"
                style={{
                  backgroundColor: selectedMethod?.id === method.id 
                    ? 'rgba(96, 165, 250, 0.15)' 
                    : 'rgba(255, 255, 255, 0.03)',
                  border: `2px solid ${selectedMethod?.id === method.id ? ACCENT_COLOR : 'transparent'}`,
                }}
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: TEXT_COLORS.primary,
                  }}
                >
                  <PayoutMethodIcon type={method.type} />
                </div>
                <div className="flex-1 text-left">
                  <div 
                    className="font-semibold text-sm"
                    style={{ color: TEXT_COLORS.primary }}
                  >
                    {method.label}
                  </div>
                  <div 
                    className="text-xs"
                    style={{ color: TEXT_COLORS.muted }}
                  >
                    {method.detail}
                  </div>
                </div>
                {method.isDefault && (
                  <span 
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: TEXT_COLORS.secondary,
                    }}
                  >
                    Default
                  </span>
                )}
              </button>
            ))}

            {/* Add New Method */}
            <button
              className="w-full flex items-center gap-3 p-4 rounded-xl transition-all"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '2px dashed rgba(255, 255, 255, 0.1)',
              }}
            >
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: TEXT_COLORS.muted,
                }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div 
                className="font-medium text-sm"
                style={{ color: TEXT_COLORS.secondary }}
              >
                Add payout method
              </div>
            </button>
          </div>
        </div>

        {/* Fee Notice */}
        <div 
          className="flex items-center gap-2 p-3 rounded-lg"
          style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#10B981" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm" style={{ color: '#10B981' }}>
            Free withdrawal - no fees
          </span>
        </div>
      </div>

      {/* Footer */}
      <div 
        className="px-4 py-4 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
      >
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className="w-full py-4 rounded-xl font-bold text-lg transition-all"
          style={{
            backgroundColor: canContinue ? ACCENT_COLOR : BG_COLORS.tertiary,
            color: canContinue ? '#000000' : TEXT_COLORS.disabled,
            opacity: canContinue ? 1 : 0.5,
          }}
        >
          {canContinue 
            ? `Withdraw $${formatAmount(numericAmount)}` 
            : 'Enter amount to continue'
          }
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// CONFIRM STEP
// ============================================================================

interface ConfirmStepProps {
  amount: number;
  method: PayoutMethod;
  onConfirm: () => void;
  onBack: () => void;
  isLoading: boolean;
}

function ConfirmStep({
  amount,
  method,
  onConfirm,
  onBack,
  isLoading,
}: ConfirmStepProps): React.ReactElement {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div 
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          style={{ color: TEXT_COLORS.secondary }}
          aria-label="Back"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 
          className="text-lg font-bold"
          style={{ color: TEXT_COLORS.primary }}
        >
          Confirm Withdrawal
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Amount */}
        <div className="text-center mb-8">
          <div 
            className="text-sm font-medium mb-2"
            style={{ color: TEXT_COLORS.secondary }}
          >
            You're withdrawing
          </div>
          <div 
            className="text-4xl font-bold"
            style={{ color: TEXT_COLORS.primary }}
          >
            ${formatAmount(amount)}
          </div>
        </div>

        {/* Destination */}
        <div 
          className="w-full rounded-xl p-4 mb-6"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
        >
          <div 
            className="text-xs font-medium mb-2"
            style={{ color: TEXT_COLORS.muted }}
          >
            Sending to
          </div>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: TEXT_COLORS.primary,
              }}
            >
              <PayoutMethodIcon type={method.type} />
            </div>
            <div>
              <div 
                className="font-semibold"
                style={{ color: TEXT_COLORS.primary }}
              >
                {method.label}
              </div>
              <div 
                className="text-sm"
                style={{ color: TEXT_COLORS.muted }}
              >
                {method.detail}
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div 
          className="w-full rounded-xl p-4"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
        >
          <div className="flex justify-between items-center mb-2">
            <span style={{ color: TEXT_COLORS.secondary }}>Amount</span>
            <span className="font-semibold" style={{ color: TEXT_COLORS.primary }}>
              ${formatAmount(amount)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span style={{ color: TEXT_COLORS.secondary }}>Fee</span>
            <span className="font-semibold" style={{ color: '#10B981' }}>FREE</span>
          </div>
          <div 
            className="flex justify-between items-center pt-2"
            style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
          >
            <span style={{ color: TEXT_COLORS.secondary }}>You'll receive</span>
            <span className="font-bold text-lg" style={{ color: TEXT_COLORS.primary }}>
              ${formatAmount(amount)}
            </span>
          </div>
        </div>

        {/* Timing */}
        <div 
          className="text-center mt-6 text-sm"
          style={{ color: TEXT_COLORS.muted }}
        >
          Typically arrives within 24 hours
        </div>
      </div>

      {/* Footer */}
      <div 
        className="px-4 py-4 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
      >
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
          style={{
            backgroundColor: ACCENT_COLOR,
            color: '#000000',
          }}
        >
          {isLoading ? (
            <>
              <div 
                className="animate-spin rounded-full h-5 w-5 border-2"
                style={{ borderColor: '#000 transparent transparent transparent' }}
              />
              Sending code...
            </>
          ) : (
            'Continue'
          )}
        </button>
        <p 
          className="text-center text-xs mt-3"
          style={{ color: TEXT_COLORS.muted }}
        >
          We'll send a confirmation code to verify this withdrawal
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// CODE ENTRY STEP
// ============================================================================

interface CodeStepProps {
  contact: { type: 'email' | 'phone'; masked: string };
  onVerify: (code: string) => void;
  onResend: () => void;
  onBack: () => void;
  isVerifying: boolean;
  error: string | null;
  attemptsRemaining: number;
}

function CodeStep({
  contact,
  onVerify,
  onResend,
  onBack,
  isVerifying,
  error,
  attemptsRemaining,
}: CodeStepProps): React.ReactElement {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-submit when all digits entered
  useEffect(() => {
    const fullCode = code.join('');
    if (fullCode.length === 6 && code.every(d => d !== '')) {
      onVerify(fullCode);
    }
  }, [code, onVerify]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    if (!digit && value) return; // Non-digit was entered
    
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto-advance to next input only if we have a digit
    if (digit && index < 5) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);
    if (pastedData.length === 6) {
      inputRefs.current[5]?.focus();
    }
  };

  const handleResend = () => {
    setResendCooldown(60);
    setCode(['', '', '', '', '', '']);
    onResend();
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Back Button Only */}
      <div className="px-4 py-3 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          style={{ color: TEXT_COLORS.secondary }}
          aria-label="Back"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: 'rgba(96, 165, 250, 0.15)' }}
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke={ACCENT_COLOR} strokeWidth={2}>
            {contact.type === 'email' ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            )}
          </svg>
        </div>

        <h3 
          className="text-xl font-bold mb-2"
          style={{ color: TEXT_COLORS.primary }}
        >
          Check your {contact.type}
        </h3>
        <p 
          className="text-center text-sm mb-8"
          style={{ color: TEXT_COLORS.secondary }}
        >
          We sent a 6-digit code to<br />
          <span style={{ color: TEXT_COLORS.primary }}>{contact.masked}</span>
        </p>

        {/* Code Input */}
        <div className="flex gap-2 mb-6" onPaste={handlePaste}>
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              autoComplete="off"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onInput={(e) => {
                // Extra safeguard: force single digit
                const target = e.target as HTMLInputElement;
                if (target.value.length > 1) {
                  target.value = target.value.slice(-1);
                }
              }}
              disabled={isVerifying}
              className="w-12 h-14 text-center text-2xl font-bold rounded-lg outline-none transition-all"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: TEXT_COLORS.primary,
                border: error 
                  ? '2px solid #EF4444' 
                  : digit 
                    ? `2px solid ${ACCENT_COLOR}` 
                    : '2px solid rgba(255, 255, 255, 0.1)',
              }}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div 
            className="text-center text-sm mb-4 px-4 py-2 rounded-lg"
            style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#EF4444',
            }}
          >
            {error}
            {attemptsRemaining > 0 && attemptsRemaining < 5 && (
              <span className="block mt-1 text-xs">
                {attemptsRemaining} attempts remaining
              </span>
            )}
          </div>
        )}

        {/* Verifying Spinner */}
        {isVerifying && (
          <div className="flex items-center gap-2 mb-4">
            <div 
              className="animate-spin rounded-full h-4 w-4 border-2"
              style={{ borderColor: `${ACCENT_COLOR} transparent transparent transparent` }}
            />
            <span style={{ color: TEXT_COLORS.secondary }}>Verifying...</span>
          </div>
        )}

        {/* Resend */}
        <div className="text-center">
          <p 
            className="text-sm mb-2"
            style={{ color: TEXT_COLORS.muted }}
          >
            Didn't receive it?
          </p>
          {resendCooldown > 0 ? (
            <p 
              className="text-sm"
              style={{ color: TEXT_COLORS.secondary }}
            >
              Resend in {resendCooldown}s
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="text-sm font-semibold"
              style={{ color: ACCENT_COLOR }}
            >
              Resend Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUCCESS STEP
// ============================================================================

interface SuccessStepProps {
  amount: number;
  method: PayoutMethod;
  onClose: () => void;
}

function SuccessStep({ amount, method, onClose }: SuccessStepProps): React.ReactElement {
  return (
    <div className="flex flex-col h-full items-center justify-center px-6">
      {/* Success Icon */}
      <div 
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}
      >
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="#10B981" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 
        className="text-2xl font-bold mb-2"
        style={{ color: TEXT_COLORS.primary }}
      >
        Success!
      </h2>

      <p 
        className="text-center text-lg mb-6"
        style={{ color: TEXT_COLORS.secondary }}
      >
        ${formatAmount(amount)} is on its way to your {method.label}
      </p>

      <div 
        className="text-center text-sm mb-8 px-4 py-3 rounded-lg"
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          color: TEXT_COLORS.muted,
        }}
      >
        Typically arrives within 24 hours.<br />
        We'll email you when it's there.
      </div>

      <button
        onClick={onClose}
        className="w-full py-4 rounded-xl font-bold text-lg transition-all"
        style={{
          backgroundColor: ACCENT_COLOR,
          color: '#000000',
        }}
      >
        Done
      </button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WithdrawModalVX({ 
  isOpen, 
  onClose 
}: WithdrawModalVXProps): React.ReactElement | null {
  // State
  const [step, setStep] = useState<WithdrawStep>('amount');
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PayoutMethod | null>(
    MOCK_PAYOUT_METHODS.find(m => m.isDefault) || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [mockCode, setMockCode] = useState('');

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('amount');
      setAmount('');
      setSelectedMethod(MOCK_PAYOUT_METHODS.find(m => m.isDefault) || null);
      setIsLoading(false);
      setIsVerifying(false);
      setCodeError(null);
      setAttemptsRemaining(5);
    }
  }, [isOpen]);

  // Handlers
  const handleContinueToConfirm = () => {
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    
    // Simulate sending code
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const code = generateMockCode();
    setMockCode(code);
    console.log('Withdrawal confirmation code:', code); // For testing
    
    setIsLoading(false);
    setStep('code');
  };

  const handleVerifyCode = async (enteredCode: string) => {
    setIsVerifying(true);
    setCodeError(null);

    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For demo: accept the mock code or "123456"
    if (enteredCode === mockCode || enteredCode === '123456') {
      setIsVerifying(false);
      setStep('success');
    } else {
      setAttemptsRemaining(prev => prev - 1);
      setCodeError('Incorrect code. Please try again.');
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    const code = generateMockCode();
    setMockCode(code);
    setCodeError(null);
    setAttemptsRemaining(5);
    console.log('New withdrawal confirmation code:', code);
  };

  const handleBack = () => {
    if (step === 'confirm') setStep('amount');
    if (step === 'code') setStep('confirm');
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div
      className="absolute left-0 right-0 bottom-0 flex flex-col"
      style={{
        top: '60px',
        backgroundColor: BG_COLORS.secondary,
        zIndex: 100,
      }}
    >
      {step === 'amount' && (
        <AmountStep
          balance={MOCK_BALANCE}
          amount={amount}
          setAmount={setAmount}
          selectedMethod={selectedMethod}
          setSelectedMethod={setSelectedMethod}
          payoutMethods={MOCK_PAYOUT_METHODS}
          onContinue={handleContinueToConfirm}
          onClose={onClose}
        />
      )}

      {step === 'confirm' && selectedMethod && (
        <ConfirmStep
          amount={parseFloat(amount)}
          method={selectedMethod}
          onConfirm={handleConfirm}
          onBack={handleBack}
          isLoading={isLoading}
        />
      )}

      {step === 'code' && (
        <CodeStep
          contact={MOCK_USER_CONTACT}
          onVerify={handleVerifyCode}
          onResend={handleResendCode}
          onBack={handleBack}
          isVerifying={isVerifying}
          error={codeError}
          attemptsRemaining={attemptsRemaining}
        />
      )}

      {step === 'success' && selectedMethod && (
        <SuccessStep
          amount={parseFloat(amount)}
          method={selectedMethod}
          onClose={onClose}
        />
      )}
    </div>
  );
}

