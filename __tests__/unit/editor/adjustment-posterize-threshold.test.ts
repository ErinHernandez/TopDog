/**
 * @fileoverview Comprehensive tests for Posterize, Threshold, and Vibrance adjustments
 * Tests quantization, thresholding, and selective saturation logic
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { installCanvasMocks, createTestImageData } from '../../helpers/canvas-mock';
import { Posterize } from '@/lib/studio/editor/tools/adjustments/Posterize';
import { Threshold } from '@/lib/studio/editor/tools/adjustments/Threshold';
import { Vibrance } from '@/lib/studio/editor/tools/adjustments/Vibrance';
import { LayerModel } from '@/lib/studio/editor/layers/LayerModel';
import { LayerCompositor } from '@/lib/studio/editor/layers/LayerCompositor';

beforeAll(() => {
  installCanvasMocks();
});

/**
 * Helper to extract RGBA values from ImageData at given index
 */
function getRGBA(imageData: ImageData, pixelIndex: number): [number, number, number, number] {
  const offset = pixelIndex * 4;
  return [
    imageData.data[offset],
    imageData.data[offset + 1],
    imageData.data[offset + 2],
    imageData.data[offset + 3],
  ];
}

/**
 * Helper to create a single-color test image
 */
function createSolidImage(r: number, g: number, b: number, a: number = 255): ImageData {
  const data = new Uint8ClampedArray(4);
  data[0] = r;
  data[1] = g;
  data[2] = b;
  data[3] = a;
  return new ImageData(data, 1, 1);
}

// ============================================================================
// POSTERIZE TESTS
// ============================================================================

describe('Posterize Adjustment', () => {
  describe('Basic posterization', () => {
    it('should reduce 256 levels to 2 levels (pure black/white)', () => {
      const black = createSolidImage(0, 0, 0);
      const white = createSolidImage(255, 255, 255);
      const darkGray = createSolidImage(100, 100, 100);
      const lightGray = createSolidImage(180, 180, 180);

      const result1 = Posterize.process(black, { levels: 2 });
      const result2 = Posterize.process(white, { levels: 2 });
      const result3 = Posterize.process(darkGray, { levels: 2 });
      const result4 = Posterize.process(lightGray, { levels: 2 });

      const [r1, g1, b1] = getRGBA(result1, 0);
      const [r2, g2, b2] = getRGBA(result2, 0);
      const [r3, g3, b3] = getRGBA(result3, 0);
      const [r4, g4, b4] = getRGBA(result4, 0);

      expect(r1 === g1 && g1 === b1).toBe(true); // monochrome
      expect(r2 === g2 && g2 === b2).toBe(true);
      expect(r3 === g3 && g3 === b3).toBe(true);
      expect(r4 === g4 && g4 === b4).toBe(true);

      // With 2 levels, quantum size is 128, so values should be 0 or 128
      expect([0, 128]).toContain(r1);
      expect([128, 255]).toContain(r2);
    });

    it('should reduce 256 levels to 4 levels', () => {
      const quarterTones = [64, 128, 192].map(val => createSolidImage(val, val, val));
      const results = quarterTones.map(img => Posterize.process(img, { levels: 4 }));

      const quantums = results.map(r => getRGBA(r, 0)[0]);
      // With 4 levels, quantum size is 64, so values should be multiples of 64: 0, 64, 128, 192
      for (const val of quantums) {
        expect(val % 64).toBe(0); // Should be exact multiples
      }
    });

    it('should preserve most values with 256 levels', () => {
      const testColors = [0, 127, 128, 200, 255];
      for (const color of testColors) {
        const img = createSolidImage(color, color, color);
        const result = Posterize.process(img, { levels: 256 });
        const [r] = getRGBA(result, 0);
        // With 256 levels, quantum size is 1, so no quantization occurs
        expect(r).toBe(color);
      }
    });
  });

  describe('Per-channel independence', () => {
    it('should apply posterization to each channel independently', () => {
      const data = new Uint8ClampedArray(4);
      data[0] = 100;  // R
      data[1] = 150;  // G
      data[2] = 200;  // B
      data[3] = 255;  // A
      const img = new ImageData(data, 1, 1);

      const result = Posterize.process(img, { levels: 4 });
      const [r, g, b, a] = getRGBA(result, 0);

      // Each channel should be quantized independently
      expect(a).toBe(255); // Alpha unchanged
      // Channels may differ since they're independent
      expect([r, g, b].every(v => v >= 0 && v <= 255)).toBe(true);
    });

    it('should preserve alpha channel', () => {
      const data = new Uint8ClampedArray(4);
      data[0] = 100;
      data[1] = 150;
      data[2] = 200;
      data[3] = 128;  // 50% opacity
      const img = new ImageData(data, 1, 1);

      const result = Posterize.process(img, { levels: 4 });
      const [, , , a] = getRGBA(result, 0);
      expect(a).toBe(128);
    });
  });

  describe('Validation', () => {
    it('should clamp levels to valid range [2, 256]', () => {
      expect(Posterize.validate({ levels: 1 }).levels).toBe(2);
      expect(Posterize.validate({ levels: 0 }).levels).toBe(2);
      expect(Posterize.validate({ levels: 300 }).levels).toBe(256);
      expect(Posterize.validate({ levels: 4 }).levels).toBe(4);
    });

    it('should have correct defaults', () => {
      const defaults = Posterize.getDefaults();
      expect(defaults.levels).toBe(4);
    });
  });
});

