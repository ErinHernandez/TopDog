#!/usr/bin/env node

/**
 * Explore ESPN NFL Statistics endpoint to understand data structure
 */

const http = require('http');

async function exploreESPNStats() {
  console.log('🔍 Exploring ESPN NFL Statistics...\n');
  
  const statsUrl = 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/statistics';
  
  try {
    const result = await makeRequest(statsUrl);
    
    if (result.success && result.status === 200) {
      console.log('✅ Successfully fetched ESPN NFL Statistics\n');
      
      const data = result.data;
      console.log('📊 Data Structure:');
      console.log(`   Timestamp: ${data.timestamp}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Season: ${JSON.stringify(data.season)}`);
      console.log(`   League: ${JSON.stringify(data.league)}`);
      
      // Log all top-level keys to understand structure
      console.log(`\n🔑 Top-level keys: ${Object.keys(data).join(', ')}`);
      
      console.log(`\n📈 Stats field type: ${typeof data.stats}`);
      console.log(`📈 Stats field value: ${JSON.stringify(data.stats).substring(0, 200)}...`);
      
      if (data.stats && typeof data.stats === 'object') {
        console.log(`\n📊 Stats object: ${data.stats.name} (${data.stats.abbreviation})`);
        
        if (data.stats.categories && Array.isArray(data.stats.categories)) {
          console.log(`📈 Categories: ${data.stats.categories.length}`);
          
          // Show first few categories
          data.stats.categories.slice(0, 5).forEach((cat, index) => {
            console.log(`   ${index + 1}. ${cat.name} (${cat.abbreviation})`);
            if (cat.leaders && Array.isArray(cat.leaders)) {
              console.log(`      Leaders: ${cat.leaders.length}`);
              cat.leaders.slice(0, 3).forEach(leader => {
                console.log(`        - ${leader.displayValue} by ${leader.athlete.displayName} (${leader.athlete.id})`);
              });
            }
          });
        }
      }
      
      if (data.stats && Array.isArray(data.stats)) {
        console.log(`\n📈 Statistics Categories: ${data.stats.length}`);
        
        // Show first few stat categories
        data.stats.slice(0, 3).forEach((stat, index) => {
          console.log(`   ${index + 1}. ${stat.name} (${stat.abbreviation})`);
          console.log(`      Type: ${stat.type}`);
          if (stat.categories && Array.isArray(stat.categories)) {
            console.log(`      Categories: ${stat.categories.length}`);
            stat.categories.slice(0, 2).forEach(cat => {
              console.log(`        - ${cat.name}: ${cat.athletes ? cat.athletes.length : 0} athletes`);
            });
          }
        });
        
        // Show first few stat categories
        data.stats.slice(0, 5).forEach((stat, index) => {
          console.log(`   ${index + 1}. ${stat.name} (${stat.abbreviation})`);
          if (stat.categories) {
            console.log(`      Categories: ${stat.categories.length}`);
            stat.categories.slice(0, 3).forEach(cat => {
              console.log(`        - ${cat.name}: ${cat.athletes ? cat.athletes.length : 0} athletes`);
            });
          }
        });
        
        // Look for passing, rushing, receiving stats
        const relevantStats = data.stats.filter(stat => 
          stat.name.toLowerCase().includes('pass') || 
          stat.name.toLowerCase().includes('rush') || 
          stat.name.toLowerCase().includes('receiv')
        );
        
        console.log(`\n🎯 Relevant Stats Found: ${relevantStats.length}`);
        relevantStats.forEach(stat => {
          console.log(`   📊 ${stat.name} (${stat.abbreviation})`);
          if (stat.categories) {
            stat.categories.forEach(cat => {
              console.log(`      - ${cat.name}: ${cat.athletes ? cat.athletes.length : 0} athletes`);
              
              // Show sample athletes if available
              if (cat.athletes && cat.athletes.length > 0) {
                const sampleAthlete = cat.athletes[0];
                console.log(`        Sample: ${sampleAthlete.athlete.displayName} (${sampleAthlete.athlete.id})`);
                if (sampleAthlete.stats) {
                  console.log(`        Stats: ${Object.keys(sampleAthlete.stats).join(', ')}`);
                }
              }
            });
          }
        });
      }
      
    } else {
      console.log(`❌ Failed to fetch data: ${result.status}`);
      if (result.data && result.data.error) {
        console.log(`   Error: ${result.data.error}`);
      }
    }
    
  } catch (error) {
    console.log(`💥 Exception: ${error.message}`);
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
    
    req.setTimeout(30000, () => {
      req.destroy();
      resolve({
        success: false,
        status: 0,
        error: 'Request timeout'
      });
    });
  });
}

// Run exploration
if (require.main === module) {
  exploreESPNStats().catch(console.error);
}

module.exports = { exploreESPNStats }; 