// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { integrateClayProjections, exportPlayersToJson } = require('../lib/clayDataIntegrator');

async function testRealClayPdfProcessing() {
  console.log('🚀 Starting Real ESPN Clay PDF Processing Test...');
  
  // Check if Azure credentials are loaded
  console.log('🔑 Checking Azure credentials...');
  if (!process.env.AZURE_COMPUTER_VISION_KEY || !process.env.AZURE_COMPUTER_VISION_ENDPOINT) {
    console.error('❌ Azure credentials not found in environment variables');
    console.error('Please make sure your .env.local file contains:');
    console.error('AZURE_COMPUTER_VISION_KEY=your_api_key_here');
    console.error('AZURE_COMPUTER_VISION_ENDPOINT=https://your-resource-name.cognitiveservices.azure.com/');
    return;
  }
  
  console.log('✅ Azure credentials found!');
  console.log(`Endpoint: ${process.env.AZURE_COMPUTER_VISION_ENDPOINT.substring(0, 30)}...`);
  console.log(`Key: ${process.env.AZURE_COMPUTER_VISION_KEY.substring(0, 10)}...`);
  
  const clayPdfUrl = 'https://g.espncdn.com/s/ffldraftkit/25/NFLDK2025_CS_ClayProjections2025.pdf';
  console.log(`📄 Processing Real ESPN Clay PDF: ${clayPdfUrl}`);
  
  try {
    // Process pages 1-3 of the real Clay PDF
    console.log('\n📚 Processing pages 1-3 of the real Clay PDF...');
    const integrationResult = await integrateClayProjections(clayPdfUrl, 1, 3);
    
    console.log('\n🎉 Real Clay PDF processing completed successfully!');
    console.log('📊 Integration Results:');
    console.log(`- Total Players Found: ${integrationResult.totalPlayers}`);
    console.log(`- Pages Processed: ${integrationResult.processedPages.length}`);
    
    // Display summary
    console.log('\n📈 Player Summary:');
    console.log(`- QB: ${integrationResult.summary.byPosition.QB} players`);
    console.log(`- RB: ${integrationResult.summary.byPosition.RB} players`);
    console.log(`- WR: ${integrationResult.summary.byPosition.WR} players`);
    console.log(`- TE: ${integrationResult.summary.byPosition.TE} players`);
    
    // Display top 10 players
    console.log('\n🏆 Top 10 Players:');
    console.log('-'.repeat(80));
    integrationResult.summary.topPlayers.forEach((player, index) => {
      console.log(`${index + 1}. ${player.name} (${player.position}, ${player.team}) - ${player.fantasyPoints} pts`);
    });
    
    // Display average fantasy points by position
    console.log('\n📊 Average Fantasy Points by Position:');
    console.log(`- QB: ${integrationResult.summary.averageFantasyPoints.QB}`);
    console.log(`- RB: ${integrationResult.summary.averageFantasyPoints.RB}`);
    console.log(`- WR: ${integrationResult.summary.averageFantasyPoints.WR}`);
    console.log(`- TE: ${integrationResult.summary.averageFantasyPoints.TE}`);
    
    // Export to JSON
    console.log('\n💾 Exporting player data to JSON...');
    const exportFilename = await exportPlayersToJson(integrationResult.players, 'clay_projections_real_export.json');
    console.log(`✅ Exported to: ${exportFilename}`);
    
    // Display sample player data
    console.log('\n👤 Sample Player Data:');
    console.log('-'.repeat(80));
    integrationResult.players.slice(0, 5).forEach((player, index) => {
      console.log(`${index + 1}. ${player.name} (${player.position}, ${player.team})`);
      console.log(`   Rank: ${player.rank} | Fantasy Points: ${player.fantasyPoints}`);
      console.log(`   Pass: ${player.passYards} yds, ${player.passTDs} TD`);
      console.log(`   Rush: ${player.rushYards} yds, ${player.rushTDs} TD`);
      console.log(`   Rec: ${player.recYards} yds, ${player.recTDs} TD`);
      console.log('');
    });
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Review the exported JSON file for data quality');
    console.log('2. Integrate the data into your player database');
    console.log('3. Use the data in your draft room for rankings');
    console.log('4. Set up automated processing for updated projections');
    
  } catch (error) {
    console.error('❌ Error during real Clay PDF processing:', error);
    console.error('Make sure you have:');
    console.error('1. Azure Computer Vision credentials configured in .env.local');
    console.error('2. Internet connection to access the ESPN PDF');
    console.error('3. Required dependencies installed (pdf2pic, sharp, canvas)');
  }
}

// Run the test
testRealClayPdfProcessing(); 