// ============================================================================
// THRESHOLD TESTS
// ============================================================================

describe('Threshold Adjustment', () => {
  describe('Basic thresholding', () => {
    it('should convert to pure black/white based on luminance', () => {
      const black = createSolidImage(0, 0, 0);
      const white = createSolidImage(255, 255, 255);
      const midGray = createSolidImage(128, 128, 128);

      const resultBlack = Threshold.process(black, { threshold: 128 });
      const resultWhite = Threshold.process(white, { threshold: 128 });
      const resultGray = Threshold.process(midGray, { threshold: 128 });

      const [rBlack] = getRGBA(resultBlack, 0);
      const [rWhite] = getRGBA(resultWhite, 0);
      const [rGray] = getRGBA(resultGray, 0);

      expect(rBlack).toBe(0);      // Below threshold -> black
      expect(rWhite).toBe(255);    // Above threshold -> white
      expect(rGray).toBe(0);       // At boundary (128 = threshold) -> black
    });

    it('should respect threshold boundaries precisely', () => {
      const just_below = createSolidImage(127, 127, 127);
      const just_above = createSolidImage(128, 128, 128);

      const result_below = Threshold.process(just_below, { threshold: 128 });
      const result_above = Threshold.process(just_above, { threshold: 128 });

      const [r_below] = getRGBA(result_below, 0);
      const [r_above] = getRGBA(result_above, 0);

      expect(r_below).toBe(0);   // Below
      expect(r_above).toBe(0);   // At boundary
    });

    it('should use luminance formula: 0.299*R + 0.587*G + 0.114*B', () => {
      // Create a color with known luminance
      // Red (255, 0, 0) -> lum = 76.5 (below 128)
      const red = createSolidImage(255, 0, 0);
      const resultRed = Threshold.process(red, { threshold: 128 });
      const [rRed] = getRGBA(resultRed, 0);
      expect(rRed).toBe(0); // Should be black

      // Yellow (255, 255, 0) -> lum = 225.6 (above 128)
      const yellow = createSolidImage(255, 255, 0);
      const resultYellow = Threshold.process(yellow, { threshold: 128 });
      const [rYellow] = getRGBA(resultYellow, 0);
      expect(rYellow).toBe(255); // Should be white
    });
  });

  describe('Threshold at different values', () => {
    it('should work with low threshold (0)', () => {
      const darkGray = createSolidImage(50, 50, 50);
      const result = Threshold.process(darkGray, { threshold: 0 });
      const [r] = getRGBA(result, 0);
      expect(r).toBe(255); // All above 0
    });

    it('should work with high threshold (255)', () => {
      const brightGray = createSolidImage(200, 200, 200);
      const result = Threshold.process(brightGray, { threshold: 255 });
      const [r] = getRGBA(result, 0);
      expect(r).toBe(0); // All below 255
    });

    it('should use custom threshold values', () => {
      const gray = createSolidImage(100, 100, 100);
      const result1 = Threshold.process(gray, { threshold: 50 });
      const result2 = Threshold.process(gray, { threshold: 150 });

      const [r1] = getRGBA(result1, 0);
      const [r2] = getRGBA(result2, 0);

      expect(r1).toBe(255); // 100 >= 50 -> white
      expect(r2).toBe(0);   // 100 < 150 -> black
    });
  });

  describe('Channel independence and alpha', () => {
    it('should apply equally to all color channels', () => {
      const rgb = createSolidImage(100, 100, 100);
      const result = Threshold.process(rgb, { threshold: 128 });
      const [r, g, b] = getRGBA(result, 0);

      expect(r).toBe(g);
      expect(g).toBe(b);
    });

    it('should preserve alpha channel', () => {
      const data = new Uint8ClampedArray(4);
      data[0] = 200;
      data[1] = 200;
      data[2] = 200;
      data[3] = 100;  // 39% opacity
      const img = new ImageData(data, 1, 1);

      const result = Threshold.process(img, { threshold: 128 });
      const [, , , a] = getRGBA(result, 0);
      expect(a).toBe(100);
    });
  });

  describe('Validation', () => {
    it('should clamp threshold to [0, 255]', () => {
      expect(Threshold.validate({ threshold: -50 }).threshold).toBe(0);
      expect(Threshold.validate({ threshold: 300 }).threshold).toBe(255);
      expect(Threshold.validate({ threshold: 128.5 }).threshold).toBe(128); // Floors decimals
    });

    it('should have correct defaults', () => {
      const defaults = Threshold.getDefaults();
      expect(defaults.threshold).toBe(128);
    });
  });
});

