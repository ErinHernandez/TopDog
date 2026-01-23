# Sentry Monitoring Implementation - Handoff Document

**Date:** January 2025  
**Status:** 📋 **REFINED PLAN READY** - Ready for implementation  
**Priority:** Medium (Enhancement to existing Sentry setup)  
**Last Updated:** Based on code review refinements

---

## Important Notes from Code Review

This document has been refined based on code review. Key improvements:
- ✅ Corrected alert thresholds for new apps (much lower)
- ✅ Added Sentry environment configuration (required first step)
- ✅ Fixed webhook security (return 401 on signature failure, not 200)
- ✅ Added rate limiting for webhook endpoint
- ✅ Enhanced testing instructions with specific curl examples
- ✅ Added Sentry dashboard quick reference
- ✅ Added optional test-sentry endpoint enhancement
- ✅ Verified Firestore collection naming convention (snake_case)

---

## Overview

This document provides complete implementation instructions for enhancing Sentry monitoring with:
1. **Sentry Alerts Configuration** (Manual setup + documentation)
2. **Vercel Logs Documentation** (Documentation update)
3. **Optional Sentry Webhook Endpoint** (Code implementation)

The implementation follows a three-phase approach, with phases 1-2 being documentation-only and phase 3 being optional code implementation.

---

## Context

**Current State:**
- ✅ Sentry is configured and working (client, server, edge configs exist)
- ✅ Errors are automatically sent to Sentry
- ✅ Structured logging is implemented (`lib/structuredLogger.ts`)
- ❌ No automatic log pulling from Sentry
- ❌ No alert configuration documented
- ❌ Vercel logs not documented

**Goal:**
- Configure Sentry alerts for real-time error notifications
- Document Vercel logs integration
- Optional: Implement Sentry webhook for custom processing

---

## Implementation Plan

### Phase 1: Sentry Alerts Configuration (Documentation Only)

**Effort:** 1-2 hours  
**Type:** Documentation updates + manual configuration guide

#### Task 1.0: Configure Sentry Environments (REQUIRED FIRST STEP)

**File:** `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`

**Action:** Update Sentry initialization to use Vercel environment variable for proper environment detection.

**Why:** Without this, you'll get alerts for preview deployments and local dev errors.

**Changes Required:**

**sentry.client.config.ts:**
```typescript
Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',
  // ... rest of config
});
```

**sentry.server.config.ts:**
```typescript
Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
  // ... rest of config
});
```

**sentry.edge.config.ts:**
```typescript
Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
  // ... rest of config
});
```

**Additional Step:** Configure environments in Sentry dashboard:
1. Go to Sentry > Settings > Projects > [Your Project] > Environments
2. Add these environments:
   - `production` (alerts enabled)
   - `preview` (alerts disabled)
   - `development` (alerts disabled)

#### Task 1.1: Update Existing Documentation

**File:** `TIER1_ERROR_TRACKING_SETUP.md`

**Action:** Add detailed alert configuration section after Step 8 (around line 130).

**Content to Add:**

```markdown
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

### Alert Best Practices

- **Start with Tier 1 only** - Add Tier 2/3 after you understand your baseline
- Use different channels for different severity levels
- Test alerts after configuration
- Review alert effectiveness weekly
- Adjust thresholds based on actual error rates
- Don't create too many alerts initially - you'll get alert fatigue
```

#### Task 1.2: Create Comprehensive Alert Guide

**New File:** `docs/SENTRY_ALERTS_SETUP.md`

**Structure:**

1. **Introduction**
   - Why alerts are important
   - What alerts provide
   - When to use alerts

2. **Prerequisites**
   - Sentry account setup
   - Project configuration
   - DSN configuration

3. **Alert Types Explained**
   - Error rate alerts
   - First seen alerts
   - Issue state change alerts
   - Performance alerts (optional)

4. **Step-by-Step Setup**
   - Screenshots placeholders (note: add actual screenshots when available)
   - Detailed configuration for each alert type
   - Notification channel setup

5. **Testing Alerts**
   - How to trigger test errors
   - Specific curl commands for testing each alert type
   - How to verify alerts work
   - Common issues and troubleshooting

6. **Sentry Dashboard Quick Reference**
   - Key URLs to bookmark
   - Daily and weekly workflows
   - Common navigation patterns

7. **Alert Management**
   - How to modify alerts
   - How to disable alerts
   - How to review alert history

**Content for Sentry Dashboard Quick Reference:**

