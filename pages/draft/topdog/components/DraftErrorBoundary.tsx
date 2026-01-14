/**
 * DraftErrorBoundary
 * 
 * Error boundary specifically for draft room components.
 * Catches errors in draft room and provides recovery options.
 * 
 * Part of Phase 0: Safety Net
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/structuredLogger';

// ============================================================================
// TYPES
// ============================================================================

interface DraftErrorBoundaryProps {
  children: ReactNode;
  roomId: string;
  fallback?: ReactNode | ((error: Error) => ReactNode);
}

interface DraftErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================================
// ERROR FALLBACK COMPONENT
// ============================================================================

interface DraftErrorFallbackProps {
  error: Error | null;
  roomId: string;
  onRetry: () => void;
}

function DraftErrorFallback({ error, roomId, onRetry }: DraftErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-[#101927] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-6 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold mb-2">Draft Room Error</h2>
        <p className="text-gray-300 mb-4">
          Something went wrong in the draft room. Don't worry, your picks are safe!
        </p>
        
        {process.env.NODE_ENV === 'development' && error && (
          <div className="mb-4 p-3 bg-gray-900 rounded text-left text-xs overflow-auto max-h-40">
            <div className="text-red-400 font-mono">{error.message}</div>
            {error.stack && (
              <pre className="text-gray-400 mt-2 whitespace-pre-wrap">{error.stack}</pre>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            Try Again
          </button>
          <a
            href={`/draft/topdog/${roomId}`}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
          >
            Reload Page
          </a>
        </div>

        <p className="text-sm text-gray-500 mt-4">
          Room ID: {roomId}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// ERROR BOUNDARY CLASS
// ============================================================================

export class DraftErrorBoundary extends Component<
  DraftErrorBoundaryProps,
  DraftErrorBoundaryState
> {
  constructor(props: DraftErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<DraftErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error with structured logger
    logger.error('Draft room error', error, {
      component: 'DraftErrorBoundary',
      roomId: this.props.roomId,
      componentStack: errorInfo.componentStack?.substring(0, 500),
    });

    // Store error info for development
    this.setState({ errorInfo });

    // Send to error tracking (Sentry if configured)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        tags: {
          component: 'DraftErrorBoundary',
          roomId: this.props.roomId,
        },
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback(this.state.error!)
          : this.props.fallback;
      }

      // Default fallback
      return (
        <DraftErrorFallback
          error={this.state.error}
          roomId={this.props.roomId}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}
