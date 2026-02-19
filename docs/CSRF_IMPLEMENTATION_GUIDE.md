# CSRF Protection Implementation Guide

## Phase 3.6 - CSRF Protection for API Routes

### Executive Summary

This document outlines the CSRF protection implementation for the bestball-site API. The infrastructure is already in place; this guide covers the remaining work needed to achieve comprehensive protection across all 108 API routes.

**Current Status:**
- ✅ CSRF middleware implemented and tested
- ✅ Token endpoint created
- ✅ 25 routes protected (23%)
- ❌ 83 routes still need protection (77%)

---

## Architecture Overview

### Double-Submit Cookie Pattern

The implementation uses the double-submit cookie pattern for stateless CSRF protection:

```
1. Client requests CSRF token:
   GET /api/csrf-token → Sets "csrf-token" httpOnly cookie

2. Client stores token from response body

3. On state-changing request (POST/PUT/DELETE/PATCH):
   - Cookie automatically sent by browser: csrf-token=<value>
   - Client adds header: x-csrf-token: <value>

4. Server validates:
   - Extracts token from header
   - Extracts token from cookie
   - Compares using constant-time comparison
   - Rejects if mismatch (403 CSRF_TOKEN_INVALID)
```

### Key Components

#### Backend (`lib/csrfProtection.ts`)
- **generateCSRFToken()**: Creates 64-char hex token using `crypto.randomBytes(32)`
- **validateCSRFToken()**: Constant-time comparison of header vs cookie tokens
- **withCSRFProtection()**: Middleware wrapper that:
  - Skips validation for GET/HEAD/OPTIONS (read-only operations)
  - Returns 403 with `CSRF_TOKEN_INVALID` on failure
  - Validates POST/PUT/DELETE/PATCH requests
- **setCSRFTokenCookie()**: Sets secure httpOnly cookie with 1-hour expiry

#### Frontend (`lib/api/client.ts` - NEW)
- **getCsrfToken()**: Fetches and caches token from `/api/csrf-token`
- **apiClient()**: Fetch wrapper that automatically injects `x-csrf-token` header
- **initializeCsrf()**: Initialize token on app load
- **Token refresh**: Automatic retry on 403 CSRF_TOKEN_INVALID

#### Middleware Exports (`lib/middleware/index.ts` - NEW)
- Central export point for all middleware
- Configuration constants
- Exemption pattern definitions

---

## Implementation Status

### Already Protected (25 routes)

✅ Payment & Stripe:
- `/api/stripe/payment-intent.ts`
- `/api/stripe/setup-intent.ts`
- `/api/stripe/cancel-payment.ts`
- `/api/stripe/payment-methods.ts`
- `/api/stripe/customer.ts` (v1)
- `/api/stripe/payment-intent.ts` (v1)

✅ Auth & User:
- `/api/user/update-contact.ts`
- `/api/auth/username/change.ts`
- `/api/auth/username/reserve.ts`
- `/api/auth/username/claim.ts`
- `/api/auth/verify-admin.ts`

✅ Draft Operations:
- `/api/drafts/[draftId]/withdraw.ts`

✅ Other:
- `/api/slow-drafts/*` (5 routes)
- `/api/admin/*` (multiple routes)
- `/api/draft/room/*` (3 routes)

### Missing Protection - CRITICAL (Top 10)

| Route | Method | Risk Level | Action |
|-------|--------|-----------|--------|
| `/api/auth/signup.ts` | POST | **CRITICAL** | Account creation - apply CSRF now |
| `/api/auth/verify-age.ts` | POST | **CRITICAL** | Compliance verification - apply CSRF now |
| `/api/create-payment-intent.ts` | POST | **CRITICAL** | Payment creation - apply CSRF now |
| `/api/paymongo/source.ts` | POST | CRITICAL | Payment method - apply CSRF now |
| `/api/paypal/oauth/connect.ts` | POST | CRITICAL | Payment auth - apply CSRF now |
| `/api/draft/submit-pick.ts` | POST | HIGH | Draft modification - apply CSRF now |
| `/api/draft/validate-pick.ts` | POST | HIGH | Draft validation - apply CSRF now |
| `/api/auth/username/check.ts` | POST | MEDIUM | Check availability - apply CSRF |
| `/api/paypal/orders/[orderId]` | POST | CRITICAL | Order creation - apply CSRF |
| `/api/auth/username/check-batch.ts` | POST | MEDIUM | Batch check - apply CSRF |

### Exempt Routes (Use Alternative Auth)

🔓 Webhook handlers (signature verification):
- `/api/stripe/webhook.ts`
- `/api/paymongo/webhook.ts`
- `/api/paystack/webhook.ts`
- `/api/paypal/webhook.ts`

