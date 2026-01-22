# Rate Limiting Improvement - Implementation Handoff

**Status:** 🟡 Ready for Implementation  
**Priority:** Medium (Security Enhancement)  
**Estimated Time:** 2-3 weeks  
**Created:** January 2025

---

## Quick Start

This document provides step-by-step instructions to implement an improved rate limiting system that:
- ✅ Maintains VPN/proxy access (no blocking)
- ✅ Uses in-memory storage (5-20x faster)
- ✅ Implements progressive limits (higher for authenticated users)
- ✅ Adds monitoring for suspicious patterns

**Key Principle:** Monitor and detect abuse, don't block legitimate VPN users.

---

## Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Create device fingerprinting helper
- [ ] Create monitoring service
- [ ] Create rate limit config V2
- [ ] Review existing `rateLimiterV2.js` (already created)
- [ ] Write unit tests

### Phase 2: Integration
- [ ] Update signup endpoint
- [ ] Update username check endpoint
- [ ] Update payment intent endpoint
- [ ] Add device ID extraction to API middleware
- [ ] Test in parallel with V1

### Phase 3: Monitoring
- [ ] Create admin monitoring API
- [ ] Create admin dashboard
- [ ] Set up Firestore export
- [ ] Configure alert thresholds

### Phase 4: Documentation
- [ ] Update security docs
- [ ] Create monitoring runbook
- [ ] Document migration process

---

## Phase 1: Core Infrastructure

### Step 1.1: Create Device Fingerprinting Helper

**File:** `lib/rateLimiting/deviceFingerprint.js`

```javascript
/**
 * Device Fingerprinting Helper for Rate Limiting
 * 
 * Extracts device ID from request headers.
 * Gracefully falls back if device ID is missing.
 */

/**
 * Extract device ID from request headers
 * @param {Object} req - Next.js request object
 * @returns {string|null} Device ID or null
 */
export function extractDeviceId(req) {
  const deviceId = req.headers['x-device-id'];
  
  if (!deviceId) {
    return null;
  }
  
  // Validate format: should be alphanumeric with underscores/hyphens
  // Format: device_<timestamp>_<random>
  if (!/^device_[a-zA-Z0-9_-]+$/.test(deviceId)) {
    console.warn('[RateLimiting] Invalid device ID format:', deviceId);
    return null;
  }
  
  return deviceId;
}

/**
 * Extract session ID from request headers
 * @param {Object} req - Next.js request object
 * @returns {string|null} Session ID or null
 */
export function extractSessionId(req) {
  return req.headers['x-session-id'] || null;
}

export default {
  extractDeviceId,
  extractSessionId,
};
```

**Testing:**
```javascript
// Test cases
extractDeviceId({ headers: { 'x-device-id': 'device_1234567890_abc123' } }) // ✅ Valid
extractDeviceId({ headers: { 'x-device-id': 'invalid' } }) // ❌ Invalid format
extractDeviceId({ headers: {} }) // ✅ Returns null (graceful fallback)
```

---

### Step 1.2: Create Monitoring Service

**File:** `lib/rateLimiting/monitoringService.js`

