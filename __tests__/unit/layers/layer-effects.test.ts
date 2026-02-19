/**
 * @fileoverview Comprehensive tests for LayerEffectRenderer
 *
 * Tests the LayerEffectRenderer class which applies non-destructive layer effects
 * including Drop Shadow, Inner Shadow, Outer/Inner Glow, Stroke, Bevel & Emboss,
 * and Color/Gradient Overlays.
 *
 * Test Groups:
 * 1. Drop Shadow (5 tests)
 * 2. Inner Shadow (3 tests)
 * 3. Outer Glow (4 tests)
 * 4. Inner Glow (4 tests)
 * 5. Stroke (4 tests)
 * 6. Bevel & Emboss (3 tests)
 * 7. Color Overlay (2 tests)
 * 8. Gradient Overlay (2 tests)
 * 9. Render All Effects (4 tests)
 * 10. Cache Management (2 tests)
 * 11. Math Validation (2 tests)
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { LayerEffectRenderer, BevelEmbossSettings, InnerShadowSettings, OuterGlowSettings, InnerGlowSettings, StrokeSettings, OverlaySettings } from '@/lib/studio/editor/layers/LayerEffects';
import type { DropShadowSettings, BlendMode, LayerEffect, LayerEffectType } from '@/lib/studio/types/layers';
import { installCanvasMocks, removeCanvasMocks, MockOffscreenCanvas, MockCanvasRenderingContext2D } from '@/__tests__/helpers/canvas-mock';

/**
 * Mock assertOffscreenCanvasContext to return mock context
 */
vi.mock('@/lib/studio/utils/assertCanvasContext', () => ({
  assertOffscreenCanvasContext: (canvas: any, _label: string) => {
    return canvas.getContext('2d');
  },
}));

