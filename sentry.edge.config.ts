/**
 * Sentry Edge Configuration
 * 
 * Error tracking for Edge runtime (middleware, edge API routes)
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Only initialize if DSN is provided
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    
    // Lower sample rate for edge (higher volume)
    tracesSampleRate: IS_PRODUCTION ? 0.05 : 0.5,
    
    beforeSend(event) {
      // Don't send in development unless explicitly enabled
      if (!IS_PRODUCTION) {
        const shouldSend = process.env.SENTRY_DEBUG === 'true';
        if (!shouldSend) {
          return null;
        }
      }
      
      return event;
    },
  });
  
  console.log('[Sentry] Edge error tracking initialized');
} else {
  console.log('[Sentry] Edge tracking disabled (no DSN provided)');
}
