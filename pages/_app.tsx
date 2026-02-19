/**
 * TopDog — Custom App Component
 *
 * Wraps all pages in:
 * - Global CSS import
 * - AuthProvider (Firebase Auth state)
 * - Error boundary
 *
 * @module pages/_app
 */

import type { AppProps } from 'next/app';
import React, { Component, useEffect, type ErrorInfo, type ReactNode } from 'react';
import { Inter } from 'next/font/google';
import * as Sentry from '@sentry/nextjs';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { NotificationProvider } from '@/components/notifications';
import { AriaLiveProvider, SkipLink } from '@/lib/a11y';
import '@/styles/globals.css';
import '@/styles/responsive.css';
import '@/styles/a11y.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

/* ----------------------------------------------------------------
   Unregister stale service workers from previous builds
   ---------------------------------------------------------------- */

function useCleanupServiceWorkers() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().then((success) => {
            if (success) {
              console.info('[TopDog] Unregistered stale service worker');
            }
          });
        }
      });
    }
  }, []);
}

/* ----------------------------------------------------------------
   Error Boundary
   ---------------------------------------------------------------- */

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[TopDog] Uncaught error:', error, info.componentStack);
    Sentry.captureException(error, {
      extra: { componentStack: info.componentStack },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            padding: '2rem',
            backgroundColor: '#0a1628',
            color: '#ffffff',
            fontFamily:
              'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#c5d0e6', fontSize: '0.875rem', maxWidth: '480px', lineHeight: 1.6 }}>
            The application encountered an unexpected error. Please refresh the page to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1.5rem',
              padding: '0.5rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#fff',
              backgroundColor: '#10b981',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/* ----------------------------------------------------------------
   App Component
   ---------------------------------------------------------------- */

export default function TopDogApp({ Component, pageProps }: AppProps) {
  useCleanupServiceWorkers();

  return (
    <div className={`${inter.variable} ${inter.className}`}>
      <AppErrorBoundary>
        <SkipLink />
        <AuthProvider>
          <NotificationProvider>
            <AriaLiveProvider>
              <Component {...pageProps} />
            </AriaLiveProvider>
          </NotificationProvider>
        </AuthProvider>
      </AppErrorBoundary>
    </div>
  );
}
