# ESLint Best Practices Research - 2025

**Date:** January 27, 2026  
**Research Scope:** ESLint configuration, console rules, React hooks, CI/CD integration, structured logging  
**Sources:** Official ESLint docs, React docs, industry best practices, Next.js documentation

---

## Executive Summary

This document synthesizes current best practices (2025) for ESLint configuration in large TypeScript/React/Next.js codebases. Key findings emphasize:

1. **Rule Severity Strategy:** Use `"error"` or `"off"` - avoid `"warn"` for long-term enforcement
2. **Console Management:** File-pattern-based rules with structured logging migration
3. **React Hooks:** Critical rules as errors, optimization rules as warnings (temporary)
4. **CI/CD Integration:** Block on errors, track warnings with thresholds
5. **Gradual Migration:** Incremental rule introduction with defined timelines

---

## 1. ESLint Rule Severity Strategy

### 1.1 The Warning Problem

**Industry Consensus:** Warnings are problematic for long-term code quality.[3][4]

**Key Issues:**
- Warnings accumulate and become "background noise"
- Developers ignore warnings as they multiply
- GitHub PR visualization doesn't effectively show warnings
- No enforcement mechanism - warnings don't block merges
- Reduces accountability for code quality

**Expert Recommendation:**
> "Don't bother with warn, or it might be too late" - Industry consensus[3]

### 1.2 Best Practice Strategy

**Recommended Approach:**
- **Use `"error"` for rules you want enforced**
- **Use `"off"` for rules you don't want**
- **Avoid `"warn"` except as temporary transition phase**

**When Warnings Are Acceptable:**
1. **Temporary Migration Period:** Use warnings during transition with defined timeline (e.g., 3 months)
2. **Optimization Hints:** React Compiler optimization rules that don't break functionality
3. **Non-Critical Style Rules:** Formatting/preference rules that don't affect correctness

**Transition Strategy:**
```javascript
// Phase 1: Introduce as warning (temporary)
"new-rule": "warn", // Document: Convert to error by [date]

// Phase 2: Convert to error after team adapts
"new-rule": "error", // After 3-month transition
```

### 1.3 Current Codebase Assessment

**Current State:**
- All React hooks rules set to `"warn"`
- Console rule set to `"off"`
- 363 warnings total

**Recommendation:**
1. **Immediate:** Set critical rules to `"error"`:
   - `react-hooks/rules-of-hooks` → `"error"` (can cause runtime errors)
   - `react-hooks/exhaustive-deps` → `"error"` (common bugs)

2. **Short-term (3 months):** Convert remaining hooks rules to errors after fixes

3. **Long-term:** Eliminate warning-based rules except optimization hints

---

## 2. Console Statement Management

### 2.1 Official ESLint Guidance

**From ESLint Documentation:**
- `no-console` rule disallows console methods in browser JavaScript
- Designed for production code - console is for debugging
- **Node.js exception:** Console is primary output method in Node.js, rule may not be appropriate

**Configuration Options:**
```javascript
// Allow specific console methods
{ "no-console": ["error", { allow: ["warn", "error"] }] }
```

### 2.2 Best Practices for Large Codebases

**File-Pattern-Based Configuration:**

```javascript
// Production code - strict
{
  files: ["src/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
  rules: {
    "no-console": ["error", { allow: ["warn", "error", "info"] }],
  },
}

// Development/Testing files - relaxed
{
  files: [
    "**/*.test.{ts,tsx}",
    "**/*.spec.{ts,tsx}",
    "pages/testing-grounds/**/*",
    "sandbox/**/*",
    "pages/dev/**/*",
  ],
  rules: {
    "no-console": "off",
  },
}

// API routes - allow server-side logging
{
  files: ["pages/api/**/*.ts", "lib/**/*.ts"],
  rules: {
    "no-console": ["warn", { allow: ["warn", "error", "info"] }],
  },
}
```

### 2.3 Structured Logging Migration

**Why Migrate from console.log:**
1. **Unstructured Output:** Difficult to parse and analyze at scale
2. **Performance Overhead:** Excessive logging slows applications
3. **Security Risks:** Sensitive data may be exposed
4. **No Log Levels:** All logs treated equally
5. **No Centralized Management:** Can't aggregate across services

