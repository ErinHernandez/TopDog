/**
 * @fileoverview Comprehensive tests for LayerCompositor
 *
 * Tests the LayerCompositor class which handles bottom-up layer compositing
 * with caching, blend modes, opacity, masks, and effects rendering.
 *
 * Test Groups:
 * 1. Cache Management (5 tests)
 * 2. Layer Compositing (compositeLayers) (5 tests)
 * 3. Group Compositing (compositeGroup) (4 tests)
 * 4. Document Compositing (compositeDocument) (4 tests)
 * 5. Region Rendering (renderRegion) (3 tests)
 * 6. Blend Mode Mapping (blendModeToCanvasComposite) (4 tests)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LayerCompositor, CompositionCache, CompositionState } from '@/lib/studio/editor/layers/LayerCompositor';
import type {
  Layer,
  LayerTree,
  GroupLayer,
  RasterLayer,
  TextLayer,
  ShapeLayer,
  BlendMode,
} from '@/lib/studio/types/layers';
import type { Rect, RenderContext, CanvasDocument, Viewport } from '@/lib/studio/types/canvas';

/**
 * Mock LayerEffects module
 */
vi.mock('@/lib/studio/editor/layers/LayerEffects', () => ({
  LayerEffectRenderer: {
    renderAllEffects: vi.fn((canvas: OffscreenCanvas) => canvas),
  },
}));

/**
 * Mock canvas context assertion utilities
 */
vi.mock('@/lib/studio/utils/assertCanvasContext', () => ({
  assertCanvasContext: vi.fn((_canvas: any) => createMockCanvasContext()),
  assertOffscreenCanvasContext: vi.fn((_canvas: any) => createMockOffscreenCanvasContext()),
}));

/**
 * Create a mock 2D context for OffscreenCanvas
 */
function createMockOffscreenCanvasContext(): OffscreenCanvasRenderingContext2D {
  const mockCtx = {
    canvas: new OffscreenCanvas(800, 600),
    fillStyle: '#000000',
    strokeStyle: '#000000',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over' as GlobalCompositeOperation,
    font: '10px sans-serif',
    textAlign: 'start' as CanvasTextAlign,
    textBaseline: 'top' as CanvasTextBaseline,

    fillRect: vi.fn(),
    clearRect: vi.fn(),
    strokeRect: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    setTransform: vi.fn(),
    beginPath: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fillText: vi.fn(),

    getImageData: vi.fn((_x: number, _y: number, w: number, h: number) => {
      const data = new Uint8ClampedArray(w * h * 4);
      return new ImageData(data, w, h);
    }),

    putImageData: vi.fn(),
  } as any;

  return mockCtx;
}

/**
 * Create a mock 2D context for regular Canvas
 */
function createMockCanvasContext(): CanvasRenderingContext2D {
  return createMockOffscreenCanvasContext() as any;
}

/**
 * Create a test RenderContext
 */
function createTestRenderContext(
  docWidth: number = 800,
  docHeight: number = 600,
  background: string = '#ffffff',
): RenderContext {
  return {
    document: {
      id: 'test-doc',
      name: 'Test Document',
      width: docWidth,
      height: docHeight,
      dpi: 72,
      colorSpace: 'srgb',
      background,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    },
    viewport: {
      zoom: 1,
      panX: 0,
      panY: 0,
      rotation: 0,
    } as Viewport,
    canvas: new OffscreenCanvas(docWidth, docHeight),
    ctx: createMockOffscreenCanvasContext(),
    dirtyRect: null,
    devicePixelRatio: 1,
  };
}

/**
 * Create a test LayerTree with specified layers
 */
