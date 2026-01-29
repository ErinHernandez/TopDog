/**
 * TabErrorBoundary - Error Boundary for Tab Content
 *
 * Catches errors in tab components and displays a fallback UI.
 * Prevents one broken tab from crashing the entire app.
 *
 * Migrated to CSS Modules for CSP compliance.
 */

import React, { Component, ErrorInfo } from 'react';
import type { TabId } from '../../core/types';
import { TEXT_COLORS, BG_COLORS, STATE_COLORS } from '../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../core/constants/sizes';
import { createScopedLogger } from '../../../../lib/clientLogger';
import { captureReactError } from '../../../../lib/errorTracking';
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
  const containerStyle: React.CSSProperties = {
    '--fallback-bg': BG_COLORS.primary,
  } as React.CSSProperties;

  const titleStyle: React.CSSProperties = {
    '--title-color': TEXT_COLORS.primary,
    '--title-font-size': `${TYPOGRAPHY.fontSize.lg}px`,
  } as React.CSSProperties;

  const descriptionStyle: React.CSSProperties = {
    '--description-color': TEXT_COLORS.secondary,
    '--description-font-size': `${TYPOGRAPHY.fontSize.base}px`,
  } as React.CSSProperties;

  const detailsStyle: React.CSSProperties = {
    '--details-bg': BG_COLORS.secondary,
    '--radius-md': `${RADIUS.md}px`,
    '--spacing-md': `${SPACING.md}px`,
  } as React.CSSProperties;

  const summaryStyle: React.CSSProperties = {
    '--summary-color': TEXT_COLORS.secondary,
    '--summary-font-size': `${TYPOGRAPHY.fontSize.sm}px`,
  } as React.CSSProperties;

  const errorStyle: React.CSSProperties = {
    '--error-color': STATE_COLORS.error,
    '--error-font-size': `${TYPOGRAPHY.fontSize.xs}px`,
    '--spacing-xs': `${SPACING.xs}px`,
  } as React.CSSProperties;

  const buttonStyle: React.CSSProperties = {
    '--button-bg': STATE_COLORS.active,
    '--button-color': TEXT_COLORS.primary,
    '--spacing-md': `${SPACING.md}px`,
    '--spacing-xl': `${SPACING.xl}px`,
    '--radius-md': `${RADIUS.md}px`,
    '--button-font-size': `${TYPOGRAPHY.fontSize.base}px`,
  } as React.CSSProperties;

  return (
    <div className={styles.container} style={containerStyle}>
      {/* Error Icon */}
      <div className={styles.iconWrapper}>
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
      <h2 className={styles.title} style={titleStyle}>
        Something went wrong
      </h2>

      <p className={styles.description} style={descriptionStyle}>
        We had trouble loading this section. Please try again.
      </p>

      {/* Error Details (collapsed by default in production) */}
      {typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && error && (
        <details className={styles.details} style={detailsStyle}>
          <summary className={styles.detailsSummary} style={summaryStyle}>
            Technical Details
          </summary>
          <pre className={styles.detailsContent} style={errorStyle}>
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
          style={buttonStyle}
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
