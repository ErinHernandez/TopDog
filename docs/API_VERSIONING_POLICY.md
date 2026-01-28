# API Versioning Policy

## Overview

This document defines the API versioning strategy for the BestBall site. API versioning allows us to make improvements and breaking changes without breaking existing clients (especially mobile apps).

---

## Current Route Status

### v1 Routes (Active)

| Route | Non-v1 Equivalent | Status | Migration Notes |
|-------|------------------|--------|-----------------|
| `/api/v1/stripe/customer` | `/api/stripe/customer` | ✅ Parity | Use v1 for new clients |
| `/api/v1/stripe/payment-intent` | `/api/create-payment-intent` | ⚠️ Enhanced | v1 has multi-currency, risk assessment |
| `/api/v1/user/display-currency` | `/api/user/display-currency` | ✅ Parity | Use v1 for new clients |

### Deprecation Schedule

| Non-v1 Route | Replacement | Deprecation Date | Removal Date |
|--------------|-------------|------------------|--------------|
| `/api/create-payment-intent` | `/api/v1/stripe/payment-intent` | 2026-04-01 | 2026-10-01 |
| `/api/stripe/customer` | `/api/v1/stripe/customer` | 2026-04-01 | 2026-10-01 |
| `/api/user/display-currency` | `/api/v1/user/display-currency` | 2026-04-01 | 2026-10-01 |

> **Note:** Starting 2026-04-01, non-v1 routes will return deprecation headers. All clients should migrate to `/api/v1/*` before 2026-10-01.

### Migration Recommendation

**New clients (web, mobile):** Always use `/api/v1/*` routes.

**Existing clients:** Continue using non-v1 routes until migration is scheduled. Check for `Deprecation` header in responses.

---

## Versioning Strategy

### When to Version

**Create a new version (`/api/v1/`) when:**
- Making breaking changes to request/response formats
- Removing or renaming required fields
- Changing authentication requirements
- Changing error response formats
- Changing behavior in a way that could break clients

**Do NOT version for:**
- Adding new optional fields
- Adding new endpoints
- Bug fixes that don't change the API contract
- Performance improvements
- Internal refactoring

### Version Format

- **Current version:** `/api/v1/`
- **Future versions:** `/api/v2/`, `/api/v3/`, etc.
- **Unversioned endpoints:** Legacy endpoints remain at `/api/*` for backward compatibility

### Deprecation Policy

1. **Announcement:** When deprecating an endpoint, add a `Deprecation` header:
   ```
   Deprecation: true
   Sunset: <date-in-RFC-1123-format>
   Link: <link-to-migration-guide>; rel="deprecation"
   ```

2. **Timeline:**
   - **Announcement:** 6 months before deprecation
   - **Deprecation:** Endpoint still works but returns deprecation headers
   - **Removal:** After 12 months total (6 months deprecation + 6 months announcement)

3. **Migration Guide:** Document how to migrate from old to new version

## Implementation

### Directory Structure

```
pages/api/
  ├── v1/              # Versioned endpoints (new)
  │   ├── stripe/
  │   │   ├── customer.ts
  │   │   └── payment-intent.ts
  │   └── user/
  │       └── display-currency.ts
  ├── stripe/          # Legacy endpoints (kept for backward compatibility)
  ├── user/            # Legacy endpoints
  └── ...
```

### Response Headers

All versioned endpoints include:
```
API-Version: 1
```

### Error Responses

Versioned endpoints use consistent error format:
```json
{
  "ok": false,
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "userId is required",
    "details": {}
  },
  "requestId": "req_1234567890_abc123",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## Migration Examples

### Example 1: Stripe Customer API

**Old endpoint:** `/api/stripe/customer`  
**New endpoint:** `/api/v1/stripe/customer`

**Changes:**
- Same request/response format
- Added `API-Version` header
- Better error handling

**Migration:**
1. Update client to use `/api/v1/stripe/customer`
2. Handle new `API-Version` header
3. Test thoroughly

### Example 2: Payment Intent API

**Old endpoint:** `/api/stripe/payment-intent`  
**New endpoint:** `/api/v1/stripe/payment-intent`

**Changes:**
- Same request/response format
- Added `API-Version` header
- Improved risk assessment

## Best Practices

1. **Always use `withErrorHandling`** from `lib/apiErrorHandler.js` for consistent error responses
2. **Include `API-Version` header** in all versioned endpoints
3. **Document breaking changes** in migration guide
4. **Test backward compatibility** when deprecating endpoints
5. **Monitor usage** of deprecated endpoints before removal

## Client Integration

### Detecting API Version

Clients should check the `API-Version` header:
```javascript
const response = await fetch('/api/v1/stripe/customer');
const apiVersion = response.headers.get('API-Version');
```

### Handling Deprecation

Clients should respect `Deprecation` headers:
```javascript
const deprecation = response.headers.get('Deprecation');
const sunset = response.headers.get('Sunset');

if (deprecation === 'true') {
  console.warn(`API endpoint deprecated. Sunset date: ${sunset}`);
  // Plan migration to new version
}
```

## Future Versions

When creating `/api/v2/`:
1. Document all breaking changes
2. Provide migration guide
3. Keep `/api/v1/` working for at least 12 months
4. Announce deprecation 6 months before removal

---

**Last Updated:** January 2026  
**Current Version:** v1  
**Deprecation Status:** v0 (non-v1) routes deprecated 2026-04-01, removal 2026-10-01  
**Next Review:** When planning v2
