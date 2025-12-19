#!/usr/bin/env node

/**
 * Historical Data Ingestion Script - Player Pool Based
 * 
 * Fetches historical statistics for EVERY player in the player pool.
 * Uses ESPN Core API with per-player statistics endpoint.
 * 
 * Usage: node scripts/ingest-historical-data.js
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  seasons: [2021, 2022, 2023, 2024],
  currentSeason: 2025,
  outputDir: path.join(__dirname, '..', 'public', 'data', 'history'),
  playerPoolPath: path.join(__dirname, '..', 'public', 'data', 'player-pool-2025.json'),
  positions: ['QB', 'RB', 'WR', 'TE'],
  
  // Rate limiting
  requestDelay: 100, // ms between requests (be nice to ESPN)
  batchSize: 10,     // concurrent requests per batch
  batchDelay: 500,   // delay between batches
  
  // ESPN API endpoints
  espnSearchUrl: 'http://site.api.espn.com/apis/common/v3/search',
  espnAthleteUrl: 'http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes',
  espnSeasonStatsUrl: 'http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons',
};

// =============================================================================
// HTTP UTILITIES
// =============================================================================

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// ESPN ID LOOKUP
// =============================================================================

// Cache for ESPN IDs
const espnIdCache = new Map();

/**
 * Generate search variations for a player name
 */
