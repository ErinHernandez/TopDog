/**
 * User Repository
 *
 * Typed repository for users collection with domain-specific queries
 */

import { where, Timestamp } from 'firebase/firestore';

import { getFirebaseAdapter } from '@/lib/firebase/firebaseAdapter';
import { type FirestoreUser } from '@/types/firestore';

import { BaseRepository } from './baseRepository';

/**
 * Repository for user documents (/users/{userId})
 */
class UserRepository extends BaseRepository<FirestoreUser> {
  constructor() {
    super('users', getFirebaseAdapter());
  }

  /**
   * Get a user by ID
   */
  async getById(userId: string): Promise<FirestoreUser | null> {
    return this.get(userId);
  }

  /**
   * Get user by username
   */
  async getByUsername(username: string): Promise<FirestoreUser | null> {
    const results = await this.queryWhere('username', '==', username);
    return (results.length > 0 ? results[0] : undefined) ?? null;
  }

  /**
   * Get user by email
   */
  async getByEmail(email: string): Promise<FirestoreUser | null> {
    const results = await this.queryWhere('email', '==', email);
    return (results.length > 0 ? results[0] : undefined) ?? null;
  }

  /**
   * Search users by username pattern
   */
  async searchByUsername(usernamePrefix: string): Promise<FirestoreUser[]> {
    const upperBound = usernamePrefix.slice(0, -1) +
      String.fromCharCode(usernamePrefix.charCodeAt(usernamePrefix.length - 1) + 1);

    return this.query(
      [
        where('username', '>=', usernamePrefix),
        where('username', '<', upperBound),
      ],
      { limitCount: 100 }
    );
  }

  /**
   * Update user's last activity timestamp
   */
  async updateLastActive(userId: string): Promise<void> {
    await this.update(userId, {
      lastActiveAt: Timestamp.now(),
    } as Partial<FirestoreUser>);
  }

  /**
   * Create a new user
   */
  async createUser(userId: string, data: Omit<FirestoreUser, 'id'>): Promise<void> {
    await this.set(userId, { ...data, id: userId } as FirestoreUser);
  }

  /**
   * Delete a user
   */
  async deleteUser(userId: string): Promise<void> {
    await this.delete(userId);
  }
}

// Singleton instance
let userRepositoryInstance: UserRepository | null = null;

/**
 * Get the singleton UserRepository instance
 */
export function getUserRepository(): UserRepository {
  if (!userRepositoryInstance) {
    userRepositoryInstance = new UserRepository();
  }
  return userRepositoryInstance;
}

// Default export
export const userRepository = getUserRepository();
