/**
 * Generate firebase-messaging-sw.js with actual Firebase config
 * 
 * This script reads environment variables and generates the service worker
 * with the correct Firebase configuration.
 * 
 * Usage:
 *   node scripts/generate-firebase-messaging-sw.js
 */

const fs = require('fs');
const path = require('path');

const SW_TEMPLATE = `/**
 * Firebase Cloud Messaging Service Worker
 * 
 * Handles background push notifications
 * 
 * AUTO-GENERATED: Do not edit manually. Run 'npm run generate-sw' to regenerate.
 */

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration (injected from environment variables)
const firebaseConfig = {
  apiKey: "{{API_KEY}}",
  authDomain: "{{AUTH_DOMAIN}}",
  projectId: "{{PROJECT_ID}}",
  storageBucket: "{{STORAGE_BUCKET}}",
  messagingSenderId: "{{MESSAGING_SENDER_ID}}",
  appId: "{{APP_ID}}"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages (when app is closed)
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'TopDog Draft';
  const notificationBody = payload.notification?.body || payload.data?.message || 'Draft alert';
  
  const notificationOptions = {
    body: notificationBody,
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    data: payload.data,
    tag: \`draft-alert-\${payload.data?.roomId}-\${payload.data?.type}\`,
    requireInteraction: payload.data?.type === 'on_the_clock',
    silent: false,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'open',
        title: 'Open Draft',
      },
    ],
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[FCM] Notification clicked:', event);
  
  event.notification.close();
  
  const data = event.notification.data;
  const action = event.action;
  
  // Handle action button clicks
  if (action === 'open' || !action) {
    const urlToOpen = data?.url || \`/draft/topdog/\${data?.roomId}\`;
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Focus existing window if open
        for (const client of clientList) {
          if (client.url.includes(data?.roomId) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});
`;

function generateServiceWorker() {
  // Load environment variables
  require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

  const config = {
    API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
    AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN',
    PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
    STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'YOUR_STORAGE_BUCKET',
    MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
    APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'YOUR_APP_ID',
  };

  // Replace placeholders
  let swContent = SW_TEMPLATE;
  Object.entries(config).forEach(([key, value]) => {
    swContent = swContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });

  // Write to public directory
  const swPath = path.join(__dirname, '../public/firebase-messaging-sw.js');
  fs.writeFileSync(swPath, swContent, 'utf8');

  console.log('✅ Generated firebase-messaging-sw.js');
  console.log('📝 Make sure to update .env.local with your Firebase config values');
}

// Check if dotenv is available
try {
  require.resolve('dotenv');
  const dotenv = require('dotenv');
  generateServiceWorker();
} catch (e) {
  // Try to load env vars directly from .env.local if dotenv not available
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '../.env.local');
  
  if (fs.existsSync(envPath)) {
    // Manually parse .env.local
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value;
        }
      }
    });
    generateServiceWorker();
  } else {
    console.warn('⚠️  .env.local not found');
    console.warn('   Create .env.local with your Firebase config values');
    console.warn('   Or manually update public/firebase-messaging-sw.js with your Firebase config');
    process.exit(1);
  }
}
