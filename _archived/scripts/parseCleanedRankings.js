#!/usr/bin/env node
/**
 * Parse Cleaned Rankings File
 * 
 * Reads cleaned_rankings.txt and generates the full player pool.
 * Infers positions from known player data.
 * 
 * Usage:
 *   node scripts/parseCleanedRankings.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const YEAR = '2025';

// Bye weeks for 2025
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
  'FA': 0,
};

// Known team defense names
const TEAM_DEFENSES = new Set([
  'Denver Broncos', 'Philadelphia Eagles', 'Baltimore Ravens', 'Pittsburgh Steelers',
  'Minnesota Vikings', 'Houston Texans', 'Buffalo Bills', 'Kansas City Chiefs',
  'Green Bay Packers', 'Detroit Lions', 'Los Angeles Rams', 'Los Angeles Chargers',
  'San Francisco 49ers', 'New York Jets', 'Chicago Bears', 'New England Patriots',
  'Dallas Cowboys', 'Arizona Cardinals', 'Cleveland Browns', 'New York Giants',
  'Miami Dolphins', 'Washington Commanders', 'Jacksonville Jaguars', 'New Orleans Saints',
  'Las Vegas Raiders', 'Tennessee Titans', 'Carolina Panthers', 'Tampa Bay Buccaneers',
  'Atlanta Falcons', 'Cincinnati Bengals', 'Indianapolis Colts', 'Seattle Seahawks',
]);

// Known kickers (approximate list - will be updated)
const KNOWN_KICKERS = new Set([
  'Brandon Aubrey', 'Cameron Dicker', 'Jake Bates', 'Wil Lutz', 'Chase McLaughlin',
  "Ka'imi Fairbairn", 'Harrison Butker', 'Chris Boswell', 'Evan McPherson',
  'Jake Elliott', 'Tyler Bass', 'Younghoe Koo', 'Will Reichard', 'Daniel Carlson',
  'Jason Sanders', 'Cam Little', 'Brandon McManus', 'Chad Ryland', 'Jason Myers',
  'Blake Grupe', 'Cairo Santos', 'Matt Prater', 'Joey Slye', 'Ryan Fitzgerald',
  'Spencer Shrader', 'Graham Gano', 'Eddy Pineiro', 'Nick Folk', 'Riley Patterson',
  'Matthew Wright', 'Andy Borregales', 'Andre Szmyt', 'Tyler Loop', 'Joshua Karty',
  'Jake Moody', 'Matt Gay',
]);

// Known QBs
const KNOWN_QBS = new Set([
  'Josh Allen', 'Lamar Jackson', 'Jayden Daniels', 'Jalen Hurts', 'Joe Burrow',
  'Patrick Mahomes II', 'Baker Mayfield', 'Bo Nix', 'Kyler Murray', 'Dak Prescott',
  'Brock Purdy', 'Justin Fields', 'Drake Maye', 'Caleb Williams', 'Justin Herbert',
  'Jared Goff', 'Jordan Love', 'Trevor Lawrence', 'C.J. Stroud', 'J.J. McCarthy',
  'Tua Tagovailoa', 'Bryce Young', 'Michael Penix Jr.', 'Geno Smith', 'Cam Ward',
  'Matthew Stafford', 'Sam Darnold', 'Aaron Rodgers', 'Daniel Jones', 'Russell Wilson',
  'Joe Flacco', 'Anthony Richardson Sr.', 'Shedeur Sanders', 'Jalen Milroe',
  'Spencer Rattler', 'Dillon Gabriel', 'Jimmy Garoppolo', 'Jameis Winston',
  'Kirk Cousins', 'Marcus Mariota', 'Kenny Pickett', 'Mason Rudolph', 'Malik Willis',
  'Aidan O\'Connell', 'Trey Lance', 'Jake Browning', 'Zach Wilson', 'Tyrod Taylor',
  'Joe Milton III', 'Tyler Shough', 'Carson Wentz', 'Deshaun Watson', 'Cooper Rush',
  'Andy Dalton', 'Quinn Ewers', 'Mac Jones', 'Tyson Bagent', 'Jacoby Brissett',
  'Sam Howell', 'Nick Mullens', 'Davis Mills', 'Riley Leonard', 'Joshua Dobbs',
  'Kyle Allen', 'Mitchell Trubisky', 'Teddy Bridgewater', 'Kyle Trask',
  'Will Howard', 'Taylor Heinicke', 'Gardner Minshew II', 'Kyle McCord',
  'Jarrett Stidham', 'Jake Haener', 'Brandon Allen', 'Hendon Hooker',
]);

// Known TEs
const KNOWN_TES = new Set([
  'Brock Bowers', 'Trey McBride', 'George Kittle', 'Sam LaPorta', 'T.J. Hockenson',
  'Travis Kelce', 'Mark Andrews', 'David Njoku', 'Evan Engram', 'Tyler Warren',
  'Tucker Kraft', 'Dallas Goedert', 'Kyle Pitts Sr.', 'Hunter Henry', 'Zach Ertz',
  'Jonnu Smith', 'Brenton Strange', 'Chig Okonkwo', 'Cade Otton', 'Isaiah Likely',
  'Mike Gesicki', 'Pat Freiermuth', 'Dalton Kincaid', 'Colston Loveland',
  'Dalton Schultz', 'Ja\'Tavion Sanders', 'Juwan Johnson', 'Cole Kmet',
  'Noah Gray', 'Harold Fannin Jr.', 'Tyler Conklin', 'Will Dissly', 'Ben Sinnott',
  'AJ Barner', 'Dawson Knox', 'Luke Musgrave', 'Gunnar Helm', 'Austin Hooper',
  'Tommy Tremble', 'Cade Stover', 'Luke Schoonmaker', 'Foster Moreau', 'Josh Oliver',
  'Grant Calcaterra', 'Jeremy Ruckert', 'Darnell Washington', 'Elijah Higgins',
  'Noah Fant', 'Taysom Hill', 'Harrison Bryant', 'Hunter Long', 'Johnny Mundt',
  'Jared Wiley', 'Drew Sample', 'Kylen Granson', 'Charlie Kolar', 'Devin Culp',
  'Lucas Krull', 'Josh Whyle', 'Luke Farrell', 'Luke Lachey', 'Mo Alie-Cox',
  'Thomas Fidone II', 'Jackson Hawes', 'Jelani Woods', 'Drew Ogletree',
  'Ian Thomas', 'Will Mallory', 'Durham Smythe', 'Tip Reiman', 'Moliki Matavao',
  'Caleb Lohner', 'Eric Saubert', 'Gavin Bartholomew', 'Davis Allen',
  'Nate Adkins', 'Jake Briningstool', 'Brevyn Spann-Ford', 'Connor Heyward',
  'Robert Tonyan', 'Ross Dwelley', 'Gerald Everett', 'Pharaoh Brown', 'Robbie Ouzts',
  'Adam Trautman', 'Tanner Hudson', 'Daniel Bellinger', 'Greg Dulcich',
  'John Bates', 'Payne Durham', 'Charlie Woerner', 'Teagan Quitoriano',
  'Elijah Arroyo', 'Oronde Gadsden II', 'Mason Taylor', 'Terrance Ferguson',
  'Tyler Higbee', 'Colby Parkinson', 'Brock Wright',
]);

// Known RBs (partial list - the rest will be inferred)
const KNOWN_RBS = new Set([
  'Bijan Robinson', 'Jahmyr Gibbs', 'Saquon Barkley', 'Christian McCaffrey',
  'Derrick Henry', 'Ashton Jeanty', 'Jonathan Taylor', 'De\'Von Achane',
  'Josh Jacobs', 'Chase Brown', 'Bucky Irving', 'Kyren Williams',
  'James Cook III', 'Omarion Hampton', 'Kenneth Walker III', 'Alvin Kamara',
  'TreVeyon Henderson', 'Breece Hall', 'Chuba Hubbard', 'James Conner',
  'Tony Pollard', 'D\'Andre Swift', 'David Montgomery', 'Isiah Pacheco',
  'RJ Harvey', 'Aaron Jones Sr.', 'Tyrone Tracy Jr.', 'Jaylen Warren',
  'Kaleb Johnson', 'Jordan Mason', 'Travis Etienne Jr.', 'Zach Charbonnet',
  'J.K. Dobbins', 'Javonte Williams', 'Austin Ekeler', 'Rhamondre Stevenson',
  'Tank Bigsby', 'Braelon Allen', 'Cam Skattebo', 'Jacory Croskey-Merritt',
  'Nick Chubb', 'Najee Harris', 'Trey Benson', 'Brian Robinson Jr.',
  'Rachaad White', 'Ray Davis', 'Bhayshul Tuten', 'Jerome Ford',
  'Tyler Allgeier', 'Quinshon Judkins', 'Jaydon Blue', 'Tyjae Spears',
  'Ollie Gordon II', 'Rico Dowdle', 'Joe Mixon', 'Blake Corum',
  'Will Shipley', 'Woody Marks', 'Roschon Johnson', 'Kyle Monangai',
  'Justice Hill', 'Chris Rodriguez Jr.', 'Isaac Guerendo', 'DJ Giddens',
  'Kareem Hunt', 'Kendre Miller', 'Jaylen Wright', 'Keaton Mitchell',
  'Tahj Brooks', 'Miles Sanders', 'Dameon Pierce', 'MarShawn Lloyd',
  'Sean Tucker', 'Jarquez Hunter', 'Raheem Mostert', 'Kenneth Gainwell',
  'Devin Neal', 'Ty Johnson', 'Jaleel McLaughlin', 'Trevor Etienne',
  'Elijah Mitchell', 'Isaiah Davis', 'Devin Singletary', 'Antonio Gibson',
  'Emanuel Wilson', 'Chris Brooks', 'Ty Chandler', 'Phil Mafah',
  'Kimani Vidal', 'Raheim Sanders', 'Audric Estime', 'A.J. Dillon',
  'Sincere McCormick', 'Khalil Herbert', 'Emari Demercado', 'LeQuint Allen Jr.',
  'Zack Moss', 'Craig Reynolds', 'Dare Ogunbowale', 'Kyle Juszczyk',
  'Gus Edwards', 'Tyler Goodson', 'Hassan Haskins', 'George Holani',
  'Tyler Badie', 'Donovan Edwards', 'Cam Akers', 'Trey Sermon',
  'Carson Steele', 'Hunter Luepke', 'Cordarrelle Patterson', 'Jamaal Williams',
  'Zonovan Knight', 'Chris Tyree', 'Pierre Strong Jr.', 'C.J. Ham',
  'Travis Homer', 'Montrell Johnson Jr.', 'Israel Abanikanda', 'Gage Larvadain',
  'Deuce Vaughn', 'Jordan Mims', 'Eric Gray', 'Kene Nwangwu',
  'Carlos Washington Jr.', 'Michael Burton', 'D\'Ernest Johnson',
  'Jase McClellan', 'Ameer Abdullah', 'DeeJay Dallas', 'Frank Gore Jr.',
  'Tyrion Davis-Price', 'Jakob Johnson', 'Dalvin Cook', 'Jordan James',
  'Jeremy McNichols', 'Damien Martinez', 'Alec Ingold', 'Dylan Laube',
  'Jonathon Brooks', 'Nathan Carter', 'Ja\'Quinden Jackson', 'Kalel Mullings',
]);

function generateId(name) {
  const cleanName = name.replace(/\s+(Jr\.|Sr\.|II|III|IV)$/i, '').trim();
  const parts = cleanName.toLowerCase().split(' ');
  if (parts.length >= 2) {
    return `${parts[parts.length - 1]}_${parts[0]}`.replace(/[^a-z_]/g, '');
  }
  return cleanName.toLowerCase().replace(/[^a-z]/g, '');
}

function inferPosition(name) {
  if (TEAM_DEFENSES.has(name)) return 'DST';
  if (KNOWN_KICKERS.has(name)) return 'K';
  if (KNOWN_QBS.has(name)) return 'QB';
  if (KNOWN_TES.has(name)) return 'TE';
  if (KNOWN_RBS.has(name)) return 'RB';
  // Default to WR for unknown skill players
  return 'WR';
}

function estimateProjection(adp, position) {
  const baseProjections = {
    'QB': { top: 420, decay: 0.6 },
    'RB': { top: 300, decay: 0.45 },
    'WR': { top: 320, decay: 0.48 },
    'TE': { top: 200, decay: 0.28 },
    'K': { top: 160, decay: 0.15 },
    'DST': { top: 140, decay: 0.12 },
  };
  const config = baseProjections[position] || { top: 100, decay: 0.2 };
  return Math.max(1, Math.round(config.top - (adp * config.decay)));
}

function parseRankingsFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const players = [];
  let skippedK = 0;
  let skippedDST = 0;
  
  for (const line of lines) {
    // Match pattern: "RANK Name (TEAM)"
    const match = line.match(/^\s*(\d+)\s+(.+?)\s+\(([A-Z]{2,3})\)\s*$/);
    if (match) {
      const adp = parseInt(match[1], 10);
      const name = match[2].trim();
      const team = match[3];
      const position = inferPosition(name);
      
      // Skip kickers and defenses - not used in bestball
      if (position === 'K') {
        skippedK++;
        continue;
      }
      if (position === 'DST') {
        skippedDST++;
        continue;
      }
      
      players.push({
        id: generateId(name),
        name,
        team,
        position,
        adp,
        byeWeek: BYE_WEEKS[team] || 0,
        projection: estimateProjection(adp, position),
      });
    }
  }
  
  console.log(`  Skipped: ${skippedK} kickers, ${skippedDST} defenses`);
  return players;
}

function generatePlayerPool() {
  console.log(`\nParsing cleaned rankings for ${YEAR}...\n`);
  
  const inputPath = path.join(__dirname, '../cleaned_rankings.txt');
  
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: File not found: ${inputPath}`);
    console.log('Please ensure cleaned_rankings.txt exists in the project root.');
    process.exit(1);
  }
  
  const players = parseRankingsFile(inputPath);
  
  // Remove duplicates
  const seen = new Set();
  const uniquePlayers = players.filter(p => {
    if (seen.has(p.id)) {
      console.log(`  Duplicate removed: ${p.name} (${p.id})`);
      return false;
    }
    seen.add(p.id);
    return true;
  });
  
  // Sort by original ADP
  uniquePlayers.sort((a, b) => a.adp - b.adp);
  
  // Rerank sequentially (1, 2, 3, ...) after removing K/DST
  uniquePlayers.forEach((player, index) => {
    player.adp = index + 1;
  });
  console.log(`  Reranked ${uniquePlayers.length} players (1 to ${uniquePlayers.length})`);
  
  // Count positions
  const positionCounts = {};
  uniquePlayers.forEach(p => {
    positionCounts[p.position] = (positionCounts[p.position] || 0) + 1;
  });
  
  // Generate checksum
  const playerDataString = JSON.stringify(uniquePlayers);
  const checksum = crypto.createHash('sha256').update(playerDataString).digest('hex');
  
  // Build final pool
  const pool = {
    metadata: {
      version: `${YEAR}-topdog-full-v1`,
      generatedAt: new Date().toISOString(),
      checksum,
      playerCount: uniquePlayers.length,
      positionCounts,
      source: 'TopDog Preliminary ADP - Full Rankings',
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
  Object.entries(positionCounts).sort().forEach(([pos, count]) => {
    console.log(`  - ${pos}:`.padEnd(10) + count);
  });
  console.log(`Checksum:    ${checksum.substring(0, 16)}...`);
  console.log('='.repeat(50));
  console.log(`\nOutput: ${jsonPath}`);
  
  // Show first 10 and last 10
  console.log('\n=== Top 10 ===');
  uniquePlayers.slice(0, 10).forEach(p => {
    console.log(`  ${p.adp}. ${p.name} (${p.team}) - ${p.position}`);
  });
  
  console.log('\n=== Last 10 ===');
  uniquePlayers.slice(-10).forEach(p => {
    console.log(`  ${p.adp}. ${p.name} (${p.team}) - ${p.position}`);
  });
  
  console.log('');
}

generatePlayerPool();

