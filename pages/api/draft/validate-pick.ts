/**
 * Draft Pick Validation API
 *
 * Server-side validation for draft picks to ensure:
 * 1. It's the user's turn
 * 2. The player is available
 * 3. Position limits are respected
 * 4. The timer hasn't expired
 * 5. The draft is active
 *
 * POST /api/draft/validate-pick
 *
 * @module pages/api/draft/validate-pick
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
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

interface ValidatePickRequest {
  /** Draft room ID */
  roomId: string;
  /** User ID making the pick */
  userId: string;
  /** Player ID being picked */
  playerId: string;
  /** Current pick number (for validation) */
  pickNumber: number;
}

interface ValidatePickResponse {
  valid: boolean;
  errorCode?: string;
  errorMessage?: string;
  pickInfo?: {
    round: number;
    pickInRound: number;
    participantIndex: number;
  };
}

interface DraftRoom {
  status: string;
  currentPickNumber: number;
  teamCount: number;
  rosterSize: number;
  pickTimeSeconds: number;
  participants: Array<{
    id: string;
    userId?: string;
    draftPosition: number;
  }>;
  startedAt?: { toMillis: () => number };
  timerStartedAt?: { toMillis: () => number };
}

interface PositionLimits {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
}

/**
 * Default position limits for best ball drafts
 * Must match client-side DEFAULT_POSITION_LIMITS in constants/draft.ts
 */
