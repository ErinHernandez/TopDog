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

        // Get all picks for position counting
        const allPicksSnapshot = await getDocs(picksRef);
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
