require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

console.log('🔄 Starting Static Player Stats Update with Database Data...');

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

// Convert database player to static stats format
function convertDatabasePlayerToStatsFormat(dbPlayer) {
  const player = {
    name: dbPlayer.name,
    position: dbPlayer.position,
    team: dbPlayer.team,
    seasons: [
      {
        year: 2025,
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
          fumbles: null,
          yardsPerAttempt: null
        },
        receiving: {
          targets: null,
          receptions: null,
          yards: dbPlayer.clayRecYards || 0,
          touchdowns: dbPlayer.clayRecTDs || 0,
          fumbles: null,
          yardsPerReception: null
        },
        scrimmage: {
          touches: null,
          yards: (dbPlayer.clayRushYards || 0) + (dbPlayer.clayRecYards || 0),
          touchdowns: (dbPlayer.clayRushTDs || 0) + (dbPlayer.clayRecTDs || 0)
        },
        fantasy: {
          points: dbPlayer.clayFantasyPoints || 0,
          ppr_points: dbPlayer.clayFantasyPoints || 0
        }
      }
    ],
    career: {
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
        fumbles: null,
        yardsPerAttempt: null
      },
      receiving: {
        targets: null,
        receptions: null,
        yards: dbPlayer.clayRecYards || 0,
        touchdowns: dbPlayer.clayRecTDs || 0,
        fumbles: null,
        yardsPerReception: null
      },
      scrimmage: {
        touches: null,
        yards: (dbPlayer.clayRushYards || 0) + (dbPlayer.clayRecYards || 0),
        touchdowns: (dbPlayer.clayRushTDs || 0) + (dbPlayer.clayRecTDs || 0)
      },
      fantasy: {
        points: dbPlayer.clayFantasyPoints || 0,
        ppr_points: dbPlayer.clayFantasyPoints || 0
      }
    }
  };

  // Add database-specific fields for reference
  player.databaseId = dbPlayer.id;
  player.draftkingsRank = dbPlayer.draftkings?.rank || null;
  player.draftkingsADP = dbPlayer.draftkings?.adp || null;
  player.clayRank = dbPlayer.clayRank || null;
  player.clayLastUpdated = dbPlayer.clayLastUpdated || null;

  return player;
}

// Generate new static stats from database
function generateNewStaticStats() {
  console.log(`\n🔄 Converting database players to static stats format...`);
  
  const staticStats = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalPlayers: 0,
      successfulFetches: 0,
      failedFetches: 0,
      version: "4.0",
      source: "Integrated Player Database with Clay Projections"
    },
    players: {}
  };

  let totalPlayers = 0;
  let playersWithClayData = 0;

  // Process each position
  Object.entries(playerDatabase.players || {}).forEach(([position, players]) => {
    console.log(`📊 Processing ${position} position: ${players.length} players`);
    
    players.forEach(dbPlayer => {
      const statsPlayer = convertDatabasePlayerToStatsFormat(dbPlayer);
      staticStats.players[dbPlayer.name] = statsPlayer;
      totalPlayers++;
      
      if (dbPlayer.clayRank) {
        playersWithClayData++;
      }
    });
  });

  staticStats.metadata.totalPlayers = totalPlayers;
  staticStats.metadata.successfulFetches = playersWithClayData;
  staticStats.metadata.failedFetches = totalPlayers - playersWithClayData;

  console.log(`✅ Converted ${totalPlayers} players to stats format`);
  console.log(`📈 Players with Clay data: ${playersWithClayData}`);
  
  return staticStats;
}

