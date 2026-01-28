# Player Stats Architecture

## Overview

This document describes the player statistics system architecture after the migration from a static JavaScript bundle to a Firestore-backed system with edge caching.

**Migration Date:** January 28, 2026
**Migration Version:** 5.0

## Migration Summary

| Metric | Before (Static Bundle) | After (Firestore + Edge Cache) |
|--------|------------------------|--------------------------------|
| Bundle Size | 476KB (always loaded) | 0KB (lazy loaded) |
| Data Source | Static JS file | Firestore + Edge Cache |
| Update Method | Redeploy required | API refresh (instant) |
| Scalability | Limited to 244 players | Unlimited |
| Mobile Experience | 476KB always downloaded | ~50KB on demand |

## Architecture

### Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│  Edge CDN   │────▶│  Firestore  │
│   (SWR +    │     │  (Vercel)   │     │  Database   │
│ localStorage)│◀────│  s-maxage   │◀────│             │
└─────────────┘     │   3600s     │     └─────────────┘
                    └─────────────┘
```

### Caching Layers

| Layer | Technology | Purpose | TTL |
|-------|------------|---------|-----|
| L1 | Browser (SWR + localStorage) | Instant repeat views | 24 hours |
| L2 | Vercel Edge Cache | Global CDN, <50ms response | 1 hour |
| L3 | Firestore | Source of truth | N/A |

### Request Flow

1. User opens draft room modal → Check L1 (browser cache)
2. Cache miss → Fetch from `/api/players/stats` (hits L2 edge cache)
3. Edge cache miss → Query Firestore (L3), cache result at edge
4. Return data → Store in browser cache for future instant access

## API Endpoints

### GET /api/players/stats

Returns all player statistics.

**Response:**
```json
{
  "metadata": {
    "version": "5.0",
    "totalPlayers": 244,
    "lastUpdated": "2026-01-28T00:00:00.000Z",
    "source": "Firestore"
  },
  "players": {
    "Josh Allen": {
      "id": "josh_allen",
      "name": "Josh Allen",
      "position": "QB",
      "team": "BUF",
      "seasons": [...],
      "career": {...},
      "projectedPoints": 350.5
    }
  }
}
```

**Cache Headers:**
```
Cache-Control: s-maxage=3600, stale-while-revalidate=86400
```

### GET /api/players/stats/[id]

Returns a single player's statistics.

**Path Parameters:**
- `id` - Normalized player ID (e.g., `josh_allen`)

### GET /api/players/stats/position/[pos]

Returns all players for a specific position.

**Path Parameters:**
- `pos` - Position (QB, RB, WR, TE)

### POST /api/admin/players/refresh

Triggers a cache refresh (requires admin auth).

## Client Usage

### Modern Usage (Recommended)

```tsx
import { usePlayerStats, prefetchPlayerStats } from '@/lib/playerStats';

// In draft room component
function DraftRoom() {
  const { data, isLoading, error } = usePlayerStats();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState />;

  return <PlayerList players={data.players} />;
}

// Prefetch on page entry for instant modal loading
useEffect(() => {
  prefetchPlayerStats();
}, []);
```

### Available Hooks

| Hook | Description |
|------|-------------|
| `usePlayerStats()` | Fetch all player stats |
| `usePlayerStatsById(id)` | Fetch single player |
| `usePlayerStatsByPosition(pos)` | Fetch players by position |
| `prefetchPlayerStats()` | Prefetch all stats |
| `prefetchAllPositions()` | Prefetch by all positions |

### Legacy Usage (Backward Compatible)

Existing code continues to work without changes:

```ts
import { STATIC_PLAYER_STATS, getPlayerStats } from '@/lib/staticPlayerStats';

