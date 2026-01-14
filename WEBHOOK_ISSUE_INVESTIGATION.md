# Webhook Auto-Deployment Issue Investigation

## Problem
- **Before**: Auto-deployments were working (we saw `d54751a` auto-deploy)
- **Now**: Auto-deployments stopped working (commits `2fe5ec4` and `680141e` didn't auto-deploy)
- **User Action**: Had to manually trigger deployments

## Possible Causes

### 1. Deployment Protection Rules
- Check: Vercel Project Settings → Deployment Protection
- If enabled, might be blocking auto-deployments
- Solution: Temporarily disable or adjust rules

### 2. Webhook Failure
- Check: GitHub repository → Settings → Webhooks
- Look for Vercel webhook
- Check recent deliveries for failures
- Solution: Reconnect webhook or redeliver failed events

### 3. Vercel SHA Deduplication
- Vercel text says: "If the SHA was deployed before, no new Build will be issued"
- But we're pushing NEW commits with NEW SHAs, so this shouldn't apply
- However, if there's a caching issue, it might think the SHA was already deployed

### 4. Rate Limiting
- Too many deployments in a short time
- Vercel might throttle webhook-triggered deployments
- Solution: Wait and see if it resumes, or check Vercel status

### 5. Branch Configuration
- Check: Vercel Project Settings → Git → Production Branch
- Ensure it's set to `main`
- Check if there are branch-specific deployment rules

## Investigation Steps

1. **Check Deployment Protection**:
   - Go to: Settings → Deployment Protection
   - Look for rules that might block auto-deployments

2. **Check GitHub Webhook**:
   - Go to: https://github.com/ErinHernandez/TopDog/settings/hooks
   - Find Vercel webhook
   - Check recent deliveries
   - Look for failed requests

3. **Check Vercel Git Settings**:
   - Verify repository is still connected
   - Check for any error messages
   - Look for "Reconnect" button (might indicate connection issue)

4. **Check Recent Deployments**:
   - Look at deployment timestamps
   - See if there's a pattern (e.g., only manual deployments work)

## Immediate Actions

1. **Reconnect GitHub Integration**:
   - Vercel Settings → Git → Disconnect
   - Then reconnect
   - This refreshes the webhook

2. **Check Webhook in GitHub**:
   - Verify webhook is active
   - Check recent deliveries
   - Redeliver if needed

3. **Test with Next Push**:
   - Make a small change
   - Push to main
   - See if it auto-deploys

## Why This Matters

If auto-deployments stopped working, it means:
- Every fix requires manual intervention
- Slower development cycle
- Risk of forgetting to deploy
- Potential for deploying wrong commit

This needs to be fixed to restore normal workflow.
