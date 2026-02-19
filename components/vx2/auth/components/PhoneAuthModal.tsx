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

import { cn } from '@/lib/styles';

import { getApprovedCountriesSorted } from '../../../../lib/localeCharacters';
import { Close, ChevronLeft } from '../../components/icons';
import { TEXT_COLORS } from '../../core/constants/colors';
import { Z_INDEX } from '../../core/constants/sizes';
import { useCountdown } from '../../hooks/ui/useCountdown';
import { PHONE_CONSTRAINTS } from '../constants';
import { useAuth } from '../hooks/useAuth';

import authStyles from './auth-shared.module.css';
import styles from './PhoneAuthModal.module.css';

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
  
  const selectedCountry = countries.find(c => c.code === countryCode) || countries[0]!;

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
    <div className={cn('flex flex-col h-full', styles.phoneStepContainer)}>
      {/* Header */}
      <div
        className={authStyles.header}
      >
        <h2
          className={authStyles.headerTitle}
        >
          Sign in with Phone
        </h2>
        <button
          onClick={onClose}
          className={authStyles.closeButton}
          aria-label="Close"
        >
          <Close size={24} color="currentColor" />
        </button>
      </div>
      
      {/* Content */}
      <div
        className={authStyles.contentArea}
      >
        <div className={styles.introSection}>
          <div
            className={authStyles.iconCircle}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={TEXT_COLORS.primary} strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="18" x2="12.01" y2="18" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3
            className={styles.introTitle}
          >
            Enter your phone number
          </h3>
          <p className={styles.introDescription}>
            We&apos;ll send you a verification code
          </p>
        </div>
        
        {/* Error Message */}
        {error && (
          <div
            className={authStyles.errorBanner}
          >
            <div className={authStyles.errorBannerText}>
              {error}
            </div>
          </div>
        )}
        
        {/* Phone Input */}
        <div className={styles.phoneInputSection}>
          <label
            className={styles.phoneInputLabel}
          >
            Phone Number
          </label>

          <div className={styles.phoneInputGroup}>
            {/* Country Selector */}
            <button
              onClick={() => setShowCountryPicker(!showCountryPicker)}
              className={styles.countrySelector}
            >
              <span className={styles.countrySelectorFlag}>{selectedCountry.flag}</span>
              <span className={styles.countrySelectorCode}>
                {selectedCountry.dialCode}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.countrySelectorChevron}>
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
              className={cn(styles.phoneNumberInput, isLoading && styles.phoneInputLoading)}
            />
          </div>
        </div>
        
        {/* Country Picker Dropdown */}
        {showCountryPicker && (
          <div
            className={styles.countryPickerDropdown}
          >
            <div className={styles.countrySearchBox}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search countries..."
                className={styles.countrySearchInput}
              />
            </div>
            <div
              className={styles.countryList}
            >
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => {
                    setCountryCode(country.code);
                    setShowCountryPicker(false);
                    setSearchQuery('');
                  }}
                  className={cn(styles.countryItem, countryCode === country.code && styles.countryItemSelected)}
                >
                  <span className={styles.countryItemFlag}>{country.flag}</span>
                  <span
                    className={styles.countryItemName}
                  >
                    {country.name}
                  </span>
                  <span className={styles.countryItemCode}>
                    {country.dialCode}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Info */}
        <div
          className={styles.infoBox}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.infoIcon}>
            <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="16" x2="12" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="8" x2="12.01" y2="8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className={styles.infoText}>
            Message and data rates may apply. By continuing, you agree to receive SMS messages for verification.
          </p>
        </div>
      </div>
      
      {/* Footer */}
      <div
        className={cn(authStyles.footer, authStyles.footerWithBorder)}
      >
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className={cn(
            styles.actionButton,
            canContinue ? styles.actionButtonEnabled : styles.actionButtonDisabled,
            isLoading && styles.actionButtonLoading
          )}
        >
          {isLoading ? (
            <>
              <div
                className={styles.spinner}
              />
              Sending code...
            </>
          ) : (
            'Send Verification Code'
          )}
        </button>

        {onSwitchToEmail && (
          <div
            className={styles.switchAuthContainer}
          >
            <p
              className={styles.switchAuthText}
            >
              Prefer email?{' '}
              <button
                onClick={onSwitchToEmail}
                className={styles.switchAuthButton}
              >
                Sign in with Email
              </button>
            </p>
          </div>
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
  const { seconds: resendCooldown, isActive: cooldownActive, start: startCooldown } = useCountdown(
    PHONE_CONSTRAINTS.RESEND_COOLDOWN_SECONDS,
    { autoStart: true }
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
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
      newCode[i] = pastedData[i]!;
    }
    setCode(newCode);
    if (pastedData.length === 6) {
      inputRefs.current[5]?.focus();
    }
  };
  
  const handleResend = () => {
    startCooldown();
    setCode(['', '', '', '', '', '']);
    onResend();
    inputRefs.current[0]?.focus();
  };
  
  const maskedPhone = `${dialCode} ${phoneNumber.slice(0, 3)}***${phoneNumber.slice(-2)}`;
  
  return (
    <div className={cn('flex flex-col h-full', styles.verifyStepContainer)}>
      {/* Header */}
      <div
        className={authStyles.header}
      >
        <button onClick={onBack} className={authStyles.backButton} aria-label="Back">
          <ChevronLeft size={24} color="currentColor" />
        </button>
        <h2
          className={authStyles.headerTitle}
        >
          Verify Phone
        </h2>
      </div>
      
      {/* Content */}
      <div className={cn(authStyles.contentArea, authStyles.contentCentered)}>
        <div
          className={authStyles.iconCircle}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={TEXT_COLORS.primary} strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h3
          className={styles.verifyTitle}
        >
          Enter verification code
        </h3>
        <p
          className={styles.verifyDescription}
        >
          We sent a 6-digit code to<br />
          <span className={styles.verifyMaskedPhone}>{maskedPhone}</span>
        </p>
        
        {/* OTP Input */}
        <div className={styles.otpInputGroup} onPaste={handlePaste}>
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
              className={cn(
                styles.otpInput,
                digit && styles.otpInputFilled,
                error && styles.otpInputError
              )}
            />
          ))}
        </div>
        
        {/* Error Message */}
        {error && (
          <div
            className={authStyles.errorBanner}
          >
            <div className={authStyles.errorBannerText}>
              {error}
            </div>
          </div>
        )}
        
        {/* Loading */}
        {isVerifying && (
          <div className={styles.loadingIndicator}>
            <div
              className={styles.spinner}
            />
            <span className={styles.loadingText}>Verifying...</span>
          </div>
        )}
        
        {/* Resend */}
        <div className={styles.resendSection}>
          <p className={styles.resendLabel}>
            Didn&apos;t receive it?
          </p>
          {cooldownActive ? (
            <p className={styles.resendCooldown}>
              Resend in {resendCooldown}s
            </p>
          ) : (
            <button
              onClick={handleResend}
              className={styles.resendButton}
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
    <div className={cn('flex flex-col h-full', styles.successStepContainer)}>
      <div
        className={authStyles.iconCircleSuccess}
      >
        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" className={styles.successCheckmark}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2
        className={styles.successTitle}
      >
        Phone Verified!
      </h2>

      <p
        className={styles.successDescription}
      >
        You&apos;re all set
      </p>

      <button
        onClick={onClose}
        className={styles.successButton}
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
      className={styles.modalRoot}
      style={{
        '--content-top-inset': '60px',
        '--z-modal': Z_INDEX.modal,
      } as React.CSSProperties}
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
      <div id="recaptcha-container" className={styles.recaptchaContainer} />
    </div>
  );
}

export default PhoneAuthModal;

