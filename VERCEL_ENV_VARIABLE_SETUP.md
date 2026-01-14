# Vercel Environment Variable Setup - Draft Room Feature Flag

**Date:** January 2025  
**Quick Setup Guide**

---

## 🎯 Quick Steps

### 1. Go to Vercel Dashboard
Visit: https://vercel.com/dashboard

### 2. Select Your Project
Click on your project name

### 3. Navigate to Environment Variables
- Click **Settings** tab (top navigation)
- Click **Environment Variables** (left sidebar)

### 4. Add Environment Variable
Click **Add New** button, then enter:

```
Key: NEXT_PUBLIC_USE_NEW_DRAFT_ROOM
Value: true
Environment: ☑️ Production ☑️ Preview ☑️ Development
```

Click **Save**

### 5. Redeploy
- Go to **Deployments** tab
- Click **⋯** on latest deployment
- Select **Redeploy**

---

## ✅ Done!

The refactored draft room will now be active in production.

---

## 🔄 Rollback (If Needed)

To disable, edit the variable and set value to `false`, then redeploy.

---

**Last Updated:** January 2025
