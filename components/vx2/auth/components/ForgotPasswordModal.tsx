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
import { BG_COLORS, TEXT_COLORS, STATE_COLORS, BORDER_COLORS } from '../../core/constants/colors';
import { SPACING, TYPOGRAPHY, Z_INDEX } from '../../core/constants/sizes';
import { Close, ChevronLeft } from '../../components/icons';
import { useAuth } from '../hooks/useAuth';
import { createScopedLogger } from '../../../../lib/clientLogger';

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
        className="flex items-center justify-end flex-shrink-0"
        style={{ 
          padding: `${SPACING.md + 8}px ${SPACING.lg}px ${SPACING.md}px`
        }}
      >
        <button 
          onClick={onClose} 
          className="p-2" 
          aria-label="Close"
        >
          <Close size={24} color={TEXT_COLORS.muted} />
        </button>
      </div>
      
      {/* Content */}
      <div 
        className="flex-1 flex flex-col justify-center px-6"
        onKeyDown={handleKeyDown}
      >
        <div className="text-center mb-8">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 
            className="font-bold mb-2"
            style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.xl}px` }}
          >
            Forgot your password?
          </h3>
          <p style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
            {method === 'email' 
              ? "Enter your primary or secondary email and we'll send you a code to reset your password."
              : "Enter your phone number and we'll send you a code to reset your password."}
          </p>
        </div>
        
        {/* Method Toggle */}
        <div 
          className="flex mb-5 p-1.5 rounded-xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
        >
          <button
            onClick={() => { setMethod('email'); setTouched(false); setInputFocused(false); }}
            className="flex-1 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            style={{
              background: method === 'email' 
                ? 'url(/wr_blue.png) center center / cover no-repeat' 
                : 'transparent',
              color: method === 'email' ? '#fff' : TEXT_COLORS.muted,
              fontSize: `${TYPOGRAPHY.fontSize.base}px`,
              textShadow: method === 'email' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email
          </button>
          <button
            onClick={() => { setMethod('phone'); setTouched(false); setInputFocused(false); }}
            className="flex-1 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            style={{
              background: method === 'phone' 
                ? 'url(/wr_blue.png) center center / cover no-repeat' 
                : 'transparent',
              color: method === 'phone' ? '#fff' : TEXT_COLORS.muted,
              fontSize: `${TYPOGRAPHY.fontSize.base}px`,
              textShadow: method === 'phone' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Phone
          </button>
        </div>
        
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
        {method === 'email' && (
          <div className="mb-6">
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
              className="w-full px-4 py-3 rounded-xl outline-none transition-colors"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: TEXT_COLORS.primary,
                border: `2px solid ${errorToShow ? STATE_COLORS.error : BORDER_COLORS.default}`,
                fontSize: `${TYPOGRAPHY.fontSize.base}px`,
                opacity: isLoading ? 0.5 : 1,
              }}
            />
            {errorToShow && (
              <span 
                className="block mt-1"
                style={{ color: STATE_COLORS.error, fontSize: `${TYPOGRAPHY.fontSize.xs}px` }}
              >
                Please enter a valid email
              </span>
            )}
          </div>
        )}
        
        {/* Phone Input */}
        {method === 'phone' && (
          <div className="mb-6">
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
              className="w-full px-4 py-3 rounded-xl outline-none transition-colors"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: TEXT_COLORS.primary,
                border: `2px solid ${errorToShow ? STATE_COLORS.error : BORDER_COLORS.default}`,
                fontSize: `${TYPOGRAPHY.fontSize.base}px`,
                opacity: isLoading ? 0.5 : 1,
              }}
            />
            {errorToShow && (
              <span 
                className="block mt-1"
                style={{ color: STATE_COLORS.error, fontSize: `${TYPOGRAPHY.fontSize.xs}px` }}
              >
                Please enter a valid phone number
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div 
        className="flex-shrink-0"
        style={{ padding: SPACING.sm }}
      >
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          style={{
            fontSize: `${TYPOGRAPHY.fontSize.lg}px`,
            background: canSubmit ? 'url(/wr_blue.png) center center / cover no-repeat' : BG_COLORS.tertiary,
            color: canSubmit ? '#fff' : TEXT_COLORS.disabled,
            opacity: canSubmit ? 1 : 0.5,
          }}
        >
          {isLoading ? (
            <>
              <div 
                className="animate-spin rounded-full h-5 w-5 border-2"
                style={{ borderColor: '#fff transparent transparent transparent' }}
              />
              Sending...
            </>
          ) : (
            'Send Code'
          )}
        </button>
        
        {onBackToSignIn && (
          <p 
            className="text-center mt-4"
            style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
          >
            Remember your password?{' '}
            <button 
              onClick={onBackToSignIn}
              className="font-semibold"
              style={{
                background: 'url(/wr_blue.png) no-repeat center center',
                backgroundSize: 'cover',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
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
  const [cooldown, setCooldown] = useState(60);
  
  const maskedContact = method === 'phone'
    ? contact.slice(0, -4).replace(/\d/g, '*') + contact.slice(-4)
    : contact.replace(/(.{2})(.*)(@.*)/, '$1****$3');
  
  const canSubmit = code.length === 6 && !isLoading;
  
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c: number) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [cooldown]);
  
  const handleResend = () => {
    onResend();
    setCooldown(60);
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Header — same top padding as Sign In/Sign Up so X height consistent when present */}
      <div 
        className="flex items-center gap-3 flex-shrink-0"
        style={{ 
          padding: `${SPACING.md + 8}px ${SPACING.lg}px ${SPACING.md}px`
        }}
      >
        <button onClick={onBack} className="p-2" aria-label="Back">
          <ChevronLeft size={24} color={TEXT_COLORS.muted} />
        </button>
        <h2 
          className="flex-1 font-bold" 
          style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.lg}px` }}
        >
          Enter Code
        </h2>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="text-center mb-8">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover' }}
          >
            {method === 'phone' ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <h3 
            className="font-bold mb-2"
            style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.xl}px` }}
          >
            Check your {method}
          </h3>
          <p style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
            We sent a 6-digit code to
            <br />
            <span style={{ color: TEXT_COLORS.primary, fontWeight: 500 }}>{maskedContact}</span>
          </p>
        </div>
        
        {/* Error Message */}
        {error && (
          <div 
            className="mb-4 p-3 rounded-lg text-center"
            style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              color: STATE_COLORS.error,
              fontSize: `${TYPOGRAPHY.fontSize.sm}px` 
            }}
          >
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
          className="w-full px-5 py-4 rounded-xl outline-none text-center tracking-widest mb-4"
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            color: TEXT_COLORS.primary,
            border: `2px solid ${BORDER_COLORS.default}`,
            fontSize: `${TYPOGRAPHY.fontSize['2xl']}px`,
            letterSpacing: '0.5em',
            opacity: isLoading ? 0.5 : 1,
          }}
        />
        
        <p 
          className="text-center"
          style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
        >
          Didn't receive it?{' '}
          {method === 'email' && <span>Check your spam folder or </span>}
          {cooldown > 0 ? (
            <span>resend in {cooldown}s</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={isLoading}
              className="font-semibold"
              style={{
                background: 'url(/wr_blue.png) no-repeat center center',
                backgroundSize: 'cover',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
              }}
            >
              resend code
            </button>
          )}
        </p>
      </div>
      
      {/* Footer */}
      <div 
        className="flex-shrink-0"
        style={{ padding: SPACING.sm }}
      >
        <button
          onClick={() => onVerify(code)}
          disabled={!canSubmit}
          className="w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          style={{
            fontSize: `${TYPOGRAPHY.fontSize.lg}px`,
            background: canSubmit ? 'url(/wr_blue.png) center center / cover no-repeat' : BG_COLORS.tertiary,
            color: canSubmit ? '#fff' : TEXT_COLORS.disabled,
            opacity: canSubmit ? 1 : 0.5,
          }}
        >
          {isLoading ? (
            <>
              <div 
                className="animate-spin rounded-full h-5 w-5 border-2"
                style={{ borderColor: '#fff transparent transparent transparent' }}
              />
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
        className="flex items-center gap-3 flex-shrink-0"
        style={{ 
          padding: `${SPACING.md + 8}px ${SPACING.lg}px ${SPACING.md}px`
        }}
      >
        <h2 
          className="flex-1 font-bold" 
          style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.lg}px` }}
        >
          Create New Password
        </h2>
        <button 
          onClick={onClose} 
          className="p-2" 
          aria-label="Close"
        >
          <Close size={24} color={TEXT_COLORS.muted} />
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="text-center mb-8">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={STATE_COLORS.success} strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 
            className="font-bold mb-2"
            style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.xl}px` }}
          >
            Code verified!
          </h3>
          <p style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
            Now create a new password for your account.
          </p>
        </div>
        
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
        
        {/* Password Input */}
        <div className="mb-4">
          <input
            type="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            placeholder="New password"
            autoComplete="new-password"
            autoFocus
            disabled={isLoading}
            className="w-full px-4 py-3 rounded-xl outline-none transition-colors"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: TEXT_COLORS.primary,
              border: `2px solid ${BORDER_COLORS.default}`,
              fontSize: `${TYPOGRAPHY.fontSize.base}px`,
              opacity: isLoading ? 0.5 : 1,
            }}
          />
        </div>
        
        {/* Confirm Password Input */}
        <div className="mb-4">
          <input
            type="password"
            value={confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
            disabled={isLoading}
            className="w-full px-4 py-3 rounded-xl outline-none transition-colors"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: TEXT_COLORS.primary,
              border: `2px solid ${confirmPassword && !passwordsMatch ? STATE_COLORS.error : BORDER_COLORS.default}`,
              fontSize: `${TYPOGRAPHY.fontSize.base}px`,
              opacity: isLoading ? 0.5 : 1,
            }}
          />
          {confirmPassword && !passwordsMatch && (
            <span 
              className="block mt-1"
              style={{ color: STATE_COLORS.error, fontSize: `${TYPOGRAPHY.fontSize.xs}px` }}
            >
              Passwords do not match
            </span>
          )}
        </div>
        
        {/* Password Requirements */}
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
        >
          <div
            className="font-medium mb-2"
            style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
          >
            Password must have:
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
                  fontSize: `${TYPOGRAPHY.fontSize.xs}px`
                }}
              >
                {req.check ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
        style={{ padding: SPACING.sm }}
      >
        <button
          onClick={() => onSubmit(password)}
          disabled={!canSubmit}
          className="w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          style={{
            fontSize: `${TYPOGRAPHY.fontSize.lg}px`,
            background: canSubmit ? 'url(/wr_blue.png) center center / cover no-repeat' : BG_COLORS.tertiary,
            color: canSubmit ? '#fff' : TEXT_COLORS.disabled,
            opacity: canSubmit ? 1 : 0.5,
          }}
        >
          {isLoading ? (
            <>
              <div 
                className="animate-spin rounded-full h-5 w-5 border-2"
                style={{ borderColor: '#fff transparent transparent transparent' }}
              />
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
    <div 
      className="absolute left-0 right-0 bottom-0 flex flex-col"
      style={{ 
        top: 0, 
        backgroundColor: BG_COLORS.secondary, 
        zIndex: Z_INDEX.modal 
      }}
    >
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


