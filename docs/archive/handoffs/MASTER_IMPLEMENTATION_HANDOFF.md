# Master Implementation Handoff
## TopDog Best Ball (Draft Alerts & UI Rebuild)

**Project:** TopDog Best Ball  
**Date:** January 14, 2026  
**Status:** 🟢 **APPROVED FOR IMMEDIATE EXECUTION**  
**Priority:** High  
**Estimated Time:** 6-8 hours total (Part A: 3-4 hours, Part B: 3-4 hours)

---

## 📚 Table of Contents

- [Part A: Push Notifications (Server-Side Architecture)](#part-a-push-notifications-server-side-architecture)
- [Part B: Tournament Card V3 (The "Flex-in-Grid" Rebuild)](#part-b-tournament-card-v3-the-flex-in-grid-rebuild)
- [Final Execution Steps](#final-execution-steps)

---

# Part A: Push Notifications (Server-Side Architecture)

## Refinement Summary

This plan replaces the previous "Client-Triggered" model with a **Firestore-Triggered** model. This guarantees alert delivery even if the user picking a player disconnects immediately.

**Key Change:** Alerts are now triggered by Firestore document updates, not client-side events. This ensures reliability.

## Architecture Overview

```
User Action → Firestore Update → Cloud Function Trigger → FCM Send → Device
```

**Critical Requirement:** iOS users MUST install the app as a PWA (Add to Home Screen) to receive Web Push notifications.

## Phase 1: Client-Side Setup & Permissions

### File: `lib/pushNotifications/fcmService.ts`

**Action:** Implement the service with explicit user-interaction triggers for permission requests.

**Complete Implementation:**

```typescript
/**
 * FCM Service - Firebase Cloud Messaging for Web Push Notifications
 * 
 * Handles permission requests, token management, and token storage.
 * MUST be called via UI interaction (button click) for permission requests.
 * 
 * @module fcmService
 */

import { getMessaging, getToken, Messaging, onMessage } from 'firebase/messaging';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';

// ============================================================================
// CONFIGURATION
// ============================================================================

const VAPID_KEY = process.env.NEXT_PUBLIC_FCM_VAPID_KEY || '';

interface FCMConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Firebase config - update with your actual values
const firebaseConfig: FCMConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// ============================================================================
// FCM SERVICE CLASS
// ============================================================================

class FCMService {
  private messaging: Messaging | null = null;
  private app: FirebaseApp | null = null;

  /**
   * Initialize Firebase App
   * Call this once on app startup
   */
  async initializeApp(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Initialize Firebase app if not already initialized
      if (getApps().length === 0) {
        this.app = initializeApp(firebaseConfig);
      } else {
        this.app = getApps()[0];
      }

      // Initialize messaging
      this.messaging = getMessaging(this.app);
      
      // Set up foreground message handler
      onMessage(this.messaging, (payload) => {
        console.log('[FCM] Message received in foreground:', payload);
        // Handle foreground notifications here
        // You can show a custom notification UI
      });
    } catch (error) {
      console.error('[FCM] Initialization error:', error);
    }
  }

  /**
   * Request Permission and Get Token
   * 
   * MUST be called via UI interaction (e.g., button click)
   * This is required by browsers for security reasons.
   * 
   * @returns FCM token if permission granted, null otherwise
   */
  async requestPermissionAndGetToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    try {
      // 1. Register Service Worker explicitly with correct scope
      const registration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js',
        { scope: '/' }
      );

      // 2. Wait for Active State
      await navigator.serviceWorker.ready;

      // 3. Request Browser Permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // 4. Get Token using the specific registration
      // This solves the Next.js/PWA scope issues
      if (!this.messaging) {
        await this.initializeApp();
      }

      if (!this.messaging) {
        throw new Error('Messaging not initialized');
      }

      const token = await getToken(this.messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        await this.saveTokenToFirestore(token);
        return token;
      }

      return null;
    } catch (error) {
      console.error('[FCM] Error requesting permission:', error);
      return null;
    }
  }

  /**
   * Save FCM token to Firestore
   * Stores token in user document for server-side access
   */
  private async saveTokenToFirestore(token: string): Promise<void> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        console.warn('[FCM] No authenticated user, cannot save token');
        return;
      }

      const db = getFirestore();
      const userRef = doc(db, 'users', user.uid);

      await setDoc(
        userRef,
        {
          fcmToken: token,
          fcmTokenUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log('[FCM] Token saved to Firestore');
    } catch (error) {
      console.error('[FCM] Error saving token:', error);
    }
  }

  /**
   * Get current FCM token (if already granted)
   * Does not request permission
   */
  async getCurrentToken(): Promise<string | null> {
    if (typeof window === 'undefined' || !this.messaging) {
      return null;
    }

    try {
      const token = await getToken(this.messaging, {
        vapidKey: VAPID_KEY,
      });
      return token;
    } catch (error) {
      console.error('[FCM] Error getting token:', error);
      return null;
    }
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Check current permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined') return 'default';
    return Notification.permission;
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const fcmService = new FCMService();

// Initialize on module load (client-side only)
if (typeof window !== 'undefined') {
  fcmService.initializeApp().catch(console.error);
}
```

### File: `public/firebase-messaging-sw.js`

**Action:** Create service worker for handling background push notifications.

**Complete Implementation:**

```javascript
/**
 * Firebase Cloud Messaging Service Worker
 * 
 * Handles background push notifications when app is not in foreground.
 * Must be in /public directory to be accessible at root scope.
 */

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in service worker
firebase.initializeApp({
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'TopDog Alert';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192x192.png', // Update with your icon path
    badge: '/badge-72x72.png', // Update with your badge path
    tag: payload.data?.roomId || 'default',
    data: payload.data,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  event.notification.close();

  // Open app to specific route if data contains roomId
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
```

## Phase 2: Server-Side Triggers (The Logic Core)

### File: `functions/src/draftTriggers.ts` (NEW)

**Action:** Create the Firestore listener that acts as the source of truth for alerts.

**Complete Implementation:**

```typescript
/**
 * Draft Triggers - Firestore-triggered push notifications
 * 
 * Architecture:
 * - Listens to Firestore draft document updates
 * - Detects state changes (on the clock, draft started, etc.)
 * - Sends push notifications via FCM
 * 
 * This replaces client-triggered notifications for reliability.
 * 
 * @module draftTriggers
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// ============================================================================
// MAIN TRIGGER: Draft Document Update
// ============================================================================

/**
 * Triggered when a draft document is updated
 * 
 * Detects:
 * - "On The Clock" changes (currentUserId changes)
 * - Draft status changes (pending -> active)
 * - Other draft state changes
 */
export const onDraftUpdate = functions.firestore
  .document('drafts/{draftId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const previousData = change.before.data();
    const draftId = context.params.draftId;

    console.log(`[DraftTrigger] Draft ${draftId} updated`);

    // ========================================
    // 1. Detect "On The Clock" Change
    // ========================================
    const newClockId = newData.currentUserId;
    const oldClockId = previousData.currentUserId;

    // If the clock has moved to a NEW user
    if (newClockId && newClockId !== oldClockId) {
      console.log(`[DraftTrigger] Clock moved to user ${newClockId}`);
      
      await sendPushToUser(newClockId, {
        title: 'You are on the clock!',
        body: `It's your turn in ${newData.draftName || 'the draft'}`,
        type: 'on_the_clock',
        roomId: draftId,
      });
    }

    // ========================================
    // 2. Detect "Draft Started"
    // ========================================
    if (newData.status === 'active' && previousData.status === 'pending') {
      console.log(`[DraftTrigger] Draft ${draftId} started`);
      
      const userIds = Object.keys(newData.participants || {});
      
      await Promise.all(
        userIds.map((uid) =>
          sendPushToUser(uid, {
            title: 'Draft Starting!',
            body: 'The draft room is open.',
            type: 'draft_starting',
            roomId: draftId,
          })
        )
      );
    }

    // ========================================
    // 3. Detect "Draft Completed"
    // ========================================
    if (newData.status === 'completed' && previousData.status !== 'completed') {
      console.log(`[DraftTrigger] Draft ${draftId} completed`);
      
      const userIds = Object.keys(newData.participants || {});
      
      await Promise.all(
        userIds.map((uid) =>
          sendPushToUser(uid, {
            title: 'Draft Complete!',
            body: 'Your draft has finished.',
            type: 'draft_complete',
            roomId: draftId,
          })
        )
      );
    }

    return null;
  });