🔓 NextAuth routes:
- `/api/auth/[...nextauth].ts` (session-based)

---

## Integration Guide

### Backend Integration

#### Step 1: Import CSRF Middleware

```typescript
import { withCSRFProtection } from '../../../lib/csrfProtection';
```

#### Step 2: Wrap Handler

```typescript
const handler = async function(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Your handler code
};

export default withCSRFProtection(handler);
```

#### Step 3: Type Safety (Optional)

```typescript
type CSRFHandler = (
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<void> | void;

export default withCSRFProtection(handler as CSRFHandler);
```

### Frontend Integration

#### Step 1: Initialize CSRF on App Load

```typescript
// In root component (e.g., _app.tsx)
import { initializeCsrf } from '@/lib/api/client';

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    initializeCsrf().catch(console.error);
  }, []);

  return <Component {...pageProps} />;
}
```

#### Step 2: Use API Client in Components

```typescript
// Replace direct fetch calls with apiClient
import { apiClient, apiJson } from '@/lib/api/client';

// Option 1: Using apiClient (manual parsing)
const response = await apiClient('/api/user/update-contact', {
  method: 'POST',
  body: JSON.stringify({ phone: '+1234567890' }),
});

// Option 2: Using apiJson (typed response)
const result = await apiJson<UserProfile>('/api/auth/signup', {
  method: 'POST',
  body: JSON.stringify({
    uid: 'firebase-uid',
    username: 'newuser',
  }),
});

if (result.success) {
  console.log('Success:', result.data);
} else {
  console.error('Error:', result.message);
}
```

#### Step 3: Handle CSRF Failures

The client automatically handles token refresh on 403 responses. However, you may want to add user feedback:

```typescript
async function updateUser(data: UserData) {
  try {
    const result = await apiJson('/api/user/update-contact', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!result.success) {
      if (result.error === 'CSRF_TOKEN_INVALID') {
        // User-friendly error - token will be refreshed
        showError('Security token expired. Please try again.');
      } else {
        showError(result.message || 'Update failed');
      }
    } else {
      showSuccess('Profile updated');
    }
  } catch (error) {
    showError('Network error. Please check your connection.');
  }
}
```

---

## Security Details

### Token Properties

| Property | Value | Rationale |
|----------|-------|-----------|
| **Length** | 64 hex chars (32 bytes) | Cryptographically secure random |
| **Generation** | `crypto.randomBytes(32)` | Cryptographically secure |
| **Comparison** | `timingSafeEqual()` | Prevents timing attacks |
| **Storage** | httpOnly cookie | JavaScript-inaccessible |
| **Attributes** | Secure, SameSite=Strict | Prevents XSS/CSRF bypass |
| **Max-Age** | 3600 seconds (1 hour) | Balances security vs usability |

### Validation Logic

```
1. Extract header token: req.headers['x-csrf-token']
2. Extract cookie token: req.cookies['csrf-token']
3. Both must be present and non-empty
4. Both must have same length
5. Constant-time comparison of buffers
6. Return 403 if any check fails
```

### Attack Prevention

- **CSRF**: Double-submit cookie pattern + SameSite=Strict
- **Token replay**: Validates per-request + short expiry
- **Timing attacks**: `timingSafeEqual()` constant-time comparison
- **XSS exfiltration**: httpOnly cookie prevents JS access
- **MITM attacks**: Secure flag requires HTTPS

---

## Implementation Checklist

### Phase 1: CRITICAL Routes (Auth & Payments)

- [ ] `/api/auth/signup.ts` - User account creation
- [ ] `/api/auth/verify-age.ts` - Compliance verification
- [ ] `/api/create-payment-intent.ts` - Payment creation
- [ ] `/api/paymongo/source.ts` - Payment method
- [ ] `/api/paypal/oauth/connect.ts` - Payment auth
- [ ] `/api/paypal/orders/[orderId]` - Order creation

### Phase 2: HIGH Priority Routes (User & Draft Operations)

- [ ] `/api/draft/submit-pick.ts` - Draft submission
- [ ] `/api/draft/validate-pick.ts` - Pick validation
- [ ] `/api/auth/username/check.ts` - Username check
- [ ] `/api/auth/username/check-batch.ts` - Batch check
- [ ] `/api/user/*` (remaining routes)
- [ ] `/api/admin/integrity/*` (state-changing)

### Phase 3: Remaining Routes

- [ ] All other POST/PUT/DELETE/PATCH routes
- [ ] Verify exemptions for webhooks
- [ ] Add logging for CSRF failures

### Phase 4: Frontend Integration

