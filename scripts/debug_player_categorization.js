#!/usr/bin/env node

/**
 * Debug player categorization from ESPN API
 */

const http = require('http');

async function debugPlayerCategorization() {
  console.log('🔍 Debugging Player Categorization...\n');
  
  try {
    const statsResult = await makeRequest('http://site.api.espn.com/apis/site/v2/sports/football/nfl/statistics');
    
    if (!statsResult.success) {
      throw new Error('Failed to fetch ESPN statistics');
    }
    
    const statsData = statsResult.data;
    const fantasyCategories = statsData.stats.categories.filter(cat => 
      cat.name.includes('pass') || cat.name.includes('rush') || cat.name.includes('receiv')
    );
    
    console.log(`📊 Analyzing ${fantasyCategories.length} fantasy categories...\n`);
    
    const playerMap = new Map();
    
    for (const category of fantasyCategories) {
      if (category.leaders && category.leaders.length > 0) {
        console.log(`📈 Category: ${category.name}`);
        
        for (const leader of category.leaders.slice(0, 3)) { // Show first 3 players
          const athlete = leader.athlete;
          const playerId = athlete.id;
          
          if (!playerMap.has(playerId)) {
            playerMap.set(playerId, athlete);
            
            console.log(`   Player: ${athlete.displayName} (${playerId})`);
            console.log(`   Position: ${JSON.stringify(athlete.position)}`);
            console.log(`   Team: ${JSON.stringify(athlete.team)}`);
            console.log(`   Value: ${leader.displayValue}`);
            console.log('');
          }
        }
      }
    }
    
    console.log(`📊 Total unique players found: ${playerMap.size}`);
    
    // Analyze position data
    const positions = new Map();
    for (const [playerId, athlete] of playerMap) {
      const pos = athlete.position?.abbreviation || athlete.position?.name || 'UNKNOWN';
      if (!positions.has(pos)) {
        positions.set(pos, []);
      }
      positions.get(pos).push(athlete.displayName);
    }
    
    console.log('\n📋 Position Analysis:');
    for (const [pos, players] of positions) {
      console.log(`   ${pos}: ${players.length} players`);
      if (players.length <= 3) {
        console.log(`      ${players.join(', ')}`);
      } else {
        console.log(`      ${players.slice(0, 3).join(', ')}... and ${players.length - 3} more`);
      }
    }
    
  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
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

// Run debug
if (require.main === module) {
  debugPlayerCategorization().catch(console.error);
}

module.exports = { debugPlayerCategorization }; 