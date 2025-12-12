import React, { useState, useEffect } from 'react';
import { UserRegistrationService } from '../lib/userRegistration';
import { validateUsername, getUsernameRequirements } from '../lib/usernameValidation';
import { getAllowedCharacters, getLocaleDescription } from '../lib/localeCharacters';

export default function RegistrationModal({ open, onClose, onRegistrationSuccess, user }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    countryCode: 'US',
    displayName: ''
  });
  
  const [validation, setValidation] = useState({
    username: { isValid: false, errors: [] },
    email: { isValid: false, errors: [] }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameAvailability, setUsernameAvailability] = useState(null);
  const [requirements, setRequirements] = useState(getUsernameRequirements('US'));
  
  // Country options for the dropdown
  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'ES', name: 'Spain' },
    { code: 'RU', name: 'Russia' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'Korea' },
    { code: 'MX', name: 'Mexico' },
    { code: 'TR', name: 'Turkey' },
    { code: 'SE', name: 'Sweden' },
    { code: 'NO', name: 'Norway' },
    { code: 'DK', name: 'Denmark' },
    { code: 'FI', name: 'Finland' },
    { code: 'PL', name: 'Poland' },
    { code: 'CZ', name: 'Czech Republic' },
    { code: 'SK', name: 'Slovakia' },
    { code: 'HU', name: 'Hungary' },
    { code: 'RO', name: 'Romania' },
    { code: 'BG', name: 'Bulgaria' },
    { code: 'HR', name: 'Croatia' },
    { code: 'SI', name: 'Slovenia' },
    { code: 'EE', name: 'Estonia' },
    { code: 'LV', name: 'Latvia' },
    { code: 'LT', name: 'Lithuania' }
  ];
  
  // Update requirements when country changes
  useEffect(() => {
    setRequirements(getUsernameRequirements(formData.countryCode));
  }, [formData.countryCode]);
  
  // Validate username on input change
  useEffect(() => {
    if (formData.username) {
      const validation = validateUsername(formData.username, formData.countryCode);
      setValidation(prev => ({ ...prev, username: validation }));
    } else {
      setValidation(prev => ({ ...prev, username: { isValid: false, errors: [] } }));
    }
  }, [formData.username, formData.countryCode]);
  
  // Check username availability when validation passes
  useEffect(() => {
    const checkAvailability = async () => {
      if (validation.username.isValid && formData.username) {
        try {
          const { db } = await import('../lib/firebase');
          const { collection, query, where, getDocs } = await import('firebase/firestore');
          
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('username', '==', formData.username));
          const querySnapshot = await getDocs(q);
          
          setUsernameAvailability({
            isAvailable: querySnapshot.empty,
            message: querySnapshot.empty ? 'Username is available' : 'Username is already taken'
          });
        } catch (error) {
          setUsernameAvailability({
            isAvailable: false,
            message: 'Error checking availability'
          });
        }
      } else {
        setUsernameAvailability(null);
      }
    };
    
    const timeoutId = setTimeout(checkAvailability, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [formData.username, validation.username.isValid]);
  
  const handleInputChange = (field, value) => {
    // Auto-convert username to uppercase
    if (field === 'username') {
      value = value.toUpperCase();
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please sign in first');
      return;
    }
    
    // Final validation
    const usernameValidation = validateUsername(formData.username, formData.countryCode);
    if (!usernameValidation.isValid) {
      setValidation(prev => ({ ...prev, username: usernameValidation }));
      return;
    }
    
    if (usernameAvailability && !usernameAvailability.isAvailable) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await UserRegistrationService.createUserProfile({
        uid: user.uid,
        username: formData.username,
        email: formData.email,
        countryCode: formData.countryCode,
        displayName: formData.displayName || formData.username
      });
      
      if (result.success) {
        onRegistrationSuccess(result.userProfile);
        onClose();
      } else {
        alert(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Create Your Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Country Selection */}
          <div>
            <label className="block text-gray-300 mb-2">Country</label>
            <select
              value={formData.countryCode}
              onChange={(e) => handleInputChange('countryCode', e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600"
            >
              {countries.map(country => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-400 mt-1">{requirements.description}</p>
          </div>
          
          {/* Username */}
          <div>
            <label className="block text-gray-300 mb-2">Username</label>
            <input
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
            />
            
            {/* Username validation feedback */}
            {validation.username.errors.length > 0 && (
              <div className="text-red-400 text-sm mt-1">
                {validation.username.errors.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </div>
            )}
            
            {/* Username availability feedback */}
            {usernameAvailability && validation.username.isValid && (
              <div className={`text-sm mt-1 ${
                usernameAvailability.isAvailable ? 'text-green-400' : 'text-red-400'
              }`}>
                {usernameAvailability.message}
              </div>
            )}
            
            {/* Username requirements */}
            <div className="text-xs text-gray-400 mt-2">
              <div>Requirements:</div>
              {requirements.rules.map((rule, index) => (
                <div key={index}>• {rule}</div>
              ))}
            </div>
          </div>
          
          {/* Email (Optional) */}
          <div>
            <label className="block text-gray-300 mb-2">Email (Optional)</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600"
              placeholder="your@email.com"
            />
          </div>
          
          {/* Display Name (Optional) */}
          <div>
            <label className="block text-gray-300 mb-2">Display Name (Optional)</label>
            <input
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
            disabled={!validation.username.isValid || (usernameAvailability && !usernameAvailability.isAvailable) || isSubmitting}
            className={`w-full py-3 rounded-lg font-bold transition-colors ${
              validation.username.isValid && usernameAvailability?.isAvailable && !isSubmitting
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