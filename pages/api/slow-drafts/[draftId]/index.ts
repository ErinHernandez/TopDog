/**
 * Single Slow Draft Details API
 *
 * GET /api/slow-drafts/[draftId]
 *
 * Returns detailed information for a specific slow draft including
 * all picks, position tracking, and top available players.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import {
  withErrorHandling,
  validateMethod,
  createSuccessResponse,
} from '../../../../lib/apiErrorHandler';

// ============================================================================
// TYPES
// ============================================================================

interface Position {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
}

interface DraftPlayer {
  id: string;
  name: string;
  position: 'QB' | 'RB' | 'WR' | 'TE';
  team: string;
  adp: number;
  projectedPoints?: number;
}

interface MyPick {
  slotIndex: number;
  player: DraftPlayer;
  pickNumber: number;
  round: number;
  pickInRound: number;
}

interface RecentPick {
  pickNumber: number;
  round: number;
  pickInRound: number;
  player: DraftPlayer;
  drafter: {
    id: string;
    name: string;
    isCurrentUser: boolean;
  };
  timestamp: number;
}

interface PositionNeed {
  position: 'QB' | 'RB' | 'WR' | 'TE';
  current: number;
  minimum: number;
  recommended: number;
  urgency: 'critical' | 'warning' | 'good' | 'neutral';
  needed: number;
}

interface TopAvailable {
  QB: DraftPlayer[];
  RB: DraftPlayer[];
  WR: DraftPlayer[];
  TE: DraftPlayer[];
}

const POSITION_REQUIREMENTS = {
  QB: { min: 1, recommended: 2 },
  RB: { min: 3, recommended: 6 },
  WR: { min: 3, recommended: 6 },
  TE: { min: 1, recommended: 2 },
};

// ============================================================================
// HELPERS
// ============================================================================

function calculatePicksAway(
  currentPick: number,
  userPosition: number,
  teamCount: number
): number {
  const currentRound = Math.ceil(currentPick / teamCount);
  const pickInRound = ((currentPick - 1) % teamCount) + 1;
  const isOddRound = currentRound % 2 === 1;

  const userPickInRound = isOddRound ? userPosition : teamCount - userPosition + 1;

  if (pickInRound < userPickInRound) {
    return userPickInRound - pickInRound;
  } else if (pickInRound === userPickInRound) {
    return 0;
  } else {
    const nextRoundUserPick = !isOddRound ? userPosition : teamCount - userPosition + 1;
    return (teamCount - pickInRound) + nextRoundUserPick;
  }
}

function calculatePositionCounts(picks: MyPick[]): Position {
  const counts: Position = { QB: 0, RB: 0, WR: 0, TE: 0 };
  picks.forEach((pick) => {
    if (pick.player?.position && pick.player.position in counts) {
      counts[pick.player.position as keyof Position]++;
    }
  });
  return counts;
}

function calculatePositionNeeds(counts: Position, currentRound: number): PositionNeed[] {
  const needs: PositionNeed[] = [];
  const positions: Array<'QB' | 'RB' | 'WR' | 'TE'> = ['QB', 'RB', 'WR', 'TE'];

  positions.forEach((position) => {
    const req = POSITION_REQUIREMENTS[position];
    const current = counts[position];
    const needed = Math.max(0, req.min - current);

    let urgency: PositionNeed['urgency'] = 'neutral';
    if (needed > 0 && currentRound >= 12) {
      urgency = 'critical';
    } else if (needed > 0 && currentRound >= 8) {
      urgency = 'warning';
    } else if (current >= req.min) {
      urgency = 'good';
    }

    needs.push({
      position,
      current,
      minimum: req.min,
      recommended: req.recommended,
      urgency,
      needed,
    });
  });

  return needs;
}

function calculateTimeLeftSeconds(
  timerStartedAt: number | undefined,
  pickTimeSeconds: number
): number | undefined {
  if (!timerStartedAt) return undefined;

  const elapsed = Math.floor((Date.now() - timerStartedAt) / 1000);
  const remaining = pickTimeSeconds - elapsed;
  return Math.max(0, remaining);
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['GET'], logger);

    const { draftId, userId } = req.query;

    if (!draftId || typeof draftId !== 'string') {
      return res.status(400).json({
        ok: false,
        error: { code: 'MISSING_DRAFT_ID', message: 'draftId is required' },
      });
    }

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        ok: false,
        error: { code: 'MISSING_USER_ID', message: 'userId is required' },
      });
    }

    logger.info('Fetching slow draft details', {
      component: 'slow-drafts',
      operation: 'get',
      draftId,
      userId,
    });

    if (!db) {
      return res.status(500).json({
        ok: false,
        error: { code: 'DATABASE_ERROR', message: 'Database not available' },
      });
    }

    try {
      // Get the draft room
      const roomRef = doc(db, 'draftRooms', draftId);
      const roomDoc = await getDoc(roomRef);

      if (!roomDoc.exists()) {
        return res.status(404).json({
          ok: false,
          error: { code: 'DRAFT_NOT_FOUND', message: 'Draft room not found' },
        });
      }

      const data = roomDoc.data();
      const participants = data.participants || [];

      // Find user participant
      const userParticipant = participants.find(
        (p: { userId?: string; id?: string }) =>
          p.userId === userId || p.id === userId
      );

      if (!userParticipant) {
        return res.status(403).json({
          ok: false,
          error: { code: 'NOT_PARTICIPANT', message: 'User is not a participant in this draft' },
        });
      }

      const teamCount = data.teamCount || 12;
      const rosterSize = data.rosterSize || 18;
      const currentPickNumber = data.currentPickNumber || 1;
      const totalPicks = teamCount * rosterSize;
      const currentRound = Math.ceil(currentPickNumber / teamCount);
      const pickTimeSeconds = data.pickTimeSeconds || 86400; // Default 24 hours

      const draftPosition = userParticipant.draftPosition ||
        (participants.indexOf(userParticipant) + 1);

      const picksAway = calculatePicksAway(currentPickNumber, draftPosition, teamCount);
      const isYourTurn = picksAway === 0;

      // Get all picks
      const picksRef = collection(db, 'draftRooms', draftId, 'picks');
      const allPicksQuery = query(picksRef, orderBy('pickNumber', 'asc'));
      const allPicksSnapshot = await getDocs(allPicksQuery);

      const draftedPlayerIds = new Set<string>();
      const recentPicks: RecentPick[] = [];
      const myPicks: MyPick[] = [];
      let myPickIndex = 0;

      allPicksSnapshot.docs.forEach((pickDoc) => {
        const pickData = pickDoc.data();
        draftedPlayerIds.add(pickData.playerId);

        const player: DraftPlayer = {
          id: pickData.playerId,
          name: pickData.playerName || 'Unknown',
          position: pickData.playerPosition as 'QB' | 'RB' | 'WR' | 'TE',
          team: pickData.playerTeam || 'FA',
          adp: pickData.adp || 999,
        };

        // Check if this is user's pick
        if (pickData.participantId === userParticipant.id) {
          myPicks.push({
            slotIndex: myPickIndex++,
            player,
            pickNumber: pickData.pickNumber,
            round: pickData.round,
            pickInRound: pickData.pickInRound,
          });
        }

        // Add to recent picks (last 10)
        const drafter = participants.find(
          (p: { id: string }) => p.id === pickData.participantId
        );

        recentPicks.push({
          pickNumber: pickData.pickNumber,
          round: pickData.round,
          pickInRound: pickData.pickInRound,
          player,
          drafter: {
            id: pickData.participantId,
            name: drafter?.name || drafter?.teamName || `Team ${pickData.participantIndex + 1}`,
            isCurrentUser: pickData.participantId === userParticipant.id,
          },
          timestamp: pickData.timestamp?.toMillis?.() || Date.now(),
        });
      });

      // Get recent picks (last 10)
      const recentPicksSlice = recentPicks.slice(-10).reverse();

      // Get top available players (limited to top 500 by ADP for performance)
      const playersRef = collection(db, 'players');
      const playersQuery = query(
        playersRef,
        orderBy('adp', 'asc'),
        limit(500)
      );
      const playersSnapshot = await getDocs(playersQuery);

      const availablePlayers: DraftPlayer[] = [];
      playersSnapshot.docs.forEach((playerDoc) => {
        if (!draftedPlayerIds.has(playerDoc.id)) {
          const playerData = playerDoc.data();
          const position = playerData.position as string;
          if (['QB', 'RB', 'WR', 'TE'].includes(position)) {
            availablePlayers.push({
              id: playerDoc.id,
              name: playerData.name || playerData.displayName || 'Unknown',
              position: position as 'QB' | 'RB' | 'WR' | 'TE',
              team: playerData.team || playerData.nflTeam || 'FA',
              adp: playerData.adp || playerData.averageDraftPosition || 999,
              projectedPoints: playerData.projectedPoints,
            });
          }
        }
      });

      // Sort by ADP and get top 5 per position
      availablePlayers.sort((a, b) => a.adp - b.adp);

      const topAvailable: TopAvailable = {
        QB: availablePlayers.filter((p) => p.position === 'QB').slice(0, 5),
        RB: availablePlayers.filter((p) => p.position === 'RB').slice(0, 5),
        WR: availablePlayers.filter((p) => p.position === 'WR').slice(0, 5),
        TE: availablePlayers.filter((p) => p.position === 'TE').slice(0, 5),
      };

      const positionCounts = calculatePositionCounts(myPicks);
      const positionNeeds = calculatePositionNeeds(positionCounts, currentRound);

      // Calculate time left
      const timerStartedAt = data.timerStartedAt?.toMillis?.() || data.timerStartedAt;
      const timeLeftSeconds = isYourTurn
        ? calculateTimeLeftSeconds(timerStartedAt, pickTimeSeconds)
        : undefined;

      // Determine status
      let status: 'your-turn' | 'waiting' | 'paused' | 'complete' = 'waiting';
      if (data.status === 'complete') {
        status = 'complete';
      } else if (data.status === 'paused') {
        status = 'paused';
      } else if (isYourTurn) {
        status = 'your-turn';
      }

      const response = {
        id: draftId,
        tournamentId: data.tournamentId || draftId,
        tournamentName: data.name || data.tournamentName || 'Draft Room',
        teamId: userParticipant.id,
        teamName: userParticipant.teamName || userParticipant.name || `Team ${draftPosition}`,
        status,
        pickNumber: currentPickNumber,
        totalPicks,
        currentRound,
        totalRounds: rosterSize,
        draftPosition,
        teamCount,
        timeLeftSeconds,
        picksAway,
        myPicks,
        positionCounts,
        positionNeeds,
        recentPicks: recentPicksSlice,
        notableEvents: [], // TODO: Implement notable events
        topAvailable,
        lastActivityAt: data.updatedAt?.toMillis?.() || Date.now(),
      };

      logger.info('Slow draft details fetched', {
        component: 'slow-drafts',
        operation: 'get',
        draftId,
        userId,
        pickCount: myPicks.length,
      });

      return res.status(200).json(createSuccessResponse(response));
    } catch (error) {
      logger.error('Error fetching slow draft', error as Error, {
        component: 'slow-drafts',
        operation: 'get',
        draftId,
        userId,
      });

      return res.status(500).json({
        ok: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch slow draft details',
        },
      });
    }
  });
}
