import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { SWRConfig } from 'swr';
import type { AppProps } from 'next/app';
import '../styles/globals.css';
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
import { useIsMobileDevice } from '../hooks/useIsMobileDevice';

const DEV_NAV_ROUTES = ['/testing-grounds', '/dev'];

/** Sandbox routes that render their own phone frame and dev controls; skip app-level phone so dev UI stays outside. */
const SANDBOX_ROUTES_OUTSIDE_PHONE = [
  '/testing-grounds/navbar-sandbox',
  '/testing-grounds/lobby-tab-sandbox',
];

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isMobile = useIsMobileDevice();

  const showDevNav =
    DEV_NAV_ROUTES.some((route) => router.pathname.startsWith(route)) &&
    isMobile === false;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (process.env.NODE_ENV === 'production') {
      import('../lib/envValidation')
        .then(({ initializeEnvValidation }) => initializeEnvValidation())
        .catch((e) => console.error('Env validation failed:', e));
    }
  }, []);

  useEffect(() => {
    const initFirebase = async () => {
      try {
        const { initializeAuth } = await import('../lib/firebase');
        await initializeAuth();
      } catch {
        console.log('Firebase init failed - app may use mock data');
      }
    };
    initFirebase();
  }, []);

  useEffect(() => {
    const init = () => {
      if (typeof window === 'undefined') return;
      try {
        // Check if recordPageVisit exists before calling (handles webpack bundling issues)
        if (userMetrics && typeof userMetrics.recordPageVisit === 'function') {
          userMetrics.recordPageVisit(window.location.pathname, document.referrer);
        }
        exposurePreloader.init();
      } catch (e) {
        console.warn('User tracking failed:', e);
      }
    };
    setTimeout(init, 500);
  }, []);

  // Render the page content
  const pageContent = <Component {...pageProps} />;

  // Wrap with providers
  const withProviders = (content: React.ReactNode) => (
    <SWRConfig value={swrConfig}>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </Head>
      <UserProvider>
        <PlayerDataProvider>
          <GlobalErrorBoundary>{content}</GlobalErrorBoundary>
        </PlayerDataProvider>
      </UserProvider>
    </SWRConfig>
  );

  // SSR/Hydration: Render without frame to avoid mismatch
  // Frame appears after client-side hydration
  if (isMobile === null) {
    return withProviders(pageContent);
  }

  // Mobile: Fullscreen, no frame
  if (isMobile) {
    return withProviders(pageContent);
  }

  // Sandbox pages with their own phone + dev controls: render raw so DevNav and in-page dev UI stay outside the phone
  const sandboxDevOutsidePhone = SANDBOX_ROUTES_OUTSIDE_PHONE.some((r) => router.pathname === r);

  // Desktop: Centered phone frame (or raw content for sandboxes that provide their own phone)
  return withProviders(
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      {/* DevNav for testing routes - always outside phone. Wrapper has explicit size and high z-index so it receives clicks (avoids 0x0 collapse from absolute child). */}
      {showDevNav && (
        <div
          className="fixed top-4 left-4"
          style={{ zIndex: 99999, width: 220, minHeight: 500, pointerEvents: 'auto' }}
        >
          <DevNav />
        </div>
      )}

      {/* Phone frame with page content; skip frame for sandbox routes so dev controls always render outside phone */}
      {sandboxDevOutsidePhone ? (
        pageContent
      ) : (
        <InPhoneFrameProvider value={true}>
          <MobilePhoneFrame>
            {pageContent}
          </MobilePhoneFrame>
        </InPhoneFrameProvider>
      )}
    </div>
  );
}

export default MyApp;
