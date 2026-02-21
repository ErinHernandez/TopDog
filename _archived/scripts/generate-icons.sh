#!/bin/bash

# Generate icons script for Idesaign
# This script generates PNG and ICO files from the SVG favicon
# Requires: ImageMagick (convert command) or sharp (Node.js)

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SVG_SOURCE="${PROJECT_DIR}/public/favicon.svg"
OUTPUT_DIR="${PROJECT_DIR}/public"

echo "Idesaign Icon Generator"
echo "======================"
echo "Source: $SVG_SOURCE"
echo "Output: $OUTPUT_DIR"
echo ""

# Check if ImageMagick is available
if command -v convert &> /dev/null; then
  echo "Using ImageMagick for icon generation..."
  
  # Generate favicon.ico (16x16, 32x32, 48x48)
  echo "Generating favicon.ico..."
  convert -density 200 "$SVG_SOURCE" \
    -define icon:auto-resize="16,32,48" \
    "$OUTPUT_DIR/favicon.ico"
  echo "✓ favicon.ico created"
  
  # Generate 192x192 icon
  echo "Generating icon-192.png..."
  convert -density 200 "$SVG_SOURCE" \
    -resize 192x192 \
    "$OUTPUT_DIR/icon-192.png"
  echo "✓ icon-192.png created"
  
  # Generate 192x192 maskable icon
  echo "Generating icon-192-maskable.png..."
  convert -density 200 "$SVG_SOURCE" \
    -resize 192x192 \
    -background none \
    "$OUTPUT_DIR/icon-192-maskable.png"
  echo "✓ icon-192-maskable.png created"
  
  # Generate 512x512 icon
  echo "Generating icon-512.png..."
  convert -density 200 "$SVG_SOURCE" \
    -resize 512x512 \
    "$OUTPUT_DIR/icon-512.png"
  echo "✓ icon-512.png created"
  
  # Generate 512x512 maskable icon
  echo "Generating icon-512-maskable.png..."
  convert -density 200 "$SVG_SOURCE" \
    -resize 512x512 \
    -background none \
    "$OUTPUT_DIR/icon-512-maskable.png"
  echo "✓ icon-512-maskable.png created"
  
  # Generate OG image (1200x630)
  echo "Generating og-image.png (Open Graph)..."
  convert -density 200 "$SVG_SOURCE" \
    -resize 1200x630 \
    -background '#0d0d0f' \
    -gravity center \
    -extent 1200x630 \
    "$OUTPUT_DIR/og-image.png"
  echo "✓ og-image.png created"
  
  # Generate OG image mobile (540x720)
  echo "Generating og-image-mobile.png (Mobile)..."
  convert -density 200 "$SVG_SOURCE" \
    -resize 540x720 \
    -background '#0d0d0f' \
    -gravity center \
    -extent 540x720 \
    "$OUTPUT_DIR/og-image-mobile.png"
  echo "✓ og-image-mobile.png created"
  
elif command -v node &> /dev/null; then
  echo "Using Node.js sharp library for icon generation..."
  
  # Check if sharp is installed
  if ! npm list sharp &> /dev/null; then
    echo "Installing sharp..."
    npm install --save-dev sharp
  fi
  
  # Create a Node.js script to generate icons
  cat > /tmp/generate-icons.js << 'NODEEOF'
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = process.env.SVG_SOURCE;
const outputDir = process.env.OUTPUT_DIR;

const generateIcon = async (width, height, filename, options = {}) => {
  try {
    const transform = sharp(svgPath)
      .resize(width, height, { fit: 'contain', background: options.background || { r: 13, g: 13, b: 15, alpha: 1 } });
    
    await transform.png().toFile(path.join(outputDir, filename));
    console.log(`✓ ${filename} created`);
  } catch (err) {
    console.error(`✗ Failed to generate ${filename}: ${err.message}`);
  }
};

const main = async () => {
  console.log('Using sharp for icon generation...');
  
  await generateIcon(192, 192, 'icon-192.png');
  await generateIcon(192, 192, 'icon-192-maskable.png', { background: { r: 0, g: 0, b: 0, alpha: 0 } });
  await generateIcon(512, 512, 'icon-512.png');
  await generateIcon(512, 512, 'icon-512-maskable.png', { background: { r: 0, g: 0, b: 0, alpha: 0 } });
  await generateIcon(1200, 630, 'og-image.png');
  await generateIcon(540, 720, 'og-image-mobile.png');
};

main().catch(err => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
NODEEOF
  
  export SVG_SOURCE="$SVG_SOURCE"
  export OUTPUT_DIR="$OUTPUT_DIR"
  node /tmp/generate-icons.js
  rm /tmp/generate-icons.js
  
else
  echo "Error: Neither ImageMagick nor Node.js is available"
  echo ""
  echo "Installation instructions:"
  echo "  macOS: brew install imagemagick"
  echo "  Ubuntu: sudo apt-get install imagemagick"
  echo "  Fedora: sudo dnf install ImageMagick"
  exit 1
fi

echo ""
echo "Icon generation complete!"
echo ""
echo "Generated files:"
ls -lh "$OUTPUT_DIR"/{favicon.ico,icon-*.png,og-image*.png} 2>/dev/null || echo "Some files may not exist yet"