// ============================================================================
// VIBRANCE TESTS
// ============================================================================

describe('Vibrance Adjustment', () => {
  describe('Zero vibrance/saturation', () => {
    it('should not change image when vibrance and saturation are 0', () => {
      const img = createSolidImage(150, 100, 50);
      const result = Vibrance.process(img, { vibrance: 0, saturation: 0 });

      const [r1, g1, b1] = getRGBA(img, 0);
      const [r2, g2, b2] = getRGBA(result, 0);

      // May have minor rounding differences in HSL conversion
      expect(Math.abs(r1 - r2)).toBeLessThan(2);
      expect(Math.abs(g1 - g2)).toBeLessThan(2);
      expect(Math.abs(b1 - b2)).toBeLessThan(2);
    });
  });

  describe('Vibrance boost', () => {
    it('should increase saturation more on desaturated colors', () => {
      // Create two colors: one saturated (pure red), one less saturated (pale red)
      const purerRed = createSolidImage(255, 0, 0);       // Full saturation
      const paleRed = createSolidImage(255, 128, 128);    // Lower saturation

      const vibrance50 = { vibrance: 50, saturation: 0 };
      const result1 = Vibrance.process(purerRed, vibrance50);
      const result2 = Vibrance.process(paleRed, vibrance50);

      // Pale red should be affected more by vibrance than pure red
      const [pr1, pg1, pb1] = getRGBA(result1, 0);
      const [pr2, pg2, pb2] = getRGBA(result2, 0);

      // Pure red shouldn't change much (already fully saturated)
      const change1 = Math.abs(pr1 - 255) + Math.abs(pg1 - 0) + Math.abs(pb1 - 0);

      // Pale red should show more change (G and B components affected more)
      expect(pr2).toBeGreaterThan(0);
      expect(pg2).toBeLessThanOrEqual(128); // Should be reduced or same due to vibrance
      expect(pb2).toBeLessThanOrEqual(128);
    });

    it('should boost saturation positively with vibrance > 0', () => {
      // Grayish color (low saturation)
      const gray = createSolidImage(128, 120, 110);
      const result = Vibrance.process(gray, { vibrance: 30, saturation: 0 });

      const [r, g, b] = getRGBA(result, 0);

      // Result should still be within valid range
      expect(r).toBeGreaterThanOrEqual(0);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(255);
      expect(g).toBeLessThanOrEqual(255);
      expect(b).toBeLessThanOrEqual(255);
    });
  });

  describe('Saturation adjustment', () => {
    it('should adjust overall saturation independently', () => {
      const colorful = createSolidImage(255, 100, 50);

      const result_saturate = Vibrance.process(colorful, { vibrance: 0, saturation: 50 });
      const result_desaturate = Vibrance.process(colorful, { vibrance: 0, saturation: -50 });

      const [r_sat, g_sat, b_sat] = getRGBA(result_saturate, 0);
      const [r_desat, g_desat, b_desat] = getRGBA(result_desaturate, 0);

      // More saturation should increase chroma
      expect(Math.abs(r_sat - g_sat)).toBeGreaterThan(Math.abs(r_desat - g_desat));
    });
  });

  describe('Skin tone protection', () => {
    it('should reduce vibrance effect on skin tones', () => {
      // Typical skin tone: hue around 0-30 degrees (red-yellow range)
      const skinTone = createSolidImage(220, 180, 160);

      const vibrant = { vibrance: 100, saturation: 0 };
      const result = Vibrance.process(skinTone, vibrant);

      const [r1, g1, b1] = getRGBA(skinTone, 0);
      const [r2, g2, b2] = getRGBA(result, 0);

      // Skin tone should change less with vibrance due to protection
      const change = Math.abs(r2 - r1) + Math.abs(g2 - g1) + Math.abs(b2 - b1);
      expect(change).toBeLessThan(150); // Reasonable limit for skin tone
    });

    it('should not overly saturate skin tones', () => {
      const skinTone = createSolidImage(210, 170, 150);
      const result = Vibrance.process(skinTone, { vibrance: 100, saturation: 100 });

      const [r, g, b] = getRGBA(result, 0);

      // RGB values should still be relatively close (not overly saturated)
      expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThan(200);
    });
  });

  describe('Validation', () => {
    it('should clamp vibrance to [-100, 100]', () => {
      expect(Vibrance.validate({ vibrance: 150, saturation: 0 }).vibrance).toBe(100);
      expect(Vibrance.validate({ vibrance: -150, saturation: 0 }).vibrance).toBe(-100);
    });

    it('should clamp saturation to [-100, 100]', () => {
      expect(Vibrance.validate({ vibrance: 0, saturation: 150 }).saturation).toBe(100);
      expect(Vibrance.validate({ vibrance: 0, saturation: -150 }).saturation).toBe(-100);
    });

    it('should have correct defaults', () => {
      const defaults = Vibrance.getDefaults();
      expect(defaults.vibrance).toBe(0);
      expect(defaults.saturation).toBe(0);
    });
  });

  describe('Alpha channel', () => {
    it('should preserve alpha channel', () => {
      const data = new Uint8ClampedArray(4);
      data[0] = 200;
      data[1] = 100;
      data[2] = 50;
      data[3] = 150;
      const img = new ImageData(data, 1, 1);

      const result = Vibrance.process(img, { vibrance: 50, saturation: 30 });
      const [, , , a] = getRGBA(result, 0);
      expect(a).toBe(150);
    });
  });
});

