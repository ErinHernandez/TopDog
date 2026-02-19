# Firebase Regional Optimization Guide

**Last Updated:** January 2025  
**Purpose:** Guide for optimizing Firebase for global users

---

## Overview

Firebase can be optimized for global users through regional configuration, query optimization, and connection management. This guide covers practical optimizations that don't require full multi-region deployment.

---

## Current Firebase Setup

### Default Configuration
- **Firestore:** Single region (usually `us-central1`)
- **Functions:** Single region
- **Storage:** Single region

### Optimization Options
1. **Regional Routing** - Route users to nearest region
2. **Query Optimization** - Reduce data transfer
3. **Connection Pooling** - Reuse connections
4. **Caching Strategy** - Reduce read operations

---

## Regional Routing

### Firestore Regional Endpoints

Firebase automatically routes to the nearest region, but you can optimize:

```typescript
// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  // ... existing config
};

// Initialize with regional optimization
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Firebase automatically uses nearest region
// For explicit regional routing, use regional endpoints:
// - us-central1 (Americas)
// - europe-west1 (Europe)
// - asia-southeast1 (Asia-Pacific)
```

### Regional Endpoint Configuration

```typescript
// For explicit regional control (if needed)
const getRegionalFirestore = (region: string) => {
  const config = {
    ...firebaseConfig,
    // Note: Regional endpoints are configured in Firebase Console
    // This is just for documentation
  };
  return getFirestore(initializeApp(config));
};
```

---

## Query Optimization

### 1. Limit Data Transfer

```typescript
// ❌ Bad - Fetches all fields
const userDoc = await getDoc(doc(db, 'users', userId));
const userData = userDoc.data(); // All fields

// ✅ Good - Fetch only needed fields
const userDoc = await getDoc(doc(db, 'users', userId));
const userData = {
  username: userDoc.data()?.username,
  balance: userDoc.data()?.balance,
  // Only fetch what you need
};
```

### 2. Use Indexes

```typescript
// ✅ Good - Uses composite index
const picksQuery = query(
  collection(db, 'draftRooms', roomId, 'picks'),
  where('round', '==', currentRound),
  orderBy('pickNumber', 'asc')
);

// Ensure index exists in firestore.indexes.json
```

### 3. Pagination

```typescript
// ✅ Good - Paginate large queries
const getPicksPage = async (
  roomId: string,
  pageSize: number = 50,
  lastDoc?: DocumentSnapshot
) => {
  let q = query(
    collection(db, 'draftRooms', roomId, 'picks'),
    orderBy('pickNumber', 'asc'),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  return await getDocs(q);
};
```

### 4. Batch Operations

```typescript
// ✅ Good - Batch writes reduce round trips
import { writeBatch } from 'firebase/firestore';

const batch = writeBatch(db);

// Add multiple operations
batch.update(doc(db, 'users', userId1), { balance: 100 });
batch.update(doc(db, 'users', userId2), { balance: 200 });
batch.set(doc(db, 'draftRooms', roomId), { status: 'active' });

// Commit once
await batch.commit();
```

---

## Connection Management

### 1. Connection Pooling

Firebase SDK automatically manages connections, but you can optimize:

```typescript
// ✅ Good - Reuse Firestore instance
// lib/firebase.ts
let dbInstance: ReturnType<typeof getFirestore> | null = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = getFirestore();
  }
  return dbInstance;
}
```

### 2. Persistent Connections

```typescript
// ✅ Good - Use persistent listeners for real-time data
import { onSnapshot } from 'firebase/firestore';

// Instead of polling
const unsubscribe = onSnapshot(
  doc(db, 'draftRooms', roomId),
  (doc) => {
    // Real-time updates
    updateDraftRoom(doc.data());
  }
);

// Clean up when done
// unsubscribe();
```

### 3. Connection State Monitoring

```typescript
// Monitor connection state
import { onDisconnect, onConnect } from 'firebase/database';

// For Firestore, use metadata
const docRef = doc(db, 'draftRooms', roomId);
const docSnap = await getDoc(docRef);

// Check if data is from cache (offline)
if (docSnap.metadata.fromCache) {
  console.warn('Using cached data - may be stale');
}
```

---

## Caching Strategy

### 1. Enable Offline Persistence

```typescript
// lib/firebase.ts
import { enableIndexedDbPersistence } from 'firebase/firestore';

// Enable offline persistence (caching)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab
    console.warn('Persistence already enabled in another tab');
  } else if (err.code === 'unimplemented') {
    // Browser doesn't support persistence
    console.warn('Persistence not supported');
  }
});
```

### 2. Cache-First for Static Data

```typescript
// ✅ Good - Use cache for static data
const getPlayerData = async (playerId: string) => {
  const docRef = doc(db, 'players', playerId);
  
  // Try cache first
  const cachedDoc = await getDocFromCache(docRef).catch(() => null);
  if (cachedDoc?.exists()) {
    return cachedDoc.data();
  }
  
  // Fallback to server
  const serverDoc = await getDoc(docRef);
  return serverDoc.data();
};
```

