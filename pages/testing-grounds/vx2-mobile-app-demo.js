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
import { useRouter } from 'next/router';
import { AppShellVX2 } from '../../components/vx2';
import { useIsMobileDevice } from '../../hooks/useIsMobileDevice';

export default function VX2MobileAppDemo() {
  const router = useRouter();
  const { isMobile, isLoaded } = useIsMobileDevice();
  
  // Determine initial tab:
  // - If coming from draft room (session flag), go to live-drafts
  // - Otherwise, always default to lobby (even on refresh)
  const [initialTab, setInitialTab] = React.useState(null);
  
  React.useEffect(() => {
    if (!router.isReady) return;
    
    // Check if user just came from draft room
    const cameFromDraft = sessionStorage.getItem('topdog_came_from_draft');
    
    if (cameFromDraft) {
      // Clear the flag so refresh goes to lobby
      sessionStorage.removeItem('topdog_came_from_draft');
      setInitialTab('live-drafts');
    } else {
      // Default to lobby on fresh load or refresh
      setInitialTab('lobby');
    }
    
    // Clean up URL query param if present
    if (router.query.tab) {
      router.replace('/testing-grounds/vx2-mobile-app-demo', undefined, { shallow: true });
    }
  }, [router.isReady, router.query.tab]);
  
  // Track tab changes for debugging
  const handleTabChange = (fromTab, toTab) => {
    console.log(`[VX2] Tab changed: ${fromTab || 'initial'} -> ${toTab}`);
  };

  // Show nothing until we've detected device type AND router is ready to prevent flash
  if (!isLoaded || !router.isReady) {
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
            initialTab={initialTab}
            showPhoneFrame={false}
            onTabChange={handleTabChange}
            badgeOverrides={{
              'live-drafts': 3,
            }}
          />
        </div>
      ) : (
        <AppShellVX2
          initialTab={initialTab}
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

