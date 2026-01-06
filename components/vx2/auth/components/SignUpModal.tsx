/**
 * VX2 SignUpModal - Enterprise Sign Up Modal
 * 
 * Multi-step registration flow:
 * 1. Email & Password
 * 2. Username Selection
 * 3. Country Selection
 * 4. Success / Email Verification
 * 
 * Features:
 * - Real-time validation
 * - Country-specific username characters
 * - Password strength indicator
 * - VIP username checking
 * - Accessibility compliant
 */

import React, { useState, useCallback, useEffect } from 'react';
import { BG_COLORS, TEXT_COLORS, STATE_COLORS, BORDER_COLORS } from '../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY, Z_INDEX } from '../../core/constants/sizes';
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

type SignUpStep = 'credentials' | 'username' | 'emailVerify' | 'secondaryMethod' | 'success';
type SecondaryMethodType = 'phone' | 'email';

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
  
  // Map 7-point score to 5 levels: 0=none, 1=Weak, 2=Fair, 3=Good, 4=Strong
  let strength: number;
  if (score <= 2) strength = 1;      // Weak: just length or 1-2 checks
  else if (score <= 3) strength = 2; // Fair: 3 checks
  else if (score <= 5) strength = 3; // Good: 4-5 checks
  else strength = 4;                 // Strong: 6-7 checks (needs special char + good length)
  
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', STATE_COLORS.error, STATE_COLORS.warning, '#84cc16', STATE_COLORS.success][strength]; // Good = lime, Strong = green
  
  // Always render the same structure to prevent layout shift, but only show content when typing
  return (
    <div className="mt-2" style={{ opacity: password ? 1 : 0, transition: 'opacity 0.2s' }}>
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="flex-1 h-1 rounded-full transition-colors"
            style={{
              backgroundColor: strength >= level ? strengthColor : 'rgba(255,255,255,0.1)',
            }}
          />
        ))}
      </div>
      <div className="flex justify-between items-center" style={{ minHeight: 17 }}>
        <span style={{ color: strengthColor, fontSize: `${TYPOGRAPHY.fontSize.xs}px` }}>
          {strengthLabel || '\u00A0'}
        </span>
        <span style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.xs}px` }}>
          {password.length}/{PASSWORD_CONSTRAINTS.MIN_LENGTH}+ chars
        </span>
      </div>
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
  
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = password.length >= PASSWORD_CONSTRAINTS.MIN_LENGTH &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  
  const showEmailError = emailTouched && email && !isValidEmail;
  const canContinue = isValidEmail && isValidPassword && passwordsMatch;
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div 
        className="flex flex-col items-start flex-shrink-0 relative"
        style={{ 
          padding: `${SPACING.xl}px ${SPACING.xl}px ${SPACING.lg}px`, 
          borderBottom: `1px solid ${BORDER_COLORS.default}` 
        }}
      >
        <button 
          onClick={onClose} 
          className="p-2 absolute right-4 top-4" 
          aria-label="Close"
        >
          <Close size={28} color={TEXT_COLORS.muted} />
        </button>
        <div 
          style={{ 
            width: 56, 
            height: 56,
            background: 'url(/wr_blue.png) center center / cover no-repeat',
            WebkitMaskImage: 'url(/logo.png)',
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskImage: 'url(/logo.png)',
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
          }}
        />
        <h2 
          className="font-bold mt-3" 
          style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize['2xl']}px` }}
        >
          Create Account
        </h2>
      </div>
      
      {/* Content */}
      <div 
        className="flex-1 overflow-y-auto" 
        style={{ padding: SPACING.xl, scrollbarWidth: 'none' }}
      >
        {/* Error Message */}
        {error && (
          <div 
            className="mb-4 p-3 rounded-lg"
            style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              color: STATE_COLORS.error,
              fontSize: `${TYPOGRAPHY.fontSize.sm}px` 
            }}
          >
            {error}
          </div>
        )}
        
        {/* Email Input */}
        <div className="mb-5">
          <label 
            className="block font-medium mb-4"
            style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.base}px` }}
          >
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setEmailTouched(false)}
            onBlur={() => setEmailTouched(true)}
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full px-5 py-4 rounded-xl outline-none transition-colors"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: TEXT_COLORS.primary,
              border: `2px solid ${showEmailError ? STATE_COLORS.error : BORDER_COLORS.default}`,
              fontSize: `${TYPOGRAPHY.fontSize.lg}px`,
            }}
          />
          {showEmailError && (
            <span 
              className="block mt-1"
              style={{ color: STATE_COLORS.error, fontSize: `${TYPOGRAPHY.fontSize.xs}px` }}
            >
              Please enter a valid email
            </span>
          )}
        </div>
        
        {/* Divider */}
        <div 
          style={{ 
            borderTop: `1px solid ${BORDER_COLORS.default}`,
            marginTop: SPACING.sm,
            marginBottom: SPACING.lg,
          }} 
        />
        
        {/* Password Input */}
        <div className="mb-1">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            autoComplete="new-password"
            className="w-full px-5 py-4 rounded-xl outline-none transition-colors"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: TEXT_COLORS.primary,
              border: `2px solid ${BORDER_COLORS.default}`,
              fontSize: `${TYPOGRAPHY.fontSize.lg}px`,
            }}
          />
          <PasswordStrength password={password} />
        </div>
        
        {/* Confirm Password Input */}
        <div className="mb-8">
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            autoComplete="new-password"
            className="w-full px-5 py-4 rounded-xl outline-none transition-colors"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: TEXT_COLORS.primary,
              border: `2px solid ${confirmPassword && !passwordsMatch ? STATE_COLORS.error : passwordsMatch ? STATE_COLORS.success : BORDER_COLORS.default}`,
              fontSize: `${TYPOGRAPHY.fontSize.lg}px`,
            }}
          />
          {/* Password match indicator */}
          {confirmPassword && (
            <div className="flex items-center gap-1 mt-2">
              {confirmPassword.split('').map((char, index) => {
                const matches = password[index] === char;
                return (
                  <span 
                    key={index}
                    style={{ 
                      color: matches ? STATE_COLORS.success : STATE_COLORS.error,
                      fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
                      fontWeight: 600,
                    }}
                  >
                    *
                  </span>
                );
              })}
              {passwordsMatch && (
                <svg 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none"
                  className="ml-1"
                  style={{ color: STATE_COLORS.success }}
                >
                  <path
                    d="M20 6L9 17L4 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          )}
        </div>
        
        {/* Password Requirements */}
        <div 
          className="p-4 rounded-lg mb-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
        >
          <div 
            className="font-medium mb-3"
            style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.lg}px` }}
          >
            Password must have:
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { check: password.length >= 8, label: '8+ characters' },
              { check: /[A-Z]/.test(password), label: 'Uppercase letter' },
              { check: /[a-z]/.test(password), label: 'Lowercase letter' },
              { check: /\d/.test(password), label: 'Number' },
            ].map((req, i) => (
              <div 
                key={i}
                className="flex items-center gap-2"
                style={{ 
                  color: req.check ? STATE_COLORS.success : TEXT_COLORS.muted,
                  fontSize: `${TYPOGRAPHY.fontSize.lg}px` 
                }}
              >
                {req.check ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
        style={{ padding: SPACING['2xl'], borderTop: `1px solid ${BORDER_COLORS.default}` }}
      >
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className="w-full py-5 rounded-xl font-bold transition-all"
          style={{
            fontSize: `${TYPOGRAPHY.fontSize.xl}px`,
            background: canContinue ? 'url(/wr_blue.png) center center / cover no-repeat' : BG_COLORS.tertiary,
            color: canContinue ? '#fff' : TEXT_COLORS.disabled,
            opacity: canContinue ? 1 : 0.5,
          }}
        >
          Continue
        </button>
        
        {onSwitchToSignIn && (
          <p 
            className="text-center mt-5"
            style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.base}px` }}
          >
            Already have an account?{' '}
            <button 
              onClick={onSwitchToSignIn}
              className="font-semibold"
              style={{ 
                background: 'url(/wr_blue.png) center center / cover no-repeat',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
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
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div 
        className="flex items-center gap-4 flex-shrink-0"
        style={{ 
          padding: `${SPACING.lg}px ${SPACING.xl}px`, 
          borderBottom: `1px solid ${BORDER_COLORS.default}` 
        }}
      >
        <button onClick={onBack} className="p-2" aria-label="Back">
          <ChevronLeft size={28} color={TEXT_COLORS.muted} />
        </button>
      </div>
      
      {/* Content */}
      <div 
        className="flex-1 flex flex-col justify-center px-8"
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
            style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize['2xl']}px` }}
          >
            Pick your username
          </h3>
          <p style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.base}px` }}>
            This is how other players will see you
          </p>
        </div>
        
        <UsernameInput
          value={username}
          onChange={(value) => {
            setUsername(value);
            // Reset validity when typing
            onValidChange?.(false);
          }}
          size="lg"
          onValid={() => onValidChange?.(true)}
        />
        
        {/* Username Requirements */}
        <div
          className="p-4 rounded-lg mt-6"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
        >
          <div
            className="font-medium mb-3"
            style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.lg}px` }}
          >
            Username must have:
          </div>
          <div className="grid grid-cols-1 gap-3">
            {[
              { check: username.length >= 3, label: '3-18 characters' },
              { check: /^[a-zA-Z]/.test(username), label: 'Start with a letter' },
              { check: /^[a-zA-Z0-9_]*$/.test(username) && username.length > 0, label: 'Letters, numbers, underscores only' },
            ].map((req, i) => (
              <div
                key={i}
                className="flex items-center gap-2"
                style={{
                  color: req.check ? STATE_COLORS.success : TEXT_COLORS.muted,
                  fontSize: `${TYPOGRAPHY.fontSize.lg}px`
                }}
              >
                {req.check ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
        style={{ padding: SPACING['2xl'], borderTop: `1px solid ${BORDER_COLORS.default}` }}
      >
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className="w-full py-5 rounded-xl font-bold transition-all"
          style={{
            fontSize: `${TYPOGRAPHY.fontSize.xl}px`,
            background: canContinue ? 'url(/wr_blue.png) center center / cover no-repeat' : BG_COLORS.tertiary,
            color: canContinue ? '#fff' : TEXT_COLORS.disabled,
            opacity: canContinue ? 1 : 0.5,
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
    
    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For demo, accept any 6-digit code
    if (code.length === 6) {
      onVerified();
    } else {
      setVerifyError('Invalid verification code');
    }
    
    setIsVerifying(false);
  }, [code, onVerified]);
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div 
        className="flex items-center gap-4 flex-shrink-0"
        style={{ 
          padding: `${SPACING.lg}px ${SPACING.xl}px`, 
          borderBottom: `1px solid ${BORDER_COLORS.default}` 
        }}
      >
        <button onClick={onBack} className="p-2" aria-label="Back">
          <ChevronLeft size={28} color={TEXT_COLORS.muted} />
        </button>
        <h2 
          className="font-bold" 
          style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.xl}px` }}
        >
          Verify Email
        </h2>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-8">
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
            style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize['2xl']}px` }}
          >
            Check your email
          </h3>
          <p style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.base}px` }}>
            We sent a 6-digit code to
            <br />
            <span style={{ color: TEXT_COLORS.primary, fontWeight: 500 }}>{maskedEmail}</span>
          </p>
        </div>
        
        {/* Error Message */}
        {(error || verifyError) && (
          <div 
            className="mb-4 p-3 rounded-lg text-center"
            style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              color: STATE_COLORS.error,
              fontSize: `${TYPOGRAPHY.fontSize.sm}px` 
            }}
          >
            {error || verifyError}
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
          className="w-full px-5 py-4 rounded-xl outline-none text-center tracking-widest mb-4"
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            color: TEXT_COLORS.primary,
            border: `2px solid ${BORDER_COLORS.default}`,
            fontSize: `${TYPOGRAPHY.fontSize['2xl']}px`,
            letterSpacing: '0.5em',
            opacity: isVerifying ? 0.5 : 1,
          }}
        />
        
        <p 
          className="text-center"
          style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
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
        style={{ padding: SPACING['2xl'], borderTop: `1px solid ${BORDER_COLORS.default}` }}
      >
        <button
          onClick={handleVerify}
          disabled={!canSubmit}
          className="w-full py-5 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          style={{
            fontSize: `${TYPOGRAPHY.fontSize.xl}px`,
            background: canSubmit ? 'url(/wr_blue.png) center center / cover no-repeat' : BG_COLORS.tertiary,
            color: canSubmit ? '#fff' : TEXT_COLORS.disabled,
            opacity: canSubmit ? 1 : 0.5,
          }}
        >
          {isVerifying ? (
            <>
              <div 
                className="animate-spin rounded-full h-5 w-5 border-2"
                style={{ borderColor: '#fff transparent transparent transparent' }}
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
  secondaryType: SecondaryMethodType | null;
  secondaryValue: string | null;
  onClose: () => void;
}

function SuccessStep({ email, username, secondaryType, secondaryValue, onClose }: SuccessStepProps): React.ReactElement {
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  
  const skippedSecondary = !secondaryValue || !secondaryType;
  
  const maskedValue = skippedSecondary 
    ? '' 
    : secondaryType === 'phone' 
      ? secondaryValue.slice(0, -4).replace(/\d/g, '*') + secondaryValue.slice(-4)
      : secondaryValue.replace(/(.{2})(.*)(@.*)/, '$1****$3');
  
  const handleVerify = useCallback(async () => {
    if (verificationCode.length !== 6) return;
    
    setIsVerifying(true);
    setVerifyError(null);
    
    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For demo, accept any 6-digit code
    if (verificationCode.length === 6) {
      setIsVerified(true);
      setTimeout(() => {
        setShowVerifyModal(false);
      }, 1500);
    } else {
      setVerifyError('Invalid verification code');
    }
    
    setIsVerifying(false);
  }, [verificationCode]);
  
  const handleSkipVerification = useCallback(() => {
    setShowVerifyModal(false);
  }, []);
  
  const handleGetStarted = useCallback(() => {
    if (skippedSecondary || isVerified) {
      onClose();
    } else {
      setShowVerifyModal(true);
    }
  }, [skippedSecondary, isVerified, onClose]);
  
  return (
    <div className="flex flex-col h-full items-center justify-center px-8">
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
        style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize['3xl']}px` }}
      >
        Welcome, {username}!
      </h2>
      
      <p 
        className="text-center mb-6"
        style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.xl}px` }}
      >
        Your account has been created
      </p>
      
      <div 
        className="text-center mb-6 px-5 py-4 rounded-lg w-full"
        style={{ 
          backgroundColor: 'rgba(255,255,255,0.03)', 
          color: TEXT_COLORS.muted, 
          fontSize: `${TYPOGRAPHY.fontSize.base}px` 
        }}
      >
        <p className="mb-2">We sent a verification email to:</p>
        <p style={{ color: TEXT_COLORS.primary, fontWeight: 500 }}>{email}</p>
        <p className="mt-2">Check your inbox to verify your account.</p>
      </div>
      
      {/* Security confirmation - skipped, pending or verified */}
      <div 
        className="flex items-center gap-3 mb-4 px-5 py-4 rounded-lg w-full"
        style={{ backgroundColor: isVerified ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)' }}
      >
        {isVerified ? (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={STATE_COLORS.success} strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span style={{ color: STATE_COLORS.success, fontSize: `${TYPOGRAPHY.fontSize.base}px` }}>
              Two-step verification active for withdrawals
            </span>
          </>
        ) : skippedSecondary ? (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={STATE_COLORS.warning} strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <span style={{ color: STATE_COLORS.warning, fontSize: `${TYPOGRAPHY.fontSize.base}px` }}>
                Two-step security not set up
              </span>
              <p style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.xs}px`, marginTop: 2 }}>
                Add a secondary login method in settings to enable withdrawals
              </p>
            </div>
          </>
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={STATE_COLORS.warning} strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <span style={{ color: STATE_COLORS.warning, fontSize: `${TYPOGRAPHY.fontSize.base}px` }}>
                Secondary login pending verification
              </span>
              <p style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.xs}px`, marginTop: 2 }}>
                Verify your {secondaryType} to enable two-step withdrawals
              </p>
            </div>
          </>
        )}
      </div>

      {/* Tax reminder */}
      <div 
        className="text-center mb-6 px-5 py-4 rounded-lg w-full"
        style={{ 
          backgroundColor: 'rgba(255,255,255,0.03)', 
          borderLeft: `3px solid ${TEXT_COLORS.muted}`,
        }}
      >
        <p style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
          You are responsible for reporting and paying any applicable taxes on winnings in accordance with your local tax laws.
        </p>
      </div>
      
      <button 
        onClick={handleGetStarted}
        className="w-full py-5 rounded-xl font-bold"
        style={{ 
          background: 'url(/wr_blue.png) center center / cover no-repeat', 
          color: '#fff', 
          fontSize: `${TYPOGRAPHY.fontSize.xl}px` 
        }}
      >
        {isVerified || skippedSecondary ? 'Get Started' : 'Verify & Get Started'}
      </button>
      
      {!isVerified && !skippedSecondary && (
        <button 
          onClick={onClose}
          className="mt-4 py-3"
          style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.base}px` }}
        >
          Skip for now
        </button>
      )}
      
      {/* Verification Modal */}
      {showVerifyModal && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: Z_INDEX.modal + 10 }}
        >
          <div 
            className="w-full max-w-sm mx-6 rounded-2xl overflow-hidden"
            style={{ backgroundColor: BG_COLORS.secondary }}
          >
            {/* Modal Header */}
            <div 
              className="flex items-center justify-between p-5"
              style={{ borderBottom: `1px solid ${BORDER_COLORS.default}` }}
            >
              <h3 
                className="font-bold"
                style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.xl}px` }}
              >
                Verify {secondaryType === 'phone' ? 'Phone' : 'Email'}
              </h3>
              <button 
                onClick={handleSkipVerification}
                className="p-2"
                aria-label="Close"
              >
                <Close size={24} color={TEXT_COLORS.muted} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              {isVerified ? (
                <div className="text-center py-6">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}
                  >
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke={STATE_COLORS.success} strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p style={{ color: STATE_COLORS.success, fontSize: `${TYPOGRAPHY.fontSize.lg}px`, fontWeight: 600 }}>
                    Verified!
                  </p>
                </div>
              ) : (
                <>
                  <p 
                    className="text-center mb-6"
                    style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.base}px` }}
                  >
                    We sent a 6-digit code to
                    <br />
                    <span style={{ color: TEXT_COLORS.primary, fontWeight: 500 }}>{maskedValue}</span>
                  </p>
                  
                  {verifyError && (
                    <div 
                      className="mb-4 p-3 rounded-lg text-center"
                      style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: STATE_COLORS.error, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
                    >
                      {verifyError}
                    </div>
                  )}
                  
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-5 py-4 rounded-xl outline-none text-center tracking-widest"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: TEXT_COLORS.primary,
                      border: `2px solid ${BORDER_COLORS.default}`,
                      fontSize: `${TYPOGRAPHY.fontSize['2xl']}px`,
                      letterSpacing: '0.5em',
                    }}
                    autoFocus
                  />
                  
                  <button
                    onClick={handleVerify}
                    disabled={verificationCode.length !== 6 || isVerifying}
                    className="w-full mt-5 py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                    style={{
                      background: verificationCode.length === 6 ? 'url(/wr_blue.png) center center / cover no-repeat' : BG_COLORS.tertiary,
                      color: verificationCode.length === 6 ? '#fff' : TEXT_COLORS.disabled,
                      fontSize: `${TYPOGRAPHY.fontSize.lg}px`,
                      opacity: verificationCode.length === 6 ? 1 : 0.5,
                    }}
                  >
                    {isVerifying ? (
                      <>
                        <div 
                          className="animate-spin rounded-full h-5 w-5 border-2"
                          style={{ borderColor: '#fff transparent transparent transparent' }}
                        />
                        Verifying...
                      </>
                    ) : (
                      'Verify'
                    )}
                  </button>
                  
                  <button
                    onClick={() => {/* Resend code logic */}}
                    className="w-full mt-4 py-3"
                    style={{ color: STATE_COLORS.active, fontSize: `${TYPOGRAPHY.fontSize.base}px` }}
                  >
                    Resend code
                  </button>
                </>
              )}
            </div>
            
            {/* Skip option */}
            {!isVerified && (
              <div 
                className="p-5 text-center"
                style={{ borderTop: `1px solid ${BORDER_COLORS.default}` }}
              >
                <button 
                  onClick={handleSkipVerification}
                  style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
                >
                  I'll verify later
                </button>
                <p 
                  className="mt-2"
                  style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.xs}px` }}
                >
                  Two-step withdrawals won't be active until verified
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// STEP: BACKUP METHOD (Required for 2FA on withdrawals)
// ============================================================================

interface SecondaryMethodStepProps {
  secondaryType: SecondaryMethodType;
  setSecondaryType: (type: SecondaryMethodType) => void;
  phoneValue: string;
  setPhoneValue: (value: string) => void;
  secondaryEmail: string;
  setSecondaryEmail: (value: string) => void;
  primaryEmail: string;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
  isLoading: boolean;
}

// Format phone number as user types: +1 (555) 123-4567
function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  
  if (digits.length === 0) return '';
  if (digits.length <= 1) return `+${digits}`;
  if (digits.length <= 4) return `+${digits.slice(0, 1)} (${digits.slice(1)}`;
  if (digits.length <= 7) return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4)}`;
  if (digits.length <= 11) return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
}

function SecondaryMethodStep({
  secondaryType,
  setSecondaryType,
  phoneValue,
  setPhoneValue,
  secondaryEmail,
  setSecondaryEmail,
  primaryEmail,
  onContinue,
  onSkip,
  onBack,
  isLoading,
}: SecondaryMethodStepProps): React.ReactElement {
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  
  const isValidPhone = phoneValue.replace(/\D/g, '').length >= 10;
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneValue(formatted);
  };
  const isValidSecondaryEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(secondaryEmail) && 
    secondaryEmail.toLowerCase() !== primaryEmail.toLowerCase();
  
  const isValid = secondaryType === 'phone' ? isValidPhone : isValidSecondaryEmail;
  
  const showPhoneError = phoneTouched && phoneValue && !isValidPhone;
  const showEmailError = emailTouched && secondaryEmail && !isValidSecondaryEmail;
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div 
        className="flex items-center gap-4 flex-shrink-0"
        style={{ 
          padding: `${SPACING.lg}px ${SPACING.xl}px`, 
          borderBottom: `1px solid ${BORDER_COLORS.default}` 
        }}
      >
        <button onClick={onBack} className="p-2" aria-label="Back">
          <ChevronLeft size={28} color={TEXT_COLORS.muted} />
        </button>
        <h2 
          className="font-bold" 
          style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.xl}px` }}
        >
          2-Step Withdrawal Security
        </h2>
      </div>
      
      {/* Content */}
      <div 
        className="flex-1 overflow-y-auto" 
        style={{ padding: SPACING.xl, scrollbarWidth: 'none' }}
      >
        <div className="text-center mb-6">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={STATE_COLORS.success} strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.base}px` }}>
            To prevent unauthorized withdrawal, we require 2-Step Authentication for withdrawal. If you don't have access to your phone or secondary email this moment, you can always confirm it (or change it) later. Know that you will not be able to make a withdrawal until you confirm a secondary login method.
          </p>
        </div>
        
        {/* Method Toggle */}
        <div 
          className="flex mb-5 p-1.5 rounded-xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
        >
          <button
            onClick={() => setSecondaryType('phone')}
            className="flex-1 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            style={{
              background: secondaryType === 'phone' 
                ? 'url(/wr_blue.png) center center / cover no-repeat' 
                : 'transparent',
              color: secondaryType === 'phone' ? '#fff' : TEXT_COLORS.muted,
              fontSize: `${TYPOGRAPHY.fontSize.base}px`,
              textShadow: secondaryType === 'phone' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Phone
          </button>
          <button
            onClick={() => setSecondaryType('email')}
            className="flex-1 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            style={{
              background: secondaryType === 'email' 
                ? 'url(/wr_blue.png) center center / cover no-repeat' 
                : 'transparent',
              color: secondaryType === 'email' ? '#fff' : TEXT_COLORS.muted,
              fontSize: `${TYPOGRAPHY.fontSize.base}px`,
              textShadow: secondaryType === 'email' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email
          </button>
        </div>
        
        {/* Recommended badge for phone */}
        {secondaryType === 'phone' && (
          <div 
            className="mb-4 p-4 rounded-lg flex items-center gap-3"
            style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={STATE_COLORS.success} strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span style={{ color: STATE_COLORS.success, fontSize: `${TYPOGRAPHY.fontSize.base}px` }}>
              Recommended
            </span>
          </div>
        )}
        
        {/* Phone Input */}
        {secondaryType === 'phone' && (
          <div className="mb-4">
            <label 
              className="block font-medium mb-2"
              style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.base}px` }}
            >
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneValue}
              onChange={handlePhoneChange}
              onFocus={() => setPhoneTouched(false)}
              onBlur={() => setPhoneTouched(true)}
              placeholder="+1 (555) 123-4567"
              autoComplete="tel"
              className="w-full px-5 py-4 rounded-xl outline-none transition-colors"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: TEXT_COLORS.primary,
                border: `2px solid ${showPhoneError ? STATE_COLORS.error : BORDER_COLORS.default}`,
                fontSize: `${TYPOGRAPHY.fontSize.lg}px`,
              }}
            />
            {showPhoneError && (
              <span 
                className="block mt-1"
                style={{ color: STATE_COLORS.error, fontSize: `${TYPOGRAPHY.fontSize.xs}px` }}
              >
                Please enter a valid phone number
              </span>
            )}
          </div>
        )}
        
        {/* Secondary Email Input */}
        {secondaryType === 'email' && (
          <div className="mb-4">
            <label 
              className="block font-medium mb-2"
              style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.base}px` }}
            >
              Secondary Email Address
            </label>
            <input
              type="email"
              value={secondaryEmail}
              onChange={(e) => setSecondaryEmail(e.target.value)}
              onFocus={() => setEmailTouched(false)}
              onBlur={() => setEmailTouched(true)}
              placeholder="secondary@example.com"
              autoComplete="email"
              className="w-full px-5 py-4 rounded-xl outline-none transition-colors"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: TEXT_COLORS.primary,
                border: `2px solid ${showEmailError ? STATE_COLORS.error : BORDER_COLORS.default}`,
                fontSize: `${TYPOGRAPHY.fontSize.lg}px`,
              }}
            />
            {showEmailError && (
              <span 
                className="block mt-1"
                style={{ color: STATE_COLORS.error, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
              >
                {secondaryEmail.toLowerCase() === primaryEmail.toLowerCase() 
                  ? 'Must be different from your primary email'
                  : 'Please enter a valid email address'}
              </span>
            )}
            <p 
              className="mt-2"
              style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
            >
              Must be different from your primary email ({primaryEmail})
            </p>
          </div>
        )}
        
      </div>
      
      {/* Footer */}
      <div 
        className="flex-shrink-0"
        style={{ padding: SPACING.xl, borderTop: `1px solid ${BORDER_COLORS.default}` }}
      >
        <button
          onClick={onContinue}
          disabled={!isValid || isLoading}
          className="w-full py-5 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          style={{
            fontSize: `${TYPOGRAPHY.fontSize.xl}px`,
            background: isValid ? 'url(/wr_blue.png) center center / cover no-repeat' : BG_COLORS.tertiary,
            color: isValid ? '#fff' : TEXT_COLORS.disabled,
            opacity: isValid ? 1 : 0.5,
          }}
        >
          {isLoading ? (
            <>
              <div 
                className="animate-spin rounded-full h-6 w-6 border-2"
                style={{ borderColor: '#fff transparent transparent transparent' }}
              />
              Creating account...
            </>
          ) : (
            'Complete Sign Up'
          )}
        </button>
        
        <button
          onClick={onSkip}
          disabled={isLoading}
          className="w-full py-4 mt-3 font-medium transition-all"
          style={{
            fontSize: `${TYPOGRAPHY.fontSize.base}px`,
            color: TEXT_COLORS.muted,
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          I'll do this later
        </button>
      </div>
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
  const [secondaryType, setSecondaryType] = useState<SecondaryMethodType>('phone');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [secondaryEmail, setSecondaryEmail] = useState('');
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
      setSecondaryType('phone');
      setSecondaryPhone('');
      setSecondaryEmail('');
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
    // Send verification code to email
    // In production, this would trigger the backend to send a code
    setStep('emailVerify');
  }, []);
  
  const handleEmailVerified = useCallback(() => {
    setStep('secondaryMethod');
  }, []);
  
  const handleResendEmailCode = useCallback(async () => {
    // In production, this would resend the verification code
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  }, []);
  
  const handleCreateAccount = useCallback(async (skipSecondary: boolean = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signUpWithEmail({
        email,
        password,
        username,
        secondaryMethod: skipSecondary ? undefined : {
          type: secondaryType,
          value: secondaryType === 'phone' ? secondaryPhone : secondaryEmail,
        },
      });
      
      if (result.success) {
        setStep('success');
        onSuccess?.();
      } else {
        setError(result.error?.message || 'Failed to create account');
        // Go back to appropriate step based on error
        if (result.error?.field === 'username') {
          setStep('username');
        } else if (result.error?.field === 'email' || result.error?.field === 'password') {
          setStep('credentials');
        } else if (result.error?.field === 'secondaryMethod') {
          setStep('secondaryMethod');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [email, password, username, secondaryType, secondaryPhone, secondaryEmail, signUpWithEmail, onSuccess]);
  
  const handleSkipSecondaryMethod = useCallback(() => {
    handleCreateAccount(true);
  }, [handleCreateAccount]);
  
  const handleBack = useCallback(() => {
    if (step === 'username') setStep('credentials');
    if (step === 'emailVerify') setStep('username');
    if (step === 'secondaryMethod') setStep('emailVerify');
  }, [step]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="absolute left-0 right-0 bottom-0 flex flex-col"
      style={{ 
        top: 'env(safe-area-inset-top, 0px)', 
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
      
      {step === 'secondaryMethod' && (
        <SecondaryMethodStep
          secondaryType={secondaryType}
          setSecondaryType={setSecondaryType}
          phoneValue={secondaryPhone}
          setPhoneValue={setSecondaryPhone}
          secondaryEmail={secondaryEmail}
          setSecondaryEmail={setSecondaryEmail}
          primaryEmail={email}
          onContinue={() => handleCreateAccount(false)}
          onSkip={handleSkipSecondaryMethod}
          onBack={handleBack}
          isLoading={isLoading}
        />
      )}
      
      {step === 'success' && (
        <SuccessStep
          email={email}
          username={username}
          secondaryType={(secondaryPhone || secondaryEmail) ? secondaryType : null}
          secondaryValue={secondaryType === 'phone' ? (secondaryPhone || null) : (secondaryEmail || null)}
          onClose={onClose}
        />
      )}
    </div>
  );
}

export default SignUpModal;

