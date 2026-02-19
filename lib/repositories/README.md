# Repository Pattern Implementation

Complete implementation of the repository pattern for type-safe Firestore access throughout the bestball-site application.

## Quick Start

```typescript
import {
  userRepository,
  draftRepository,
  teamRepository,
  playerRepository,
  transactionRepository,
  leagueRepository,
  notificationRepository,
} from '@/lib/repositories';

// Get a user
const user = await userRepository.getById(userId);

// Query by custom field
const user = await userRepository.getByEmail(email);

// Get user's teams
const teams = await teamRepository.userTeams().getByUser(userId);

// Get draft picks
const picks = await draftRepository.getPicks().getByDraft(draftId);

// Query transactions
const pending = await transactionRepository.getPending(userId);

// Create a transaction
const txId = await transactionRepository.createTransaction({
  userId,
  type: 'deposit',
  amount: 50,
  status: 'pending',
  currency: 'USD',
  createdAt: new Date() as any,
  updatedAt: new Date() as any,
});
```

## Files

### Core Implementation (9 files)

| File | Size | Purpose |
|------|------|---------|
| **baseRepository.ts** | 4.8 KB | Generic base class for all repositories |
| **userRepository.ts** | 2.4 KB | Users collection (`/users/{userId}`) |
| **draftRepository.ts** | 5.6 KB | Drafts & picks (`/drafts/{draftId}` + nested picks) |
| **teamRepository.ts** | 5.4 KB | Teams nested under users (`/users/{userId}/teams/{teamId}`) |
| **playerRepository.ts** | 2.7 KB | Players collection (`/players/{playerId}`) |
| **leagueRepository.ts** | 4.3 KB | Tournaments (`/tournaments/{tournamentId}` + dev tournaments) |
| **transactionRepository.ts** | 3.9 KB | Financial transactions (`/transactions/{txId}`) |
| **notificationRepository.ts** | 4.0 KB | Notifications (`/notifications/{notifId}`) |
| **index.ts** | 1.6 KB | Barrel export with explicit named exports |

### Documentation (4 files)

| File | Size | Purpose |
|------|------|---------|
| **README.md** | This file | Quick start guide |
| **MIGRATION_GUIDE.md** | 9.6 KB | Comprehensive migration documentation |
| **MIGRATION_EXAMPLES.ts** | 14 KB | Working code examples for refactoring |
| **PHASE_3_1_STATUS.md** | Detailed | Complete implementation status report |

## Architecture

```
API Routes (pages/api/)
    ↓
Repositories (type-safe CRUD)
    ↓
FirebaseAdapter (retry + circuit breaker)
    ↓
Firebase/Firestore
```

## Key Features

✅ **Type Safety** - All operations return properly typed domain objects
✅ **Automatic Retry** - 3 retries for reads, 2 for writes with exponential backoff
✅ **Circuit Breaker** - Prevents cascading failures
✅ **Structured Logging** - All operations logged for monitoring
✅ **Singleton Pattern** - Efficient memory usage
✅ **Testable** - Can be easily mocked
✅ **Backward Compatible** - No breaking changes

## Repository Methods

### Base Methods (Available on All Repositories)

```typescript
// Read operations
await repo.get(docId): Promise<T | null>
await repo.query(constraints, options): Promise<T[]>
await repo.queryWhere(field, operator, value, options): Promise<T[]>
await repo.exists(docId): Promise<boolean>

// Write operations
await repo.create(data): Promise<string>
await repo.set(docId, data, merge): Promise<void>
await repo.update(docId, updates): Promise<void>
await repo.delete(docId): Promise<void>

// Advanced
adapter = repo.getAdapter(): FirebaseAdapter
```

### Domain-Specific Methods

**UserRepository:**
- `getById(userId)`
- `getByUsername(username)`
- `getByEmail(email)`
- `searchByUsername(prefix)`
- `updateLastActive(userId)`
- `createUser(userId, data)`
- `deleteUser(userId)`

**DraftRepository:**
- `getById(draftId)`
- `getByTournament(tournamentId)`
- `getActive()`
- `getByStatus(status)`
- `updateStatus(draftId, status)`
- `updatePickState(draftId, pickNumber, deadline)`
- `getPicks()` → DraftPicksSubRepository

**DraftPicksSubRepository:**
- `getByDraft(draftId)`
- `getById(draftId, pickId)`
- `add(draftId, data)`
- `update(draftId, pickId, updates)`
- `getByParticipant(draftId, participantIndex)`

**TeamRepository:**
- `userTeams()` → UserTeamsSubRepository

**UserTeamsSubRepository:**
- `getById(userId, teamId)`
- `getByUser(userId)`
- `getByTournament(userId, tournamentId)`
- `getActive(userId)`
- `create(userId, teamId, data)`
- `update(userId, teamId, updates)`
- `updateStatus(userId, teamId, status)`
- `delete(userId, teamId)`
- `exists(userId, teamId)`

