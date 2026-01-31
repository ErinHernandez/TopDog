import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { SWRConfig } from 'swr';
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import '../styles/index.css'; // CSS custom properties & utility classes
import '../styles/legacy-support.css';
import '../styles/device-sizing.css';
import DevNav from '../components/dev/DevNav';
import { UserProvider } from '../lib/userContext';
import { PlayerDataProvider } from '../lib/playerDataContext';
import { swrConfig } from '../lib/swr';
import userMetrics from '../lib/userMetrics';
import exposurePreloader from '../lib/exposurePreloader';
import { GlobalErrorBoundary } from '../components/ui';
import { MobilePhoneFrame } from '../components/vx2/shell/MobilePhoneFrame';
import { InPhoneFrameProvider } from '../lib/inPhoneFrameContext';
import { createScopedLogger } from '@/lib/clientLogger';

const logger = createScopedLogger('[App]');

const DEV_NAV_ROUTES = ['/testing-grounds', '/dev'];

/** Sandbox routes that render outside the phone (own layout or web-only). Skip app-level phone so dev UI / auth stay outside. */
const SANDBOX_ROUTES_OUTSIDE_PHONE = [
  '/testing-grounds/navbar-sandbox',
  '/testing-grounds/lobby-tab-sandbox',
  '/testing-grounds/vx2-auth-test', // Page shows phone + auth outside it; mobile access blocked
];

/**
 * Hydration-safe mobile device detection.
 * IMPORTANT: Inline implementation to avoid import causing module reload issues.
 */
function useIsMobileDeviceStable(): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent =
        navigator.userAgent || navigator.vendor || (window as Window & { opera?: string }).opera || '';
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isNarrowScreen = window.innerWidth < 768;
      return mobileRegex.test(userAgent) || isNarrowScreen;
    };

    setIsMobile(checkMobile());

    const handleResize = () => setIsMobile(checkMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isMobile = useIsMobileDeviceStable();
  
  // Determine layout mode
  const isDesktop = isMobile === false;
  const showPhoneFrame = isDesktop && !SANDBOX_ROUTES_OUTSIDE_PHONE.some((r) => router.pathname === r);
  
  const showDevNav =
    DEV_NAV_ROUTES.some((route) => router.pathname.startsWith(route)) &&
    isDesktop;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (process.env.NODE_ENV === 'production') {
      import('../lib/envValidation')
        .then(({ initializeEnvValidation }) => initializeEnvValidation())
        .catch((e) => logger.error('Env validation failed', e instanceof Error ? e : new Error(String(e))));
    }
  }, []);

  useEffect(() => {
    const initFirebase = async () => {
      try {
        const { initializeAuth } = await import('../lib/firebase');
        await initializeAuth();
      } catch {
        logger.debug('Firebase init failed - app may use mock data');
      }
    };
    initFirebase();
  }, []);

  useEffect(() => {
    const init = () => {
      if (typeof window === 'undefined') return;
      try {
        if (userMetrics && typeof userMetrics.recordPageVisit === 'function') {
          userMetrics.recordPageVisit(window.location.pathname, document.referrer);
        }
        exposurePreloader.init();
      } catch (e) {
        logger.warn('User tracking failed', { error: String(e) });
      }
    };
    setTimeout(init, 500);
  }, []);

  // CRITICAL FIX: Always render the SAME component tree structure.
  // Use CSS to control visibility instead of conditional rendering.
  // This prevents React from remounting components when isMobile changes,
  // which was causing Fast Refresh to do full reloads in a loop.
  return (
    <SWRConfig value={swrConfig}>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </Head>
      <UserProvider>
        <PlayerDataProvider>
          <GlobalErrorBoundary>
            <InPhoneFrameProvider value={showPhoneFrame}>
              {/* Wrapper div - always rendered, styling changes based on mode */}
              <div 
                className={showPhoneFrame ? "min-h-screen bg-gray-900 flex items-center justify-center p-4" : ""}
                style={{ minHeight: showPhoneFrame ? undefined : '100vh' }}
              >
                {/* DevNav - only visible on desktop for dev routes */}
                {showDevNav && (
                  <div
                    className="fixed top-4 left-4"
                    style={{ zIndex: 99999, width: 220, minHeight: 500, pointerEvents: 'auto' }}
                  >
                    <DevNav />
                  </div>
                )}
                
                {/* Content wrapper - phone frame only on desktop */}
                {showPhoneFrame ? (
                  <MobilePhoneFrame>
                    <Component {...pageProps} />
                  </MobilePhoneFrame>
                ) : (
                  <Component {...pageProps} />
                )}
              </div>
            </InPhoneFrameProvider>
          </GlobalErrorBoundary>
        </PlayerDataProvider>
      </UserProvider>
    </SWRConfig>
  );
}

export default MyApp;
