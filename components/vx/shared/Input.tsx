/**
 * VX Input Components
 * 
 * Styled form inputs with validation states.
 * Includes text input, search, select, and textarea.
 */

import React, { forwardRef, useState, useCallback } from 'react';
import { BG_COLORS, TEXT_COLORS, BORDER_COLORS, BRAND_COLORS } from '../constants/colors';
import { TOUCH_TARGETS, PLATFORM, FONT_SIZE } from '../constants/sizes';
import { TRANSITION } from '../constants/animations';

// ============================================================================
// TYPES
// ============================================================================

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input label */
  label?: string;
  /** Helper text below input */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Input size */
  size?: 'sm' | 'md' | 'lg';
  /** Left addon (icon or text) */
  leftAddon?: React.ReactNode;
  /** Right addon (icon or text) */
  rightAddon?: React.ReactNode;
  /** Full width */
  fullWidth?: boolean;
}

export interface SearchInputProps extends Omit<InputProps, 'type'> {
  /** Callback when search is submitted */
  onSearch?: (value: string) => void;
  /** Show clear button */
  showClear?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Select label */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Select size */
  size?: 'sm' | 'md' | 'lg';
  /** Options */
  options: Array<{ value: string; label: string }>;
  /** Placeholder option */
  placeholder?: string;
  /** Full width */
  fullWidth?: boolean;
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Textarea label */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Full width */
  fullWidth?: boolean;
}

// ============================================================================
// SIZE STYLES
// ============================================================================

const SIZE_STYLES = {
  sm: {
    height: '32px',
    padding: '0 10px',
    fontSize: '13px',
  },
  md: {
    height: TOUCH_TARGETS.min,
    padding: '0 12px',
    fontSize: '14px',
  },
  lg: {
    height: TOUCH_TARGETS.comfort,
    padding: '0 16px',
    fontSize: '16px',
  },
};

// ============================================================================
// BASE STYLES
// ============================================================================

const getBaseStyles = (hasError: boolean, isFocused: boolean): React.CSSProperties => ({
  backgroundColor: BG_COLORS.secondary,
  color: TEXT_COLORS.primary,
  border: `1px solid ${hasError ? BORDER_COLORS.error : isFocused ? BRAND_COLORS.primary : 'rgba(255, 255, 255, 0.2)'}`,
  borderRadius: PLATFORM.ios.borderRadius,
  outline: 'none',
  transition: TRANSITION.fast,
  width: '100%',
});

// ============================================================================
// INPUT COMPONENT
// ============================================================================

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    helperText,
    error,
    size = 'md',
    leftAddon,
    rightAddon,
    fullWidth = true,
    className = '',
    style,
    ...props
  },
  ref
) {
  const [isFocused, setIsFocused] = useState(false);
  const sizeStyle = SIZE_STYLES[size];
  const hasError = !!error;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label
          className="block mb-1.5 font-medium"
          style={{ fontSize: FONT_SIZE.statLabel, color: TEXT_COLORS.secondary }}
        >
          {label}
        </label>
      )}
      
      <div className="relative flex items-center">
        {leftAddon && (
          <div
            className="absolute left-3 flex items-center justify-center"
            style={{ color: TEXT_COLORS.muted }}
          >
            {leftAddon}
          </div>
        )}
        
        <input
          ref={ref}
          className="w-full"
          style={{
            ...getBaseStyles(hasError, isFocused),
            height: sizeStyle.height,
            padding: sizeStyle.padding,
            paddingLeft: leftAddon ? '40px' : sizeStyle.padding.split(' ')[1],
            paddingRight: rightAddon ? '40px' : sizeStyle.padding.split(' ')[1],
            fontSize: sizeStyle.fontSize,
            ...style,
          }}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        
        {rightAddon && (
          <div
            className="absolute right-3 flex items-center justify-center"
            style={{ color: TEXT_COLORS.muted }}
          >
            {rightAddon}
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <p
          className="mt-1.5"
          style={{
            fontSize: '12px',
            color: error ? BORDER_COLORS.error : TEXT_COLORS.muted,
          }}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
});

// ============================================================================
// SEARCH INPUT
// ============================================================================

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { onSearch, showClear = true, value, onChange, ...props },
  ref
) {
  const [internalValue, setInternalValue] = useState('');
  const controlledValue = value !== undefined ? String(value) : internalValue;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (value === undefined) {
      setInternalValue(e.target.value);
    }
    onChange?.(e);
  }, [value, onChange]);

  const handleClear = useCallback(() => {
    if (value === undefined) {
      setInternalValue('');
    }
    onChange?.({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
  }, [value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(controlledValue);
    }
  }, [controlledValue, onSearch]);

  return (
    <Input
      ref={ref}
      type="search"
      inputMode="search"
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      value={controlledValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      leftAddon={
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      rightAddon={
        showClear && controlledValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="hover:opacity-70 transition-opacity"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : undefined
      }
      {...props}
    />
  );
});

// ============================================================================
// SELECT COMPONENT
// ============================================================================

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    helperText,
    error,
    size = 'md',
    options,
    placeholder,
    fullWidth = true,
    className = '',
    style,
    ...props
  },
  ref
) {
  const [isFocused, setIsFocused] = useState(false);
  const sizeStyle = SIZE_STYLES[size];
  const hasError = !!error;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label
          className="block mb-1.5 font-medium"
          style={{ fontSize: FONT_SIZE.statLabel, color: TEXT_COLORS.secondary }}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        <select
          ref={ref}
          className="w-full appearance-none cursor-pointer"
          style={{
            ...getBaseStyles(hasError, isFocused),
            height: sizeStyle.height,
            padding: sizeStyle.padding,
            paddingRight: '40px',
            fontSize: sizeStyle.fontSize,
            ...style,
          }}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Chevron icon */}
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: TEXT_COLORS.muted }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {(error || helperText) && (
        <p
          className="mt-1.5"
          style={{
            fontSize: '12px',
            color: error ? BORDER_COLORS.error : TEXT_COLORS.muted,
          }}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
});

// ============================================================================
// TEXTAREA COMPONENT
// ============================================================================

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    helperText,
    error,
    fullWidth = true,
    className = '',
    style,
    rows = 4,
    ...props
  },
  ref
) {
  const [isFocused, setIsFocused] = useState(false);
  const hasError = !!error;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label
          className="block mb-1.5 font-medium"
          style={{ fontSize: FONT_SIZE.statLabel, color: TEXT_COLORS.secondary }}
        >
          {label}
        </label>
      )}
      
      <textarea
        ref={ref}
        className="w-full resize-none"
        rows={rows}
        style={{
          ...getBaseStyles(hasError, isFocused),
          padding: '12px',
          fontSize: '14px',
          lineHeight: '1.5',
          ...style,
        }}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
      
      {(error || helperText) && (
        <p
          className="mt-1.5"
          style={{
            fontSize: '12px',
            color: error ? BORDER_COLORS.error : TEXT_COLORS.muted,
          }}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
});

export default Input;

