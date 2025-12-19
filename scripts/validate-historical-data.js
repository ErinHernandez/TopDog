#!/usr/bin/env node

/**
 * Historical Data Validation Script
 * 
 * Validates the integrity and quality of historical player statistics
 * before deployment. Run this after ingestion to catch data issues.
 * 
 * Usage: node scripts/validate-historical-data.js
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  dataDir: path.join(__dirname, '..', 'public', 'data', 'history'),
  positions: ['QB', 'RB', 'WR', 'TE'],
  seasons: [2021, 2022, 2023, 2024],
};

// Validation thresholds
const THRESHOLDS = {
  // Maximum reasonable values per season
  maxGamesPerSeason: 17,
  maxPassingYards: 6000,
  maxRushingYards: 2500,
  maxReceivingYards: 2200,
  maxPassingTDs: 60,
  maxRushingTDs: 30,
  maxReceivingTDs: 25,
  maxReceptions: 160,
  maxTargets: 220,
  
  // Minimum players per position per season
  minPlayersPerPosition: {
    QB: 20,
    RB: 40,
    WR: 60,
    TE: 25,
  },
  
  // Fantasy point sanity checks
  maxHalfPprPoints: 500,
  minHalfPprPointsForStarter: 50,
};

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

class ValidationReport {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
    this.stats = {
      filesChecked: 0,
      playersValidated: 0,
      seasonsValidated: 0,
    };
  }

  addError(message, context = {}) {
    this.errors.push({ message, context, severity: 'error' });
  }

  addWarning(message, context = {}) {
    this.warnings.push({ message, context, severity: 'warning' });
  }

  addInfo(message) {
    this.info.push(message);
  }

  get isValid() {
    return this.errors.length === 0;
  }

  print() {
    console.log('\n📊 Validation Report');
    console.log('====================\n');

    console.log('📈 Statistics:');
    console.log(`   Files checked: ${this.stats.filesChecked}`);
    console.log(`   Seasons validated: ${this.stats.seasonsValidated}`);
    console.log(`   Players validated: ${this.stats.playersValidated}`);

    if (this.info.length > 0) {
      console.log('\nℹ️  Info:');
      this.info.forEach(msg => console.log(`   ${msg}`));
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${this.warnings.length}):`);
      this.warnings.slice(0, 20).forEach(w => {
        console.log(`   ${w.message}`);
        if (Object.keys(w.context).length > 0) {
          console.log(`      Context: ${JSON.stringify(w.context)}`);
        }
      });
      if (this.warnings.length > 20) {
        console.log(`   ... and ${this.warnings.length - 20} more warnings`);
      }
    }

    if (this.errors.length > 0) {
      console.log(`\n❌ Errors (${this.errors.length}):`);
      this.errors.forEach(e => {
        console.log(`   ${e.message}`);
        if (Object.keys(e.context).length > 0) {
          console.log(`      Context: ${JSON.stringify(e.context)}`);
        }
      });
    }

    console.log('\n====================');
    if (this.isValid) {
      console.log('✅ Validation PASSED');
    } else {
      console.log('❌ Validation FAILED');
    }
    console.log(`   ${this.errors.length} errors, ${this.warnings.length} warnings\n`);
  }
}

/**
 * Load and parse a JSON file
 */
function loadJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

/**
 * Validate manifest file
 */
function validateManifest(report) {
  console.log('📄 Validating manifest.json...');
  
  const manifestPath = path.join(CONFIG.dataDir, 'manifest.json');
  const manifest = loadJsonFile(manifestPath);
  
  if (!manifest) {
    report.addError('manifest.json not found', { path: manifestPath });
    return null;
  }
  
  report.stats.filesChecked++;
  
  // Required fields
  const requiredFields = ['version', 'generatedAt', 'currentSeason', 'historicalSeasons', 'playerCount', 'checksums'];
  for (const field of requiredFields) {
    if (manifest[field] === undefined) {
      report.addError(`Missing required field: ${field}`, { file: 'manifest.json' });
    }
  }
  
  // Validate seasons
  if (manifest.historicalSeasons) {
    for (const season of CONFIG.seasons) {
      if (!manifest.historicalSeasons.includes(season)) {
        report.addWarning(`Expected season ${season} not in manifest`, { seasons: manifest.historicalSeasons });
      }
    }
  }
  
  // Validate checksums reference files that exist
  if (manifest.checksums) {
    for (const [filePath, checksum] of Object.entries(manifest.checksums)) {
      const fullPath = path.join(CONFIG.dataDir, filePath);
      if (!fs.existsSync(fullPath)) {
        report.addError(`Checksum references missing file: ${filePath}`);
      }
    }
  }
  
  report.addInfo(`Manifest version: ${manifest.version}`);
  report.addInfo(`Player count: ${manifest.playerCount}`);
  
  return manifest;
}

