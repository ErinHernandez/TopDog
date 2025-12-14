const sharp = require('sharp');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const backgroundImage = path.join(publicDir, 'wr_blue.png');
const logoImage = path.join(publicDir, 'logo.png');

const iconSizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];

async function generateIcons() {
  console.log('Generating PWA icons...\n');
  console.log('Background: wr_blue.png');
  console.log('Overlay: logo.png (bigger, rounded corners)\n');

  for (const size of iconSizes) {
    const outputPath = path.join(publicDir, `icon-${size}x${size}.png`);
    
    try {
      // Calculate logo size (75% of icon size - bigger than before)
      const logoSize = Math.round(size * 0.75);
      
      // Corner radius - iOS uses about 22% of the icon size
      const cornerRadius = Math.round(size * 0.22);
      
      // Get the logo resized
      const logoBuffer = await sharp(logoImage)
        .resize(logoSize, logoSize, { 
          fit: 'contain', 
          background: { r: 0, g: 0, b: 0, alpha: 0 } 
        })
        .png()
        .toBuffer();
      
      // Get metadata to know the actual dimensions after resize
      const logoMeta = await sharp(logoBuffer).metadata();

      // Calculate position to center the logo
      const left = Math.round((size - logoMeta.width) / 2);
      const top = Math.round((size - logoMeta.height) / 2);

      // Create rounded rectangle mask
      const roundedMask = Buffer.from(
        `<svg width="${size}" height="${size}">
          <rect x="0" y="0" width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}" fill="white"/>
        </svg>`
      );

      // Resize background, composite logo, then apply rounded corners
      const composited = await sharp(backgroundImage)
        .resize(size, size, { fit: 'cover' })
        .composite([{
          input: logoBuffer,
          left: left,
          top: top,
        }])
        .png()
        .toBuffer();

      // Apply rounded corners mask
      await sharp(composited)
        .composite([{
          input: roundedMask,
          blend: 'dest-in'
        }])
        .png()
        .toFile(outputPath);

      console.log(`  ✓ Generated: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`  ✗ Error generating icon-${size}x${size}.png:`, error.message);
    }
  }
  
  console.log('\nDone! PWA icons generated successfully.');
}

generateIcons();
