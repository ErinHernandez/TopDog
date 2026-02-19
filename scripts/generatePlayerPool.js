#!/usr/bin/env node
/**
 * Generate Static Player Pool
 * 
 * This script generates the immutable player pool for a draft season.
 * Run once at season start, then deploy. The pool NEVER changes mid-season.
 * 
 * Usage:
 *   node scripts/generatePlayerPool.js
 *   node scripts/generatePlayerPool.js --year 2025
 * 
 * Output:
 *   public/data/player-pool-{year}.json
 *   public/data/player-pool-{year}.sha256
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Parse command line args
const args = process.argv.slice(2);
const yearArg = args.find(a => a.startsWith('--year'));
const YEAR = yearArg ? yearArg.split('=')[1] || args[args.indexOf('--year') + 1] : '2025';

// Bye weeks for 2025 (update annually)
const BYE_WEEKS = {
  'LAC': 5, 'NYJ': 5,
  'KC': 6, 'LAR': 6, 'MIA': 6, 'MIN': 6,
  'ARI': 7, 'CAR': 7, 'NYG': 7, 'TB': 7,
  'CLE': 9, 'LV': 9, 'SEA': 9, 'TEN': 9,
  'BAL': 10, 'CIN': 10, 'JAX': 10, 'NE': 10,
  'DEN': 11, 'HOU': 11, 'PIT': 11, 'SF': 11,
  'IND': 12, 'NO': 12,
  'ATL': 13, 'BUF': 13, 'CHI': 13, 'DET': 13,
  'DAL': 14, 'GB': 14, 'PHI': 14, 'WAS': 14,
};

/**
 * Generate player ID from name
 */
function generateId(name) {
  const parts = name.toLowerCase().split(' ');
  if (parts.length >= 2) {
    return `${parts[parts.length - 1]}_${parts[0]}`.replace(/[^a-z_]/g, '');
  }
  return name.toLowerCase().replace(/[^a-z]/g, '');
}

/**
 * 2025 Player Pool Data
 * 
 * This is the master list. Update annually with:
 * - New rookies
 * - Updated ADPs from consensus rankings
 * - Updated projections
 * - Team changes (free agency, trades)
 */
