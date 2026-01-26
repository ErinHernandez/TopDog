/**
 * Slow Drafts List API
 *
 * GET /api/slow-drafts
 *
 * Returns all slow drafts for the authenticated user with enhanced data
 * including position counts, needs, and timing information.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import {
  withErrorHandling,
  validateMethod,
  createSuccessResponse,
} from '../../../lib/apiErrorHandler';

// ============================================================================
// TYPES
// ============================================================================

interface Position {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
}

interface PositionNeed {
  position: 'QB' | 'RB' | 'WR' | 'TE';
  current: number;
  minimum: number;
  recommended: number;
  urgency: 'critical' | 'warning' | 'good' | 'neutral';
  needed: number;
}

interface MyPick {
  slotIndex: number;
  player: {
    id: string;
    name: string;
    position: 'QB' | 'RB' | 'WR' | 'TE';
    team: string;
    adp: number;
  };
  pickNumber: number;
  round: number;
  pickInRound: number;
}

interface SlowDraftResponse {
  id: string;
  tournamentId: string;
  tournamentName: string;
  teamId: string;
  teamName: string;
  status: 'your-turn' | 'waiting' | 'paused' | 'complete';
  pickNumber: number;
  totalPicks: number;
  currentRound: number;
  totalRounds: number;
  draftPosition: number;
  teamCount: number;
  timeLeftSeconds?: number;
  picksAway: number;
  myPicks: MyPick[];
  positionCounts: Position;
  positionNeeds: PositionNeed[];
  notableEvents: unknown[];
  lastActivityAt?: number;
}

// Position requirements for best ball
const POSITION_REQUIREMENTS = {
  QB: { min: 1, recommended: 2 },
  RB: { min: 3, recommended: 6 },
  WR: { min: 3, recommended: 6 },
  TE: { min: 1, recommended: 2 },
};

// ============================================================================
// HELPERS
// ============================================================================

function getParticipantIndexForPick(pickNumber: number, teamCount: number): number {
  const round = Math.ceil(pickNumber / teamCount);
  const pickInRound = (pickNumber - 1) % teamCount;
  if (round % 2 === 1) {
    return pickInRound;
  }
  return teamCount - 1 - pickInRound;
}

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

    // Get userId from query (in production, get from auth session)
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        ok: false,
        error: { code: 'MISSING_USER_ID', message: 'userId is required' },
      });
    }

    logger.info('Fetching slow drafts', {
      component: 'slow-drafts',
      operation: 'list',
      userId,
    });

    if (!db) {
      return res.status(500).json({
        ok: false,
        error: { code: 'DATABASE_ERROR', message: 'Database not available' },
      });
    }

    try {
      // Query draft rooms where user is a participant and draft is slow (pickTimeSeconds > 60)
      const roomsRef = collection(db, 'draftRooms');

      // Get all active/waiting drafts (limited to 50 for performance)
      // Note: We'll filter by participant in memory since Firestore doesn't support
      // array-contains with complex objects easily
      const q = query(
        roomsRef,
        where('status', 'in', ['active', 'waiting', 'paused']),
        orderBy('updatedAt', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      const slowDrafts: SlowDraftResponse[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        // Skip fast drafts (less than 5 minutes per pick)
        const pickTimeSeconds = data.pickTimeSeconds || 30;
        if (pickTimeSeconds < 300) continue;

        // Find if user is a participant
        const participants = data.participants || [];
        const userParticipant = participants.find(
          (p: { userId?: string; id?: string }) =>
            p.userId === userId || p.id === userId
        );

        if (!userParticipant) continue;

        const roomId = docSnap.id;
        const teamCount = data.teamCount || 12;
        const rosterSize = data.rosterSize || 18;
        const currentPickNumber = data.currentPickNumber || 1;
        const totalPicks = teamCount * rosterSize;
        const currentRound = Math.ceil(currentPickNumber / teamCount);

        // Get user's draft position (1-indexed)
        const draftPosition = userParticipant.draftPosition ||
          (participants.indexOf(userParticipant) + 1);

        // Calculate picks away
        const picksAway = calculatePicksAway(currentPickNumber, draftPosition, teamCount);
        const isYourTurn = picksAway === 0;

        // Get user's picks from subcollection (limited to roster size for safety)
        const picksRef = collection(db, 'draftRooms', roomId, 'picks');
        const userPicksQuery = query(
          picksRef,
          where('participantId', '==', userParticipant.id),
          orderBy('pickNumber', 'asc'),
          limit(rosterSize)
        );
        const picksSnapshot = await getDocs(userPicksQuery);

        const myPicks: MyPick[] = picksSnapshot.docs.map((pickDoc, index) => {
          const pickData = pickDoc.data();
          return {
            slotIndex: index,
            player: {
              id: pickData.playerId,
              name: pickData.playerName || 'Unknown',
              position: pickData.playerPosition as 'QB' | 'RB' | 'WR' | 'TE',
              team: pickData.playerTeam || 'FA',
              adp: pickData.adp || 999,
            },
            pickNumber: pickData.pickNumber,
            round: pickData.round,
            pickInRound: pickData.pickInRound,
          };
        });

        const positionCounts = calculatePositionCounts(myPicks);
        const positionNeeds = calculatePositionNeeds(positionCounts, currentRound);

        // Calculate time left
        const timerStartedAt = data.timerStartedAt?.toMillis?.() || data.timerStartedAt;
        const timeLeftSeconds = isYourTurn
          ? calculateTimeLeftSeconds(timerStartedAt, pickTimeSeconds)
          : undefined;

        // Determine status
        let status: SlowDraftResponse['status'] = 'waiting';
        if (data.status === 'complete') {
          status = 'complete';
        } else if (data.status === 'paused') {
          status = 'paused';
        } else if (isYourTurn) {
          status = 'your-turn';
        }

        slowDrafts.push({
          id: roomId,
          tournamentId: data.tournamentId || roomId,
          tournamentName: data.name || data.tournamentName || `Draft Room`,
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
          notableEvents: [],
          lastActivityAt: data.updatedAt?.toMillis?.() || Date.now(),
        });
      }

      // Filter to only TopDog International tournaments - STRICT FILTER
      const filteredDrafts = slowDrafts.filter((draft) => {
        const name = draft.tournamentName.toLowerCase().trim();
        
        // STRICT: Only allow exact "TopDog International" variants
        // Must start with "topdog international" (case insensitive)
        const isTopDogInternational = /^topdog\s+international/.test(name) ||
                                      name === 'topdog international i' ||
                                      name === 'topdog international ii' ||
                                      name === 'topdog international iii' ||
                                      name.startsWith('topdog international');
        
        // Explicitly exclude all other tournaments
        const isExcluded = name.includes('best ball') ||
                          name.includes('summer') ||
                          name.includes('ultimate') ||
                          name.includes('draft masters') ||
                          name.includes('gridiron') ||
                          name.includes('championship') ||
                          name.includes('showdown') ||
                          name.includes('bowl') ||
                          name.includes('league') ||
                          name.includes('premier') ||
                          name.includes('elite') ||
                          name.includes('regional');
        
        return isTopDogInternational && !isExcluded;
      });

      // Sort by your-turn first, then by picksAway
      filteredDrafts.sort((a, b) => {
        if (a.status === 'your-turn' && b.status !== 'your-turn') return -1;
        if (b.status === 'your-turn' && a.status !== 'your-turn') return 1;
        return a.picksAway - b.picksAway;
      });

      logger.info('Slow drafts fetched', {
        component: 'slow-drafts',
        operation: 'list',
        userId,
        count: filteredDrafts.length,
        filteredFrom: slowDrafts.length,
      });

      return res.status(200).json(
        createSuccessResponse(filteredDrafts)
      );
    } catch (error) {
      logger.error('Error fetching slow drafts', error as Error, {
        component: 'slow-drafts',
        operation: 'list',
        userId,
      });

      return res.status(500).json({
        ok: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch slow drafts',
        },
      });
    }
  });
}
