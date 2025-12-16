/**
 * useMyTeams - Data hook for user's drafted teams
 * 
 * Provides user's teams with loading, error, and refetch capabilities.
 * Currently uses mock data, designed for easy API integration.
 * 
 * @example
 * ```tsx
 * const { teams, isLoading, error, refetch } = useMyTeams();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

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

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_TEAMS: MyTeam[] = [
  {
    id: 'the-topdog-1',
    name: 'The TopDog International I',
    tournament: 'The TopDog International',
    tournamentId: 'topdog-international',
    rank: 1245,
    totalTeams: 571480,
    projectedPoints: 1850,
    draftedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    players: [
      { name: 'Jayden Daniels', team: 'WAS', bye: 12, adp: 42.8, pick: 48, projectedPoints: 320, position: 'QB' },
      { name: 'Joe Burrow', team: 'CIN', bye: 10, adp: 53.9, pick: 72, projectedPoints: 295, position: 'QB' },
      { name: 'Jordan Mason', team: 'SF', bye: 6, adp: 105.2, pick: 96, projectedPoints: 180, position: 'RB' },
      { name: 'Bijan Robinson', team: 'ATL', bye: 12, adp: 2.1, pick: 2, projectedPoints: 260, position: 'RB' },
      { name: 'Austin Ekeler', team: 'WAS', bye: 12, adp: 157.8, pick: 121, projectedPoints: 120, position: 'RB' },
      { name: 'Jarquez Hunter', team: 'LAR', bye: 8, adp: 198.2, pick: 169, projectedPoints: 85, position: 'RB' },
      { name: "Ja'Marr Chase", team: 'CIN', bye: 10, adp: 1.1, pick: 1, projectedPoints: 285, position: 'WR' },
      { name: 'Terry McLaurin', team: 'WAS', bye: 12, adp: 27.8, pick: 24, projectedPoints: 210, position: 'WR' },
      { name: 'Rashee Rice', team: 'KC', bye: 10, adp: 29.7, pick: 25, projectedPoints: 195, position: 'WR' },
      { name: 'Jerry Jeudy', team: 'CLE', bye: 9, adp: 67.4, pick: 73, projectedPoints: 155, position: 'WR' },
      { name: 'Rashod Bateman', team: 'BAL', bye: 7, adp: 115.7, pick: 120, projectedPoints: 125, position: 'WR' },
      { name: 'Alec Pierce', team: 'IND', bye: 11, adp: 170.8, pick: 168, projectedPoints: 95, position: 'WR' },
      { name: 'George Kittle', team: 'SF', bye: 14, adp: 51.6, pick: 49, projectedPoints: 175, position: 'TE' },
      { name: 'Zach Ertz', team: 'WAS', bye: 12, adp: 166.2, pick: 144, projectedPoints: 110, position: 'TE' },
      { name: 'Tyler Lockett', team: 'SEA', bye: 11, adp: 88.3, pick: 97, projectedPoints: 150, position: 'WR' },
      { name: 'Marquise Brown', team: 'KC', bye: 10, adp: 95.1, pick: 120, projectedPoints: 140, position: 'WR' },
      { name: 'Khalil Herbert', team: 'CHI', bye: 7, adp: 108.4, pick: 145, projectedPoints: 100, position: 'RB' },
      { name: 'Tyler Higbee', team: 'LAR', bye: 6, adp: 152.7, pick: 192, projectedPoints: 90, position: 'TE' },
    ],
  },
  {
    id: 'the-topdog-2',
    name: 'The TopDog International II',
    tournament: 'The TopDog International',
    tournamentId: 'topdog-international',
    rank: 8934,
    totalTeams: 571480,
    projectedPoints: 1720,
    draftedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    players: [
      { name: 'Baker Mayfield', team: 'TB', bye: 9, adp: 92.4, pick: 94, projectedPoints: 280, position: 'QB' },
      { name: 'Jared Goff', team: 'DET', bye: 8, adp: 116.7, pick: 118, projectedPoints: 265, position: 'QB' },
      { name: 'Chase Brown', team: 'CIN', bye: 10, adp: 28.3, pick: 22, projectedPoints: 210, position: 'RB' },
      { name: 'Chuba Hubbard', team: 'CAR', bye: 14, adp: 55.3, pick: 51, projectedPoints: 165, position: 'RB' },
      { name: 'James Conner', team: 'ARI', bye: 8, adp: 65.8, pick: 70, projectedPoints: 155, position: 'RB' },
      { name: 'Justin Jefferson', team: 'MIN', bye: 6, adp: 3.1, pick: 3, projectedPoints: 295, position: 'WR' },
      { name: 'Mike Evans', team: 'TB', bye: 9, adp: 34.9, pick: 27, projectedPoints: 205, position: 'WR' },
      { name: 'Jameson Williams', team: 'DET', bye: 8, adp: 43.3, pick: 46, projectedPoints: 185, position: 'WR' },
      { name: 'Darnell Mooney', team: 'ATL', bye: 5, adp: 85.1, pick: 75, projectedPoints: 145, position: 'WR' },
      { name: 'Isaiah Likely', team: 'BAL', bye: 7, adp: 144.9, pick: 142, projectedPoints: 130, position: 'TE' },
      { name: 'Dallas Goedert', team: 'PHI', bye: 9, adp: 142.1, pick: 166, projectedPoints: 125, position: 'TE' },
      { name: 'Tyler Lockett', team: 'SEA', bye: 11, adp: 88.3, pick: 97, projectedPoints: 150, position: 'WR' },
      { name: 'Marquise Brown', team: 'KC', bye: 10, adp: 95.1, pick: 120, projectedPoints: 140, position: 'WR' },
      { name: 'Khalil Herbert', team: 'CHI', bye: 7, adp: 108.4, pick: 145, projectedPoints: 100, position: 'RB' },
      { name: 'Tyler Higbee', team: 'LAR', bye: 6, adp: 152.7, pick: 192, projectedPoints: 90, position: 'TE' },
      { name: 'Gus Edwards', team: 'LAC', bye: 5, adp: 134.6, pick: 168, projectedPoints: 85, position: 'RB' },
    ],
  },
  {
    id: 'the-topdog-3',
    name: 'The TopDog International III',
    tournament: 'The TopDog International',
    tournamentId: 'topdog-international',
    rank: 25678,
    totalTeams: 571480,
    projectedPoints: 1680,
    draftedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    players: [
      { name: 'Jaxson Dart', team: 'NYG', bye: 14, adp: 90.3, pick: 78, projectedPoints: 245, position: 'QB' },
      { name: 'Aaron Rodgers', team: 'NYJ', bye: 5, adp: 103.0, pick: 91, projectedPoints: 230, position: 'QB' },
      { name: 'Saquon Barkley', team: 'PHI', bye: 9, adp: 7.5, pick: 6, projectedPoints: 260, position: 'RB' },
      { name: 'Cam Skattebo', team: 'ARI', bye: 14, adp: 113.6, pick: 115, projectedPoints: 140, position: 'RB' },
      { name: 'Malik Nabers', team: 'NYG', bye: 14, adp: 21.8, pick: 19, projectedPoints: 235, position: 'WR' },
      { name: 'Nico Collins', team: 'HOU', bye: 6, adp: 25.9, pick: 30, projectedPoints: 220, position: 'WR' },
      { name: 'Jonnu Smith', team: 'MIA', bye: 5, adp: 120.1, pick: 126, projectedPoints: 115, position: 'TE' },
      { name: 'Tyler Lockett', team: 'SEA', bye: 11, adp: 88.3, pick: 97, projectedPoints: 150, position: 'WR' },
      { name: 'Marquise Brown', team: 'KC', bye: 10, adp: 95.1, pick: 120, projectedPoints: 140, position: 'WR' },
      { name: 'Khalil Herbert', team: 'CHI', bye: 7, adp: 108.4, pick: 145, projectedPoints: 100, position: 'RB' },
      { name: 'Tyler Higbee', team: 'LAR', bye: 6, adp: 152.7, pick: 192, projectedPoints: 90, position: 'TE' },
      { name: 'Gus Edwards', team: 'LAC', bye: 5, adp: 134.6, pick: 168, projectedPoints: 85, position: 'RB' },
      { name: 'Diontae Johnson', team: 'CAR', bye: 11, adp: 76.2, pick: 95, projectedPoints: 160, position: 'WR' },
      { name: 'Rhamondre Stevenson', team: 'NE', bye: 14, adp: 39.4, pick: 48, projectedPoints: 200, position: 'RB' },
      { name: 'David Njoku', team: 'CLE', bye: 9, adp: 98.5, pick: 112, projectedPoints: 135, position: 'TE' },
    ],
  },
  {
    id: 'the-topdog-4',
    name: 'The TopDog International IV',
    tournament: 'The TopDog International',
    tournamentId: 'topdog-regional',
    rank: 456,
    totalTeams: 125000,
    projectedPoints: 1790,
    draftedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    players: [
      { name: 'Patrick Mahomes', team: 'KC', bye: 10, adp: 52.4, pick: 55, projectedPoints: 310, position: 'QB' },
      { name: 'Breece Hall', team: 'NYJ', bye: 5, adp: 6.2, pick: 5, projectedPoints: 250, position: 'RB' },
      { name: 'De\'Von Achane', team: 'MIA', bye: 5, adp: 19.3, pick: 20, projectedPoints: 225, position: 'RB' },
      { name: 'CeeDee Lamb', team: 'DAL', bye: 7, adp: 3.4, pick: 4, projectedPoints: 280, position: 'WR' },
      { name: 'Amon-Ra St. Brown', team: 'DET', bye: 8, adp: 4.8, pick: 8, projectedPoints: 265, position: 'WR' },
      { name: 'Travis Kelce', team: 'KC', bye: 10, adp: 18.5, pick: 17, projectedPoints: 190, position: 'TE' },
      { name: 'Tyler Lockett', team: 'SEA', bye: 11, adp: 88.3, pick: 97, projectedPoints: 150, position: 'WR' },
      { name: 'Marquise Brown', team: 'KC', bye: 10, adp: 95.1, pick: 120, projectedPoints: 140, position: 'WR' },
      { name: 'Khalil Herbert', team: 'CHI', bye: 7, adp: 108.4, pick: 145, projectedPoints: 100, position: 'RB' },
      { name: 'Tyler Higbee', team: 'LAR', bye: 6, adp: 152.7, pick: 192, projectedPoints: 90, position: 'TE' },
      { name: 'Gus Edwards', team: 'LAC', bye: 5, adp: 134.6, pick: 168, projectedPoints: 85, position: 'RB' },
      { name: 'Diontae Johnson', team: 'CAR', bye: 11, adp: 76.2, pick: 95, projectedPoints: 160, position: 'WR' },
      { name: 'Rhamondre Stevenson', team: 'NE', bye: 14, adp: 39.4, pick: 48, projectedPoints: 200, position: 'RB' },
      { name: 'David Njoku', team: 'CLE', bye: 9, adp: 98.5, pick: 112, projectedPoints: 135, position: 'TE' },
      { name: 'Jaylen Warren', team: 'PIT', bye: 9, adp: 61.3, pick: 72, projectedPoints: 175, position: 'RB' },
      { name: 'Courtland Sutton', team: 'DEN', bye: 6, adp: 82.7, pick: 96, projectedPoints: 155, position: 'WR' },
      { name: 'Trey McBride', team: 'ARI', bye: 14, adp: 70.8, pick: 84, projectedPoints: 165, position: 'TE' },
      { name: 'Jalen Hurts', team: 'PHI', bye: 9, adp: 45.2, pick: 52, projectedPoints: 300, position: 'QB' },
    ],
  },
];

// ============================================================================
// MOCK FETCH
// ============================================================================

async function fetchMyTeams(): Promise<MyTeam[]> {
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 200));
  // Only return teams with exactly 18 players (complete drafts)
  return MOCK_TEAMS.filter(team => team.players.length === 18);
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for fetching and managing user's teams
 */
export function useMyTeams(): UseMyTeamsResult {
  const [teams, setTeams] = useState<MyTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefetch = false) => {
    try {
      if (isRefetch) {
        setIsRefetching(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      const data = await fetchMyTeams();
      setTeams(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  return {
    teams,
    isLoading,
    error,
    refetch,
    isRefetching,
    teamCount: teams.length,
  };
}

export default useMyTeams;

