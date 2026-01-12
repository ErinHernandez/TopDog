# Sentry DSN Setup - Quick Instructions

**Status:** Script ready to add DSN to `.env.local`

---

## 🚀 Quick Setup

### Option 1: Run the Script (Recommended)

```bash
./add-sentry-dsn.sh
```

This will add a placeholder DSN to your `.env.local` file.

### Option 2: Manual Setup

Open `.env.local` and add this line:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://your-public-key@o0.ingest.sentry.io/your-project-id
```

---

## 📋 Get Your Actual DSN

1. **Go to:** https://sentry.io
2. **Sign up/Login** (free tier available)
3. **Create Project:**
   - Click "Create Project"
   - Select **"Next.js"**
   - Name it (e.g., "bestball-production")
   - Click "Create Project"
4. **Copy DSN:**
   - You'll see your DSN on the setup page
   - Or go to: **Settings** → **Projects** → Your Project → **Client Keys (DSN)**
   - Format: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`

---

## ✏️ Replace Placeholder

Open `.env.local` and replace:

```bash
# Change this:
NEXT_PUBLIC_SENTRY_DSN=https://your-public-key@o0.ingest.sentry.io/your-project-id

# To your actual DSN (example):
NEXT_PUBLIC_SENTRY_DSN=https://abc123def456@o123456.ingest.sentry.io/789012
```

**Important:** 
- No quotes needed
- No spaces around the `=`
- Use the exact DSN from Sentry

---

## ✅ Verify Setup

After adding your DSN:

1. **Restart dev server:**
   ```bash
   npm run dev
   ```

2. **Check console output:**
   You should see:
   ```
   [Sentry] Client-side error tracking initialized
   [Sentry] Server-side error tracking initialized
   ```

3. **Test it:**
   ```typescript
   import * as Sentry from '@sentry/nextjs';
   Sentry.captureException(new Error('Test error'));
   ```
   Check your Sentry dashboard - error should appear within 30 seconds.

---

## 🌐 For Production (Vercel)

1. **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. **Add:**
   - **Name:** `NEXT_PUBLIC_SENTRY_DSN`
   - **Value:** Your production DSN
   - **Environment:** Production (and Preview if desired)
3. **Redeploy**

---

## 📚 Current Status

- ✅ Sentry installed (`@sentry/nextjs@10.33.0`)
- ✅ Config files ready
- ⏳ **DSN needs to be added to `.env.local`**

**Run:** `./add-sentry-dsn.sh` to add the placeholder, then replace with your real DSN!
