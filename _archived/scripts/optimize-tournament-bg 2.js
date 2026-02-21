#!/usr/bin/env node

/**
 * Optimize Tournament Card Background Image
 * 
 * Converts the tournament card background PNG to optimized WebP format
 * 
 * Usage:
 *   node scripts/optimize-tournament-bg.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const INPUT_IMAGE = path.join(__dirname, '..', 'public', 'do_riding_football_III.png');
const OUTPUT_WEBP = path.join(__dirname, '..', 'public', 'do_riding_football_III.webp');

async function optimizeImage() {
  try {
    // Check if input file exists
    if (!fs.existsSync(INPUT_IMAGE)) {
      console.error(`❌ Input image not found: ${INPUT_IMAGE}`);
      process.exit(1);
    }

    console.log('🖼️  Optimizing tournament card background image...');
    console.log(`   Input: ${path.basename(INPUT_IMAGE)}`);

    // Get original file size
    const originalStats = fs.statSync(INPUT_IMAGE);
    const originalSize = originalStats.size;

    // Convert to WebP with high quality (90% for background images)
    const webpBuffer = await sharp(INPUT_IMAGE)
      .webp({ 
        quality: 90,
        effort: 6, // Higher effort = better compression, slower
      })
      .toBuffer();

    // Write optimized WebP
    fs.writeFileSync(OUTPUT_WEBP, webpBuffer);
    const optimizedSize = webpBuffer.length;

    // Calculate savings
    const savings = originalSize - optimizedSize;
    const savingsPercent = ((savings / originalSize) * 100).toFixed(1);

    console.log(`   Output: ${path.basename(OUTPUT_WEBP)}`);
    console.log(`\n📊 Optimization Results:`);
    console.log(`   Original (PNG): ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`   Optimized (WebP): ${(optimizedSize / 1024).toFixed(2)} KB`);
    console.log(`   Savings: ${(savings / 1024).toFixed(2)} KB (${savingsPercent}%)`);
    console.log(`\n✅ Optimization complete!`);

  } catch (error) {
    console.error(`❌ Error optimizing image: ${error.message}`);
    process.exit(1);
  }
}

optimizeImage();

