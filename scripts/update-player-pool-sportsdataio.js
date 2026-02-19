#!/usr/bin/env node
/**
 * Update Player Pool with SportsDataIO Projections
 * 
 * This script:
 * 1. Fetches 2025 season projections from SportsDataIO (with caching)
 * 2. Matches players to existing PLAYER_POOL by name
 * 3. Updates the proj field with PPR fantasy points
 * 4. Writes updated PLAYER_POOL back to lib/playerPool.js
 * 
 * Usage:
 *   node scripts/update-player-pool-sportsdataio.js
 *   node scripts/update-player-pool-sportsdataio.js --force  # Force refresh cache
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim();
    }
  });
}

const { getProjections, getCacheInfo } = require('../lib/sportsdataio');

const PLAYER_POOL_PATH = path.join(__dirname, '../lib/playerPool.js');

/**
 * Parse the PLAYER_POOL from the JS file
 */
function parsePlayerPool() {
  const content = fs.readFileSync(PLAYER_POOL_PATH, 'utf8');
  
  // Find the PLAYER_POOL array in the file
  const match = content.match(/export const PLAYER_POOL = \[([\s\S]*?)\];/);
  if (!match) {
    throw new Error('Could not find PLAYER_POOL in file');
  }
  
  // Parse the array (it's valid JSON-ish, we need to eval it carefully)
  // For safety, we'll use a different approach - read the whole file and extract
  const playerPoolStart = content.indexOf('export const PLAYER_POOL = [');
  const playerPoolEnd = content.indexOf('];', playerPoolStart) + 2;
  
  // Extract just the array part and make it valid JSON
  let arrayStr = content.slice(playerPoolStart + 'export const PLAYER_POOL = '.length, playerPoolEnd);
  
  // The array uses single quotes and trailing commas which isn't valid JSON
  // We'll use a simple regex-based approach to extract player objects
  const players = [];
  const playerRegex = /\{\s*"name":\s*"([^"]+)"[^}]*\}/g;
  let playerMatch;
  
  // Actually, let's just require the module since it's valid JS
  // We need to handle the ES module syntax
  const tempFile = path.join(__dirname, '../data/cache/temp_player_pool.cjs');
  
  // Convert ES module to CommonJS
  const cjsContent = content
    .replace('export const PLAYER_POOL =', 'module.exports.PLAYER_POOL =')
    .replace('export function groupPicksByPosition', 'module.exports.groupPicksByPosition = function');
  
  fs.mkdirSync(path.dirname(tempFile), { recursive: true });
  fs.writeFileSync(tempFile, cjsContent);
  
  const { PLAYER_POOL } = require(tempFile);
  
  // Clean up temp file
  fs.unlinkSync(tempFile);
  
  return PLAYER_POOL;
}

/**
 * Normalize player name for matching
 */
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ')     // Normalize spaces
    .trim();
}

/**
 * Find best match for a player name in the projections
 */
function findProjection(playerName, projectionsMap) {
  const normalized = normalizeName(playerName);
  
  // Try exact match first
  for (const [projName, proj] of projectionsMap) {
    if (normalizeName(projName) === normalized) {
      return proj;
    }
  }
  
  // Try partial match (last name + first initial)
  const parts = normalized.split(' ');
  if (parts.length >= 2) {
    const lastName = parts[parts.length - 1];
    const firstInitial = parts[0][0];
    
    for (const [projName, proj] of projectionsMap) {
      const projNorm = normalizeName(projName);
      const projParts = projNorm.split(' ');
      if (projParts.length >= 2) {
        const projLastName = projParts[projParts.length - 1];
        const projFirstInitial = projParts[0][0];
        
        if (lastName === projLastName && firstInitial === projFirstInitial) {
          return proj;
        }
      }
    }
  }
  
  return null;
}

/**
 * Update PLAYER_POOL with projections
 */
