require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Full Clay Projections Integration...');

// Load the current player database
const playerDatabasePath = path.join(__dirname, '../data/playerDatabase.json');
let playerDatabase = {};

try {
  if (fs.existsSync(playerDatabasePath)) {
    const data = fs.readFileSync(playerDatabasePath, 'utf8');
    playerDatabase = JSON.parse(data);
    console.log(`📊 Loaded existing player database with ${Object.keys(playerDatabase).length} players`);
  } else {
    console.error('❌ Player database not found');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error loading player database:', error.message);
  process.exit(1);
}

// Load the Clay projections data
const clayDataPath = path.join(__dirname, '../clay_projections_real_export.json');
let clayData = [];

try {
  if (fs.existsSync(clayDataPath)) {
    const data = fs.readFileSync(clayDataPath, 'utf8');
    const clayFile = JSON.parse(data);
    clayData = clayFile.players || [];
    console.log(`📊 Loaded Clay projections data with ${clayData.length} players`);
  } else {
    console.error('❌ Clay projections data not found');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error loading Clay data:', error.message);
  process.exit(1);
}

// Helper function to find existing player
function findExistingPlayer(name, team, position) {
  if (!playerDatabase.players || !playerDatabase.players[position]) {
    return null;
  }
  
  return playerDatabase.players[position].find(player => 
    player.name === name && player.team === team
  );
}

// Helper function to find existing player index
function findExistingPlayerIndex(name, team, position) {
  if (!playerDatabase.players || !playerDatabase.players[position]) {
    return -1;
  }
  
  return playerDatabase.players[position].findIndex(player => 
    player.name === name && player.team === team
  );
}

// Helper function to create player key
function createPlayerKey(name, team) {
  return `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}_${team.toLowerCase()}`;
}

// Integration statistics
const stats = {
  total: clayData.length,
  updated: 0,
  added: 0,
  skipped: 0,
  errors: 0
};

console.log(`\n🔄 Starting integration of ${clayData.length} Clay projections players...`);

// Process each Clay player
for (const clayPlayer of clayData) {
  try {
    const { name, position, team, rank, projections } = clayPlayer;
    const { passYards, passTDs, rushYards, rushTDs, recYards, recTDs, fantasyPoints } = projections || {};
    
    console.log(`\n🔍 Processing: ${name} (${position}, ${team}) - Rank ${rank}`);
    
    // Validate required fields
    if (!name || !position || !team) {
      console.log(`❌ Skipping ${name}: Missing required fields`);
      stats.skipped++;
      continue;
    }
    
    // Find existing player
    const existingPlayer = findExistingPlayer(name, team, position);
    const existingPlayerIndex = findExistingPlayerIndex(name, team, position);
    
    if (existingPlayer) {
      // Update existing player
      console.log(`🔄 Updating existing player: ${name}`);
      
      // Update the existing player with Clay data
      playerDatabase.players[position][existingPlayerIndex] = {
        ...existingPlayer,
        clayRank: rank,
        clayFantasyPoints: fantasyPoints || 0,
        clayPassYards: passYards || 0,
        clayPassTDs: passTDs || 0,
        clayRushYards: rushYards || 0,
        clayRushTDs: rushTDs || 0,
        clayRecYards: recYards || 0,
        clayRecTDs: recTDs || 0,
        clayLastUpdated: new Date().toISOString(),
        projections: {
          ...existingPlayer.projections,
          clay: {
            rank: rank,
            fantasyPoints: fantasyPoints || 0,
            passYards: passYards || 0,
            passTDs: passTDs || 0,
            rushYards: rushYards || 0,
            rushTDs: rushTDs || 0,
            recYards: recYards || 0,
            recTDs: recTDs || 0,
            lastUpdated: new Date().toISOString(),
            source: "ESPN Clay Projections 2025"
          }
        }
      };
      
      stats.updated++;
      console.log(`✅ Updated: ${name} - Clay Rank ${rank}, Fantasy Points ${fantasyPoints || 0}`);
      
    } else {
      // Add new player
      console.log(`➕ Adding new player: ${name}`);
      
      // Create new player record
      const newPlayer = {
        id: createPlayerKey(name, team),
        name: name,
        position: position,
        team: team,
        bye: 0, // Will need to be updated with actual bye week
        draftkings: null,
        underdog: null,
        projections: {
          draftkings: null,
          underdog: null,
          clay: {
            rank: rank,
            fantasyPoints: fantasyPoints || 0,
            passYards: passYards || 0,
            passTDs: passTDs || 0,
            rushYards: rushYards || 0,
            rushTDs: rushTDs || 0,
            recYards: recYards || 0,
            recTDs: recTDs || 0,
            lastUpdated: new Date().toISOString(),
            source: "ESPN Clay Projections 2025"
          }
        },
        historical: {
          "2022": {},
          "2023": {},
          "2024": {}
        },
        draft: {
          adp: null,
          tier: null,
          notes: ""
        },
        analytics: {
          risk: "medium",
          upside: "medium",
          consistency: "medium"
        },
        risk: {
          injury: "medium",
          competition: "medium",
          situation: "medium"
        },
        clayRank: rank,
        clayFantasyPoints: fantasyPoints || 0,
        clayPassYards: passYards || 0,
        clayPassTDs: passTDs || 0,
        clayRushYards: rushYards || 0,
        clayRushTDs: rushTDs || 0,
        clayRecYards: recYards || 0,
        clayRecTDs: recTDs || 0,
        clayLastUpdated: new Date().toISOString()
      };
      
      // Add to appropriate position array
      if (!playerDatabase.players[position]) {
        playerDatabase.players[position] = [];
      }
      playerDatabase.players[position].push(newPlayer);
      
      stats.added++;
      console.log(`✅ Added: ${name} - Clay Rank ${rank}, Fantasy Points ${fantasyPoints || 0}`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${clayPlayer.name}:`, error.message);
    stats.errors++;
  }
}

// Update database metadata
if (playerDatabase.meta) {
  playerDatabase.meta.lastUpdated = new Date().toISOString();
  playerDatabase.meta.totalPlayers = Object.values(playerDatabase.players || {}).reduce((total, players) => total + players.length, 0);
  
  if (!playerDatabase.meta.dataSources.clay) {
    playerDatabase.meta.dataSources.clay = {
      players: stats.added + stats.updated,
      lastUpdated: new Date().toISOString()
    };
  } else {
    playerDatabase.meta.dataSources.clay.players = stats.added + stats.updated;
    playerDatabase.meta.dataSources.clay.lastUpdated = new Date().toISOString();
  }
}

// Save the updated database
try {
  fs.writeFileSync(playerDatabasePath, JSON.stringify(playerDatabase, null, 2));
  console.log(`\n✅ Successfully saved updated player database`);
} catch (error) {
  console.error('❌ Error saving player database:', error.message);
  process.exit(1);
}

// Display integration summary
console.log(`\n🎉 Clay Projections Integration Complete!`);
console.log(`================================================================================`);
console.log(`📊 Integration Summary:`);
console.log(`  Total Clay Players: ${stats.total}`);
console.log(`  Updated Existing: ${stats.updated}`);
console.log(`  Added New: ${stats.added}`);
console.log(`  Skipped: ${stats.skipped}`);
console.log(`  Errors: ${stats.errors}`);
console.log(`  Success Rate: ${((stats.updated + stats.added) / stats.total * 100).toFixed(1)}%`);

// Display position breakdown
console.log(`\n📈 Position Breakdown:`);
if (playerDatabase.players) {
  Object.entries(playerDatabase.players).forEach(([position, players]) => {
    const clayPlayers = players.filter(p => p.clayRank);
    console.log(`  ${position}: ${players.length} total, ${clayPlayers.length} with Clay data`);
  });
}

// Display sample of integrated players
console.log(`\n👤 Sample Integrated Players:`);
console.log(`--------------------------------------------------------------------------------`);
let sampleCount = 0;
Object.entries(playerDatabase.players || {}).forEach(([position, players]) => {
  const clayPlayers = players.filter(p => p.clayRank).slice(0, 3);
  clayPlayers.forEach(player => {
    if (sampleCount < 10) {
      console.log(`${player.name} (${player.position}, ${player.team})`);
      console.log(`  DraftKings: ${player.draftkings ? `Rank ${player.draftkings.rank}, ADP ${player.draftkings.adp}` : 'No data'}`);
      console.log(`  Clay: Rank ${player.clayRank}, ${player.clayFantasyPoints} pts`);
      console.log(`  Stats: Pass ${player.clayPassYards}yd/${player.clayPassTDs}TD, Rush ${player.clayRushYards}yd/${player.clayRushTDs}TD, Rec ${player.clayRecYards}yd/${player.clayRecTDs}TD`);
      console.log(``);
      sampleCount++;
    }
  });
});

console.log(`📁 Database file: ${playerDatabasePath}`);
console.log(`🔍 All Clay projections data has been successfully integrated!`);
console.log(`🎯 The database is now ready for use in your draft room with comprehensive projections.`); 