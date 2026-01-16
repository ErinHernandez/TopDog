/**
 * PushNotificationSettings - UI for managing push notification permissions
 * 
 * Provides button to request notification permissions and enable alerts.
 */

import React, { useState, useEffect } from 'react';
import { fcmService } from '../../../lib/pushNotifications/fcmService';

export function PushNotificationSettings(): React.ReactElement {
  const [isSupported, setIsSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isRequesting, setIsRequesting] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);

    // Get current permission status
    if (supported) {
      setPermissionStatus(Notification.permission);
      
      // Get current token if permission already granted
      if (Notification.permission === 'granted') {
        fcmService.getToken().then(setToken);
      }
    }
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const newToken = await fcmService.requestPermissionAndGetToken();
      setToken(newToken);
      setPermissionStatus(Notification.permission);
    } catch (error) {
      console.error('Failed to request permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  if (!isSupported) {
    return (
      <div>
        <p>Push notifications are not supported in this browser.</p>
      </div>
    );
  }

  return (
    <div>
      <h3>Push Notifications</h3>
      
      {permissionStatus === 'granted' ? (
        <div>
          <p>✅ Notifications enabled</p>
          {token && (
            <p style={{ fontSize: '12px', color: '#666' }}>
              Token: {token.substring(0, 20)}...
            </p>
          )}
        </div>
      ) : (
        <div>
          <p>Enable push notifications to receive draft alerts.</p>
          <button
            onClick={handleRequestPermission}
            disabled={isRequesting}
            style={{
              padding: '12px 24px',
              backgroundColor: '#1E3A5F',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: isRequesting ? 'not-allowed' : 'pointer',
            }}
          >
            {isRequesting ? 'Requesting...' : 'Enable Notifications'}
          </button>
        </div>
      )}
    </div>
  );
}

export default PushNotificationSettings;
