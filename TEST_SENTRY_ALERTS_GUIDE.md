# Test Sentry Alerts - Complete Guide

**Date:** January 2025  
**Purpose:** Step-by-step guide to test all 3 Tier 1 Sentry alerts

---

## Prerequisites

Before testing, ensure:

- ✅ All 3 alerts are created in Sentry (Fatal, Payment, Auth)
- ✅ Application is deployed to production (or accessible environment)
- ✅ Sentry DSN is configured in environment variables
- ✅ Email notifications are configured in Sentry

---

## Testing Methods

### Method 1: Automated Script (Recommended)

Use the automated testing script:

```bash
# For local testing
./scripts/test-all-sentry-alerts.sh

# For production testing (replace with your domain)
./scripts/test-all-sentry-alerts.sh https://your-domain.com
```

The script will:
1. Test all 3 alerts sequentially
2. Wait 5 seconds between tests
3. Show success/failure for each test
4. Provide next steps after testing

---

### Method 2: Manual Testing (cURL)

Test each alert individually using cURL:

#### Test 1: Fatal Error Alert

```bash
curl -X POST https://your-domain.com/api/test-sentry \
  -H "Content-Type: application/json" \
  -d '{
    "type": "fatal",
    "message": "🧪 Test fatal error - Sentry alert test"
  }'
```

**Expected Result:**
- HTTP 200 response
- Error appears in Sentry within 30 seconds
- Fatal Error Alert triggers
- Email notification received

**Verify in Sentry:**
- Go to: https://topdogdog.sentry.io/issues/
- Look for error with level: **fatal**
- Check error details

---

#### Test 2: Payment Error Alert

```bash
curl -X POST https://your-domain.com/api/test-sentry \
  -H "Content-Type: application/json" \
  -d '{
    "type": "error",
    "component": "Payment",
    "message": "🧪 Test payment error - Sentry alert test"
  }'
```

**Expected Result:**
- HTTP 200 response
- Error appears in Sentry within 30 seconds
- Error has tag: `component: Payment`
- Payment Error Alert triggers
- Email notification received

**Verify in Sentry:**
- Go to: https://topdogdog.sentry.io/issues/
- Look for error with tag: **component: Payment**
- Check error level is: **error**
- Verify alert triggered

---

#### Test 3: Auth Error Alert

```bash
curl -X POST https://your-domain.com/api/test-sentry \
  -H "Content-Type: application/json" \
  -d '{
    "type": "error",
    "component": "Auth",
    "message": "🧪 Test auth error - Sentry alert test"
  }'
```

**Expected Result:**
- HTTP 200 response
- Error appears in Sentry within 30 seconds
- Error has tag: `component: Auth`
- Auth Error Alert triggers
- Email notification received

**Verify in Sentry:**
- Go to: https://topdogdog.sentry.io/issues/
- Look for error with tag: **component: Auth**
- Check error level is: **error**
- Verify alert triggered

---

## Verification Steps

### Step 1: Check Sentry Issues

1. **Go to Sentry Dashboard:**
   - URL: https://topdogdog.sentry.io/issues/

2. **Look for Test Errors:**
   - Search for "SentryTestError" or "Test error"
   - You should see 3 new issues (one for each alert)

3. **Verify Each Error:**
   - **Fatal Error:** Should have level = **fatal**, no component tag
   - **Payment Error:** Should have level = **error**, tag = **component: Payment**
   - **Auth Error:** Should have level = **error**, tag = **component: Auth**

4. **Check Error Details:**
   - Click on each error
   - Verify tags are correct
   - Check error level
   - Review error message

---

### Step 2: Check Alert Activity

1. **Go to Alert Activity:**
   - URL: https://topdogdog.sentry.io/alerts/activity/

2. **Filter by Time:**
   - Select "Last 24 hours" or "Last hour"
   - You should see all 3 alerts triggered

3. **Verify Each Alert:**
   - **Fatal Error Alert:** Should show as triggered
   - **Payment Error Alert:** Should show as triggered
   - **Auth Error Alert:** Should show as triggered

4. **Check Alert Details:**
   - Click on each alert activity
   - Verify the issue that triggered it
   - Check notification delivery status

---

### Step 3: Check Notifications

1. **Check Email:**
   - Check your email inbox
   - Look for 3 Sentry alert emails (one for each alert)
   - Verify email contains correct alert name and error details

