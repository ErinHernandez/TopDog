/**
 * VX2 SignInModal - Enterprise Sign In Modal
 * 
 * Features:
 * - Email/password authentication
 * - Phone number authentication
 * - Biometric authentication (Face ID / Touch ID)
 * - Forgot password flow
 * - Remember me functionality
 * - Real-time validation
 * - Polished loading states
 * - Keyboard navigation
 * - Accessibility compliant
 * 
 * Note: No third-party OAuth (Google/Apple) - matches industry standard
 * for DFS platforms (Underdog, DraftKings) for KYC/fraud prevention.
 */

import Image from 'next/image';
import React, { useState, useCallback, useEffect, useRef } from 'react';

import { cn } from '@/lib/styles';

import {
  isPlatformAuthenticatorAvailable,
  getLastBiometricUserId,
  isBiometricsEnabled,
  authenticateWithBiometric,
  getBiometricTypeName,
} from '../../../../lib/webauthn';
import { TEXT_COLORS } from '../../core/constants/colors';
import { useTemporaryState } from '../../hooks/ui/useTemporaryState';
import { useAuth } from '../hooks/useAuth';

import styles from './SignInModal.module.css';

// ============================================================================
// TYPES
// ============================================================================

export interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignUp?: () => void;
  onForgotPassword?: () => void;
  onSuccess?: () => void;
  /** Top offset in px. Use 0 to align to safe-area edge (e.g. inside phone frame). Default 60. */
  contentTopInset?: number;
}

// ============================================================================
// LOGO COMPONENT
// ============================================================================

function TopDogLogo(): React.ReactElement {
  return (
    <div className="flex items-center justify-center">
      <Image
        src="/logo.png"
        alt="TopDog"
        className={styles.logo}
        width={120}
        height={120}
        unoptimized
      />
    </div>
  );
}

// ============================================================================
// BIOMETRIC BUTTON
// ============================================================================

function BiometricButton({ onClick, disabled, label }: { onClick: () => void; disabled: boolean; label: string }): React.ReactElement {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(styles.biometricButton, "w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold transition-all")}
    >
      {/* Face ID / Touch ID Icon */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M7 3H5C3.89543 3 3 3.89543 3 5V7" strokeLinecap="round"/>
        <path d="M17 3H19C20.1046 3 21 3.89543 21 5V7" strokeLinecap="round"/>
        <path d="M7 21H5C3.89543 21 3 20.1046 3 19V17" strokeLinecap="round"/>
        <path d="M17 21H19C20.1046 21 21 20.1046 21 19V17" strokeLinecap="round"/>
        <circle cx="9" cy="10" r="1" fill="currentColor"/>
        <circle cx="15" cy="10" r="1" fill="currentColor"/>
        <path d="M9 15C9 15 10.5 17 12 17C13.5 17 15 15 15 15" strokeLinecap="round"/>
      </svg>
      {label}
    </button>
  );
}

// ============================================================================
// DIVIDER
// ============================================================================

function Divider(): React.ReactElement {
  return (
    <div className={cn(styles.divider, "flex items-center gap-4 my-6")}>
      <div className={cn(styles.dividerLine, "flex-1 h-px")} />
      <span className={styles.dividerText}>or sign in with email</span>
      <div className={cn(styles.dividerLine, "flex-1 h-px")} />
    </div>
  );
}