// ============================================================================
// HELPER: Send Push Notification to User
// ============================================================================

/**
 * Validate user preferences and send push notification
 * 
 * @param userId - User ID to send notification to
 * @param payload - Notification payload
 */
async function sendPushToUser(
  userId: string,
  payload: {
    title: string;
    body: string;
    type: 'on_the_clock' | 'draft_starting' | 'draft_complete';
    roomId: string;
  }
): Promise<void> {
  try {
    // 1. Get user document
    const userDoc = await admin.firestore().doc(`users/${userId}`).get();
    
    if (!userDoc.exists) {
      console.warn(`[DraftTrigger] User ${userId} not found`);
      return;
    }

    const userData = userDoc.data();
    if (!userData) {
      console.warn(`[DraftTrigger] User ${userId} has no data`);
      return;
    }

    // 2. Get FCM token
    const token = userData.fcmToken;
    if (!token) {
      console.log(`[DraftTrigger] User ${userId} has no FCM token`);
      return;
    }

    // 3. Check user preferences
    const prefs = userData.preferences?.draftAlerts;
    if (prefs?.[payload.type] === false) {
      console.log(`[DraftTrigger] User ${userId} has disabled ${payload.type} alerts`);
      return;
    }

    // 4. Send notification
    const message: admin.messaging.Message = {
      token: token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        roomId: payload.roomId,
        type: payload.type,
        url: `/draft/topdog/${payload.roomId}`, // Deep link
      },
      // Platform specific configs for PWA/Android
      webpush: {
        fcmOptions: {
          link: `/draft/topdog/${payload.roomId}`,
        },
        notification: {
          icon: '/icon-192x192.png', // Update with your icon
          badge: '/badge-72x72.png', // Update with your badge
        },
      },
      // Android specific config
      android: {
        priority: 'high',
        notification: {
          channelId: 'draft_alerts',
          sound: 'default',
        },
      },
      // iOS specific config
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`[DraftTrigger] Successfully sent message to ${userId}:`, response);
  } catch (error: any) {
    console.error(`[DraftTrigger] Failed to send to ${userId}:`, error);

    // Handle invalid token errors
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
      console.log(`[DraftTrigger] Removing invalid token for user ${userId}`);
      
      // Remove invalid token from Firestore
      await admin.firestore().doc(`users/${userId}`).update({
        fcmToken: admin.firestore.FieldValue.delete(),
        fcmTokenUpdatedAt: admin.firestore.FieldValue.delete(),
      });
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { onDraftUpdate };
```

### File: `functions/src/index.ts`

**Action:** Export the new trigger function.

Add this export:

```typescript
// ... existing exports ...

export { onDraftUpdate } from './draftTriggers';
```

## Phase 3: UI Integration

### File: `components/vx2/settings/PushNotificationSettings.tsx` (NEW)

**Action:** Create UI component for requesting push notification permissions.

**Complete Implementation:**

```typescript
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

    setIsSupported(fcmService.isSupported());
    setPermissionStatus(fcmService.getPermissionStatus());

    // Get current token if permission already granted
    if (fcmService.getPermissionStatus() === 'granted') {
      fcmService.getCurrentToken().then(setToken);
    }
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const newToken = await fcmService.requestPermissionAndGetToken();
      setToken(newToken);
      setPermissionStatus(fcmService.getPermissionStatus());
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
```

---

# Part B: Tournament Card V3 (The "Flex-in-Grid" Rebuild)

## Refinement Summary

This architecture fixes bottom alignment issues by using a **CSS Grid Parent (Auto / 1fr / Auto)** combined with a **Flexbox Bottom Anchor**. This ensures the button and stats are always pushed to the physical bottom edge, regardless of content height.

**Key Innovation:** The "Flex-in-Grid" pattern - Grid handles layout structure, Flexbox handles bottom alignment within the grid cell.

## Architecture Diagram

```
TournamentCardV3 Container
├── Background Layers (absolute)
└── Content Grid (3 rows: auto / 1fr / auto)
    ├── Row 1: Title (auto)
    ├── Row 2: Spacer (1fr - flexible)
    └── Row 3: Bottom Anchor (auto)
        └── Flexbox Container (justifyContent: flex-end)
            └── BottomSectionV3 (grid with fixed heights)
```

## Phase 1: The Spacing Contract (Immutable)

### File: `components/vx2/tabs/lobby/constants/cardSpacingV3.ts` (NEW)

**Action:** Create immutable spacing constants for V3.

**Complete Implementation:**

```typescript
/**
 * Tournament Card V3 Spacing System
 * 
 * Immutable spacing contract for TournamentCardV3.
 * All spacing values are different from V2.
 * 
 * @module cardSpacingV3
 */

// ============================================================================
// SPACING CONSTANTS (IMMUTABLE)
// ============================================================================

/**
 * All spacing values for tournament card V3
 * 
 * These values are DIFFERENT from V2:
 * - Larger padding (24px vs 21px)
 * - Larger gaps (20px/28px vs 16px/24px)
 * - Larger component heights (60px/52px vs 57px/48px)
 */
export const CARD_SPACING_V3 = {
  // ========================================
  // CONTAINER
  // ========================================
  
  /** Outer padding - LARGER than V2 (24px vs 21px) */
  outerPadding: 24,
  
  /** Border radius - Slightly larger than V2 */
  borderRadius: 18,
  
  /** Minimum card height - Different from V2 */
  minHeight: 650,

  // ========================================
  // TYPOGRAPHY & CONTENT
  // ========================================
  
  /** Title font size - Slightly larger than V2 */
  titleFontSize: 48,
  
  /** Title line height - Different from V2 */
  titleLineHeight: 1.15,
  
  /** Title margin top - DIFFERENT from V2 (16px vs 12px) */
  titleMarginTop: 16,

  // ========================================
  // LAYOUT GAPS
  // ========================================
  
  /** Minimum spacer height - DIFFERENT from V2 (32px vs 24px) */
  spacerMinHeight: 32,
  
  /** Gap between bottom section rows - DIFFERENT from V2 (20px vs 16px) */
  bottomRowGap: 20,
  
  /** Gap between stat items - DIFFERENT from V2 (28px vs 24px) */
  bottomStatsGap: 28,

  // ========================================
  // FIXED HEIGHTS (Critical for layout stability)
  // ========================================
  
  /** Progress bar height - DIFFERENT from V2 (10px vs 8px) */
  progressHeight: 10,
  
  /** Join button height - DIFFERENT from V2 (60px vs 57px) */
  buttonHeight: 60,
  
  /** Stats row height - DIFFERENT from V2 (52px vs 48px) */
  statsHeight: 52,
  
  // ========================================
  // FONT SIZES
  // ========================================
  
  /** Button font size - DIFFERENT from V2 (15px vs 14px) */
  buttonFontSize: 15,
  
  /** Stats value font size - DIFFERENT from V2 (20px vs 18px) */
  statsValueFontSize: 20,
  
  /** Stats label font size - DIFFERENT from V2 (13px vs 12px) */
  statsLabelFontSize: 13,
  
  // ========================================
  // STYLING
  // ========================================
  
  /** Button border radius - DIFFERENT from V2 (10px vs 8px) */
  buttonBorderRadius: 10,
} as const;

// ============================================================================
// GRID TEMPLATES
// ============================================================================

/**
 * Grid template for bottom section
 * Fixed-height rows prevent layout shifts
 */
export const BOTTOM_GRID_V3 = {
  /** Template WITH progress bar */
  withProgress: `${CARD_SPACING_V3.progressHeight}px ${CARD_SPACING_V3.buttonHeight}px ${CARD_SPACING_V3.statsHeight}px`,
  
  /** Template WITHOUT progress bar */
  withoutProgress: `${CARD_SPACING_V3.buttonHeight}px ${CARD_SPACING_V3.statsHeight}px`,
} as const;

/**
 * Grid template for main card
 * The "Flex-in-Grid" Secret Sauce: auto / 1fr / auto
 * 
 * - Row 1 (auto): Title sizes to content
 * - Row 2 (1fr): Spacer takes remaining space
 * - Row 3 (auto): Bottom section sizes to content, but flexbox pushes it down
 */
export const CARD_GRID_V3 = {
  /** The critical template string */
  template: `auto 1fr auto`,
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CardSpacingV3Key = keyof typeof CARD_SPACING_V3;
export type CardSpacingV3Type = typeof CARD_SPACING_V3;

// Default export
export default CARD_SPACING_V3;
```

## Phase 2: The Bottom Section (Presentation)

### File: `components/vx2/tabs/lobby/TournamentCardBottomSectionV3.tsx` (NEW)

**Action:** Create bottom section component with fixed-height grid rows.

**Complete Implementation:**

```typescript
/**
 * TournamentCardBottomSectionV3 - Bottom section with new spacing
 * 
 * Architecture:
 * - CSS Grid with fixed row heights (prevents layout shifts)
 * - Uses V3 spacing constants throughout
 * - No alignSelf - parent handles positioning with flexbox
 * 
 * @module TournamentCardBottomSectionV3
 */

import React from 'react';
import { ProgressBar } from '../../components/shared';
import { TILED_BG_STYLE } from '../../draft-room/constants';
import type { Tournament } from '../../hooks/data';
import { CARD_SPACING_V3, BOTTOM_GRID_V3 } from './constants/cardSpacingV3';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BottomSectionV3Props {
  /** Tournament data object */
  tournament: Tournament;
  /** Callback when join button is clicked */
  onJoinClick?: () => void;
  /** Style overrides */
  styleOverrides?: {
    buttonBackground?: string;
    buttonBackgroundColor?: string;
    progressBg?: string;
  };
}

interface StatItemProps {
  value: string;
  label: string;
}

// ============================================================================
// SUB-COMPONENT: StatItem
// ============================================================================

/**
 * StatItem - Single statistic display (value + label)
 * 
 * Uses V3 spacing values for fonts and padding
 */
function StatItem({ value, label }: StatItemProps): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Value */}
      <span
        className="vx2-tournament-stat-value-v3"
        style={{
          fontSize: `${CARD_SPACING_V3.statsValueFontSize}px`,
          fontWeight: 'bold',
          color: '#FFFFFF',
          backgroundColor: '#000000',
          padding: '3px 8px',
          borderRadius: '5px',
        }}
      >
        {value}
      </span>
      
      {/* Label */}
      <span
        className="vx2-tournament-stat-label-v3"
        style={{
          fontSize: `${CARD_SPACING_V3.statsLabelFontSize}px`,
          color: 'rgba(255, 255, 255, 0.7)',
          backgroundColor: '#000000',
          padding: '2px 6px',
          borderRadius: '4px',
          marginTop: '3px',
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: BottomSectionV3
// ============================================================================

/**
 * BottomSectionV3 - Tournament card bottom section
 * 
 * Contains:
 * - Progress bar (optional, based on tournament.maxEntries)
 * - Join button
 * - Stats grid (Entry fee, Entries, 1st Place prize)
 * 
 * Uses V3 spacing constants throughout.
 * Fixed-height rows prevent layout shifts.
 */
export function BottomSectionV3({
  tournament,
  onJoinClick,
  styleOverrides = {},
}: BottomSectionV3Props): React.ReactElement {
  // ----------------------------------------
  // Calculate progress percentage
  // ----------------------------------------
  const hasProgress = Boolean(tournament.maxEntries && tournament.maxEntries > 0);
  const fillPercentage = tournament.maxEntries
    ? Math.round((tournament.currentEntries / tournament.maxEntries) * 100)
    : 0;

  // ----------------------------------------
  // Resolve style overrides
  // ----------------------------------------
  const progressBg = styleOverrides.progressBg ?? 'rgba(55, 65, 81, 0.5)';

  // ----------------------------------------
  // Render
  // ----------------------------------------
  return (
    <div
      className="vx2-tournament-bottom-section-v3"
      style={{
        // ========================================
        // CSS GRID with FIXED row heights
        // Strict fixed-height rows prevent layout shifts
        // ========================================
        display: 'grid',
        gridTemplateRows: hasProgress
          ? BOTTOM_GRID_V3.withProgress
          : BOTTOM_GRID_V3.withoutProgress,
        gap: `${CARD_SPACING_V3.bottomRowGap}px`,
        
        // ========================================
        // Positioning
        // ========================================
        width: '100%',
        
        // ========================================
        // CSS CONTAINMENT
        // ========================================
        contain: 'layout paint',
      }}
    >
      {/* ========================================
          Row 1: Progress Bar (conditional)
          Height: 10px fixed (V3)
          ======================================== */}
      {hasProgress && (
        <div
          className="vx2-progress-section-v3"
          style={{
            height: `${CARD_SPACING_V3.progressHeight}px`,
            display: 'flex',
            alignItems: 'center',
            contain: 'layout',
          }}
        >
          <ProgressBar
            value={fillPercentage}
            fillBackgroundImage="url(/wr_blue.png)"
            backgroundColor={progressBg}
            size="md"
          />
        </div>
      )}

      {/* ========================================
          Row 2: Join Button
          Height: 60px fixed (V3)
          ======================================== */}
      <button
        onClick={onJoinClick}
        className="vx2-tournament-button-v3"
        style={{
          // ----------------------------------------
          // Background (tiled or custom)
          // ----------------------------------------
          ...(styleOverrides.buttonBackground ? {} : TILED_BG_STYLE),
          ...(styleOverrides.buttonBackground
            ? {
                backgroundImage: styleOverrides.buttonBackground,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : {}),
          ...(styleOverrides.buttonBackgroundColor
            ? {
                backgroundColor: styleOverrides.buttonBackgroundColor,
              }
            : {}),

          // ----------------------------------------
          // FIXED dimensions - all three are set
          // ----------------------------------------
          height: `${CARD_SPACING_V3.buttonHeight}px`,
          minHeight: `${CARD_SPACING_V3.buttonHeight}px`,
          maxHeight: `${CARD_SPACING_V3.buttonHeight}px`,

          // ----------------------------------------
          // Typography
          // ----------------------------------------
          color: '#FFFFFF',
          fontSize: `${CARD_SPACING_V3.buttonFontSize}px`,
          fontWeight: 600,

          // ----------------------------------------
          // Appearance
          // ----------------------------------------
          width: '100%',
          borderRadius: `${CARD_SPACING_V3.buttonBorderRadius}px`,
          border: 'none',
          cursor: 'pointer',

          // ----------------------------------------
          // Interaction
          // ----------------------------------------
          transition: 'background-color 0.2s ease',

          // ----------------------------------------
          // CSS containment
          // ----------------------------------------
          contain: 'layout style',
        }}
        aria-label={`Join ${tournament.title} for ${tournament.entryFee}`}
      >
        Join Tournament
      </button>

      {/* ========================================
          Row 3: Stats Grid
          Height: 52px fixed (V3)
          ======================================== */}
      <div
        className="vx2-tournament-stats-v3"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: `${CARD_SPACING_V3.bottomStatsGap}px`,
          height: `${CARD_SPACING_V3.statsHeight}px`,
          alignContent: 'center',
          contain: 'layout',
        }}
      >
        <StatItem value={tournament.entryFee} label="Entry" />
        <StatItem value={tournament.totalEntries} label="Entries" />
        <StatItem value={tournament.firstPlacePrize} label="1st Place" />
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default BottomSectionV3;
```

## Phase 3: The Card Container (The Layout Logic)

### File: `components/vx2/tabs/lobby/TournamentCardV3.tsx` (NEW)

**Action:** Create main card component with "Flex-in-Grid" architecture.

**CRITICAL NOTE:** Do not change the Bottom Anchor flex properties. They are essential for bottom alignment.

**Complete Implementation:**

```typescript
/**
 * TournamentCardV3 - Complete rebuild with "Flex-in-Grid" architecture
 * 
 * Architecture:
 * - CSS Grid Parent: auto / 1fr / auto
 * - Flexbox Bottom Anchor: justifyContent: flex-end
 * - This guarantees bottom content reaches the edge
 * 
 * Key Innovation: "Flex-in-Grid" pattern
 * - Grid handles layout structure
 * - Flexbox handles bottom alignment within grid cell
 * 
 * @module TournamentCardV3
 */

import React, { useState, useEffect } from 'react';
import { BG_COLORS, TEXT_COLORS } from '../../core/constants/colors';
import type { Tournament } from '../../hooks/data';
import { CARD_SPACING_V3, CARD_GRID_V3 } from './constants/cardSpacingV3';
import { BottomSectionV3 } from './TournamentCardBottomSectionV3';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Tiny blur placeholder (92 bytes) - displays instantly while full image loads
 */
const BLUR_PLACEHOLDER = 'data:image/webp;base64,UklGRlQAAABXRUJQVlA4IEgAAABwAwCdASoUABsAPyl+uFOuKCWisAwBwCUJZQAAW+q+9Bpo4aAA/uvZ+YkAc4jvVTc7+oJAY99soPLjJTrwm3j5Y3VE0BWmGAA=';

/**
 * Color constants for the card
 */
const CARD_COLORS = {
  // Background image URL (WebP with PNG fallback)
  backgroundImage: 'url(/do_riding_football_III.webp)',
  backgroundImagePng: 'url(/do_riding_football_III.png)',
  
  // Solid color fallback if images fail
  backgroundFallback: '#0a0a1a',
  
  // Border colors
  borderDefault: 'rgba(75, 85, 99, 0.5)',
  borderFeatured: '#1E3A5F',
  
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  
  // Progress bar background
  progressBackground: 'rgba(55, 65, 81, 0.5)',
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Style overrides for customization
 * Used in sandbox/testing to experiment with different styles
 */
export interface CardStyleOverridesV3 {
  /** Background CSS value (e.g., 'url(...)', 'linear-gradient(...)') */
  background?: string;
  /** Fallback background color (solid color) */
  backgroundFallback?: string;
  /** Border color */
  border?: string;
  /** Border width in pixels */
  borderWidth?: number;
  /** Accent color for featured cards */
  accent?: string;
  /** Progress bar background color */
  progressBg?: string;
  /** Card padding in pixels */
  padding?: number;
  /** Border radius in pixels */
  borderRadius?: number;
  /** Button background image/gradient */
  buttonBackground?: string;
  /** Button background solid color */
  buttonBackgroundColor?: string;
  /** Custom background image URL */
  backgroundImage?: string;
  /** Title font size in pixels (responsive override) */
  titleFontSize?: number;
  /** Minimum height in pixels (for fitting within container) */
  minHeight?: number;
}

/**
 * Props for the TournamentCardV3 component
 */
export interface TournamentCardV3Props {
  /** Tournament data object */
  tournament: Tournament;
  /** Callback when join button is clicked */
  onJoinClick?: () => void;
  /** Whether to show featured styling (accent border) */
  featured?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Style overrides for customization */
  styleOverrides?: CardStyleOverridesV3;
}

/**
 * Props for the BackgroundLayers sub-component
 */
interface BackgroundLayersProps {
  blurPlaceholder: string;
  fullImageUrl: string;
  useFallback: boolean;
  imageLoaded: boolean;
  borderRadius: number;
  originalUrl: string | null;
}

// ============================================================================
// SUB-COMPONENT: BackgroundLayers
// ============================================================================

/**
 * BackgroundLayers - Renders blur placeholder and full image
 * 
 * Architecture:
 * - Two absolutely-positioned div layers
 * - Layer 1 (z-index: 0): Blur placeholder, visible immediately
 * - Layer 2 (z-index: 1): Full image, fades in when loaded
 * 
 * These layers are position: absolute, so they do NOT affect the grid layout.
 */
function BackgroundLayers({
  blurPlaceholder,
  fullImageUrl,
  useFallback,
  imageLoaded,
  borderRadius,
  originalUrl,
}: BackgroundLayersProps): React.ReactElement {
  // Determine which image to show based on fallback status
  const displayImageUrl = useFallback && originalUrl && 
    (originalUrl.endsWith('.webp') || originalUrl.includes('.webp'))
    ? CARD_COLORS.backgroundImagePng
    : fullImageUrl;

  return (
    <>
      {/* Layer 1: Blur placeholder - shows instantly */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${blurPlaceholder})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          borderRadius: `${borderRadius - 1}px`,
          zIndex: 0,
        }}
      />
      
      {/* Layer 2: Full image - fades in when loaded */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: displayImageUrl,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          borderRadius: `${borderRadius - 1}px`,
          zIndex: 1,
          // Opacity transition for smooth fade-in
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
          // GPU acceleration for smooth animation
          willChange: 'opacity',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
        }}
      />
    </>
  );
}

// ============================================================================
// SUB-COMPONENT: TitleSection
// ============================================================================

/**
 * TitleSection - Renders the tournament title
 * 
 * Uses V3 spacing values for margins and typography
 */
function TitleSection({ 
  titleFontSize 
}: { 
  titleFontSize?: number 
}): React.ReactElement {
  const fontSize = titleFontSize ?? CARD_SPACING_V3.titleFontSize;
  
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginTop: `${CARD_SPACING_V3.titleMarginTop}px`,
        textAlign: 'center',
        contain: 'layout style',
      }}
    >
      <h2
        className="vx2-tournament-title-v3"
        style={{
          fontSize: `${fontSize}px`,
          fontFamily: "'Anton SC', sans-serif",
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          lineHeight: CARD_SPACING_V3.titleLineHeight,
          textAlign: 'center',
          color: CARD_COLORS.textPrimary,
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          margin: 0,
        }}
      >
        The TopDog<br />
        International
      </h2>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: TournamentCardV3
// ============================================================================

/**
 * TournamentCardV3 - Main tournament card component
 * 
 * Complete rebuild with "Flex-in-Grid" architecture.
 * Uses V3 spacing constants throughout.
 */
export function TournamentCardV3({
  tournament,
  onJoinClick,
  featured = false,
  className = '',
  styleOverrides = {},
}: TournamentCardV3Props): React.ReactElement {
  // ----------------------------------------
  // State
  // ----------------------------------------
  const [imageLoaded, setImageLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // ----------------------------------------
  // Resolve style overrides
  // ----------------------------------------
  
  // Determine the background image URL
  const resolvedBackground = styleOverrides.backgroundImage
    ? `url(${styleOverrides.backgroundImage})`
    : (styleOverrides.background ?? CARD_COLORS.backgroundImage);

  // Extract URL from CSS background value for preloading
  const urlMatch = resolvedBackground.match(/url\(['"]?([^'"]+)['"]?\)/);
  const backgroundUrl = urlMatch ? urlMatch[1] : null;

  // ----------------------------------------
  // Image preloading effect
  // ----------------------------------------
  useEffect(() => {
    // Skip preloading for data URLs (already embedded)
    if (!backgroundUrl || backgroundUrl.startsWith('data:')) {
      setImageLoaded(true);
      return;
    }

    const img = new Image();

    // Fallback handler for WebP images
    const tryPngFallback = () => {
      if (backgroundUrl.endsWith('.webp') || backgroundUrl.includes('.webp')) {
        const pngUrl = backgroundUrl.replace('.webp', '.png').split('?')[0];
        
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          setImageLoaded(true);
          setUseFallback(true);
        };
        fallbackImg.onerror = () => {
          // Both failed, show anyway (will use fallback color)
          setImageLoaded(true);
          setUseFallback(true);
        };
        fallbackImg.src = pngUrl;
      } else {
        setImageLoaded(true);
      }
    };

    img.onload = () => {
      setImageLoaded(true);
    };

    img.onerror = () => {
      tryPngFallback();
    };

    img.src = backgroundUrl;

    // Handle already-cached images
    if (img.complete) {
      setImageLoaded(true);
    }
  }, [backgroundUrl]);

  // ----------------------------------------
  // Compute final styles
  // ----------------------------------------
  const finalColors = {
    background: resolvedBackground,
    backgroundFallback: styleOverrides.backgroundFallback ?? CARD_COLORS.backgroundFallback,
    border: styleOverrides.border ?? CARD_COLORS.borderDefault,
    borderWidth: styleOverrides.borderWidth ?? (featured ? 3 : 1),
    accent: styleOverrides.accent ?? CARD_COLORS.borderFeatured,
    progressBg: styleOverrides.progressBg ?? CARD_COLORS.progressBackground,
  };

  const finalSizes = {
    padding: styleOverrides.padding ?? CARD_SPACING_V3.outerPadding,
    borderRadius: styleOverrides.borderRadius ?? CARD_SPACING_V3.borderRadius,
    minHeight: styleOverrides.minHeight ?? CARD_SPACING_V3.minHeight,
  };

  const borderColor = featured ? finalColors.accent : finalColors.border;

  // ----------------------------------------
  // Render
  // ----------------------------------------
  return (
    <article
      className={`vx2-tournament-card-v3 ${className}`}
      style={{
        // ========================================
        // Container Setup
        // ========================================
        position: 'relative',
        width: '100%',
        minHeight: `${finalSizes.minHeight}px`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        flexShrink: 0,
        
        // ========================================
        // Appearance
        // ========================================
        backgroundColor: finalColors.backgroundFallback,
        borderRadius: `${finalSizes.borderRadius}px`,
        border: `${finalColors.borderWidth}px solid ${borderColor}`,
        
        // ========================================
        // Positioning
        // ========================================
        overflow: 'hidden',
        
        // ========================================
        // CSS CONTAINMENT
        // ========================================
        contain: 'layout style paint',
        isolation: 'isolate',
      }}
      role="article"
      aria-label={`${tournament.title} tournament`}
    >
      {/* Background Layers - Absolute positioned, outside grid flow */}
      <BackgroundLayers
        blurPlaceholder={BLUR_PLACEHOLDER}
        fullImageUrl={finalColors.background}
        useFallback={useFallback}
        imageLoaded={imageLoaded}
        borderRadius={finalSizes.borderRadius}
        originalUrl={backgroundUrl}
      />

      {/* Content Grid - The Layout Engine */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          // ========================================
          // THE "FLEX-IN-GRID" SECRET SAUCE
          // auto / 1fr / auto
          // ========================================
          gridTemplateRows: CARD_GRID_V3.template,
          padding: `${finalSizes.padding}px`,
          zIndex: 1,
          position: 'relative',
          contain: 'layout',
          overflow: 'hidden',
        }}
      >
        {/* ========================================
            Row 1: Title
            ======================================== */}
        <TitleSection titleFontSize={styleOverrides.titleFontSize} />

        {/* ========================================
            Row 2: Spacer (Takes 1fr)
            ======================================== */}
        <div
          style={{
            minHeight: `${CARD_SPACING_V3.spacerMinHeight}px`,
          }}
          aria-hidden="true"
        />

        {/* ========================================
            Row 3: Bottom Anchor
            CRITICAL: Do not change these flex properties
            ======================================== */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end', // <--- This guarantees bottom alignment
            paddingBottom: 0,
            marginBottom: 0,
            minHeight: 0,
          }}
        >
          <BottomSectionV3
            tournament={tournament}
            onJoinClick={onJoinClick}
            styleOverrides={{
              buttonBackground: styleOverrides.buttonBackground,
              buttonBackgroundColor: styleOverrides.buttonBackgroundColor,
              progressBg: finalColors.progressBg,
            }}
          />
        </div>
      </div>
    </article>
  );
}

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

