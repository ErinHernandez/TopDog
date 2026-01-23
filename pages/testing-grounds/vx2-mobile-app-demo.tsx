/**
 * VX2 Mobile App Demo
 *
 * Simple demo – frame vs fullscreen is handled by _app.
 * Kept for backwards compatibility with bookmarks/links.
 */

import React from 'react';
import Head from 'next/head';
import { AppShellVX2 } from '../../components/vx2';
import { AuthProvider } from '../../components/vx2/auth';

export default function VX2MobileAppDemo() {
  return (
    <>
      <Head>
        <title>VX2 Mobile App Demo | TopDog</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
      </Head>
      <AuthProvider>
        <AppShellVX2
          initialTab="lobby"
          badgeOverrides={{ 'live-drafts': 3 }}
        />
      </AuthProvider>
    </>
  );
}
