# Repository Pattern Migration Guide

## Overview

The repository pattern provides a type-safe abstraction over the FirebaseAdapter, eliminating direct Firestore calls throughout the codebase. All CRUD operations are routed through repositories with built-in retry logic, circuit breakers, and consistent error handling.

## Key Benefits

- **Type Safety**: All returned data is properly typed (no `any`)
- **Consistency**: All operations use the same error handling and retry logic
- **Testability**: Repositories can be easily mocked for testing
- **Maintainability**: Domain logic is centralized in repositories
- **Monitoring**: All operations are logged through structuredLogger

## Repository Structure

```
lib/repositories/
├── baseRepository.ts           # Generic base class
├── userRepository.ts           # Users collection
├── draftRepository.ts          # Drafts and picks
├── teamRepository.ts           # Teams (nested under users)
├── playerRepository.ts         # Players collection
├── leagueRepository.ts         # Tournaments
├── transactionRepository.ts    # Financial transactions
├── notificationRepository.ts   # Notifications
└── index.ts                    # Barrel export
```

## Migration Examples

### Example 1: User Signup (pages/api/auth/signup.ts)

**Before (Direct Firestore Calls):**
```typescript
import { collection, query, where, getDocs, doc, runTransaction } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

// Check if username exists
const usernamesRef = collection(db, 'usernames');
const q = query(usernamesRef, where('username', '==', normalizedUsername));
const snapshot = await getDocs(q);

if (snapshot.docs.length > 0) {
  // Username taken
}

// Create user in transaction
const result = await runTransaction(db, async (transaction) => {
  const userRef = doc(db, 'users', uid);
  const userDoc = await transaction.get(userRef);

  if (userDoc.exists()) {
    throw new Error('User already exists');
  }

  transaction.set(userRef, userData);
  // ... more operations
});
```

**After (Using Repositories):**
```typescript
import { userRepository, draftRepository } from '@/lib/repositories';

// Check if username exists
const existingUser = await userRepository.getByUsername(normalizedUsername);

if (existingUser) {
  // Username taken
}

// Create user (use adapter's transaction for atomic operations)
const adapter = userRepository.getAdapter();
const result = await adapter.runAtomicTransaction(async (transaction) => {
  const userRef = adapter.getDocRef('users', uid);
  const userSnapshot = await transaction.get(userRef);

  if (userSnapshot !== null) {
    throw new Error('User already exists');
  }

  transaction.set(userRef, userData);
  // ... more operations
});

// Create user document
await userRepository.createUser(uid, userData);
```

### Example 2: Draft Pick Submission (pages/api/draft/submit-pick.ts)

**Before (Direct Firestore):**
```typescript
import {
  doc, getDoc, collection, getDocs, addDoc,
  updateDoc, query, where, limit, runTransaction
} from 'firebase/firestore';

// Get room
const roomRef = doc(db, 'draftRooms', roomId);
const roomDoc = await transaction.get(roomRef);

// Get all picks
const picksRef = collection(db, 'draftRooms', roomId, 'picks');
const allPicksQuery = query(picksRef, limit(500));
const allPicksSnapshot = await getDocs(allPicksQuery);

// Add new pick
const pickDocRef = await addDoc(picksRef, pickData);

// Update room
await updateDoc(roomRef, roomUpdates);
```

**After (Using Repositories):**
```typescript
import { draftRepository } from '@/lib/repositories';

const picks = draftRepository.getPicks();
const adapter = draftRepository.getAdapter();

// Get room
const room = await draftRepository.getById(roomId);

// Get all picks (atomic within transaction)
const allPicks = await picks.getByDraft(roomId);

// Use transaction for atomic operations
const result = await adapter.runAtomicTransaction(async (transaction) => {
  const roomRef = adapter.getDocRef('drafts', roomId);
  const roomSnapshot = await transaction.get(roomRef);

  if (!roomSnapshot) {
    throw new Error('Room not found');
  }

  // ... business logic

  transaction.update(roomRef, roomUpdates);
  return pickData;
});

// Add pick after transaction
const pickId = await picks.add(roomId, result);
```

### Example 3: User Query (pages/api/user/...)

**Before (Direct Firestore):**
```typescript
import { collection, query, where, getDocs } from 'firebase/firestore';

const usersRef = collection(db, 'users');
const q = query(usersRef, where('email', '==', email));
const snapshot = await getDocs(q);

const user = snapshot.docs[0]?.data();
if (!user) return null;

return { id: snapshot.docs[0].id, ...user };
```

**After (Using Repository):**
```typescript
import { userRepository } from '@/lib/repositories';

const user = await userRepository.getByEmail(email);
// Null-safe, typed, with retry logic built-in
```

