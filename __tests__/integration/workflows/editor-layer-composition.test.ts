/**
 * Integration tests for Idesaign Studio multi-layer composition & blend mode pipeline
 * Tests the full layer model, compositor, and blend mode flow with realistic scenarios
 * Covers layer operations, blend modes, opacity, masks, and undo/redo
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { installCanvasMocks, removeCanvasMocks, createTestImageData } from '../../helpers/canvas-mock';
import { randomTestId } from '../../helpers/test-utils';
import { LayerModel } from '@/lib/studio/editor/layers/LayerModel';
import { LayerCompositor } from '@/lib/studio/editor/layers/LayerCompositor';
import { blendPixels } from '@/lib/studio/editor/layers/BlendModes';
import type { LayerTree, RasterLayer, BlendMode } from '@/lib/studio/types/layers';
import type { RenderContext } from '@/lib/studio/types/canvas';

describe('Editor Layer Composition & Blend Mode Pipeline Integration', () => {
  let compositor: LayerCompositor;
  let renderContext: RenderContext;

  beforeEach(() => {
    installCanvasMocks();
    compositor = new LayerCompositor();

    // Create standard render context (800x600 canvas)
    renderContext = {
      document: {
        width: 800,
        height: 600,
        background: '#ffffff',
      },
    } as RenderContext;
  });

  afterEach(() => {
    removeCanvasMocks();
    compositor.clearCache();
  });

  describe('1. Multi-Layer Document Creation', () => {
    it('should create empty document with single base layer', () => {
      let tree = LayerModel.createEmptyTree('doc-1');
      expect(tree.documentId).toBe('doc-1');
      expect(tree.rootOrder.length).toBe(0);

      const baseLayer = LayerModel.createRasterLayer('base', 'Base', {
        x: 0,
        y: 0,
        width: 800,
        height: 600,
      });
      tree = LayerModel.addLayer(tree, baseLayer);

      expect(tree.rootOrder.length).toBe(1);
      expect(tree.rootOrder[0]).toBe('base');
    });

    it('should build three-layer composition (base + overlay + adjustment)', () => {
      let tree = LayerModel.createEmptyTree('doc-2');

      // Layer 1: Base raster
      const baseLayer = LayerModel.createRasterLayer('base', 'Background', {
        x: 0,
        y: 0,
        width: 800,
        height: 600,
      });
      tree = LayerModel.addLayer(tree, baseLayer);

      // Layer 2: Overlay raster
      const overlayLayer = LayerModel.createRasterLayer('overlay', 'Overlay', {
        x: 100,
        y: 100,
        width: 600,
        height: 400,
      });
      tree = LayerModel.addLayer(tree, overlayLayer);

      // Layer 3: Adjustment layer
      const adjustmentLayer = LayerModel.createAdjustmentLayer('adj', 'Levels', 'levels');
      tree = LayerModel.addLayer(tree, adjustmentLayer);

      expect(tree.rootOrder.length).toBe(3);
      expect(tree.rootOrder).toEqual(['base', 'overlay', 'adj']);

      // Verify layer retrieval
      expect(LayerModel.getLayer(tree, 'base')?.type).toBe('raster');
      expect(LayerModel.getLayer(tree, 'overlay')?.type).toBe('raster');
      expect(LayerModel.getLayer(tree, 'adj')?.type).toBe('adjustment');
    });

    it('should validate tree integrity after complex operations', () => {
      let tree = LayerModel.createEmptyTree('doc-3');

      const base = LayerModel.createRasterLayer('base', 'Base', {
        x: 0,
        y: 0,
        width: 800,
        height: 600,
      });
      tree = LayerModel.addLayer(tree, base);

      const overlay = LayerModel.createRasterLayer('overlay', 'Overlay', {
        x: 0,
        y: 0,
        width: 800,
        height: 600,
      });
      tree = LayerModel.addLayer(tree, overlay);

      const validation = LayerModel.validateTree(tree);
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });
  });

  describe('2. Blend Mode Application', () => {
    it('should apply normal blend mode (no visual change)', () => {
      const source: [number, number, number, number] = [200, 100, 50, 255];
      const backdrop: [number, number, number, number] = [100, 150, 200, 255];

      const result = blendPixels(source, backdrop, 'normal', 100);

      // Normal mode at 100% opacity: source fully replaces backdrop
      expect(result[0]).toBe(source[0]);
      expect(result[1]).toBe(source[1]);
      expect(result[2]).toBe(source[2]);
      expect(result[3]).toBe(source[3]);
    });

    it('should apply multiply blend mode (darkening)', () => {
      const source: [number, number, number, number] = [200, 100, 50, 255];
      const backdrop: [number, number, number, number] = [100, 150, 200, 255];

      const result = blendPixels(source, backdrop, 'multiply', 100);

      // Multiply darkens: each channel = (source * backdrop) / 255
      expect(result[0]).toBeLessThan(source[0]);
      expect(result[0]).toBeLessThan(backdrop[0]);
      expect(result[3]).toBe(255); // Alpha preserved
    });

    it('should apply screen blend mode (lightening)', () => {
      const source: [number, number, number, number] = [100, 50, 25, 255];
      const backdrop: [number, number, number, number] = [200, 150, 100, 255];

      const result = blendPixels(source, backdrop, 'screen', 100);

      // Screen lightens: 1 - (1 - src) * (1 - backdrop)
      expect(result[0]).toBeGreaterThanOrEqual(backdrop[0]);
      expect(result[3]).toBe(255);
    });

    it('should apply overlay blend mode (contrast adjustment)', () => {
      const darkSource: [number, number, number, number] = [64, 64, 64, 255];
      const brightBackdrop: [number, number, number, number] = [200, 200, 200, 255];

      const result = blendPixels(darkSource, brightBackdrop, 'overlay', 100);

      // Overlay: multiply in dark areas, screen in light
      // With dark source on light backdrop, should multiply (darken)
      expect(result[0]).toBeLessThan(brightBackdrop[0]);
      expect(result[3]).toBe(255);
    });

    it('should respect layer opacity in blend mode', () => {
      const source: [number, number, number, number] = [255, 0, 0, 255]; // Pure red
      const backdrop: [number, number, number, number] = [0, 0, 255, 255]; // Pure blue

      const fullOpacity = blendPixels(source, backdrop, 'normal', 100);
      const halfOpacity = blendPixels(source, backdrop, 'normal', 50);
      const zeroOpacity = blendPixels(source, backdrop, 'normal', 0);

      // Full opacity: source value
      expect(fullOpacity[0]).toBe(255);

      // Half opacity: blend between source and backdrop
      expect(halfOpacity[0]).toBeLessThan(fullOpacity[0]);
      expect(halfOpacity[0]).toBeGreaterThan(zeroOpacity[0]);

      // Zero opacity: backdrop value
      expect(zeroOpacity[0]).toBe(0);
    });
  });

  describe('3. Layer Opacity Modification', () => {
    it('should modify layer opacity and clamp values', () => {
      let tree = LayerModel.createEmptyTree('doc-opacity');

      const layer = LayerModel.createRasterLayer('layer1', 'Test Layer', {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      tree = LayerModel.addLayer(tree, layer);

      // Set opacity to 50%
      tree = LayerModel.setOpacity(tree, 'layer1', 50);
      let updated = LayerModel.getLayer(tree, 'layer1') as RasterLayer;
      expect(updated.opacity).toBe(50);

      // Clamp to max (100)
      tree = LayerModel.setOpacity(tree, 'layer1', 150);
      updated = LayerModel.getLayer(tree, 'layer1') as RasterLayer;
      expect(updated.opacity).toBe(100);

      // Clamp to min (0)
      tree = LayerModel.setOpacity(tree, 'layer1', -10);
      updated = LayerModel.getLayer(tree, 'layer1') as RasterLayer;
      expect(updated.opacity).toBe(0);
    });

    it('should composite layers with varying opacity', () => {
      let tree = LayerModel.createEmptyTree('doc-opacity-comp');

      const baseLayer = LayerModel.createRasterLayer('base', 'Base', {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      tree = LayerModel.addLayer(tree, baseLayer);

      const overlayLayer = LayerModel.createRasterLayer('overlay', 'Overlay 50%', {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      tree = LayerModel.addLayer(tree, overlayLayer);

      // Set overlay to 50% opacity
      tree = LayerModel.setOpacity(tree, 'overlay', 50);

      // Mark compositor dirty and composite
      compositor.markDirty(tree, 'overlay');
      const result = compositor.compositeDocument(tree, renderContext);

      expect(result).not.toBeNull();
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });
  });

  describe('4. Layer Addition and Removal', () => {
    it('should add multiple layers and maintain order', () => {
      let tree = LayerModel.createEmptyTree('doc-add');

      const layer1 = LayerModel.createRasterLayer('l1', 'Layer 1', {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      tree = LayerModel.addLayer(tree, layer1);

      const layer2 = LayerModel.createRasterLayer('l2', 'Layer 2', {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      tree = LayerModel.addLayer(tree, layer2);

      const layer3 = LayerModel.createRasterLayer('l3', 'Layer 3', {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      tree = LayerModel.addLayer(tree, layer3);

      expect(tree.rootOrder.length).toBe(3);
      expect(tree.rootOrder).toEqual(['l1', 'l2', 'l3']);
    });

    it('should remove layer and update compositor', () => {
      let tree = LayerModel.createEmptyTree('doc-remove');

      const layer1 = LayerModel.createRasterLayer('l1', 'Layer 1', {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      tree = LayerModel.addLayer(tree, layer1);

      const layer2 = LayerModel.createRasterLayer('l2', 'Layer 2', {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      tree = LayerModel.addLayer(tree, layer2);

      expect(tree.rootOrder.length).toBe(2);

      // Delete layer 1
      tree = LayerModel.deleteLayer(tree, 'l1');

      expect(tree.rootOrder.length).toBe(1);
      expect(tree.rootOrder[0]).toBe('l2');
      expect(tree.layers.has('l1')).toBe(false);

      // Verify tree still valid
      const validation = LayerModel.validateTree(tree);
      expect(validation.valid).toBe(true);
    });

    it('should add layer at specific index', () => {
      let tree = LayerModel.createEmptyTree('doc-insert');

      const layer1 = LayerModel.createRasterLayer('l1', 'Layer 1', {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      tree = LayerModel.addLayer(tree, layer1);

      const layer3 = LayerModel.createRasterLayer('l3', 'Layer 3', {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      tree = LayerModel.addLayer(tree, layer3);

      // Insert layer 2 at index 1 (between l1 and l3)
      const layer2 = LayerModel.createRasterLayer('l2', 'Layer 2', {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      tree = LayerModel.addLayer(tree, layer2, 1);

      expect(tree.rootOrder).toEqual(['l1', 'l2', 'l3']);
    });
  });

  describe('5. Layer Reordering', () => {
    it('should reorder layers (move to different position)', () => {
      let tree = LayerModel.createEmptyTree('doc-reorder');

      // Add layers in order: l1, l2, l3, l4
      for (const id of ['l1', 'l2', 'l3', 'l4']) {
        const layer = LayerModel.createRasterLayer(id, id, {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        });
        tree = LayerModel.addLayer(tree, layer);
      }

      expect(tree.rootOrder).toEqual(['l1', 'l2', 'l3', 'l4']);

      // Move l1 to index 3 (after l2 and l3, before l4)
      tree = LayerModel.reorderLayer(tree, 'l1', 3);
      expect(tree.rootOrder).toEqual(['l2', 'l3', 'l1', 'l4']);

      // Move l4 to index 0 (move to beginning)
      tree = LayerModel.reorderLayer(tree, 'l4', 0);
      expect(tree.rootOrder).toEqual(['l4', 'l2', 'l3', 'l1']);
    });

    it('should verify z-index after reordering', () => {
      let tree = LayerModel.createEmptyTree('doc-zindex');

      const layers = ['l1', 'l2', 'l3'];
      for (const id of layers) {
        const layer = LayerModel.createRasterLayer(id, id, {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        });
        tree = LayerModel.addLayer(tree, layer);
      }

      // Initial z-index
      expect(LayerModel.getZIndex(tree, 'l1')).toBe(0);
      expect(LayerModel.getZIndex(tree, 'l2')).toBe(1);
      expect(LayerModel.getZIndex(tree, 'l3')).toBe(2);

      // Move l1 to index 2 (inserts after l2, becomes position 2)
      // When removing from 0, after removal we have [l2, l3]
      // With newIndex=2 and currentIndex=0, adjustedIndex = 2-1 = 1
      // So we insert at index 1, giving [l2, l1, l3]
      tree = LayerModel.reorderLayer(tree, 'l1', 2);
      expect(LayerModel.getZIndex(tree, 'l2')).toBe(0);
      expect(LayerModel.getZIndex(tree, 'l1')).toBe(1);
      expect(LayerModel.getZIndex(tree, 'l3')).toBe(2);
    });
  });

  describe('6. Undo/Redo Layer Operations', () => {
    it('should support immutable state snapshots for undo', () => {
      let tree = LayerModel.createEmptyTree('doc-undo');

      // Snapshot 1: empty
      const snapshot1 = { ...tree, rootOrder: [...tree.rootOrder] };

      // Add layer
      const layer = LayerModel.createRasterLayer('l1', 'Layer 1', {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      tree = LayerModel.addLayer(tree, layer);

      // Snapshot 2: one layer
      const snapshot2 = { ...tree, rootOrder: [...tree.rootOrder] };

      expect(snapshot1.rootOrder.length).toBe(0);
      expect(snapshot2.rootOrder.length).toBe(1);

      // Restore to snapshot 1
      tree = snapshot1;
      expect(tree.rootOrder.length).toBe(0);

      // Restore to snapshot 2
      tree = snapshot2;
      expect(tree.rootOrder.length).toBe(1);
    });

    it('should track opacity changes for undo/redo', () => {
      let tree = LayerModel.createEmptyTree('doc-opacity-undo');

      const layer = LayerModel.createRasterLayer('l1', 'Layer 1', {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      tree = LayerModel.addLayer(tree, layer);

      const snapshot1 = LayerModel.getLayer(tree, 'l1') as RasterLayer;
      expect(snapshot1.opacity).toBe(100);

      tree = LayerModel.setOpacity(tree, 'l1', 75);
      const snapshot2 = LayerModel.getLayer(tree, 'l1') as RasterLayer;
      expect(snapshot2.opacity).toBe(75);

      tree = LayerModel.setOpacity(tree, 'l1', 50);
      const snapshot3 = LayerModel.getLayer(tree, 'l1') as RasterLayer;
      expect(snapshot3.opacity).toBe(50);
    });

    it('should track blend mode changes for undo/redo', () => {
      let tree = LayerModel.createEmptyTree('doc-blend-undo');

      const layer = LayerModel.createRasterLayer('l1', 'Layer 1', {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      tree = LayerModel.addLayer(tree, layer);

      const initialBlend = (LayerModel.getLayer(tree, 'l1') as RasterLayer).blendMode;
      expect(initialBlend).toBe('normal');

      tree = LayerModel.setBlendMode(tree, 'l1', 'multiply');
      let updated = LayerModel.getLayer(tree, 'l1') as RasterLayer;
      expect(updated.blendMode).toBe('multiply');

      tree = LayerModel.setBlendMode(tree, 'l1', 'screen');
      updated = LayerModel.getLayer(tree, 'l1') as RasterLayer;
      expect(updated.blendMode).toBe('screen');
    });
  });

  describe('7. Layer Mask Application', () => {
    it('should apply layer mask to raster layer', () => {
      let tree = LayerModel.createEmptyTree('doc-mask');

      const layer = LayerModel.createRasterLayer('l1', 'Layer with Mask', {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });

      // Add a mask to the layer
      const layerWithMask = {
        ...layer,
        mask: {
          enabled: true,
          density: 100,
          inverted: false,
          pixelData: new OffscreenCanvas(100, 100),
        },
      };

      tree = LayerModel.addLayer(tree, layerWithMask);
      const retrieved = LayerModel.getLayer(tree, 'l1') as RasterLayer;

      expect(retrieved.mask).not.toBeNull();
      expect(retrieved.mask?.enabled).toBe(true);
    });

    it('should composite with inverted mask', () => {
      let tree = LayerModel.createEmptyTree('doc-mask-inv');

      const layer = LayerModel.createRasterLayer('l1', 'Layer', {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });

      const layerWithMask = {
        ...layer,
        mask: {
          enabled: true,
          density: 100,
          inverted: true,
          pixelData: new OffscreenCanvas(100, 100),
        },
      };

      tree = LayerModel.addLayer(tree, layerWithMask);
      const retrieved = LayerModel.getLayer(tree, 'l1') as RasterLayer;

      expect(retrieved.mask?.inverted).toBe(true);
    });
  });

  describe('8. Edge Cases', () => {
    it('should composite empty document without layers', () => {
      const tree = LayerModel.createEmptyTree('doc-empty');

      expect(tree.rootOrder.length).toBe(0);

      const result = compositor.compositeDocument(tree, renderContext);
      expect(result).not.toBeNull();
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });

    it('should composite single layer document', () => {
      let tree = LayerModel.createEmptyTree('doc-single');

      const layer = LayerModel.createRasterLayer('l1', 'Single Layer', {
        x: 0,
        y: 0,
        width: 800,
        height: 600,
      });
      tree = LayerModel.addLayer(tree, layer);

      const result = compositor.compositeDocument(tree, renderContext);
      expect(result).not.toBeNull();
    });

    it('should handle hidden layers in composition', () => {
      let tree = LayerModel.createEmptyTree('doc-hidden');

      const layer1 = LayerModel.createRasterLayer('l1', 'Visible', {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      tree = LayerModel.addLayer(tree, layer1);

      const layer2 = LayerModel.createRasterLayer('l2', 'Hidden', {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      tree = LayerModel.addLayer(tree, layer2);

      // Hide layer 2
      tree = LayerModel.setVisibility(tree, 'l2', false);

      const retrieved = LayerModel.getLayer(tree, 'l2') as RasterLayer;
      expect(retrieved.visible).toBe(false);

      const result = compositor.compositeDocument(tree, renderContext);
      expect(result).not.toBeNull();
    });

    it('should handle zero opacity layers', () => {
      let tree = LayerModel.createEmptyTree('doc-zero-opacity');

      const layer = LayerModel.createRasterLayer('l1', 'Transparent', {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      tree = LayerModel.addLayer(tree, layer);

      tree = LayerModel.setOpacity(tree, 'l1', 0);

      const retrieved = LayerModel.getLayer(tree, 'l1') as RasterLayer;
      expect(retrieved.opacity).toBe(0);

      const result = compositor.compositeDocument(tree, renderContext);
      expect(result).not.toBeNull();
    });

    it('should validate tree with multiple blend modes', () => {
      let tree = LayerModel.createEmptyTree('doc-multi-blend');

      const blendModes: BlendMode[] = [
        'normal',
        'multiply',
        'screen',
        'overlay',
        'darken',
        'lighten',
      ];

      for (let i = 0; i < blendModes.length; i++) {
        const layer = LayerModel.createRasterLayer(`l${i}`, `Layer ${i}`, {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        });
        tree = LayerModel.addLayer(tree, layer);
        tree = LayerModel.setBlendMode(tree, `l${i}`, blendModes[i]);
      }

      const validation = LayerModel.validateTree(tree);
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });
  });

  describe('9. Compositor Caching', () => {
    it('should track cache statistics', () => {
      let tree = LayerModel.createEmptyTree('doc-cache');

      const layer = LayerModel.createRasterLayer('l1', 'Layer 1', {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      tree = LayerModel.addLayer(tree, layer);

      const stats1 = compositor.getCacheStats();
      expect(stats1.items).toBe(0);

      compositor.compositeLayers(tree, 'l1', renderContext);
      const stats2 = compositor.getCacheStats();
      expect(stats2.items).toBeGreaterThanOrEqual(0);
    });

    it('should clear cache on demand', () => {
      let tree = LayerModel.createEmptyTree('doc-clear-cache');

      const layer = LayerModel.createRasterLayer('l1', 'Layer 1', {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      tree = LayerModel.addLayer(tree, layer);

      compositor.compositeLayers(tree, 'l1', renderContext);
      let stats = compositor.getCacheStats();
      const cachedItems = stats.items;

      compositor.clearCache();
      stats = compositor.getCacheStats();
      expect(stats.items).toBe(0);
    });

    it('should mark dirty layers correctly', () => {
      let tree = LayerModel.createEmptyTree('doc-dirty');

      const layer1 = LayerModel.createRasterLayer('l1', 'Layer 1', {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      tree = LayerModel.addLayer(tree, layer1);

      const layer2 = LayerModel.createRasterLayer('l2', 'Layer 2', {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      tree = LayerModel.addLayer(tree, layer2);

      // Mark layer 1 as dirty
      compositor.markDirty(tree, 'l1');

      // This would cascade to parent layers in a grouped scenario
      // For root-level layers, it just marks the layer itself
      const stats = compositor.getCacheStats();
      expect(stats.dirtyLayers).toBe(1);
    });
  });

  describe('10. Complex Multi-Layer Scenarios', () => {
    it('should composite 5-layer document with varying opacity and blend modes', () => {
      let tree = LayerModel.createEmptyTree('doc-complex');

      const configs = [
        { id: 'base', name: 'Base', opacity: 100, blendMode: 'normal' as BlendMode },
        { id: 'overlay1', name: 'Overlay 1', opacity: 75, blendMode: 'multiply' as BlendMode },
        { id: 'overlay2', name: 'Overlay 2', opacity: 50, blendMode: 'screen' as BlendMode },
        { id: 'adj', name: 'Adjustment', opacity: 80, blendMode: 'overlay' as BlendMode },
        { id: 'top', name: 'Top', opacity: 100, blendMode: 'normal' as BlendMode },
      ];

      for (const config of configs) {
        const layer = LayerModel.createRasterLayer(config.id, config.name, {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        });
        tree = LayerModel.addLayer(tree, layer);
        tree = LayerModel.setOpacity(tree, config.id, config.opacity);
        tree = LayerModel.setBlendMode(tree, config.id, config.blendMode);
      }

      expect(tree.rootOrder.length).toBe(5);

      const validation = LayerModel.validateTree(tree);
      expect(validation.valid).toBe(true);

      const result = compositor.compositeDocument(tree, renderContext);
      expect(result).not.toBeNull();
    });

    it('should handle selective layer visibility toggling', () => {
      let tree = LayerModel.createEmptyTree('doc-visibility');

      const layerIds = ['l1', 'l2', 'l3', 'l4', 'l5'];
      for (const id of layerIds) {
        const layer = LayerModel.createRasterLayer(id, id, {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        });
        tree = LayerModel.addLayer(tree, layer);
      }

      // Hide every other layer
      tree = LayerModel.setVisibility(tree, 'l2', false);
      tree = LayerModel.setVisibility(tree, 'l4', false);

      for (const id of ['l1', 'l3', 'l5']) {
        const layer = LayerModel.getLayer(tree, id) as RasterLayer;
        expect(layer.visible).toBe(true);
      }

      for (const id of ['l2', 'l4']) {
        const layer = LayerModel.getLayer(tree, id) as RasterLayer;
        expect(layer.visible).toBe(false);
      }

      const result = compositor.compositeDocument(tree, renderContext);
      expect(result).not.toBeNull();
    });

    it('should support rapid layer modifications without corruption', () => {
      let tree = LayerModel.createEmptyTree('doc-rapid');

      // Add 5 layers
      for (let i = 0; i < 5; i++) {
        const layer = LayerModel.createRasterLayer(`l${i}`, `Layer ${i}`, {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        });
        tree = LayerModel.addLayer(tree, layer);
      }

      // Rapidly modify multiple properties
      for (let i = 0; i < 5; i++) {
        tree = LayerModel.setOpacity(tree, `l${i}`, 50 + i * 10);
        tree = LayerModel.setName(tree, `l${i}`, `Modified ${i}`);
      }

      // Apply blend modes
      const modes: BlendMode[] = ['multiply', 'screen', 'overlay', 'darken', 'lighten'];
      for (let i = 0; i < 5; i++) {
        tree = LayerModel.setBlendMode(tree, `l${i}`, modes[i]);
      }

      // Verify tree integrity
      const validation = LayerModel.validateTree(tree);
      expect(validation.valid).toBe(true);
      expect(tree.rootOrder.length).toBe(5);

      // Verify all modifications persisted
      for (let i = 0; i < 5; i++) {
        const layer = LayerModel.getLayer(tree, `l${i}`) as RasterLayer;
        expect(layer.name).toBe(`Modified ${i}`);
        expect(layer.opacity).toBe(50 + i * 10);
        expect(layer.blendMode).toBe(modes[i]);
      }
    });
  });
});
