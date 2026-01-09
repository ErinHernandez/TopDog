/**
 * VX2 Tablet App Demo
 * 
 * Demo page for the VX2 tablet app shell.
 * Shows the full tablet experience with navigation.
 */

import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { TabletShellVX2 } from '../../components/vx2/tablet';
import { useIsTablet } from '../../components/vx2/hooks/ui/useIsTablet';

function VX2TabletAppDemo() {
  const router = useRouter();
  const { isTablet, isIPad, isLoaded } = useIsTablet();
  
  // Show loading state until device detection is complete
  if (!isLoaded) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#101927',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ color: '#6B7280', fontSize: 14 }}>Loading...</div>
      </div>
    );
  }
  
  // On actual tablet, show fullscreen
  if (isTablet || isIPad) {
    return (
      <>
        <Head>
          <title>TopDog | Tablet</title>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
          />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        </Head>
        
        <div style={{ position: 'fixed', inset: 0 }}>
          <TabletShellVX2
            initialTab="lobby"
            showFrame={false}
            navStyle="bottom"
          />
        </div>
      </>
    );
  }
  
  // On desktop, show in frame
  return (
    <>
      <Head>
        <title>VX2 Tablet App Demo | TopDog</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-8">
          <div className="text-center">
            <h1 className="text-white text-2xl font-bold mb-2">VX2 Tablet App Demo</h1>
            <p className="text-gray-400">iPad landscape app shell</p>
          </div>
          
          <TabletShellVX2
            initialTab="lobby"
            showFrame={true}
            navStyle="bottom"
            frameModel="ipad-pro-11"
          />
          
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/testing-grounds/vx2-tablet-draft-room')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Open Draft Room
            </button>
            <button
              onClick={() => router.push('/testing-grounds/vx2-mobile-app-demo')}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              Switch to Phone
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default VX2TabletAppDemo;