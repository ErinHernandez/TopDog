/**
 * VX2 LoginScreenVX2 - Full-Screen Login Experience
 * 
 * A dedicated full-screen login screen (NOT a modal) that:
 * - Takes up the entire viewport
 * - Has NO close/dismiss button - authentication is mandatory
 * - Supports email/password and phone authentication
 * - Integrates biometric authentication when available
 * - Provides seamless navigation to sign-up
 * - Includes forgot password functionality
 * 
 * This screen completely replaces the app content for unauthenticated users.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BG_COLORS, TEXT_COLORS, STATE_COLORS, BORDER_COLORS } from '../../core/constants/colors';
import { SPACING, Z_INDEX } from '../../core/constants/sizes';
import { useAuth } from '../hooks/useAuth';
import {
  isPlatformAuthenticatorAvailable,
  getLastBiometricUserId,
  isBiometricsEnabled,
  authenticateWithBiometric,
  getBiometricTypeName,
} from '../../../../lib/webauthn';

// ============================================================================
// BLUR PLACEHOLDER - Tiny base64 blue gradient (loads instantly while full image loads)
// ============================================================================

const BLUR_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojNDA4NUYyO3N0b3Atb3BhY2l0eToxIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojNjBBNUZBO3N0b3Atb3BhY2l0eToxIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9InVybCgjZykiLz48L3N2Zz4=';

// ============================================================================
// TYPES
// ============================================================================

export interface LoginScreenVX2Props {
  onSwitchToSignUp: () => void;
  onSuccess?: () => void;
  onForgotPassword?: () => void;
}

type LoginStep = 'credentials' | 'phoneCode';

// ============================================================================
// LOGO COMPONENT
// ============================================================================

function TopDogLogo({ loaded }: { loaded: boolean }): React.ReactElement {
  return (
    <div className="flex items-center justify-center">
      <img 
        src="/logo.png" 
        alt="TopDog" 
        style={{ 
          height: 56,
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
        }}
      />
    </div>
  );
}

// ============================================================================
// BIOMETRIC BUTTON
// ============================================================================

function BiometricButton({ 
  onClick, 
  disabled, 
  label 
}: { 
  onClick: () => void; 
  disabled: boolean; 
  label: string; 
}): React.ReactElement {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold transition-all"
      style={{
        background: 'url(/wr_blue.png) no-repeat center center',
        backgroundSize: 'cover',
        color: '#000',
        border: 'none',
        fontSize: 17,
        opacity: disabled ? 0.5 : 1,
        height: 56,
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
      <div className="relative">
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          autoFocus={autoFocus}
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

export function LoginScreenVX2({
  onSwitchToSignUp,
  onSuccess,
  onForgotPassword,
}: LoginScreenVX2Props): React.ReactElement {
  // Image preload state - for faster perceived loading
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  // Preload wr_blue.png and logo for faster rendering
  useEffect(() => {
    const imagesToLoad = ['/wr_blue.png', '/logo.png'];
    let loadedCount = 0;
    
    imagesToLoad.forEach(src => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        if (loadedCount === imagesToLoad.length) {
          setImagesLoaded(true);
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === imagesToLoad.length) {
          setImagesLoaded(true);
        }
      };
      img.src = src;
      // If already cached, onload fires synchronously
      if (img.complete) {
        loadedCount++;
        if (loadedCount === imagesToLoad.length) {
          setImagesLoaded(true);
        }
      }
    });
    
    // Fallback: show content after 500ms even if images haven't loaded
    const timeout = setTimeout(() => setImagesLoaded(true), 500);
    return () => clearTimeout(timeout);
  }, []);
  
  // Form state
  const [step, setStep] = useState<LoginStep>('credentials');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation state - only show errors after submit attempt
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);
  
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
  
  // No real-time validation - errors only shown after submit attempt
  
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
    checkBiometrics();
  }, []);
  
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
  }, [biometricUserId, onSuccess, triggerShake]);
  
  // Handle sign in
  const handleSignIn = useCallback(async () => {
    setHasSubmitted(true);
    setShowSignUpPrompt(false);
    
    if (!identifier) {
      setError('Please enter your email address');
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
        } else {
          // Check if user not found - show signup prompt
          const errorCode = result.error?.code || '';
          const isUserNotFound = errorCode.includes('user-not-found') || 
                                  errorCode.includes('invalid-credential') ||
                                  errorCode.includes('invalid-email');
          
          if (isUserNotFound) {
            setShowSignUpPrompt(true);
          }
          
          // Always show generic error message for security
          setError('Incorrect password or invalid email');
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
  }, [identifier, password, inputType, signInWithEmail, signInWithPhone, onSuccess, triggerShake]);
  
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
  }, [phoneCode, verificationId, verifyCode, onSuccess, triggerShake]);
  
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
  
  return (
    <div 
      className="fixed inset-0 flex flex-col"
      style={{ 
        backgroundColor: BG_COLORS.primary, 
        zIndex: Z_INDEX.modal 
      }}
    >
      {/* Safe area with wr_blue background - covers dynamic island */}
      {/* Blur placeholder layer - shows instantly */}
      <div 
        aria-hidden="true"
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 'max(env(safe-area-inset-top, 59px), 59px)',
          backgroundImage: `url(${BLUR_PLACEHOLDER})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
          zIndex: 1,
        }} 
      />
      {/* Full image layer - fades in when loaded */}
      <div 
        aria-hidden="true"
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 'max(env(safe-area-inset-top, 59px), 59px)',
          backgroundImage: 'url(/wr_blue.png)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
          zIndex: 2,
          opacity: imagesLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
        }} 
      />
      {/* Spacer for safe area */}
      <div style={{ height: 'max(env(safe-area-inset-top, 59px), 59px)', flexShrink: 0 }} />
      
      {/* Content */}
      <div 
        ref={formRef}
        className={`flex-1 overflow-y-auto flex flex-col ${shakeError ? 'animate-shake' : ''}`}
        style={{ 
          padding: `${SPACING.xl}px`,
          scrollbarWidth: 'none',
          opacity: imagesLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Spacer to push content down */}
        <div className="flex-1 min-h-[40px]" />
        
        {/* Logo */}
        <div className="text-center mb-10">
          <TopDogLogo loaded={imagesLoaded} />
          {step === 'phoneCode' && (
            <p 
              className="mt-6"
              style={{ color: TEXT_COLORS.secondary, fontSize: 17 }}
            >
              Verify your phone
            </p>
          )}
        </div>
        
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
        
        {/* Sign Up Prompt - shown when email not found */}
        {showSignUpPrompt && (
          <div 
            className="mb-4 p-5 rounded-xl text-center"
            style={{ 
              backgroundColor: 'rgba(96, 165, 250, 0.1)', 
              border: '1px solid rgba(96, 165, 250, 0.3)',
            }}
          >
            <p style={{ color: TEXT_COLORS.primary, fontSize: 16, marginBottom: 12 }}>
              Don&apos;t have an account yet?
            </p>
            <button
              onClick={onSwitchToSignUp}
              className="w-full font-bold py-3 rounded-xl transition-all"
              style={{
                background: 'url(/wr_blue.png) no-repeat center center',
                backgroundSize: 'cover',
                color: '#fff',
                fontSize: 16,
              }}
            >
              Create Account
            </button>
          </div>
        )}
        
        {step === 'credentials' && (
          <div className="space-y-4">
            {/* Email/Phone Input */}
            <Input
              inputRef={identifierRef}
              value={identifier}
              onChange={(val) => { setIdentifier(val); setError(null); setShowSignUpPrompt(false); }}
              placeholder="Email"
              autoComplete="email"
              disabled={isLoading}
              autoFocus
            />
            
            {/* Input type indicator - only show for phone */}
            {identifier && inputType === 'phone' && (
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
                onChange={(val) => { setPassword(val); setError(null); setShowSignUpPrompt(false); }}
                placeholder="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                disabled={isLoading}
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
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center transition-all"
                    style={{
                      backgroundImage: rememberMe ? 'url(/wr_blue.png)' : 'none',
                      backgroundColor: rememberMe ? 'transparent' : 'transparent',
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
                
                <button
                  onClick={onForgotPassword}
                  type="button"
                  className="font-medium"
                  style={{ 
                    background: 'url(/wr_blue.png) no-repeat center center',
                    backgroundSize: 'cover',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontSize: 15,
                  } as React.CSSProperties}
                >
                  Forgot password?
                </button>
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
              Use a different number
            </button>
          </div>
        )}
        
        {/* Spacer */}
        <div className="flex-1 min-h-[40px]" />
      </div>
      
      {/* Footer */}
      <div 
        className="flex-shrink-0"
        style={{ 
          paddingTop: 0,
          paddingLeft: 0,
          paddingRight: 0,
          paddingBottom: 'max(env(safe-area-inset-bottom), 24px)',
          borderTop: `1px solid ${BORDER_COLORS.default}`,
          backgroundColor: BG_COLORS.primary,
          opacity: imagesLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
        }}
      >
        {step === 'credentials' ? (
          <button
            onClick={handleSignIn}
            disabled={!canSignIn}
            className="w-full font-bold transition-all flex items-center justify-center gap-2"
            style={{
              fontSize: 17,
              height: 72,
              background: canSignIn ? 'url(/wr_blue.png) no-repeat center center' : BG_COLORS.tertiary,
              backgroundSize: 'cover',
              color: canSignIn ? '#fff' : TEXT_COLORS.disabled,
              opacity: canSignIn ? 1 : 0.6,
              borderRadius: 0,
            }}
          >
            {isLoading ? (
              <>
                <div 
                  className="animate-spin rounded-full h-5 w-5 border-2"
                  style={{ borderColor: '#fff transparent transparent transparent' }}
                />
                {inputType === 'phone' ? 'Sending code...' : 'Logging in...'}
              </>
            ) : (
              inputType === 'phone' ? 'Send Code' : 'Log In'
            )}
          </button>
        ) : (
          <button
            onClick={handleVerifyPhoneCode}
            disabled={phoneCode.length !== 6 || isLoading}
            className="w-full font-bold transition-all flex items-center justify-center gap-2"
            style={{
              fontSize: 17,
              height: 72,
              background: phoneCode.length === 6 && !isLoading ? 'url(/wr_blue.png) no-repeat center center' : BG_COLORS.tertiary,
              backgroundSize: 'cover',
              color: phoneCode.length === 6 && !isLoading ? '#fff' : TEXT_COLORS.disabled,
              opacity: phoneCode.length === 6 && !isLoading ? 1 : 0.6,
              borderRadius: 0,
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
              'Verify'
            )}
          </button>
        )}
        
        {step === 'credentials' && (
          <>
            {/* Horizontal divider - full width */}
            <div 
              style={{ 
                width: '100%',
                height: 1, 
                backgroundColor: BORDER_COLORS.default, 
              }} 
            />
            <p 
              className="text-center"
              style={{ 
                color: TEXT_COLORS.muted, 
                fontSize: 15,
                paddingTop: 16,
                paddingBottom: 8,
              }}
            >
              Don&apos;t have an account?{' '}
              <button 
                onClick={onSwitchToSignUp}
                className="font-semibold"
                style={{ 
                  background: 'url(/wr_blue.png) no-repeat center center',
                  backgroundSize: 'cover',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                } as React.CSSProperties}
              >
                Sign Up
              </button>
            </p>
          </>
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

export default LoginScreenVX2;

