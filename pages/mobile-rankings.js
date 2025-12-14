/**
 * Mobile Rankings Page
 * 
 * Thin wrapper that renders the RankingsContent component.
 * All UI logic has been extracted to components/mobile/pages/RankingsContent.js
 */

import React from 'react';
import Head from 'next/head';
import RankingsContent from '../components/mobile/pages/RankingsContent';

export default function MobileRankingsPage() {
  return (
    <>
      <Head>
        <title>Rankings - TopDog Mobile</title>
        <meta name="description" content="Player rankings and custom rankings management" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <RankingsContent />
    </>
  );
}
