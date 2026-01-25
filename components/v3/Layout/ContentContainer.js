/**
 * ContentContainer - V3 Responsive Content Wrapper
 * Provides consistent spacing and responsive behavior
 */

import React from 'react';
import { theme } from '../../../lib/theme';

const ContentContainer = ({ 
  children, 
  maxWidth = '1200px',
  padding = 'lg',
  className = '',
  background = 'transparent',
  rounded = false,
  shadow = false
}) => {
  const getPadding = () => {
    const paddingMap = {
      sm: theme.spacing[4],
      md: theme.spacing[6], 
      lg: theme.spacing[8],
      xl: theme.spacing[12]
    };
    return paddingMap[padding] || theme.spacing[8];
  };

  const containerStyles = {
    maxWidth,
    padding: getPadding(),
    background,
    borderRadius: rounded ? theme.borderRadius.lg : '0',
    boxShadow: shadow ? theme.shadows.lg : 'none'
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
