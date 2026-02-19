# Vercel Edge Functions Guide

**Last Updated:** January 2025  
**Purpose:** Guide for using Vercel Edge Functions to reduce latency for global users

---

## Overview

Vercel Edge Functions run at the edge of Vercel's network, closer to users worldwide. This reduces latency for API routes, especially for global users.

**Benefits:**
- Reduced latency (runs closer to users)
- Automatic global distribution
- No infrastructure changes needed
- Cost-effective (included in Vercel)

---

## When to Use Edge Functions

### Good Candidates
- ✅ High-traffic API routes
- ✅ Routes that don't need Node.js APIs
- ✅ Routes that benefit from low latency
- ✅ Routes with simple logic

### Not Suitable
- ❌ Routes using Node.js-only APIs (fs, crypto, etc.)
- ❌ Routes needing long-running processes
- ❌ Routes with complex database operations
- ❌ Routes using Firebase Admin SDK

---

## Implementation

### Step 1: Create Edge Function

Create a file with `edge` runtime:

```typescript
// pages/api/example-edge.ts
import type { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  // Edge function code
  return new Response(
    JSON.stringify({ message: 'Hello from Edge!' }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
```

### Step 2: Update Existing Routes

For routes that can run on Edge:

```typescript
// Before (Node.js runtime)
export default async function handler(req, res) {
  // Node.js code
}

// After (Edge runtime)
import type { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  // Edge-compatible code
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

---

## Edge Function Limitations

### Available APIs
- ✅ `fetch` - HTTP requests
- ✅ `Request` / `Response` - Web APIs
- ✅ `URL` / `URLSearchParams` - URL handling
- ✅ `TextEncoder` / `TextDecoder` - Text encoding
- ✅ `crypto.subtle` - Web Crypto API
- ✅ `Headers` / `ReadableStream` - Web Streams

### Not Available
- ❌ Node.js `fs` module
- ❌ Node.js `crypto` module (use Web Crypto API)
- ❌ `Buffer` (use `Uint8Array`)
- ❌ Firebase Admin SDK (use Firebase Client SDK)
- ❌ Long-running processes
- ❌ File system access

---

## Migration Examples

### Example 1: Health Check Endpoint

**Before (Node.js):**
```typescript
// pages/api/health.ts
export default async function handler(req, res) {
  res.status(200).json({ status: 'ok' });
}
```

**After (Edge):**
```typescript
// pages/api/health.ts
import type { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  return new Response(
    JSON.stringify({ status: 'ok' }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
```

### Example 2: API Route with Validation

**Before (Node.js):**
```typescript
export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Missing id' });
  }
  // Process...
}
```

**After (Edge):**
```typescript
import type { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return new Response(
      JSON.stringify({ error: 'Missing id' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  // Process...
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

---

## Best Practices

### 1. Use Web APIs

```typescript
// ✅ Good - Web API
const url = new URL(req.url);
const id = url.searchParams.get('id');

// ❌ Bad - Node.js API (not available)
const { id } = req.query;
```

### 2. Handle Request Body

```typescript
// ✅ Good - Read body as text
const body = await req.text();
const data = JSON.parse(body);

// ❌ Bad - req.body (not available in Edge)
const data = req.body;
```

### 3. Error Handling

```typescript
export default async function handler(req: NextRequest) {
  try {
    // Your code
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
```

---

## Routes Suitable for Edge

### High Priority
- `GET /api/health` - Health check
- `GET /api/nfl/*` - NFL data (read-only)
- `GET /api/user/display-currency` - User preferences (read)

### Medium Priority
- `POST /api/performance/metrics` - Performance tracking
- `GET /api/migrations/status` - Migration status (read)

### Not Suitable
- `POST /api/stripe/*` - Needs Firebase Admin SDK
- `POST /api/auth/*` - Needs Firebase Admin SDK
- `POST /api/draft/*` - Complex Firestore operations
- `POST /api/migrations/run` - Needs Firebase Admin SDK

---

## Testing Edge Functions

### Local Testing

```bash
# Edge functions run automatically in dev mode
npm run dev

# Test endpoint
curl http://localhost:3000/api/health
```

### Production Testing

```bash
# Deploy to Vercel
vercel deploy

# Test from different regions
# Use online tools to test latency from different locations
```

---

## Performance Benefits

### Expected Improvements
- **Latency Reduction:** 50-200ms for global users
- **P95 Response Time:** 20-30% improvement
- **Global Distribution:** Automatic

### Monitoring

Track these metrics:
- Response time by region
- Edge function execution time
- Cache hit rates (if using caching)

---

## Migration Checklist

When migrating a route to Edge:

- [ ] Verify route doesn't use Node.js-only APIs
- [ ] Update to use `NextRequest` / `Response`
- [ ] Replace `req.query` with `URLSearchParams`
- [ ] Replace `req.body` with `req.text()` / `req.json()`
- [ ] Update error handling
- [ ] Test locally
- [ ] Deploy and monitor

---

## Troubleshooting

### Common Issues

**Issue:** "Module not found"  
**Solution:** Edge functions can't use Node.js modules. Use Web APIs instead.

**Issue:** "req.body is undefined"  
**Solution:** Use `await req.text()` or `await req.json()` instead.

**Issue:** "Firebase Admin SDK not available"  
**Solution:** Use Firebase Client SDK or keep route on Node.js runtime.

---

## Next Steps

1. **Identify Candidates:** Review API routes for Edge suitability
2. **Migrate High-Traffic Routes:** Start with health check and read-only routes
3. **Monitor Performance:** Track latency improvements
4. **Expand Gradually:** Migrate more routes as needed

---

**Last Updated:** January 2025  
**See Also:** `docs/FIREBASE_REGIONAL_OPTIMIZATION.md` (to be created)
