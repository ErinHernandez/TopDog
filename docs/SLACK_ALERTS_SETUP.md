# Slack Alerts Setup Guide
**Configure Slack webhooks for security monitoring alerts**

---

## Overview

The security monitoring system can send alerts to Slack when security events occur (rate limits exceeded, suspicious activity, etc.).

---

## Step 1: Create Slack Webhook

1. Go to [Slack API Apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name: `Bestball Security Alerts`
4. Select your workspace
5. Go to "Incoming Webhooks" → Enable
6. Click "Add New Webhook to Workspace"
7. Select channel (e.g., `#security-alerts`)
8. Copy the webhook URL

---

## Step 2: Add Environment Variable

### Local Development
Add to `.env.local`:
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Vercel Production
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - Name: `SLACK_WEBHOOK_URL`
   - Value: Your webhook URL
   - Environment: Production (and Preview if desired)
3. Redeploy

---

## Step 3: Test

The security monitoring system will automatically send alerts to Slack when:
- Rate limits are exceeded
- Suspicious activity is detected
- Security events occur

### Manual Test
You can test by triggering a rate limit:
```typescript
// This will send a Slack alert if rate limit is exceeded
import { checkRateLimit } from '@/lib/securityMonitoring';
await checkRateLimit('test-event', '127.0.0.1', 10, 60);
```

---

## Alert Format

Slack alerts include:
- Event type
- Count vs threshold
- IP address
- Timestamp

Example:
```
🚨 Security Alert: auth_failure rate exceeded

Count: 15/10
IP Address: 192.168.1.1
Time: 2025-01-14T19:30:00Z
```

---

## Optional: PagerDuty Integration

For critical alerts, you can also integrate with PagerDuty:

1. Create PagerDuty service
2. Get integration key
3. Add to environment variables: `PAGERDUTY_INTEGRATION_KEY`
4. Update `lib/securityMonitoring.js` to send critical alerts to PagerDuty

---

## Troubleshooting

### Alerts Not Sending
1. Check `SLACK_WEBHOOK_URL` is set
2. Verify webhook URL is correct
3. Check Slack app has permission to post to channel
4. Review server logs for errors

### Too Many Alerts
- Adjust rate limit thresholds in `lib/securityMonitoring.js`
- Add filtering logic to reduce noise
- Use different channels for different severity levels

---

**Status:** Ready to configure! 🚀
