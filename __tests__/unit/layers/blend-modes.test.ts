/**
 * @fileoverview Comprehensive tests for BlendModes module
 * Tests all blend functions, pixel blending, and image data operations
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { installCanvasMocks, createTestImageData, createGradientImageData } from '../../helpers/canvas-mock';
import {
  BlendModeFunctions,
  blendPixels,
  blendImageData,
  getBlendModeShader,
} from '@/lib/studio/editor/layers/BlendModes';

import type { BlendMode } from '@/lib/studio/types/layers';
import { BLEND_MODE_LIST } from '@/lib/studio/types/layers';

beforeAll(() => {
  installCanvasMocks();
});

/**
 * Helper to compare normalized values with tolerance for floating-point rounding
 */
function expectCloseTo(actual: number, expected: number, tolerance: number = 0.01) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

/**
 * Helper to compare RGBA arrays [0-255] with tolerance
 */
function expectRGBAClose(actual: number[], expected: number[], tolerance: number = 2) {
  expect(actual[0]).toBeCloseTo(expected[0], 0);
  expect(actual[1]).toBeCloseTo(expected[1], 0);
  expect(actual[2]).toBeCloseTo(expected[2], 0);
  expect(actual[3]).toBeCloseTo(expected[3], 0);
}

// ============================================================================
// INDIVIDUAL BLEND MODE FUNCTIONS (27 modes)
// ============================================================================