/**
 * TournamentCardSkeletonV3 - Loading state placeholder
 * 
 * Uses the same grid structure as the main card to prevent
 * layout shifts when the real content loads.
 * Uses V3 spacing constants.
 */
export function TournamentCardSkeletonV3(): React.ReactElement {
  return (
    <article
      className="vx2-tournament-card-skeleton-v3 animate-pulse"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: `${CARD_SPACING_V3.minHeight}px`,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        backgroundColor: CARD_COLORS.backgroundFallback,
        borderRadius: `${CARD_SPACING_V3.borderRadius}px`,
        border: `1px solid ${CARD_COLORS.borderDefault}`,
        overflow: 'hidden',
      }}
      aria-hidden="true"
      aria-label="Loading tournament card"
    >
      {/* Content Grid */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateRows: CARD_GRID_V3.template,
          padding: `${CARD_SPACING_V3.outerPadding}px`,
        }}
      >
        {/* Title skeleton */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            marginTop: `${CARD_SPACING_V3.titleMarginTop}px`,
          }}
        >
          <div
            style={{
              width: '70%',
              height: `${CARD_SPACING_V3.titleFontSize}px`,
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '4px',
            }}
          />
        </div>

        {/* Spacer */}
        <div
          style={{
            minHeight: `${CARD_SPACING_V3.spacerMinHeight}px`,
          }}
        />

        {/* Bottom section skeleton */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            paddingBottom: 0,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateRows: `${CARD_SPACING_V3.buttonHeight}px ${CARD_SPACING_V3.statsHeight}px`,
              gap: `${CARD_SPACING_V3.bottomRowGap}px`,
            }}
          >
            {/* Button skeleton */}
            <div
              style={{
                width: '100%',
                height: `${CARD_SPACING_V3.buttonHeight}px`,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: `${CARD_SPACING_V3.buttonBorderRadius}px`,
              }}
            />

            {/* Stats skeleton */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: `${CARD_SPACING_V3.bottomStatsGap}px`,
                height: `${CARD_SPACING_V3.statsHeight}px`,
              }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '60px',
                      height: '26px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '5px',
                      marginBottom: '4px',
                    }}
                  />
                  <div
                    style={{
                      width: '50px',
                      height: '17px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default TournamentCardV3;
```

## Phase 4: Update Exports

### File: `components/vx2/tabs/lobby/index.ts`

**Action:** Add V3 exports.

Add at the end of the file:

```typescript
// ... existing exports ...

// TournamentCardV3 exports (new rebuild with different spacing)
export { TournamentCardV3, TournamentCardSkeletonV3 } from './TournamentCardV3';
export type { TournamentCardV3Props, CardStyleOverridesV3 } from './TournamentCardV3';
export { BottomSectionV3 } from './TournamentCardBottomSectionV3';
export type { BottomSectionV3Props } from './TournamentCardBottomSectionV3';
```

---

# 🏁 Final Execution Steps

## Deploy Tournament Card V3

1. **Create the 3 files:**
   - `components/vx2/tabs/lobby/constants/cardSpacingV3.ts`
   - `components/vx2/tabs/lobby/TournamentCardBottomSectionV3.tsx`
   - `components/vx2/tabs/lobby/TournamentCardV3.tsx`

2. **Add exports to `index.ts`**

3. **Swap TournamentCardV2 for TournamentCardV3 in the Sandbox** to verify alignment

4. **Test bottom alignment** - Content should reach the bottom edge

## Deploy Push Notification Logic

1. **Add `firebase-messaging-sw.js` to `/public`**

2. **Implement `fcmService.ts`** (Phase 1)

3. **Deploy Cloud Functions `draftTriggers.ts`** (Phase 2)

4. **Test "Offline Picker" scenario:**
   - User A picks a player
   - User A goes offline immediately
   - User B should still receive alert (via Firestore trigger)

---

## ✅ Testing Checklist

### Tournament Card V3

- [ ] Card renders with V3 spacing values
- [ ] Bottom section reaches the actual bottom edge (no gap)
- [ ] Spacing is visibly different from V2 (larger values)
- [ ] All features work (progress bar, button, stats, image loading)
- [ ] Style overrides work correctly
- [ ] No layout shifts when viewport changes
- [ ] Responsive across all device sizes

### Push Notifications

- [ ] Service worker registers correctly
- [ ] Permission request works (via button click)
- [ ] Token is saved to Firestore
- [ ] Cloud function triggers on draft updates
- [ ] Notifications are sent when clock moves
- [ ] Notifications are sent when draft starts
- [ ] "Offline picker" scenario works (User A picks, goes offline, User B gets alert)
- [ ] Deep links work (clicking notification opens correct draft room)
- [ ] User preferences are respected (disabled alerts don't send)

---

## 🔍 Troubleshooting

### Tournament Card V3

**Issue: Bottom content still has a gap**

**Check:** The Bottom Anchor div MUST have:
```typescript
display: 'flex',
flexDirection: 'column',
justifyContent: 'flex-end', // CRITICAL
paddingBottom: 0,
```

**Issue: Spacing looks wrong**

**Check:** Verify you're using V3 constants:
- Import from `'./constants/cardSpacingV3'`
- Use `CARD_SPACING_V3` not `CARD_SPACING`
- Use `CARD_GRID_V3.template` not `CARD_GRID_TEMPLATE`

### Push Notifications

**Issue: Service worker not registering**

**Check:**
- File exists at `/public/firebase-messaging-sw.js`
- Service worker scope is `/`
- Browser supports service workers

**Issue: Permission denied**

**Check:**
- Permission request is triggered by user interaction (button click)
- Browser supports notifications
- Not in incognito mode (some browsers block)

**Issue: Cloud function not triggering**

**Check:**
- Function is deployed: `firebase deploy --only functions`
- Firestore document path matches: `drafts/{draftId}`
- Function logs show trigger events

**Issue: Notifications not received**

**Check:**
- Token exists in Firestore user document
- User preferences allow the alert type
- App is installed as PWA (for iOS)
- Browser allows notifications

---

## 📊 Key Differences: V2 vs V3

### Spacing Values

| Property | V2 | V3 | Difference |
|----------|----|----|------------|
| Outer Padding | 21px | 24px | +3px |
| Title Margin Top | 12px | 16px | +4px |
| Spacer Min Height | 24px | 32px | +8px |
| Bottom Row Gap | 16px | 20px | +4px |
| Bottom Stats Gap | 24px | 28px | +4px |
| Progress Height | 8px | 10px | +2px |
| Button Height | 57px | 60px | +3px |
| Stats Height | 48px | 52px | +4px |
| Button Font | 14px | 15px | +1px |
| Stats Value Font | 18px | 20px | +2px |
| Stats Label Font | 12px | 13px | +1px |
| Border Radius | 16px | 18px | +2px |
| Min Height | 700px | 650px | -50px |

### Architecture

**V2:**
- Uses `CARD_SPACING` constants
- Grid templates with getters
- More complex helper functions

**V3:**
- Uses `CARD_SPACING_V3` constants
- Simpler grid template string: `"auto 1fr auto"`
- "Flex-in-Grid" pattern for bottom alignment
- Cleaner code organization

---

## 🎓 Key Concepts

### The "Flex-in-Grid" Pattern

**Grid for structure, Flexbox for alignment:**

```typescript
// Grid creates the 3-row structure
gridTemplateRows: "auto 1fr auto"

// Flexbox within the bottom grid cell pushes content down
<div style={{
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end', // Pushes to bottom
}}>
  <BottomSectionV3 />
</div>
```

**Why this works:**
- Grid row with `'auto'` sizes to content
- But flexbox `justifyContent: 'flex-end'` pushes that content to the bottom of the cell
- Result: Content always reaches the bottom edge

### Firestore-Triggered Notifications

**Why this is better:**
- **Reliability**: Works even if user disconnects
- **Server-side**: Single source of truth
- **Scalable**: Handles multiple users automatically
- **Consistent**: Same logic for all notification types

**Flow:**
1. User picks player → Firestore document updates
2. Cloud Function triggers automatically
3. Function detects state change
4. Function sends FCM notification
5. Device receives notification

---

## 📝 Implementation Notes

### Tournament Card V3

- V3 can coexist with V2 (different component names)
- Test side-by-side in sandbox
- Once verified, can replace V2 in production
- Keep V2 for reference/rollback

### Push Notifications

- iOS requires PWA installation (Add to Home Screen)
- Android works in regular browser
- Desktop browsers fully supported
- Service worker must be at root scope (`/`)

---

## 🔗 Related Files

**Tournament Card:**
- `components/vx2/tabs/lobby/TournamentCardV2.tsx` - Previous version (reference)
- `components/vx2/tabs/lobby/TournamentCardBottomSectionV2.tsx` - Previous bottom section
- `components/vx2/tabs/lobby/constants/cardSpacing.ts` - V2 spacing (for comparison)
- `pages/testing-grounds/tournament-card-sandbox.js` - Testing environment

**Push Notifications:**
- `lib/pushNotifications/` - Client-side FCM service (if exists)
- `functions/src/` - Cloud Functions directory
- `public/` - Service worker location

---

## ✨ Success Criteria

### Tournament Card V3

1. ✅ V3 component renders with new spacing values
2. ✅ Bottom content reaches the actual bottom edge (no gap)
3. ✅ Spacing is visibly different from V2
4. ✅ All features work correctly
5. ✅ No layout shifts on viewport changes
6. ✅ Code passes linting and TypeScript checks

### Push Notifications

1. ✅ Service worker registers successfully
2. ✅ Permission request works via UI interaction
3. ✅ Token is saved to Firestore
4. ✅ Cloud function triggers on draft updates
5. ✅ Notifications are sent correctly
6. ✅ "Offline picker" scenario works
7. ✅ Deep links work correctly
8. ✅ User preferences are respected

---

**Ready to implement?** Follow the phases in order. Test each part independently before moving to the next. Both parts can be implemented in parallel if desired.
