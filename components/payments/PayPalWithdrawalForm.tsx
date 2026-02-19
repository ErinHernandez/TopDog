/**
 * PayPal Withdrawal Form Component
 *
 * Handles withdrawals with security tier awareness:
 * - Standard (<$1,000): Process immediately
 * - Confirmation Required ($1,000-$9,999): Email/SMS confirmation
 * - Hold Required ($10,000-$49,999): 24-hour hold
 * - Support Required ($50,000+): Support team review
 */

import React, { useState, useEffect, useCallback } from 'react';

import { PAYPAL_WITHDRAWAL_LIMITS } from '../../lib/paypal/paypalTypes';
import type { LinkedPayPalAccount, WithdrawalSecurityTier } from '../../lib/paypal/paypalTypes';

interface PayPalWithdrawalFormProps {
  linkedAccount: LinkedPayPalAccount;
  userBalanceCents: number;
  onSubmit: (data: WithdrawalSubmitData) => Promise<WithdrawalResult>;
  onConfirm?: (data: ConfirmationData) => Promise<WithdrawalResult>;
}

interface WithdrawalSubmitData {
  amountCents: number;
  linkedAccountId: string;
  confirmationMethod?: 'email' | 'sms';
}

interface ConfirmationData {
  pendingId: string;
  confirmationCode: string;
}

interface WithdrawalResult {
  success: boolean;
  status?: string;
  pendingId?: string;
  message?: string;
  warning?: string | null;
  releaseAt?: string;
  error?: string;
}

type FormStep = 'amount' | 'confirmation' | 'success' | 'held';

