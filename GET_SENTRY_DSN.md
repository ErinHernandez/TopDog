# Get Your Sentry DSN - Quick Guide

**Browser opened:** Sentry login page is ready for you

---

## 🚀 Quick Options

### Option 1: If You Already Have a DSN

Just paste it here and I'll add it, or run:

```bash
./update-sentry-dsn.sh "https://your-dsn@o0.ingest.sentry.io/123456"
```

### Option 2: Create New Sentry Account

**In the browser that just opened:**

1. **Sign up** (or log in if you have an account)
   - Use email/password, or
   - Sign in with Google/GitHub

2. **Create a Project:**
   - After login, click **"Create Project"**
   - Select **"Next.js"** as platform
   - Name it: `bestball-production`
   - Click **"Create Project"**

3. **Copy Your DSN:**
   - On the setup page, you'll see your DSN immediately
   - Format: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
   - **Copy the entire DSN**

4. **Add It:**
   - Paste the DSN here and I'll add it, OR
   - Run: `./update-sentry-dsn.sh "your-dsn-here"`

---

## 📋 What Happens Next

Once the DSN is added:

1. **Restart dev server:**
   ```bash
   npm run dev
   ```

2. **Verify in console:**
   ```
   [Sentry] Client-side error tracking initialized
   [Sentry] Server-side error tracking initialized
   ```

3. **Test it:**
   ```typescript
   import * as Sentry from '@sentry/nextjs';
   Sentry.captureException(new Error('Test error'));
   ```
   Check Sentry dashboard - error appears within 30 seconds.

---

## ✅ Current Status

- ✅ Sentry package installed
- ✅ Config files ready
- ✅ Placeholder in `.env.local`
- ⏳ **Waiting for your DSN**

**Just paste your DSN here when you have it!** 🚀
