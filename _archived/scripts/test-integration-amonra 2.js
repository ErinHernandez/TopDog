require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Test Integration for Amon-Ra St. Brown...');

// Load the current player database
const playerDatabasePath = path.join(__dirname, '../data/playerDatabase.json');
let playerDatabase = {};

try {
  if (fs.existsSync(playerDatabasePath)) {
    const data = fs.readFileSync(playerDatabasePath, 'utf8');
    playerDatabase = JSON.parse(data);
    console.log(`📊 Loaded existing player database with ${Object.keys(playerDatabase).length} players`);
  } else {
    console.log('📊 No existing player database found, creating new one');
  }
} catch (error) {
  console.error('❌ Error loading player database:', error.message);
  process.exit(1);
}

// Amon-Ra St. Brown test data (from our Clay projections parsing)
const amonRaData = {
  name: "Amon-Ra St. Brown",
  position: "WR",
  team: "DET",
  rank: 15,
  fantasyPoints: 0, // We'll need to extract this from the full data
  passYards: 0,
  passTDs: 0,
  rushYards: 0,
  rushTDs: 0,
  recYards: 0,
  recTDs: 0,
  source: "Clay Projections 2025",
  lastUpdated: new Date().toISOString()
};

// Create a unique key for the player
const playerKey = `${amonRaData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}_${amonRaData.team.toLowerCase()}`;

console.log(`🔑 Player key: ${playerKey}`);

// Check if player already exists
if (playerDatabase[playerKey]) {
  console.log(`⚠️ Player already exists in database:`);
  console.log(JSON.stringify(playerDatabase[playerKey], null, 2));
  
  // Update with new Clay projections data
  console.log(`🔄 Updating player with Clay projections data...`);
  playerDatabase[playerKey] = {
    ...playerDatabase[playerKey],
    clayRank: amonRaData.rank,
    clayFantasyPoints: amonRaData.fantasyPoints,
    clayPassYards: amonRaData.passYards,
    clayPassTDs: amonRaData.passTDs,
    clayRushYards: amonRaData.rushYards,
    clayRushTDs: amonRaData.rushTDs,
    clayRecYards: amonRaData.recYards,
    clayRecTDs: amonRaData.recTDs,
    clayLastUpdated: amonRaData.lastUpdated
  };
} else {
  console.log(`➕ Adding new player to database...`);
  playerDatabase[playerKey] = {
    ...amonRaData,
    id: playerKey,
    displayName: amonRaData.name,
    firstName: "Amon-Ra",
    lastName: "St. Brown",
    fullName: "Amon-Ra St. Brown",
    clayRank: amonRaData.rank,
    clayFantasyPoints: amonRaData.fantasyPoints,
    clayPassYards: amonRaData.passYards,
    clayPassTDs: amonRaData.passTDs,
    clayRushYards: amonRaData.rushYards,
    clayRushTDs: amonRaData.rushTDs,
    clayRecYards: amonRaData.recYards,
    clayRecTDs: amonRaData.recTDs,
    clayLastUpdated: amonRaData.lastUpdated
  };
}

// Save the updated database
try {
  fs.writeFileSync(playerDatabasePath, JSON.stringify(playerDatabase, null, 2));
  console.log(`✅ Successfully saved updated player database`);
  console.log(`📊 Database now contains ${Object.keys(playerDatabase).length} players`);
} catch (error) {
  console.error('❌ Error saving player database:', error.message);
  process.exit(1);
}

// Display the integrated player data
console.log(`\n🎯 Integrated Player Data:`);
console.log(`--------------------------------------------------------------------------------`);
console.log(`Name: ${playerDatabase[playerKey].displayName}`);
console.log(`Position: ${playerDatabase[playerKey].position}`);
console.log(`Team: ${playerDatabase[playerKey].team}`);
console.log(`Clay Rank: ${playerDatabase[playerKey].clayRank}`);
console.log(`Clay Fantasy Points: ${playerDatabase[playerKey].clayFantasyPoints}`);
console.log(`Clay Stats:`);
console.log(`  Pass: ${playerDatabase[playerKey].clayPassYards} yds, ${playerDatabase[playerKey].clayPassTDs} TD`);
console.log(`  Rush: ${playerDatabase[playerKey].clayRushYards} yds, ${playerDatabase[playerKey].clayRushTDs} TD`);
console.log(`  Rec: ${playerDatabase[playerKey].clayRecYards} yds, ${playerDatabase[playerKey].clayRecTDs} TD`);
console.log(`Last Updated: ${playerDatabase[playerKey].clayLastUpdated}`);

// Check if we can find the player in the database
console.log(`\n🔍 Verifying integration...`);
const foundPlayer = playerDatabase[playerKey];
if (foundPlayer) {
  console.log(`✅ Successfully found Amon-Ra St. Brown in database`);
  console.log(`🔑 Database key: ${playerKey}`);
} else {
  console.log(`❌ Failed to find Amon-Ra St. Brown in database`);
}

console.log(`\n🎉 Test integration complete!`);
console.log(`📁 Database file: ${playerDatabasePath}`);
console.log(`🔍 You can now check the database to see the integrated player data.`); 