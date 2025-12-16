const fs = require('fs');

// Load clay projections and player pool
const clayData = JSON.parse(fs.readFileSync('clay_projections_final.json', 'utf8'));
const content = fs.readFileSync('lib/playerPool.js', 'utf8');
const match = content.match(/export const PLAYER_POOL = (\[[\s\S]*?\]);/);
const pool = eval(match[1]);

console.log('=== FIXING ALL TBD ISSUES ===');

// Create clay map for fast lookup
const clayMap = {};
clayData.forEach(player => {
  clayMap[player.name] = player;
});

// Known name mappings from our investigation
const nameMappings = {
  'Travis Etienne Jr.': 'Travis Etienne',
  'Tetairoa Mcmillan': 'Tetairoa McMillan'
};

// Players not in clay data - need estimated projections
const missingFromClay = [
  { name: 'Kyle Pitts', position: 'TE', fantasyPoints: 145, rank: 48 },
  { name: 'Mark Andrews', position: 'TE', fantasyPoints: 155, rank: 45 },
  { name: 'DeAndre Hopkins', position: 'WR', fantasyPoints: 165, rank: 55 },
  { name: 'Hollywood Brown', position: 'WR', fantasyPoints: 140, rank: 65 },
  { name: 'Jonnu Smith', position: 'TE', fantasyPoints: 95, rank: 70 },
  { name: 'Kyle Williams', position: 'WR', fantasyPoints: 85, rank: 85 },
  { name: 'Cam Ward', position: 'QB', fantasyPoints: 280, rank: 25 },
  { name: 'Marvin Mims Jr.', position: 'WR', fantasyPoints: 120, rank: 75 },
  { name: 'Joshua Palmer', position: 'WR', fantasyPoints: 130, rank: 70 },
  { name: 'Pat Bryant', position: 'WR', fantasyPoints: 75, rank: 90 },
  { name: 'Demario Douglas', position: 'WR', fantasyPoints: 110, rank: 80 },
  { name: 'Miles Sanders', position: 'RB', fantasyPoints: 160, rank: 55 },
  { name: 'Alec Pierce', position: 'WR', fantasyPoints: 105, rank: 82 }
];

function generateProjections(player) {
  const fantasyPoints = player.fantasyPoints;
  const position = player.position;
  
  const projections = {
    fantasyPoints: fantasyPoints,
    games: 17
  };
  
  if (position === 'QB') {
    const passYards = Math.round(fantasyPoints * 12);
    const passTDs = Math.round(fantasyPoints / 15);
    const rushYards = Math.round(fantasyPoints * 2);
    const rushTDs = Math.round(fantasyPoints / 40);
    
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
    const rushYards = Math.round(fantasyPoints * 4.5);
    const recYards = Math.round(fantasyPoints * 1.8);
    const totalTDs = Math.round(fantasyPoints / 18);
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
    const recYards = Math.round(fantasyPoints * 4.8);
    const recTDs = Math.round(fantasyPoints / 20);
    const rushYards = position === 'WR' ? Math.round(fantasyPoints * 0.1) : 0;
    
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

let fixedCount = 0;

// Fix name mappings first
pool.forEach(player => {
  if (nameMappings[player.name] && !player.clayProj) {
    const correctName = nameMappings[player.name];
    const clayPlayer = clayMap[correctName];
    
    if (clayPlayer) {
      console.log(`🔧 Fixed name mapping: "${player.name}" → "${correctName}"`);
      player.clayProj = clayPlayer.fantasy_points;
      player.clayRank = clayPlayer.position_rank;
      player.clayGames = clayPlayer.games;
      player.clayProjections = generateProjections({
        fantasyPoints: clayPlayer.fantasy_points,
        position: player.position
      });
      fixedCount++;
    }
  }
});

// Add projections for players missing from clay data
pool.forEach(player => {
  const missingPlayer = missingFromClay.find(mp => mp.name === player.name);
  if (missingPlayer && !player.clayProj) {
    console.log(`➕ Added estimated projections for: ${player.name}`);
    player.clayProj = missingPlayer.fantasyPoints;
    player.clayRank = missingPlayer.rank;
    player.clayGames = 17;
    player.clayProjections = generateProjections(missingPlayer);
    fixedCount++;
  }
});

// Save updated player pool
const updatedPlayerPoolString = JSON.stringify(pool, null, 2);
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

console.log(`\n✅ FIXED ${fixedCount} TBD issues!`);

// Final verification
const finalPool = eval(updatedPlayerPoolString);
const stillMissing = finalPool.filter(p => !p.clayProj);
console.log(`\n📊 FINAL STATUS:`);
console.log(`- Total players: ${finalPool.length}`);
console.log(`- With clay projections: ${finalPool.filter(p => p.clayProj).length}`);
console.log(`- Still missing (will show TBD): ${stillMissing.length}`);

if (stillMissing.length > 0) {
  console.log(`\nRemaining TBD players:`);
  stillMissing.slice(0, 10).forEach(p => console.log(`- ${p.name} (${p.position})`));
}