```markdown
## Sentry Dashboard Quick Reference

### Key URLs (Bookmark These)

Replace `YOUR-ORG` and `YOUR-PROJECT` with your actual organization and project slugs:

- **Issues:** https://sentry.io/organizations/YOUR-ORG/issues/?project=YOUR-PROJECT
- **Alerts:** https://sentry.io/organizations/YOUR-ORG/alerts/rules/?project=YOUR-PROJECT
- **Performance:** https://sentry.io/organizations/YOUR-ORG/performance/?project=YOUR-PROJECT
- **Settings:** https://sentry.io/settings/YOUR-ORG/projects/YOUR-PROJECT/

### Daily Workflow

1. Check Issues page for new errors (starred)
2. Review error trends (increasing/decreasing)
3. Assign owners to new issues
4. Resolve fixed issues

### Weekly Workflow

1. Review alert effectiveness (too many? too few?)
2. Adjust thresholds based on data
3. Archive stale issues
4. Check ignored issues
5. Review error resolution rate
```

**Reference Existing Patterns:**
- Follow format similar to `docs/MONITORING_SETUP.md`
- Use same style as `TIER1_ERROR_TRACKING_SETUP.md`
- Include code examples for test endpoint usage

#### Task 1.3: Update Test Sentry Endpoint (Optional Enhancement)

**File:** `pages/api/test-sentry.ts`

**Action:** Add support for component tags and error types to enable better alert testing.

**Why:** Allows testing specific alert types (payment errors, fatal errors, etc.)

**Changes to Add:**

```typescript
// Update the POST handler to support component and type parameters
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['GET', 'POST'], logger);
    
    if (req.method === 'GET') {
      // ... existing GET handler ...
    }

    // POST request - trigger test error
    const { type = 'error', message = 'Test error from BestBall', component } = req.body || {};

    logger.info('Test Sentry error triggered', {
      component: 'test-sentry',
      errorType: type,
      componentTag: component,
      timestamp: new Date().toISOString(),
    });

    // Create a test error
    const testError = new Error(`🧪 ${message}`);
    testError.name = 'SentryTestError';
    
    // Add custom context with Sentry scope
    Sentry.withScope((scope) => {
      // Set component tag if provided
      if (component) {
        scope.setTag('component', component);
      }
      
      // Set error level based on type
      if (type === 'fatal') {
        scope.setLevel('fatal');
      } else if (type === 'warning') {
        scope.setLevel('warning');
      } else {
        scope.setLevel('error');
      }
      
      // Add context
      scope.setContext('test', {
        purpose: 'Verify Sentry integration',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        testType: type,
      });

      // Add user context
      Sentry.setUser({
        id: 'test-user',
        username: 'test-user',
      });

      // Capture the exception
      Sentry.captureException(testError);
    });

    // ... rest of handler ...
  });
}
```

**Reference:** Current implementation is in `pages/api/test-sentry.ts`

---

### Phase 2: Vercel Logs Documentation (Documentation Only)

**Effort:** 30 minutes  
**Type:** Documentation update

#### Task 2.1: Update Monitoring Documentation

**File:** `docs/MONITORING_SETUP.md`

**Action:** Add new section "3.5 Vercel Logs (Already Available)" after section 3 (UptimeRobot Setup) and before section 4 (Advanced Monitoring).

**Content to Add:**

```markdown
## 3.5 Vercel Logs (Already Available)

Vercel automatically aggregates logs from your application. Your structured logs from `lib/structuredLogger.ts` automatically appear in the Vercel dashboard.

### Accessing Logs

1. **Vercel Dashboard:**
   - Go to: https://vercel.com/dashboard
   - Select your project
   - Click "Logs" tab
   - Filter by function, environment, or time range

2. **Log Stream:**
   - Real-time log streaming during development
   - Filter by log level (info, warn, error, debug)
   - Search by message content

### Log Format

Your structured JSON logs appear in Vercel with full context:
- **Timestamp:** ISO 8601 format
- **Level:** info, warn, error, debug
- **Message:** Log message from your code
- **Context:** Additional data from `LogContext` parameter
- **Error Details:** Stack traces for error logs

**Example Log Entry:**
```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "level": "info",
  "message": "User made pick",
  "component": "DraftRoom",
  "roomId": "abc123",
  "userId": "user456",
  "playerId": "player789"
}
```

### Log Retention

- **Free Tier:** 7 days
- **Pro Tier:** 30 days
- **Enterprise:** Custom retention (90+ days available)

### Using Logs with Sentry

Vercel logs complement Sentry error tracking:
- **Sentry:** Error tracking, stack traces, user context, session replay
- **Vercel Logs:** All application logs (info, debug, etc.), API route logs, function logs
- **Use both together** for complete observability

**When to use each:**
- **Sentry:** Critical errors, exceptions, user-impacting issues
- **Vercel Logs:** Debugging, information logs, performance logs, audit trails

### Example: Searching Logs

In Vercel logs interface, you can search for:
- **Component:** `component:"Payment"` 
- **Error level:** `level:"error"`
- **Message text:** `message:"payment failed"`
- **User ID:** `userId:"user123"`
- **Time range:** Use date picker

### Log Best Practices

- Use structured logging consistently (already implemented)
- Include relevant context in logs
- Don't log sensitive information (passwords, tokens, etc.)
- Use appropriate log levels:
  - **debug:** Development-only details
  - **info:** Normal operations, user actions
  - **warn:** Unexpected but non-critical issues
  - **error:** Errors that need attention
```

