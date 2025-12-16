#!/usr/bin/env node

/**
 * Final parser for Mike Clay ESPN 2025 projections
 */

const fs = require('fs');

async function parseClayFinal() {
  console.log('📊 Final Parse of Mike Clay ESPN 2025 Projections...\n');
  
  try {
    // Read the raw text file
    const text = fs.readFileSync('clay_projections_2025_raw.txt', 'utf8');
    const lines = text.split('\n');
    
    console.log(`📝 Processing ${lines.length} lines of text...`);
    
    // Parse the projections
    const projections = parseProjections(lines);
    
    // Save parsed projections
    const outputPath = 'clay_projections_2025_final.json';
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
    
    // Remove position prefix
    const data = line.substring(2);
    
    // Split by spaces
    const parts = data.split(/\s+/).filter(part => part.trim());
    
    if (parts.length < 10) return null;
    
    let player = {
      position: position,
      fantasy: {}
    };
    
    if (position === 'QB') {
      // QB format: Name Team Games Att Comp Yds TD INT Sk Att Yds TD Tgt Rec Yd TD Pts Rk
      // Example: Kyler Murray17552374386522123690597500003068
      
      // Find the team (3-letter code)
      let teamIndex = -1;
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].length === 3 && /^[A-Z]{3}$/.test(parts[i])) {
          teamIndex = i;
          break;
        }
      }
      
      if (teamIndex === -1) return null;
      
      // Build name from parts before team
      player.name = parts.slice(0, teamIndex).join(' ');
      player.team = parts[teamIndex];
      player.games = parseInt(parts[teamIndex + 1]) || 0;
      
      const statsStart = teamIndex + 2;
      if (parts.length >= statsStart + 13) {
        player.passing = {
          attempts: parseInt(parts[statsStart]) || 0,
          completions: parseInt(parts[statsStart + 1]) || 0,
          yards: parseInt(parts[statsStart + 2]) || 0,
          tds: parseInt(parts[statsStart + 3]) || 0,
          ints: parseInt(parts[statsStart + 4]) || 0,
          sacks: parseInt(parts[statsStart + 5]) || 0
        };
        player.rushing = {
          attempts: parseInt(parts[statsStart + 6]) || 0,
          yards: parseInt(parts[statsStart + 7]) || 0,
          tds: parseInt(parts[statsStart + 8]) || 0
        };
        player.receiving = {
          targets: parseInt(parts[statsStart + 9]) || 0,
          receptions: parseInt(parts[statsStart + 10]) || 0,
          yards: parseInt(parts[statsStart + 11]) || 0,
          tds: parseInt(parts[statsStart + 12]) || 0
        };
        player.fantasy.ppr = parseFloat(parts[statsStart + 13]) || 0;
        player.fantasy.halfPpr = parseFloat(parts[statsStart + 13]) || 0; // QBs don't get PPR bonus
      }
      
    } else if (position === 'RB') {
      // RB format: Name Team Games Att Yds TD Tgt Rec Yd TD Pts Rk
      // Example: James Conner17000000232104895346344225018
      
      // Find the team (3-letter code)
      let teamIndex = -1;
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].length === 3 && /^[A-Z]{3}$/.test(parts[i])) {
          teamIndex = i;
          break;
        }
      }
      
      if (teamIndex === -1) return null;
      
      player.name = parts.slice(0, teamIndex).join(' ');
      player.team = parts[teamIndex];
      player.games = parseInt(parts[teamIndex + 1]) || 0;
      
      const statsStart = teamIndex + 2;
      if (parts.length >= statsStart + 9) {
        player.rushing = {
          attempts: parseInt(parts[statsStart]) || 0,
          yards: parseInt(parts[statsStart + 1]) || 0,
          tds: parseInt(parts[statsStart + 2]) || 0
        };
        player.receiving = {
          targets: parseInt(parts[statsStart + 3]) || 0,
          receptions: parseInt(parts[statsStart + 4]) || 0,
          yards: parseInt(parts[statsStart + 5]) || 0,
          tds: parseInt(parts[statsStart + 6]) || 0
        };
        player.fantasy.ppr = parseFloat(parts[statsStart + 7]) || 0;
        player.fantasy.halfPpr = parseFloat(parts[statsStart + 7]) - (player.receiving.receptions * 0.5) || 0;
      }
      
    } else if (position === 'WR' || position === 'TE') {
      // WR/TE format: Name Team Games Tgt Rec Yd TD Att Yds TD Pts Rk
      // Example: Marvin Harrison Jr.17000000000139831144724019
      
      // Find the team (3-letter code)
      let teamIndex = -1;
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].length === 3 && /^[A-Z]{3}$/.test(parts[i])) {
          teamIndex = i;
          break;
        }
      }
      
      if (teamIndex === -1) return null;
      
      player.name = parts.slice(0, teamIndex).join(' ');
      player.team = parts[teamIndex];
      player.games = parseInt(parts[teamIndex + 1]) || 0;
      
      const statsStart = teamIndex + 2;
      if (parts.length >= statsStart + 9) {
        player.receiving = {
          targets: parseInt(parts[statsStart]) || 0,
          receptions: parseInt(parts[statsStart + 1]) || 0,
          yards: parseInt(parts[statsStart + 2]) || 0,
          tds: parseInt(parts[statsStart + 3]) || 0
        };
        player.rushing = {
          attempts: parseInt(parts[statsStart + 4]) || 0,
          yards: parseInt(parts[statsStart + 5]) || 0,
          tds: parseInt(parts[statsStart + 6]) || 0
        };
        player.fantasy.ppr = parseFloat(parts[statsStart + 7]) || 0;
        player.fantasy.halfPpr = parseFloat(parts[statsStart + 7]) - (player.receiving.receptions * 0.5) || 0;
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
  parseClayFinal().catch(console.error);
}

module.exports = { parseClayFinal }; 