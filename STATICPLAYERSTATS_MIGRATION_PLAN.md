# staticPlayerStats.js Migration Plan

**Date:** January 28, 2026
**Status:** 📋 PLANNED
**Estimated Effort:** 22-30 hours
**Impact:** A- → A+ Platform Grade

---

## Executive Summary

This plan addresses the final barrier to achieving an A+ platform grade: the **20,221-line staticPlayerStats.js file (476KB)**. The migration will move player statistics data from a bundled JavaScript file to Firestore with multi-layer caching.

### Current State

| Metric | Value |
|--------|-------|
| File Size | 476KB (20,221 lines) |
| Player Count | 244 NFL players |
| Direct Consumers | 4 files |
| Bundle Impact | ~400KB added to EVERY page |

### Target State

| Metric | Value |
|--------|-------|
| Bundle Impact | 0KB (lazy loaded on demand) |
| First Load Latency | <100ms (edge cached) |
| Repeat Load Latency | 0ms (browser cached) |
| Data Updates | API call (no redeploy needed) |

---

## Architecture: Firestore + Multi-Layer Caching

```
┌─────────────────────────────────────────────────────────────┐
│                     User Opens Modal                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  L1: Browser Cache (React Query + localStorage)             │
│  ├── Hit? → Return instantly (0ms)                          │
│  └── Miss? → Continue to L2                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  L2: Vercel Edge Cache (CDN)                                │
│  ├── Hit? → Return from nearest edge (<50ms)                │
│  └── Miss? → Continue to L3                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  L3: Firestore (Source of Truth)                            │
│  └── Query, cache at L2, return                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Firestore Schema

### Collection: `/playerStats/{playerId}`

```typescript
interface PlayerStatsDocument {
  // Identity
  id: string;              // 'josh_allen'
  name: string;            // 'Josh Allen'
  position: 'QB' | 'RB' | 'WR' | 'TE';
  team: string;            // 'BUF'

  // Stats (embedded for single read)
  seasons: SeasonStats[];  // Array of yearly stats
  career: CareerStats;     // Aggregated career totals

  // Projections & Rankings
  draftkingsRank?: number;
  draftkingsADP?: number;
  clayRank?: number;
  projectedPoints?: number;

