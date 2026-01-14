// Notification click handler for draft alerts
// This code is automatically merged into sw.js by scripts/merge-service-worker.js
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data;
  if (data?.url) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Focus existing window if open
        for (const client of clientList) {
          if (client.url.includes(data.roomId) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if no existing
        if (clients.openWindow) {
          return clients.openWindow(data.url);
        }
      })
    );
  }
});
