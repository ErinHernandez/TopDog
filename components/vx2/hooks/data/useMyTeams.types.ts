/**
 * useMyTeams Type Definitions
 *
 * Extracted to separate file to avoid circular dependencies between
 * useMyTeams.ts, useMyTeams.firebase.ts, and useMyTeams.transform.ts
 */

/**
 * Position type
 */
export type Position = 'QB' | 'RB' | 'WR' | 'TE';

/**
 * Player on a team
 */
export interface TeamPlayer {
  /** Player name */
  name: string;
  /** NFL team abbreviation */
  team: string;
  /** Bye week */
  bye: number;
  /** Average draft position */
  adp: number;
  /** Pick number when drafted */
  pick: number;
  /** Projected fantasy points */
  projectedPoints: number;
  /** Position */
  position: Position;
}

/**
 * User's drafted team
 */
export interface MyTeam {
  /** Unique identifier */
  id: string;
  /** Team name */
  name: string;
  /** Tournament name */
  tournament: string;
  /** Tournament ID */
  tournamentId: string;
  /** Current rank in tournament */
  rank?: number;
  /** Total teams in tournament */
  totalTeams?: number;
  /** Total projected points */
  projectedPoints: number;
  /** Actual points scored (if available) */
  pointsScored?: number;
  /** Projected points for this week */
  projectedPointsThisWeek?: number;
  /** Projected points for rest of season */
  projectedPointsRestOfSeason?: number;
  /** Last week's score */
  lastWeekScore?: number;
  /** Last 4 weeks average score */
  last4WeeksScore?: number;
  /** Draft completion date */
  draftedAt: string;
  /** All players on roster */
  players: TeamPlayer[];
}

/**
 * Hook return type
 */
export interface UseMyTeamsResult {
  /** List of user's teams */
  teams: MyTeam[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refetch function */
  refetch: () => Promise<void>;
  /** Whether a refetch is in progress */
  isRefetching: boolean;
  /** Total team count */
  teamCount: number;
}
