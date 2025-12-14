/**
 * Test Verification Script for Draft Room Data
 * 
 * Run this in the browser console to verify the updated data is working.
 */

console.log('🧪 Testing Draft Room Data...');

// Test 1: Check if player pool is loaded
if (typeof PLAYER_POOL !== 'undefined') {
  console.log('✅ Player pool loaded successfully');
  console.log('📊 Total players:', PLAYER_POOL.length);
  
  // Check for Clay data
  const playersWithClay = PLAYER_POOL.filter(p => p.clayRank);
  console.log('📈 Players with Clay data:', playersWithClay.length);
  
  // Show sample players
  const samplePlayers = playersWithClay.slice(0, 3);
  samplePlayers.forEach(player => {
    console.log(`👤 ${player.name} (Clay Rank: ${player.clayRank})`);
  });
} else {
  console.log('❌ Player pool not loaded');
}

// Test 2: Check if static stats are loaded
if (typeof STATIC_PLAYER_STATS !== 'undefined') {
  console.log('✅ Static stats loaded successfully');
  console.log('📊 Total players in stats:', STATIC_PLAYER_STATS.metadata.totalPlayers);
  
  // Check for Clay data in stats
  const statsWithClay = Object.values(STATIC_PLAYER_STATS.players).filter(p => p.clayRank);
  console.log('📈 Stats with Clay data:', statsWithClay.length);
} else {
  console.log('❌ Static stats not loaded');
}

// Test 3: Test player lookup
if (typeof getPlayerByName !== 'undefined') {
  const testPlayer = getPlayerByName('Patrick Mahomes');
  if (testPlayer) {
    console.log('✅ Player lookup working');
    console.log('👤 Test player:', testPlayer.name, '(Clay Rank:', testPlayer.clayRank, ')');
  } else {
    console.log('❌ Player lookup failed');
  }
}

// Test 4: Test stats lookup
if (typeof getPlayerStats !== 'undefined') {
  const testStats = getPlayerStats('Patrick Mahomes');
  if (testStats) {
    console.log('✅ Stats lookup working');
    console.log('📊 Test stats:', testStats.name, '(Clay Rank:', testStats.clayRank, ')');
  } else {
    console.log('❌ Stats lookup failed');
  }
}

console.log('🎉 Test verification complete!');