  // Metadata
  updatedAt: Timestamp;
}
```

### Collection: `/playerStatsMetadata/current`

```typescript
interface PlayerStatsMetadata {
  version: string;        // For cache invalidation
  totalPlayers: number;
  lastUpdated: Timestamp;
  source: string;
}
```

---

## Implementation Phases

### Phase 1: Database Setup & Migration (4-6 hours)

**Goal:** Create Firestore collection and populate with existing data

| # | Task | File/Details |
|---|------|--------------|
| 1.1 | Create Firestore indexes | `position + projectedPoints DESC` |
| 1.2 | Create migration script | `scripts/migrate-player-stats-to-firestore.ts` |
| 1.3 | Run migration | Upload 244 players to Firestore |
| 1.4 | Create metadata document | Version tracking for cache invalidation |
| 1.5 | Verify data integrity | Compare Firestore data with original |

**Firestore Index (add to `firestore.indexes.json`):**
```json
{
  "collectionGroup": "playerStats",
  "fields": [
    { "fieldPath": "position", "order": "ASCENDING" },
    { "fieldPath": "projectedPoints", "order": "DESCENDING" }
  ]
}
```

---

### Phase 2: API Layer (6-8 hours)

**Goal:** Create API endpoints with edge caching

| # | Task | Details |
|---|------|---------|
| 2.1 | Create `/api/players/stats` | Returns all players (bulk load) |
| 2.2 | Create `/api/players/stats/[id]` | Returns single player |
| 2.3 | Create `/api/players/stats/position/[pos]` | Returns by position |
| 2.4 | Add edge caching headers | `s-maxage=3600, stale-while-revalidate` |
| 2.5 | Add Zod validation | Type-safe request/response |
| 2.6 | Write tests | Target: 90%+ coverage |

**API Response Example:**
```typescript
// GET /api/players/stats
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  const snapshot = await db.collection('playerStats').get();
  const players = snapshot.docs.map(doc => doc.data());

  return res.json({
    players,
    metadata: await getMetadata()
  });
}
```

---

### Phase 3: Client Integration (8-10 hours)

**Goal:** Replace static imports with React Query hooks

| # | Task | Details |
|---|------|---------|
| 3.1 | Create `usePlayerStats` hook | React Query + localStorage |
| 3.2 | Create `usePlayerStatsByPosition` hook | Prefetch by position |
| 3.3 | Update `staticPlayerStats.ts` | Export hooks instead of data |
| 3.4 | Update draft room components | Replace `STATIC_PLAYER_STATS` |
| 3.5 | Add loading skeleton | Graceful fallback |
| 3.6 | Prefetch on draft room entry | Start fetch before modal |

**usePlayerStats Hook:**
```typescript
export function usePlayerStats() {
  return useQuery({
    queryKey: ['playerStats'],
    queryFn: () => fetch('/api/players/stats').then(r => r.json()),
    staleTime: 1000 * 60 * 60,      // 1 hour
    gcTime: 1000 * 60 * 60 * 24,    // 24 hours
    persister: createSyncStoragePersister({
      storage: window.localStorage,
    }),
  });
}
```

---

### Phase 4: Cleanup & Monitoring (4-6 hours)

**Goal:** Remove old files, add monitoring

| # | Task | Details |
|---|------|---------|
| 4.1 | Delete `staticPlayerStats.js.bak` | Remove 476KB from repo |
| 4.2 | Update build scripts | Remove `npm run build:stats` |
| 4.3 | Add bundle size monitoring | CI regression check |
| 4.4 | Add Firestore read monitoring | Alert if reads exceed threshold |
| 4.5 | Create admin refresh endpoint | `/api/admin/players/refresh` |
| 4.6 | Update documentation | `player-stats-architecture.md` |

---

## Cost Analysis

### Firestore (Within Free Tier)

| Metric | Value | Cost |
|--------|-------|------|
| Document Count | 244 players | $0 |
| Document Size (avg) | ~2KB | - |
| Daily Reads | ~5,000 | $0 (free: 50K/day) |
| Monthly Writes | ~500 | $0 (free: 20K/day) |
| **Total** | - | **$0/month** |

### Performance Comparison

| Scenario | Before (Static) | After (Firestore) |
|----------|-----------------|-------------------|
| Initial page load | Always 476KB | 0KB (lazy loaded) |
| First modal open | 0ms | <100ms (edge cache) |
| Repeat modal opens | 0ms | 0ms (browser cache) |
| Data updates | Requires redeploy | API call (instant) |
| Mobile experience | 476KB always | ~50KB on demand |

---

## Rollback Plan

1. **Keep backup** - `staticPlayerStats.js.bak` until Phase 4 verification
2. **Feature flag** - Toggle between old/new data source during Phase 3
3. **Quick rollback** - Revert to static import (5 minutes)
4. **Final cleanup** - Delete backup after 1 week of production stability

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Bundle size reduction | -400KB | Webpack analyzer |
| Player modal P95 latency | <100ms | Vercel analytics |
| Firestore reads/day | <5,000 | Firebase console |
| Cache hit rate | >95% | Edge function logs |
| Test coverage | >90% | Jest coverage |
| Regressions | 0 bugs | Sentry |

---

## Timeline

| Phase | Hours | Dependencies | Risk |
|-------|-------|--------------|------|
| Phase 1: Database | 4-6 | None | Low |
| Phase 2: API | 6-8 | Phase 1 | Low |
| Phase 3: Client | 8-10 | Phase 2 | Medium |
| Phase 4: Cleanup | 4-6 | Phase 3 | Low |
| **TOTAL** | **22-30** | - | - |

---

## Post-Migration Grade

| Category | Before | After |
|----------|--------|-------|
| Security | A+ | A+ |
| Type Safety | A+ | A+ |
| Test Coverage | A- | A+ |
| API Standardization | A+ | A+ |
| Code Maintainability | C | A+ |
| Bundle Size | C | A+ |
| **Overall** | **A-** | **A+** |

---

## Quick Reference Commands

```bash
# Phase 1: Migration
npm run migrate:player-stats

# Phase 2: Test API
curl http://localhost:3000/api/players/stats | head
curl http://localhost:3000/api/players/stats/josh_allen

# Phase 3: Verify bundle size
ANALYZE=true npm run build

# Phase 4: Cleanup
rm lib/staticPlayerStats.js.bak
```

---

**Document Version:** 1.0
**Author:** AI Assistant
**Status:** Ready for Implementation
