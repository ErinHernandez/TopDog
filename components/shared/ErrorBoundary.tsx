/**
 * ErrorBoundary — Reusable Error Boundary Component
 *
 * Catches unhandled React errors and displays a fallback UI.
 * Integrates with Sentry for error tracking.
 *
 * Features:
 * - Customizable fallback UI
 * - Error callbacks for logging/tracking
 * - Reset functionality to recover from error state
 * - Automatic Sentry reporting
 * - Flat design, #1e2a3a background
 *
 * @module components/shared/ErrorBoundary
 */

'use client';

import { ReactNode, ReactElement, ErrorInfo, Component } from 'react';
import * as Sentry from '@sentry/nextjs';

/* ================================================================
   Types
   ================================================================ */

interface ErrorBoundaryProps {
  /** Fallback UI to display when error occurs */
  fallback?: ReactNode;
  /** Callback when error is caught */
  onError?: (error: Error, info: ErrorInfo) => void;
  /** Callback to reset error boundary */
  onReset?: () => void;
  /** Child components */
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/* ================================================================
   ErrorBoundary Component
   ================================================================ */

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Store error info in state
    this.setState({ errorInfo });

    // Call user-provided error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Capture exception with Sentry
    try {
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    } catch {
      // Sentry not available — continue gracefully
    }

    // Log to console in development
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught error:', error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call user-provided reset callback
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided, otherwise show default
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

/* ================================================================
   Default Fallback UI
   ================================================================ */

interface DefaultErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
}

function DefaultErrorFallback({
  error,
  errorInfo,
  onReset,
}: DefaultErrorFallbackProps): ReactElement {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h2 style={styles.title}>Something went wrong</h2>
        <p style={styles.description}>
          An unexpected error occurred. Our team has been notified.
        </p>

        {process.env.NODE_ENV === 'development' && error && (
          <details style={styles.details}>
            <summary style={styles.summary}>Error details</summary>
            <pre style={styles.errorText}>
              {error.toString()}
              {errorInfo?.componentStack && `\n\nComponent Stack:\n${errorInfo.componentStack}`}
            </pre>
          </details>
        )}

        <button onClick={onReset} style={styles.button}>
          Try again
        </button>
      </div>
    </div>
  );
}

/* ================================================================
   Styles
   ================================================================ */

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#1e2a3a',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  } as React.CSSProperties,
  content: {
    textAlign: 'center',
    maxWidth: '600px',
    backgroundColor: '#252f3e',
    border: '1px solid #3a4456',
    borderRadius: '8px',
    padding: '40px 30px',
  } as React.CSSProperties,
  title: {
    margin: '0 0 16px 0',
    fontSize: '24px',
    fontWeight: '600',
    color: '#e8eef7',
    lineHeight: '1.3',
  } as React.CSSProperties,
  description: {
    margin: '0 0 24px 0',
    fontSize: '15px',
    color: '#a5b4cc',
    lineHeight: '1.5',
  } as React.CSSProperties,
  details: {
    marginBottom: '24px',
    textAlign: 'left',
    backgroundColor: '#1e2a3a',
    border: '1px solid #3a4456',
    borderRadius: '6px',
    padding: '12px',
  } as React.CSSProperties,
  summary: {
    cursor: 'pointer',
    fontSize: '13px',
    color: '#7a8fa3',
    fontWeight: '500',
    padding: '8px',
  } as React.CSSProperties,
  errorText: {
    margin: '12px 0 0 0',
    padding: '12px',
    backgroundColor: '#1e2a3a',
    color: '#ff9e9e',
    fontSize: '12px',
    overflow: 'auto',
    maxHeight: '200px',
    border: 'none',
    borderRadius: '4px',
    fontFamily: '"Monaco", "Menlo", "Ubuntu Mono", monospace',
    lineHeight: '1.4',
  } as React.CSSProperties,
  button: {
    display: 'inline-block',
    padding: '10px 24px',
    backgroundColor: '#4a5f7f',
    color: '#e8eef7',
    border: '1px solid #5a6f8f',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  } as React.CSSProperties,
};

export { ErrorBoundary };
export default ErrorBoundary;
