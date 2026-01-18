# Firestore Best Practices

> **IMPORTANT**: All Firestore queries must include safety limits to prevent server hangs.

## Quick Reference

| Collection | Default Limit | Max Limit | Service |
|-----------|---------------|-----------|---------|
| players | 200 | 500 | `playerService` |
| picks | 500 | 500 | `draftPicksService` |
| draftRooms | 50 | 50 | Direct query with limit |

---

## Rule 1: ALWAYS Use Limits

```typescript
// WRONG - can fetch millions of documents
const snapshot = await getDocs(collection(db, 'players'));

// CORRECT - explicit limit
const q = query(collection(db, 'players'), limit(100));
const snapshot = await getDocs(q);
```

---

## Rule 2: Use the Service Layer

For player data, always use the `playerService`:

```typescript
// WRONG - direct Firestore query
import { collection, getDocs } from 'firebase/firestore';
const playersSnapshot = await getDocs(collection(db, 'players'));

// CORRECT - use the optimized service
import { getAvailablePlayers } from '@/lib/services/playerService';
const players = await getAvailablePlayers({ limit: 100 });
```

For draft picks, use `draftPicksService`:

```typescript
// WRONG - direct query
const picksSnapshot = await getDocs(collection(db, 'draftRooms', roomId, 'picks'));

// CORRECT - use the service
import { getDraftPicks } from '@/lib/services/draftPicksService';
const picks = await getDraftPicks(roomId);
```

---

## Rule 3: Avoid N+1 Queries

```typescript
// WRONG - N+1 pattern (makes 100+ queries!)
for (const draft of drafts) {
  const picks = await getDocs(collection(db, 'draftRooms', draft.id, 'picks'));
}

// CORRECT - batch operation
import { batchGetUserPicks } from '@/lib/services/draftPicksService';
const picksMap = await batchGetUserPicks(draftIds, participantIdMap);
```

---

## Rule 4: Use Retry Protection

For critical operations, use the retry wrapper:

```typescript
import { withFullProtection } from '@/lib/firebase/retryUtils';

const result = await withFullProtection('operation-key', async () => {
  return getDocs(query(...));
});
```

This provides:
- Exponential backoff on failures
- Circuit breaker for repeated failures
- Retry budget to prevent thundering herd

---

## Rule 5: Monitor Query Performance

Wrap queries with the monitor for alerting:

```typescript
import { measureQuery } from '@/lib/monitoring/queryMonitor';

const players = await measureQuery(
  'getAvailablePlayers',
  'players',
  () => getDocs(query(playersRef, limit(100)))
);
```

Thresholds:
- **Slow**: > 500ms (logs warning)
- **Critical**: > 2000ms (logs error, alerts Sentry)

---

## Service API Reference

### playerService

```typescript
import {
  getAvailablePlayers,
  getTopAvailableByPosition,
  clearPlayerCache,
} from '@/lib/services/playerService';

// Get players with options
const players = await getAvailablePlayers({
  positions: ['QB', 'RB'],
  excludeIds: new Set(['p1', 'p2']),
  limit: 100,
});

// Get top 5 available per position
const topAvailable = await getTopAvailableByPosition(draftedIds, 5);

// Invalidate cache after updates
clearPlayerCache();
```

### draftPicksService

```typescript
import {
  getDraftPicks,
  getDraftedPlayerIds,
  batchGetUserPicks,
} from '@/lib/services/draftPicksService';

// Get picks for a room
const picks = await getDraftPicks(roomId);

// Get picks for a specific participant
const myPicks = await getDraftPicks(roomId, { participantId: 'user123' });

// Get drafted player IDs
const draftedIds = await getDraftedPlayerIds(roomId);

// Batch fetch for multiple rooms
const allPicks = await batchGetUserPicks(roomIds, participantMap);
```

---

## Checking Health

The `/api/health` endpoint now includes query metrics:

```json
{
  "queryMetrics": {
    "avgDuration": 45,
    "maxDuration": 120,
    "slowQueries": 0,
    "criticalQueries": 0,
    "thresholds": {
      "slowMs": 500,
      "criticalMs": 2000
    }
  },
  "cache": {
    "playerCache": {
      "size": 3,
      "keys": ["players:{...}", ...]
    }
  }
}
```

---

## Pre-commit Checks

A pre-commit hook validates:
- No `getDocs(collection(...))` without limit
- No `getDocs(query(...))` without limit

If blocked, check your query and add a `limit()` constraint.

---

## PR Checklist

Before submitting a PR with Firestore queries:

- [ ] All `getDocs` calls include `limit()`
- [ ] No N+1 query patterns (queries in loops)
- [ ] Using `playerService` for player data access
- [ ] Using `draftPicksService` for picks access
- [ ] `withFullProtection` used for critical operations
- [ ] Tested with production-like data volume

---

## Common Errors

### "Query exceeded timeout"

Your query is fetching too much data. Add a `limit()`:

```typescript
// Add limit
const q = query(collectionRef, orderBy('adp'), limit(100));
```

### "Memory usage spike"

Check for unbounded queries. Use the services instead of direct Firestore calls.

### "N+1 query detected"

You're querying inside a loop. Use `batchGetUserPicks` for picks, or restructure to fetch in parallel with Promise.all.
