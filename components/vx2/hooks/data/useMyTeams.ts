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
import { useFirebaseTeams } from '../../../../lib/config/featureFlags';
import { useMyTeamsWithFirebase } from './useMyTeams.firebase';

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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert number to Roman numeral
 */
function toRomanNumeral(num: number): string {
  const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const numerals = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let result = '';
  
  for (let i = 0; i < values.length; i++) {
    while (num >= values[i]) {
      result += numerals[i];
      num -= values[i];
    }
  }
  
  return result;
}

/**
 * Generate a random player from a pool
 */
function getRandomPlayer(pool: TeamPlayer[]): TeamPlayer {
  return { ...pool[Math.floor(Math.random() * pool.length)] };
}

// ============================================================================
// MOCK DATA
// ============================================================================

// Base player pool for generating teams
const BASE_PLAYER_POOL: TeamPlayer[] = [
  // QBs
  { name: 'Jayden Daniels', team: 'WAS', bye: 12, adp: 42.8, pick: 48, projectedPoints: 320, position: 'QB' },
  { name: 'Joe Burrow', team: 'CIN', bye: 10, adp: 53.9, pick: 72, projectedPoints: 295, position: 'QB' },
  { name: 'Patrick Mahomes', team: 'KC', bye: 10, adp: 52.4, pick: 55, projectedPoints: 310, position: 'QB' },
  { name: 'Jalen Hurts', team: 'PHI', bye: 9, adp: 45.2, pick: 52, projectedPoints: 300, position: 'QB' },
  { name: 'Josh Allen', team: 'BUF', bye: 6, adp: 48.1, pick: 50, projectedPoints: 305, position: 'QB' },
  { name: 'Baker Mayfield', team: 'TB', bye: 9, adp: 92.4, pick: 94, projectedPoints: 280, position: 'QB' },
  { name: 'Jared Goff', team: 'DET', bye: 8, adp: 116.7, pick: 118, projectedPoints: 265, position: 'QB' },
  { name: 'Jaxson Dart', team: 'NYG', bye: 14, adp: 90.3, pick: 78, projectedPoints: 245, position: 'QB' },
  { name: 'Aaron Rodgers', team: 'NYJ', bye: 5, adp: 103.0, pick: 91, projectedPoints: 230, position: 'QB' },
  
  // RBs
  { name: 'Bijan Robinson', team: 'ATL', bye: 12, adp: 2.1, pick: 2, projectedPoints: 260, position: 'RB' },
  { name: 'Saquon Barkley', team: 'PHI', bye: 9, adp: 7.5, pick: 6, projectedPoints: 260, position: 'RB' },
  { name: 'Breece Hall', team: 'NYJ', bye: 5, adp: 6.2, pick: 5, projectedPoints: 250, position: 'RB' },
  { name: 'De\'Von Achane', team: 'MIA', bye: 5, adp: 19.3, pick: 20, projectedPoints: 225, position: 'RB' },
  { name: 'Rhamondre Stevenson', team: 'NE', bye: 14, adp: 39.4, pick: 48, projectedPoints: 200, position: 'RB' },
  { name: 'Jaylen Warren', team: 'PIT', bye: 9, adp: 61.3, pick: 72, projectedPoints: 175, position: 'RB' },
  { name: 'Chase Brown', team: 'CIN', bye: 10, adp: 28.3, pick: 22, projectedPoints: 210, position: 'RB' },
  { name: 'Chuba Hubbard', team: 'CAR', bye: 14, adp: 55.3, pick: 51, projectedPoints: 165, position: 'RB' },
  { name: 'James Conner', team: 'ARI', bye: 8, adp: 65.8, pick: 70, projectedPoints: 155, position: 'RB' },
  { name: 'Jordan Mason', team: 'SF', bye: 6, adp: 105.2, pick: 96, projectedPoints: 180, position: 'RB' },
  { name: 'Austin Ekeler', team: 'WAS', bye: 12, adp: 157.8, pick: 121, projectedPoints: 120, position: 'RB' },
  { name: 'Jarquez Hunter', team: 'LAR', bye: 8, adp: 198.2, pick: 169, projectedPoints: 85, position: 'RB' },
  { name: 'Khalil Herbert', team: 'CHI', bye: 7, adp: 108.4, pick: 145, projectedPoints: 100, position: 'RB' },
  { name: 'Gus Edwards', team: 'LAC', bye: 5, adp: 134.6, pick: 168, projectedPoints: 85, position: 'RB' },
  { name: 'Cam Skattebo', team: 'ARI', bye: 14, adp: 113.6, pick: 115, projectedPoints: 140, position: 'RB' },
  
  // WRs
  { name: "Ja'Marr Chase", team: 'CIN', bye: 10, adp: 1.1, pick: 1, projectedPoints: 285, position: 'WR' },
  { name: 'CeeDee Lamb', team: 'DAL', bye: 7, adp: 3.4, pick: 4, projectedPoints: 280, position: 'WR' },
  { name: 'Amon-Ra St. Brown', team: 'DET', bye: 8, adp: 4.8, pick: 8, projectedPoints: 265, position: 'WR' },
  { name: 'Justin Jefferson', team: 'MIN', bye: 6, adp: 3.1, pick: 3, projectedPoints: 295, position: 'WR' },
  { name: 'Malik Nabers', team: 'NYG', bye: 14, adp: 21.8, pick: 19, projectedPoints: 235, position: 'WR' },
  { name: 'Nico Collins', team: 'HOU', bye: 6, adp: 25.9, pick: 30, projectedPoints: 220, position: 'WR' },
  { name: 'Terry McLaurin', team: 'WAS', bye: 12, adp: 27.8, pick: 24, projectedPoints: 210, position: 'WR' },
  { name: 'Rashee Rice', team: 'KC', bye: 10, adp: 29.7, pick: 25, projectedPoints: 195, position: 'WR' },
  { name: 'Mike Evans', team: 'TB', bye: 9, adp: 34.9, pick: 27, projectedPoints: 205, position: 'WR' },
  { name: 'Jameson Williams', team: 'DET', bye: 8, adp: 43.3, pick: 46, projectedPoints: 185, position: 'WR' },
  { name: 'Darnell Mooney', team: 'ATL', bye: 5, adp: 85.1, pick: 75, projectedPoints: 145, position: 'WR' },
  { name: 'Jerry Jeudy', team: 'CLE', bye: 9, adp: 67.4, pick: 73, projectedPoints: 155, position: 'WR' },
  { name: 'Rashod Bateman', team: 'BAL', bye: 7, adp: 115.7, pick: 120, projectedPoints: 125, position: 'WR' },
  { name: 'Alec Pierce', team: 'IND', bye: 11, adp: 170.8, pick: 168, projectedPoints: 95, position: 'WR' },
  { name: 'Tyler Lockett', team: 'SEA', bye: 11, adp: 88.3, pick: 97, projectedPoints: 150, position: 'WR' },
  { name: 'Marquise Brown', team: 'KC', bye: 10, adp: 95.1, pick: 120, projectedPoints: 140, position: 'WR' },
  { name: 'Diontae Johnson', team: 'CAR', bye: 11, adp: 76.2, pick: 95, projectedPoints: 160, position: 'WR' },
  { name: 'Courtland Sutton', team: 'DEN', bye: 6, adp: 82.7, pick: 96, projectedPoints: 155, position: 'WR' },
  { name: 'Garrett Wilson', team: 'NYJ', bye: 5, adp: 15.2, pick: 12, projectedPoints: 240, position: 'WR' },
  { name: 'Tyreek Hill', team: 'MIA', bye: 5, adp: 8.3, pick: 7, projectedPoints: 270, position: 'WR' },
  { name: 'Puka Nacua', team: 'LAR', bye: 6, adp: 12.1, pick: 10, projectedPoints: 250, position: 'WR' },
  
  // TEs
  { name: 'Travis Kelce', team: 'KC', bye: 10, adp: 18.5, pick: 17, projectedPoints: 190, position: 'TE' },
  { name: 'George Kittle', team: 'SF', bye: 14, adp: 51.6, pick: 49, projectedPoints: 175, position: 'TE' },
  { name: 'Trey McBride', team: 'ARI', bye: 14, adp: 70.8, pick: 84, projectedPoints: 165, position: 'TE' },
  { name: 'Isaiah Likely', team: 'BAL', bye: 7, adp: 144.9, pick: 142, projectedPoints: 130, position: 'TE' },
  { name: 'Dallas Goedert', team: 'PHI', bye: 9, adp: 142.1, pick: 166, projectedPoints: 125, position: 'TE' },
  { name: 'Tyler Higbee', team: 'LAR', bye: 6, adp: 152.7, pick: 192, projectedPoints: 90, position: 'TE' },
  { name: 'Zach Ertz', team: 'WAS', bye: 12, adp: 166.2, pick: 144, projectedPoints: 110, position: 'TE' },
  { name: 'Jonnu Smith', team: 'MIA', bye: 5, adp: 120.1, pick: 126, projectedPoints: 115, position: 'TE' },
  { name: 'David Njoku', team: 'CLE', bye: 9, adp: 98.5, pick: 112, projectedPoints: 135, position: 'TE' },
];

