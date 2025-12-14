/**
 * Mobile Deposit History Page
 * 
 * Thin wrapper that renders the DepositHistoryContent component.
 * All UI logic has been extracted to components/mobile/pages/DepositHistoryContent.js
 */

import React from 'react';
import Head from 'next/head';
import DepositHistoryContent from '../components/mobile/pages/DepositHistoryContent';

export default function MobileDepositHistoryPage() {
  return (
    <>
      <Head>
        <title>Deposit History - TopDog Mobile</title>
        <meta name="description" content="View your deposit and withdrawal history" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DepositHistoryContent />
    </>
  );
}
