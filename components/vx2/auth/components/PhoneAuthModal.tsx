/**
 * VX2 PhoneAuthModal - Phone Number Authentication
 * 
 * Multi-step phone authentication flow:
 * 1. Enter phone number
 * 2. Verify OTP code
 * 3. Optional: Set username (for new users)
 * 
 * Features:
 * - International phone number support
 * - Country code selection
 * - OTP auto-fill
 * - Resend cooldown
 * - Accessibility compliant
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BG_COLORS, TEXT_COLORS, STATE_COLORS, BORDER_COLORS } from '../../core/constants/colors';
import { SPACING, TYPOGRAPHY, Z_INDEX } from '../../core/constants/sizes';
import { Close, ChevronLeft } from '../../components/icons';
import { useAuth } from '../hooks/useAuth';
import { PHONE_CONSTRAINTS } from '../constants';
import { getApprovedCountriesSorted } from '../../../../lib/localeCharacters';

// ============================================================================
// TYPES
// ============================================================================

export interface PhoneAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSwitchToEmail?: () => void;
}

type PhoneAuthStep = 'phone' | 'verify' | 'success';

interface CountryOption {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

// ============================================================================
// COUNTRY DATA
// ============================================================================

const COUNTRY_DIAL_CODES: Record<string, string> = {
  US: '+1', PR: '+1', AW: '+297', AT: '+43', AU: '+61',
  BZ: '+501', BM: '+1', BO: '+591', CL: '+56', CO: '+57',
  CR: '+506', HR: '+385', CW: '+599', CY: '+357', DO: '+1',
  SV: '+503', DE: '+49', GD: '+1', GR: '+30', GT: '+502',
  GY: '+592', HT: '+509', HN: '+504', IS: '+354', ID: '+62',
  IE: '+353', JM: '+1', LV: '+371', LT: '+370', LU: '+352',
  MY: '+60', MQ: '+596', MX: '+52', MN: '+976', MM: '+95',
  NZ: '+64', NI: '+505', NO: '+47', PA: '+507', PE: '+51',
  PL: '+48', PT: '+351', RO: '+40', SG: '+65', SR: '+597',
  SE: '+46', TT: '+1', UY: '+598', VE: '+58',
};

function getCountryOptions(): CountryOption[] {
  const countries = getApprovedCountriesSorted();
  return countries.map(c => ({
    code: c.code,
    name: c.name,
    dialCode: COUNTRY_DIAL_CODES[c.code] || '+1',
    flag: '', // Flag not available in approvedCountries
  }));
}

// ============================================================================
// STEP: PHONE NUMBER
// ============================================================================

interface PhoneStepProps {
  countryCode: string;
  setCountryCode: (code: string) => void;
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
  onContinue: () => void;
  onClose: () => void;
  onSwitchToEmail?: () => void;
  isLoading: boolean;
  error: string | null;
}

function PhoneStep({
  countryCode,
  setCountryCode,
  phoneNumber,
  setPhoneNumber,
  onContinue,
  onClose,
  onSwitchToEmail,
  isLoading,
  error,
}: PhoneStepProps): React.ReactElement {
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const countries = getCountryOptions();
  
  const selectedCountry = countries.find(c => c.code === countryCode) || countries[0];
  
  const searchQueryLower = searchQuery.toLowerCase();
  const filteredCountries = countries.filter(c =>
    (c.name?.toLowerCase() || '').includes(searchQueryLower) ||
    (c.dialCode || '').includes(searchQuery)
  );
  
  // Format phone number as user types
  const handlePhoneChange = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    setPhoneNumber(digits);
  };
  
  const formatPhoneDisplay = (digits: string): string => {
    if (!digits) return '';
    // Simple US-style formatting for display
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };
  
  const isValidPhone = phoneNumber.length >= 10;
  const canContinue = isValidPhone && !isLoading;
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div 
        className="flex items-center justify-between flex-shrink-0"
        style={{ 
          padding: `${SPACING.md}px ${SPACING.lg}px`, 
          borderBottom: `1px solid ${BORDER_COLORS.default}` 
        }}
      >
        <h2 
          className="font-bold" 
          style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.lg}px` }}
        >
          Sign in with Phone
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
      <div 
        className="flex-1 overflow-y-auto" 
        style={{ padding: SPACING.lg, scrollbarWidth: 'none' }}
      >
        <div className="text-center mb-8">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'rgba(96, 165, 250, 0.15)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={STATE_COLORS.active} strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="18" x2="12.01" y2="18" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 
            className="font-bold mb-2"
            style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.xl}px` }}
          >
            Enter your phone number
          </h3>
          <p style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
            We&apos;ll send you a verification code
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
        
        {/* Phone Input */}
        <div className="mb-6">
          <label 
            className="block font-medium mb-2"
            style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
          >
            Phone Number
          </label>
          
          <div className="flex gap-2">
            {/* Country Selector */}
            <button
              onClick={() => setShowCountryPicker(!showCountryPicker)}
              className="flex items-center gap-2 px-3 py-3 rounded-xl"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: `2px solid ${BORDER_COLORS.default}`,
                minWidth: '100px',
              }}
            >
              <span style={{ fontSize: '20px' }}>{selectedCountry.flag}</span>
              <span style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
                {selectedCountry.dialCode}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={TEXT_COLORS.muted} strokeWidth="2">
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            {/* Phone Number Input */}
            <input
              type="tel"
              value={formatPhoneDisplay(phoneNumber)}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="(555) 123-4567"
              autoComplete="tel"
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl outline-none"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: TEXT_COLORS.primary,
                border: `2px solid ${BORDER_COLORS.default}`,
                fontSize: `${TYPOGRAPHY.fontSize.base}px`,
                opacity: isLoading ? 0.5 : 1,
              }}
            />
          </div>
        </div>
        
        {/* Country Picker Dropdown */}
        {showCountryPicker && (
          <div 
            className="mb-4 rounded-xl overflow-hidden"
            style={{ 
              backgroundColor: BG_COLORS.tertiary,
              border: `1px solid ${BORDER_COLORS.default}`,
              maxHeight: '300px',
            }}
          >
            <div style={{ padding: SPACING.sm }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search countries..."
                className="w-full px-3 py-2 rounded-lg outline-none"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: TEXT_COLORS.primary,
                  fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
                }}
              />
            </div>
            <div 
              className="overflow-y-auto"
              style={{ maxHeight: '240px', scrollbarWidth: 'none' }}
            >
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => {
                    setCountryCode(country.code);
                    setShowCountryPicker(false);
                    setSearchQuery('');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5"
                  style={{
                    backgroundColor: countryCode === country.code ? 'rgba(96, 165, 250, 0.1)' : 'transparent',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{country.flag}</span>
                  <span 
                    className="flex-1 text-left"
                    style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
                  >
                    {country.name}
                  </span>
                  <span style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
                    {country.dialCode}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Info */}
        <div 
          className="flex items-start gap-2 p-3 rounded-lg"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXT_COLORS.muted} strokeWidth="2" className="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="16" x2="12" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="8" x2="12.01" y2="8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.xs}px` }}>
            Message and data rates may apply. By continuing, you agree to receive SMS messages for verification.
          </p>
        </div>
      </div>
      
      {/* Footer */}
      <div 
        className="flex-shrink-0"
        style={{ padding: SPACING.lg, borderTop: `1px solid ${BORDER_COLORS.default}` }}
      >
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className="w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          style={{
            fontSize: `${TYPOGRAPHY.fontSize.lg}px`,
            backgroundColor: canContinue ? STATE_COLORS.active : BG_COLORS.tertiary,
            color: canContinue ? '#000' : TEXT_COLORS.disabled,
            opacity: canContinue ? 1 : 0.5,
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
            'Send Verification Code'
          )}
        </button>
        
        {onSwitchToEmail && (
          <p 
            className="text-center mt-4"
            style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
          >
            Prefer email?{' '}
            <button 
              onClick={onSwitchToEmail}
              className="font-semibold"
              style={{ color: STATE_COLORS.active }}
            >
              Sign in with Email
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// STEP: VERIFY OTP
// ============================================================================

interface VerifyStepProps {
  phoneNumber: string;
  dialCode: string;
  onVerify: (code: string) => void;
  onResend: () => void;
  onBack: () => void;
  isVerifying: boolean;
  error: string | null;
}

function VerifyStep({
  phoneNumber,
  dialCode,
  onVerify,
  onResend,
  onBack,
  isVerifying,
  error,
}: VerifyStepProps): React.ReactElement {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState<number>(PHONE_CONSTRAINTS.RESEND_COOLDOWN_SECONDS);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [resendCooldown]);
  
  // Auto-submit when code is complete
  useEffect(() => {
    const fullCode = code.join('');
    if (fullCode.length === 6 && code.every(d => d !== '')) {
      onVerify(fullCode);
    }
  }, [code, onVerify]);
  
  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    if (!digit && value) return;
    
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    
    // Auto-focus next input
    if (digit && index < 5) {
      setTimeout(() => inputRefs.current[index + 1]?.focus(), 0);
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
    setResendCooldown(PHONE_CONSTRAINTS.RESEND_COOLDOWN_SECONDS);
    setCode(['', '', '', '', '', '']);
    onResend();
    inputRefs.current[0]?.focus();
  };
  
  const maskedPhone = `${dialCode} ${phoneNumber.slice(0, 3)}***${phoneNumber.slice(-2)}`;
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div 
        className="flex items-center gap-3 flex-shrink-0"
        style={{ 
          padding: `${SPACING.md}px ${SPACING.lg}px`, 
          borderBottom: `1px solid ${BORDER_COLORS.default}` 
        }}
      >
        <button onClick={onBack} className="p-2" aria-label="Back">
          <ChevronLeft size={24} color={TEXT_COLORS.muted} />
        </button>
        <h2 
          className="font-bold" 
          style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.lg}px` }}
        >
          Verify Phone
        </h2>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: 'rgba(96, 165, 250, 0.15)' }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={STATE_COLORS.active} strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <h3 
          className="font-bold mb-2"
          style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.xl}px` }}
        >
          Enter verification code
        </h3>
        <p 
          className="text-center mb-8"
          style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
        >
          We sent a 6-digit code to<br />
          <span style={{ color: TEXT_COLORS.primary }}>{maskedPhone}</span>
        </p>
        
        {/* OTP Input */}
        <div className="flex gap-2 mb-6" onPaste={handlePaste}>
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              autoComplete="one-time-code"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isVerifying}
              className="w-12 h-14 text-center font-bold rounded-lg outline-none transition-all"
              style={{
                fontSize: `${TYPOGRAPHY.fontSize['2xl']}px`,
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: TEXT_COLORS.primary,
                border: error 
                  ? `2px solid ${STATE_COLORS.error}` 
                  : digit 
                    ? `2px solid ${STATE_COLORS.active}` 
                    : `2px solid ${BORDER_COLORS.default}`,
              }}
            />
          ))}
        </div>
        
        {/* Error Message */}
        {error && (
          <div 
            className="text-center mb-4 px-4 py-2 rounded-lg"
            style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              color: STATE_COLORS.error, 
              fontSize: `${TYPOGRAPHY.fontSize.sm}px` 
            }}
          >
            {error}
          </div>
        )}
        
        {/* Loading */}
        {isVerifying && (
          <div className="flex items-center gap-2 mb-4">
            <div 
              className="animate-spin rounded-full h-4 w-4 border-2"
              style={{ borderColor: `${STATE_COLORS.active} transparent transparent transparent` }}
            />
            <span style={{ color: TEXT_COLORS.secondary }}>Verifying...</span>
          </div>
        )}
        
        {/* Resend */}
        <div className="text-center">
          <p style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
            Didn&apos;t receive it?
          </p>
          {resendCooldown > 0 ? (
            <p style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
              Resend in {resendCooldown}s
            </p>
          ) : (
            <button 
              onClick={handleResend}
              className="font-semibold"
              style={{ color: STATE_COLORS.active, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
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
// STEP: SUCCESS
// ============================================================================

interface SuccessStepProps {
  onClose: () => void;
}

function SuccessStep({ onClose }: SuccessStepProps): React.ReactElement {
  return (
    <div className="flex flex-col h-full items-center justify-center px-6">
      <div 
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}
      >
        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke={STATE_COLORS.success} strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h2 
        className="font-bold mb-2"
        style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize['2xl']}px` }}
      >
        Phone Verified!
      </h2>
      
      <p 
        className="text-center mb-8"
        style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.lg}px` }}
      >
        You&apos;re all set
      </p>
      
      <button 
        onClick={onClose}
        className="w-full py-4 rounded-xl font-bold"
        style={{ 
          backgroundColor: STATE_COLORS.active, 
          color: '#000', 
          fontSize: `${TYPOGRAPHY.fontSize.lg}px` 
        }}
      >
        Continue
      </button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PhoneAuthModal({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToEmail,
}: PhoneAuthModalProps): React.ReactElement | null {
  const [step, setStep] = useState<PhoneAuthStep>('phone');
  const [countryCode, setCountryCode] = useState('US');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signInWithPhone, verifyPhoneCode } = useAuth();
  
  // Get dial code for selected country
  const dialCode = COUNTRY_DIAL_CODES[countryCode] || '+1';
  
  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('phone');
      setCountryCode('US');
      setPhoneNumber('');
      setIsLoading(false);
      setIsVerifying(false);
      setError(null);
    }
  }, [isOpen]);
  
  const handleSendCode = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const fullPhoneNumber = `${dialCode}${phoneNumber}`;
      const result = await signInWithPhone({ 
        phoneNumber: fullPhoneNumber, 
        countryCode 
      });
      
      if (result.success) {
        setStep('verify');
      } else {
        setError(result.error?.message || 'Failed to send verification code');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [dialCode, phoneNumber, countryCode, signInWithPhone]);
  
  const handleVerifyCode = useCallback(async (code: string) => {
    setIsVerifying(true);
    setError(null);
    
    try {
      const result = await verifyPhoneCode({ 
        verificationId: '', // Will use stored verificationId from context
        code 
      });
      
      if (result.success) {
        setStep('success');
        onSuccess?.();
      } else {
        setError(result.error?.message || 'Invalid verification code');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsVerifying(false);
    }
  }, [verifyPhoneCode, onSuccess]);
  
  const handleResendCode = useCallback(async () => {
    setError(null);
    try {
      const fullPhoneNumber = `${dialCode}${phoneNumber}`;
      await signInWithPhone({ phoneNumber: fullPhoneNumber, countryCode });
    } catch (err) {
      setError('Failed to resend code');
    }
  }, [dialCode, phoneNumber, countryCode, signInWithPhone]);
  
  const handleBack = useCallback(() => {
    setError(null);
    setStep('phone');
  }, []);
  
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
      {step === 'phone' && (
        <PhoneStep
          countryCode={countryCode}
          setCountryCode={setCountryCode}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          onContinue={handleSendCode}
          onClose={onClose}
          onSwitchToEmail={onSwitchToEmail}
          isLoading={isLoading}
          error={error}
        />
      )}
      
      {step === 'verify' && (
        <VerifyStep
          phoneNumber={phoneNumber}
          dialCode={dialCode}
          onVerify={handleVerifyCode}
          onResend={handleResendCode}
          onBack={handleBack}
          isVerifying={isVerifying}
          error={error}
        />
      )}
      
      {step === 'success' && (
        <SuccessStep onClose={onClose} />
      )}
      
      {/* Hidden recaptcha container */}
      <div id="recaptcha-container" style={{ display: 'none' }} />
    </div>
  );
}

export default PhoneAuthModal;

