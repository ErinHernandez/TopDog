#!/usr/bin/env node

/**
 * Remove Clay projections for all positions and replace with "xx"
 * This script removes Clay projections and sets proj to "xx" for all players
 */

const fs = require('fs');
const path = require('path');

function replaceAllProjectionsWithXX() {
  console.log('🔧 Removing Clay projections and replacing with "xx" for all positions...\n');
  
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
    
    // Count players by position before processing
    const positionCounts = {};
    playerPool.forEach(player => {
      const pos = player.position;
      positionCounts[pos] = (positionCounts[pos] || 0) + 1;
    });
    
    console.log('📊 Players by position:');
    Object.entries(positionCounts).forEach(([pos, count]) => {
      console.log(`   ${pos}: ${count} players`);
    });
    
    // Replace projections for all players
    let modifiedCount = 0;
    const updatedPlayerPool = playerPool.map(player => {
      // Create a new player object without Clay fields and with "xx" projection
      const { 
        clayProj, 
        clayRank, 
        clayGames, 
        clayProjections, 
        clayLastUpdated,
        proj,
        ...playerWithoutClay 
      } = player;
      
      modifiedCount++;
      return {
        ...playerWithoutClay,
        proj: "xx"
      };
    });
    
    console.log(`✅ Replaced projections with "xx" for ${modifiedCount} players`);
    
    // Create the updated file content
    const updatedContent = `/**
 * Updated Player Pool with Integrated Database Data
 * 
 * This file contains all players with their projections, rankings, and statistics
 * from the integrated player database. All projections replaced with "xx".
 * 
 * Generated: ${new Date().toISOString()}
 * Total Players: ${updatedPlayerPool.length}
 * Source: Integrated Player Database (DraftKings rankings only)
 */

export const PLAYER_POOL = ${JSON.stringify(updatedPlayerPool, null, 2)};
`;
    
    // Write the updated file
    fs.writeFileSync(playerPoolPath, updatedContent);
    console.log(`💾 Updated playerPool.js successfully`);
    
    // Summary
    console.log('\n📋 Summary:');
    console.log(`   Total players: ${updatedPlayerPool.length}`);
    console.log(`   Players processed: ${modifiedCount}`);
    console.log('\n✅ All projections successfully replaced with "xx"');
    
  } catch (error) {
    console.error('❌ Error replacing projections:', error);
    process.exit(1);
  }
}

// Run the script
replaceAllProjectionsWithXX();
