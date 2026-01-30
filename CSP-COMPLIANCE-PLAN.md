# Full CSP Compliance Plan: Removing 'unsafe-inline' from style-src

## Executive Summary

This plan outlines the path to achieving full Content Security Policy (CSP) compliance by removing `'unsafe-inline'` from the `style-src` directive. Based on comprehensive research of industry best practices and deep analysis of the codebase, we present three viable approaches with our recommendation.

**Current State:** The application uses `'unsafe-inline'` in CSP to allow inline styles, which is necessary because components pass CSS custom properties via React's `style={{}}` prop.

**Scale of Work:**
- ~1,500+ inline style instances across the codebase
- ~50 instances: Easy to refactor (static values)
- ~150-200 instances: Medium difficulty (conditional but finite variations)
- ~300-400 instances: Hard to refactor (truly dynamic values)
- 15+ locations using TILED_BG_STYLE spread pattern

---

## Part 1: Available Approaches

### Approach A: Nonce-Based CSP (Industry Standard)

**How It Works:**
1. Generate a cryptographically secure nonce per request in middleware
2. Add nonce to CSP header: `style-src 'nonce-abc123...'`
3. Apply nonce to all `<style>` tags injected at runtime
4. Keep inline styles but make them CSP-compliant via nonce

**Implementation:**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const cspHeader = `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com;`
  // Pass nonce to components via headers
}
```

**Pros:**
- ✅ Minimal code changes to existing components
- ✅ Keeps dynamic styling capabilities
- ✅ Industry-standard approach (used by Google, Facebook)
- ✅ ~20-40 hours of implementation work

**Cons:**
- ❌ Requires dynamic rendering (no static generation)
- ❌ Slight performance overhead per request
- ❌ More complex SSR setup
- ❌ Next.js nonce support still maturing (v13.4.20+)

**Effort Estimate:** 20-40 hours

---

### Approach B: Zero-Runtime CSS (Full Refactor)

**How It Works:**
1. Remove ALL inline styles from components
2. Use CSS Modules + data attributes for all styling
3. Define all variations as CSS classes
4. Use CSS custom properties set at `:root` or via class selectors only

**Implementation:**
```tsx
// Before (inline style)
<div style={{ '--card-background': colors.background }}>

// After (data attribute + CSS)
<div data-theme={theme} data-variant={variant}>

