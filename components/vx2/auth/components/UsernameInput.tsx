/**
 * VX2 UsernameInput Component
 * 
 * Enterprise-grade username input with:
 * - Real-time validation
 * - Availability checking
 * - Country-specific character support
 * - Accessibility
 * - Visual feedback states
 * 
 * @example
 * ```tsx
 * <UsernameInput
 *   value={username}
 *   onChange={setUsername}
 *   countryCode="US"
 *   onValidation={(result) => console.log(result)}
 * />
 * ```
 */

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { BG_COLORS, TEXT_COLORS, BORDER_COLORS, STATE_COLORS } from '../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../core/constants/sizes';
import { useUsernameValidation } from '../hooks/useUsernameValidation';
import type { UsernameValidationResult, UsernameAvailabilityResult } from '../types';
import { USERNAME_CONSTRAINTS } from '../constants';

// ============================================================================
// TYPES
// ============================================================================

export interface UsernameInputProps {
  /** Current username value (controlled) */
  value?: string;
  /** Change handler (controlled) */
  onChange?: (value: string) => void;
  /** Country code for locale-specific validation */
  countryCode?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Auto focus on mount */
  autoFocus?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
  /** Show requirements helper */
  showRequirements?: boolean;
  /** Called when validation changes */
  onValidation?: (result: UsernameValidationResult) => void;
  /** Called when availability changes */
  onAvailability?: (result: UsernameAvailabilityResult) => void;
  /** Called when username is valid and available */
  onValid?: (username: string) => void;
  /** Error message from parent (overrides internal) */
  error?: string;
  /** Accessibility label */
  'aria-label'?: string;
  /** Accessibility describedby */
  'aria-describedby'?: string;
}

// ============================================================================
// SIZE CONFIG
// ============================================================================

const SIZE_CONFIG = {
  sm: {
    height: 36,
    paddingX: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.sm,
    iconSize: 16,
  },
  md: {
    height: 44,
    paddingX: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    iconSize: 18,
  },
  lg: {
    height: 52,
    paddingX: SPACING.lg,
    fontSize: TYPOGRAPHY.fontSize.lg,
    iconSize: 20,
  },
} as const;

// ============================================================================
// STATUS ICON COMPONENT
// ============================================================================

interface StatusIconProps {
  status: 'idle' | 'loading' | 'valid' | 'invalid';
  size: number;
}

