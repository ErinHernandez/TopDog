/**
 * Repository Pattern Migration Examples
 *
 * This file contains before/after code examples showing how to refactor
 * API routes to use repositories instead of direct Firestore calls.
 *
 * These are reference implementations - copy the patterns to your API routes.
 */

import { where } from 'firebase/firestore';

import {
  userRepository,
  draftRepository,
  teamRepository,
  playerRepository,
  transactionRepository,
  leagueRepository,
  notificationRepository,
} from './index';

// ============================================================================
// EXAMPLE 1: Draft Pick Submission - Refactored
// ============================================================================

/**
 * Refactored version of pages/api/draft/submit-pick.ts using repositories
 *
 * Key changes:
 * - Replace direct getDocs, getDoc, addDoc with repository methods
 * - Use adapter's runAtomicTransaction for complex operations
 * - Eliminate direct Firestore imports
 */
export async function exampleRefactorSubmitPick(
  roomId: string,
  userId: string,
  playerId: string
) {
  const picks = draftRepository.getPicks();
  const adapter = draftRepository.getAdapter();

  // Use transaction for atomic pick submission
  const result = await adapter.runAtomicTransaction(async (transaction) => {
    // Get room data
    const roomRef = adapter.getDocRef('draftRooms', roomId);
    const roomDoc = await transaction.get(roomRef);

    if (!roomDoc) {
      throw new Error('ROOM_NOT_FOUND:Draft room not found');
    }

    const room = roomDoc as any; // Type cast from transaction snapshot

    // Validation
    if (room.status !== 'active') {
      throw new Error(`DRAFT_NOT_ACTIVE:Draft is not active (${room.status})`);
    }

    const currentPickNumber = room.currentPickNumber;
    const totalPicks = room.teamCount * room.rosterSize;

    if (currentPickNumber > totalPicks) {
      throw new Error('DRAFT_COMPLETE:Draft is already complete');
    }

    // Get player data
    const playerRef = adapter.getDocRef('players', playerId);
    const playerDoc = await transaction.get(playerRef);

    if (!playerDoc) {
      throw new Error('PLAYER_NOT_FOUND:Player not found');
    }

    const player = playerDoc as any;

    // Get all picks (using repository method, but within transaction context)
    // Note: In real transaction, you'd fetch this before the transaction
    // or use a more sophisticated approach

    // Return data for post-transaction processing
    return {
      room,
      player,
      pickNumber: currentPickNumber,
      totalPicks,
    };
  });

  // After transaction succeeds, add the pick document
  const pickId = await picks.add(roomId, {
    pickNumber: result.pickNumber,
    playerId,
    participantIndex: 0, // Calculate based on pick number
    userId,
    timestamp: new Date() as any,
    wasAutopick: false,
    timeUsedSeconds: 30,
    roundNumber: 0,
    pickInRound: 0,
    draftType: 'fast',
    tournamentId: '',
  });

  return { pickId, pickNumber: result.pickNumber };
}

// ============================================================================
// EXAMPLE 2: User Signup - Refactored
// ============================================================================

/**
 * Refactored version of pages/api/auth/signup.ts using repositories
 *
 * Key changes:
 * - Replace getDocs username check with repository method
 * - Use repository for user creation
 * - Eliminate direct Firestore imports
 */
export async function exampleRefactorSignup(
  uid: string,
  username: string,
  email: string,
  countryCode: string
) {
  // Check if username already exists (was: getDocs(query(where('username', '==', ...))))
  const existingUser = await userRepository.getByUsername(username);

  if (existingUser) {
    throw new Error('USERNAME_TAKEN:Username is already taken');
  }

  // Use repository to create user (was: direct setDoc)
  await userRepository.createUser(uid, {
    username,
    email,
    defaultAutopickEnabled: false,
    queuedPlayers: [],
    totalDrafts: 0,
    totalTeams: 0,
    createdAt: new Date() as any,
    lastActiveAt: new Date() as any,
  });

  return { success: true, uid, username };
}

