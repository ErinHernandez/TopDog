# Idesaign Graceful Degradation Guide

**Last Updated:** 2025-02-11  
**Purpose:** Document degradation strategies for each service when it becomes unavailable

When any external service goes down, Idesaign should degrade gracefully rather than fail completely. This guide explains what happens when each service is unavailable, how the app responds automatically, and what manual steps are needed.

---

## Degradation Strategies by Service

### Firebase Authentication (Critical)

**SLA:** 99.95% (expected downtime: ~22 min/month)

| Aspect | Impact | Degradation Strategy |
|--------|--------|---------------------|
| **User Impact** | All auth routes fail, cannot login/logout | Cached token validation, read-only mode |
| **Root Cause Examples** | Firebase service outage, network connectivity, API key invalid | Check status page, verify network, rotate keys |
| **Detection** | 401 spike on /api/auth/*, health check fails | Health check monitors every 10 sec |
| **Automatic Response** | Within 5 seconds of detection | Enable read-only mode, show "maintenance" banner |
| **User Experience** | Already-logged-in users continue, new users blocked | Users can refresh token once if cached, then blocked |
| **Data Affected** | None (read-only mode doesn't write) | No data loss |
| **Manual Recovery** | Fix underlying issue, clear caches | ~30 min from resolution |

**Implementation Details:**
```typescript
// In middleware
if (firebase_auth_unhealthy) {
  // For already authenticated users with valid token
  if (request.cookies.auth_token && is_token_valid(token)) {
    return next() // Allow continue with cached auth
  }
  // For new/expired users
  return redirect('/maintenance/auth-unavailable')
}
```

**Recovery Checklist:**
- [ ] Verify Firebase status page shows recovery
- [ ] Clear authentication token cache
- [ ] Monitor 401 errors return to baseline
- [ ] Verify token refresh working
- [ ] Test login/logout flow
- [ ] Check dependent auth services recovered

---

### Firestore Database (Critical)

**SLA:** 99.99% (expected downtime: ~4.3 min/month)

| Aspect | Impact | Degradation Strategy |
|--------|--------|---------------------|
| **User Impact** | All data persistence fails, cannot save/load | In-memory cache, queue writes to IndexedDB |
| **Root Cause Examples** | Firestore outage, quota exhausted, network down, permission error | Check Firebase dashboard, check quota, verify rules |
| **Detection** | Read timeout, write failures, health check fails | Health check monitors reads/writes |
| **Automatic Response** | Within 10 seconds | Show "offline" mode, queue all writes |
| **User Experience** | Can read cached data, writes queued locally | "You're offline" message, sync when recovered |
| **Data Affected** | None (queued in IndexedDB, synced when restored) | No data loss with queue |
| **Manual Recovery** | If quota exceeded, upgrade plan. If network, restart. | ~2 min from resolution |

**Implementation Details:**
```typescript
// In data service
try {
  const data = await firestore.collection('users').doc(id).get()
  cache.set(data)
  return data
} catch (error) {
  if (is_network_error(error)) {
    // Use cache for reads
    const cached = cache.get(id)
    if (cached) return cached
    
    // Queue writes to IndexedDB
    write_queue.add({ operation: 'update', data })
    show_offline_message()
    return null
  }
  throw error
}

// When connection restored
on_connection_restored(async () => {
  const queued = write_queue.getAll()
  for (const item of queued) {
    await firestore.collection(item.collection).doc(item.id).set(item.data)
    write_queue.remove(item.id)
  }
  show_sync_complete_message()
})
```

**Recovery Checklist:**
- [ ] Verify Firestore status page shows recovery
- [ ] Check quota not exceeded (Firebase console)
- [ ] Clear data cache
- [ ] Process queued writes from IndexedDB
- [ ] Monitor Firestore latency returns to <100ms
- [ ] Check for data loss (none expected)
- [ ] Verify dependent systems recovered

---

### Redis/Upstash (High Priority)

**SLA:** 99.95% (expected downtime: ~22 min/month)

| Aspect | Impact | Degradation Strategy |
|--------|--------|---------------------|
| **User Impact** | Rate limiting bypass, cache miss (slower), session loss | Fail-open rate limiting, bypass cache, refresh session |
| **Root Cause Examples** | Upstash outage, connection limit exceeded, network partition | Check Upstash status, check connection pool size |
| **Detection** | Redis timeout (100ms), health check fails | Health check every 30 sec |
| **Automatic Response** | Within 2 seconds | Use in-memory rate limiter, bypass cache |
| **User Experience** | Requests slightly slower (no cache), rate limiting less accurate | Users may hit rate limit differently, generally still protected |
| **Data Affected** | Cache data lost, rate limit counters lost | Recovers when Redis restored |
| **Manual Recovery** | Upstash auto-failover, verify connection | ~30 sec from resolution |

**Implementation Details:**
```typescript
// Rate limiter with fallback
const rateLimit = async (key: string) => {
  try {
    const remaining = await redis.get(`ratelimit:${key}`)
    if (remaining <= 0) return false
    await redis.decrement(`ratelimit:${key}`)
    return true
  } catch (error) {
    if (is_redis_error(error)) {
      // Fail-open: use in-memory counter (less accurate)
      return in_memory_rate_limiter.check(key)
    }
    throw error
  }
}

// Cache with fallback
const getFromCache = async (key: string, fallback: Function) => {
  try {
    const cached = await redis.get(key)
    return cached || await fallback()
  } catch (error) {
    if (is_redis_error(error)) {
      // Bypass cache, hit database/API directly
      return await fallback()
    }
    throw error
  }
}
```

**Recovery Checklist:**
- [ ] Verify Upstash status page shows recovery
- [ ] Test Redis connectivity: `redis-cli PING`
- [ ] Verify connection pool size adequate
- [ ] Warm up critical caches (user sessions, config)
- [ ] Monitor Firestore cost (should drop as cache hits increase)
- [ ] Verify rate limiter accuracy restored
- [ ] Check response latency improved (cache now working)

---

### OpenAI API (High Priority)

**SLA:** 99.9% (expected downtime: ~43 min/month)

| Aspect | Impact | Degradation Strategy |
|--------|--------|---------------------|
| **User Impact** | Text generation/editing fails, users see error | Automatic failover to Stability AI |
| **Root Cause Examples** | OpenAI service outage, rate limit exceeded, API key invalid | Check OpenAI status, check usage quotas |
| **Detection** | 5xx response, circuit breaker trips | Health check every 10 sec |
| **Automatic Response** | Within 100ms | Trip circuit breaker, failover to Stability AI |
| **User Experience** | Feature uses Stability AI instead (slightly different quality) | Seamless to user, no error shown |
| **Data Affected** | None | No data loss |
| **Manual Recovery** | OpenAI recovers OR fix code/keys | ~5 min from resolution |

**Implementation Details:**
```typescript
// Circuit breaker pattern
const openaiCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000, // 60 sec
  healthCheck: async () => {
    const response = await openai.models.list()
    return response.ok
  }
})

const generateText = async (prompt: string) => {
  try {
    return await openaiCircuitBreaker.call(async () => {
      return await openai.createCompletion({
        model: 'gpt-3.5-turbo',
        prompt: prompt
      })
    })
  } catch (error) {
    if (openaiCircuitBreaker.isBroken()) {
      // Failover to Stability AI
      return await stabilityAI.generateText(prompt)
    }
    throw error
  }
}
```

**Recovery Checklist:**
- [ ] Verify OpenAI status page shows recovery
- [ ] Check API key valid and not rate limited
- [ ] Monitor circuit breaker attempts recovery (every 10 sec)
- [ ] Verify automatic reset after cooldown (60 sec)
- [ ] Test OpenAI feature works directly
- [ ] Check no memory leak in circuit breaker
- [ ] Monitor request latency (should be faster than failover)

---

### Stability AI (Medium Priority)

**SLA:** 99.9% (expected downtime: ~43 min/month)

| Aspect | Impact | Degradation Strategy |
|--------|--------|---------------------|
| **User Impact** | Background removal, upscale fails, auto-enhance disabled | Automatic failover to Replicate |
| **Root Cause Examples** | Stability service outage, rate limit, account suspended | Check Stability status, check API credits |
| **Detection** | 5xx response, circuit breaker trips | Health check every 10 sec |
| **Automatic Response** | Within 100ms | Trip circuit breaker, failover to Replicate |
| **User Experience** | Feature uses Replicate instead, possibly slower | Seamless, no error (slightly slower response) |
| **Data Affected** | None | No data loss |
| **Manual Recovery** | Stability recovers OR Replicate processes request | ~10 min from resolution |

**Implementation Details:**
```typescript
// Same circuit breaker pattern as OpenAI
const stabilityCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000
})

const removeBackground = async (imageUrl: string) => {
  try {
    return await stabilityCircuitBreaker.call(async () => {
      return await stability.removeBackground(imageUrl)
    })
  } catch (error) {
    if (stabilityCircuitBreaker.isBroken()) {
      // Failover to Replicate
      return await replicate.removeBackground(imageUrl)
    }
    throw error
  }
}
```

**Recovery Checklist:**
- [ ] Verify Stability AI status shows recovery
- [ ] Check API key and account status valid
- [ ] Monitor circuit breaker auto-recovery
- [ ] Verify requests routing back to Stability (not Replicate)
- [ ] Compare output quality with baseline
- [ ] Monitor processing time (should be faster than Replicate)

---

### Replicate (Medium Priority)

**SLA:** 99.95% (expected downtime: ~22 min/month)

| Aspect | Impact | Degradation Strategy |
|--------|--------|---------------------|
| **User Impact** | Model inference fails (fallback for Stability), no upscale | Fallback to Google AI or show "unavailable" message |
| **Root Cause Examples** | Replicate service outage, rate limit, model not running | Check Replicate status, check API limits |
| **Detection** | 5xx response, circuit breaker trips | Health check every 10 sec |
| **Automatic Response** | Within 100ms | Trip circuit breaker, try fallback |
| **User Experience** | Limited feature set (Google AI only), some features disabled | Show "feature temporarily unavailable" |
| **Data Affected** | None | No data loss |
| **Manual Recovery** | Replicate recovers | ~5 min from resolution |

**Implementation Details:**
```typescript
const replicateCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000
})

const upscaleImage = async (imageUrl: string) => {
  try {
    return await replicateCircuitBreaker.call(async () => {
      return await replicate.upscale(imageUrl)
    })
  } catch (error) {
    if (replicateCircuitBreaker.isBroken()) {
      // Try Google AI fallback
      try {
        return await googleAI.upscale(imageUrl)
      } catch {
        // Both failed, disable feature
        throw new FeatureUnavailableError('Upscale temporarily unavailable')
      }
    }
    throw error
  }
}
```

**Recovery Checklist:**
- [ ] Verify Replicate status shows recovery
- [ ] Check API rate limits not exceeded
- [ ] Monitor circuit breaker auto-recovery
- [ ] Verify requests routing back to Replicate (not Google AI)
- [ ] Test upscale feature works
- [ ] Monitor processing time

---

### Google AI (Low Priority)

**SLA:** 99.9% (expected downtime: ~43 min/month)

| Aspect | Impact | Degradation Strategy |
|--------|--------|---------------------|
| **User Impact** | Face detection, Gemini APIs fail, feature disabled | Disable feature, show "unavailable" message |
| **Root Cause Examples** | Google Cloud outage, quota exceeded, API disabled | Check Google Cloud status, check quotas |
| **Detection** | 5xx response, circuit breaker trips | Health check every 10 sec |
| **Automatic Response** | Within 100ms | Trip circuit breaker, disable feature |
| **User Experience** | "Feature unavailable, try again later" message | No error, graceful message |
| **Data Affected** | None | No data loss |
| **Manual Recovery** | Google Cloud recovers | ~5 min from resolution |

**Recovery Checklist:**
- [ ] Verify Google Cloud status shows recovery
- [ ] Check quotas not exceeded
- [ ] Monitor circuit breaker auto-recovery
- [ ] Test feature re-enabled
- [ ] Verify face detection accuracy (if applicable)

---

### Stripe Payment Processing (Critical)

**SLA:** 99.9% (expected downtime: ~43 min/month)

| Aspect | Impact | Degradation Strategy |
|--------|--------|---------------------|
| **User Impact** | Payments cannot be processed, checkout fails | Queue payment intents, retry automatically |
| **Root Cause Examples** | Stripe service outage, webhook endpoint down, API key invalid | Check Stripe status, verify webhooks, check keys |
| **Detection** | Payment API 5xx, webhook non-200, health check fails | Health check every 10 sec |
| **Automatic Response** | Within 5 seconds | Queue intent in database, show retry message |
| **User Experience** | "Payment processing delayed, trying again..." | Transparent retry, no loss of session |
| **Data Affected** | None (payment queued, can be replayed) | No loss of payment intent |
| **Manual Recovery** | Stripe recovers, queued payments automatically retry | ~5 min from resolution |

**Implementation Details:**
```typescript
// Queue payment if Stripe unavailable
const processPayment = async (paymentIntent: PaymentIntent) => {
  try {
    const result = await stripe.paymentIntents.create({
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      // ...
    })
    return result
  } catch (error) {
    if (is_stripe_error(error)) {
      // Queue for retry
      await db.collection('payment_queue').add({
        intent: paymentIntent,
        created_at: new Date(),
        attempts: 0,
        status: 'pending'
      })
      
      // Try again in background
      schedule_retry(paymentIntent, { delay: 30000 })
      
      return {
        queued: true,
        message: 'Payment queued, will process shortly'
      }
    }
    throw error
  }
}

// Automatic retry every 30 seconds
const retryQueuedPayments = async () => {
  const pending = await db
    .collection('payment_queue')
    .where('status', '==', 'pending')
    .where('attempts', '<', 5)
    .get()
  
  for (const doc of pending.docs) {
    try {
      const result = await stripe.paymentIntents.create(doc.data().intent)
      await doc.ref.update({ status: 'completed', stripe_id: result.id })
    } catch (error) {
      await doc.ref.update({ attempts: increment() })
    }
  }
}
```

**Recovery Checklist:**
- [ ] Verify Stripe status page shows recovery
- [ ] Check webhook endpoint responding with 200
- [ ] Verify API key valid and has correct permissions
- [ ] Process queued payments (automatic every 30 sec)
- [ ] Monitor payment success rate returns to baseline
- [ ] Verify no duplicate charges (Stripe idempotency key prevents this)
- [ ] Check database payment queue empty within 5 min

---

### Twilio SMS (Medium Priority)

**SLA:** 99.95% (expected downtime: ~22 min/month)

| Aspect | Impact | Degradation Strategy |
|--------|--------|---------------------|
| **User Impact** | SMS notifications fail, users don't get SMS alerts | Disable SMS feature, use email fallback |
| **Root Cause Examples** | Twilio service outage, account suspended, number not verified | Check Twilio status, verify account/credentials |
| **Detection** | SMS API 5xx, delivery reports fail | Health check every 30 sec |
| **Automatic Response** | Within 2 seconds | Fail-open (log, don't send), show "SMS unavailable" |
| **User Experience** | Email notification sent instead (or notification skipped) | Transparent, user may not notice |
| **Data Affected** | None (SMS is notification-only) | No data loss |
| **Manual Recovery** | Twilio recovers, retry SMS | ~5 min from resolution |

**Implementation Details:**
```typescript
const sendNotification = async (userId: string, message: string) => {
  try {
    // Try SMS first
    return await twilio.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: user.phone_number
    })
  } catch (error) {
    if (is_twilio_error(error)) {
      // Fallback to email
      await sendEmail({
        to: user.email,
        subject: 'Idesaign Notification',
        body: message
      })
      log_sms_failure(userId, message)
      return { sent_via: 'email' }
    }
    throw error
  }
}
```

**Recovery Checklist:**
- [ ] Verify Twilio status shows recovery
- [ ] Check Twilio account not suspended
- [ ] Verify phone numbers verified
- [ ] Monitor SMS delivery rate increases
- [ ] Verify no stuck notifications in queue
- [ ] Check SMS cost tracking (should resume)

---

### Vercel Hosting (Critical)

**SLA:** 99.99% (expected downtime: ~4.3 min/month)

| Aspect | Impact | Degradation Strategy |
|--------|--------|---------------------|
| **User Impact** | Entire app unavailable (no DNS, no functions) | DNS failover to static page |
| **Root Cause Examples** | Vercel data center down, DDoS, deployment failed | Check Vercel status, check deployment logs |
| **Detection** | DNS timeout, entire app returns 5xx | Vercel monitoring + external uptime monitors |
| **Automatic Response** | Manual (Vercel must handle recovery) | Deploy to backup region or static host |
| **User Experience** | App completely unavailable, static "We're Back Soon" page | No services available |
| **Data Affected** | None (no data modifications possible) | No data loss |
| **Manual Recovery** | Vercel data center recovered | Automatic once Vercel recovers |

**Implementation Details:**
```
// DNS failover (manual setup)
Primary: idesaign.vercel.app (points to Vercel)
Secondary: idesaign.static-page.com (static "We're down" page)

// In DNS provider (Route53, Cloudflare, etc):
- Monitor primary endpoint
- If down for >30 seconds, failover to secondary static page
- Automatic recovery to primary when up
```

**Recovery Checklist:**
- [ ] Verify Vercel status page shows recovery
- [ ] Check deployment latest version working
- [ ] Verify no pending deployments stuck
- [ ] Monitor DNS failover returns to primary
- [ ] Verify all functions returning 200
- [ ] Test critical user journeys work
- [ ] Check no cascading failures in dependencies

---

### Sharp Image Processing (Medium Priority)

**SLA:** 99.9% (expected downtime: ~43 min/month)

| Aspect | Impact | Degradation Strategy |
|--------|--------|---------------------|
| **User Impact** | Image resize/conversion fails, processing slow | Use browser-side processing, skip processing |
| **Root Cause Examples** | Sharp library crash, OOM (out of memory), disk space | Check memory usage, check disk space |
| **Detection** | Image processing timeout, Sharp returns error | Health check monitors Sharp status |
| **Automatic Response** | Within 5 seconds | Fall back to browser-side processing |
| **User Experience** | Image takes longer to process (slower), or unprocessed | Transparent, slightly slower |
| **Data Affected** | None | No data loss |
| **Manual Recovery** | Identify memory leak or restart server | ~1 min restart |

**Implementation Details:**
```typescript
// Image processing with fallback
const processImage = async (file: File, options: ProcessOptions) => {
  try {
    // Server-side processing (fast)
    return await serverProcessImage(file, options)
  } catch (error) {
    if (is_sharp_error(error) || is_memory_error(error)) {
      // Fallback to browser-side processing (slower, but works)
      return await browserProcessImage(file, options)
    }
    throw error
  }
}

// Monitor Sharp health
const monitor_sharp_health = () => {
  const process = require('process')
  if (process.memoryUsage().heapUsed > heapSizeLimit * 0.9) {
    log('Sharp memory usage critical, disabling server processing')
    disable_server_image_processing()
  }
}
```

**Recovery Checklist:**
- [ ] Check server memory usage < 70%
- [ ] Check disk space available > 10GB
- [ ] Restart functions if memory leak suspected
- [ ] Monitor image processing times return to baseline
- [ ] Verify no queued images stuck
- [ ] Check error rate in image endpoint

---

## Summary Table: What Works When Each Service Is Down

| Service | Status Endpoint | Auth | Read Data | Write Data | Payments | Images | AI Tools | Notifications |
|---------|-----------------|------|-----------|-----------|----------|--------|----------|----------------|
| Firebase Auth | Shows error | ❌ | ✓ (cached) | ❌ | ❌ | ✓ | ✓ | ✓ |
| Firestore | Shows error | ✓ | ✓ (cached) | ❌ (queued) | ✓ | ✓ | ✓ | ✓ |
| Redis | Shows error | ✓ | ✓ (slow) | ✓ (slow) | ✓ | ✓ | ✓ | ✓ |
| OpenAI | Shows error | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (failover) | ✓ |
| Stability AI | Shows error | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (failover) | ✓ |
| Replicate | Shows error | ✓ | ✓ | ✓ | ✓ | ✓ | ⚠️ (limited) | ✓ |
| Google AI | Shows error | ✓ | ✓ | ✓ | ✓ | ✓ | ⚠️ (limited) | ✓ |
| Stripe | Shows error | ✓ | ✓ | ✓ | ❌ (queued) | ✓ | ✓ | ✓ |
| Twilio | Shows error | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ⚠️ (email) |
| Sharp | Shows error | ✓ | ✓ | ✓ | ✓ | ⚠️ (slow) | ✓ | ✓ |
| Vercel | ❌ Complete outage | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Legend:** ✓ Works, ❌ Fails, ⚠️ Degraded, ⚠️ (queued) Queued for retry

---

## Monitoring Degradation Health

All degradation strategies should be monitored:

```typescript
// Metrics to track
- firebase_auth_circuit_breaker_state (open/closed/half-open)
- firestore_cache_hit_rate (% of reads from cache vs direct)
- write_queue_depth (# of queued writes waiting)
- redis_failover_activations (count of times Redis failed over)
- ai_provider_failover_count (which provider failover triggered)
- stripe_payment_queue_depth (# queued payments)
- sms_fallback_to_email (when SMS fails)
- sharp_fallback_to_browser (when Sharp fails)

// Alerts
- Alert if write_queue_depth > 100 (more than 100 writes queued)
- Alert if firebase_cache_hit_rate < 50% (too many Firestore reads)
- Alert if stripe_payment_queue > 10 (payments stuck in queue)
- Alert if circuit_breaker_open > 5 min (service down too long)
```

---

**Document History:** Version 1.0, 2025-02-11  
**Next Review:** 2025-05-11  
**Owner:** Architecture/DevOps Team
