#!/usr/bin/env node

/**
 * Update approach to DraftKings data - focus on rankings and ADP, not fantasy points
 * Due to DraftKings' bonus system, their fantasy points cannot be accurately converted
 */

const fs = require('fs');

async function updateDraftKingsApproach() {
  console.log('🔄 Updating DraftKings Data Approach...\n');
  console.log('📊 Focus: Rankings & ADP (not fantasy points due to bonus system)\n');
  
  try {
    // Load current database
    const databasePath = 'data/playerDatabase.json';
    if (!fs.existsSync(databasePath)) {
      throw new Error('Player database not found. Run extract_underdog_draftkings_data.js first.');
    }
    
    const database = JSON.parse(fs.readFileSync(databasePath, 'utf8'));
    
    console.log('📈 Current Database Status:');
    console.log(`   Total Players: ${database.meta.totalPlayers}`);
    console.log(`   Sources: ${Object.keys(database.meta.dataSources).join(', ')}`);
    
    // Update database metadata to reflect new approach
    database.meta.source = "Multi-Source Integration (DraftKings Rankings/ADP + Underdog + Clay Projections)";
    database.meta.version = "2.1.0";
    database.meta.lastUpdated = new Date().toISOString();
    database.meta.notes = {
      draftkings: "Uses rankings and ADP only (fantasy points excluded due to bonus system)",
      underdog: "Tournament data and fantasy points (Half-PPR)",
      clay: "ESPN projections for fantasy point calculations (PPR/Half-PPR)"
    };
    
    // Update all players to remove DraftKings fantasy points and clarify approach
    let updatedCount = 0;
    Object.values(database.players).forEach(positionPlayers => {
      positionPlayers.forEach(player => {
        if (player.draftkings) {
          // Keep only rankings and ADP, remove any fantasy point references
          player.draftkings = {
            rank: player.draftkings.rank,
            positionRank: player.draftkings.positionRank,
            adp: player.draftkings.adp,
            rookie: player.draftkings.rookie,
            note: "Fantasy points excluded due to DraftKings bonus system"
          };
          
          // Update projections to clarify DraftKings approach
          if (player.projections?.draftkings) {
            player.projections.draftkings = {
              rank: player.projections.draftkings.rank,
              adp: player.projections.draftkings.adp,
              note: "Rankings and ADP only - use Clay projections for fantasy points"
            };
          }
          
          updatedCount++;
        }
      });
    });
    
    console.log(`✅ Updated ${updatedCount} players with new DraftKings approach`);
    
    // Create a summary of what each source provides
    const sourceSummary = {
      draftkings: {
        purpose: "Rankings and ADP for draft strategy",
        data: ["Overall rank", "Position rank", "Average Draft Position", "Rookie identification"],
        limitations: ["Fantasy points excluded due to bonus system", "Cannot convert to other scoring formats"],
        recommendation: "Use for draft order and ADP strategy"
      },
      underdog: {
        purpose: "Tournament data and fantasy performance",
        data: ["Tournament ADP", "Fantasy points (Half-PPR)", "Tournament results"],
        limitations: ["Limited sample size", "Tournament-specific scoring"],
        recommendation: "Use for tournament-specific insights"
      },
      clay: {
        purpose: "ESPN projections for fantasy calculations",
        data: ["PPR projections", "Half-PPR projections", "Detailed stat projections"],
        limitations: ["ESPN-specific projections", "May differ from other sources"],
        recommendation: "Use for fantasy point calculations and projections"
      }
    };
    
    database.meta.sourceSummary = sourceSummary;
    
    // Save updated database
    fs.writeFileSync(databasePath, JSON.stringify(database, null, 2));
    
    console.log(`\n✅ Updated database saved to: ${databasePath}`);
    
    // Show recommendations
    console.log('\n💡 Updated Approach Recommendations:');
    console.log('   1. 📊 Use DraftKings for rankings and ADP only');
    console.log('   2. 🎯 Use Clay projections for fantasy point calculations');
    console.log('   3. 🏆 Use Underdog data for tournament-specific insights');
    console.log('   4. ⚠️  Avoid DraftKings fantasy points due to bonus system');
    console.log('   5. 🔄 Combine sources for comprehensive player evaluation');
    
    console.log('\n📋 Data Source Usage Guide:');
    console.log('   DraftKings: Draft strategy, player rankings, ADP');
    console.log('   Clay ESPN: Fantasy projections, stat predictions');
    console.log('   Underdog: Tournament performance, Half-PPR data');
    
    console.log('\n🎯 Fantasy Point Calculation Strategy:');
    console.log('   ✅ Use Clay projections for PPR/Half-PPR calculations');
    console.log('   ✅ Use Underdog data for tournament-specific scoring');
    console.log('   ❌ Avoid DraftKings fantasy points (bonus system)');
    console.log('   ✅ Use DraftKings ADP for draft strategy');
    
    // Show sample player with updated approach
    console.log('\n📋 Sample Player (Updated Approach):');
    const samplePlayer = Object.values(database.players).find(pos => pos.length > 0)?.[0];
    if (samplePlayer) {
      console.log(`   Name: ${samplePlayer.name} (${samplePlayer.position}, ${samplePlayer.team})`);
      console.log(`   DraftKings: Rank ${samplePlayer.draftkings?.rank || 'N/A'}, ADP ${samplePlayer.draftkings?.adp || 'N/A'}`);
      console.log(`   Clay: ${samplePlayer.projections?.clay?.ppr || 'N/A'} PPR, ${samplePlayer.projections?.clay?.halfPpr || 'N/A'} Half-PPR`);
      console.log(`   Underdog: ADP ${samplePlayer.underdog?.adp || 'N/A'}, Points ${samplePlayer.underdog?.points || 'N/A'}`);
    }
    
    console.log('\n🎉 Database approach updated successfully!');
    console.log('   ✅ DraftKings: Rankings and ADP only');
    console.log('   ✅ Clay: Fantasy projections');
    console.log('   ✅ Underdog: Tournament data');
    console.log('   ✅ Clear separation of data sources');
    
  } catch (error) {
    console.log(`💥 Error updating approach: ${error.message}`);
  }
}

// Run update
if (require.main === module) {
  updateDraftKingsApproach().catch(console.error);
}

module.exports = { updateDraftKingsApproach }; 