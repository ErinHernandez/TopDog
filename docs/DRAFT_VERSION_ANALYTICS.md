# Draft Version Analytics Setup

**Date:** January 2025  
**Purpose:** Track traffic distribution across draft room versions (v2/v3/vx/vx2)  
**Phase:** Phase 1 - Stop the Bleeding (CODE_REVIEW_HANDOFF_REFINED.md)

---

## Overview

To make informed decisions about draft version consolidation, we need to track which versions are actually being used. This document outlines the analytics setup required.

---

## Current Draft Versions

```
components/
├── draft/
│   ├── v2/    ← Legacy
│   ├── v3/    ← Legacy
│   └── vx/    ← Legacy
└── vx2/       ← Target (current)
```

---

## Analytics Implementation

### Option 1: Google Analytics 4 (Recommended)

If GA4 is already integrated, add custom events to track draft version usage:

```javascript
// In draft room components, add on mount:
useEffect(() => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'draft_version_view', {
      version: 'vx2', // or 'v2', 'v3', 'vx'
      page_path: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
  }
}, []);
```

### Option 2: Custom Analytics Endpoint

Create a lightweight analytics endpoint to track draft version usage:

**File:** `pages/api/analytics/draft-version.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandling } from '../../../lib/apiErrorHandler';
import { getDb } from '../../../lib/firebase-utils';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface DraftVersionEvent {
  version: 'v2' | 'v3' | 'vx' | 'vx2';
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  timestamp: Date;
}

export default withErrorHandling(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { version, userId, sessionId } = req.body;
  
  if (!['v2', 'v3', 'vx', 'vx2'].includes(version)) {
    return res.status(400).json({ error: 'Invalid version' });
  }
  
  const db = getDb();
  const event: DraftVersionEvent = {
    version,
    userId: userId || null,
    sessionId: sessionId || null,
    userAgent: req.headers['user-agent'] || null,
    timestamp: serverTimestamp(),
  };
  
  await addDoc(collection(db, 'draftVersionAnalytics'), event);
  
  return res.status(200).json({ success: true });
});
```

**Client-side tracking:**

```typescript
// In each draft room component
useEffect(() => {
  const trackDraftVersion = async () => {
    try {
      await fetch('/api/analytics/draft-version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: 'vx2', // or current version
          userId: user?.uid,
          sessionId: sessionStorage.getItem('sessionId') || crypto.randomUUID(),
        }),
      });
    } catch (error) {
      // Silent fail - analytics shouldn't break the app
      console.error('Analytics error:', error);
    }
  };
  
  trackDraftVersion();
}, []);
```

---

## Querying Analytics Data

### Firestore Query (if using Option 2)

```typescript
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

async function getDraftVersionStats(days: number = 30) {
  const db = getDb();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const q = query(
    collection(db, 'draftVersionAnalytics'),
    where('timestamp', '>=', Timestamp.fromDate(cutoffDate))
  );
  
  const snapshot = await getDocs(q);
  const stats = {
    v2: 0,
    v3: 0,
    vx: 0,
    vx2: 0,
    total: 0,
  };
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const version = data.version;
    if (stats.hasOwnProperty(version)) {
      stats[version]++;
      stats.total++;
    }
  });
  
  return {
    ...stats,
    percentages: {
      v2: ((stats.v2 / stats.total) * 100).toFixed(2),
      v3: ((stats.v3 / stats.total) * 100).toFixed(2),
      vx: ((stats.vx / stats.total) * 100).toFixed(2),
      vx2: ((stats.vx2 / stats.total) * 100).toFixed(2),
    },
  };
}
```

---

## Reporting Script

Create a script to generate weekly reports:

**File:** `scripts/draft-version-report.js`

```javascript
#!/usr/bin/env node

/**
 * Generate draft version usage report
 * 
 * Usage: node scripts/draft-version-report.js [--days 30]
 */

const { getDraftVersionStats } = require('../lib/analytics/draftVersionStats');

async function generateReport() {
  const days = process.argv.includes('--days') 
    ? parseInt(process.argv[process.argv.indexOf('--days') + 1])
    : 30;
  
  console.log(`\n📊 Draft Version Usage Report (Last ${days} days)`);
  console.log('='.repeat(60));
  
  try {
    const stats = await getDraftVersionStats(days);
    
    console.log(`\nTotal Sessions: ${stats.total}`);
    console.log(`\nVersion Distribution:`);
    console.log(`  v2:  ${stats.v2} (${stats.percentages.v2}%)`);
    console.log(`  v3:  ${stats.v3} (${stats.percentages.v3}%)`);
    console.log(`  vx:  ${stats.vx} (${stats.percentages.vx}%)`);
    console.log(`  vx2: ${stats.vx2} (${stats.percentages.vx2}%)`);
    
    console.log(`\n💡 Recommendations:`);
    if (stats.percentages.vx2 < 80) {
      console.log(`  ⚠️  vx2 adoption is below 80%. Consider migration campaign.`);
    }
    if (parseFloat(stats.percentages.v2) + parseFloat(stats.percentages.v3) + parseFloat(stats.percentages.vx) > 20) {
      console.log(`  ⚠️  Legacy versions still have >20% usage. Deprecation timeline may need adjustment.`);
    }
    if (stats.percentages.vx2 >= 95) {
      console.log(`  ✅ vx2 adoption is excellent. Safe to proceed with deprecation.`);
    }
    
  } catch (error) {
    console.error('Error generating report:', error);
    process.exit(1);
  }
}

generateReport();
```

---

## First Week Deliverable Checklist

- [ ] Implement analytics tracking in all draft room versions
- [ ] Deploy tracking to production
- [ ] Collect baseline data (1 week minimum)
- [ ] Generate first report with traffic distribution
- [ ] Document findings in `DRAFT_VERSION_ANALYTICS_REPORT.md`
- [ ] Make decision on deprecation timeline based on data

---

## Success Criteria

**Week 1 Goal:**
- Analytics tracking implemented and deployed
- Baseline data collected (minimum 7 days)
- Report generated showing % traffic per version

**Decision Points:**
- If vx2 > 95%: Proceed with hard deprecation
- If vx2 80-95%: Soft deprecation with migration campaign
- If vx2 < 80%: Delay deprecation, focus on migration

---

## Related Documents

- `CODE_REVIEW_HANDOFF_REFINED.md` - Phase 1 requirements
- `COMPREHENSIVE_CODE_REVIEW_REPORT.md` - Full analysis
- Draft room components in `components/draft/` and `components/vx2/`
