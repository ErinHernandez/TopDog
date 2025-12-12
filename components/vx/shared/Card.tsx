/**
 * VX Card Component
 * 
 * Versatile card container for content grouping.
 * Supports interactive and static variants.
 */

import React, { forwardRef } from 'react';
import { BG_COLORS, BORDER_COLORS } from '../constants/colors';
import { PLATFORM } from '../constants/sizes';
import { TRANSITION } from '../constants/animations';

// ============================================================================
// TYPES
// ============================================================================

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card variant */
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive';
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Make card clickable */
  onClick?: () => void;
  /** Disabled state (for interactive) */
  disabled?: boolean;
  /** Children */
  children: React.ReactNode;
}

export interface CardHeaderProps {
  /** Title */
  title: string;
  /** Subtitle */
  subtitle?: string;
  /** Right side action */
  action?: React.ReactNode;
  /** Custom className */
  className?: string;
}

export interface CardFooterProps {
  /** Children */
  children: React.ReactNode;
  /** Alignment */
  align?: 'left' | 'center' | 'right' | 'between';
  /** Custom className */
  className?: string;
}

// ============================================================================
// PADDING STYLES
// ============================================================================

const PADDING_STYLES = {
  none: '0',
  sm: '12px',
  md: '16px',
  lg: '24px',
};

// ============================================================================
// VARIANT STYLES
// ============================================================================

const getVariantStyles = (variant: CardProps['variant'], isHovered: boolean): React.CSSProperties => {
  const base: React.CSSProperties = {
    borderRadius: PLATFORM.ios.borderRadius,
    transition: TRANSITION.fast,
  };

  switch (variant) {
    case 'elevated':
      return {
        ...base,
        backgroundColor: BG_COLORS.secondary,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      };
    case 'outlined':
      return {
        ...base,
        backgroundColor: 'transparent',
        border: `1px solid ${BORDER_COLORS.default}`,
      };
    case 'interactive':
      return {
        ...base,
        backgroundColor: isHovered ? BG_COLORS.elevated : BG_COLORS.secondary,
        cursor: 'pointer',
      };
    default:
      return {
        ...base,
        backgroundColor: BG_COLORS.secondary,
      };
  }
};

// ============================================================================
// CARD COMPONENT
// ============================================================================

const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    variant = 'default',
    padding = 'md',
    onClick,
    disabled = false,
    children,
    className = '',
    style,
    ...props
  },
  ref
) {
  const [isHovered, setIsHovered] = React.useState(false);
  const isInteractive = variant === 'interactive' || !!onClick;

  return (
    <div
      ref={ref}
      className={`${isInteractive && !disabled ? 'cursor-pointer' : ''} ${className}`}
      style={{
        ...getVariantStyles(variant, isHovered),
        padding: PADDING_STYLES[padding],
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        ...style,
      }}
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={() => isInteractive && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive && !disabled ? 0 : undefined}
      onKeyDown={(e) => {
        if (isInteractive && !disabled && (e.key === 'Enter' || e.key === ' ')) {
          onClick?.();
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
});

// ============================================================================
// CARD HEADER
// ============================================================================

export function CardHeader({
  title,
  subtitle,
  action,
  className = '',
}: CardHeaderProps): React.ReactElement {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`}>
      <div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ============================================================================
// CARD FOOTER
// ============================================================================

export function CardFooter({
  children,
  align = 'right',
  className = '',
}: CardFooterProps): React.ReactElement {
  const alignClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  }[align];

  return (
    <div
      className={`flex items-center gap-3 mt-4 pt-4 border-t border-white/10 ${alignClass} ${className}`}
    >
      {children}
    </div>
  );
}

// ============================================================================
// CARD CONTENT
// ============================================================================

export function CardContent({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return <div className={className}>{children}</div>;
}

export default Card;

