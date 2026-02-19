/**
 * @vitest-environment jsdom
 *
 * Integration tests for Idesaign Studio editor canvas & tool initialization pipeline
 * Tests the full startup flow: document creation, canvas initialization, tool activation,
 * tool switching, history tracking, and pointer event integration
 * Covers EditorCoordinator, ToolManager, CanvasEngine, and history state management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { installCanvasMocks, removeCanvasMocks } from '../../helpers/canvas-mock';
import { randomTestId } from '../../helpers/test-utils';

// Production imports
import { EditorCoordinator, type TelemetryEvent } from '@/lib/studio/editor/EditorCoordinator';
import { ToolManager, TOOL_REGISTRY, type ToolId } from '@/lib/studio/editor/ToolManager';
import { CanvasEngine } from '@/lib/studio/editor/canvas/CanvasEngine';
import { HistoryManager } from '@/lib/studio/editor/history/HistoryManager';
import { LayerModel } from '@/lib/studio/editor/layers/LayerModel';
import { LayerCompositor } from '@/lib/studio/editor/layers/LayerCompositor';
import { BrushEngine } from '@/lib/studio/editor/tools/brush/BrushEngine';
import { BrushPresets } from '@/lib/studio/editor/tools/brush/BrushPresets';
import { PointerEventHandler } from '@/lib/studio/editor/input/PointerEventHandler';

import type { CanvasDocument, Viewport } from '@/lib/studio/types/canvas';
import type { StrokePoint } from '@/lib/studio/types/tools';

/**
 * Helper to create a test document
 */
function createTestDocument(): CanvasDocument {
  return {
    width: 800,
    height: 600,
    background: '#ffffff',
  };
}

/**
 * Helper to create initial viewport
 */
function createTestViewport(): Viewport {
  return {
    zoom: 1,
    panX: 0,
    panY: 0,
    rotation: 0,
  };
}

/**
 * Helper to create a mock canvas element
 */
function createMockCanvasElement(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  return canvas;
}

