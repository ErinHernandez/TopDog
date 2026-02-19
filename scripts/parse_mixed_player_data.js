// Script to parse mixed offensive/defensive player data
// Format appears to be: Pos Player Gm [passing stats] [rushing stats] [receiving stats] Pts Rk [defensive stats if applicable]

function parsePlayerData(dataString) {
  const lines = dataString.trim().split('\n');
  const players = [];
  
  lines.forEach((line, index) => {
    // Skip empty lines
    if (!line.trim()) return;
    
    const parts = line.trim().split(/\s+/);
    if (parts.length < 3) return; // Skip malformed lines
    
    const position = parts[0];
    const playerName = parts[1];
    
    // Skip defensive players (DI = Defensive Interior, ED = Edge, LB = Linebacker, etc.)
    const defensivePositions = ['DI', 'ED', 'LB', 'CB', 'S', 'FS', 'SS', 'OLB', 'MLB', 'DE', 'DT', 'NT'];
    const offensivePositions = ['QB', 'RB', 'WR', 'TE'];
    
    if (defensivePositions.includes(position)) {
      console.log(`Skipping defensive player: ${position} ${playerName}`);
      return;
    }
    
    // Skip "Total" rows
    if (playerName.toLowerCase().includes('total')) {
      console.log(`Skipping total row: ${position} ${playerName}`);
      return;
    }
    
    if (!offensivePositions.includes(position)) {
      console.log(`Unknown position type: ${position} ${playerName}`);
      return;
    }
    
    // Parse the stats based on the format
    // Expected format: Pos Player Gm PassAtt PassComp PassYds PassTD PassINT PassSk RushAtt RushYds RushTD RecTgt RecRec RecYds RecTD Pts Rk
    try {
      const games = parseInt(parts[2]) || 0;
      
      // Offensive stats parsing
      let passAttempts = 0, passCompletions = 0, passYards = 0, passTDs = 0, passINTs = 0, sacks = 0;
      let rushAttempts = 0, rushYards = 0, rushTDs = 0;
      let targets = 0, receptions = 0, recYards = 0, recTDs = 0;
      let fantasyPoints = 0, rank = 0;
      
      // For QBs: expect passing and rushing stats
      if (position === 'QB') {
        passAttempts = parseInt(parts[3]) || 0;
        passCompletions = parseInt(parts[4]) || 0;
        passYards = parseInt(parts[5]) || 0;
        passTDs = parseInt(parts[6]) || 0;
        passINTs = parseInt(parts[7]) || 0;
        sacks = parseInt(parts[8]) || 0;
        rushAttempts = parseInt(parts[9]) || 0;
        rushYards = parseInt(parts[10]) || 0;
        rushTDs = parseInt(parts[11]) || 0;
        // QBs typically don't have receiving stats, so skip to fantasy points
        // Find Pts and Rk (should be near the end before defensive stats start)
        for (let i = 12; i < parts.length - 5; i++) {
          if (!isNaN(parseInt(parts[i])) && !isNaN(parseInt(parts[i + 1]))) {
            fantasyPoints = parseInt(parts[i]);
            rank = parseInt(parts[i + 1]);
            break;
          }
        }
      }
      
      // For RB/WR/TE: expect rushing and receiving stats
      if (['RB', 'WR', 'TE'].includes(position)) {
        // Skip passing stats (usually 0s for non-QBs)
        rushAttempts = parseInt(parts[9]) || 0;
        rushYards = parseInt(parts[10]) || 0;
        rushTDs = parseInt(parts[11]) || 0;
        targets = parseInt(parts[12]) || 0;
        receptions = parseInt(parts[13]) || 0;
        recYards = parseInt(parts[14]) || 0;
        recTDs = parseInt(parts[15]) || 0;
        fantasyPoints = parseInt(parts[16]) || 0;
        rank = parseInt(parts[17]) || 0;
      }
      
      const player = {
        position: position,
        name: playerName,
        games: games,
        passing: {
          attempts: passAttempts,
          completions: passCompletions,
          yards: passYards,
          touchdowns: passTDs,
          interceptions: passINTs,
          sacks: sacks
        },
        rushing: {
          attempts: rushAttempts,
          yards: rushYards,
          touchdowns: rushTDs
        },
        receiving: {
          targets: targets,
          receptions: receptions,
          yards: recYards,
          touchdowns: recTDs
        },
        fantasy: {
          points: fantasyPoints,
          rank: rank
        }
      };
      
      players.push(player);
      console.log(`✅ Parsed: ${position} ${playerName} - ${fantasyPoints} pts (rank ${rank})`);
      
    } catch (error) {
      console.log(`❌ Error parsing: ${position} ${playerName} - ${error.message}`);
    }
  });
  
  return players;
}