## Common Patterns

### Single Document Get
```typescript
// Get by ID (type-safe)
const user = await userRepository.getById(userId);
if (!user) {
  // Handle not found
}

// Get by custom field
const user = await userRepository.getByEmail(email);
```

### Query with Constraints
```typescript
import { where, orderBy } from 'firebase/firestore';

// Using repository methods
const teams = await teamRepository.userTeams().getByTournament(userId, tournamentId);

// Direct constraints
const transactions = await transactionRepository.query(
  [
    where('userId', '==', userId),
    where('status', '==', 'pending'),
  ],
  { orderByField: 'createdAt', orderDirection: 'desc' }
);
```

### Create/Update/Delete
```typescript
// Create with auto-generated ID
const transactionId = await transactionRepository.createTransaction({
  userId,
  type: 'deposit',
  amount: 50,
  status: 'pending',
  currency: 'USD',
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Update specific fields
await userRepository.update(userId, { lastActiveAt: new Date() });

// Delete
await userRepository.deleteUser(userId);
```

### Nested Collections
```typescript
// Access nested team collection
const teams = await teamRepository.userTeams().getByUser(userId);
const team = await teamRepository.userTeams().getById(userId, teamId);

// Access nested draft picks
const picks = await draftRepository.getPicks().getByDraft(draftId);
const pick = await draftRepository.getPicks().getById(draftId, pickId);
```

### Atomic Transactions
```typescript
const adapter = userRepository.getAdapter();

const result = await adapter.runAtomicTransaction(async (transaction) => {
  const userRef = adapter.getDocRef('users', userId);
  const userSnapshot = await transaction.get(userRef);

  if (!userSnapshot) throw new Error('User not found');

  const user = userSnapshot as FirestoreUser;
  const newBalance = user.balance - amount;

  transaction.update(userRef, { balance: newBalance });
  return newBalance;
});
```

### Batch Operations
```typescript
const adapter = userRepository.getAdapter();

await adapter.batchWrite([
  {
    type: 'set',
    collection: 'users',
    docId: user1Id,
    data: userData1,
  },
  {
    type: 'update',
    collection: 'users',
    docId: user2Id,
    data: { status: 'active' },
  },
  {
    type: 'delete',
    collection: 'users',
    docId: user3Id,
  },
]);
```

## Migration Checklist

- [ ] Create repository instance/singleton
- [ ] Replace all `getDocs`, `getDoc` calls with repository `query`/`get` methods
- [ ] Replace all `addDoc`, `setDoc`, `updateDoc` with repository `create`/`set`/`update` methods
- [ ] Replace all `deleteDoc` with repository `delete` method
- [ ] Update imports to use repositories
- [ ] Remove direct Firebase imports from the file (getDoc, setDoc, etc.)
- [ ] Test to ensure behavior matches (same error handling, same data types)
- [ ] Verify logging shows repository operations
- [ ] Update TypeScript types if needed

## Migration Priority (by traffic)

1. **pages/api/draft/submit-pick.ts** - Atomic draft pick submission
2. **pages/api/auth/signup.ts** - User registration and profile creation
3. **pages/api/auth/verify-age.ts** - Age verification
4. **pages/api/drafts/[draftId]/withdraw.ts** - Draft withdrawal
5. **pages/api/user/update-contact.ts** - User profile updates

## Notes for Maintainers

- All repositories are **singletons** - they share the same adapter instance
- The adapter handles **retry logic** (up to 3 retries for reads, 2 for writes)
- The adapter has **circuit breaker protection** to prevent cascading failures
- All operations are **logged** through `structuredLogger` for monitoring
- Timestamps are **automatically added** to all documents (createdAt, updatedAt)

## Accessing the Underlying Adapter

For advanced operations not covered by repositories:
```typescript
const adapter = userRepository.getAdapter();

// Transaction
const result = await adapter.runAtomicTransaction(async (tx) => {
  // Your complex logic
});

// Batch write
await adapter.batchWrite(operations);

// Check existence
const exists = await adapter.exists('users', userId);

// Get Firestore instance directly (last resort)
const db = adapter.getFirestore();
```

## Troubleshooting

**Error: "Cannot read property 'exists' of null"**
- Check that the document exists before accessing properties
- Always use null-safe checks or optional chaining

**Error: "Retry budget exhausted"**
- Too many write operations are failing
- Check network connectivity and database health
- May indicate quota exceeded on Firestore

**Type mismatch: 'FirestoreUser | null' vs 'FirestoreUser'**
- Document doesn't exist or query returned no results
- Use null coalescing or assertion if you know document exists
