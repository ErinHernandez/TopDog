# VX2 JavaScript Compatibility Audit

**Generated:** December 30, 2024  
**Scope:** `components/vx2/` directory  
**Target:** iOS 12+ Safari

---

## Summary

| Feature | iOS Requirement | Matches | Files | Risk | Action |
|---------|-----------------|---------|-------|------|--------|
| Optional chaining (`?.`) | 13.4+ | 202 | 40 | HIGH | Babel transpiles |
| Nullish coalescing (`??`) | 13.4+ | 84 | 25 | HIGH | Babel transpiles |
| `Array.prototype.at()` | 15.4+ | 0 | 0 | NONE | N/A |
| `Object.hasOwn()` | 15.4+ | 0 | 0 | NONE | N/A |
| `String.replaceAll()` | 13.4+ | 0 | 0 | NONE | N/A |
| Logical assignment (`??=`) | 14+ | 0 | 0 | NONE | N/A |

**Overall Status:** GOOD - Next.js/Babel will transpile the 286 instances of modern syntax

---

## Detailed Findings

### Optional Chaining (`?.`) - 202 instances

Next.js with `@babel/preset-env` will automatically transpile `?.` to compatible code when browserslist targets iOS 12.

**Files with highest usage:**

| File | Count | Notes |
|------|-------|-------|
| `PlayerExpandedCard.tsx` | 40 | Historical stats access |
| `PlayerStatsCard.tsx` | 40 | Stats display |
| `MobilePhoneFrame.tsx` | 9 | Device preset access |
| `useDraftRoom.ts` | 8 | Draft state access |
| `useDraftEngine.ts` | 8 | Engine state |
| `usePickExecutor.ts` | 8 | Pick execution |

**Transpilation Example:**
```javascript
// Before (modern)
const value = obj?.nested?.property;

// After (transpiled for iOS 12)
const value = obj === null || obj === void 0 
  ? void 0 
  : (_obj$nested = obj.nested) === null || _obj$nested === void 0 
    ? void 0 
    : _obj$nested.property;
```

### Nullish Coalescing (`??`) - 84 instances

Also automatically transpiled by Babel.

**Files with highest usage:**

| File | Count | Notes |
|------|-------|-------|
| `useAvailablePlayers.ts` | 10 | Default values |
| `useDraftRoom.ts` | 7 | State defaults |
| `MobilePhoneFrame.tsx` | 7 | Device defaults |
| `useDraftPicks.ts` | 6 | Pick data |
| `mockAdapter.ts` | 6 | Mock defaults |
| `autodraft.ts` | 6 | Autodraft logic |

**Transpilation Example:**
```javascript
// Before (modern)
const value = input ?? defaultValue;

// After (transpiled for iOS 12)
const value = input !== null && input !== void 0 ? input : defaultValue;
```

---

## Build Configuration

### Browserslist Targets (`.browserslistrc`)

```
iOS >= 12
Safari >= 12
Chrome >= 80
ChromeAndroid >= 80
```

### Babel Configuration

Next.js uses SWC by default, but falls back to Babel when `babel.config.js` exists. Both respect browserslist.

Current `babel.config.js`:
```javascript
module.exports = {
  presets: [
    '@babel/preset-env',  // Respects browserslist
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
};
```

### Verification

To verify transpilation is working:

```bash
# Build and check output
npm run build

# Check JS bundle for transpiled code
grep -r "void 0" .next/static/chunks/ | head -5
```

---

## Safe Patterns Detected

The following modern JS features were NOT found in VX2 (no action needed):

- `Array.prototype.at()` - Would require iOS 15.4+
- `Object.hasOwn()` - Would require iOS 15.4+
- `String.prototype.replaceAll()` - Would require iOS 13.4+
- Logical assignment operators (`&&=`, `||=`, `??=`) - Would require iOS 14+
- `Promise.any()` - Would require iOS 14+
- `WeakRef` - Would require iOS 14.5+
- Top-level await - Would require iOS 15+
- Private class fields (`#field`) - Would require iOS 14.5+

---

## Recommendations

1. **No code changes required** - Babel handles transpilation
2. **Add ESLint rules** to warn on iOS 15.4+ only features
3. **Monitor bundle size** - transpilation adds ~5-10% overhead
4. **Test on real iOS 12/13 devices** to verify transpilation works

---

## ESLint Rules to Add

```javascript
// .eslintrc.js - Add these rules to prevent future iOS 15.4+ only code
{
  rules: {
    'no-restricted-syntax': [
      'warn',
      {
        selector: 'CallExpression[callee.property.name="at"]',
        message: 'Array.at() requires iOS 15.4+. Use bracket notation instead.',
      },
    ],
    'no-restricted-properties': [
      'warn',
      {
        object: 'Object',
        property: 'hasOwn',
        message: 'Object.hasOwn() requires iOS 15.4+. Use hasOwnProperty instead.',
      },
    ],
  },
}
```

---

## Audit Complete

**Result:** VX2 JavaScript is compatible with iOS 12+ after Babel transpilation.
**Action Required:** Verify build output, add ESLint guardrails.


