/**
 * VX Switch/Toggle Component
 * 
 * iOS-style toggle switches for boolean settings.
 */

import React from 'react';
import { BRAND_COLORS, TEXT_COLORS, BG_COLORS } from '../constants/colors';
import { TRANSITION } from '../constants/animations';

// ============================================================================
// TYPES
// ============================================================================

export interface SwitchProps {
  /** Whether switch is on */
  checked: boolean;
  /** Change handler */
  onChange: (checked: boolean) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Label */
  label?: string;
  /** Description text */
  description?: string;
  /** Color when on */
  activeColor?: string;
  /** Custom className */
  className?: string;
}

// ============================================================================
// SIZE STYLES
// ============================================================================

const SIZE_STYLES = {
  sm: { width: 36, height: 20, thumbSize: 16, thumbOffset: 2 },
  md: { width: 44, height: 24, thumbSize: 20, thumbOffset: 2 },
  lg: { width: 52, height: 28, thumbSize: 24, thumbOffset: 2 },
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function Switch({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
  activeColor = BRAND_COLORS.primary,
  className = '',
}: SwitchProps): React.ReactElement {
  const sizeStyle = SIZE_STYLES[size];

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onChange(!checked);
    }
  };

  const switchElement = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`relative inline-flex items-center rounded-full transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      style={{
        width: sizeStyle.width,
        height: sizeStyle.height,
        backgroundColor: checked ? activeColor : 'rgba(255, 255, 255, 0.2)',
        transition: TRANSITION.fast,
      }}
    >
      <span
        className="absolute rounded-full bg-white shadow-sm"
        style={{
          width: sizeStyle.thumbSize,
          height: sizeStyle.thumbSize,
          left: checked 
            ? sizeStyle.width - sizeStyle.thumbSize - sizeStyle.thumbOffset 
            : sizeStyle.thumbOffset,
          transition: TRANSITION.fast,
        }}
      />
    </button>
  );

  if (!label && !description) {
    return <div className={className}>{switchElement}</div>;
  }

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      {switchElement}
      <div className="flex-1 min-w-0">
        {label && (
          <div
            className="font-medium cursor-pointer"
            style={{ color: TEXT_COLORS.primary, fontSize: '14px' }}
            onClick={handleClick}
          >
            {label}
          </div>
        )}
        {description && (
          <div
            className="mt-0.5"
            style={{ color: TEXT_COLORS.secondary, fontSize: '12px' }}
          >
            {description}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SWITCH GROUP
// ============================================================================

export interface SwitchGroupProps {
  /** Array of switch items */
  items: Array<{
    id: string;
    label: string;
    description?: string;
    checked: boolean;
  }>;
  /** Change handler */
  onChange: (id: string, checked: boolean) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Custom className */
  className?: string;
}

export function SwitchGroup({
  items,
  onChange,
  disabled = false,
  className = '',
}: SwitchGroupProps): React.ReactElement {
  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((item) => (
        <Switch
          key={item.id}
          checked={item.checked}
          onChange={(checked) => onChange(item.id, checked)}
          label={item.label}
          description={item.description}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

