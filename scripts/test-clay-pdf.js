// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { processClayPdfWithAzureVision, processMultipleClayPdfPages } = require('../lib/pdfProcessor');

async function testClayPdfProcessing() {
  console.log('🚀 Starting ESPN Clay PDF processing test...');
  
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
  console.log(`📄 Processing ESPN Clay PDF: ${clayPdfUrl}`);
  
  try {
    // Test single page processing
    console.log('\n📄 Testing single page processing (page 1)...');
    const singlePageResult = await processClayPdfWithAzureVision(clayPdfUrl, 1, 'read');
    
    console.log('✅ Single page processing completed!');
    console.log('📊 Results:');
    console.log(`- Text length: ${singlePageResult.text ? singlePageResult.text.length : 0} characters`);
    console.log(`- Lines extracted: ${singlePageResult.lines ? singlePageResult.lines.length : 0}`);
    
    if (singlePageResult.text) {
      console.log('\n📝 Extracted Text:');
      console.log('='.repeat(80));
      console.log(singlePageResult.text);
      console.log('='.repeat(80));
      
      // Parse and display player data in a nice format
      console.log('\n🏈 Parsed Player Data:');
      console.log('-'.repeat(80));
      if (singlePageResult.lines) {
        singlePageResult.lines.forEach((line, index) => {
          if (line.includes('Patrick Mahomes') || line.includes('Josh Allen') || 
              line.includes('Christian McCaffrey') || line.includes('Tyreek Hill') ||
              line.includes('Travis Kelce') || line.includes('Breece Hall')) {
            console.log(`${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
    
    // Test multiple pages processing
    console.log('\n📚 Testing multiple pages processing (pages 1-2)...');
    const multiPageResult = await processMultipleClayPdfPages(clayPdfUrl, 1, 2, 'read');
    
    console.log('✅ Multiple pages processing completed!');
    console.log('📊 Results Summary:');
    multiPageResult.forEach((pageResult, index) => {
      if (pageResult.success) {
        console.log(`- Page ${pageResult.page}: ${pageResult.result.text ? pageResult.result.text.length : 0} characters, ${pageResult.result.lines ? pageResult.result.lines.length : 0} lines`);
      } else {
        console.log(`- Page ${pageResult.page}: ERROR - ${pageResult.error}`);
      }
    });
    
    console.log('\n🎉 ESPN Clay PDF processing test completed successfully!');
    console.log('\n💡 Next Steps:');
    console.log('1. The system is now ready to process the actual Clay projections');
    console.log('2. You can use the web interface at: http://localhost:3000/clay-pdf-demo');
    console.log('3. The extracted data can be integrated into your player database');
    
  } catch (error) {
    console.error('❌ Error during Clay PDF processing test:', error);
    console.error('Make sure you have:');
    console.error('1. Azure Computer Vision credentials configured in .env.local');
    console.error('2. Internet connection to access the ESPN PDF');
    console.error('3. Required dependencies installed');
  }
}

// Run the test
testClayPdfProcessing(); 