import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MoveTool } from '@/lib/studio/editor/tools/transform/MoveTool';

describe('MoveTool - Guide Snapping', () => {
  let tool: MoveTool;
  const mockSnapCallback = vi.fn();
  const mockTelemetryCallback = vi.fn();

  beforeEach(() => {
    mockSnapCallback.mockClear();
    mockTelemetryCallback.mockClear();
    tool = new MoveTool({
      snapConfig: {
        enabled: true,
        distance: 5,
        targets: ['guides', 'grid', 'edges', 'canvas'],
      },
      onSnapPointFound: mockSnapCallback,
      onTelemetry: mockTelemetryCallback,
    });
  });

  describe('addGuide', () => {
    it('returns unique IDs for each guide', () => {
      const id1 = tool.addGuide('horizontal', 100);
      const id2 = tool.addGuide('horizontal', 150);
      const id3 = tool.addGuide('vertical', 200);

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id3).toBeTruthy();
      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
    });

    it('stores guide correctly with correct orientation and position', () => {
      const id = tool.addGuide('vertical', 250);
      const guides = tool.getGuides();

      expect(guides).toHaveLength(1);
      expect(guides[0]).toEqual({
        id,
        orientation: 'vertical',
        position: 250,
      });
    });

    it('stores multiple guides independently', () => {
      const id1 = tool.addGuide('horizontal', 100);
      const id2 = tool.addGuide('vertical', 200);
      const id3 = tool.addGuide('horizontal', 300);

      const guides = tool.getGuides();
      expect(guides).toHaveLength(3);
      expect(guides.map((g) => g.id)).toContain(id1);
      expect(guides.map((g) => g.id)).toContain(id2);
      expect(guides.map((g) => g.id)).toContain(id3);
    });
  });

  describe('getGuides', () => {
    it('returns all guides in order', () => {
      tool.addGuide('horizontal', 50);
      tool.addGuide('vertical', 100);
      tool.addGuide('horizontal', 150);

      const guides = tool.getGuides();
      expect(guides).toHaveLength(3);
      expect(guides[0].orientation).toBe('horizontal');
      expect(guides[1].orientation).toBe('vertical');
      expect(guides[2].orientation).toBe('horizontal');
    });

    it('returns empty array when no guides exist', () => {
      const guides = tool.getGuides();
      expect(guides).toEqual([]);
    });
  });

  describe('removeGuide', () => {
    it('removes a specific guide by ID', () => {
      const id1 = tool.addGuide('horizontal', 100);
      const id2 = tool.addGuide('vertical', 200);

      tool.removeGuide(id1);

      const guides = tool.getGuides();
      expect(guides).toHaveLength(1);
      expect(guides[0].id).toBe(id2);
    });

    it('is a no-op when guide ID does not exist', () => {
      tool.addGuide('horizontal', 100);
      tool.addGuide('vertical', 200);

      expect(() => {
        tool.removeGuide('non-existent-id');
      }).not.toThrow();

      const guides = tool.getGuides();
      expect(guides).toHaveLength(2);
    });

    it('allows removing all guides sequentially', () => {
      const id1 = tool.addGuide('horizontal', 100);
      const id2 = tool.addGuide('vertical', 200);
      const id3 = tool.addGuide('horizontal', 300);

      tool.removeGuide(id1);
      tool.removeGuide(id2);
      tool.removeGuide(id3);

      expect(tool.getGuides()).toEqual([]);
    });
  });

  describe('Horizontal guide snapping', () => {
    it('snaps y position when within snap distance of horizontal guide', () => {
      tool.addGuide('horizontal', 150);
      tool.startMove({ x: 100, y: 100 }, 'layer-1', false);

      const result = tool.updateMove({ x: 100, y: 153 }); // 3 units from guide, within 5

      expect(result.y).toBe(150);
      expect(mockSnapCallback).toHaveBeenCalled();
    });

    it('does not snap y position when beyond snap distance of horizontal guide', () => {
      tool.addGuide('horizontal', 100);
      tool.startMove({ x: 100, y: 100 }, 'layer-1', false);

      const result = tool.updateMove({ x: 100, y: 110 }); // 10 units from guide, beyond 5

      expect(result.y).not.toBe(100);
      expect(result.y).toBeCloseTo(110, 1);
    });

    it('leaves x position unchanged when snapping to horizontal guide', () => {
      tool.addGuide('horizontal', 100);
      tool.startMove({ x: 50, y: 50 }, 'layer-1', false);

      const result = tool.updateMove({ x: 200, y: 103 });

      expect(result.x).toBeCloseTo(200, 1);
    });
  });

  describe('Vertical guide snapping', () => {
    it('snaps x position when within snap distance of vertical guide', () => {
      tool.addGuide('vertical', 200);
      tool.startMove({ x: 100, y: 100 }, 'layer-1', false);

      const result = tool.updateMove({ x: 203, y: 100 }); // 3 units from guide, within 5

      expect(result.x).toBe(200);
      expect(mockSnapCallback).toHaveBeenCalled();
    });

    it('does not snap x position when beyond snap distance of vertical guide', () => {
      tool.addGuide('vertical', 100);
      tool.startMove({ x: 100, y: 100 }, 'layer-1', false);

      const result = tool.updateMove({ x: 110, y: 100 }); // 10 units from guide, beyond 5

      expect(result.x).not.toBe(100);
      expect(result.x).toBeCloseTo(110, 1);
    });

    it('leaves y position unchanged when snapping to vertical guide', () => {
      tool.addGuide('vertical', 100);
      tool.startMove({ x: 50, y: 50 }, 'layer-1', false);

      const result = tool.updateMove({ x: 103, y: 300 });

      expect(result.y).toBeCloseTo(300, 1);
    });
  });

  describe('Snap distance behavior', () => {
    it('returns unsnapped position when snap disabled', () => {
      const toolNoSnap = new MoveTool({
        snapConfig: {
          enabled: false,
          distance: 5,
          targets: ['guides'],
        },
      });

      toolNoSnap.addGuide('horizontal', 100);
      toolNoSnap.startMove({ x: 100, y: 100 }, 'layer-1', false);

      const result = toolNoSnap.updateMove({ x: 100, y: 102 });

      expect(result.y).toBeCloseTo(102, 1);
    });

    it('respects custom snap distance configuration', () => {
      const toolLargeSnap = new MoveTool({
        snapConfig: {
          enabled: true,
          distance: 20,
          targets: ['guides'],
        },
      });

      toolLargeSnap.addGuide('vertical', 100);
      toolLargeSnap.startMove({ x: 50, y: 50 }, 'layer-1', false);

      // 18 units away, should snap with distance: 20
      const result = toolLargeSnap.updateMove({ x: 118, y: 50 });
      expect(result.x).toBe(100);
    });
  });

  describe('Multiple guides - snapping to closest', () => {
    it('snaps to closest guide when multiple options exist', () => {
      tool.addGuide('horizontal', 100);
      tool.addGuide('horizontal', 200);
      tool.startMove({ x: 100, y: 100 }, 'layer-1', false);

      // 4 units from 100, 6 units from 200 - should snap to 100
      const result = tool.updateMove({ x: 100, y: 104 });

      expect(result.y).toBe(100);
    });

    it('snaps to closest among multiple vertical guides', () => {
      tool.addGuide('vertical', 100);
      tool.addGuide('vertical', 200);
      tool.startMove({ x: 100, y: 100 }, 'layer-1', false);

      // 3 units from 200, 7 units from 100 - should snap to 200
      const result = tool.updateMove({ x: 197, y: 100 });

      expect(result.x).toBe(200);
    });

    it('snaps to closest guide across both orientations', () => {
      tool.addGuide('horizontal', 100);
      tool.addGuide('vertical', 200);
      tool.startMove({ x: 100, y: 100 }, 'layer-1', false);

      // 2 units from horizontal at 100 (y), 3 units from vertical at 200 (x)
      // Closest is the horizontal guide, so only y should snap
      const result = tool.updateMove({ x: 203, y: 102 });

      expect(result.x).toBeCloseTo(203, 1);
      expect(result.y).toBe(100);
    });
  });

  describe('endMove', () => {
    it('returns the final transform point after move', () => {
      tool.addGuide('horizontal', 150);
      tool.startMove({ x: 100, y: 100 }, 'layer-1', false);
      tool.updateMove({ x: 100, y: 153 });

      const result = tool.endMove();

      expect(result).toBeDefined();
      // updateMove stores the UNSNAPPED position (153) in state.currentPos,
      // so endMove delta = 153 - 100 = 53 (not 50 from snapped position)
      expect(result.y).toBe(53);
    });
  });
});
