# Testing Guide: Latency Compensation & Edge Functions

**Date:** January 2025  
**Purpose:** Guide for testing latency compensation and edge health endpoint

---

## Test Pages Created

### 1. Latency Compensation Test
**URL:** `/test-latency`

**Features:**
- Measure latency to server
- Track multiple measurements
- View latency statistics (average, min, max, current)
- See timer compensation in action
- Simulate server timer with latency compensation

**How to Use:**
1. Navigate to `/test-latency`
2. Click "Measure Latency" to take a single measurement
3. Click "Measure Latency (5x)" to take multiple measurements
4. Adjust the "Server Timer" to see compensation applied
5. View statistics and recent measurements

**What to Look For:**
- Latency measurements should be consistent
- Compensated timer should be slightly higher than server timer
- Compensation amount should correlate with measured latency

---

### 2. Edge Health Endpoint Test
**URL:** `/test-edge-health`

**Features:**
- Test edge-optimized health endpoint (`/api/health-edge`)
- Test standard health endpoint (`/api/health`)
- Compare performance side-by-side
- Run multiple tests to get averages
- View statistics and recent results

**How to Use:**
1. Navigate to `/test-edge-health`
2. Click "Compare Both (Side-by-Side)" to test both endpoints
3. Click "Test Edge (10x)" or "Test Standard (10x)" for multiple tests
4. View comparison results and statistics

**What to Look For:**
- Edge endpoint should show region information
- Response times should be comparable or better for edge
- Edge endpoint may be faster for users far from main server

---

## Testing Latency Compensation in Draft Rooms

### Manual Testing Steps

1. **Open a Draft Room (V2)**
   - Navigate to `/draft/v2/[roomId]` or use a test room
   - Open browser DevTools Console

2. **Check Latency Measurements**
   - Look for console logs: `⏱️ Timer compensation:`
   - Should see server timer, estimated latency, and compensated timer
   - Measurements should occur every 10 seconds

3. **Verify Compensation**
   - Compare `serverTimer` vs `compensatedTimer` in console
   - Compensated timer should be slightly higher
   - Difference should correlate with your network latency

4. **Test with Network Throttling**
   - Open Chrome DevTools → Network tab
   - Enable throttling (e.g., "Slow 3G")
   - Reload draft room
   - Verify compensation increases with higher latency

### Expected Behavior

- **Low Latency (<50ms):** Minimal compensation (0-1 seconds)
- **Medium Latency (50-200ms):** Moderate compensation (1-2 seconds)
- **High Latency (>200ms):** Higher compensation (2+ seconds)

---

## Testing Edge Health Endpoint

### Manual Testing Steps

1. **Test Edge Endpoint**
   ```bash
   curl https://your-domain.com/api/health-edge
   ```
   - Should return JSON with `edge.region` field
   - Response should include `X-Server-Time` header

2. **Compare with Standard Endpoint**
   ```bash
   curl https://your-domain.com/api/health
   ```
   - Compare response times
   - Edge endpoint may be faster for global users

3. **Use Test Page**
   - Navigate to `/test-edge-health`
   - Run comparison tests
   - View statistics

### Expected Results

- **Edge Endpoint:**
  - Includes `edge.region` in response
  - May show lower latency for users far from main server
  - Should work identically to standard endpoint

- **Standard Endpoint:**
  - No region information
  - May be faster for users near main server
  - More features (uptime, performance metrics)

---

## Integration Testing

### Draft Room Integration

Latency compensation is automatically active in:
- ✅ `components/draft/v2/providers/DraftProvider.js`

**To verify it's working:**
1. Open a V2 draft room
2. Check browser console for latency logs
3. Verify timer compensation is applied
4. Check `latencyStats` in draft context (if exposed)

### Health Endpoint Integration

Both endpoints are available:
- `/api/health` - Standard Node.js endpoint
- `/api/health-edge` - Edge-optimized endpoint

**Current Usage:**
- Latency compensation uses `/api/health` (can be switched to edge)
- Monitoring services can use either endpoint
- Edge endpoint recommended for global users

---

## Performance Benchmarks

### Latency Compensation
- **Measurement Frequency:** Every 10 seconds
- **Measurement Samples:** Last 10 measurements
- **Compensation Formula:** `serverTimer + (estimatedLatency / 2)`
- **Expected Overhead:** <5ms per measurement

### Edge Health Endpoint
- **Target Response Time:** <100ms (edge)
- **Standard Response Time:** <200ms (Node.js)
- **Expected Improvement:** 20-50% for global users

---

## Troubleshooting

### Latency Compensation Not Working

1. **Check Console Logs**
   - Should see `⏱️ Timer compensation:` logs
   - If not, check if DraftProvider is being used

2. **Verify Health Endpoint**
   - Test `/api/health` manually
   - Check for `X-Server-Time` header

3. **Check Network**
   - Ensure network requests are not blocked
   - Verify CORS settings if needed

### Edge Endpoint Not Working

1. **Check Vercel Configuration**
   - Ensure edge runtime is supported
   - Check Vercel deployment logs

2. **Verify Edge Runtime**
   - Check `pages/api/health-edge.ts` has `export const config = { runtime: 'edge' }`
   - Ensure no Node.js-only APIs are used

3. **Test Locally**
   - Edge functions may behave differently locally
   - Test on Vercel preview/production

---

## Next Steps

1. ✅ Test latency compensation in draft rooms
2. ✅ Test edge health endpoint performance
3. ⏳ Monitor production performance
4. ⏳ Consider migrating more routes to edge
5. ⏳ Add latency compensation to other draft room versions (V3, mobile)

---

**Last Updated:** January 2025
