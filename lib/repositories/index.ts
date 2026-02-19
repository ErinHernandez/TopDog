/**
 * Repository Pattern - Barrel Export
 *
 * Central export for all typed repositories.
 * Provides type-safe access to domain repositories with proper CRUD operations.
 *
 * Usage:
 *   import { userRepository, draftRepository, teamRepository } from '@/lib/repositories';
 *
 *   // Get a user
 *   const user = await userRepository.getById(userId);
 *
 *   // Query teams
 *   const teams = await teamRepository.userTeams().getByUser(userId);
 *
 *   // Create a transaction
 *   const txId = await transactionRepository.createTransaction({...});
 */

// Base repository (for type definitions only)
export { BaseRepository } from './baseRepository';
export type { QueryOptions } from '@/lib/firebase/firebaseAdapter';

// User repository
export {
  getUserRepository,
  userRepository,
} from './userRepository';

// Draft repository
export {
  getDraftRepository,
  draftRepository,
} from './draftRepository';

// Team repository
export {
  getTeamRepository,
  teamRepository,
} from './teamRepository';

// Player repository
export {
  getPlayerRepository,
  playerRepository,
  type FirestorePlayer,
} from './playerRepository';

// League/Tournament repository
export {
  getLeagueRepository,
  leagueRepository,
} from './leagueRepository';

// Transaction repository
export {
  getTransactionRepository,
  transactionRepository,
  type FirestoreTransaction,
} from './transactionRepository';

// Notification repository
export {
  getNotificationRepository,
  notificationRepository,
  type FirestoreNotification,
} from './notificationRepository';
