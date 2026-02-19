/**
 * Ownership Verification for Export API
 *
 * Verifies that users can only export data they own or have access to.
 * Prevents IDOR (Insecure Direct Object Reference) vulnerabilities.
 *
 * @module lib/export/ownershipVerification
 */

import { doc, getDoc } from 'firebase/firestore';

import { db } from '../firebase';
import { serverLogger } from '../logger/serverLogger';

// ============================================================================
// TYPES
// ============================================================================

interface TournamentData {
  /** Tournament visibility: 'public' | 'private' | 'invite-only' */
  visibility?: string;
  /** Creator user ID */
  creatorId?: string;
  /** Organizer user ID (may differ from creator) */
  organizerId?: string;
  /** List of participant user IDs */
  participantIds?: string[];
  /** List of invited user IDs (for invite-only) */
  invitedUserIds?: string[];
  /** Whether registration is open */
  registrationOpen?: boolean;
  /** Tournament status */
  status?: string;
}

// ============================================================================
// DRAFT OWNERSHIP
// ============================================================================

/**
 * Verify that a user owns or is a participant in a draft
 *
 * @param draftId - Draft room ID
 * @param userId - Authenticated user ID
 * @returns True if user owns or participates in the draft
 */
export async function verifyDraftOwnership(
  draftId: string,
  userId: string
): Promise<boolean> {
  if (!db) {
    serverLogger.error('Firebase db not initialized', new Error('Database not available'));
    return false;
  }

  try {
    const draftRef = doc(db, 'draftRooms', draftId);
    const draftDoc = await getDoc(draftRef);

    if (!draftDoc.exists()) {
      serverLogger.debug('Draft not found for ownership check', {
        component: 'ownershipVerification',
        draftId,
        userId,
      });
      return false;
    }

    const data = draftDoc.data();
    const participants = data.participants || [];

    // Check if user is in participants array
    // Participants can have userId, id, or participantId field depending on context
    const isParticipant = participants.some(
      (p: { userId?: string; id?: string; participantId?: string }) =>
        p.userId === userId ||
        p.id === userId ||
        p.participantId === userId
    );

    if (!isParticipant) {
      serverLogger.debug('User not a participant in draft', {
        component: 'ownershipVerification',
        draftId,
        userId,
        participantCount: participants.length,
      });
    }

    return isParticipant;
  } catch (error) {
    serverLogger.error('Error verifying draft ownership', error as Error, {
      component: 'ownershipVerification',
      draftId,
      userId,
    });
    return false; // Fail closed - deny access on error
  }
}

// ============================================================================
// USER OWNERSHIP
// ============================================================================

/**
 * Verify that a user is requesting their own data
 *
 * @param requestedUserId - User ID from request
 * @param authenticatedUserId - Authenticated user ID
 * @returns True if user IDs match
 */
export async function verifyUserOwnership(
  requestedUserId: string,
  authenticatedUserId: string
): Promise<boolean> {
  const matches = requestedUserId === authenticatedUserId;

  if (!matches) {
    serverLogger.warn('User ownership mismatch', null, {
      requestedUserId,
      authenticatedUserId,
    });
  }

  return matches;
}

// ============================================================================
// TOURNAMENT ACCESS
// ============================================================================

/**
 * Verify that a user has access to a tournament
 *
 * Access rules:
 * - Public tournaments: Everyone can view
 * - Private tournaments: Only participants, creator, or organizer
 * - Invite-only tournaments: Only invited users, participants, creator, or organizer
 *
 * @param tournamentId - Tournament ID
 * @param userId - Authenticated user ID
 * @returns True if user has access to the tournament
 */
export async function verifyTournamentAccess(
  tournamentId: string,
  userId: string
): Promise<boolean> {
  if (!db) {
    serverLogger.error('Firebase db not initialized', new Error('Database not available'));
    return false;
  }

  try {
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const tournamentDoc = await getDoc(tournamentRef);

    if (!tournamentDoc.exists()) {
      serverLogger.debug('Tournament not found for access check', {
        component: 'ownershipVerification',
        tournamentId,
        userId,
      });
      // Tournament doesn't exist - deny access
      return false;
    }

    const data = tournamentDoc.data() as TournamentData;
    const visibility = data.visibility || 'public';

    // Public tournaments are accessible to everyone
    if (visibility === 'public') {
      return true;
    }

    // Check if user is the creator or organizer
    if (data.creatorId === userId || data.organizerId === userId) {
      return true;
    }

    // Check if user is a participant
    const participantIds = data.participantIds || [];
    if (participantIds.includes(userId)) {
      return true;
    }

    // For invite-only tournaments, check if user is invited
    if (visibility === 'invite-only') {
      const invitedUserIds = data.invitedUserIds || [];
      if (invitedUserIds.includes(userId)) {
        return true;
      }
    }

    serverLogger.debug('User denied tournament access', {
      component: 'ownershipVerification',
      tournamentId,
      userId,
      visibility,
    });

    return false;
  } catch (error) {
    serverLogger.error('Error verifying tournament access', error as Error, {
      component: 'ownershipVerification',
      tournamentId,
      userId,
    });
    return false; // Fail closed - deny access on error
  }
}

// ============================================================================
// ADMIN ACCESS
// ============================================================================

/**
 * Verify that a user has admin access
 *
 * Note: This should be used in conjunction with Firebase custom claims
 * for production. This is a fallback check.
 *
 * @param userId - User ID to check
 * @returns True if user is an admin
 */
export async function verifyAdminAccess(userId: string): Promise<boolean> {
  if (!db) {
    serverLogger.error('Firebase db not initialized', new Error('Database not available'));
    return false;
  }

  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return false;
    }

    const data = userDoc.data();
    const isAdmin = data.isAdmin === true || data.role === 'admin';

    if (!isAdmin) {
      serverLogger.debug('User is not an admin', {
        component: 'ownershipVerification',
        userId,
      });
    }

    return isAdmin;
  } catch (error) {
    serverLogger.error('Error verifying admin access', error as Error, {
      component: 'ownershipVerification',
      userId,
    });
    return false; // Fail closed - deny access on error
  }
}
