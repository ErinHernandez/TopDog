/**
 * Card - V3 Consistent Card Component
 * 
 * Reusable card container with multiple variants.
 * 
 * @example
 * ```tsx
 * <Card variant="elevated" padding="lg" onClick={handleClick}>
 *   <YourContent />
 * </Card>
 * ```
 */

import React from 'react';
import { theme } from '../../../lib/theme';

// ============================================================================
// TYPES
// ============================================================================

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
  /** Card content */
  children: React.ReactNode;
  /** Card variant style (default: "default") */
  variant?: 'default' | 'elevated' | 'glass' | 'accent';
  /** Padding size (default: "md") */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
  /** Click handler (makes card clickable) */
  onClick?: ((event: React.MouseEvent<HTMLDivElement>) => void) | null;
  /** Whether to apply hover effect (default: false) */
  hover?: boolean;
  /** Whether to show border (default: true) */
  border?: boolean;
  /** Whether to apply shadow (default: false) */
  shadow?: boolean;
}

interface VariantStyle {
  background: string;
  border: string;
  boxShadow?: string;
  backdropFilter?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick = null,
  hover = false,
  border = true,
  shadow = false,
  ...props
}): React.ReactElement => {
  const getVariantStyles = (): VariantStyle => {
    const variants: Record<'default' | 'elevated' | 'glass' | 'accent', VariantStyle> = {
      default: {
        background: theme.colors.background.secondary,
        border: border ? `1px solid ${theme.colors.border.primary}` : 'none',
      },
      elevated: {
        background: theme.colors.background.tertiary,
        border: border ? `1px solid ${theme.colors.border.secondary}` : 'none',
        boxShadow: shadow ? theme.shadows.lg : theme.shadows.md,
      },
      glass: {
        background: 'rgba(31, 41, 55, 0.8)',
        border: border ? `1px solid ${theme.colors.border.primary}` : 'none',
        backdropFilter: 'blur(8px)',
      },
      accent: {
        background: theme.colors.background.secondary,
        border: border ? `2px solid ${theme.colors.primary[600]}` : 'none',
      },
    };
    return variants[variant] || variants.default;
  };

  const getPaddingStyles = (): string => {
    const paddingMap: Record<'none' | 'sm' | 'md' | 'lg' | 'xl', string> = {
      none: '0',
      sm: theme.spacing[4],
      md: theme.spacing[6],
      lg: theme.spacing[8],
      xl: theme.spacing[12],
    };
    return paddingMap[padding] || paddingMap.md;
  };

  const variantStyles = getVariantStyles();
  const paddingValue = getPaddingStyles();

  const cardStyles: React.CSSProperties = {
    ...variantStyles,
    padding: paddingValue,
    borderRadius: theme.borderRadius.lg,
    transition: 'all 0.2s ease-in-out',
    cursor: onClick ? 'pointer' : 'default',
  };

  const hoverStyles: React.CSSProperties = hover || onClick ? {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows.xl,
  } : {};

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (hover || onClick) {
      const target = e.currentTarget;
      Object.assign(target.style, hoverStyles);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (hover || onClick) {
      const target = e.currentTarget;
      target.style.transform = 'translateY(0)';
      target.style.boxShadow = variantStyles.boxShadow || 'none';
    }
  };

  return (
    <div
      className={`${className} ${hover || onClick ? 'hover-lift' : ''}`}
      style={cardStyles}
      onClick={onClick || undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
        }
      } : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
