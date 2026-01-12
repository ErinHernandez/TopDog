# Sentry Alerts Setup Guide

**Last Updated:** January 2025  
**Purpose:** Complete guide for setting up and managing Sentry alerts

---

## Introduction

### Why Alerts Are Important

Sentry alerts provide real-time notifications when errors occur in your application. Without alerts, you might not discover critical issues until users report them, which could be hours or days later.

### What Alerts Provide

- **Immediate notification** of new errors
- **Error rate spikes** to catch sudden increases
- **Critical error detection** (fatal errors, payment errors, etc.)
- **Configurable notification channels** (email, Slack, PagerDuty)

### When to Use Alerts

Alerts are essential for:
- Production applications with active users
- Critical systems (payments, authentication, data processing)
- Applications where downtime impacts business

**Note:** Start with a small number of alerts and add more based on your actual error patterns.

---

## Prerequisites

Before setting up alerts, ensure:

1. **Sentry Account Setup:**
   - ✅ Sentry account created at https://sentry.io
   - ✅ Project created for your application
   - ✅ DSN configured in environment variables

2. **Environment Configuration:**
   - ✅ Sentry environments configured (production, preview, development)
   - ✅ Environment detection updated in Sentry config files
   - ✅ See `TIER1_ERROR_TRACKING_SETUP.md` Step 8.1 for details

3. **Basic Sentry Setup:**
   - ✅ Sentry DSN added to `.env.local` and production environment
   - ✅ Errors are being sent to Sentry (test with `/api/test-sentry`)
   - ✅ See `TIER1_ERROR_TRACKING_SETUP.md` for complete setup

---

## Alert Types Explained

### 1. Error Rate Alerts

**Purpose:** Detect sudden spikes in error rates

**When to Use:**
- Monitor overall error rate
- Detect system-wide issues
- Catch cascading failures

**Configuration:**
- Condition: Events per time period exceeds threshold
- Example: > 5 errors in 10 minutes
- **Important:** Start with higher thresholds, lower as you understand your baseline

### 2. First Seen Alerts

**Purpose:** Get notified immediately when new error types appear

**When to Use:**
- Production applications
- When you want to catch new bugs quickly
- For monitoring specific components

**Configuration:**
- Condition: First Seen Event
- Filters: Environment = production
- Action: Email notification

### 3. Issue State Change Alerts

**Purpose:** Track when issues are resolved, assigned, or change status

**When to Use:**
- Team workflow management
- Tracking resolution progress
- Daily/weekly digests

**Configuration:**
- Condition: Issue status changes
- Examples: Resolved, Assigned, Unassigned

### 4. Performance Alerts (Optional)

**Purpose:** Monitor performance degradation

**When to Use:**
- Performance-critical applications
- After enabling Sentry Performance Monitoring
- For monitoring specific transactions

**Configuration:**
- Condition: Transaction duration exceeds threshold
- Example: API route takes > 2 seconds

---

## Recommended Alert Thresholds (for New Apps)

For a new fantasy football app, use these thresholds:
- **Normal:** 0-2 errors per hour
- **Concerning:** 5+ errors per hour
- **Critical:** 10+ errors per hour

### Tier 1: Immediate Action (Start Here)

Start with these three alerts:

| Alert | Condition | Action | Why |
|-------|-----------|--------|-----|
| Fatal Error | Level = fatal | Email + Slack immediately | System crashes need immediate attention |
| Payment Error | Tag:component = Payment AND Level = error | Email + Slack immediately | Payment issues affect revenue |
| Auth Error | Tag:component = Auth AND Level = error | Email within 5 min | Authentication issues affect user access |

### Tier 2: Investigate Soon (Add After 1 Week)

Add these after you understand your baseline:

| Alert | Condition | Action | Why |
|-------|-----------|--------|-----|
| Error Spike | > 5 errors in 10 minutes | Email | Catch sudden increases in errors |
| New Error Type | First seen in production | Email | Be notified of new bugs immediately |

