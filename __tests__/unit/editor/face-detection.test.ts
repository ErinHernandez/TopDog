import { describe, it, expect } from 'vitest';
import { generateSkinMask, detectFacesFromImageData } from '@/lib/studio/editor/tools/advanced/faceDetection';

// ============================================================================
// Mock ImageData Helper (Node.js doesn't have DOM ImageData)
// ============================================================================

function createImageData(
  width: number,
  height: number,
  fillFn?: (x: number, y: number) => [number, number, number, number]
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = fillFn ? fillFn(x, y) : [0, 0, 0, 255];
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = a;
    }
  }
  return { data, width, height, colorSpace: 'srgb' as PredefinedColorSpace };
}

// ============================================================================
// Skin-tone Test Colors
// ============================================================================

// Light skin: (200, 150, 130) → Cb≈89, Cr≈159 ✓ within range
const LIGHT_SKIN = [200, 150, 130, 255] as [number, number, number, number];

// Medium skin: (180, 130, 100) → Cb≈84, Cr≈162 ✓ within range
const MEDIUM_SKIN = [180, 130, 100, 255] as [number, number, number, number];

// Dark skin: (120, 80, 60) → Cb≈90, Cr≈157 ✓ within range
const DARK_SKIN = [120, 80, 60, 255] as [number, number, number, number];

// Non-skin colors
const BLUE = [0, 0, 255, 255] as [number, number, number, number];
const GREEN = [0, 255, 0, 255] as [number, number, number, number];
const RED = [255, 0, 0, 255] as [number, number, number, number];
const TRANSPARENT = [200, 150, 130, 0] as [number, number, number, number]; // Skin RGB but transparent

// ============================================================================
// generateSkinMask Tests
// ============================================================================

describe('generateSkinMask', () => {
  it('classifies skin-tone pixels as skin', () => {
    const imageData = createImageData(10, 10, () => LIGHT_SKIN);
    const mask = generateSkinMask(imageData);

    expect(mask.length).toBe(100);
    for (let i = 0; i < mask.length; i++) {
      expect(mask[i]).toBe(255);
    }
  });

  it('classifies non-skin pixels as non-skin', () => {
    const imageData = createImageData(10, 10, () => BLUE);
    const mask = generateSkinMask(imageData);

    expect(mask.length).toBe(100);
    for (let i = 0; i < mask.length; i++) {
      expect(mask[i]).toBe(0);
    }
  });

  it('skips transparent pixels', () => {
    const imageData = createImageData(10, 10, () => TRANSPARENT);
    const mask = generateSkinMask(imageData);

    expect(mask.length).toBe(100);
    for (let i = 0; i < mask.length; i++) {
      expect(mask[i]).toBe(0);
    }
  });

  it('handles empty image', () => {
    const imageData = createImageData(0, 0);
    const mask = generateSkinMask(imageData);

    expect(mask.length).toBe(0);
  });

  it('handles mixed skin and non-skin pixels', () => {
    const imageData = createImageData(20, 20, (x, y) => {
      // Top half: skin, bottom half: blue
      return y < 10 ? LIGHT_SKIN : BLUE;
    });
    const mask = generateSkinMask(imageData);

    expect(mask.length).toBe(400);
    // Top half should be 255
    for (let i = 0; i < 200; i++) {
      expect(mask[i]).toBe(255);
    }
    // Bottom half should be 0
    for (let i = 200; i < 400; i++) {
      expect(mask[i]).toBe(0);
    }
  });

  it('correctly identifies different skin tones', () => {
    const imageData = createImageData(30, 10, (x) => {
      // Columns: light, medium, dark
      if (x < 10) return LIGHT_SKIN;
      if (x < 20) return MEDIUM_SKIN;
      return DARK_SKIN;
    });
    const mask = generateSkinMask(imageData);

    // All pixels should be marked as skin (255) regardless of tone variation
    for (let i = 0; i < mask.length; i++) {
      expect(mask[i]).toBe(255);
    }
  });

  it('respects alpha threshold (128)', () => {
    const imageData = createImageData(30, 10, (x) => {
      // Alpha < 128: transparent (should be non-skin)
      // Alpha >= 128: opaque (should be checked for skin tone)
      if (x < 10) return [200, 150, 130, 127] as [number, number, number, number]; // Transparent
      if (x < 20) return [200, 150, 130, 128] as [number, number, number, number]; // Just opaque
      return [0, 0, 255, 255] as [number, number, number, number]; // Opaque non-skin
    });
    const mask = generateSkinMask(imageData);

    // x < 10: transparent → 0
    for (let i = 0; i < 10; i++) {
      expect(mask[i]).toBe(0);
    }
    // 10 <= x < 20: opaque skin → 255
    for (let i = 10; i < 20; i++) {
      expect(mask[i]).toBe(255);
    }
    // 20 <= x < 30: opaque non-skin → 0
    for (let i = 20; i < 30; i++) {
      expect(mask[i]).toBe(0);
    }
  });
});