```javascript
/**
 * Rate Limiting Monitoring Service
 * 
 * Tracks suspicious patterns without blocking.
 * Focuses on detection and alerting.
 */

class MonitoringService {
  constructor() {
    // High activity IPs (approaching limits)
    this.highActivityIPs = new Map();
    
    // Suspicious user patterns (multiple IPs, rapid switching)
    this.suspiciousPatterns = new Map();
    
    // Cleanup interval
    this.cleanupInterval = null;
    this.startCleanup();
  }

  /**
   * Record high activity from an IP
   */
  recordHighActivity(ip, endpoint, usagePercent, context) {
    const key = ip;
    const current = this.highActivityIPs.get(key) || {
      ip,
      endpoints: new Set(),
      firstSeen: Date.now(),
      requestCount: 0,
      maxUsagePercent: 0,
    };
    
    current.endpoints.add(endpoint);
    current.requestCount++;
    current.lastSeen = Date.now();
    current.maxUsagePercent = Math.max(current.maxUsagePercent, usagePercent);
    
    // Add context if available
    if (context.userId) {
      current.userIds = current.userIds || new Set();
      current.userIds.add(context.userId);
    }
    
    this.highActivityIPs.set(key, current);
    
    // Log if above alert threshold
    if (usagePercent >= 0.95) {
      this.logAlert('high_activity', {
        ip,
        endpoint,
        usagePercent: (usagePercent * 100).toFixed(1) + '%',
        userId: context.userId,
        deviceId: context.deviceId,
      });
    }
  }

  /**
   * Record suspicious user pattern
   */
  recordSuspiciousPattern(userId, ip, deviceId, endpoint) {
    const key = `user:${userId}`;
    const pattern = this.suspiciousPatterns.get(key) || {
      userId,
      ips: new Set(),
      devices: new Set(),
      endpoints: new Set(),
      firstSeen: Date.now(),
      requestCount: 0,
    };
    
    pattern.ips.add(ip);
    if (deviceId) pattern.devices.add(deviceId);
    pattern.endpoints.add(endpoint);
    pattern.requestCount++;
    pattern.lastSeen = Date.now();
    
    this.suspiciousPatterns.set(key, pattern);
    
    // Check for suspicious patterns
    const timeWindow = 60 * 60 * 1000; // 1 hour
    const timeElapsed = Date.now() - pattern.firstSeen;
    
    // Flag if using many IPs in short time
    if (timeElapsed < timeWindow && pattern.ips.size >= 5) {
      this.logAlert('rapid_ip_switching', {
        userId,
        uniqueIPs: pattern.ips.size,
        uniqueDevices: pattern.devices.size,
        requestCount: pattern.requestCount,
        timeWindow: '1 hour',
        note: 'May be VPN usage or abuse - review manually',
      });
    }
  }

  /**
   * Log alert (console for now, can be extended to Firestore/Sentry)
   */
  logAlert(type, data) {
    console.warn(`[RateLimiting Alert] ${type}:`, data);
    
    // TODO: Send to Firestore for historical analysis
    // TODO: Send to Sentry for alerting
  }

  /**
   * Get monitoring stats
   */
  getStats() {
    return {
      highActivityIPs: Array.from(this.highActivityIPs.entries()).map(
        ([ip, data]) => ({
          ip,
          requestCount: data.requestCount,
          endpoints: Array.from(data.endpoints),
          maxUsagePercent: data.maxUsagePercent,
          userIds: data.userIds ? Array.from(data.userIds) : [],
          firstSeen: new Date(data.firstSeen).toISOString(),
          lastSeen: new Date(data.lastSeen).toISOString(),
        })
      ),
      suspiciousPatterns: Array.from(this.suspiciousPatterns.entries()).map(
        ([key, pattern]) => ({
          userId: pattern.userId,
          uniqueIPs: pattern.ips.size,
          uniqueDevices: pattern.devices.size,
          requestCount: pattern.requestCount,
          endpoints: Array.from(pattern.endpoints),
          firstSeen: new Date(pattern.firstSeen).toISOString(),
          lastSeen: new Date(pattern.lastSeen).toISOString(),
        })
      ),
    };
  }

  /**
   * Clean up old entries (older than 24 hours)
   */
  startCleanup() {
    if (this.cleanupInterval) return;
    
    this.cleanupInterval = setInterval(() => {
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      let cleaned = 0;
      
      // Clean high activity IPs
      for (const [ip, data] of this.highActivityIPs.entries()) {
        if (data.lastSeen < oneDayAgo) {
          this.highActivityIPs.delete(ip);
          cleaned++;
        }
      }
      
      // Clean suspicious patterns
      for (const [key, pattern] of this.suspiciousPatterns.entries()) {
        if (pattern.lastSeen < oneDayAgo) {
          this.suspiciousPatterns.delete(key);
          cleaned++;
        }
      }
      
      if (cleaned > 0) {
        console.log(`[MonitoringService] Cleaned up ${cleaned} old entries`);
      }
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Clear all data (for testing)
   */
  clear() {
    this.highActivityIPs.clear();
    this.suspiciousPatterns.clear();
  }
}

// Export singleton
export const monitoringService = new MonitoringService();
export default MonitoringService;
```