**Structured Logging Benefits:**
- Machine-readable JSON format
- Consistent fields (timestamp, level, message, context)
- Automated analysis with ELK, Datadog, Splunk, Sentry
- Better debugging with field-based filtering
- Enhanced monitoring and alerting
- Compliance and audit trails

**Recommended Libraries (TypeScript/React):**
- **Winston:** Flexible, multiple formats and transports
- **Pino:** Extremely fast, lightweight, performance-focused
- **Bunyan:** JSON-focused logs and streams

**Migration Strategy:**
1. **Phase 1:** Implement structured logger (already done: `lib/structuredLogger.ts`)
2. **Phase 2:** Enable console rule with file-pattern exceptions
3. **Phase 3:** Migrate production code paths (80% target)
4. **Phase 4:** Strict console rule for production, allow in dev/test

### 2.4 Current Codebase Recommendation

**Current State:**
- 3,252 console statements across 266 files
- Console rule completely disabled
- Structured logger already implemented

**Recommended Configuration:**

```javascript
{
  rules: {
    // Default: Allow error tracking, warn on debug logs
    "no-console": ["warn", { allow: ["warn", "error", "info"] }],
  },
  // Override for development/testing
  {
    files: [
      "pages/testing-grounds/**/*",
      "pages/dev/**/*",
      "pages/test-*.tsx",
      "sandbox/**/*",
    ],
    rules: {
      "no-console": "off",
    },
  },
  // Override for API routes (server-side logging acceptable)
  {
    files: ["pages/api/**/*.ts", "lib/**/*.ts"],
    rules: {
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    },
  },
}
```

**Benefits:**
- Allows legitimate console usage in dev/test
- Warns on console.log in production (gradual migration)
- Allows console.error/warn everywhere (error tracking)
- Doesn't block CI/CD (warnings only)
- Encourages migration to structured logger

---

## 3. React Hooks ESLint Rules

### 3.1 Official React Documentation

**Recommended Preset:**
React provides `recommended` preset that includes:
- `exhaustive-deps` - Validates dependency arrays
- `rules-of-hooks` - Validates Rules of Hooks compliance
- Plus React Compiler diagnostics (when enabled)

**Rule Categories:**

**Critical Rules (Should be Errors):**
- `rules-of-hooks` - Can cause runtime errors if violated
- `exhaustive-deps` - Common source of bugs (stale closures)

**Performance Rules (Can be Warnings Temporarily):**
- `set-state-in-effect` - Performance concern, not correctness
- `immutability` - Can cause bugs but less critical than rules-of-hooks

**Optimization Rules (Warnings OK):**
- `preserve-manual-memoization` - React Compiler optimization hint
- `static-components` - React Compiler optimization hint
- `error-boundaries` - Best practice, not breaking
- `purity` - Best practice, not breaking

### 3.2 exhaustive-deps Best Practices

**Core Principle:**
All values referenced inside `useEffect`, `useMemo`, or `useCallback` must be in the dependency array. Missing dependencies cause stale closures with outdated values.

**Common Solutions:**

1. **Include All Dependencies:**
   ```typescript
   useEffect(() => {
     loadData(userId, filter); // Include both in deps
   }, [userId, filter, loadData]);
   ```

2. **Stabilize Function Dependencies:**
   ```typescript
   const loadData = useCallback(() => {
     // ...
   }, [userId, filter]);
   
   useEffect(() => {
     loadData();
   }, [loadData]);
   ```

3. **Move Logic Into Effect:**
   ```typescript
   useEffect(() => {
     const loadData = async () => {
       // ...
     };
     loadData();
   }, [userId, filter]);
   ```

**Anti-Patterns to Avoid:**
- ❌ Omitting dependencies to control when effects run
- ❌ Using empty arrays `[]` when dependencies exist
- ❌ "Fighting the linter" - usually indicates code needs refactoring

### 3.3 set-state-in-effect Best Practices

**Problem:**
Synchronous `setState` calls in effects force unnecessary re-renders and degrade performance. React must re-render twice—once for state update, again after effects run.

