---
name: Global Error Boundary
overview: Add a production-grade global error boundary to catch React errors, display contextual fallback UI, and integrate with Sentry for error tracking.
todos:
  - id: create-global-error-boundary
    content: Create components/shared/GlobalErrorBoundary.js with error catching, Sentry integration, and user-friendly fallback UI
    status: pending
  - id: integrate-error-boundary
    content: Update pages/_app.js to wrap Component with GlobalErrorBoundary inside the provider tree
    status: pending
    dependencies:
      - create-global-error-boundary
---

# Global Error Boundary Implementation Plan (Refined)

## Overview

Implement a global error boundary at the application root to catch React component errors, preventing full-page crashes. This provides graceful degradation with contextual recovery options while capturing diagnostics for monitoring.

| Field | Value |
|-------|-------|
| **Priority** | Low (enhancement) |
| **Status** | Ready for Implementation |
| **Estimated Time** | 45-60 minutes |
| **Risk Level** | Low (additive change, no breaking modifications) |

## What Changed from Original Plan

| Area | Original | Refined |
|------|----------|---------|
| **Error Context** | Generic error state | Includes `errorId`, `timestamp`, `pathname` for debugging |
| **Recovery** | Basic retry/reload | Added "Go Home" option, smarter retry logic |
| **Accessibility** | Only `role="alert"` | Added `aria-live`, focus management, keyboard navigation |
| **Testing** | Manual only | Added automated test patterns |
| **Logging** | Console + Sentry | Structured logging with correlation IDs |
| **Edge Cases** | Not addressed | Handles hydration errors, route changes |
| **Mobile UX** | Basic responsive | Touch-friendly buttons, better spacing |

## Current Architecture

```
_app.js
└── SWRConfig
    └── UserProvider
        └── PlayerDataProvider
            └── Layout Container
                ├── Navbar (conditional)
                ├── Main Content ← ERROR BOUNDARY GOES HERE
                │   └── <Component {...pageProps} />
                ├── Footer (conditional)
                └── DevNav (conditional)
```

**Placement Rationale:** Inside providers so context remains available for fallback UI (e.g., user info for error reports), but wrapping only the page component to isolate page-level failures.

## Implementation

### Step 1: Create GlobalErrorBoundary Component

**File:** `components/shared/GlobalErrorBoundary.js`

```javascript
import React from 'react';
import { useRouter } from 'next/router';

/**
 * GlobalErrorBoundary
 * 
 * Catches React component errors at the application root level.
 * Provides user-friendly fallback UI with recovery options.
 * Integrates with Sentry for error tracking.
 * 
 * Note: Error boundaries must be class components (React limitation).
 * The withRouter pattern provides router access for the "Go Home" action.
 */

// Generate unique error ID for correlation
const generateErrorId = () => {
  return `err_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
};

