/**
 * Player Pool Types
 * 
 * These types define the structure of the static player pool.
 * The pool is immutable for the entire draft season.
 */

export type Position = 'QB' | 'RB' | 'WR' | 'TE';

export interface PoolPlayer {
  /** Unique identifier - format: "lastname_firstname" (lowercase, no spaces) */
  id: string;
  
  /** Full display name */
  name: string;
  
  /** NFL team abbreviation (3 letters) */
  team: string;
  
  /** Fantasy position */
  position: Position;
  
  /** Average Draft Position - consensus ranking */
  adp: number;
  
  /** Projected fantasy points for the season */
  projection: number;
  
  /** Team's bye week (1-14) */
  byeWeek: number;
  
  /** Optional: Player photo URL path */
  photoUrl?: string;
  
  /** Optional: Years of NFL experience */
  experience?: number;
  
  /** Optional: Jersey number */
  jerseyNumber?: number;
}

export interface PlayerPoolMetadata {
  /** Version identifier (e.g., "2025-v1") */
  version: string;
  
  /** ISO timestamp when pool was generated */
  generatedAt: string;
  
  /** SHA-256 hash of player data for integrity verification */
  checksum: string;
  
  /** Total number of players in pool */
  playerCount: number;
  
  /** Counts by position */
  positionCounts: Record<Position, number>;
}

export interface PlayerPool {
  metadata: PlayerPoolMetadata;
  players: PoolPlayer[];
}

/**
 * Bye weeks for 2025 season
 * Source: NFL schedule (update when official schedule releases)
 */
export const BYE_WEEKS_2025: Record<string, number> = {
  // Week 5
  'LAC': 5, 'NYJ': 5,
  // Week 6
  'KC': 6, 'LAR': 6, 'MIA': 6, 'MIN': 6,
  // Week 7
  'ARI': 7, 'CAR': 7, 'NYG': 7, 'TB': 7,
  // Week 9
  'CLE': 9, 'LV': 9, 'SEA': 9, 'TEN': 9,
  // Week 10
  'BAL': 10, 'CIN': 10, 'JAX': 10, 'NE': 10,
  // Week 11
  'DEN': 11, 'HOU': 11, 'PIT': 11, 'SF': 11,
  // Week 12
  'IND': 12, 'NO': 12,
  // Week 13
  'ATL': 13, 'BUF': 13, 'CHI': 13, 'DET': 13,
  // Week 14
  'DAL': 14, 'GB': 14, 'PHI': 14, 'WAS': 14,
};

/**
 * NFL team full names
 */
export const TEAM_NAMES: Record<string, string> = {
  'ARI': 'Arizona Cardinals',
  'ATL': 'Atlanta Falcons',
  'BAL': 'Baltimore Ravens',
  'BUF': 'Buffalo Bills',
  'CAR': 'Carolina Panthers',
  'CHI': 'Chicago Bears',
  'CIN': 'Cincinnati Bengals',
  'CLE': 'Cleveland Browns',
  'DAL': 'Dallas Cowboys',
  'DEN': 'Denver Broncos',
  'DET': 'Detroit Lions',
  'GB': 'Green Bay Packers',
  'HOU': 'Houston Texans',
  'IND': 'Indianapolis Colts',
  'JAX': 'Jacksonville Jaguars',
  'KC': 'Kansas City Chiefs',
  'LAC': 'Los Angeles Chargers',
  'LAR': 'Los Angeles Rams',
  'LV': 'Las Vegas Raiders',
  'MIA': 'Miami Dolphins',
  'MIN': 'Minnesota Vikings',
  'NE': 'New England Patriots',
  'NO': 'New Orleans Saints',
  'NYG': 'New York Giants',
  'NYJ': 'New York Jets',
  'PHI': 'Philadelphia Eagles',
  'PIT': 'Pittsburgh Steelers',
  'SEA': 'Seattle Seahawks',
  'SF': 'San Francisco 49ers',
  'TB': 'Tampa Bay Buccaneers',
  'TEN': 'Tennessee Titans',
  'WAS': 'Washington Commanders',
};

