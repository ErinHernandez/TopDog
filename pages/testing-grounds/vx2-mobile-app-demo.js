/**
 * VX2 Mobile App Demo Page
 * 
 * Testing grounds for the enterprise-grade VX2 mobile app framework.
 * This page showcases the new tab navigation system.
 * 
 * On mobile devices (iPhone/iPad), shows fullscreen app experience.
 * On desktop, shows phone frame preview.
 */

import React from 'react';
import Head from 'next/head';
import { AppShellVX2 } from '../../components/vx2';
import { useIsMobileDevice } from '../../hooks/useIsMobileDevice';

export default function VX2MobileAppDemo() {
  const { isMobile, isLoaded } = useIsMobileDevice();
  
  // Track tab changes for debugging
  const handleTabChange = (fromTab, toTab) => {
    console.log(`[VX2] Tab changed: ${fromTab || 'initial'} -> ${toTab}`);
  };

  // Show nothing until we've detected device type to prevent flash
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

  return (
    <>
      <Head>
        <title>VX2 Mobile App Demo | TopDog</title>
        <meta name="description" content="Enterprise-grade mobile app framework demo" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>

      {/* 
        On mobile: fullscreen app (no phone frame)
        On desktop: phone frame preview 
      */}
      {isMobile ? (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          backgroundColor: '#101927',
          overflow: 'hidden',
        }}>
          <AppShellVX2
            initialTab="lobby"
            showPhoneFrame={false}
            onTabChange={handleTabChange}
            badgeOverrides={{
              'live-drafts': 3,
            }}
          />
        </div>
      ) : (
        <AppShellVX2
          initialTab="lobby"
          showPhoneFrame={true}
          onTabChange={handleTabChange}
          badgeOverrides={{
            'live-drafts': 3,
          }}
        />
      )}
    </>
  );
}