export function PayPalWithdrawalForm({
  linkedAccount,
  userBalanceCents,
  onSubmit,
  onConfirm,
}: PayPalWithdrawalFormProps) {
  const [step, setStep] = useState<FormStep>('amount');
  const [amount, setAmount] = useState('');
  const [confirmationMethod, setConfirmationMethod] = useState<'email' | 'sms'>('email');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [releaseAt, setReleaseAt] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amountCents = Math.round(parseFloat(amount || '0') * 100);
  const securityTier = getSecurityTier(amountCents);
  const requiresConfirmation = amountCents >= PAYPAL_WITHDRAWAL_LIMITS.securityTiers.confirmationRequired;
  const requiresHold = amountCents >= PAYPAL_WITHDRAWAL_LIMITS.securityTiers.holdRequired;
  const requiresSupport = amountCents >= PAYPAL_WITHDRAWAL_LIMITS.securityTiers.supportRequired;

  // Check withdrawal limit warning on mount
  useEffect(() => {
    checkWithdrawalWarning();
  }, []);

  const checkWithdrawalWarning = async () => {
    try {
      const res = await fetch('/api/paypal/withdrawal-status');
      const data = await res.json();
      setWarning(data.warning);
    } catch {
      // Ignore errors for warning check
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow valid decimal input
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate amount
    if (amountCents <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amountCents > userBalanceCents) {
      setError('Insufficient balance');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await onSubmit({
        amountCents,
        linkedAccountId: linkedAccount.id,
        confirmationMethod: requiresConfirmation ? confirmationMethod : undefined,
      });

      if (!result.success) {
        setError(result.error || 'Withdrawal failed');
        return;
      }

      // Update warning if provided
      if (result.warning) {
        setWarning(result.warning);
      }

      // Handle different statuses
      if (result.status === 'awaiting_confirmation') {
        setPendingId(result.pendingId || null);
        setStep('confirmation');
      } else if (result.status === 'held') {
        setReleaseAt(result.releaseAt || null);
        setStep('held');
      } else if (result.status === 'pending_support_review') {
        setStep('success');
      } else {
        setStep('success');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!confirmationCode || confirmationCode.length !== 6) {
      setError('Please enter a valid 6-digit confirmation code');
      return;
    }

    if (!pendingId || !onConfirm) {
      setError('Invalid confirmation state');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await onConfirm({
        pendingId,
        confirmationCode,
      });

      if (!result.success) {
        setError(result.error || 'Confirmation failed');
        return;
      }

      setStep('success');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep('amount');
    setAmount('');
    setConfirmationCode('');
    setPendingId(null);
    setReleaseAt(null);
    setError(null);
  };

  // Success step
  if (step === 'success') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckIcon className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Withdrawal Initiated
        </h3>
        <p className="text-gray-600 mb-6">
          ${(amountCents / 100).toFixed(2)} is being sent to your PayPal account
          ({linkedAccount.paypalEmail}).
          {requiresSupport && ' Our support team will contact you within 24 hours.'}
        </p>
        <button
          onClick={handleReset}
          className="px-4 py-2 text-blue-600 hover:text-blue-700"
        >
          Make Another Withdrawal
        </button>
      </div>
    );
  }

  // Held step
  if (step === 'held') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ClockIcon className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          24-Hour Security Hold
        </h3>
        <p className="text-gray-600 mb-2">
          For your security, this ${(amountCents / 100).toFixed(2)} withdrawal has a 24-hour hold.
        </p>
        {releaseAt && (
          <p className="text-sm text-gray-500 mb-6">
            It will be processed on {new Date(releaseAt).toLocaleString()}.
          </p>
        )}
        <p className="text-sm text-gray-500 mb-6">
          You&apos;ll receive a notification when it&apos;s complete. You can cancel this withdrawal
          during the hold period from your transaction history.
        </p>
        <button
          onClick={handleReset}
          className="px-4 py-2 text-blue-600 hover:text-blue-700"
        >
          Done
        </button>
      </div>
    );
  }

  // Confirmation step
  if (step === 'confirmation') {
    return (
      <form onSubmit={handleConfirmation} className="space-y-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldIcon className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Confirm Your Withdrawal
          </h3>
          <p className="text-gray-600">
            We&apos;ve sent a 6-digit code to your {confirmationMethod === 'email' ? 'email' : 'phone'}.
            Enter it below to complete your withdrawal.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirmation Code
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full border border-gray-300 rounded-lg p-3 text-center text-2xl tracking-widest font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || confirmationCode.length !== 6}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Confirming...' : 'Confirm Withdrawal'}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="w-full py-2 text-gray-600 hover:text-gray-700"
        >
          Cancel
        </button>
      </form>
    );
  }

  // Amount step (default)
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Warning banner after 2nd withdrawal */}
      {warning && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm flex items-center gap-2">
          <WarningIcon className="w-5 h-5 flex-shrink-0" />
          {warning}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Amount input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount (USD)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0.00"
            className="w-full border border-gray-300 rounded-lg p-3 pl-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Available balance: ${(userBalanceCents / 100).toFixed(2)}
        </p>
      </div>

      {/* Quick amount buttons */}
      <div className="flex gap-2">
        {[25, 50, 100, 250].map((quickAmount) => (
          <button
            key={quickAmount}
            type="button"
            onClick={() => setAmount(quickAmount.toString())}
            disabled={quickAmount * 100 > userBalanceCents}
            className="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ${quickAmount}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setAmount((userBalanceCents / 100).toFixed(2))}
          className="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
        >
          Max
        </button>
      </div>

      {/* Confirmation method selector for $1,000+ */}
      {requiresConfirmation && !requiresHold && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm withdrawal via:
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="confirmationMethod"
                value="email"
                checked={confirmationMethod === 'email'}
                onChange={() => setConfirmationMethod('email')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>Email</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="confirmationMethod"
                value="sms"
                checked={confirmationMethod === 'sms'}
                onChange={() => setConfirmationMethod('sms')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>SMS</span>
            </label>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Withdrawals of $1,000 or more require confirmation for your security.
          </p>
        </div>
      )}

      {/* Info for held withdrawals */}
      {requiresHold && !requiresSupport && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
          <div className="flex items-start gap-2">
            <ClockIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">24-Hour Security Hold</p>
              <p>
                Withdrawals of $10,000 or more have a 24-hour security hold.
                You&apos;ll receive a notification when your withdrawal is processed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info for support-required withdrawals */}
      {requiresSupport && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
          <div className="flex items-start gap-2">
            <ShieldIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Support Review Required</p>
              <p>
                For withdrawals of $50,000 or more, our support team will contact you
                within 24 hours to verify and process your withdrawal securely.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal destination */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-600">Withdrawal will be sent to:</p>
        <p className="font-medium">{linkedAccount.paypalEmail}</p>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting || !amount || amountCents <= 0 || amountCents > userBalanceCents}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Processing...' : `Withdraw $${amount || '0.00'}`}
      </button>
    </form>
  );
}

// Helper function to determine security tier
function getSecurityTier(amountCents: number): WithdrawalSecurityTier {
  const { securityTiers } = PAYPAL_WITHDRAWAL_LIMITS;

  if (amountCents >= securityTiers.supportRequired) return 'support_required';
  if (amountCents >= securityTiers.holdRequired) return 'hold_required';
  if (amountCents >= securityTiers.confirmationRequired) return 'confirmation_required';
  return 'standard';
}

// Icons
function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ClockIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ShieldIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function WarningIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

export default PayPalWithdrawalForm;
