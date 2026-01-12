import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useIsMobileDevice } from '../hooks/useIsMobileDevice';

export default function Home() {
  const router = useRouter();
  const { isMobile, isLoaded } = useIsMobileDevice();

  // Automatically redirect mobile devices to mobile app
  useEffect(() => {
    if (isLoaded && isMobile) {
      router.replace('/testing-grounds/vx2-mobile-app-demo');
    }
  }, [isMobile, isLoaded, router]);

  // Show loading state while detecting device or redirecting
  if (isLoaded && isMobile) {
    return (
      <div 
        style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#101927',
          color: '#fff',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', opacity: 0.7 }}>Loading mobile app...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>TopDog</title>
        <meta name="description" content="TopDog - Coming Soon" />
      </Head>

      <main
        style={{
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: 0,
          overflow: 'hidden',
          background: 'url(/wr_blue.png) no-repeat center center',
          backgroundSize: 'cover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src="/under_construction_no_bg.png"
          alt="TopDog - Under Construction"
          style={{
            width: '200px',
            height: 'auto',
          }}
        />
      </main>
    </>
  );
}