/**
 * Validate player index
 */
function validatePlayerIndex(report) {
  console.log('📋 Validating player index...');
  
  const indexPath = path.join(CONFIG.dataDir, 'players', 'index.json');
  const index = loadJsonFile(indexPath);
  
  if (!index) {
    report.addError('players/index.json not found', { path: indexPath });
    return null;
  }
  
  report.stats.filesChecked++;
  
  // Validate structure
  if (!index.players || typeof index.players !== 'object') {
    report.addError('Invalid player index structure: missing players object');
    return null;
  }
  
  const playerCount = Object.keys(index.players).length;
  report.addInfo(`Total players in index: ${playerCount}`);
  
  // Validate each player
  let validPlayers = 0;
  const positionCounts = { QB: 0, RB: 0, WR: 0, TE: 0 };
  
  for (const [playerId, player] of Object.entries(index.players)) {
    // Check required fields
    if (!player.id || !player.name || !player.position) {
      report.addWarning(`Player missing required fields`, { playerId, fields: { id: !!player.id, name: !!player.name, position: !!player.position } });
      continue;
    }
    
    // Validate position
    if (!CONFIG.positions.includes(player.position)) {
      report.addWarning(`Invalid position: ${player.position}`, { playerId });
      continue;
    }
    
    positionCounts[player.position]++;
    validPlayers++;
  }
  
  // Check position distribution
  for (const [pos, count] of Object.entries(positionCounts)) {
    report.addInfo(`${pos} count: ${count}`);
    if (count < 10) {
      report.addWarning(`Low player count for ${pos}: ${count}`);
    }
  }
  
  report.addInfo(`Valid players: ${validPlayers}/${playerCount}`);
  
  return index;
}

/**
 * Validate season data file
 */
