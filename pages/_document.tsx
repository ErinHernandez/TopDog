/**
 * Idesaign — Custom Document
 *
 * Sets up:
 * - HTML lang attribute
 * - Charset and viewport meta
 * - Theme color for mobile browsers
 * - Favicon links
 * - Open Graph and Twitter meta tags
 * - Preconnect to Firebase and Google Fonts
 *
 * @module pages/_document
 */

import { Html, Head, Main, NextScript } from 'next/document';

export default function IdesaignDocument() {
  return (
    <Html lang="en" data-theme="dark">
      <Head>
        {/* Charset is set by Next.js automatically, but explicit is fine */}
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#0d0d0f" />
        <meta name="color-scheme" content="dark light" />

        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />

        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Idesaign" />
        <meta
          property="og:description"
          content="Idesaign"
        />
        <meta property="og:image" content="/og-image.png" />

        {/* Twitter / X */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Idesaign" />
        <meta
          name="twitter:description"
          content="Idesaign"
        />
        <meta name="twitter:image" content="/og-image.png" />

        {/* Preconnect to origins we'll fetch from */}
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
