# 🧪 Quick Sentry Test Guide

**Status:** Test tools ready - just need to start your dev server!

---

## 🚀 Quick Test (3 Steps)

### Step 1: Start Dev Server

```bash
npm run dev
```

Wait for it to start (you'll see "Ready" message).

### Step 2: Run Test Script

In a **new terminal window** (keep dev server running):

```bash
./test-sentry.sh
```

This will:
- ✅ Check if server is running
- ✅ Verify Sentry configuration
- ✅ Trigger a test error
- ✅ Show you where to check results

### Step 3: Check Sentry Dashboard

1. Go to: https://topdogdog.sentry.io/issues/
2. Wait 30 seconds
3. Look for "SentryTestError" in the Issues feed

---

## 🌐 Alternative: Test Page

Instead of the script, you can use the web interface:

1. **Start dev server:** `npm run dev`
2. **Visit:** http://localhost:3000/test-sentry
3. **Click buttons:**
   - "Check Sentry Config" - Verify DSN is loaded
   - "Test Client-Side Error" - Test browser errors
   - "Test Server-Side Error" - Test API errors
4. **Check Sentry dashboard** for the errors

---

## ✅ What to Look For

### In Console (when dev server starts):

```
[Sentry] Client-side error tracking initialized
[Sentry] Server-side error tracking initialized
```

If you see "disabled (no DSN provided)", restart the dev server.

### In Sentry Dashboard:

- Error name: "SentryTestError"
- Message: "🧪 Test error from BestBall - Sentry integration test"
- Should appear within 30 seconds

---

## 🔧 Troubleshooting

### "Dev server is not running"
- Make sure `npm run dev` is running
- Check it's on port 3000

### "Sentry DSN not found"
- Check `.env.local` has `NEXT_PUBLIC_SENTRY_DSN`
- Restart dev server after adding DSN

### "Error not appearing in Sentry"
- Wait 30-60 seconds (Sentry batches errors)
- Check you're looking at the right project: `javascript-nextjs`
- Verify DSN matches in Sentry dashboard

---

**Ready to test!** Just start your dev server and run `./test-sentry.sh` 🚀
