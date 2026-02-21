#!/usr/bin/env python3
"""
Convert an image to SVG format.
Supports two modes:
1. Embed mode: Embeds the image as base64 in SVG (quick, preserves all details)
2. Vector mode: Attempts basic vectorization (simpler paths, may lose detail)
"""

import sys
import os
import base64
from pathlib import Path

try:
    from PIL import Image
    import numpy as np
except ImportError:
    print("Error: PIL (Pillow) and numpy are required.")
    print("Install with: pip install pillow numpy")
    sys.exit(1)


def embed_image_as_svg(image_path, output_path=None):
    """
    Embed an image in an SVG wrapper with base64 encoding.
    This preserves all image details and makes it easy to edit the SVG structure.
    """
    img_path = Path(image_path)
    if not img_path.exists():
        print(f"Error: Image not found: {image_path}")
        return False
    
    # Read and encode image
    with open(img_path, 'rb') as f:
        img_data = f.read()
        img_base64 = base64.b64encode(img_data).decode('utf-8')
    
    # Determine image format
    img_format = img_path.suffix[1:].lower()  # Remove the dot
    if img_format == 'jpg':
        img_format = 'jpeg'
    
    # Get image dimensions
    img = Image.open(img_path)
    width, height = img.size
    
    # Create SVG
    svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="{width}" 
     height="{height}" 
     viewBox="0 0 {width} {height}">
  <defs>
    <!-- Original image embedded for reference -->
    <image id="original-image" 
           xlink:href="data:image/{img_format};base64,{img_base64}"
           width="{width}" 
           height="{height}"/>
  </defs>
  
  <!-- You can add vector paths here to trace over the image -->
  <!-- The image is embedded above for reference -->
  
  <!-- Uncomment below to show the original image -->
  <!-- <use xlink:href="#original-image"/> -->
  
  <!-- Add your vector paths here -->
  <!-- Example: -->
  <!-- <path d="M 0,0 L 100,100" stroke="black" fill="none"/> -->
</svg>'''
    
    # Write output
    if output_path is None:
        output_path = img_path.with_suffix('.svg')
    else:
        output_path = Path(output_path)
    
    with open(output_path, 'w') as f:
        f.write(svg_content)
    
    print(f"✓ Created SVG: {output_path}")
    print(f"  Dimensions: {width}x{height}")
    print(f"  Original image embedded as base64 reference")
    print(f"  You can now edit the SVG and add vector paths")
    return True


def basic_vectorize(image_path, output_path=None, threshold=128):
    """
    Basic vectorization using edge detection.
    This is a simplified approach - for best results, use potrace or professional tools.
    """
    img_path = Path(image_path)
    if not img_path.exists():
        print(f"Error: Image not found: {image_path}")
        return False
    
    # Load and process image
    img = Image.open(img_path)
    width, height = img.size
    
    # Convert to grayscale
    if img.mode != 'L':
        img = img.convert('L')
    
    # Convert to numpy array
    img_array = np.array(img)
    
    # Threshold to create binary image
    binary = img_array > threshold
    
    # Simple edge detection (very basic)
    # This is a placeholder - real vectorization needs more sophisticated algorithms
    print("Note: Basic vectorization is limited. For best results:")
    print("  1. Install potrace: brew install potrace (macOS) or apt-get install potrace (Linux)")
    print("  2. Use: potrace -s input.png -o output.svg")
    print("  3. Or use professional tools like Adobe Illustrator, Inkscape, or Vectorizer.io")
    
    # For now, just create a simple SVG structure
    svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="{width}" 
     height="{height}" 
     viewBox="0 0 {width} {height}">
  <!-- Basic vectorization placeholder -->
  <!-- This requires more sophisticated algorithms for proper vectorization -->
  <!-- Consider using potrace or professional vectorization tools -->
  <rect width="{width}" height="{height}" fill="#f0f0f0"/>
  <text x="{width//2}" y="{height//2}" text-anchor="middle" fill="#666">
    Vectorization requires potrace or professional tools
  </text>
</svg>'''
    
    if output_path is None:
        output_path = img_path.with_suffix('.svg')
    else:
        output_path = Path(output_path)
    
    with open(output_path, 'w') as f:
        f.write(svg_content)
    
    print(f"✓ Created placeholder SVG: {output_path}")
    return False


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 image_to_svg.py <image_path> [output_path] [--vector]")
        print("\nOptions:")
        print("  <image_path>    Path to input image (PNG, JPG, etc.)")
        print("  [output_path]   Optional output SVG path (default: same name with .svg)")
        print("  [--vector]      Attempt basic vectorization (limited)")
        print("\nExample:")
        print("  python3 image_to_svg.py public/Teal_Earth_irelandcenter.png")
        print("  python3 image_to_svg.py public/Teal_Earth_irelandcenter.png tournament_logo.svg")
        sys.exit(1)
    
    image_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith('--') else None
    use_vector = '--vector' in sys.argv
    
    if use_vector:
        basic_vectorize(image_path, output_path)
    else:
        embed_image_as_svg(image_path, output_path)


if __name__ == '__main__':
    main()

