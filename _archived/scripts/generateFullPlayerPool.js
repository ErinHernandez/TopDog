#!/usr/bin/env node
/**
 * Generate Full Player Pool for Draft Simulation
 * 
 * Creates a comprehensive player pool with 250+ players
 * based on preliminary ADP data provided by TopDog.
 * 
 * Usage:
 *   node scripts/generateFullPlayerPool.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const YEAR = '2025';

// Bye weeks for 2025 (update when official schedule releases)
const BYE_WEEKS = {
  'LAC': 5, 'NYJ': 5,
  'KC': 6, 'LAR': 6, 'MIA': 6, 'MIN': 6,
  'ARI': 7, 'CAR': 7, 'NYG': 7, 'TB': 7,
  'CLE': 9, 'LV': 9, 'SEA': 9, 'TEN': 9,
  'BAL': 10, 'CIN': 10, 'JAC': 10, 'NE': 10,
  'DEN': 11, 'HOU': 11, 'PIT': 11, 'SF': 11,
  'IND': 12, 'NO': 12,
  'ATL': 13, 'BUF': 13, 'CHI': 13, 'DET': 13,
  'DAL': 14, 'GB': 14, 'PHI': 14, 'WAS': 14,
};

function generateId(name) {
  // Handle names with suffixes (Jr., Sr., II, III)
  const cleanName = name.replace(/\s+(Jr\.|Sr\.|II|III|IV)$/i, '').trim();
  const parts = cleanName.toLowerCase().split(' ');
  if (parts.length >= 2) {
    return `${parts[parts.length - 1]}_${parts[0]}`.replace(/[^a-z_]/g, '');
  }
  return cleanName.toLowerCase().replace(/[^a-z]/g, '');
}

// Projection estimate based on ADP tier
function estimateProjection(adp, position) {
  const baseProjections = {
    'QB': { top: 420, decay: 3.5 },
    'RB': { top: 300, decay: 1.8 },
    'WR': { top: 320, decay: 1.6 },
    'TE': { top: 200, decay: 2.2 },
  };
  const config = baseProjections[position] || { top: 200, decay: 2 };
  return Math.round(config.top - (adp * config.decay));
}

// =============================================================================
// PRELIMINARY ADP DATA - Batch 1 (Players 1-150)
// From TopDog - Teams reflect 2025 rosters
// =============================================================================

const BATCH_1 = [
  { adp: 1, name: "Ja'Marr Chase", team: 'CIN', position: 'WR' },
  { adp: 2, name: 'Bijan Robinson', team: 'ATL', position: 'RB' },
  { adp: 3, name: 'Jahmyr Gibbs', team: 'DET', position: 'RB' },
  { adp: 4, name: 'CeeDee Lamb', team: 'DAL', position: 'WR' },
  { adp: 5, name: 'Saquon Barkley', team: 'PHI', position: 'RB' },
  { adp: 6, name: 'Justin Jefferson', team: 'MIN', position: 'WR' },
  { adp: 7, name: 'Malik Nabers', team: 'NYG', position: 'WR' },
  { adp: 8, name: 'Nico Collins', team: 'HOU', position: 'WR' },
  { adp: 9, name: 'Christian McCaffrey', team: 'SF', position: 'RB' },
  { adp: 10, name: 'Amon-Ra St. Brown', team: 'DET', position: 'WR' },
  { adp: 11, name: 'Derrick Henry', team: 'BAL', position: 'RB' },
  { adp: 12, name: 'Puka Nacua', team: 'LAR', position: 'WR' },
  { adp: 13, name: 'Brian Thomas Jr.', team: 'JAC', position: 'WR' },
  { adp: 14, name: 'Ashton Jeanty', team: 'LV', position: 'RB' },
  { adp: 15, name: 'Drake London', team: 'ATL', position: 'WR' },
  { adp: 16, name: 'Jonathan Taylor', team: 'IND', position: 'RB' },
  { adp: 17, name: "De'Von Achane", team: 'MIA', position: 'RB' },
  { adp: 18, name: 'Brock Bowers', team: 'LV', position: 'TE' },
  { adp: 19, name: 'A.J. Brown', team: 'PHI', position: 'WR' },
  { adp: 20, name: 'Josh Jacobs', team: 'GB', position: 'RB' },
  { adp: 21, name: 'Chase Brown', team: 'CIN', position: 'RB' },
  { adp: 22, name: 'Bucky Irving', team: 'TB', position: 'RB' },
  { adp: 23, name: 'Trey McBride', team: 'ARI', position: 'TE' },
  { adp: 24, name: 'Ladd McConkey', team: 'LAC', position: 'WR' },
  { adp: 25, name: 'Josh Allen', team: 'BUF', position: 'QB' },
  { adp: 26, name: 'Lamar Jackson', team: 'BAL', position: 'QB' },
  { adp: 27, name: 'Kyren Williams', team: 'LAR', position: 'RB' },
  { adp: 28, name: 'Jaxon Smith-Njigba', team: 'SEA', position: 'WR' },
  { adp: 29, name: 'Tee Higgins', team: 'CIN', position: 'WR' },
  { adp: 30, name: 'George Kittle', team: 'SF', position: 'TE' },
  { adp: 31, name: 'Mike Evans', team: 'TB', position: 'WR' },
  { adp: 32, name: 'Jayden Daniels', team: 'WAS', position: 'QB' },
  { adp: 33, name: 'James Cook III', team: 'BUF', position: 'RB' },
  { adp: 34, name: 'Tyreek Hill', team: 'MIA', position: 'WR' },
  { adp: 35, name: 'Jalen Hurts', team: 'PHI', position: 'QB' },
  { adp: 36, name: 'Davante Adams', team: 'LAR', position: 'WR' },
  { adp: 37, name: 'Omarion Hampton', team: 'LAC', position: 'RB' },
  { adp: 38, name: 'Garrett Wilson', team: 'NYJ', position: 'WR' },
  { adp: 39, name: 'Terry McLaurin', team: 'WAS', position: 'WR' },
  { adp: 40, name: 'Marvin Harrison Jr.', team: 'ARI', position: 'WR' },
  { adp: 41, name: 'Kenneth Walker III', team: 'SEA', position: 'RB' },
  { adp: 42, name: 'Alvin Kamara', team: 'NO', position: 'RB' },
  { adp: 43, name: 'Courtland Sutton', team: 'DEN', position: 'WR' },
  { adp: 44, name: 'TreVeyon Henderson', team: 'NE', position: 'RB' },
  { adp: 45, name: 'Breece Hall', team: 'NYJ', position: 'RB' },
  { adp: 46, name: 'DK Metcalf', team: 'PIT', position: 'WR' },
  { adp: 47, name: 'Tetairoa McMillan', team: 'CAR', position: 'WR' },
  { adp: 48, name: 'Joe Burrow', team: 'CIN', position: 'QB' },
  { adp: 49, name: 'Chuba Hubbard', team: 'CAR', position: 'RB' },
  { adp: 50, name: 'James Conner', team: 'ARI', position: 'RB' },
  { adp: 51, name: 'DJ Moore', team: 'CHI', position: 'WR' },
  { adp: 52, name: 'DeVonta Smith', team: 'PHI', position: 'WR' },
  { adp: 53, name: 'Xavier Worthy', team: 'KC', position: 'WR' },
  { adp: 54, name: 'Jameson Williams', team: 'DET', position: 'WR' },
  { adp: 55, name: 'Calvin Ridley', team: 'TEN', position: 'WR' },
  { adp: 56, name: 'George Pickens', team: 'DAL', position: 'WR' },
  { adp: 57, name: 'Tony Pollard', team: 'TEN', position: 'RB' },
  { adp: 58, name: "D'Andre Swift", team: 'CHI', position: 'RB' },
  { adp: 59, name: 'Jaylen Waddle', team: 'MIA', position: 'WR' },
  { adp: 60, name: 'David Montgomery', team: 'DET', position: 'RB' },
  { adp: 61, name: 'Zay Flowers', team: 'BAL', position: 'WR' },
  { adp: 62, name: 'Isiah Pacheco', team: 'KC', position: 'RB' },
  { adp: 63, name: 'RJ Harvey', team: 'DEN', position: 'RB' },
  { adp: 64, name: 'Sam LaPorta', team: 'DET', position: 'TE' },
  { adp: 65, name: 'Patrick Mahomes II', team: 'KC', position: 'QB' },
  { adp: 66, name: 'Aaron Jones Sr.', team: 'MIN', position: 'RB' },
  { adp: 67, name: 'T.J. Hockenson', team: 'MIN', position: 'TE' },
  { adp: 68, name: 'Rome Odunze', team: 'CHI', position: 'WR' },
  { adp: 69, name: 'Emeka Egbuka', team: 'TB', position: 'WR' },
  { adp: 70, name: 'Travis Hunter', team: 'JAC', position: 'WR' },
  { adp: 71, name: 'Tyrone Tracy Jr.', team: 'NYG', position: 'RB' },
  { adp: 72, name: 'Baker Mayfield', team: 'TB', position: 'QB' },
  { adp: 73, name: 'Chris Olave', team: 'NO', position: 'WR' },
  { adp: 74, name: 'Bo Nix', team: 'DEN', position: 'QB' },
  { adp: 75, name: 'Ricky Pearsall', team: 'SF', position: 'WR' },
  { adp: 76, name: 'Jaylen Warren', team: 'PIT', position: 'RB' },
  { adp: 77, name: 'Jerry Jeudy', team: 'CLE', position: 'WR' },
  { adp: 78, name: 'Travis Kelce', team: 'KC', position: 'TE' },
  { adp: 79, name: 'Kyler Murray', team: 'ARI', position: 'QB' },
  { adp: 80, name: 'Mark Andrews', team: 'BAL', position: 'TE' },
  { adp: 81, name: 'Kaleb Johnson', team: 'PIT', position: 'RB' },
  { adp: 82, name: 'Stefon Diggs', team: 'NE', position: 'WR' },
  { adp: 83, name: 'Jordan Mason', team: 'MIN', position: 'RB' },
  { adp: 84, name: 'Dak Prescott', team: 'DAL', position: 'QB' },
  { adp: 85, name: 'Rashee Rice', team: 'KC', position: 'WR' },
  { adp: 86, name: 'Travis Etienne Jr.', team: 'JAC', position: 'RB' },
  { adp: 87, name: 'David Njoku', team: 'CLE', position: 'TE' },
  { adp: 88, name: 'Jakobi Meyers', team: 'JAC', position: 'WR' },
  { adp: 89, name: 'Deebo Samuel Sr.', team: 'WAS', position: 'WR' },
  { adp: 90, name: 'Matthew Golden', team: 'GB', position: 'WR' },
  { adp: 91, name: 'Zach Charbonnet', team: 'SEA', position: 'RB' },
  { adp: 92, name: 'J.K. Dobbins', team: 'DEN', position: 'RB' },
  { adp: 93, name: 'Evan Engram', team: 'DEN', position: 'TE' },
  { adp: 94, name: 'Brock Purdy', team: 'SF', position: 'QB' },
  { adp: 95, name: 'Jauan Jennings', team: 'SF', position: 'WR' },
  { adp: 96, name: 'Tyler Warren', team: 'IND', position: 'TE' },
  { adp: 97, name: 'Tucker Kraft', team: 'GB', position: 'TE' },
  { adp: 98, name: 'Javonte Williams', team: 'DAL', position: 'RB' },
  { adp: 99, name: 'Justin Fields', team: 'NYJ', position: 'QB' },
  { adp: 100, name: 'Jordan Addison', team: 'MIN', position: 'WR' },
  { adp: 101, name: 'Drake Maye', team: 'NE', position: 'QB' },
  { adp: 102, name: 'Khalil Shakir', team: 'BUF', position: 'WR' },
  { adp: 103, name: 'Caleb Williams', team: 'CHI', position: 'QB' },
  { adp: 104, name: 'Justin Herbert', team: 'LAC', position: 'QB' },
  { adp: 105, name: 'Josh Downs', team: 'IND', position: 'WR' },
  { adp: 106, name: 'Austin Ekeler', team: 'WAS', position: 'RB' },
  { adp: 107, name: 'Michael Pittman Jr.', team: 'IND', position: 'WR' },
  { adp: 108, name: 'Jared Goff', team: 'DET', position: 'QB' },
  { adp: 109, name: 'Rhamondre Stevenson', team: 'NE', position: 'RB' },
  { adp: 110, name: 'Tank Bigsby', team: 'PHI', position: 'RB' },
  { adp: 111, name: 'Jordan Love', team: 'GB', position: 'QB' },
  { adp: 112, name: 'Trevor Lawrence', team: 'JAC', position: 'QB' },
  { adp: 113, name: 'Cooper Kupp', team: 'SEA', position: 'WR' },
  { adp: 114, name: 'Jayden Reed', team: 'GB', position: 'WR' },
  { adp: 115, name: 'Braelon Allen', team: 'NYJ', position: 'RB' },
  { adp: 116, name: 'Keon Coleman', team: 'BUF', position: 'WR' },
  { adp: 117, name: 'Jake Ferguson', team: 'DAL', position: 'TE' },
  { adp: 118, name: 'Cam Skattebo', team: 'NYG', position: 'RB' },
  { adp: 119, name: 'C.J. Stroud', team: 'HOU', position: 'QB' },
  { adp: 120, name: 'Darnell Mooney', team: 'ATL', position: 'WR' },
  { adp: 121, name: 'J.J. McCarthy', team: 'MIN', position: 'QB' },
  { adp: 122, name: 'Chris Godwin Jr.', team: 'TB', position: 'WR' },
  { adp: 123, name: 'Dalton Kincaid', team: 'BUF', position: 'TE' },
  { adp: 124, name: 'Colston Loveland', team: 'CHI', position: 'TE' },
  { adp: 125, name: 'Jacory Croskey-Merritt', team: 'WAS', position: 'RB' },
  { adp: 126, name: 'Rashid Shaheed', team: 'SEA', position: 'WR' },
  { adp: 127, name: 'Nick Chubb', team: 'HOU', position: 'RB' },
  { adp: 128, name: 'Dallas Goedert', team: 'PHI', position: 'TE' },
  { adp: 129, name: 'Najee Harris', team: 'LAC', position: 'RB' },
  { adp: 130, name: 'Trey Benson', team: 'ARI', position: 'RB' },
  { adp: 131, name: 'Brian Robinson Jr.', team: 'SF', position: 'RB' },
  { adp: 132, name: 'Rachaad White', team: 'TB', position: 'RB' },
  { adp: 133, name: 'Ray Davis', team: 'BUF', position: 'RB' },
  { adp: 134, name: 'Christian Kirk', team: 'HOU', position: 'WR' },
  { adp: 135, name: 'Kyle Pitts Sr.', team: 'ATL', position: 'TE' },
  { adp: 136, name: 'Marvin Mims Jr.', team: 'DEN', position: 'WR' },
  { adp: 137, name: 'Rashod Bateman', team: 'BAL', position: 'WR' },
  { adp: 138, name: 'Bhayshul Tuten', team: 'JAC', position: 'RB' },
  { adp: 139, name: 'Jerome Ford', team: 'CLE', position: 'RB' },
  { adp: 140, name: 'Tua Tagovailoa', team: 'MIA', position: 'QB' },
  { adp: 141, name: 'Tyler Allgeier', team: 'ATL', position: 'RB' },
  { adp: 142, name: 'Quinshon Judkins', team: 'CLE', position: 'RB' },
  { adp: 143, name: 'Bryce Young', team: 'CAR', position: 'QB' },
  { adp: 144, name: 'Hunter Henry', team: 'NE', position: 'TE' },
  { adp: 145, name: 'Keenan Allen', team: 'LAC', position: 'WR' },
  { adp: 146, name: 'Brandon Aiyuk', team: 'SF', position: 'WR' },
  { adp: 147, name: 'Cedric Tillman', team: 'CLE', position: 'WR' },
  { adp: 148, name: 'Dylan Sampson', team: 'CLE', position: 'RB' },
  { adp: 149, name: 'Jayden Higgins', team: 'HOU', position: 'WR' },
  { adp: 150, name: 'Michael Penix Jr.', team: 'ATL', position: 'QB' },
];

// =============================================================================
// ADDITIONAL PLAYERS (ADP 151-250+) - Placeholder for future batches
// =============================================================================

const ADDITIONAL_PLAYERS = [
  // Will be filled with remaining batches from user
];

// =============================================================================
// MAIN GENERATION LOGIC
// =============================================================================

function generatePlayerPool() {
  console.log(`\nGenerating full player pool for ${YEAR}...\n`);
  
  // Combine all batches
  const allPlayers = [...BATCH_1, ...ADDITIONAL_PLAYERS];
  
  // Add IDs, bye weeks, and projections
  const players = allPlayers.map(player => ({
    id: generateId(player.name),
    name: player.name,
    team: player.team,
    position: player.position,
    adp: player.adp,
    byeWeek: BYE_WEEKS[player.team] || 7,
    projection: estimateProjection(player.adp, player.position),
  }));
  
  // Remove duplicates (keep first occurrence by ADP)
  const seen = new Set();
  const uniquePlayers = players.filter(p => {
    if (seen.has(p.id)) {
      console.log(`  Duplicate removed: ${p.name} (${p.id})`);
      return false;
    }
    seen.add(p.id);
    return true;
  });
  
  // Sort by ADP
  uniquePlayers.sort((a, b) => a.adp - b.adp);
  
  // Count positions
  const positionCounts = {
    QB: uniquePlayers.filter(p => p.position === 'QB').length,
    RB: uniquePlayers.filter(p => p.position === 'RB').length,
    WR: uniquePlayers.filter(p => p.position === 'WR').length,
    TE: uniquePlayers.filter(p => p.position === 'TE').length,
  };
  
  // Generate checksum
  const playerDataString = JSON.stringify(uniquePlayers);
  const checksum = crypto.createHash('sha256').update(playerDataString).digest('hex');
  
  // Build final pool
  const pool = {
    metadata: {
      version: `${YEAR}-topdog-v1`,
      generatedAt: new Date().toISOString(),
      checksum,
      playerCount: uniquePlayers.length,
      positionCounts,
      source: 'TopDog Preliminary ADP',
      note: 'Teams reflect 2025 projected rosters',
    },
    players: uniquePlayers,
  };
  
  // Ensure output directory exists
  const outputDir = path.join(__dirname, '../public/data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write JSON file
  const jsonPath = path.join(outputDir, `player-pool-${YEAR}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(pool, null, 2));
  
  // Write checksum file
  const checksumPath = path.join(outputDir, `player-pool-${YEAR}.sha256`);
  fs.writeFileSync(checksumPath, checksum);
  
  // Summary
  console.log('Player Pool Generated Successfully!');
  console.log('='.repeat(50));
  console.log(`Version:     ${pool.metadata.version}`);
  console.log(`Source:      ${pool.metadata.source}`);
  console.log(`Players:     ${pool.metadata.playerCount}`);
  console.log(`  - QB:      ${positionCounts.QB}`);
  console.log(`  - RB:      ${positionCounts.RB}`);
  console.log(`  - WR:      ${positionCounts.WR}`);
  console.log(`  - TE:      ${positionCounts.TE}`);
  console.log(`Checksum:    ${checksum.substring(0, 16)}...`);
  console.log('='.repeat(50));
  console.log(`\nOutput: ${jsonPath}`);
  console.log(`\nWaiting for additional batches (151+)...`);
  console.log('');
}

generatePlayerPool();
