# Production Deployment Steps - Draft Room Refactoring

**Date:** January 2025  
**Status:** Ready for Production Deployment ✅

---

## 🚀 Production Deployment Steps

### Step 1: Add Environment Variable in Vercel

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your project

2. **Navigate to Settings:**
   - Click on your project
   - Go to **Settings** tab
   - Click on **Environment Variables** in the left sidebar

3. **Add New Environment Variable:**
   - Click **Add New** button
   - Enter the following:
     - **Key:** `NEXT_PUBLIC_USE_NEW_DRAFT_ROOM`
     - **Value:** `true`
     - **Environment:** Select all three:
       - ✅ Production
       - ✅ Preview
       - ✅ Development
   - Click **Save**

---

### Step 2: Redeploy Application

After adding the environment variable, redeploy your application:

**Option A: Via Vercel Dashboard**
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **three dots (⋯)** menu
4. Select **Redeploy**
5. Confirm redeployment

**Option B: Via Git Push**
```bash
# Make a small change (or use an empty commit)
git commit --allow-empty -m "Enable refactored draft room feature flag"
git push
```

**Option C: Via Vercel CLI**
```bash
vercel --prod
```

---

### Step 3: Verify Deployment

After redeployment:

1. **Check Deployment Status:**
   - Go to Deployments tab
   - Verify deployment is successful (green checkmark)

2. **Test Production:**
   - Visit a draft room URL in production
   - Example: `https://yourdomain.com/draft/topdog/[roomId]`
   - The new refactored implementation should be active

3. **Monitor:**
   - Check error logs in Vercel dashboard
   - Monitor Sentry (if configured)
   - Watch for any user-reported issues

---

## 🔒 Safety Features

### Instant Rollback Available

If issues are discovered, you can instantly rollback:

**Option 1: Disable via Environment Variable (Recommended)**
1. Go to Vercel → Settings → Environment Variables
2. Edit `NEXT_PUBLIC_USE_NEW_DRAFT_ROOM`
3. Change value to `false` or delete the variable
4. Redeploy

**Option 2: Redeploy Previous Version**
1. Go to Deployments tab
2. Find previous deployment (before feature flag)
3. Click three dots (⋯) menu
4. Select **Promote to Production**

**Option 3: Code Rollback (If needed)**
- Revert the code change
- Push to trigger new deployment

---

## 📊 Monitoring Checklist

After deployment, monitor:

- [ ] **Error Logs** - Check Vercel logs for errors
- [ ] **Sentry** - Monitor error tracking (if configured)
- [ ] **User Feedback** - Watch for user reports
- [ ] **Performance** - Monitor page load times
- [ ] **Feature Usage** - Track adoption metrics

---

## 🔄 Gradual Rollout (Alternative)

If you prefer gradual rollout instead of enabling for all users:

### Use Percentage-Based Rollout

Add this environment variable instead:
- **Key:** `NEXT_PUBLIC_NEW_DRAFT_ROOM_ROLLOUT`
- **Value:** `10` (for 10% of users)
- **Environment:** Production, Preview, Development

Gradually increase:
- Week 1: `10` (10% of users)
- Week 2: `25` (25% of users)
- Week 3: `50` (50% of users)
- Week 4: `75` (75% of users)
- Week 5: `100` or use `NEXT_PUBLIC_USE_NEW_DRAFT_ROOM=true` (all users)

---

## ✅ Quick Reference

### Environment Variable Settings

**For Immediate Enable (All Users):**
```
Key: NEXT_PUBLIC_USE_NEW_DRAFT_ROOM
Value: true
Environments: Production, Preview, Development
```

**For Gradual Rollout (Percentage-Based):**
```
Key: NEXT_PUBLIC_NEW_DRAFT_ROOM_ROLLOUT
Value: 10
Environments: Production, Preview, Development
```

### Vercel Dashboard Path
```
Dashboard → [Your Project] → Settings → Environment Variables
```

---

## 📝 Notes

- ✅ **Code is already deployed** - The refactored code is already in your codebase
- ✅ **Feature flag controls activation** - Environment variable enables it
- ✅ **Legacy code preserved** - Safe fallback always available
- ✅ **Error boundaries active** - Errors caught gracefully
- ✅ **Instant rollback** - Can disable immediately if needed

---

## 🎯 Next Steps After Deployment

1. ✅ **Deploy** - Complete the steps above
2. **Monitor** - Watch error logs for first 24 hours
3. **Test** - Test with real users
4. **Collect Feedback** - Gather user feedback
5. **Gradually Increase** - If stable, consider gradual rollout

---

**Status:** Ready for Production Deployment ✅

---

**Last Updated:** January 2025