function StatusIcon({ status, size }: StatusIconProps): React.ReactElement | null {
  if (status === 'idle') return null;
  
  if (status === 'loading') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className="animate-spin"
        style={{ color: TEXT_COLORS.muted }}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeDasharray="31.4"
          strokeDashoffset="10"
        />
      </svg>
    );
  }
  
  if (status === 'valid') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
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
    );
  }
  
  // invalid
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ color: STATE_COLORS.error }}
    >
      <path
        d="M18 6L6 18M6 6L18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function UsernameInput({
  value: controlledValue,
  onChange: controlledOnChange,
  countryCode = 'US',
  placeholder = 'Choose a username',
  disabled = false,
  autoFocus = false,
  size = 'md',
  className = '',
  showRequirements = false,
  onValidation,
  onAvailability,
  onValid,
  error: externalError,
  'aria-label': ariaLabel = 'Username',
  'aria-describedby': ariaDescribedBy,
}: UsernameInputProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const config = SIZE_CONFIG[size];
  const [isFocused, setIsFocused] = useState(false);
  
  // Use the validation hook
  const {
    username: internalUsername,
    setUsername: internalSetUsername,
    validation,
    availability,
    requirements,
    isValidating,
    isCheckingAvailability,
    isValid,
    isAvailable,
    canSubmit,
    errorMessage: internalErrorMessage,
  } = useUsernameValidation({
    initialValue: controlledValue || '',
    countryCode,
    onValidationChange: onValidation,
    onAvailabilityChange: onAvailability,
  });
  
  // Determine if controlled
  const isControlled = controlledValue !== undefined;
  const username = isControlled ? controlledValue : internalUsername;
  
  // Handle change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    if (isControlled) {
      controlledOnChange?.(newValue);
    }
    internalSetUsername(newValue);
  }, [isControlled, controlledOnChange, internalSetUsername]);
  
  // Sync controlled value with internal state
  useEffect(() => {
    if (isControlled && controlledValue !== internalUsername) {
      internalSetUsername(controlledValue);
    }
  }, [isControlled, controlledValue, internalUsername, internalSetUsername]);
  
  // Notify parent when valid
  useEffect(() => {
    if (canSubmit && onValid) {
      onValid(username);
    }
  }, [canSubmit, username, onValid]);
  
  // Determine status
  const getStatus = (): 'idle' | 'loading' | 'valid' | 'invalid' => {
    if (!username) return 'idle';
    if (isValidating || isCheckingAvailability) return 'loading';
    if (canSubmit) return 'valid';
    if (validation && !isValid) return 'invalid';
    if (availability && !isAvailable) return 'invalid';
    return 'idle';
  };
  
  const status = getStatus();
  const errorMessage = externalError || internalErrorMessage;
  const hasError = !!errorMessage && status === 'invalid';
  
  // Border color based on state
  const getBorderColor = (): string => {
    if (hasError) return BORDER_COLORS.error;
    if (status === 'valid') return BORDER_COLORS.success;
    if (isFocused) return BORDER_COLORS.focus;
    return BORDER_COLORS.default;
  };
  
  return (
    <div className={`flex flex-col ${className}`}>
      {/* Input container */}
      <div
        className="relative flex items-center"
        style={{ height: `${config.height}px` }}
      >
        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={username}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="username"
          spellCheck={false}
          maxLength={USERNAME_CONSTRAINTS.MAX_LENGTH}
          className="w-full h-full outline-none transition-colors"
          style={{
            backgroundColor: BG_COLORS.secondary,
            color: TEXT_COLORS.primary,
            border: `2px solid ${getBorderColor()}`,
            borderRadius: `${RADIUS.md}px`,
            paddingLeft: `${config.paddingX}px`,
            paddingRight: `${config.height + config.paddingX}px`,
            fontSize: `${config.fontSize}px`,
          }}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy || (hasError ? 'username-error' : undefined)}
          aria-invalid={hasError}
        />
        
        {/* Status icon */}
        <div
          className="absolute right-0 flex items-center justify-center"
          style={{
            width: `${config.height}px`,
            height: `${config.height}px`,
          }}
        >
          <StatusIcon status={status} size={config.iconSize} />
        </div>
      </div>
      
      {/* Helper row */}
      <div
        className="flex items-center justify-between mt-1 px-1"
        style={{ minHeight: '20px' }}
      >
        {/* Error message */}
        {hasError ? (
          <span
            id="username-error"
            role="alert"
            style={{
              color: STATE_COLORS.error,
              fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
            }}
          >
            {errorMessage}
          </span>
        ) : showRequirements && isFocused && username.length === 0 ? (
          <span
            style={{
              color: TEXT_COLORS.muted,
              fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
            }}
          >
            {requirements.allowedCharactersDescription}
          </span>
        ) : (
          <span />
        )}
        
      </div>
      
      {/* Requirements panel (optional) */}
      {showRequirements && isFocused && username.length > 0 && validation && (
        <div
          className="mt-2 p-3 rounded"
          style={{
            backgroundColor: BG_COLORS.tertiary,
            border: `1px solid ${BORDER_COLORS.light}`,
          }}
        >
          <RequirementsList
            validation={validation}
            requirements={requirements}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// REQUIREMENTS LIST
// ============================================================================

interface RequirementsListProps {
  validation: UsernameValidationResult;
  requirements: {
    minLength: number;
    maxLength: number;
    allowedCharactersDescription: string;
  };
}

function RequirementsList({
  validation,
  requirements,
}: RequirementsListProps): React.ReactElement {
  const checks = [
    {
      label: `${requirements.minLength}-${requirements.maxLength} characters`,
      passed: !validation.errors.some(e => e.includes('length') || e.includes('short') || e.includes('long')),
    },
    {
      label: 'Valid characters only',
      passed: !validation.errors.some(e => e.includes('character') || e.includes('invalid')),
    },
  ];
  
  return (
    <ul className="space-y-1">
      {checks.map((check, index) => (
        <li
          key={index}
          className="flex items-center gap-2"
          style={{
            color: check.passed ? STATE_COLORS.success : TEXT_COLORS.muted,
            fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
          }}
        >
          {check.passed ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17L4 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
            </svg>
          )}
          {check.label}
        </li>
      ))}
    </ul>
  );
}

export default UsernameInput;