**Testing:**
```javascript
// Test high activity detection
monitoringService.recordHighActivity('1.2.3.4', 'signup', 0.96, { userId: 'user123' });
// Should log alert

// Test suspicious pattern
for (let i = 0; i < 6; i++) {
  monitoringService.recordSuspiciousPattern('user123', `1.2.3.${i}`, 'device1', 'signup');
}
// Should log rapid IP switching alert
```

---

### Step 1.3: Create Rate Limit Config V2

**File:** `lib/rateLimitConfigV2.js`

```javascript
/**
 * Rate Limiting Configuration V2
 * 
 * Progressive limits with monitoring thresholds
 */

import { RateLimiterV2, createProgressiveRateLimiter } from './rateLimiterV2';

export const RATE_LIMIT_CONFIGS_V2 = {
  // Authentication endpoints
  auth: {
    signup: {
      baseLimit: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      endpoint: 'signup',
      authenticatedMultiplier: 2, // 6/hour for authenticated
      deviceMultiplier: 1.5,      // 9/hour with device ID
      monitorThreshold: 0.8,
      alertThreshold: 0.95,
    },
    usernameCheck: {
      baseLimit: 30,
      windowMs: 60 * 1000, // 1 minute
      endpoint: 'username_check',
      authenticatedMultiplier: 2, // 60/min for authenticated
      deviceMultiplier: 1.5,      // 90/min with device ID
      monitorThreshold: 0.8,
      alertThreshold: 0.95,
    },
    usernameChange: {
      baseLimit: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      endpoint: 'username_change',
      authenticatedMultiplier: 1, // No increase (sensitive operation)
      deviceMultiplier: 1,
      monitorThreshold: 0.8,
      alertThreshold: 0.95,
    },
    login: {
      baseLimit: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      endpoint: 'login',
      authenticatedMultiplier: 1, // No increase (security sensitive)
      deviceMultiplier: 1,
      monitorThreshold: 0.8,
      alertThreshold: 0.95,
    },
  },
  
  // Payment endpoints
  payment: {
    createPaymentIntent: {
      baseLimit: 20,
      windowMs: 60 * 1000, // 1 minute
      endpoint: 'payment_intent',
      authenticatedMultiplier: 2, // 40/min for authenticated
      deviceMultiplier: 1.5,      // 60/min with device ID
      monitorThreshold: 0.8,
      alertThreshold: 0.95,
    },
    initializePayment: {
      baseLimit: 20,
      windowMs: 60 * 1000,
      endpoint: 'payment_initialize',
      authenticatedMultiplier: 2,
      deviceMultiplier: 1.5,
      monitorThreshold: 0.8,
      alertThreshold: 0.95,
    },
  },
  
  // Analytics
  analytics: {
    track: {
      baseLimit: 100,
      windowMs: 60 * 1000,
      endpoint: 'analytics',
      authenticatedMultiplier: 2,
      deviceMultiplier: 1.5,
      monitorThreshold: 0.8,
      alertThreshold: 0.95,
    },
  },
};

/**
 * Get rate limiter for an endpoint
 */
export function getRateLimiterV2(category, endpoint) {
  const config = RATE_LIMIT_CONFIGS_V2[category]?.[endpoint];
  
  if (!config) {
    throw new Error(`Rate limit config not found: ${category}.${endpoint}`);
  }
  
  return createProgressiveRateLimiter(config);
}

/**
 * Create rate limiter for authentication endpoints
 */
export function createAuthRateLimiterV2(endpoint) {
  return getRateLimiterV2('auth', endpoint);
}

/**
 * Create rate limiter for payment endpoints
 */
export function createPaymentRateLimiterV2(endpoint) {
  return getRateLimiterV2('payment', endpoint);
}

export default {
  RATE_LIMIT_CONFIGS_V2,
  getRateLimiterV2,
  createAuthRateLimiterV2,
  createPaymentRateLimiterV2,
};
```

