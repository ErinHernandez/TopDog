/**
 * Serwist Service Worker for TopDog Best Ball
 *
 * This file defines caching strategies for the PWA.
 * Generated service worker will be output to public/sw.js
 */

import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import {
  Serwist,
  CacheFirst,
  StaleWhileRevalidate,
  ExpirationPlugin,
  CacheableResponsePlugin,
} from 'serwist';
import type { RuntimeCaching } from 'serwist';

// Extend the global scope for Serwist
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Custom runtime caching strategies (migrated from next-pwa config)
const customRuntimeCaching: RuntimeCaching[] = [
  // Static data files - Cache First (30 days)
  {
    matcher: ({ url }) => /^\/data\/.*\.json$/.test(url.pathname),
    handler: new CacheFirst({
      cacheName: 'topdog-data',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        }),
      ],
    }),
  },
  // NFL team logos - Cache First (1 year)
  {
    matcher: ({ url }) => /^\/logos\/.*\.png$/.test(url.pathname),
    handler: new CacheFirst({
      cacheName: 'topdog-logos',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        }),
      ],
    }),
  },
  // Player images - Cache First (2 years, immutable)
  {
    matcher: ({ url }) => /^\/players\/.*\.(webp|png)$/.test(url.pathname),
    handler: new CacheFirst({
      cacheName: 'topdog-player-images',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 600, // Enough for all 554 players + variants
          maxAgeSeconds: 60 * 60 * 24 * 365 * 2, // 2 years
        }),
      ],
    }),
  },
  // Tournament card background images - StaleWhileRevalidate (7 days)
  // These may be updated, so allow network updates while serving cached version
  {
    matcher: ({ url }) => /\/do_riding_football.*\.(webp|png)(\?.*)?$/.test(url.pathname),
    handler: new StaleWhileRevalidate({
      cacheName: 'topdog-tournament-images',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        }),
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    }),
  },
  // Other static assets (images, fonts) - Cache First (1 year)
  {
    matcher: ({ url }) => /\.(png|jpg|jpeg|svg|gif|webp|ttf|woff|woff2)$/.test(url.pathname),
    handler: new CacheFirst({
      cacheName: 'topdog-assets',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        }),
      ],
    }),
  },
  // External avatar fallback (ui-avatars.com) - Cache First (30 days)
  {
    matcher: ({ url }) => url.hostname === 'ui-avatars.com',
    handler: new CacheFirst({
      cacheName: 'avatar-fallbacks',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 300,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        }),
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    }),
  },
  // Google Fonts stylesheets - StaleWhileRevalidate
  {
    matcher: ({ url }) => url.hostname === 'fonts.googleapis.com',
    handler: new StaleWhileRevalidate({
      cacheName: 'google-fonts-stylesheets',
    }),
  },
  // Google Fonts webfonts - Cache First (1 year)
  {
    matcher: ({ url }) => url.hostname === 'fonts.gstatic.com',
    handler: new CacheFirst({
      cacheName: 'google-fonts-webfonts',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        }),
      ],
    }),
  },
];

// Notification click handler (migrated from sw-custom.js)
// This handles draft alert notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data;
  if (data?.url) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        // Focus existing window if open
        for (const client of clientList) {
          if (client.url.includes(data.roomId) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if no existing
        if (self.clients.openWindow) {
          return self.clients.openWindow(data.url);
        }
      })
    );
  }
});

// Initialize Serwist with precaching and runtime caching
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Custom strategies first (more specific patterns)
    ...customRuntimeCaching,
    // Then default Next.js caching strategies
    ...defaultCache,
  ],
});

// Add all event listeners
serwist.addEventListeners();
