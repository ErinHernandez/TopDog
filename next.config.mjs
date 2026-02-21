import { withSentryConfig } from '@sentry/nextjs';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// NOTE: Serwist PWA config — runtime caching strategies in sw.ts
// Uncomment when @serwist/next is installed:
// import withSerwistInit from '@serwist/next';
// const withSerwist = withSerwistInit({
//   swSrc: 'sw.ts',
//   swDest: 'public/sw.js',
//   disable: process.env.NODE_ENV === 'development',
// });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
    // Tree-shake heavy packages
    optimizePackageImports: [
      'lodash',
      'date-fns',
      '@heroicons/react',
      'lucide-react',
    ],
  },

  pageExtensions: ['tsx', 'ts'],

  // Enable compression
  compress: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },

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
        // Global security headers
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // SECURITY: Using strict-dynamic (no unsafe-eval / unsafe-inline)
              "script-src 'self' 'strict-dynamic' https://apis.google.com https://www.gstatic.com https://js.stripe.com https://js.paystack.co https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://storage.googleapis.com https://*.googleusercontent.com https://js.stripe.com https://www.paypalobjects.com https://developers.google.com https://developer.apple.com https://upload.wikimedia.org https://ui-avatars.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://api.stripe.com https://api.paystack.co https://api.xendit.co https://api.paymongo.com https://*.sentry.io https://*.ingest.sentry.io",
              "frame-src 'self' https://accounts.google.com https://js.stripe.com https://hooks.stripe.com https://checkout.paystack.com https://standard.paystack.co",
              "worker-src 'self' blob:",
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
        // API routes — no caching
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
      {
        // Service worker — always revalidate
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
        ],
      },
      {
        source: '/workbox-:hash.js',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
        ],
      },
      {
        // Immutable static build assets
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      { source: '/health', destination: '/api/health' },
      { source: '/api/v1/nfl/:path*', destination: '/api/nfl/:path*' },
      { source: '/api/v1/draft/:path*', destination: '/api/draft/:path*' },
      { source: '/api/v1/players/:path*', destination: '/api/players/:path*' },
      { source: '/api/v1/stripe/:path*', destination: '/api/stripe/:path*' },
      { source: '/api/v1/health', destination: '/api/health' },
      { source: '/api/v1/auth/:path*', destination: '/api/auth/:path*' },
    ];
  },

  webpack: (config, { isServer }) => {
    // Server-side externals
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        bufferutil: 'commonjs bufferutil',
      });
    }

    // Client-side bundle splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          stripe: {
            test: /[\\/]node_modules[\\/](@stripe|stripe)[\\/]/,
            name: 'stripe',
            chunks: 'all',
            priority: 20,
          },
          firebase: {
            test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
            name: 'firebase',
            chunks: 'all',
            priority: 20,
          },
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

  compiler: {
    // Strip console.log/info/debug in production; keep error and warn
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
};

const sentryConfig = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: true,
};

const configWithAnalyzer = withBundleAnalyzer(nextConfig);

export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(configWithAnalyzer, sentryConfig)
  : configWithAnalyzer;
