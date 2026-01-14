# Push Notifications Plan - Draft Alerts

**Status:** Planning Phase  
**Date:** January 2026  
**Purpose:** Provide push notifications for sandboxed Dynamic Island and lesser devices

---

## 🎯 Overview

While the Dynamic Island alert system is being sandboxed and for users on devices without Dynamic Island support, we need a reliable push notification system that works:
- When the app is closed
- On all devices (iOS, Android, Desktop)
- During development/testing (sandbox mode)
- For users with older devices

---

## 📊 Current State

### ✅ What We Have

1. **Web Notifications (Local)**
   - ✅ Browser Notification API implementation
   - ✅ Service worker integration
   - ✅ Click handlers to open draft room
   - ⚠️ **Limitation:** Only works when browser/app is open

2. **Alert System Infrastructure**
   - ✅ Alert manager with deduplication
   - ✅ User preferences per alert type
   - ✅ 5 alert types defined
   - ✅ Integration with draft room state

### ❌ What We're Missing

1. **True Push Notifications**
   - ❌ Push API subscription
   - ❌ Server-side push service
   - ❌ Background push delivery
   - ❌ Works when app is closed

---

## 🏗️ Architecture Options

### Option 1: Firebase Cloud Messaging (FCM) ⭐ RECOMMENDED

**Pros:**
- ✅ Already using Firebase (Auth, Firestore)
- ✅ Free tier: Unlimited notifications
- ✅ Works on iOS, Android, Web
- ✅ Easy integration with existing Firebase setup
- ✅ Reliable delivery
- ✅ Built-in analytics

**Cons:**
- ⚠️ Requires Firebase project setup
- ⚠️ iOS requires APNs certificate

**Implementation Complexity:** Medium  
**Cost:** Free (up to unlimited notifications)

---

### Option 2: OneSignal

**Pros:**
- ✅ Easy setup
- ✅ Good free tier
- ✅ Cross-platform
- ✅ Built-in analytics

**Cons:**
- ⚠️ Additional service dependency
- ⚠️ Free tier limitations
- ⚠️ Not integrated with existing stack

**Implementation Complexity:** Low  
**Cost:** Free (up to 10,000 subscribers)

---

### Option 3: Web Push Protocol (Self-Hosted)

**Pros:**
- ✅ Full control
- ✅ No third-party dependency
- ✅ No cost

**Cons:**
- ⚠️ Complex setup (VAPID keys, push service)
- ⚠️ Requires server infrastructure
- ⚠️ More maintenance

**Implementation Complexity:** High  
**Cost:** Free (but requires server resources)

---

## 🎯 Recommended Solution: Firebase Cloud Messaging (FCM)

### Why FCM?

1. **Already Using Firebase** - Auth and Firestore are in place
2. **Unified Stack** - One service for all backend needs
3. **Reliable** - Google's infrastructure
4. **Free** - No cost for unlimited notifications
5. **Cross-Platform** - Works everywhere

---

## 📋 Implementation Plan

### Phase 1: FCM Setup (1-2 hours)

#### 1.1 Firebase Project Configuration

1. **Enable FCM in Firebase Console:**
   - Go to Firebase Console → Project Settings → Cloud Messaging
   - Enable Firebase Cloud Messaging
   - Generate Web Push certificate (for web)
   - Upload APNs certificate (for iOS)

2. **Get FCM Configuration:**
   - Web: Get `firebase-messaging-sw.js` and config
   - iOS: Get `GoogleService-Info.plist`
   - Android: Get `google-services.json`

#### 1.2 Install Firebase SDK

```bash
npm install firebase
# Already installed, verify version
```

#### 1.3 Service Worker Setup

Create `public/firebase-messaging-sw.js`:

```javascript
// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.x.x/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.x.x/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'TopDog Draft';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.message,
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    data: payload.data,
    tag: `draft-alert-${payload.data?.roomId}-${payload.data?.type}`,
    requireInteraction: payload.data?.type === 'on_the_clock',
    vibrate: [200, 100, 200],
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data;
  if (data?.roomId) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(data.roomId) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(`/draft/topdog/${data.roomId}`);
        }
      })
    );
  }
});
```

---

### Phase 2: Client-Side Integration (2-3 hours)

#### 2.1 Create FCM Service

**File:** `lib/pushNotifications/fcmService.ts`

