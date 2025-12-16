#!/usr/bin/env node

/**
 * Simple parser for Mike Clay ESPN 2025 projections
 */

const fs = require('fs');

async function parseClaySimple() {
  console.log('📊 Simple Parse of Mike Clay ESPN 2025 Projections...\n');
  
  try {
    // Read the raw text file
    const text = fs.readFileSync('clay_projections_2025_raw.txt', 'utf8');
    const lines = text.split('\n');
    
    console.log(`📝 Processing ${lines.length} lines of text...`);
    
    // Parse the projections
    const projections = parseProjections(lines);
    
    // Save parsed projections
    const outputPath = 'clay_projections_2025_simple.json';
    fs.writeFileSync(outputPath, JSON.stringify(projections, null, 2));
    
    console.log(`\n✅ Parsed projections saved to: ${outputPath}`);
    console.log(`📊 Total players parsed: ${projections.length}`);
    
    // Show sample projections
    console.log('\n📋 Sample Projections:');
    projections.slice(0, 10).forEach((player, index) => {
      console.log(`${index + 1}. ${player.name} (${player.position}, ${player.team})`);
      if (player.passing) {
        console.log(`   Passing: ${player.passing.attempts} att, ${player.passing.yards} yds, ${player.passing.tds} TD, ${player.passing.ints} INT`);
      }
      if (player.rushing) {
        console.log(`   Rushing: ${player.rushing.attempts} att, ${player.rushing.yards} yds, ${player.rushing.tds} TD`);
      }
      if (player.receiving) {
        console.log(`   Receiving: ${player.receiving.targets} tgts, ${player.receiving.receptions} rec, ${player.receiving.yards} yds, ${player.receiving.tds} TD`);
      }
      console.log(`   Fantasy: ${player.fantasy.ppr} PPR, ${player.fantasy.halfPpr} Half-PPR`);
      console.log('');
    });
    
    // Position breakdown
    const positionCounts = {};
    projections.forEach(player => {
      positionCounts[player.position] = (positionCounts[player.position] || 0) + 1;
    });
    
    console.log('📊 Position Breakdown:');
    Object.keys(positionCounts).forEach(pos => {
      console.log(`   ${pos}: ${positionCounts[pos]} players`);
    });
    
    return projections;
    
  } catch (error) {
    console.log(`💥 Error parsing Clay projections: ${error.message}`);
    throw error;
  }
}

function parseProjections(lines) {
  const projections = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Look for player lines that start with QB, RB, WR, TE
    if (line.match(/^(QB|RB|WR|TE)[A-Z]/)) {
      const player = parsePlayerLine(line);
      if (player) {
        projections.push(player);
      }
    }
  }
  
  console.log(`   Parsed ${projections.length} players`);
  return projections;
}