class GlobalErrorBoundaryClass extends React.Component {
  constructor(props) {
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

  static getDerivedStateFromError(error) {
    // Update state to trigger fallback UI on next render
    return {
      hasError: true,
      errorId: generateErrorId(),
      errorTimestamp: new Date().toISOString(),
    };
  }

  async componentDidCatch(error, errorInfo) {
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

    console.error('[GlobalErrorBoundary] Caught error:', {
      message: error.message,
      ...errorContext,
    });

    // Store error details for fallback UI
    this.setState({ error, errorInfo });

    // Send to Sentry with context
    try {
      const { captureReactError } = await import('../../lib/errorTracking');
      await captureReactError(error, errorInfo.componentStack, 'GlobalErrorBoundary', {
        errorId,
        pathname,
        retryCount: this.state.retryCount,
      });
    } catch (trackingError) {
      console.error('[GlobalErrorBoundary] Failed to report to Sentry:', trackingError);
    }

    // Google Analytics exception tracking (production only)
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: `${errorId}: ${error.message}`,
        fatal: false,
      });
    }

    // Focus management for accessibility
    setTimeout(() => {
      if (this.fallbackRef.current) {
        this.fallbackRef.current.focus();
      }
    }, 100);
  }

  componentDidUpdate(prevProps) {
    // Reset error state on route change (Next.js navigation)
    if (this.state.hasError && this.props.router?.asPath !== prevProps.router?.asPath) {
      this.resetError();
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      errorTimestamp: null,
    });
  };

  handleRetry = () => {
    const maxRetries = 3;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      // Too many retries, suggest reload instead
      console.warn('[GlobalErrorBoundary] Max retries reached, suggesting reload');
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
        console.log(`[GlobalErrorBoundary] Retry attempt ${this.state.retryCount}`);
      }
    );
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    if (this.props.router) {
      this.resetError();
      this.props.router.push('/');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    const { hasError, error, errorInfo, errorId, retryCount } = this.state;
    const { children, fallback } = this.props;
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

    // Default fallback UI
    return (
      <div
        ref={this.fallbackRef}
        tabIndex={-1}
        role="alert"
        aria-live="assertive"
        className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4"
      >
        <div className="text-center max-w-lg w-full">
          {/* Error Icon */}
          <div className="mb-6">
            <svg
              className="w-16 h-16 mx-auto text-red-500"
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

          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Something went wrong
          </h1>

          <p className="text-lg text-gray-300 mb-2">
            We hit an unexpected error. Don't worry — your data is safe.
          </p>

          <p className="text-sm text-gray-500 mb-6">
            Error ID: <code className="bg-gray-800 px-2 py-1 rounded">{errorId}</code>
          </p>

          {/* Development-only error details */}
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mb-6 text-left bg-gray-800 rounded-lg overflow-hidden">
              <summary className="cursor-pointer px-4 py-3 text-red-300 hover:bg-gray-700 transition-colors">
                🔧 Error Details (Dev Only)
              </summary>
              <pre className="p-4 text-sm text-red-400 overflow-auto max-h-64 border-t border-gray-700">
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

          {/* Retry limit warning */}
          {!canRetry && (
            <p className="text-yellow-400 text-sm mb-4">
              Multiple retry attempts failed. Please reload the page or return home.
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {canRetry && (
              <button
                onClick={this.handleRetry}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold 
                         hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors
                         min-h-[48px]"
              >
                Try Again {retryCount > 0 && `(${maxRetries - retryCount} left)`}
              </button>
            )}

            <button
              onClick={this.handleGoHome}
              className="bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold 
                       hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 
                       focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors
                       min-h-[48px]"
            >
              Go Home
            </button>

            <button
              onClick={this.handleReload}
              className="bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold 
                       hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 
                       focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors
                       min-h-[48px]"
            >
              Reload Page
            </button>
          </div>

          {/* Support hint */}
          <p className="mt-8 text-sm text-gray-500">
            If this keeps happening, please contact support with the Error ID above.
          </p>
        </div>
      </div>
    );
  }
}

// Wrapper to inject Next.js router (class components can't use hooks directly)
function GlobalErrorBoundary(props) {
  let router = null;
  try {
    // useRouter can throw if called outside Next.js context (e.g., tests)
    router = useRouter();
  } catch {
    // Router not available, continue without it
  }
  return <GlobalErrorBoundaryClass {...props} router={router} />;
}

export default GlobalErrorBoundary;
```

### Step 2: Integrate in _app.js

**File:** `pages/_app.js`

Add the import at the top of the file:

```javascript
import GlobalErrorBoundary from '../components/shared/GlobalErrorBoundary';
```

Then wrap the `<Component />` render:

```javascript
return (
  <SWRConfig value={swrConfig}>
    <UserProvider>
      <PlayerDataProvider>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {!isLandingPage && !isDraftRoom && /* other conditions */ <Navbar />}
          <div style={{ flex: '1' }}>
            <GlobalErrorBoundary>
              <Component {...pageProps} />
            </GlobalErrorBoundary>
          </div>
          {!isLandingPage && !isDraftRoom && /* other conditions */ <Footer />}
          {isTestingGrounds && isMounted && !isMobileDevice && <DevNav />}
        </div>
      </PlayerDataProvider>
    </UserProvider>
  </SWRConfig>
);
```

## Key Improvements Explained

### 1. Error Correlation IDs

Every error gets a unique ID (`err_abc123_xyz789`) that:
- Appears in the UI for users to report
- Gets sent to Sentry for correlation
- Helps support find the exact error quickly

### 2. Smart Retry Logic

Instead of unlimited retries (which can cause infinite loops):
- Maximum 3 retry attempts
- Shows remaining retries in button text
- After max retries, hides retry button and suggests reload
- Retry count persists until successful render or page reload

### 3. Route Change Reset

When users navigate away (using Next.js Link or router):
- Error state automatically clears
- No stale error UI on new pages
- Uses `componentDidUpdate` to detect route changes

### 4. Accessibility Improvements

- `role="alert"` and `aria-live="assertive"` for screen readers
- Focus automatically moves to error UI
- All buttons have 48px minimum touch target
- Focus rings visible for keyboard navigation
- `tabIndex={-1}` allows programmatic focus

### 5. Flexible Fallback API

Consumers can provide custom fallback UI:

```jsx
<GlobalErrorBoundary 
  fallback={({ error, errorId, resetError }) => (
    <CustomErrorUI 
      errorId={errorId} 
      onRetry={resetError} 
    />
  )}
>
  <Component />
</GlobalErrorBoundary>
```

### 6. Structured Logging

Console logs include structured context for easier debugging:

```javascript
{
  message: "Cannot read property 'map' of undefined",
  errorId: "err_abc123_xyz789",
  pathname: "/draft/league-123",
  timestamp: "2025-01-12T...",
  userAgent: "Mozilla/5.0..."
}
```

## Error Boundary Limitations

Error boundaries **do not catch** errors in:

| Scenario | Solution |
|----------|----------|
| Event handlers | Use try-catch in handlers |
| Async code (setTimeout, promises) | Use try-catch or `.catch()` |
| Server-side rendering | Handled by `pages/_error.js` |
| The error boundary itself | Wrap in another boundary (rare) |
| Errors thrown in useEffect | Caught, but may need cleanup |

## Testing Strategy

### Manual Testing Checklist

1. **Normal Operation**
   - [ ] Navigate between pages normally
   - [ ] Error boundary is invisible
   - [ ] No console errors about the boundary

2. **Error Handling**
   - [ ] Trigger error (see test page below)
   - [ ] Fallback UI appears
   - [ ] Error ID is displayed
   - [ ] Console shows structured log

3. **Recovery Actions**
   - [ ] "Try Again" resets and re-renders
   - [ ] Retry counter decrements correctly
   - [ ] "Go Home" navigates to `/`
   - [ ] "Reload Page" refreshes browser

4. **Retry Limits**
   - [ ] After 3 retries, "Try Again" disappears
   - [ ] Warning message appears
   - [ ] Other buttons still work

5. **Route Changes**
   - [ ] Trigger error, then click nav link
   - [ ] Error clears on navigation

6. **Sentry Integration**
   - [ ] Error appears in Sentry dashboard
   - [ ] Error ID matches
   - [ ] Component stack is included

### Temporary Test Page

Create `pages/_dev/test-error-boundary.js`:

```javascript
import { useState } from 'react';

function BrokenComponent() {
  throw new Error('Test error: This component always crashes');
}

export default function TestErrorBoundary() {
  const [showBroken, setShowBroken] = useState(false);

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Error Boundary Test Page</h1>
      <p className="mb-4 text-gray-600">
        Click the button to trigger an error and test the global error boundary.
      </p>
      <button
        onClick={() => setShowBroken(true)}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Trigger Error
      </button>
      {showBroken && <BrokenComponent />}
    </div>
  );
}
```

**⚠️ Delete this file after testing.**

### Automated Test Pattern

```javascript
// __tests__/GlobalErrorBoundary.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import GlobalErrorBoundary from '../components/shared/GlobalErrorBoundary';