**Better Approaches:**

1. **Calculate During Render:**
   ```typescript
   // ❌ Bad
   const [computed, setComputed] = useState();
   useEffect(() => {
     setComputed(expensiveCalculation(data));
   }, [data]);
   
   // ✅ Good
   const computed = useMemo(() => expensiveCalculation(data), [data]);
   ```

2. **Use Initial State:**
   ```typescript
   // ❌ Bad
   const [mounted, setMounted] = useState(false);
   useEffect(() => {
     setMounted(true);
   }, []);
   
   // ✅ Good
   const [mounted, setMounted] = useState(true);
   ```

3. **Use Refs for Mount Tracking:**
   ```typescript
   // ✅ Good
   const isMountedRef = useRef(true);
   useEffect(() => {
     return () => { isMountedRef.current = false; };
   }, []);
   ```

**Acceptable Use Cases:**
- Layout measurements from DOM refs
- Synchronizing with external systems
- Subscriptions that require state updates

### 3.4 Current Codebase Recommendation

**Current State:**
- All React hooks rules set to `"warn"`
- 188 React hooks warnings
- Most common: `set-state-in-effect`, `exhaustive-deps`, `rules-of-hooks`

**Recommended Configuration:**

```javascript
{
  rules: {
    // Critical rules as errors
    "react-hooks/rules-of-hooks": "error", // Can cause runtime errors
    "react-hooks/exhaustive-deps": "error", // Common bugs
    
    // Performance rules - warnings during transition (3 months)
    "react-hooks/set-state-in-effect": "warn", // TODO: Convert to error by [date]
    "react-hooks/immutability": "warn", // TODO: Convert to error by [date]
    "react-hooks/refs": "warn", // TODO: Convert to error by [date]
    
    // Optimization rules - warnings OK (React Compiler hints)
    "react-hooks/preserve-manual-memoization": "warn",
    "react-hooks/static-components": "warn",
    "react-hooks/error-boundaries": "warn",
    "react-hooks/purity": "warn",
  },
}
```

**Migration Timeline:**
1. **Immediate:** Set critical rules to errors
2. **Month 1-2:** Fix critical rule violations
3. **Month 3:** Convert performance rules to errors
4. **Ongoing:** Keep optimization rules as warnings

---

## 4. ESLint Configuration for Large Codebases

### 4.1 Flat Config (ESLint v9+)

**Current Standard:**
- ESLint v9+ uses flat config format (`eslint.config.mjs`)
- Legacy `.eslintrc.*` files deprecated, will be removed in v10.0.0
- Better module system support, more explicit configuration

**Next.js 16 Changes:**
- `next lint` command removed
- `next build` no longer runs linting automatically
- Must use ESLint directly via npm scripts
- Flat config is default for `@next/eslint-plugin-next`

**Migration Tool:**
```bash
npx @eslint/migrate-config .eslintrc.json
```

### 4.2 Gradual Migration Strategy

**Best Practice for Large Teams:**
Introduce ESLint rules incrementally rather than all at once to reduce friction and help developers adapt.

**Phased Approach:**

1. **Phase 1: Foundation**
   - Set up flat config
   - Enable recommended presets
   - Configure ignores

2. **Phase 2: Critical Rules**
   - Enable critical correctness rules as errors
   - Fix violations
   - Document patterns

3. **Phase 3: Performance Rules**
   - Enable performance rules as warnings
   - Fix over 3-month period
   - Convert to errors

4. **Phase 4: Style/Quality Rules**
   - Enable style rules
   - Use auto-fix where possible
   - Enforce in CI/CD

### 4.3 File-Specific Configuration

**Best Practice:**
Use file patterns to apply different rules to different code areas:

```javascript
// Base configuration
{
  rules: {
    "no-console": "error",
    "react-hooks/exhaustive-deps": "error",
  },
}

// Override for specific file patterns
{
  files: ["**/*.test.{ts,tsx}"],
  rules: {
    "no-console": "off", // Allow in tests
  },
}
```

**Current Codebase:**
Already using file-specific overrides for API routes. Consider expanding to:
- Development/testing files
- Scripts (already ignored)
- Different severity for different rule categories

---

## 5. CI/CD Integration Best Practices

### 5.1 Error vs Warning Handling

**Default Behavior:**
- ESLint exits with non-zero code on **errors** → fails CI/CD
- ESLint exits with zero code on **warnings** → passes CI/CD

**Blocking on Warnings:**
```bash
# Make warnings block pipeline
eslint . --max-warnings=0
```

**Recommended Strategy:**
1. **Block on Errors:** Critical rules as errors block merges
2. **Track Warnings:** Monitor warning count, set thresholds
3. **Quality Gates:** Combine with other metrics (test coverage, complexity)

### 5.2 Quality Gate Implementation

**Comprehensive Quality Gates Should Include:**
- ESLint checks (errors block, warnings tracked)
- Test coverage thresholds (e.g., 80%)
- Cyclomatic complexity limits
- Security vulnerability scanning
- Dependency audits

**Example CI/CD Integration:**

```yaml
# GitHub Actions example
- name: Lint
  run: npm run lint

- name: Lint (strict - block on warnings)
  run: npm run lint -- --max-warnings=0
  # Only enable after warning count is manageable
```

**Current Codebase Recommendation:**
1. **Current:** All warnings, CI passes
2. **Phase 1:** Set critical rules to errors, CI blocks on those
3. **Phase 2:** Add warning threshold (e.g., fail if >500 warnings)
4. **Phase 3:** Gradually reduce threshold as issues are fixed

### 5.3 Metrics and Tracking

**Track Over Time:**
- Total warning/error count
- Warning count by rule category
- Warning trends (increasing/decreasing)
- Fix velocity (warnings fixed per week)

**CI/CD Reporting:**
- Add warning count to CI reports
- Set improvement goals (e.g., reduce by 10% per month)
- Track progress in project management tools

---

## 6. Next.js Specific Best Practices

### 6.1 Next.js 16 ESLint Setup

**Key Changes:**
- Must use ESLint directly (not `next lint`)
- Flat config is standard
- `eslint-config-next` provides presets

**Recommended Setup:**

```javascript
// eslint.config.mjs
import { defineConfig } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

export default defineConfig([
  ...nextVitals, // Core Web Vitals rules as errors
  {
    rules: {
      // Your custom rules
    },
  },
])
```

**Available Presets:**
- `eslint-config-next` - Base with Next.js, React, React Hooks
- `eslint-config-next/core-web-vitals` - Recommended, upgrades CWV rules to errors
- `eslint-config-next/typescript` - Adds TypeScript-specific rules

### 6.2 Next.js Build Integration

**Update package.json:**
```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "build": "npm run lint && next build"
  }
}
```

**Current Codebase:**
Already has `lint` script. Consider:
- Adding `lint:fix` script
- Adding lint check to build process
- Pre-commit hooks for critical rules

---

## 7. Recommended Configuration for Current Codebase

### 7.1 Immediate Improvements

```javascript
// eslint.config.mjs
import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    settings: {
      "import/resolver": {
        node: { paths: ["."] },
      },
    },
    rules: {
      // Style rules
      "react/no-unescaped-entities": "warn",
      "@next/next/no-img-element": "warn",
      "import/no-anonymous-default-export": "warn",
      
      // Critical React Hooks rules - ERRORS
      "react-hooks/rules-of-hooks": "error", // Can cause runtime errors
      "react-hooks/exhaustive-deps": "error", // Common bugs
      
      // Performance React Hooks rules - WARNINGS (temporary, 3-month transition)
      "react-hooks/set-state-in-effect": "warn", // TODO: Convert to error by [date]
      "react-hooks/immutability": "warn", // TODO: Convert to error by [date]
      "react-hooks/refs": "warn", // TODO: Convert to error by [date]
      
      // Optimization React Hooks rules - WARNINGS (React Compiler hints)
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/error-boundaries": "warn",
      "react-hooks/purity": "warn",
      
      // Console rule - smart configuration
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    },
  },
  // Development/Testing files - allow console
  {
    files: [
      "pages/testing-grounds/**/*",
      "pages/dev/**/*",
      "pages/test-*.tsx",
      "sandbox/**/*",
    ],
    rules: {
      "no-console": "off",
    },
  },
  // API routes - allow server-side logging
  {
    files: ["pages/api/**/*.ts", "lib/**/*.ts"],
    rules: {
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "coverage/**",
      "functions/**",
      "scripts/**", // Already has legitimate console usage
      "dev/**",
      "__tests__/**",
    ],
  },
];

export default eslintConfig;
```

