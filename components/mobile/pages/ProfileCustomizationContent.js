/**
 * ProfileCustomizationContent - Mobile Profile Customization Content
 * 
 * Extracted from pages/mobile-profile-customization.js for maintainability.
 * Contains the border color picker and profile customization UI.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../../../lib/userContext';
import { useUserPreferences } from '../../../hooks/useUserPreferences';
import MobilePhoneFrame, { MobilePhoneContent } from '../shared/MobilePhoneFrame';

export default function ProfileCustomizationContent() {
  const { user, loading } = useUser();
  const router = useRouter();

  if (loading) {
    return (
      <MobilePhoneFrame>
        <MobilePhoneContent className="items-center justify-center">
          <div className="text-white text-lg">Loading...</div>
        </MobilePhoneContent>
      </MobilePhoneFrame>
    );
  }

  if (!user) {
    return (
      <MobilePhoneFrame>
        <MobilePhoneContent className="items-center justify-center">
          <div className="text-white text-lg px-4 text-center">
            Please log in to access profile customization.
          </div>
        </MobilePhoneContent>
      </MobilePhoneFrame>
    );
  }

  return (
    <MobilePhoneFrame>
      <MobilePhoneContent>
        {/* Mobile Header */}
        <div 
          className="w-full shadow-lg relative"
          style={{
            background: 'url(/wr_blue.png) no-repeat center center',
            backgroundSize: 'cover',
            paddingTop: '44px',
            height: '60px'
          }}
        >
          {/* Back Arrow */}
          <button
            onClick={() => router.push('/mobile?tab=Profile')}
            className="absolute left-4 z-10"
            style={{
              top: '50%',
              transform: 'translateY(-50%)',
              minHeight: '36px',
              minWidth: '36px'
            }}
            title="Go back to profile"
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center">
              <svg 
                className="w-6 h-6 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </button>

          {/* Header Title - Logo */}
          <div className="absolute inset-0 flex items-center justify-center z-0">
            <button
              onClick={() => router.push('/mobile')}
              className="flex items-center justify-center"
            >
              <img 
                src="/logo.png" 
                alt="TopDog.dog Logo" 
                className="h-16"
                style={{ height: '64px' }}
              />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto mobile-no-scrollbar">
          <MobileBorderColorPicker />
        </div>
      </MobilePhoneContent>
    </MobilePhoneFrame>
  );
}

/**
 * MobileBorderColorPicker - Mobile-optimized Border Color Picker Component
 */
function MobileBorderColorPicker() {
  const { preferences, updateBorderColor, loading } = useUserPreferences();
  const [isUpdating, setIsUpdating] = useState(false);

  // Organized crayon families (8 columns x 3 rows)
  const crayonColumns = [
    { family: 'Red',       light: '#FCA5A5', base: '#EF4444', dark: '#991B1B' },
    { family: 'Orange',    light: '#FED7AA', base: '#F97316', dark: '#9A3412' },
    { family: 'Yellow',    light: '#FEF08A', base: '#EAB308', dark: '#854D0E' },
    { family: 'Green',     light: '#BBF7D0', base: '#22C55E', dark: '#166534' },
    { family: 'Teal',      light: '#99F6E4', base: '#14B8A6', dark: '#115E59' },
    { family: 'Blue',      light: '#93C5FD', base: '#4285F4', dark: '#1E3A8A' },
    { family: 'Purple',    light: '#E9D5FF', base: '#8B5CF6', dark: '#4C1D95' },
    { family: 'Gray',      light: '#E5E7EB', base: '#9CA3AF', dark: '#111827' }
  ];

  const rows = [
    crayonColumns.map(c => ({ name: `${c.family} Light`, value: c.light })),
    crayonColumns.map(c => ({ name: c.family, value: c.base })),
    crayonColumns.map(c => ({ name: `${c.family} Dark`, value: c.dark }))
  ];

  const allCrayons = rows.flat();
  const selectedCrayon = allCrayons.find(c => c.value.toLowerCase() === (preferences.borderColor || '').toLowerCase());

  const handleColorChange = async (color) => {
    setIsUpdating(true);
    try {
      const result = await updateBorderColor(color);
      if (!result.success) {
        console.error('Failed to update border color:', result.error);
      }
    } catch (error) {
      console.error('Error updating border color:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg">
        <div className="text-gray-400">Loading preferences...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      {/* Current Selection Preview */}
      <div className="mb-4">
        <div 
          className="w-full h-10 rounded-lg border-3 flex items-center justify-center text-white font-medium text-sm"
          style={{ 
            borderColor: preferences.borderColor,
            backgroundColor: `${preferences.borderColor}15`
          }}
        >
          Your Custom Border
        </div>
        <div className="mt-1 text-right text-xs text-gray-300">
          {selectedCrayon ? `Name: ${selectedCrayon.name}` : 'Name: Custom'}
        </div>
      </div>

      {/* Crayon Palette */}
      <div className="mb-4 rounded-lg border border-gray-600 bg-gray-900/70 p-3">
        <div className="text-center text-xs text-gray-300 mb-2">Crayons</div>
        <div className="space-y-2">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-8 gap-x-2" style={{ justifyItems: 'center' }}>
              {row.map((option, colIndex) => {
                const isSelected = preferences.borderColor === option.value;
                return (
                  <button
                    key={`${option.value}-${rowIndex}-${colIndex}`}
                    onClick={() => handleColorChange(option.value)}
                    disabled={isUpdating}
                    aria-label={option.name}
                    className={`${isUpdating ? 'opacity-50' : ''} p-0 m-0 bg-transparent focus:outline-none`}
                    style={{ width: '36px', height: '60px' }}
                  >
                    <svg viewBox="0 0 24 54" width="36" height="60" xmlns="http://www.w3.org/2000/svg">
                      <polygon points="12,1 18,9 6,9" fill={option.value} stroke="#2d2d2d" strokeWidth="0.7" />
                      <rect x="6" y="9" width="12" height="1.8" fill="#d1d5db" opacity="0.7" />
                      <rect x="6" y="10.8" width="12" height="30" rx="3.2" fill={option.value} stroke="#2d2d2d" strokeWidth="0.7" />
                      <rect x="7" y="23" width="10" height="5" rx="2" fill="#f3f4f6" opacity="0.75" />
                      <rect x="6" y="40.8" width="12" height="2.4" fill="#d1d5db" opacity="0.7" />
                      <rect x="5" y="44" width="14" height="3" rx="1.5" fill="#111827" opacity="0.35" />
                      {isSelected && (
                        <rect x="3.8" y="0.5" width="16.4" height="49" rx="4.5" fill="none" stroke="#ffffff" strokeWidth="1" />
                      )}
                    </svg>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-3 h-2 rounded bg-gradient-to-b from-gray-500 to-gray-700" />
      </div>

      {/* Custom Hex Input */}
      <div className="pt-3 border-t border-gray-600">
        <div className="text-xs text-gray-400 mb-2">Custom Hex Color:</div>
        <div className="flex space-x-2">
          <input
            type="color"
            value={preferences.borderColor}
            onChange={(e) => handleColorChange(e.target.value)}
            disabled={isUpdating}
            className="w-10 h-8 rounded border border-gray-600 bg-gray-700"
          />
          <input
            type="text"
            value={preferences.borderColor}
            onChange={(e) => {
              if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                handleColorChange(e.target.value);
              }
            }}
            placeholder="#4285F4"
            disabled={isUpdating}
            className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {isUpdating && (
        <div className="mt-3 text-center text-blue-400 text-xs">
          Updating...
        </div>
      )}
    </div>
  );
}