function parsePlayerLine(line) {
  try {
    // Extract position
    const position = line.substring(0, 2);
    
    // Remove position prefix and find the player data
    const data = line.substring(2);
    
    // Find where the defensive data starts (usually after the fantasy points)
    const defensiveStart = data.indexOf('DI');
    const offensiveData = defensiveStart > 0 ? data.substring(0, defensiveStart) : data;
    
    // Parse based on position
    let player = {
      position: position,
      fantasy: {}
    };
    
    if (position === 'QB') {
      // QB format: Name Team Games Att Comp Yds TD INT Sk Att Yds TD Tgt Rec Yd TD Pts
      // Example: Kyler Murray17552374386522123690597500003068
      
      // Find the team (3-letter code)
      const teamMatch = offensiveData.match(/([A-Z]{3})(\d+)/);
      if (!teamMatch) return null;
      
      const team = teamMatch[1];
      const games = parseInt(teamMatch[2]);
      
      // Extract name (everything before the team)
      const nameEnd = offensiveData.indexOf(team);
      const name = offensiveData.substring(0, nameEnd).trim();
      
      // Extract stats after team and games
      const statsStart = nameEnd + 3 + teamMatch[2].length;
      const stats = offensiveData.substring(statsStart);
      
      // Parse stats (assuming fixed width format)
      if (stats.length >= 50) {
        player.name = name;
        player.team = team;
        player.games = games;
        
        // Parse passing stats
        player.passing = {
          attempts: parseInt(stats.substring(0, 4)) || 0,
          completions: parseInt(stats.substring(4, 7)) || 0,
          yards: parseInt(stats.substring(7, 11)) || 0,
          tds: parseInt(stats.substring(11, 13)) || 0,
          ints: parseInt(stats.substring(13, 15)) || 0,
          sacks: parseInt(stats.substring(15, 17)) || 0
        };
        
        // Parse rushing stats
        player.rushing = {
          attempts: parseInt(stats.substring(17, 20)) || 0,
          yards: parseInt(stats.substring(20, 24)) || 0,
          tds: parseInt(stats.substring(24, 26)) || 0
        };
        
        // Parse receiving stats
        player.receiving = {
          targets: parseInt(stats.substring(26, 29)) || 0,
          receptions: parseInt(stats.substring(29, 32)) || 0,
          yards: parseInt(stats.substring(32, 36)) || 0,
          tds: parseInt(stats.substring(36, 38)) || 0
        };
        
        // Parse fantasy points
        player.fantasy.ppr = parseFloat(stats.substring(38, 42)) || 0;
        player.fantasy.halfPpr = parseFloat(stats.substring(38, 42)) || 0; // QBs don't get PPR bonus
      }
      
    } else if (position === 'RB') {
      // RB format: Name Team Games Att Yds TD Tgt Rec Yd TD Pts
      // Example: James Conner17000000232104895346344225018
      
      // Find the team (3-letter code)
      const teamMatch = offensiveData.match(/([A-Z]{3})(\d+)/);
      if (!teamMatch) return null;
      
      const team = teamMatch[1];
      const games = parseInt(teamMatch[2]);
      
      // Extract name (everything before the team)
      const nameEnd = offensiveData.indexOf(team);
      const name = offensiveData.substring(0, nameEnd).trim();
      
      // Extract stats after team and games
      const statsStart = nameEnd + 3 + teamMatch[2].length;
      const stats = offensiveData.substring(statsStart);
      
      // Parse stats (assuming fixed width format)
      if (stats.length >= 40) {
        player.name = name;
        player.team = team;
        player.games = games;
        
        // Parse rushing stats
        player.rushing = {
          attempts: parseInt(stats.substring(0, 4)) || 0,
          yards: parseInt(stats.substring(4, 8)) || 0,
          tds: parseInt(stats.substring(8, 10)) || 0
        };
        
        // Parse receiving stats
        player.receiving = {
          targets: parseInt(stats.substring(10, 13)) || 0,
          receptions: parseInt(stats.substring(13, 16)) || 0,
          yards: parseInt(stats.substring(16, 20)) || 0,
          tds: parseInt(stats.substring(20, 22)) || 0
        };
        
        // Parse fantasy points
        player.fantasy.ppr = parseFloat(stats.substring(22, 26)) || 0;
        player.fantasy.halfPpr = parseFloat(stats.substring(22, 26)) - (player.receiving.receptions * 0.5) || 0;
      }
      
    } else if (position === 'WR' || position === 'TE') {
      // WR/TE format: Name Team Games Tgt Rec Yd TD Att Yds TD Pts
      // Example: Marvin Harrison Jr.17000000000139831144724019
      
      // Find the team (3-letter code)
      const teamMatch = offensiveData.match(/([A-Z]{3})(\d+)/);
      if (!teamMatch) return null;
      
      const team = teamMatch[1];
      const games = parseInt(teamMatch[2]);
      
      // Extract name (everything before the team)
      const nameEnd = offensiveData.indexOf(team);
      const name = offensiveData.substring(0, nameEnd).trim();
      
      // Extract stats after team and games
      const statsStart = nameEnd + 3 + teamMatch[2].length;
      const stats = offensiveData.substring(statsStart);
      
      // Parse stats (assuming fixed width format)
      if (stats.length >= 40) {
        player.name = name;
        player.team = team;
        player.games = games;
        
        // Parse receiving stats
        player.receiving = {
          targets: parseInt(stats.substring(0, 4)) || 0,
          receptions: parseInt(stats.substring(4, 7)) || 0,
          yards: parseInt(stats.substring(7, 11)) || 0,
          tds: parseInt(stats.substring(11, 13)) || 0
        };
        
        // Parse rushing stats
        player.rushing = {
          attempts: parseInt(stats.substring(13, 16)) || 0,
          yards: parseInt(stats.substring(16, 20)) || 0,
          tds: parseInt(stats.substring(20, 22)) || 0
        };
        
        // Parse fantasy points
        player.fantasy.ppr = parseFloat(stats.substring(22, 26)) || 0;
        player.fantasy.halfPpr = parseFloat(stats.substring(22, 26)) - (player.receiving.receptions * 0.5) || 0;
      }
    }
    
    // Validate player data
    if (player.name && player.team && player.position && player.fantasy.ppr > 0) {
      return player;
    }
    
  } catch (error) {
    // Skip lines that can't be parsed
    return null;
  }
  
  return null;
}

// Run parsing
if (require.main === module) {
  parseClaySimple().catch(console.error);
}

module.exports = { parseClaySimple }; 