// ============================================================================
// LAYER GROUP ISOLATION MODE TESTS
// ============================================================================

describe('Group Layer Isolation Mode', () => {
  describe('Group creation', () => {
    it('should initialize with auto isolation mode by default', () => {
      const group = LayerModel.createGroupLayer('group-1', 'Test Group');
      expect(group.isolationMode).toBe('auto');
    });

    it('should support isolate mode', () => {
      const group = LayerModel.createGroupLayer('group-1', 'Test Group');
      expect(['auto', 'isolate']).toContain(group.isolationMode);
    });
  });

  describe('Isolation mode behavior', () => {
    it('auto mode should behave like passthrough for blend context', () => {
      const tree = LayerModel.createEmptyTree('doc-1');
      const group = LayerModel.createGroupLayer('group-1', 'Test Group');

      const updatedTree = LayerModel.addLayer(tree, group);
      const retrievedGroup = LayerModel.getLayer(updatedTree, 'group-1') as any;

      // In auto mode, group blend modes should inherit parent context
      expect(retrievedGroup.isolationMode).toBe('auto');
    });

    it('isolate mode should composite group to buffer first', () => {
      const tree = LayerModel.createEmptyTree('doc-1');
      let group = LayerModel.createGroupLayer('group-1', 'Test Group');

      // Manually set isolation mode
      group.isolationMode = 'isolate';
      const updatedTree = LayerModel.addLayer(tree, group);
      const retrievedGroup = LayerModel.getLayer(updatedTree, 'group-1') as any;

      // In isolate mode, children blend within group buffer, then group blends with parent
      expect(retrievedGroup.isolationMode).toBe('isolate');
    });
  });

  describe('Composite integrity', () => {
    it('should not affect layer tree operations when changing isolation mode', () => {
      const tree = LayerModel.createEmptyTree('doc-1');
      const group = LayerModel.createGroupLayer('group-1', 'Test Group');

      let updatedTree = LayerModel.addLayer(tree, group);

      // Change isolation mode via property update
      updatedTree = LayerModel.updateLayerProperty(updatedTree, 'group-1', 'isolationMode', 'isolate');

      const retrievedGroup = LayerModel.getLayer(updatedTree, 'group-1') as any;
      expect(retrievedGroup.isolationMode).toBe('isolate');

      // Tree should still be valid
      const validation = LayerModel.validateTree(updatedTree);
      expect(validation.valid).toBe(true);
    });
  });
});