---

### Step 1.4: Review Existing RateLimiterV2

**File:** `lib/rateLimiterV2.js` (already created)

**Action Items:**
1. Review the implementation
2. Ensure it matches the design
3. Add any missing features from monitoring service integration
4. Update imports if needed

**Integration Points:**
- Should use `extractDeviceId` from device fingerprinting helper
- Should call `monitoringService.recordHighActivity()` and `recordSuspiciousPattern()`

---

### Step 1.5: Write Unit Tests

**File:** `__tests__/lib/rateLimiterV2.test.js`

```javascript
import { RateLimiterV2 } from '@/lib/rateLimiterV2';
import { extractDeviceId } from '@/lib/rateLimiting/deviceFingerprint';

describe('RateLimiterV2', () => {
  let limiter;
  
  beforeEach(() => {
    limiter = new RateLimiterV2({
      maxRequests: 10,
      windowMs: 60 * 1000,
      endpoint: 'test',
    });
  });
  
  test('allows requests within limit', async () => {
    const req = { headers: {}, socket: { remoteAddress: '1.2.3.4' } };
    
    for (let i = 0; i < 10; i++) {
      const result = await limiter.check(req);
      expect(result.allowed).toBe(true);
    }
  });
  
  test('blocks requests over limit', async () => {
    const req = { headers: {}, socket: { remoteAddress: '1.2.3.4' } };
    
    // Make 10 requests (at limit)
    for (let i = 0; i < 10; i++) {
      await limiter.check(req);
    }
    
    // 11th request should be blocked
    const result = await limiter.check(req);
    expect(result.allowed).toBe(false);
  });
  
  test('progressive limits for authenticated users', async () => {
    const req = {
      headers: {},
      socket: { remoteAddress: '1.2.3.4' },
      user: { uid: 'user123' },
    };
    
    // Authenticated users get 2x limit (20 requests)
    for (let i = 0; i < 20; i++) {
      const result = await limiter.check(req);
      expect(result.allowed).toBe(true);
    }
    
    // 21st should be blocked
    const result = await limiter.check(req);
    expect(result.allowed).toBe(false);
  });
  
  test('device ID increases limit', async () => {
    const req = {
      headers: { 'x-device-id': 'device_1234567890_abc123' },
      socket: { remoteAddress: '1.2.3.4' },
      user: { uid: 'user123' },
    };
    
    // With auth (2x) + device (1.5x) = 3x = 30 requests
    for (let i = 0; i < 30; i++) {
      const result = await limiter.check(req);
      expect(result.allowed).toBe(true);
    }
  });
});
```

---

## Phase 2: Integration

### Step 2.1: Update API Middleware to Extract Device ID

**File:** `lib/apiAuth.js`

**Add to existing file:**

```javascript
import { extractDeviceId, extractSessionId } from '@/lib/rateLimiting/deviceFingerprint';

// In withAuth middleware, add device ID to req object
export function withAuth(handler, options = {}) {
  return async (req, res) => {
    // ... existing auth code ...
    
    // Extract device ID for rate limiting
    req.deviceId = extractDeviceId(req);
    req.sessionId = extractSessionId(req);
    
    // ... rest of auth code ...
  };
}
```

---

### Step 2.2: Update Signup Endpoint

**File:** `pages/api/auth/signup.js`

**Changes:**

