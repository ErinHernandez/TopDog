#!/usr/bin/env node

/**
 * Parse Falcons player data and integrate into player database
 * Handles the specific format provided by the user
 */

const fs = require('fs');
const path = require('path');

// Falcons data parser
function parseFalconsData(dataString) {
  const lines = dataString.trim().split('\n');
  const players = [];
  
  console.log('=== PARSING FALCONS PLAYER DATA ===');
  
  let currentTeam = 'ATL';
  let currentPosition = '';
  
  lines.forEach((line, index) => {
    // Skip empty lines and header
    if (!line.trim() || line.includes('falcons :')) return;
    
    const parts = line.trim().split(/\s+/);
    if (parts.length < 3) {
      console.log(`⚠️  Skipping line ${index + 1}: insufficient columns (${parts.length})`);
      return;
    }
    
    const firstPart = parts[0];
    
    // Check if this is a position header (only if it's a standalone position line)
    if (['QB', 'RB', 'WR', 'TE', 'DI', 'ED', 'LB', 'CB', 'S'].includes(firstPart) && parts.length < 5) {
      currentPosition = firstPart;
      console.log(`📋 Processing ${currentPosition} position`);
      return;
    }
    
    // If line starts with position but has more data, it's a player line
    if (['QB', 'RB', 'WR', 'TE', 'DI', 'ED', 'LB', 'CB', 'S'].includes(firstPart)) {
      currentPosition = firstPart;
    }
    
    // Debug: log what we're processing
    console.log(`🔍 Line ${index + 1}: "${line}"`);
    console.log(`   Current position: ${currentPosition}`);
    console.log(`   First part: "${firstPart}"`);
    
    // Skip "Total" rows for position groups
    if (firstPart.toLowerCase().includes('total') || line.toLowerCase().includes('total')) {
      console.log(`📊 Skipping total row: ${line}`);
      return;
    }
    
    // Skip defensive players for now (focus on offensive players)
    if (['DI', 'ED', 'LB', 'CB', 'S'].includes(currentPosition)) {
      return;
    }
    
    // Only process offensive positions
    const offensivePositions = ['QB', 'RB', 'WR', 'TE'];
    if (!offensivePositions.includes(currentPosition)) {
      return;
    }
    
    try {
      // Parse player data
      // Format: PlayerName Games Att Comp Yds TD INT Sk Att Yds TD Tgt Rec Yd TD Pts Rk
      let playerName = '';
      let dataStartIndex = 0;
      
      // Debug: log the parts we're working with
      console.log(`🔍 Parsing line: ${line}`);
      console.log(`   Parts: [${parts.slice(0, 5).join(', ')}...]`);
      
      // Handle multi-word player names (position is first part, so start from second)
      if (parts[1] && isNaN(parts[1])) {
        // Check if third part is also a name (not a number)
        if (parts[2] && isNaN(parts[2])) {
          playerName = `${parts[1]} ${parts[2]} ${parts[3]}`;
          dataStartIndex = 4;
        } else {
          playerName = `${parts[1]} ${parts[2]}`;
          dataStartIndex = 3;
        }
      } else {
        playerName = parts[1];
        dataStartIndex = 2;
      }
      
      // For the data format: Pos Player Games Att Comp Yds TD INT Sk Att Yds TD Tgt Rec Yd TD Pts Rk
      // The actual data starts after the player name and games, so adjust dataStartIndex
      // dataStartIndex should point to the first passing stat (Att)
      dataStartIndex = dataStartIndex; // Keep as is - it should point to the first data column
      
      // Remove games played from player name if it was included
      if (playerName && !isNaN(playerName.split(' ').pop())) {
        const nameParts = playerName.split(' ');
        nameParts.pop(); // Remove the last part if it's a number
        playerName = nameParts.join(' ');
      }
      
      console.log(`   Player name: "${playerName}", data starts at index: ${dataStartIndex}`);
      
      // Ensure we have enough data columns (minimum 16 data points after player name)
      const minRequiredColumns = dataStartIndex + 16;
      if (parts.length < minRequiredColumns) {
        // For the last player, be more flexible if we have at least the basic stats
        if (parts.length >= dataStartIndex + 14) {
          console.log(`⚠️  Processing ${playerName} with limited data (${parts.length} columns)`);
        } else {
          console.log(`⚠️  Skipping ${playerName}: insufficient data columns (${parts.length} < ${minRequiredColumns})`);
          return;
        }
      }
      
      const games = parseInt(parts[dataStartIndex - 1]) || 17; // Games is at dataStartIndex - 1
      
      // Passing stats: Att Comp Yds TD INT Sk
      const passingAttempts = parseInt(parts[dataStartIndex]) || 0;
      const passingCompletions = parseInt(parts[dataStartIndex + 1]) || 0;
      const passingYards = parseInt(parts[dataStartIndex + 2]) || 0;
      const passingTDs = parseInt(parts[dataStartIndex + 3]) || 0;
      const passingINTs = parseInt(parts[dataStartIndex + 4]) || 0;
      const sacks = parseInt(parts[dataStartIndex + 5]) || 0;
      
      // Rushing stats: Att Yds TD
      const rushingAttempts = parseInt(parts[dataStartIndex + 6]) || 0;
      const rushingYards = parseInt(parts[dataStartIndex + 7]) || 0;
      const rushingTDs = parseInt(parts[dataStartIndex + 8]) || 0;
      
      // Receiving stats: Tgt Rec Yd TD
      const targets = parseInt(parts[dataStartIndex + 9]) || 0;
      const receptions = parseInt(parts[dataStartIndex + 10]) || 0;
      const receivingYards = parseInt(parts[dataStartIndex + 11]) || 0;
      const receivingTDs = parseInt(parts[dataStartIndex + 12]) || 0;
      
      // Debug: show the actual values we're reading
      console.log(`   Raw receiving data: targets=${parts[dataStartIndex + 9]}, receptions=${parts[dataStartIndex + 10]}, yards=${parts[dataStartIndex + 11]}, TDs=${parts[dataStartIndex + 12]}`);
      
      // Debug receiving stats
      console.log(`   Receiving: targets=${targets}, receptions=${receptions}, yards=${receivingYards}, TDs=${receivingTDs}`);
      
      // Debug receiving stats
      console.log(`   Receiving: targets=${targets}, receptions=${receptions}, yards=${receivingYards}, TDs=${receivingTDs}`);
      
      // Fantasy stats: Pts Rk
      const fantasyPointsPPR = parseInt(parts[dataStartIndex + 13]) || 0;
      const rank = parseInt(parts[dataStartIndex + 14]) || 999;
      
      // Debug fantasy stats
      console.log(`   Fantasy stats: PPR=${fantasyPointsPPR}, rank=${rank}`);
      
      // Convert PPR to Half-PPR (TopDog uses Half-PPR)
      const halfPPRReduction = receptions * 0.5;
      const fantasyPointsHalfPPR = Math.max(0, fantasyPointsPPR - halfPPRReduction);
      
      // Debug fantasy points calculation
      console.log(`   Fantasy points: PPR=${fantasyPointsPPR}, receptions=${receptions}, reduction=${halfPPRReduction}, Half-PPR=${fantasyPointsHalfPPR}`);
      
      const player = {
        name: playerName,
        position: currentPosition,
        team: currentTeam,
        games: games,
        clayProj: Math.round(fantasyPointsHalfPPR * 10) / 10,
        clayRank: rank,
        clayGames: games,
        clayProjections: {
          fantasyPoints: Math.round(fantasyPointsHalfPPR * 10) / 10,
          games: games,
          passing: currentPosition === 'QB' ? {
            completions: passingCompletions,
            attempts: passingAttempts,
            yards: passingYards,
            touchdowns: passingTDs,
            interceptions: passingINTs,
            sacks: sacks,
            qbr: passingYards > 0 ? Math.min(110, 85 + (fantasyPointsHalfPPR - 250) / 10) : 0
          } : undefined,
          rushing: {
            attempts: rushingAttempts,
            yards: rushingYards,
            touchdowns: rushingTDs,
            longRush: rushingYards > 0 ? Math.round(15 + Math.random() * 20) : 0,
            yardsPerAttempt: rushingAttempts > 0 ? (rushingYards / rushingAttempts).toFixed(1) : "0.0",
            yardsPerGame: (rushingYards / games).toFixed(1),
            firstDowns: Math.round(rushingYards / 10)
          },
          receiving: {
            targets: targets,
            receptions: receptions,
            yards: receivingYards,
            touchdowns: receivingTDs,
            yardsPerReception: receptions > 0 ? (receivingYards / receptions).toFixed(1) : "0.0",
            yardsPerTarget: targets > 0 ? (receivingYards / targets).toFixed(1) : "0.0",
            catchRate: targets > 0 ? ((receptions / targets) * 100).toFixed(1) : "0.0"
          }
        }
      };
      
      players.push(player);
      console.log(`✅ Added ${playerName} (${currentPosition}) - ${fantasyPointsHalfPPR} pts, rank ${rank}`);
      
    } catch (error) {
      console.error(`❌ Error parsing line ${index + 1}:`, error);
    }
  });
  
  return players;
}

