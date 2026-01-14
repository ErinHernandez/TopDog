/**
 * Verify Service Worker Integration
 * 
 * Checks that the service worker has been properly merged with custom handlers
 */

const fs = require('fs');
const path = require('path');

const SW_PATH = path.join(__dirname, '../public/sw.js');
const SW_CUSTOM_PATH = path.join(__dirname, '../public/sw-custom.js');

function verifyServiceWorker() {
  console.log('🔍 Verifying Service Worker Integration...\n');
  
  // Check if service worker exists
  if (!fs.existsSync(SW_PATH)) {
    console.log('❌ Service worker not found at:', SW_PATH);
    console.log('   Run "npm run build" first to generate the service worker\n');
    return false;
  }
  
  // Check if custom handler file exists
  if (!fs.existsSync(SW_CUSTOM_PATH)) {
    console.log('⚠️  Custom handler file not found at:', SW_CUSTOM_PATH);
    return false;
  }
  
  // Read service worker
  const swContent = fs.readFileSync(SW_PATH, 'utf8');
  const customContent = fs.readFileSync(SW_CUSTOM_PATH, 'utf8');
  
  // Check for notification click handler
  const hasNotificationHandler = swContent.includes('notificationclick');
  const hasCustomCode = swContent.includes('clients.matchAll');
  
  console.log('📋 Service Worker Status:');
  console.log('   File exists: ✅');
  console.log('   Size: ' + (swContent.length / 1024).toFixed(2) + ' KB');
  console.log('   Contains notificationclick: ' + (hasNotificationHandler ? '✅' : '❌'));
  console.log('   Contains custom handler code: ' + (hasCustomCode ? '✅' : '❌'));
  
  if (hasNotificationHandler && hasCustomCode) {
    console.log('\n✅ Service worker is properly integrated!');
    return true;
  } else {
    console.log('\n⚠️  Service worker may need merging.');
    console.log('   Run: node scripts/merge-service-worker.js');
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  const success = verifyServiceWorker();
  process.exit(success ? 0 : 1);
}

module.exports = { verifyServiceWorker };
