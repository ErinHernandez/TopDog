# Monitoring Setup Guide

## Overview

This guide covers setting up basic monitoring for the BestBall site using free tools:
- **Vercel Analytics** - Performance metrics (if deployed on Vercel)
- **UptimeRobot** - Uptime monitoring and alerts

## 1. Health Check Endpoint

A health check endpoint is available at `/api/health` for uptime monitoring.

### Endpoint Details

- **URL:** `https://your-domain.com/api/health`
- **Method:** GET
- **Response:** JSON with status, uptime, and health checks

### Example Response

```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00Z",
  "uptime": 86400,
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "api": "ok"
  }
}
```

### Status Codes

- **200 OK** - Application is healthy
- **503 Service Unavailable** - Application is down or degraded

### Usage

This endpoint is designed for:
- Uptime monitoring services (UptimeRobot, Pingdom, etc.)
- Load balancer health checks
- Kubernetes liveness/readiness probes
- CI/CD deployment verification

---

## 2. Vercel Analytics

If your site is deployed on Vercel, analytics are available automatically.

### Setup

1. **Enable in Vercel Dashboard:**
   - Go to your project settings
   - Navigate to "Analytics"
   - Enable "Web Analytics"

2. **Verify in Code:**
   - Vercel Analytics is automatically injected
   - No code changes needed

### What You Get

- **Performance Metrics:**
  - Page load times
  - Core Web Vitals (LCP, FID, CLS)
  - Time to First Byte (TTFB)
  - First Contentful Paint (FCP)

- **Traffic Metrics:**
  - Page views
  - Unique visitors
  - Top pages
  - Referrers

### Access

- View analytics in Vercel Dashboard
- Navigate to: Project → Analytics tab

---

## 3. UptimeRobot Setup

UptimeRobot provides free uptime monitoring with email alerts.

### Step 1: Sign Up

1. Go to https://uptimerobot.com
2. Sign up for a free account (50 monitors free)

### Step 2: Add Monitors

#### Monitor 1: Main Site

1. Click "Add New Monitor"
2. **Monitor Type:** HTTP(s)
3. **Friendly Name:** BestBall Site
4. **URL:** `https://your-domain.com`
5. **Monitoring Interval:** 5 minutes (free tier)
6. **Alert Contacts:** Add your email
7. Click "Create Monitor"

#### Monitor 2: Health Check Endpoint

1. Click "Add New Monitor"
2. **Monitor Type:** HTTP(s)
3. **Friendly Name:** BestBall Health Check
4. **URL:** `https://your-domain.com/api/health`
5. **Monitoring Interval:** 5 minutes
6. **Alert Contacts:** Add your email
7. **Expected Status Code:** 200
8. **Keyword:** `"status":"ok"` (optional - verifies response content)
9. Click "Create Monitor"

### Step 3: Configure Alerts

1. Go to "Alert Contacts"
2. Add your email address
3. Verify email address
4. Set alert preferences:
   - **Down Alert:** Immediate
   - **Up Alert:** Optional (notify when site comes back up)

### Step 4: Test Alerts

1. Temporarily disable your site (or use a test endpoint)
2. Wait for UptimeRobot to detect downtime
3. Verify you receive an email alert
4. Re-enable your site
5. Verify you receive an "up" alert (if enabled)

---

## 4. Advanced Monitoring (Future)

For more comprehensive monitoring, consider:

### Application Performance Monitoring (APM)

- **New Relic** - Full-featured APM (free tier available)
- **Datadog** - Infrastructure and APM (free tier available)
- **Sentry Performance** - Already using Sentry for errors, can add performance

### Real User Monitoring (RUM)

- **Vercel Analytics** - Already available if on Vercel
- **Google Analytics** - Free, but privacy concerns
- **Plausible** - Privacy-focused alternative

### Synthetic Monitoring

- **UptimeRobot** - Already set up (basic)
- **Pingdom** - More advanced (paid)
- **StatusCake** - Free tier available

### Log Aggregation

- **Vercel Logs** - Available in Vercel Dashboard
- **Logtail** - Free tier available
- **Datadog Logs** - If using Datadog APM

---

## 5. Monitoring Best Practices

### Health Check Endpoint

- ✅ Keep response time < 100ms
- ✅ Don't include sensitive data in responses
- ✅ Use appropriate HTTP status codes
- ✅ Add checks for critical dependencies (database, APIs)
- ✅ Set proper cache headers (no-cache for health checks)

### Alert Configuration

- ✅ Set reasonable alert thresholds (don't alert on every blip)
- ✅ Use different alert channels for different severity levels
- ✅ Include context in alerts (what failed, when, why)
- ✅ Test alerts regularly

### Monitoring Coverage

- ✅ Monitor main site
- ✅ Monitor API endpoints
- ✅ Monitor critical user flows (draft room, payments)
- ✅ Monitor external dependencies (payment providers)

---

## 6. Troubleshooting

### Health Check Returns 503

1. Check application logs
2. Verify environment variables are set
3. Check database connectivity (if applicable)
4. Review recent deployments

### UptimeRobot Not Receiving Alerts

1. Verify email address is correct
2. Check spam folder
3. Verify monitor is active (not paused)
4. Check alert contact settings

### False Positives

1. Adjust monitoring interval (longer = fewer false positives)
2. Add keyword matching to verify response content
3. Use multiple monitoring services for redundancy

---

## 7. Quick Reference

### Health Check Endpoint

```bash
# Test health check
curl https://your-domain.com/api/health

# Expected response
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00Z",
  "uptime": 86400,
  "version": "1.0.0",
  "environment": "production"
}
```

### UptimeRobot URLs

- **Dashboard:** https://uptimerobot.com/dashboard
- **Add Monitor:** https://uptimerobot.com/dashboard#addMonitor
- **Alert Contacts:** https://uptimerobot.com/dashboard#alertContacts

### Vercel Analytics

- **Dashboard:** https://vercel.com/dashboard
- **Project Analytics:** Project → Analytics tab

---

**Last Updated:** January 2025  
**Status:** Basic monitoring setup complete
