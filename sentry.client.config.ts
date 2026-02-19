import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development',

    // Performance monitoring: sample 20% of transactions
    tracesSampleRate: 0.2,

    // No session replay initially
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    // Strip sensitive data from breadcrumbs and events
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },

    beforeBreadcrumb(breadcrumb) {
      // Strip auth tokens from fetch breadcrumbs
      if (breadcrumb.category === 'fetch' && breadcrumb.data?.url) {
        const url = breadcrumb.data.url as string;
        if (url.includes('token=') || url.includes('apiKey=')) {
          breadcrumb.data.url = url.replace(
            /([?&])(token|apiKey|key|secret)=[^&]*/gi,
            '$1$2=[REDACTED]'
          );
        }
      }
      return breadcrumb;
    },

    // Only report errors, not warnings
    ignoreErrors: [
      // Browser-specific noise
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      // Firebase auth expected errors
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request',
      // Network errors that are user-side
      'Failed to fetch',
      'NetworkError',
      'Load failed',
    ],
  });
}
