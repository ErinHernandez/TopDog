/**
 * GlobalErrorBoundary
 * 
 * Catches React component errors at the application root level.
 * Provides user-friendly fallback UI with recovery options.
 * Integrates with Sentry for error tracking.
 * 
 * Note: Error boundaries must be class components (React limitation).
 * The wrapper pattern provides router access for the "Go Home" action.
 * 
 * @module components/shared/GlobalErrorBoundary
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import type { JSX } from 'react';
import { useRouter, NextRouter } from 'next/router';
import { createScopedLogger } from '@/lib/clientLogger';

const logger = createScopedLogger('[GlobalErrorBoundary]');

// ============================================================================
// TYPES
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  errorTimestamp: string | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: {
    error: Error | null;
    errorInfo: ErrorInfo | null;
    errorId: string | null;
    resetError: () => void;
  }) => ReactNode);
  router?: NextRouter | null;
}

// ============================================================================
// UTILITIES
// ============================================================================

// Generate unique error ID for correlation
const generateErrorId = (): string => {
  return `err_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
};

// ============================================================================
// ERROR BOUNDARY CLASS
// ============================================================================

class GlobalErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private fallbackRef: React.RefObject<HTMLDivElement | null>;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      errorTimestamp: null,
      retryCount: 0,
    };
    this.fallbackRef = React.createRef();
  }

  static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
    // Update state to trigger fallback UI on next render
    return {
      hasError: true,
      errorId: generateErrorId(),
      errorTimestamp: new Date().toISOString(),
    };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo): Promise<void> {
    const { errorId } = this.state;
    const pathname = typeof window !== 'undefined' ? window.location.pathname : 'unknown';

    // Structured error logging
    const errorContext = {
      errorId,
      pathname,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      componentStack: errorInfo.componentStack,
    };

    logger.error('Caught error:', new Error(JSON.stringify({
      message: error.message,
      ...errorContext,
    })));

    // Store error details for fallback UI
    this.setState({ error, errorInfo });

    // Send to Sentry with context
    try {
      const { captureError } = await import('../../lib/errorTracking');
      await captureError(error, {
        tags: {
          component: 'GlobalErrorBoundary',
          type: 'react_error_boundary',
        },
        extra: {
          errorId,
          pathname,
          retryCount: this.state.retryCount,
          componentStack: errorInfo.componentStack?.substring(0, 500),
          userAgent: errorContext.userAgent,
        },
        level: 'error',
      });
    } catch (trackingError) {
      logger.error('Failed to report to Sentry:', trackingError instanceof Error ? trackingError : new Error(String(trackingError)));
    }

    // Google Analytics exception tracking (production only)
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
      if (gtag) {
        gtag('event', 'exception', {
          description: `${errorId}: ${error.message}`,
          fatal: false,
        });
      }
    }

    // Focus management for accessibility
    setTimeout(() => {
      if (this.fallbackRef.current) {
        this.fallbackRef.current.focus();
      }
    }, 100);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset error state on route change (Next.js navigation)
    if (this.state.hasError && this.props.router?.asPath !== prevProps.router?.asPath) {
      this.resetError();
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      errorTimestamp: null,
      retryCount: 0,
    });
  };

  handleRetry = (): void => {
    const maxRetries = 3;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      // Too many retries, suggest reload instead
      logger.warn('Max retries reached, suggesting reload');
      return;
    }

    this.setState(
      (prevState) => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }),
      () => {
        logger.debug(`Retry attempt ${this.state.retryCount}`);
      }
    );
  };

  handleReload = (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleGoHome = (): void => {
    if (this.props.router) {
      this.resetError();
      this.props.router.push('/');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, errorId, retryCount } = this.state;
    const { children, fallback, router } = this.props;
    const maxRetries = 3;
    const canRetry = retryCount < maxRetries;

    if (!hasError) {
      return children;
    }

    // Custom fallback UI if provided
    if (fallback) {
      return typeof fallback === 'function'
        ? fallback({ error, errorInfo, errorId, resetError: this.resetError })
        : fallback;
    }

    // Detect if we're on a mobile route
    const pathname = router?.pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
    const isMobileRoute = pathname.includes('mobile') || 
                         pathname.includes('testing-grounds/vx') ||
                         pathname.startsWith('/dev/');
    
    // Detect if we're on an actual mobile device (not desktop viewing mobile route)
    const isActualMobileDevice = typeof window !== 'undefined' && 
                                (window.innerWidth < 768 || 
                                 /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    
    // Show phone frame on mobile routes when NOT on actual mobile device (desktop preview)
    const showPhoneFrame = isMobileRoute && !isActualMobileDevice;

    // Navbar component with wr_blue background
    const errorNavbar = (
      <header 
        className="w-full z-50"
        style={{ 
          background: 'url(/wr_blue.png) no-repeat center center',
          backgroundSize: 'cover',
          position: 'relative',
          minWidth: '100vw',
          overflow: 'visible',
          paddingTop: 'max(0px, calc(env(safe-area-inset-top, 0px) - 20px))',
        }}
      >
        <nav 
          className="shadow-lg text-black"
          style={{ 
            background: 'url(/wr_blue.png) no-repeat center center', 
            backgroundSize: 'cover', 
            width: '100vw', 
            marginLeft: '0', 
            transform: 'translateZ(0)', 
            position: 'relative', 
            minWidth: '100vw', 
            overflow: 'visible' 
          }}
        >
          <div 
            className="container mx-auto"
            style={{ 
              overflow: 'visible', 
              maxWidth: '100vw', 
              paddingLeft: '20px', 
              paddingRight: '20px', 
              transform: 'translateZ(0)', 
              position: 'relative', 
              minWidth: '100%', 
              width: '100%' 
            }}
          >
            <div 
              className="flex justify-between items-center h-16 min-w-0"
              style={{ 
                position: 'relative', 
                minWidth: '100%', 
                overflow: 'visible', 
                width: '100%' 
              }}
            >
            </div>
          </div>
        </nav>
      </header>
    );

    // Error content
    const errorContent = (
      <div 
        className="text-center w-full px-2 flex flex-col items-center justify-between"
        style={showPhoneFrame ? {
          width: '100%',
          height: 'calc(100% - 80px)', // Account for navbar height
        } : {
          paddingTop: '2rem',
          minHeight: '100%',
        }}
      >
          {/* Error Icon - Smaller on mobile */}
          <div className="mb-4 sm:mb-6">
            <svg
              className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2">
            Something went wrong
          </h1>

          <p className="text-base sm:text-lg text-gray-300 mb-4 sm:mb-6 px-2">
            We hit an unexpected error.
          </p>

          {/* Development-only error details */}
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mb-4 sm:mb-6 text-left bg-gray-800 rounded-lg overflow-hidden mx-2">
              <summary className="cursor-pointer px-3 py-2.5 sm:px-4 sm:py-3 text-red-300 hover:bg-gray-700 active:bg-gray-700 transition-colors text-sm sm:text-base touch-manipulation">
                Error Details (Dev Only)
              </summary>
              <pre 
                className="p-3 sm:p-4 text-xs sm:text-sm text-red-400 overflow-auto max-h-48 sm:max-h-64 border-t border-gray-700"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(107, 114, 128, 0.5) transparent',
                }}
              >
                <strong>Message:</strong> {error.message}
                {'\n\n'}
                <strong>Stack:</strong>
                {'\n'}
                {error.stack}
                {errorInfo && (
                  <>
                    {'\n\n'}
                    <strong>Component Stack:</strong>
                    {errorInfo.componentStack}
                  </>
                )}
              </pre>
            </details>
          )}


          {/* Action Buttons - Full width on mobile, stacked */}
          <div className="flex flex-col gap-3 sm:gap-3 sm:flex-row sm:justify-center px-2">
            <button
              onClick={this.handleGoHome}
              className="bg-gray-700 text-white px-6 py-3.5 sm:py-3 rounded-lg font-semibold 
                       active:bg-gray-600 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 
                       focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors
                       min-h-[48px] text-base touch-manipulation w-full sm:w-auto"
            >
              Home
            </button>

            <button
              onClick={this.handleReload}
              className="bg-gray-700 text-white px-6 py-3.5 sm:py-3 rounded-lg font-semibold 
                       active:bg-gray-600 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 
                       focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors
                       min-h-[48px] text-base touch-manipulation w-full sm:w-auto"
            >
              Reload Page
            </button>
          </div>

          {/* Support hint - Smaller on mobile */}
          <p className="mt-6 sm:mt-8 text-xs sm:text-sm text-gray-500 px-2 mb-2">
            If this keeps happening, please contact support with the Error ID below.
          </p>
          
          {/* Error ID at bottom - pushed to bottom with mt-auto */}
          <p className="mt-auto text-xs sm:text-sm text-gray-500 px-2 break-words pb-4">
            Error ID: <code className="bg-gray-800 px-2 py-1 rounded text-xs sm:text-sm">{errorId}</code>
          </p>
      </div>
    );

    // Wrap in phone frame if on mobile route (desktop preview)
    if (showPhoneFrame) {
      return (
        <div
          ref={this.fallbackRef}
          tabIndex={-1}
          role="alert"
          aria-live="assertive"
          className="min-h-screen bg-gray-100 flex items-center justify-center p-4"
        >
          <div 
            className="bg-black rounded-3xl p-1"
            style={{ 
              width: '375px', 
              height: '812px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}
          >
            <div 
              className="bg-black rounded-3xl overflow-hidden relative bg-[#101927] flex flex-col"
              style={{ width: '100%', height: '100%' }}
            >
              <div style={{ flexShrink: 0 }}>
                {errorNavbar}
              </div>
              <div style={{ flex: 1, overflow: 'auto' }}>
                {errorContent}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Standard full-screen error UI (mobile devices or non-mobile routes)
    return (
      <div
        ref={this.fallbackRef}
        tabIndex={-1}
        role="alert"
        aria-live="assertive"
        className="min-h-screen bg-[#101927] text-white flex flex-col"
        style={{
          minHeight: '-webkit-fill-available',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Navbar at top */}
        <div style={{ flexShrink: 0 }}>
          {errorNavbar}
        </div>
        
        {/* Error content below navbar */}
        <div 
          className={`flex-1 flex items-center justify-center ${isActualMobileDevice ? 'p-2' : 'p-4 sm:p-6'}`}
        >
          <div 
            className={`text-center w-full px-2 ${isActualMobileDevice ? 'max-w-[375px]' : 'max-w-lg'}`}
            style={isActualMobileDevice ? {
              maxWidth: '375px',
              margin: '0 auto',
            } : {}}
          >
            {errorContent}
          </div>
        </div>
      </div>
    );
  }
}

// ============================================================================
// WRAPPER COMPONENT
// ============================================================================

// Wrapper to inject Next.js router (class components can't use hooks directly)
function GlobalErrorBoundary(props: Omit<ErrorBoundaryProps, 'router'>): JSX.Element {
  let router: NextRouter | null = null;
  try {
    // useRouter can throw if called outside Next.js context (e.g., tests)
    router = useRouter();
  } catch {
    // Router not available, continue without it
  }
  return <GlobalErrorBoundaryClass {...props} router={router} />;
}

export default GlobalErrorBoundary;