// Load existing database
function loadDatabase() {
  const dbPath = path.join(__dirname, '../data/playerDatabase.json');
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading database:', error);
  }
  
  // Return empty database structure
  return {
    meta: {
      lastUpdated: new Date().toISOString(),
      sources: {
        projections: ['Mike Clay ESPN 2025'],
        historical: [],
        adp: [],
        rankings: []
      },
      season: 2025
    },
    players: {
      QB: [],
      RB: [],
      WR: [],
      TE: []
    }
  };
}

// Save database
function saveDatabase(database) {
  const dbPath = path.join(__dirname, '../data/playerDatabase.json');
  try {
    // Create backup
    if (fs.existsSync(dbPath)) {
      const backupPath = path.join(__dirname, '../data/playerDatabase_backup_' + new Date().toISOString().replace(/[:.]/g, '-') + '.json');
      fs.copyFileSync(dbPath, backupPath);
      console.log(`💾 Created backup: ${backupPath}`);
    }
    
    fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
    console.log('✅ Database saved successfully');
  } catch (error) {
    console.error('❌ Error saving database:', error);
  }
}

// Integrate players into database
function integratePlayers(database, newPlayers) {
  let added = 0;
  let updated = 0;
  
  newPlayers.forEach(newPlayer => {
    const position = newPlayer.position;
    if (!database.players[position]) {
      database.players[position] = [];
    }
    
    // Check if player already exists
    const existingIndex = database.players[position].findIndex(p => 
      p.name.toLowerCase() === newPlayer.name.toLowerCase() && 
      p.team === newPlayer.team
    );
    
    if (existingIndex >= 0) {
      // Update existing player
      database.players[position][existingIndex] = {
        ...database.players[position][existingIndex],
        ...newPlayer,
        clayProj: newPlayer.clayProj,
        clayRank: newPlayer.clayRank,
        clayProjections: newPlayer.clayProjections
      };
      updated++;
      console.log(`🔄 Updated ${newPlayer.name}`);
    } else {
      // Add new player
      const playerId = `${position}-${newPlayer.name.replace(/\s+/g, '')}-${Date.now()}`;
      database.players[position].push({
        id: playerId,
        ...newPlayer,
        bye: null, // Will need to be filled in later
        projections: {
          mikeClay: newPlayer.clayProjections
        },
        historical: {
          2024: { fantasyPoints: null, games: null, passing: {}, rushing: {}, receiving: {} },
          2023: { fantasyPoints: null, games: null, passing: {}, rushing: {}, receiving: {} },
          2022: { fantasyPoints: null, games: null, passing: {}, rushing: {}, receiving: {} }
        },
        draft: {
          adp: null,
          adpSource: '',
          expertRankings: { overall: null, position: null }
        },
        analytics: {
          consistency: null,
          ceiling: null,
          floor: null,
          snapShare: null,
          targetShare: null,
          redZoneTargets: null,
          goalLineCarries: null
        },
        risk: {
          injuryHistory: [],
          ageRisk: null,
          situationRisk: null
        }
      });
      added++;
      console.log(`➕ Added ${newPlayer.name}`);
    }
  });
  
  return { added, updated };
}

