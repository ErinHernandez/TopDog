# Quick Start Guide - Firebase Setup

## 🔴 Current Error: `auth/invalid-api-key`

This error occurs because Firebase environment variables are not set or are invalid.

## ✅ Quick Fix

### Step 1: Check Your `.env.local` File

Make sure you have a `.env.local` file in the project root with your Firebase credentials:

```bash
# Check if file exists
ls -la .env.local
```

### Step 2: Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the gear icon ⚙️ → **Project Settings**
4. Scroll down to **Your apps** section
5. If you don't have a web app, click **Add app** → **Web** (</> icon)
6. Copy the configuration values

### Step 3: Update `.env.local`

Open `.env.local` and add/update these variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...your_actual_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Important:** 
- Replace all placeholder values with your actual Firebase values
- Do NOT commit `.env.local` to git (it's already in `.gitignore`)
- The `NEXT_PUBLIC_` prefix is required for Next.js to expose these to the browser

### Step 4: Restart Development Server

After updating `.env.local`, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

### Step 5: Verify It Works

Check the browser console - you should see:
- ✅ "Anonymous authentication successful: [user-id]"
- ✅ "Auth state changed - User signed in: [user-id]"

If you still see errors, check:
1. All environment variables are set correctly
2. No typos in variable names
3. Values match exactly what's in Firebase Console
4. Development server was restarted after changes

## 🔧 Troubleshooting

### Error: "Missing required Firebase environment variables"

**Solution:** Make sure all `NEXT_PUBLIC_FIREBASE_*` variables are set in `.env.local`

### Error: "auth/invalid-api-key"

**Solution:** 
1. Double-check your `NEXT_PUBLIC_FIREBASE_API_KEY` value
2. Make sure there are no extra spaces or quotes
3. Get a fresh API key from Firebase Console if needed

### Error: "auth/admin-restricted-operation"

**Solution:** Enable Anonymous Authentication in Firebase Console:
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable "Anonymous" authentication
3. Click "Save"

### Still Having Issues?

1. Check `FIREBASE_SETUP.md` for detailed instructions
2. Verify your Firebase project is active
3. Make sure you're using the correct project's credentials
4. Clear browser cache and restart dev server

## 📋 Example `.env.local` Structure

```env
# Firebase Configuration (REQUIRED)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyExample123456789
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=myproject.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=myproject
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=myproject.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Firebase Admin (for server-side operations - OPTIONAL for development)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"myproject",...}

# Stripe (OPTIONAL for development)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

---

**Need Help?** See `FIREBASE_SETUP.md` for comprehensive setup instructions.

