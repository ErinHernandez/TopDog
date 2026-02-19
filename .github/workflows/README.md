# GitHub Actions Workflows

CI/CD pipeline for Idesaign. Four workflows handle validation, preview, production deployment, and security.

## Workflow Overview

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push to main, PR to main | Parallel type-check, tests, build, E2E, audit |
| `preview.yml` | PR opened/updated | Vercel preview deploy with PR comment |
| `deploy.yml` | Push to main | Production deploy to Vercel |
| `security.yml` | Weekly + dependency changes | Vulnerability audit, license compliance |

## ci.yml -- Continuous Integration

**Trigger**: Every push to main and every PR targeting main.

**Concurrency**: Stale PR runs are automatically canceled when new commits are pushed.

**Jobs** (parallel after install):

```
install ─┬─ typecheck  (tsc --noEmit)
         ├─ test       (vitest + coverage thresholds)
         ├─ build      (next build + Next.js cache)
         ├─ audit      (npm audit, fails on critical)
         └─ e2e        (playwright, depends on build)
              │
         ci-passed     (gate: all above must succeed)
```

**Coverage enforcement**: Unit test job fails if lines, statements, branches, or functions drop below 60%.

**Artifacts**:
- `coverage-report` (14 days) -- HTML + JSON coverage
- `playwright-report` (7 days, on failure) -- E2E test report
- `playwright-traces` (7 days, on failure) -- Trace viewer files

**Build cache**: Next.js incremental build cache is persisted between runs keyed by lockfile + source hash.

## preview.yml -- Preview Deploys

**Trigger**: PR opened, updated, or reopened.

**Concurrency**: Previous preview deploys for the same PR are canceled.

**Behavior**:
1. Builds a Vercel preview deployment
2. Posts (or updates) a comment on the PR with the preview URL
3. Updates the same comment on subsequent pushes (no comment spam)

## deploy.yml -- Production Deployment

**Trigger**: Push to main only.

**Environment**: `production` with protection rules. URL: `https://idesaign.ai`

**Steps**:
1. Install dependencies
2. Pull Vercel production environment
3. Build with Vercel CLI
4. Deploy with `--prebuilt --prod`

## security.yml -- Security Scanning

**Trigger**: Weekly (Monday 09:00 UTC), on dependency file changes, or manual dispatch.

**Jobs**:

1. **Dependency Audit**
   - Full `npm audit` with JSON output
   - Step summary with vulnerability counts by severity
   - Auto-creates a GitHub issue (label: `security`, `priority:high`) when critical vulnerabilities are found
   - Updates existing open issue instead of creating duplicates
   - Uploads full audit report as artifact (30 days)

2. **License Compliance**
   - Checks production dependencies against allowlist
   - Allowed: MIT, ISC, BSD-2-Clause, BSD-3-Clause, Apache-2.0, 0BSD, CC0-1.0, Unlicense, CC-BY-4.0, BlueOak-1.0.0, Python-2.0
   - Non-blocking warning for non-standard licenses

## Required Secrets

| Secret | Source | Used By |
|--------|--------|---------|
| `VERCEL_TOKEN` | https://vercel.com/account/tokens | deploy, preview |
| `VERCEL_ORG_ID` | Vercel project settings | deploy, preview |
| `VERCEL_PROJECT_ID` | Vercel project settings | deploy, preview |

## Branch Protection (Recommended)

Configure in GitHub Settings > Branches > Branch protection rules for `main`:

- Require status checks: `CI Passed`
- Require PR reviews: 1 reviewer minimum
- Require conversation resolution
- Require branches to be up to date
- Include administrators

## Status Badges

```markdown
[![CI](https://github.com/your-org/idesaign/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/idesaign/actions/workflows/ci.yml)
[![Deploy](https://github.com/your-org/idesaign/actions/workflows/deploy.yml/badge.svg)](https://github.com/your-org/idesaign/actions/workflows/deploy.yml)
[![Security](https://github.com/your-org/idesaign/actions/workflows/security.yml/badge.svg)](https://github.com/your-org/idesaign/actions/workflows/security.yml)
```