### Tier 3: Review Daily (Add After 1 Month)

Add these for ongoing monitoring:

| Alert | Condition | Action | Why |
|-------|-----------|--------|-----|
| High Error Volume | > 50 errors in 1 hour | Email digest | Monitor overall error trends |
| Unresolved Issues | Issue unresolved > 24 hours | Daily email | Track long-running issues |

**Important:** Start with Tier 1 only. Add Tier 2/3 after you understand your baseline and error patterns.

---

## Step-by-Step Setup

### Step 1: Navigate to Alerts

1. Go to https://sentry.io
2. Select your organization
3. Select your project
4. Navigate to: **Alerts** > **Alert Rules**

### Step 2: Create Your First Alert (Tier 1: Fatal Error)

1. Click **"Create Alert Rule"**
2. **Name:** "Fatal Error Alert"
3. **Condition:**
   - Select: "An issue's level is equal to..."
   - Value: `fatal`
   - Environment: `production` (if available)
4. **Actions:**
   - Select notification channels (Email required, Slack optional)
   - Set delivery: Immediate
5. Click **"Save Rule"**

### Step 3: Create Payment Error Alert (Tier 1)

1. Click **"Create Alert Rule"**
2. **Name:** "Payment Error Alert"
3. **Condition:**
   - Select: "An issue matches..."
   - Conditions:
     - Tag `component` equals `Payment`
     - AND Level equals `error`
   - Environment: `production`
4. **Actions:**
   - Select notification channels
   - Set delivery: Immediate
5. Click **"Save Rule"**

### Step 4: Create Error Spike Alert (Tier 2)

1. Click **"Create Alert Rule"**
2. **Name:** "Error Spike Alert"
3. **Condition:**
   - Select: "Number of events in an issue..."
   - Time window: `10 minutes`
   - Threshold: `> 5 events`
   - Environment: `production`
4. **Actions:**
   - Select notification channels (Email)
   - Set delivery: Immediate
5. Click **"Save Rule"**

### Step 5: Configure Notification Channels

1. Navigate to: **Settings** > **Notifications**
2. **Email:**
   - Add your email address
   - Verify email address
   - Set as default for alerts
3. **Slack (Optional):**
   - Click "Add Integration"
   - Follow Slack integration setup
   - Select workspace and channel
   - Test notification
4. **PagerDuty (Optional):**
   - Click "Add Integration"
   - Follow PagerDuty integration setup
   - Configure service and escalation policies

---

## Testing Alerts

### Test Error Spike Alert

```bash
# Trigger 15 errors in rapid succession (should trigger spike alert)
for i in {1..15}; do
  curl -X POST https://your-domain.com/api/test-sentry \
    -H "Content-Type: application/json" \
    -d '{"type": "error", "message": "Spike test '$i'"}'
  sleep 1
done
```

**Expected Result:**
- Errors appear in Sentry within 30 seconds
- Alert triggers after 6+ errors
- Email notification received

### Test Payment Error Alert

```bash
# Trigger a payment-tagged error
curl -X POST https://your-domain.com/api/test-sentry \
  -H "Content-Type: application/json" \
  -d '{"type": "error", "component": "Payment", "message": "Test payment error"}'
```

**Expected Result:**
- Error appears in Sentry
- Alert triggers immediately
- Email notification received

### Test Fatal Error Alert

```bash
# Trigger a fatal error
curl -X POST https://your-domain.com/api/test-sentry \
  -H "Content-Type: application/json" \
  -d '{"type": "fatal", "message": "Test fatal error"}'
```

**Expected Result:**
- Fatal error appears in Sentry
- Alert triggers immediately
- Email + Slack notification received (if configured)

**Note:** Update your `/api/test-sentry` endpoint to support these parameters. See `TIER1_ERROR_TRACKING_SETUP.md` Step 8.5 for details.

---

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

---

## Alert Management

### Modifying Alerts

