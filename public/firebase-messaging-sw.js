/**
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
  apiKey: "AIzaSyD3FtIzbb1HwEa1juMYk1XSWB4tvbd6oBg",
  authDomain: "topdog-e9d48.firebaseapp.com",
  projectId: "topdog-e9d48",
  storageBucket: "topdog-e9d48.firebasestorage.app",
  messagingSenderId: "410904939799",
  appId: "1:410904939799:web:352b9748425c9274f3fb52"
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
    tag: `draft-alert-${payload.data?.roomId}-${payload.data?.type}`,
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
    const urlToOpen = data?.url || `/draft/topdog/${data?.roomId}`;
    
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