function getNameVariations(playerName) {
  const variations = [];
  
  // Original name
  variations.push(playerName);
  
  // Remove apostrophes
  const noApostrophe = playerName.replace(/'/g, '');
  if (noApostrophe !== playerName) variations.push(noApostrophe);
  
  // Replace apostrophes with nothing in common patterns
  // Ja'Marr -> JaMarr, D'Andre -> DAndre
  const contractedName = playerName.replace(/'([A-Z])/g, '$1').replace(/'([a-z])/g, '$1');
  if (contractedName !== playerName) variations.push(contractedName);
  
  // Remove Jr./Sr./II/III suffixes
  const noSuffix = playerName
    .replace(/ Jr\.?$/i, '')
    .replace(/ Sr\.?$/i, '')
    .replace(/ II$/i, '')
    .replace(/ III$/i, '')
    .replace(/ IV$/i, '');
  if (noSuffix !== playerName && !variations.includes(noSuffix)) {
    variations.push(noSuffix);
  }
  
  // Combine: no apostrophe + no suffix
  const cleanName = noApostrophe
    .replace(/\./g, '')
    .replace(/ Jr$/i, '')
    .replace(/ Sr$/i, '')
    .replace(/ II$/i, '')
    .replace(/ III$/i, '')
    .replace(/ IV$/i, '');
  if (!variations.includes(cleanName)) {
    variations.push(cleanName);
  }

  return variations;
}

/**
 * Search ESPN for a player and return their ESPN athlete ID
 */
async function findEspnId(playerName, position) {
  const cacheKey = `${playerName}-${position}`;
  if (espnIdCache.has(cacheKey)) {
    return espnIdCache.get(cacheKey);
  }

  const nameVariations = getNameVariations(playerName);

  for (const searchName of nameVariations) {
    try {
      const url = `${CONFIG.espnSearchUrl}?query=${encodeURIComponent(searchName)}&limit=15&type=player`;
      const data = await httpGet(url);

      if (!data || !data.items || data.items.length === 0) {
        continue;
      }

      // Find NFL player matching position
      for (const item of data.items) {
        if (item.league === 'nfl' && item.sport === 'football') {
          // Verify it's the right player by checking position
          const athleteData = await httpGet(`${CONFIG.espnAthleteUrl}/${item.id}`);
          if (athleteData && athleteData.position) {
            const espnPosition = athleteData.position.abbreviation;
            if (espnPosition === position) {
              espnIdCache.set(cacheKey, item.id);
              return item.id;
            }
          } else {
            // If we can't verify position, try name matching
            const espnName = (item.displayName || '').toLowerCase().replace(/'/g, '');
            const searchLower = searchName.toLowerCase().replace(/'/g, '');
            const lastName = searchLower.split(' ').pop();
            const espnLastName = espnName.split(' ').pop();
            
            // Accept if last names match
            if (lastName === espnLastName) {
              espnIdCache.set(cacheKey, item.id);
              return item.id;
            }
          }
          await delay(50); // Small delay between position checks
        }
      }

      // Fallback: return first NFL result with matching last name
      const lastName = searchName.toLowerCase().split(' ').pop().replace(/'/g, '');
      const nflPlayer = data.items.find(i => {
        if (i.league !== 'nfl') return false;
        const espnLastName = (i.displayName || '').toLowerCase().split(' ').pop().replace(/'/g, '');
        return espnLastName === lastName;
      });
      
      if (nflPlayer) {
        espnIdCache.set(cacheKey, nflPlayer.id);
        return nflPlayer.id;
      }
    } catch (error) {
      // Try next variation
    }
  }

  return null;
}

// =============================================================================
// STATISTICS FETCHING
// =============================================================================

/**
 * Fetch season statistics for a player
 */
async function fetchPlayerSeasonStats(espnId, season) {
  try {
    // types/2 = regular season
    const url = `${CONFIG.espnSeasonStatsUrl}/${season}/types/2/athletes/${espnId}/statistics/0`;
    const data = await httpGet(url);

    if (!data || data.error || !data.splits || !data.splits.categories) {
      return null;
    }

    return parseSeasonStats(data.splits.categories, season);
  } catch (error) {
    return null;
  }
}

/**
 * Parse ESPN statistics into our format
 */
function parseSeasonStats(categories, season) {
  const stats = {
    season,
    gamesPlayed: 0,
    passing: null,
    rushing: null,
    receiving: null,
  };

  for (const category of categories) {
    const catStats = {};
    if (category.stats) {
      for (const stat of category.stats) {
        catStats[stat.name] = stat.value || 0;
      }
    }

    switch (category.name) {
      case 'general':
        stats.gamesPlayed = catStats.gamesPlayed || 0;
        break;

      case 'passing':
        if (catStats.passingAttempts > 0 || catStats.completions > 0) {
          stats.passing = {
            completions: catStats.completions || 0,
            attempts: catStats.passingAttempts || 0,
            yards: catStats.passingYards || catStats.netPassingYards || 0,
            touchdowns: catStats.passingTouchdowns || 0,
            interceptions: catStats.interceptions || 0,
            completionPct: catStats.completionPct || 0,
            yardsPerAttempt: catStats.yardsPerPassAttempt || 0,
          };
        }
        break;

      case 'rushing':
        if (catStats.rushingAttempts > 0) {
          stats.rushing = {
            attempts: catStats.rushingAttempts || 0,
            yards: catStats.rushingYards || 0,
            touchdowns: catStats.rushingTouchdowns || 0,
            yardsPerAttempt: catStats.yardsPerRushAttempt || 0,
            fumbles: catStats.rushingFumbles || 0,
          };
        }
        break;

      case 'receiving':
        if (catStats.receptions > 0 || catStats.receivingTargets > 0) {
          stats.receiving = {
            targets: catStats.receivingTargets || 0,
            receptions: catStats.receptions || 0,
            yards: catStats.receivingYards || 0,
            touchdowns: catStats.receivingTouchdowns || 0,
            yardsPerReception: catStats.yardsPerReception || 0,
            catchRate: catStats.receivingTargets > 0 
              ? Math.round((catStats.receptions / catStats.receivingTargets) * 1000) / 10
              : 0,
          };
        }
        break;
    }
  }

  return stats;
}

/**
 * Calculate Half-PPR fantasy points
 */
function calculateHalfPprPoints(stats) {
  let points = 0;

  if (stats.passing) {
    points += (stats.passing.yards || 0) * 0.04;       // 1 point per 25 yards
    points += (stats.passing.touchdowns || 0) * 4;     // 4 points per TD
    points -= (stats.passing.interceptions || 0) * 1;  // -1 per INT
  }

  if (stats.rushing) {
    points += (stats.rushing.yards || 0) * 0.1;        // 1 point per 10 yards
    points += (stats.rushing.touchdowns || 0) * 6;     // 6 points per TD
  }

  if (stats.receiving) {
    points += (stats.receiving.receptions || 0) * 0.5; // 0.5 PPR
    points += (stats.receiving.yards || 0) * 0.1;      // 1 point per 10 yards
    points += (stats.receiving.touchdowns || 0) * 6;   // 6 points per TD
  }

  // Floor at 0 - negative fantasy points don't make practical sense
  return Math.max(0, Math.round(points * 10) / 10);
}

// =============================================================================
// PLAYER PROCESSING
// =============================================================================

/**
 * Process a single player - find ESPN ID and fetch all season stats
 */
async function processPlayer(player, seasonData, playerIndex) {
  const { id, name, position } = player;

  if (!CONFIG.positions.includes(position)) {
    return { found: false, reason: 'invalid_position' };
  }

  // Find ESPN ID
  const espnId = await findEspnId(name, position);
  if (!espnId) {
    return { found: false, reason: 'espn_not_found' };
  }

  await delay(CONFIG.requestDelay);

  // Fetch stats for each season
  let seasonsFound = [];
  
  for (const season of CONFIG.seasons) {
    const stats = await fetchPlayerSeasonStats(espnId, season);
    
    if (stats && stats.gamesPlayed > 0) {
      // Calculate fantasy points
      const halfPprPoints = calculateHalfPprPoints(stats);
      const halfPprPpg = stats.gamesPlayed > 0 
        ? Math.round((halfPprPoints / stats.gamesPlayed) * 10) / 10 
        : 0;

      const seasonStats = {
        playerId: id,
        espnId,
        season,
        position,
        team: player.team || 'UNK',
        gamesPlayed: stats.gamesPlayed,
        passing: stats.passing,
        rushing: stats.rushing,
        receiving: stats.receiving,
        fantasy: {
          halfPprPoints,
          halfPprPpg,
        },
      };

      // Add to season data
      if (!seasonData[season]) {
        seasonData[season] = { season, players: {} };
      }
      seasonData[season].players[id] = seasonStats;
      seasonsFound.push(season);
    }

    await delay(CONFIG.requestDelay);
  }

  // Add to player index if we found any seasons
  if (seasonsFound.length > 0) {
    playerIndex[id] = {
      id,
      name,
      position,
      espnId,
      currentTeam: player.team || 'UNK',
      seasonsAvailable: seasonsFound,
    };
    return { found: true, seasons: seasonsFound };
  }

  return { found: false, reason: 'no_stats' };
}

// =============================================================================
// FILE OUTPUT
// =============================================================================

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeJsonFile(filePath, data) {
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, json);
  return crypto.createHash('sha256').update(json).digest('hex');
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('🏈 Historical Data Ingestion - Player Pool Based');
  console.log('='.repeat(50));
  console.log(`Seasons: ${CONFIG.seasons.join(', ')}`);
  console.log(`Output: ${CONFIG.outputDir}\n`);

  // Load player pool
  console.log('📋 Loading player pool...');
  if (!fs.existsSync(CONFIG.playerPoolPath)) {
    console.error('❌ Player pool not found at:', CONFIG.playerPoolPath);
    process.exit(1);
  }

  const poolData = JSON.parse(fs.readFileSync(CONFIG.playerPoolPath, 'utf8'));
  const players = poolData.players || [];
  
  // Filter to fantasy-relevant positions
  const fantasyPlayers = players.filter(p => CONFIG.positions.includes(p.position));
  console.log(`   Total players: ${players.length}`);
  console.log(`   Fantasy-relevant: ${fantasyPlayers.length}`);

  // Initialize data structures
  const seasonData = {};
  const playerIndex = {};
  
  CONFIG.seasons.forEach(s => {
    seasonData[s] = { season: s, players: {} };
  });

  // Process players in batches
  console.log('\n🔍 Fetching player statistics from ESPN...\n');
  
  let processed = 0;
  let found = 0;
  let notFound = 0;
  const notFoundPlayers = [];

  // Process in batches
  for (let i = 0; i < fantasyPlayers.length; i += CONFIG.batchSize) {
    const batch = fantasyPlayers.slice(i, i + CONFIG.batchSize);
    
    const batchPromises = batch.map(async (player) => {
      const result = await processPlayer(player, seasonData, playerIndex);
      processed++;
      
      if (result.found) {
        found++;
        console.log(`   ✓ ${player.name} (${player.position}) - ${result.seasons.length} seasons`);
      } else {
        notFound++;
        notFoundPlayers.push({ name: player.name, position: player.position, reason: result.reason });
        console.log(`   ✗ ${player.name} (${player.position}) - ${result.reason}`);
      }

      return result;
    });

    await Promise.all(batchPromises);
    
    // Progress update
    const pct = Math.round((processed / fantasyPlayers.length) * 100);
    console.log(`   Progress: ${processed}/${fantasyPlayers.length} (${pct}%) - Found: ${found}\n`);
    
    await delay(CONFIG.batchDelay);
  }

  // Summary
  console.log('\n📊 Ingestion Summary');
  console.log('='.repeat(50));
  console.log(`Players processed: ${processed}`);
  console.log(`Players found: ${found}`);
  console.log(`Players not found: ${notFound}`);

  // Season breakdown
  console.log('\nSeason breakdown:');
  for (const season of CONFIG.seasons) {
    const count = Object.keys(seasonData[season].players).length;
    console.log(`   ${season}: ${count} players`);
  }

  // Position breakdown
  console.log('\nPosition breakdown:');
  const positionCounts = { QB: 0, RB: 0, WR: 0, TE: 0 };
  for (const p of Object.values(playerIndex)) {
    positionCounts[p.position]++;
  }
  for (const [pos, count] of Object.entries(positionCounts)) {
    console.log(`   ${pos}: ${count}`);
  }

  // Write output files
  console.log('\n💾 Writing output files...');
  ensureDirectory(CONFIG.outputDir);
  ensureDirectory(path.join(CONFIG.outputDir, 'seasons'));
  ensureDirectory(path.join(CONFIG.outputDir, 'players'));

  const checksums = {};

  // Write season files
  for (const season of CONFIG.seasons) {
    const filePath = path.join(CONFIG.outputDir, 'seasons', `${season}.json`);
    checksums[`seasons/${season}.json`] = writeJsonFile(filePath, seasonData[season]);
    console.log(`   ✓ seasons/${season}.json`);
  }

  // Write player index
  const indexPath = path.join(CONFIG.outputDir, 'players', 'index.json');
  checksums['players/index.json'] = writeJsonFile(indexPath, {
    generatedAt: new Date().toISOString(),
    playerCount: Object.keys(playerIndex).length,
    players: playerIndex,
  });
  console.log('   ✓ players/index.json');

  // Write manifest
  const manifest = {
    version: '2.0.0',
    generatedAt: new Date().toISOString(),
    currentSeason: CONFIG.currentSeason,
    historicalSeasons: CONFIG.seasons,
    playerCount: Object.keys(playerIndex).length,
    sourcePlayerPool: 'player-pool-2025.json',
    checksums,
  };
  
  const manifestPath = path.join(CONFIG.outputDir, 'manifest.json');
  writeJsonFile(manifestPath, manifest);
  console.log('   ✓ manifest.json');

  // Write not-found report
  if (notFoundPlayers.length > 0) {
    const reportPath = path.join(CONFIG.outputDir, 'not-found-report.json');
    writeJsonFile(reportPath, {
      generatedAt: new Date().toISOString(),
      count: notFoundPlayers.length,
      players: notFoundPlayers,
    });
    console.log(`   ✓ not-found-report.json (${notFoundPlayers.length} players)`);
  }

  console.log('\n✅ Ingestion complete!');
  console.log(`   Total unique players: ${Object.keys(playerIndex).length}`);
}

// Run
main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});



