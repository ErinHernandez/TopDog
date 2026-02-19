/**
 * TabErrorBoundary - Error Boundary for Tab Content
 *
 * Catches errors in tab components and displays a fallback UI.
 * Prevents one broken tab from crashing the entire app.
 *
 * Migrated to Zero-Runtime CSS for CSP compliance.
 */

import React, { Component, ErrorInfo } from 'react';

import { createScopedLogger } from '../../../../lib/clientLogger';
import { captureReactError } from '../../../../lib/errorTracking';
import type { TabId } from '../../core/types';

import styles from './TabErrorBoundary.module.css';

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
    <div className={styles.container}>
      {/* Error Icon */}
      <div className={styles.iconWrapper}>
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      {/* Error Message */}
      <h2 className={styles.title}>
        Something went wrong
      </h2>

      <p className={styles.description}>
        We had trouble loading this section. Please try again.
      </p>

      {/* Error Details (collapsed by default in production) */}
      {typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && error && (
        <details className={styles.details}>
          <summary className={styles.detailsSummary}>
            Technical Details
          </summary>
          <pre className={styles.detailsContent}>
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
          className={styles.retryButton}
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