2. **Check Email Content:**
   - Email should show alert name
   - Email should show error message
   - Email should have link to Sentry dashboard

3. **Check Spam Folder:**
   - If emails not received, check spam/junk folder
   - Mark as "Not Spam" if found

---

### Step 4: Verify Alert Configuration

1. **Go to Alert Rules:**
   - URL: https://topdogdog.sentry.io/alerts/rules/

2. **Verify Fatal Error Alert:**
   - Click on "Fatal Error Alert"
   - Click "Edit Rule"
   - Verify IF block: Level = **fatal**
   - Verify THEN block: Has notification actions
   - Verify alert is enabled (toggle is "On")

3. **Verify Payment Error Alert:**
   - Click on "Payment Error Alert"
   - Click "Edit Rule"
   - Verify IF block: 
     - Filter 1: Component tag = **Payment**
     - Filter 2: Level = **error**
   - Verify THEN block: Has notification actions
   - Verify alert is enabled

4. **Verify Auth Error Alert:**
   - Click on "Auth Error Alert"
   - Click "Edit Rule"
   - Verify IF block:
     - Filter 1: Component tag = **Auth**
     - Filter 2: Level = **error**
   - Verify THEN block: Has notification actions
   - Verify alert is enabled

---

## Troubleshooting

### Issue: Alert Not Triggering

**Possible Causes:**
1. Alert is disabled (toggle is "Off")
2. Filter conditions don't match error
3. Error environment doesn't match alert filter
4. Alert threshold not met (for rate-based alerts)

**Solutions:**
1. Check alert is enabled in Sentry dashboard
2. Verify filter conditions match test error
3. Check error environment tag in Sentry
4. Verify alert conditions are correct

---

### Issue: Error Not Appearing in Sentry

**Possible Causes:**
1. Sentry DSN not configured
2. Error not being sent to Sentry
3. Wrong Sentry project
4. Network issues

**Solutions:**
1. Verify `NEXT_PUBLIC_SENTRY_DSN` is set in environment
2. Check application logs for Sentry errors
3. Verify DSN matches Sentry project
4. Check network connectivity

---

### Issue: Notifications Not Received

**Possible Causes:**
1. Email not configured in Sentry
2. Email address not verified
3. Notifications disabled for alert
4. Email in spam folder

**Solutions:**
1. Check Sentry settings > Notifications
2. Verify email address is verified
3. Check alert actions include email notification
4. Check spam/junk folder

---

### Issue: Wrong Alert Triggering

**Possible Causes:**
1. Filter conditions are incorrect
2. Multiple alerts with similar conditions
3. Alert priority/order issue

**Solutions:**
1. Review filter conditions in alert configuration
2. Check for conflicting alerts
3. Verify alert conditions are specific enough

---

## Testing Checklist

Use this checklist to verify testing:

### Before Testing
- [ ] Application is running/accessible
- [ ] Sentry DSN is configured
- [ ] All 3 alerts are created
- [ ] Email notifications are configured

### During Testing
- [ ] Test Fatal Error Alert
- [ ] Test Payment Error Alert
- [ ] Test Auth Error Alert
- [ ] Wait 30 seconds for errors to appear

### After Testing
- [ ] All 3 errors appear in Sentry
- [ ] Errors have correct tags/levels
- [ ] All 3 alerts triggered
- [ ] Email notifications received
- [ ] Alert configuration verified

---

## Next Steps After Testing

1. **Monitor for 1 Week:**
   - Check alerts daily
   - Verify no false positives
   - Adjust thresholds if needed

2. **Set Up Slack (Optional):**
   - Connect Slack to Sentry
   - Add Slack notifications to alerts

3. **Consider Tier 2 Alerts:**
   - After 1 week, add Tier 2 alerts if needed
   - See `docs/SENTRY_ALERTS_SETUP.md` for details

---

## Reference

- **Sentry Dashboard:** https://topdogdog.sentry.io/
- **Alerts:** https://topdogdog.sentry.io/alerts/rules/
- **Issues:** https://topdogdog.sentry.io/issues/
- **Alert Activity:** https://topdogdog.sentry.io/alerts/activity/
- **Setup Guide:** `docs/SENTRY_ALERTS_SETUP.md`
- **Verification Checklist:** `SENTRY_ALERTS_VERIFICATION_CHECKLIST.md`

---

**Last Updated:** January 2025  
**Status:** Ready for testing