function validateSeasonFile(season, report, playerIndex) {
  console.log(`📅 Validating ${season} season data...`);
  
  const seasonPath = path.join(CONFIG.dataDir, 'seasons', `${season}.json`);
  const seasonData = loadJsonFile(seasonPath);
  
  if (!seasonData) {
    report.addError(`Season file not found: ${season}.json`, { path: seasonPath });
    return null;
  }
  
  report.stats.filesChecked++;
  report.stats.seasonsValidated++;
  
  // Validate structure
  if (!seasonData.players || typeof seasonData.players !== 'object') {
    report.addError(`Invalid season structure: missing players object`, { season });
    return null;
  }
  
  const playerCount = Object.keys(seasonData.players).length;
  report.addInfo(`${season} players: ${playerCount}`);
  
  // Track position counts for this season
  const positionCounts = { QB: 0, RB: 0, WR: 0, TE: 0 };
  
  // Validate each player's season stats
  for (const [playerId, stats] of Object.entries(seasonData.players)) {
    report.stats.playersValidated++;
    
    // Basic structure checks
    if (stats.season !== season) {
      report.addError(`Season mismatch: expected ${season}, got ${stats.season}`, { playerId });
    }
    
    if (!stats.position || !CONFIG.positions.includes(stats.position)) {
      report.addWarning(`Invalid position in stats`, { playerId, position: stats.position });
      continue;
    }
    
    positionCounts[stats.position]++;
    
    // Games played validation
    const maxGames = season >= 2021 ? 17 : 16;
    if (stats.gamesPlayed > maxGames) {
      report.addWarning(`Games played exceeds max (${maxGames})`, { playerId, gamesPlayed: stats.gamesPlayed });
    }
    
    // Stat-specific validation
    if (stats.passing) {
      if (stats.passing.yards > THRESHOLDS.maxPassingYards) {
        report.addWarning(`Unusually high passing yards`, { playerId, yards: stats.passing.yards });
      }
      if (stats.passing.touchdowns > THRESHOLDS.maxPassingTDs) {
        report.addWarning(`Unusually high passing TDs`, { playerId, tds: stats.passing.touchdowns });
      }
      if (stats.passing.completionPct > 100) {
        report.addError(`Invalid completion percentage`, { playerId, pct: stats.passing.completionPct });
      }
    }
    
    if (stats.rushing) {
      if (stats.rushing.yards > THRESHOLDS.maxRushingYards) {
        report.addWarning(`Unusually high rushing yards`, { playerId, yards: stats.rushing.yards });
      }
      if (stats.rushing.touchdowns > THRESHOLDS.maxRushingTDs) {
        report.addWarning(`Unusually high rushing TDs`, { playerId, tds: stats.rushing.touchdowns });
      }
    }
    
    if (stats.receiving) {
      if (stats.receiving.yards > THRESHOLDS.maxReceivingYards) {
        report.addWarning(`Unusually high receiving yards`, { playerId, yards: stats.receiving.yards });
      }
      if (stats.receiving.receptions > THRESHOLDS.maxReceptions) {
        report.addWarning(`Unusually high receptions`, { playerId, receptions: stats.receiving.receptions });
      }
      if (stats.receiving.catchRate > 100) {
        report.addError(`Invalid catch rate`, { playerId, rate: stats.receiving.catchRate });
      }
    }
    
    // Fantasy points validation
    if (stats.fantasy) {
      if (stats.fantasy.halfPprPoints > THRESHOLDS.maxHalfPprPoints) {
        report.addWarning(`Unusually high fantasy points`, { playerId, points: stats.fantasy.halfPprPoints });
      }
      // Negative points are valid (e.g., QB with multiple INTs and minimal yards)
      if (stats.fantasy.halfPprPoints < -10) {
        report.addWarning(`Very negative fantasy points`, { playerId, points: stats.fantasy.halfPprPoints });
      }
      
      // Verify PPG calculation
      if (stats.gamesPlayed > 0) {
        const expectedPpg = Math.round((stats.fantasy.halfPprPoints / stats.gamesPlayed) * 10) / 10;
        if (Math.abs(expectedPpg - stats.fantasy.halfPprPpg) > 0.2) {
          report.addWarning(`PPG calculation mismatch`, { 
            playerId, 
            stored: stats.fantasy.halfPprPpg, 
            calculated: expectedPpg 
          });
        }
      }
    }
  }
  
  // Validate position counts
  for (const [pos, minCount] of Object.entries(THRESHOLDS.minPlayersPerPosition)) {
    if (positionCounts[pos] < minCount) {
      report.addWarning(`Low ${pos} count for ${season}`, { 
        count: positionCounts[pos], 
        minimum: minCount 
      });
    }
  }
  
  return seasonData;
}

/**
 * Cross-reference validation
 */
function validateCrossReferences(report, playerIndex, seasonDataMap) {
  console.log('🔗 Validating cross-references...');
  
  if (!playerIndex || !playerIndex.players) return;
  
  // Check that players in index have corresponding season data
  for (const [playerId, player] of Object.entries(playerIndex.players)) {
    if (!player.seasonsAvailable || player.seasonsAvailable.length === 0) {
      report.addWarning(`Player has no seasons available`, { playerId });
      continue;
    }
    
    for (const season of player.seasonsAvailable) {
      const seasonData = seasonDataMap[season];
      if (seasonData && !seasonData.players[playerId]) {
        report.addWarning(`Player in index but not in season data`, { 
          playerId, 
          season 
        });
      }
    }
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('🔍 Historical Data Validation');
  console.log('=============================\n');
  console.log(`Data directory: ${CONFIG.dataDir}\n`);
  
  const report = new ValidationReport();
  
  // Check data directory exists
  if (!fs.existsSync(CONFIG.dataDir)) {
    report.addError('Data directory does not exist', { path: CONFIG.dataDir });
    report.print();
    process.exit(1);
  }
  
  // Validate manifest
  const manifest = validateManifest(report);
  
  // Validate player index
  const playerIndex = validatePlayerIndex(report);
  
  // Validate each season
  const seasonDataMap = {};
  for (const season of CONFIG.seasons) {
    const seasonData = validateSeasonFile(season, report, playerIndex);
    if (seasonData) {
      seasonDataMap[season] = seasonData;
    }
  }
  
  // Cross-reference validation
  validateCrossReferences(report, playerIndex, seasonDataMap);
  
  // Print report
  report.print();
  
  // Exit with appropriate code
  process.exit(report.isValid ? 0 : 1);
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Validation script error:', error);
    process.exit(1);
  });
}

module.exports = { main, ValidationReport };



