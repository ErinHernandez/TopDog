/**
 * ADP Calculation Algorithm
 * 
 * Calculates Average Draft Position from platform draft data.
 * 
 * Algorithm Overview:
 * 1. Gather all picks within the time window
 * 2. Apply recency weighting (recent drafts matter more)
 * 3. Remove statistical outliers
 * 4. Calculate weighted average per player
 * 5. Blend with seed ADP for low-confidence players
 * 6. Output to static JSON
 */

import type {
  ADPParams,
  ADPSeed,
  LiveADP,
  PlayerADP,
  DraftPick,
  ADPCalculationResult,
} from './types';

// ============================================================================
// DEFAULT PARAMETERS
// ============================================================================

export const DEFAULT_ADP_PARAMS: ADPParams = {
  /** Drafts from 7 days ago have ~50% weight */
  decayDays: 7,
  /** Need 50 picks for full confidence in calculated ADP */
  minPicksForConfidence: 50,
  /** Remove picks beyond 2.5 standard deviations */
  outlierThreshold: 2.5,
  /** Only include drafts from last 30 days */
  maxAgeDays: 30,
  /** Blend 50% with seed when confidence is 0 */
  seedBlendRatio: 0.5,
};

// ============================================================================
// DRAFT TYPE FILTERING
// ============================================================================

/**
 * Filter picks based on draft phase.
 * 
 * Pre-fast launch: Use slow drafts (all we have)
 * Post-fast launch: Use fast drafts only
 * 
 * @param picks - All picks
 * @param fastLaunchDate - When fast drafts launched (Date or timestamp)
 * @returns Filtered picks appropriate for current phase
 */
export function filterPicksByPhase(
  picks: DraftPick[],
  fastLaunchDate: Date | number | null
): DraftPick[] {
  const now = Date.now();
  const launchTime = fastLaunchDate 
    ? (typeof fastLaunchDate === 'number' ? fastLaunchDate : fastLaunchDate.getTime())
    : null;
  
  // Pre-fast launch: Use slow drafts
  if (!launchTime || now < launchTime) {
    return picks.filter(p => p.draftType === 'slow');
  }
  
  // Post-fast launch: Use fast drafts only
  return picks.filter(p => p.draftType === 'fast');
}

/**
 * Get current ADP phase based on fast launch date.
 */