```typescript
/**
 * Firebase Cloud Messaging Service
 * 
 * Handles push notification subscription and token management
 */

import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// FCM configuration (from Firebase Console)
const FCM_CONFIG = {
  vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY || '',
};

class FCMService {
  private messaging: Messaging | null = null;
  private token: string | null = null;

  /**
   * Initialize FCM (client-side only)
   */
  async initialize(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (!('Notification' in window)) return false;
    if (!('serviceWorker' in navigator)) return false;

    try {
      const { initializeApp, getApps } = await import('firebase/app');
      const firebaseConfig = {
        // Your Firebase config
      };

      if (getApps().length === 0) {
        initializeApp(firebaseConfig);
      }

      const { getMessaging } = await import('firebase/messaging');
      this.messaging = getMessaging();

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('[FCM] Notification permission denied');
        return false;
      }

      // Get FCM token
      this.token = await getToken(this.messaging, {
        vapidKey: FCM_CONFIG.vapidKey,
      });

      if (this.token) {
        await this.saveTokenToFirestore(this.token);
        console.log('[FCM] Token obtained:', this.token);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[FCM] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Save FCM token to user's Firestore document
   */
  private async saveTokenToFirestore(token: string): Promise<void> {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getFirestore();
    const userRef = doc(db, 'users', user.uid);

    await setDoc(
      userRef,
      {
        fcmToken: token,
        fcmTokenUpdatedAt: new Date(),
      },
      { merge: true }
    );
  }

  /**
   * Get current FCM token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Listen for foreground messages
   */
  onMessage(callback: (payload: any) => void): () => void {
    if (!this.messaging) return () => {};

    const unsubscribe = onMessage(this.messaging, callback);
    return unsubscribe;
  }
}

export const fcmService = new FCMService();
```

#### 2.2 Integrate with Alert System

**File:** `lib/draftAlerts/pushNotifications.ts` (NEW)

```typescript
/**
 * Push Notification Delivery
 * 
 * Sends push notifications via FCM for alerts
 */

import { fcmService } from '../pushNotifications/fcmService';
import { DraftAlertState } from './types';

/**
 * Send push notification via FCM
 * This is called from the server/backend
 */
export async function sendPushNotification(
  userId: string,
  alertState: DraftAlertState
): Promise<boolean> {
  // This would be called from a server-side function
  // For now, we'll implement client-side fallback
  
  // In production, this would be:
  // 1. Server receives alert trigger
  // 2. Server looks up user's FCM token from Firestore
  // 3. Server sends push via FCM Admin SDK
  // 4. FCM delivers to device
  
  return false;
}
```

---

### Phase 3: Server-Side Push (2-3 hours)

#### 3.1 Firebase Functions

**File:** `functions/src/draftAlerts.ts` (NEW)

```typescript
/**
 * Cloud Function: Send Draft Alert Push Notification
 * 
 * Triggered when draft alert should be sent
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { DraftAlertType } from '../../lib/draftAlerts/types';

interface AlertPayload {
  roomId: string;
  alertType: DraftAlertType;
  message: string;
  data?: Record<string, unknown>;
}

export const sendDraftAlert = functions.https.onCall(
  async (data: AlertPayload, context) => {
    // Verify user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = context.auth.uid;
    const { roomId, alertType, message, data: alertData } = data;

    // Get user's FCM token
    const userDoc = await admin.firestore().doc(`users/${userId}`).get();
    const fcmToken = userDoc.data()?.fcmToken;

    if (!fcmToken) {
      console.warn(`[FCM] No token for user ${userId}`);
      return { success: false, reason: 'no_token' };
    }

    // Send push notification
    const message: admin.messaging.Message = {
      token: fcmToken,
      notification: {
        title: 'TopDog Draft',
        body: message,
      },
      data: {
        type: alertType,
        roomId,
        url: `/draft/topdog/${roomId}`,
        ...alertData,
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      webpush: {
        notification: {
          icon: '/icon-192x192.png',
          badge: '/icon-96x96.png',
          requireInteraction: alertType === 'on_the_clock',
          vibrate: [200, 100, 200],
        },
      },
    };

    try {
      await admin.messaging().send(message);
      return { success: true };
    } catch (error) {
      console.error('[FCM] Send failed:', error);
      return { success: false, error: String(error) };
    }
  }
);
```

#### 3.2 Trigger from Alert Manager

