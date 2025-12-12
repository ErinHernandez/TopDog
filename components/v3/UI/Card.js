/**
 * Card - V3 Consistent Card Component
 * Reusable card container with multiple variants
 */

import React from 'react';
import { theme } from '../../../lib/theme';

const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick = null,
  hover = false,
  border = true,
  shadow = false,
  ...props
}) => {
  const getVariantStyles = () => {
    const variants = {
      default: {
        background: theme.colors.background.secondary,
        border: border ? `1px solid ${theme.colors.border.primary}` : 'none'
      },
      elevated: {
        background: theme.colors.background.tertiary,
        border: border ? `1px solid ${theme.colors.border.secondary}` : 'none',
        boxShadow: shadow ? theme.shadows.lg : theme.shadows.md
      },
      glass: {
        background: 'rgba(31, 41, 55, 0.8)',
        border: border ? `1px solid ${theme.colors.border.primary}` : 'none',
        backdropFilter: 'blur(8px)'
      },
      accent: {
        background: theme.colors.background.secondary,
        border: border ? `2px solid ${theme.colors.primary[600]}` : 'none'
      }
    };
    return variants[variant] || variants.default;
  };

  const getPaddingStyles = () => {
    const paddingMap = {
      none: '0',
      sm: theme.spacing[4],
      md: theme.spacing[6],
      lg: theme.spacing[8],
      xl: theme.spacing[12]
    };
    return paddingMap[padding] || paddingMap.md;
  };

  const variantStyles = getVariantStyles();
  const paddingValue = getPaddingStyles();

  const cardStyles = {
    ...variantStyles,
    padding: paddingValue,
    borderRadius: theme.borderRadius.lg,
    transition: 'all 0.2s ease-in-out',
    cursor: onClick ? 'pointer' : 'default'
  };

  const hoverStyles = hover || onClick ? {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows.xl
  } : {};

  return (
    <div
      className={`${className} ${hover || onClick ? 'hover-lift' : ''}`}
      style={cardStyles}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (hover || onClick) {
          Object.assign(e.target.style, hoverStyles);
        }
      }}
      onMouseLeave={(e) => {
        if (hover || onClick) {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = variantStyles.boxShadow || 'none';
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
