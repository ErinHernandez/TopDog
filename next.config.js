/** @type {import('next').NextConfig} */

// NOTE: Dynamic imports for heavy components should be used in pages/components like:
// import dynamic from 'next/dynamic';
// const PaymentMethods = dynamic(() => import('@/components/payment/PaymentMethods'), {
//   loading: () => <div>Loading...</div>,
//   ssr: false
// });
// const CurrencyConverter = dynamic(() => import('@/components/currency/CurrencyConverter'), {
//   loading: () => <div>Loading...</div>,
//   ssr: true
// });

let withBundleAnalyzer = (config) => config;
try {
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
    openAnalyzer: process.env.ANALYZE_OPEN !== 'false', // Open browser by default
    removeOriginalBundle: false, // Keep original bundle for size comparison
    reportFilename: '.next/bundle-report.html',
    reportTitle: 'TopDog Bundle Analysis Report',
    analyzerMode: 'static', // Generate static HTML report
  });
} catch (e) {
  // Bundle analyzer is optional - continue without it if not installed
  console.warn('Warning: @next/bundle-analyzer not installed. Run: npm install --save-dev @next/bundle-analyzer');
}

// Serwist PWA configuration - replaces next-pwa
// Runtime caching strategies are defined in sw.ts
const withSerwist = require('@serwist/next').default({
  swSrc: 'sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  reactStrictMode: true,
  // Remove console statements in production builds
  // This eliminates 3,257+ console statements without code changes
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
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
  webpack: (config, { isServer }) => {
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
  // Mark firebase-admin as server-only (not bundled for client)
  // This works with webpack builds
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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://fonts.googleapis.com https://www.googletagmanager.com https://js.stripe.com https://js.paystack.co",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://js.stripe.com https://www.paypalobjects.com https://developers.google.com https://developer.apple.com https://upload.wikimedia.org https://ui-avatars.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "connect-src 'self' https://api.stripe.com https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com https://api.paystack.co https://api.xendit.co https://api.paymongo.com https://*.sentry.io https://*.ingest.sentry.io",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.paystack.com https://standard.paystack.co",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
              "report-uri /api/csp-report",
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
      {
        // Cache headers for Next.js static build assets (content-addressed, immutable)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(withSerwist(nextConfig));
// Force rebuild Fri Dec 12 03:54:11 EST 2025