const PLAYERS_2025 = [
  // ============================================================================
  // QUARTERBACKS (Top 24)
  // ============================================================================
  { name: 'Josh Allen', team: 'BUF', position: 'QB', adp: 18.5, projection: 420.5 },
  { name: 'Jalen Hurts', team: 'PHI', position: 'QB', adp: 21.3, projection: 395.2 },
  { name: 'Lamar Jackson', team: 'BAL', position: 'QB', adp: 23.1, projection: 402.8 },
  { name: 'Patrick Mahomes', team: 'KC', position: 'QB', adp: 48.7, projection: 365.4 },
  { name: 'Jayden Daniels', team: 'WAS', position: 'QB', adp: 52.4, projection: 358.9 },
  { name: 'Joe Burrow', team: 'CIN', position: 'QB', adp: 55.2, projection: 352.1 },
  { name: 'CJ Stroud', team: 'HOU', position: 'QB', adp: 61.8, projection: 342.7 },
  { name: 'Kyler Murray', team: 'ARI', position: 'QB', adp: 68.3, projection: 338.4 },
  { name: 'Anthony Richardson', team: 'IND', position: 'QB', adp: 72.1, projection: 335.2 },
  { name: 'Caleb Williams', team: 'CHI', position: 'QB', adp: 78.5, projection: 328.6 },
  { name: 'Brock Purdy', team: 'SF', position: 'QB', adp: 85.2, projection: 318.4 },
  { name: 'Dak Prescott', team: 'DAL', position: 'QB', adp: 92.7, projection: 312.5 },
  { name: 'Tua Tagovailoa', team: 'MIA', position: 'QB', adp: 98.4, projection: 305.8 },
  { name: 'Jordan Love', team: 'GB', position: 'QB', adp: 102.6, projection: 298.2 },
  { name: 'Trevor Lawrence', team: 'JAX', position: 'QB', adp: 115.3, projection: 285.4 },
  { name: 'Jared Goff', team: 'DET', position: 'QB', adp: 118.7, projection: 282.1 },
  { name: 'Baker Mayfield', team: 'TB', position: 'QB', adp: 125.2, projection: 275.6 },
  { name: 'Sam Darnold', team: 'MIN', position: 'QB', adp: 132.8, projection: 268.3 },
  { name: 'Drake Maye', team: 'NE', position: 'QB', adp: 138.4, projection: 262.5 },
  { name: 'Bo Nix', team: 'DEN', position: 'QB', adp: 145.1, projection: 255.8 },
  { name: 'Geno Smith', team: 'SEA', position: 'QB', adp: 152.6, projection: 248.2 },
  { name: 'Matthew Stafford', team: 'LAR', position: 'QB', adp: 158.3, projection: 242.5 },
  { name: 'Aaron Rodgers', team: 'NYJ', position: 'QB', adp: 165.8, projection: 235.4 },
  { name: 'Justin Herbert', team: 'LAC', position: 'QB', adp: 172.4, projection: 228.6 },

  // ============================================================================
  // RUNNING BACKS (Top 60)
  // ============================================================================
  { name: "Ja'Marr Chase", team: 'CIN', position: 'WR', adp: 1.2, projection: 285.4 }, // Placeholder for RB order
  { name: 'Bijan Robinson', team: 'ATL', position: 'RB', adp: 2.1, projection: 295.8 },
  { name: 'Breece Hall', team: 'NYJ', position: 'RB', adp: 3.5, projection: 288.2 },
  { name: 'Jahmyr Gibbs', team: 'DET', position: 'RB', adp: 4.2, projection: 282.5 },
  { name: 'Saquon Barkley', team: 'PHI', position: 'RB', adp: 5.8, projection: 275.4 },
  { name: 'Jonathan Taylor', team: 'IND', position: 'RB', adp: 8.3, projection: 268.2 },
  { name: 'Derrick Henry', team: 'BAL', position: 'RB', adp: 10.5, projection: 262.8 },
  { name: 'De\'Von Achane', team: 'MIA', position: 'RB', adp: 12.1, projection: 258.4 },
  { name: 'Kyren Williams', team: 'LAR', position: 'RB', adp: 15.7, projection: 248.5 },
  { name: 'Josh Jacobs', team: 'GB', position: 'RB', adp: 19.2, projection: 242.1 },
  { name: 'Isiah Pacheco', team: 'KC', position: 'RB', adp: 24.6, projection: 235.8 },
  { name: 'Kenneth Walker III', team: 'SEA', position: 'RB', adp: 28.3, projection: 228.4 },
  { name: 'James Cook', team: 'BUF', position: 'RB', adp: 32.5, projection: 222.6 },
  { name: 'Travis Etienne Jr.', team: 'JAX', position: 'RB', adp: 36.8, projection: 218.2 },
  { name: 'David Montgomery', team: 'DET', position: 'RB', adp: 42.1, projection: 212.5 },
  { name: 'Alvin Kamara', team: 'NO', position: 'RB', adp: 45.6, projection: 208.4 },
  { name: 'Rachaad White', team: 'TB', position: 'RB', adp: 52.3, projection: 198.6 },
  { name: 'Tony Pollard', team: 'TEN', position: 'RB', adp: 58.7, projection: 192.4 },
  { name: 'Aaron Jones', team: 'MIN', position: 'RB', adp: 64.2, projection: 186.8 },
  { name: 'Javonte Williams', team: 'DEN', position: 'RB', adp: 68.5, projection: 182.2 },
  { name: 'Rhamondre Stevenson', team: 'NE', position: 'RB', adp: 72.8, projection: 178.5 },
  { name: 'Zamir White', team: 'LV', position: 'RB', adp: 78.4, projection: 172.4 },
  { name: 'Nick Chubb', team: 'CLE', position: 'RB', adp: 82.6, projection: 168.2 },
  { name: 'Jerome Ford', team: 'CLE', position: 'RB', adp: 88.3, projection: 162.5 },
  { name: 'Brian Robinson Jr.', team: 'WAS', position: 'RB', adp: 92.7, projection: 158.4 },
  { name: 'Zack Moss', team: 'CIN', position: 'RB', adp: 98.2, projection: 152.6 },
  { name: 'Najee Harris', team: 'PIT', position: 'RB', adp: 102.5, projection: 148.2 },
  { name: 'D\'Andre Swift', team: 'CHI', position: 'RB', adp: 108.4, projection: 142.8 },
  { name: 'Jaylen Warren', team: 'PIT', position: 'RB', adp: 112.8, projection: 138.4 },
  { name: 'Devin Singletary', team: 'NYG', position: 'RB', adp: 118.3, projection: 132.6 },
  { name: 'Chuba Hubbard', team: 'CAR', position: 'RB', adp: 122.7, projection: 128.2 },
  { name: 'Gus Edwards', team: 'LAC', position: 'RB', adp: 128.4, projection: 122.5 },
  { name: 'Raheem Mostert', team: 'MIA', position: 'RB', adp: 132.8, projection: 118.4 },
  { name: 'Tyler Allgeier', team: 'ATL', position: 'RB', adp: 138.5, projection: 112.6 },
  { name: 'Alexander Mattison', team: 'LV', position: 'RB', adp: 142.2, projection: 108.2 },
  { name: 'Tyjae Spears', team: 'TEN', position: 'RB', adp: 148.6, projection: 102.8 },
  { name: 'Bucky Irving', team: 'TB', position: 'RB', adp: 152.4, projection: 98.4 },
  { name: 'Rico Dowdle', team: 'DAL', position: 'RB', adp: 158.8, projection: 92.6 },
  { name: 'Khalil Herbert', team: 'CHI', position: 'RB', adp: 162.5, projection: 88.2 },
  { name: 'Chase Brown', team: 'CIN', position: 'RB', adp: 168.2, projection: 82.5 },
  { name: 'Zach Charbonnet', team: 'SEA', position: 'RB', adp: 172.8, projection: 78.4 },
  { name: 'MarShawn Lloyd', team: 'GB', position: 'RB', adp: 178.4, projection: 72.6 },
  { name: 'Jonathon Brooks', team: 'CAR', position: 'RB', adp: 182.6, projection: 68.2 },
  { name: 'Trey Benson', team: 'ARI', position: 'RB', adp: 188.3, projection: 62.5 },
  { name: 'Ray Davis', team: 'BUF', position: 'RB', adp: 192.8, projection: 58.4 },

  // ============================================================================
  // WIDE RECEIVERS (Top 72)
  // ============================================================================
  { name: "Ja'Marr Chase", team: 'CIN', position: 'WR', adp: 1.8, projection: 312.5 },
  { name: 'CeeDee Lamb', team: 'DAL', position: 'WR', adp: 2.4, projection: 305.8 },
  { name: 'Tyreek Hill', team: 'MIA', position: 'WR', adp: 6.2, projection: 285.4 },
  { name: 'Justin Jefferson', team: 'MIN', position: 'WR', adp: 7.5, projection: 278.6 },
  { name: 'Amon-Ra St. Brown', team: 'DET', position: 'WR', adp: 9.8, projection: 272.2 },
  { name: 'Marvin Harrison Jr.', team: 'ARI', position: 'WR', adp: 11.3, projection: 265.8 },
  { name: 'A.J. Brown', team: 'PHI', position: 'WR', adp: 13.6, projection: 258.4 },
  { name: 'Garrett Wilson', team: 'NYJ', position: 'WR', adp: 16.2, projection: 252.6 },
  { name: 'Puka Nacua', team: 'LAR', position: 'WR', adp: 17.8, projection: 248.2 },
  { name: 'Davante Adams', team: 'NYJ', position: 'WR', adp: 22.4, projection: 238.5 },
  { name: 'Nico Collins', team: 'HOU', position: 'WR', adp: 25.6, projection: 232.4 },
  { name: 'Chris Olave', team: 'NO', position: 'WR', adp: 29.3, projection: 225.8 },
  { name: 'Drake London', team: 'ATL', position: 'WR', adp: 33.5, projection: 218.6 },
  { name: 'Malik Nabers', team: 'NYG', position: 'WR', adp: 35.2, projection: 215.2 },
  { name: 'DeVonta Smith', team: 'PHI', position: 'WR', adp: 38.7, projection: 208.4 },
  { name: 'DK Metcalf', team: 'SEA', position: 'WR', adp: 42.3, projection: 202.6 },
  { name: 'Jaylen Waddle', team: 'MIA', position: 'WR', adp: 46.8, projection: 195.8 },
  { name: 'Stefon Diggs', team: 'HOU', position: 'WR', adp: 52.4, projection: 188.2 },
  { name: 'Mike Evans', team: 'TB', position: 'WR', adp: 56.7, projection: 182.5 },
  { name: 'Terry McLaurin', team: 'WAS', position: 'WR', adp: 62.3, projection: 175.4 },
  { name: 'DJ Moore', team: 'CHI', position: 'WR', adp: 66.8, projection: 168.6 },
  { name: 'Tee Higgins', team: 'CIN', position: 'WR', adp: 72.4, projection: 162.2 },
  { name: 'Tank Dell', team: 'HOU', position: 'WR', adp: 76.5, projection: 158.4 },
  { name: 'Keenan Allen', team: 'CHI', position: 'WR', adp: 82.3, projection: 152.8 },
  { name: 'George Pickens', team: 'PIT', position: 'WR', adp: 86.7, projection: 148.2 },
  { name: 'Brandon Aiyuk', team: 'SF', position: 'WR', adp: 92.4, projection: 142.5 },
  { name: 'Amari Cooper', team: 'CLE', position: 'WR', adp: 98.6, projection: 135.8 },
  { name: 'Rome Odunze', team: 'CHI', position: 'WR', adp: 102.3, projection: 132.4 },
  { name: 'Diontae Johnson', team: 'BAL', position: 'WR', adp: 108.5, projection: 128.6 },
  { name: 'Christian Kirk', team: 'JAX', position: 'WR', adp: 112.8, projection: 122.2 },
  { name: 'Zay Flowers', team: 'BAL', position: 'WR', adp: 118.4, projection: 118.5 },
  { name: 'Michael Pittman Jr.', team: 'IND', position: 'WR', adp: 122.6, projection: 112.4 },
  { name: 'Courtland Sutton', team: 'DEN', position: 'WR', adp: 128.3, projection: 108.6 },
  { name: 'Rashee Rice', team: 'KC', position: 'WR', adp: 132.7, projection: 102.2 },
  { name: 'Calvin Ridley', team: 'TEN', position: 'WR', adp: 138.4, projection: 98.5 },
  { name: 'Khalil Shakir', team: 'BUF', position: 'WR', adp: 142.8, projection: 92.4 },
  { name: 'DeAndre Hopkins', team: 'TEN', position: 'WR', adp: 148.5, projection: 88.6 },
  { name: 'Curtis Samuel', team: 'BUF', position: 'WR', adp: 152.2, projection: 82.2 },
  { name: 'Ladd McConkey', team: 'LAC', position: 'WR', adp: 158.6, projection: 78.5 },
  { name: 'Jaxon Smith-Njigba', team: 'SEA', position: 'WR', adp: 162.4, projection: 72.4 },
  { name: 'Xavier Worthy', team: 'KC', position: 'WR', adp: 168.8, projection: 68.6 },
  { name: 'Quentin Johnston', team: 'LAC', position: 'WR', adp: 172.5, projection: 62.2 },
  { name: 'Rashid Shaheed', team: 'NO', position: 'WR', adp: 178.2, projection: 58.5 },
  { name: 'Jameson Williams', team: 'DET', position: 'WR', adp: 182.6, projection: 52.4 },
  { name: 'Brian Thomas Jr.', team: 'JAX', position: 'WR', adp: 188.3, projection: 48.6 },
  { name: 'Adonai Mitchell', team: 'IND', position: 'WR', adp: 192.8, projection: 42.2 },

  // ============================================================================
  // TIGHT ENDS (Top 24)
  // ============================================================================
  { name: 'Sam LaPorta', team: 'DET', position: 'TE', adp: 26.4, projection: 195.8 },
  { name: 'Travis Kelce', team: 'KC', position: 'TE', adp: 30.2, projection: 188.4 },
  { name: 'Trey McBride', team: 'ARI', position: 'TE', adp: 38.5, projection: 175.6 },
  { name: 'George Kittle', team: 'SF', position: 'TE', adp: 44.3, projection: 168.2 },
  { name: 'Mark Andrews', team: 'BAL', position: 'TE', adp: 58.7, projection: 155.4 },
  { name: 'Brock Bowers', team: 'LV', position: 'TE', adp: 62.4, projection: 148.6 },
  { name: 'Dallas Goedert', team: 'PHI', position: 'TE', adp: 78.2, projection: 138.2 },
  { name: 'Evan Engram', team: 'JAX', position: 'TE', adp: 85.6, projection: 132.5 },
  { name: 'Kyle Pitts', team: 'ATL', position: 'TE', adp: 92.3, projection: 125.4 },
  { name: 'David Njoku', team: 'CLE', position: 'TE', adp: 98.7, projection: 118.6 },
  { name: 'Pat Freiermuth', team: 'PIT', position: 'TE', adp: 108.4, projection: 108.2 },
  { name: 'Jake Ferguson', team: 'DAL', position: 'TE', adp: 115.2, projection: 102.5 },
  { name: 'Dalton Kincaid', team: 'BUF', position: 'TE', adp: 122.8, projection: 95.4 },
  { name: 'Cole Kmet', team: 'CHI', position: 'TE', adp: 132.5, projection: 88.6 },
  { name: 'Jonnu Smith', team: 'MIA', position: 'TE', adp: 142.3, projection: 78.2 },
  { name: 'Dalton Schultz', team: 'HOU', position: 'TE', adp: 152.6, projection: 72.5 },
  { name: 'Tyler Higbee', team: 'LAR', position: 'TE', adp: 162.4, projection: 65.4 },
  { name: 'Hunter Henry', team: 'NE', position: 'TE', adp: 172.8, projection: 58.6 },
  { name: 'Cade Otton', team: 'TB', position: 'TE', adp: 182.5, projection: 52.2 },
  { name: 'Isaiah Likely', team: 'BAL', position: 'TE', adp: 192.3, projection: 45.5 },
  { name: 'Chigoziem Okonkwo', team: 'TEN', position: 'TE', adp: 202.6, projection: 38.4 },
  { name: 'Michael Mayer', team: 'LV', position: 'TE', adp: 212.4, projection: 32.6 },
  { name: 'Luke Musgrave', team: 'GB', position: 'TE', adp: 222.8, projection: 28.2 },
  { name: 'Ben Sinnott', team: 'WAS', position: 'TE', adp: 232.5, projection: 22.5 },
];

