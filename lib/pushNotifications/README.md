# Push Notifications - FCM Service

This directory contains the Firebase Cloud Messaging (FCM) client-side service for push notifications.

## Files

- `fcmService.ts` - Main FCM service for token management and foreground message handling

## Usage

### Initialize FCM (User Interaction Required)

```typescript
import { fcmService } from '@/lib/pushNotifications/fcmService';

// MUST be called from a user interaction (button click)
// NOT from useEffect without interaction
const token = await fcmService.requestPermissionAndGetToken();
```

### Listen for Foreground Messages

```typescript
const unsubscribe = fcmService.onMessage((payload) => {
  console.log('Foreground message:', payload);
  // Handle notification when app is open
});

// Cleanup
unsubscribe();
```

### Delete Token (Disable)

```typescript
await fcmService.deleteToken();
```

## Service Worker

The service worker (`public/firebase-messaging-sw.js`) handles background messages when the app is closed.

**IMPORTANT:** Update the Firebase config in `public/firebase-messaging-sw.js` with your actual values before deploying.

## Environment Variables

Required in `.env.local`:

```bash
NEXT_PUBLIC_FCM_VAPID_KEY=your_vapid_key
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## iOS Requirements

For iOS to receive push notifications:
1. User must add app to Home Screen (PWA)
2. APNs certificate must be configured in Firebase Console
