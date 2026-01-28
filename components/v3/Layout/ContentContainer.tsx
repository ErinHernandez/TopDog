/**
 * ContentContainer - V3 Responsive Content Wrapper
 * 
 * Provides consistent spacing and responsive behavior.
 * 
 * @example
 * ```tsx
 * <ContentContainer padding="lg" maxWidth="1200px">
 *   <YourContent />
 * </ContentContainer>
 * ```
 */

import React from 'react';
import { theme } from '../../../lib/theme';

// ============================================================================
// TYPES
// ============================================================================

export interface ContentContainerProps {
  /** Content to display */
  children: React.ReactNode;
  /** Maximum width of the container (default: "1200px") */
  maxWidth?: string;
  /** Padding size (default: "lg") */
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
  /** Background color (default: "transparent") */
  background?: string;
  /** Whether to apply rounded corners (default: false) */
  rounded?: boolean;
  /** Whether to apply shadow (default: false) */
  shadow?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

const ContentContainer: React.FC<ContentContainerProps> = ({ 
  children, 
  maxWidth = '1200px',
  padding = 'lg',
  className = '',
  background = 'transparent',
  rounded = false,
  shadow = false,
}): React.ReactElement => {
  const getPadding = (): string => {
    const paddingMap: Record<'sm' | 'md' | 'lg' | 'xl', string> = {
      sm: theme.spacing[4],
      md: theme.spacing[6], 
      lg: theme.spacing[8],
      xl: theme.spacing[12],
    };
    return paddingMap[padding] || theme.spacing[8];
  };

  const containerStyles: React.CSSProperties = {
    maxWidth,
    padding: getPadding(),
    background,
    borderRadius: rounded ? theme.borderRadius.lg : '0',
    boxShadow: shadow ? theme.shadows.lg : 'none',
  };

  return (
    <div 
      className={`mx-auto w-full ${className}`}
      style={containerStyles}
    >
      {children}
    </div>
  );
};

export default ContentContainer;
