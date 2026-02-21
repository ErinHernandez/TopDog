require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

console.log('🔄 Starting Player Pool Update with Database Data...');

// Load the integrated player database
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

// Helper function to create player key
function createPlayerKey(name, team) {
  return `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}_${team.toLowerCase()}`;
}

// Convert database player to player pool format
function convertDatabasePlayerToPoolFormat(dbPlayer) {
  const player = {
    name: dbPlayer.name,
    position: dbPlayer.position,
    team: dbPlayer.team,
    bye: dbPlayer.bye || 0,
    adp: dbPlayer.draftkings?.adp || null,
    proj: dbPlayer.clayFantasyPoints || 0,
    clayProj: dbPlayer.clayFantasyPoints || 0,
    clayRank: dbPlayer.clayRank || null,
    clayGames: 17, // Default to 17 games for 2025 season
    clayProjections: {
      fantasyPoints: dbPlayer.clayFantasyPoints || 0,
      games: 17,
      passing: {
        attempts: null,
        completions: null,
        yards: dbPlayer.clayPassYards || 0,
        touchdowns: dbPlayer.clayPassTDs || 0,
        interceptions: null,
        sacks: null
      },
      rushing: {
        attempts: null,
        yards: dbPlayer.clayRushYards || 0,
        touchdowns: dbPlayer.clayRushTDs || 0,
        longRush: null,
        yardsPerAttempt: null,
        yardsPerGame: null,
        firstDowns: null,
        fumbles: null
      },
      receiving: {
        targets: null,
        receptions: null,
        yards: dbPlayer.clayRecYards || 0,
        touchdowns: dbPlayer.clayRecTDs || 0,
        longReception: null,
        yardsPerReception: null,
        yardsPerGame: null,
        catchPercentage: null,
        fumbles: null
      }
    }
  };

  // Add database-specific fields for reference
  player.databaseId = dbPlayer.id;
  player.draftkingsRank = dbPlayer.draftkings?.rank || null;
  player.draftkingsPositionRank = dbPlayer.draftkings?.positionRank || null;
  player.clayLastUpdated = dbPlayer.clayLastUpdated || null;

  return player;
}

// Generate new player pool from database
function generateNewPlayerPool() {
  console.log(`\n🔄 Converting database players to player pool format...`);
  
  const newPlayerPool = [];
  let totalPlayers = 0;
  let playersWithClayData = 0;

  // Process each position
  Object.entries(playerDatabase.players || {}).forEach(([position, players]) => {
    console.log(`📊 Processing ${position} position: ${players.length} players`);
    
    players.forEach(dbPlayer => {
      const poolPlayer = convertDatabasePlayerToPoolFormat(dbPlayer);
      newPlayerPool.push(poolPlayer);
      totalPlayers++;
      
      if (dbPlayer.clayRank) {
        playersWithClayData++;
      }
    });
  });

  console.log(`✅ Converted ${totalPlayers} players to pool format`);
  console.log(`📈 Players with Clay data: ${playersWithClayData}`);
  
  return newPlayerPool;
}

