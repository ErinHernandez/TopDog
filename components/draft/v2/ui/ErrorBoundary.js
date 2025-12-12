import React from 'react';

/**
 * ErrorBoundary - Catch and handle component errors gracefully
 * 
 * Essential for a large-scale app with 47k+ users:
 * - Prevents entire page crashes
 * - Provides fallback UI
 * - Logs errors for monitoring
 * - Allows partial recovery
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error for monitoring (would integrate with logging service)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-900/20 border border-red-500 rounded-lg">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-400 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-300 mb-4">
              This component encountered an error and couldn't render properly.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-red-300">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 p-4 bg-gray-800 rounded text-xs overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <div className="flex space-x-4">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;