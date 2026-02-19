/**
 * Switch Component
 * 
 * Simple toggle switch component for VX2
 */

import React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
}

export default function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  ariaLabel,
}: SwitchProps): React.ReactElement {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if ((event.key === ' ' || event.key === 'Enter') && !disabled) {
      event.preventDefault();
      onChange(!checked);
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-4',
    md: 'w-11 h-6',
    lg: 'w-14 h-7',
  };

  const dotSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const translateClasses = {
    sm: checked ? 'translate-x-4' : 'translate-x-0.5',
    md: checked ? 'translate-x-5' : 'translate-x-0.5',
    lg: checked ? 'translate-x-7' : 'translate-x-0.5',
  };

  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        aria-label={ariaLabel || label || 'Toggle switch'}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`
          ${sizeClasses[size]}
          relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          ${checked ? 'bg-blue-600' : 'bg-gray-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            ${dotSizeClasses[size]}
            ${translateClasses[size]}
            inline-block transform rounded-full bg-white transition-transform duration-200 ease-in-out
          `}
        />
      </button>
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <label
              className={`block text-sm font-medium ${
                disabled ? 'text-gray-400' : 'text-gray-200'
              }`}
            >
              {label}
            </label>
          )}
          {description && (
            <p className={`mt-1 text-xs ${disabled ? 'text-gray-500' : 'text-gray-400'}`}>
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
