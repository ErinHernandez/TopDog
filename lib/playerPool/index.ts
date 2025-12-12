/**
 * Player Pool Module
 * 
 * Provides access to the static, immutable player pool.
 * The pool is loaded once and cached for the entire session.
 * 
 * Usage:
 *   import { getPlayerPool, getPlayerById, getAvailablePlayers } from '@/lib/playerPool';
 *   
 *   const pool = await getPlayerPool();
 *   const player = getPlayerById('chase_jamarr');
 *   const available = getAvailablePlayers(pool.players, pickedIds);
 */

import type { PlayerPool, PoolPlayer, Position } from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const CURRENT_YEAR = '2025';
const POOL_PATH = `/data/player-pool-${CURRENT_YEAR}.json`;

// ============================================================================
// CACHE
// ============================================================================

let cachedPool: PlayerPool | null = null;
let cachePromise: Promise<PlayerPool> | null = null;

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Load the player pool from static JSON.
 * Returns cached version if already loaded.
 * 
 * @example
 * const pool = await getPlayerPool();
 * console.log(pool.metadata.playerCount); // 137
 */
export async function getPlayerPool(): Promise<PlayerPool> {
  // Return cached pool if available
  if (cachedPool) {
    return cachedPool;
  }
  
  // Return existing promise if loading is in progress (prevents duplicate fetches)
  if (cachePromise) {
    return cachePromise;
  }
  
  // Start loading
  cachePromise = fetch(POOL_PATH)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load player pool: ${response.status}`);
      }
      return response.json();
    })
    .then((pool: PlayerPool) => {
      cachedPool = pool;
      return pool;
    })
    .catch(error => {
      cachePromise = null; // Allow retry on error
      throw error;
    });
  
  return cachePromise;
}

/**
 * Synchronous access to cached pool.
 * Returns null if not yet loaded.
 * 
 * @example
 * const pool = getPlayerPoolSync();
 * if (pool) {
 *   // Use pool
 * }
 */
export function getPlayerPoolSync(): PlayerPool | null {
  return cachedPool;
}

/**
 * Preload the player pool (call early in app lifecycle).
 * 
 * @example
 * // In _app.js or layout
 * useEffect(() => { preloadPlayerPool(); }, []);
 */
export function preloadPlayerPool(): void {
  getPlayerPool().catch(console.error);
}

// ============================================================================
// PLAYER LOOKUP FUNCTIONS
// ============================================================================

/**
 * Get a player by their unique ID.
 * 
 * @example
 * const player = getPlayerById(pool.players, 'chase_jamarr');
 */
export function getPlayerById(players: PoolPlayer[], id: string): PoolPlayer | undefined {
  return players.find(p => p.id === id);
}

/**
 * Get a player by name (case-insensitive).
 * 
 * @example
 * const player = getPlayerByName(pool.players, "Ja'Marr Chase");
 */
export function getPlayerByName(players: PoolPlayer[], name: string): PoolPlayer | undefined {
  const lowerName = name.toLowerCase();
  return players.find(p => p.name.toLowerCase() === lowerName);
}

/**
 * Get all players at a specific position.
 * 
 * @example
 * const rbs = getPlayersByPosition(pool.players, 'RB');
 */
export function getPlayersByPosition(players: PoolPlayer[], position: Position): PoolPlayer[] {
  return players.filter(p => p.position === position);
}

/**
 * Get all players on a specific team.
 * 
 * @example
 * const chiefs = getPlayersByTeam(pool.players, 'KC');
 */
export function getPlayersByTeam(players: PoolPlayer[], team: string): PoolPlayer[] {
  return players.filter(p => p.team === team);
}

// ============================================================================
// DRAFT HELPER FUNCTIONS
// ============================================================================

/**
 * Get available players (not yet picked).
 * 
 * @example
 * const available = getAvailablePlayers(pool.players, ['chase_jamarr', 'lamb_ceedee']);
 */
export function getAvailablePlayers(players: PoolPlayer[], pickedIds: string[]): PoolPlayer[] {
  const pickedSet = new Set(pickedIds);
  return players.filter(p => !pickedSet.has(p.id));
}

/**
 * Get available players filtered by position.
 * 
 * @example
 * const availableRBs = getAvailableByPosition(pool.players, pickedIds, 'RB');
 */
export function getAvailableByPosition(
  players: PoolPlayer[],
  pickedIds: string[],
  position: Position
): PoolPlayer[] {
  return getAvailablePlayers(players, pickedIds).filter(p => p.position === position);
}

/**
 * Get the best available player by ADP.
 * 
 * @example
 * const bpa = getBestAvailable(pool.players, pickedIds);
 */
export function getBestAvailable(players: PoolPlayer[], pickedIds: string[]): PoolPlayer | undefined {
  const available = getAvailablePlayers(players, pickedIds);
  return available[0]; // Already sorted by ADP
}

/**
 * Get the best available player at a specific position.
 * 
 * @example
 * const bestRB = getBestAvailableByPosition(pool.players, pickedIds, 'RB');
 */
export function getBestAvailableByPosition(
  players: PoolPlayer[],
  pickedIds: string[],
  position: Position
): PoolPlayer | undefined {
  return getAvailableByPosition(players, pickedIds, position)[0];
}

// ============================================================================
// SEARCH FUNCTIONS
// ============================================================================

/**
 * Search players by name (partial match, case-insensitive).
 * 
 * @example
 * const results = searchPlayers(pool.players, 'chase');
 * // Returns Ja'Marr Chase, Chase Brown, etc.
 */
export function searchPlayers(players: PoolPlayer[], query: string): PoolPlayer[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return [];
  
  return players.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.team.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Search available players only.
 * 
 * @example
 * const results = searchAvailablePlayers(pool.players, pickedIds, 'patrick');
 */
export function searchAvailablePlayers(
  players: PoolPlayer[],
  pickedIds: string[],
  query: string
): PoolPlayer[] {
  const available = getAvailablePlayers(players, pickedIds);
  return searchPlayers(available, query);
}

// ============================================================================
// SORTING FUNCTIONS
// ============================================================================

/**
 * Sort players by ADP (ascending - best first).
 */
export function sortByADP(players: PoolPlayer[]): PoolPlayer[] {
  return [...players].sort((a, b) => a.adp - b.adp);
}

/**
 * Sort players by projection (descending - highest first).
 */
export function sortByProjection(players: PoolPlayer[]): PoolPlayer[] {
  return [...players].sort((a, b) => b.projection - a.projection);
}

/**
 * Sort players alphabetically by name.
 */
export function sortByName(players: PoolPlayer[]): PoolPlayer[] {
  return [...players].sort((a, b) => a.name.localeCompare(b.name));
}

// ============================================================================
// INTEGRITY VERIFICATION
// ============================================================================

/**
 * Verify the integrity of the player pool using SHA-256 checksum.
 * Use this to detect tampering or corruption.
 * 
 * @example
 * const isValid = await verifyPoolIntegrity();
 * if (!isValid) {
 *   console.error('Player pool integrity check failed!');
 * }
 */
export async function verifyPoolIntegrity(): Promise<boolean> {
  try {
    const [poolResponse, checksumResponse] = await Promise.all([
      fetch(POOL_PATH),
      fetch(`/data/player-pool-${CURRENT_YEAR}.sha256`)
    ]);
    
    const poolText = await poolResponse.text();
    const expectedChecksum = (await checksumResponse.text()).trim();
    
    // Parse to get just the players array for checksum
    const pool = JSON.parse(poolText) as PlayerPool;
    const playerDataString = JSON.stringify(pool.players);
    
    // Calculate SHA-256
    const msgBuffer = new TextEncoder().encode(playerDataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const actualChecksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return actualChecksum === expectedChecksum;
  } catch (error) {
    console.error('Integrity verification failed:', error);
    return false;
  }
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get position counts for a set of players.
 * 
 * @example
 * const counts = getPositionCounts(myRoster);
 * // { QB: 1, RB: 4, WR: 6, TE: 2 }
 */
export function getPositionCounts(players: PoolPlayer[]): Record<Position, number> {
  return {
    QB: players.filter(p => p.position === 'QB').length,
    RB: players.filter(p => p.position === 'RB').length,
    WR: players.filter(p => p.position === 'WR').length,
    TE: players.filter(p => p.position === 'TE').length,
  };
}

/**
 * Get ADP range for a set of players.
 * 
 * @example
 * const { min, max, avg } = getADPStats(myRoster);
 */
export function getADPStats(players: PoolPlayer[]): { min: number; max: number; avg: number } {
  if (players.length === 0) {
    return { min: 0, max: 0, avg: 0 };
  }
  
  const adps = players.map(p => p.adp);
  const min = Math.min(...adps);
  const max = Math.max(...adps);
  const avg = adps.reduce((a, b) => a + b, 0) / adps.length;
  
  return { min, max, avg: Math.round(avg * 10) / 10 };
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { PlayerPool, PoolPlayer, Position, PlayerPoolMetadata } from './types';
export { BYE_WEEKS_2025, TEAM_NAMES } from './types';

