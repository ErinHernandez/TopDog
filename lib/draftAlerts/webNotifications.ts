/**
 * Draft Alert System - Web Notification Fallback
 * 
 * Shows browser notifications for non-Dynamic Island devices
 * CORRECTED: Complete service worker integration with click handlers
 */

import { DraftAlertState, DraftAlertType } from './types';

/**
 * Check if web notifications are supported and permitted
 */
export async function isWebNotificationAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Show web notification
 * CORRECTED: Complete service worker integration with fallback
 */
export async function showWebNotification(
  alertState: DraftAlertState
): Promise<boolean> {
  const available = await isWebNotificationAvailable();
  if (!available) {
    return false;
  }

  try {
    // Try service worker first for better reliability
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('TopDog Draft', {
        body: alertState.message,
        icon: '/icon-192x192.png',
        badge: '/icon-96x96.png',
        tag: `draft-alert-${alertState.roomId}-${alertState.type}`,
        requireInteraction: alertState.type === DraftAlertType.ON_THE_CLOCK,
        silent: false,
        vibrate: [200, 100, 200],
        data: {
          url: `/draft/topdog/${alertState.roomId}`,
          roomId: alertState.roomId,
          type: alertState.type,
          ...alertState.data,
        },
        actions: [
          {
            action: 'open',
            title: 'Open Draft',
          },
        ],
      });
    } else {
      // Fallback to direct Notification API
      const notification = new Notification('TopDog Draft', {
        body: alertState.message,
        icon: '/icon-192x192.png',
        tag: `draft-alert-${alertState.roomId}-${alertState.type}`,
      });
      
      notification.onclick = () => {
        window.focus();
        if (alertState.data?.url) {
          window.location.href = alertState.data.url as string;
        }
        notification.close();
      };
    }

    return true;
  } catch (error) {
    console.warn('[DraftAlerts] Failed to show web notification:', error);
    return false;
  }
}
