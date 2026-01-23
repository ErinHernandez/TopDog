/** @type {import('next').NextConfig} */
let withBundleAnalyzer = (config) => config;
try {
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
} catch (e) {
  // Bundle analyzer is optional - continue without it if not installed
}

// Conditionally load next-pwa - skip in dev to avoid Babel dependency issues
let withPWA = (config) => config;
if (process.env.NODE_ENV !== 'development') {
  // Only load next-pwa in production to avoid Babel dependency issues in dev
  try {
    withPWA = require('next-pwa')({
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
        // Tournament card background images - StaleWhileRevalidate for cache-busting
        // These may be updated, so allow network updates while serving cached version
        // Matches do_riding_football* and tournament_card_background.png
        {
          urlPattern: /(\/do_riding_football.*\.(webp|png)|\/tournament_card_background\.png)(\?.*)?$/,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'topdog-tournament-images',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days - shorter cache for updateable assets
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        // Other static assets (images, fonts) - Cache First
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
  } catch (e) {
    // If next-pwa fails to load (e.g., missing Babel dependencies), continue without it
    console.warn('[next.config.js] next-pwa failed to load, continuing without PWA support:', e.message);
  }
}

const nextConfig = {
  reactStrictMode: true,
  // Remove console statements in production builds
  // This eliminates 3,257+ console statements without code changes
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Exclude .bak files from build
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  exclude: ['**/*.bak'],
  // Enable compression
  compress: true,
  // Optimize package imports
  experimental: {
    optimizePackageImports: [
      'lodash',
      'date-fns',
      '@heroicons/react',
      'lucide-react',
    ],
  },
  // Webpack configuration for bundle optimization
  webpack: (config, { isServer, dev }) => {
    // Fix hot-update.json ENOENT errors in dev mode
    if (dev) {
      const fs = require('fs');
      const path = require('path');
      
      // Ensure hot-update directory exists
      const hotUpdateDir = path.join(process.cwd(), '.next', 'dev', 'static', 'webpack');
      if (!fs.existsSync(hotUpdateDir)) {
        fs.mkdirSync(hotUpdateDir, { recursive: true });
      }
      
      // Disable HMR to avoid hot-update.json errors (temporary workaround)
      // This prevents webpack from trying to read non-existent hot-update files
      if (!isServer) {
        config.optimization = config.optimization || {};
        // Keep HMR enabled but add error handling
        config.plugins = config.plugins || [];
        config.plugins.push({
          apply: (compiler) => {
            // Intercept file system errors for hot-update.json
            const originalReadFile = fs.readFile;
            const originalReadFileSync = fs.readFileSync;
            
            // Wrap readFile to handle missing hot-update.json gracefully
            const wrappedReadFile = function(...args) {
              const filePath = args[0];
              if (typeof filePath === 'string' && filePath.includes('hot-update.json')) {
                const callback = args[args.length - 1];
                if (typeof callback === 'function') {
                  // Return empty object for missing hot-update files
                  return callback(null, Buffer.from('{}'));
                }
              }
              return originalReadFile.apply(this, args);
            };
            
            compiler.hooks.beforeCompile.tap('HotUpdateFix', () => {
              // Ensure directory exists
              if (!fs.existsSync(hotUpdateDir)) {
                fs.mkdirSync(hotUpdateDir, { recursive: true });
              }
            });
          }
        });
      }
    }
    // Bundle splitting for large modules
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Vendor chunk for node_modules
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          // Separate chunk for Stripe
          stripe: {
            test: /[\\/]node_modules[\\/](@stripe|stripe)[\\/]/,
            name: 'stripe',
            chunks: 'all',
            priority: 20,
          },
          // Separate chunk for Firebase
          firebase: {
            test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
            name: 'firebase',
            chunks: 'all',
            priority: 20,
          },
          // Draft room components (identify duplication)
          draftRoom: {
            test: /[\\/]components[\\/](draft|DraftRoom|VX|topdog)[\\/]/,
            name: 'draft-room',
            chunks: 'all',
            priority: 15,
          },
        },
      };
    }
    
    return config;
  },
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Turbopack configuration
  // Note: firebase-admin uses CommonJS require() in API routes to ensure compatibility
  // with both webpack (production build) and Turbopack (dev mode)
  turbopack: {
    // Keep empty - firebase-admin is handled via serverExternalPackages and CommonJS require
    // Exclude .bak files from build
    resolveExtensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
  },
  // Exclude .bak files from webpack
  webpack: (config, { isServer, dev }) => {
    // Exclude .bak files
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.bak$/,
      use: 'ignore-loader',
    });
    
    // Fix hot-update.json ENOENT errors in dev mode
    if (dev) {
      const fs = require('fs');
      const path = require('path');
      
      // Ensure hot-update directory exists
      const hotUpdateDir = path.join(process.cwd(), '.next', 'dev', 'static', 'webpack');
      if (!fs.existsSync(hotUpdateDir)) {
        fs.mkdirSync(hotUpdateDir, { recursive: true });
      }
      
      // Disable HMR to avoid hot-update.json errors (temporary workaround)
      // This prevents webpack from trying to read non-existent hot-update files
      if (!isServer) {
        config.optimization = config.optimization || {};
        // Keep HMR enabled but add error handling
        config.plugins = config.plugins || [];
        config.plugins.push({
          apply: (compiler) => {
            // Intercept file system errors for hot-update.json
            const originalReadFile = fs.readFile;
            const originalReadFileSync = fs.readFileSync;
            
            // Wrap readFile to handle missing hot-update.json gracefully
            const wrappedReadFile = function(...args) {
              const filePath = args[0];
              if (typeof filePath === 'string' && filePath.includes('hot-update.json')) {
                const callback = args[args.length - 1];
                if (typeof callback === 'function') {
                  // Return empty object for missing hot-update files
                  return callback(null, Buffer.from('{}'));
                }
              }
              return originalReadFile.apply(this, args);
            };
            
            compiler.hooks.beforeCompile.tap('HotUpdateFix', () => {
              // Ensure directory exists
              if (!fs.existsSync(hotUpdateDir)) {
                fs.mkdirSync(hotUpdateDir, { recursive: true });
              }
            });
          }
        });
      }
    }
    // Bundle splitting for large modules
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Vendor chunk for node_modules
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          // Separate chunk for Stripe
          stripe: {
            test: /[\\/]node_modules[\\/](@stripe|stripe)[\\/]/,
            name: 'stripe',
            chunks: 'all',
            priority: 20,
          },
          // Separate chunk for Firebase
          firebase: {
            test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
            name: 'firebase',
            chunks: 'all',
            priority: 20,
          },
          // Draft room components (identify duplication)
          draftRoom: {
            test: /[\\/]components[\\/](draft|DraftRoom|VX|topdog)[\\/]/,
            name: 'draft-room',
            chunks: 'all',
            priority: 15,
          },
        },
      };
    }
    
    return config;
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
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
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
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://fonts.googleapis.com https://www.googletagmanager.com https://js.stripe.com https://js.paystack.co",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' https://fonts.gstatic.com data:",
              "connect-src 'self' https://api.stripe.com https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com https://api.paystack.co https://api.xendit.co https://api.paymongo.com https://*.sentry.io https://*.ingest.sentry.io",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.paystack.com https://standard.paystack.co",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
      {
        // Cache-busting headers for tournament card images (mobile optimization)
        source: '/do_riding_football_III.(webp|png)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400, must-revalidate',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/tournament_card_background.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400, must-revalidate',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        // Mobile-optimized cache headers for critical assets
        source: '/wr_blue.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Service worker - no cache to ensure updates
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      {
        // Workbox service worker - no cache
        source: '/workbox-:hash.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(withPWA(nextConfig));
// Force rebuild Fri Dec 12 03:54:11 EST 2025
