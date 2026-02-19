#!/usr/bin/env node
/**
 * ADP Calculation Script
 * 
 * Runs the ADP algorithm and outputs to static JSON.
 * Designed to run as a scheduled job 1-2x daily.
 * 
 * Usage:
 *   node scripts/calculateADP.js
 *   node scripts/calculateADP.js --dry-run    # Preview without writing
 *   node scripts/calculateADP.js --verbose    # Show detailed output
 * 
 * In production, this would:
 * 1. Fetch picks from Firestore/database
 * 2. Load seed ADP
 * 3. Run algorithm
 * 4. Write to public/data/adp/live-{year}.json
 * 5. Optionally trigger CDN cache invalidation
 */

const fs = require('fs');
const path = require('path');

// Parse args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');
const YEAR = '2025';

// ============================================================================
// FAST DRAFT LAUNCH DATE
// ============================================================================
// Set this to your fast draft launch date
// Before this date: slow draft ADP
// After this date: fast draft ADP only
const FAST_LAUNCH_DATE = new Date('2025-03-05T00:00:00Z'); // UPDATE THIS

// ============================================================================
// ALGORITHM PARAMETERS
// ============================================================================

const ADP_PARAMS = {
  decayDays: 7,
  minPicksForConfidence: 50,
  outlierThreshold: 2.5,
  maxAgeDays: 30,
  seedBlendRatio: 0.5,
};

// ============================================================================
// ALGORITHM IMPLEMENTATION (same as TypeScript version)
// ============================================================================

function calculateRecencyWeight(timestamp, now, decayDays) {
  const ageMs = now - timestamp;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return Math.exp(-ageDays / decayDays);
}