export function getADPPhase(fastLaunchDate: Date | number | null): 'pre-fast' | 'fast-only' {
  const now = Date.now();
  const launchTime = fastLaunchDate 
    ? (typeof fastLaunchDate === 'number' ? fastLaunchDate : fastLaunchDate.getTime())
    : null;
  
  if (!launchTime || now < launchTime) {
    return 'pre-fast';
  }
  return 'fast-only';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate recency weight using exponential decay.
 * 
 * @param timestamp - When the pick was made
 * @param now - Current time
 * @param decayDays - Half-life in days
 * @returns Weight between 0 and 1
 */
function calculateRecencyWeight(
  timestamp: number,
  now: number,
  decayDays: number
): number {
  const ageMs = now - timestamp;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  
  // Exponential decay: weight = e^(-age / decay)
  // At age = decayDays, weight ≈ 0.37 (1/e)
  return Math.exp(-ageDays / decayDays);
}

/**
 * Calculate mean of an array of numbers.
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate standard deviation.
 */
function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

/**
 * Remove outliers from pick positions.
 */
function removeOutliers(
  picks: DraftPick[],
  threshold: number
): { filtered: DraftPick[]; removed: number } {
  if (picks.length < 3) {
    return { filtered: picks, removed: 0 };
  }
  
  const positions = picks.map(p => p.pickNumber);
  const avg = mean(positions);
  const stdDev = standardDeviation(positions);
  
  // Don't remove outliers if stdDev is very low (consistent picks)
  if (stdDev < 5) {
    return { filtered: picks, removed: 0 };
  }
  
  const filtered = picks.filter(p => 
    Math.abs(p.pickNumber - avg) <= threshold * stdDev
  );
  
  return {
    filtered,
    removed: picks.length - filtered.length,
  };
}

/**
 * Calculate weighted average pick position.
 */
function calculateWeightedAverage(
  picks: DraftPick[],
  now: number,
  decayDays: number
): number {
  if (picks.length === 0) return 0;
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const pick of picks) {
    const weight = calculateRecencyWeight(pick.timestamp, now, decayDays);
    weightedSum += pick.pickNumber * weight;
    totalWeight += weight;
  }
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

// ============================================================================
// MAIN ALGORITHM
// ============================================================================

/**
 * Calculate ADP for all players from draft pick data.
 * 
 * @param picks - All draft picks from the platform
 * @param seed - Initial ADP values (for blending when confidence is low)
 * @param params - Algorithm parameters
 * @returns Calculated ADP data
 */
export function calculateADP(
  picks: DraftPick[],
  seed: ADPSeed,
  params: ADPParams = DEFAULT_ADP_PARAMS
): ADPCalculationResult {
  const startTime = Date.now();
  const now = Date.now();
  
  // Filter picks by age
  const maxAgeMs = params.maxAgeDays * 24 * 60 * 60 * 1000;
  const recentPicks = picks.filter(p => now - p.timestamp <= maxAgeMs);
  
  // Group picks by player
  const picksByPlayer = new Map<string, DraftPick[]>();
  for (const pick of recentPicks) {
    const existing = picksByPlayer.get(pick.playerId) || [];
    existing.push(pick);
    picksByPlayer.set(pick.playerId, existing);
  }
  
  // Get unique draft IDs for count
  const uniqueDraftIds = new Set(recentPicks.map(p => p.draftId));
  
  // Find date range
  const timestamps = recentPicks.map(p => p.timestamp);
  const minTimestamp = Math.min(...timestamps);
  const maxTimestamp = Math.max(...timestamps);
  
  // Calculate ADP for each player
  const playerADPs: Record<string, PlayerADP> = {};
  let totalOutliersRemoved = 0;
  let playersFromSeed = 0;
  
  // Get all player IDs (from picks AND seed)
  const allPlayerIds = new Set([
    ...picksByPlayer.keys(),
    ...Object.keys(seed.players),
  ]);
  
  // Load previous ADP for change calculation (would come from file in production)
  const previousADP: Record<string, number> = {};
  
  for (const playerId of allPlayerIds) {
    const playerPicks = picksByPlayer.get(playerId) || [];
    const seedADP = seed.players[playerId];
    
    // If no picks and no seed, skip
    if (playerPicks.length === 0 && seedADP === undefined) {
      continue;
    }
    
    // If no picks, use seed directly
    if (playerPicks.length === 0) {
      playersFromSeed++;
      playerADPs[playerId] = {
        adp: seedADP,
        pickCount: 0,
        highPick: 0,
        lowPick: 0,
        stdDev: 0,
        change: 0,
      };
      continue;
    }
    
    // Remove outliers
    const { filtered, removed } = removeOutliers(playerPicks, params.outlierThreshold);
    totalOutliersRemoved += removed;
    
    // Calculate stats from filtered picks
    const positions = filtered.map(p => p.pickNumber);
    const highPick = Math.min(...positions);
    const lowPick = Math.max(...positions);
    const stdDev = standardDeviation(positions);
    
    // Calculate weighted average
    const calculatedADP = calculateWeightedAverage(filtered, now, params.decayDays);
    
    // Calculate confidence (0-1 based on sample size)
    const confidence = Math.min(1, filtered.length / params.minPicksForConfidence);
    
    // Blend with seed if confidence is low
    let finalADP: number;
    if (seedADP !== undefined && confidence < 1) {
      // Blend: more confidence = more weight on calculated ADP
      const seedWeight = (1 - confidence) * params.seedBlendRatio;
      const calcWeight = 1 - seedWeight;
      finalADP = (calculatedADP * calcWeight) + (seedADP * seedWeight);
    } else {
      finalADP = calculatedADP;
    }
    
    // Calculate change from previous
    const previousValue = previousADP[playerId] ?? finalADP;
    const change = Math.round((finalADP - previousValue) * 10) / 10;
    
    playerADPs[playerId] = {
      adp: Math.round(finalADP * 10) / 10, // Round to 1 decimal
      pickCount: filtered.length,
      highPick,
      lowPick,
      stdDev: Math.round(stdDev * 10) / 10,
      change,
    };
  }
  
  const executionTimeMs = Date.now() - startTime;
  
  // Determine blend mode
  const slowPicks = recentPicks.filter(p => p.draftType === 'slow').length;
  const fastPicks = recentPicks.filter(p => p.draftType === 'fast').length;
  let blendMode: 'seed-only' | 'slow-only' | 'blended' | 'fast-only';
  
  if (recentPicks.length === 0) {
    blendMode = 'seed-only';
  } else if (fastPicks === 0) {
    blendMode = 'slow-only';
  } else if (slowPicks === 0) {
    blendMode = 'fast-only';
  } else {
    blendMode = 'blended';
  }
  
  return {
    adp: {
      metadata: {
        generatedAt: new Date().toISOString(),
        season: seed.metadata.season,
        algorithm: 'weighted-recency-v1',
        blendMode,
        totalDrafts: uniqueDraftIds.size,
        dateRange: {
          start: recentPicks.length > 0 ? new Date(minTimestamp).toISOString() : '',
          end: recentPicks.length > 0 ? new Date(maxTimestamp).toISOString() : '',
        },
        params,
        slowPicks,
        fastPicks,
      },
      players: playerADPs,
    },
    stats: {
      playersCalculated: Object.keys(playerADPs).length - playersFromSeed,
      playersFromSeed,
      totalPicksProcessed: recentPicks.length,
      outliersRemoved: totalOutliersRemoved,
      executionTimeMs,
    },
  };
}

// ============================================================================
// RANKING HELPERS
// ============================================================================

/**
 * Get players sorted by ADP (ascending = best first).
 */
export function getADPRankings(adp: LiveADP): Array<{ playerId: string } & PlayerADP> {
  return Object.entries(adp.players)
    .map(([playerId, data]) => ({ playerId, ...data }))
    .sort((a, b) => a.adp - b.adp);
}

/**
 * Get a player's rank based on ADP.
 */
export function getPlayerRank(adp: LiveADP, playerId: string): number | undefined {
  const rankings = getADPRankings(adp);
  const index = rankings.findIndex(r => r.playerId === playerId);
  return index >= 0 ? index + 1 : undefined;
}

/**
 * Get players with biggest ADP risers (negative change = rising).
 */
export function getBiggestRisers(
  adp: LiveADP,
  limit: number = 10
): Array<{ playerId: string } & PlayerADP> {
  return Object.entries(adp.players)
    .map(([playerId, data]) => ({ playerId, ...data }))
    .filter(p => p.change < 0 && p.pickCount >= 10) // Only include players with enough data
    .sort((a, b) => a.change - b.change) // Most negative first
    .slice(0, limit);
}

/**
 * Get players with biggest ADP fallers (positive change = falling).
 */
export function getBiggestFallers(
  adp: LiveADP,
  limit: number = 10
): Array<{ playerId: string } & PlayerADP> {
  return Object.entries(adp.players)
    .map(([playerId, data]) => ({ playerId, ...data }))
    .filter(p => p.change > 0 && p.pickCount >= 10)
    .sort((a, b) => b.change - a.change) // Most positive first
    .slice(0, limit);
}

