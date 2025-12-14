#!/usr/bin/env node

/**
 * Build fresh player database from ESPN API data
 */

const http = require('http');
const fs = require('fs');

async function buildFreshPlayerDatabase() {
  console.log('🏗️  Building Fresh Player Database from ESPN API...\n');
  
  try {
    // Initialize fresh database structure
    const freshDatabase = {
      meta: {
        lastUpdated: new Date().toISOString(),
        source: "ESPN API - Fresh Start",
        version: "1.0.0",
        totalPlayers: 0
      },
      players: {
        QB: [],
        RB: [],
        WR: [],
        TE: []
      }
    };
    
    console.log('📡 Fetching ESPN preseason statistics...');
    const statsResult = await makeRequest('http://site.api.espn.com/apis/site/v2/sports/football/nfl/statistics');
    
    if (!statsResult.success) {
      throw new Error('Failed to fetch ESPN statistics');
    }
    
    const statsData = statsResult.data;
    console.log(`✅ Fetched ${statsData.stats.categories.length} stat categories`);
    
    // Map of players by ID to avoid duplicates
    const playerMap = new Map();
    
    // Process fantasy-relevant categories
    const fantasyCategories = statsData.stats.categories.filter(cat => 
      cat.name.includes('pass') || cat.name.includes('rush') || cat.name.includes('receiv') ||
      cat.name.includes('touchdown') || cat.name.includes('attempt') || cat.name.includes('completion')
    );
    
    console.log(`📊 Processing ${fantasyCategories.length} fantasy-relevant categories...`);
    
    for (const category of fantasyCategories) {
      if (category.leaders && category.leaders.length > 0) {
        console.log(`   📈 Processing ${category.name}: ${category.leaders.length} leaders`);
        
        for (const leader of category.leaders) {
          const athlete = leader.athlete;
          const playerId = athlete.id;
          const value = parseFloat(leader.value) || 0;
          
          if (!playerMap.has(playerId)) {
            // Create new player entry
            const player = {
              id: playerId,
              name: athlete.displayName,
              position: athlete.position?.abbreviation || 'UNK',
              team: 'UNKNOWN', // Will be updated if we can find team info
              bye: null,
              projections: {
                espn: {
                  passingYards: 0,
                  passingTDs: 0,
                  passingINTs: 0,
                  rushingYards: 0,
                  rushingTDs: 0,
                  receivingYards: 0,
                  receivingTDs: 0,
                  receptions: 0,
                  targets: 0,
                  fantasyPoints: 0
                }
              },
              historical: {
                2024: {},
                2023: {},
                2022: {}
              },
              draft: {
                adp: null,
                tier: null,
                notes: ''
              },
              analytics: {
                risk: 'medium',
                upside: 'medium',
                consistency: 'medium'
              },
              risk: {
                injury: 'medium',
                competition: 'medium',
                situation: 'medium'
              }
            };
            
            playerMap.set(playerId, player);
          }
          
          // Update player stats based on category
          const player = playerMap.get(playerId);
          updatePlayerStats(player, category.name, value);
        }
      }
    }
    
    console.log(`\n📊 Found ${playerMap.size} unique players`);
    
    // Categorize players by position
    for (const [playerId, player] of playerMap) {
      const position = player.position.toUpperCase();
      if (['QB', 'RB', 'WR', 'TE'].includes(position)) {
        freshDatabase.players[position].push(player);
      }
    }
    
    // Count players by position
    Object.keys(freshDatabase.players).forEach(pos => {
      freshDatabase.meta.totalPlayers += freshDatabase.players[pos].length;
      console.log(`   ${pos}: ${freshDatabase.players[pos].length} players`);
    });
    
    // Save the fresh database
    const outputPath = 'data/playerDatabase.json';
    fs.writeFileSync(outputPath, JSON.stringify(freshDatabase, null, 2));
    
    console.log(`\n✅ Fresh player database saved to: ${outputPath}`);
    console.log(`📊 Total players: ${freshDatabase.meta.totalPlayers}`);
    
    // Show sample players
    console.log('\n📋 Sample Players:');
    Object.keys(freshDatabase.players).forEach(pos => {
      if (freshDatabase.players[pos].length > 0) {
        const samplePlayer = freshDatabase.players[pos][0];
        console.log(`   ${pos}: ${samplePlayer.name} (${samplePlayer.id})`);
        console.log(`      Stats: ${JSON.stringify(samplePlayer.projections.espn)}`);
      }
    });
    
    console.log('\n🎯 Fresh Database Summary:');
    console.log('   ✅ Built from ESPN preseason statistics');
    console.log('   ✅ Players categorized by position');
    console.log('   ✅ Basic stat projections included');
    console.log('   ✅ Ready for external projection integration');
    
  } catch (error) {
    console.log(`💥 Error building fresh database: ${error.message}`);
  }
}

function updatePlayerStats(player, categoryName, value) {
  const espn = player.projections.espn;
  
  switch (categoryName) {
    case 'passingYards':
      espn.passingYards = value;
      break;
    case 'passingTouchdowns':
      espn.passingTDs = value;
      break;
    case 'rushingYards':
      espn.rushingYards = value;
      break;
    case 'rushingTouchdowns':
      espn.rushingTDs = value;
      break;
    case 'receivingYards':
      espn.receivingYards = value;
      break;
    case 'receivingTouchdowns':
      espn.receivingTDs = value;
      break;
    case 'receptions':
      espn.receptions = value;
      break;
    case 'passingAttempts':
      // Could be used for completion percentage calculations
      break;
    case 'passingCompletions':
      // Could be used for completion percentage calculations
      break;
  }
  
  // Calculate basic fantasy points (simple formula)
  const fantasyPoints = calculateFantasyPoints(espn);
  espn.fantasyPoints = fantasyPoints;
}

function calculateFantasyPoints(stats) {
  // Simple fantasy points calculation (Half-PPR)
  const passingPoints = (stats.passingYards * 0.04) + (stats.passingTDs * 4) - (stats.passingINTs * 2);
  const rushingPoints = (stats.rushingYards * 0.1) + (stats.rushingTDs * 6);
  const receivingPoints = (stats.receivingYards * 0.1) + (stats.receivingTDs * 6) + (stats.receptions * 0.5);
  
  return Math.round((passingPoints + rushingPoints + receivingPoints) * 100) / 100;
}

// Helper function to make HTTP requests
function makeRequest(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            success: true,
            status: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            success: false,
            status: res.statusCode,
            error: 'Invalid JSON response'
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        success: false,
        status: 0,
        error: error.message
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        success: false,
        status: 0,
        error: 'Request timeout'
      });
    });
  });
}

// Run build
if (require.main === module) {
  buildFreshPlayerDatabase().catch(console.error);
}

module.exports = { buildFreshPlayerDatabase }; 