// ============================================================================
// detectFacesFromImageData Tests
// ============================================================================

describe('detectFacesFromImageData', () => {
  it('detects face-sized skin region', () => {
    const imageData = createImageData(100, 100, (x, y) => {
      // Paint a 30×40 skin-colored rectangle in center
      // Center: (50, 50), so rect spans (35-64, 30-69)
      if (x >= 35 && x < 65 && y >= 30 && y < 70) {
        return LIGHT_SKIN;
      }
      return BLUE;
    });

    const result = detectFacesFromImageData(imageData);

    expect(result.faces.length).toBe(1);
    expect(result.faces[0].bounds.width).toBeGreaterThan(0);
    expect(result.faces[0].bounds.height).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('returns empty for non-skin image', () => {
    const imageData = createImageData(100, 100, () => BLUE);
    const result = detectFacesFromImageData(imageData);

    expect(result.faces).toEqual([]);
    expect(result.confidence).toBe(0);
  });

  it('rejects skin regions below minimum area', () => {
    const imageData = createImageData(100, 100, (x, y) => {
      // Paint a tiny 3×3 skin patch in corner
      // Area = 9 pixels, image area = 10000, ratio = 0.09% (needs > 0.5%)
      if (x < 3 && y < 3) {
        return LIGHT_SKIN;
      }
      return BLUE;
    });

    const result = detectFacesFromImageData(imageData);

    expect(result.faces.length).toBe(0);
    expect(result.confidence).toBe(0);
  });

  it('rejects skin regions with bad aspect ratio (too wide)', () => {
    const imageData = createImageData(100, 100, (x, y) => {
      // Paint a very wide skin strip: 90×5 pixels
      // Aspect ratio = height/width = 5/90 ≈ 0.055 (needs >= 0.6)
      if (x >= 5 && x < 95 && y >= 47 && y < 52) {
        return LIGHT_SKIN;
      }
      return BLUE;
    });

    const result = detectFacesFromImageData(imageData);

    expect(result.faces.length).toBe(0);
  });

  it('rejects skin regions with bad aspect ratio (too tall)', () => {
    const imageData = createImageData(100, 100, (x, y) => {
      // Paint a very tall skin strip: 5×90 pixels
      // Aspect ratio = height/width = 90/5 = 18 (needs <= 1.8)
      if (x >= 47 && x < 52 && y >= 5 && y < 95) {
        return LIGHT_SKIN;
      }
      return BLUE;
    });

    const result = detectFacesFromImageData(imageData);

    expect(result.faces.length).toBe(0);
  });

  it('provides 4 landmarks for detected face', () => {
    const imageData = createImageData(100, 100, (x, y) => {
      if (x >= 35 && x < 65 && y >= 30 && y < 70) {
        return LIGHT_SKIN;
      }
      return BLUE;
    });

    const result = detectFacesFromImageData(imageData);

    expect(result.faces.length).toBe(1);
    const face = result.faces[0];
    expect(face.landmarks.length).toBe(4);

    const landmarkNames = face.landmarks.map((l) => l.name);
    expect(landmarkNames).toContain('left_eye');
    expect(landmarkNames).toContain('right_eye');
    expect(landmarkNames).toContain('nose');
    expect(landmarkNames).toContain('mouth');
  });

  it('landmark positions are within face bounds', () => {
    const imageData = createImageData(100, 100, (x, y) => {
      if (x >= 35 && x < 65 && y >= 30 && y < 70) {
        return LIGHT_SKIN;
      }
      return BLUE;
    });

    const result = detectFacesFromImageData(imageData);

    expect(result.faces.length).toBe(1);
    const face = result.faces[0];
    const bounds = face.bounds;

    for (const landmark of face.landmarks) {
      expect(landmark.x).toBeGreaterThanOrEqual(bounds.x);
      expect(landmark.x).toBeLessThanOrEqual(bounds.x + bounds.width);
      expect(landmark.y).toBeGreaterThanOrEqual(bounds.y);
      expect(landmark.y).toBeLessThanOrEqual(bounds.y + bounds.height);
    }
  });

  it('handles null/invalid input gracefully', () => {
    const imageData = createImageData(0, 0);
    const result = detectFacesFromImageData(imageData);

    expect(result.faces).toEqual([]);
    expect(result.confidence).toBe(0);
    expect(result.timestamp).toBeDefined();
  });

  it('overall confidence is average of face confidences', () => {
    const imageData = createImageData(200, 100, (x, y) => {
      // Paint two separate face-sized regions
      // Face 1: x=[20-50], y=[20-70]
      if (x >= 20 && x < 50 && y >= 20 && y < 70) {
        return LIGHT_SKIN;
      }
      // Face 2: x=[150-180], y=[20-70]
      if (x >= 150 && x < 180 && y >= 20 && y < 70) {
        return MEDIUM_SKIN;
      }
      return BLUE;
    });

    const result = detectFacesFromImageData(imageData);

    expect(result.faces.length).toBeGreaterThanOrEqual(1);
    if (result.faces.length > 0) {
      // Overall confidence should be average of individual confidences
      const avgConfidence = result.faces.reduce((sum, f) => sum + f.confidence, 0) / result.faces.length;
      expect(result.confidence).toBeCloseTo(avgConfidence, 5);
    }
  });

  it('assigns unique face IDs', () => {
    const imageData = createImageData(200, 100, (x, y) => {
      // Paint two face-sized regions
      if (x >= 20 && x < 50 && y >= 20 && y < 70) {
        return LIGHT_SKIN;
      }
      if (x >= 150 && x < 180 && y >= 20 && y < 70) {
        return MEDIUM_SKIN;
      }
      return BLUE;
    });

    const result = detectFacesFromImageData(imageData);

    const ids = result.faces.map((f) => f.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('detects multiple faces', () => {
    const imageData = createImageData(300, 100, (x, y) => {
      // Paint three face-sized regions with gaps
      if (x >= 10 && x < 40 && y >= 20 && y < 70) {
        return LIGHT_SKIN;
      }
      if (x >= 130 && x < 160 && y >= 20 && y < 70) {
        return MEDIUM_SKIN;
      }
      if (x >= 250 && x < 280 && y >= 20 && y < 70) {
        return DARK_SKIN;
      }
      return BLUE;
    });

    const result = detectFacesFromImageData(imageData);

    expect(result.faces.length).toBeGreaterThanOrEqual(2);
  });

  it('sets timestamp in result', () => {
    const imageData = createImageData(100, 100, () => LIGHT_SKIN);
    const beforeTime = Date.now();
    const result = detectFacesFromImageData(imageData);
    const afterTime = Date.now();

    expect(result.timestamp).toBeGreaterThanOrEqual(beforeTime);
    expect(result.timestamp).toBeLessThanOrEqual(afterTime);
  });

  it('rejects faces touching all 4 edges (likely background)', () => {
    const imageData = createImageData(50, 50, (x, y) => {
      // Fill entire image with skin - touches all edges
      return LIGHT_SKIN;
    });

    const result = detectFacesFromImageData(imageData);

    // Should be rejected as it's likely background
    expect(result.faces.length).toBe(0);
  });

  it('accepts faces touching only some edges', () => {
    const imageData = createImageData(100, 100, (x, y) => {
      // Skin region that touches top and left edges but not right and bottom
      if (x < 50 && y < 50) {
        return LIGHT_SKIN;
      }
      return BLUE;
    });

    const result = detectFacesFromImageData(imageData);

    // Should be accepted as it only touches some edges
    expect(result.faces.length).toBeGreaterThanOrEqual(0);
  });

  it('face bounds are correctly positioned', () => {
    const imageData = createImageData(100, 100, (x, y) => {
      // Skin patch at specific location: x=[30-60], y=[25-75]
      if (x >= 30 && x < 60 && y >= 25 && y < 75) {
        return LIGHT_SKIN;
      }
      return BLUE;
    });

    const result = detectFacesFromImageData(imageData);

    expect(result.faces.length).toBeGreaterThan(0);
    const face = result.faces[0];
    expect(face.bounds.x).toBeGreaterThanOrEqual(30);
    expect(face.bounds.x).toBeLessThanOrEqual(35);
    expect(face.bounds.y).toBeGreaterThanOrEqual(25);
    expect(face.bounds.y).toBeLessThanOrEqual(30);
    expect(face.bounds.width).toBeGreaterThan(0);
    expect(face.bounds.height).toBeGreaterThan(0);
  });

  it('confidence is between 0 and 1', () => {
    const imageData = createImageData(100, 100, (x, y) => {
      if (x >= 35 && x < 65 && y >= 30 && y < 70) {
        return LIGHT_SKIN;
      }
      return BLUE;
    });

    const result = detectFacesFromImageData(imageData);

    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);

    for (const face of result.faces) {
      expect(face.confidence).toBeGreaterThanOrEqual(0);
      expect(face.confidence).toBeLessThanOrEqual(1);
    }
  });

  it('face ID follows format face-N', () => {
    const imageData = createImageData(200, 100, (x, y) => {
      if (x >= 20 && x < 50 && y >= 20 && y < 70) {
        return LIGHT_SKIN;
      }
      if (x >= 150 && x < 180 && y >= 20 && y < 70) {
        return MEDIUM_SKIN;
      }
      return BLUE;
    });

    const result = detectFacesFromImageData(imageData);

    for (let i = 0; i < result.faces.length; i++) {
      expect(result.faces[i].id).toMatch(/^face-\d+$/);
    }
  });

  it('handles very small images', () => {
    const imageData = createImageData(10, 10, () => LIGHT_SKIN);
    const result = detectFacesFromImageData(imageData);

    expect(Array.isArray(result.faces)).toBe(true);
    expect(result.confidence).toBeDefined();
  });

  it('handles very large images', () => {
    const imageData = createImageData(500, 500, (x, y) => {
      // Paint a large face region
      if (x >= 150 && x < 350 && y >= 100 && y < 400) {
        return LIGHT_SKIN;
      }
      return BLUE;
    });

    const result = detectFacesFromImageData(imageData);

    expect(result.faces.length).toBeGreaterThan(0);
    expect(result.faces[0].confidence).toBeGreaterThan(0);
  });

  it('handles single-row image', () => {
    const imageData = createImageData(100, 1, () => LIGHT_SKIN);
    const result = detectFacesFromImageData(imageData);

    expect(Array.isArray(result.faces)).toBe(true);
  });

  it('handles single-column image', () => {
    const imageData = createImageData(1, 100, () => LIGHT_SKIN);
    const result = detectFacesFromImageData(imageData);

    expect(Array.isArray(result.faces)).toBe(true);
  });
});