const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) throw new Error('Test error');
  return <div>Normal content</div>;
};

describe('GlobalErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('renders children when no error', () => {
    render(
      <GlobalErrorBoundary>
        <ThrowError shouldThrow={false} />
      </GlobalErrorBoundary>
    );
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('renders fallback UI when error occurs', () => {
    render(
      <GlobalErrorBoundary>
        <ThrowError shouldThrow={true} />
      </GlobalErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/Error ID:/)).toBeInTheDocument();
  });

  it('resets on Try Again click', () => {
    const { rerender } = render(
      <GlobalErrorBoundary>
        <ThrowError shouldThrow={true} />
      </GlobalErrorBoundary>
    );
    
    fireEvent.click(screen.getByText(/Try Again/));
    
    rerender(
      <GlobalErrorBoundary>
        <ThrowError shouldThrow={false} />
      </GlobalErrorBoundary>
    );
    
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });
});
```

## Files Summary

| Action | File | Lines |
|--------|------|-------|
| **Create** | `components/shared/GlobalErrorBoundary.js` | ~200 |
| **Modify** | `pages/_app.js` | +4 (import + wrapper) |
| **Create** | `pages/_dev/test-error-boundary.js` | ~25 (temporary) |
| **Create** | `__tests__/GlobalErrorBoundary.test.js` | ~50 (optional) |

## Dependencies

All dependencies already exist in the project:

- `lib/errorTracking.ts` — Sentry integration
- `next/router` — Route change detection
- `react` — Error boundary API
- Tailwind CSS — Styling

## Success Criteria

| Requirement | Validation |
|-------------|------------|
| Catches React errors | Test page triggers error, fallback appears |
| Shows user-friendly UI | Non-technical message, clear actions |
| Displays error ID | Visible in UI and Sentry |
| Sentry receives errors | Check Sentry dashboard |
| Retry works (up to 3x) | Counter decrements, then hides |
| Go Home works | Navigates to `/` |
| Reload works | Page refreshes |
| Dev shows details | Error stack visible in dev mode |
| Prod hides details | Error stack hidden in production |
| Accessible | Screen reader announces, focus managed |
| Route change resets | Navigate away clears error |

## Rollback Plan

If issues arise:

1. Remove the `<GlobalErrorBoundary>` wrapper from `_app.js`
2. Remove the import statement
3. Keep or remove the component file (it's harmless if unused)

The change is additive and easily reversible with no data migrations or breaking changes.

---

**Last Updated:** January 12, 2026  
**Status:** Ready for Implementation  
**Reviewer Notes:** Refined from original plan with production hardening, accessibility, and testability improvements.
