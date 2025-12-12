/**
 * VX Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in child component tree,
 * logs them, and displays a fallback UI.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { BG_COLORS, TEXT_COLORS, BRAND_COLORS } from '../constants/colors';

// ============================================================================
// TYPES
// ============================================================================

export interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;
  /** Custom fallback UI */
  fallback?: ReactNode;
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Component name for error logging */
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div 
          className="flex flex-col items-center justify-center p-6 text-center"
          style={{ backgroundColor: BG_COLORS.primary, minHeight: '200px' }}
          role="alert"
        >
          <div 
            className="text-4xl mb-4"
            aria-hidden="true"
          >
            :(
          </div>
          <h2 
            className="text-lg font-bold mb-2"
            style={{ color: TEXT_COLORS.primary }}
          >
            Something went wrong
          </h2>
          <p 
            className="text-sm mb-4"
            style={{ color: TEXT_COLORS.secondary }}
          >
            {this.props.componentName 
              ? `Error in ${this.props.componentName}`
              : 'An unexpected error occurred'
            }
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 rounded-lg font-medium transition-colors"
            style={{ 
              backgroundColor: BRAND_COLORS.primary,
              color: '#000',
            }}
          >
            Try Again
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre 
              className="mt-4 p-3 rounded text-left text-xs overflow-auto max-w-full"
              style={{ 
                backgroundColor: BG_COLORS.secondary,
                color: '#ef4444',
                maxHeight: '200px',
              }}
            >
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// FUNCTIONAL WRAPPER
// ============================================================================

/**
 * Higher-order component to wrap any component with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
): React.FC<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary componentName={componentName || WrappedComponent.displayName || WrappedComponent.name}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

// ============================================================================
// INLINE ERROR DISPLAY
// ============================================================================

export interface InlineErrorProps {
  /** Error message to display */
  message: string;
  /** Optional retry callback */
  onRetry?: () => void;
  /** Size variant */
  size?: 'sm' | 'md';
}

export function InlineError({ 
  message, 
  onRetry,
  size = 'md',
}: InlineErrorProps): React.ReactElement {
  const isSmall = size === 'sm';
  
  return (
    <div 
      className="flex items-center gap-2 p-2 rounded-lg"
      style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
      role="alert"
    >
      <span 
        className="text-red-500"
        style={{ fontSize: isSmall ? '12px' : '14px' }}
      >
        {message}
      </span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-red-400 hover:text-red-300 underline"
          style={{ fontSize: isSmall ? '11px' : '13px' }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

