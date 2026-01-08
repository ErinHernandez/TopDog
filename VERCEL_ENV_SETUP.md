# Vercel Environment Variables Setup

## Quick Setup Steps

### 1. Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create one if needed)
3. Click the ⚙️ **Settings** icon → **Project Settings**
4. Scroll down to **Your apps** section
5. If you don't have a web app, click **Add app** → **Web** (</> icon)
6. You'll see a config object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  measurementId: "G-XXXXXXXXXX"
};
```

### 2. Add Variables in Vercel

In your Vercel project settings (where you are now):

1. **For each variable below**, click "Add" and enter:
   - **Key**: The variable name (exactly as shown)
   - **Value**: The corresponding value from Firebase Console
   - **Environment**: Select "Production, Preview, and Development" (all three)

2. **Add these 6 required variables:**

| Key | Value Source | Example |
|-----|-------------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` from Firebase config | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` from Firebase config | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` from Firebase config | `your-project` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` from Firebase config | `your-project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` from Firebase config | `123456789` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` from Firebase config | `1:123456789:web:abcdef` |

### 3. Copy-Paste Template

If you have your Firebase config values, use this format:

```
Key: NEXT_PUBLIC_FIREBASE_API_KEY
Value: [paste your apiKey here]

Key: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
Value: [paste your authDomain here]

Key: NEXT_PUBLIC_FIREBASE_PROJECT_ID
Value: [paste your projectId here]

Key: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
Value: [paste your storageBucket here]

Key: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
Value: [paste your messagingSenderId here]

Key: NEXT_PUBLIC_FIREBASE_APP_ID
Value: [paste your appId here]
```

### 4. After Adding Variables

1. **Save** all variables
2. Go to **Deployments** tab
3. Click the **three dots** (⋯) on the latest deployment
4. Click **Redeploy**
5. The build should now succeed! ✅

## Important Notes

- ✅ Make sure to select **"Production, Preview, and Development"** for each variable
- ✅ The `NEXT_PUBLIC_` prefix is required - don't remove it
- ✅ No quotes needed around values
- ✅ After adding variables, you must **redeploy** for them to take effect

## Troubleshooting

If the build still fails:
1. Double-check all 6 variables are added
2. Verify values match exactly what's in Firebase Console
3. Make sure "Production, Preview, and Development" is selected for each
4. Check the build logs for any other errors