// ============================================================================
// INPUT COMPONENTS
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
          className={cn(
            styles.input,
            hasError && styles.inputError,
            rightElement && styles.inputWithRight
          )}
        />
        {rightElement && (
          <div className={styles.inputRightElement}>
            {rightElement}
          </div>
        )}
      </div>
      {hasError && (
        <div className={styles.fieldError}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
// MAIN COMPONENT
// ============================================================================

type SignInStep = 'credentials' | 'phoneCode';

export function SignInModal({
  isOpen,
  onClose,
  onSwitchToSignUp,
  onForgotPassword,
  onSuccess,
  contentTopInset = 60,
}: SignInModalProps): React.ReactElement | null {
  // Form state
  const [step, setStep] = useState<SignInStep>('credentials');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation state (touched = user has left the field / blurred)
  const [identifierTouched, setIdentifierTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [identifierFocused, setIdentifierFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  // Loading/error state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakeError, setShakeError, setShakeErrorPermanent] = useTemporaryState(false, 500);

  // Biometric state
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricUserId, setBiometricUserId] = useState<string | null>(null);
  
  // Refs
  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  
  const { signInWithEmail, signInWithPhone, verifyPhoneCode: verifyCode } = useAuth();
  
  // Input type detection
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  const isPartialEmail = identifier.includes('@') && !isEmail;
  const isPhone = /^[\d\s\-+()]{10,}$/.test(identifier.replace(/\D/g, '')) && !identifier.includes('@');
  const inputType = isEmail ? 'email' : isPhone ? 'phone' : 'unknown';
  
  // Validation
  const identifierError = identifierTouched && identifier && inputType === 'unknown' && !isPartialEmail
    ? 'Enter a valid email or phone number'
    : null;
  const passwordError = passwordTouched && inputType === 'email' && !password
    ? 'Password is required'
    : null;
  
  // Check for biometric availability on mount
  useEffect(() => {
    async function checkBiometrics() {
      const available = await isPlatformAuthenticatorAvailable();
      if (available) {
        const lastUserId = getLastBiometricUserId();
        if (lastUserId && isBiometricsEnabled(lastUserId)) {
          setBiometricsAvailable(true);
          setBiometricUserId(lastUserId);
        }
      }
    }
    if (isOpen) {
      checkBiometrics();
    }
  }, [isOpen]);
  
  // Auto-focus email input on mount
  useEffect(() => {
    if (isOpen && step === 'credentials') {
      setTimeout(() => {
        identifierRef.current?.focus();
      }, 100);
    }
  }, [isOpen, step]);
  
  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('credentials');
      setIdentifier('');
      setPassword('');
      setPhoneCode('');
      setRememberMe(false);
      setIsLoading(false);
      setError(null);
      setShowPassword(false);
      setIdentifierTouched(false);
      setPasswordTouched(false);
      setIdentifierFocused(false);
      setPasswordFocused(false);
      setShakeErrorPermanent(false);
    }
  }, [isOpen, setShakeErrorPermanent]);
  
  // Trigger shake animation on error
  const triggerShake = useCallback(() => {
    setShakeError(true);
  }, [setShakeError]);
  
  // Handle biometric sign-in
  const handleBiometricSignIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await authenticateWithBiometric(biometricUserId || undefined);
      
      if (result.success && result.userId) {
        onSuccess?.();
        onClose();
      } else {
        setError(result.error || 'Biometric authentication failed');
        triggerShake();
      }
    } catch {
      setError('An unexpected error occurred');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  }, [biometricUserId, onSuccess, onClose, triggerShake]);
  
  // Handle sign in
  const handleSignIn = useCallback(async () => {
    // Inline "valid email" / "password required" warnings are shown only on blur
    // (touched is set in each input's onBlur). Do not set touched here.
    if (!identifier) {
      setError('Please enter your email or phone number');
      triggerShake();
      identifierRef.current?.focus();
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Treat 'unknown' as email login (default behavior)
      if (inputType === 'email' || inputType === 'unknown') {
        if (!password) {
          setError('Please enter your password');
          setIsLoading(false);
          triggerShake();
          passwordRef.current?.focus();
          return;
        }
        
        const result = await signInWithEmail({ email: identifier, password });
        
        if (result.success) {
          onSuccess?.();
          onClose();
        } else {
          setError(result.error?.message || 'Invalid email or password');
          triggerShake();
        }
      } else if (inputType === 'phone') {
        const result = await signInWithPhone({ phoneNumber: identifier, countryCode: 'US' });
        
        if (result.success) {
          setVerificationId(result.verificationId || null);
          setStep('phoneCode');
        } else {
          setError(result.error?.message || 'Failed to send verification code');
          triggerShake();
        }
      }
    } catch {
      setError('An unexpected error occurred');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  }, [identifier, password, inputType, signInWithEmail, signInWithPhone, onSuccess, onClose, triggerShake]);
  
  // Handle phone code verification
  const handleVerifyPhoneCode = useCallback(async () => {
    if (!phoneCode || phoneCode.length !== 6) {
      setError('Please enter the 6-digit code');
      triggerShake();
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (!verificationId) {
        setError('Verification expired. Please try again.');
        setStep('credentials');
        return;
      }
      
      const result = await verifyCode({ code: phoneCode, verificationId });
      
      if (result.success) {
        onSuccess?.();
        onClose();
      } else {
        setError(result.error?.message || 'Invalid verification code');
        triggerShake();
      }
    } catch {
      setError('An unexpected error occurred');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  }, [phoneCode, verificationId, verifyCode, onSuccess, onClose, triggerShake]);
  
  // Keyboard handling
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      if (step === 'credentials') {
        handleSignIn();
      } else if (step === 'phoneCode' && phoneCode.length === 6) {
        handleVerifyPhoneCode();
      }
    }
  }, [step, phoneCode, isLoading, handleSignIn, handleVerifyPhoneCode]);
  
  // Can submit check - treat 'unknown' as email (default)
  const canSignIn = ((inputType === 'email' || inputType === 'unknown') && identifier && password.length > 0 && !isLoading) ||
                    (inputType === 'phone' && identifier && !isLoading);
  
  if (!isOpen) return null;

  return (
    <div className={styles.modalContainer} style={{ '--content-top-inset': `${contentTopInset}px` } as React.CSSProperties} data-inset={contentTopInset}>
      {/* Blue outline wrapper - auth modal branding */}
      <div className={styles.blueOutline} aria-hidden="true" />

      {/* Content */}
      <div
        ref={formRef}
        className={cn(styles.contentArea, shakeError && styles.shake)}
        onKeyDown={handleKeyDown}
      >
        {/* Phone Code Message */}
        {step === 'phoneCode' && (
          <div className="text-center mb-6 mt-10">
            <p className={cn(styles.textSecondary, styles.phoneCodeMessageText)}>
              Verify your phone
            </p>
          </div>
        )}
        
        {/* Form Section */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Biometric Button - shown first if available */}
          {biometricsAvailable && step === 'credentials' && (
            <>
              <BiometricButton
                onClick={handleBiometricSignIn}
                disabled={isLoading}
                label={`Sign in with ${getBiometricTypeName()}`}
              />
              <Divider />
            </>
          )}
          
          {/* Error Message */}
          {error && (
            <div className={styles.errorBanner}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.errorIcon}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className={styles.errorBannerText}>{error}</span>
            </div>
          )}
          
          {/* Credentials Step */}
          {step === 'credentials' && (
            <div className="space-y-4">
              {/* Logo */}
              <div className="mb-6">
                <TopDogLogo />
              </div>
              
              {/* Email/Phone Input */}
              <Input
                inputRef={identifierRef}
                value={identifier}
                onChange={setIdentifier}
                onBlur={() => { setIdentifierTouched(true); setIdentifierFocused(false); }}
                onFocus={() => setIdentifierFocused(true)}
                placeholder="Email or phone number"
                autoComplete="email tel"
                disabled={isLoading}
                error={identifierFocused ? null : identifierError}
                touched={identifierTouched}
              />
              
              {/* Input type indicator - only show for phone */}
              {identifier && inputType === 'phone' && !identifierError && (
                <p className={cn(styles.textMuted, "px-1 -mt-2", styles.helperText)}>
                  We&apos;ll send you a verification code
                </p>
              )}
              
              {/* Password Input - show for email and unknown (default to email) */}
              {inputType !== 'phone' && (
                <Input
                  inputRef={passwordRef}
                  value={password}
                  onChange={setPassword}
                  onBlur={() => { setPasswordTouched(true); setPasswordFocused(false); }}
                  onFocus={() => setPasswordFocused(true)}
                  placeholder="Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  disabled={isLoading}
                  error={passwordFocused ? null : passwordError}
                  touched={passwordTouched}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={styles.togglePasswordButton}
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
              )}
              
              {/* Remember Me & Forgot Password */}
              {inputType !== 'phone' && (
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setRememberMe(!rememberMe)}
                    className="flex items-center gap-3 cursor-pointer bg-transparent border-0 p-0 text-left"
                  >
                    <div
                      className={cn(
                        styles.checkbox,
                        rememberMe ? styles.checkboxChecked : styles.checkboxUnchecked
                      )}
                    >
                      {rememberMe && (
                        <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 5L4.5 8.5L11 1" stroke={TEXT_COLORS.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className={cn(styles.textSecondary, styles.checkboxLabel)}>
                      Remember me
                    </span>
                  </button>

                  {onForgotPassword && (
                    <button
                      onClick={onForgotPassword}
                      className={cn(styles.textSecondary, "font-medium", styles.forgotPasswordButton)}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Phone Code Step */}
          {step === 'phoneCode' && (
            <div className="text-center">
              <p className={cn(styles.textSecondary, "mb-6", styles.codeInstructionText)}>
                Enter the 6-digit code sent to<br />
                <span className={cn(styles.textPrimary, "font-medium")}>{identifier}</span>
              </p>

              <input
                type="text"
                value={phoneCode}
                onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                autoComplete="one-time-code"
                disabled={isLoading}
                autoFocus
                className={styles.phoneCodeInput}
              />

              <button
                onClick={() => {
                  setStep('credentials');
                  setPhoneCode('');
                  setError(null);
                }}
                className={cn(styles.gradientText, "mt-6 font-medium", styles.alternateNumberButton)}
              >
                Use a different number
              </button>
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <div className="mt-6">
          {step === 'credentials' ? (
            <button
              onClick={handleSignIn}
              disabled={!canSignIn}
              className={cn(
                styles.primaryButton,
                canSignIn ? styles.primaryButtonEnabled : styles.primaryButtonDisabled
              )}
            >
              {isLoading ? (
                <>
                  <div className={styles.spinner} />
                  {inputType === 'phone' ? 'Sending code...' : 'Signing in...'}
                </>
              ) : (
                inputType === 'phone' ? 'Send Code' : 'Sign In'
              )}
            </button>
          ) : (
            <button
              onClick={handleVerifyPhoneCode}
              disabled={phoneCode.length !== 6 || isLoading}
              className={cn(
                styles.primaryButton,
                phoneCode.length === 6 && !isLoading ? styles.primaryButtonEnabled : styles.primaryButtonDisabled
              )}
            >
              {isLoading ? (
                <>
                  <div className={styles.spinner} />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Footer – line + "Don't have an account?" only */}
      <div className={styles.footer}>
        {onSwitchToSignUp && step === 'credentials' && (
          <p className={styles.footerText}>
            Don&apos;t have an account?{' '}
            <button
              onClick={onSwitchToSignUp}
              className={styles.footerLink}
            >
              Sign Up
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

export default SignInModal;
