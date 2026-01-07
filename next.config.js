/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  
  // Runtime caching configuration
  runtimeCaching: [
    // Static data files - Cache First
    {
      urlPattern: /^\/data\/.*\.json$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'topdog-data',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    // NFL team logos - Cache First
    {
      urlPattern: /^\/logos\/.*\.png$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'topdog-logos',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    // Player images - Cache First (immutable, taken before season)
    {
      urlPattern: /^\/players\/.*\.(webp|png)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'topdog-player-images',
        expiration: {
          maxEntries: 600, // Enough for all 554 players + variants
          maxAgeSeconds: 60 * 60 * 24 * 365 * 2, // 2 years (images don't change)
        },
      },
    },
    // Other static assets (images, fonts)
    {
      urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|ttf|woff|woff2)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'topdog-assets',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    // External avatar fallback (ui-avatars.com)
    {
      urlPattern: /^https:\/\/ui-avatars\.com\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'avatar-fallbacks',
        expiration: {
          maxEntries: 300,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Google Fonts
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-fonts-stylesheets',
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
  ],
});

const nextConfig = {
  reactStrictMode: true,
  // Turbopack configuration
  // Note: firebase-admin uses CommonJS require() in API routes to ensure compatibility
  // with both webpack (production build) and Turbopack (dev mode)
  turbopack: {
    // Keep empty - firebase-admin is handled via serverExternalPackages and CommonJS require
  },
  // Mark firebase-admin as server-only (not bundled for client)
  // This works for both webpack builds and Turbopack dev mode
  serverExternalPackages: ['firebase-admin'],
  async redirects() {
    return [
      {
        source: '/draft/topdog',
        destination: '/',
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://fonts.googleapis.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' https://fonts.gstatic.com data:",
              "connect-src 'self' https://api.stripe.com https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
// Force rebuild Fri Dec 12 03:54:11 EST 2025
