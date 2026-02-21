# Sentry Alerts Setup - Manual Checklist

**Purpose:** Step-by-step checklist for manually configuring Sentry alerts  
**Time Required:** 30-60 minutes  
**Reference:** See `docs/SENTRY_ALERTS_SETUP.md` for detailed instructions

---

## Prerequisites Check

Before starting, verify:

- [ ] Sentry account created at https://sentry.io
- [ ] Sentry project created for your application
- [ ] Sentry DSN configured in environment variables (`.env.local` and Vercel)
- [ ] Code changes deployed (environment detection updates)
- [ ] Test endpoint works: `curl https://your-domain.com/api/test-sentry`

---

## Step 1: Configure Sentry Environments

**Time:** 5 minutes  
**Reference:** `TIER1_ERROR_TRACKING_SETUP.md` Step 8.1

1. **Navigate to Sentry Dashboard:**
   - Go to https://sentry.io
   - Log in to your account
   - Select your organization
   - Select your project

2. **Go to Environment Settings:**
   - Click **Settings** (gear icon)
   - Click **Projects** > **[Your Project Name]**
   - Click **Environments** in the left sidebar

3. **Add Environments:**
   - [ ] Add `production` environment
     - Name: `production`
     - Description: "Production environment"
   - [ ] Add `preview` environment
     - Name: `preview`
     - Description: "Preview deployments (staging)"
   - [ ] Add `development` environment
     - Name: `development`
     - Description: "Local development"

4. **Verify Environment Detection:**
   - Deploy your code (or check recent errors)
   - Go to **Issues** > Select an issue
   - Check that the environment shows correctly (production, preview, or development)
   - [ ] Environment detection is working

**✅ Step 1 Complete:** Environments configured

---

## Step 2: Configure Notification Channels

**Time:** 10 minutes  
**Reference:** `docs/SENTRY_ALERTS_SETUP.md` - Step 5

### 2.1 Email Notifications (Required)

1. **Navigate to Notification Settings:**
   - Click **Settings** (gear icon)
   - Click **Notifications** in the left sidebar

2. **Add Email Address:**
   - [ ] Click **"Add Email"**
   - [ ] Enter your email address
   - [ ] Click **"Save"**
   - [ ] Check your email for verification link
   - [ ] Click verification link in email
   - [ ] Email verified

3. **Set Email as Default:**
   - [ ] Check "Use as default for alerts"
   - [ ] Save settings

### 2.2 Slack Integration (Optional but Recommended)

1. **Navigate to Integrations:**
   - Click **Settings** (gear icon)
   - Click **Integrations** in the left sidebar

2. **Add Slack Integration:**
   - [ ] Find "Slack" in the integrations list
   - [ ] Click **"Install"**
   - [ ] Authorize Sentry to access your Slack workspace
   - [ ] Select channel for notifications (e.g., `#alerts` or `#engineering`)
   - [ ] Save settings

**✅ Step 2 Complete:** Notification channels configured

---

## Step 3: Create Tier 1 Alerts

**Time:** 20 minutes  
**Reference:** `TIER1_ERROR_TRACKING_SETUP.md` Step 8.5 or `docs/SENTRY_ALERTS_SETUP.md`

### 3.1 Fatal Error Alert

1. **Navigate to Alerts:**
   - Click **Alerts** in the top navigation
   - Click **Alert Rules** in the left sidebar
   - Click **"Create Alert Rule"**

2. **Configure Alert:**
   - [ ] **Name:** "Fatal Error Alert"
   - [ ] **Condition:** "An issue's level is equal to..."
   - [ ] **Value:** Select `fatal`
   - [ ] **Environment:** Select `production` (or leave blank for all)
   - [ ] **Actions:** Select notification channels
     - [ ] Email: ✅ (checked)
     - [ ] Slack: ✅ (checked if configured)
   - [ ] **Delivery:** Immediate
   - [ ] Click **"Save Rule"**

**✅ Fatal Error Alert Created**

### 3.2 Payment Error Alert

1. **Create New Alert:**
   - Click **"Create Alert Rule"**

2. **Configure Alert:**
   - [ ] **Name:** "Payment Error Alert"
   - [ ] **Condition:** "An issue matches..."
   - [ ] **Add Condition 1:**
     - Field: `tags.component`
     - Operator: `equals`
     - Value: `Payment`
   - [ ] **Add Condition 2:**
     - Field: `level`
     - Operator: `equals`
     - Value: `error`
   - [ ] **Environment:** Select `production`
   - [ ] **Actions:** Select notification channels
     - [ ] Email: ✅ (checked)
     - [ ] Slack: ✅ (checked if configured)
   - [ ] **Delivery:** Immediate
   - [ ] Click **"Save Rule"**

**✅ Payment Error Alert Created**

### 3.3 Auth Error Alert

1. **Create New Alert:**
   - Click **"Create Alert Rule"**

