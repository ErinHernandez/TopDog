/**
 * Firebase Cloud Messaging Service
 * 
 * Handles FCM token subscription and foreground message handling
 * 
 * IMPORTANT: requestPermissionAndGetToken() must be called from a user interaction (button click)
 * NOT from useEffect without interaction (browsers will block)
 */

import { getMessaging, getToken, onMessage, Messaging, isSupported } from 'firebase/messaging';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';

// FCM VAPID key from Firebase Console
const VAPID_KEY = process.env.NEXT_PUBLIC_FCM_VAPID_KEY || '';

interface FCMConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Firebase config (should match your existing config)
const getFirebaseConfig = (): FCMConfig => {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  };
};

class FCMService {
  private messaging: Messaging | null = null;
  private token: string | null = null;
  private app: FirebaseApp | null = null;
  private isInitialized = false;

  /**
   * Check if FCM is supported
   */
  async isSupported(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    return await isSupported();
  }

  /**
   * Initialize FCM - MUST be called from user interaction (button click)
   * NOT from useEffect without interaction
   * 
   * Browsers block permission requests that aren't triggered by user action
   */
  async requestPermissionAndGetToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    if (!('Notification' in window)) return null;
    if (!('serviceWorker' in navigator)) return null;

    try {
      // 1. Register Service Worker explicitly first (critical for Next.js)
      const registration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js',
        { scope: '/' }
      );

      // 2. Wait for it to be ready
      await navigator.serviceWorker.ready;

      // 3. Check if FCM is supported
      if (!(await this.isSupported())) {
        console.warn('[FCM] Not supported on this device');
        return null;
      }

      // 4. Initialize Firebase app if not already initialized
      const config = getFirebaseConfig();
      if (getApps().length === 0) {
        this.app = initializeApp(config);
      } else {
        this.app = getApps()[0];
      }

      // 5. Get messaging instance
      this.messaging = getMessaging(this.app);

      // 6. Request notification permission (must be from user interaction)
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('[FCM] Notification permission denied');
        return null;
      }

      // 7. Get FCM token using the specific service worker registration
      if (!VAPID_KEY) {
        console.warn('[FCM] VAPID key not configured');
        return null;
      }

      this.token = await getToken(this.messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration, // Critical for Next.js
      });

      if (this.token) {
        await this.saveTokenToFirestore(this.token);
        console.log('[FCM] ✅ Token obtained and saved');
        this.isInitialized = true;
        return this.token;
      }

      return null;
    } catch (error) {
      console.error('[FCM] Initialization failed:', error);
      return null;
    }
  }

  /**
   * Save FCM token to user's Firestore document
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
          fcmEnabled: true,
        },
        { merge: true }
      );

      console.log('[FCM] Token saved to Firestore');
    } catch (error) {
      console.error('[FCM] Failed to save token:', error);
    }
  }

  /**
   * Get current FCM token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Listen for foreground messages
   * These are messages received when app is open
   */
  onMessage(callback: (payload: any) => void): () => void {
    if (!this.messaging) {
      console.warn('[FCM] Messaging not initialized');
      return () => {};
    }

    const unsubscribe = onMessage(this.messaging, (payload) => {
      console.log('[FCM] Foreground message received:', payload);
      callback(payload);
    });

    return unsubscribe;
  }

  /**
   * Delete token (for logout/disable)
   */
  async deleteToken(): Promise<void> {
    if (!this.messaging || !this.token) return;

    try {
      await this.messaging.deleteToken();
      this.token = null;
      
      // Remove from Firestore
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const db = getFirestore();
        const userRef = doc(db, 'users', user.uid);
        await setDoc(
          userRef,
          {
            fcmToken: null,
            fcmEnabled: false,
          },
          { merge: true }
        );
      }
    } catch (error) {
      console.error('[FCM] Failed to delete token:', error);
    }
  }
}

// Export singleton instance
export const fcmService = new FCMService();
