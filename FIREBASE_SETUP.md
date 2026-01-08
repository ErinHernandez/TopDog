# Firebase Setup Guide

## Current Issue Resolution

The "Missing or insufficient permissions" error has been resolved by:

1. **Adding Firebase Authentication**: The app now uses anonymous authentication to access Firestore
2. **Updated Firebase Configuration**: Added proper authentication setup in `lib/firebase.js`
3. **Created Security Rules**: Added development-friendly security rules

## Firebase Security Rules Setup

### For Development (Current Setup)
The `firestore.rules` file contains permissive rules for development:

```bash
# Deploy development rules
firebase deploy --only firestore:rules
```

### For Production
Use the production rules in `firestore.rules.production`:

```bash
# Copy production rules
cp firestore.rules.production firestore.rules

# Deploy production rules
firebase deploy --only firestore:rules
```

## Firebase Console Configuration

1. **Enable Anonymous Authentication**:
   - Go to Firebase Console > Authentication > Sign-in method
   - Enable "Anonymous" authentication

2. **Update Security Rules**:
   - Go to Firebase Console > Firestore Database > Rules
   - Copy the contents of `firestore.rules` (for development) or `firestore.rules.production` (for production)

## Environment Variables

### Quick Setup (Required to Fix Current Error)

**The `auth/invalid-api-key` error means your Firebase environment variables are missing or invalid.**

1. **Create or update `.env.local`** in your project root (this file is gitignored)

2. **Get your Firebase configuration:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project (or create one)
   - Click ⚙️ **Project Settings** → **General** tab
   - Scroll to **Your apps** section
   - If no web app exists, click **Add app** → **Web** (</> icon)
   - Copy the configuration values

3. **Add to `.env.local`:**
```env
# Firebase Configuration (REQUIRED)
# Get these from Firebase Console > Project Settings > General > Your apps
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...your_actual_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Firebase Admin SDK (for server-side operations - OPTIONAL for development)
# Get from Firebase Console > Project Settings > Service Accounts
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}

# Stripe Configuration (OPTIONAL for development)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# CORS Configuration (for production)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Teams Tab Data Source (OPTIONAL)
NEXT_PUBLIC_USE_FIREBASE_TEAMS=false
```

4. **Restart your development server:**
```bash
# Stop server (Ctrl+C) and restart
npm run dev
```

**Important Notes:**
- ✅ The `NEXT_PUBLIC_` prefix is **required** for Next.js to expose variables to the browser
- ✅ Replace ALL placeholder values with your actual Firebase values
- ✅ No quotes needed around values (unless the value itself contains spaces)
- ✅ `.env.local` is already in `.gitignore` - never commit it
- ✅ After updating `.env.local`, you **must restart** the dev server

### Verify Setup

After restarting, check the browser console. You should see:
- ✅ "Anonymous authentication successful: [user-id]"
- ✅ "Auth state changed - User signed in: [user-id]"

If you see errors, see **Troubleshooting** section below.

## Testing the Fix

1. **Restart the development server**:
   ```bash
   npm run dev
   ```

2. **Check the browser console** for authentication messages:
   - "Anonymous authentication successful: [user-id]"
   - "Auth state changed - User signed in: [user-id]"

3. **Test the application** by navigating to different pages that use Firebase

## Troubleshooting

### Error: `auth/invalid-api-key`

**Cause:** Firebase environment variables are missing or invalid.

**Solution:**
1. Check that `.env.local` exists in project root
2. Verify all `NEXT_PUBLIC_FIREBASE_*` variables are set
3. Double-check `NEXT_PUBLIC_FIREBASE_API_KEY` matches Firebase Console exactly
4. Make sure there are no extra spaces or quotes around values
5. Restart development server after making changes

### Error: `Missing required Firebase environment variables`

**Cause:** One or more required variables are not set.

**Solution:**
1. Check `.env.local` has all required variables (see above)
2. Verify variable names are correct (case-sensitive)
3. Make sure `NEXT_PUBLIC_` prefix is included
4. Restart development server

### Error: `auth/admin-restricted-operation`

**Cause:** Anonymous Authentication is not enabled in Firebase.

**Solution:**
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable "Anonymous" authentication
3. Click "Save"
4. Restart development server

### Error: `Missing or insufficient permissions`

**Cause:** Firestore security rules are too restrictive.

**Solution:**
1. Check Firebase Console → Firestore Database → Rules
2. Deploy development rules: `firebase deploy --only firestore:rules`
3. Or manually update rules in Firebase Console

### Still Having Issues?

1. **Check Browser Console** for specific error messages
2. **Verify Firebase Project** is active and correct
3. **Clear Browser Cache**: Hard refresh (Ctrl+F5 or Cmd+Shift+R)
4. **Check `.env.local`** file exists and has correct values
5. **Restart Development Server** after any `.env.local` changes
6. See `QUICK_START.md` for step-by-step setup guide

## Production Considerations

Before deploying to production:

1. **Update Security Rules**: Use the production rules in `firestore.rules.production`
2. **Implement Proper Authentication**: Replace anonymous auth with user authentication
3. **Secure Environment Variables**: Use proper secret management
4. **Enable Firebase Security Features**: Set up proper user roles and permissions 