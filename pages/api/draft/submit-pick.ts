/**
 * Draft Pick Submission API
 *
 * Server-side pick submission with validation and atomic updates.
 * This is the authoritative endpoint for making draft picks.
 *
 * POST /api/draft/submit-pick
 *
 * @module pages/api/draft/submit-pick
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  limit,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import {
  withErrorHandling,
  validateMethod,
  validateBody,
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from '../../../lib/apiErrorHandler';
import { locationIntegrityService } from '../../../lib/integrity';

// ============================================================================
// TYPES
// ============================================================================

interface SubmitPickRequest {
  /** Draft room ID */
  roomId: string;
  /** User ID making the pick */
  userId: string;
  /** Player ID being picked */
  playerId: string;
  /** Whether this is an autopick */
  isAutopick?: boolean;
  /** Source of the pick selection */
  source?: 'manual' | 'queue' | 'custom_ranking' | 'adp';
  /** Location data (optional, captured client-side) */
  location?: {
    lat: number;
    lng: number;
    accuracy: number;
  };
  /** Device ID for tracking */
  deviceId?: string;
}

interface SubmitPickResponse {
  success: boolean;
  pick?: {
    id: string;
    pickNumber: number;
    round: number;
    pickInRound: number;
    playerId: string;
    playerName: string;
    playerPosition: string;
    playerTeam: string;
  };
  error?: {
    code: string;
    message: string;
  };
  draftComplete?: boolean;
}

interface DraftRoom {
  status: string;
  currentPickNumber: number;
  teamCount: number;
  rosterSize: number;
  participants: Array<{
    id: string;
    userId?: string;
    draftPosition: number;
  }>;
}

interface PositionCounts {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getParticipantIndexForPick(pickNumber: number, teamCount: number): number {
  const round = Math.ceil(pickNumber / teamCount);
  const pickInRound = (pickNumber - 1) % teamCount;
  if (round % 2 === 1) {
    return pickInRound;
  } else {
    return teamCount - 1 - pickInRound;
  }
}

function getPickInfo(
  pickNumber: number,
  teamCount: number
): { round: number; pickInRound: number } {
  const round = Math.ceil(pickNumber / teamCount);
  const pickInRound = ((pickNumber - 1) % teamCount) + 1;
  return { round, pickInRound };
}

function countPositionsForParticipant(
  picks: Array<{ participantIndex: number; playerPosition: string }>,
  participantIndex: number
): PositionCounts {
  const counts: PositionCounts = { QB: 0, RB: 0, WR: 0, TE: 0 };
  for (const pick of picks) {
    if (pick.participantIndex === participantIndex) {
      const pos = pick.playerPosition as keyof PositionCounts;
      if (pos in counts) {
        counts[pos]++;
      }
    }
  }
  return counts;
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SubmitPickResponse>
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['POST'], logger);

    const {
      roomId,
      userId,
      playerId,
      isAutopick = false,
      source = 'manual',
      location,
      deviceId,
    } = req.body as SubmitPickRequest;

    validateBody(req, ['roomId', 'userId', 'playerId'], logger);

    logger.info('Submitting draft pick', {
      component: 'draft',
      operation: 'submit-pick',
      roomId,
      userId,
      playerId,
      isAutopick,
      source,
    });

