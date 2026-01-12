# Tier 1.1: Error Tracking Setup Guide

## Overview

This guide sets up Sentry error tracking for the TopDog platform. Error tracking is **critical** because it lets you see errors users experience but never report.

**Time Estimate:** 2 hours  
**Priority:** Tier 1 (Critical)

---

## Step 1: Install Sentry Package

```bash
npm install @sentry/nextjs --save
```

---

## Step 2: Create Sentry Account & Get DSN

1. Go to https://sentry.io and sign up (free tier available)
2. Create a new project:
   - Platform: **Next.js**
   - Project name: `topdog-production`
3. Copy your **DSN** from Project Settings > Client Keys
   - Format: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`

---

## Step 3: Add Environment Variable

Add to your `.env.local` file:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

**For Vercel production:**
1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Add `NEXT_PUBLIC_SENTRY_DSN` with your DSN value
3. Redeploy

---

## Step 4: Verify Configuration Files

The following files have been created:
- ✅ `sentry.client.config.ts` - Client-side error tracking
- ✅ `sentry.server.config.ts` - Server-side error tracking  
- ✅ `sentry.edge.config.ts` - Edge runtime error tracking

These files are automatically detected by `@sentry/nextjs`.

---

## Step 5: Test Error Tracking

### Test Client-Side Errors

1. Add this to any page temporarily:
```tsx
<button onClick={() => { throw new Error('Test error'); }}>
  Trigger Error
</button>
```

2. Click the button
3. Check Sentry dashboard - you should see the error within 30 seconds

### Test Server-Side Errors

1. Add to any API route:
```ts
import * as Sentry from '@sentry/nextjs';

export default async function handler(req, res) {
  try {
    throw new Error('Test API error');
  } catch (error) {
    Sentry.captureException(error);
    res.status(500).json({ error: 'Internal error' });
  }
}
```

---

## Step 6: Update Error Boundaries

Error boundaries have been updated to automatically send errors to Sentry:

- ✅ `components/draft/v2/ui/ErrorBoundary.js` - Updated
- ✅ `components/vx2/navigation/components/TabErrorBoundary.tsx` - Already using error tracking

---

## Step 7: Add Error Tracking to Critical Paths

### Draft Room Errors

The draft room already uses error boundaries. Additional tracking can be added to:

```ts
import { captureError } from '@/lib/errorTracking';

try {
  await makePick(player);
} catch (error) {
  await captureError(error, {
    tags: { component: 'DraftRoom', action: 'makePick' },
    extra: { roomId, playerId, userId }
  });
  // Show user-friendly error
}
```

### Payment Errors

Payment errors are already tracked via API error handlers. Verify they're working:

```ts
// Already implemented in pages/api/stripe/payment-intent.ts
// Uses withErrorHandling which logs to console
// Sentry will automatically capture unhandled errors
```

---

## Step 8: Configure Alerts (Optional but Recommended)

1. Go to Sentry Dashboard > Alerts
2. Create alert for:
   - **Error rate spike** (>10 errors/minute)
   - **New error types** (first occurrence)
   - **Critical errors** (errors with "fatal" level)

3. Set up notifications:
   - Email (free)
   - Slack (if you have workspace)
   - PagerDuty (if you have account)

---

## What You'll See in Sentry

Once set up, Sentry will show you:

- **Errors by frequency** - Which errors happen most
- **Error trends** - Are errors increasing?
- **User impact** - How many users affected
- **Stack traces** - Full error details with source maps
- **Breadcrumbs** - What user did before error
- **Session replay** - Video of user's session (if enabled)

---

## Development vs Production

**Development:**
- Errors are logged to console
- Not sent to Sentry (unless `localStorage.setItem('sentry_debug', 'true')`)

**Production:**
- All errors automatically sent to Sentry
- 10% of transactions sampled for performance monitoring
- Session replay enabled for errors

---

## Next Steps

After error tracking is set up:

1. ✅ **Monitor for 24-48 hours** - See what errors users are experiencing
2. ✅ **Fix critical errors** - Prioritize errors affecting most users
3. ✅ **Set up alerts** - Get notified of new error types
4. ✅ **Review weekly** - Check error trends and fix regressions

---

## Troubleshooting

### Errors not appearing in Sentry

1. Check DSN is set: `echo $NEXT_PUBLIC_SENTRY_DSN`
2. Check Sentry dashboard for "Issues" (not "Events")
3. Verify you're in production mode or have `sentry_debug` enabled
4. Check browser console for Sentry initialization messages

### Too many errors

1. Adjust `ignoreErrors` in `sentry.client.config.ts`
2. Adjust `tracesSampleRate` to lower value (0.05 = 5%)
3. Use `beforeSend` to filter specific errors

### Performance impact

- Sentry is async and non-blocking
- If concerned, lower `tracesSampleRate` to 0.01 (1%)

---

## Success Criteria

✅ Errors appear in Sentry dashboard within 30 seconds  
✅ Error boundaries capture React errors  
✅ API route errors are tracked  
✅ Alerts configured for critical errors  

**You're done when:** You can see real user errors in Sentry that you didn't know about before.

---

**Next Tier 1 Item:** Basic CI/CD Pipeline
