# React Hooks Fix Guide

**Quick Reference:** Common React Hooks linting warnings and how to fix them

---

## 1. `react-hooks/immutability` - Variable Accessed Before Declaration

### Problem
Accessing a function/variable in `useEffect` before it's declared.

### Example (Current Code)
```javascript
// ❌ Bad - PaymentSecurityDashboard.js:19
useEffect(() => {
  refreshData(); // Accessed before declaration
}, [refreshInterval]);

const refreshData = async () => {
  // ...
};
```

### Fix Options

**Option 1: Move function before useEffect**
```javascript
// ✅ Good
const refreshData = async () => {
  // ...
};

useEffect(() => {
  refreshData();
}, [refreshInterval, refreshData]);
```

**Option 2: Use useCallback**
```javascript
// ✅ Better - Memoized function
const refreshData = useCallback(async () => {
  // ...
}, []); // Add dependencies as needed

useEffect(() => {
  refreshData();
}, [refreshInterval, refreshData]);
```

**Option 3: Define function inside useEffect**
```javascript
// ✅ Good for simple cases
useEffect(() => {
  const refreshData = async () => {
    // ...
  };
  
  refreshData();
}, [refreshInterval]);
```

---

## 2. `react-hooks/set-state-in-effect` - setState in Effect

### Problem
Calling `setState` synchronously within `useEffect` can trigger cascading renders.

### Example (Current Code)
```javascript
// ❌ Bad - Multiple files
useEffect(() => {
  setMounted(true); // Direct setState in effect
}, []);
```

### Fix Options

**Option 1: Use initial state**
```javascript
// ✅ Good - If no conditional logic needed
const [mounted, setMounted] = useState(true);
// No useEffect needed
```

**Option 2: Use ref for mount tracking**
```javascript
// ✅ Good - For preventing updates after unmount
const isMountedRef = useRef(true);

useEffect(() => {
  return () => {
    isMountedRef.current = false;
  };
}, []);

// Use in async operations
if (!isMountedRef.current) return;
```

**Option 3: Move to event handler or callback**
```javascript
// ✅ Good - If state update is triggered by user action
const handleMount = () => {
  setMounted(true);
};

useEffect(() => {
  // Only subscribe to external system
  const subscription = subscribe(handleMount);
  return () => subscription.unsubscribe();
}, []);
```

**Option 4: Use setTimeout for deferred update**
```javascript
// ✅ Good - If update must be deferred
useEffect(() => {
  const timer = setTimeout(() => {
    setMounted(true);
  }, 0);
  return () => clearTimeout(timer);
}, []);
```

---

## 3. `react-hooks/exhaustive-deps` - Missing Dependencies

### Problem
Missing dependencies in `useEffect` dependency array can cause stale closures.

### Example (Current Code)
```javascript
// ❌ Bad - admin/IntegrityDashboard.tsx:246
useEffect(() => {
  loadDetail(); // 'loadDetail' missing from deps
}, []);
```

### Fix Options

**Option 1: Add missing dependency**
```javascript
// ✅ Good
useEffect(() => {
  loadDetail();
}, [loadDetail]);
```

**Option 2: Use useCallback for function**
```javascript
// ✅ Better - Memoize function
const loadDetail = useCallback(() => {
  // ...
}, [/* dependencies */]);

useEffect(() => {
  loadDetail();
}, [loadDetail]);
```

**Option 3: Move function inside useEffect**
```javascript
// ✅ Good - If function is only used in this effect
useEffect(() => {
  const loadDetail = () => {
    // ...
  };
  loadDetail();
}, [/* actual dependencies */]);
```

**Option 4: Disable rule (if intentional)**
```javascript
// ✅ Acceptable - If you intentionally want to run once
useEffect(() => {
  loadDetail();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

---

## 4. `react-hooks/rules-of-hooks` - Conditional Hooks

### Problem
Hooks called conditionally or after early returns violate Rules of Hooks.

### Example (Current Code)
```javascript
// ❌ Bad - mobile/DraftBoardModal.tsx:124
if (condition) return null;
const memoized = useMemo(...); // Hook after early return
```

### Fix Options

**Option 1: Move hooks before conditional**
```javascript
// ✅ Good
const memoized = useMemo(...);
const callback = useCallback(...);

if (condition) return null;
// Use memoized and callback here
```

**Option 2: Use conditional inside hook**
```javascript
// ✅ Good
const memoized = useMemo(() => {
  if (condition) return defaultValue;
  return computeValue();
}, [condition, /* other deps */]);
```

**Option 3: Early return after all hooks**
```javascript
// ✅ Good - All hooks first
const memoized = useMemo(...);
const callback = useCallback(...);
const [state, setState] = useState(...);

