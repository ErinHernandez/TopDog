import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { SWRConfig } from 'swr';
import '../styles/globals.css'
import '../styles/legacy-support.css'
import '../styles/device-sizing.css'
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
  
  // Initialize environment validation on app startup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Validate environment variables in production
      if (process.env.NODE_ENV === 'production') {
        import('../lib/envValidation').then(({ initializeEnvValidation }) => {
          initializeEnvValidation();
        }).catch((error) => {
          console.error('Failed to initialize environment validation:', error);
        });
      }
    }
  }, []);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Track mount state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Detect mobile device for hiding dev nav
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
      const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
      const isAndroid = /android/i.test(userAgent);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone === true;
      setIsMobileDevice(isIOS || isIPadOS || isAndroid || isStandalone);
    };
    checkMobile();
  }, []);
  
  // Check if we're in a draft room, dev navbar, or mobile demo page to hide navbar
  const isLandingPage = router.pathname === '/';
  const isDraftRoom = router.pathname.startsWith('/draft/');
  const isDevDraftNavbar = router.pathname === '/dev-draft-navbar';
  const isMobileDemo = router.pathname.includes('mobile-') && router.pathname.includes('-demo');
  const isVX2DraftRoom = router.pathname === '/testing-grounds/vx2-draft-room';
  const isVXMobileDemo = router.pathname === '/testing-grounds/vx-mobile-demo';
  const isTestingGrounds = router.pathname.startsWith('/testing-grounds/');
  const isProfileCustomization = router.pathname === '/profile-customization';
  const isMobileProfileCustomization = router.pathname === '/mobile-profile-customization';

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
      if (typeof window === 'undefined') return;
      try {
        // Record page visit
        const currentPage = window.location.pathname;
        const referrer = typeof document !== 'undefined' ? document.referrer : '';
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
            {!isLandingPage && !isDraftRoom && !isDevDraftNavbar && !isMobileDemo && !isTestingGrounds && !isProfileCustomization && !isMobileProfileCustomization && <Navbar />}
            <div style={{ flex: '1' }}>
              <Component {...pageProps} />
            </div>
            {!isLandingPage && !isDraftRoom && !isDevDraftNavbar && !isMobileDemo && !isTestingGrounds && !isProfileCustomization && !isMobileProfileCustomization && <Footer />}
            {isTestingGrounds && isMounted && !isMobileDevice && <DevNav />}
          </div>
        </PlayerDataProvider>
      </UserProvider>
    </SWRConfig>
  )
}

export default MyApp 