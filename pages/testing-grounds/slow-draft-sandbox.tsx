/**
 * Slow Draft Sandbox - Testing Grounds Page
 * 
 * Testing environment for slow draft components and features.
 * This page showcases the SlowDraftsTabVX2 component with mock data.
 * 
 * Access via: /testing-grounds/slow-draft-sandbox
 */

import React from 'react';
import Head from 'next/head';
import SlowDraftSandbox from '../../sandbox/slowdraft/Sandbox';

export default function SlowDraftSandboxPage(): React.ReactElement {
  return (
    <>
      <Head>
        <title>Slow Draft Sandbox - TopDog</title>
        <meta 
          name="description" 
          content="Testing environment for slow draft components and features" 
        />
      </Head>

      <SlowDraftSandbox />
    </>
  );
}
