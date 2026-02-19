/**
 * Team Repository
 *
 * Typed repository for teams (nested under users)
 */

import { where } from 'firebase/firestore';

import { getFirebaseAdapter, FirebaseAdapter } from '@/lib/firebase/firebaseAdapter';
import { logger } from '@/lib/structuredLogger';
import { type FirestoreTeam } from '@/types/firestore';

import { BaseRepository } from './baseRepository';

/**
 * Sub-repository for team documents (nested under users)
 * Teams are stored at: /users/{userId}/teams/{teamId}
 */
class UserTeamsSubRepository {
  private adapter: FirebaseAdapter;

  constructor(adapter: FirebaseAdapter) {
    this.adapter = adapter;
  }

  /**
   * Get a team by ID for a specific user
   */
  async getById(userId: string, teamId: string): Promise<FirestoreTeam | null> {
    try {
      return await this.adapter.getDocument<FirestoreTeam>(
        `users/${userId}/teams`,
        teamId
      );
    } catch (error) {
      logger.error('Failed to get user team', error as Error, {
        component: 'repository',
        operation: 'getById',
        userId,
        teamId,
      });
      throw error;
    }
  }

  /**
   * Get all teams for a user
   */
  async getByUser(userId: string): Promise<FirestoreTeam[]> {
    try {
      return await this.adapter.queryDocuments<FirestoreTeam>(
        `users/${userId}/teams`,
        []
      );
    } catch (error) {
      logger.error('Failed to get user teams', error as Error, {
        component: 'repository',
        operation: 'getByUser',
        userId,
      });
      throw error;
    }
  }

  /**
   * Get teams for a user in a specific tournament
   */
  async getByTournament(userId: string, tournamentId: string): Promise<FirestoreTeam[]> {
    try {
      return await this.adapter.queryDocuments<FirestoreTeam>(
        `users/${userId}/teams`,
        [where('tournamentId', '==', tournamentId)]
      );
    } catch (error) {
      logger.error('Failed to get tournament teams', error as Error, {
        component: 'repository',
        operation: 'getByTournament',
        userId,
        tournamentId,
      });
      throw error;
    }
  }

  /**
   * Get active teams for a user
   */
  async getActive(userId: string): Promise<FirestoreTeam[]> {
    try {
      return await this.adapter.queryDocuments<FirestoreTeam>(
        `users/${userId}/teams`,
        [where('status', 'in', ['drafting', 'active'])]
      );
    } catch (error) {
      logger.error('Failed to get active teams', error as Error, {
        component: 'repository',
        operation: 'getActive',
        userId,
      });
      throw error;
    }
  }

  /**
   * Create a new team for a user
   */
  async create(userId: string, teamId: string, data: Omit<FirestoreTeam, 'id'>): Promise<void> {
    try {
      await this.adapter.setDocument<FirestoreTeam>(
        `users/${userId}/teams`,
        teamId,
        { ...data, id: teamId } as FirestoreTeam
      );
    } catch (error) {
      logger.error('Failed to create team', error as Error, {
        component: 'repository',
        operation: 'create',
        userId,
        teamId,
      });
      throw error;
    }
  }

  /**
   * Update a team
   */
  async update(userId: string, teamId: string, updates: Partial<FirestoreTeam>): Promise<void> {
    try {
      await this.adapter.updateDocument(
        `users/${userId}/teams`,
        teamId,
        {
          ...updates,
          updatedAt: new Date(),
        }
      );
    } catch (error) {
      logger.error('Failed to update team', error as Error, {
        component: 'repository',
        operation: 'update',
        userId,
        teamId,
      });
      throw error;
    }
  }

  /**
   * Update team status
   */
  async updateStatus(userId: string, teamId: string, status: string): Promise<void> {
    await this.update(userId, teamId, { status } as Partial<FirestoreTeam>);
  }

  /**
   * Delete a team
   */
  async delete(userId: string, teamId: string): Promise<void> {
    try {
      await this.adapter.deleteDocument(`users/${userId}/teams`, teamId);
    } catch (error) {
      logger.error('Failed to delete team', error as Error, {
        component: 'repository',
        operation: 'delete',
        userId,
        teamId,
      });
      throw error;
    }
  }

  /**
   * Check if team exists
   */
  async exists(userId: string, teamId: string): Promise<boolean> {
    try {
      return await this.adapter.exists(`users/${userId}/teams`, teamId);
    } catch (error) {
      logger.error('Failed to check team existence', error as Error, {
        component: 'repository',
        operation: 'exists',
        userId,
        teamId,
      });
      throw error;
    }
  }
}

/**
 * Main Team Repository - provides access to user teams
 */
class TeamRepository {
  private userTeamsRepository: UserTeamsSubRepository;
  private adapter: FirebaseAdapter;

  constructor(adapter = getFirebaseAdapter()) {
    this.adapter = adapter;
    this.userTeamsRepository = new UserTeamsSubRepository(adapter);
  }

  /**
   * Access user teams
   */
  userTeams(): UserTeamsSubRepository {
    return this.userTeamsRepository;
  }
}

// Singleton instance
let teamRepositoryInstance: TeamRepository | null = null;

/**
 * Get the singleton TeamRepository instance
 */
export function getTeamRepository(): TeamRepository {
  if (!teamRepositoryInstance) {
    teamRepositoryInstance = new TeamRepository();
  }
  return teamRepositoryInstance;
}

// Default export
export const teamRepository = getTeamRepository();