- [ ] Create `lib/api/client.ts` with CSRF support ✅ DONE
- [ ] Update root component to call `initializeCsrf()`
- [ ] Replace `fetch()` calls with `apiClient()` or `apiJson()`
- [ ] Add user feedback for CSRF errors
- [ ] Test token refresh on 403 responses

### Phase 5: Monitoring & Testing

- [ ] Add CSRF failure logging
- [ ] Create unit tests for protected routes
- [ ] E2E tests with CSRF tokens
- [ ] Monitor false positive rate
- [ ] Track token refresh frequency

---

## Testing

### Unit Test Template

```typescript
import { withCSRFProtection } from '@/lib/csrfProtection';

describe('Route Protection', () => {
  it('should reject requests without CSRF token', async () => {
    const req = createMockRequest({
      method: 'POST',
      headers: {},
      cookies: {},
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toBe(403);
    expect(res._json).toEqual({
      success: false,
      error: 'CSRF_TOKEN_INVALID',
    });
  });

  it('should accept valid CSRF tokens', async () => {
    const token = generateCSRFToken();
    const req = createMockRequest({
      method: 'POST',
      headers: { 'x-csrf-token': token },
      cookies: { 'csrf-token': token },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).not.toBe(403);
  });
});
```

### E2E Test Example

```typescript
// Cypress/Playwright
describe('CSRF Protection', () => {
  it('should get CSRF token and use it for POST requests', () => {
    cy.visit('/app/profile');

    // Token should be fetched automatically
    cy.request('GET', '/api/csrf-token').then(response => {
      expect(response.body).to.have.property('csrfToken');
    });

    // POST should include token in header
    cy.request({
      method: 'POST',
      url: '/api/user/update-contact',
      body: { phone: '+1234567890' },
      headers: {
        'x-csrf-token': 'token-value'
      }
    }).then(response => {
      expect(response.status).to.equal(200);
    });
  });

  it('should reject requests with invalid CSRF token', () => {
    cy.request({
      method: 'POST',
      url: '/api/user/update-contact',
      failOnStatusCode: false,
      body: { phone: '+1234567890' },
      headers: {
        'x-csrf-token': 'invalid-token'
      }
    }).then(response => {
      expect(response.status).to.equal(403);
      expect(response.body.error).to.equal('CSRF_TOKEN_INVALID');
    });
  });
});
```

---

## Troubleshooting

### Issue: "CSRF_TOKEN_INVALID" on every request

**Cause**: Token not being sent in header

**Solution**:
1. Verify `initializeCsrf()` is called
2. Check that `apiClient()` is being used (not raw `fetch()`)
3. Verify header name is exactly `x-csrf-token` (case-sensitive)

### Issue: Cookies not persisting

**Cause**: Missing `credentials: 'include'` in fetch options

**Solution**: The `apiClient()` automatically includes this. If using raw fetch:

```typescript
fetch('/api/endpoint', {
  credentials: 'include' // This is required
})
```

### Issue: Token refresh not working

**Cause**: 403 response body not being parsed correctly

**Solution**:
1. Verify response is JSON
2. Check error field matches `CSRF_TOKEN_INVALID`
3. Enable debug logging in browser console

### Issue: SameSite cookie not working

**Cause**: Site is not using HTTPS or localhost

**Solution**: In development, `setCSRFTokenCookie()` checks `process.env.NEXT_PUBLIC_BASE_URL`. Ensure:
- Production: HTTPS only
- Development: localhost is allowed (no Secure flag)

---

## References

### OWASP CSRF Prevention Cheat Sheet
https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html

### Double-Submit Cookie Pattern
https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#synchronizer-token-pattern

### Next.js API Routes
https://nextjs.org/docs/pages/building-your-application/routing/api-routes

### Node.js Crypto Module
https://nodejs.org/api/crypto.html

---

## Maintenance

### Regular Reviews

- **Monthly**: Check CSRF failure logs for patterns
- **Quarterly**: Review exempted routes
- **Annually**: Audit token generation randomness

### Future Improvements

1. **Token rotation**: Refresh token after successful request
2. **Per-user tokens**: Bind tokens to user ID for additional validation
3. **Rate limiting**: Combine with rate limiter on CSRF failures
4. **Analytics**: Track CSRF token usage patterns
5. **Custom exemptions**: Add per-route exemption configuration

---

## Questions?

Refer to:
- Unit tests: `__tests__/lib/csrfProtection.test.ts`
- Implementation: `lib/csrfProtection.ts`
- Client utility: `lib/api/client.ts`
- Test file example: `cypress/e2e/withdrawal-flow.cy.ts`
