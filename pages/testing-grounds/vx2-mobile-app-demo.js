/**
 * VX2 Mobile App Demo Page
 * 
 * Testing grounds for the enterprise-grade VX2 mobile app framework.
 * This page showcases the new tab navigation system.
 */

import React from 'react';
import Head from 'next/head';
import { AppShellVX2 } from '../../components/vx2';

export default function VX2MobileAppDemo() {
  // Track tab changes for debugging
  const handleTabChange = (fromTab, toTab) => {
    console.log(`[VX2] Tab changed: ${fromTab || 'initial'} -> ${toTab}`);
  };

  return (
    <>
      <Head>
        <title>VX2 Mobile App Demo | TopDog</title>
        <meta name="description" content="Enterprise-grade mobile app framework demo" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <AppShellVX2
        initialTab="lobby"
        showPhoneFrame={true}
        onTabChange={handleTabChange}
        badgeOverrides={{
          'live-drafts': 3, // Show 3 active drafts
        }}
      />
    </>
  );
}

