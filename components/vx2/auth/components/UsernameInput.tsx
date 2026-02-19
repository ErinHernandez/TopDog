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

import { cn } from '@/lib/styles';

import { USERNAME_CONSTRAINTS } from '../constants';
import { useUsernameValidation } from '../hooks/useUsernameValidation';
import type { UsernameValidationResult, UsernameAvailabilityResult } from '../types';

import sharedStyles from './auth-shared.module.css';
import styles from './UsernameInput.module.css';

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
    paddingX: 12, // spacing-md
    fontSize: 14, // font-size-sm
    iconSize: 16,
  },
  md: {
    height: 44,
    paddingX: 12, // spacing-md
    fontSize: 16, // font-size-base
    iconSize: 18,
  },
  lg: {
    height: 52,
    paddingX: 16, // spacing-lg
    fontSize: 18, // font-size-lg
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
        className={styles.statusIconLoading}
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
  
  // Status styles based on state - handled in CSS via data attributes
  const statusClass = {
    error: styles.statusError,
    valid: styles.statusValid,
    focus: styles.statusFocus,
    default: styles.statusDefault,
  };
  
  // Determine size class
  const sizeClass = {
    sm: styles.inputContainerSmall,
    md: styles.inputContainerMedium,
    lg: styles.inputContainerLarge,
  }[size];

  // Determine input state classes
  const inputStateClass = cn({
    [styles.inputError!]: hasError,
    [styles.inputSuccess!]: status === 'valid',
  });

  return (
    <div className={cn(styles.container, className)}>
      {/* Input container */}
      <div
        className={cn(styles.inputContainer, sizeClass)}
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
          className={cn(styles.input, inputStateClass)}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy || (hasError ? 'username-error' : undefined)}
          aria-invalid={hasError}
        />

        {/* Status icon */}
        <div
          className={cn('absolute right-0 flex items-center justify-center', styles.statusIconContainer)}
        >
          <StatusIcon status={status} size={config.iconSize} />
        </div>
      </div>
      
      {/* Helper row */}
      <div className={styles.helperRow}>
        {/* Error message */}
        {hasError ? (
          <span
            id="username-error"
            role="alert"
            className={styles.errorMessage}
          >
            {errorMessage}
          </span>
        ) : showRequirements && isFocused && username.length === 0 ? (
          <span
            className={styles.requirementsText}
          >
            {requirements.allowedCharactersDescription}
          </span>
        ) : (
          <span />
        )}
      </div>
      
      {/* Suggestions when username is unavailable */}
      {availability && !availability.isAvailable && availability.suggestions && availability.suggestions.length > 0 && (
        <div className={styles.suggestionsSection}>
          <div
            className={styles.suggestionsLabel}
          >
            Suggested alternatives:
          </div>
          <div className={styles.suggestionsContainer}>
            {availability.suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  if (isControlled) {
                    controlledOnChange?.(suggestion);
                  }
                  internalSetUsername(suggestion);
                }}
                className={styles.suggestionButton}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Warnings (similarity warnings, etc.) */}
      {availability && availability.warnings && availability.warnings.length > 0 && (
        <div className={styles.warningsSection}>
          {availability.warnings.map((warning, index) => (
            <div
              key={index}
              className={styles.warningMessage}
            >
              {warning}
            </div>
          ))}
        </div>
      )}

      {validation && validation.warnings && validation.warnings.length > 0 && (
        <div className={styles.warningsSection}>
          {validation.warnings.map((warning, index) => (
            <div
              key={index}
              className={styles.warningMessage}
            >
              {warning}
            </div>
          ))}
        </div>
      )}
      
      {/* Requirements panel (optional) */}
      {showRequirements && isFocused && username.length > 0 && validation && (
        <div
          className={styles.requirementsPanel}
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
    <ul className={styles.requirementsList}>
      {checks.map((check, index) => (
        <li
          key={index}
          className={cn(styles.requirementItem, {
            [styles.requirementItemPassed!]: check.passed,
            [styles.requirementItemPending!]: !check.passed,
          })}
        >
          <span className={styles.requirementIcon}>
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
          </span>
          {check.label}
        </li>
      ))}
    </ul>
  );
}

export default UsernameInput;

