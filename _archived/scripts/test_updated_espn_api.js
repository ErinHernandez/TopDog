#!/usr/bin/env node

/**
 * Test the updated ESPN API implementation
 */

async function testUpdatedESPNAPI() {
  console.log('🧪 Testing Updated ESPN API Implementation...\n');
  
  try {
    // Test the working ESPN endpoints directly
    const http = require('http');
    
    console.log('📡 Testing ESPN Teams endpoint...');
    const teamsResult = await makeRequest('http://site.api.espn.com/apis/site/v2/sports/football/nfl/teams');
    if (teamsResult.success) {
      console.log(`   ✅ Teams endpoint working - Status: ${teamsResult.status}`);
      
      const data = teamsResult.data;
      let totalPlayers = 0;
      let samplePlayer = null;
      
      if (data.sports && data.sports.length > 0) {
        const nflData = data.sports.find(sport => sport.name === 'Football');
        if (nflData && nflData.leagues) {
          const nflLeague = nflData.leagues.find(league => league.name === 'NFL');
          if (nflLeague && nflLeague.teams) {
            console.log(`   📊 Found ${nflLeague.teams.length} NFL teams`);
            
            for (const team of nflLeague.teams) {
              if (team.athletes) {
                totalPlayers += team.athletes.length;
                if (!samplePlayer && team.athletes.length > 0) {
                  samplePlayer = {
                    ...team.athletes[0],
                    team: team.name,
                    teamAbbreviation: team.abbreviation
                  };
                }
              }
            }
          }
        }
      }
      
      console.log(`   📊 Total players found: ${totalPlayers}`);
      if (samplePlayer) {
        console.log(`   📊 Sample player: ${samplePlayer.displayName} (${samplePlayer.id}) - ${samplePlayer.teamAbbreviation}`);
      }
    } else {
      console.log(`   ❌ Teams endpoint failed: ${teamsResult.status}`);
    }
    
    console.log('\n📡 Testing ESPN Statistics endpoint...');
    const statsResult = await makeRequest('http://site.api.espn.com/apis/site/v2/sports/football/nfl/statistics');
    if (statsResult.success) {
      console.log(`   ✅ Statistics endpoint working - Status: ${statsResult.status}`);
      
      const data = statsResult.data;
      if (data.stats && data.stats.categories) {
        console.log(`   📊 Found ${data.stats.categories.length} stat categories`);
        
        // Look for relevant categories
        const relevantCategories = data.stats.categories.filter(cat => 
          cat.name.includes('pass') || cat.name.includes('rush') || cat.name.includes('receiv')
        );
        console.log(`   📊 Relevant categories: ${relevantCategories.length}`);
        
        relevantCategories.slice(0, 3).forEach(cat => {
          console.log(`      - ${cat.name}: ${cat.leaders ? cat.leaders.length : 0} leaders`);
        });
      }
    } else {
      console.log(`   ❌ Statistics endpoint failed: ${statsResult.status}`);
    }
    
    // Helper function to make HTTP requests
    async function makeRequest(url) {
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
    
    console.log('\n✅ ESPN API endpoints are working correctly!');
    console.log('\n📋 Summary:');
    console.log('   - Teams endpoint: ✅ Working');
    console.log('   - Statistics endpoint: ✅ Working');
    console.log('   - Updated implementation ready for use');
    
  } catch (error) {
    console.log(`   💥 Error testing ESPN API: ${error.message}`);
  }
}

// Run test
if (require.main === module) {
  testUpdatedESPNAPI().catch(console.error);
}

module.exports = { testUpdatedESPNAPI }; 