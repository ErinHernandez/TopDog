/**
 * VX2 ForgotPasswordModal - Password Reset Flow
 * 
 * Steps:
 * 1. Enter email or phone
 * 2. Email sent / Phone code verification
 * 
 * Features:
 * - Email and phone support
 * - Rate limiting awareness
 * - Success confirmation
 * - Accessibility compliant
 */

import React, { useState, useCallback, useEffect } from 'react';

import { cn } from '@/lib/styles';

import { createScopedLogger } from '../../../../lib/clientLogger';
import { Close, ChevronLeft } from '../../components/icons';
import { TEXT_COLORS, STATE_COLORS, UI_COLORS } from '../../core/constants/colors';
import { TYPOGRAPHY } from '../../core/constants/sizes';
import { useCountdown } from '../../hooks/ui/useCountdown';
import { useAuth } from '../hooks/useAuth';

import authStyles from './auth-shared.module.css';
import styles from './ForgotPasswordModal.module.css';


const logger = createScopedLogger('[ForgotPasswordModal]');

// ============================================================================
// TYPES
// ============================================================================

export interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToSignIn?: () => void;
}

type ForgotPasswordStep = 'input' | 'code' | 'newPassword';
type ResetMethod = 'email' | 'phone';

// Format phone number as user types
function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  
  if (digits.length === 0) return '';
  if (digits.length <= 1) return `+${digits}`;
  if (digits.length <= 4) return `+${digits.slice(0, 1)} (${digits.slice(1)}`;
  if (digits.length <= 7) return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4)}`;
  if (digits.length <= 11) return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
}

// ============================================================================
// STEP: INPUT (Email or Phone)
// ============================================================================

interface InputStepProps {
  method: ResetMethod;
  setMethod: (method: ResetMethod) => void;
  email: string;
  setEmail: (email: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  onBackToSignIn?: () => void;
  isLoading: boolean;
  error: string | null;
}

function InputStep({
  method,
  setMethod,
  email,
  setEmail,
  phone,
  setPhone,
  onSubmit,
  onClose,
  onBackToSignIn,
  isLoading,
  error,
}: InputStepProps): React.ReactElement {
  const [touched, setTouched] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = phone.replace(/\D/g, '').length >= 10;
  const isValid = method === 'email' ? isValidEmail : isValidPhone;
  const canSubmit = isValid && !isLoading;
  
  // Inline error only after blur, hide while focused — see docs/FORM_VALIDATION_PATTERN.md
  const showError = touched && !isValid && (method === 'email' ? email.length > 0 : phone.length > 0);
  const errorToShow = inputFocused ? null : showError;
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canSubmit) {
      onSubmit();
    }
  };
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Header — close only; "Forgot your password?" is in content below */}
      <div
        className={styles.stepHeader}
      >
        <button
          onClick={onClose}
          className="p-2"
          aria-label="Close"
        >
          <Close size={24} color={UI_COLORS.modalCloseIcon} />
        </button>
      </div>
      
      {/* Content */}
      <div
        className={cn(styles.stepContent, styles.stepContentPadded)}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.heading}>
          <div className={cn(styles.headingIcon, styles.headingIconLarge)}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={TEXT_COLORS.primary} strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className={styles.headingTitle}>
            Forgot your password?
          </h3>
          <p className={styles.headingSubtitle}>
            {method === 'email'
              ? "Enter your primary or secondary email and we'll send you a code to reset your password."
              : "Enter your phone number and we'll send you a code to reset your password."}
          </p>
        </div>
        
        {/* Method Toggle */}
        <div className={styles.methodToggle}>
          <button
            onClick={() => { setMethod('email'); setTouched(false); setInputFocused(false); }}
            className={cn(styles.methodToggleButton, method === 'email' && styles.methodToggleButtonActive)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email
          </button>
          <button
            onClick={() => { setMethod('phone'); setTouched(false); setInputFocused(false); }}
            className={cn(styles.methodToggleButton, method === 'phone' && styles.methodToggleButtonActive)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Phone
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        {/* Email Input */}
        {method === 'email' && (
          <div className={styles.inputMarginBottom}>
            <input
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => { setTouched(true); setInputFocused(false); }}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              disabled={isLoading}
              className={cn(styles.input, isLoading && styles.inputDisabled, errorToShow && styles.inputError)}
            />
            {errorToShow && (
              <span className={styles.errorField}>
                Please enter a valid email
              </span>
            )}
          </div>
        )}
        
        {/* Phone Input */}
        {method === 'phone' && (
          <div className={styles.inputMarginBottom}>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              onFocus={() => setInputFocused(true)}
              onBlur={() => { setTouched(true); setInputFocused(false); }}
              placeholder="+1 (555) 123-4567"
              autoComplete="tel"
              autoFocus
              disabled={isLoading}
              className={cn(styles.input, isLoading && styles.inputDisabled, errorToShow && styles.inputError)}
            />
            {errorToShow && (
              <span className={styles.errorField}>
                Please enter a valid phone number
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div
        className={styles.stepFooter}
      >
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className={cn(styles.primaryButton, canSubmit ? styles.primaryButtonEnabled : styles.primaryButtonDisabled)}
        >
          {isLoading ? (
            <>
              <div className={styles.spinner} />
              Sending...
            </>
          ) : (
            'Send Code'
          )}
        </button>

        {onBackToSignIn && (
          <p className={styles.footerText}>
            Remember your password?{' '}
            <button
              onClick={onBackToSignIn}
              className={styles.footerLink}
            >
              Sign In
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// STEP: CODE VERIFICATION (for both email and phone)
// ============================================================================

interface CodeStepProps {
  method: ResetMethod;
  contact: string; // email or phone
  onVerify: (code: string) => void;
  onBack: () => void;
  onResend: () => void;
  isLoading: boolean;
  error: string | null;
}

function CodeStep({
  method,
  contact,
  onVerify,
  onBack,
  onResend,
  isLoading,
  error,
}: CodeStepProps): React.ReactElement {
  const [code, setCode] = useState('');
  const { seconds: cooldown, isActive: cooldownActive, start: startCooldown } = useCountdown(60, { autoStart: true });

  const maskedContact = method === 'phone'
    ? contact.slice(0, -4).replace(/\d/g, '*') + contact.slice(-4)
    : contact.replace(/(.{2})(.*)(@.*)/, '$1****$3');

  const canSubmit = code.length === 6 && !isLoading;

  const handleResend = () => {
    onResend();
    startCooldown();
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Header — same top padding as Sign In/Sign Up so X height consistent when present */}
      <div
        className={cn(styles.stepHeader, styles.stepHeaderWithBack)}
      >
        <button onClick={onBack} className="p-2" aria-label="Back">
          <ChevronLeft size={24} color={UI_COLORS.modalCloseIcon} />
        </button>
        <h2 className={styles.stepHeaderTitle}>
          Enter Code
        </h2>
      </div>
      
      {/* Content */}
      <div className={cn(styles.stepContent, styles.stepContentCentered)}>
        <div className={styles.heading}>
          <div className={styles.headingIcon}>
            {method === 'phone' ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={TEXT_COLORS.primary} strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={TEXT_COLORS.primary} strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <h3 className={styles.headingTitle}>
            Check your {method}
          </h3>
          <p className={styles.headingSubtitle}>
            We sent a 6-digit code to
            <br />
            <span className={styles.headingSubtitleHighlight}>{maskedContact}</span>
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        {/* Code Input */}
        <input
          type="text"
          value={code}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          maxLength={6}
          autoFocus
          disabled={isLoading}
          className={cn(styles.codeInput, isLoading && styles.codeInputDisabled)}
        />

        <p className={styles.codeVerificationText}>
          Didn&apos;t receive it?{' '}
          {method === 'email' && <span>Check your spam folder or </span>}
          {cooldownActive ? (
            <span className={styles.resendCooldown}>resend in {cooldown}s</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={isLoading}
              className={styles.footerLink}
            >
              resend code
            </button>
          )}
        </p>
      </div>
      
      {/* Footer */}
      <div
        className={styles.stepFooter}
      >
        <button
          onClick={() => onVerify(code)}
          disabled={!canSubmit}
          className={cn(styles.primaryButton, canSubmit ? styles.primaryButtonEnabled : styles.primaryButtonDisabled)}
        >
          {isLoading ? (
            <>
              <div className={styles.spinner} />
              Verifying...
            </>
          ) : (
            'Verify & Continue'
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// STEP: NEW PASSWORD (after code verification)
// ============================================================================

interface NewPasswordStepProps {
  onSubmit: (password: string) => void;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
}

function NewPasswordStep({
  onSubmit,
  onClose,
  isLoading,
  error,
}: NewPasswordStepProps): React.ReactElement {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const isValidPassword = password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const canSubmit = isValidPassword && passwordsMatch && !isLoading;
  
  return (
    <div className="flex flex-col h-full">
      {/* Header — same top padding as Sign In/Sign Up so X height is consistent */}
      <div
        className={cn(styles.stepHeader, styles.stepHeaderWithBack, styles.stepHeaderSpaceBetween)}
      >
        <h2 className={styles.stepHeaderTitle}>
          Create New Password
        </h2>
        <button
          onClick={onClose}
          className="p-2"
          aria-label="Close"
        >
          <Close size={24} color={UI_COLORS.modalCloseIcon} />
        </button>
      </div>
      
      {/* Content */}
      <div className={cn(styles.stepContent, styles.stepContentCentered)}>
        <div className={styles.heading}>
          <div className={styles.successIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={STATE_COLORS.success} strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className={styles.headingTitle}>
            Code verified!
          </h3>
          <p className={styles.headingSubtitle}>
            Now create a new password for your account.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        {/* Password Input */}
        <div className={styles.inputMarginBottom}>
          <input
            type="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            placeholder="New password"
            autoComplete="new-password"
            autoFocus
            disabled={isLoading}
            className={cn(styles.input, isLoading && styles.inputDisabled)}
          />
        </div>
        
        {/* Confirm Password Input */}
        <div className={styles.inputMarginBottom}>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
            disabled={isLoading}
            className={cn(styles.input, isLoading && styles.inputDisabled, confirmPassword && !passwordsMatch && styles.inputError)}
          />
          {confirmPassword && !passwordsMatch && (
            <span className={styles.errorField}>
              Passwords do not match
            </span>
          )}
        </div>
        
        {/* Password Requirements */}
        <div className={styles.passwordRequirements}>
          <div className={styles.requirementsTitle}>
            Password must have:
          </div>
          <div className={styles.requirementsList}>
            {[
              { check: password.length >= 8, label: '8+ characters' },
              { check: /[A-Z]/.test(password), label: 'Uppercase' },
              { check: /[a-z]/.test(password), label: 'Lowercase' },
              { check: /\d/.test(password), label: 'Number' },
            ].map((req, i) => (
              <div
                key={i}
                className={cn(styles.requirementItem, req.check ? styles.requirementItemChecked : styles.requirementItemUnchecked)}
              >
                {req.check ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={styles.requirementIcon}>
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={styles.requirementIcon}>
                    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                )}
                {req.label}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div
        className={styles.stepFooter}
      >
        <button
          onClick={() => onSubmit(password)}
          disabled={!canSubmit}
          className={cn(styles.primaryButton, canSubmit ? styles.primaryButtonEnabled : styles.primaryButtonDisabled)}
        >
          {isLoading ? (
            <>
              <div className={styles.spinner} />
              Resetting...
            </>
          ) : (
            'Reset Password'
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ForgotPasswordModal({
  isOpen,
  onClose,
  onBackToSignIn,
}: ForgotPasswordModalProps): React.ReactElement | null {
  const [step, setStep] = useState<ForgotPasswordStep>('input');
  const [method, setMethod] = useState<ResetMethod>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // useAuth hook available for future backend integration
  // const { sendPasswordResetEmail } = useAuth();
  
  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('input');
      setMethod('email');
      setEmail('');
      setPhone('');
      setIsLoading(false);
      setError(null);
    }
  }, [isOpen]);
  
  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Both email and phone flows send a verification code
      // Simulate sending code
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStep('code');
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleCodeVerify = useCallback(async (code: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo, accept any 6-digit code
      if (code.length === 6) {
        setStep('newPassword');
      } else {
        setError('Invalid verification code');
      }
    } catch (err) {
      setError('Verification failed');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleNewPassword = useCallback(async (password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate password reset
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success - go back to sign in
      if (onBackToSignIn) {
        onBackToSignIn();
      } else {
        onClose();
      }
    } catch (err) {
      setError('Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  }, [onBackToSignIn, onClose]);
  
  const handleResendCode = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate resending code
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      logger.error('Resend code failed', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  if (!isOpen) return null;

  return (
    <div className={styles.container}>
      {/* Blue outline wrapper - auth modal branding */}
      <div
        className={styles.blueOutlineWrapper}
        aria-hidden="true"
      />

      {step === 'input' && (
        <InputStep
          method={method}
          setMethod={setMethod}
          email={email}
          setEmail={setEmail}
          phone={phone}
          setPhone={setPhone}
          onSubmit={handleSubmit}
          onClose={onClose}
          onBackToSignIn={onBackToSignIn}
          isLoading={isLoading}
          error={error}
        />
      )}
      
      {step === 'code' && (
        <CodeStep
          method={method}
          contact={method === 'email' ? email : phone}
          onVerify={handleCodeVerify}
          onBack={() => setStep('input')}
          onResend={handleResendCode}
          isLoading={isLoading}
          error={error}
        />
      )}
      
      {step === 'newPassword' && (
        <NewPasswordStep
          onSubmit={handleNewPassword}
          onClose={onClose}
          isLoading={isLoading}
          error={error}
        />
      )}
    </div>
  );
}

export default ForgotPasswordModal;