// CSS Module
[data-theme="dark"][data-variant="featured"] {
  --card-background: url('/featured-dark.png');
}
```

**Pros:**
- ✅ Full CSP compliance without nonces
- ✅ Works with static generation
- ✅ Best runtime performance
- ✅ No middleware complexity

**Cons:**
- ❌ Massive refactoring effort (~300-400 dynamic instances)
- ❌ Loss of truly dynamic styling (calculated values, user colors)
- ❌ Must enumerate ALL possible variations in CSS
- ❌ ~200-300 hours of implementation work

**Effort Estimate:** 200-300 hours

---

### Approach C: Hybrid (Recommended)

**How It Works:**
1. Refactor easy/medium instances to CSS classes (~200 instances)
2. Keep CSS variable pattern for truly dynamic values
3. Implement nonce support for remaining dynamic styles
4. Progressive migration over time

**Implementation Phases:**
- Phase 1: Quick wins (static styles → CSS classes)
- Phase 2: TILED_BG_STYLE refactor (high impact)
- Phase 3: Conditional styles → data attributes
- Phase 4: Nonce implementation for dynamic values
- Phase 5: Cleanup and optimization

**Pros:**
- ✅ Balanced effort vs. security improvement
- ✅ Reduces attack surface significantly
- ✅ Maintains dynamic styling where needed
- ✅ Incremental, testable changes

**Cons:**
- ❌ Still requires nonce for full compliance
- ❌ More complex architecture (two patterns)
- ❌ ~80-120 hours total implementation

**Effort Estimate:** 80-120 hours

---

## Part 2: Codebase Analysis Summary

### Inline Style Inventory

| Category | Count | Refactor Difficulty | Examples |
|----------|-------|---------------------|----------|
| Static layout styles | ~50 | Easy | `flex: 1`, `display: flex` |
| Conditional finite states | ~150-200 | Medium | `isYourTurn && TILED_BG_STYLE` |
| Dynamic CSS variables | ~300-400 | Hard | `--card-background: colors.bg` |
| Calculated values | ~50 | Keep as-is | `height: ${3 + (bar-1)*2}px` |

### High-Impact Files

1. **DepositModalVX2.tsx** - 204 style instances
2. **RankingsModalVX2.tsx** - 60+ instances
3. **ConnectOnboardingModalVX2.tsx** - 40+ instances
4. **pages/dev-access.tsx** - 50+ instances (all static, easy win)
5. **TournamentCardBottomSection.tsx** - Complex conditional spreads

### TILED_BG_STYLE Usage (15+ locations)

Currently spread directly onto elements:
```typescript
style={{ ...(isYourTurn && TILED_BG_STYLE) }}
```

Can be refactored to:
```typescript
className={clsx(styles.button, isYourTurn && styles.tiledBackground)}
```

### What's Already Good ✅

- Design tokens extracted (SPACING, TYPOGRAPHY, COLORS)
- CSS Modules in use for component styling
- CSS custom properties pattern established
- No third-party library inline styles
- Constants centralized in constants files

---

## Part 3: Recommended Approach - Hybrid (Approach C)

### Why Hybrid?

1. **Full zero-runtime is impractical** - 300+ truly dynamic values can't be enumerated
2. **Nonce-only misses easy wins** - ~200 instances could be pure CSS
3. **Hybrid maximizes security improvement per hour** - Best ROI

### Implementation Roadmap

#### Phase 1: Quick Wins (8-12 hours)
**Goal:** Convert static inline styles to CSS utilities

**Files:**
- `pages/dev-access.tsx` (50+ instances → Tailwind utilities)
- Layout patterns across components (flex, positioning)

**Tasks:**
1. Create utility classes for common patterns:
   - `.flex-center` = `display: flex; align-items: center; justify-content: center`
   - `.flex-1-min-h-0` = `flex: 1; min-height: 0`
   - `.relative-z-10` = `position: relative; z-index: 10`
2. Replace inline styles with utility classes
3. Test all affected pages

**Security Impact:** Low (removes ~50 static instances)

---

#### Phase 2: TILED_BG_STYLE Refactor (12-16 hours)
**Goal:** Convert spread pattern to CSS class

**Current Pattern (15+ locations):**
```typescript
style={{ ...(isYourTurn && TILED_BG_STYLE) }}
```

**New Pattern:**
```css
/* globals.css or component module */
.bg-tiled {
  background-image: url('/wr_blue.png');
  background-repeat: repeat;
  background-size: 60px 60px;
  background-color: #1E3A5F;
}
```

```typescript
className={clsx(styles.button, isYourTurn && 'bg-tiled')}
```

**Files to Update:**
- LiveDraftsTabVX2.tsx (lines 208, 248)
- TournamentCardBottomSection.tsx (line 158)
- TournamentCardBottomSectionV2.tsx (line 223)
- TournamentCardBottomSectionV3.tsx (line 159)
- SlowDraftCard.tsx (line 130)
- ProfileTabVX2.tsx (lines 446-448)
- DraftStatusBar.tsx (lines 107-111)

**Tasks:**
1. Add `.bg-tiled` class to globals.css or create utility
2. Update each component to use className instead of style spread
3. Handle conditional application with clsx
4. Test all "your turn" states and button backgrounds

**Security Impact:** Medium (removes consistent pattern)

---

#### Phase 3: Conditional Styles → Data Attributes (16-24 hours)
**Goal:** Convert finite-state conditionals to CSS selectors

**Target Patterns:**

**A) Password Strength Indicator**
```typescript
// Before
style={{ color: strengthColor }}

// After
data-strength={strength} // 'weak' | 'medium' | 'strong'

// CSS
[data-strength="weak"] { color: var(--color-error); }
[data-strength="medium"] { color: var(--color-warning); }
[data-strength="strong"] { color: var(--color-success); }
```

**B) Status-Based Colors**
```typescript
// Before
style={{ color: req.check ? STATE_COLORS.success : TEXT_COLORS.muted }}

// After
data-status={req.check ? 'success' : 'pending'}

// CSS
[data-status="success"] { color: var(--color-success); }
[data-status="pending"] { color: var(--text-muted); }
```

**C) Direction Transforms**
```typescript
// Before
style={{ transform: direction === 'desc' ? 'rotate(180deg)' : 'rotate(0deg)' }}

// After
data-direction={direction}

// CSS
[data-direction="desc"] { transform: rotate(180deg); }
[data-direction="asc"] { transform: rotate(0deg); }
```

**Files to Update:**
- SignUpModal.tsx
- SignUpScreenVX2.tsx
- PlayoffPodDetail.tsx
- Various status indicators

**Security Impact:** Medium-High (removes ~150 conditional instances)

---

#### Phase 4: Nonce Implementation (20-30 hours)
**Goal:** Add CSP nonce support for remaining dynamic styles

**Tasks:**

1. **Create Middleware:**
```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  const cspHeader = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://fonts.googleapis.com https://js.stripe.com`,
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    // ... rest of CSP
  ].join('; ')

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', cspHeader)

  return response
}
```

2. **Create Nonce Context:**
```typescript
// contexts/NonceContext.tsx
'use client'
import { createContext, useContext } from 'react'

const NonceContext = createContext<string | undefined>(undefined)

export function NonceProvider({ nonce, children }) {
  return <NonceContext.Provider value={nonce}>{children}</NonceContext.Provider>
}