1. Navigate to: **Alerts** > **Alert Rules**
2. Click on the alert you want to modify
3. Click **"Edit"**
4. Modify conditions, thresholds, or actions
5. Click **"Save Rule"**

### Disabling Alerts

1. Navigate to: **Alerts** > **Alert Rules**
2. Find the alert you want to disable
3. Toggle the switch to **"Off"**

**Note:** Disabled alerts are preserved and can be re-enabled later.

### Reviewing Alert History

1. Navigate to: **Alerts** > **Alert Activity**
2. Filter by:
   - Date range
   - Alert rule
   - Status (triggered, resolved)
3. Review:
   - When alerts triggered
   - Which issues triggered alerts
   - Alert effectiveness

---

## Troubleshooting

### Alerts Not Triggering

**Issue:** Alerts configured but not receiving notifications

**Solutions:**
1. Verify alert is enabled (toggle switch is "On")
2. Check alert conditions match your error patterns
3. Verify notification channels are configured correctly
4. Test with `/api/test-sentry` endpoint
5. Check Sentry dashboard for alert activity
6. Verify environment filters (if using) match your environment

### Too Many Alerts

**Issue:** Receiving too many notifications

**Solutions:**
1. Increase alert thresholds (e.g., 5 errors → 10 errors)
2. Add environment filters (production only)
3. Use issue filters to exclude non-critical errors
4. Adjust notification frequency (immediate → digest)
5. Disable less critical alerts
6. Review alert effectiveness and remove unnecessary alerts

### Alerts Triggering for Preview Deployments

**Issue:** Receiving alerts for preview/staging environments

**Solutions:**
1. Configure Sentry environments (see `TIER1_ERROR_TRACKING_SETUP.md` Step 8.1)
2. Add environment filter to alerts: `Environment = production`
3. Verify Sentry config files use Vercel environment variables
4. Check environment detection in Sentry dashboard

### Missing Notifications

**Issue:** Alerts triggering but not receiving emails/Slack messages

**Solutions:**
1. Verify email address is correct and verified
2. Check spam/junk folder
3. Verify Slack integration is configured correctly
4. Check Slack channel permissions
5. Test notification channels manually
6. Review Sentry notification settings

---

## Best Practices

### Starting Out

1. **Start with Tier 1 only** - 3 critical alerts maximum
2. **Monitor for 1-2 weeks** - Understand your baseline error rates
3. **Adjust thresholds** - Based on actual error patterns
4. **Add Tier 2 alerts** - After understanding baseline
5. **Review weekly** - Alert effectiveness and thresholds

### Ongoing Management

1. **Review alerts monthly** - Remove unnecessary alerts
2. **Adjust thresholds quarterly** - Based on error rate trends
3. **Use different channels** - Email for critical, Slack for updates
4. **Don't create too many alerts** - Alert fatigue reduces effectiveness
5. **Document alert purpose** - Add descriptions to alert rules

### Alert Naming

Use descriptive names:
- ✅ "Fatal Error Alert"
- ✅ "Payment Error - Production"
- ✅ "Error Spike - 5+ in 10min"
- ❌ "Alert 1"
- ❌ "New Alert"
- ❌ "Test"

---

## Next Steps

After setting up alerts:

1. ✅ **Test all alerts** - Verify notifications work
2. ✅ **Monitor for 24-48 hours** - See actual alert frequency
3. ✅ **Adjust thresholds** - Based on real error patterns
4. ✅ **Set up Slack integration** - For team notifications (optional)
5. ✅ **Review weekly** - Alert effectiveness and error trends

---

## Additional Resources

- **Sentry Documentation:** https://docs.sentry.io/product/alerts/
- **Sentry Setup Guide:** `TIER1_ERROR_TRACKING_SETUP.md`
- **Monitoring Guide:** `docs/MONITORING_SETUP.md`
- **Test Endpoint:** `/api/test-sentry`

---

**Last Updated:** January 2025  
**Status:** Complete guide for Sentry alerts setup