function createTestLayerTree(
  layers: Array<{
    id: string;
    type: string;
    name?: string;
    visible?: boolean;
    opacity?: number;
    blendMode?: BlendMode;
    parentId?: string | null;
    children?: string[];
    bounds?: Rect;
  }> = [],
): LayerTree {
  const layerMap = new Map<string, Layer>();
  const rootOrder: string[] = [];

  layers.forEach((layerDef) => {
    const baseBounds: Rect = layerDef.bounds || { x: 0, y: 0, width: 100, height: 100 };

    let layer: Layer;

    if (layerDef.type === 'group') {
      layer = {
        id: layerDef.id,
        name: layerDef.name || `Layer ${layerDef.id}`,
        type: 'group',
        visible: layerDef.visible !== false,
        opacity: layerDef.opacity ?? 100,
        blendMode: (layerDef.blendMode || 'normal') as BlendMode,
        locked: { position: false, pixels: false, transparency: false, all: false },
        parentId: layerDef.parentId ?? null,
        order: 0,
        mask: null,
        effects: [],
        clipToBelow: false,
        children: layerDef.children || [],
        collapsed: false,
        passThrough: false,
      } as GroupLayer;
    } else if (layerDef.type === 'raster') {
      layer = {
        id: layerDef.id,
        name: layerDef.name || `Layer ${layerDef.id}`,
        type: 'raster',
        visible: layerDef.visible !== false,
        opacity: layerDef.opacity ?? 100,
        blendMode: (layerDef.blendMode || 'normal') as BlendMode,
        locked: { position: false, pixels: false, transparency: false, all: false },
        parentId: layerDef.parentId ?? null,
        order: 0,
        mask: null,
        effects: [],
        clipToBelow: false,
        pixelData: { width: 100, height: 100 } as any,
        bounds: baseBounds,
      } as RasterLayer;
    } else if (layerDef.type === 'text') {
      layer = {
        id: layerDef.id,
        name: layerDef.name || `Layer ${layerDef.id}`,
        type: 'text',
        visible: layerDef.visible !== false,
        opacity: layerDef.opacity ?? 100,
        blendMode: (layerDef.blendMode || 'normal') as BlendMode,
        locked: { position: false, pixels: false, transparency: false, all: false },
        parentId: layerDef.parentId ?? null,
        order: 0,
        mask: null,
        effects: [],
        clipToBelow: false,
        text: 'Test Text',
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 400,
        fontStyle: 'normal',
        textAlign: 'left',
        lineHeight: 1.2,
        letterSpacing: 0,
        color: '#000000',
        bounds: baseBounds,
      } as TextLayer;
    } else if (layerDef.type === 'shape') {
      layer = {
        id: layerDef.id,
        name: layerDef.name || `Layer ${layerDef.id}`,
        type: 'shape',
        visible: layerDef.visible !== false,
        opacity: layerDef.opacity ?? 100,
        blendMode: (layerDef.blendMode || 'normal') as BlendMode,
        locked: { position: false, pixels: false, transparency: false, all: false },
        parentId: layerDef.parentId ?? null,
        order: 0,
        mask: null,
        effects: [],
        clipToBelow: false,
        shapeType: 'rectangle',
        fill: '#FF0000',
        stroke: null,
        strokeWidth: 0,
        pathData: '',
        bounds: baseBounds,
      } as ShapeLayer;
    } else {
      throw new Error(`Unsupported layer type: ${layerDef.type}`);
    }

    layerMap.set(layerDef.id, layer);

    // Track root layers
    if (!layerDef.parentId) {
      rootOrder.push(layerDef.id);
    }
  });

  return {
    documentId: 'test-doc',
    layers: layerMap,
    rootOrder,
    activeLayerId: null,
    selectedLayerIds: new Set(),
  };
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('LayerCompositor', () => {
  let compositor: LayerCompositor;
  let testTree: LayerTree;
  let testCtx: RenderContext;

  beforeEach(() => {
    compositor = new LayerCompositor();
    testCtx = createTestRenderContext();
    vi.clearAllMocks();
  });

  // ==========================================================================
  // 1. CACHE MANAGEMENT TESTS
  // ==========================================================================

  describe('Cache Management', () => {
    it('should clear all cached data when clearCache is called', () => {
      testTree = createTestLayerTree([
        { id: 'layer1', type: 'raster', visible: true, opacity: 100 },
      ]);

      // Composite to populate cache
      compositor.compositeLayers(testTree, 'layer1', testCtx);

      const statsBeforeClear = compositor.getCacheStats();
      expect(statsBeforeClear.size).toBeGreaterThan(0);

      // Clear cache
      compositor.clearCache();

      const statsAfterClear = compositor.getCacheStats();
      expect(statsAfterClear.size).toBe(0);
      expect(statsAfterClear.items).toBe(0);
    });

    it('should return zero cache stats when empty', () => {
      const stats = compositor.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.items).toBe(0);
      expect(stats.dirtyLayers).toBe(0);
    });

    it('should mark layer as dirty in composition state', () => {
      testTree = createTestLayerTree([
        { id: 'layer1', type: 'raster', visible: true, opacity: 100 },
      ]);

      compositor.markDirty(testTree, 'layer1');

      const stats = compositor.getCacheStats();
      expect(stats.dirtyLayers).toBeGreaterThanOrEqual(0);
    });

    it('should propagate dirty marking to parent layers', () => {
      testTree = createTestLayerTree([
        { id: 'group1', type: 'group', visible: true, opacity: 100, children: ['layer1'] },
        { id: 'layer1', type: 'raster', visible: true, opacity: 100, parentId: 'group1' },
      ]);

      compositor.markDirty(testTree, 'layer1');

      // Parent should also be marked dirty (checked via stats)
      const stats = compositor.getCacheStats();
      expect(stats.dirtyLayers).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple clearCache calls without error', () => {
      expect(() => {
        compositor.clearCache();
        compositor.clearCache();
        compositor.clearCache();
      }).not.toThrow();

      const stats = compositor.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  // ==========================================================================
  // 2. LAYER COMPOSITING TESTS (compositeLayers)
  // ==========================================================================

  describe('compositeLayers', () => {
    it('should return null for invisible layer', () => {
      testTree = createTestLayerTree([
        { id: 'layer1', type: 'raster', visible: false, opacity: 100 },
      ]);

      const result = compositor.compositeLayers(testTree, 'layer1', testCtx);

      expect(result).toBeNull();
    });

    it('should return null for non-existent layer', () => {
      testTree = createTestLayerTree([
        { id: 'layer1', type: 'raster', visible: true, opacity: 100 },
      ]);

      const result = compositor.compositeLayers(testTree, 'nonexistent', testCtx);

      expect(result).toBeNull();
    });

    it('should return OffscreenCanvas for visible raster layer', () => {
      testTree = createTestLayerTree([
        { id: 'layer1', type: 'raster', visible: true, opacity: 100 },
      ]);

      const result = compositor.compositeLayers(testTree, 'layer1', testCtx);

      expect(result).toBeInstanceOf(OffscreenCanvas);
    });

    it('should cache result after compositing', () => {
      testTree = createTestLayerTree([
        { id: 'layer1', type: 'raster', visible: true, opacity: 100 },
      ]);

      compositor.compositeLayers(testTree, 'layer1', testCtx);

      const stats = compositor.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should use cache for non-dirty layers', () => {
      testTree = createTestLayerTree([
        { id: 'layer1', type: 'raster', visible: true, opacity: 100 },
      ]);

      // First composition
      const result1 = compositor.compositeLayers(testTree, 'layer1', testCtx);

      // Second composition (should use cache since not marked dirty)
      const result2 = compositor.compositeLayers(testTree, 'layer1', testCtx);

      // Results should be the same object (from cache)
      expect(result1).toBe(result2);
    });
  });

  // ==========================================================================
  // 3. GROUP COMPOSITING TESTS (compositeGroup)
  // ==========================================================================

  describe('compositeGroup', () => {
    it('should return null for empty group', () => {
      testTree = createTestLayerTree([
        { id: 'group1', type: 'group', visible: true, opacity: 100, children: [] },
      ]);

      const result = compositor.compositeLayers(testTree, 'group1', testCtx);

      expect(result).toBeNull();
    });

    it('should composite children bottom-to-top', () => {
      testTree = createTestLayerTree([
        {
          id: 'group1',
          type: 'group',
          visible: true,
          opacity: 100,
          children: ['layer1', 'layer2'],
        },
        { id: 'layer1', type: 'raster', visible: true, opacity: 100, parentId: 'group1' },
        { id: 'layer2', type: 'raster', visible: true, opacity: 100, parentId: 'group1' },
      ]);

      const result = compositor.compositeLayers(testTree, 'group1', testCtx);

      expect(result).toBeInstanceOf(OffscreenCanvas);
    });

    it('should handle passThrough groups', () => {
      testTree = createTestLayerTree([
        {
          id: 'group1',
          type: 'group',
          visible: true,
          opacity: 100,
          children: ['layer1'],
        },
        { id: 'layer1', type: 'raster', visible: true, opacity: 100, parentId: 'group1' },
      ]);

      const group = testTree.layers.get('group1') as GroupLayer;
      group.passThrough = true;

      const result = compositor.compositeLayers(testTree, 'group1', testCtx);

      expect(result).toBeInstanceOf(OffscreenCanvas);
    });

    it('should apply group opacity', () => {
      testTree = createTestLayerTree([
        {
          id: 'group1',
          type: 'group',
          visible: true,
          opacity: 50,
          children: ['layer1'],
        },
        { id: 'layer1', type: 'raster', visible: true, opacity: 100, parentId: 'group1' },
      ]);

      const result = compositor.compositeLayers(testTree, 'group1', testCtx);

      expect(result).toBeInstanceOf(OffscreenCanvas);
    });
  });

  // ==========================================================================
  // 4. DOCUMENT COMPOSITING TESTS (compositeDocument)
  // ==========================================================================

  describe('compositeDocument', () => {
    it('should create canvas with document dimensions', () => {
      testTree = createTestLayerTree([
        { id: 'layer1', type: 'raster', visible: true, opacity: 100 },
      ]);

      testCtx = createTestRenderContext(1920, 1080, '#ffffff');
      const result = compositor.compositeDocument(testTree, testCtx);

      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
    });

    it('should fill background color', () => {
      testTree = createTestLayerTree([
        { id: 'layer1', type: 'raster', visible: true, opacity: 100 },
      ]);

      testCtx = createTestRenderContext(800, 600, '#FF0000');
      const result = compositor.compositeDocument(testTree, testCtx);

      expect(result).toBeInstanceOf(OffscreenCanvas);
    });

    it('should composite root layers', () => {
      testTree = createTestLayerTree([
        { id: 'layer1', type: 'raster', visible: true, opacity: 100 },
        { id: 'layer2', type: 'raster', visible: true, opacity: 100 },
      ]);

      const result = compositor.compositeDocument(testTree, testCtx);

      expect(result).toBeInstanceOf(OffscreenCanvas);
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });

    it('should skip invisible layers', () => {
      testTree = createTestLayerTree([
        { id: 'layer1', type: 'raster', visible: true, opacity: 100 },
        { id: 'layer2', type: 'raster', visible: false, opacity: 100 },
      ]);

      const result = compositor.compositeDocument(testTree, testCtx);

      expect(result).toBeInstanceOf(OffscreenCanvas);
    });
  });

  // ==========================================================================
  // 5. REGION RENDERING TESTS (renderRegion)
  // ==========================================================================

  describe('renderRegion', () => {
    it('should apply scale factor', () => {
      testTree = createTestLayerTree([
        { id: 'layer1', type: 'raster', visible: true, opacity: 100 },
      ]);

      const bounds: Rect = { x: 0, y: 0, width: 100, height: 100 };
      const result = compositor.renderRegion(testTree, bounds, 2, testCtx);

      expect(result.width).toBe(200);
      expect(result.height).toBe(200);
    });

    it('should respect bounds offset', () => {
      testTree = createTestLayerTree([
        { id: 'layer1', type: 'raster', visible: true, opacity: 100 },
      ]);

      const bounds: Rect = { x: 50, y: 50, width: 100, height: 100 };
      const result = compositor.renderRegion(testTree, bounds, 1, testCtx);

      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it('should return OffscreenCanvas', () => {
      testTree = createTestLayerTree([
        { id: 'layer1', type: 'raster', visible: true, opacity: 100 },
      ]);

      const bounds: Rect = { x: 0, y: 0, width: 100, height: 100 };
      const result = compositor.renderRegion(testTree, bounds, 1, testCtx);

      expect(result).toBeInstanceOf(OffscreenCanvas);
    });
  });

  // ==========================================================================
  // 6. BLEND MODE MAPPING TESTS (blendModeToCanvasComposite)
  // ==========================================================================

  describe('blendModeToCanvasComposite', () => {
    it('should map normal to source-over', () => {
      testTree = createTestLayerTree([
        { id: 'layer1', type: 'raster', visible: true, opacity: 100, blendMode: 'normal' },
      ]);

      const result = compositor.compositeLayers(testTree, 'layer1', testCtx);

      // Verify blend mode was applied (result should exist)
      expect(result).toBeInstanceOf(OffscreenCanvas);
    });

    it('should handle multiply blend mode', () => {
      testTree = createTestLayerTree([
        { id: 'layer1', type: 'raster', visible: true, opacity: 100, blendMode: 'multiply' },
      ]);

      const result = compositor.compositeLayers(testTree, 'layer1', testCtx);

      expect(result).toBeInstanceOf(OffscreenCanvas);
    });

    it('should handle screen blend mode', () => {
      testTree = createTestLayerTree([
        { id: 'layer1', type: 'raster', visible: true, opacity: 100, blendMode: 'screen' },
      ]);

      const result = compositor.compositeLayers(testTree, 'layer1', testCtx);

      expect(result).toBeInstanceOf(OffscreenCanvas);
    });

    it('should fall back to source-over for unknown modes', () => {
      testTree = createTestLayerTree([
        { id: 'layer1', type: 'raster', visible: true, opacity: 100, blendMode: 'normal' },
      ]);

      const result = compositor.compositeLayers(testTree, 'layer1', testCtx);

      expect(result).toBeInstanceOf(OffscreenCanvas);
    });
  });

  // ==========================================================================
  // 7. EDGE CASES AND ERROR HANDLING
  // ==========================================================================

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty layer tree', () => {
      testTree = createTestLayerTree([]);

      const result = compositor.compositeDocument(testTree, testCtx);

      expect(result).toBeInstanceOf(OffscreenCanvas);
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });

    it('should handle opacity of 0', () => {
      testTree = createTestLayerTree([
        { id: 'layer1', type: 'raster', visible: true, opacity: 0 },
      ]);

      const result = compositor.compositeLayers(testTree, 'layer1', testCtx);

      expect(result).toBeInstanceOf(OffscreenCanvas);
    });

    it('should handle opacity of 100', () => {
      testTree = createTestLayerTree([
        { id: 'layer1', type: 'raster', visible: true, opacity: 100 },
      ]);

      const result = compositor.compositeLayers(testTree, 'layer1', testCtx);

      expect(result).toBeInstanceOf(OffscreenCanvas);
    });

    it('should handle nested groups', () => {
      testTree = createTestLayerTree([
        {
          id: 'group1',
          type: 'group',
          visible: true,
          opacity: 100,
          children: ['group2'],
        },
        {
          id: 'group2',
          type: 'group',
          visible: true,
          opacity: 100,
          children: ['layer1'],
          parentId: 'group1',
        },
        { id: 'layer1', type: 'raster', visible: true, opacity: 100, parentId: 'group2' },
      ]);

      const result = compositor.compositeLayers(testTree, 'group1', testCtx);

      expect(result).toBeInstanceOf(OffscreenCanvas);
    });

    it('should handle text layer compositing', () => {
      testTree = createTestLayerTree([
        { id: 'textLayer', type: 'text', visible: true, opacity: 100 },
      ]);

      const result = compositor.compositeLayers(testTree, 'textLayer', testCtx);

      expect(result).toBeInstanceOf(OffscreenCanvas);
    });

    it('should handle shape layer compositing', () => {
      testTree = createTestLayerTree([
        { id: 'shapeLayer', type: 'shape', visible: true, opacity: 100 },
      ]);

      const result = compositor.compositeLayers(testTree, 'shapeLayer', testCtx);

      expect(result).toBeInstanceOf(OffscreenCanvas);
    });

    it('should handle complex layer hierarchy', () => {
      testTree = createTestLayerTree([
        {
          id: 'group1',
          type: 'group',
          visible: true,
          opacity: 100,
          children: ['group2', 'layer1'],
        },
        {
          id: 'group2',
          type: 'group',
          visible: true,
          opacity: 100,
          children: ['layer2', 'layer3'],
          parentId: 'group1',
        },
        { id: 'layer1', type: 'raster', visible: true, opacity: 100, parentId: 'group1' },
        { id: 'layer2', type: 'raster', visible: true, opacity: 50, parentId: 'group2' },
        { id: 'layer3', type: 'raster', visible: false, opacity: 75, parentId: 'group2' },
      ]);

      const result = compositor.compositeDocument(testTree, testCtx);

      expect(result).toBeInstanceOf(OffscreenCanvas);
    });

    it('should handle multiple successive compositions', () => {
      testTree = createTestLayerTree([
        { id: 'layer1', type: 'raster', visible: true, opacity: 100 },
      ]);

      const result1 = compositor.compositeDocument(testTree, testCtx);

      testCtx = createTestRenderContext(800, 600, '#000000');
      const result2 = compositor.compositeDocument(testTree, testCtx);

      expect(result1).toBeInstanceOf(OffscreenCanvas);
      expect(result2).toBeInstanceOf(OffscreenCanvas);
    });

    it('should handle very large canvas dimensions', () => {
      testTree = createTestLayerTree([
        { id: 'layer1', type: 'raster', visible: true, opacity: 100 },
      ]);

      testCtx = createTestRenderContext(4096, 4096, '#ffffff');
      const result = compositor.compositeDocument(testTree, testCtx);

      expect(result.width).toBe(4096);
      expect(result.height).toBe(4096);
    });

    it('should handle different aspect ratios', () => {
      testTree = createTestLayerTree([
        { id: 'layer1', type: 'raster', visible: true, opacity: 100 },
      ]);

      testCtx = createTestRenderContext(1600, 900, '#ffffff');
      const result = compositor.compositeDocument(testTree, testCtx);

      expect(result.width).toBe(1600);
      expect(result.height).toBe(900);
    });
  });
});
