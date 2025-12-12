import React from 'react'
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Anton+SC&display=swap" rel="stylesheet" />
        
        {/* PWA Primary Meta Tags */}
        <meta name="application-name" content="TopDog" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TopDog" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#1DA1F2" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Favicon */}
        <link rel="icon" href="/icons/icon-192x192.png" />
        
        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
        
        {/* Preconnect for external resources */}
        <link rel="preconnect" href="https://ui-avatars.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
