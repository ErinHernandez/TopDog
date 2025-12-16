#!/usr/bin/env node

/**
 * Player Image Optimization Script
 * 
 * Processes downloaded player images:
 * - Converts to WebP format
 * - Generates multiple sizes (100x100, 200x200, 400x400)
 * - Optimizes PNG fallbacks
 * - Generates image manifest with checksums
 * 
 * Usage:
 *   node scripts/optimize-player-images.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const crypto = require('crypto');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  playersDir: path.join(__dirname, '..', 'public', 'players'),
  manifestPath: path.join(__dirname, '..', 'public', 'players', 'manifest.json'),
  
  // Image sizes to generate
  sizes: {
    thumbnail: 100,
    standard: 200,
    highRes: 400,
  },
  
  // Quality settings
  webpQuality: 85,
  pngQuality: 90,
};

// ============================================================================
// UTILITIES
// ============================================================================

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function calculateChecksum(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch (e) {
    return 0;
  }
}

// ============================================================================
// IMAGE PROCESSING
// ============================================================================

async function processImage(playerId, inputPath) {
  const results = {
    playerId,
    sizes: {},
    checksums: {},
    fileSizes: {},
    errors: [],
  };
  
  try {
    // Read original image
    const inputBuffer = fs.readFileSync(inputPath);
    const originalFormat = path.extname(inputPath).slice(1).toLowerCase();
    
    // Process each size
    for (const [sizeName, size] of Object.entries(CONFIG.sizes)) {
      try {
        // Generate WebP
        const webpPath = sizeName === 'standard' 
          ? path.join(CONFIG.playersDir, `${playerId}.webp`)
          : path.join(CONFIG.playersDir, `${playerId}-${sizeName}.webp`);
        
        const webpBuffer = await sharp(inputBuffer)
          .resize(size, size, {
            fit: 'cover',
            position: 'center',
          })
          .webp({ quality: CONFIG.webpQuality })
          .toBuffer();
        
        fs.writeFileSync(webpPath, webpBuffer);
        results.sizes[`${sizeName}_webp`] = webpPath;
        results.checksums[`${sizeName}_webp`] = calculateChecksum(webpBuffer);
        results.fileSizes[`${sizeName}_webp`] = webpBuffer.length;
        
        // Generate PNG fallback (only for standard size)
        if (sizeName === 'standard') {
          const pngPath = path.join(CONFIG.playersDir, `${playerId}.png`);
          const pngBuffer = await sharp(inputBuffer)
            .resize(size, size, {
              fit: 'cover',
              position: 'center',
            })
            .png({ quality: CONFIG.pngQuality, compressionLevel: 9 })
            .toBuffer();
          
          fs.writeFileSync(pngPath, pngBuffer);
          results.sizes[`${sizeName}_png`] = pngPath;
          results.checksums[`${sizeName}_png`] = calculateChecksum(pngBuffer);
          results.fileSizes[`${sizeName}_png`] = pngBuffer.length;
        } else {
          // For other sizes, also generate PNG
          const pngPath = path.join(CONFIG.playersDir, `${playerId}-${sizeName}.png`);
          const pngBuffer = await sharp(inputBuffer)
            .resize(size, size, {
              fit: 'cover',
              position: 'center',
            })
            .png({ quality: CONFIG.pngQuality, compressionLevel: 9 })
            .toBuffer();
          
          fs.writeFileSync(pngPath, pngBuffer);
          results.sizes[`${sizeName}_png`] = pngPath;
          results.checksums[`${sizeName}_png`] = calculateChecksum(pngBuffer);
          results.fileSizes[`${sizeName}_png`] = pngBuffer.length;
        }
        
      } catch (error) {
        results.errors.push(`Error processing ${sizeName}: ${error.message}`);
      }
    }
    
    // Calculate total size savings
    const originalSize = inputBuffer.length;
    const optimizedSize = results.fileSizes.standard_webp || results.fileSizes.standard_png || originalSize;
    results.compressionRatio = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
    
  } catch (error) {
    results.errors.push(`Fatal error: ${error.message}`);
  }
  
  return results;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('🖼️  Player Image Optimization Script');
  console.log('='.repeat(50));
  
  ensureDir(CONFIG.playersDir);
  
  // Find all image files
  const files = fs.readdirSync(CONFIG.playersDir);
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
  }).filter(file => {
    // Skip already processed files (those with size suffixes)
    return !file.includes('-thumbnail') && 
           !file.includes('-standard') && 
           !file.includes('-highRes') &&
           !file.includes('manifest.json');
  });
  
  console.log(`\n📁 Found ${imageFiles.length} images to process\n`);
  
  const manifest = {
    generatedAt: new Date().toISOString(),
    totalImages: 0,
    processedImages: 0,
    failedImages: 0,
    totalSize: 0,
    optimizedSize: 0,
    images: {},
  };
  
  let processed = 0;
  let failed = 0;
  
  for (const file of imageFiles) {
    const playerId = path.basename(file, path.extname(file));
    const inputPath = path.join(CONFIG.playersDir, file);
    
    try {
      console.log(`Processing ${playerId}...`);
      const result = await processImage(playerId, inputPath);
      
      if (result.errors.length === 0) {
        manifest.images[playerId] = {
          sizes: result.sizes,
          checksums: result.checksums,
          fileSizes: result.fileSizes,
          compressionRatio: result.compressionRatio,
        };
        manifest.processedImages++;
        manifest.totalSize += result.fileSizes.standard_webp || result.fileSizes.standard_png || 0;
        manifest.optimizedSize += result.fileSizes.standard_webp || 0;
        processed++;
        console.log(`  ✅ Processed (${result.compressionRatio}% compression)`);
      } else {
        console.log(`  ⚠️  Processed with errors: ${result.errors.join(', ')}`);
        manifest.images[playerId] = {
          errors: result.errors,
        };
        manifest.failedImages++;
        failed++;
      }
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
      manifest.images[playerId] = {
        error: error.message,
      };
      manifest.failedImages++;
      failed++;
    }
  }
  
  manifest.totalImages = imageFiles.length;
  
  // Save manifest
  fs.writeFileSync(CONFIG.manifestPath, JSON.stringify(manifest, null, 2));
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 OPTIMIZATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Images: ${manifest.totalImages}`);
  console.log(`✅ Processed: ${processed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📦 Total Size: ${(manifest.totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`🎯 Optimized (WebP): ${(manifest.optimizedSize / 1024 / 1024).toFixed(2)} MB`);
  if (manifest.totalSize > 0) {
    const savings = ((1 - manifest.optimizedSize / manifest.totalSize) * 100).toFixed(1);
    console.log(`💰 Size Savings: ${savings}%`);
  }
  console.log(`\n📁 Manifest saved to: ${CONFIG.manifestPath}`);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { processImage, main };

