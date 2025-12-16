require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

console.log('🔄 Starting Amon-Ra St. Brown Data Merge...');

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

// Find the existing Amon-Ra St. Brown in the WR array
let existingPlayer = null;
let existingPlayerIndex = -1;

if (playerDatabase.players && playerDatabase.players.WR) {
  for (let i = 0; i < playerDatabase.players.WR.length; i++) {
    const player = playerDatabase.players.WR[i];
    if (player.name === "Amon-Ra St. Brown" && player.team === "DET") {
      existingPlayer = player;
      existingPlayerIndex = i;
      break;
    }
  }
}

// Find the new Clay integration entry
const clayEntry = playerDatabase["amonrastbrown_det"];

console.log(`🔍 Found existing player: ${existingPlayer ? 'Yes' : 'No'}`);
console.log(`🔍 Found Clay entry: ${clayEntry ? 'Yes' : 'No'}`);

if (existingPlayer && clayEntry) {
  console.log(`\n📊 Existing Player Data:`);
  console.log(`  Name: ${existingPlayer.name}`);
  console.log(`  Position: ${existingPlayer.position}`);
  console.log(`  Team: ${existingPlayer.team}`);
  console.log(`  DraftKings Rank: ${existingPlayer.draftkings?.rank}`);
  console.log(`  DraftKings ADP: ${existingPlayer.draftkings?.adp}`);
  
  console.log(`\n📊 Clay Integration Data:`);
  console.log(`  Clay Rank: ${clayEntry.clayRank}`);
  console.log(`  Clay Fantasy Points: ${clayEntry.clayFantasyPoints}`);
  console.log(`  Clay Stats: Pass ${clayEntry.clayPassYards}yd/${clayEntry.clayPassTDs}TD, Rush ${clayEntry.clayRushYards}yd/${clayEntry.clayRushTDs}TD, Rec ${clayEntry.clayRecYards}yd/${clayEntry.clayRecTDs}TD`);
  
  // Merge the data
  console.log(`\n🔄 Merging data...`);
  
  // Update the existing player with Clay data
  playerDatabase.players.WR[existingPlayerIndex] = {
    ...existingPlayer,
    clayRank: clayEntry.clayRank,
    clayFantasyPoints: clayEntry.clayFantasyPoints,
    clayPassYards: clayEntry.clayPassYards,
    clayPassTDs: clayEntry.clayPassTDs,
    clayRushYards: clayEntry.clayRushYards,
    clayRushTDs: clayEntry.clayRushTDs,
    clayRecYards: clayEntry.clayRecYards,
    clayRecTDs: clayEntry.clayRecTDs,
    clayLastUpdated: clayEntry.clayLastUpdated,
    projections: {
      ...existingPlayer.projections,
      clay: {
        rank: clayEntry.clayRank,
        fantasyPoints: clayEntry.clayFantasyPoints,
        passYards: clayEntry.clayPassYards,
        passTDs: clayEntry.clayPassTDs,
        rushYards: clayEntry.clayRushYards,
        rushTDs: clayEntry.clayRushTDs,
        recYards: clayEntry.clayRecYards,
        recTDs: clayEntry.clayRecTDs,
        lastUpdated: clayEntry.clayLastUpdated,
        source: "ESPN Clay Projections 2025"
      }
    }
  };
  
  // Remove the separate Clay entry
  delete playerDatabase["amonrastbrown_det"];
  
  // Save the updated database
  try {
    fs.writeFileSync(playerDatabasePath, JSON.stringify(playerDatabase, null, 2));
    console.log(`✅ Successfully merged and saved updated player database`);
    console.log(`📊 Database now contains ${Object.keys(playerDatabase).length} players`);
  } catch (error) {
    console.error('❌ Error saving player database:', error.message);
    process.exit(1);
  }
  
  // Display the merged player data
  const mergedPlayer = playerDatabase.players.WR[existingPlayerIndex];
  console.log(`\n🎯 Merged Player Data:`);
  console.log(`--------------------------------------------------------------------------------`);
  console.log(`Name: ${mergedPlayer.name}`);
  console.log(`Position: ${mergedPlayer.position}`);
  console.log(`Team: ${mergedPlayer.team}`);
  console.log(`DraftKings: Rank ${mergedPlayer.draftkings?.rank}, ADP ${mergedPlayer.draftkings?.adp}`);
  console.log(`Clay Projections: Rank ${mergedPlayer.clayRank}, Fantasy Points ${mergedPlayer.clayFantasyPoints}`);
  console.log(`Clay Stats:`);
  console.log(`  Pass: ${mergedPlayer.clayPassYards} yds, ${mergedPlayer.clayPassTDs} TD`);
  console.log(`  Rush: ${mergedPlayer.clayRushYards} yds, ${mergedPlayer.clayRushTDs} TD`);
  console.log(`  Rec: ${mergedPlayer.clayRecYards} yds, ${mergedPlayer.clayRecTDs} TD`);
  console.log(`Last Updated: ${mergedPlayer.clayLastUpdated}`);
  
  console.log(`\n🎉 Merge complete!`);
  console.log(`📁 Database file: ${playerDatabasePath}`);
  console.log(`🔍 Amon-Ra St. Brown now has both DraftKings and Clay projections data in one record.`);
  
} else {
  console.log(`❌ Cannot merge: Missing existing player or Clay entry`);
  if (!existingPlayer) {
    console.log(`  - Existing player not found in WR array`);
  }
  if (!clayEntry) {
    console.log(`  - Clay entry not found`);
  }
} 