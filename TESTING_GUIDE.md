# Testing Guide
**How to test the new Enterprise Implementation features**

---

## 🧪 Testing the New API Route

### Test User Contact Update API

#### Manual Test (Browser Console)
```javascript
// 1. Get your Firebase auth token
const auth = firebase.auth();
const user = auth.currentUser;
const token = await user.getIdToken();

// 2. Test the API
const response = await fetch('/api/user/update-contact', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    userId: user.uid,
    email: 'newemail@example.com',
  }),
});

const data = await response.json();
console.log(data);
```

#### Automated Test
```bash
# Run the test suite
npm test -- update-contact

# Or run all API tests
npm test -- pages/api
```

---

## 🔍 Testing Audit Scripts

### Environment Variable Audit
```bash
npm run audit:env
# Check output for:
# - Potential leaks (should be 0 or all in API routes)
# - Generated .env.example file
```

### TODO Triage
```bash
npm run audit:todos
# Check:
# - TODO_TRIAGE_REPORT.md
# - todo-items.csv
# - P0-CRITICAL count (should be 0)
```

### Type Safety Audit
```bash
npm run audit:any-types
# Check:
# - any-types-report.json
# - Critical path count (should be 0)
```

### Security Audit
```bash
npm run security:audit
# Check for:
# - Critical/high vulnerabilities
# - Auto-fixable issues
```

---

## 📊 Testing Structured Logging

### Client-Side Logging
```typescript
import { logger } from '@/lib/logger';

// Test in browser console or component
logger.info('Test message', { component: 'TestComponent', userId: '123' });
logger.error('Test error', new Error('Test'), { component: 'TestComponent' });
```

**Expected:**
- Development: Console output with structured format
- Production: Batched POST to `/api/logs` (needs endpoint)

### Server-Side Logging
```typescript
import { serverLogger } from '@/lib/logger';

// Test in API route
serverLogger.info('Test message', { userId: '123', operation: 'test' });
serverLogger.error('Test error', error, { component: 'TestAPI' });
```

**Expected:**
- Development: Readable console output
- Production: JSON output for log aggregation

---

## 🚀 Testing CI/CD Workflows

### Test Locally with Act
```bash
# Install act (GitHub Actions local runner)
# macOS: brew install act
# Or see: https://github.com/nektos/act

# Test lint job
act -j lint

# Test test job
act -j test

# Test build job
act -j build
```

### Test with a PR
1. Create a test branch
2. Make a small change
3. Push and create PR
4. Check GitHub Actions tab
5. Verify all workflows run

---

## 📦 Testing Bundle Analysis

### Generate Bundle Analysis
```bash
# Install package first
npm install --save-dev @next/bundle-analyzer

# Generate analysis
npm run analyze
# Opens browser with bundle visualization
```

### Track Bundle Size
```bash
# Build first
npm run build

# Track size
npm run bundle:track
# Creates bundle-stats.json
# Shows top 20 chunks
# Compares with previous build
```

---

## ✅ Testing Checklist

### Before Committing
- [ ] Run `npm run audit:env` - No leaks
- [ ] Run `npm run audit:any-types` - No critical issues
- [ ] Run `npm run lint:fix` - No lint errors
- [ ] Run `npm run type-check` - No type errors

### Before Deploying
- [ ] Run `npm run security:audit` - No critical/high vulnerabilities
- [ ] Run `npm run test:tier0` - Critical path tests pass
- [ ] Run `npm run build` - Build succeeds
- [ ] Run `npm run bundle:track` - Bundle size acceptable

### Weekly
- [ ] Run `npm run audit:todos` - Review technical debt
- [ ] Review CI/CD workflow runs
- [ ] Check bundle size trends
- [ ] Review test coverage

---

## 🐛 Common Issues & Solutions

### Audit Scripts Failing
**Issue:** Scripts can't find files or timeout

**Solution:**
```bash
# Make sure you're in project root
cd /path/to/bestball-site

# Check script permissions
chmod +x scripts/security-audit.sh

# Run with more memory if needed
node --max-old-space-size=4096 scripts/audit-env-vars.js
```

### Tests Failing
**Issue:** Mock errors or missing dependencies

**Solution:**
```bash
# Clear Jest cache
npm test -- --clearCache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Run with verbose output
npm test -- --verbose
```

### Bundle Analyzer Not Working
**Issue:** Package not installed or build fails

**Solution:**
```bash
# Install package
npm install --save-dev @next/bundle-analyzer

# Check next.config.js has bundle analyzer
grep -A 2 "withBundleAnalyzer" next.config.js

# Run with ANALYZE flag
ANALYZE=true npm run build
```

---

## 📝 Test Results Template

Create a test results file:

```markdown
# Test Results - [Date]

## API Tests
- [ ] User contact update API
- [ ] Authentication works
- [ ] Validation works
- [ ] Error handling works

## Audit Scripts
- [ ] Environment variable audit
- [ ] TODO triage
- [ ] Type safety audit
- [ ] Security audit

## Logging
- [ ] Client logger
- [ ] Server logger
- [ ] Sentry integration

## CI/CD
- [ ] Lint job
- [ ] Test job
- [ ] Build job
- [ ] Deploy job

## Bundle Analysis
- [ ] Bundle analyzer works
- [ ] Size tracking works
- [ ] Reports generated
```

---

**Status:** Ready for testing! 🧪
