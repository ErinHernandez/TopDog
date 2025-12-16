const fs = require('fs');
const path = require('path');

// Load clay projections
const clayProjections = JSON.parse(fs.readFileSync('clay_projections_final.json', 'utf8'));

// Load current player pool
const playerPoolContent = fs.readFileSync('lib/playerPool.js', 'utf8');

// Create a mapping of clay projections by player name
const clayMap = {};
clayProjections.forEach(player => {
  clayMap[player.name] = player;
});

console.log('=== STEP 1: Updating existing player pool with clay projections ===');
console.log(`Clay projections loaded: ${clayProjections.length} players`);

// Extract existing PLAYER_POOL array from the file
const playerPoolMatch = playerPoolContent.match(/export const PLAYER_POOL = (\[[\s\S]*?\]);/);
if (!playerPoolMatch) {
  console.error('Could not find PLAYER_POOL in playerPool.js');
  process.exit(1);
}

let currentPlayerPool;
try {
  // Evaluate the array to get the actual data
  const arrayString = playerPoolMatch[1];
  currentPlayerPool = eval(arrayString);
} catch (error) {
  console.error('Error parsing current player pool:', error);
  process.exit(1);
}

console.log(`Current player pool size: ${currentPlayerPool.length} players`);

// Update existing players with clay projections
let updatedCount = 0;
currentPlayerPool.forEach(player => {
  const clayData = clayMap[player.name];
  if (clayData) {
    // Update the proj field with clay fantasy points
    player.clayProj = clayData.fantasy_points;
    player.clayRank = clayData.position_rank;
    player.clayGames = clayData.games;
    updatedCount++;
  }
});

console.log(`Updated ${updatedCount} existing players with clay projections`);

// Save the updated player pool
const updatedPlayerPoolString = JSON.stringify(currentPlayerPool, null, 2);
const newPlayerPoolContent = `export const PLAYER_POOL = ${updatedPlayerPoolString};

// Function to group picks by position for easier display
export function groupPicksByPosition(picks) {
  const grouped = {
    QB: [],
    RB: [],
    WR: [],
    TE: []
  };
  
  picks.forEach(pick => {
    const player = PLAYER_POOL.find(p => p.name === pick.player);
    if (player && grouped[player.position]) {
      grouped[player.position].push(player);
    }
  });
  
  return grouped;
}
`;

fs.writeFileSync('lib/playerPool.js', newPlayerPoolContent);
console.log('Updated playerPool.js with clay projections');

console.log('\n=== STEP 2: Compiling list of all clay QB/RB/WR/TE projections ===');

// Filter clay projections to only QB, RB, WR, TE
const relevantPositions = ['QB', 'RB', 'WR', 'TE'];
const clayPositionalPlayers = clayProjections.filter(player => 
  relevantPositions.includes(player.position)
);

console.log('Clay projections by position:');
relevantPositions.forEach(pos => {
  const count = clayPositionalPlayers.filter(p => p.position === pos).length;
  console.log(`  ${pos}: ${count} players`);
});

console.log('\n=== STEP 3: Finding missing players ===');

// Create set of current player names for fast lookup
const currentPlayerNames = new Set(currentPlayerPool.map(p => p.name));

// Find clay players not in our pool
const missingPlayers = clayPositionalPlayers.filter(clayPlayer => 
  !currentPlayerNames.has(clayPlayer.name)
);

console.log(`Found ${missingPlayers.length} players in clay projections but not in our pool:`);

// Group missing players by position
const missingByPosition = {};
relevantPositions.forEach(pos => {
  missingByPosition[pos] = missingPlayers.filter(p => p.position === pos);
});

relevantPositions.forEach(pos => {
  console.log(`\n${pos} missing (${missingByPosition[pos].length}):`);
  missingByPosition[pos].slice(0, 10).forEach(player => {
    console.log(`  - ${player.name} (${player.fantasy_points} pts, rank ${player.position_rank})`);
  });
  if (missingByPosition[pos].length > 10) {
    console.log(`  ... and ${missingByPosition[pos].length - 10} more`);
  }
});

// Save missing players list for review
fs.writeFileSync('missing_players_clay.json', JSON.stringify(missingPlayers, null, 2));
console.log(`\nSaved missing players list to missing_players_clay.json`);

console.log('\n=== STEP 4: Adding missing players to player pool ===');

// Convert missing clay players to our player pool format
const playersToAdd = missingPlayers.map(clayPlayer => ({
  name: clayPlayer.name,
  position: clayPlayer.position,
          team: "UNKNOWN", // We'll need to populate this separately
  bye: 0, // Default
  adp: 999, // High ADP for new players
  proj: 0, // Old projection system
  clayProj: clayPlayer.fantasy_points,
  clayRank: clayPlayer.position_rank,
  clayGames: clayPlayer.games
}));

// Add missing players to the pool
const expandedPlayerPool = [...currentPlayerPool, ...playersToAdd];

console.log(`Adding ${playersToAdd.length} new players to pool`);
console.log(`New total pool size: ${expandedPlayerPool.length}`);

// Save expanded player pool
const expandedPlayerPoolString = JSON.stringify(expandedPlayerPool, null, 2);
const finalPlayerPoolContent = `export const PLAYER_POOL = ${expandedPlayerPoolString};

// Function to group picks by position for easier display
export function groupPicksByPosition(picks) {
  const grouped = {
    QB: [],
    RB: [],
    WR: [],
    TE: []
  };
  
  picks.forEach(pick => {
    const player = PLAYER_POOL.find(p => p.name === pick.player);
    if (player && grouped[player.position]) {
      grouped[player.position].push(player);
    }
  });
  
  return grouped;
}
`;

fs.writeFileSync('lib/playerPool.js', finalPlayerPoolContent);
console.log('Final playerPool.js saved with all clay players');

console.log('\n=== SUMMARY ===');
console.log(`- Updated ${updatedCount} existing players with clay projections`);
console.log(`- Added ${playersToAdd.length} new players from clay projections`);
console.log(`- Total players now: ${expandedPlayerPool.length}`);
console.log('- All players now have clayProj, clayRank, and clayGames fields');

console.log('\nNext step: Update the modal to use clay projections for all players');