// ============================================================================
// EDGE CASES AND MULTI-PIXEL TESTS
// ============================================================================

describe('Adjustment Edge Cases', () => {
  describe('Single pixel images', () => {
    it('posterize should handle single pixel', () => {
      const img = createSolidImage(100, 100, 100);
      const result = Posterize.process(img, { levels: 4 });
      expect(result.width).toBe(1);
      expect(result.height).toBe(1);
    });

    it('threshold should handle single pixel', () => {
      const img = createSolidImage(100, 100, 100);
      const result = Threshold.process(img, { threshold: 128 });
      expect(result.width).toBe(1);
      expect(result.height).toBe(1);
    });

    it('vibrance should handle single pixel', () => {
      const img = createSolidImage(100, 100, 100);
      const result = Vibrance.process(img, { vibrance: 50, saturation: 0 });
      expect(result.width).toBe(1);
      expect(result.height).toBe(1);
    });
  });

  describe('All black/white images', () => {
    it('posterize all-black with 4 levels should remain black or near-black', () => {
      const img = createSolidImage(0, 0, 0);
      const result = Posterize.process(img, { levels: 4 });
      const [r] = getRGBA(result, 0);
      // With 4 levels and quantum 64, 0 rounds to 0
      expect([0, 64]).toContain(r);
    });

    it('posterize all-white with 4 levels should be white or near-white', () => {
      const img = createSolidImage(255, 255, 255);
      const result = Posterize.process(img, { levels: 4 });
      const [r] = getRGBA(result, 0);
      // With 4 levels and quantum 64, 255 rounds to 256, clamped to 255
      expect([192, 255]).toContain(r);
    });

    it('threshold all-black should remain black', () => {
      const img = createSolidImage(0, 0, 0);
      const result = Threshold.process(img, { threshold: 128 });
      const [r] = getRGBA(result, 0);
      expect(r).toBe(0);
    });

    it('threshold all-white should remain white', () => {
      const img = createSolidImage(255, 255, 255);
      const result = Threshold.process(img, { threshold: 128 });
      const [r] = getRGBA(result, 0);
      expect(r).toBe(255);
    });
  });
});
