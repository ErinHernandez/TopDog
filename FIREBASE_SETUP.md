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

Create a `.env.local` file in your project root:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD3FtIzbb1HwEa1juMYk1XSWB4tvbd6oBg
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=topdog-e9d48.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=topdog-e9d48
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=topdog-e9d48.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=410904939799
NEXT_PUBLIC_FIREBASE_APP_ID=1:410904939799:web:352b9748425c9274f3fb52
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-86BL4QJX5K

# Stripe Configuration (replace with your actual keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

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

If you still see permission errors:

1. **Check Firebase Console**:
   - Ensure Anonymous Authentication is enabled
   - Verify security rules are deployed correctly

2. **Check Browser Console**:
   - Look for authentication error messages
   - Ensure Firebase is initializing properly

3. **Clear Browser Cache**:
   - Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)

## Production Considerations

Before deploying to production:

1. **Update Security Rules**: Use the production rules in `firestore.rules.production`
2. **Implement Proper Authentication**: Replace anonymous auth with user authentication
3. **Secure Environment Variables**: Use proper secret management
4. **Enable Firebase Security Features**: Set up proper user roles and permissions 