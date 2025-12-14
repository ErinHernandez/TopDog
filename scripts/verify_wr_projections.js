#!/usr/bin/env node

/**
 * Verify all WR players have "xx" projections
 * This script checks that no WR players have any other projection values
 */

const fs = require('fs');
const path = require('path');

function verifyWRProjections() {
  console.log('🔍 Verifying WR projections...\n');
  
  try {
    // Load current player pool
    const playerPoolPath = path.join(__dirname, '../lib/playerPool.js');
    const playerPoolContent = fs.readFileSync(playerPoolPath, 'utf8');
    
    // Extract the player pool array
    const playerPoolMatch = playerPoolContent.match(/export const PLAYER_POOL = (\[[\s\S]*?\]);/);
    if (!playerPoolMatch) {
      throw new Error('Could not find PLAYER_POOL export in playerPool.js');
    }
    
    const playerPool = eval(playerPoolMatch[1]);
    console.log(`📊 Loaded ${playerPool.length} players from player pool`);
    
    // Filter WR players
    const wrPlayers = playerPool.filter(p => p.position === 'WR');
    console.log(`📊 Found ${wrPlayers.length} WR players`);
    
    // Check each WR player's projection
    let correctCount = 0;
    let incorrectPlayers = [];
    
    wrPlayers.forEach(player => {
      if (player.proj === "xx") {
        correctCount++;
      } else {
        incorrectPlayers.push({
          name: player.name,
          team: player.team,
          currentProj: player.proj,
          type: typeof player.proj
        });
      }
    });
    
    console.log(`✅ ${correctCount} WR players have correct "xx" projections`);
    
    if (incorrectPlayers.length > 0) {
      console.log(`❌ ${incorrectPlayers.length} WR players have incorrect projections:`);
      incorrectPlayers.forEach(player => {
        console.log(`   - ${player.name} (${player.team}): "${player.currentProj}" (${player.type})`);
      });
    } else {
      console.log(`🎉 All WR players have correct "xx" projections!`);
    }
    
    // Also check for any Clay-related fields that might still exist
    let clayFieldsFound = 0;
    const playersWithClayFields = [];
    
    wrPlayers.forEach(player => {
      const clayFields = ['clayProj', 'clayRank', 'clayGames', 'clayProjections', 'clayLastUpdated'];
      const foundFields = clayFields.filter(field => player.hasOwnProperty(field));
      
      if (foundFields.length > 0) {
        clayFieldsFound++;
        playersWithClayFields.push({
          name: player.name,
          team: player.team,
          fields: foundFields
        });
      }
    });
    
    if (clayFieldsFound > 0) {
      console.log(`\n⚠️  ${clayFieldsFound} WR players still have Clay fields:`);
      playersWithClayFields.forEach(player => {
        console.log(`   - ${player.name} (${player.team}): ${player.fields.join(', ')}`);
      });
    } else {
      console.log(`\n✅ No WR players have Clay fields remaining`);
    }
    
    // Summary
    console.log('\n📋 Summary:');
    console.log(`   Total WR players: ${wrPlayers.length}`);
    console.log(`   Correct "xx" projections: ${correctCount}`);
    console.log(`   Incorrect projections: ${incorrectPlayers.length}`);
    console.log(`   Players with Clay fields: ${clayFieldsFound}`);
    
    if (incorrectPlayers.length === 0 && clayFieldsFound === 0) {
      console.log('\n🎉 All WR players are correctly configured!');
    } else {
      console.log('\n❌ Some issues found that need to be addressed.');
    }
    
  } catch (error) {
    console.error('❌ Error verifying WR projections:', error);
    process.exit(1);
  }
}

// Run the verification
verifyWRProjections();
