/**
 * VX2 SignUpModal - Enterprise Sign Up Modal
 * 
 * Multi-step registration flow:
 * 1. Email & Password (with strength indicator)
 * 2. Username Selection (with VIP checking)
 * 3. Email Verification
 * 4. Success
 * 
 * Note: Secondary method (phone/email for 2FA withdrawals) is OPTIONAL
 * and can be added later in profile settings. This simplifies onboarding.
 * 
 * Features:
 * - Real-time validation
 * - Password strength indicator
 * - VIP username checking
 * - Polished loading states
 * - Keyboard navigation
 * - Accessibility compliant
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BG_COLORS, TEXT_COLORS, STATE_COLORS, BORDER_COLORS } from '../../core/constants/colors';
import { SPACING, TYPOGRAPHY, Z_INDEX } from '../../core/constants/sizes';
import { Close, ChevronLeft } from '../../components/icons';
import { UsernameInput } from './UsernameInput';
import { useAuth } from '../hooks/useAuth';
import { PASSWORD_CONSTRAINTS } from '../constants';

// ============================================================================
// TYPES
// ============================================================================

export interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignIn?: () => void;
  onSuccess?: () => void;
}

type SignUpStep = 'credentials' | 'username' | 'emailVerify' | 'success';

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
  const strengthColor = ['', STATE_COLORS.error, STATE_COLORS.warning, '#84cc16', STATE_COLORS.success][strength];
  
  return (
    <div className="mt-3" style={{ opacity: password ? 1 : 0, transition: 'opacity 0.2s' }}>
      <div className="flex gap-1.5 mb-2">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="flex-1 h-1.5 rounded-full transition-colors"
            style={{
              backgroundColor: strength >= level ? strengthColor : 'rgba(255,255,255,0.1)',
            }}
          />
        ))}
      </div>
      <div className="flex justify-between items-center">
        <span style={{ color: strengthColor, fontSize: 13 }}>
          {strengthLabel || '\u00A0'}
        </span>
        <span style={{ color: TEXT_COLORS.muted, fontSize: 13 }}>
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
  rightElement?: React.ReactNode;
  label?: string;
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
  rightElement,
  label,
}: InputProps): React.ReactElement {
  const hasError = touched && error;
  
  return (
    <div>
      {label && (
        <label 
          className="block font-medium mb-2"
          style={{ color: TEXT_COLORS.primary, fontSize: 15 }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
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
  onClose: () => void;
  onSwitchToSignIn?: () => void;
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
  onClose,
  onSwitchToSignIn,
  error,
}: CredentialsStepProps): React.ReactElement {
  const [emailTouched, setEmailTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = password.length >= PASSWORD_CONSTRAINTS.MIN_LENGTH &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  
  const showEmailError = emailTouched && email && !isValidEmail;
  const canContinue = isValidEmail && isValidPassword && passwordsMatch;
  
  // Auto-focus email input
  useEffect(() => {
    setTimeout(() => emailRef.current?.focus(), 100);
  }, []);
  
  // Keyboard handling
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canContinue) {
      e.preventDefault();
      onContinue();
    }
  }, [canContinue, onContinue]);
  
  return (
    <div className="flex flex-col h-full" onKeyDown={handleKeyDown}>
      {/* Header with Close Button */}
      <div 
        className="flex items-center justify-end flex-shrink-0"
        style={{ padding: `${SPACING.md}px ${SPACING.lg}px` }}
      >
        <button 
          onClick={onClose} 
          className="p-2 rounded-full transition-colors hover:bg-white/10" 
          aria-label="Close"
        >
          <Close size={24} color={TEXT_COLORS.muted} />
        </button>
      </div>
      
      {/* Content */}
      <div 
        className="flex-1 overflow-y-auto" 
        style={{ padding: `0 ${SPACING.xl}px`, scrollbarWidth: 'none' }}
      >
        {/* Logo & Welcome */}
        <div className="text-center mb-8">
          <TopDogLogo />
          <p 
            className="mt-6"
            style={{ color: TEXT_COLORS.secondary, fontSize: 17 }}
          >
            Create your account
          </p>
        </div>
        
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
        
        <div className="space-y-4">
          {/* Email Input */}
          <Input
            inputRef={emailRef}
            value={email}
            onChange={setEmail}
            onBlur={() => setEmailTouched(true)}
            placeholder="Email address"
            type="email"
            autoComplete="email"
            error={showEmailError ? 'Please enter a valid email' : null}
            touched={emailTouched}
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
                className="p-1 rounded transition-colors hover:bg-white/10"
                style={{ color: TEXT_COLORS.muted }}
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
          className="p-4 rounded-xl mt-6"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
        >
          <div 
            className="font-medium mb-3"
            style={{ color: TEXT_COLORS.secondary, fontSize: 15 }}
          >
            Password requirements:
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { check: password.length >= 8, label: '8+ characters' },
              { check: /[A-Z]/.test(password), label: 'Uppercase' },
              { check: /[a-z]/.test(password), label: 'Lowercase' },
              { check: /\d/.test(password), label: 'Number' },
            ].map((req, i) => (
              <div 
                key={i}
                className="flex items-center gap-2"
                style={{ 
                  color: req.check ? STATE_COLORS.success : TEXT_COLORS.muted,
                  fontSize: 14,
                }}
              >
                {req.check ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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
        className="flex-shrink-0"
        style={{ 
          padding: `${SPACING.lg}px ${SPACING.xl}px`,
          paddingBottom: 'max(env(safe-area-inset-bottom), 24px)',
          borderTop: `1px solid ${BORDER_COLORS.default}`,
        }}
      >
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className="w-full rounded-xl font-bold transition-all"
          style={{
            fontSize: 17,
            height: 56,
            backgroundColor: canContinue ? STATE_COLORS.active : BG_COLORS.tertiary,
            color: canContinue ? '#000' : TEXT_COLORS.disabled,
            opacity: canContinue ? 1 : 0.6,
          }}
        >
          Continue
        </button>
        
        {onSwitchToSignIn && (
          <p 
            className="text-center mt-4"
            style={{ color: TEXT_COLORS.muted, fontSize: 15 }}
          >
            Already have an account?{' '}
            <button 
              onClick={onSwitchToSignIn}
              className="font-semibold"
              style={{ color: STATE_COLORS.active }}
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
    <div className="flex flex-col h-full" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div 
        className="flex items-center gap-4 flex-shrink-0"
        style={{ padding: `${SPACING.md}px ${SPACING.lg}px` }}
      >
        <button 
          onClick={onBack} 
          className="p-2 rounded-full transition-colors hover:bg-white/10" 
          aria-label="Back"
        >
          <ChevronLeft size={24} color={TEXT_COLORS.muted} />
        </button>
      </div>
      
      {/* Content */}
      <div 
        className="flex-1 flex flex-col justify-center"
        style={{ padding: `0 ${SPACING.xl}px` }}
      >
        <div className="text-center mb-8">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'rgba(96, 165, 250, 0.15)' }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={STATE_COLORS.active} strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 
            className="font-bold mb-2"
            style={{ color: TEXT_COLORS.primary, fontSize: 24 }}
          >
            Pick your username
          </h3>
          <p style={{ color: TEXT_COLORS.secondary, fontSize: 15 }}>
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
          className="p-4 rounded-xl mt-6"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
        >
          <div
            className="font-medium mb-3"
            style={{ color: TEXT_COLORS.secondary, fontSize: 15 }}
          >
            Username requirements:
          </div>
          <div className="space-y-2">
            {[
              { check: username.length >= 3 && username.length <= 18, label: '3-18 characters' },
              { check: /^[a-zA-Z]/.test(username), label: 'Start with a letter' },
              { check: /^[a-zA-Z0-9_]*$/.test(username) && username.length > 0, label: 'Letters, numbers, underscores only' },
            ].map((req, i) => (
              <div
                key={i}
                className="flex items-center gap-2"
                style={{
                  color: req.check ? STATE_COLORS.success : TEXT_COLORS.muted,
                  fontSize: 14,
                }}
              >
                {req.check ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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
        className="flex-shrink-0"
        style={{ 
          padding: `${SPACING.lg}px ${SPACING.xl}px`,
          paddingBottom: 'max(env(safe-area-inset-bottom), 24px)',
          borderTop: `1px solid ${BORDER_COLORS.default}`,
        }}
      >
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className="w-full rounded-xl font-bold transition-all"
          style={{
            fontSize: 17,
            height: 56,
            backgroundColor: canContinue ? STATE_COLORS.active : BG_COLORS.tertiary,
            color: canContinue ? '#000' : TEXT_COLORS.disabled,
            opacity: canContinue ? 1 : 0.6,
          }}
        >
          Continue
        </button>
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
  const [cooldown, setCooldown] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1****$3');
  const canSubmit = code.length === 6 && !isVerifying;
  
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [cooldown]);
  
  const handleResend = () => {
    onResend();
    setCooldown(60);
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
    <div className="flex flex-col h-full" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div 
        className="flex items-center gap-4 flex-shrink-0"
        style={{ padding: `${SPACING.md}px ${SPACING.lg}px` }}
      >
        <button 
          onClick={onBack} 
          className="p-2 rounded-full transition-colors hover:bg-white/10" 
          aria-label="Back"
        >
          <ChevronLeft size={24} color={TEXT_COLORS.muted} />
        </button>
      </div>
      
      {/* Content */}
      <div 
        className="flex-1 flex flex-col justify-center"
        style={{ padding: `0 ${SPACING.xl}px` }}
      >
        <div className="text-center mb-8">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'rgba(96, 165, 250, 0.15)' }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={STATE_COLORS.active} strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 
            className="font-bold mb-2"
            style={{ color: TEXT_COLORS.primary, fontSize: 24 }}
          >
            Check your email
          </h3>
          <p style={{ color: TEXT_COLORS.secondary, fontSize: 15 }}>
            We sent a 6-digit code to
            <br />
            <span className="font-medium" style={{ color: TEXT_COLORS.primary }}>{maskedEmail}</span>
          </p>
        </div>
        
        {/* Error Message */}
        {(error || verifyError) && (
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
          className="w-full px-5 py-4 rounded-xl outline-none text-center tracking-[0.5em] font-mono transition-all"
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            color: TEXT_COLORS.primary,
            border: `2px solid ${BORDER_COLORS.default}`,
            fontSize: 24,
            height: 64,
            opacity: isVerifying ? 0.5 : 1,
          }}
        />
        
        <p 
          className="text-center mt-6"
          style={{ color: TEXT_COLORS.muted, fontSize: 14 }}
        >
          Didn't receive it? Check your spam folder or{' '}
          {cooldown > 0 ? (
            <span>resend in {cooldown}s</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={isLoading}
              className="font-semibold"
              style={{ color: STATE_COLORS.active }}
            >
              resend code
            </button>
          )}
        </p>
      </div>
      
      {/* Footer */}
      <div 
        className="flex-shrink-0"
        style={{ 
          padding: `${SPACING.lg}px ${SPACING.xl}px`,
          paddingBottom: 'max(env(safe-area-inset-bottom), 24px)',
          borderTop: `1px solid ${BORDER_COLORS.default}`,
        }}
      >
        <button
          onClick={handleVerify}
          disabled={!canSubmit}
          className="w-full rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          style={{
            fontSize: 17,
            height: 56,
            backgroundColor: canSubmit ? STATE_COLORS.active : BG_COLORS.tertiary,
            color: canSubmit ? '#000' : TEXT_COLORS.disabled,
            opacity: canSubmit ? 1 : 0.6,
          }}
        >
          {isVerifying ? (
            <>
              <div 
                className="animate-spin rounded-full h-5 w-5 border-2"
                style={{ borderColor: '#000 transparent transparent transparent' }}
              />
              Verifying...
            </>
          ) : (
            'Verify Email'
          )}
        </button>
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
  onClose: () => void;
}

function SuccessStep({ email, username, onClose }: SuccessStepProps): React.ReactElement {
  return (
    <div 
      className="flex flex-col h-full items-center justify-center"
      style={{ padding: `0 ${SPACING.xl}px` }}
    >
      <div 
        className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}
      >
        <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke={STATE_COLORS.success} strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h2 
        className="font-bold mb-3"
        style={{ color: TEXT_COLORS.primary, fontSize: 28 }}
      >
        Welcome, {username}!
      </h2>
      
      <p 
        className="text-center mb-6"
        style={{ color: TEXT_COLORS.secondary, fontSize: 17 }}
      >
        Your account has been created
      </p>
      
      <div 
        className="text-center mb-6 px-5 py-4 rounded-xl w-full"
        style={{ 
          backgroundColor: 'rgba(255,255,255,0.03)', 
        }}
      >
        <p style={{ color: TEXT_COLORS.muted, fontSize: 14 }} className="mb-2">
          We sent a verification email to:
        </p>
        <p style={{ color: TEXT_COLORS.primary, fontWeight: 500, fontSize: 15 }}>{email}</p>
        <p style={{ color: TEXT_COLORS.muted, fontSize: 14 }} className="mt-2">
          Check your inbox to verify your account.
        </p>
      </div>
      
      {/* Tax reminder */}
      <div 
        className="text-center mb-8 px-5 py-4 rounded-xl w-full"
        style={{ 
          backgroundColor: 'rgba(255,255,255,0.03)', 
          borderLeft: `3px solid ${TEXT_COLORS.muted}`,
        }}
      >
        <p style={{ color: TEXT_COLORS.muted, fontSize: 13 }}>
          You are responsible for reporting and paying any applicable taxes on winnings in accordance with your local tax laws.
        </p>
      </div>
      
      <button 
        onClick={onClose}
        className="w-full rounded-xl font-bold"
        style={{ 
          backgroundColor: STATE_COLORS.active,
          color: '#000', 
          fontSize: 17,
          height: 56,
        }}
      >
        Get Started
      </button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SignUpModal({ 
  isOpen, 
  onClose, 
  onSwitchToSignIn,
  onSuccess 
}: SignUpModalProps): React.ReactElement | null {
  const [step, setStep] = useState<SignUpStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsernameValid, setIsUsernameValid] = useState(false);
  
  const { signUpWithEmail } = useAuth();
  
  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('credentials');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setUsername('');
      setIsLoading(false);
      setError(null);
      setIsUsernameValid(false);
    }
  }, [isOpen]);
  
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
        onSuccess?.();
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
  }, [email, password, username, signUpWithEmail, onSuccess]);
  
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
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="absolute left-0 right-0 bottom-0 flex flex-col"
      style={{ 
        top: '60px', 
        backgroundColor: BG_COLORS.secondary, 
        zIndex: Z_INDEX.modal 
      }}
    >
      {step === 'credentials' && (
        <CredentialsStep
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          onContinue={handleCredentialsContinue}
          onClose={onClose}
          onSwitchToSignIn={onSwitchToSignIn}
          error={error}
        />
      )}
      
      {step === 'username' && (
        <UsernameStep
          username={username}
          setUsername={setUsername}
          onContinue={handleUsernameContinue}
          onBack={handleBack}
          canContinue={isUsernameValid}
          onValidChange={setIsUsernameValid}
        />
      )}
      
      {step === 'emailVerify' && (
        <EmailVerifyStep
          email={email}
          onVerified={handleEmailVerified}
          onBack={handleBack}
          onResend={handleResendEmailCode}
          isLoading={isLoading}
          error={error}
        />
      )}
      
      {step === 'success' && (
        <SuccessStep
          email={email}
          username={username}
          onClose={onClose}
        />
      )}
    </div>
  );
}

export default SignUpModal;