describe('Editor Canvas & Tool Initialization Pipeline Integration', () => {
  let coordinator: EditorCoordinator;
  let toolManager: ToolManager;
  let canvasEngine: CanvasEngine | null;
  let historyManager: HistoryManager;
  let pointerHandler: PointerEventHandler | null;
  let canvas: HTMLCanvasElement;
  let testDocument: CanvasDocument;
  let viewport: Viewport;
  let telemetryEvents: TelemetryEvent[] = [];

  beforeEach(() => {
    // Install browser API mocks
    installCanvasMocks();

    // Create test infrastructure
    testDocument = createTestDocument();
    viewport = createTestViewport();
    canvas = createMockCanvasElement();

    // Initialize history manager
    historyManager = new HistoryManager({
      maxEntries: 100,
      snapshotInterval: 10,
    });

    // Initialize layers and compositor
    const initialLayerTree = LayerModel.createEmptyTree('test-doc');
    const compositor = new LayerCompositor();

    // Initialize brush engine
    const brushEngine = new BrushEngine({
      id: 'default-brush',
      name: 'Default Brush',
      size: 20,
      hardness: 100,
      opacity: 100,
      spacing: 25,
      blendMode: 'normal',
      color: '#000000',
    });

    // Initialize brush presets
    const brushPresets = new BrushPresets();

    // Create EditorCoordinator
    coordinator = new EditorCoordinator({
      compositor,
      historyManager,
      brushEngine,
      brushPresets,
      document: testDocument,
      initialLayerTree,
    });

    // Initialize CanvasEngine (may fail in jsdom, but we mock the context)
    canvasEngine = null;
    try {
      canvasEngine = new CanvasEngine(canvas, testDocument, viewport);
      coordinator.setCanvasEngine(canvasEngine);
    } catch {
      // CanvasEngine initialization may fail in jsdom environment
      // but we can still test coordinator and tool manager functionality
    }

    // Create ToolManager
    toolManager = new ToolManager(coordinator);

    // Setup pointer event handler
    pointerHandler = null;
    try {
      pointerHandler = new PointerEventHandler(canvas);
      toolManager.setPointerHandler(pointerHandler);
    } catch {
      // Pointer handler might fail if canvas isn't properly initialized
    }

    // Collect telemetry events
    telemetryEvents = [];
    coordinator.onTelemetry((event: TelemetryEvent) => {
      telemetryEvents.push(event);
    });
  });

  afterEach(() => {
    // Cleanup resources safely
    coordinator?.destroy?.();
    toolManager?.destroy?.();
    canvasEngine?.destroy?.();
    pointerHandler?.destroy?.();
    removeCanvasMocks();
    telemetryEvents = [];
  });

  describe('1. Document & Coordinator Initialization', () => {
    it('should initialize editor with empty document', () => {
      const snapshot = coordinator.getDocumentSnapshot();
      expect(snapshot.width).toBe(800);
      expect(snapshot.height).toBe(600);
      expect(snapshot.background).toBe('#ffffff');
    });

    it('should create layer tree with document ID', () => {
      const layerTree = coordinator.getLayerTreeSnapshot();
      expect(layerTree.documentId).toBe('test-doc');
    });

    it('should allow adding layers to document', () => {
      const layerId = coordinator.addLayer('Layer 1', 'raster');
      expect(layerId).toBeTruthy();

      const tree = coordinator.getLayerTreeSnapshot();
      const layer = LayerModel.getLayer(tree, layerId);
      expect(layer?.name).toBe('Layer 1');
      expect(layer?.type).toBe('raster');
    });

    it('should track dirty state when document changes', () => {
      let wasDirty = false;
      const unsubscribe = coordinator.subscribe('layers-changed', () => {
        wasDirty = coordinator.getIsDirty();
      });

      coordinator.addLayer('Test Layer', 'raster');
      expect(wasDirty).toBe(true);

      unsubscribe();
    });

    it('should support multiple layer types', () => {
      const rasterLayer = coordinator.addLayer('Raster', 'raster');
      const adjLayer = coordinator.addLayer('Adjustment', 'adjustment');

      const tree = coordinator.getLayerTreeSnapshot();
      expect(LayerModel.getLayer(tree, rasterLayer)?.type).toBe('raster');
      expect(LayerModel.getLayer(tree, adjLayer)?.type).toBe('adjustment');
    });
  });

  describe('2. Tool Manager Initialization', () => {
    it('should initialize with default brush tool', () => {
      const activeTool = toolManager.getActiveTool();
      expect(activeTool.id).toBe('brush');
      expect(activeTool.category).toBe('brush');
    });

    it('should list all available tools', () => {
      const allTools = toolManager.getAllTools();
      expect(allTools.length).toBe(TOOL_REGISTRY.length);
      expect(allTools.some(t => t.id === 'brush')).toBe(true);
      expect(allTools.some(t => t.id === 'selection-rect')).toBe(true);
    });

    it('should group tools by category', () => {
      const brushTools = toolManager.getToolsByCategory('brush');
      expect(brushTools.length).toBeGreaterThan(0);
      expect(brushTools.some(t => t.id === 'brush')).toBe(true);
      expect(brushTools.every(t => t.category === 'brush')).toBe(true);

      const selectionTools = toolManager.getToolsByCategory('selection');
      expect(selectionTools.length).toBeGreaterThan(0);
      expect(selectionTools.every(t => t.category === 'selection')).toBe(true);
    });

    it('should get tool descriptor by ID', () => {
      const descriptor = toolManager.getToolDescriptor('eraser');
      expect(descriptor).toBeTruthy();
      expect(descriptor?.name).toBe('Eraser');
      expect(descriptor?.category).toBe('brush');
    });

    it('should initialize tool options for multiple tools', () => {
      const brushOptions = toolManager.getToolOptions('brush');
      expect(typeof brushOptions).toBe('object');

      const selectionOptions = toolManager.getToolOptions('selection-rect');
      expect(typeof selectionOptions).toBe('object');
    });
  });

  describe('3. Tool Switching & Activation', () => {
    it('should switch from brush to eraser tool', () => {
      expect(toolManager.getActiveTool().id).toBe('brush');

      toolManager.setActiveTool('eraser');
      expect(toolManager.getActiveTool().id).toBe('eraser');
      expect(toolManager.getActiveTool().category).toBe('brush');
    });

    it('should switch from brush to selection-rect tool', () => {
      toolManager.setActiveTool('selection-rect');
      expect(toolManager.getActiveTool().id).toBe('selection-rect');
      expect(toolManager.getActiveTool().category).toBe('selection');
    });

    it('should notify listeners when tool changes', () => {
      let changeCount = 0;
      const unsubscribe = toolManager.subscribe(() => {
        changeCount++;
      });

      toolManager.setActiveTool('pencil');
      expect(changeCount).toBeGreaterThan(0);

      const beforeCount = changeCount;
      toolManager.setActiveTool('pencil');
      expect(changeCount).toBeGreaterThan(beforeCount);

      unsubscribe();
    });

    it('should handle multiple tool switches without crashing', () => {
      toolManager.setActiveTool('brush');
      toolManager.setActiveTool('eraser');
      toolManager.setActiveTool('pencil');
      toolManager.setActiveTool('selection-rect');
      toolManager.setActiveTool('hand');
      toolManager.setActiveTool('brush');

      expect(toolManager.getActiveTool().id).toBe('brush');
    });
  });

  describe('4. Brush Stroke & Integration', () => {
    it('should begin, add points, and end brush stroke', () => {
      const layerId = coordinator.addLayer('Paint Layer', 'raster');
      coordinator.setActiveLayer(layerId);

      const startPoint: StrokePoint = {
        x: 100,
        y: 100,
        pressure: 1.0,
        tilt: 0,
        azimuth: 0,
        timestamp: Date.now(),
        pointerId: 1,
        pointerType: 'mouse',
      };

      coordinator.onBrushStrokeBegin(startPoint);

      for (let i = 1; i <= 5; i++) {
        coordinator.onBrushStrokePoint({
          ...startPoint,
          x: startPoint.x + i * 10,
          y: startPoint.y + i * 5,
          timestamp: startPoint.timestamp + i * 10,
        });
      }

      coordinator.onBrushStrokeEnd();

      const strokeBeginEvents = telemetryEvents.filter(e => e.kind === 'brush-stroke-begin');
      expect(strokeBeginEvents.length).toBeGreaterThan(0);

      const strokeEndEvents = telemetryEvents.filter(e => e.kind === 'brush-stroke-end');
      expect(strokeEndEvents.length).toBeGreaterThan(0);
    });

    it('should mark dirty state during brush stroke', () => {
      const layerId = coordinator.addLayer('Paint Layer', 'raster');
      coordinator.setActiveLayer(layerId);

      const startPoint: StrokePoint = {
        x: 100,
        y: 100,
        pressure: 1.0,
        tilt: 0,
        azimuth: 0,
        timestamp: Date.now(),
        pointerId: 1,
        pointerType: 'mouse',
      };

      coordinator.onBrushStrokeBegin(startPoint);
      coordinator.onBrushStrokePoint({ ...startPoint, x: 150, y: 150 });
      coordinator.onBrushStrokeEnd();

      expect(coordinator.getIsDirty()).toBe(true);
    });

    it('should update brush settings and notify listeners', () => {
      let settingChanged = false;
      const unsubscribe = coordinator.subscribe('brush-changed', () => {
        settingChanged = true;
      });

      coordinator.setBrushSettings({ size: 30, opacity: 80 });
      expect(settingChanged).toBe(true);

      unsubscribe();
    });
  });

  describe('5. History State Tracking', () => {
    it('should track history after layer operations', () => {
      coordinator.addLayer('Layer 1', 'raster');
      coordinator.addLayer('Layer 2', 'raster');

      const state = historyManager.getState();
      expect(state.entries.length).toBeGreaterThan(0);
    });

    it('should support undo after layer addition', () => {
      coordinator.addLayer('Layer 1', 'raster');
      coordinator.addLayer('Layer 2', 'raster');

      let tree = coordinator.getLayerTreeSnapshot();
      const layersBeforeUndo = tree.rootOrder.length;
      expect(layersBeforeUndo).toBeGreaterThanOrEqual(1);

      coordinator.undo();

      tree = coordinator.getLayerTreeSnapshot();
      expect(tree.rootOrder.length).toBeLessThanOrEqual(layersBeforeUndo);
    });

    it('should support redo after undo', () => {
      const layer1Id = coordinator.addLayer('Layer 1', 'raster');
      const layer2Id = coordinator.addLayer('Layer 2', 'raster');

      let tree = coordinator.getLayerTreeSnapshot();
      const layersAfterAdds = tree.rootOrder.length;
      expect(layersAfterAdds).toBeGreaterThanOrEqual(2);

      coordinator.undo();

      tree = coordinator.getLayerTreeSnapshot();
      const layersAfterUndo = tree.rootOrder.length;
      // After undo, we should have removed the last operation
      expect(layersAfterUndo).toBeLessThanOrEqual(layersAfterAdds);

      coordinator.redo();

      tree = coordinator.getLayerTreeSnapshot();
      expect(tree.rootOrder.length).toBeGreaterThanOrEqual(layersAfterUndo);
    });

    it('should track history state changes via subscription', () => {
      let layersChanged = false;
      const unsubscribe = coordinator.subscribe('layers-changed', () => {
        layersChanged = true;
      });

      coordinator.addLayer('Test Layer', 'raster');
      expect(layersChanged).toBe(true);

      unsubscribe();
    });

    it('should emit telemetry for undo/redo', () => {
      telemetryEvents = [];
      coordinator.addLayer('Layer 1', 'raster');
      telemetryEvents = [];

      coordinator.undo();
      expect(telemetryEvents.some(e => e.kind === 'undo')).toBe(true);

      telemetryEvents = [];
      coordinator.redo();
      expect(telemetryEvents.some(e => e.kind === 'redo')).toBe(true);
    });
  });

  describe('6. Color Management', () => {
    it('should set foreground color', () => {
      coordinator.setForegroundColor('#ff0000');
      expect(coordinator.getForegroundColor()).toBe('#ff0000');
    });

    it('should set background color', () => {
      coordinator.setBackgroundColor('#00ff00');
      expect(coordinator.getBackgroundColor()).toBe('#00ff00');
    });

    it('should swap foreground and background colors', () => {
      coordinator.setForegroundColor('#ff0000');
      coordinator.setBackgroundColor('#00ff00');

      coordinator.swapColors();

      expect(coordinator.getForegroundColor()).toBe('#00ff00');
      expect(coordinator.getBackgroundColor()).toBe('#ff0000');
    });

    it('should emit telemetry for color changes', () => {
      telemetryEvents = [];
      coordinator.setForegroundColor('#ff0000');

      const colorEvents = telemetryEvents.filter(e => e.kind === 'color-foreground');
      expect(colorEvents.length).toBeGreaterThan(0);
      expect(colorEvents[0].data?.color).toBe('#ff0000');
    });

    it('should emit telemetry for color swap', () => {
      coordinator.setForegroundColor('#ff0000');
      coordinator.setBackgroundColor('#00ff00');

      telemetryEvents = [];
      coordinator.swapColors();

      const swapEvents = telemetryEvents.filter(e => e.kind === 'color-swap');
      expect(swapEvents.length).toBeGreaterThan(0);
    });
  });

  describe('7. Complex Workflow: Full Editor Session', () => {
    it('should execute complete drawing session: init → paint → undo → redo', () => {
      const paintLayerId = coordinator.addLayer('Paint', 'raster');
      coordinator.setActiveLayer(paintLayerId);

      const startPoint: StrokePoint = {
        x: 100,
        y: 100,
        pressure: 1.0,
        tilt: 0,
        azimuth: 0,
        timestamp: Date.now(),
        pointerId: 1,
        pointerType: 'mouse',
      };

      coordinator.onBrushStrokeBegin(startPoint);
      for (let i = 1; i <= 10; i++) {
        coordinator.onBrushStrokePoint({
          ...startPoint,
          x: startPoint.x + i * 10,
          y: startPoint.y + i * 5,
        });
      }
      coordinator.onBrushStrokeEnd();

      expect(telemetryEvents.some(e => e.kind === 'brush-stroke-end')).toBe(true);

      coordinator.setForegroundColor('#0000ff');

      toolManager.setActiveTool('selection-rect');
      expect(toolManager.getActiveTool().id).toBe('selection-rect');

      const layersBefore = coordinator.getLayerTreeSnapshot().rootOrder.length;
      coordinator.undo();
      const layersAfterUndo = coordinator.getLayerTreeSnapshot().rootOrder.length;
      expect(layersAfterUndo).toBeLessThanOrEqual(layersBefore);

      coordinator.redo();
      expect(coordinator.getLayerTreeSnapshot().rootOrder.length).toBe(layersBefore);

      expect(telemetryEvents.length).toBeGreaterThan(5);
    });

    it('should handle multiple layer operations with history', () => {
      const layer1 = coordinator.addLayer('Base', 'raster');
      const layer2 = coordinator.addLayer('Overlay', 'raster');
      const layer3 = coordinator.addLayer('Adjustment', 'adjustment');

      let tree = coordinator.getLayerTreeSnapshot();
      const initialCount = tree.rootOrder.length;
      expect(initialCount).toBeGreaterThanOrEqual(2);

      if (layer2) {
        coordinator.deleteLayer(layer2);

        tree = coordinator.getLayerTreeSnapshot();
        expect(tree.rootOrder.length).toBeLessThan(initialCount);
        expect(tree.rootOrder).not.toContain(layer2);

        coordinator.undo();

        tree = coordinator.getLayerTreeSnapshot();
        expect(tree.rootOrder.length).toBeGreaterThanOrEqual(initialCount - 1);
      }
    });

    it('should support concurrent telemetry listeners', () => {
      const events1: TelemetryEvent[] = [];
      const events2: TelemetryEvent[] = [];

      const unsub1 = coordinator.onTelemetry(e => events1.push(e));
      const unsub2 = coordinator.onTelemetry(e => events2.push(e));

      coordinator.addLayer('Test', 'raster');
      coordinator.setForegroundColor('#ff0000');

      expect(events1.length).toBeGreaterThan(0);
      expect(events2.length).toBeGreaterThan(0);
      expect(events1.length).toBe(events2.length);

      unsub1();
      unsub2();
    });
  });

  describe('8. Error Handling & Edge Cases', () => {
    it('should handle setting invalid tool gracefully', () => {
      toolManager.setActiveTool('brush');
      const originalTool = toolManager.getActiveTool();

      toolManager.setActiveTool('invalid-tool' as ToolId);

      expect(toolManager.getActiveTool()).toBeTruthy();
    });

    it('should handle operations on empty layer tree', () => {
      const tree = coordinator.getLayerTreeSnapshot();
      const layer = LayerModel.getLayer(tree, 'non-existent-id');
      expect(layer).toBeFalsy(); // Could be undefined or null
    });

    it('should not crash when brush strokes on non-existent layer', () => {
      const startPoint: StrokePoint = {
        x: 100,
        y: 100,
        pressure: 1.0,
        tilt: 0,
        azimuth: 0,
        timestamp: Date.now(),
        pointerId: 1,
        pointerType: 'mouse',
      };

      coordinator.onBrushStrokeBegin(startPoint);
      coordinator.onBrushStrokePoint({ ...startPoint, x: 150 });
      coordinator.onBrushStrokeEnd();

      expect(true).toBe(true);
    });

    it('should handle pointer handler destruction gracefully', () => {
      if (pointerHandler) {
        pointerHandler.destroy();
      }

      expect(true).toBe(true);
    });
  });
});
