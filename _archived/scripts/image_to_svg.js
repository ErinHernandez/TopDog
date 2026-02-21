#!/usr/bin/env node
/**
 * Convert an image to SVG format.
 * Embeds the image as base64 in SVG for easy editing.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function convertImageToSVG(imagePath, outputPath = null) {
  try {
    const inputPath = path.resolve(imagePath);
    
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: Image not found: ${imagePath}`);
      process.exit(1);
    }

    // Get image metadata
    const metadata = await sharp(inputPath).metadata();
    const width = metadata.width;
    const height = metadata.height;
    const format = metadata.format;

    // Read image as buffer and convert to base64
    const imageBuffer = await sharp(inputPath).toBuffer();
    const base64Image = imageBuffer.toString('base64');
    
    // Determine MIME type
    const mimeTypes = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      gif: 'image/gif'
    };
    const mimeType = mimeTypes[format] || 'image/png';

    // Create SVG content
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${width}" 
     height="${height}" 
     viewBox="0 0 ${width} ${height}">
  <defs>
    <!-- Original image embedded for reference -->
    <image id="original-image" 
           xlink:href="data:${mimeType};base64,${base64Image}"
           width="${width}" 
           height="${height}"/>
  </defs>
  
  <!-- You can add vector paths here to trace over the image -->
  <!-- The image is embedded above for reference -->
  
  <!-- Uncomment below to show the original image -->
  <!-- <use xlink:href="#original-image"/> -->
  
  <!-- Add your vector paths here -->
  <!-- Example: -->
  <!-- <path d="M 0,0 L 100,100" stroke="black" fill="none"/> -->
</svg>`;

    // Determine output path
    let output;
    if (outputPath) {
      output = path.resolve(outputPath);
    } else {
      const inputDir = path.dirname(inputPath);
      const inputName = path.basename(inputPath, path.extname(inputPath));
      output = path.join(inputDir, `${inputName}.svg`);
    }

    // Write SVG file
    fs.writeFileSync(output, svgContent, 'utf8');

    console.log(`✓ Created SVG: ${output}`);
    console.log(`  Dimensions: ${width}x${height}`);
    console.log(`  Original image embedded as base64 reference`);
    console.log(`  You can now edit the SVG and add vector paths`);
    
  } catch (error) {
    console.error('Error converting image:', error.message);
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('Usage: node image_to_svg.js <image_path> [output_path]');
  console.log('\nExample:');
  console.log('  node image_to_svg.js public/globe_tournament_III.png');
  console.log('  node image_to_svg.js public/globe_tournament_III.png public/tournament_logo.svg');
  process.exit(1);
}

convertImageToSVG(args[0], args[1]);

