/**
 * Post-build script to merge custom service worker handlers
 * 
 * This script appends custom event listeners to the auto-generated service worker
 * from next-pwa. Run this after `next build`.
 * 
 * Usage:
 *   node scripts/merge-service-worker.js
 */

const fs = require('fs');
const path = require('path');

const SW_PATH = path.join(__dirname, '../public/sw.js');
const SW_CUSTOM_PATH = path.join(__dirname, '../public/sw-custom.js');

function mergeServiceWorker() {
  try {
    // Check if generated service worker exists
    if (!fs.existsSync(SW_PATH)) {
      console.warn('[SW Merge] Generated sw.js not found. Skipping merge.');
      return;
    }

    // Read generated service worker
    const generatedSW = fs.readFileSync(SW_PATH, 'utf8');
    
    // Check if already merged (avoid duplicate merges)
    if (generatedSW.includes('notificationclick')) {
      console.log('[SW Merge] Service worker already contains notification handler. Skipping.');
      return;
    }

    // Read custom handlers
    if (!fs.existsSync(SW_CUSTOM_PATH)) {
      console.warn('[SW Merge] sw-custom.js not found. Skipping merge.');
      return;
    }

    const customHandlers = fs.readFileSync(SW_CUSTOM_PATH, 'utf8');
    
    // Use the custom handlers as-is (already cleaned)
    const handlerCode = customHandlers.trim();

    // Append custom handlers to generated service worker
    // Insert before the closing of the service worker
    const mergedSW = generatedSW + '\n\n' + handlerCode;

    // Write merged service worker
    fs.writeFileSync(SW_PATH, mergedSW, 'utf8');
    
    console.log('[SW Merge] ✅ Successfully merged custom service worker handlers');
  } catch (error) {
    console.error('[SW Merge] ❌ Error merging service worker:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  mergeServiceWorker();
}

module.exports = { mergeServiceWorker };