2. **Configure Alert:**
   - [ ] **Name:** "Auth Error Alert"
   - [ ] **Condition:** "An issue matches..."
   - [ ] **Add Condition 1:**
     - Field: `tags.component`
     - Operator: `equals`
     - Value: `Auth`
   - [ ] **Add Condition 2:**
     - Field: `level`
     - Operator: `equals`
     - Value: `error`
   - [ ] **Environment:** Select `production`
   - [ ] **Actions:** Select notification channels
     - [ ] Email: ✅ (checked)
   - [ ] **Delivery:** Within 5 minutes
   - [ ] Click **"Save Rule"**

**✅ Auth Error Alert Created**

---

## Step 4: Test Alerts

**Time:** 10 minutes  
**Reference:** `docs/SENTRY_ALERTS_SETUP.md` - Testing Alerts

### 4.1 Test Fatal Error Alert

1. **Trigger Test Error:**

   ```bash
   curl -X POST https://your-domain.com/api/test-sentry \
     -H "Content-Type: application/json" \
     -d '{"type": "fatal", "message": "Test fatal error"}'
   ```

2. **Verify:**
   - [ ] Error appears in Sentry Issues within 30 seconds
   - [ ] Alert triggers in Sentry Alerts
   - [ ] Email notification received
   - [ ] Slack notification received (if configured)

### 4.2 Test Payment Error Alert

1. **Trigger Test Error:**

   ```bash
   curl -X POST https://your-domain.com/api/test-sentry \
     -H "Content-Type: application/json" \
     -d '{"type": "error", "component": "Payment", "message": "Test payment error"}'
   ```

2. **Verify:**
   - [ ] Error appears in Sentry Issues within 30 seconds
   - [ ] Error has `component: Payment` tag (check issue details)
   - [ ] Alert triggers
   - [ ] Email notification received
   - [ ] Slack notification received (if configured)

### 4.3 Test Auth Error Alert

1. **Trigger Test Error:**

   ```bash
   curl -X POST https://your-domain.com/api/test-sentry \
     -H "Content-Type: application/json" \
     -d '{"type": "error", "component": "Auth", "message": "Test auth error"}'
   ```

2. **Verify:**
   - [ ] Error appears in Sentry Issues within 30 seconds
   - [ ] Error has `component: Auth` tag
   - [ ] Alert triggers
   - [ ] Email notification received

**✅ Step 4 Complete:** All alerts tested and working

---

## Step 5: Verify Configuration

**Time:** 5 minutes

1. **Check Alert Rules:**
   - [ ] Go to **Alerts** > **Alert Rules**
   - [ ] Verify all 3 Tier 1 alerts are listed
   - [ ] Verify all alerts are enabled (toggle switch is "On")
   - [ ] Verify notification channels are configured

2. **Review Recent Alerts:**
   - [ ] Go to **Alerts** > **Alert Activity**
   - [ ] Verify test alerts appear in activity log
   - [ ] Check that notifications were sent

3. **Review Test Issues:**
   - [ ] Go to **Issues**
   - [ ] Find test errors (search for "Test" or "SentryTestError")
   - [ ] Verify component tags are set correctly
   - [ ] Verify error levels are correct (fatal, error)
   - [ ] Clean up test issues (optional - resolve or delete)

**✅ Step 5 Complete:** Configuration verified

---

## Next Steps (Optional)

### Add Tier 2 Alerts (After 1 Week)

After monitoring for 1 week, consider adding:

- [ ] Error Spike Alert (> 5 errors in 10 minutes)
- [ ] New Error Type Alert (first seen in production)

**Reference:** `TIER1_ERROR_TRACKING_SETUP.md` Step 8.5 - Tier 2

### Add Slack Integration (If Not Done)

- [ ] Configure Slack workspace integration
- [ ] Add Slack channel for critical alerts
- [ ] Test Slack notifications

---

## Troubleshooting

### Alerts Not Triggering

1. **Check Alert Status:**
   - Go to Alerts > Alert Rules
   - Verify alert is enabled (toggle is "On")
   - Check alert conditions match your test errors

2. **Check Environment:**
   - Verify environment filter matches your deployment
   - Check that environment is detected correctly in issues

3. **Check Notification Channels:**
   - Verify email is verified
   - Check spam/junk folder
   - Verify Slack integration is active

### Notifications Not Received

1. **Email:**
   - Check spam/junk folder
   - Verify email address is correct and verified
   - Check Sentry notification settings

2. **Slack:**
   - Verify Slack integration is installed
   - Check channel permissions
   - Verify channel is selected in alert configuration

### Test Errors Not Appearing

1. **Check DSN:**
   - Verify `NEXT_PUBLIC_SENTRY_DSN` is set
   - Check environment variables are loaded

2. **Check Deployment:**
   - Verify code changes are deployed
   - Check that environment detection is working

3. **Check Sentry Dashboard:**
   - Look in Issues page (may take 30 seconds)
   - Check for errors in console/network tab

---

## Success Criteria

- [x] All 3 Tier 1 alerts created and enabled
- [x] Email notifications configured and verified
- [x] All alerts tested successfully
- [x] Notifications received for test alerts
- [x] Alert activity shows test alerts

**✅ All Tier 1 Alerts Configured Successfully!**

---

**Last Updated:** January 2025  
**Estimated Time:** 30-60 minutes  
**Status:** Ready for manual configuration