export function useNonce() {
  return useContext(NonceContext)
}
```

3. **Update Root Layout:**
```typescript
// app/layout.tsx
import { headers } from 'next/headers'
import { NonceProvider } from '@/contexts/NonceContext'

export default async function RootLayout({ children }) {
  const nonce = headers().get('x-nonce') ?? undefined

  return (
    <html>
      <body>
        <NonceProvider nonce={nonce}>
          {children}
        </NonceProvider>
      </body>
    </html>
  )
}
```

4. **Handle Remaining Dynamic Styles:**
   - Position colors (POSITION_COLORS mapping)
   - Brand colors (payment method colors)
   - Calculated dimensions
   - Dynamic background URLs

**Security Impact:** High (enables removal of 'unsafe-inline')

---

#### Phase 5: Cleanup & Verification (8-12 hours)
**Goal:** Remove 'unsafe-inline', verify, and document

**Tasks:**
1. Remove `'unsafe-inline'` from CSP style-src
2. Run full E2E test suite
3. Manual testing of all major flows
4. Monitor CSP violation reports (`/api/csp-report`)
5. Document new patterns for team
6. Update CLAUDE.md with styling guidelines

**Verification Checklist:**
- [ ] All pages render correctly
- [ ] All modals display properly
- [ ] Tournament cards show backgrounds
- [ ] Draft room styling intact
- [ ] Payment flows work
- [ ] No CSP violations in console
- [ ] No CSP violations in report endpoint

---

## Part 4: Effort & Timeline Summary

| Phase | Description | Hours | Dependencies |
|-------|-------------|-------|--------------|
| 1 | Quick Wins (static styles) | 8-12 | None |
| 2 | TILED_BG_STYLE Refactor | 12-16 | Phase 1 |
| 3 | Conditional → Data Attributes | 16-24 | Phase 1 |
| 4 | Nonce Implementation | 20-30 | Phase 2, 3 |
| 5 | Cleanup & Verification | 8-12 | Phase 4 |
| **Total** | | **64-94 hours** | |

**Recommended Timeline:**
- Week 1-2: Phases 1-2 (Quick wins + TILED_BG_STYLE)
- Week 3-4: Phase 3 (Conditional styles)
- Week 5-6: Phase 4 (Nonce implementation)
- Week 7: Phase 5 (Cleanup, testing, launch)

---

## Part 5: Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Nonce breaks static generation | Medium | High | Accept dynamic rendering for CSP pages |
| Styling regressions | Medium | Medium | Comprehensive visual regression tests |
| Third-party scripts fail | Low | High | Test Stripe, analytics with nonces |
| Performance degradation | Low | Low | Benchmark before/after |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Extended development time | Medium | Medium | Phase approach allows partial deployment |
| User-facing bugs | Low | High | Staged rollout, feature flags |
| Team learning curve | Low | Low | Document patterns, code review |

---

## Part 6: Alternative Consideration - Accept Current State

### When to Accept 'unsafe-inline'

If the effort/benefit ratio doesn't justify full compliance:

1. **Current security posture is acceptable** for most applications
2. **CSP still provides protection** against many XSS vectors
3. **'unsafe-inline' for styles** is lower risk than for scripts
4. **Many major sites** use 'unsafe-inline' for styles (including some Google properties)

### Minimum Viable Security

If full compliance isn't pursued, ensure:
- ✅ `script-src` does NOT include 'unsafe-inline' (critical)
- ✅ `default-src 'self'` is set
- ✅ `object-src 'none'` prevents plugins
- ✅ `frame-ancestors` prevents clickjacking
- ✅ CSP reporting enabled for monitoring

---

## Part 7: Decision Matrix

| Criteria | Approach A (Nonce) | Approach B (Zero-Runtime) | Approach C (Hybrid) |
|----------|-------------------|--------------------------|---------------------|
| Effort | 20-40 hrs | 200-300 hrs | 64-94 hrs |
| Security Level | Full | Full | Full |
| Maintains Dynamic Styling | Yes | No | Yes |
| Static Generation | No | Yes | Partial |
| Complexity | Medium | Low (after refactor) | Medium |
| **Recommendation** | If time-constrained | If greenfield | **Best balance** |

---

## Conclusion

**Recommended Path:** Hybrid Approach (C)

1. **Phases 1-3** reduce inline styles by ~400 instances (~60% reduction)
2. **Phase 4** adds nonce support for remaining dynamic values
3. **Phase 5** removes 'unsafe-inline' and achieves full compliance

**Total Effort:** 64-94 hours over 6-7 weeks

**Outcome:** Enterprise-grade CSP compliance with `style-src 'self' 'nonce-{dynamic}' https://fonts.googleapis.com` - no 'unsafe-inline' required.

---

*Document generated: January 2026*
*Based on: Web research + codebase analysis of bestball-site*