const DEFAULT_POSITION_LIMITS: PositionLimits = {
  QB: 3,
  RB: 6,
  WR: 8,
  TE: 3,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate which participant picks at a given pick number (snake draft)
 */
function getParticipantIndexForPick(pickNumber: number, teamCount: number): number {
  const round = Math.ceil(pickNumber / teamCount);
  const pickInRound = ((pickNumber - 1) % teamCount);

  // Snake draft: odd rounds go 0,1,2..., even rounds go n-1,n-2,...,0
  if (round % 2 === 1) {
    return pickInRound;
  } else {
    return teamCount - 1 - pickInRound;
  }
}

/**
 * Calculate round and pick within round
 */
function getPickInfo(pickNumber: number, teamCount: number): { round: number; pickInRound: number } {
  const round = Math.ceil(pickNumber / teamCount);
  const pickInRound = ((pickNumber - 1) % teamCount) + 1;
  return { round, pickInRound };
}

/**
 * Count positions in existing picks for a participant
 */
function countPositionsForParticipant(
  picks: Array<{ participantIndex: number; playerPosition: string }>,
  participantIndex: number
): PositionLimits {
  const counts: PositionLimits = { QB: 0, RB: 0, WR: 0, TE: 0 };

  for (const pick of picks) {
    if (pick.participantIndex === participantIndex) {
      const pos = pick.playerPosition as keyof PositionLimits;
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
  res: NextApiResponse<ValidatePickResponse>
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['POST'], logger);

    const { roomId, userId, playerId, pickNumber } = req.body as ValidatePickRequest;

    // Validate required fields
    validateBody(req, ['roomId', 'userId', 'playerId', 'pickNumber'], logger);

    logger.info('Validating draft pick', {
      component: 'draft',
      operation: 'validate-pick',
      roomId,
      userId,
      playerId,
      pickNumber,
    });

    if (!db) {
      const response = createErrorResponse(
        ErrorType.CONFIGURATION,
        'Database not available',
        {},
        res.getHeader('X-Request-ID') as string
      );
      return res.status(response.statusCode).json({
        valid: false,
        errorCode: 'DATABASE_ERROR',
        errorMessage: 'Database not available',
      });
    }

    // Get the draft room
    const roomRef = doc(db, 'draftRooms', roomId);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
      return res.status(404).json({
        valid: false,
        errorCode: 'ROOM_NOT_FOUND',
        errorMessage: 'Draft room not found',
      });
    }

    const room = roomDoc.data() as DraftRoom;

    // Check 1: Draft must be active
    if (room.status !== 'active') {
      return res.status(400).json({
        valid: false,
        errorCode: 'DRAFT_NOT_ACTIVE',
        errorMessage: `Draft is not active (current status: ${room.status})`,
      });
    }

    // Check 2: Pick number must match current pick
    if (room.currentPickNumber !== pickNumber) {
      return res.status(400).json({
        valid: false,
        errorCode: 'WRONG_PICK_NUMBER',
        errorMessage: `Expected pick ${room.currentPickNumber}, got ${pickNumber}`,
      });
    }

    // Check 3: Must be user's turn
    const expectedParticipantIndex = getParticipantIndexForPick(pickNumber, room.teamCount);
    const currentParticipant = room.participants[expectedParticipantIndex];

    if (!currentParticipant) {
      return res.status(400).json({
        valid: false,
        errorCode: 'INVALID_PARTICIPANT',
        errorMessage: 'Could not determine current picker',
      });
    }

    // Match user by userId field or id field
    const isUsersTurn =
      currentParticipant.userId === userId || currentParticipant.id === userId;

    if (!isUsersTurn) {
      return res.status(403).json({
        valid: false,
        errorCode: 'NOT_YOUR_TURN',
        errorMessage: 'It is not your turn to pick',
      });
    }

    // Check 4: Timer hasn't expired (with 5 second grace period for latency)
    if (room.timerStartedAt) {
      const timerStartMs = room.timerStartedAt.toMillis();
      const now = Date.now();
      const elapsedSeconds = (now - timerStartMs) / 1000;
      const gracePeriod = 5; // 5 second grace period

      if (elapsedSeconds > room.pickTimeSeconds + gracePeriod) {
        return res.status(400).json({
          valid: false,
          errorCode: 'TIMER_EXPIRED',
          errorMessage: 'Pick timer has expired',
        });
      }
    }

    // Check 5: Player must exist and be available
    const playerRef = doc(db, 'players', playerId);
    const playerDoc = await getDoc(playerRef);

    if (!playerDoc.exists()) {
      return res.status(404).json({
        valid: false,
        errorCode: 'PLAYER_NOT_FOUND',
        errorMessage: 'Player not found',
      });
    }

    const player = playerDoc.data();

    // Check 6: Player hasn't already been picked
    const picksRef = collection(db, 'draftRooms', roomId, 'picks');
    const existingPickQuery = query(picksRef, where('playerId', '==', playerId));
    const existingPicks = await getDocs(existingPickQuery);

    if (!existingPicks.empty) {
      return res.status(400).json({
        valid: false,
        errorCode: 'PLAYER_UNAVAILABLE',
        errorMessage: 'Player has already been drafted',
      });
    }

    // Check 7: Position limit not exceeded
    const allPicksSnapshot = await getDocs(picksRef);
    const allPicks = allPicksSnapshot.docs.map((doc) => doc.data() as { participantIndex: number; playerPosition: string });

    const positionCounts = countPositionsForParticipant(allPicks, expectedParticipantIndex);
    const playerPosition = player.position as keyof PositionLimits;

    // Get user's custom position limits or use defaults
    let positionLimits = DEFAULT_POSITION_LIMITS;
    try {
      const configRef = doc(db, 'users', userId, 'draftSettings', 'autodraft');
      const configDoc = await getDoc(configRef);
      if (configDoc.exists()) {
        const config = configDoc.data();
        if (config.positionLimits) {
          positionLimits = {
            ...DEFAULT_POSITION_LIMITS,
            ...config.positionLimits,
          };
        }
      }
    } catch {
      // Use defaults if config fetch fails
    }

    const currentCount = positionCounts[playerPosition] || 0;
    const limit = positionLimits[playerPosition] || DEFAULT_POSITION_LIMITS[playerPosition];

    if (currentCount >= limit) {
      return res.status(400).json({
        valid: false,
        errorCode: 'POSITION_LIMIT_REACHED',
        errorMessage: `Position limit reached for ${playerPosition} (${currentCount}/${limit})`,
      });
    }

    // All validations passed
    const pickInfo = getPickInfo(pickNumber, room.teamCount);

    logger.info('Pick validated successfully', {
      component: 'draft',
      operation: 'validate-pick',
      roomId,
      userId,
      playerId,
      pickNumber,
    });

    const response = createSuccessResponse(
      {
        valid: true,
        pickInfo: {
          round: pickInfo.round,
          pickInRound: pickInfo.pickInRound,
          participantIndex: expectedParticipantIndex,
        },
      },
      200,
      logger
    );

    return res.status(response.statusCode).json(response.body);
  });
}
