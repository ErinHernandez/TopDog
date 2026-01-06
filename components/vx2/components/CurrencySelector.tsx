/**
 * CurrencySelector Component
 * 
 * Dropdown selector for deposit/withdrawal currency.
 * Shows all available currencies with the geolocated currency marked as recommended.
 */

import React, { useState, useRef, useEffect } from 'react';
import { BG_COLORS, TEXT_COLORS, STATE_COLORS, BORDER_COLORS } from '../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY, Z_INDEX } from '../core/constants/sizes';
import { ChevronDown } from './icons';
import { CurrencyIcon } from './CurrencyIcon';
import { getCurrencyOptions } from '../../../lib/stripe/currencyConfig';

// ============================================================================
// TYPES
// ============================================================================

export interface CurrencySelectorProps {
  /** Currently selected currency code (e.g., 'USD', 'EUR') */
  selectedCurrency: string;
  /** User's geolocated/detected local currency code */
  localCurrency: string;
  /** Callback when user selects a currency */
  onSelect: (currency: string) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Optional label */
  label?: string;
}

interface CurrencyOption {
  value: string;
  label: string;
  symbol: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CurrencySelector({
  selectedCurrency,
  localCurrency,
  onSelect,
  disabled = false,
  label = 'Deposit Currency',
}: CurrencySelectorProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get all currency options
  const currencyOptions = getCurrencyOptions();
  
  // Find the selected option
  const selectedOption = currencyOptions.find(opt => opt.value === selectedCurrency);
  
  // Sort options: local currency first, then alphabetically
  const sortedOptions = [...currencyOptions].sort((a, b) => {
    if (a.value === localCurrency) return -1;
    if (b.value === localCurrency) return 1;
    return a.value.localeCompare(b.value);
  });
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Handle option selection
  const handleSelect = (currency: string) => {
    onSelect(currency);
    setIsOpen(false);
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label 
          className="block font-medium mb-2"
          style={{ 
            fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
            color: TEXT_COLORS.secondary,
          }}
        >
          {label}
        </label>
      )}
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${isOpen ? STATE_COLORS.active : BORDER_COLORS.default}`,
          color: TEXT_COLORS.primary,
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Currency Icon */}
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <CurrencyIcon
              currency={selectedCurrency}
              size={TYPOGRAPHY.fontSize.lg}
              color={TEXT_COLORS.primary}
              showFallback={true}
              aria-label={`${selectedOption?.value || 'USD'} currency`}
              aria-hidden={false}
            />
          </div>
          
          {/* Currency Info */}
          <div className="text-left">
            <div 
              className="font-semibold"
              style={{ fontSize: `${TYPOGRAPHY.fontSize.base}px` }}
            >
              {selectedOption?.value || 'USD'}
            </div>
            <div 
              style={{ 
                fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
                color: TEXT_COLORS.muted,
              }}
            >
              {selectedOption?.label.split('(')[0].trim() || 'US Dollar'}
            </div>
          </div>
        </div>
        
        {/* Chevron */}
        <ChevronDown 
          size={20} 
          color={TEXT_COLORS.muted}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 150ms ease',
          }}
        />
      </button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 mt-2 rounded-xl overflow-hidden"
          style={{
            backgroundColor: BG_COLORS.secondary,
            border: `1px solid ${BORDER_COLORS.default}`,
            zIndex: Z_INDEX.dropdown,
            maxHeight: '300px',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
          }}
        >
          {sortedOptions.map((option) => {
            const isSelected = option.value === selectedCurrency;
            const isLocal = option.value === localCurrency;
            
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className="w-full flex items-center gap-3 px-4 py-3 transition-all"
                style={{
                  backgroundColor: isSelected 
                    ? 'rgba(96, 165, 250, 0.15)' 
                    : 'transparent',
                  borderBottom: `1px solid ${BORDER_COLORS.light}`,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {/* Currency Icon */}
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ 
                    backgroundColor: isSelected 
                      ? 'rgba(96, 165, 250, 0.2)' 
                      : 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <CurrencyIcon
                    currency={option.value}
                    size={TYPOGRAPHY.fontSize.sm * 1.5}
                    color={isSelected ? STATE_COLORS.active : TEXT_COLORS.primary}
                    showFallback={true}
                    aria-label={`${option.value} currency`}
                    aria-hidden={false}
                  />
                </div>
                
                {/* Currency Info */}
                <div className="flex-1 text-left">
                  <div 
                    className="font-semibold flex items-center gap-2"
                    style={{ 
                      fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
                      color: isSelected ? STATE_COLORS.active : TEXT_COLORS.primary,
                    }}
                  >
                    {option.value}
                    {isLocal && (
                      <span 
                        className="px-2 py-0.5 rounded-full text-xs"
                        style={{ 
                          backgroundColor: 'rgba(16, 185, 129, 0.2)',
                          color: STATE_COLORS.success,
                        }}
                      >
                        Recommended
                      </span>
                    )}
                  </div>
                  <div 
                    style={{ 
                      fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
                      color: TEXT_COLORS.muted,
                    }}
                  >
                    {option.label.split('(')[0].trim()}
                  </div>
                </div>
                
                {/* Checkmark for selected */}
                {isSelected && (
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke={STATE_COLORS.active} 
                    strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CurrencySelector;

