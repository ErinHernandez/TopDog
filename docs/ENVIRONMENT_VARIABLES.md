# Environment Variables Documentation

**Last Updated:** January 23, 2025  
**Total Variables:** 244 usages across 152 files

---

## Security Classification

### ✅ Safe - Server-Only Variables

These variables are used **only** in server-side code (API routes, lib files) and are **never exposed** to the client browser.

**Examples:**
- `STRIPE_SECRET_KEY` - Used in `/pages/api/stripe/*` routes (server-only)
- `STRIPE_WEBHOOK_SECRET` - Used in webhook handlers (server-only)
- `FIREBASE_SERVICE_ACCOUNT` - Used in Firebase Admin SDK (server-only)
- `PAYSTACK_SECRET_KEY` - Used in API routes (server-only)

### ✅ Safe - Client-Exposed Variables

These variables are **intentionally exposed** to the client browser via the `NEXT_PUBLIC_` prefix. They should **never contain secrets**.

**All NEXT_PUBLIC_ Variables:**
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase client config
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Firebase storage
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Firebase app ID
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` - Google Analytics
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key (safe to expose)
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN (safe to expose)
- `NEXT_PUBLIC_BASE_URL` - Application base URL
- `NEXT_PUBLIC_APP_URL` - Application URL
- `NEXT_PUBLIC_APP_VERSION` - Application version
- `NEXT_PUBLIC_FCM_VAPID_KEY` - Firebase Cloud Messaging key
- `NEXT_PUBLIC_VERCEL_ENV` - Vercel environment
- `NEXT_PUBLIC_USE_FIREBASE_TEAMS` - Feature flag
- `NEXT_PUBLIC_USE_NEW_DRAFT_ROOM` - Feature flag
- `NEXT_PUBLIC_NEW_DRAFT_ROOM_ROLLOUT` - Feature flag

### ⚠️ Flagged Variables (False Positives)

The audit script flagged these variables, but they are **safe** because they're only used in server-side API routes:

- `STRIPE_SECRET_KEY` (6 occurrences) - All in `/pages/api/stripe/*`
- `STRIPE_WEBHOOK_SECRET` (1 occurrence) - In `/pages/api/stripe/webhook.ts`

**Verification:**
- ✅ All usages are in `/pages/api/` directory (server-only)
- ✅ No client-side imports found
- ✅ Next.js API routes never expose code to client

---

## Required Variables

### Production

**Firebase (Required):**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_SERVICE_ACCOUNT` (JSON string)

**Application (Required):**
- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_APP_URL`

**Payment Providers (Required if using):**
- `STRIPE_SECRET_KEY` (if using Stripe)
- `STRIPE_WEBHOOK_SECRET` (if using Stripe)
- `PAYSTACK_SECRET_KEY` (if using Paystack)
- `PAYSTACK_WEBHOOK_SECRET` (if using Paystack)
- `PAYMONGO_SECRET_KEY` (if using Paymongo)
- `XENDIT_SECRET_KEY` (if using Xendit)

### Development

**Minimum Required:**
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`

**Recommended:**
- All production variables (for full functionality)
- `DEV_ACCESS_TOKEN` (for development access)

---

## Optional Variables

### Monitoring & Logging
- `SENTRY_DEBUG` - Enable Sentry debug mode
- `LOG_LEVEL` - Logging level (DEBUG, INFO, WARN, ERROR)
- `SECURITY_LOG_ENDPOINT` - Security event logging endpoint

### Feature Flags
- `NEXT_PUBLIC_USE_FIREBASE_TEAMS` - Use Firebase teams
- `NEXT_PUBLIC_USE_NEW_DRAFT_ROOM` - Use new draft room
- `NEXT_PUBLIC_NEW_DRAFT_ROOM_ROLLOUT` - Draft room rollout percentage
- `VX2_ROLLOUT_PERCENTAGE` - VX2 migration rollout (0.0-1.0)
- `ENABLE_DRAFT_REDIRECTS` - Legacy draft redirects flag

### External Services
- `SPORTSDATAIO_API_KEY` - SportsDataIO API key
- `AZURE_COMPUTER_VISION_ENDPOINT` - Azure Vision endpoint
- `AZURE_COMPUTER_VISION_KEY` - Azure Vision key
- `ESPN_S2_COOKIE` - ESPN authentication cookie
- `ESPN_SWID_COOKIE` - ESPN session cookie
- `ESPN_LEAGUE_ID` - ESPN league ID

### Alerts & Notifications
- `SLACK_WEBHOOK_URL` - Slack webhook for alerts
- `ALERT_EMAIL` - Alert email address
- `ALERT_PHONE` - Alert phone number

### Admin
- `ADMIN_UIDS` - Comma-separated admin user IDs
- `ALLOWED_ORIGINS` - Comma-separated allowed origins

### Data Sources
- `DATA_SOURCE_PROJECTIONS` - Projections data source (sportsdataio, espn)
- `DATA_SOURCE_HISTORICAL` - Historical data source (espn_core, espn_fantasy)

---

## Security Best Practices

### ✅ DO

1. **Use `NEXT_PUBLIC_` prefix** for variables that need to be exposed to the client
2. **Never put secrets in `NEXT_PUBLIC_` variables**
3. **Use server-side variables** for all secrets (API keys, tokens, etc.)
4. **Validate environment variables** at startup using `lib/envValidation.ts`
5. **Use `.env.local`** for local development (gitignored)
6. **Use Vercel environment variables** for production secrets

### ❌ DON'T

1. **Don't commit secrets** to git
2. **Don't use `NEXT_PUBLIC_` for secrets** - they will be exposed to the client
3. **Don't hardcode secrets** in code
4. **Don't log secrets** in production
5. **Don't expose API routes** that use secrets to the client

---

## Verification

### Check for Secret Leaks

```bash
# Run the audit script
npm run audit:env

# Or manually
node scripts/audit-env-vars.js
```

### Verify Server-Only Usage

```bash
# Check if any client components import API routes
grep -r "pages/api" \
  --include="*.tsx" \
  --include="*.jsx" \
  --exclude-dir=pages/api \
  --exclude-dir=node_modules \
  --exclude-dir=.next
```

### Validate Environment Variables

```typescript
// Use the validation helper
import { requireEnvVar } from '@/lib/apiErrorHandler';

const apiKey = requireEnvVar('YOUR_API_KEY', logger);
```

---

## Migration Guide

### Adding a New Environment Variable

1. **Determine if it needs to be client-accessible**
   - If yes: Use `NEXT_PUBLIC_` prefix
   - If no: Use regular name (server-only)

2. **Add to validation** (`lib/envValidation.ts`)
   ```typescript
   const REQUIRED_ENV_VARS = {
     production: [
       // ... existing
       'YOUR_NEW_VARIABLE',
     ],
   };
   ```

3. **Update `.env.example`**
   ```bash
   npm run audit:env  # Regenerates .env.example
   ```

4. **Document in this file**

5. **Add to Vercel** (for production)

### Migrating from Hardcoded Values

1. **Identify hardcoded value**
2. **Create environment variable**
3. **Replace hardcoded value**
4. **Add to validation**
5. **Update documentation**

---

## Troubleshooting

### "Environment variable not found"

**Solution:**
1. Check `.env.local` file exists
2. Verify variable name is correct
3. Restart dev server after adding variables
4. Check Vercel environment variables (production)

### "Secret leaked to client"

**Solution:**
1. Verify variable is not in `NEXT_PUBLIC_` prefixed
2. Check if it's used in client components
3. Move to server-side code if needed
4. Run audit script to verify

### "Variable undefined in production"

**Solution:**
1. Check Vercel environment variables
2. Verify variable name matches exactly
3. Check for typos
4. Ensure variable is set for correct environment

---

## Related Files

- `lib/envValidation.ts` - Environment variable validation
- `lib/envHelpers.ts` - Environment variable helpers
- `scripts/audit-env-vars.js` - Audit script
- `.env.example` - Template file (auto-generated)

---

**Last Audit:** January 23, 2025  
**Next Audit:** February 2025
