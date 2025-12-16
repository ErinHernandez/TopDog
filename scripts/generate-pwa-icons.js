/**
 * PWA Icon Generator
 * 
 * Generates app icons using wr_blue.png as background and logo.png overlaid.
 * Run: node scripts/generate-pwa-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '../public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');
const BACKGROUND = path.join(PUBLIC_DIR, 'wr_blue.png');
const LOGO = path.join(PUBLIC_DIR, 'logo.png');

// Icon sizes needed for PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512];

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

async function generateIcons() {
  await ensureDir(ICONS_DIR);
  
  // Get background image info
  const bgInfo = await sharp(BACKGROUND).metadata();
  console.log(`Background: ${bgInfo.width}x${bgInfo.height}`);
  
  // Get logo info
  const logoInfo = await sharp(LOGO).metadata();
  console.log(`Logo: ${logoInfo.width}x${logoInfo.height}`);
  
  for (const size of ICON_SIZES) {
    const outputPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
    
    // Resize background to target size
    const background = await sharp(BACKGROUND)
      .resize(size, size, { fit: 'cover' })
      .toBuffer();
    
    // Calculate logo size (85% of icon size to match original)
    const logoSize = Math.floor(size * 0.85);
    
    // Resize logo
    const logo = await sharp(LOGO)
      .resize(logoSize, logoSize, { fit: 'contain' })
      .toBuffer();
    
    // Composite logo on background (centered)
    await sharp(background)
      .composite([{
        input: logo,
        gravity: 'center',
      }])
      .png()
      .toFile(outputPath);
    
    console.log(`Generated: icon-${size}x${size}.png`);
  }
  
  // Also copy to root public for apple-touch-icon
  const appleIcon = path.join(PUBLIC_DIR, 'apple-touch-icon.png');
  fs.copyFileSync(path.join(ICONS_DIR, 'icon-180x180.png'), appleIcon);
  console.log('Generated: apple-touch-icon.png');
}

async function main() {
  console.log('Generating PWA icons with wr_blue background...\n');
  
  try {
    await generateIcons();
    console.log('\nDone! PWA icons generated successfully.');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

main();
