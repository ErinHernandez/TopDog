/**
 * VX2 useUsernameValidation Hook
 * 
 * Provides real-time username validation with:
 * - Debounced validation
 * - Country-specific character support
 * - Availability checking
 * - VIP reservation awareness
 * 
 * @example
 * ```tsx
 * function UsernameField() {
 *   const {
 *     username,
 *     setUsername,
 *     validation,
 *     availability,
 *     isValid,
 *     isAvailable,
 *     canSubmit,
 *     errorMessage,
 *   } = useUsernameValidation({ countryCode: 'US' });
 *   
 *   return (
 *     <input
 *       value={username}
 *       onChange={(e) => setUsername(e.target.value)}
 *       className={canSubmit ? 'valid' : 'invalid'}
 *     />
 *   );
 * }
 * ```
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';

import { createScopedLogger } from '@/lib/clientLogger';

import {
  validateUsername,
  getUsernameRequirements,
} from '../../../../lib/usernameValidation';
import { USERNAME_CONSTRAINTS } from '../constants';
import type {
  UseUsernameValidationReturn,
  UsernameValidationResult,
  UsernameAvailabilityResult,
  UsernameRequirements,
} from '../types';

const logger = createScopedLogger('[useUsernameValidation]');

// ============================================================================
// TYPES
// ============================================================================

interface UseUsernameValidationOptions {
  /** Initial username value */
  initialValue?: string;
  /** Country code for locale-specific validation */
  countryCode?: string;
  /** Debounce delay for validation (ms) */
  validationDebounce?: number;
  /** Debounce delay for availability check (ms) */
  availabilityDebounce?: number;
  /** Whether to auto-check availability */
  autoCheckAvailability?: boolean;
  /** Callback when validation changes */
  onValidationChange?: (result: UsernameValidationResult) => void;
  /** Callback when availability changes */
  onAvailabilityChange?: (result: UsernameAvailabilityResult) => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useUsernameValidation(
  options: UseUsernameValidationOptions = {}
): UseUsernameValidationReturn {
  const {
    initialValue = '',
    countryCode: initialCountryCode = 'US',
    validationDebounce = USERNAME_CONSTRAINTS.VALIDATION_DEBOUNCE_MS,
    availabilityDebounce = USERNAME_CONSTRAINTS.AVAILABILITY_DEBOUNCE_MS,
    autoCheckAvailability = true,
    onValidationChange,
    onAvailabilityChange,
  } = options;

  // State
  const [username, setUsernameState] = useState(initialValue);
  const [countryCode, setCountryCodeState] = useState(initialCountryCode);
  const [validation, setValidation] = useState<UsernameValidationResult | null>(null);
  const [availability, setAvailability] = useState<UsernameAvailabilityResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // Refs for debouncing
  const validationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const availabilityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckedUsernameRef = useRef<string>('');

  // Get requirements for current country
  const requirements = useMemo<UsernameRequirements>(() => {
    const reqs = getUsernameRequirements(countryCode);
    return {
      minLength: reqs.minLength,
      maxLength: reqs.maxLength,
      allowedCharacters: reqs.allowedCharacters,
      allowedCharactersDescription: reqs.description || '',
      examples: [],
    };
  }, [countryCode]);

  // Validate username (debounced)
  const performValidation = useCallback(async (value: string): Promise<UsernameValidationResult> => {
    const result = validateUsername(value, countryCode);
    const validationResult: UsernameValidationResult = {
      isValid: result.isValid,
      errors: result.errors || [],
      warnings: [], // validateUsername doesn't return warnings
      suggestions: undefined, // validateUsername doesn't return suggestions
    };
    
    setValidation(validationResult);
    onValidationChange?.(validationResult);
    
    return validationResult;
  }, [countryCode, onValidationChange]);

  // Check availability (debounced) - uses API endpoint for suggestions and warnings
  const performAvailabilityCheck = useCallback(async (value: string): Promise<UsernameAvailabilityResult> => {
    if (!value || value.length < USERNAME_CONSTRAINTS.MIN_LENGTH) {
      const result: UsernameAvailabilityResult = {
        isAvailable: false,
        message: 'Username too short to check',
      };
      setAvailability(result);
      return result;
    }

    setIsCheckingAvailability(true);
    
    try {
      // Call API endpoint to get suggestions and warnings
      const response = await fetch('/api/auth/username/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: value,
          countryCode: countryCode,
        }),
      });
      
      const apiResult = await response.json();
      
      const availabilityResult: UsernameAvailabilityResult = {
        isAvailable: apiResult.isAvailable || false,
        message: apiResult.message || 'Error checking availability',
        isVIPReserved: apiResult.isVIPReserved,
        reservedFor: apiResult.reservedFor,
        similarUsernames: apiResult.similarUsernames,
        suggestions: apiResult.suggestions,
        warnings: apiResult.warnings,
      };
      
      setAvailability(availabilityResult);
      onAvailabilityChange?.(availabilityResult);
      lastCheckedUsernameRef.current = value;
      
      return availabilityResult;
    } catch (error) {
      logger.error('Error checking username availability:', error instanceof Error ? error : new Error(String(error)));
      const errorResult: UsernameAvailabilityResult = {
        isAvailable: false,
        message: 'Error checking availability',
      };
      setAvailability(errorResult);
      return errorResult;
    } finally {
      setIsCheckingAvailability(false);
    }
  }, [countryCode, onAvailabilityChange]);

  // Set username with debounced validation
  const setUsername = useCallback((value: string) => {
    setUsernameState(value);
    
    // Clear previous timers
    if (validationTimerRef.current) {
      clearTimeout(validationTimerRef.current);
    }
    if (availabilityTimerRef.current) {
      clearTimeout(availabilityTimerRef.current);
    }
    
    // Reset states
    setValidation(null);
    setAvailability(null);
    
    if (!value) {
      setIsValidating(false);
      return;
    }
    
    setIsValidating(true);
    
    // Debounced validation
    validationTimerRef.current = setTimeout(async () => {
      const validationResult = await performValidation(value);
      setIsValidating(false);
      
      // Only check availability if validation passes
      if (validationResult.isValid && autoCheckAvailability) {
        availabilityTimerRef.current = setTimeout(() => {
          performAvailabilityCheck(value);
        }, availabilityDebounce - validationDebounce);
      }
    }, validationDebounce);
  }, [
    performValidation,
    performAvailabilityCheck,
    autoCheckAvailability,
    validationDebounce,
    availabilityDebounce,
  ]);

  // Set country code and revalidate
  const setCountryCode = useCallback((code: string) => {
    setCountryCodeState(code);
    // Revalidate with new country code
    if (username) {
      setUsername(username);
    }
  }, [username, setUsername]);

  // Immediate validation (no debounce)
  const validateNow = useCallback(async (): Promise<UsernameValidationResult> => {
    // Clear debounce timers
    if (validationTimerRef.current) {
      clearTimeout(validationTimerRef.current);
    }
    
    setIsValidating(true);
    const result = await performValidation(username);
    setIsValidating(false);
    
    return result;
  }, [username, performValidation]);

  // Immediate availability check (no debounce)
  const checkAvailabilityNow = useCallback(async (): Promise<UsernameAvailabilityResult> => {
    // Clear debounce timer
    if (availabilityTimerRef.current) {
      clearTimeout(availabilityTimerRef.current);
    }
    
    return performAvailabilityCheck(username);
  }, [username, performAvailabilityCheck]);

  // Reset all state
  const reset = useCallback(() => {
    // Clear timers
    if (validationTimerRef.current) {
      clearTimeout(validationTimerRef.current);
    }
    if (availabilityTimerRef.current) {
      clearTimeout(availabilityTimerRef.current);
    }
    
    setUsernameState('');
    setValidation(null);
    setAvailability(null);
    setIsValidating(false);
    setIsCheckingAvailability(false);
    lastCheckedUsernameRef.current = '';
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (validationTimerRef.current) {
        clearTimeout(validationTimerRef.current);
      }
      if (availabilityTimerRef.current) {
        clearTimeout(availabilityTimerRef.current);
      }
    };
  }, []);

  // Computed values
  const isValid = validation?.isValid ?? false;
  const isAvailable = availability?.isAvailable ?? false;
  const canSubmit = isValid && isAvailable && !isValidating && !isCheckingAvailability;
  
  const errorMessage = useMemo(() => {
    if (validation?.errors?.length) {
      return validation.errors[0] || null;
    }
    if (availability && !availability.isAvailable) {
      return availability.message;
    }
    return null;
  }, [validation, availability]);

  return {
    // State
    username,
    countryCode,
    validation,
    availability,
    requirements,
    isValidating,
    isCheckingAvailability,
    
    // Actions
    setUsername,
    setCountryCode,
    validateNow,
    checkAvailabilityNow,
    reset,
    
    // Computed
    isValid,
    isAvailable,
    canSubmit,
    errorMessage,
  };
}

export default useUsernameValidation;

