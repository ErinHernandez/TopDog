#!/usr/bin/env node
/**
 * Script to integrate Mike Clay projections into the player database
 */

const fs = require('fs');
const path = require('path');

// Import the database structure
const { PLAYER_DATABASE, PLAYER_TEMPLATE, PlayerDatabase } = require('../lib/playerDatabase.js');

function loadClayProjections() {
  try {
    const clayDataPath = path.join(__dirname, '../clay_projections_final.json');
    const rawData = fs.readFileSync(clayDataPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error loading Clay projections:', error);
    return [];
  }
}

function createPlayerFromClay(clayPlayer) {
  // Create a new player object based on our template
  const player = JSON.parse(JSON.stringify(PLAYER_TEMPLATE));
  
  // Basic info
  player.name = clayPlayer.name;
  player.position = clayPlayer.position;
  player.id = `${clayPlayer.position}-${clayPlayer.name.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`;
  
  // Mike Clay projections
  player.projections.mikeClay.fantasyPoints = clayPlayer.fantasy_points;
  player.projections.mikeClay.positionRank = clayPlayer.position_rank;
  player.projections.mikeClay.games = clayPlayer.games;
  
  return player;
}

function integrateClayProjections() {
  console.log('Loading Mike Clay projections...');
  const clayData = loadClayProjections();
  
  if (clayData.length === 0) {
    console.error('No Clay projection data found!');
    return false;
  }
  
  console.log(`Found ${clayData.length} players in Clay projections`);
  
  // Clear existing data and rebuild
  PLAYER_DATABASE.players = { QB: [], RB: [], WR: [], TE: [] };
  
  // Add source info
  PLAYER_DATABASE.meta.sources.projections = ['Mike Clay ESPN 2025'];
  PLAYER_DATABASE.meta.lastUpdated = new Date().toISOString();
  
  let processed = 0;
  let byPosition = { QB: 0, RB: 0, WR: 0, TE: 0 };
  
  for (const clayPlayer of clayData) {
    try {
      const player = createPlayerFromClay(clayPlayer);
      PlayerDatabase.addPlayer(player);
      processed++;
      byPosition[clayPlayer.position]++;
    } catch (error) {
      console.error(`Error processing player ${clayPlayer.name}:`, error);
    }
  }
  
  console.log(`\nSuccessfully integrated ${processed} players:`);
  console.log(`- QB: ${byPosition.QB} players`);
  console.log(`- RB: ${byPosition.RB} players`);
  console.log(`- WR: ${byPosition.WR} players`);
  console.log(`- TE: ${byPosition.TE} players`);
  
  return true;
}

function saveDatabase() {
  try {
    const outputPath = path.join(__dirname, '../data/playerDatabase.json');
    
    // Create data directory if it doesn't exist
    const dataDir = path.dirname(outputPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Save the database
    fs.writeFileSync(outputPath, PlayerDatabase.exportToJSON());
    console.log(`\nPlayer database saved to: ${outputPath}`);
    
    // Also create a backup with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(dataDir, `playerDatabase_backup_${timestamp}.json`);
    fs.writeFileSync(backupPath, PlayerDatabase.exportToJSON());
    console.log(`Backup saved to: ${backupPath}`);
    
    return true;
  } catch (error) {
    console.error('Error saving database:', error);
    return false;
  }
}

function generateSummaryReport() {
  console.log('\n' + '='.repeat(60));
  console.log('PLAYER DATABASE SUMMARY REPORT');
  console.log('='.repeat(60));
  
  for (const position of ['QB', 'RB', 'WR', 'TE']) {
    const players = PlayerDatabase.sortByProjection(position);
    console.log(`\nTop 10 ${position}s by Mike Clay Fantasy Points:`);
    console.log('-'.repeat(50));
    
    players.slice(0, 10).forEach((player, idx) => {
      const rank = player.projections.mikeClay.positionRank;
      const points = player.projections.mikeClay.fantasyPoints;
      console.log(`${(idx + 1).toString().padStart(2)}. ${position}${rank.toString().padStart(2)} ${player.name.padEnd(25)} ${points.toFixed(1).padStart(6)} pts`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`Database last updated: ${PLAYER_DATABASE.meta.lastUpdated}`);
  console.log(`Total players: ${PlayerDatabase.getAllPlayers().length}`);
  console.log('Data sources:');
  console.log(`- Projections: ${PLAYER_DATABASE.meta.sources.projections.join(', ')}`);
  console.log('='.repeat(60));
}

// Main execution
function main() {
  console.log('🏈 Integrating Mike Clay ESPN Projections into Player Database');
  console.log('=' .repeat(70));
  
  if (!integrateClayProjections()) {
    console.error('Failed to integrate Clay projections');
    process.exit(1);
  }
  
  if (!saveDatabase()) {
    console.error('Failed to save database');
    process.exit(1);
  }
  
  generateSummaryReport();
  
  console.log('\n✅ Integration complete! Database is ready for additional stats.');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  integrateClayProjections,
  saveDatabase,
  generateSummaryReport
};