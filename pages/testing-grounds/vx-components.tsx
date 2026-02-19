/**
 * VX Components Showcase (Deprecated)
 *
 * VX design system has been removed. Use VX2 components instead.
 * This page is kept for backwards compatibility with bookmarks/links.
 */

import Head from 'next/head';
import Link from 'next/link';
import React from 'react';

export default function VXComponentsPage() {
  return (
    <>
      <Head>
        <title>VX Components (Deprecated) | TopDog</title>
      </Head>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          backgroundColor: '#0f172a',
          color: '#e2e8f0',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>VX Components Deprecated</h1>
        <p style={{ opacity: 0.8, marginBottom: 24, textAlign: 'center' }}>
          The VX design system has been removed. Use VX2 components and the main app.
        </p>
        <Link
          href="/"
          style={{
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Go to App
        </Link>
      </div>
    </>
  );
}
