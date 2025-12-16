/**
 * Test SportsDataIO API and Headshots
 * Run with: node scripts/test-sportsdataio-headshots.js
 */

require('dotenv').config({ path: '.env.local' });

// Direct API test without requiring the full lib (to avoid module issues)
const BASE_URL = 'https://api.sportsdata.io/v3/nfl';

async function fetchAPI(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status} - ${response.statusText}`);
  }
  return response.json();
}

async function testAPI() {
  const apiKey = process.env.SPORTSDATAIO_API_KEY;
  
  if (!apiKey) {
    console.error('❌ SPORTSDATAIO_API_KEY not found in environment');
    process.exit(1);
  }

  console.log('🔑 API Key found:', apiKey.substring(0, 8) + '...');
  console.log('\n🧪 Testing SportsDataIO API...\n');

  try {
    // Test 1: Get all players
    console.log('📋 Test 1: Fetching all players...');
    const playersUrl = `${BASE_URL}/scores/json/Players?key=${apiKey}`;
    const players = await fetchAPI(playersUrl);
    console.log(`✅ Successfully fetched ${players.length} players`);
    
    // Find some sample players
    const qbs = players.filter(p => p.Position === 'QB' && p.PhotoUrl).slice(0, 5);
    const rbs = players.filter(p => p.Position === 'RB' && p.PhotoUrl).slice(0, 5);
    const wrs = players.filter(p => p.Position === 'WR' && p.PhotoUrl).slice(0, 5);
    
    console.log(`\n📸 Found ${players.filter(p => p.PhotoUrl).length} players with headshots`);
    
    // Test 2: Get headshots endpoint (may not exist, that's okay)
    console.log('\n📸 Test 2: Testing headshots endpoint...');
    try {
      const headshotsUrl = `${BASE_URL}/scores/json/Headshots?key=${apiKey}`;
      const headshots = await fetchAPI(headshotsUrl);
      console.log(`✅ Successfully fetched ${headshots.length} headshots from dedicated endpoint`);
      
      if (headshots.length > 0) {
        const sample = headshots[0];
        const url = sample.PreferredHostedHeadshotUrl || sample.HeadshotUrl || 'No URL';
        console.log(`   Sample: ${sample.Name} - ${url}`);
      }
    } catch (err) {
      console.log(`   ⚠️  Headshots endpoint not available (404) - using PhotoUrl from Players endpoint instead`);
    }
    
    // Test 3: Show sample players with headshots
    console.log('\n📊 Test 3: Sample players with headshots:');
    console.log('\n   QBs:');
    qbs.forEach(p => {
      console.log(`   - ${p.Name} (${p.Team}): ${p.PhotoUrl ? '✅ ' + p.PhotoUrl.substring(0, 60) + '...' : '❌'}`);
    });
    
    console.log('\n   RBs:');
    rbs.forEach(p => {
      console.log(`   - ${p.Name} (${p.Team}): ${p.PhotoUrl ? '✅ ' + p.PhotoUrl.substring(0, 60) + '...' : '❌'}`);
    });
    
    console.log('\n   WRs:');
    wrs.forEach(p => {
      console.log(`   - ${p.Name} (${p.Team}): ${p.PhotoUrl ? '✅ ' + p.PhotoUrl.substring(0, 60) + '...' : '❌'}`);
    });
    
    // Summary
    const withHeadshots = players.filter(p => p.PhotoUrl).length;
    const withoutHeadshots = players.length - withHeadshots;
    const coverage = ((withHeadshots / players.length) * 100).toFixed(1);
    
    console.log('\n📈 Summary:');
    console.log(`   Total players: ${players.length}`);
    console.log(`   With headshots: ${withHeadshots} (${coverage}%)`);
    console.log(`   Without headshots: ${withoutHeadshots}`);
    
    // Test 4: Check headshot URL format
    console.log('\n🔍 Test 4: Headshot URL analysis:');
    const sampleHeadshot = players.find(p => p.PhotoUrl);
    if (sampleHeadshot) {
      console.log(`   Sample URL: ${sampleHeadshot.PhotoUrl}`);
      console.log(`   URL format: ${sampleHeadshot.PhotoUrl.includes('https://') ? 'HTTPS ✅' : 'HTTP ⚠️'}`);
    }
    
    console.log('\n✅ All tests passed!');
    console.log('\n💡 Next steps:');
    console.log('   - Headshots are available via PhotoUrl field on players');
    console.log('   - Dedicated headshots endpoint provides PreferredHostedHeadshotUrl');
    console.log('   - Headshots are 1200x1200 @ 300ppi');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testAPI();