const player = getPlayerStats('Josh Allen');
const allPlayers = STATIC_PLAYER_STATS.players;
```

## Firestore Schema

### Collection: `playerStats`

Document ID: Normalized player name (e.g., `josh_allen`)

```typescript
interface PlayerStatsDocument {
  id: string;           // 'josh_allen'
  name: string;         // 'Josh Allen'
  position: 'QB' | 'RB' | 'WR' | 'TE';
  team: string;         // 'BUF'
  seasons: SeasonStats[];
  career: CareerStats;
  draftkingsRank?: number;
  draftkingsADP?: number;
  clayRank?: number;
  projectedPoints?: number;
  updatedAt: Timestamp;
}
```

### Collection: `playerStatsMetadata`

Single document: `current`

```typescript
interface PlayerStatsMetadataDocument {
  version: string;
  totalPlayers: number;
  lastUpdated: Timestamp;
  source: string;
}
```

## Firestore Indexes

Required composite indexes (in `firestore.indexes.json`):

```json
{
  "collectionGroup": "playerStats",
  "fields": [
    { "fieldPath": "position", "order": "ASCENDING" },
    { "fieldPath": "projectedPoints", "order": "DESCENDING" }
  ]
}
```

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

## Migration Guide

### Running the Migration

```bash
# 1. Set up service account
export FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./service-account-key.json

# 2. Run migration
npm run migrate:player-stats

# 3. Deploy indexes
firebase deploy --only firestore:indexes

# 4. Verify in Firebase Console
```

### Rollback Plan

The original `lib/staticPlayerStats.js.bak` file is preserved. To rollback:

1. Update `lib/playerStats/index.ts` to load from backup file directly
2. Deploy changes
3. Verify functionality

Only delete backup file after 1 week of production stability.

## Monitoring

### Firestore Dashboard

Monitor in Firebase Console:
- Document reads (should be low due to edge caching)
- Cache hit rate
- Error rates

### Edge Cache

Monitor in Vercel Dashboard:
- Cache HIT/MISS ratio
- Response times by region

### Recommended Alerts

| Metric | Threshold | Action |
|--------|-----------|--------|
| Firestore reads/day | > 5,000 | Investigate cache issues |
| API P95 latency | > 200ms | Check edge cache |
| Error rate | > 1% | Check Firestore status |

## Cost Analysis

| Metric | Estimate | Cost |
|--------|----------|------|
| Document Count | 244 players | Free tier |
| Daily Reads | ~5,000 | Free tier (50K/day) |
| Monthly Writes | ~500 | Free tier (20K/day) |
| **Total Monthly** | - | **$0** |

With edge caching, most requests never hit Firestore. Only cache misses result in reads.

## Files Created/Modified

```
lib/
├── playerStats/
│   ├── index.ts        # Main exports
│   ├── types.ts        # TypeScript interfaces
│   └── hooks.ts        # SWR hooks
├── staticPlayerStats.ts # Updated: re-exports from playerStats

pages/api/players/stats/
├── index.ts            # GET all players
├── [id].ts             # GET single player
└── position/
    └── [pos].ts        # GET players by position

pages/api/admin/players/
└── refresh.ts          # POST cache refresh

scripts/
└── migrate-player-stats-to-firestore.ts

firestore.indexes.json  # Updated with playerStats indexes
```

## Performance Comparison

| Scenario | Before (Static Bundle) | After (Firestore + Cache) |
|----------|------------------------|---------------------------|
| Initial page load | Always loads 476KB | 0KB (lazy loaded) |
| First player modal | 0ms (already loaded) | <100ms (edge cache) |
| Subsequent modals | 0ms | 0ms (browser cache) |
| Data updates | Requires redeploy | API call (instant) |
| Mobile experience | 476KB download always | ~50KB on demand |

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Bundle size reduction | -400KB | Webpack bundle analyzer |
| Player modal P95 latency | <100ms | Vercel analytics |
| Firestore reads/day | <5,000 | Firebase console |
| Cache hit rate | >95% | Edge function logs |
| Test coverage (new code) | >90% | Jest coverage report |
| Zero regressions | 0 bugs | Sentry error tracking |

---

## History

### Previous Architecture (Static Bundle)

Before this migration, player stats were:
- Pre-downloaded during build (`npm run build:stats`)
- Bundled as static JSON in the JavaScript bundle
- Always loaded on every page (476KB)
- Required redeploy to update

### Current Architecture (Firestore + Edge Cache)

Now player stats are:
- Stored in Firestore database
- Cached at the edge for 1 hour
- Lazy-loaded only when needed
- Updated via API without redeploy

---

Last Updated: January 28, 2026
Migration Version: 5.0
