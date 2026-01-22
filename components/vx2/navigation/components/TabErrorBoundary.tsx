/**
 * TabErrorBoundary - Error Boundary for Tab Content
 * 
 * Catches errors in tab components and displays a fallback UI.
 * Prevents one broken tab from crashing the entire app.
 */

import React, { Component, ErrorInfo } from 'react';
import type { TabId } from '../../core/types';
import { TEXT_COLORS, BG_COLORS, STATE_COLORS } from '../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../core/constants/sizes';
import { createScopedLogger } from '../../../../lib/clientLogger';
import { captureReactError } from '../../../../lib/errorTracking';

const logger = createScopedLogger('[TabErrorBoundary]');

// ============================================================================
// TYPES
// ============================================================================

interface TabErrorBoundaryProps {
  /** Tab ID (for logging and reset) */
  tabId: TabId;
  /** Children to render */
  children: React.ReactNode;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Custom fallback component */
  fallback?: React.ReactNode;
}

interface TabErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================================
// ERROR FALLBACK UI
// ============================================================================

interface ErrorFallbackProps {
  tabId: TabId;
  error: Error | null;
  onRetry?: () => void;
}

function ErrorFallback({ tabId, error, onRetry }: ErrorFallbackProps): React.ReactElement {
  return (
    <div 
      className="flex-1 flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: BG_COLORS.primary }}
    >
      {/* Error Icon */}
      <div 
        className="flex items-center justify-center rounded-full mb-4"
        style={{
          width: '64px',
          height: '64px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
        }}
      >
        <svg 
          width="32" 
          height="32" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={STATE_COLORS.error}
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      
      {/* Error Message */}
      <h2 
        className="font-semibold text-center mb-2"
        style={{ 
          color: TEXT_COLORS.primary,
          fontSize: `${TYPOGRAPHY.fontSize.lg}px`,
        }}
      >
        Something went wrong
      </h2>
      
      <p 
        className="text-center mb-6"
        style={{ 
          color: TEXT_COLORS.secondary,
          fontSize: `${TYPOGRAPHY.fontSize.base}px`,
          maxWidth: '280px',
        }}
      >
        We had trouble loading this section. Please try again.
      </p>
      
      {/* Error Details (collapsed by default in production) */}
      {typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && error && (
        <details 
          className="w-full max-w-sm mb-6 text-left"
          style={{
            backgroundColor: BG_COLORS.secondary,
            borderRadius: `${RADIUS.md}px`,
            padding: `${SPACING.md}px`,
          }}
        >
          <summary 
            className="cursor-pointer"
            style={{ 
              color: TEXT_COLORS.secondary,
              fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
            }}
          >
            Technical Details
          </summary>
          <pre 
            className="mt-2 overflow-x-auto"
            style={{ 
              color: STATE_COLORS.error,
              fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {error.message}
            {'\n\n'}
            Tab: {tabId}
          </pre>
        </details>
      )}
      
      {/* Retry Button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="font-medium transition-colors"
          style={{
            backgroundColor: STATE_COLORS.active,
            color: TEXT_COLORS.primary,
            paddingLeft: `${SPACING.xl}px`,
            paddingRight: `${SPACING.xl}px`,
            paddingTop: `${SPACING.md}px`,
            paddingBottom: `${SPACING.md}px`,
            borderRadius: `${RADIUS.md}px`,
            fontSize: `${TYPOGRAPHY.fontSize.base}px`,
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}

// ============================================================================
// ERROR BOUNDARY CLASS
// ============================================================================

export default class TabErrorBoundary extends Component<
  TabErrorBoundaryProps,
  TabErrorBoundaryState
> {
  constructor(props: TabErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<TabErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error with context using centralized logger
    logger.error(`Error in tab "${this.props.tabId}"`, error, {
      tabId: this.props.tabId,
      componentStack: errorInfo.componentStack?.substring(0, 200),
    });
    
    // Update state with error info
    this.setState({ errorInfo });
    
    // Send to error tracking service (Sentry when configured)
    captureReactError(
      error,
      errorInfo.componentStack ?? undefined,
      `TabErrorBoundary:${this.props.tabId}`
    );
  }
  
  componentDidUpdate(prevProps: TabErrorBoundaryProps): void {
    // Reset error state when tab changes
    if (prevProps.tabId !== this.props.tabId && this.state.hasError) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }
  }
  
  handleRetry = (): void => {
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    // Call parent retry handler
    this.props.onRetry?.();
  };
  
  render(): React.ReactNode {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default fallback
      return (
        <ErrorFallback
          tabId={this.props.tabId}
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }
    
    return this.props.children;
  }
}

