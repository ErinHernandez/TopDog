#!/usr/bin/env node

/**
 * Update Player Pool with Image URLs
 * 
 * Updates player-pool-2025.json with photoUrl fields for each player
 * based on successfully downloaded and optimized images.
 * 
 * Usage:
 *   node scripts/update-player-pool-with-images.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  playerPoolPath: path.join(__dirname, '..', 'public', 'data', 'player-pool-2025.json'),
  backupPath: path.join(__dirname, '..', 'public', 'data', 'player-pool-2025.backup.json'),
  manifestPath: path.join(__dirname, '..', 'public', 'players', 'manifest.json'),
  playersDir: path.join(__dirname, '..', 'public', 'players'),
};

// ============================================================================
// UTILITIES
// ============================================================================

function calculateChecksum(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

function backupFile(filePath, backupPath) {
  if (fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, backupPath);
    console.log(`📦 Backup created: ${backupPath}`);
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  console.log('🔄 Update Player Pool with Image URLs');
  console.log('='.repeat(50));
  
  // Load player pool
  if (!fs.existsSync(CONFIG.playerPoolPath)) {
    console.error(`❌ Player pool not found: ${CONFIG.playerPoolPath}`);
    process.exit(1);
  }
  
  console.log('\n📋 Loading player pool...');
  const poolData = JSON.parse(fs.readFileSync(CONFIG.playerPoolPath, 'utf8'));
  const players = poolData.players || [];
  console.log(`   Found ${players.length} players`);
  
  // Create backup
  backupFile(CONFIG.playerPoolPath, CONFIG.backupPath);
  
  // Load manifest if available
  let manifest = null;
  if (fs.existsSync(CONFIG.manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(CONFIG.manifestPath, 'utf8'));
    console.log(`   Loaded manifest with ${Object.keys(manifest.images || {}).length} processed images`);
  }
  
  // Check for image files
  const imageFiles = new Set();
  if (fs.existsSync(CONFIG.playersDir)) {
    const files = fs.readdirSync(CONFIG.playersDir);
    files.forEach(file => {
      if (file.endsWith('.webp') || file.endsWith('.png')) {
        const playerId = file.replace(/\.(webp|png)$/, '').replace(/-thumbnail$/, '').replace(/-standard$/, '').replace(/-highRes$/, '');
        imageFiles.add(playerId);
      }
    });
    console.log(`   Found ${imageFiles.size} image files`);
  }
  
  // Update players with photoUrl
  let updated = 0;
  let skipped = 0;
  
  players.forEach(player => {
    const hasImage = imageFiles.has(player.id);
    
    if (hasImage) {
      // Use WebP as primary, PNG as fallback
      const photoUrl = `/players/${player.id}.webp`;
      player.photoUrl = photoUrl;
      updated++;
    } else {
      // Remove photoUrl if it exists but image is missing
      if (player.photoUrl) {
        delete player.photoUrl;
        skipped++;
      }
    }
  });
  
  // Update metadata
  const originalChecksum = poolData.metadata.checksum;
  poolData.metadata.version = poolData.metadata.version || '2025-topdog-full-v1';
  poolData.metadata.generatedAt = new Date().toISOString();
  poolData.metadata.checksum = calculateChecksum(players);
  poolData.metadata.imagesUpdatedAt = new Date().toISOString();
  poolData.metadata.imagesCount = updated;
  
  // Save updated pool
  fs.writeFileSync(CONFIG.playerPoolPath, JSON.stringify(poolData, null, 2));
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 UPDATE SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Players: ${players.length}`);
  console.log(`✅ Updated with images: ${updated}`);
  console.log(`⏭️  Skipped (no image): ${skipped}`);
  console.log(`📈 Coverage: ${((updated / players.length) * 100).toFixed(1)}%`);
  console.log(`\n📁 Updated pool saved to: ${CONFIG.playerPoolPath}`);
  console.log(`📦 Backup saved to: ${CONFIG.backupPath}`);
  console.log(`\n🔐 Checksum: ${poolData.metadata.checksum}`);
  if (originalChecksum && originalChecksum !== poolData.metadata.checksum) {
    console.log(`⚠️  Checksum changed (expected - images added)`);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };


