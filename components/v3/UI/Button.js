/**
 * Button - V3 Consistent Button Component
 * Unified button styling with multiple variants and sizes
 */

import React from 'react';
import { theme } from '../../../lib/theme';

const Button = ({
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
}) => {
  const getVariantStyles = () => {
    const variants = {
      primary: {
        background: theme.colors.primary[600],
        color: theme.colors.text.primary,
        border: 'none',
        hover: {
          background: theme.colors.primary[700]
        }
      },
      secondary: {
        background: 'transparent',
        color: theme.colors.primary[500],
        border: `1px solid ${theme.colors.primary[500]}`,
        hover: {
          background: theme.colors.primary[500],
          color: theme.colors.text.primary
        }
      },
      ghost: {
        background: 'transparent',
        color: theme.colors.text.secondary,
        border: 'none',
        hover: {
          background: theme.colors.background.tertiary,
          color: theme.colors.text.primary
        }
      },
      danger: {
        background: theme.colors.accent.red,
        color: theme.colors.text.primary,
        border: 'none',
        hover: {
          background: '#DC2626'
        }
      },
      success: {
        background: theme.colors.accent.green,
        color: theme.colors.text.primary,
        border: 'none',
        hover: {
          background: '#059669'
        }
      }
    };
    return variants[variant] || variants.primary;
  };

  const getSizeStyles = () => {
    const sizes = {
      sm: {
        padding: '8px 12px',
        fontSize: '14px',
        borderRadius: theme.borderRadius.md
      },
      md: {
        padding: '12px 16px',
        fontSize: '16px',
        borderRadius: theme.borderRadius.md
      },
      lg: {
        padding: '16px 24px',
        fontSize: '18px',
        borderRadius: theme.borderRadius.lg
      }
    };
    return sizes[size] || sizes.md;
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const buttonStyles = {
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
    position: 'relative'
  };

  const handleClick = (e) => {
    if (disabled || loading) return;
    onClick?.(e);
  };

  return (
    <button
      type={type}
      className={`transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${className}`}
      style={buttonStyles}
      onClick={handleClick}
      disabled={disabled || loading}
      onMouseEnter={(e) => {
        if (!disabled && !loading && variantStyles.hover) {
          Object.assign(e.target.style, variantStyles.hover);
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          e.target.style.background = variantStyles.background;
          e.target.style.color = variantStyles.color;
        }
      }}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="animate-spin rounded-full border-2 border-current border-t-transparent"
            style={{ width: '16px', height: '16px' }}
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