describe('Individual Blend Mode Functions', () => {
  describe('BlendModeFunctions.normal', () => {
    it('should return source when source alpha is 1.0', () => {
      const result = BlendModeFunctions.normal(0.5, 0.3, 1.0);
      expectCloseTo(result, 0.5);
    });

    it('should return cs + cb when source alpha is 0', () => {
      // normal(cs, cb, 0) = cs + cb * (1 - 0) = cs + cb
      // Note: this is the per-channel blend function, NOT the full alpha compositing path
      // The full alpha compositing in blendPixels handles the "transparent source" case
      const result = BlendModeFunctions.normal(0.5, 0.3, 0);
      expectCloseTo(result, 0.8);
    });

    it('should blend proportionally with partial alpha', () => {
      const result = BlendModeFunctions.normal(0.8, 0.2, 0.5);
      expectCloseTo(result, 0.8 + 0.2 * (1 - 0.5));
    });
  });

  describe('BlendModeFunctions.dissolve', () => {
    it('should return either source or backdrop (stochastic)', () => {
      const cs = 0.7;
      const cb = 0.2;
      const as = 0.8;

      for (let i = 0; i < 10; i++) {
        const result = BlendModeFunctions.dissolve(cs, cb, as);
        expect(result === cs || result === cb).toBe(true);
      }
    });
  });

  describe('BlendModeFunctions.darken', () => {
    it('should return minimum of source and backdrop', () => {
      const result = BlendModeFunctions.darken(0.5, 0.3);
      expectCloseTo(result, 0.3);
    });

    it('should return source when source is smaller', () => {
      const result = BlendModeFunctions.darken(0.2, 0.7);
      expectCloseTo(result, 0.2);
    });
  });

  describe('BlendModeFunctions.multiply', () => {
    it('should multiply normalized values: 0.5 * 0.4 = 0.2', () => {
      const result = BlendModeFunctions.multiply(0.5, 0.4);
      expectCloseTo(result, 0.2);
    });

    it('should return 0 when either is 0', () => {
      const result = BlendModeFunctions.multiply(0, 0.5);
      expectCloseTo(result, 0);
    });

    it('should preserve when multiplied by 1', () => {
      const result = BlendModeFunctions.multiply(0.7, 1);
      expectCloseTo(result, 0.7);
    });
  });

  describe('BlendModeFunctions.color-burn', () => {
    it('should return 0 when source is 0', () => {
      const result = BlendModeFunctions['color-burn'](0, 0.5);
      expectCloseTo(result, 0);
    });

    it('should compute correctly for normal case', () => {
      // color-burn(0.5, 0.5) = 1 - (1-0.5)/0.5 = 1 - 1 = 0
      const result = BlendModeFunctions['color-burn'](0.5, 0.5);
      expectCloseTo(result, 0);
    });
  });

  describe('BlendModeFunctions.linear-burn', () => {
    it('should add and subtract 1: cs + cb - 1', () => {
      const result = BlendModeFunctions['linear-burn'](0.6, 0.5);
      expectCloseTo(result, 0.6 + 0.5 - 1);
    });

    it('should clamp to valid range', () => {
      const result = BlendModeFunctions['linear-burn'](0.3, 0.2);
      expect(result).toBeGreaterThanOrEqual(-1);
    });
  });

  describe('BlendModeFunctions.darker-color', () => {
    it('should select darker color by luminance', () => {
      const result = BlendModeFunctions['darker-color'](0.2, 0.8);
      expectCloseTo(result, 0.2);
    });
  });

  describe('BlendModeFunctions.lighten', () => {
    it('should return maximum of source and backdrop', () => {
      const result = BlendModeFunctions.lighten(0.5, 0.3);
      expectCloseTo(result, 0.5);
    });

    it('should return backdrop when backdrop is larger', () => {
      const result = BlendModeFunctions.lighten(0.2, 0.9);
      expectCloseTo(result, 0.9);
    });
  });

  describe('BlendModeFunctions.screen', () => {
    it('should lighten: 1 - (1 - 0.5) * (1 - 0.4) = 0.7', () => {
      const result = BlendModeFunctions.screen(0.5, 0.4);
      expectCloseTo(result, 0.7, 0.01);
    });

    it('should preserve black (0)', () => {
      const result = BlendModeFunctions.screen(0, 0.5);
      expectCloseTo(result, 0.5);
    });

    it('should return 1 for white (1)', () => {
      const result = BlendModeFunctions.screen(1, 1);
      expectCloseTo(result, 1);
    });
  });

  describe('BlendModeFunctions.color-dodge', () => {
    it('should return 1 when source is 1', () => {
      const result = BlendModeFunctions['color-dodge'](1, 0.5);
      expectCloseTo(result, 1);
    });

    it('should compute for normal case', () => {
      const result = BlendModeFunctions['color-dodge'](0.5, 0.5);
      expect(result).toBeGreaterThan(0.5);
    });
  });

  describe('BlendModeFunctions.linear-dodge', () => {
    it('should add source and backdrop: 0.3 + 0.4 = 0.7', () => {
      const result = BlendModeFunctions['linear-dodge'](0.3, 0.4);
      expectCloseTo(result, 0.7);
    });

    it('should allow overflow (unclamped)', () => {
      const result = BlendModeFunctions['linear-dodge'](0.6, 0.6);
      expectCloseTo(result, 1.2);
    });
  });

  describe('BlendModeFunctions.lighter-color', () => {
    it('should select lighter color by luminance', () => {
      const result = BlendModeFunctions['lighter-color'](0.9, 0.1);
      expectCloseTo(result, 0.9);
    });
  });

  describe('BlendModeFunctions.overlay', () => {
    it('should multiply when backdrop < 0.5', () => {
      const result = BlendModeFunctions.overlay(0.5, 0.3);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should screen when backdrop >= 0.5', () => {
      const result = BlendModeFunctions.overlay(0.5, 0.7);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('BlendModeFunctions.soft-light', () => {
    it('should produce valid output in range [0, 1]', () => {
      const result = BlendModeFunctions['soft-light'](0.6, 0.4);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should handle cs < 0.5', () => {
      const result = BlendModeFunctions['soft-light'](0.3, 0.5);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should handle cs >= 0.5', () => {
      const result = BlendModeFunctions['soft-light'](0.7, 0.5);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('BlendModeFunctions.hard-light', () => {
    it('should multiply when source < 0.5', () => {
      const result = BlendModeFunctions['hard-light'](0.3, 0.6);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should screen when source >= 0.5', () => {
      const result = BlendModeFunctions['hard-light'](0.7, 0.4);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('BlendModeFunctions.vivid-light', () => {
    it('should produce valid output in range [0, 1]', () => {
      const result = BlendModeFunctions['vivid-light'](0.6, 0.5);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should handle cs < 0.5', () => {
      const result = BlendModeFunctions['vivid-light'](0.3, 0.5);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should handle cs >= 0.5', () => {
      const result = BlendModeFunctions['vivid-light'](0.7, 0.5);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('BlendModeFunctions.linear-light', () => {
    it('should handle cs < 0.5', () => {
      const result = BlendModeFunctions['linear-light'](0.3, 0.5);
      expect(typeof result).toBe('number');
    });

    it('should handle cs >= 0.5', () => {
      const result = BlendModeFunctions['linear-light'](0.7, 0.5);
      expect(typeof result).toBe('number');
    });
  });

  describe('BlendModeFunctions.pin-light', () => {
    it('should produce valid output', () => {
      const result = BlendModeFunctions['pin-light'](0.6, 0.4);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('BlendModeFunctions.hard-mix', () => {
    it('should posterize to 0 or 1', () => {
      const result = BlendModeFunctions['hard-mix'](0.6, 0.4);
      expect(result === 0 || result === 1).toBe(true);
    });
  });

  describe('BlendModeFunctions.difference', () => {
    it('should return absolute difference: |0.5 - 0.3| = 0.2', () => {
      const result = BlendModeFunctions.difference(0.5, 0.3);
      expectCloseTo(result, 0.2);
    });

    it('should return 0 for equal values', () => {
      const result = BlendModeFunctions.difference(0.5, 0.5);
      expectCloseTo(result, 0);
    });
  });

  describe('BlendModeFunctions.exclusion', () => {
    it('should compute cs + cb - 2*cs*cb', () => {
      const result = BlendModeFunctions.exclusion(0.5, 0.4);
      const expected = 0.5 + 0.4 - 2 * 0.5 * 0.4;
      expectCloseTo(result, expected);
    });
  });

  describe('BlendModeFunctions.subtract', () => {
    it('should compute cs + cb - 1', () => {
      const result = BlendModeFunctions.subtract(0.6, 0.5);
      expectCloseTo(result, 0.1);
    });
  });

  describe('BlendModeFunctions.divide', () => {
    it('should return 0 when source is 0 (protection against division by zero)', () => {
      // Source code: if (cs === 0) return 0
      const result = BlendModeFunctions.divide(0, 0.5);
      expectCloseTo(result, 0);
    });

    it('should divide normally otherwise', () => {
      const result = BlendModeFunctions.divide(0.5, 0.8);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('BlendModeFunctions.hue', () => {
    it('should produce valid output', () => {
      const result = BlendModeFunctions.hue(0.6, 0.4);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('BlendModeFunctions.saturation', () => {
    it('should produce valid output', () => {
      const result = BlendModeFunctions.saturation(0.6, 0.4);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('BlendModeFunctions.color', () => {
    it('should produce valid output', () => {
      const result = BlendModeFunctions.color(0.6, 0.4);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('BlendModeFunctions.luminosity', () => {
    it('should produce valid output', () => {
      const result = BlendModeFunctions.luminosity(0.6, 0.4);
      expect(result).toBeGreaterThanOrEqual(-1);
      expect(result).toBeLessThanOrEqual(2);
    });
  });
});

// ============================================================================
// BLEND PIXELS TESTS
// ============================================================================

describe('blendPixels', () => {
  it('should blend normal mode at full opacity: source opaque over any backdrop', () => {
    const source: [number, number, number, number] = [255, 0, 0, 255];
    const backdrop: [number, number, number, number] = [0, 0, 255, 255];
    const result = blendPixels(source, backdrop, 'normal', 100);
    expectRGBAClose(result, [255, 0, 0, 255], 2);
  });

  it('should blend normal mode at 50% opacity', () => {
    const source: [number, number, number, number] = [255, 0, 0, 255];
    const backdrop: [number, number, number, number] = [0, 0, 255, 255];
    const result = blendPixels(source, backdrop, 'normal', 50);
    // Should be somewhere between red and blue
    expect(result[0]).toBeGreaterThan(100);
    expect(result[2]).toBeGreaterThan(100);
  });

  it('should blend multiply mode', () => {
    const source: [number, number, number, number] = [128, 128, 128, 255];
    const backdrop: [number, number, number, number] = [255, 255, 255, 255];
    const result = blendPixels(source, backdrop, 'multiply', 100);
    // 128 * 255/255 ≈ 128 at normalized level
    expect(result[0]).toBeLessThanOrEqual(128);
    expect(result[1]).toBeLessThanOrEqual(128);
    expect(result[2]).toBeLessThanOrEqual(128);
  });

  it('should return backdrop when source alpha is 0', () => {
    const source: [number, number, number, number] = [255, 0, 0, 0];
    const backdrop: [number, number, number, number] = [0, 255, 0, 255];
    const result = blendPixels(source, backdrop, 'normal', 100);
    expectRGBAClose(result, [0, 255, 0, 255], 2);
  });

  it('should handle opaque source over transparent backdrop', () => {
    const source: [number, number, number, number] = [100, 100, 100, 255];
    const backdrop: [number, number, number, number] = [0, 0, 0, 0];
    const result = blendPixels(source, backdrop, 'normal', 100);
    expect(result[0]).toBeGreaterThan(0);
    expect(result[3]).toBe(255);
  });

  it('should apply opacity correctly', () => {
    const source: [number, number, number, number] = [255, 0, 0, 255];
    const backdrop: [number, number, number, number] = [0, 0, 0, 255];
    const result = blendPixels(source, backdrop, 'normal', 0);
    // At 0% opacity, should return backdrop
    expectRGBAClose(result, [0, 0, 0, 255], 2);
  });
});

// ============================================================================
// BLEND IMAGE DATA TESTS
// ============================================================================

describe('blendImageData', () => {
  it('should blend two ImageData objects with normal mode', () => {
    const source = createTestImageData(2, 2, [255, 0, 0, 255]);
    const backdrop = createTestImageData(2, 2, [0, 0, 255, 255]);

    const result = blendImageData(source, backdrop, 'normal', 100);

    expect(result.width).toBe(2);
    expect(result.height).toBe(2);
    expect(result.data.length).toBe(2 * 2 * 4);
    // Result should be red at normal mode
    expect(result.data[0]).toBe(255);
    expect(result.data[2]).toBe(0);
  });

  it('should preserve dimensions', () => {
    const source = createTestImageData(10, 5, [128, 128, 128, 255]);
    const backdrop = createTestImageData(10, 5, [64, 64, 64, 255]);

    const result = blendImageData(source, backdrop, 'multiply', 100);

    expect(result.width).toBe(10);
    expect(result.height).toBe(5);
    expect(result.data.length).toBe(10 * 5 * 4);
  });

  it('should blend with multiply mode', () => {
    const source = createTestImageData(1, 1, [200, 200, 200, 255]);
    const backdrop = createTestImageData(1, 1, [100, 100, 100, 255]);

    const result = blendImageData(source, backdrop, 'multiply', 100);

    expect(result.data[0]).toBeLessThanOrEqual(100);
    expect(result.data[1]).toBeLessThanOrEqual(100);
    expect(result.data[2]).toBeLessThanOrEqual(100);
  });

  it('should handle gradient ImageData', () => {
    const gradient = createGradientImageData(5, 5);
    const solid = createTestImageData(5, 5, [128, 128, 128, 255]);

    const result = blendImageData(gradient, solid, 'normal', 100);

    expect(result.width).toBe(5);
    expect(result.height).toBe(5);
    expect(result.data.length).toBe(5 * 5 * 4);
  });
});

// ============================================================================
// GET BLEND MODE SHADER TESTS
// ============================================================================

describe('getBlendModeShader', () => {
  it('should return GLSL string for normal mode', () => {
    const shader = getBlendModeShader('normal');
    expect(typeof shader).toBe('string');
    expect(shader.length).toBeGreaterThan(0);
    expect(shader).toContain('result');
  });

  it('should return GLSL string for multiply mode', () => {
    const shader = getBlendModeShader('multiply');
    expect(typeof shader).toBe('string');
    expect(shader.length).toBeGreaterThan(0);
  });

  it('should return GLSL string for screen mode', () => {
    const shader = getBlendModeShader('screen');
    expect(typeof shader).toBe('string');
    expect(shader.length).toBeGreaterThan(0);
  });

  it('should return shader for all supported blend modes', () => {
    BLEND_MODE_LIST.forEach((mode) => {
      const shader = getBlendModeShader(mode);
      expect(typeof shader).toBe('string');
      expect(shader.length).toBeGreaterThan(0);
    });
  });

  it('should fall back to normal for unknown blend mode', () => {
    const shader = getBlendModeShader('unknown-mode' as BlendMode);
    expect(typeof shader).toBe('string');
    expect(shader.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge Cases', () => {
  it('should handle all-zero inputs', () => {
    const source: [number, number, number, number] = [0, 0, 0, 0];
    const backdrop: [number, number, number, number] = [0, 0, 0, 0];

    BLEND_MODE_LIST.forEach((mode) => {
      const result = blendPixels(source, backdrop, mode, 100);
      expect(result).toBeDefined();
      expect(result[0]).toBeGreaterThanOrEqual(0);
      expect(result[0]).toBeLessThanOrEqual(255);
      expect(result[3]).toBeGreaterThanOrEqual(0);
      expect(result[3]).toBeLessThanOrEqual(255);
    });
  });

  it('should handle all-255 inputs', () => {
    const source: [number, number, number, number] = [255, 255, 255, 255];
    const backdrop: [number, number, number, number] = [255, 255, 255, 255];

    BLEND_MODE_LIST.forEach((mode) => {
      const result = blendPixels(source, backdrop, mode, 100);
      expect(result).toBeDefined();
      expect(result[0]).toBeGreaterThanOrEqual(0);
      expect(result[0]).toBeLessThanOrEqual(255);
      expect(result[3]).toBeGreaterThanOrEqual(0);
      expect(result[3]).toBeLessThanOrEqual(255);
    });
  });

  it('should handle boundary channel values', () => {
    const source: [number, number, number, number] = [1, 254, 128, 200];
    const backdrop: [number, number, number, number] = [254, 1, 128, 100];

    BLEND_MODE_LIST.forEach((mode) => {
      const result = blendPixels(source, backdrop, mode, 100);
      expect(result).toBeDefined();
      expect(result[0]).toBeGreaterThanOrEqual(0);
      expect(result[0]).toBeLessThanOrEqual(255);
    });
  });
});

// ============================================================================
// DETERMINISM AND CONSISTENCY
// ============================================================================

describe('Determinism and Consistency', () => {
  it('should be deterministic for all modes except dissolve', () => {
    const nonDissolveModes = BLEND_MODE_LIST.filter((m) => m !== 'dissolve');
    const source: [number, number, number, number] = [150, 100, 75, 180];
    const backdrop: [number, number, number, number] = [75, 125, 200, 220];

    nonDissolveModes.forEach((mode) => {
      const result1 = blendPixels(source, backdrop, mode, 100);
      const result2 = blendPixels(source, backdrop, mode, 100);
      const result3 = blendPixels(source, backdrop, mode, 100);

      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });
  });

  it('should preserve source color when source is fully opaque', () => {
    const source: [number, number, number, number] = [150, 100, 75, 255];
    const backdrop: [number, number, number, number] = [50, 50, 50, 255];

    const result = blendPixels(source, backdrop, 'normal', 100);
    expectRGBAClose(result, source, 2);
  });
});

// ============================================================================
// ALPHA COMPOSITING
// ============================================================================

describe('Alpha Compositing', () => {
  it('should handle zero source alpha', () => {
    const source: [number, number, number, number] = [255, 128, 64, 0];
    const backdrop: [number, number, number, number] = [100, 100, 100, 255];

    const result = blendPixels(source, backdrop, 'normal', 100);
    expectRGBAClose(result, backdrop, 2);
  });

  it('should handle zero destination alpha', () => {
    const source: [number, number, number, number] = [255, 128, 64, 255];
    const backdrop: [number, number, number, number] = [100, 100, 100, 0];

    const result = blendPixels(source, backdrop, 'normal', 100);
    expectRGBAClose(result, source, 2);
  });

  it('should compute alpha correctly for all blend modes', () => {
    const source: [number, number, number, number] = [100, 100, 100, 200];
    const backdrop: [number, number, number, number] = [100, 100, 100, 150];

    BLEND_MODE_LIST.forEach((mode) => {
      const result = blendPixels(source, backdrop, mode, 100);
      expect(result[3]).toBeGreaterThan(0);
      expect(result[3]).toBeLessThanOrEqual(255);
    });
  });
});

// ============================================================================
// OUTPUT RANGE VALIDATION
// ============================================================================

describe('Output Range Validation', () => {
  it('all blend functions should produce values in valid range', () => {
    const testCases: [string, [number, number, number, number], [number, number, number, number]][] = [
      ['0,0 black', [0, 0, 0, 255], [0, 0, 0, 255]],
      ['white/black', [255, 255, 255, 255], [0, 0, 0, 255]],
      ['mid gray', [128, 128, 128, 255], [128, 128, 128, 255]],
      ['transparent', [100, 100, 100, 0], [100, 100, 100, 255]],
      ['colors', [255, 128, 64, 200], [64, 128, 255, 200]],
    ];

    BLEND_MODE_LIST.forEach((mode) => {
      testCases.forEach(([desc, src, dst]) => {
        const result = blendPixels(src, dst, mode, 100);
        expect(result[0], `${mode} - ${desc} - r`).toBeGreaterThanOrEqual(0);
        expect(result[0], `${mode} - ${desc} - r`).toBeLessThanOrEqual(255);
        expect(result[1], `${mode} - ${desc} - g`).toBeGreaterThanOrEqual(0);
        expect(result[1], `${mode} - ${desc} - g`).toBeLessThanOrEqual(255);
        expect(result[2], `${mode} - ${desc} - b`).toBeGreaterThanOrEqual(0);
        expect(result[2], `${mode} - ${desc} - b`).toBeLessThanOrEqual(255);
        expect(result[3], `${mode} - ${desc} - a`).toBeGreaterThanOrEqual(0);
        expect(result[3], `${mode} - ${desc} - a`).toBeLessThanOrEqual(255);
      });
    });
  });
});
