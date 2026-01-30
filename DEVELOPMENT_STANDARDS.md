# Development Standards

> **Read this before writing any code.**

This document defines the architectural constraints for this codebase. These are not suggestions — they are requirements enforced in PR review.

**Last Updated:** January 2026

---

## Platform Context

This is a **Best Ball fantasy football platform**:
- No roster moves, trades, or waiver wire
- Once drafted, rosters are locked for the season
- Scoring is automatic based on optimal lineup projections

Critical features that must never break: **drafts** and **payments**.

---

## Architectural Requirements

### 1. CSP Compliance (Zero-Runtime CSS)

**Status:** 🔄 Active requirement — must be maintained in all new code

**Rules:**
- ❌ No static inline styles (`style={{ color: 'red' }}`)
- ❌ No importing JS color/style constants in components
- ✅ Use CSS Modules + design tokens
- ✅ Dynamic values use CSS custom property pattern

**Required reading:** [`/docs/ZERO-RUNTIME-CSS-GUIDE.md`](/docs/ZERO-RUNTIME-CSS-GUIDE.md)

**Why:** One inline style breaks CSP compliance for the entire app.

---

### 2. Error Handling

**Rules:**
- All API routes must use standardized error handlers
- Client errors must be caught and displayed gracefully
- No unhandled promise rejections

**Required reading:** [`/docs/API_ERROR_HANDLING.md`](/docs/API_ERROR_HANDLING.md)

---

### 3. TypeScript

**Current state:** Strict mode is disabled (technical debt)

**Rules for new code:**
- Avoid `any` types — use proper typing
- Define interfaces for all data structures
- Type all function parameters and return values

---

## PR Checklist

Before submitting a PR, verify:

- [ ] No static inline styles added
- [ ] No JS color constants imported in components
- [ ] All new styles use CSS Modules + tokens
- [ ] Error handling follows standard patterns
- [ ] No `console.log` left in production code
- [ ] No new `any` types without justification

---

## Quick Links

| Topic | Document |
|-------|----------|
| Styling (CSS) | [`/docs/ZERO-RUNTIME-CSS-GUIDE.md`](/docs/ZERO-RUNTIME-CSS-GUIDE.md) |
| Error Handling | [`/docs/API_ERROR_HANDLING.md`](/docs/API_ERROR_HANDLING.md) |
| Design Tokens | `/styles/tokens.css` |
| Enterprise Audit | [`ENTERPRISE_GRADE_AUDIT.md`](ENTERPRISE_GRADE_AUDIT.md) |

---

## Philosophy

> Enterprise grade. Fanatical about UX. Be thorough, take your time, quality over speed.

When in doubt:
1. Don't break existing functionality
2. Follow established patterns in the codebase
3. Ask if unclear

---

## Questions?

If you're unsure whether something violates these standards, check the detailed guides linked above or ask before implementing.
