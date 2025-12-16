const fs = require('fs');

// Load player pool with clay projections
const playerPoolContent = fs.readFileSync('lib/playerPool.js', 'utf8');
const playerPoolMatch = playerPoolContent.match(/export const PLAYER_POOL = (\[[\s\S]*?\]);/);
const playerPool = eval(playerPoolMatch[1]);

// Generate realistic projections based on fantasy points and position
function generateProjections(player) {
  const fantasyPoints = player.clayProj;
  const position = player.position;
  
  if (!fantasyPoints) return null;
  
  const projections = {
    fantasyPoints: fantasyPoints,
    games: player.clayGames || 17
  };
  
  if (position === 'QB') {
    // QB projections based on fantasy points (4 pt passing TD, 6 pt rushing TD)
    const passYards = Math.round(fantasyPoints * 12); // ~12 yards per fantasy point
    const passTDs = Math.round(fantasyPoints / 15); // ~15 points per passing TD
    const rushYards = Math.round(fantasyPoints * 2); // Some rushing
    const rushTDs = Math.round(fantasyPoints / 40); // Occasional rushing TD
    
    projections.passing = {
      completions: Math.round(passYards / 12),
      attempts: Math.round(passYards / 8.5),
      yards: passYards,
      touchdowns: passTDs,
      interceptions: Math.round(passTDs * 0.4),
      qbr: Math.min(110, 85 + (fantasyPoints - 250) / 10)
    };
    
    projections.rushing = {
      attempts: Math.round(rushYards / 5),
      yards: rushYards,
      touchdowns: rushTDs,
      longRush: Math.round(15 + Math.random() * 20),
      yardsPerAttempt: rushYards > 0 ? (rushYards / Math.round(rushYards / 5)).toFixed(1) : "0.0",
      yardsPerGame: (rushYards / 17).toFixed(1),
      firstDowns: Math.round(rushYards / 12),
      fumbles: Math.round(Math.random() * 3 + 1)
    };
  }
  
  if (position === 'RB') {
    // RB projections
    const rushYards = Math.round(fantasyPoints * 4.5); // Base rushing
    const recYards = Math.round(fantasyPoints * 1.8); // Receiving component
    const totalTDs = Math.round(fantasyPoints / 18); // ~18 points per TD
    const rushTDs = Math.round(totalTDs * 0.75);
    const recTDs = totalTDs - rushTDs;
    
    projections.rushing = {
      attempts: Math.round(rushYards / 4.2),
      yards: rushYards,
      touchdowns: rushTDs,
      longRush: Math.round(25 + Math.random() * 35),
      yardsPerAttempt: (rushYards / Math.round(rushYards / 4.2)).toFixed(1),
      yardsPerGame: (rushYards / 17).toFixed(1),
      firstDowns: Math.round(rushYards / 8),
      fumbles: Math.round(Math.random() * 4 + 2)
    };
    
    projections.receiving = {
      receptions: Math.round(recYards / 8),
      targets: Math.round(recYards / 6),
      yards: recYards,
      touchdowns: recTDs,
      longReception: Math.round(20 + Math.random() * 40),
      yardsPerReception: recYards > 0 ? (recYards / Math.round(recYards / 8)).toFixed(1) : "0.0",
      yardsPerGame: (recYards / 17).toFixed(1),
      catchPercentage: (65 + Math.random() * 15).toFixed(1),
      fumbles: Math.round(Math.random() * 2)
    };
  }
  
  if (position === 'WR' || position === 'TE') {
    // WR/TE projections
    const recYards = Math.round(fantasyPoints * 4.8); // Primarily receiving
    const recTDs = Math.round(fantasyPoints / 20); // ~20 points per TD
    const rushYards = position === 'WR' ? Math.round(fantasyPoints * 0.1) : 0; // Minimal rushing
    
    projections.receiving = {
      receptions: Math.round(recYards / (position === 'TE' ? 10 : 12)),
      targets: Math.round(recYards / (position === 'TE' ? 7 : 8.5)),
      yards: recYards,
      touchdowns: recTDs,
      longReception: Math.round((position === 'TE' ? 35 : 45) + Math.random() * 30),
      yardsPerReception: (position === 'TE' ? 10 : 12).toFixed(1),
      yardsPerGame: (recYards / 17).toFixed(1),
      catchPercentage: ((position === 'TE' ? 68 : 62) + Math.random() * 8).toFixed(1),
      fumbles: Math.round(Math.random() * 3)
    };
    
    if (rushYards > 0) {
      projections.rushing = {
        attempts: Math.round(rushYards / 6),
        yards: rushYards,
        touchdowns: 0,
        longRush: Math.round(8 + Math.random() * 15),
        yardsPerAttempt: (6 + Math.random() * 3).toFixed(1),
        yardsPerGame: (rushYards / 17).toFixed(1),
        firstDowns: Math.round(rushYards / 10),
        fumbles: 0
      };
    }
  }
  
  return projections;
}

// Generate projections for all players
const playersWithProjections = playerPool.map(player => {
  const projections = generateProjections(player);
  return {
    ...player,
    clayProjections: projections
  };
});

// Save updated player pool with detailed projections
const updatedPlayerPoolString = JSON.stringify(playersWithProjections, null, 2);
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

console.log('Generated detailed projections for all players');
console.log(`Updated ${playersWithProjections.length} players with clayProjections field`);

// Show some examples
console.log('\nExample projections:');
['QB', 'RB', 'WR', 'TE'].forEach(pos => {
  const example = playersWithProjections.find(p => p.position === pos && p.clayProjections);
  if (example) {
    console.log(`\n${pos} Example - ${example.name}:`);
    console.log(`  Fantasy Points: ${example.clayProjections.fantasyPoints}`);
    if (example.clayProjections.passing) {
      console.log(`  Passing: ${example.clayProjections.passing.yards} yds, ${example.clayProjections.passing.touchdowns} TDs`);
    }
    if (example.clayProjections.rushing) {
      console.log(`  Rushing: ${example.clayProjections.rushing.yards} yds, ${example.clayProjections.rushing.touchdowns} TDs`);
    }
    if (example.clayProjections.receiving) {
      console.log(`  Receiving: ${example.clayProjections.receiving.yards} yds, ${example.clayProjections.receiving.touchdowns} TDs`);
    }
  }
});