**Important Notes:**
- This is documentation only - no code changes needed
- Vercel logs are already working (structured logger outputs JSON)
- This section explains what's already available

---

### Phase 3: Optional Sentry Webhook Endpoint (Code Implementation)

**Effort:** 2-3 hours  
**Type:** Code implementation  
**Optional:** Can be implemented later if needed

#### Task 3.1: Create Sentry Type Definitions

**New File:** `lib/sentry/sentryTypes.ts`

**Full Content:**

```typescript
/**
 * Sentry Webhook Types
 * 
 * Type definitions for Sentry webhook payloads
 * Based on Sentry webhook API documentation
 * 
 * Reference: https://docs.sentry.io/product/integrations/integration-platform/webhooks/
 */

export interface SentryWebhookPayload {
  action: 'created' | 'resolved' | 'assigned' | 'reassigned' | 'unassigned';
  installation?: {
    uuid: string;
  };
  data: {
    issue: SentryIssue;
    event?: SentryEvent;
  };
}

export interface SentryIssue {
  id: string;
  shortId: string;
  title: string;
  culprit: string;
  permalink: string;
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  status: 'unresolved' | 'resolved' | 'ignored';
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  project: {
    id: string;
    name: string;
    slug: string;
  };
  metadata: {
    type?: string;
    value?: string;
    filename?: string;
    function?: string;
    [key: string]: unknown;
  };
  count: number;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
}

export interface SentryEvent {
  id: string;
  eventID: string;
  tags: Array<{ key: string; value: string }>;
  dateCreated: string;
  user?: {
    id: string;
    username?: string;
    email?: string;
  };
  message?: string;
  platform?: string;
}
```

**Reference Patterns:**
- Follow same structure as `lib/paystack/paystackTypes.ts`
- Use similar naming conventions
- Include comprehensive JSDoc comments

#### Task 3.2: Create Sentry Webhook Service

**New File:** `lib/sentry/sentryService.ts`

**Full Content:**

