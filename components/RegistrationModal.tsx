/**
 * RegistrationModal - User Registration Modal Component
 * 
 * Handles user profile creation with username validation and availability checking.
 * 
 * @example
 * ```tsx
 * <RegistrationModal 
 *   open={isOpen} 
 *   onClose={handleClose}
 *   onRegistrationSuccess={handleSuccess}
 *   user={currentUser}
 * />
 * ```
 */

import React, { useState, useEffect } from 'react';
import { createScopedLogger } from '@/lib/clientLogger';
import { UserRegistrationService, type UserProfile } from '../lib/userRegistration';
import { validateUsername, getUsernameRequirements } from '../lib/usernameValidation';
import { getApprovedCountriesSorted } from '../lib/localeCharacters';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { AuthUser } from './AuthModal';

const logger = createScopedLogger('[RegistrationModal]');

// ============================================================================
// TYPES
// ============================================================================

export interface RegistrationModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when registration succeeds */
  onRegistrationSuccess: (userProfile: UserProfile) => void;
  /** Current authenticated user */
  user: AuthUser | null;
}

interface FormData {
  username: string;
  email: string;
  countryCode: string;
  displayName: string;
}

interface ValidationState {
  username: {
    isValid: boolean;
    errors: string[];
  };
  email: {
    isValid: boolean;
    errors: string[];
  };
}

interface UsernameAvailability {
  isAvailable: boolean;
  message: string;
}

interface UsernameRequirements {
  description: string;
  rules: string[];
  maxLength: number;
}

interface Country {
  code: string;
  name: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function RegistrationModal({ 
  open, 
  onClose, 
  onRegistrationSuccess, 
  user,
}: RegistrationModalProps): React.ReactElement | null {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    countryCode: 'US',
    displayName: '',
  });
  
  const [validation, setValidation] = useState<ValidationState>({
    username: { isValid: false, errors: [] },
    email: { isValid: false, errors: [] },
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameAvailability, setUsernameAvailability] = useState<UsernameAvailability | null>(null);
  const [requirements, setRequirements] = useState<UsernameRequirements>(getUsernameRequirements('US'));
  
  // Get approved countries from centralized config (sorted alphabetically)
  const countries: Country[] = getApprovedCountriesSorted();
  
  // Update requirements when country changes
  useEffect(() => {
    setRequirements(getUsernameRequirements(formData.countryCode));
  }, [formData.countryCode]);
  
  // Validate username on input change
  useEffect(() => {
    if (formData.username) {
      const usernameValidation = validateUsername(formData.username, formData.countryCode);
      setValidation((prev) => ({ ...prev, username: usernameValidation }));
    } else {
      setValidation((prev) => ({ ...prev, username: { isValid: false, errors: [] } }));
    }
  }, [formData.username, formData.countryCode]);
  
  // Check username availability when validation passes
  useEffect(() => {
    const checkAvailability = async (): Promise<void> => {
      if (validation.username.isValid && formData.username && db) {
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('username', '==', formData.username));
          const querySnapshot = await getDocs(q);
          
          setUsernameAvailability({
            isAvailable: querySnapshot.empty,
            message: querySnapshot.empty ? 'Username is available' : 'Username is already taken',
          });
        } catch (error) {
          const err = error as Error;
          logger.error('Error checking username availability:', err instanceof Error ? err : new Error(String(err)));
          setUsernameAvailability({
            isAvailable: false,
            message: 'Error checking availability',
          });
        }
      } else {
        setUsernameAvailability(null);
      }
    };
    
    const timeoutId = setTimeout(checkAvailability, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [formData.username, validation.username.isValid]);
  
  const handleInputChange = (field: keyof FormData, value: string): void => {
    // Auto-convert username to uppercase
    if (field === 'username') {
      value = value.toUpperCase();
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!user) {
      alert('Please sign in first');
      return;
    }
    
    // Final validation
    const usernameValidation = validateUsername(formData.username, formData.countryCode);
    if (!usernameValidation.isValid) {
      setValidation((prev) => ({ ...prev, username: usernameValidation }));
      return;
    }
    
    if (usernameAvailability && !usernameAvailability.isAvailable) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const userProfileData = {
        uid: user.uid,
        username: formData.username,
        email: formData.email || undefined,
        countryCode: formData.countryCode,
        displayName: formData.displayName || formData.username,
      };
      
      const result = await UserRegistrationService.createUserProfile(userProfileData);
      
      if (result.success && result.userProfile) {
        onRegistrationSuccess(result.userProfile);
        onClose();
      } else {
        alert(result.error || 'Registration failed');
      }
    } catch (error) {
      const err = error as Error;
      logger.error('Registration error:', err instanceof Error ? err : new Error(String(err)));
      alert('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!open) return null;
  
  const isFormValid = validation.username.isValid && 
    usernameAvailability?.isAvailable && 
    !isSubmitting;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Create Your Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close registration modal"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Country Selection */}
          <div>
            <label htmlFor="country" className="block text-gray-300 mb-2">
              Country
            </label>
            <select
              id="country"
              value={formData.countryCode}
              onChange={(e) => handleInputChange('countryCode', e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600"
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-400 mt-1">{requirements.description}</p>
          </div>
          
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-gray-300 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className={`w-full p-3 rounded-lg bg-gray-700 text-white border ${
                validation.username.isValid && usernameAvailability?.isAvailable
                  ? 'border-green-500'
                  : validation.username.errors.length > 0 || (usernameAvailability && !usernameAvailability.isAvailable)
                  ? 'border-red-500'
                  : 'border-gray-600'
              }`}
              placeholder="Enter username (uppercase letters & numbers only, max 20 chars)"
              maxLength={requirements.maxLength}
              aria-invalid={!validation.username.isValid}
              aria-describedby="username-errors username-availability username-requirements"
            />
            
            {/* Username validation feedback */}
            {validation.username.errors.length > 0 && (
              <div id="username-errors" className="text-red-400 text-sm mt-1" role="alert">
                {validation.username.errors.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </div>
            )}
            
            {/* Username availability feedback */}
            {usernameAvailability && validation.username.isValid && (
              <div 
                id="username-availability"
                className={`text-sm mt-1 ${
                  usernameAvailability.isAvailable ? 'text-green-400' : 'text-red-400'
                }`}
                role="status"
              >
                {usernameAvailability.message}
              </div>
            )}
            
            {/* Username requirements */}
            <div id="username-requirements" className="text-xs text-gray-400 mt-2">
              <div>Requirements:</div>
              {requirements.rules.map((rule, index) => (
                <div key={index}>• {rule}</div>
              ))}
            </div>
          </div>
          
          {/* Email (Optional) */}
          <div>
            <label htmlFor="email" className="block text-gray-300 mb-2">
              Email (Optional)
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600"
              placeholder="your@email.com"
            />
          </div>
          
          {/* Display Name (Optional) */}
          <div>
            <label htmlFor="displayName" className="block text-gray-300 mb-2">
              Display Name (Optional)
            </label>
            <input
              id="displayName"
              type="text"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600"
              placeholder="How you want to be displayed"
            />
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full py-3 rounded-lg font-bold transition-colors ${
              isFormValid
                ? 'bg-[#59c5bf] text-[#111827] hover:bg-[#4db3ad]'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Creating Profile...' : 'Create Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
