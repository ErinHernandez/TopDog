#!/usr/bin/env node

/**
 * Debug ESPN API errors and test alternative endpoints
 */

const http = require('http');

async function debugESPNAPI() {
  console.log('🔍 Debugging ESPN API Errors...\n');
  
  const testCases = [
    {
      name: 'Current ESPN Core API',
      url: 'http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes/4426499',
      description: 'Test current implementation'
    },
    {
      name: 'ESPN Site API',
      url: 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes/4426499',
      description: 'Test site API endpoint'
    },
    {
      name: 'ESPN API v1',
      url: 'http://api.espn.com/v1/sports/football/nfl/athletes/4426499',
      description: 'Test v1 API endpoint'
    },
    {
      name: 'ESPN API v2',
      url: 'http://api.espn.com/v2/sports/football/nfl/athletes/4426499',
      description: 'Test v2 API endpoint'
    },
    {
      name: 'ESPN Stats API',
      url: 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/statistics',
      description: 'Test stats endpoint'
    },
    {
      name: 'ESPN Teams API',
      url: 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/teams',
      description: 'Test teams endpoint'
    }
  ];

  for (const testCase of testCases) {
    console.log(`📡 Testing: ${testCase.name}`);
    console.log(`   Description: ${testCase.description}`);
    console.log(`   URL: ${testCase.url}`);
    
    try {
      const result = await makeRequest(testCase.url);
      
      console.log(`   Status: ${result.status}`);
      console.log(`   Response size: ${result.data ? JSON.stringify(result.data).length : 0} characters`);
      
      if (result.data && result.data.error) {
        console.log(`   ❌ Error: ${result.data.error}`);
      } else if (result.data && result.data.code) {
        console.log(`   ❌ Code: ${result.data.code}`);
      } else if (result.data && typeof result.data === 'object') {
        const keys = Object.keys(result.data);
        console.log(`   ✅ Success - Top-level keys: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`);
        
        // Show a sample of the data
        if (keys.length > 0) {
          const sampleKey = keys[0];
          const sampleValue = result.data[sampleKey];
          console.log(`   📊 Sample data (${sampleKey}): ${JSON.stringify(sampleValue).substring(0, 100)}...`);
        }
      } else {
        console.log(`   📄 Raw response: ${JSON.stringify(result.data).substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`   💥 EXCEPTION: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
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
            error: 'Invalid JSON response',
            rawData: data.substring(0, 200) + '...'
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

// Test working ESPN endpoints
async function testWorkingEndpoints() {
  console.log('🔍 Testing Working ESPN Endpoints...\n');
  
  const workingEndpoints = [
    {
      name: 'ESPN NFL Teams',
      url: 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/teams',
      description: 'Get all NFL teams'
    },
    {
      name: 'ESPN NFL Standings',
      url: 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/standings',
      description: 'Get NFL standings'
    },
    {
      name: 'ESPN NFL Scoreboard',
      url: 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
      description: 'Get NFL scoreboard'
    }
  ];

  for (const endpoint of workingEndpoints) {
    console.log(`📡 Testing: ${endpoint.name}`);
    console.log(`   Description: ${endpoint.description}`);
    
    try {
      const result = await makeRequest(endpoint.url);
      
      if (result.success && result.status === 200) {
        console.log(`   ✅ SUCCESS - Status: ${result.status}`);
        if (result.data && result.data.sports) {
          const nflData = result.data.sports.find(sport => sport.name === 'Football');
          if (nflData && nflData.leagues) {
            const nflLeague = nflData.leagues.find(league => league.name === 'NFL');
            if (nflLeague && nflLeague.teams) {
              console.log(`   📊 Found ${nflLeague.teams.length} NFL teams`);
            }
          }
        }
      } else {
        console.log(`   ❌ FAILED - Status: ${result.status}`);
        if (result.data && result.data.error) {
          console.log(`   💬 Error: ${result.data.error}`);
        }
      }
    } catch (error) {
      console.log(`   💥 EXCEPTION: ${error.message}`);
    }
    
    console.log('');
  }
}

// Run tests
async function main() {
  console.log('🚀 ESPN API Debug Suite\n');
  console.log('=' .repeat(50));
  
  await debugESPNAPI();
  
  console.log('=' .repeat(50));
  
  await testWorkingEndpoints();
  
  console.log('\n✅ ESPN API debugging complete!');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { debugESPNAPI, testWorkingEndpoints }; 