// ============================================================================
// EXAMPLE 3: Get User Teams - Refactored
// ============================================================================

/**
 * Refactored version using team repository
 *
 * Before: Direct getDocs on users/{userId}/teams collection
 * After: Use repository method
 */
export async function exampleGetUserTeams(userId: string) {
  // Was: getDocs(query(collection(db, 'users', userId, 'teams')))
  // Now:
  const teams = await teamRepository.userTeams().getByUser(userId);

  return teams;
}

// ============================================================================
// EXAMPLE 4: Get Active Teams - Refactored
// ============================================================================

/**
 * Filter teams by status
 *
 * Before: Direct getDocs with where('status', 'in', [...])
 * After: Use repository method
 */
export async function exampleGetActiveTeams(userId: string) {
  // Was: getDocs(query(collection(...), where('status', 'in', ['drafting', 'active'])))
  // Now:
  const teams = await teamRepository.userTeams().getActive(userId);

  return teams;
}

// ============================================================================
// EXAMPLE 5: Get Transactions for User - Refactored
// ============================================================================

/**
 * Refactored transaction queries
 *
 * Before: Direct getDocs with multiple where clauses
 * After: Use repository methods
 */
export async function exampleGetUserTransactions(userId: string) {
  // Get all transactions
  const all = await transactionRepository.getByUser(userId);

  // Get pending transactions
  const pending = await transactionRepository.getPending(userId);

  // Get completed transactions
  const completed = await transactionRepository.getCompleted(userId);

  // Get deposits only
  const deposits = await transactionRepository.getByType(userId, 'deposit');

  return { all, pending, completed, deposits };
}

// ============================================================================
// EXAMPLE 6: Create and Update - Refactored
// ============================================================================

/**
 * Refactored create and update operations
 *
 * Before: Direct addDoc, setDoc, updateDoc calls
 * After: Use repository methods
 */
export async function exampleCreateAndUpdateTransaction(userId: string, amount: number) {
  // Create (was: addDoc)
  const txId = await transactionRepository.createTransaction({
    userId,
    type: 'deposit',
    status: 'pending',
    amount,
    currency: 'USD',
    createdAt: new Date() as any,
    updatedAt: new Date() as any,
  });

  // Update status later (was: updateDoc)
  await transactionRepository.updateStatus(txId, 'completed');

  return txId;
}

// ============================================================================
// EXAMPLE 7: Batch Operations - Refactored
// ============================================================================

/**
 * Refactored batch operations using adapter
 *
 * Before: Direct writeBatch operations
 * After: Use adapter's batchWrite through repository
 */
export async function exampleBatchMarkNotificationsRead(
  notificationIds: string[]
) {
  const adapter = notificationRepository.getAdapter();

  const operations = notificationIds.map(notifId => ({
    type: 'update' as const,
    collection: 'notifications',
    docId: notifId,
    data: {
      read: true,
      readAt: new Date(),
    },
  }));

  await adapter.batchWrite(operations);
}

// ============================================================================
// EXAMPLE 8: Search/Query Pattern - Refactored
// ============================================================================

/**
 * Refactored complex queries
 *
 * Before: Direct query with multiple where clauses
 * After: Use repository methods or pass constraints
 */
export async function exampleSearchAndFilter() {
  // Search users by username prefix
  const userMatches = await userRepository.searchByUsername('jo');

  // Get players by multiple positions
  const players = await playerRepository.getByPositions(['QB', 'RB']);

  // Get upcoming tournaments with ordering
  const tournaments = await leagueRepository.getUpcoming();

  // Custom query with constraints
  const allTransactions = await transactionRepository.query(
    [
      where('type', '==', 'withdrawal'),
      where('status', '==', 'pending'),
    ],
    {
      orderByField: 'createdAt',
      orderDirection: 'desc',
      limitCount: 50,
    }
  );

  return { userMatches, players, tournaments, allTransactions };
}

// ============================================================================
// EXAMPLE 9: Complex Transaction - Refactored
// ============================================================================

