/**
 * ADP Module
 * 
 * Provides access to ADP (Average Draft Position) data.
 * 
 * Usage:
 *   import { getLiveADP, getPlayerADP } from '@/lib/adp';
 *   
 *   const adp = await getLiveADP();
 *   const playerADP = adp.players['chase_jamarr'];
 */

import type { LiveADP, ADPSeed, PlayerADP } from './types';

// Re-export types
export type { LiveADP, ADPSeed, PlayerADP, ADPParams, DraftPick } from './types';

// Re-export algorithm functions
export { 
  calculateADP, 
  getADPRankings, 
  getPlayerRank,
  getBiggestRisers,
  getBiggestFallers,
  DEFAULT_ADP_PARAMS,
} from './algorithm';

// ============================================================================
// CONSTANTS
// ============================================================================

const CURRENT_YEAR = '2025';
const ADP_PATH = '/data/adp';

// ============================================================================
// CACHE
// ============================================================================

let liveADPCache: LiveADP | null = null;
let seedADPCache: ADPSeed | null = null;

// ============================================================================
// LOADERS
// ============================================================================

/**
 * Load live ADP data (calculated from platform drafts).
 * Cached after first load.
 */
export async function getLiveADP(year: string = CURRENT_YEAR): Promise<LiveADP> {
  if (liveADPCache) return liveADPCache;
  
  const response = await fetch(`${ADP_PATH}/live-${year}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load live ADP: ${response.status}`);
  }
  
  liveADPCache = await response.json();
  return liveADPCache!;
}

/**
 * Load seed ADP data (manual pre-season rankings).
 * Cached after first load.
 */
export async function getSeedADP(year: string = CURRENT_YEAR): Promise<ADPSeed> {
  if (seedADPCache) return seedADPCache;
  
  const response = await fetch(`${ADP_PATH}/seed-${year}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load seed ADP: ${response.status}`);
  }
  
  seedADPCache = await response.json();
  return seedADPCache!;
}

/**
 * Clear cached ADP data (call when new data is available).
 */
export function clearADPCache(): void {
  liveADPCache = null;
  seedADPCache = null;
}

// ============================================================================
// PLAYER LOOKUPS
// ============================================================================

/**
 * Get ADP data for a specific player.
 */
export async function getPlayerADP(
  playerId: string,
  year: string = CURRENT_YEAR
): Promise<PlayerADP | undefined> {
  const adp = await getLiveADP(year);
  return adp.players[playerId];
}

/**
 * Get ADP value for a specific player (just the number).
 */
export async function getPlayerADPValue(
  playerId: string,
  year: string = CURRENT_YEAR
): Promise<number | undefined> {
  const data = await getPlayerADP(playerId, year);
  return data?.adp;
}

// ============================================================================
// FILTERING & SORTING
// ============================================================================

/**
 * Get all players sorted by ADP.
 */
export async function getPlayersByADP(
  year: string = CURRENT_YEAR
): Promise<Array<{ playerId: string } & PlayerADP>> {
  const adp = await getLiveADP(year);
  return Object.entries(adp.players)
    .map(([playerId, data]: [string, PlayerADP]) => ({ playerId, ...data }))
    .sort((a: { playerId: string } & PlayerADP, b: { playerId: string } & PlayerADP) => a.adp - b.adp);
}

/**
 * Get players within an ADP range.
 */
export async function getPlayersInADPRange(
  minADP: number,
  maxADP: number,
  year: string = CURRENT_YEAR
): Promise<Array<{ playerId: string } & PlayerADP>> {
  const players = await getPlayersByADP(year);
  return players.filter((p: { playerId: string } & PlayerADP) => p.adp >= minADP && p.adp <= maxADP);
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Get ADP metadata (when calculated, how many drafts, etc.).
 */
export async function getADPMetadata(year: string = CURRENT_YEAR) {
  const adp = await getLiveADP(year);
  return adp.metadata;
}

/**
 * Check if ADP data is stale (older than specified hours).
 */
export async function isADPStale(
  maxAgeHours: number = 12,
  year: string = CURRENT_YEAR
): Promise<boolean> {
  const adp = await getLiveADP(year);
  const generatedAt = new Date(adp.metadata.generatedAt).getTime();
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  return Date.now() - generatedAt > maxAgeMs;
}

