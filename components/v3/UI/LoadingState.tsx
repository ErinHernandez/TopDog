/**
 * LoadingState - V3 Branded Loading Component
 * 
 * Consistent loading states across the application.
 * 
 * @example
 * ```tsx
 * <LoadingState type="page" message="Loading data..." />
 * <LoadingState type="inline" size="sm" />
 * ```
 */

import React from 'react';
import { theme } from '../../../lib/theme';

// ============================================================================
// TYPES
// ============================================================================

export interface LoadingStateProps {
  /** Loading type/display style (default: "page") */
  type?: 'page' | 'inline' | 'card' | 'button' | 'overlay';
  /** Loading message (default: "Loading...") */
  message?: string;
  /** Spinner size (default: "md") */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to show logo for page type (default: true) */
  showLogo?: boolean;
  /** Additional CSS classes */
  className?: string;
}

interface SizeStyles {
  width: string;
  height: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'page',
  message = 'Loading...',
  size = 'md',
  showLogo = true,
  className = '',
}): React.ReactElement => {
  const getSizeStyles = (): SizeStyles => {
    const sizes: Record<'sm' | 'md' | 'lg' | 'xl', SizeStyles> = {
      sm: { width: '24px', height: '24px' },
      md: { width: '40px', height: '40px' },
      lg: { width: '64px', height: '64px' },
      xl: { width: '96px', height: '96px' },
    };
    return sizes[size] || sizes.md;
  };

  const sizeStyles = getSizeStyles();

  // Spinner Component
  const Spinner: React.FC = () => (
    <div
      className="animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"
      style={sizeStyles}
      aria-hidden="true"
    />
  );

  // Pulsing Logo Component
  const PulsingLogo: React.FC = () => (
    <div className="flex flex-col items-center space-y-4">
      <img
        src="/logo.png"
        alt="TopDog Logo"
        className="animate-pulse"
        style={{ height: '120px', width: 'auto' }}
      />
      <div className="flex space-x-1" aria-hidden="true">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );

  // Page Loading (Full Screen)
  if (type === 'page') {
    return (
      <div 
        className={`min-h-screen flex items-center justify-center ${className}`}
        style={{ 
          background: 'url(/wr_blue.png) repeat-y',
          backgroundSize: 'auto 100%',
          backgroundPosition: 'center center',
        }}
        role="status"
        aria-live="polite"
        aria-label={message}
      >
        <div className="text-center">
          {showLogo ? <PulsingLogo /> : <Spinner />}
          <p className="text-white text-xl mt-6 font-medium">{message}</p>
        </div>
      </div>
    );
  }

  // Inline Loading
  if (type === 'inline') {
    return (
      <div 
        className={`flex items-center justify-center space-x-3 ${className}`}
        role="status"
        aria-live="polite"
        aria-label={message}
      >
        <Spinner />
        <span className="text-gray-300 font-medium">{message}</span>
      </div>
    );
  }

  // Card Loading
  if (type === 'card') {
    return (
      <div 
        className={`flex flex-col items-center justify-center p-8 ${className}`}
        style={{
          background: theme.colors.background.secondary,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.border.primary}`,
        }}
        role="status"
        aria-live="polite"
        aria-label={message}
      >
        <Spinner />
        <p className="text-gray-300 mt-4 font-medium">{message}</p>
      </div>
    );
  }

  // Button Loading
  if (type === 'button') {
    return (
      <div 
        className={`flex items-center space-x-2 ${className}`}
        role="status"
        aria-live="polite"
        aria-label={message}
      >
        <div
          className="animate-spin rounded-full border-2 border-current border-t-transparent"
          style={{ width: '16px', height: '16px' }}
          aria-hidden="true"
        />
        <span>{message}</span>
      </div>
    );
  }

  // Default: Overlay Loading
  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div 
        className="bg-gray-800 rounded-xl p-8 flex flex-col items-center space-y-4"
        style={{ border: `1px solid ${theme.colors.border.primary}` }}
      >
        <Spinner />
        <p className="text-white font-medium">{message}</p>
      </div>
    </div>
  );
};

export default LoadingState;
