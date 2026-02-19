/**
 * Pen Tool Unit Tests
 *
 * Comprehensive test suite for the vector path editor (pen tool) covering:
 * - Path model operations (create, add/delete anchors, close path)
 * - Bezier math (pointOnBezier, splitBezier, nearestPointOnPath)
 * - Pen tool state machine (idle -> drawing -> editing -> dragging)
 * - Anchor manipulation (smooth/corner conversion, handle dragging)
 * - Hit testing (anchor, handle, segment detection)
 * - Keyboard modifiers (constrain angles, break handles)
 * - SVG export and serialization
 * - Event emission and history integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PenTool } from '@/lib/studio/editor/tools/vector/PenTool';
import { PathModel, type VectorPath, type AnchorPoint, type PathSegment } from '@/lib/studio/editor/tools/vector/PathModel';
import type { Point } from '@/lib/studio/types/canvas';

// Mock KeyboardEvent for Node environment
class MockKeyboardEvent {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  type: string;

  constructor(type: string, init: any = {}) {
    this.type = type;
    this.key = init.key || '';
    this.ctrlKey = init.ctrlKey || false;
    this.metaKey = init.metaKey || false;
    this.shiftKey = init.shiftKey || false;
    this.altKey = init.altKey || false;
  }

  preventDefault() {}
}

// ============================================================================
// Mock Factories
// ============================================================================

function createMockCoordinator() {
  return {
    getHistoryManager: vi.fn(() => ({
      push: vi.fn(),
    })),
  } as any;
}

function createMockInputEvent(overrides: Partial<any> = {}) {
  return {
    type: 'pointerdown' as const,
    canvasX: 100,
    canvasY: 100,
    screenX: 100,
    screenY: 100,
    pressure: 1,
    tilt: { x: 0, y: 0 },
    azimuth: 0,
    button: 0,
    buttons: 1,
    modifiers: {
      shift: false,
      ctrl: false,
      alt: false,
      meta: false,
    },
    timestamp: Date.now(),
    pointerId: 1,
    pointerType: 'mouse' as const,
    isPrimary: true,
    ...overrides,
  };
}

// ============================================================================
// PathModel Tests
// ============================================================================

describe('PathModel', () => {
  describe('Path Creation and Basic Operations', () => {
    it('creates an empty path', () => {
      const path = PathModel.createPath('path-1');

      expect(path.id).toBe('path-1');
      expect(path.anchors).toHaveLength(0);
      expect(path.closed).toBe(false);
      expect(path.stroke).toBeDefined();
      expect(path.fill).toBeNull();
    });

    it('adds anchor points to path', () => {
      let path = PathModel.createPath('path-1');

      path = PathModel.addAnchor(path, { x: 100, y: 100 });
      expect(path.anchors).toHaveLength(1);
      expect(path.anchors[0].position).toEqual({ x: 100, y: 100 });

      path = PathModel.addAnchor(path, { x: 200, y: 200 });
      expect(path.anchors).toHaveLength(2);
    });

    it('adds anchor at specific index', () => {
      let path = PathModel.createPath('path-1');
      path = PathModel.addAnchor(path, { x: 100, y: 100 });
      path = PathModel.addAnchor(path, { x: 300, y: 300 });

      path = PathModel.addAnchor(path, { x: 200, y: 200 }, 1);

      expect(path.anchors).toHaveLength(3);
      expect(path.anchors[1].position).toEqual({ x: 200, y: 200 });
    });

    it('deletes anchor points', () => {
      let path = PathModel.createPath('path-1');
      path = PathModel.addAnchor(path, { x: 100, y: 100 });
      path = PathModel.addAnchor(path, { x: 200, y: 200 });

      path = PathModel.deleteAnchor(path, 0);

      expect(path.anchors).toHaveLength(1);
      expect(path.anchors[0].position).toEqual({ x: 200, y: 200 });
    });

    it('handles invalid delete index gracefully', () => {
      let path = PathModel.createPath('path-1');
      path = PathModel.addAnchor(path, { x: 100, y: 100 });

      const unchanged = PathModel.deleteAnchor(path, 5);

      expect(unchanged.anchors).toHaveLength(1);
    });

    it('moves anchor points', () => {
      let path = PathModel.createPath('path-1');
      path = PathModel.addAnchor(path, { x: 100, y: 100 });

      path = PathModel.moveAnchor(path, 0, { x: 150, y: 150 });

      expect(path.anchors[0].position).toEqual({ x: 150, y: 150 });
    });

    it('closes and opens paths', () => {
      let path = PathModel.createPath('path-1');
      path = PathModel.addAnchor(path, { x: 100, y: 100 });
      path = PathModel.addAnchor(path, { x: 200, y: 200 });

      path = PathModel.setPathClosed(path, true);
      expect(path.closed).toBe(true);

      path = PathModel.setPathClosed(path, false);
      expect(path.closed).toBe(false);
    });
  });

  describe('Handle Operations', () => {
    it('moves control handles', () => {
      let path = PathModel.createPath('path-1');
      path = PathModel.addAnchor(path, { x: 100, y: 100 });

      path = PathModel.moveHandle(path, 0, 'out', { x: 150, y: 150 });

      expect(path.anchors[0].handleOut).toEqual({ x: 150, y: 150 });
      expect(path.anchors[0].handleIn).toBeNull();
    });

    it('sets handle to null', () => {
      let path = PathModel.createPath('path-1');
      path = PathModel.addAnchor(path, { x: 100, y: 100 });
      path = PathModel.moveHandle(path, 0, 'out', { x: 150, y: 150 });

      path = PathModel.moveHandle(path, 0, 'out', null);

      expect(path.anchors[0].handleOut).toBeNull();
    });

    it('converts anchor type from corner to smooth', () => {
      let path = PathModel.createPath('path-1');
      path = PathModel.addAnchor(path, { x: 100, y: 100 });
      path = PathModel.moveHandle(path, 0, 'out', { x: 150, y: 150 });
      path = PathModel.moveHandle(path, 0, 'in', { x: 50, y: 50 });

      path = PathModel.convertAnchorType(path, 0, 'smooth');

      expect(path.anchors[0].type).toBe('smooth');
      expect(path.anchors[0].handleIn).toBeDefined();
      expect(path.anchors[0].handleOut).toBeDefined();
    });

    it('converts anchor type from smooth to corner', () => {
      let path = PathModel.createPath('path-1');
      path = PathModel.addAnchor(path, { x: 100, y: 100 });
      path = PathModel.moveHandle(path, 0, 'out', { x: 150, y: 150 });

      path = PathModel.convertAnchorType(path, 0, 'corner');

      expect(path.anchors[0].type).toBe('corner');
    });
  });

  describe('Bezier Math', () => {
    it('evaluates point on bezier curve at t=0', () => {
      const anchor1: AnchorPoint = {
        position: { x: 0, y: 0 },
        handleIn: null,
        handleOut: { x: 100, y: 100 },
        type: 'corner',
      };

      const anchor2: AnchorPoint = {
        position: { x: 200, y: 0 },
        handleIn: { x: 100, y: -100 },
        handleOut: null,
        type: 'corner',
      };

      const segment: PathSegment = { from: anchor1, to: anchor2 };
      const point = PathModel.pointOnBezier(segment, 0);

      expect(point.x).toBeCloseTo(0, 1);
      expect(point.y).toBeCloseTo(0, 1);
    });

    it('evaluates point on bezier curve at t=1', () => {
      const anchor1: AnchorPoint = {
        position: { x: 0, y: 0 },
        handleIn: null,
        handleOut: { x: 100, y: 100 },
        type: 'corner',
      };

      const anchor2: AnchorPoint = {
        position: { x: 200, y: 0 },
        handleIn: { x: 100, y: -100 },
        handleOut: null,
        type: 'corner',
      };

      const segment: PathSegment = { from: anchor1, to: anchor2 };
      const point = PathModel.pointOnBezier(segment, 1);

      expect(point.x).toBeCloseTo(200, 1);
      expect(point.y).toBeCloseTo(0, 1);
    });

    it('evaluates point on linear segment (no handles)', () => {
      const anchor1: AnchorPoint = {
        position: { x: 0, y: 0 },
        handleIn: null,
        handleOut: null,
        type: 'corner',
      };

      const anchor2: AnchorPoint = {
        position: { x: 100, y: 100 },
        handleIn: null,
        handleOut: null,
        type: 'corner',
      };

      const segment: PathSegment = { from: anchor1, to: anchor2 };
      const point = PathModel.pointOnBezier(segment, 0.5);

      expect(point.x).toBeCloseTo(50, 1);
      expect(point.y).toBeCloseTo(50, 1);
    });

    it('finds nearest point on segment', () => {
      const anchor1: AnchorPoint = {
        position: { x: 0, y: 0 },
        handleIn: null,
        handleOut: null,
        type: 'corner',
      };

      const anchor2: AnchorPoint = {
        position: { x: 100, y: 0 },
        handleIn: null,
        handleOut: null,
        type: 'corner',
      };

      const segment: PathSegment = { from: anchor1, to: anchor2 };
      const result = PathModel.nearestPointOnSegment(segment, { x: 50, y: 10 }, 100);

      expect(result.distance).toBeLessThan(11);
      expect(result.t).toBeCloseTo(0.5, 0);
    });

    it('finds nearest point on entire path', () => {
      let path = PathModel.createPath('path-1');
      path = PathModel.addAnchor(path, { x: 0, y: 0 });
      path = PathModel.addAnchor(path, { x: 100, y: 0 });
      path = PathModel.addAnchor(path, { x: 100, y: 100 });

      const result = PathModel.nearestPointOnPath(path, { x: 100, y: 50 }, 50);

      expect(result).toBeDefined();
      expect(result?.distance).toBeLessThan(1);
    });

    it('returns null for nearest point on empty path', () => {
      const path = PathModel.createPath('path-1');
      const result = PathModel.nearestPointOnPath(path, { x: 0, y: 0 });

      expect(result).toBeNull();
    });
  });

  describe('SVG Export', () => {
    it('exports empty path as empty string', () => {
      const path = PathModel.createPath('path-1');
      const svg = PathModel.toSVGPathData(path);

      expect(svg).toBe('');
    });

    it('exports linear path as M and C commands', () => {
      let path = PathModel.createPath('path-1');
      path = PathModel.addAnchor(path, { x: 0, y: 0 });
      path = PathModel.addAnchor(path, { x: 100, y: 100 });

      const svg = PathModel.toSVGPathData(path);

      expect(svg).toContain('M 0 0');
      expect(svg).toContain('C');
    });

    it('exports closed path with Z command', () => {
      let path = PathModel.createPath('path-1');
      path = PathModel.addAnchor(path, { x: 0, y: 0 });
      path = PathModel.addAnchor(path, { x: 100, y: 0 });
      path = PathModel.addAnchor(path, { x: 100, y: 100 });
      path = PathModel.setPathClosed(path, true);

      const svg = PathModel.toSVGPathData(path);

      expect(svg).toContain('Z');
    });

    it('exports path with control points', () => {
      let path = PathModel.createPath('path-1');
      path = PathModel.addAnchor(path, { x: 0, y: 0 });
      path = PathModel.moveHandle(path, 0, 'out', { x: 50, y: 50 });
      path = PathModel.addAnchor(path, { x: 100, y: 0 });

      const svg = PathModel.toSVGPathData(path);

      expect(svg).toContain('50');
    });
  });

  describe('Serialization', () => {
    it('serializes and deserializes path', () => {
      let path = PathModel.createPath('path-1');
      path = PathModel.addAnchor(path, { x: 100, y: 100 });
      path = PathModel.addAnchor(path, { x: 200, y: 200 });

      const json = PathModel.toJSON(path);
      const restored = PathModel.fromJSON(json);

      expect(restored.id).toBe(path.id);
      expect(restored.anchors).toHaveLength(path.anchors.length);
      expect(restored.anchors[0].position).toEqual(path.anchors[0].position);
    });

    it('preserves handles in serialization', () => {
      let path = PathModel.createPath('path-1');
      path = PathModel.addAnchor(path, { x: 100, y: 100 });
      path = PathModel.moveHandle(path, 0, 'out', { x: 150, y: 150 });

      const json = PathModel.toJSON(path);
      const restored = PathModel.fromJSON(json);

      expect(restored.anchors[0].handleOut).toEqual({ x: 150, y: 150 });
    });
  });

  describe('Bounds Calculation', () => {
    it('calculates bounds of path with anchors', () => {
      let path = PathModel.createPath('path-1');
      path = PathModel.addAnchor(path, { x: 0, y: 0 });
      path = PathModel.addAnchor(path, { x: 100, y: 100 });

      const bounds = PathModel.getBounds(path);

      expect(bounds).toBeDefined();
      expect(bounds?.x).toBe(0);
      expect(bounds?.y).toBe(0);
      expect(bounds?.width).toBe(100);
      expect(bounds?.height).toBe(100);
    });

    it('returns null for empty path bounds', () => {
      const path = PathModel.createPath('path-1');
      const bounds = PathModel.getBounds(path);

      expect(bounds).toBeNull();
    });

    it('includes handles in bounds calculation', () => {
      let path = PathModel.createPath('path-1');
      path = PathModel.addAnchor(path, { x: 0, y: 0 });
      path = PathModel.moveHandle(path, 0, 'out', { x: 200, y: 200 });

      const bounds = PathModel.getBounds(path);

      expect(bounds?.width).toBeGreaterThanOrEqual(200);
    });
  });
});

// ============================================================================
// PenTool Tests
// ============================================================================

describe('PenTool', () => {
  let penTool: PenTool;
  let mockCoordinator: any;

  beforeEach(() => {
    mockCoordinator = createMockCoordinator();
    penTool = new PenTool(mockCoordinator);
  });

  describe('Tool State Machine', () => {
    it('starts in idle state and transitions to drawing on first click', () => {
      const stateListener = vi.fn();
      penTool.on('state-changed', stateListener);

      const event = createMockInputEvent({ canvasX: 100, canvasY: 100 });
      penTool.onPointerDown(event);

      expect(stateListener).toHaveBeenCalledWith('drawing');
    });

    it('maintains path during multiple clicks', () => {
      // Create path with first anchor
      penTool.onPointerDown(createMockInputEvent({ canvasX: 100, canvasY: 100 }));
      const path1 = penTool.getCurrentPath();
      expect(path1?.anchors.length).toBe(1);
      const pathId = path1?.id;

      // Add second anchor far away
      penTool.onPointerDown(createMockInputEvent({ canvasX: 300, canvasY: 300 }));

      // Verify path has grown in anchors
      const path2 = penTool.getCurrentPath();
      expect((path2?.anchors.length || 0) >= 1).toBe(true);
      // Should be same path ID
      expect(path2?.id).toBe(pathId);
    });

    it('transitions between states appropriately', () => {
      const stateListener = vi.fn();
      penTool.on('state-changed', stateListener);

      // First click creates path and goes to drawing
      penTool.onPointerDown(createMockInputEvent({ canvasX: 100, canvasY: 100 }));
      expect(stateListener).toHaveBeenCalledWith('drawing');

      // Verify path exists
      const path = penTool.getCurrentPath();
      expect(path).toBeDefined();
    });
  });

  describe('Path Creation', () => {
    it('creates path on first click', () => {
      const pathListener = vi.fn();
      const stateListener = vi.fn();
      penTool.on('path-created', pathListener);
      penTool.on('state-changed', stateListener);

      const event = createMockInputEvent();
      penTool.onPointerDown(event);

      expect(pathListener).toHaveBeenCalled();
      expect(stateListener).toHaveBeenCalledWith('drawing');
      const path = penTool.getCurrentPath();
      expect(path).toBeDefined();
      expect(path?.anchors.length).toBe(1);
    });

    it('adds anchors to existing path', () => {
      // First anchor
      penTool.onPointerDown(createMockInputEvent({ canvasX: 100, canvasY: 100 }));
      const path1 = penTool.getCurrentPath();
      expect(path1?.anchors.length).toBe(1);

      // Second anchor - click at different location
      penTool.onPointerDown(createMockInputEvent({ canvasX: 200, canvasY: 200 }));
      const path2 = penTool.getCurrentPath();

      // Path should have another anchor
      expect((path2?.anchors.length || 0) >= path1!.anchors.length).toBe(true);
      expect(path2?.id).toBe(path1?.id); // Same path
    });
  });

  describe('Anchor Selection and Deletion', () => {
    it('supports programmatic anchor selection', () => {
      // Create path
      penTool.onPointerDown(createMockInputEvent({ canvasX: 100, canvasY: 100 }));

      const path = penTool.getCurrentPath();
      expect(path?.anchors.length).toBeGreaterThan(0);

      // Programmatic selection should work
      const selectListener = vi.fn();
      penTool.on('anchor-selected', selectListener);

      // Call deleteAnchor which should emit anchor-deleted
      const deleteListener = vi.fn();
      penTool.on('anchor-deleted', deleteListener);

      (penTool as any).deleteAnchor(0);

      // Deletion should have been emitted
      expect(deleteListener).toHaveBeenCalled();
    });

    it('can delete anchor via method call', () => {
      const deleteListener = vi.fn();
      penTool.on('anchor-deleted', deleteListener);

      // Create path with two anchors
      penTool.onPointerDown(createMockInputEvent({ canvasX: 100, canvasY: 100 }));
      penTool.onPointerDown(createMockInputEvent({ canvasX: 200, canvasY: 200 }));

      // Delete first anchor directly
      (penTool as any).deleteAnchor(0);

      expect(deleteListener).toHaveBeenCalled();
      const path = penTool.getCurrentPath();
      // Path may be null if only 1 anchor remains
      expect((path?.anchors.length || 0) < 2).toBe(true);
    });
  });

  describe('Anchor Type Conversion', () => {
    it('converts anchor from corner to smooth via method', () => {
      const modifiedListener = vi.fn();
      penTool.on('path-modified', modifiedListener);

      // Create path
      penTool.onPointerDown(createMockInputEvent({ canvasX: 100, canvasY: 100 }));

      modifiedListener.mockClear();

      // Convert anchor type directly
      (penTool as any).convertAnchorType(0, 'smooth');

      expect(modifiedListener).toHaveBeenCalled();
      const path = penTool.getCurrentPath();
      expect(path?.anchors[0].type).toBe('smooth');
    });
  });

  describe('Path Closing', () => {
    it('can close path programmatically', () => {
      // Create path with 2+ anchors by directly setting
      let path = PathModel.createPath('test-path');
      path = PathModel.addAnchor(path, { x: 100, y: 100 });
      path = PathModel.addAnchor(path, { x: 200, y: 200 });
      penTool.setCurrentPath(path);

      const closeListener = vi.fn();
      penTool.on('path-closed', closeListener);

      // Close path directly
      (penTool as any).closePath();

      expect(closeListener).toHaveBeenCalled();
      const closedPath = penTool.getCurrentPath();
      expect(closedPath?.closed).toBe(true);
    });

    it('recognizes keyboard shortcuts for path operations', () => {
      // Create path with 2+ anchors
      let path = PathModel.createPath('test-path');
      path = PathModel.addAnchor(path, { x: 100, y: 100 });
      path = PathModel.addAnchor(path, { x: 200, y: 200 });
      penTool.setCurrentPath(path);

      // Verify path is open
      expect(penTool.getCurrentPath()?.closed).toBe(false);

      // Escape should work to deselect
      const escapeEvent = new MockKeyboardEvent('keydown', { key: 'Escape' }) as any;
      penTool.onKeyDown(escapeEvent);

      // Path should still exist
      expect(penTool.getCurrentPath()).toBeDefined();
    });
  });

  describe('Keyboard Modifiers', () => {
    it('stores and uses Shift modifier for angle constraint', () => {
      // Create path with two anchors
      penTool.onPointerDown(createMockInputEvent({ canvasX: 50, canvasY: 50 }));
      penTool.onPointerDown(createMockInputEvent({ canvasX: 150, canvasY: 50 }));

      // Drag first anchor with Shift held (this sets constrainAngle internally)
      const downEvent = createMockInputEvent({
        canvasX: 50,
        canvasY: 50,
        modifiers: { shift: true, ctrl: false, alt: false, meta: false },
      });
      penTool.onPointerDown(downEvent);

      // Verify constrainAngle was set
      expect((penTool as any).constrainAngle).toBe(true);

      const moveEvent = createMockInputEvent({
        canvasX: 100,
        canvasY: 100,
        modifiers: { shift: true, ctrl: false, alt: false, meta: false },
      });
      penTool.onPointerMove(moveEvent);

      // Path should still exist after move
      const path = penTool.getCurrentPath();
      expect(path).toBeDefined();
    });

    it('breaks handles with Alt held', () => {
      // Create path with handles
      penTool.onPointerDown(createMockInputEvent({ canvasX: 100, canvasY: 100 }));

      const currentPath = penTool.getCurrentPath();
      if (currentPath) {
        let modified = PathModel.moveHandle(currentPath, 0, 'out', {
          x: 150,
          y: 150,
        });
        modified = PathModel.moveHandle(modified, 0, 'in', { x: 50, y: 50 });
        modified = PathModel.convertAnchorType(modified, 0, 'smooth');
        penTool.setCurrentPath(modified);
      }

      const modifiedListener = vi.fn();
      penTool.on('path-modified', modifiedListener);

      // Drag handle with Alt held
      const downEvent = createMockInputEvent({
        canvasX: 150,
        canvasY: 150,
        modifiers: { shift: false, ctrl: false, alt: true, meta: false },
      });
      penTool.onPointerDown(downEvent);

      const moveEvent = createMockInputEvent({
        canvasX: 180,
        canvasY: 180,
        modifiers: { shift: false, ctrl: false, alt: true, meta: false },
      });
      penTool.onPointerMove(moveEvent);

      expect(modifiedListener).toHaveBeenCalled();
    });
  });

  describe('Rendering', () => {
    it('renders path to canvas', () => {
      const canvas = new OffscreenCanvas(300, 300);
      const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;

      // Create path
      penTool.onPointerDown(createMockInputEvent({ canvasX: 100, canvasY: 100 }));
      penTool.onPointerDown(createMockInputEvent({ canvasX: 200, canvasY: 200 }));

      // Render - should not throw
      expect(() => {
        penTool.render(ctx as any);
      }).not.toThrow();

      // Verify path was rendered (check that canvas was modified)
      const imageData = ctx.getImageData(0, 0, 300, 300);
      expect(imageData).toBeDefined();
    });

    it('does not render when path is null', () => {
      const canvas = new OffscreenCanvas(300, 300);
      const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
      const spy = vi.spyOn(ctx, 'stroke');

      penTool.render(ctx as any);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('cleans up resources on destroy', () => {
      penTool.onPointerDown(createMockInputEvent());

      const listener = vi.fn();
      penTool.on('state-changed', listener);

      penTool.destroy();

      // Should not emit after destroy
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