// ============================================================================
// MAIN GENERATION LOGIC
// ============================================================================

function generatePlayerPool() {
  console.log(`\nGenerating player pool for ${YEAR}...\n`);
  
  // Add IDs and bye weeks
  const players = PLAYERS_2025.map(player => ({
    id: generateId(player.name),
    ...player,
    byeWeek: BYE_WEEKS[player.team] || 7,
  }));
  
  // Remove duplicates (keep first occurrence by ADP)
  const seen = new Set();
  const uniquePlayers = players.filter(p => {
    if (seen.has(p.id)) return false;
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
  
  // Generate checksum of player data
  const playerDataString = JSON.stringify(uniquePlayers);
  const checksum = crypto.createHash('sha256').update(playerDataString).digest('hex');
  
  // Build final pool object
  const pool = {
    metadata: {
      version: `${YEAR}-v1`,
      generatedAt: new Date().toISOString(),
      checksum,
      playerCount: uniquePlayers.length,
      positionCounts,
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
  const jsonContent = JSON.stringify(pool, null, 2);
  fs.writeFileSync(jsonPath, jsonContent);
  
  // Write checksum file
  const checksumPath = path.join(outputDir, `player-pool-${YEAR}.sha256`);
  fs.writeFileSync(checksumPath, checksum);
  
  // Summary
  console.log('Player Pool Generated Successfully!');
  console.log('='.repeat(50));
  console.log(`Version:     ${pool.metadata.version}`);
  console.log(`Players:     ${pool.metadata.playerCount}`);
  console.log(`  - QB:      ${positionCounts.QB}`);
  console.log(`  - RB:      ${positionCounts.RB}`);
  console.log(`  - WR:      ${positionCounts.WR}`);
  console.log(`  - TE:      ${positionCounts.TE}`);
  console.log(`Checksum:    ${checksum.substring(0, 16)}...`);
  console.log('='.repeat(50));
  console.log(`\nOutput Files:`);
  console.log(`  ${jsonPath}`);
  console.log(`  ${checksumPath}`);
  console.log('\nDeploy these files to lock in the pool for the season.\n');
}

generatePlayerPool();