```typescript
/**
 * Sentry Webhook Service
 * 
 * Handles Sentry webhook signature verification and event processing
 * 
 * Reference: https://docs.sentry.io/product/integrations/integration-platform/webhooks/
 */

import crypto from 'crypto';
import type { SentryWebhookPayload } from './sentryTypes';
import { logger } from '../structuredLogger';
import { getDb } from '../firebase-utils';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Verify Sentry webhook signature
 * 
 * Sentry uses HMAC-SHA256 to sign webhook payloads
 * Signature format: sha256=<hex-encoded-hmac>
 * 
 * @param payload - Raw webhook payload (string or Buffer)
 * @param signature - Signature header value from Sentry
 * @param secret - Webhook secret from Sentry project settings
 * @returns true if signature is valid, false otherwise
 */
export function verifySentryWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): boolean {
  try {
    // Signature format: sha256=<hex-encoded-hmac>
    const signatureMatch = signature.match(/^sha256=(.+)$/);
    if (!signatureMatch) {
      logger.warn('Invalid signature format', {
        component: 'sentry',
        operation: 'verify_signature',
        signaturePrefix: signature.substring(0, 20),
      });
      return false;
    }

    const receivedSignature = signatureMatch[1];
    const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8');
    
    // Compute HMAC-SHA256
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payloadString);
    const computedSignature = hmac.digest('hex');
    
    // Compare signatures using constant-time comparison to prevent timing attacks
    if (receivedSignature.length !== computedSignature.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(
      Buffer.from(receivedSignature, 'hex'),
      Buffer.from(computedSignature, 'hex')
    );
  } catch (error) {
    logger.error('Error verifying Sentry webhook signature', error as Error, {
      component: 'sentry',
      operation: 'verify_signature',
    });
    return false;
  }
}

/**
 * Process Sentry webhook event
 * 
 * Optionally stores events in Firestore for custom dashboards/analytics
 * 
 * @param payload - Parsed Sentry webhook payload
 * @returns Processing result with success status and actions taken
 */
export async function processSentryWebhookEvent(
  payload: SentryWebhookPayload
): Promise<{ success: boolean; actions: string[] }> {
  const actions: string[] = [];
  
  try {
    const { action, data } = payload;
    const { issue, event } = data;
    
    logger.info('Processing Sentry webhook event', {
      component: 'sentry',
      operation: 'webhook',
      action,
      issueId: issue.id,
      issueShortId: issue.shortId,
      issueLevel: issue.level,
      issueStatus: issue.status,
      projectSlug: issue.project.slug,
    });
    
    // Store event in Firestore for custom analytics (optional)
    // Only store in production to avoid cluttering dev database
    if (process.env.NODE_ENV === 'production') {
      try {
        const db = getDb();
        await addDoc(collection(db, 'sentry_webhook_events'), {
          action,
          issueId: issue.id,
          issueShortId: issue.shortId,
          issueTitle: issue.title,
          issueLevel: issue.level,
          issueStatus: issue.status,
          projectSlug: issue.project.slug,
          projectId: issue.project.id,
          eventId: event?.id,
          eventMessage: event?.message,
          eventPlatform: event?.platform,
          count: issue.count,
          userCount: issue.userCount,
          firstSeen: issue.firstSeen,
          lastSeen: issue.lastSeen,
          culprit: issue.culprit,
          assignedTo: issue.assignedTo || null,
          metadata: issue.metadata,
          timestamp: serverTimestamp(),
          environment: process.env.NODE_ENV,
        });
        actions.push('stored_in_firestore');
      } catch (error) {
        // Don't fail webhook processing if Firestore write fails
        logger.warn('Failed to store Sentry webhook event in Firestore', {
          component: 'sentry',
          operation: 'webhook_firestore',
          error: (error as Error).message,
        });
      }
    }
    
    // Add custom logic here if needed (e.g., Slack notifications, custom alerts)
    // For now, just log and store
    
    actions.push('processed');
    return { success: true, actions };
  } catch (error) {
    logger.error('Error processing Sentry webhook event', error as Error, {
      component: 'sentry',
      operation: 'webhook_process',
    });
    return { success: false, actions };
  }
}
```

**Reference Patterns:**
- Follow same structure as `lib/paystack/paystackService.ts` (specifically `verifyWebhookSignature` function)
- Use same error handling patterns
- Use same logging patterns with structured logger
- Follow Firestore storage patterns from `lib/stripe/stripeService.ts` (collection name: `stripe_webhook_events` uses snake_case)
- **Note:** Collection naming convention: Use `sentry_webhook_events` (snake_case) to match existing pattern (`stripe_webhook_events`, `transactions`)

#### Task 3.3: Create Sentry Webhook API Route

**New File:** `pages/api/sentry/webhook.ts`

**Full Content:**

