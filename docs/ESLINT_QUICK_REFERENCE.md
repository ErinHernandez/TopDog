# ESLint Configuration Quick Reference

**Quick access guide for ESLint best practices and recommendations**

---

## 🎯 Key Principles

1. **Use `"error"` or `"off"` - avoid `"warn"` for long-term enforcement**
2. **File-pattern-based rules** for different code areas
3. **Gradual migration** with defined timelines
4. **Block CI on errors, track warnings** with thresholds

---

## 📋 Recommended Configuration

### Critical Rules (Errors)
```javascript
"react-hooks/rules-of-hooks": "error",      // Can cause runtime errors
"react-hooks/exhaustive-deps": "error",     // Common bugs (stale closures)
```

### Performance Rules (Warnings - Temporary)
```javascript
"react-hooks/set-state-in-effect": "warn", // TODO: Convert to error by [date]
"react-hooks/immutability": "warn",         // TODO: Convert to error by [date]
"react-hooks/refs": "warn",                 // TODO: Convert to error by [date]
```

### Optimization Rules (Warnings OK)
```javascript
"react-hooks/preserve-manual-memoization": "warn", // React Compiler hint
"react-hooks/static-components": "warn",           // React Compiler hint
"react-hooks/error-boundaries": "warn",            // Best practice
"react-hooks/purity": "warn",                      // Best practice
```

### Console Rule (Smart Configuration)
```javascript
// Default: Allow error tracking, warn on debug logs
"no-console": ["warn", { allow: ["warn", "error", "info"] }],

// Override for dev/test files
{ files: ["pages/testing-grounds/**/*", "sandbox/**/*"], 
  rules: { "no-console": "off" } },

// Override for API routes (server-side logging OK)
{ files: ["pages/api/**/*.ts", "lib/**/*.ts"], 
  rules: { "no-console": ["warn", { allow: ["warn", "error", "info"] }] } }
```

---

## 🔧 Common Fixes

### exhaustive-deps
```typescript
// ❌ Bad
useEffect(() => {
  loadData(userId);
}, []); // Missing userId

// ✅ Good
useEffect(() => {
  loadData(userId);
}, [userId, loadData]);
```

### set-state-in-effect
```typescript
// ❌ Bad
const [mounted, setMounted] = useState(false);
useEffect(() => {
  setMounted(true);
}, []);

// ✅ Good
const [mounted, setMounted] = useState(true);
// Or use ref for mount tracking
```

### rules-of-hooks
```typescript
// ❌ Bad
if (condition) return null;
const memoized = useMemo(...);

// ✅ Good
const memoized = useMemo(...);
if (condition) return null;
```

### immutability
```typescript
// ❌ Bad
useEffect(() => {
  refreshData(); // Accessed before declaration
}, []);

const refreshData = async () => { ... };

// ✅ Good
const refreshData = useCallback(async () => {
  ...
}, []);

useEffect(() => {
  refreshData();
}, [refreshData]);
```

---

## 📊 Current State

- **Total Warnings:** 363
- **React Hooks Warnings:** 188 (52%)
- **Console Statements:** 3,252 (not linted)
- **CI/CD Status:** ✅ Passing (all warnings)

---

## 🚀 Migration Timeline

### Week 1
- [ ] Implement smart console rule
- [ ] Set critical hooks rules to errors
- [ ] Fix critical violations

### Month 1-2
- [ ] Fix remaining critical violations
- [ ] Document patterns
- [ ] Share fix guide

### Month 3
- [ ] Convert performance rules to errors
- [ ] Reduce warnings by 50%
- [ ] Set CI warning threshold

### Month 4-6
- [ ] Continue fixing warnings
- [ ] Migrate console.log (80% target)
- [ ] Full enforcement

---

## 📚 Related Documents

- **Deep Dive:** `docs/ESLINT_CONFIGURATION_DEEP_DIVE.md`
- **Best Practices Research:** `docs/ESLINT_BEST_PRACTICES_RESEARCH.md`
- **React Hooks Fix Guide:** `docs/REACT_HOOKS_FIX_GUIDE.md`
- **Summary:** `docs/ESLINT_OPTIMIZATION_SUMMARY.md`

---

## ⚡ Quick Commands

```bash
# Run linter
npm run lint

# Auto-fix issues
npm run lint:fix

# Check warning count
npm run lint 2>&1 | grep -E "(warning|error)" | wc -l

# Check React hooks warnings
npm run lint 2>&1 | grep "react-hooks" | wc -l
```

---

## 🎓 Key Learnings

1. **Warnings accumulate** - Use errors for enforcement
2. **File patterns** - Different rules for different code areas
3. **Gradual migration** - Incremental introduction with timelines
4. **Structured logging** - Migrate from console.log for production
5. **CI/CD integration** - Block on errors, track warnings

---

**Last Updated:** January 27, 2026
