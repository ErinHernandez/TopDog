import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || 'development',

    // Performance monitoring: sample 20% of server transactions
    tracesSampleRate: 0.2,

    // Strip sensitive data
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-firebase-token'];
      }

      // Truncate large request bodies
      if (event.request?.data && typeof event.request.data === 'string') {
        if (event.request.data.length > 1024) {
          event.request.data = event.request.data.slice(0, 1024) + '...[truncated]';
        }
      }

      return event;
    },

    beforeBreadcrumb(breadcrumb) {
      // Strip Firebase admin credentials from breadcrumbs
      if (breadcrumb.data) {
        const sensitiveKeys = [
          'FIREBASE_ADMIN_SDK_KEY',
          'FIREBASE_SERVICE_ACCOUNT',
          'STRIPE_SECRET_KEY',
        ];
        for (const key of sensitiveKeys) {
          if (breadcrumb.data[key]) {
            breadcrumb.data[key] = '[REDACTED]';
          }
        }
      }
      return breadcrumb;
    },
  });
}
