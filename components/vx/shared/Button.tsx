/**
 * VX Button Component
 * 
 * Consistent button styling with variants, sizes, and states.
 * Follows iOS design patterns with proper touch targets.
 */

import React, { forwardRef } from 'react';
import { BRAND_COLORS, TEXT_COLORS, STATE_COLORS } from '../constants/colors';
import { TOUCH_TARGETS, PLATFORM } from '../constants/sizes';
import { TRANSITION } from '../constants/animations';

// ============================================================================
// TYPES
// ============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Full width button */
  fullWidth?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
  /** Children */
  children: React.ReactNode;
}

// ============================================================================
// VARIANT STYLES
// ============================================================================

const VARIANT_STYLES: Record<ButtonVariant, {
  bg: string;
  bgHover: string;
  bgActive: string;
  text: string;
  border?: string;
}> = {
  primary: {
    bg: BRAND_COLORS.primary,
    bgHover: BRAND_COLORS.secondary,
    bgActive: BRAND_COLORS.accent,
    text: '#000000',
  },
  secondary: {
    bg: 'rgba(255, 255, 255, 0.1)',
    bgHover: 'rgba(255, 255, 255, 0.15)',
    bgActive: 'rgba(255, 255, 255, 0.2)',
    text: TEXT_COLORS.primary,
    border: 'rgba(255, 255, 255, 0.2)',
  },
  ghost: {
    bg: 'transparent',
    bgHover: 'rgba(255, 255, 255, 0.1)',
    bgActive: 'rgba(255, 255, 255, 0.15)',
    text: TEXT_COLORS.primary,
  },
  danger: {
    bg: '#EF4444',
    bgHover: '#DC2626',
    bgActive: '#B91C1C',
    text: '#ffffff',
  },
  success: {
    bg: '#10B981',
    bgHover: '#059669',
    bgActive: '#047857',
    text: '#ffffff',
  },
};

// ============================================================================
// SIZE STYLES
// ============================================================================

const SIZE_STYLES: Record<ButtonSize, {
  height: string;
  padding: string;
  fontSize: string;
  iconSize: string;
}> = {
  sm: {
    height: '32px',
    padding: '0 12px',
    fontSize: '13px',
    iconSize: '16px',
  },
  md: {
    height: TOUCH_TARGETS.min,
    padding: '0 16px',
    fontSize: '14px',
    iconSize: '18px',
  },
  lg: {
    height: TOUCH_TARGETS.comfort,
    padding: '0 24px',
    fontSize: '16px',
    iconSize: '20px',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    isLoading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    className = '',
    style,
    ...props
  },
  ref
) {
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];
  const isDisabled = disabled || isLoading;

  return (
    <button
      ref={ref}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        height: sizeStyle.height,
        minHeight: sizeStyle.height,
        padding: sizeStyle.padding,
        fontSize: sizeStyle.fontSize,
        backgroundColor: variantStyle.bg,
        color: variantStyle.text,
        border: variantStyle.border ? `1px solid ${variantStyle.border}` : 'none',
        borderRadius: PLATFORM.ios.borderRadius,
        transition: TRANSITION.fast,
        ...style,
      }}
      disabled={isDisabled}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = variantStyle.bgHover;
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = variantStyle.bg;
      }}
      onMouseDown={(e) => {
        if (!isDisabled) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = variantStyle.bgActive;
        }
      }}
      onMouseUp={(e) => {
        if (!isDisabled) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = variantStyle.bgHover;
        }
      }}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner size={sizeStyle.iconSize} />
      ) : (
        <>
          {leftIcon && <span style={{ width: sizeStyle.iconSize, height: sizeStyle.iconSize }}>{leftIcon}</span>}
          {children}
          {rightIcon && <span style={{ width: sizeStyle.iconSize, height: sizeStyle.iconSize }}>{rightIcon}</span>}
        </>
      )}
    </button>
  );
});

// ============================================================================
// LOADING SPINNER (internal)
// ============================================================================

function LoadingSpinner({ size }: { size: string }): React.ReactElement {
  return (
    <svg
      className="animate-spin"
      style={{ width: size, height: size }}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ============================================================================
// ICON BUTTON VARIANT
// ============================================================================

export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'leftIcon' | 'rightIcon'> {
  /** Icon to display */
  icon: React.ReactNode;
  /** Accessible label */
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, size = 'md', variant = 'ghost', ...props },
  ref
) {
  const sizeStyle = SIZE_STYLES[size];
  
  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      style={{
        width: sizeStyle.height,
        padding: 0,
        ...props.style,
      }}
      {...props}
    >
      {icon}
    </Button>
  );
});

export default Button;

