/**
 * VX2 SignUpScreenVX2 - Full-Screen Sign Up Experience
 * 
 * A dedicated full-screen sign-up flow (NOT a modal) that:
 * - Takes up the entire viewport
 * - Has NO close/dismiss button - must complete or switch to login
 * - Multi-step registration: Email/Password -> Username -> Email Verification -> Success
 * - Real-time validation with password strength indicator
 * - VIP username checking
 * 
 * This screen completely replaces the app content for new user registration.
 */

import Image from 'next/image';
import React, { useState, useCallback, useEffect, useRef } from 'react';

import { cn } from '@/lib/styles';

import { ChevronLeft } from '../../components/icons';
import { useCountdown } from '../../hooks/ui/useCountdown';
import { PASSWORD_CONSTRAINTS } from '../constants';
import { useAuth } from '../hooks/useAuth';

import authStyles from './auth-shared.module.css';
import styles from './SignUpScreenVX2.module.css';
import { UsernameInput } from './UsernameInput';

// ============================================================================
// TYPES
// ============================================================================

export interface SignUpScreenVX2Props {
  onSwitchToLogin: () => void;
  onSuccess?: () => void;
}

type SignUpStep = 'credentials' | 'username' | 'emailVerify' | 'success';

// ============================================================================
// LOGO COMPONENT
// ============================================================================

function TopDogLogo(): React.ReactElement {
  return (
    <div className={styles.logo}>
      <Image
        src="/logo.png"
        alt="TopDog"
        className={styles.logoImage}
        width={120}
        height={120}
        unoptimized
      />
    </div>
  );
}

// ============================================================================
// PASSWORD STRENGTH INDICATOR
// ============================================================================

interface PasswordStrengthProps {
  password: string;
}