/**
 * Generate a random team roster with 18 players
 */
function generateTeamRoster(): TeamPlayer[] {
  const roster: TeamPlayer[] = [];
  const usedPlayers = new Set<string>();
  
  // Ensure we have at least 2 QBs, 3 RBs, 5 WRs, 2 TEs (12 players)
  // Then fill remaining 6 spots randomly
  const positionRequirements = [
    { position: 'QB' as Position, min: 2, max: 3 },
    { position: 'RB' as Position, min: 3, max: 5 },
    { position: 'WR' as Position, min: 5, max: 7 },
    { position: 'TE' as Position, min: 2, max: 3 },
  ];
  
  // Fill minimum requirements
  positionRequirements.forEach(req => {
    const available = BASE_PLAYER_POOL.filter(p => p.position === req.position);
    for (let i = 0; i < req.min; i++) {
      let player: TeamPlayer;
      let attempts = 0;
      do {
        player = getRandomPlayer(available);
        attempts++;
      } while (usedPlayers.has(player.name) && attempts < 50);
      
      if (!usedPlayers.has(player.name)) {
        roster.push({ ...player, pick: roster.length + 1 });
        usedPlayers.add(player.name);
      }
    }
  });
  
  // Fill remaining spots randomly
  while (roster.length < 18) {
    const available = BASE_PLAYER_POOL.filter(p => !usedPlayers.has(p.name));
    if (available.length === 0) {
      // If we run out of unique players, allow duplicates (shouldn't happen with our pool size)
      const allPlayers = BASE_PLAYER_POOL;
      const player = getRandomPlayer(allPlayers);
      roster.push({ ...player, pick: roster.length + 1 });
    } else {
      const player = getRandomPlayer(available);
      roster.push({ ...player, pick: roster.length + 1 });
      usedPlayers.add(player.name);
    }
  }
  
  return roster;
}

