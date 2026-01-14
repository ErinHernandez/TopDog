# Quick Setup Commands - Push Notifications

Copy and paste these commands in order:

## 1. Generate Service Worker

```bash
npm run generate-sw
```

## 2. Install Functions Dependencies

```bash
cd functions && npm install && cd ..
```

## 3. Build Functions

```bash
cd functions && npm run build && cd ..
```

## 4. Deploy Functions

```bash
cd functions && npm run deploy && cd ..
```

## 5. Verify Setup

Check that:
- `public/firebase-messaging-sw.js` has your Firebase config (not placeholders)
- `functions/lib/` directory exists with compiled JavaScript
- Functions are deployed (check Firebase Console → Functions)

---

## Before Running Commands

Make sure you have:

1. ✅ Added `NEXT_PUBLIC_FCM_VAPID_KEY` to `.env.local`
2. ✅ Firebase CLI installed: `npm install -g firebase-tools`
3. ✅ Logged in: `firebase login`
4. ✅ Selected project: `firebase use --add`

---

## One-Liner (After Firebase Console Setup)

```bash
npm run generate-sw && cd functions && npm install && npm run build && npm run deploy && cd ..
```

**Note:** This assumes you've already:
- Enabled FCM in Firebase Console
- Generated VAPID key
- Added VAPID key to `.env.local`