// Then early return
if (condition) return null;

// Rest of component
```

---

## 5. `react-hooks/preserve-manual-memoization` - React Compiler Optimization

### Problem
Manual memoization prevents React Compiler from optimizing automatically.

### Example (Current Code)
```javascript
// ⚠️ Warning - Not an error
const handleSelection = useCallback((item) => {
  // ...
}, []);
```

### Fix Options

**Option 1: Remove manual memoization (if React Compiler enabled)**
```javascript
// ✅ Good - Let React Compiler handle it
const handleSelection = (item) => {
  // ...
};
```

**Option 2: Keep manual memoization (if needed for performance)**
```javascript
// ✅ Acceptable - If you need explicit control
const handleSelection = useCallback((item) => {
  // ...
}, [/* deps */]);
// eslint-disable-next-line react-hooks/preserve-manual-memoization
```

**Note:** This is a warning, not an error. React Compiler can optimize automatically, but manual memoization is still valid if you need explicit control.

---

## 6. `react-hooks/static-components` - Static Component Definition

### Problem
Component defined inside another component can't be optimized.

### Example (Current Code)
```javascript
// ⚠️ Warning
const MyComponent = () => {
  const PulsingLogo = () => ( // Component inside component
    <div>...</div>
  );
  
  return <PulsingLogo />;
};
```

### Fix Options

**Option 1: Move component outside**
```javascript
// ✅ Good
const PulsingLogo = () => (
  <div>...</div>
);

const MyComponent = () => {
  return <PulsingLogo />;
};
```

**Option 2: Use useMemo for JSX**
```javascript
// ✅ Good - If component needs closure over props
const MyComponent = () => {
  const pulsingLogo = useMemo(() => (
    <div>...</div>
  ), [/* deps */]);
  
  return pulsingLogo;
};
```

---

## Quick Fix Checklist

When fixing React Hooks warnings:

1. ✅ **Move functions before useEffects** that use them
2. ✅ **Use useCallback** for functions passed to effects
3. ✅ **Add all dependencies** to dependency arrays
4. ✅ **Move hooks before early returns**
5. ✅ **Use initial state** instead of setState in effects when possible
6. ✅ **Use refs** for mount tracking instead of state
7. ✅ **Move nested components** outside parent components

---

## Common Patterns

### Pattern 1: Mount State
```javascript
// ❌ Bad
const [mounted, setMounted] = useState(false);
useEffect(() => {
  setMounted(true);
}, []);

// ✅ Good
const [mounted, setMounted] = useState(true);
// Or use ref if you need to check mount status
const isMountedRef = useRef(true);
```

### Pattern 2: Async Data Loading
```javascript
// ❌ Bad
useEffect(() => {
  loadData();
}, []);

const loadData = async () => { /* ... */ };

// ✅ Good
const loadData = useCallback(async () => {
  // ...
}, [/* deps */]);

useEffect(() => {
  loadData();
}, [loadData]);
```

### Pattern 3: Conditional Rendering with Hooks
```javascript
// ❌ Bad
if (!user) return null;
const data = useMemo(...);

// ✅ Good
const data = useMemo(...);
if (!user) return null;
```

---

## Priority Order for Fixes

1. **Critical (Fix First):**
   - `rules-of-hooks` - Can cause runtime errors
   - `immutability` - Can cause bugs

2. **High Priority:**
   - `exhaustive-deps` - Can cause stale closures
   - `set-state-in-effect` - Performance concern

3. **Low Priority (Warnings OK):**
   - `preserve-manual-memoization` - Optimization hint
   - `static-components` - Optimization hint
   - `error-boundaries` - Best practice
   - `purity` - Best practice

---

## Tools & Resources

- **React Hooks Rules:** https://react.dev/reference/rules/rules-of-hooks
- **ESLint Plugin:** https://www.npmjs.com/package/eslint-plugin-react-hooks
- **React Compiler:** https://react.dev/learn/react-compiler

---

## Auto-Fixable Issues

Some issues can be auto-fixed:
```bash
npm run lint:fix
```

**Auto-fixable:**
- Some `exhaustive-deps` (if dependencies are obvious)
- Formatting issues
- Some `no-unescaped-entities`

**Not Auto-fixable:**
- `rules-of-hooks` (requires code restructuring)
- `immutability` (requires moving code)
- `set-state-in-effect` (requires pattern change)
