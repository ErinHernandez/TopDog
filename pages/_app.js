import React, { useEffect } from 'react';
import '../styles/globals.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Initialize Firebase authentication when the app loads
    // Wrap in try-catch to prevent authentication errors from crashing the app
    const initFirebase = async () => {
      try {
        const { initializeAuth } = await import('../lib/firebase');
        await initializeAuth();
      } catch (error) {
        console.log('🔄 Firebase initialization failed - app will use mock data');
        console.log('This is normal if Firebase is not configured');
      }
    };

    initFirebase();
  }, []);

  return (
    <>
      <Navbar />
      <Component {...pageProps} />
      <Footer />
    </>
  )
}

export default MyApp 