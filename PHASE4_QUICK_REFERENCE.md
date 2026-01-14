# Phase 4: Draft Version Consolidation - Quick Reference

**Quick commands and actions for Phase 4 migration process.**

---

## 📊 Generate Traffic Report

```bash
# Last 30 days (default)
node scripts/draft-version-report.js

# Last 7 days
node scripts/draft-version-report.js --days 7

# Last 14 days
node scripts/draft-version-report.js --days 14

# JSON output (for automation)
node scripts/draft-version-report.js --format json
```

---

## 🔄 Enable/Disable Redirects

### Enable Redirects
```bash
# In .env.local or vercel.json
ENABLE_DRAFT_REDIRECTS=true
```

### Disable Redirects (Rollback)
```bash
# Remove or set to false
ENABLE_DRAFT_REDIRECTS=false
```

---

## 🚨 Add Deprecation Banner

```tsx
import { DeprecationBanner } from '@/components/shared/DeprecationBanner';

// In deprecated route component
<DeprecationBanner 
  version="v2"  // or "v3" or "vx"
  migrationDate="2025-03-01"  // Set based on timeline
  roomId={roomId}
/>
```

**Routes to update:**
- `pages/draft/v2/[roomId].js`
- `pages/draft/v3/[roomId].js`
- `pages/draft/topdog/[roomId].js` (if needed)

---

## 📈 Decision Matrix

Based on traffic report:

| vx2 Adoption | Legacy Usage | Action |
|--------------|--------------|--------|
| > 95% | < 5% | Hard deprecation (immediate redirects) |
| 80-95% | 5-20% | Soft deprecation (4-week notice) |
| < 80% | > 20% | Extended migration (8-week notice) |

---

## 🗑️ Code Deletion Checklist

When ready to delete deprecated code:

```bash
# Directories to remove:
rm -rf components/draft/v2/
rm -rf components/draft/v3/
# Note: Keep components/vx/ (used by vx2)

# Routes to remove:
rm pages/draft/v2/[roomId].js
rm pages/draft/v3/[roomId].js
```

**Before deletion:**
- ✅ All traffic migrated
- ✅ No active users on old versions
- ✅ vx2 fully tested
- ✅ Documentation updated

---

## 🔍 Verify Tracking

Check if tracking is working:

1. **Open browser console** on draft room
2. **Check Network tab** for `/api/analytics/draft-version` requests
3. **Verify Firestore** collection `draftVersionAnalytics` has data

---

## 📞 Support

**Issues?**
- Check `PHASE4_DRAFT_CONSOLIDATION_PLAN.md` for full details
- Review `PHASE4_IMPLEMENTATION_PROGRESS.md` for status
- See `PHASE4_COMPLETE_SUMMARY.md` for overview

---

**Last Updated:** January 2025
