/**
 * Button - V3 Consistent Button Component
 * 
 * Unified button styling with multiple variants and sizes.
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click Me
 * </Button>
 * ```
 */

import React from 'react';
import { theme } from '../../../lib/theme';

// ============================================================================
// TYPES
// ============================================================================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button content */
  children: React.ReactNode;
  /** Button variant style (default: "primary") */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  /** Button size (default: "md") */
  size?: 'sm' | 'md' | 'lg';
  /** Whether button is disabled (default: false) */
  disabled?: boolean;
  /** Whether button is in loading state (default: false) */
  loading?: boolean;
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Button type (default: "button") */
  type?: 'button' | 'submit' | 'reset';
  /** Additional CSS classes */
  className?: string;
  /** Whether button should take full width (default: false) */
  fullWidth?: boolean;
  /** Optional icon element */
  icon?: React.ReactNode | null;
}

interface VariantStyle {
  background: string;
  color: string;
  border: string;
  hover: {
    background: string;
    color?: string;
  };
}

interface SizeStyle {
  padding: string;
  fontSize: string;
  borderRadius: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  fullWidth = false,
  icon = null,
  ...props
}): React.ReactElement => {
  const getVariantStyles = (): VariantStyle => {
    const variants: Record<'primary' | 'secondary' | 'ghost' | 'danger' | 'success', VariantStyle> = {
      primary: {
        background: theme.colors.primary[600],
        color: theme.colors.text.primary,
        border: 'none',
        hover: {
          background: theme.colors.primary[700],
        },
      },
      secondary: {
        background: 'transparent',
        color: theme.colors.primary[500],
        border: `1px solid ${theme.colors.primary[500]}`,
        hover: {
          background: theme.colors.primary[500],
          color: theme.colors.text.primary,
        },
      },
      ghost: {
        background: 'transparent',
        color: theme.colors.text.secondary,
        border: 'none',
        hover: {
          background: theme.colors.background.tertiary,
          color: theme.colors.text.primary,
        },
      },
      danger: {
        background: theme.colors.accent.red,
        color: theme.colors.text.primary,
        border: 'none',
        hover: {
          background: '#DC2626',
        },
      },
      success: {
        background: theme.colors.accent.green,
        color: theme.colors.text.primary,
        border: 'none',
        hover: {
          background: '#059669',
        },
      },
    };
    return variants[variant] || variants.primary;
  };

  const getSizeStyles = (): SizeStyle => {
    const sizes: Record<'sm' | 'md' | 'lg', SizeStyle> = {
      sm: {
        padding: '8px 12px',
        fontSize: '14px',
        borderRadius: theme.borderRadius.md,
      },
      md: {
        padding: '12px 16px',
        fontSize: '16px',
        borderRadius: theme.borderRadius.md,
      },
      lg: {
        padding: '16px 24px',
        fontSize: '18px',
        borderRadius: theme.borderRadius.lg,
      },
    };
    return sizes[size] || sizes.md;
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const buttonStyles: React.CSSProperties = {
    ...sizeStyles,
    background: disabled ? theme.colors.text.disabled : variantStyles.background,
    color: disabled ? theme.colors.text.muted : variantStyles.color,
    border: variantStyles.border,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.2s ease-in-out',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: icon ? '8px' : '0',
    fontWeight: theme.typography.fontWeight.medium,
    width: fullWidth ? '100%' : 'auto',
    position: 'relative',
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    if (disabled || loading) return;
    onClick?.(e);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>): void => {
    if (!disabled && !loading && variantStyles.hover) {
      const target = e.currentTarget;
      Object.assign(target.style, variantStyles.hover);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>): void => {
    if (!disabled && !loading) {
      const target = e.currentTarget;
      target.style.background = variantStyles.background;
      target.style.color = variantStyles.color;
    }
  };

  return (
    <button
      type={type}
      className={`transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${className}`}
      style={buttonStyles}
      onClick={handleClick}
      disabled={disabled || loading}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="animate-spin rounded-full border-2 border-current border-t-transparent"
            style={{ width: '16px', height: '16px' }}
            aria-hidden="true"
          />
        </div>
      )}
      
      <div className={loading ? 'opacity-0' : 'opacity-100'}>
        {icon && <span>{icon}</span>}
        {children}
      </div>
    </button>
  );
};

export default Button;
