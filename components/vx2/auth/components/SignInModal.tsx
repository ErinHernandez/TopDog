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

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BG_COLORS, TEXT_COLORS, STATE_COLORS, BORDER_COLORS } from '../../core/constants/colors';
import { SPACING, TYPOGRAPHY, Z_INDEX } from '../../core/constants/sizes';
import { Close } from '../../components/icons';
import { useAuth } from '../hooks/useAuth';
import {
  isPlatformAuthenticatorAvailable,
  getLastBiometricUserId,
  isBiometricsEnabled,
  authenticateWithBiometric,
  getBiometricTypeName,
} from '../../../../lib/webauthn';

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
      <img 
        src="/logo.png" 
        alt="TopDog" 
        style={{ height: 48 }}
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
      className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold transition-all"
      style={{
        backgroundColor: STATE_COLORS.active,
        color: '#000',
        border: 'none',
        fontSize: 17,
        opacity: disabled ? 0.5 : 1,
        height: 52,
      }}
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
    <div className="flex items-center gap-4 my-6">
      <div className="flex-1 h-px" style={{ backgroundColor: BORDER_COLORS.default }} />
      <span style={{ color: TEXT_COLORS.muted, fontSize: 14 }}>or sign in with email</span>
      <div className="flex-1 h-px" style={{ backgroundColor: BORDER_COLORS.default }} />
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
      <div className="relative">
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
          className="w-full px-5 py-4 rounded-xl outline-none transition-all"
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            color: TEXT_COLORS.primary,
            border: `2px solid ${hasError ? STATE_COLORS.error : BORDER_COLORS.default}`,
            fontSize: 17,
            height: 56,
            opacity: disabled ? 0.5 : 1,
            paddingRight: rightElement ? 52 : 20,
          }}
        />
        {rightElement && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {hasError && (
        <div 
          className="flex items-center gap-1.5 mt-2 px-1"
          style={{ color: STATE_COLORS.error, fontSize: 13 }}
        >
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
  const [shakeError, setShakeError] = useState(false);
  
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
      setShakeError(false);
    }
  }, [isOpen]);
  
  // Trigger shake animation on error
  const triggerShake = useCallback(() => {
    setShakeError(true);
    setTimeout(() => setShakeError(false), 500);
  }, []);
  
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
    <div 
      className="absolute left-0 right-0 bottom-0 flex flex-col"
      style={{ 
        top: `${contentTopInset}px`, 
        backgroundColor: BG_COLORS.secondary, 
        zIndex: Z_INDEX.modal 
      }}
    >
      {/* Header with Close Button */}
      <div 
        className="flex items-center justify-end flex-shrink-0"
        style={{ padding: `${SPACING.md + 8}px ${SPACING.lg}px ${SPACING.md}px` }}
      >
        <button 
          onClick={onClose} 
          className="p-2 rounded-full transition-colors hover:bg-white/10" 
          aria-label="Close"
        >
          <Close size={24} color={TEXT_COLORS.muted} />
        </button>
      </div>
      
      {/* Content – logo stays high; form block pushed down 3× last move (72px) */}
      <div 
        ref={formRef}
        className={`flex-1 overflow-y-auto ${shakeError ? 'animate-shake' : ''}`}
        style={{ 
          padding: `0 ${SPACING.xl}px ${SPACING.xl}px`,
          scrollbarWidth: 'none',
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Logo */}
        <div className="text-center mb-8" style={{ marginTop: 22 }}>
          <TopDogLogo />
          {step === 'phoneCode' && (
            <p 
              className="mt-6"
              style={{ color: TEXT_COLORS.secondary, fontSize: 17 }}
            >
              Verify your phone
            </p>
          )}
        </div>
        
        <div style={{ marginTop: 94 }}>
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
          <div 
            className="mb-4 p-4 rounded-xl flex items-center gap-3"
            style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              border: `1px solid ${STATE_COLORS.error}20`,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={STATE_COLORS.error} strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ color: STATE_COLORS.error, fontSize: 15 }}>
              {error}
            </span>
          </div>
        )}
        
        {step === 'credentials' && (
          <div className="space-y-4">
            {/* Email/Phone Input — show "valid email" warning only after blur (click out) */}
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
              <p 
                className="px-1 -mt-2"
                style={{ color: TEXT_COLORS.muted, fontSize: 13 }}
              >
                We'll send you a verification code
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
                    className="p-1 rounded transition-colors hover:bg-white/10"
                    style={{ color: TEXT_COLORS.muted }}
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
            
            {/* Remember Me & Forgot Password - show with password field */}
            {inputType !== 'phone' && (
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className="flex items-center gap-3 cursor-pointer bg-transparent border-0 p-0 text-left"
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      backgroundImage: rememberMe ? 'url(/wr_blue.png)' : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: rememberMe ? 'none' : `2px solid ${BORDER_COLORS.default}`,
                    }}
                  >
                    {rememberMe && (
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 5L4.5 8.5L11 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span style={{ color: TEXT_COLORS.secondary, fontSize: 15 }}>
                    Remember me
                  </span>
                </button>
                
                {onForgotPassword && (
                  <button
                    onClick={onForgotPassword}
                    className="font-medium"
                    style={{ color: TEXT_COLORS.secondary, fontSize: 15 }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        
        {step === 'phoneCode' && (
          <div className="text-center">
            <p 
              className="mb-6"
              style={{ color: TEXT_COLORS.secondary, fontSize: 15 }}
            >
              Enter the 6-digit code sent to<br />
              <span className="font-medium" style={{ color: TEXT_COLORS.primary }}>{identifier}</span>
            </p>
            
            <input
              type="text"
              value={phoneCode}
              onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              autoComplete="one-time-code"
              disabled={isLoading}
              autoFocus
              className="w-full px-5 py-4 rounded-xl outline-none transition-all text-center tracking-[0.5em] font-mono"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: TEXT_COLORS.primary,
                border: `2px solid ${BORDER_COLORS.default}`,
                fontSize: 24,
                height: 64,
                opacity: isLoading ? 0.5 : 1,
              }}
            />
            
            <button
              onClick={() => {
                setStep('credentials');
                setPhoneCode('');
                setError(null);
              }}
              className="mt-6 font-medium"
              style={{ color: STATE_COLORS.active, fontSize: 15 }}
            >
              Use a different number
            </button>
          </div>
        )}

        {/* Primary action – just above footer line */}
        {step === 'credentials' ? (
          <div className="mt-6 pt-2" style={{ paddingBottom: 4 }}>
            <button
              onClick={handleSignIn}
              disabled={!canSignIn}
              className="w-full rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              style={{
                fontSize: 17,
                height: 56,
                ...(canSignIn
                  ? {
                      background: 'url(/wr_blue.png) no-repeat center center',
                      backgroundSize: 'cover',
                      color: '#000',
                      border: 'none',
                    }
                  : {
                      backgroundColor: BG_COLORS.tertiary,
                      color: TEXT_COLORS.disabled,
                    }),
                opacity: canSignIn ? 1 : 0.6,
              }}
            >
              {isLoading ? (
                <>
                  <div 
                    className="animate-spin rounded-full h-5 w-5 border-2"
                    style={{ borderColor: '#000 transparent transparent transparent' }}
                  />
                  {inputType === 'phone' ? 'Sending code...' : 'Signing in...'}
                </>
              ) : (
                inputType === 'phone' ? 'Send Code' : 'Sign In'
              )}
            </button>
          </div>
        ) : (
          <div className="mt-6 pt-2" style={{ paddingBottom: 4 }}>
            <button
              onClick={handleVerifyPhoneCode}
              disabled={phoneCode.length !== 6 || isLoading}
              className="w-full rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              style={{
                fontSize: 17,
                height: 56,
                ...(phoneCode.length === 6 && !isLoading
                  ? {
                      background: 'url(/wr_blue.png) no-repeat center center',
                      backgroundSize: 'cover',
                      color: '#000',
                      border: 'none',
                    }
                  : {
                      backgroundColor: BG_COLORS.tertiary,
                      color: TEXT_COLORS.disabled,
                    }),
                opacity: phoneCode.length === 6 && !isLoading ? 1 : 0.6,
              }}
            >
              {isLoading ? (
                <>
                  <div 
                    className="animate-spin rounded-full h-5 w-5 border-2"
                    style={{ borderColor: '#000 transparent transparent transparent' }}
                  />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </button>
          </div>
        )}
        </div>
      </div>
      
      {/* Footer – line + "Don't have an account?" only */}
      <div 
        className="flex-shrink-0"
        style={{ 
          padding: `${SPACING.md}px ${SPACING.xl}px`,
          paddingBottom: 'max(env(safe-area-inset-bottom), 24px)',
          borderTop: `1px solid ${BORDER_COLORS.default}`,
        }}
      >
        {onSwitchToSignUp && step === 'credentials' && (
          <p 
            className="text-center"
            style={{ color: TEXT_COLORS.muted, fontSize: 15 }}
          >
            Don&apos;t have an account?{' '}
            <button 
              onClick={onSwitchToSignUp}
              className="font-semibold bg-transparent border-0 p-0 cursor-pointer"
              style={{
                background: 'url(/wr_blue.png) no-repeat center center',
                backgroundSize: 'cover',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
                fontSize: 15,
              }}
            >
              Sign Up
            </button>
          </p>
        )}
      </div>
      
      {/* CSS for shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default SignInModal;