// Generate the static stats JavaScript file
function generateStaticStatsFile(staticStats) {
  console.log(`\n📝 Generating new static stats file...`);
  
  const jsContent = `/**
 * Updated Static Player Stats Data
 * 
 * Pre-downloaded player statistics with Clay projections from the integrated database.
 * This data is used for instant loading in the draft room modal.
 * 
 * Generated: ${new Date().toISOString()}
 * Total Players: ${staticStats.metadata.totalPlayers}
 * Source: Integrated Player Database (DraftKings + Clay Projections)
 */

// Player statistics data
export const STATIC_PLAYER_STATS = ${JSON.stringify(staticStats, null, 2)};

// Helper function to get player stats
export const getPlayerStats = (playerName) => {
  return STATIC_PLAYER_STATS.players[playerName] || null;
};

// Helper function to check if stats are loaded
export const hasPlayerStats = () => {
  return STATIC_PLAYER_STATS.metadata.totalPlayers > 0;
};

// Helper function to get players with Clay projections
export const getPlayersWithClayProjections = () => {
  return Object.values(STATIC_PLAYER_STATS.players).filter(player => player.clayRank !== null);
};

// Helper function to get top players by Clay rank
export const getTopPlayersByClayRank = (limit = 50) => {
  return Object.values(STATIC_PLAYER_STATS.players)
    .filter(player => player.clayRank !== null)
    .sort((a, b) => a.clayRank - b.clayRank)
    .slice(0, limit);
};

// Export metadata
export const getStatsMetadata = () => {
  return STATIC_PLAYER_STATS.metadata;
};

// Export player count by position
export const getPlayerCountByPosition = () => {
  const counts = { QB: 0, RB: 0, WR: 0, TE: 0 };
  Object.values(STATIC_PLAYER_STATS.players).forEach(player => {
    if (counts.hasOwnProperty(player.position)) {
      counts[player.position]++;
    }
  });
  return counts;
};
`;

  return jsContent;
}

// Main execution
try {
  // Generate new static stats from database
  const staticStats = generateNewStaticStats();
  
  // Generate the JavaScript file content
  const jsContent = generateStaticStatsFile(staticStats);
  
  // Write the new static stats file
  const outputPath = path.join(__dirname, '../lib/staticPlayerStats.js');
  fs.writeFileSync(outputPath, jsContent);
  
  console.log(`\n✅ Successfully updated static stats file!`);
  console.log(`📁 File: ${outputPath}`);
  console.log(`📊 Total players: ${staticStats.metadata.totalPlayers}`);
  
  // Display sample of updated players
  console.log(`\n👤 Sample Updated Players:`);
  console.log(`--------------------------------------------------------------------------------`);
  
  // Show players with Clay data
  const playersWithClay = Object.values(staticStats.players).filter(p => p.clayRank).slice(0, 5);
  playersWithClay.forEach(player => {
    console.log(`${player.name} (${player.position}, ${player.team})`);
    console.log(`  DraftKings: Rank ${player.draftkingsRank || 'N/A'}, ADP ${player.draftkingsADP || 'N/A'}`);
    console.log(`  Clay: Rank ${player.clayRank}, ${player.fantasy?.points || 0} pts`);
    console.log(`  2025 Projections:`);
    console.log(`    Pass: ${player.seasons[0].passing.yards}yd/${player.seasons[0].passing.touchdowns}TD`);
    console.log(`    Rush: ${player.seasons[0].rushing.yards}yd/${player.seasons[0].rushing.touchdowns}TD`);
    console.log(`    Rec: ${player.seasons[0].receiving.yards}yd/${player.seasons[0].receiving.touchdowns}TD`);
    console.log(``);
  });
  
  // Show position breakdown
  console.log(`📈 Position Breakdown:`);
  const positionBreakdown = {
    QB: Object.values(staticStats.players).filter(p => p.position === 'QB').length,
    RB: Object.values(staticStats.players).filter(p => p.position === 'RB').length,
    WR: Object.values(staticStats.players).filter(p => p.position === 'WR').length,
    TE: Object.values(staticStats.players).filter(p => p.position === 'TE').length
  };
  
  Object.entries(positionBreakdown).forEach(([position, count]) => {
    const clayCount = Object.values(staticStats.players).filter(p => p.position === position && p.clayRank).length;
    console.log(`  ${position}: ${count} total, ${clayCount} with Clay data`);
  });
  
  console.log(`\n🎉 Static stats update complete!`);
  console.log(`🔍 The draft room modals will now use the updated stats with Clay projections.`);
  console.log(`🚀 You may need to restart your development server to see the changes.`);
  
} catch (error) {
  console.error('❌ Error updating static stats:', error.message);
  process.exit(1);
} 