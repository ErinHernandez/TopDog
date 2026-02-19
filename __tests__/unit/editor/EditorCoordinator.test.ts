/**
 * EditorCoordinator Unit Tests
 * Tests the central orchestration engine that coordinates multi-engine operations
 * in TopDog Studio's UI-to-Engine wiring layer.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LayerTree, CanvasDocument } from '@/lib/studio/editor/layers/types';
import type { BrushSettings } from '@/lib/studio/editor/tools/brush/types';
import { LayerModel } from '@/lib/studio/editor/layers/LayerModel';
import { EditorCoordinator } from '@/lib/studio/editor/EditorCoordinator';

// ============================================================================
// Mock Factories
// ============================================================================

function createMockCompositor() {
  return {
    compositeDocument: vi.fn(),
    compositeLayers: vi.fn(),
    markDirty: vi.fn(),
    clearCache: vi.fn(),
    getCacheStats: vi.fn(() => ({ size: 0, items: 0, dirtyLayers: 0 })),
    renderRegion: vi.fn(),
  } as any;
}

function createMockHistoryManager() {
  const listeners = new Map<string, Set<Function>>();
  return {
    push: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: vi.fn(() => false),
    canRedo: vi.fn(() => false),
    getState: vi.fn(() => ({
      currentIndex: -1,
      totalEntries: 0,
      canUndo: false,
      canRedo: false,
      currentEntry: null,
    })),
    getHistoryList: vi.fn(() => []),
    clear: vi.fn(),
    on: vi.fn((event: string, cb: Function) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(cb);
      return () => listeners.get(event)!.delete(cb);
    }),
    _trigger: (event: string, data?: any) => {
      listeners.get(event)?.forEach(cb => cb(data));
    },
  } as any;
}

function createMockBrushEngine() {
  return {
    beginStroke: vi.fn(),
    addPoint: vi.fn(),
    endStroke: vi.fn(() => []),
    getSettings: vi.fn(() => ({
      size: 20,
      opacity: 1,
      flow: 1,
      hardness: 0.8,
      spacing: 0.25,
      roundness: 1,
      angle: 0,
      smoothing: 0.5,
    })),
    updateSettings: vi.fn(),
    renderStroke: vi.fn(),
    generateBrushTip: vi.fn(),
  } as any;
}

function createMockBrushPresets() {
  return {
    getAllPresets: vi.fn(() => []),
    getPreset: vi.fn(() => null),
    getPresetsByCategory: vi.fn(() => []),
    getCategories: vi.fn(() => []),
    createPreset: vi.fn(),
    exportPresets: vi.fn(() => '[]'),
    importPresets: vi.fn(() => []),
  } as any;
}

const testDocument: CanvasDocument = {
  id: 'test-doc',
  name: 'Test Document',
  width: 800,
  height: 600,
  colorSpace: 'srgb',
  bitDepth: 8,
  dpi: 72,
  measurementUnit: 'pixels',
};

// ============================================================================
// Test Suites
// ============================================================================

describe('EditorCoordinator', () => {
  let coordinator: EditorCoordinator;
  let mockCompositor: any;
  let mockHistoryManager: any;
  let mockBrushEngine: any;
  let mockBrushPresets: any;
  let initialLayerTree: LayerTree;

  beforeEach(() => {
    mockCompositor = createMockCompositor();
    mockHistoryManager = createMockHistoryManager();
    mockBrushEngine = createMockBrushEngine();
    mockBrushPresets = createMockBrushPresets();
    initialLayerTree = LayerModel.createEmptyTree('test-doc');

    coordinator = new EditorCoordinator({
      compositor: mockCompositor,
      historyManager: mockHistoryManager,
      brushEngine: mockBrushEngine,
      brushPresets: mockBrushPresets,
      document: testDocument,
      initialLayerTree,
    });
  });

  // ========================================================================
  // Construction Tests
  // ========================================================================

  describe('Construction', () => {
    it('creates with valid config', () => {
      expect(coordinator).toBeDefined();
      expect(coordinator.getDocumentSnapshot()).toEqual(testDocument);
    });

    it('initializes with empty layer tree', () => {
      const snapshot = coordinator.getLayerTreeSnapshot();
      expect(snapshot).toBeDefined();
      expect(snapshot.documentId).toBe('test-doc');
      expect(snapshot.rootOrder).toEqual([]);
    });

    it('sets up history event listeners', () => {
      expect(mockHistoryManager.on).toHaveBeenCalledWith(
        'history:undo',
        expect.any(Function)
      );
      expect(mockHistoryManager.on).toHaveBeenCalledWith(
        'history:redo',
        expect.any(Function)
      );
      expect(mockHistoryManager.on).toHaveBeenCalledWith(
        'state-changed',
        expect.any(Function)
      );
    });
  });

  // ========================================================================
  // Layer Operations Tests
  // ========================================================================

  describe('Layer Operations', () => {
    it('addLayer creates a raster layer and returns id', () => {
      const layerId = coordinator.addLayer('New Layer', 'raster');
      expect(layerId).toBeDefined();
      expect(typeof layerId).toBe('string');
      expect(layerId.length).toBeGreaterThan(0);
    });

    it('addLayer pushes history entry', () => {
      coordinator.addLayer('New Layer', 'raster');
      expect(mockHistoryManager.push).toHaveBeenCalled();
      const call = mockHistoryManager.push.mock.calls[0];
      expect(call[0]).toBe('add-layer');
      expect(call[1]).toContain('Add');
    });

    it('addLayer notifies layers-changed subscribers', () => {
      const listener = vi.fn();
      coordinator.subscribe('layers-changed', listener);

      coordinator.addLayer('New Layer', 'raster');
      expect(listener).toHaveBeenCalled();
    });

    it('deleteLayer removes layer from tree', () => {
      const layerId = coordinator.addLayer('Layer to Delete', 'raster');
      vi.clearAllMocks();

      coordinator.deleteLayer(layerId);
      expect(mockHistoryManager.push).toHaveBeenCalled();
      const call = mockHistoryManager.push.mock.calls[0];
      expect(call[0]).toBe('delete-layer');
      expect(call[1]).toBe('Delete layer');
      expect(call[2]).toBe('layer-delete');
    });

    it('reorderLayer changes layer position', () => {
      const id1 = coordinator.addLayer('Layer 1', 'raster');
      const id2 = coordinator.addLayer('Layer 2', 'raster');
      vi.clearAllMocks();

      coordinator.reorderLayer(id1, 0);
      expect(mockHistoryManager.push).toHaveBeenCalled();
      const call = mockHistoryManager.push.mock.calls[0];
      expect(call[0]).toBe('reorder-layer');
      expect(call[1]).toBe('Reorder layer');
      expect(call[2]).toBe('layer-reorder');
    });

    it('setLayerVisibility toggles visibility', () => {
      const layerId = coordinator.addLayer('Visible Layer', 'raster');
      vi.clearAllMocks();

      coordinator.setLayerVisibility(layerId, false);
      expect(mockHistoryManager.push).toHaveBeenCalled();
      let call = mockHistoryManager.push.mock.calls[0];
      expect(call[0]).toBe('set-visibility');
      expect(call[1]).toBe('Hide layer');
      expect(call[2]).toBe('eye');

      vi.clearAllMocks();
      coordinator.setLayerVisibility(layerId, true);
      expect(mockHistoryManager.push).toHaveBeenCalled();
      call = mockHistoryManager.push.mock.calls[0];
      expect(call[0]).toBe('set-visibility');
      expect(call[1]).toBe('Show layer');
      expect(call[2]).toBe('eye');
    });

    it('setLayerOpacity updates opacity', () => {
      const layerId = coordinator.addLayer('Opaque Layer', 'raster');
      vi.clearAllMocks();

      coordinator.setLayerOpacity(layerId, 0.5);
      expect(mockHistoryManager.push).toHaveBeenCalled();
      const call = mockHistoryManager.push.mock.calls[0];
      expect(call[0]).toBe('set-opacity');
      expect(call[1]).toBe('Set opacity');
      expect(call[2]).toBe('opacity');
      expect(call[3].opacity).toBe(0.5);
    });

    it('setLayerBlendMode changes blend mode', () => {
      const layerId = coordinator.addLayer('Blend Layer', 'raster');
      vi.clearAllMocks();

      coordinator.setLayerBlendMode(layerId, 'multiply');
      expect(mockHistoryManager.push).toHaveBeenCalled();
      const call = mockHistoryManager.push.mock.calls[0];
      expect(call[0]).toBe('set-blend-mode');
      expect(call[1]).toBe('Set blend mode');
      expect(call[2]).toBe('blend');
      expect(call[3].blendMode).toBe('multiply');
    });

    it('setLayerName renames layer', () => {
      const layerId = coordinator.addLayer('Old Name', 'raster');
      vi.clearAllMocks();

      coordinator.setLayerName(layerId, 'New Name');
      expect(mockHistoryManager.push).toHaveBeenCalled();
      const call = mockHistoryManager.push.mock.calls[0];
      expect(call[0]).toBe('set-name');
      expect(call[1]).toBe('Rename layer');
      expect(call[2]).toBe('edit');
      expect(call[3].name).toBe('New Name');
    });

    it('setActiveLayer changes active layer', () => {
      const layerId = coordinator.addLayer('Active Layer', 'raster');
      vi.clearAllMocks();

      const listener = vi.fn();
      coordinator.subscribe('layers-changed', listener);

      coordinator.setActiveLayer(layerId);
      expect(listener).toHaveBeenCalled();
      expect(coordinator.getLayerTreeSnapshot().activeLayerId).toBe(layerId);
    });
  });

  // ========================================================================
  // Subscription System Tests
  // ========================================================================

  describe('Subscription System', () => {
    it('subscribe returns unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = coordinator.subscribe('layers-changed', listener);

      expect(typeof unsubscribe).toBe('function');

      coordinator.addLayer('Test Layer', 'raster');
      expect(listener).toHaveBeenCalled();

      vi.clearAllMocks();
      unsubscribe();

      coordinator.addLayer('Another Layer', 'raster');
      expect(listener).not.toHaveBeenCalled();
    });

    it('unsubscribe removes listener', () => {
      const listener = vi.fn();
      const unsubscribe = coordinator.subscribe('layers-changed', listener);

      unsubscribe();
      coordinator.addLayer('Test Layer', 'raster');

      expect(listener).not.toHaveBeenCalled();
    });

    it('notify only triggers listeners for correct event', () => {
      const layersListener = vi.fn();
      const brushListener = vi.fn();

      coordinator.subscribe('layers-changed', layersListener);
      coordinator.subscribe('brush-changed', brushListener);

      coordinator.addLayer('Test Layer', 'raster');

      expect(layersListener).toHaveBeenCalled();
      expect(brushListener).not.toHaveBeenCalled();
    });

    it('multiple subscribers all notified', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      coordinator.subscribe('layers-changed', listener1);
      coordinator.subscribe('layers-changed', listener2);
      coordinator.subscribe('layers-changed', listener3);

      coordinator.addLayer('Test Layer', 'raster');

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
      expect(listener3).toHaveBeenCalled();
    });

    it('no notification after unsubscribe', () => {
      const listener = vi.fn();
      const unsubscribe = coordinator.subscribe('layers-changed', listener);

      unsubscribe();
      coordinator.addLayer('Test Layer', 'raster');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // Snapshot Getters Tests
  // ========================================================================

  describe('Snapshot Getters', () => {
    it('getLayerTreeSnapshot returns current tree', () => {
      const snapshot = coordinator.getLayerTreeSnapshot();
      expect(snapshot).toEqual(initialLayerTree);
    });

    it('getDocumentSnapshot returns document', () => {
      const snapshot = coordinator.getDocumentSnapshot();
      expect(snapshot).toEqual(testDocument);
    });

    it('getIsDirty returns false initially, true after change', () => {
      expect(coordinator.getIsDirty()).toBe(false);

      coordinator.addLayer('Test Layer', 'raster');
      expect(coordinator.getIsDirty()).toBe(true);
    });

    it('Color getters return defaults', () => {
      expect(coordinator.getForegroundColor()).toBe('#000000');
      expect(coordinator.getBackgroundColor()).toBe('#ffffff');
    });
  });

  // ========================================================================
  // Brush Coordination Tests
  // ========================================================================

  describe('Brush Coordination', () => {
    beforeEach(() => {
      // Set up an active layer for brush operations
      const layerId = coordinator.addLayer('Brush Layer', 'raster');
      coordinator.setActiveLayer(layerId);
    });

    it('onBrushStrokeBegin calls brushEngine.beginStroke', () => {
      const point = { x: 10, y: 20, pressure: 1, timestamp: Date.now() };
      coordinator.onBrushStrokeBegin(point as any);

      expect(mockBrushEngine.beginStroke).toHaveBeenCalled();
    });

    it('onBrushStrokePoint calls brushEngine.addPoint', () => {
      const startPoint = { x: 10, y: 20, pressure: 1, timestamp: Date.now() };
      const movePoint = { x: 15, y: 25, pressure: 0.9, timestamp: Date.now() };

      coordinator.onBrushStrokeBegin(startPoint as any);
      coordinator.onBrushStrokePoint(movePoint as any);

      expect(mockBrushEngine.addPoint).toHaveBeenCalledWith(movePoint);
    });

    it('onBrushStrokeEnd pushes history', () => {
      const point = { x: 10, y: 20, pressure: 1, timestamp: Date.now() };
      vi.clearAllMocks();

      coordinator.onBrushStrokeBegin(point as any);
      coordinator.onBrushStrokeEnd();

      expect(mockHistoryManager.push).toHaveBeenCalled();
      const call = mockHistoryManager.push.mock.calls[0];
      expect(call[0]).toBe('brush-stroke');
    });

    it('setBrushSettings calls brushEngine.updateSettings', () => {
      const settings: Partial<BrushSettings> = { size: 50, opacity: 0.5 };
      coordinator.setBrushSettings(settings);

      expect(mockBrushEngine.updateSettings).toHaveBeenCalledWith(settings);
    });
  });

  // ========================================================================
  // Color Management Tests
  // ========================================================================

  describe('Color Management', () => {
    it('setForegroundColor updates and notifies', () => {
      const listener = vi.fn();
      coordinator.subscribe('document-changed', listener);

      coordinator.setForegroundColor('#ff0000');

      expect(coordinator.getForegroundColor()).toBe('#ff0000');
      expect(listener).toHaveBeenCalled();
    });

    it('swapColors swaps fg/bg', () => {
      coordinator.setForegroundColor('#ff0000');
      coordinator.setBackgroundColor('#00ff00');

      coordinator.swapColors();

      expect(coordinator.getForegroundColor()).toBe('#00ff00');
      expect(coordinator.getBackgroundColor()).toBe('#ff0000');
    });

    it('Default colors are black/white', () => {
      expect(coordinator.getForegroundColor()).toBe('#000000');
      expect(coordinator.getBackgroundColor()).toBe('#ffffff');
    });
  });

  // ========================================================================
  // Cleanup Tests
  // ========================================================================

  describe('Cleanup', () => {
    it('destroy removes all listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      coordinator.subscribe('layers-changed', listener1);
      coordinator.subscribe('brush-changed', listener2);

      coordinator.destroy();

      coordinator.addLayer('Test Layer', 'raster');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it('No notifications after destroy', () => {
      const listener = vi.fn();
      coordinator.subscribe('layers-changed', listener);

      coordinator.destroy();
      coordinator.addLayer('Test Layer', 'raster');

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
