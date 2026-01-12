# Add Sentry DSN - Quick Guide

**Status:** ✅ Placeholder added to `.env.local`

---

## ✅ What I Did

I've added a placeholder for the Sentry DSN to your `.env.local` file:

```bash
# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://your-public-key@o0.ingest.sentry.io/your-project-id
```

---

## 🔧 Next Steps: Get Your Real DSN

### Step 1: Get Your Sentry DSN

1. **Sign up/Login:** https://sentry.io
2. **Create Project:**
   - Click "Create Project"
   - Select **"Next.js"** as the platform
   - Name it (e.g., "bestball-production")
   - Click "Create Project"
3. **Copy DSN:**
   - On the setup page, you'll see your DSN
   - Format: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
   - Copy the entire DSN

### Step 2: Replace Placeholder

Open `.env.local` and replace the placeholder:

```bash
# Change this:
NEXT_PUBLIC_SENTRY_DSN=https://your-public-key@o0.ingest.sentry.io/your-project-id

# To your actual DSN:
NEXT_PUBLIC_SENTRY_DSN=https://abc123def456@o123456.ingest.sentry.io/789012
```

### Step 3: Restart Dev Server

After updating the DSN:

```bash
# Stop server (Ctrl+C) and restart
npm run dev
```

### Step 4: Verify It Works

Check the console output - you should see:
```
[Sentry] Client-side error tracking initialized
[Sentry] Server-side error tracking initialized
```

If you see "disabled (no DSN provided)", double-check the DSN value.

---

## 🧪 Test Error Tracking

Once the DSN is set, test it:

```typescript
// In any component or API route
import * as Sentry from '@sentry/nextjs';

// Trigger a test error
Sentry.captureException(new Error('Test error from BestBall'));
```

Check your Sentry dashboard - the error should appear within 30 seconds.

---

## 📋 For Production (Vercel)

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add:
   - **Name:** `NEXT_PUBLIC_SENTRY_DSN`
   - **Value:** Your production DSN (same or different from dev)
   - **Environment:** Production (and Preview if desired)
3. **Redeploy** your project

---

## ✅ Current Status

- ✅ Sentry package installed (`@sentry/nextjs@10.33.0`)
- ✅ Config files ready (`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`)
- ✅ Placeholder DSN added to `.env.local`
- ⏳ **Next:** Replace placeholder with your actual DSN from Sentry.io

---

**Once you add your real DSN, Sentry will be fully active!** 🚀
