import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { SWRConfig } from 'swr';
import '../styles/globals.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import DevNav from '../components/dev/DevNav'
import { UserProvider } from '../lib/userContext'
import { PlayerDataProvider } from '../lib/playerDataContext'
import { swrConfig } from '../lib/swr'
import userMetrics from '../lib/userMetrics'
import exposurePreloader from '../lib/exposurePreloader'

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  
  // Check if we're in a draft room, dev navbar, or mobile demo page to hide navbar
  const isDraftRoom = router.pathname.startsWith('/draft/');
  const isDevDraftNavbar = router.pathname === '/dev-draft-navbar';
  const isMobileDemo = router.pathname.includes('mobile-') && router.pathname.includes('-demo');
  const isVX2DraftRoom = router.pathname === '/testing-grounds/vx2-draft-room';
  const isVXMobileDemo = router.pathname === '/testing-grounds/vx-mobile-demo';
  const isTestingGrounds = router.pathname.startsWith('/testing-grounds/');

  useEffect(() => {
    // Initialize Firebase authentication in the background
    const initFirebase = async () => {
      try {
        const { initializeAuth } = await import('../lib/firebase');
        await initializeAuth();
        console.log('Firebase initialized successfully');
      } catch (error) {
        console.log('Firebase initialization failed - app will use mock data');
        console.log('This is normal if Firebase is not configured');
      }
    };

    // Start Firebase initialization but don't wait for it
    initFirebase();

    // Initialize user metrics and exposure preloader
    const initUserTracking = () => {
      try {
        // Record page visit
        const currentPage = window.location.pathname;
        const referrer = document.referrer;
        userMetrics.recordPageVisit(currentPage, referrer);

        // Initialize exposure preloader
        exposurePreloader.init();

        if (process.env.NODE_ENV === 'development') {
          console.log('User metrics and exposure preloader initialized');
        }
      } catch (error) {
        console.warn('Failed to initialize user tracking:', error);
      }
    };

    // Initialize after a short delay to not block page load
    setTimeout(initUserTracking, 500);
  }, []); // Empty dependency array - only run once

  return (
    <SWRConfig value={swrConfig}>
      <UserProvider>
        <PlayerDataProvider>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {!isDraftRoom && !isDevDraftNavbar && !isMobileDemo && !isTestingGrounds && <Navbar />}
            <div style={{ flex: '1' }}>
              <Component {...pageProps} />
            </div>
            {!isDraftRoom && !isDevDraftNavbar && !isMobileDemo && !isTestingGrounds && <Footer />}
            {isTestingGrounds && <DevNav />}
          </div>
        </PlayerDataProvider>
      </UserProvider>
    </SWRConfig>
  )
}

export default MyApp 