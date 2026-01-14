# GitHub Secrets Setup Template
**Copy this template to track your GitHub secrets configuration**

---

## Required Secrets

### Vercel Deployment
- [ ] `VERCEL_TOKEN` - Vercel API token
- [ ] `VERCEL_ORG_ID` - Vercel organization ID  
- [ ] `VERCEL_PROJECT_ID` - Vercel project ID

**How to get:**
1. Vercel Dashboard → Settings → Tokens → Create token
2. Vercel Dashboard → Project → Settings → General → Copy IDs

### Optional Secrets
- [ ] `CODECOV_TOKEN` - Codecov token (if using Codecov)
- [ ] `NEXT_PUBLIC_API_URL` - API URL (optional, defaults to localhost)
- [ ] `SLACK_WEBHOOK_URL` - Slack webhook for alerts (optional)

---

## Configuration Checklist

- [ ] All required secrets added
- [ ] Secrets configured for correct environments (Production/Preview)
- [ ] Tested with a PR to verify workflows run
- [ ] Verified deployments work correctly

---

## Security Notes

- ✅ Secrets are encrypted at rest
- ✅ Secrets are only available to workflows
- ✅ Secrets are not exposed in logs
- ✅ Use different tokens for different environments

---

**Status:** ⏳ Pending configuration
