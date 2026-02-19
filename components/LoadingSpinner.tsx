/**
 * LoadingSpinner - Reusable Loading Spinner Component
 * 
 * Displays a loading spinner with optional message.
 * Supports different sizes (small, medium, large).
 * 
 * @example
 * ```tsx
 * <LoadingSpinner message="Loading players..." size="large" />
 * ```
 */

import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface LoadingSpinnerProps {
  /** Loading message to display below spinner */
  message?: string;
  /** Size of the spinner */
  size?: 'small' | 'medium' | 'large';
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'medium' 
}: LoadingSpinnerProps): React.ReactElement {
  const sizeClasses: Record<'small' | 'medium' | 'large', string> = {
    small: 'h-6 w-6',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div 
        className={`animate-spin rounded-full border-b-2 border-[#3B82F6] ${
          sizeClasses[size] || sizeClasses.medium
        }`}
      />
      {message && (
        <div className="mt-3 text-white text-center">
          {message}
        </div>
      )}
    </div>
  );
}