```javascript
// Add import
import { createAuthRateLimiterV2 } from '@/lib/rateLimitConfigV2';

// Replace existing rate limiter
const signupLimiter = createAuthRateLimiterV2('signup');

// In handler, replace rate limit check:
const rateLimitResult = await signupLimiter.check(req);

// Set headers
res.setHeader('X-RateLimit-Limit', rateLimitResult.effectiveLimit || signupLimiter.config.maxRequests);
res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
res.setHeader('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt / 1000));

if (!rateLimitResult.allowed) {
  return res.status(429).json({
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many signup attempts. Please try again later.',
    retryAfter: Math.ceil(rateLimitResult.retryAfterMs / 1000),
  });
}
```

**Testing:**
1. Test unauthenticated signup (base limit: 3/hour)
2. Test authenticated signup (should get 6/hour)
3. Test with device ID (should get 9/hour)
4. Verify monitoring logs suspicious patterns

---

### Step 2.3: Update Username Check Endpoint

**File:** `pages/api/auth/username/check.js`

**Changes:**

```javascript
// Add import
import { createAuthRateLimiterV2 } from '@/lib/rateLimitConfigV2';

// Replace existing rate limiter
const usernameCheckLimiter = createAuthRateLimiterV2('usernameCheck');

// In handler, replace rate limit check (same pattern as signup)
```

**Testing:**
1. Test unauthenticated (30/min)
2. Test authenticated (60/min)
3. Test with device ID (90/min)
4. Verify enumeration protection

---

### Step 2.4: Update Payment Intent Endpoint

**File:** `pages/api/stripe/payment-intent.ts`

**Changes:**

```javascript
// Add import
import { createPaymentRateLimiterV2 } from '@/lib/rateLimitConfigV2';

// Replace existing rate limiter
const paymentIntentLimiter = createPaymentRateLimiterV2('createPaymentIntent');

// In handler, replace rate limit check
```

**Testing:**
1. Test unauthenticated (20/min)
2. Test authenticated (40/min)
3. Test with device ID (60/min)
4. Verify cost protection

---

### Step 2.5: Run V1 and V2 in Parallel (Optional)

**For safety during migration:**

```javascript
// In endpoint handler
const v1Result = await oldLimiter.check(req);
const v2Result = await newLimiter.check(req);

// Log differences for comparison
if (v1Result.allowed !== v2Result.allowed) {
  console.warn('[RateLimit Migration] V1 and V2 differ:', {
    v1: v1Result.allowed,
    v2: v2Result.allowed,
    endpoint: req.url,
  });
}

// Use V2 result (or V1 if V2 fails)
const result = v2Result.allowed ? v2Result : v1Result;
```

**Remove parallel check after 1 week of stable operation.**

---

## Phase 3: Monitoring

### Step 3.1: Create Admin Monitoring API

**File:** `pages/api/admin/rate-limit-stats.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuthToken } from '@/lib/apiAuth';
import { monitoringService } from '@/lib/rateLimiting/monitoringService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify admin access
  const authResult = await verifyAuthToken(req.headers.authorization);
  
  if (!authResult.uid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // TODO: Check admin claims
  // if (!authResult.admin) {
  //   return res.status(403).json({ error: 'Forbidden' });
  // }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const stats = monitoringService.getStats();
    
    return res.status(200).json({
      success: true,
      data: {
        highActivityIPs: stats.highActivityIPs,
        suspiciousPatterns: stats.suspiciousPatterns,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting rate limit stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

### Step 3.2: Create Admin Dashboard

**File:** `pages/admin/rate-limit-monitoring.js`

```javascript
import { useState, useEffect } from 'react';
import useSWR from 'swr';