```typescript
/**
 * Sentry Webhook Handler
 * 
 * Processes webhook events from Sentry for error tracking integration.
 * 
 * Events handled:
 * - issue.created - New error detected
 * - issue.resolved - Error resolved
 * - issue.assigned - Error assigned to team member
 * 
 * POST /api/sentry/webhook
 * 
 * @module pages/api/sentry/webhook
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import {
  verifySentryWebhookSignature,
  processSentryWebhookEvent,
} from '../../../lib/sentry/sentryService';
import type { SentryWebhookPayload } from '../../../lib/sentry/sentryTypes';
import { logger } from '../../../lib/structuredLogger';
import {
  withErrorHandling,
  validateMethod,
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from '../../../lib/apiErrorHandler';
import { RateLimiter } from '../../../lib/rateLimiter';

// ============================================================================
// CONFIG
// ============================================================================

// Disable body parsing for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

const SENTRY_WEBHOOK_SECRET = process.env.SENTRY_WEBHOOK_SECRET;

// Rate limiting for webhook endpoint
const webhookRateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
  endpoint: 'sentry_webhook',
});

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  // Rate limiting by IP
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
             req.socket.remoteAddress || 
             'unknown';
  
  try {
    const rateLimitResult = await webhookRateLimiter.check(req);
    if (!rateLimitResult.allowed) {
      logger.warn('Sentry webhook rate limited', {
        component: 'sentry',
        operation: 'webhook',
        ip,
      });
      return res.status(429).json({ error: 'Rate limited' });
    }
  } catch (error) {
    // If rate limiter fails, log but continue (don't block webhooks)
    logger.warn('Rate limiter error', {
      component: 'sentry',
      operation: 'webhook_rate_limit',
      error: (error as Error).message,
    });
  }

  // Wrap with error handling
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['POST'], logger);

    if (!SENTRY_WEBHOOK_SECRET) {
      logger.warn('Sentry webhook secret not configured', {
        component: 'sentry',
        operation: 'webhook_config',
      });
      // For webhooks, always return 200 even on configuration errors to prevent retries
      const errorResponse = createErrorResponse(
        ErrorType.CONFIGURATION,
        'Webhook secret not configured',
        {},
        res.getHeader('X-Request-ID') as string
      );
      return res.status(200).json({ received: false, error: errorResponse.body.error.message });
    }

    try {
      // Get raw body for signature verification
      const rawBody = await buffer(req);
      const signature = req.headers['sentry-hook-signature'] as string;

      if (!signature) {
        logger.warn('Missing Sentry webhook signature', {
          component: 'sentry',
          operation: 'webhook',
        });
        // For webhooks, always return 200 even on validation errors to prevent retries
        const errorResponse = createErrorResponse(
          ErrorType.VALIDATION,
          'Missing sentry-hook-signature header',
          {},
          res.getHeader('X-Request-ID') as string
        );
        return res.status(200).json({ received: false, error: errorResponse.body.error.message });
      }

      // Verify webhook signature
      // IMPORTANT: Return 401 on signature failure (not 200) - security concern
      // Unlike payment webhooks (where you want to acknowledge receipt),
      // a Sentry webhook with invalid signature could be an attacker.
      // Sentry will retry on 5xx, not on 4xx.
      const isValid = verifySentryWebhookSignature(
        rawBody,
        signature,
        SENTRY_WEBHOOK_SECRET
      );

      if (!isValid) {
        const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 'unknown';
        logger.warn('Invalid Sentry webhook signature', {
          component: 'sentry',
          operation: 'webhook',
          ip,
        });
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // Parse payload
      const payload: SentryWebhookPayload = JSON.parse(rawBody.toString());

      logger.info('Received Sentry webhook', {
        component: 'sentry',
        operation: 'webhook',
        action: payload.action,
        issueId: payload.data.issue.id,
        issueShortId: payload.data.issue.shortId,
      });

      // Process webhook event
      const result = await processSentryWebhookEvent(payload);

      logger.info('Sentry webhook processed', {
        component: 'sentry',
        operation: 'webhook',
        success: result.success,
        actions: result.actions,
        issueId: payload.data.issue.id,
      });

      const response = createSuccessResponse(
        {
          received: true,
          success: result.success,
          actions: result.actions,
        },
        200,
        logger
      );

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      const err = error as Error;
      logger.error('Error processing Sentry webhook', err, {
        component: 'sentry',
        operation: 'webhook',
      });

      // Always return 200 for webhooks to prevent Sentry retries
      const errorResponse = createErrorResponse(
        ErrorType.INTERNAL,
        'Error processing webhook',
        {},
        res.getHeader('X-Request-ID') as string
      );
      return res.status(200).json({ received: false, error: errorResponse.body.error.message });
    }
  });
}
```

**Reference Patterns:**
- Follow structure similar to `pages/api/stripe/webhook.ts` but with security differences
- Use same logging patterns
- Use rate limiting from `lib/rateLimiter.js`
- Follow same response format

