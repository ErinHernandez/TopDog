# Sentry Alerts Verification Checklist

**Date:** January 2025  
**Purpose:** Verification checklist for all 3 Tier 1 Sentry alerts

---

## ✅ Alert 1: Fatal Error Alert

### Configuration Checklist

- [ ] **WHEN Block:**
  - [x] "A new issue is created" (default - should be present)

- [ ] **IF Block (Filters):**
  - [ ] Filter: "The event's level is equal to fatal"
    - [ ] Operator: `equal to` (or `equals`)
    - [ ] Value: `fatal`

- [ ] **THEN Block (Actions):**
  - [ ] Action 1: "Send a notification to Team"
    - [ ] Team: `#topdogdog` (or your team name)
  - [ ] Action 2: "Send a notification (for all legacy integrations)"
    - [ ] This sends email notifications

- [ ] **Alert Name:**
  - [x] Name: "Fatal Error Alert"

- [ ] **Status:**
  - [ ] Alert is enabled (toggle switch is "On")

**Expected Result:** Alert triggers when any error with level=fatal is created.

---

## ✅ Alert 2: Payment Error Alert

### Configuration Checklist

- [ ] **WHEN Block:**
  - [x] "A new issue is created" (default - should be present)

- [ ] **IF Block (Filters):**
  - [ ] Filter 1: "The event's tags match component equals Payment"
    - [ ] Key: `component`
    - [ ] Operator: `equals` (or `is equal to`)
    - [ ] Value: `Payment`
  - [ ] Filter 2: "The event's level is equal to error"
    - [ ] Operator: `equal to` (or `equals`)
    - [ ] Value: `error`

- [ ] **THEN Block (Actions):**
  - [ ] Action 1: "Send a notification to Team"
    - [ ] Team: `#topdogdog` (or your team name)
  - [ ] Action 2: "Send a notification (for all legacy integrations)"
    - [ ] This sends email notifications

- [ ] **Alert Name:**
  - [x] Name: "Payment Error Alert"

- [ ] **Status:**
  - [ ] Alert is enabled (toggle switch is "On")

**Expected Result:** Alert triggers when an error with component tag="Payment" AND level=error is created.

---

## ✅ Alert 3: Auth Error Alert

### Configuration Checklist

- [ ] **WHEN Block:**
  - [x] "A new issue is created" (default - should be present)

- [ ] **IF Block (Filters):**
  - [ ] Filter 1: "The event's tags match component equals Auth"
    - [ ] Key: `component`
    - [ ] Operator: `equals` (or `is equal to`)
    - [ ] Value: `Auth`
  - [ ] Filter 2: "The event's level is equal to error"
    - [ ] Operator: `equal to` (or `equals`)
    - [ ] Value: `error`

- [ ] **THEN Block (Actions):**
  - [ ] Action 1: "Send a notification to Team"
    - [ ] Team: `#topdogdog` (or your team name)
  - [ ] Action 2: "Send a notification (for all legacy integrations)"
    - [ ] This sends email notifications

- [ ] **Alert Name:**
  - [x] Name: "Auth Error Alert"

- [ ] **Status:**
  - [ ] Alert is enabled (toggle switch is "On")

**Expected Result:** Alert triggers when an error with component tag="Auth" AND level=error is created.

---

## How to Verify Configuration

### Option 1: View Alert Details (Recommended)

1. Go to: https://topdogdog.sentry.io/alerts/rules/
2. Click on each alert name:
   - Click "Fatal Error Alert"
   - Click "Payment Error Alert"
   - Click "Auth Error Alert"
3. On each alert's detail page, look for:
   - "Alert Condition" section (shows WHEN/IF/THEN blocks)
   - Review the configuration

### Option 2: Edit Alert (To See Full Configuration)

1. Go to: https://topdogdog.sentry.io/alerts/rules/
2. Click on the alert name
3. Click "Edit Rule" button
4. Review all sections:
   - Section 1: Environment and project
   - Section 2: Set conditions (WHEN/IF/THEN)
   - Section 3: Set action interval
   - Section 4: Add a name and owner

---

## Testing the Alerts

After verifying configuration, test each alert:

### Test Fatal Error Alert

```bash
curl -X POST https://your-domain.com/api/test-sentry \
  -H "Content-Type: application/json" \
  -d '{"type": "fatal", "message": "Test fatal error"}'
```

**Expected:** 
- Error appears in Sentry within 30 seconds
- Fatal Error Alert triggers
- Email/team notification received

### Test Payment Error Alert

```bash
curl -X POST https://your-domain.com/api/test-sentry \
  -H "Content-Type: application/json" \
  -d '{"type": "error", "component": "Payment", "message": "Test payment error"}'
```

**Expected:**
- Error appears in Sentry within 30 seconds
- Error has `component: Payment` tag (check issue details)
- Payment Error Alert triggers
- Email/team notification received

### Test Auth Error Alert

```bash
curl -X POST https://your-domain.com/api/test-sentry \
  -H "Content-Type: application/json" \
  -d '{"type": "error", "component": "Auth", "message": "Test auth error"}'
```

**Expected:**
- Error appears in Sentry within 30 seconds
- Error has `component: Auth` tag (check issue details)
- Auth Error Alert triggers
- Email/team notification received

---

## Common Issues to Check

### Issue: Alert Not Triggering

**Check:**
1. Alert is enabled (toggle switch is "On")
2. Filters match exactly (case-sensitive: `Payment` not `payment`)
3. Component tag is set correctly in your code
4. Error level matches (fatal, error)
5. Environment filter (if set) matches your deployment environment

### Issue: Notifications Not Received

**Check:**
1. Email address is verified in Sentry settings
2. Check spam/junk folder
3. Team notifications: Verify team/channel is selected correctly
4. Legacy integrations: Verify email is configured

### Issue: Wrong Alerts Triggering

**Check:**
1. Filter conditions are correct (component tag value, level)
2. No conflicting alerts with similar conditions
3. Check alert activity log to see what triggered

---

## Quick Reference

### Alert URLs (replace YOUR-ORG and YOUR-PROJECT)

- **Alerts List:** https://sentry.io/organizations/YOUR-ORG/alerts/rules/?project=YOUR-PROJECT
- **Your Alerts:** https://topdogdog.sentry.io/alerts/rules/

### Test Endpoint

- **URL:** `/api/test-sentry`
- **Documentation:** See `pages/api/test-sentry.ts` for usage

---

**Last Updated:** January 2025  
**Status:** Verification checklist for 3 Tier 1 alerts