    if (!db) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database not available',
        },
      });
    }

    try {
      // Use a transaction for atomic pick submission
      const result = await runTransaction(db, async (transaction) => {
        // Get room data
        const roomRef = doc(db!, 'draftRooms', roomId);
        const roomDoc = await transaction.get(roomRef);

        if (!roomDoc.exists()) {
          throw new Error('ROOM_NOT_FOUND:Draft room not found');
        }

        const room = roomDoc.data() as DraftRoom;

        // Validation 1: Draft must be active
        if (room.status !== 'active') {
          throw new Error(`DRAFT_NOT_ACTIVE:Draft is not active (${room.status})`);
        }

        const currentPickNumber = room.currentPickNumber;
        const totalPicks = room.teamCount * room.rosterSize;

        // Validation 2: Draft not complete
        if (currentPickNumber > totalPicks) {
          throw new Error('DRAFT_COMPLETE:Draft is already complete');
        }

        // Validation 3: User's turn
        const participantIndex = getParticipantIndexForPick(currentPickNumber, room.teamCount);
        const currentParticipant = room.participants[participantIndex];

        if (!currentParticipant) {
          throw new Error('INVALID_STATE:Could not determine current picker');
        }

        const isUsersTurn =
          currentParticipant.userId === userId || currentParticipant.id === userId;

        if (!isUsersTurn) {
          throw new Error('NOT_YOUR_TURN:It is not your turn to pick');
        }

        // Get player data
        const playerRef = doc(db!, 'players', playerId);
        const playerDoc = await transaction.get(playerRef);

        if (!playerDoc.exists()) {
          throw new Error('PLAYER_NOT_FOUND:Player not found');
        }

        const player = playerDoc.data();

        // Check if player already picked (via query outside transaction, then verify in transaction)
        const picksRef = collection(db!, 'draftRooms', roomId, 'picks');
        const existingPicksSnapshot = await getDocs(
          query(picksRef, where('playerId', '==', playerId))
        );

        if (!existingPicksSnapshot.empty) {
          throw new Error('PLAYER_UNAVAILABLE:Player has already been drafted');
        }

        // Get all picks for position counting (limited to max draft size for safety)
        const allPicksQuery = query(picksRef, limit(500));
        const allPicksSnapshot = await getDocs(allPicksQuery);
        const allPicks = allPicksSnapshot.docs.map((d) => d.data() as { participantIndex: number; playerPosition: string });
        const positionCounts = countPositionsForParticipant(allPicks, participantIndex);

        const { round, pickInRound } = getPickInfo(currentPickNumber, room.teamCount);

        // Create the pick document (will be added after transaction)
        const pickData = {
          pickNumber: currentPickNumber,
          round,
          pickInRound,
          playerId,
          playerName: player.name || player.displayName || 'Unknown',
          playerPosition: player.position,
          playerTeam: player.team || player.nflTeam || 'FA',
          participantId: currentParticipant.id,
          participantIndex,
          timestamp: serverTimestamp(),
          isAutopick,
          source,
          rosterAtPick: {
            ...positionCounts,
            [player.position]: (positionCounts[player.position as keyof PositionCounts] || 0) + 1,
          },
        };

        // Check if draft is complete after this pick
        const isLastPick = currentPickNumber >= totalPicks;

        // Update room
        const roomUpdates: Record<string, unknown> = {
          currentPickNumber: currentPickNumber + 1,
          timerStartedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        if (isLastPick) {
          roomUpdates.status = 'complete';
          roomUpdates.completedAt = serverTimestamp();
        }

        transaction.update(roomRef, roomUpdates);

        return {
          pickData,
          currentPickNumber,
          round,
          pickInRound,
          player,
          participantIndex,
          isLastPick,
        };
      });

      // Add the pick document after successful transaction
      const picksRef = collection(db, 'draftRooms', roomId, 'picks');
      const pickDocRef = await addDoc(picksRef, result.pickData);

      logger.info('Pick submitted successfully', {
        component: 'draft',
        operation: 'submit-pick',
        roomId,
        userId,
        playerId,
        pickNumber: result.currentPickNumber,
        pickId: pickDocRef.id,
      });

      // Record location data (non-blocking, don't fail pick if location fails)
      if (location && deviceId) {
        try {
          // Get IP address from request headers
          const ipAddress = 
            (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
            (req.headers['x-real-ip'] as string) ||
            req.socket?.remoteAddress ||
            'UNKNOWN';

          await locationIntegrityService.recordPickLocation({
            draftId: roomId,
            pickNumber: result.currentPickNumber,
            userId,
            location: {
              lat: location.lat,
              lng: location.lng,
              accuracy: location.accuracy,
              ipAddress,
            },
            deviceId,
          });
        } catch (locationError) {
          // Log but don't fail the pick
          logger.error('Failed to record pick location', locationError as Error, {
            component: 'draft',
            operation: 'submit-pick',
            roomId,
            userId,
            pickNumber: result.currentPickNumber,
          });
        }
      }

      // Mark draft as completed for collusion analysis if this was the last pick
      // NOTE: This is completely non-blocking. Draft completion analysis happens
      // asynchronously after the draft has already completed. We NEVER block drafts.
      if (result.isLastPick) {
        try {
          const { collusionFlagService } = await import('../../../lib/integrity/CollusionFlagService');
          // This triggers post-draft analysis asynchronously - does not block
          collusionFlagService.markDraftCompleted(roomId).catch((error) => {
            // Log but don't fail - draft is already complete
            logger.error('Failed to mark draft as completed for collusion analysis', error as Error, {
              component: 'draft',
              operation: 'submit-pick',
              roomId,
            });
          });
        } catch (error) {
          // Log but don't fail the pick - draft completion is not dependent on analysis
          logger.error('Failed to trigger collusion analysis', error as Error, {
            component: 'draft',
            operation: 'submit-pick',
            roomId,
          });
        }
      }

      // Clean up draft location state if draft is complete
      if (result.isLastPick) {
        try {
          await locationIntegrityService.cleanupDraftState(roomId);
        } catch (cleanupError) {
          // Log but don't fail the response
          logger.error('Failed to cleanup draft location state', cleanupError as Error, {
            component: 'draft',
            operation: 'submit-pick',
            roomId,
          });
        }
      }

      return res.status(200).json({
        success: true,
        pick: {
          id: pickDocRef.id,
          pickNumber: result.currentPickNumber,
          round: result.round,
          pickInRound: result.pickInRound,
          playerId,
          playerName: result.player.name || result.player.displayName || 'Unknown',
          playerPosition: result.player.position,
          playerTeam: result.player.team || result.player.nflTeam || 'FA',
        },
        draftComplete: result.isLastPick,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const [code, message] = errorMessage.includes(':')
        ? errorMessage.split(':')
        : ['UNKNOWN_ERROR', errorMessage];

      logger.error('Pick submission failed', error as Error, {
        component: 'draft',
        operation: 'submit-pick',
        roomId,
        userId,
        playerId,
        errorCode: code,
      });

      // Map error codes to appropriate HTTP status codes
      const statusMap: Record<string, number> = {
        ROOM_NOT_FOUND: 404,
        PLAYER_NOT_FOUND: 404,
        DRAFT_NOT_ACTIVE: 400,
        DRAFT_COMPLETE: 400,
        NOT_YOUR_TURN: 403,
        PLAYER_UNAVAILABLE: 400,
        INVALID_STATE: 500,
      };

      return res.status(statusMap[code] || 500).json({
        success: false,
        error: {
          code,
          message,
        },
      });
    }
  });
}
