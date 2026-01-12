# Tier 1.2: Basic CI/CD Setup Guide

## Overview

This guide sets up a basic CI/CD pipeline using GitHub Actions. The pipeline runs tests and builds on every push/PR to catch issues before they reach production.

**Time Estimate:** 4 hours  
**Priority:** Tier 1 (Critical)

---

## What This Pipeline Does

1. **Runs tests** - Catches broken functionality
2. **Runs linter** - Catches code quality issues
3. **Builds application** - Catches build errors
4. **Security scan** - Checks for vulnerable dependencies and secrets

---

## Step 1: Verify Workflow File

The workflow file has been created at:
- ✅ `.github/workflows/ci.yml`

**Important:** GitHub Actions doesn't need to be downloaded or installed. It's a cloud service that runs automatically when you push code to GitHub. Just commit this file and push it.

---

## Step 2: Add Required Secrets (Optional)

For a complete build, add these secrets to GitHub:

1. Go to your repository on GitHub
2. Settings > Secrets and variables > Actions
3. Add these secrets (if you want full build validation):
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

**Note:** The pipeline will work without these (using placeholders), but the build won't fully validate Firebase integration.

---

## Step 3: Test the Pipeline

1. **Push to a branch:**
   ```bash
   git checkout -b test-ci
   git add .github/workflows/ci.yml
   git commit -m "Add CI pipeline"
   git push origin test-ci
   ```

2. **Create a PR:**
   - Go to GitHub
   - Create pull request from `test-ci` to `main`
   - The CI pipeline will run automatically

3. **Check results:**
   - Go to the PR page
   - Click "Checks" tab
   - You should see "CI" workflow running

---

## Step 4: Set Up Branch Protection (Recommended)

Protect your main branch to require passing CI:

1. Go to GitHub repository > Settings > Branches
2. Add rule for `main` branch:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Select "test" and "security" jobs
   - ✅ Require branches to be up to date

This prevents merging broken code to main.

---

## What Gets Checked

### Test Job
- ✅ All tests pass (`npm test`)
- ✅ Application builds (`npm run build`)
- ⚠️ Linter runs (warnings don't fail the build)

### Security Job
- ✅ Dependency vulnerabilities (`npm audit`)
- ✅ Secrets in code (TruffleHog scan)

---

## Customization

### Add More Checks

Edit `.github/workflows/ci.yml` to add:

```yaml
- name: Type check
  run: npx tsc --noEmit

- name: Test coverage
  run: npm run test:coverage
```

### Run on More Events

```yaml
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
```

### Add Deployment

```yaml
deploy:
  needs: test
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'
  steps:
    - name: Deploy to Vercel
      # Your deployment steps
```

---

## Troubleshooting

### Pipeline not running

1. Check `.github/workflows/ci.yml` is in the repository
2. Check file is valid YAML (no syntax errors)
3. Verify you pushed to `main` or `develop` branch

### Tests failing

1. Check test output in GitHub Actions logs
2. Run tests locally: `npm test`
3. Fix failing tests before merging

### Build failing

1. Check build output in GitHub Actions logs
2. Run build locally: `npm run build`
3. Common issues:
   - Missing environment variables
   - TypeScript errors
   - Import errors

### Security scan finding issues

1. Review `npm audit` output
2. Update vulnerable packages: `npm audit fix`
3. For secrets: Remove them from code, rotate them

---

## Success Criteria

✅ Pipeline runs on every push/PR  
✅ Tests must pass before merging (if branch protection enabled)  
✅ Build succeeds  
✅ Security scan runs  

**You're done when:** Every PR shows a green checkmark from CI before merging.

---

## Next Steps

After CI/CD is set up:

1. ✅ **Fix any failing tests** - Get to green
2. ✅ **Enable branch protection** - Require CI to pass
3. ✅ **Monitor pipeline** - Check it runs on every PR
4. ✅ **Add more checks** - Type checking, coverage, etc.

---

## Cost

GitHub Actions is **free** for:
- 2,000 minutes/month for private repos
- Unlimited for public repos

This pipeline uses ~5-10 minutes per run, so you can run ~200-400 builds/month for free.

---

**Next Tier 1 Item:** Replace console.log with structured logging
