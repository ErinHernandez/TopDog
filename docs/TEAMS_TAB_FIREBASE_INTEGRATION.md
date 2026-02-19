# Teams Tab Firebase Integration Guide

## Overview

The Teams tab currently uses mock data via the `useMyTeams` hook. This document explains how to integrate Firebase Firestore for real-time team data.

## Current Hook Structure

The `useMyTeams` hook in `components/vx2/hooks/data/useMyTeams.ts` is already well-structured for Firebase integration:

### Key Features:
- ✅ Loading states (`isLoading`, `isRefetching`)
- ✅ Error handling (`error`)
- ✅ Refetch capability (`refetch()`)
- ✅ Clean separation between data fetching and UI
- ✅ TypeScript types defined

### Current Implementation:
```typescript
async function fetchMyTeams(): Promise<MyTeam[]> {
  // Currently returns mock data
  return MOCK_TEAMS;
}
```

## Firestore Schema

Teams are stored in a subcollection under each user:

```
/users/{userId}/teams/{teamId}
```

### Document Structure:
```typescript
interface FirestoreTeam {
  id: string;
  tournamentId: string;
  tournamentName: string;
  draftType: 'fast' | 'slow';
  roster: TeamPlayer[];  // Array of player objects
  status: 'drafting' | 'active' | 'eliminated' | 'won';
  totalPoints?: number;
  rank?: number;
  payout?: number;
  createdAt: Timestamp;
  completedAt?: Timestamp;
}
```

## Integration Approaches

### 1. One-Time Fetch (Simple)

Use `getDocs()` for initial load:

```typescript
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

async function fetchMyTeamsOnce(userId: string): Promise<MyTeam[]> {
  const teamsRef = collection(db, 'users', userId, 'teams');
  const teamsQuery = query(teamsRef, orderBy('createdAt', 'desc'));
  
  const snapshot = await getDocs(teamsQuery);
  return snapshot.docs.map(doc => transformFirestoreTeam(doc));
}
```

**Pros:**
- Simple to implement
- Lower Firebase read costs
- Good for initial load

**Cons:**
- No real-time updates
- Requires manual refetch

### 2. Real-Time Listener (Recommended)

Use `onSnapshot()` for live updates:

```typescript
import { onSnapshot } from 'firebase/firestore';

useEffect(() => {
  if (!userId) return;
  
  const teamsRef = collection(db, 'users', userId, 'teams');
  const teamsQuery = query(teamsRef, orderBy('createdAt', 'desc'));
  
  const unsubscribe = onSnapshot(
    teamsQuery,
    (snapshot) => {
      const teams = snapshot.docs.map(doc => transformFirestoreTeam(doc));
      setTeams(teams);
      setIsLoading(false);
    },
    (error) => {
      setError(error.message);
      setIsLoading(false);
    }
  );
  
  return () => unsubscribe(); // Cleanup
}, [userId]);
```

**Pros:**
- Automatic updates when data changes
- No manual refetch needed
- Better UX (teams update instantly)

**Cons:**
- Higher Firebase read costs (listeners count as reads)
- More complex error handling

## Data Transformation

Firestore documents need to be transformed to match component types:

### Firestore → Component Mapping:

| Firestore Field | Component Field | Notes |
|----------------|-----------------|-------|
| `roster` (array) | `players` (array) | Need to transform each player |
| `createdAt` (Timestamp) | `draftedAt` (string) | Convert to ISO string |
| `tournamentName` | `tournament` | Direct mapping |
| `totalPoints` | `projectedPoints` | Direct mapping |
| `status` | `status` | May need mapping |

### Example Transformation:

```typescript
function transformFirestoreTeamToMyTeam(
  firestoreTeam: FirestoreTeam & { id: string }
): MyTeam {
  return {
    id: firestoreTeam.id,
    name: firestoreTeam.tournamentName,
    tournament: firestoreTeam.tournamentName,
    tournamentId: firestoreTeam.tournamentId,
    rank: firestoreTeam.rank,
    projectedPoints: firestoreTeam.totalPoints || 0,
    draftedAt: firestoreTeam.createdAt.toDate().toISOString(),
    players: firestoreTeam.roster.map(transformPlayer),
  };
}
```

## Query Patterns

### Basic Query (All Teams)
```typescript
const teamsRef = collection(db, 'users', userId, 'teams');
const teamsQuery = query(teamsRef, orderBy('createdAt', 'desc'));
```

### Filter by Tournament
```typescript
const teamsQuery = query(
  collection(db, 'users', userId, 'teams'),
  where('tournamentId', '==', tournamentId),
  orderBy('createdAt', 'desc')
);
```

### Filter by Status
```typescript
const teamsQuery = query(
  collection(db, 'users', userId, 'teams'),
  where('status', '==', 'active'),
  orderBy('createdAt', 'desc')
);
```

### Multiple Filters (Requires Composite Index)
```typescript
// Note: This requires a composite index in firestore.indexes.json
const teamsQuery = query(
  collection(db, 'users', userId, 'teams'),
  where('tournamentId', '==', tournamentId),
  where('status', '==', 'active'),
  orderBy('createdAt', 'desc')
);
```

## Required Firestore Indexes

For queries with multiple `where` clauses, add to `firestore.indexes.json`:

```json
{
  "collectionGroup": "teams",
  "queryScope": "COLLECTION_GROUP",
  "fields": [
    { "fieldPath": "tournamentId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

## Error Handling

### Network Errors
```typescript
onSnapshot(
  teamsQuery,
  (snapshot) => { /* success */ },
  (error) => {
    if (error.code === 'unavailable') {
      // Network offline
      setError('No internet connection');
    } else {
      setError(error.message);
    }
  }
);
```

### Permission Errors
```typescript
if (error.code === 'permission-denied') {
  setError('You do not have permission to view teams');
}
```

## Performance Considerations

### 1. Pagination
For users with many teams, implement pagination:

```typescript
const teamsQuery = query(
  collection(db, 'users', userId, 'teams'),
  orderBy('createdAt', 'desc'),
  limit(20) // First 20 teams
);

// Load more with startAfter()
const lastDoc = snapshot.docs[snapshot.docs.length - 1];
const nextQuery = query(teamsQuery, startAfter(lastDoc));
```

### 2. Caching
Firestore automatically caches data. For offline support:

```typescript
import { enableIndexedDbPersistence } from 'firebase/firestore';

// Enable offline persistence (call once on app init)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    // Multiple tabs open
  } else if (err.code == 'unimplemented') {
    // Browser doesn't support
  }
});
```

### 3. Read Costs
- Each `onSnapshot` listener counts as a read
- Each document in the query counts as a read
- Consider using one-time fetch for initial load, then real-time for updates

## Migration Steps

1. **Update Hook** - Replace `fetchMyTeams()` with Firebase query
2. **Add Transformation** - Convert Firestore types to component types
3. **Add Error Handling** - Handle network/permission errors
4. **Add Indexes** - Create composite indexes if needed
5. **Test** - Test with real Firebase data
6. **Update Components** - Ensure components handle loading/error states

## Example: Complete Integration

See `components/vx2/hooks/data/useMyTeams.firebase-example.ts` for a complete working example with:
- Real-time listeners
- One-time fetch option
- Error handling
- Data transformation
- Advanced query patterns

## Next Steps

1. Determine if real-time updates are needed (recommended: yes)
2. Set up authentication to get `userId`
3. Create Firestore indexes for any composite queries
4. Test with real data
5. Monitor Firebase usage/reads

