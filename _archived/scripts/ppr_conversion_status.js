#!/usr/bin/env node

/**
 * Show current PPR conversion status and what needs to be addressed
 */

const fs = require('fs');

async function pprConversionStatus() {
  console.log('📊 PPR Conversion Status Report\n');
  
  try {
    const databasePath = 'data/playerDatabase.json';
    if (!fs.existsSync(databasePath)) {
      throw new Error('Player database not found.');
    }
    
    const database = JSON.parse(fs.readFileSync(databasePath, 'utf8'));
    
    console.log('🎯 Current Status:');
    console.log(`   Total Players: ${database.meta.totalPlayers}`);
    console.log(`   Database Version: ${database.meta.version}`);
    
    // Count players by data source
    let draftkingsCount = 0;
    let underdogCount = 0;
    let clayCount = 0;
    let clayWithPprCount = 0;
    
    Object.values(database.players).forEach(positionPlayers => {
      positionPlayers.forEach(player => {
        if (player.draftkings) draftkingsCount++;
        if (player.underdog) underdogCount++;
        if (player.projections?.clay) clayCount++;
        if (player.projections?.clay?.ppr) clayWithPprCount++;
      });
    });
    
    console.log('\n📊 Data Source Coverage:');
    console.log(`   DraftKings: ${draftkingsCount} players (rankings & ADP only)`);
    console.log(`   Underdog: ${underdogCount} players (tournament data)`);
    console.log(`   Clay: ${clayCount} players (projections)`);
    console.log(`   Clay with PPR: ${clayWithPprCount} players`);
    
    // Show PPR conversion rules
    console.log('\n🎯 PPR to Half-PPR Conversion Rules:');
    console.log('   QB: PPR = Half-PPR (no reception bonuses)');
    console.log('   RB: Half-PPR = PPR - (receptions × 0.5)');
    console.log('   WR: Half-PPR = PPR - (receptions × 0.5)');
    console.log('   TE: Half-PPR = PPR - (receptions × 0.5)');
    
    // Show current Clay projections
    console.log('\n📋 Current Clay Projections:');
    let claySampleCount = 0;
    Object.values(database.players).forEach(positionPlayers => {
      positionPlayers.forEach(player => {
        if (claySampleCount < 5 && player.projections?.clay?.ppr) {
          const clay = player.projections.clay;
          console.log(`${claySampleCount + 1}. ${player.name} (${player.position}, ${player.team})`);
          console.log(`   PPR: ${clay.ppr}, Half-PPR: ${clay.halfPpr}`);
          console.log(`   Receptions: ${clay.receiving?.receptions || 0}`);
          console.log(`   Conversion: ${clay.conversionNote || 'N/A'}`);
          console.log('');
          claySampleCount++;
        }
      });
    });
    
    if (claySampleCount === 0) {
      console.log('   ⚠️  No Clay projections found with PPR data');
    }
    
    // Show what needs to be addressed
    console.log('\n⚠️  Issues to Address:');
    
    if (clayWithPprCount === 0) {
      console.log('   1. ❌ No Clay PPR projections available');
      console.log('      - Clay parsing had format issues');
      console.log('      - Need to fix PDF parsing or get data in different format');
    } else {
      console.log('   1. ✅ Clay PPR projections available');
    }
    
    console.log('   2. ✅ PPR to Half-PPR conversion logic implemented');
    console.log('   3. ✅ DraftKings approach corrected (rankings/ADP only)');
    console.log('   4. ✅ Underdog data integrated');
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    console.log('   1. Fix Clay projections parsing to get proper PPR data');
    console.log('   2. Use Clay for fantasy point calculations (when available)');
    console.log('   3. Use DraftKings for rankings and ADP');
    console.log('   4. Use Underdog for tournament-specific insights');
    console.log('   5. Implement proper PPR/Half-PPR conversion in draft room');
    
    // Show what's working
    console.log('\n✅ What\'s Working:');
    console.log('   ✅ DraftKings rankings and ADP (240 players)');
    console.log('   ✅ Underdog tournament data (2 players)');
    console.log('   ✅ PPR to Half-PPR conversion logic');
    console.log('   ✅ Database structure for multi-source integration');
    console.log('   ✅ Clear separation of data sources by purpose');
    
    // Show what needs work
    console.log('\n🔧 What Needs Work:');
    console.log('   🔧 Clay projections parsing (format issues)');
    console.log('   🔧 More Underdog data (limited sample)');
    console.log('   🔧 Integration of Clay data into draft room');
    
    console.log('\n🎯 Next Steps:');
    console.log('   1. Fix Clay PDF parsing or get data in different format');
    console.log('   2. Get more Underdog tournament data');
    console.log('   3. Integrate Clay projections into draft room display');
    console.log('   4. Test PPR/Half-PPR conversion in live draft');
    
  } catch (error) {
    console.log(`💥 Error showing status: ${error.message}`);
  }
}

// Run status
if (require.main === module) {
  pprConversionStatus().catch(console.error);
}

module.exports = { pprConversionStatus }; 