// Generate the new player pool JavaScript file
function generatePlayerPoolFile(playerPool) {
  console.log(`\n📝 Generating new player pool file...`);
  
  const jsContent = `/**
 * Updated Player Pool with Integrated Database Data
 * 
 * This file contains all players with their projections, rankings, and statistics
 * from the integrated player database including Clay projections.
 * 
 * Generated: ${new Date().toISOString()}
 * Total Players: ${playerPool.length}
 * Source: Integrated Player Database (DraftKings + Clay Projections)
 */

export const PLAYER_POOL = ${JSON.stringify(playerPool, null, 2)};

// Helper function to get player by name
export const getPlayerByName = (name) => {
  return PLAYER_POOL.find(player => player.name === name);
};

// Helper function to get players by position
export const getPlayersByPosition = (position) => {
  return PLAYER_POOL.filter(player => player.position === position);
};

// Helper function to get players with Clay projections
export const getPlayersWithClayProjections = () => {
  return PLAYER_POOL.filter(player => player.clayRank !== null);
};

// Helper function to get top players by Clay rank
export const getTopPlayersByClayRank = (limit = 50) => {
  return PLAYER_POOL
    .filter(player => player.clayRank !== null)
    .sort((a, b) => a.clayRank - b.clayRank)
    .slice(0, limit);
};

// Helper function to get players by ADP
export const getPlayersByADP = (limit = 50) => {
  return PLAYER_POOL
    .filter(player => player.adp !== null)
    .sort((a, b) => a.adp - b.adp)
    .slice(0, limit);
};

// Metadata about the player pool
export const PLAYER_POOL_METADATA = {
  totalPlayers: ${playerPool.length},
  generatedAt: "${new Date().toISOString()}",
  source: "Integrated Player Database",
  playersWithClayData: ${playerPool.filter(p => p.clayRank).length},
  playersWithDraftKingsData: ${playerPool.filter(p => p.draftkingsRank).length},
  positionBreakdown: {
    QB: ${playerPool.filter(p => p.position === 'QB').length},
    RB: ${playerPool.filter(p => p.position === 'RB').length},
    WR: ${playerPool.filter(p => p.position === 'WR').length},
    TE: ${playerPool.filter(p => p.position === 'TE').length}
  }
};
`;

  return jsContent;
}

// Main execution
try {
  // Generate new player pool from database
  const newPlayerPool = generateNewPlayerPool();
  
  // Generate the JavaScript file content
  const jsContent = generatePlayerPoolFile(newPlayerPool);
  
  // Write the new player pool file
  const outputPath = path.join(__dirname, '../lib/playerPool.js');
  fs.writeFileSync(outputPath, jsContent);
  
  console.log(`\n✅ Successfully updated player pool file!`);
  console.log(`📁 File: ${outputPath}`);
  console.log(`📊 Total players: ${newPlayerPool.length}`);
  
  // Display sample of updated players
  console.log(`\n👤 Sample Updated Players:`);
  console.log(`--------------------------------------------------------------------------------`);
  
  // Show players with Clay data
  const playersWithClay = newPlayerPool.filter(p => p.clayRank).slice(0, 5);
  playersWithClay.forEach(player => {
    console.log(`${player.name} (${player.position}, ${player.team})`);
    console.log(`  DraftKings: Rank ${player.draftkingsRank || 'N/A'}, ADP ${player.adp || 'N/A'}`);
    console.log(`  Clay: Rank ${player.clayRank}, ${player.clayProj} pts`);
    console.log(`  Stats: Pass ${player.clayProjections.passing.yards}yd/${player.clayProjections.passing.touchdowns}TD, Rush ${player.clayProjections.rushing.yards}yd/${player.clayProjections.rushing.touchdowns}TD, Rec ${player.clayProjections.receiving.yards}yd/${player.clayProjections.receiving.touchdowns}TD`);
    console.log(``);
  });
  
  // Show position breakdown
  console.log(`📈 Position Breakdown:`);
  const positionBreakdown = {
    QB: newPlayerPool.filter(p => p.position === 'QB').length,
    RB: newPlayerPool.filter(p => p.position === 'RB').length,
    WR: newPlayerPool.filter(p => p.position === 'WR').length,
    TE: newPlayerPool.filter(p => p.position === 'TE').length
  };
  
  Object.entries(positionBreakdown).forEach(([position, count]) => {
    const clayCount = newPlayerPool.filter(p => p.position === position && p.clayRank).length;
    console.log(`  ${position}: ${count} total, ${clayCount} with Clay data`);
  });
  
  console.log(`\n🎉 Player pool update complete!`);
  console.log(`🔍 The draft room will now use the updated player data with Clay projections.`);
  console.log(`🚀 You may need to restart your development server to see the changes.`);
  
} catch (error) {
  console.error('❌ Error updating player pool:', error.message);
  process.exit(1);
} 