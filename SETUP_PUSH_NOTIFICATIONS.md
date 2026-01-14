# Push Notifications Setup Guide

**Quick start guide for setting up push notifications**

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Firebase Console Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Cloud Messaging**
4. Enable **Firebase Cloud Messaging**
5. Under **Web Push certificates**, click **Generate key pair**
6. Copy the **VAPID key** (you'll need it in Step 2)

### Step 2: Environment Variables

Add to `.env.local`:

```bash
# FCM VAPID Key (from Step 1)
NEXT_PUBLIC_FCM_VAPID_KEY=your_vapid_key_here

# Firebase Config (should already exist)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Step 3: Generate Service Worker

```bash
npm run generate-sw
```

This generates `public/firebase-messaging-sw.js` with your Firebase config.

### Step 4: Install & Deploy Functions

```bash
cd functions
npm install
npm run build
npm run deploy
```

### Step 5: Test

1. Start your dev server: `npm run dev`
2. Go to Profile Settings → Preferences
3. Click **Enable** under "Background Push Notifications"
4. Grant notification permission when prompted
5. Verify token appears in Firestore (`users/{userId}` document)

---

## ✅ Verification Checklist

- [ ] FCM enabled in Firebase Console
- [ ] VAPID key generated and added to `.env.local`
- [ ] Service worker generated (`npm run generate-sw`)
- [ ] Firebase Functions deployed (`cd functions && npm run deploy`)
- [ ] User can enable FCM in preferences
- [ ] Token saved to Firestore
- [ ] Test notification received

---

## 🧪 Testing Scenarios

### Test 1: Enable FCM
1. Open Profile Settings
2. Click "Enable" under Background Push Notifications
3. Grant permission
4. Check Firestore: `users/{userId}` should have `fcmToken` and `fcmEnabled: true`

### Test 2: Receive Notification
1. User A makes a pick in draft room
2. User B (who has FCM enabled) should receive "On The Clock" notification
3. Click notification → should open draft room

### Test 3: Disconnected Picker (Reliability Test)
1. User A enables "Offline Mode" in DevTools Network tab
2. User A makes a pick
3. User B should **still** receive notification (server-side trigger)

---

## 📱 iOS Setup (Additional Steps)

For iOS to receive push notifications:

1. **Add APNs Certificate:**
   - Firebase Console → Cloud Messaging → Apple app configuration
   - Upload your APNs certificate

2. **User Must Add to Home Screen:**
   - User taps Share → Add to Home Screen
   - App must be installed as PWA

3. **Verify:**
   - Check `window.navigator.standalone === true`
   - UI will show warning if not installed

---

## 🔧 Troubleshooting

### Token Not Obtained
- Check VAPID key is correct in `.env.local`
- Verify notification permission granted
- Check browser console for errors
- Ensure service worker is registered

### Push Not Received
- Verify token exists in Firestore
- Check Cloud Function logs: `cd functions && npm run logs`
- Verify user preferences allow the alert type
- Check FCM is enabled in Firebase Console

### Service Worker Not Working
- Run `npm run generate-sw` to regenerate
- Clear browser cache
- Check `public/firebase-messaging-sw.js` has correct config
- Verify service worker is registered in DevTools → Application → Service Workers

---

## 📚 Additional Resources

- **Handoff Document:** `PUSH_NOTIFICATIONS_HANDOFF.md`
- **Implementation Summary:** `IMPLEMENTATION_SUMMARY_PUSH_NOTIFICATIONS.md`
- **Functions README:** `functions/README.md`
- **FCM Service README:** `lib/pushNotifications/README.md`

---

**Status:** Ready for setup! Follow the 5 steps above to enable push notifications. 🚀
