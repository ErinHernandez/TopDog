require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Clay Rankings with Actual Data...');

// Load the actual Clay projections data
const clayDataPath = path.join(__dirname, '../clay_projections_final.csv');
let clayData = [];

try {
  if (fs.existsSync(clayDataPath)) {
    const csvContent = fs.readFileSync(clayDataPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const [name, position, games, fantasyPoints, positionRank] = lines[i].split(',');
      if (name && position && fantasyPoints) {
        clayData.push({
          name: name.trim(),
          position: position.trim(),
          games: parseInt(games) || 17,
          fantasyPoints: parseFloat(fantasyPoints) || 0,
          positionRank: parseInt(positionRank) || null
        });
      }
    }
    
    console.log(`📊 Loaded ${clayData.length} players from Clay projections CSV`);
  } else {
    console.error('❌ Clay projections CSV not found');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error loading Clay data:', error.message);
  process.exit(1);
}

// Load the current player database
const playerDatabasePath = path.join(__dirname, '../data/playerDatabase.json');
let playerDatabase = {};

try {
  if (fs.existsSync(playerDatabasePath)) {
    const data = fs.readFileSync(playerDatabasePath, 'utf8');
    playerDatabase = JSON.parse(data);
    console.log(`📊 Loaded player database with ${Object.keys(playerDatabase).length} players`);
  } else {
    console.error('❌ Player database not found');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error loading player database:', error.message);
  process.exit(1);
}

// Helper function to find player in database
function findPlayerInDatabase(name, team, position) {
  if (!playerDatabase.players || !playerDatabase.players[position]) {
    return null;
  }
  
  return playerDatabase.players[position].find(player => 
    player.name === name
  );
}

// Fix Clay rankings
function fixClayRankings() {
  console.log(`\n🔧 Fixing Clay rankings...`);
  
  let updatedCount = 0;
  let errors = 0;
  
  clayData.forEach(clayPlayer => {
    try {
      const { name, position, games, fantasyPoints, positionRank } = clayPlayer;
      
      // Find player in database
      const dbPlayer = findPlayerInDatabase(name, position);
      
      if (dbPlayer) {
        // Update the player's Clay data
        dbPlayer.clayRank = positionRank;
        dbPlayer.clayFantasyPoints = fantasyPoints;
        dbPlayer.clayLastUpdated = new Date().toISOString();
        
        // Update projections object if it exists
        if (dbPlayer.projections && dbPlayer.projections.clay) {
          dbPlayer.projections.clay.rank = positionRank;
          dbPlayer.projections.clay.fantasyPoints = fantasyPoints;
          dbPlayer.projections.clay.lastUpdated = new Date().toISOString();
        }
        
        updatedCount++;
        console.log(`✅ Updated ${name} (${position}): Rank ${positionRank}, ${fantasyPoints} pts`);
      } else {
        console.log(`⚠️ Player not found in database: ${name} (${position})`);
        errors++;
      }
      
    } catch (error) {
      console.error(`❌ Error updating ${clayPlayer.name}:`, error.message);
      errors++;
    }
  });
  
  console.log(`\n📊 Update Summary:`);
  console.log(`  Updated: ${updatedCount} players`);
  console.log(`  Errors: ${errors} players`);
  
  return updatedCount;
}

// Save the updated database
function saveUpdatedDatabase() {
  try {
    // Update database metadata
    if (playerDatabase.meta) {
      playerDatabase.meta.lastUpdated = new Date().toISOString();
      if (playerDatabase.meta.dataSources && playerDatabase.meta.dataSources.clay) {
        playerDatabase.meta.dataSources.clay.lastUpdated = new Date().toISOString();
      }
    }
    
    fs.writeFileSync(playerDatabasePath, JSON.stringify(playerDatabase, null, 2));
    console.log(`✅ Successfully saved updated player database`);
  } catch (error) {
    console.error('❌ Error saving player database:', error.message);
    process.exit(1);
  }
}

// Display sample of corrected rankings
function displayCorrectedRankings() {
  console.log(`\n👤 Sample Corrected Rankings:`);
  console.log(`--------------------------------------------------------------------------------`);
  
  // Show top players by position
  const topPlayers = clayData
    .sort((a, b) => b.fantasyPoints - a.fantasyPoints)
    .slice(0, 10);
  
  topPlayers.forEach((player, index) => {
    console.log(`${index + 1}. ${player.name} (${player.position}): ${player.fantasyPoints} pts, Rank ${player.positionRank}`);
  });
  
  // Show specific players we know should be corrected
  const specificPlayers = ['Ja\'Marr Chase', 'Josh Allen', 'Lamar Jackson', 'Patrick Mahomes'];
  console.log(`\n🎯 Key Player Rankings:`);
  specificPlayers.forEach(name => {
    const player = clayData.find(p => p.name === name);
    if (player) {
      console.log(`${player.name} (${player.position}): ${player.fantasyPoints} pts, Rank ${player.positionRank}`);
    } else {
      console.log(`${name}: Not found in Clay data`);
    }
  });
}

// Main execution
try {
  console.log(`🚀 Starting Clay rankings fix...`);
  
  // Step 1: Fix the rankings
  const updatedCount = fixClayRankings();
  
  // Step 2: Save the updated database
  saveUpdatedDatabase();
  
  // Step 3: Display corrected rankings
  displayCorrectedRankings();
  
  console.log(`\n🎉 Clay Rankings Fix Complete!`);
  console.log(`================================================================================`);
  console.log(`✅ Updated ${updatedCount} players with correct Clay rankings`);
  console.log(`✅ Database saved with corrected data`);
  console.log(`✅ Ready to regenerate player pool and static stats`);
  
  console.log(`\n🚀 Next Steps:`);
  console.log(`   1. Run: node scripts/update-player-pool-with-database.js`);
  console.log(`   2. Run: node scripts/update-static-stats-with-database.js`);
  console.log(`   3. Restart dev server to see corrected rankings`);
  
} catch (error) {
  console.error('❌ Error during Clay rankings fix:', error.message);
  process.exit(1);
} 