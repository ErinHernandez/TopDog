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

## Step 8.1: Configure Sentry Environments (REQUIRED FIRST STEP)

Before setting up alerts, configure environments to prevent alerts from preview deployments and local dev errors.

### In Sentry Dashboard

1. Go to Sentry > Settings > Projects > [Your Project] > Environments
2. Add these environments:
   - `production` (alerts enabled)
   - `preview` (alerts disabled)
   - `development` (alerts disabled)

### In Code (Already Updated)

The Sentry config files have been updated to use Vercel environment variables:
- `sentry.client.config.ts` - Uses `NEXT_PUBLIC_VERCEL_ENV`
- `sentry.server.config.ts` - Uses `VERCEL_ENV`
- `sentry.edge.config.ts` - Uses `VERCEL_ENV`

**Why:** Without this, you'll get alerts for preview deployments and local dev errors, causing alert fatigue.

---

## Step 8.5: Configure Sentry Alerts (Recommended)

**Important:** Configure Sentry environments first (see Step 8.1). Start with Tier 1 alerts only. Add others after you understand your baseline.

### Recommended Alert Thresholds (for new apps)

For a new fantasy football app, use these thresholds:
- Normal: 0-2 errors per hour
- Concerning: 5+ errors per hour
- Critical: 10+ errors per hour

### Tier 1: Immediate Action (Start Here)

| Alert | Condition | Action |
|-------|-----------|--------|
| Fatal Error | Level = fatal | Email + Slack immediately |
| Payment Error | Tag:component = Payment AND Level = error | Email + Slack immediately |
| Auth Error | Tag:component = Auth AND Level = error | Email within 5 min |

### Tier 2: Investigate Soon (Add After 1 Week)

| Alert | Condition | Action |
|-------|-----------|--------|
| Error Spike | > 5 errors in 10 minutes | Email |
| New Error Type | First seen in production | Email |

### Tier 3: Review Daily (Add After 1 Month)

| Alert | Condition | Action |
|-------|-----------|--------|
| High Error Volume | > 50 errors in 1 hour | Email digest |
| Unresolved Issues | Issue unresolved > 24 hours | Daily email |

### Alert Configuration Steps

1. Go to https://sentry.io > Your Project > Alerts
2. Click "Create Alert Rule"
3. Configure condition based on Tier 1 examples above
4. Set notification channels:
   - **Email:** Required (free)
   - **Slack:** Optional (requires Slack workspace integration)
   - **PagerDuty:** Optional (requires PagerDuty account)
5. Test alert using `/api/test-sentry` endpoint (see testing section below)
6. Verify notification is received

### Testing Specific Alert Types

**Test Error Spike Alert (Tier 2):**
```bash
# Trigger 15 errors in rapid succession (should trigger spike alert)
for i in {1..15}; do
  curl -X POST https://your-domain.com/api/test-sentry \
    -H "Content-Type: application/json" \
    -d '{"type": "error", "message": "Spike test '$i'"}'
  sleep 1
done
```

**Test Payment Error Alert (Tier 1):**
```bash
# Trigger a payment-tagged error
curl -X POST https://your-domain.com/api/test-sentry \
  -H "Content-Type: application/json" \
  -d '{"type": "error", "component": "Payment", "message": "Test payment error"}'
```

**Test Fatal Error Alert (Tier 1):**
```bash
# Trigger a fatal error
curl -X POST https://your-domain.com/api/test-sentry \
  -H "Content-Type: application/json" \
  -d '{"type": "fatal", "message": "Test fatal error"}'
```

**Note:** Update your `/api/test-sentry` endpoint to support these parameters (optional enhancement).

### Alert Best Practices

- **Start with Tier 1 only** - Add Tier 2/3 after you understand your baseline
- Use different channels for different severity levels
- Test alerts after configuration
- Review alert effectiveness weekly
- Adjust thresholds based on actual error rates
- Don't create too many alerts initially - you'll get alert fatigue

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
