/**
 * Generate a tiny blurred placeholder for tournament card background
 * This will be base64 encoded and inlined for instant loading
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const INPUT = path.join(__dirname, '../public/tournament_card_bg.webp');

async function generatePlaceholder() {
  // Create a tiny version (20px wide, maintains aspect ratio)
  // Then blur it slightly
  const buffer = await sharp(INPUT)
    .resize(20, null, { fit: 'inside' })
    .blur(2)
    .webp({ quality: 20 })
    .toBuffer();
  
  const base64 = buffer.toString('base64');
  const dataUri = `data:image/webp;base64,${base64}`;
  
  console.log('\n=== BLUR PLACEHOLDER GENERATED ===\n');
  console.log(`Size: ${buffer.length} bytes (${(buffer.length / 1024).toFixed(2)} KB)`);
  console.log('\nBase64 Data URI (copy this):\n');
  console.log(dataUri);
  console.log('\n');
  
  // Also save to a file for reference
  const outputPath = path.join(__dirname, '../public/tournament_card_blur.txt');
  fs.writeFileSync(outputPath, dataUri);
  console.log(`Saved to: ${outputPath}`);
  
  return dataUri;
}

generatePlaceholder().catch(console.error);

