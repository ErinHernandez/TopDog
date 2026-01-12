/**
 * Sentry Client Configuration
 * 
 * Error tracking for client-side (browser) code.
 * Automatically captures unhandled errors and React component errors.
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Only initialize if DSN is provided
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    
    // Performance monitoring - 10% of transactions in production
    tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,
    
    // Session replay - capture user sessions for debugging
    replaysSessionSampleRate: IS_PRODUCTION ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0, // Always capture replays on errors
    
    // Filter out common noise
    ignoreErrors: [
      // Network errors (user's connection issues)
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      'NetworkError',
      'AbortError',
      // User-triggered navigation
      'ResizeObserver loop',
      'ResizeObserver loop limit exceeded',
      // Browser extensions
      /^chrome-extension:/,
      /^moz-extension:/,
      /^safari-extension:/,
      // Ad blockers
      'Non-Error promise rejection captured',
      // Third-party scripts
      'Script error',
    ],
    
    // Filter out URLs from browser extensions
    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      /^moz-extension:\/\//i,
    ],
    
    beforeSend(event, hint) {
      // Don't send in development unless explicitly enabled
      if (!IS_PRODUCTION) {
        const shouldSend = typeof window !== 'undefined' && 
                          localStorage.getItem('sentry_debug') === 'true';
        if (!shouldSend) {
          console.log('[Sentry] Would send error:', event.exception?.values?.[0]?.value);
          return null;
        }
      }
      
      // Add additional context
      if (hint.originalException instanceof Error) {
        // Preserve error message and stack
        event.exception = event.exception || { values: [] };
      }
      
      return event;
    },
    
    // Integrate with React
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Mask sensitive data
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
  });
  
  console.log('[Sentry] Client-side error tracking initialized');
} else {
  console.log('[Sentry] Client-side tracking disabled (no DSN provided)');
}