**PlayerRepository:**
- `getById(playerId)`
- `getByPosition(position)`
- `getByTeam(team)`
- `getByPositions(positions[])`
- `searchByName(prefix)`
- `getAll(limit)`
- `updatePlayer(playerId, updates)`
- `deletePlayer(playerId)`

**LeagueRepository:**
- `getById(tournamentId)`
- `getActive()`
- `getByStatus(status)`
- `getUpcoming()`
- `getFilling()`
- `getAll(limit)`
- `createTournament(tournamentId, data)`
- `updateStatus(tournamentId, status)`
- `updateEntryCount(tournamentId, count)`
- `devTournaments()` → DevTournamentsRepository

**TransactionRepository:**
- `getById(txId)`
- `getByUser(userId)`
- `getPending(userId)`
- `getCompleted(userId)`
- `getByType(userId, type)`
- `createTransaction(data)`
- `updateStatus(txId, status)`
- `markFailed(txId, reason)`
- `deleteTransaction(txId)`

**NotificationRepository:**
- `getById(notifId)`
- `getUnread(userId)`
- `getByUser(userId, limit)`
- `getByType(userId, type)`
- `createNotification(data)`
- `markAsRead(notifId)`
- `markAllAsRead(userId)` (batch)
- `deleteNotification(notifId)`
- `deleteAllForUser(userId)` (batch)

## Types

Types are defined in the respective repository files:
- `FirestoreUser` - From `types/firestore.ts`
- `FirestoreDraft` - From `types/firestore.ts`
- `FirestorePick` - From `types/firestore.ts`
- `FirestoreTeam` - From `types/firestore.ts`
- `FirestoreTournament` - From `types/firestore.ts`
- `FirestorePlayer` - Defined in playerRepository.ts
- `FirestoreTransaction` - Defined in transactionRepository.ts
- `FirestoreNotification` - Defined in notificationRepository.ts

## Error Handling

All repository operations:
1. Automatically retry on transient failures
2. Log errors through `structuredLogger`
3. Include context in error messages
4. Return `null` for "not found" (vs throwing)
5. Throw on actual errors

Example error log:
```json
{
  "component": "repository",
  "operation": "query",
  "collection": "users",
  "constraintCount": 1,
  "error": "Firestore error message"
}
```

## Transactions

For atomic operations across multiple documents:

```typescript
const adapter = userRepository.getAdapter();

const result = await adapter.runAtomicTransaction(async (transaction) => {
  // Get documents
  const ref1 = adapter.getDocRef('users', userId);
  const snapshot1 = await transaction.get(ref1);

  // Update documents atomically
  transaction.update(ref1, { status: 'active' });

  // Returns result of transaction function
  return { newStatus: 'active' };
});
```

## Batch Operations

For multiple independent operations:

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

## Migration Path

To migrate an API route from direct Firestore calls:

1. **Before:**
```typescript
import { getDocs, query, where, collection } from 'firebase/firestore';

const snapshot = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
```

2. **After:**
```typescript
import { userRepository } from '@/lib/repositories';

const user = await userRepository.getByEmail(email);
```

See **MIGRATION_GUIDE.md** for complete migration documentation.

## Logging

All operations are logged at the repository level:

```
operation: 'get' | 'query' | 'queryWhere' | 'create' | 'set' | 'update' | 'delete' | 'exists'
component: 'repository'
collection: collection name
docId: document ID (for single ops)
constraintCount: number of query constraints
field: field name (for queryWhere)
operator: comparison operator
error: error message (if failed)
```

## Performance

- **Singleton instances** - One per repository, shared across requests
- **Connection pooling** - Handled by Firebase SDK
- **Automatic retry** - Exponential backoff prevents overload
- **Circuit breaker** - Stops cascading failures
- **Batch operations** - Atomic writes to multiple documents

## Testing

Repositories are testable by mocking the adapter:

```typescript
const mockAdapter = {
  getDocument: jest.fn().mockResolvedValue(userData),
};

const repo = new UserRepository('users', mockAdapter);
const user = await repo.getById(userId);
expect(mockAdapter.getDocument).toHaveBeenCalledWith('users', userId);
```

## Contributing

When adding new repositories:

1. Extend `BaseRepository<T>` class
2. Define domain type (or import from `types/firestore.ts`)
3. Implement domain-specific query methods
4. Export singleton function and instance in index.ts
5. Update MIGRATION_GUIDE.md with examples
6. Add type definitions if creating new types

## References

- **Firebase Adapter:** `lib/firebase/firebaseAdapter.ts`
- **Type Definitions:** `types/firestore.ts`, `types/player.ts`
- **Structured Logger:** `lib/structuredLogger.ts`
- **Migration Guide:** `MIGRATION_GUIDE.md`
- **Code Examples:** `MIGRATION_EXAMPLES.ts`
- **Status Report:** `PHASE_3_1_STATUS.md`
