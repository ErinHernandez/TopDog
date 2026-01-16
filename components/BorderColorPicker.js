import React, { useState, useEffect } from 'react';
import { useUserPreferences } from '../hooks/useUserPreferences';

/**
 * Border Color Picker Component
 * Allows users to customize their border color in draft rooms
 */
export default function BorderColorPicker() {
  const { preferences, updateBorderColor, loading } = useUserPreferences();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Track mount state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Predefined color options
  const colorOptions = [
    { name: 'Navbar Blue', value: '#4285F4', description: 'Default navbar blue' },
    { name: 'Red', value: '#ef4444', description: 'Classic red' },
    { name: 'Green', value: '#10B981', description: 'Success green' },
    { name: 'Purple', value: '#8B5CF6', description: 'Royal purple' },
    { name: 'Orange', value: '#F59E0B', description: 'Vibrant orange' },
    { name: 'Pink', value: '#F472B6', description: 'Hot pink' },
    { name: 'Teal', value: '#14B8A6', description: 'Ocean teal' },
    { name: 'Yellow', value: '#EAB308', description: 'Golden yellow' }
  ];

  const handleColorChange = async (color) => {
    setIsUpdating(true);
    try {
      const result = await updateBorderColor(color);
      if (result.success) {
        console.log('Border color updated successfully');
      } else {
        console.error('Failed to update border color:', result.error);
      }
    } catch (error) {
      console.error('Error updating border color:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Show loading state until mounted and preferences are loaded to prevent hydration mismatch
  if (!isMounted || loading) {
    return (
      <div className="p-4">
        <div className="text-gray-400">Loading preferences...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold text-white mb-4">Border Customization</h3>
      <p className="text-gray-300 text-sm mb-6">
        Choose your border color for draft rooms. This will be used for your username header, future pick cells, picks bar cards, and navbar when you&apos;re on the clock (≤10s). Completed player picks will keep their position colors.
      </p>

      {/* Current Selection Preview */}
      <div className="mb-6">
        <div className="text-sm text-gray-400 mb-2">Current Selection:</div>
        <div 
          className="w-full h-12 rounded-lg border-4 flex items-center justify-center text-white font-medium"
          style={{ 
            borderColor: preferences.borderColor,
            backgroundColor: `${preferences.borderColor}20`
          }}
        >
          Your Custom Border
        </div>
      </div>

      {/* Color Options Grid */}
      <div className="grid grid-cols-2 gap-3">
        {colorOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleColorChange(option.value)}
            disabled={isUpdating || preferences.borderColor === option.value}
            className={`
              p-3 rounded-lg border-2 transition-all text-left
              ${preferences.borderColor === option.value 
                ? 'border-white bg-gray-700' 
                : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
              }
              ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-center space-x-3">
              <div 
                className="w-6 h-6 rounded-full border-2 border-gray-400"
                style={{ backgroundColor: option.value }}
              />
              <div>
                <div className="text-white text-sm font-medium">{option.name}</div>
                <div className="text-gray-400 text-xs">{option.description}</div>
              </div>
            </div>
            {preferences.borderColor === option.value && (
              <div className="mt-2 text-xs text-green-400">✓ Currently selected</div>
            )}
          </button>
        ))}
      </div>

      {/* Custom Color Input */}
      <div className="mt-6 pt-6 border-t border-gray-600">
        <div className="text-sm text-gray-400 mb-3">Custom Color (Hex):</div>
        <div className="flex space-x-3">
          <input
            type="color"
            value={preferences.borderColor}
            onChange={(e) => handleColorChange(e.target.value)}
            disabled={isUpdating}
            className="w-12 h-10 rounded border-2 border-gray-600 bg-gray-700 cursor-pointer disabled:cursor-not-allowed"
          />
          <input
            type="text"
            value={preferences.borderColor}
            onChange={(e) => {
              // Validate hex color format
              if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                handleColorChange(e.target.value);
              }
            }}
            placeholder="#4285F4"
            disabled={isUpdating}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none disabled:opacity-50"
          />
        </div>
      </div>

      {isUpdating && (
        <div className="mt-4 text-center text-blue-400 text-sm">
          Updating your border color...
        </div>
      )}
    </div>
  );
}
