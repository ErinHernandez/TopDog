# Deployment Quick Start - Draft Room Refactoring

**Date:** January 2025  
**Status:** ✅ **READY TO ENABLE**

---

## 🚀 Quick Enable Guide

The refactored draft room code is **already in the codebase**. To enable it, you just need to set the feature flag environment variable.

---

## Option 1: Enable for All Users (Production)

### For Vercel (or similar hosting):

1. Go to your hosting platform's environment variables settings
2. Add/Update this variable:
   ```
   NEXT_PUBLIC_USE_NEW_DRAFT_ROOM=true
   ```
3. Redeploy your application

### For Local Testing:

Create or update `.env.local`:
```bash
NEXT_PUBLIC_USE_NEW_DRAFT_ROOM=true
```

---

## Option 2: Test Individual Rooms (Development)

### Via URL Query Parameter:
```
/draft/topdog/[roomId]?useNew=true
```

### Via Browser Console:
```javascript
localStorage.setItem('useNewDraftRoom', 'true');
```

---

## Option 3: Gradual Rollout (Recommended)

The feature flag system supports gradual rollout via percentage:

1. Set rollout percentage (0-100):
   ```bash
   NEXT_PUBLIC_NEW_DRAFT_ROOM_ROLLOUT=10  # 10% of users
   ```

2. The system uses deterministic user-based rollouts (same user always gets same version)

3. Gradually increase:
   - Week 1: 10%
   - Week 2: 25%
   - Week 3: 50%
   - Week 4: 75%
   - Week 5: 100%

---

## Rollback (If Needed)

### Instant Rollback:
Set the environment variable to `false`:
```bash
NEXT_PUBLIC_USE_NEW_DRAFT_ROOM=false
```

Or remove the variable entirely (defaults to `false`).

---

## Current Status

- **Code:** ✅ Already in codebase
- **Feature Flag:** ⏳ Disabled by default (safe)
- **Legacy Code:** ✅ Preserved (safe fallback)
- **Error Boundaries:** ✅ In place
- **Monitoring:** ✅ Ready

---

## Next Steps

1. **Review:** Review the code if you haven't already
2. **Test Locally:** Test with `?useNew=true` parameter
3. **Enable Flag:** Set environment variable
4. **Deploy:** Standard deployment process
5. **Monitor:** Watch error logs and user feedback

---

**Status:** ✅ **Code Ready - Just Enable the Flag!**

---

**Last Updated:** January 2025