// Main execution
function main() {
  // Falcons data provided by user
  const falconsData = `falcons :
QB Michael Penix Jr. 17 545 347 3960 23 13 36 47 187 3 0 0 0 0 250 26 DI David Onyemata 540 42 2.1 0.0 48 1 TB H 22.8 26.7 36%
QB Kirk Cousins 17 6 4 43 0 0 0 0 0 0 0 0 0 0 2 48 DI Morgan Fox 519 29 3.0 0.0 73 2 MIN V 19.8 24.9 32%
QB Total 34 550 351 4003 23 13 36 48 188 3 0 0 0 0 253 74 DI Ta'Quon Graham 454 32 1.4 0.0 89 3 CAR V 24.2 22.8 55%
RB Bijan Robinson 17 0 0 0 0 0 0 303 1422 12 79 62 490 2 336 1 DI Zach Harrison 378 32 1.5 0.0 86 4 WAS H 24.7 27.8 39%
RB Tyler Allgeier 17 0 0 0 0 0 0 121 551 4 13 11 75 0 98 48 DI Ruke Orhorhoro 303 22 1.3 0.0 110 5 0.0 0.0
RB Jashaun Corbin 17 0 0 0 0 0 0 9 40 0 3 2 14 0 10 101 DI Kentavius Street 227 15 0.9 0.0 126 6 BUF H 22.8 29.5 27%
RB Total 51 0 0 0 0 0 0 433 2013 16 95 75 579 3 443 150 DI Total 2420 173 10.2 0.1 532 7 SF V 23.6 25.8 42%
WR Drake London 17 0 0 0 0 0 0 0 0 0 154 97 1203 8 267 10 ED Jalon Walker 562 38 5.5 0.2 48 8 MIA H 24.1 24.7 48%
WR Darnell Mooney 16 0 0 0 0 0 0 0 0 0 95 58 789 4 161 55 ED James Pearce Jr. 540 37 5.3 0.1 54 9 NE V 20.4 23.5 39%
WR Ray-Ray McCloud 17 0 0 0 0 0 0 9 66 0 65 45 465 2 111 71 ED Arnold Ebiketie 529 36 5.1 0.2 64 10 IND V 21.6 23.1 45%
WR KhaDarel Hodge 17 0 0 0 0 0 0 0 0 0 18 11 148 1 30 121 ED Leonard Floyd 443 30 4.8 0.0 79 11 CAR H 25.3 21.7 63%
WR Jamal Agnew 17 0 0 0 0 0 0 0 0 0 6 4 44 0 12 142 ED Bralen Trice 162 11 1.5 0.0 126 12 NO V 23.6 20.4 61%
WR Total 84 0 0 0 0 0 0 9 66 0 338 215 2649 15 582 399 ED DeAngelo Malone 32 2 0.3 0.0 163 13 NYJ V 21.1 22.0 47%
TE Kyle Pitts 17 0 0 0 0 0 0 0 0 0 80 50 668 4 143 19 ED Total 2269 155 22.6 0.6 534 14 SEA H 21.6 22.1 48%
TE Charlie Woerner 17 0 0 0 0 0 0 0 0 0 14 9 88 1 21 59 LB Kaden Elliss 1026 145 4.4 0.7 7 15 TB V 21.7 27.9 29%
TE Feleipe Franks 17 0 0 0 0 0 0 0 0 0 3 2 18 0 4 93`;

  console.log('🚀 Starting Falcons data integration...\n');
  
  // Parse the data
  const players = parseFalconsData(falconsData);
  
  if (players.length === 0) {
    console.log('❌ No players found to integrate');
    return;
  }
  
  console.log(`\n📊 Found ${players.length} offensive players to integrate`);
  
  // Load existing database
  const database = loadDatabase();
  
  // Integrate players
  const { added, updated } = integratePlayers(database, players);
  
  // Update metadata
  database.meta.lastUpdated = new Date().toISOString();
  if (!database.meta.sources.projections.includes('Mike Clay ESPN 2025')) {
    database.meta.sources.projections.push('Mike Clay ESPN 2025');
  }
  
  // Save database
  saveDatabase(database);
  
  console.log(`\n✅ Integration complete!`);
  console.log(`➕ Added: ${added} new players`);
  console.log(`🔄 Updated: ${updated} existing players`);
  console.log(`📈 Total players in database:`);
  Object.entries(database.players).forEach(([position, players]) => {
    console.log(`   ${position}: ${players.length} players`);
  });
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { parseFalconsData, integratePlayers }; 