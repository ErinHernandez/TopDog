const sharp = require('sharp');
const path = require('path');

async function createBlueLogo() {
  const publicDir = path.join(__dirname, '..', 'public');
  const logoPath = path.join(publicDir, 'logo.png');
  const bluePath = path.join(publicDir, 'wr_blue.png');
  const outputPath = path.join(publicDir, 'blue_logo.png');

  // Get logo dimensions
  const logoMeta = await sharp(logoPath).metadata();
  
  // Resize blue to match logo dimensions, then composite with logo as mask
  const blueResized = await sharp(bluePath)
    .resize(logoMeta.width, logoMeta.height, { fit: 'cover' })
    .toBuffer();

  // Use logo's alpha channel as mask for the blue color
  await sharp(blueResized)
    .composite([{
      input: logoPath,
      blend: 'dest-in'  // Use logo alpha to mask the blue
    }])
    .toFile(outputPath);

  console.log(`Created blue_logo.png at ${outputPath}`);
}

createBlueLogo().catch(console.error);

