# Fix Vercel Webhook - Step by Step

## Problem
Webhook stopped auto-deploying. Commits `2fe5ec4`, `680141e`, and `a04db42` didn't trigger automatic deployments.

## Solution: Reconnect GitHub Integration

### Method 1: Reconnect in Vercel (Recommended)

1. **Go to Vercel Project Settings**:
   - Navigate to: https://vercel.com/teddys-projects-e26c2361/bestball-site/settings/git

2. **Disconnect GitHub Integration**:
   - Find the "Connected Git Repository" section
   - Click the "Disconnect" button next to `ErinHernandez/TopDog`
   - Confirm the disconnection if prompted

3. **Reconnect GitHub Integration**:
   - Click "Connect Git Repository" or "Add Git Repository"
   - Select GitHub
   - Choose repository: `ErinHernandez/TopDog`
   - Select branch: `main`
   - Authorize if prompted
   - Click "Connect" or "Save"

4. **Verify**:
   - You should see "Connected Git Repository: ErinHernandez/TopDog"
   - The webhook should now be refreshed

### Method 2: Check GitHub Webhook Directly

1. **Go to GitHub Webhooks**:
   - Navigate to: https://github.com/ErinHernandez/TopDog/settings/hooks

2. **Find Vercel Webhook**:
   - Look for a webhook with URL containing `vercel.com` or `vercel.app`
   - Check its status (should be "Active")

3. **Check Recent Deliveries**:
   - Click on the webhook
   - Go to "Recent Deliveries" tab
   - Look for recent push events
   - Check if any failed (red X) or succeeded (green checkmark)

4. **If Webhook is Broken**:
   - Click "Redeliver" on a recent event to test
   - Or delete and let Vercel recreate it when you reconnect

### Method 3: Test After Reconnection

After reconnecting, test the webhook:

1. **Make a small change**:
   ```bash
   echo "# Test" >> README.md
   git add README.md
   git commit -m "test: verify webhook auto-deployment"
   git push origin main
   ```

2. **Check Vercel**:
   - Go to: https://vercel.com/teddys-projects-e26c2361/bestball-site/deployments
   - Within 1-2 minutes, a new deployment should appear automatically
   - It should show "Automatically created for push to ErinHernandez/TopDog"

3. **If it works**:
   - ✅ Webhook is fixed!
   - Delete the test commit if you want

4. **If it doesn't work**:
   - Check Vercel project settings for deployment protection rules
   - Verify the production branch is set to `main`
   - Check GitHub webhook deliveries for errors

## Why This Happens

Webhooks can stop working due to:
- GitHub webhook secret expiration
- Vercel integration token expiration
- Network issues between GitHub and Vercel
- Webhook configuration changes
- Rate limiting

Reconnecting refreshes all these connections.

## Prevention

- Periodically check webhook status in GitHub
- Monitor Vercel deployments to ensure auto-deployments are working
- Set up alerts if deployments fail