/**
 * Refactored multi-step transaction
 *
 * Before: Direct runTransaction with multiple doc operations
 * After: Use adapter's runAtomicTransaction through repository
 */
export async function exampleComplexTransaction(
  userId: string,
  amount: number,
  tournamentId: string
) {
  const adapter = userRepository.getAdapter();

  const result = await adapter.runAtomicTransaction(async (transaction) => {
    // Get user
    const userRef = adapter.getDocRef('users', userId);
    const userSnapshot = await transaction.get(userRef);

    if (!userSnapshot) {
      throw new Error('User not found');
    }

    const user = userSnapshot as any;

    // Check balance
    if (user.balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Get tournament
    const tourneyRef = adapter.getDocRef('tournaments', tournamentId);
    const tourneySnapshot = await transaction.get(tourneyRef);

    if (!tourneySnapshot) {
      throw new Error('Tournament not found');
    }

    const tourney = tourneySnapshot as any;

    // Check availability
    if (tourney.currentEntries >= tourney.maxEntries) {
      throw new Error('Tournament full');
    }

    // Update user
    transaction.update(userRef, {
      balance: user.balance - amount,
      updatedAt: new Date(),
    });

    // Update tournament
    transaction.update(tourneyRef, {
      currentEntries: tourney.currentEntries + 1,
      updatedAt: new Date(),
    });

    return {
      newBalance: user.balance - amount,
      newEntries: tourney.currentEntries + 1,
    };
  });

  return result;
}

// ============================================================================
// EXAMPLE 10: Error Handling Pattern - Refactored
// ============================================================================

/**
 * Proper error handling with repositories
 *
 * Before: Try/catch with direct Firestore errors
 * After: Repository methods throw typed errors with logging
 */
export async function exampleErrorHandling(userId: string) {
  try {
    // This will return null if not found (no exception)
    const user = await userRepository.getById(userId);

    if (!user) {
      console.log('User not found');
      return null;
    }

    // This will throw if operation fails (with retry logic applied)
    const teams = await teamRepository.userTeams().getByUser(userId);

    return teams;
  } catch (error) {
    // Repository operations are already logged
    // Errors are retried automatically based on FirebaseAdapter config
    if (error instanceof Error) {
      console.error('Operation failed:', error.message);
    }
    throw error;
  }
}

// ============================================================================
// MIGRATION CHECKLIST
// ============================================================================

/**
 * For each API route migration, follow this checklist:
 *
 * [ ] Step 1: Import repositories at top of file
 *     import { userRepository, draftRepository } from '@/lib/repositories';
 *
 * [ ] Step 2: Remove direct Firebase imports
 *     - Delete: import { getDoc, getDocs, setDoc, ... } from 'firebase/firestore'
 *     - Keep: import { where, orderBy, ... } (for query constraints)
 *
 * [ ] Step 3: Replace all data access
 *     - getDocs(query(...)) → repository.query(...) or repository.queryWhere(...)
 *     - getDoc(doc(...)) → repository.get(docId)
 *     - addDoc(...) → repository.create(...) or repository.createXyz(...)
 *     - setDoc(...) → repository.set(docId, data)
 *     - updateDoc(...) → repository.update(docId, updates)
 *     - deleteDoc(...) → repository.delete(docId)
 *
 * [ ] Step 4: Update transactions
 *     - runTransaction(db, ...) → adapter.runAtomicTransaction(...)
 *
 * [ ] Step 5: Update batch operations
 *     - writeBatch(db) → adapter.batchWrite([...])
 *
 * [ ] Step 6: Test the API route
 *     - Same request/response behavior
 *     - Same error handling
 *     - Logging shows repository operations
 *
 * [ ] Step 7: Verify types
 *     - No "any" types where possible
 *     - All return values are properly typed
 *     - TypeScript compilation successful
 *
 * [ ] Step 8: Update monitoring/alerts
 *     - Component in logs should be "repository"
 *     - Operation in logs should be "get", "query", "create", etc.
 */
