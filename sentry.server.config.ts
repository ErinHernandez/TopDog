/**
 * Sentry Server Configuration
 * 
 * Error tracking for server-side (API routes, getServerSideProps, etc.)
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Only initialize if DSN is provided
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    
    // Performance monitoring - 10% of transactions in production
    tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,
    
    // Filter out common noise
    ignoreErrors: [
      // Database connection errors (handled by retry logic)
      'ECONNREFUSED',
      'ETIMEDOUT',
      // Validation errors (expected, not bugs)
      'ValidationError',
    ],
    
    beforeSend(event: Sentry.ErrorEvent, hint: Sentry.EventHint) {
      // Don't send in development unless explicitly enabled
      if (!IS_PRODUCTION) {
        const shouldSend = process.env.SENTRY_DEBUG === 'true';
        if (!shouldSend) {
          console.log('[Sentry] Would send error:', event.exception?.values?.[0]?.value);
          return null;
        }
      }
      
      return event;
    },
    
    // Server-side integrations
    integrations: [
      Sentry.httpIntegration(),
    ],
  });
  
  console.log('[Sentry] Server-side error tracking initialized');
} else {
  console.log('[Sentry] Server-side tracking disabled (no DSN provided)');
}