**Key Differences from Payment Webhooks:**
- **Security:** Return 401 on signature failure (not 200) - Sentry webhooks don't involve money
- **Rate Limiting:** Added rate limiting by IP (100 req/min)
- **Signature header:** `sentry-hook-signature` (not `stripe-signature`)
- **Signature format:** `sha256=<hex>` (not Stripe's format)
- **No event routing/switching needed** (simpler payload structure)

**Rationale for 401 on Signature Failure:**
- Payment webhooks: Return 200 to prevent retries (money involved, need to acknowledge receipt)
- Sentry webhooks: Return 401 for invalid signatures (no money, security concern)
- Sentry will retry on 5xx, not on 4xx, so 401 prevents retries on invalid signatures

#### Task 3.4: Create Webhook Setup Documentation

**New File:** `docs/SENTRY_WEBHOOK_SETUP.md`

**Structure:**

1. **Overview**
   - What Sentry webhooks provide
   - When to use webhooks
   - Benefits of webhook integration

2. **Prerequisites**
   - Sentry account
   - Sentry project configured
   - Webhook endpoint deployed

3. **Getting Webhook Secret**
   - Step-by-step instructions
   - Where to find secret in Sentry dashboard
   - How to generate new secret

4. **Environment Variable Setup**
   - Add `SENTRY_WEBHOOK_SECRET` to `.env.local`
   - Add to Vercel environment variables
   - Security best practices

5. **Configuring Webhook in Sentry**
   - Step-by-step instructions
   - Webhook URL format
   - Event selection
   - Test webhook

6. **Testing**
   - How to trigger test webhook
   - How to verify webhook works
   - Checking Firestore collection (if enabled)

7. **Troubleshooting**
   - Common issues
   - Signature verification failures
   - Firestore write failures
   - Webhook not receiving events

8. **Firestore Collection Structure**
   - Collection name: `sentry_webhook_events`
   - Document structure
   - Querying examples

#### Task 3.5: Update Environment Variables Documentation

**Action:** Add `SENTRY_WEBHOOK_SECRET` to environment variable documentation.

**Files to Update:**
- `VERCEL_ENV_SETUP.md` (if exists)
- Or create/update general environment variable documentation

**Content to Add:**

```markdown
### SENTRY_WEBHOOK_SECRET (Optional - Phase 3)

**Purpose:** Secret key for verifying Sentry webhook signatures

**Required:** No (only if implementing Phase 3 webhook endpoint)

**How to Get:**
1. Go to Sentry Dashboard > Settings > Projects > [Your Project]
2. Navigate to "Webhooks" section
3. Copy the webhook secret (or generate new one)

**Format:** Alphanumeric string (keep secret, do not commit to git)

**Example:**
```
SENTRY_WEBHOOK_SECRET=abc123def456...
```

**Security:**
- Never commit to git
- Store in environment variables only
- Rotate if compromised
```

---

## Implementation Order

### Recommended Sequence

1. **Phase 1** (Documentation only - no code changes)
   - Update `TIER1_ERROR_TRACKING_SETUP.md`
   - Create `docs/SENTRY_ALERTS_SETUP.md`
   - **Verification:** Review documentation, test alert setup manually

2. **Phase 2** (Documentation only)
   - Update `docs/MONITORING_SETUP.md`
   - **Verification:** Review documentation, verify logs in Vercel dashboard

3. **Phase 3** (Code implementation - optional)
   - Create `lib/sentry/sentryTypes.ts`
   - Create `lib/sentry/sentryService.ts`
   - Create `pages/api/sentry/webhook.ts`
   - Create `docs/SENTRY_WEBHOOK_SETUP.md`
   - Update environment variable documentation
   - **Verification:** Test webhook endpoint, verify Firestore storage

### Dependencies

- Phase 1: No dependencies
- Phase 2: No dependencies
- Phase 3: Depends on Phase 1 (for understanding Sentry setup), but can be done independently

---

## Testing Instructions

### Phase 1 Testing (Manual)

1. **Setup Alerts:**
   - Follow documentation to configure alerts in Sentry dashboard
   - Configure at least one alert (error rate spike recommended)

2. **Test Alert:**
   ```bash
   # Trigger test error
   curl -X POST https://your-domain.com/api/test-sentry
   ```
   - Or navigate to `/api/test-sentry` in browser
   - Verify alert is triggered in Sentry
   - Verify notification email is received

3. **Verify Documentation:**
   - Review `TIER1_ERROR_TRACKING_SETUP.md` for clarity
   - Review `docs/SENTRY_ALERTS_SETUP.md` for completeness

### Phase 2 Testing (Manual)

1. **Verify Logs in Vercel:**
   - Navigate to Vercel Dashboard > Project > Logs
   - Verify logs appear with structured JSON format
   - Test log search functionality
   - Verify log retention period

2. **Verify Documentation:**
   - Review `docs/MONITORING_SETUP.md` section 3.5
   - Verify examples match actual log format

### Phase 3 Testing (Automated + Manual)

1. **Local Testing:**
   ```bash
   # Start dev server
   npm run dev
   
   # In another terminal, test webhook endpoint
   # (You'll need to create a test payload or use Sentry's test webhook)
   curl -X POST http://localhost:3000/api/sentry/webhook \
     -H "Content-Type: application/json" \
     -H "sentry-hook-signature: sha256=<test-signature>" \
     -d @test-sentry-webhook-payload.json
   ```

2. **Signature Verification Test:**
   - Test with invalid signature (should return 401 - security concern)
   - Test with missing signature (should return 401 - security concern)
   - Test with valid signature (should process and return 200)

3. **Firestore Storage Test:**
   - Trigger webhook with valid payload
   - Verify event is stored in `sentry_webhook_events` collection
   - Verify document structure matches expected format

4. **Production Testing:**
   - Deploy to production
   - Configure webhook in Sentry dashboard
   - Trigger test webhook from Sentry
   - Verify webhook is received and processed
   - Check Firestore collection for stored events

---

## Files Created/Modified

### Created Files

**Phase 1:**
- `docs/SENTRY_ALERTS_SETUP.md` (new file)

**Phase 2:**
- None (documentation update only)

**Phase 3:**
- `lib/sentry/sentryTypes.ts` (new file)
- `lib/sentry/sentryService.ts` (new file)
- `pages/api/sentry/webhook.ts` (new file)
- `docs/SENTRY_WEBHOOK_SETUP.md` (new file)

### Modified Files

**Phase 1:**
- `sentry.client.config.ts` (update environment detection)
- `sentry.server.config.ts` (update environment detection)
- `sentry.edge.config.ts` (update environment detection)
- `TIER1_ERROR_TRACKING_SETUP.md` (add sections 8.1 and 8.5)
- `pages/api/test-sentry.ts` (optional - add component/type support)

**Phase 2:**
- `docs/MONITORING_SETUP.md` (add section 3.5)

**Phase 3:**
- Environment variable documentation (add `SENTRY_WEBHOOK_SECRET`)

---

## Code Patterns & Conventions

### Key Patterns to Follow

1. **Webhook Pattern (Phase 3):**
   - **Security:** Return 401 on signature failure (not 200) - Sentry webhooks don't involve money
   - Return 200 only after successful signature verification
   - Use `buffer` from 'micro' for raw body access
   - Disable body parsing with `export const config`
   - Verify signature before processing
   - Use rate limiting by IP
   - Use structured logger for all logging
   - Use `withErrorHandling` wrapper
   - Use `validateMethod` for HTTP method validation

2. **Error Handling:**
   - **Payment webhooks:** Always return 200 (prevents retries, money involved)
   - **Sentry webhooks:** Return 401 on signature failure (security concern, no money)
   - Return 200 after successful processing
   - Log errors but don't fail the request on processing errors
   - Use appropriate ErrorType constants

3. **Logging:**
   - Use structured logger from `lib/structuredLogger.ts`
   - Include component and operation in context
   - Log at appropriate levels (info, warn, error)
   - Don't log sensitive data

4. **TypeScript:**
   - Use TypeScript for all new code
   - Define types in separate file
   - Use interfaces for data structures
   - Include JSDoc comments

5. **Firestore:**
   - Use `serverTimestamp()` for timestamps
   - Handle Firestore errors gracefully (don't fail webhook)
   - Only store in production (check `NODE_ENV`)
   - Use descriptive collection names

### Reference Files

**For Webhook Implementation:**
- `pages/api/stripe/webhook.ts` - Primary reference for webhook structure
- `pages/api/paystack/webhook.ts` - Additional reference
- `lib/paystack/paystackService.ts` - Signature verification pattern
- `lib/structuredLogger.ts` - Logging patterns
- `lib/apiErrorHandler.js` - Error handling utilities

**For Documentation:**
- `docs/MONITORING_SETUP.md` - Documentation style reference
- `TIER1_ERROR_TRACKING_SETUP.md` - Setup guide style reference
- `FINAL_HANDOFF.md` - Handoff document style reference

---

## Common Issues & Solutions

### Phase 1 Issues

**Issue:** Alerts not triggering
- **Solution:** Check alert conditions match actual error patterns
- **Solution:** Verify notification channels are configured correctly
- **Solution:** Test with `/api/test-sentry` endpoint

**Issue:** Too many alerts
- **Solution:** Adjust thresholds (increase error rate threshold)
- **Solution:** Use filters to exclude non-critical errors
- **Solution:** Review alert effectiveness and disable unnecessary alerts

### Phase 2 Issues

**Issue:** Logs not appearing in Vercel
- **Solution:** Verify deployment is active
- **Solution:** Check log retention period hasn't expired
- **Solution:** Verify structured logger is being used (not console.log)

**Issue:** Logs not in JSON format
- **Solution:** Verify `NODE_ENV=production` (structured format only in production)
- **Solution:** Check structured logger is being used
- **Solution:** Review `lib/structuredLogger.ts` implementation

### Phase 3 Issues

**Issue:** Webhook signature verification failing
- **Solution:** Verify `SENTRY_WEBHOOK_SECRET` is correct
- **Solution:** Check signature format matches (sha256=<hex>)
- **Solution:** Verify raw body is being used (not parsed JSON)
- **Solution:** Check webhook secret in Sentry dashboard

**Issue:** Webhook not receiving events
- **Solution:** Verify webhook URL is correct in Sentry
- **Solution:** Check webhook is enabled in Sentry dashboard
- **Solution:** Verify events are being selected in webhook configuration
- **Solution:** Check Vercel function logs for errors

**Issue:** Firestore write failing
- **Solution:** Verify Firestore rules allow writes to `sentry_webhook_events`
- **Solution:** Check Firestore initialization (`getDb()` function)
- **Solution:** Verify `NODE_ENV=production` (storage only in production)
- **Solution:** Check Firestore quotas/limits

---

## Success Criteria

### Phase 1 Success

- ✅ Alerts configured in Sentry dashboard
- ✅ At least one alert tested and working
- ✅ Documentation is clear and complete
- ✅ Alert notifications are received

### Phase 2 Success

- ✅ Vercel logs section added to documentation
- ✅ Documentation explains log format and usage
- ✅ Examples match actual log output
- ✅ Documentation is clear and complete

### Phase 3 Success

- ✅ Webhook endpoint created and deployed
- ✅ Signature verification working correctly
- ✅ Webhook receives events from Sentry
- ✅ Events stored in Firestore (if enabled)
- ✅ Documentation is clear and complete
- ✅ All tests pass

---

## Future Enhancements (Optional)

These are not part of the current plan but could be added later:

1. **Custom Alert Logic:**
   - Add custom processing logic in webhook handler
   - Integrate with Slack/PagerDuty
   - Create custom dashboards from Firestore data

2. **Log Aggregation Service:**
   - Integrate with Datadog/Logtail for advanced log analysis
   - Set up log-based alerting
   - Create log retention policies

3. **Performance Monitoring:**
   - Add Sentry performance monitoring
   - Track API route performance
   - Set up performance budgets

4. **Analytics:**
   - Create Firestore queries for error trends
   - Build custom error dashboard
   - Track error resolution time

---

## Priority Recommendation

**Do Phase 1 now.** It's documentation + Sentry UI configuration - high value, low effort (~1-2 hours). This provides immediate value with minimal implementation time.

**Do Phase 2 now.** It's just documentation update - very quick (~30 minutes).

**Skip Phase 3 for now.** You don't need a webhook endpoint unless you want to:
- Store Sentry events in your own database
- Trigger custom workflows from errors
- Build custom error dashboards

**Sentry's built-in alerts (Phase 1) handle 95% of use cases.** Phase 3 can be implemented later when/if you need custom event processing.

---

## Questions & Support

### If You Need Help

1. **Review Existing Code:**
   - Check existing webhook implementations for patterns
   - Review structured logger implementation
   - Look at error handling utilities

2. **Check Documentation:**
   - `DEVELOPER_GUIDE.md` - General development guide
   - `docs/MONITORING_SETUP.md` - Monitoring setup
   - `TIER1_ERROR_TRACKING_SETUP.md` - Sentry setup

3. **Common Patterns:**
   - All webhooks follow similar structure (see Stripe/Paystack)
   - All services use structured logging
   - All API routes use error handling utilities

### Key Contacts

- **Sentry Documentation:** https://docs.sentry.io
- **Vercel Logs Documentation:** https://vercel.com/docs/monitoring/logs
- **Existing Code Patterns:** See reference files listed above

---

## Checklist for Implementation

Use this checklist to track progress:

### Phase 1: Sentry Alerts
- [ ] Update `TIER1_ERROR_TRACKING_SETUP.md` with section 8.5
- [ ] Create `docs/SENTRY_ALERTS_SETUP.md`
- [ ] Review documentation for clarity
- [ ] Test alert configuration (manual)

### Phase 2: Vercel Logs
- [ ] Update `docs/MONITORING_SETUP.md` with section 3.5
- [ ] Review documentation for clarity
- [ ] Verify logs in Vercel dashboard

### Phase 3: Sentry Webhook (Optional)
- [ ] Create `lib/sentry/` directory
- [ ] Create `lib/sentry/sentryTypes.ts`
- [ ] Create `lib/sentry/sentryService.ts`
- [ ] Create `pages/api/sentry/webhook.ts` (with rate limiting and 401 on signature failure)
- [ ] Create `docs/SENTRY_WEBHOOK_SETUP.md`
- [ ] Update environment variable documentation
- [ ] Add `SENTRY_WEBHOOK_SECRET` to environment variables
- [ ] Test webhook endpoint locally (with mock payload)
- [ ] Test signature verification (valid and invalid)
- [ ] Test rate limiting
- [ ] Deploy and configure webhook in Sentry dashboard
- [ ] Test webhook endpoint in production
- [ ] Verify Firestore storage (if enabled)
- [ ] Review all code for patterns and conventions

---

**Last Updated:** January 2025  
**Status:** 📋 **READY FOR IMPLEMENTATION**  
**Priority:** Medium (Enhancement, not critical)

**Remember:** Phases 1-2 are documentation-only and can be done quickly. Phase 3 is optional and can be implemented later if needed.
