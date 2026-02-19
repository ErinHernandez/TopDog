/**
 * Data Transformation Layer
 *
 * Functions to transform Firestore team data to component types.
 */

import { Timestamp } from 'firebase/firestore';

import { FirestoreTeam, TeamPlayer as FirestoreTeamPlayer } from '../../../../types/firestore';

import type { MyTeam, TeamPlayer } from './useMyTeams.types';

/**
 * Convert Firestore Timestamp to ISO string
 */
function timestampToISO(timestamp: Timestamp | Date | string): string {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  return timestamp;
}

/**
 * Transform Firestore player to TeamPlayer format
 */
export function transformPlayer(player: FirestoreTeamPlayer): TeamPlayer {
  return {
    name: player.name,
    team: player.team,
    bye: 0, // Would need to look up from NFL_TEAMS or player data
    adp: 0, // Would need to calculate or fetch from player data
    pick: player.pickNumber,
    projectedPoints: 0, // Would need to fetch from player projections
    position: player.position as 'QB' | 'RB' | 'WR' | 'TE',
  };
}

/**
 * Transform Firestore team document to MyTeam format
 */
export function transformFirestoreTeam(
  firestoreTeam: FirestoreTeam & { id: string }
): MyTeam {
  return {
    id: firestoreTeam.id,
    name: firestoreTeam.name || firestoreTeam.tournamentName || 'Unnamed Team',
    tournament: firestoreTeam.tournamentName,
    tournamentId: firestoreTeam.tournamentId,
    rank: firestoreTeam.rank,
    totalTeams: undefined, // Would need to query tournament for total
    projectedPoints: firestoreTeam.totalPoints || 0,
    draftedAt: timestampToISO(firestoreTeam.createdAt),
    players: firestoreTeam.roster.map(transformPlayer),
  };
}

