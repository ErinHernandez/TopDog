# Quick Sync Guide - Test Infrastructure

## 🚀 Fast Track: Get Test Infrastructure in Cursor

### Step 1: Pull the Branch (2 minutes)

```bash
# In Cursor terminal:
git fetch origin
git checkout claude/testing-mk6a8hck70te9gz2-YYQSK
git pull origin claude/testing-mk6a8hck70te9gz2-YYQSK
```

### Step 2: Install & Verify (3 minutes)

```bash
npm install --save-dev jest-environment-jsdom
npm run test:coverage
```

### Step 3: Check Files Exist

```bash
ls TESTING.md                           # Comprehensive testing guide
ls __tests__/__mocks__/                 # Firebase & Stripe mocks
ls __tests__/factories/                 # Test data factories
ls __tests__/api/                       # API endpoint tests
ls __tests__/hooks/                     # Hook tests
ls __tests__/lib/                       # Library tests
ls cypress/e2e/payment-flow.cy.js       # E2E payment flow
```

✅ **Done!** You now have all test infrastructure.

---

## ⚠️ IMPORTANT: Don't Lose These Changes

### Always Start Here:

```bash
# Before making ANY new changes in Cursor:
git checkout claude/testing-mk6a8hck70te9gz2-YYQSK
git pull origin claude/testing-mk6a8hck70te9gz2-YYQSK
```

### When Creating New Features:

```bash
# Create new branch FROM test infrastructure branch:
git checkout claude/testing-mk6a8hck70te9gz2-YYQSK
git checkout -b my-new-feature

# Now your feature branch includes all tests
```

### When Merging to Main:

```bash
# Merge test infrastructure to main:
git checkout main
git merge claude/testing-mk6a8hck70te9gz2-YYQSK
git push origin main
```

---

## 📦 What You're Getting

**13 Files Added/Modified**:
- `TESTING.md` - Full testing guide
- `SYNC_GUIDE.md` - Detailed sync instructions (you're reading the quick version)
- Test mocks for Firebase & Stripe
- Test factories for mock data
- 6 new test files (API, hooks, libraries)
- 1 E2E test (complete payment flow)
- Updated Jest config with coverage
- New npm scripts (test:watch, test:coverage, test:ci)

**3,486 Lines of Code** covering:
- ✅ Payment processing tests
- ✅ Authentication tests
- ✅ Currency conversion tests
- ✅ Draft limits tests
- ✅ E2E payment flow

---

## 🔍 Quick Verification

```bash
# Should show the test infrastructure branch
git branch --show-current
# Output: claude/testing-mk6a8hck70te9gz2-YYQSK

# Should list 10 test files
npx jest --listTests | grep -c "\.test\."

# Should pass all tests
npm test

# Should generate coverage report
npm run test:coverage
open coverage/lcov-report/index.html
```

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Branch doesn't exist" | `git fetch origin` then retry |
| "Jest not found" | `npm install` |
| "jest-environment-jsdom not found" | `npm install --save-dev jest-environment-jsdom` |
| Files missing after pull | `git reset --hard origin/claude/testing-mk6a8hck70te9gz2-YYQSK` |
| Merge conflicts | `git stash` → pull → `git stash pop` |

---

## 📚 Full Details

See `SYNC_GUIDE.md` for:
- Complete file manifest
- Detailed change breakdown
- Full troubleshooting guide
- Workflow best practices

See `TESTING.md` for:
- How to write tests
- Using mocks and factories
- Coverage reports
- Best practices

---

## ✅ Checklist

- [ ] Pulled branch: `claude/testing-mk6a8hck70te9gz2-YYQSK`
- [ ] Verified files exist (TESTING.md, __tests__/, etc.)
- [ ] Installed jest-environment-jsdom
- [ ] Ran `npm test` successfully
- [ ] Generated coverage report
- [ ] Read TESTING.md
- [ ] Understand workflow (always start from this branch)

**You're ready!** 🎉

**Branch**: `claude/testing-mk6a8hck70te9gz2-YYQSK`
**Commit**: `1265748`
