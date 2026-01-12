# Sentry Installation - Next Steps

**Status:** ✅ Repository is clean - ready for Sentry installation

---

## ✅ Pre-Installation Complete

All enterprise-grade transformation changes have been committed:
- **Commit:** `6119de6` - "feat: Complete enterprise-grade transformation (Tiers 1-4)"
- **Files:** 167 files changed (20,626 insertions, 1,640 deletions)
- **Status:** Working tree clean ✅

---

## 🚀 Install Sentry

### Step 1: Install Package

```bash
npm install @sentry/nextjs
```

### Step 2: Run Sentry Wizard (Optional)

The Sentry wizard can help set up configuration:

```bash
npx @sentry/wizard@latest -i nextjs
```

**Note:** The wizard may try to modify files. Since we already have Sentry config files (`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`), you can:

1. **Skip the wizard** and configure manually, OR
2. **Run the wizard** and it will detect existing configs

### Step 3: Configure DSN

Add your Sentry DSN to environment variables:

**Local Development (`.env.local`):**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://your-public-key@o0.ingest.sentry.io/your-project-id
```

**Production (Vercel Dashboard):**
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add `NEXT_PUBLIC_SENTRY_DSN` with your production DSN

### Step 4: Get Your Sentry DSN

1. **Sign up/Login:** https://sentry.io
2. **Create Project:** Select "Next.js" as platform
3. **Get DSN:** Copy the DSN from project settings
4. **Add to Environment:** Add to `.env.local` and Vercel

---

## 📋 Verification Steps

### 1. Verify Installation

```bash
# Check package is installed
npm list @sentry/nextjs

# Should show version (e.g., @sentry/nextjs@10.32.1)
```

### 2. Test Error Tracking

Create a test error in development:

```typescript
// In any component or API route
import * as Sentry from '@sentry/nextjs';

// Test error
Sentry.captureException(new Error('Test error from BestBall'));
```

Check your Sentry dashboard - you should see the error appear.

### 3. Verify Config Files

The following files should exist:
- ✅ `sentry.client.config.ts`
- ✅ `sentry.server.config.ts`
- ✅ `sentry.edge.config.ts`

These were already created in the enterprise transformation.

---

## 🔧 Configuration Details

### Current Sentry Setup

The Sentry configuration files are already created and ready:

**Client Config** (`sentry.client.config.ts`):
- Browser tracing enabled
- Session replay enabled
- Error tracking configured

**Server Config** (`sentry.server.config.ts`):
- Server-side error tracking
- HTTP integration
- Performance monitoring

**Edge Config** (`sentry.edge.config.ts`):
- Edge runtime support
- Error tracking for Edge Functions

### Environment Variables Required

```bash
# Required
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn-here

# Optional (for advanced features)
SENTRY_AUTH_TOKEN=your-auth-token  # For source maps upload
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
```

---

## 📚 Documentation

See `TIER1_ERROR_TRACKING_SETUP.md` for complete setup guide.

---

## ✅ Checklist

- [x] Repository is clean (all changes committed)
- [ ] Install `@sentry/nextjs` package
- [ ] Create Sentry account (if not already)
- [ ] Get Sentry DSN
- [ ] Add DSN to `.env.local`
- [ ] Add DSN to Vercel environment variables
- [ ] Test error tracking in development
- [ ] Verify errors appear in Sentry dashboard

---

## 🎯 After Installation

Once Sentry is installed and configured:

1. **Test Error Tracking:**
   - Trigger a test error
   - Verify it appears in Sentry dashboard

2. **Monitor Production:**
   - Deploy to production
   - Monitor for real errors
   - Set up alerts

3. **Review Integration:**
   - Check that error boundaries are working
   - Verify API error tracking
   - Test performance monitoring (if enabled)

---

**Ready to install Sentry!** 🚀

Run: `npm install @sentry/nextjs`