export default function RateLimitMonitoring() {
  const { data, error, mutate } = useSWR(
    '/api/admin/rate-limit-stats',
    (url) => fetch(url).then(r => r.json()),
    { refreshInterval: 30000 } // Refresh every 30 seconds
  );
  
  if (error) return <div>Error loading stats</div>;
  if (!data) return <div>Loading...</div>;
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Rate Limit Monitoring</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">High Activity IPs</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2">IP</th>
              <th className="border p-2">Requests</th>
              <th className="border p-2">Max Usage %</th>
              <th className="border p-2">Endpoints</th>
              <th className="border p-2">Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {data.data.highActivityIPs.map((ip) => (
              <tr key={ip.ip}>
                <td className="border p-2">{ip.ip}</td>
                <td className="border p-2">{ip.requestCount}</td>
                <td className="border p-2">{(ip.maxUsagePercent * 100).toFixed(1)}%</td>
                <td className="border p-2">{ip.endpoints.join(', ')}</td>
                <td className="border p-2">{new Date(ip.lastSeen).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Suspicious Patterns</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2">User ID</th>
              <th className="border p-2">Unique IPs</th>
              <th className="border p-2">Unique Devices</th>
              <th className="border p-2">Requests</th>
              <th className="border p-2">Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {data.data.suspiciousPatterns.map((pattern) => (
              <tr key={pattern.userId}>
                <td className="border p-2">{pattern.userId}</td>
                <td className="border p-2">{pattern.uniqueIPs}</td>
                <td className="border p-2">{pattern.uniqueDevices}</td>
                <td className="border p-2">{pattern.requestCount}</td>
                <td className="border p-2">{new Date(pattern.lastSeen).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

### Step 3.3: Add Firestore Export (Optional)

**File:** `lib/rateLimiting/firestoreExporter.js`

```javascript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase-utils';
import { monitoringService } from './monitoringService';

/**
 * Export monitoring data to Firestore for historical analysis
 * Run periodically (e.g., every hour via cron)
 */
export async function exportMonitoringData() {
  try {
    const stats = monitoringService.getStats();
    const db = getDb();
    
    // Export high activity IPs
    for (const ipData of stats.highActivityIPs) {
      if (ipData.maxUsagePercent >= 0.95) {
        await addDoc(collection(db, 'rate_limit_alerts'), {
          type: 'high_activity',
          ...ipData,
          exportedAt: serverTimestamp(),
        });
      }
    }
    
    // Export suspicious patterns
    for (const pattern of stats.suspiciousPatterns) {
      if (pattern.uniqueIPs >= 5) {
        await addDoc(collection(db, 'rate_limit_alerts'), {
          type: 'suspicious_pattern',
          ...pattern,
          exportedAt: serverTimestamp(),
        });
      }
    }
    
    console.log('[FirestoreExporter] Exported monitoring data');
  } catch (error) {
    console.error('[FirestoreExporter] Error exporting data:', error);
  }
}

// Run export every hour
if (typeof setInterval !== 'undefined') {
  setInterval(exportMonitoringData, 60 * 60 * 1000);
}
```

---

## Phase 4: Client Integration

### Step 4.1: Update Client to Send Device ID

**File:** Update API client utilities to include device ID header

**Location:** Wherever API requests are made (e.g., `lib/apiClient.js` or similar)

```javascript
import { getDeviceId } from '@/lib/userMetrics';

// In API request function
const deviceId = getDeviceId(); // From existing userMetrics

fetch(url, {
  headers: {
    ...headers,
    'X-Device-ID': deviceId,
    'X-Session-ID': sessionId, // If available
  },
});
```

**Note:** This is optional - rate limiting works without device ID, just with lower limits.

---

## Testing Checklist

### Unit Tests
- [ ] Rate limiter allows requests within limit
- [ ] Rate limiter blocks requests over limit
- [ ] Progressive limits work (auth = 2x, device = 1.5x)
- [ ] Multi-factor identification (IP, User, Device)
- [ ] Monitoring service detects high activity
- [ ] Monitoring service detects suspicious patterns
- [ ] Device ID extraction (valid/invalid/missing)

### Integration Tests
- [ ] Signup endpoint with V2 rate limiter
- [ ] Username check endpoint with V2 rate limiter
- [ ] Payment intent endpoint with V2 rate limiter
- [ ] Parallel V1/V2 comparison (if implemented)
- [ ] Admin monitoring API
- [ ] Admin dashboard displays data

### Manual Testing
- [ ] Test unauthenticated requests (base limits)
- [ ] Test authenticated requests (2x limits)
- [ ] Test with device ID (3x limits)
- [ ] Test VPN switching (should not block, but monitor)
- [ ] Test rapid requests (should block at limit)
- [ ] Verify monitoring dashboard shows data

---

## Rollout Strategy

### Week 1: Deploy Core Infrastructure
1. Deploy Phase 1 files (device fingerprinting, monitoring, config)
2. Deploy `rateLimiterV2.js` (already created)
3. Run unit tests
4. **Do not integrate into endpoints yet**

### Week 2: Gradual Integration
1. Deploy to signup endpoint only
2. Monitor for 2-3 days
3. If stable, deploy to username check
4. Monitor for 2-3 days
5. If stable, deploy to payment intent

### Week 3: Monitoring & Dashboard
1. Deploy admin monitoring API
2. Deploy admin dashboard
3. Set up Firestore export (optional)
4. Train admins on dashboard

### Week 4: Documentation & Cleanup
1. Update security documentation
2. Create monitoring runbook
3. Remove V1 rate limiter (after 1 month)
4. Clean up parallel comparison code

---

## Troubleshooting

### Issue: Rate limiter not working
**Symptoms:** Requests not being rate limited

**Check:**
1. Is `rateLimiterV2.js` imported correctly?
2. Is `check()` method being called?
3. Are headers being set correctly?
4. Check console for errors

**Fix:**
- Verify import paths
- Check middleware order
- Ensure device ID extraction is working

---

### Issue: False positives (legitimate users blocked)
**Symptoms:** Authenticated users hitting rate limits

**Check:**
1. Are progressive limits enabled?
2. Is `req.user` being set correctly?
3. Is device ID being sent?

**Fix:**
- Verify authentication middleware runs before rate limiting
- Check device ID header is being sent
- Increase limits if needed (adjust config)

---

### Issue: Monitoring not showing data
**Symptoms:** Dashboard is empty

**Check:**
1. Is monitoring service being called?
2. Are thresholds set correctly?
3. Is data being cleaned up too quickly?

**Fix:**
- Verify `monitorActivity()` is called in rate limiter
- Check threshold values (may be too high)
- Adjust cleanup interval if needed

---

### Issue: Performance degradation
**Symptoms:** API responses slower

**Check:**
1. Is in-memory store working?
2. Are there memory leaks?
3. Is cleanup running?

**Fix:**
- Verify Map-based storage is used (not Firestore)
- Check cleanup interval is running
- Monitor memory usage

---

## Success Criteria

### Performance
- [ ] Rate limit check <10ms (vs 50-200ms before)
- [ ] No Firestore transactions for rate limiting
- [ ] Memory usage stable (no leaks)

### Security
- [ ] Suspicious patterns detected
- [ ] High activity IPs logged
- [ ] VPN users not blocked
- [ ] Progressive limits working

### User Experience
- [ ] No impact on legitimate users
- [ ] Authenticated users get higher limits
- [ ] Clear error messages when rate limited

---

## Rollback Plan

If issues occur:

1. **Immediate:** Revert endpoint changes to use V1 rate limiter
2. **Files to revert:**
   - `pages/api/auth/signup.js`
   - `pages/api/auth/username/check.js`
   - `pages/api/stripe/payment-intent.ts`
3. **Keep:** Core infrastructure (can be fixed without affecting endpoints)
4. **Communication:** Notify team of rollback

---

## References

- Current implementation: `lib/rateLimiter.js`
- New implementation: `lib/rateLimiterV2.js` (already created)
- Device tracking: `lib/userMetrics.js`
- Security review: `COMPREHENSIVE_CODE_REVIEW_2025.md`
- Original plan: `docs/RATE_LIMITING_IMPROVEMENT_PLAN.md`

---

## Questions?

If you encounter issues or need clarification:
1. Check troubleshooting section
2. Review `rateLimiterV2.js` implementation
3. Check monitoring service logs
4. Verify configuration values

**Key Principle:** This system is designed to **monitor and detect**, not block. VPN users should always be able to access the platform.