function PasswordStrength({ password }: PasswordStrengthProps): React.ReactElement {
  const checks = {
    minLength: password.length >= PASSWORD_CONSTRAINTS.MIN_LENGTH,
    mediumLength: password.length >= 10,
    longLength: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  let strength: number;
  if (score <= 2) strength = 1;
  else if (score <= 3) strength = 2;
  else if (score <= 5) strength = 3;
  else strength = 4;

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];

  return (
    <div className={cn(styles.strengthContainer, password && styles.visible)}>
      <div className={styles.strengthBars}>
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              styles.strengthBar,
              strength >= level && styles.active,
              strength === 1 && styles.strengthError,
              strength === 2 && styles.strengthWarning,
              strength === 3 && styles.strengthGood,
              strength === 4 && styles.strengthSuccess
            )}
          />
        ))}
      </div>
      <div className={styles.strengthInfo}>
        <span
          className={cn(
            styles.strengthLabel,
            strength === 1 && styles.strengthError,
            strength === 2 && styles.strengthWarning,
            strength === 3 && styles.strengthGood,
            strength === 4 && styles.strengthSuccess
          )}
        >
          {strengthLabel || '\u00A0'}
        </span>
        <span className={cn(styles.strengthCharCount, authStyles.textMuted)}>
          {password.length}/{PASSWORD_CONSTRAINTS.MIN_LENGTH}+ chars
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// INPUT COMPONENT
// ============================================================================

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  disabled?: boolean;
  error?: string | null;
  touched?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onBlur?: () => void;
  onFocus?: () => void;
  rightElement?: React.ReactNode;
  autoFocus?: boolean;
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  autoComplete,
  disabled,
  error,
  touched,
  inputRef,
  onBlur,
  onFocus,
  rightElement,
  autoFocus,
}: InputProps): React.ReactElement {
  const hasError = touched && error;

  return (
    <div>
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          autoFocus={autoFocus}
          className={cn(
            styles.inputField,
            hasError && styles.error,
            rightElement && styles.inputFieldWithRight
          )}
        />
        {rightElement && (
          <div className={styles.inputRightElement}>
            {rightElement}
          </div>
        )}
      </div>
      {hasError && (
        <div
          className={styles.errorMessage}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.errorIcon}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// STEP: CREDENTIALS
// ============================================================================

interface CredentialsStepProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (password: string) => void;
  onContinue: () => void;
  onSwitchToLogin: () => void;
  error: string | null;
}

function CredentialsStep({
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  onContinue,
  onSwitchToLogin,
  error,
}: CredentialsStepProps): React.ReactElement {
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = password.length >= PASSWORD_CONSTRAINTS.MIN_LENGTH &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Inline email error only after blur (click out), hide while focused — see docs/FORM_VALIDATION_PATTERN.md
  const showEmailError = emailTouched && email && !isValidEmail;
  const emailErrorToShow = emailFocused ? null : (showEmailError ? 'Please enter a valid email' : null);
  const canContinue = isValidEmail && isValidPassword && passwordsMatch;

  // Keyboard handling
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canContinue) {
      e.preventDefault();
      onContinue();
    }
  }, [canContinue, onContinue]);

  return (
    <div
      className={styles.container}
      onKeyDown={handleKeyDown}
    >
      {/* Safe area with wr_blue background - covers dynamic island */}
      <div className={styles.safeAreaHeader} />
      {/* Spacer for safe area */}
      <div className={styles.safeAreaSpacer} />

      {/* Content */}
      <div
        className={styles.contentArea}
      >
        {/* Spacer */}
        <div className={styles.contentSpacer} />

        {/* Logo & Title */}
        <div className={styles.logoSection}>
          <TopDogLogo />
          <p
            className={cn(styles.titleText, authStyles.textSecondary)}
          >
            Create your account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className={styles.errorBanner}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.errorBannerIcon}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className={styles.errorBannerText}>
              {error}
            </span>
          </div>
        )}

        <div className={styles.spaceY4}>
          {/* Email Input — show "valid email" only after blur, hide while focused */}
          <Input
            inputRef={emailRef}
            value={email}
            onChange={setEmail}
            onBlur={() => { setEmailTouched(true); setEmailFocused(false); }}
            onFocus={() => setEmailFocused(true)}
            placeholder="Email address"
            type="email"
            autoComplete="email"
            error={emailErrorToShow}
            touched={emailTouched}
            autoFocus
          />
          
          {/* Password Input */}
          <div>
            <Input
              value={password}
              onChange={setPassword}
              placeholder="Create a password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.toggleButton}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              }
            />
            <PasswordStrength password={password} />
          </div>
          
          {/* Confirm Password Input */}
          <Input
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirm password"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            error={confirmPassword && !passwordsMatch ? 'Passwords do not match' : null}
            touched={confirmPassword.length > 0}
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={styles.toggleButton}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            }
          />
        </div>

        {/* Password Requirements */}
        <div
          className={styles.requirementsBox}
        >
          <div
            className={cn(styles.requirementsTitle, authStyles.textSecondary)}
          >
            Password requirements:
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
                className={cn(
                  styles.requirementItem,
                  req.check ? styles.requirementChecked : styles.requirementUnchecked
                )}
              >
                {req.check ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={styles.requirementIcon}>
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={styles.requirementIcon}>
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
        className={styles.footer}
      >
        <div className={styles.footerContent}>
          <button
            onClick={onContinue}
            disabled={!canContinue}
            className={cn(
              styles.footerButton,
              canContinue ? styles.footerButtonEnabled : styles.footerButtonDisabled
            )}
          >
            Continue
          </button>

          {/* Horizontal divider - full width */}
          <div className={styles.divider} />
          <p
            className={styles.footerText}
          >
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className={styles.footerLink}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STEP: USERNAME
// ============================================================================

interface UsernameStepProps {
  username: string;
  setUsername: (username: string) => void;
  onContinue: () => void;
  onBack: () => void;
  canContinue: boolean;
  onValidChange?: (isValid: boolean) => void;
}

function UsernameStep({
  username,
  setUsername,
  onContinue,
  onBack,
  canContinue,
  onValidChange,
}: UsernameStepProps): React.ReactElement {
  // Keyboard handling
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canContinue) {
      e.preventDefault();
      onContinue();
    }
  }, [canContinue, onContinue]);
  
  return (
    <div
      className={styles.container}
      onKeyDown={handleKeyDown}
    >
      {/* Safe area with wr_blue background - covers dynamic island */}
      <div className={styles.safeAreaHeader} />
      {/* Spacer for safe area */}
      <div className={styles.safeAreaSpacer} />

      {/* Header with Back Button */}
      <div
        className={styles.header}
      >
        <button
          onClick={onBack}
          className={styles.backButton}
          aria-label="Back"
        >
          <ChevronLeft size={24} color="currentColor" />
        </button>
      </div>

      {/* Content */}
      <div
        className={styles.centeredContent}
      >
        <div className={styles.centerSection}>
          <div className={styles.iconCircle}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.iconCircleIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3
            className={cn(styles.centerTitle, authStyles.textPrimary)}
          >
            Pick your username
          </h3>
          <p className={cn(styles.centerSubtitle, authStyles.textSecondary)}>
            This is how other players will see you
          </p>
        </div>
        
        <UsernameInput
          value={username}
          onChange={(value) => {
            setUsername(value);
            onValidChange?.(false);
          }}
          size="lg"
          onValid={() => onValidChange?.(true)}
        />

        {/* Username Requirements */}
        <div
          className={styles.usernameRequirementsBox}
        >
          <div
            className={cn(styles.requirementsTitle, authStyles.textSecondary)}
          >
            Username requirements:
          </div>
          <div className={styles.requirementsListVertical}>
            {[
              { check: username.length >= 3 && username.length <= 18, label: '3-18 characters' },
              { check: /^[a-zA-Z]/.test(username), label: 'Start with a letter' },
              { check: /^[a-zA-Z0-9_]*$/.test(username) && username.length > 0, label: 'Letters, numbers, underscores only' },
            ].map((req, i) => (
              <div
                key={i}
                className={cn(
                  styles.requirementItem,
                  req.check ? styles.requirementChecked : styles.requirementUnchecked
                )}
              >
                {req.check ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={styles.requirementIcon}>
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={styles.requirementIcon}>
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
        className={styles.footer}
      >
        <div className={styles.footerContent}>
          <button
            onClick={onContinue}
            disabled={!canContinue}
            className={cn(
              styles.footerButton,
              canContinue ? styles.footerButtonEnabled : styles.footerButtonDisabled
            )}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STEP: EMAIL VERIFY
// ============================================================================

interface EmailVerifyStepProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
  onResend: () => void;
  isLoading: boolean;
  error: string | null;
}

function EmailVerifyStep({
  email,
  onVerified,
  onBack,
  onResend,
  isLoading,
  error,
}: EmailVerifyStepProps): React.ReactElement {
  const [code, setCode] = useState('');
  const { seconds: cooldown, isActive: cooldownActive, start: startCooldown } = useCountdown(60, { autoStart: true });
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1****$3');
  const canSubmit = code.length === 6 && !isVerifying;

  const handleResend = () => {
    onResend();
    startCooldown();
  };
  
  const handleVerify = useCallback(async () => {
    if (code.length !== 6) return;
    
    setIsVerifying(true);
    setVerifyError(null);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (code.length === 6) {
      onVerified();
    } else {
      setVerifyError('Invalid verification code');
    }
    
    setIsVerifying(false);
  }, [code, onVerified]);
  
  // Keyboard handling
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canSubmit) {
      e.preventDefault();
      handleVerify();
    }
  }, [canSubmit, handleVerify]);
  
  return (
    <div
      className={styles.container}
      onKeyDown={handleKeyDown}
    >
      {/* Safe area with wr_blue background - covers dynamic island */}
      <div className={styles.safeAreaHeader} />
      {/* Spacer for safe area */}
      <div className={styles.safeAreaSpacer} />

      {/* Header with Back Button */}
      <div
        className={styles.header}
      >
        <button
          onClick={onBack}
          className={styles.backButton}
          aria-label="Back"
        >
          <ChevronLeft size={24} color="currentColor" />
        </button>
      </div>

      {/* Content */}
      <div
        className={styles.centeredContent}
      >
        <div className={styles.centerSection}>
          <div className={styles.iconCircle}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.iconCircleIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3
            className={cn(styles.centerTitle, authStyles.textPrimary)}
          >
            Check your email
          </h3>
          <p className={cn(styles.centerSubtitle, authStyles.textSecondary)}>
            We sent a 6-digit code to
            <br />
            <span className="font-medium">{maskedEmail}</span>
          </p>
        </div>

        {/* Error Message */}
        {(error || verifyError) && (
          <div
            className={styles.errorBanner}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.errorBannerIcon}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className={styles.errorBannerText}>
              {error || verifyError}
            </span>
          </div>
        )}

        {/* Code Input */}
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          maxLength={6}
          autoFocus
          disabled={isVerifying}
          className={styles.codeInput}
        />

        <p
          className={styles.resendSection}
        >
          Didn&apos;t receive it? Check your spam folder or{' '}
          {cooldownActive ? (
            <span>resend in {cooldown}s</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={isLoading}
              className={styles.resendLink}
            >
              resend code
            </button>
          )}
        </p>
      </div>

      {/* Footer */}
      <div
        className={styles.footer}
      >
        <div className={styles.footerContent}>
          <button
            onClick={handleVerify}
            disabled={!canSubmit}
            className={cn(
              styles.footerButton,
              'flex items-center justify-center gap-2',
              canSubmit ? styles.footerButtonEnabled : styles.footerButtonDisabled
            )}
          >
            {isVerifying ? (
              <>
                <div
                  className={styles.spinner}
                />
                Verifying...
              </>
            ) : (
              'Verify Email'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STEP: SUCCESS
// ============================================================================

interface SuccessStepProps {
  email: string;
  username: string;
  onComplete: () => void;
}

function SuccessStep({ email, username, onComplete }: SuccessStepProps): React.ReactElement {
  return (
    <div
      className={styles.successContainer}
    >
      <div className={styles.successIconCircle}>
        <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className={styles.successIcon}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2
        className={cn(styles.successTitle, authStyles.textPrimary)}
      >
        Welcome, {username}!
      </h2>

      <p
        className={cn(styles.successSubtitle, authStyles.textSecondary)}
      >
        Your account has been created
      </p>

      <div
        className={styles.successInfoBox}
      >
        <p className={cn(styles.infoText, authStyles.textMuted)}>
          We sent a verification email to:
        </p>
        <p className={styles.infoEmail}>
          {email}
        </p>
        <p className={cn(styles.infoText, authStyles.textMuted)}>
          Check your inbox to verify your account.
        </p>
      </div>

      {/* Tax reminder */}
      <div
        className={styles.taxReminder}
      >
        <p className={styles.taxReminderText}>
          You are responsible for reporting and paying any applicable taxes on winnings in accordance with your local tax laws.
        </p>
      </div>

      <button
        onClick={onComplete}
        className={styles.successButton}
      >
        Get Started
      </button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SignUpScreenVX2({ 
  onSwitchToLogin,
  onSuccess 
}: SignUpScreenVX2Props): React.ReactElement {
  const [step, setStep] = useState<SignUpStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsernameValid, setIsUsernameValid] = useState(false);
  
  const { signUpWithEmail } = useAuth();
  
  const handleCredentialsContinue = useCallback(() => {
    setError(null);
    setStep('username');
  }, []);
  
  const handleUsernameContinue = useCallback(() => {
    setStep('emailVerify');
  }, []);
  
  const handleCreateAccount = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signUpWithEmail({
        email,
        password,
        username,
      });
      
      if (result.success) {
        setStep('success');
      } else {
        setError(result.error?.message || 'Failed to create account');
        if (result.error?.field === 'username') {
          setStep('username');
        } else if (result.error?.field === 'email' || result.error?.field === 'password') {
          setStep('credentials');
        }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [email, password, username, signUpWithEmail]);
  
  const handleEmailVerified = useCallback(() => {
    handleCreateAccount();
  }, [handleCreateAccount]);
  
  const handleResendEmailCode = useCallback(async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  }, []);
  
  const handleBack = useCallback(() => {
    if (step === 'username') setStep('credentials');
    if (step === 'emailVerify') setStep('username');
  }, [step]);
  
  const handleComplete = useCallback(() => {
    onSuccess?.();
  }, [onSuccess]);
  
  // Render appropriate step
  switch (step) {
    case 'credentials':
      return (
        <CredentialsStep
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          onContinue={handleCredentialsContinue}
          onSwitchToLogin={onSwitchToLogin}
          error={error}
        />
      );
      
    case 'username':
      return (
        <UsernameStep
          username={username}
          setUsername={setUsername}
          onContinue={handleUsernameContinue}
          onBack={handleBack}
          canContinue={isUsernameValid}
          onValidChange={setIsUsernameValid}
        />
      );
      
    case 'emailVerify':
      return (
        <EmailVerifyStep
          email={email}
          onVerified={handleEmailVerified}
          onBack={handleBack}
          onResend={handleResendEmailCode}
          isLoading={isLoading}
          error={error}
        />
      );
      
    case 'success':
      return (
        <SuccessStep
          email={email}
          username={username}
          onComplete={handleComplete}
        />
      );
  }
}

export default SignUpScreenVX2;

