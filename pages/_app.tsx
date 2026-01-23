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

  function renderContent() {
    if (isMobile === null) {
      return <Component {...pageProps} />;
    }
    if (isMobile) {
      return <Component {...pageProps} />;
    }
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        {showDevNav && (
          <div className="fixed top-4 left-4 z-50">
            <DevNav />
          </div>
        )}
        <InPhoneFrameProvider value={true}>
          <MobilePhoneFrame>
            <Component {...pageProps} />
          </MobilePhoneFrame>
        </InPhoneFrameProvider>
      </div>
    );
  }

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
          <GlobalErrorBoundary>{renderContent()}</GlobalErrorBoundary>
        </PlayerDataProvider>
      </UserProvider>
    </SWRConfig>
  );
}

export default MyApp;