/**
 * Generate mock teams
 */
function generateMockTeams(count: number): MyTeam[] {
  const teams: MyTeam[] = [];
  const baseDate = Date.now();
  
  for (let i = 1; i <= count; i++) {
    let roster = generateTeamRoster();
    
    // Ensure roster has exactly 18 players
    while (roster.length < 18) {
      const available = BASE_PLAYER_POOL.filter(p => !roster.some(r => r.name === p.name));
      if (available.length > 0) {
        const player = getRandomPlayer(available);
        roster.push({ ...player, pick: roster.length + 1 });
      } else {
        // If we run out of unique players, allow duplicates
        const player = getRandomPlayer(BASE_PLAYER_POOL);
        roster.push({ ...player, pick: roster.length + 1 });
      }
    }
    
    // Trim to exactly 18 if somehow we got more
    roster = roster.slice(0, 18);
    
    const totalPoints = roster.reduce((sum, p) => sum + p.projectedPoints, 0);
    const rank = Math.floor(Math.random() * 500000) + 1;
    const totalTeams = 500000 + Math.floor(Math.random() * 100000);
    const daysAgo = Math.floor(Math.random() * 30);
    
    teams.push({
      id: `the-topdog-${i}`,
      name: `The TopDog International   ${toRomanNumeral(i)}`,
      tournament: 'The TopDog International',
      tournamentId: 'topdog-international',
      rank,
      totalTeams,
      projectedPoints: Math.round(totalPoints),
      draftedAt: new Date(baseDate - daysAgo * 86400000).toISOString(),
      players: roster,
    });
  }
  
  return teams;
}

const MOCK_TEAMS: MyTeam[] = (() => {
  const teams = generateMockTeams(50);
  // Ensure all teams have exactly 18 players
  return teams.filter(team => team.players.length === 18);
})();

// ============================================================================
// MOCK FETCH
// ============================================================================

async function fetchMyTeams(): Promise<MyTeam[]> {
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 200));
  // All teams should already have 18 players, but filter just in case
  return MOCK_TEAMS.filter(team => team.players.length === 18);
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for fetching and managing user's teams
 * 
 * Uses feature flag to toggle between mock data (default) and Firebase.
 * Set useFirebaseTeams: true in lib/tournamentConfig.js to enable Firebase.
 */
export function useMyTeams(): UseMyTeamsResult {
  // Initialize all hooks unconditionally (before feature flag check)
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

  // Call Firebase hook unconditionally (hooks must be called unconditionally)
  const firebaseResult = useMyTeamsWithFirebase();

  // Check feature flag and return appropriate result
  if (useFirebaseTeams) {
    return firebaseResult;
  }

  // Default: Return mock data implementation
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