**File:** `lib/draftAlerts/alertManager.ts` (UPDATE)

Add push notification call:

```typescript
// In triggerAlert method, after showing local notification:
if (this.config?.isPushNotificationEnabled) {
  // Call Firebase Function to send push
  const sendPush = httpsCallable(functions, 'sendDraftAlert');
  await sendPush({
    roomId: context.roomId,
    alertType,
    message: this.getAlertMessage(alertType, context),
    data: alertState.data,
  }).catch(err => {
    console.warn('[DraftAlerts] Push notification failed:', err);
  });
}
```

---

### Phase 4: Sandbox Mode Support (1 hour)

#### 4.1 Development Mode

For sandbox/testing, we can use local notifications that simulate push:

**File:** `lib/draftAlerts/pushNotificationsSandbox.ts`

```typescript
/**
 * Sandbox Push Notifications
 * 
 * Simulates push notifications during development
 * Uses local notifications with delayed delivery
 */

export async function sendSandboxPush(
  alertState: DraftAlertState,
  delayMs: number = 0
): Promise<boolean> {
  // In sandbox mode, use local notifications
  // but simulate push behavior (works when tab is hidden)
  
  if (typeof window === 'undefined') return false;
  
  // Wait for delay (simulate network latency)
  if (delayMs > 0) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  // Check if tab is hidden (simulates app being closed)
  if (document.visibilityState === 'hidden') {
    // Use service worker notification
    const registration = await navigator.serviceWorker?.ready;
    if (registration) {
      await registration.showNotification('TopDog Draft', {
        body: alertState.message,
        icon: '/icon-192x192.png',
        tag: `sandbox-${alertState.roomId}-${alertState.type}`,
        data: {
          url: `/draft/topdog/${alertState.roomId}`,
          ...alertState.data,
        },
      });
      return true;
    }
  }
  
  return false;
}
```

---

## 📱 Device Support Matrix

| Device Type | Current Solution | Push Solution |
|------------|------------------|---------------|
| **iPhone 14 Pro+ (iOS 16.1+)** | Dynamic Island | FCM Push (fallback) |
| **iPhone (older)** | Web Notifications | FCM Push |
| **Android** | Web Notifications | FCM Push |
| **Desktop (Chrome/Firefox)** | Web Notifications | FCM Push |
| **Desktop (Safari)** | Web Notifications | FCM Push (limited) |
| **iPad** | Web Notifications | FCM Push |

---

## 🎯 Implementation Priority

### Phase 1: Sandbox Mode (Immediate)
- ✅ Use existing web notifications
- ✅ Add sandbox simulation for closed app
- ✅ Test with tab hidden

### Phase 2: FCM Integration (Next Sprint)
- ⏳ Set up FCM in Firebase
- ⏳ Create FCM service
- ⏳ Integrate with alert manager
- ⏳ Test on all devices

### Phase 3: Server-Side Push (Future)
- ⏳ Create Cloud Function
- ⏳ Set up token management
- ⏳ Production deployment

---

## 🔧 Quick Start: Sandbox Mode

For immediate sandbox testing, the current web notification system works when:
- ✅ Browser tab is open (even if hidden)
- ✅ Service worker is registered
- ✅ Notification permission granted

**To test "closed app" behavior:**
1. Open draft room
2. Switch to another tab
3. Trigger alert condition
4. Notification appears even though tab is hidden

---

## 📊 Current Coverage

### ✅ Works Now (No Additional Work)
- Web notifications when tab is open/hidden
- All 5 alert types
- Click to open draft room
- User preferences

### ⏳ Needs Implementation
- True push when app is completely closed
- FCM integration
- Server-side push delivery
- Token management

---

## 💡 Recommendation

**For Sandbox Mode:**
- ✅ Use current web notifications (already works)
- ✅ Test with tab hidden to simulate closed app
- ✅ Document limitations

**For Production:**
- ⏳ Implement FCM Phase 1-2 (client-side)
- ⏳ Add server-side push (Phase 3) when ready
- ⏳ Gradual rollout to users

---

## 📝 Next Steps

1. **Immediate:** Document current web notification capabilities
2. **Short-term:** Set up FCM for true push notifications
3. **Long-term:** Server-side push delivery for closed app

**Estimated Time:**
- Sandbox testing: ✅ Ready now
- FCM setup: 4-6 hours
- Full production: 1-2 days
