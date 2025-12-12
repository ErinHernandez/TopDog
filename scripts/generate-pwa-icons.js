const sharp = require('sharp');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const backgroundImage = path.join(publicDir, 'wr_blue.png');
const logoImage = path.join(publicDir, 'logo.png');

const iconSizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];

async function generateIcons() {
  console.log('Generating PWA icons...\n');
  console.log('Background: wr_blue.png');
  console.log('Overlay: logo.png (already white)\n');

  for (const size of iconSizes) {
    const outputPath = path.join(publicDir, `icon-${size}x${size}.png`);
    
    try {
      // Calculate logo size (60% of icon size for nice padding)
      const logoSize = Math.round(size * 0.6);
      
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

      // Resize background and composite logo on top
      await sharp(backgroundImage)
        .resize(size, size, { fit: 'cover' })
        .composite([{
          input: logoBuffer,
          left: left,
          top: top,
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