### 7.2 Migration Timeline

**Week 1:**
- Implement smart console rule
- Set critical React hooks rules to errors
- Fix critical rule violations

**Month 1-2:**
- Fix remaining critical rule violations
- Document common patterns
- Share fix guide with team

**Month 3:**
- Convert performance rules to errors
- Reduce warning count by 50%
- Set CI warning threshold

**Month 4-6:**
- Continue fixing warnings
- Migrate console.log to structured logger (80% target)
- Full enforcement of all critical rules

---

## 8. Key Takeaways

### 8.1 Rule Severity
- ✅ Use `"error"` for enforcement
- ✅ Use `"off"` to disable
- ⚠️ Use `"warn"` only as temporary transition with defined timeline

### 8.2 Console Management
- ✅ File-pattern-based rules (dev/test vs production)
- ✅ Allow error tracking (console.error/warn/info)
- ✅ Migrate to structured logging for production

### 8.3 React Hooks
- ✅ Critical rules (`rules-of-hooks`, `exhaustive-deps`) as errors
- ⚠️ Performance rules as warnings during transition
- ℹ️ Optimization rules as warnings (React Compiler hints)

### 8.4 CI/CD Integration
- ✅ Block on errors
- ✅ Track warnings with thresholds
- ✅ Combine with other quality metrics

### 8.5 Gradual Migration
- ✅ Incremental rule introduction
- ✅ Defined timelines for transitions
- ✅ Document patterns and fixes

---

## 9. References

1. **ESLint Official Documentation:**
   - [no-console rule](https://eslint.org/docs/latest/rules/no-console)
   - [Configuration Files](https://eslint.org/docs/latest/use/configure/configuration-files)
   - [Flat Config Migration](https://eslint.org/docs/latest/use/configure/migration-guide)

2. **React Official Documentation:**
   - [eslint-plugin-react-hooks](https://react.dev/reference/eslint-plugin-react-hooks)
   - [exhaustive-deps](https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps)
   - [set-state-in-effect](https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect)

3. **Next.js Documentation:**
   - [ESLint Configuration](https://nextjs.org/docs/app/building-your-application/configuring/eslint)
   - [eslint-config-next](https://www.npmjs.com/package/eslint-config-next)

4. **Industry Best Practices:**
   - "Don't bother with warn, or it might be too late" - Medium article on ESLint warnings
   - Structured logging best practices
   - CI/CD quality gate strategies

5. **Research Sources:**
   - Stack Overflow discussions on ESLint best practices
   - GitHub ESLint discussions on rule severity
   - Industry blog posts on large codebase ESLint strategies

---

## 10. Action Items for Current Codebase

### Immediate (This Week)
- [ ] Implement smart console rule configuration
- [ ] Set `react-hooks/rules-of-hooks` to `"error"`
- [ ] Set `react-hooks/exhaustive-deps` to `"error"`
- [ ] Fix critical rule violations (estimate: 2-4 hours)

### Short-Term (This Month)
- [ ] Document React hooks fix patterns
- [ ] Share fix guide with team
- [ ] Track warning count weekly
- [ ] Set CI warning threshold

### Medium-Term (3 Months)
- [ ] Convert performance rules to errors
- [ ] Reduce warning count by 50%
- [ ] Migrate 50% of production console.log to structured logger
- [ ] Update documentation with lessons learned

### Long-Term (6 Months)
- [ ] Full enforcement of all critical rules
- [ ] 80% console.log migration to structured logger
- [ ] Warning count < 200
- [ ] Pre-commit hooks for critical rules

---

**Document Status:** Complete  
**Last Updated:** January 27, 2026  
**Next Review:** After 3-month migration period
