#!/usr/bin/env node

/**
 * Fix Clay projections and ensure proper PPR to Half-PPR conversion
 */

const fs = require('fs');

async function fixClayPprConversion() {
  console.log('🔧 Fixing Clay PPR to Half-PPR Conversion...\n');
  
  try {
    // Load current database
    const databasePath = 'data/playerDatabase.json';
    if (!fs.existsSync(databasePath)) {
      throw new Error('Player database not found.');
    }
    
    const database = JSON.parse(fs.readFileSync(databasePath, 'utf8'));
    
    console.log('📊 Current Database Status:');
    console.log(`   Total Players: ${database.meta.totalPlayers}`);
    
    // Fix Clay projections and PPR conversion
    let fixedCount = 0;
    Object.values(database.players).forEach(positionPlayers => {
      positionPlayers.forEach(player => {
        if (player.projections?.clay) {
          const clay = player.projections.clay;
          
          // Ensure we have valid PPR data
          if (clay.ppr && clay.ppr > 0) {
            // Calculate proper Half-PPR based on position
            if (player.position === 'QB') {
              // QBs don't get PPR bonuses, so PPR = Half-PPR
              clay.halfPpr = clay.ppr;
            } else {
              // For RBs, WRs, TEs: Half-PPR = PPR - (receptions × 0.5)
              const receptions = clay.receiving?.receptions || 0;
              clay.halfPpr = Math.max(0, clay.ppr - (receptions * 0.5));
            }
            
            // Add conversion note
            clay.conversionNote = `PPR: ${clay.ppr}, Half-PPR: ${clay.halfPpr.toFixed(1)}`;
            
            fixedCount++;
          }
        }
      });
    });
    
    console.log(`✅ Fixed PPR conversion for ${fixedCount} players`);
    
    // Update database metadata
    database.meta.version = "2.2.0";
    database.meta.lastUpdated = new Date().toISOString();
    database.meta.pprConversion = {
      qb: "PPR = Half-PPR (no reception bonuses)",
      rb: "Half-PPR = PPR - (receptions × 0.5)",
      wr: "Half-PPR = PPR - (receptions × 0.5)", 
      te: "Half-PPR = PPR - (receptions × 0.5)"
    };
    
    // Save updated database
    fs.writeFileSync(databasePath, JSON.stringify(database, null, 2));
    
    console.log(`\n✅ Updated database saved to: ${databasePath}`);
    
    // Show sample conversions
    console.log('\n📋 Sample PPR to Half-PPR Conversions:');
    let sampleCount = 0;
    Object.values(database.players).forEach(positionPlayers => {
      positionPlayers.forEach(player => {
        if (sampleCount < 5 && player.projections?.clay?.ppr) {
          const clay = player.projections.clay;
          console.log(`${sampleCount + 1}. ${player.name} (${player.position}, ${player.team})`);
          console.log(`   PPR: ${clay.ppr}, Half-PPR: ${clay.halfPpr.toFixed(1)}`);
          if (player.position !== 'QB' && clay.receiving?.receptions) {
            console.log(`   Receptions: ${clay.receiving.receptions}, Reduction: ${(clay.receiving.receptions * 0.5).toFixed(1)}`);
          }
          console.log('');
          sampleCount++;
        }
      });
    });
    
    // Show conversion summary by position
    console.log('📊 PPR Conversion Summary by Position:');
    const positionStats = {};
    Object.values(database.players).forEach(positionPlayers => {
      positionPlayers.forEach(player => {
        if (player.projections?.clay?.ppr) {
          const pos = player.position;
          if (!positionStats[pos]) {
            positionStats[pos] = { count: 0, totalPpr: 0, totalHalfPpr: 0 };
          }
          positionStats[pos].count++;
          positionStats[pos].totalPpr += player.projections.clay.ppr;
          positionStats[pos].totalHalfPpr += player.projections.clay.halfPpr;
        }
      });
    });
    
    Object.keys(positionStats).forEach(pos => {
      const stats = positionStats[pos];
      const avgPpr = (stats.totalPpr / stats.count).toFixed(1);
      const avgHalfPpr = (stats.totalHalfPpr / stats.count).toFixed(1);
      const difference = (stats.totalPpr - stats.totalHalfPpr).toFixed(1);
      console.log(`   ${pos}: ${stats.count} players, Avg PPR: ${avgPpr}, Avg Half-PPR: ${avgHalfPpr}, Total Difference: ${difference}`);
    });
    
    console.log('\n🎯 PPR to Half-PPR Conversion Rules:');
    console.log('   QB: PPR = Half-PPR (no reception bonuses)');
    console.log('   RB: Half-PPR = PPR - (receptions × 0.5)');
    console.log('   WR: Half-PPR = PPR - (receptions × 0.5)');
    console.log('   TE: Half-PPR = PPR - (receptions × 0.5)');
    
    console.log('\n💡 Usage Notes:');
    console.log('   ✅ Clay projections now have proper PPR/Half-PPR conversion');
    console.log('   ✅ QBs maintain same value (no reception bonuses)');
    console.log('   ✅ RBs/WRs/TEs properly reduced by reception bonuses');
    console.log('   ✅ All conversions documented in player data');
    
    console.log('\n🎉 PPR conversion fixed successfully!');
    
  } catch (error) {
    console.log(`💥 Error fixing PPR conversion: ${error.message}`);
  }
}

// Run fix
if (require.main === module) {
  fixClayPprConversion().catch(console.error);
}

module.exports = { fixClayPprConversion }; 