### 3. Cache-Control Headers

```typescript
// For API routes that serve Firebase data
// pages/api/nfl/players.ts
export default async function handler(req, res) {
  // Set cache headers
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  
  const players = await getPlayersFromFirestore();
  res.json(players);
}
```

---

## Performance Monitoring

### 1. Track Query Performance

```typescript
// Add performance tracking to queries
const trackQueryPerformance = async <T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await queryFn();
    const duration = performance.now() - startTime;
    
    // Log slow queries
    if (duration > 1000) {
      logger.warn('Slow query detected', {
        query: queryName,
        duration,
      });
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error('Query failed', error as Error, {
      query: queryName,
      duration,
    });
    throw error;
  }
};

// Usage
const players = await trackQueryPerformance(
  'getPlayers',
  () => getDocs(collection(db, 'players'))
);
```

### 2. Monitor Read/Write Operations

```typescript
// Track Firestore operations
const firestoreMetrics = {
  reads: 0,
  writes: 0,
  errors: 0,
};

// Wrap Firestore operations
const trackedGetDoc = async (docRef: DocumentReference) => {
  try {
    firestoreMetrics.reads++;
    return await getDoc(docRef);
  } catch (error) {
    firestoreMetrics.errors++;
    throw error;
  }
};
```

---

## Multi-Region Considerations

### When to Consider Multi-Region

**Triggers:**
- P95 latency > 500ms for >10% of users
- Draft room latency complaints
- Regional user growth in specific areas

**Cost:** ~$50-200/month additional

### Multi-Region Setup (If Needed)

1. **Firebase Console:**
   - Go to Firestore settings
   - Enable multi-region
   - Select regions (us-central1, europe-west1, asia-southeast1)

2. **Regional Routing:**
   ```typescript
   // Automatically routes to nearest region
   // No code changes needed - Firebase handles it
   ```

3. **Data Consistency:**
   - Multi-region provides eventual consistency
   - Use transactions for critical operations
   - Consider regional read replicas for high-traffic reads

---

## Best Practices

### 1. Minimize Round Trips

```typescript
// ❌ Bad - Multiple round trips
const user = await getDoc(doc(db, 'users', userId));
const draft = await getDoc(doc(db, 'drafts', draftId));
const picks = await getDocs(collection(db, 'drafts', draftId, 'picks'));

// ✅ Good - Batch or combine queries
const [user, draft, picks] = await Promise.all([
  getDoc(doc(db, 'users', userId)),
  getDoc(doc(db, 'drafts', draftId)),
  getDocs(collection(db, 'drafts', draftId, 'picks')),
]);
```

### 2. Use Transactions for Critical Operations

```typescript
// ✅ Good - Atomic operations
await runTransaction(db, async (transaction) => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await transaction.get(userRef);
  
  if (userDoc.exists()) {
    const currentBalance = userDoc.data()?.balance || 0;
    transaction.update(userRef, {
      balance: currentBalance + amount,
    });
  }
});
```

### 3. Optimize Real-Time Listeners

```typescript
// ✅ Good - Use specific queries, not entire collections
const unsubscribe = onSnapshot(
  query(
    collection(db, 'draftRooms', roomId, 'picks'),
    where('round', '==', currentRound),
    orderBy('pickNumber', 'asc')
  ),
  (snapshot) => {
    // Only receives relevant updates
  }
);
```

---

## Monitoring & Alerts

### Key Metrics to Track

1. **Query Latency:**
   - P50, P95, P99 response times
   - Track by region if multi-region

2. **Read/Write Operations:**
   - Total operations per day
   - Cost tracking
   - Identify expensive queries

3. **Connection Issues:**
   - Disconnection frequency
   - Reconnection time
   - Cache hit rates

### Firebase Console Monitoring

- **Firestore Usage:** Track reads, writes, deletes
- **Performance:** Query performance metrics
- **Regional Distribution:** User distribution by region

---

## Troubleshooting

### High Latency

1. **Check Regional Distribution:**
   - Firebase Console → Usage → Regional distribution
   - Identify regions with high latency

2. **Optimize Queries:**
   - Add indexes for slow queries
   - Reduce data transfer
   - Use pagination

3. **Consider Multi-Region:**
   - If latency > 500ms for significant users
   - Evaluate cost vs. benefit

### High Costs

1. **Review Read Operations:**
   - Identify expensive queries
   - Add caching where appropriate
   - Use pagination for large collections

2. **Optimize Write Operations:**
   - Batch writes when possible
   - Reduce unnecessary updates
   - Use transactions efficiently

---

## Next Steps

1. **Enable Offline Persistence** - Immediate benefit
2. **Optimize Queries** - Review and optimize slow queries
3. **Monitor Performance** - Track latency and costs
4. **Consider Multi-Region** - Only if metrics justify it

---

**Last Updated:** January 2025  
**See Also:** `docs/EDGE_FUNCTIONS_GUIDE.md`, `TIER4_ASSESSMENT.md`