// Test with the provided data
const testData = `QB Jaxson Dart 9 293 184 1987 10 8 24 39 182 2 0 0 0 0 131 32 DI Dexter Lawrence 774 63 5.8 0.0 8 1 WAS V 20.6 25.7 32%
QB Russell Wilson 8 265 168 1902 9 5 23 30 119 1 0 0 0 0 120 33 DI Chauncey Golston 516 39 2.6 0.0 58 2 DAL V 20.0 22.9 39%
QB Total 17 558 352 3889 19 13 47 70 301 3 0 0 0 0 251 65 DI Rakeem Nunez-Roches 473 36 1.5 0.0 82 3 KC H 19.2 23.3 36%
RB Tyrone Tracy Jr. 17 0 0 0 0 0 0 218 949 6 53 39 297 2 206 26 DI Jeremiah Ledbetter 204 16 0.6 0.0 131 4 LAC H 21.1 22.3 46%
RB Cam Skattebo 17 0 0 0 0 0 0 147 635 4 37 28 209 1 140 40 DI Elijah Chatman 183 12 0.7 0.0 139 5 NO V 20.6 17.2 62%
RB Devin Singletary 17 0 0 0 0 0 0 17 71 0 5 4 26 0 17 92 DI Roy Robertson-Harris 150 10 0.6 0.0 144 6 PHI H 19.2 24.6 31%
RB Eric Gray 17 0 0 0 0 0 0 0 0 0 0 0 0 0 1 123 DI Darius Alexander 43 3 0.2 0.0 173 7 DEN V 16.8 21.9 32%
RB Total 68 0 0 0 0 0 0 382 1654 10 95 72 532 3 364 281 DI Jordon Riley 21 1 0.1 0.0 180 8 PHI V 18.1 25.7 24%
WR Malik Nabers 17 0 0 0 0 0 0 4 24 0 169 107 1422 8 300 5 DI Total 2365 180 12.1 0.1 915 9 SF H 21.7 21.5 51%
WR Wan'Dale Robinson 17 0 0 0 0 0 0 2 13 0 100 69 675 2 152 58 ED Brian Burns 817 65 8.5 0.2 11 10 CHI V 18.3 22.7 34%
WR Darius Slayton 17 0 0 0 0 0 0 2 13 0 69 38 568 3 115 68 ED Kayvon Thibodeaux 677 39 6.6 0.0 44 11 GB H 19.8 22.6 40%
WR Ihmir Smith-Marsette 17 0 0 0 0 0 0 0 0 0 3 2 19 0 9 148 ED Abdul Carter 666 45 6.4 0.2 33 12 DET V 16.9 26.0 20%
WR Jalin Hyatt 17 0 0 0 0 0 0 0 0 0 5 3 41 0 8 151 ED Tomon Fox 118 8 0.7 0.0 140 13 NE V 17.5 20.3 40%
WR Total 85 0 0 0 0 0 0 8 50 0 346 219 2724 14 583 430 ED Total 2279 157 22.1 0.4 228 14 0.0 0.0
TE Theo Johnson 17 0 0 0 0 0 0 0 0 0 74 51 547 3 122 28 LB Bobby Okereke 1021 140 1.3 0.9 8 15 WAS H 21.7 24.6 40%
TE Daniel Bellinger 17 0 0 0 0 0 0 0 0 0 11 8 67 0 17 62 LB Micah McFadden 752 114 1.3 0.4 37 16 MIN H 18.0 20.6 40%
TE Chris Manhertz 17 0 0 0 0 0 0 0 0 0 3 2 18 0 4 94`;

console.log('=== PARSING MIXED PLAYER DATA ===');
const parsedPlayers = parsePlayerData(testData);

console.log('\n=== SUMMARY ===');
console.log(`Total offensive players parsed: ${parsedPlayers.length}`);

console.log('\n=== OFFENSIVE PLAYERS BY POSITION ===');
['QB', 'RB', 'WR', 'TE'].forEach(pos => {
  const posPlayers = parsedPlayers.filter(p => p.position === pos);
  console.log(`\n${pos} (${posPlayers.length}):`);
  posPlayers.forEach(player => {
    console.log(`  ${player.name}: ${player.fantasy.points} pts (rank ${player.fantasy.rank})`);
    if (pos === 'QB') {
      console.log(`    Pass: ${player.passing.yards} yds, ${player.passing.touchdowns} TDs`);
      console.log(`    Rush: ${player.rushing.yards} yds, ${player.rushing.touchdowns} TDs`);
    } else {
      console.log(`    Rush: ${player.rushing.yards} yds, ${player.rushing.touchdowns} TDs`);
      console.log(`    Rec: ${player.receiving.yards} yds, ${player.receiving.touchdowns} TDs`);
    }
  });
});

// Verify Malik Nabers matches previous data
const malikFromData = parsedPlayers.find(p => p.name === 'Malik' && p.position === 'WR');
if (malikFromData) {
  console.log('\n=== MALIK NABERS VERIFICATION ===');
  console.log('From this data:', JSON.stringify(malikFromData, null, 2));
}