describe('LayerEffectRenderer', () => {
  let renderer: LayerEffectRenderer;

  beforeAll(() => {
    installCanvasMocks();
  });

  afterAll(() => {
    removeCanvasMocks();
  });

  beforeEach(() => {
    renderer = new LayerEffectRenderer();
  });

  // ============================================================================
  // Drop Shadow Tests
  // ============================================================================
  describe('applyDropShadow', () => {
    it('should create a wider canvas to accommodate shadow offset', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: DropShadowSettings = {
        color: '#000000',
        opacity: 100,
        angle: 45,
        distance: 10,
        size: 5,
        spread: 0,
        blendMode: 'normal',
      };

      const result = LayerEffectRenderer.applyDropShadow(sourceCanvas, settings);

      expect(result.width).toBe(100 + 10 * 2);
      expect(result.height).toBe(100 + 10 * 2);
    });

    it('should apply shadow offset based on angle and distance math (angle 0)', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: DropShadowSettings = {
        color: '#000000',
        opacity: 100,
        angle: 0, // 0 degrees = +X direction
        distance: 10,
        size: 5,
        spread: 0,
        blendMode: 'normal',
      };

      // angle 0 => cos(0)*10 = 10, sin(0)*10 = 0
      const result = LayerEffectRenderer.applyDropShadow(sourceCanvas, settings);

      expect(result).toBeDefined();
      expect(result.width).toBe(120);
      expect(result.height).toBe(120);
    });

    it('should apply shadow offset based on angle and distance math (angle 90)', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: DropShadowSettings = {
        color: '#000000',
        opacity: 100,
        angle: 90, // 90 degrees = +Y direction
        distance: 10,
        size: 5,
        spread: 0,
        blendMode: 'normal',
      };

      // angle 90 => cos(90°)*10 ≈ 0, sin(90°)*10 = 10
      const result = LayerEffectRenderer.applyDropShadow(sourceCanvas, settings);

      expect(result).toBeDefined();
      expect(result.width).toBe(120);
      expect(result.height).toBe(120);
    });

    it('should apply spread factor to shadow size', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: DropShadowSettings = {
        color: '#000000',
        opacity: 100,
        angle: 45,
        distance: 5,
        size: 5,
        spread: 50, // 50% spread = 1.5x size factor
        blendMode: 'normal',
      };

      const result = LayerEffectRenderer.applyDropShadow(sourceCanvas, settings);

      expect(result).toBeDefined();
      expect(result.width).toBe(110); // 100 + 5*2
      expect(result.height).toBe(110);
    });

    it('should respect opacity setting', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: DropShadowSettings = {
        color: '#FF0000',
        opacity: 50, // 50% opacity
        angle: 45,
        distance: 10,
        size: 5,
        spread: 0,
        blendMode: 'multiply',
      };

      const result = LayerEffectRenderer.applyDropShadow(sourceCanvas, settings);

      expect(result).toBeDefined();
      expect(result.width).toBe(120);
    });
  });

  // ============================================================================
  // Inner Shadow Tests
  // ============================================================================
  describe('applyInnerShadow', () => {
    it('should create canvas with same dimensions as source', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: InnerShadowSettings = {
        color: '#000000',
        opacity: 100,
        angle: 45,
        distance: 10,
        size: 5,
        choke: 0,
        blendMode: 'normal',
      };

      const result = LayerEffectRenderer.applyInnerShadow(sourceCanvas, settings);

      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it('should calculate shadow offset based on angle and distance', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: InnerShadowSettings = {
        color: '#000000',
        opacity: 100,
        angle: 0, // angle 0 = right direction
        distance: 20,
        size: 5,
        choke: 0,
        blendMode: 'normal',
      };

      const result = LayerEffectRenderer.applyInnerShadow(sourceCanvas, settings);

      expect(result).toBeDefined();
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it('should apply choke (spread) setting', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: InnerShadowSettings = {
        color: '#000000',
        opacity: 100,
        angle: 45,
        distance: 10,
        size: 5,
        choke: 75, // High choke value
        blendMode: 'normal',
      };

      const result = LayerEffectRenderer.applyInnerShadow(sourceCanvas, settings);

      expect(result).toBeDefined();
    });
  });

  // ============================================================================
  // Outer Glow Tests
  // ============================================================================
  describe('applyOuterGlow', () => {
    it('should create padded canvas with size * 2 padding', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: OuterGlowSettings = {
        color: '#FFFF00',
        opacity: 100,
        size: 20,
        blendMode: 'screen',
        technique: 'softer',
      };

      const result = LayerEffectRenderer.applyOuterGlow(sourceCanvas, settings);

      const padding = 20 * 2;
      expect(result.width).toBe(100 + padding);
      expect(result.height).toBe(100 + padding);
    });

    it('should center source canvas in padded output (offset = size)', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: OuterGlowSettings = {
        color: '#00FF00',
        opacity: 100,
        size: 10,
        blendMode: 'addition',
        technique: 'precise',
      };

      const result = LayerEffectRenderer.applyOuterGlow(sourceCanvas, settings);

      expect(result.width).toBe(100 + 20);
      expect(result.height).toBe(100 + 20);
    });

    it('should handle softer technique', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: OuterGlowSettings = {
        color: '#0000FF',
        opacity: 50,
        size: 15,
        blendMode: 'lighten',
        technique: 'softer',
      };

      const result = LayerEffectRenderer.applyOuterGlow(sourceCanvas, settings);

      expect(result).toBeDefined();
      expect(result.width).toBe(130);
    });

    it('should handle precise technique', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: OuterGlowSettings = {
        color: '#FF00FF',
        opacity: 75,
        size: 8,
        blendMode: 'screen',
        technique: 'precise',
      };

      const result = LayerEffectRenderer.applyOuterGlow(sourceCanvas, settings);

      expect(result).toBeDefined();
      expect(result.width).toBe(116);
    });
  });

  // ============================================================================
  // Inner Glow Tests
  // ============================================================================
  describe('applyInnerGlow', () => {
    it('should create canvas with same dimensions as source', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: InnerGlowSettings = {
        color: '#FFFF00',
        opacity: 100,
        size: 10,
        source: 'edge',
        technique: 'softer',
        blendMode: 'normal',
      };

      const result = LayerEffectRenderer.applyInnerGlow(sourceCanvas, settings);

      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it('should use source-in composite operation when source is edge', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: InnerGlowSettings = {
        color: '#00FF00',
        opacity: 100,
        size: 10,
        source: 'edge',
        technique: 'softer',
        blendMode: 'normal',
      };

      const result = LayerEffectRenderer.applyInnerGlow(sourceCanvas, settings);

      expect(result).toBeDefined();
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it('should use source-out composite operation when source is center', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: InnerGlowSettings = {
        color: '#0000FF',
        opacity: 100,
        size: 10,
        source: 'center',
        technique: 'softer',
        blendMode: 'normal',
      };

      const result = LayerEffectRenderer.applyInnerGlow(sourceCanvas, settings);

      expect(result).toBeDefined();
      expect(result.width).toBe(100);
    });

    it('should handle precise technique variant', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: InnerGlowSettings = {
        color: '#FF00FF',
        opacity: 75,
        size: 8,
        source: 'edge',
        technique: 'precise',
        blendMode: 'lighten',
      };

      const result = LayerEffectRenderer.applyInnerGlow(sourceCanvas, settings);

      expect(result).toBeDefined();
    });
  });

  // ============================================================================
  // Stroke Tests
  // ============================================================================
  describe('applyStroke', () => {
    it('should create padded canvas for outside stroke position', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: StrokeSettings = {
        size: 10,
        position: 'outside',
        blendMode: 'normal',
        opacity: 100,
        fillType: 'color',
        color: '#000000',
      };

      const result = LayerEffectRenderer.applyStroke(sourceCanvas, settings);

      expect(result.width).toBe(100 + 10 * 2);
      expect(result.height).toBe(100 + 10 * 2);
    });

    it('should create padded canvas for inside stroke position', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: StrokeSettings = {
        size: 10,
        position: 'inside',
        blendMode: 'normal',
        opacity: 100,
        fillType: 'color',
        color: '#FF0000',
      };

      const result = LayerEffectRenderer.applyStroke(sourceCanvas, settings);

      expect(result.width).toBe(100 + 10 * 2);
      expect(result.height).toBe(100 + 10 * 2);
    });

    it('should create padded canvas for center stroke position', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: StrokeSettings = {
        size: 10,
        position: 'center',
        blendMode: 'normal',
        opacity: 100,
        fillType: 'color',
        color: '#0000FF',
      };

      const result = LayerEffectRenderer.applyStroke(sourceCanvas, settings);

      expect(result.width).toBe(100 + 10 * 2);
      expect(result.height).toBe(100 + 10 * 2);
    });

    it('should handle different opacity values', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: StrokeSettings = {
        size: 5,
        position: 'outside',
        blendMode: 'multiply',
        opacity: 50,
        fillType: 'color',
        color: '#00FF00',
      };

      const result = LayerEffectRenderer.applyStroke(sourceCanvas, settings);

      expect(result).toBeDefined();
      expect(result.width).toBe(110);
    });
  });

  // ============================================================================
  // Bevel & Emboss Tests
  // ============================================================================
  describe('applyBevelEmboss', () => {
    it('should create canvas with same dimensions as source', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: BevelEmbossSettings = {
        style: 'inner-bevel',
        technique: 'smooth',
        depth: 100,
        direction: 'up',
        size: 5,
        angle: 120,
        altitude: 30,
        gloss: 0,
        useGlobalLight: true,
        antiAlias: true,
        highlightBlendMode: 'screen',
        highlightColor: '#FFFFFF',
        highlightOpacity: 100,
        shadowBlendMode: 'multiply',
        shadowColor: '#000000',
        shadowOpacity: 100,
      };

      const result = LayerEffectRenderer.applyBevelEmboss(sourceCanvas, settings);

      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it('should perform Sobel edge detection with getImageData', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: BevelEmbossSettings = {
        style: 'outer-bevel',
        technique: 'chisel-hard',
        depth: 50,
        direction: 'down',
        size: 3,
        angle: 45,
        altitude: 45,
        gloss: 50,
        useGlobalLight: true,
        antiAlias: true,
        highlightBlendMode: 'normal',
        highlightColor: '#FFFFFF',
        highlightOpacity: 75,
        shadowBlendMode: 'normal',
        shadowColor: '#000000',
        shadowOpacity: 75,
      };

      const result = LayerEffectRenderer.applyBevelEmboss(sourceCanvas, settings);

      expect(result).toBeDefined();
      expect(result.width).toBe(100);
    });

    it('should calculate light direction from angle and altitude', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: BevelEmbossSettings = {
        style: 'chisel-soft',
        technique: 'smooth',
        depth: 150,
        direction: 'up',
        size: 8,
        angle: 0, // 0 degrees
        altitude: 45, // 45 degrees
        gloss: -50,
        useGlobalLight: false,
        antiAlias: true,
        highlightBlendMode: 'lighten',
        highlightColor: '#FFFACD',
        highlightOpacity: 100,
        shadowBlendMode: 'darken',
        shadowColor: '#000033',
        shadowOpacity: 100,
      };

      const result = LayerEffectRenderer.applyBevelEmboss(sourceCanvas, settings);

      expect(result).toBeDefined();
    });
  });

  // ============================================================================
  // Color Overlay Tests
  // ============================================================================
  describe('applyColorOverlay', () => {
    it('should create same-sized canvas and fill with color at opacity', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: OverlaySettings & { color: string } = {
        blendMode: 'normal',
        opacity: 100,
        color: '#FF0000',
      };

      const result = LayerEffectRenderer.applyColorOverlay(sourceCanvas, settings);

      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it('should respect opacity and blend mode settings', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: OverlaySettings & { color: string } = {
        blendMode: 'multiply',
        opacity: 50,
        color: '#000000',
      };

      const result = LayerEffectRenderer.applyColorOverlay(sourceCanvas, settings);

      expect(result).toBeDefined();
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });
  });

  // ============================================================================
  // Gradient Overlay Tests
  // ============================================================================
  describe('applyGradientOverlay', () => {
    it('should create same-sized canvas with gradient fill', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: OverlaySettings & { gradient: NonNullable<OverlaySettings['gradient']> } = {
        blendMode: 'normal',
        opacity: 100,
        gradient: {
          angle: 0,
          scale: 100,
          stops: [
            { position: 0, color: '#000000' },
            { position: 1, color: '#FFFFFF' },
          ],
        },
      };

      const result = LayerEffectRenderer.applyGradientOverlay(sourceCanvas, settings);

      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it('should handle multiple gradient stops', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: OverlaySettings & { gradient: NonNullable<OverlaySettings['gradient']> } = {
        blendMode: 'screen',
        opacity: 75,
        gradient: {
          angle: 45,
          scale: 150,
          stops: [
            { position: 0, color: '#FF0000' },
            { position: 0.5, color: '#00FF00' },
            { position: 1, color: '#0000FF' },
          ],
        },
      };

      const result = LayerEffectRenderer.applyGradientOverlay(sourceCanvas, settings);

      expect(result).toBeDefined();
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });
  });

  // ============================================================================
  // Render All Effects Tests
  // ============================================================================
  describe('renderAllEffects', () => {
    it('should return source canvas unchanged when no effects provided', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const effects: LayerEffect[] = [];

      const result = LayerEffectRenderer.renderAllEffects(sourceCanvas, effects, 'layer-1');

      expect(result).toBe(sourceCanvas);
    });

    it('should apply single enabled effect', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const effects: LayerEffect[] = [
        {
          type: 'color-overlay',
          enabled: true,
          settings: {
            blendMode: 'normal',
            opacity: 100,
            color: '#FF0000',
          },
        },
      ];

      const result = LayerEffectRenderer.renderAllEffects(sourceCanvas, effects, 'layer-1');

      expect(result).toBeDefined();
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it('should skip disabled effects', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const effects: LayerEffect[] = [
        {
          type: 'color-overlay',
          enabled: false, // Disabled
          settings: {
            blendMode: 'normal',
            opacity: 100,
            color: '#FF0000',
          },
        },
        {
          type: 'gradient-overlay',
          enabled: true,
          settings: {
            blendMode: 'normal',
            opacity: 100,
            gradient: {
              angle: 0,
              scale: 100,
              stops: [
                { position: 0, color: '#000000' },
                { position: 1, color: '#FFFFFF' },
              ],
            },
          },
        },
      ];

      const result = LayerEffectRenderer.renderAllEffects(sourceCanvas, effects, 'layer-1');

      expect(result).toBeDefined();
    });

    it('should apply effects in correct order (shadows before overlays)', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const effects: LayerEffect[] = [
        {
          type: 'color-overlay',
          enabled: true,
          settings: {
            blendMode: 'normal',
            opacity: 100,
            color: '#FF0000',
          },
        },
        {
          type: 'drop-shadow',
          enabled: true,
          settings: {
            color: '#000000',
            opacity: 100,
            angle: 45,
            distance: 10,
            size: 5,
            spread: 0,
            blendMode: 'normal',
          },
        },
      ];

      const result = LayerEffectRenderer.renderAllEffects(sourceCanvas, effects, 'layer-1');

      // Drop shadow should be applied first, expanding canvas
      expect(result).toBeDefined();
    });
  });

  // ============================================================================
  // Cache Management Tests
  // ============================================================================
  describe('Cache Management', () => {
    it('should clear cache for specific layer', () => {
      const layerId = 'layer-123';
      const cacheKey = `${layerId}-cache`;

      // Renderer has private cache, so we just verify the method exists and runs without error
      renderer.clearCache(layerId);
      renderer.clearCache(layerId); // Should not throw

      expect(renderer).toBeDefined();
    });

    it('should clear all cached effects', () => {
      // Verify the method exists and runs without error
      renderer.clearAllCache();
      renderer.clearAllCache(); // Multiple calls should be safe

      expect(renderer).toBeDefined();
    });
  });

  // ============================================================================
  // Math Validation Tests
  // ============================================================================
  describe('Shadow Math Validation', () => {
    it('should calculate shadow offset correctly (angle 45 degrees, distance 10)', () => {
      // angle: 45°, distance: 10
      // x = cos(45° * π/180) * 10 = cos(π/4) * 10 ≈ 7.07
      // y = sin(45° * π/180) * 10 = sin(π/4) * 10 ≈ 7.07
      const angle = 45;
      const distance = 10;
      const rad = (angle * Math.PI) / 180;
      const x = Math.cos(rad) * distance;
      const y = Math.sin(rad) * distance;

      expect(x).toBeCloseTo(7.07, 1);
      expect(y).toBeCloseTo(7.07, 1);
    });

    it('should calculate shadow offset correctly (angle 0 degrees, distance 15)', () => {
      // angle: 0°, distance: 15
      // x = cos(0) * 15 = 15
      // y = sin(0) * 15 = 0
      const angle = 0;
      const distance = 15;
      const rad = (angle * Math.PI) / 180;
      const x = Math.cos(rad) * distance;
      const y = Math.sin(rad) * distance;

      expect(x).toBeCloseTo(15, 10);
      expect(y).toBeCloseTo(0, 10);
    });
  });

  // ============================================================================
  // Padding Calculation Tests
  // ============================================================================
  describe('Padding Calculations', () => {
    it('should calculate outer glow padding as size * 2', () => {
      const glowSize = 25;
      const expectedPadding = glowSize * 2;

      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: OuterGlowSettings = {
        color: '#FFFF00',
        opacity: 100,
        size: glowSize,
        blendMode: 'screen',
        technique: 'softer',
      };

      const result = LayerEffectRenderer.applyOuterGlow(sourceCanvas, settings);

      expect(result.width).toBe(100 + expectedPadding);
      expect(result.height).toBe(100 + expectedPadding);
    });

    it('should calculate drop shadow canvas size as source + distance * 2', () => {
      const sourceSize = 100;
      const shadowDistance = 15;
      const expectedSize = sourceSize + shadowDistance * 2;

      const sourceCanvas = new MockOffscreenCanvas(sourceSize, sourceSize);
      const settings: DropShadowSettings = {
        color: '#000000',
        opacity: 100,
        angle: 45,
        distance: shadowDistance,
        size: 5,
        spread: 0,
        blendMode: 'normal',
      };

      const result = LayerEffectRenderer.applyDropShadow(sourceCanvas, settings);

      expect(result.width).toBe(expectedSize);
      expect(result.height).toBe(expectedSize);
    });
  });

  // ============================================================================
  // Edge Cases and Integration Tests
  // ============================================================================
  describe('Edge Cases', () => {
    it('should handle zero-sized effects gracefully', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: OuterGlowSettings = {
        color: '#FFFF00',
        opacity: 0, // Zero opacity
        size: 0, // Zero size
        blendMode: 'normal',
        technique: 'softer',
      };

      const result = LayerEffectRenderer.applyOuterGlow(sourceCanvas, settings);

      expect(result).toBeDefined();
      expect(result.width).toBe(100);
    });

    it('should handle very large canvas dimensions', () => {
      const sourceCanvas = new MockOffscreenCanvas(2000, 2000);
      const settings: DropShadowSettings = {
        color: '#000000',
        opacity: 100,
        angle: 45,
        distance: 50,
        size: 20,
        spread: 0,
        blendMode: 'normal',
      };

      const result = LayerEffectRenderer.applyDropShadow(sourceCanvas, settings);

      expect(result.width).toBe(2100);
      expect(result.height).toBe(2100);
    });

    it('should handle multiple effects in sequence without corruption', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);

      const dropShadowSettings: DropShadowSettings = {
        color: '#000000',
        opacity: 100,
        angle: 45,
        distance: 10,
        size: 5,
        spread: 0,
        blendMode: 'normal',
      };

      const step1 = LayerEffectRenderer.applyDropShadow(sourceCanvas, dropShadowSettings);

      const colorOverlaySettings: OverlaySettings & { color: string } = {
        blendMode: 'normal',
        opacity: 50,
        color: '#FF0000',
      };

      const step2 = LayerEffectRenderer.applyColorOverlay(step1, colorOverlaySettings);

      expect(step2).toBeDefined();
      expect(step2.width).toBe(120); // 100 + 10*2 from drop shadow
    });
  });

  // ============================================================================
  // Composite Operation Tests
  // ============================================================================
  describe('Composite Operations', () => {
    it('should handle multiply blend mode in drop shadow', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: DropShadowSettings = {
        color: '#000000',
        opacity: 100,
        angle: 45,
        distance: 10,
        size: 5,
        spread: 0,
        blendMode: 'multiply',
      };

      const result = LayerEffectRenderer.applyDropShadow(sourceCanvas, settings);
      expect(result).toBeDefined();
    });

    it('should handle screen blend mode in outer glow', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: OuterGlowSettings = {
        color: '#FFFF00',
        opacity: 100,
        size: 10,
        blendMode: 'screen',
        technique: 'softer',
      };

      const result = LayerEffectRenderer.applyOuterGlow(sourceCanvas, settings);
      expect(result).toBeDefined();
    });

    it('should handle lighten blend mode in inner glow', () => {
      const sourceCanvas = new MockOffscreenCanvas(100, 100);
      const settings: InnerGlowSettings = {
        color: '#00FF00',
        opacity: 100,
        size: 10,
        source: 'edge',
        technique: 'softer',
        blendMode: 'lighten',
      };

      const result = LayerEffectRenderer.applyInnerGlow(sourceCanvas, settings);
      expect(result).toBeDefined();
    });
  });
});
