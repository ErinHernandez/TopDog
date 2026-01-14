# Import Path Cleanup Guide

**Status:** Optional - Works as-is, but cleaner without `.js` extensions

---

## Why This is Optional

TypeScript/Next.js automatically resolves `.ts` files when you import without an extension. Files with `.js` extensions will still work correctly.

**Example:**
```javascript
// Both of these work the same way:
import { ... } from '../../../../lib/apiErrorHandler.js';  // ✅ Works
import { ... } from '../../../../lib/apiErrorHandler';     // ✅ Also works (preferred)
```

---

## Files That Could Be Updated

### High Priority (Critical Imports)
- ✅ `pages/api/auth/username/claim.js` - Updated
- ✅ `pages/api/auth/username/reserve.js` - Updated

### Medium Priority (Other Auth Routes)
- ⏳ `pages/api/auth/username/check.js`
- ⏳ `pages/api/auth/username/change.js`
- ⏳ `pages/api/auth/signup.js`

### Low Priority (Other Routes)
- ⏳ `pages/api/nfl/fantasy/adp.js`
- ⏳ `pages/api/nfl/fantasy/rankings.js`
- ⏳ `pages/api/nfl/stats/*.js` files (4 files)
- ⏳ `pages/api/azure-vision/*.js` files (2 files)
- ⏳ `pages/api/vision/analyze.js`

---

## How to Update

**Find and replace pattern:**
```javascript
// Find:
from '../../../../lib/apiErrorHandler.js';
from '../../../../lib/adminAuth.js';
from '../../../../lib/firebase.js';

// Replace with:
from '../../../../lib/apiErrorHandler';
from '../../../../lib/adminAuth';
from '../../../../lib/firebase';
```

**Automated approach:**
```bash
# Update apiErrorHandler imports
find pages/api -name "*.js" -exec sed -i '' 's|from.*apiErrorHandler\.js|from '\''../../../../lib/apiErrorHandler'\''|g' {} \;

# Update adminAuth imports  
find pages/api -name "*.js" -exec sed -i '' 's|from.*adminAuth\.js|from '\''../../../../lib/adminAuth'\''|g' {} \;

# Update firebase imports
find pages/api -name "*.js" -exec sed -i '' 's|from.*firebase\.js|from '\''../../../../lib/firebase'\''|g' {} \;
```

---

## Recommendation

**Status:** Low priority - can be done incrementally

This cleanup improves code consistency but doesn't affect functionality. You can:
1. Update files as you touch them naturally
2. Or do a one-time cleanup when convenient
3. Or leave as-is (works perfectly fine)

**No urgency** - this is a code quality improvement, not a bug fix.