function mean(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function standardDeviation(values) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

function removeOutliers(picks, threshold) {
  if (picks.length < 3) {
    return { filtered: picks, removed: 0 };
  }
  
  const positions = picks.map(p => p.pickNumber);
  const avg = mean(positions);
  const stdDev = standardDeviation(positions);
  
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

function calculateWeightedAverage(picks, now, decayDays) {
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

/**
 * Calculate ADP for a single set of picks (internal helper).
 */
function calculateADPForPicks(picks, params, now) {
  const picksByPlayer = new Map();
  for (const pick of picks) {
    const existing = picksByPlayer.get(pick.playerId) || [];
    existing.push(pick);
    picksByPlayer.set(pick.playerId, existing);
  }
  
  const result = {};
  let outliersRemoved = 0;
  
  for (const [playerId, playerPicks] of picksByPlayer) {
    const { filtered, removed } = removeOutliers(playerPicks, params.outlierThreshold);
    outliersRemoved += removed;
    
    const positions = filtered.map(p => p.pickNumber);
    const adp = calculateWeightedAverage(filtered, now, params.decayDays);
    
    result[playerId] = {
      adp,
      pickCount: filtered.length,
      highPick: Math.min(...positions),
      lowPick: Math.max(...positions),
      stdDev: standardDeviation(positions),
    };
  }
  
  return { adpByPlayer: result, outliersRemoved };
}

function calculateADP(allPicks, seed, params, previousADP = {}) {
  const startTime = Date.now();
  const now = Date.now();
  const phase = getADPPhase();
  
  // Filter picks by age
  const maxAgeMs = params.maxAgeDays * 24 * 60 * 60 * 1000;
  const recentPicks = allPicks.filter(p => now - p.timestamp <= maxAgeMs);
  
  // Separate by draft type
  const { slow: slowPicks, fast: fastPicks } = separatePicksByType(recentPicks);
  
  // Get unique draft IDs
  const uniqueDraftIds = new Set(recentPicks.map(p => p.draftId));
  
  // Find date range
  const timestamps = recentPicks.map(p => p.timestamp);
  const minTimestamp = timestamps.length > 0 ? Math.min(...timestamps) : now;
  const maxTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : now;
  
  // Calculate ADP for each draft type
  const slowResult = calculateADPForPicks(slowPicks, params, now);
  const fastResult = calculateADPForPicks(fastPicks, params, now);
  
  let totalOutliersRemoved = slowResult.outliersRemoved + fastResult.outliersRemoved;
  
  // Get all player IDs
  const allPlayerIds = new Set([
    ...Object.keys(slowResult.adpByPlayer),
    ...Object.keys(fastResult.adpByPlayer),
    ...Object.keys(seed.players),
  ]);
  
  // Determine blend mode GLOBALLY (based on total picks, not per-player)
  const totalSlowPicks = slowPicks.length;
  const totalFastPicks = fastPicks.length;
  
  let blendMode;
  let globalFastWeight = 0;
  let globalSlowWeight = 0;
  
  if (phase === 'pre-fast') {
    blendMode = 'slow-only';
    globalSlowWeight = 1;
    globalFastWeight = 0;
  } else if (totalFastPicks === 0) {
    blendMode = 'slow-only';
    globalSlowWeight = 1;
    globalFastWeight = 0;
  } else if (totalFastPicks >= totalSlowPicks) {
    blendMode = 'fast-only';
    globalSlowWeight = 0;
    globalFastWeight = 1;
  } else {
    blendMode = 'blended';
    // Global blend weights (fast gets 1.5x boost to accelerate transition)
    globalFastWeight = (totalFastPicks * 1.5) / (totalSlowPicks + totalFastPicks * 1.5);
    globalSlowWeight = 1 - globalFastWeight;
  }
  
  console.log(`  Slow picks: ${totalSlowPicks}, Fast picks: ${totalFastPicks}`);
  console.log(`  Blend mode: ${blendMode}`);
  if (blendMode === 'blended') {
    console.log(`  Global weights: ${Math.round(globalSlowWeight * 100)}% slow, ${Math.round(globalFastWeight * 100)}% fast`);
  }
  
  // Calculate final ADP for each player using GLOBAL blend weights
  const playerADPs = {};
  let playersFromSeed = 0;
  let playersBlended = 0;
  
  for (const playerId of allPlayerIds) {
    const slowData = slowResult.adpByPlayer[playerId];
    const fastData = fastResult.adpByPlayer[playerId];
    const seedADP = seed.players[playerId];
    
    // No data at all - use seed
    if (!slowData && !fastData) {
      if (seedADP === undefined) continue;
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
    
    let finalADP, finalPickCount, finalHighPick, finalLowPick, finalStdDev;
    
    if (blendMode === 'slow-only') {
      // Use slow data only
      if (slowData) {
        finalADP = slowData.adp;
        finalPickCount = slowData.pickCount;
        finalHighPick = slowData.highPick;
        finalLowPick = slowData.lowPick;
        finalStdDev = slowData.stdDev;
      } else if (seedADP !== undefined) {
        // Player not in slow drafts yet - use seed
        finalADP = seedADP;
        finalPickCount = 0;
        finalHighPick = 0;
        finalLowPick = 0;
        finalStdDev = 0;
        playersFromSeed++;
      } else {
        continue;
      }
    } else if (blendMode === 'fast-only') {
      // Use fast data only
      if (fastData) {
        finalADP = fastData.adp;
        finalPickCount = fastData.pickCount;
        finalHighPick = fastData.highPick;
        finalLowPick = fastData.lowPick;
        finalStdDev = fastData.stdDev;
      } else if (seedADP !== undefined) {
        // Player not drafted in fast yet - use seed
        finalADP = seedADP;
        finalPickCount = 0;
        finalHighPick = 0;
        finalLowPick = 0;
        finalStdDev = 0;
        playersFromSeed++;
      } else {
        continue;
      }
    } else {
      // GLOBAL blended mode: use global weights for ALL players
      const slowADP = slowData?.adp;
      const fastADP = fastData?.adp;
      
      if (slowADP !== undefined && fastADP !== undefined) {
        // Both have data - use global weights
        finalADP = (slowADP * globalSlowWeight) + (fastADP * globalFastWeight);
        playersBlended++;
      } else if (fastADP !== undefined) {
        // Only fast data - use fast
        finalADP = fastADP;
      } else if (slowADP !== undefined) {
        // Only slow data - use slow
        finalADP = slowADP;
      } else if (seedADP !== undefined) {
        finalADP = seedADP;
        playersFromSeed++;
      } else {
        continue;
      }
      
      finalPickCount = (slowData?.pickCount || 0) + (fastData?.pickCount || 0);
      finalHighPick = Math.min(slowData?.highPick || 999, fastData?.highPick || 999);
      finalLowPick = Math.max(slowData?.lowPick || 0, fastData?.lowPick || 0);
      finalStdDev = fastData?.stdDev || slowData?.stdDev || 0;
    }
    
    // Blend with seed if low confidence
    const confidence = Math.min(1, finalPickCount / params.minPicksForConfidence);
    if (seedADP !== undefined && confidence < 1) {
      const seedWeight = (1 - confidence) * params.seedBlendRatio;
      const calcWeight = 1 - seedWeight;
      finalADP = (finalADP * calcWeight) + (seedADP * seedWeight);
    }
    
    const previousValue = previousADP[playerId]?.adp ?? finalADP;
    const change = Math.round((finalADP - previousValue) * 10) / 10;
    
    playerADPs[playerId] = {
      adp: Math.round(finalADP * 10) / 10,
      pickCount: finalPickCount,
      highPick: finalHighPick,
      lowPick: finalLowPick,
      stdDev: Math.round(finalStdDev * 10) / 10,
      change,
    };
  }
  
  return {
    adp: {
      metadata: {
        generatedAt: new Date().toISOString(),
        season: seed.metadata.season,
        algorithm: 'weighted-recency-v1',
        blendMode,
        slowPicks: totalSlowPicks,
        fastPicks: totalFastPicks,
        totalDrafts: uniqueDraftIds.size,
        dateRange: {
          start: new Date(minTimestamp).toISOString(),
          end: new Date(maxTimestamp).toISOString(),
        },
        params,
      },
      players: playerADPs,
    },
    stats: {
      playersCalculated: Object.keys(playerADPs).length - playersFromSeed,
      playersFromSeed,
      playersBlended,
      totalPicksProcessed: recentPicks.length,
      outliersRemoved: totalOutliersRemoved,
      executionTimeMs: Date.now() - startTime,
    },
  };
}

// ============================================================================
// MOCK DATA (Replace with database fetch in production)
// ============================================================================

/**
 * Get current ADP phase based on fast launch date.
 */
function getADPPhase() {
  const now = Date.now();
  const launchTime = FAST_LAUNCH_DATE.getTime();
  
  if (now < launchTime) {
    return 'pre-fast';  // Slow drafts only
  }
  return 'post-fast';   // Fast launched, may need blending
}

/**
 * Separate picks by draft type.
 */
function separatePicksByType(picks) {
  return {
    slow: picks.filter(p => p.draftType === 'slow'),
    fast: picks.filter(p => p.draftType === 'fast'),
  };
}

function loadPlayerPool() {
  // Load the static player pool
  const poolPath = path.join(__dirname, '../public/data/player-pool-2025.json');
  try {
    const data = JSON.parse(fs.readFileSync(poolPath, 'utf8'));
    return data.players;
  } catch (err) {
    console.error(`Failed to load player pool: ${err.message}`);
    return [];
  }
}

function generateMockPicks() {
  /**
   * In production, this function would:
   * 
   * const admin = require('firebase-admin');
   * const db = admin.firestore();
   * 
   * const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
   * 
   * // Fetch ALL picks (both slow and fast)
   * const snapshot = await db.collection('picks')
   *   .where('timestamp', '>', thirtyDaysAgo)
   *   .get();
   * 
   * return snapshot.docs.map(doc => doc.data());
   */
  
  // Load full player pool from static file
  const poolPlayers = loadPlayerPool();
  
  if (poolPlayers.length === 0) {
    console.error('No players in pool! Run: node scripts/generateFullPlayerPool.js');
    return [];
  }
  
  // Convert pool to player configs with variance based on ADP tier
  const players = poolPlayers.map(p => {
    // Variance increases with ADP (later picks are less predictable)
    const tier = Math.floor(p.adp / 24); // 0-8 for rounds
    const baseVariance = 1 + tier * 0.5;
    return {
      id: p.id,
      avgPick: p.adp,
      variance: baseVariance + (Math.random() * 2), // Some randomness in variance
    };
  });
  
  const picks = [];
  const now = Date.now();
  const phase = getADPPhase();
  
  // Simulate 50 complete drafts (12 teams x 18 rounds = 216 picks each)
  const TOTAL_PICKS_PER_DRAFT = 216;
  
  // Slow drafts: 30 drafts over last 14 days
  const numSlowDrafts = 30;
  for (let d = 0; d < numSlowDrafts; d++) {
    const draftId = `slow_draft_${d}`;
    const draftTime = now - Math.random() * 14 * 24 * 60 * 60 * 1000;
    
    // Sort players by ADP + noise to simulate a draft order
    const draftOrder = [...players]
      .map(p => ({
        ...p,
        draftValue: p.avgPick + (Math.random() * p.variance * 2 - p.variance)
      }))
      .sort((a, b) => a.draftValue - b.draftValue)
      .slice(0, TOTAL_PICKS_PER_DRAFT);
    
    draftOrder.forEach((player, index) => {
      picks.push({
        playerId: player.id,
        pickNumber: index + 1,
        timestamp: draftTime,
        draftId,
        draftType: 'slow',
      });
    });
  }
  
  // Fast drafts: Only if post-launch (20 drafts over last 7 days)
  if (phase === 'post-fast') {
    const numFastDrafts = 20;
    for (let d = 0; d < numFastDrafts; d++) {
      const draftId = `fast_draft_${d}`;
      const draftTime = now - Math.random() * 7 * 24 * 60 * 60 * 1000;
      
      // Fast drafts tend to be slightly more chaotic (higher variance)
      const draftOrder = [...players]
        .map(p => ({
          ...p,
          draftValue: p.avgPick + (Math.random() * p.variance * 3 - p.variance * 1.5)
        }))
        .sort((a, b) => a.draftValue - b.draftValue)
        .slice(0, TOTAL_PICKS_PER_DRAFT);
      
      draftOrder.forEach((player, index) => {
        picks.push({
          playerId: player.id,
          pickNumber: index + 1,
          timestamp: draftTime,
          draftId,
          draftType: 'fast',
        });
      });
    }
  }
  
  console.log(`  Generated ${picks.length} picks from ${numSlowDrafts + (phase === 'post-fast' ? 20 : 0)} drafts`);
  return picks;
}

function loadSeedADP() {
  /**
   * In production, load from file:
   * return JSON.parse(fs.readFileSync('public/data/adp/seed-2025.json'));
   * 
   * For now, generate seed from player pool (using static ADP as the baseline)
   */
  
  const poolPlayers = loadPlayerPool();
  const players = {};
  
  // Use player pool ADP as seed
  poolPlayers.forEach(p => {
    players[p.id] = p.adp;
  });
  
  return {
    metadata: {
      createdBy: 'auto-from-pool',
      createdAt: new Date().toISOString(),
      season: YEAR,
      description: 'Initial ADP seed generated from player pool',
    },
    players,
  };
}

function loadPreviousADP() {
  /**
   * In production:
   * try {
   *   return JSON.parse(fs.readFileSync(`public/data/adp/live-${YEAR}.json`)).players;
   * } catch {
   *   return {};
   * }
   */
  return {};
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const phase = getADPPhase();
  
  console.log('\n=== ADP Calculation ===\n');
  console.log(`Season: ${YEAR}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no file write)' : 'LIVE'}`);
  console.log(`Phase: ${phase === 'pre-fast' ? 'PRE-FAST (using slow drafts)' : 'FAST-ONLY'}`);
  console.log(`Fast Launch: ${FAST_LAUNCH_DATE.toISOString()}`);
  console.log('');
  
  // Load data
  console.log('Loading data...');
  const seed = loadSeedADP();
  const previousADP = loadPreviousADP();
  const picks = generateMockPicks();
  console.log(`  Seed players: ${Object.keys(seed.players).length}`);
  console.log(`  Picks loaded: ${picks.length}`);
  console.log('');
  
  // Run algorithm
  console.log('Running algorithm...');
  const result = calculateADP(picks, seed, ADP_PARAMS, previousADP);
  
  // Display stats
  console.log('');
  console.log('=== Results ===');
  console.log(`  Blend mode: ${result.adp.metadata.blendMode}`);
  console.log(`  Players calculated: ${result.stats.playersCalculated}`);
  console.log(`  Players from seed only: ${result.stats.playersFromSeed}`);
  console.log(`  Players blended (slow+fast): ${result.stats.playersBlended || 0}`);
  console.log(`  Total picks processed: ${result.stats.totalPicksProcessed}`);
  console.log(`  Outliers removed: ${result.stats.outliersRemoved}`);
  console.log(`  Execution time: ${result.stats.executionTimeMs}ms`);
  console.log(`  Drafts included: ${result.adp.metadata.totalDrafts}`);
  console.log('');
  
  // Display top 10
  console.log('=== Top 10 ADP ===');
  const rankings = Object.entries(result.adp.players)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => a.adp - b.adp)
    .slice(0, 10);
  
  for (let i = 0; i < rankings.length; i++) {
    const p = rankings[i];
    console.log(`  ${i + 1}. ${p.id}: ${p.adp} (${p.pickCount} picks)`);
  }
  console.log('');
  
  if (VERBOSE) {
    console.log('=== All Players ===');
    const allRankings = Object.entries(result.adp.players)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => a.adp - b.adp);
    
    for (let i = 0; i < allRankings.length; i++) {
      const p = allRankings[i];
      console.log(`  ${i + 1}. ${p.id}: ADP=${p.adp}, picks=${p.pickCount}, high=${p.highPick}, low=${p.lowPick}, stdDev=${p.stdDev}`);
    }
    console.log('');
  }
  
  // Write output
  if (!DRY_RUN) {
    const outputDir = path.join(__dirname, '../public/data/adp');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, `live-${YEAR}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(result.adp, null, 2));
    console.log(`Written to: ${outputPath}`);
  } else {
    console.log('Dry run - no file written');
  }
  
  console.log('\nDone!\n');
}

main().catch(console.error);

