# Middleware to Proxy Migration Plan

**Date:** January 23, 2026  
**Status:** 📅 Planned (Not Urgent)  
**Reference:** [Next.js Migration Guide](https://nextjs.org/docs/messages/middleware-to-proxy)

---

## Overview

Next.js has renamed the `middleware.ts` file convention to `proxy.ts` (November 2025). This is a naming change only - functionality remains identical. The term "proxy" better reflects that this feature runs at the Edge with a network boundary in front of the app.

---

## Why the Change?

1. **Clarifies Purpose:** "Proxy" better describes edge-level request handling
2. **Discourages Overuse:** Encourages lightweight, edge-appropriate logic
3. **Better Naming:** Reflects deployment model (CDN edge locations)

---

## Migration Timeline

**Current Status:** ✅ No immediate action required

**Recommended Timeline:**
- **Phase 1:** Monitor Next.js deprecation timeline (when `middleware.ts` will be deprecated)
- **Phase 2:** Plan migration during low-traffic period
- **Phase 3:** Execute migration using codemod
- **Phase 4:** Verify and test thoroughly

**Estimated Effort:** 1-2 hours (mostly automated)

---

## Migration Steps

### Step 1: Run Codemod

Next.js provides an automated codemod:

```bash
npx @next/codemod@canary middleware-to-proxy
```

**What it does:**
- Renames `middleware.ts` → `proxy.ts`
- Renames `middleware()` function → `proxy()`
- Updates exports

### Step 2: Manual Updates

**Update imports:**
```typescript
// Before
import { middleware } from './middleware';

// After
import { proxy } from './proxy';
```

**Update references:**
- Search codebase for `middleware` references
- Update documentation
- Update test files

### Step 3: Update Configuration

**No changes needed:**
- `matcher` config remains the same
- Environment variables unchanged
- Deployment config unchanged

### Step 4: Testing

**Test Checklist:**
- [ ] All redirects work correctly
- [ ] A/B testing still functions
- [ ] Headers are set correctly
- [ ] Query parameters preserved
- [ ] Error handling works
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass

---

## Code Changes

### Before (middleware.ts)

```typescript
export function middleware(request: NextRequest) {
  // ... logic
}

export const config = {
  matcher: [...],
};
```

### After (proxy.ts)

```typescript
export function proxy(request: NextRequest) {
  // ... same logic
}

export const config = {
  matcher: [...], // unchanged
};
```

**Note:** Logic remains identical - only naming changes.

---

## Impact Assessment

### ✅ No Impact On:
- Functionality
- Performance
- User experience
- Environment variables
- Deployment process

### ⚠️ Requires Updates:
- File name: `middleware.ts` → `proxy.ts`
- Function name: `middleware()` → `proxy()`
- Documentation references
- Test file names/imports

---

## Rollback Plan

If issues arise:

1. **Revert commit** (if using git)
2. **Rename back:** `proxy.ts` → `middleware.ts`
3. **Rename function:** `proxy()` → `middleware()`
4. **Revert imports**

**Risk Level:** Low (naming change only)

---

## Pre-Migration Checklist

- [ ] Review Next.js deprecation timeline
- [ ] Ensure all tests are passing
- [ ] Create backup branch
- [ ] Notify team of migration
- [ ] Schedule during low-traffic period
- [ ] Prepare rollback plan

---

## Post-Migration Checklist

- [ ] Verify all redirects work
- [ ] Check A/B testing functionality
- [ ] Verify headers are set correctly
- [ ] Run full test suite
- [ ] Monitor error logs
- [ ] Update documentation
- [ ] Update team on completion

---

## Testing Strategy

### Unit Tests
```bash
npm test -- __tests__/middleware.test.ts
# Update to: __tests__/proxy.test.ts
```

### Integration Tests
```bash
npm test -- __tests__/integration/middleware.integration.test.ts
# Update to: __tests__/integration/proxy.integration.test.ts
```

### E2E Tests
```bash
npm run cypress:run -- --spec "cypress/e2e/middleware-redirects.cy.js"
# Update test file references
```

---

## Documentation Updates

**Files to Update:**
- [ ] `docs/MIDDLEWARE_DEEP_RESEARCH.md` → Update references
- [ ] `docs/MIDDLEWARE_IN_THE_WILD_RESEARCH.md` → Update references
- [ ] `docs/AB_TESTING_SETUP.md` → Update file name
- [ ] `docs/PHASE1C_COMPLETE.md` → Update references
- [ ] README files mentioning middleware

---

## Current Status

**Action Required:** None (waiting for Next.js deprecation timeline)

**Recommendation:** 
- Monitor Next.js releases for deprecation announcement
- Plan migration during next maintenance window
- Use codemod for automated migration

---

## References

- [Next.js Middleware to Proxy Migration](https://nextjs.org/docs/messages/middleware-to-proxy)
- [Next.js Proxy Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Codemod Documentation](https://nextjs.org/docs/app/building-your-application/upgrading/codemods)

---

**Last Updated:** January 23, 2026  
**Next Review:** When Next.js announces deprecation timeline