async function updatePlayerPool(forceRefresh = false) {
  const apiKey = process.env.SPORTSDATAIO_API_KEY;
  
  if (!apiKey) {
    console.error('Error: SPORTSDATAIO_API_KEY not found in environment');
    console.error('Add it to .env.local file');
    process.exit(1);
  }
  
  // Check cache info
  const cacheInfo = getCacheInfo();
  if (cacheInfo && !forceRefresh) {
    console.log(`Cache info: ${cacheInfo.playerCount} players, ${cacheInfo.ageHours} hours old`);
  }
  
  // Get projections
  console.log('Fetching SportsDataIO projections...');
  const projections = await getProjections(apiKey, forceRefresh);
  
  // Build map for quick lookup
  const projectionsMap = new Map();
  projections.forEach(p => {
    if (p.Name && p.Position && ['QB', 'RB', 'WR', 'TE'].includes(p.Position)) {
      projectionsMap.set(p.Name, p);
    }
  });
  console.log(`Loaded ${projectionsMap.size} relevant projections (QB/RB/WR/TE)`);
  
  // Parse current player pool
  console.log('Parsing current PLAYER_POOL...');
  const playerPool = parsePlayerPool();
  console.log(`Found ${playerPool.length} players in PLAYER_POOL`);
  
  // Update projections
  let matched = 0;
  let unmatched = [];
  
  playerPool.forEach(player => {
    const proj = findProjection(player.name, projectionsMap);
    
    if (proj) {
      // Update projection
      const pprPoints = proj.FantasyPointsPPR || 0;
      player.proj = pprPoints > 0 ? pprPoints.toFixed(1) : 'xx';
      
      // Add detailed projections if we want them later
      player.sportsDataProjections = {
        ppr: proj.FantasyPointsPPR || 0,
        halfPpr: proj.FantasyPointsHalfPPR || 0,
        standard: proj.FantasyPoints || 0,
        passingYards: proj.PassingYards || 0,
        passingTDs: proj.PassingTouchdowns || 0,
        rushingYards: proj.RushingYards || 0,
        rushingTDs: proj.RushingTouchdowns || 0,
        receivingYards: proj.ReceivingYards || 0,
        receivingTDs: proj.ReceivingTouchdowns || 0,
        receptions: proj.Receptions || 0,
      };
      
      matched++;
    } else {
      unmatched.push(player.name);
    }
  });
  
  console.log(`\nMatched: ${matched}/${playerPool.length} players`);
  
  if (unmatched.length > 0) {
    console.log(`\nUnmatched players (${unmatched.length}):`);
    unmatched.slice(0, 20).forEach(name => console.log(`  - ${name}`));
    if (unmatched.length > 20) {
      console.log(`  ... and ${unmatched.length - 20} more`);
    }
  }
  
  // Generate updated file content
  const header = `/**
 * Updated Player Pool with SportsDataIO Projections
 * 
 * This file contains all players with their projections, rankings, and statistics.
 * Projections sourced from SportsDataIO NFL API.
 * 
 * Generated: ${new Date().toISOString()}
 * Total Players: ${playerPool.length}
 * Matched Projections: ${matched}
 * Source: SportsDataIO Player Season Projection Stats
 */

export const PLAYER_POOL = `;

  const footer = `

export function groupPicksByPosition(picks, pool = PLAYER_POOL) {
  const grouped = { QB: [], RB: [], WR: [], TE: [] };

  if (!Array.isArray(picks)) return grouped;

  picks.forEach((pick) => {
    const playerName = typeof pick === 'string' ? pick : (pick && (pick.player || pick.name));
    if (!playerName) return;
    const player = pool.find((p) => p.name === playerName);
    if (player && grouped[player.position]) {
      grouped[player.position].push(player);
    }
  });

  return grouped;
}
`;

  const content = header + JSON.stringify(playerPool, null, 2) + ';' + footer;
  
  // Write updated file
  fs.writeFileSync(PLAYER_POOL_PATH, content);
  console.log(`\nUpdated ${PLAYER_POOL_PATH}`);
  
  // Summary
  console.log('\n=== Summary ===');
  console.log(`Total players: ${playerPool.length}`);
  console.log(`With projections: ${matched}`);
  console.log(`Without projections: ${unmatched.length}`);
  
  // Show top 10 by projection
  const sorted = [...playerPool]
    .filter(p => p.proj !== 'xx')
    .sort((a, b) => parseFloat(b.proj) - parseFloat(a.proj));
  
  console.log('\nTop 10 by PPR projection:');
  sorted.slice(0, 10).forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name} (${p.position}) - ${p.proj} pts`);
  });
}

// Run
const forceRefresh = process.argv.includes('--force');
updatePlayerPool(forceRefresh).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

