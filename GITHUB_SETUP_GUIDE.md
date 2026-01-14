# GitHub CI/CD Setup Guide
**Complete configuration instructions for Enterprise CI/CD**

---

## 🎯 Overview

Your CI/CD pipeline is ready! This guide walks you through the one-time setup needed to activate it.

**Time Required:** 15-20 minutes

---

## Step 1: Configure GitHub Secrets

### Required Secrets

Go to: **GitHub Repository → Settings → Secrets and variables → Actions**

Add these secrets:

#### Vercel Deployment Secrets
```
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_org_id_here
VERCEL_PROJECT_ID=your_project_id_here
```

**How to get Vercel credentials:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Go to Settings → Tokens
3. Create a new token → Copy token → Paste as `VERCEL_TOKEN`
4. Go to your project → Settings → General
5. Copy "Organization ID" → Paste as `VERCEL_ORG_ID`
6. Copy "Project ID" → Paste as `VERCEL_PROJECT_ID`

#### Optional Secrets
```
CODECOV_TOKEN=your_codecov_token_here  # Only if using Codecov
NEXT_PUBLIC_API_URL=https://your-api-url.com  # Optional, defaults to localhost
```

---

## Step 2: Create GitHub Teams

Go to: **GitHub Organization → Settings → Teams**

### Create `payment-team`
1. Click "New team"
2. Name: `payment-team`
3. Description: "Team for reviewing payment-related code changes"
4. Add team members who should review payment code

### Create `security-team`
1. Click "New team"
2. Name: `security-team`
3. Description: "Team for reviewing security and auth code changes"
4. Add team members who should review security code

**Note:** If you don't have GitHub Teams, the PR checks workflow will skip the reviewer assignment steps (this is fine).

---

## Step 3: Test the CI/CD Pipeline

### Test 1: Create a Test PR
1. Create a new branch: `git checkout -b test-ci-cd`
2. Make a small change (e.g., update a comment)
3. Commit and push: `git push origin test-ci-cd`
4. Create a PR to `main`
5. Check GitHub Actions tab - you should see workflows running

### Test 2: Verify Workflows
You should see these workflows:
- ✅ **Enterprise CI** - Main pipeline (lint, test, build, deploy)
- ✅ **PR Checks** - PR validation and reviewer assignment
- ✅ **Bundle Size Check** - Bundle size monitoring

### Expected Results
- ✅ All jobs should pass (green checkmarks)
- ✅ PR should get automatic reviewers if payment/security files changed
- ✅ Preview deployment should be created (if Vercel configured)

---

## Step 4: Configure Branch Protection (Recommended)

Go to: **Settings → Branches → Add rule**

### Protect `main` Branch
1. Branch name pattern: `main`
2. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
     - Select: `lint`, `test`, `build`, `security`
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators

This ensures code can't be merged without passing CI checks.

---

## 📋 Workflow Details

### Enterprise CI Workflow (`.github/workflows/enterprise-ci.yml`)

**Runs on:**
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

**Jobs:**
1. **Lint & Type Check** - ESLint + TypeScript validation
2. **Security Audit** - npm audit + environment variable audit
3. **Unit Tests** - Jest with coverage
4. **Build** - Production build + bundle analysis
5. **E2E Tests** - Cypress (PR to main only)
6. **Deploy Preview** - Vercel preview (PR only)
7. **Deploy Production** - Vercel production (main branch only)

### PR Checks Workflow (`.github/workflows/pr-checks.yml`)

**Runs on:**
- Pull request opened/updated

**Features:**
- Semantic PR title validation
- Automatic reviewer assignment:
  - `payment-team` for payment-related changes
  - `security-team` for auth/security changes

### Bundle Size Check (`.github/workflows/bundle-size.yml`)

**Runs on:**
- Pull requests to `main`

**Features:**
- Tracks bundle size changes
- Fails if bundle exceeds 5MB limit
- Shows size diff in PR comments

---

## 🔧 Troubleshooting

### Workflows Not Running
1. **Check GitHub Actions is enabled:**
   - Settings → Actions → General
   - Ensure "Allow all actions and reusable workflows" is selected

2. **Check branch protection:**
   - Ensure workflows can run on your branch

### Vercel Deployment Failing
1. **Verify secrets are correct:**
   - Double-check `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
   - Tokens can expire - regenerate if needed

2. **Check Vercel project exists:**
   - Ensure project is linked to this repository

### Tests Failing
1. **Check test environment:**
   - Ensure all required environment variables are set
   - Check test files are in correct locations

2. **Review test logs:**
   - Click on failed job → View logs
   - Common issues: missing mocks, environment variables

### Bundle Size Check Failing
1. **Check bundle size:**
   - Run locally: `npm run build && npm run bundle:track`
   - Review `bundle-stats.json` for details

2. **Adjust limit if needed:**
   - Edit `.github/workflows/bundle-size.yml`
   - Change `MAX_SIZE=5242880` to your desired limit

---

## 📊 Monitoring CI/CD

### View Workflow Runs
- Go to **Actions** tab in GitHub
- See all workflow runs and their status
- Click on a run to see detailed logs

### Workflow Status Badge
Add to your README.md:
```markdown
![CI](https://github.com/your-org/your-repo/workflows/Enterprise%20CI/badge.svg)
```

### Notifications
- GitHub will email you on workflow failures (if configured)
- Configure in: Settings → Notifications → Actions

---

## 🎯 Next Steps

1. ✅ **Configure secrets** (15 min)
2. ✅ **Create teams** (5 min)
3. ✅ **Test with a PR** (5 min)
4. ✅ **Set up branch protection** (5 min)

**Total Time:** ~30 minutes

---

## ✨ Benefits

Once configured, you get:
- ✅ **Automated testing** on every push/PR
- ✅ **Security scanning** before deployment
- ✅ **Automatic deployments** to preview and production
- ✅ **Code quality gates** preventing bad code from merging
- ✅ **Bundle size monitoring** preventing bloat
- ✅ **Automatic reviewer assignment** for critical code

---

**Status:** Ready to configure! 🚀
