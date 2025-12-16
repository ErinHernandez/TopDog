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
  // Silence Turbopack warning - next-pwa uses webpack
  turbopack: {},
  async redirects() {
    return [
      {
        source: '/draft/topdog',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
// Force rebuild Fri Dec 12 03:54:11 EST 2025
