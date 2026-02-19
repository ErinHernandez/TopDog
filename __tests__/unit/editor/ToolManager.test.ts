/**
 * ToolManager Unit Tests
 * Tests the tool management system in TopDog Studio's UI-to-Engine wiring layer.
 * Covers tool selection, options management, pointer event routing, and cleanup.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToolManager, TOOL_REGISTRY, type ToolId } from '@/lib/studio/editor/ToolManager';
import type { EditorCoordinator } from '@/lib/studio/editor/EditorCoordinator';

// ============================================================================
// Mock Factories
// ============================================================================

function createMockCoordinator(): EditorCoordinator {
  const mockSelectionEngine = {
    fromRect: vi.fn(),
    fromEllipse: vi.fn(),
    fromPath: vi.fn(),
  };

  return {
    onBrushStrokeBegin: vi.fn(),
    onBrushStrokePoint: vi.fn(),
    onBrushStrokeEnd: vi.fn(),
    onSelectionChanged: vi.fn(),
    setZoom: vi.fn(),
    setPan: vi.fn(),
    getCanvasEngine: vi.fn(() => ({
      getZoom: vi.fn(() => 1),
      getPan: vi.fn(() => ({ panX: 0, panY: 0 })),
      markDirty: vi.fn(),
      updateViewport: vi.fn(),
    })),
    getSelectionEngine: vi.fn(() => mockSelectionEngine),
    subscribe: vi.fn(() => vi.fn()),
    notify: vi.fn(),
    addLayer: vi.fn(() => 'layer-id'),
    deleteLayer: vi.fn(),
    setActiveLayer: vi.fn(),
    getLayerTreeSnapshot: vi.fn(() => ({
      activeLayerId: 'layer-id',
    })),
    _mockSelectionEngine: mockSelectionEngine,
  } as any;
}

function createMockPointerHandler() {
  const listeners = new Map<string, Set<Function>>();
  return {
    on: vi.fn((event: string, cb: Function) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(cb);
    }),
    off: vi.fn((event: string, cb: Function) => {
      listeners.get(event)?.delete(cb);
    }),
    _trigger: (event: string, data: any) => {
      listeners.get(event)?.forEach(cb => cb(data));
    },
  } as any;
}

// ============================================================================
// Test Suites
// ============================================================================

describe('ToolManager', () => {
  let toolManager: ToolManager;
  let mockCoordinator: any;
  let mockPointerHandler: any;

  beforeEach(() => {
    mockCoordinator = createMockCoordinator();
    toolManager = new ToolManager(mockCoordinator);
    mockPointerHandler = createMockPointerHandler();
  });

  // ========================================================================
  // Construction Tests
  // ========================================================================

  describe('Construction', () => {
    it('creates with default tool (brush)', () => {
      const activeTool = toolManager.getActiveTool();
      expect(activeTool.id).toBe('brush');
      expect(activeTool.category).toBe('brush');
    });

    it('has 27 tools in registry', () => {
      const allTools = toolManager.getAllTools();
      expect(allTools.length).toBe(27);
      expect(TOOL_REGISTRY.length).toBe(27);
    });
  });

  // ========================================================================
  // Tool Selection Tests
  // ========================================================================

  describe('Tool Selection', () => {
    it('setActiveTool changes active tool', () => {
      toolManager.setActiveTool('eraser');
      expect(toolManager.getActiveTool().id).toBe('eraser');
    });

    it('setActiveTool notifies subscribers', () => {
      const listener = vi.fn();
      toolManager.subscribe(listener);

      toolManager.setActiveTool('pencil');
      expect(listener).toHaveBeenCalled();
    });

    it('getToolDescriptor returns correct tool', () => {
      const descriptor = toolManager.getToolDescriptor('brush');
      expect(descriptor).toBeDefined();
      expect(descriptor?.id).toBe('brush');
      expect(descriptor?.name).toBe('Brush');
    });

    it('getAllTools returns 27 tools', () => {
      const tools = toolManager.getAllTools();
      expect(tools.length).toBe(27);
      expect(tools[0].id).toBe('brush');
    });

    it('getToolsByCategory filters correctly', () => {
      const brushTools = toolManager.getToolsByCategory('brush');
      expect(brushTools.length).toBe(3);
      expect(brushTools.every(t => t.category === 'brush')).toBe(true);

      const selectionTools = toolManager.getToolsByCategory('selection');
      expect(selectionTools.length).toBe(4);
      expect(selectionTools.every(t => t.category === 'selection')).toBe(true);
    });
  });

  // ========================================================================
  // Tool Options Tests
  // ========================================================================

  describe('Tool Options', () => {
    it('getToolOptions returns empty default', () => {
      const options = toolManager.getToolOptions();
      expect(options).toEqual({});
    });

    it('setToolOption stores value for active tool', () => {
      toolManager.setToolOption('brushSize', 50);
      const options = toolManager.getToolOptions();
      expect(options.brushSize).toBe(50);
    });

    it('Tool options persist across tool switches', () => {
      toolManager.setToolOption('brushSize', 50);
      toolManager.setActiveTool('eraser');
      toolManager.setActiveTool('brush');

      const options = toolManager.getToolOptions();
      expect(options.brushSize).toBe(50);
    });

    it('setToolOptions replaces all options', () => {
      toolManager.setToolOption('brushSize', 50);
      toolManager.setToolOption('opacity', 0.5);

      toolManager.setToolOptions({ brushSize: 100, hardness: 0.8 });

      const options = toolManager.getToolOptions();
      expect(options.brushSize).toBe(100);
      expect(options.hardness).toBe(0.8);
      expect(options.opacity).toBeUndefined();
    });
  });

  // ========================================================================
  // Subscription Tests
  // ========================================================================

  describe('Subscription', () => {
    it('subscribe returns unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = toolManager.subscribe(listener);

      toolManager.setActiveTool('eraser');
      expect(listener).toHaveBeenCalled();

      vi.clearAllMocks();
      unsubscribe();

      toolManager.setActiveTool('pencil');
      expect(listener).not.toHaveBeenCalled();
    });

    it('Listeners notified on tool change', () => {
      const listener = vi.fn();
      toolManager.subscribe(listener);

      toolManager.setActiveTool('eraser');
      expect(listener).toHaveBeenCalledTimes(1);

      toolManager.setActiveTool('pencil');
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('getSnapshot returns current state', () => {
      toolManager.setActiveTool('eraser');
      toolManager.setToolOption('size', 25);

      const snapshot = toolManager.getSnapshot();
      expect(snapshot.activeTool.id).toBe('eraser');
      expect(snapshot.options.size).toBe(25);
    });
  });

  // ========================================================================
  // Pointer Event Routing Tests
  // ========================================================================

  describe('Pointer Event Routing', () => {
    beforeEach(() => {
      toolManager.setPointerHandler(mockPointerHandler);
    });

    it('Brush tool routes to coordinator.onBrushStrokeBegin/Point/End', () => {
      toolManager.setActiveTool('brush');

      const pointerDownEvent = {
        canvasX: 10,
        canvasY: 20,
        pressure: 1,
        timestamp: Date.now(),
        button: 0,
        pointerId: 0,
        pointerType: 'pen',
      };

      mockPointerHandler._trigger('pointer-down', pointerDownEvent);
      expect(mockCoordinator.onBrushStrokeBegin).toHaveBeenCalled();

      const pointerMoveEvent = {
        canvasX: 15,
        canvasY: 25,
        pressure: 0.9,
        timestamp: Date.now(),
        pointerId: 0,
        pointerType: 'pen',
      };

      mockPointerHandler._trigger('pointer-move', pointerMoveEvent);
      expect(mockCoordinator.onBrushStrokePoint).toHaveBeenCalled();

      mockPointerHandler._trigger('pointer-up', {
        canvasX: 20,
        canvasY: 30,
        pointerId: 0,
        pointerType: 'pen',
      });
      expect(mockCoordinator.onBrushStrokeEnd).toHaveBeenCalled();
    });

    it('Hand tool calls coordinator.setPan', () => {
      toolManager.setActiveTool('hand');

      mockPointerHandler._trigger('pointer-down', {
        canvasX: 100,
        canvasY: 100,
        pointerId: 0,
        pointerType: 'pen',
      });

      mockPointerHandler._trigger('pointer-move', {
        canvasX: 120,
        canvasY: 110,
        pointerId: 0,
        pointerType: 'pen',
      });

      expect(mockCoordinator.setPan).toHaveBeenCalled();
    });

    it('Zoom tool calls coordinator.setZoom on click', () => {
      toolManager.setActiveTool('zoom');

      // Left click = zoom in
      mockPointerHandler._trigger('pointer-down', {
        canvasX: 100,
        canvasY: 100,
        button: 0,
        pointerId: 0,
        pointerType: 'pen',
      });

      expect(mockCoordinator.setZoom).toHaveBeenCalled();
      const zoomCall = mockCoordinator.setZoom.mock.calls[0][0];
      expect(zoomCall).toBeGreaterThan(1); // Zoomed in
    });

    it('Selection tool tracks drag rectangle', () => {
      toolManager.setActiveTool('selection-rect');

      mockPointerHandler._trigger('pointer-down', {
        canvasX: 50,
        canvasY: 50,
        pointerId: 0,
        pointerType: 'pen',
      });

      mockPointerHandler._trigger('pointer-up', {
        canvasX: 150,
        canvasY: 150,
        pointerId: 0,
        pointerType: 'pen',
      });

      const selectionEngine = mockCoordinator._mockSelectionEngine;
      expect(selectionEngine.fromRect).toHaveBeenCalled();

      const rectCall = selectionEngine.fromRect.mock.calls[0];
      const rect = rectCall[0];
      expect(rect.x).toBe(50);
      expect(rect.y).toBe(50);
      expect(rect.width).toBe(100);
      expect(rect.height).toBe(100);
    });
  });

  // ========================================================================
  // Cleanup Tests
  // ========================================================================

  describe('Cleanup', () => {
    it('destroy cleans up listeners', () => {
      const listener = vi.fn();
      toolManager.subscribe(listener);

      toolManager.destroy();

      toolManager.setActiveTool('eraser');
      expect(listener).not.toHaveBeenCalled();
    });

    it('No notifications after destroy', () => {
      const listener = vi.fn();
      toolManager.subscribe(listener);

      toolManager.destroy();

      toolManager.setActiveTool('pencil');
      toolManager.setToolOption('size', 100);

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
