import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CoordinateSystem } from '@/lib/studio/editor/canvas/CoordinateSystem';
import type { Point, Rect, MeasurementUnit } from '@/lib/studio/types/canvas';

describe('CoordinateSystem', () => {
  let coordinateSystem: CoordinateSystem;

  beforeEach(() => {
    coordinateSystem = new CoordinateSystem();
  });

  describe('Construction', () => {
    it('should create instance with default DPI and device pixel ratio', () => {
      const cs = new CoordinateSystem();
      expect(cs.getDPI()).toBe(72);
    });

    it('should create instance with custom DPI', () => {
      const cs = new CoordinateSystem(150);
      expect(cs.getDPI()).toBe(150);
    });

    it('should create instance with custom DPI and device pixel ratio', () => {
      const cs = new CoordinateSystem(300, 2);
      expect(cs.getDPI()).toBe(300);
    });

    it('should initialize ruler with default configuration', () => {
      const ruler = coordinateSystem.getRuler();
      expect(ruler.visible).toBe(true);
      expect(ruler.unit).toBe('pixels');
      expect(ruler.origin).toEqual({ x: 0, y: 0 });
      expect(ruler.guides).toEqual([]);
    });
  });

  describe('pixelsToPhysical', () => {
    it('should convert pixels to pixels (identity)', () => {
      expect(coordinateSystem.pixelsToPhysical(100, 'pixels')).toBe(100);
      expect(coordinateSystem.pixelsToPhysical(0, 'pixels')).toBe(0);
      expect(coordinateSystem.pixelsToPhysical(1440, 'pixels')).toBe(1440);
    });

    it('should convert pixels to inches at 72 DPI', () => {
      expect(coordinateSystem.pixelsToPhysical(72, 'inches')).toBe(1);
      expect(coordinateSystem.pixelsToPhysical(144, 'inches')).toBe(2);
      expect(coordinateSystem.pixelsToPhysical(360, 'inches')).toBe(5);
    });

    it('should convert pixels to cm at 72 DPI', () => {
      const result = coordinateSystem.pixelsToPhysical(72, 'cm');
      expect(result).toBeCloseTo(2.54, 2);
    });

    it('should convert pixels to mm at 72 DPI', () => {
      const result = coordinateSystem.pixelsToPhysical(72, 'mm');
      expect(result).toBeCloseTo(25.4, 2);
    });

    it('should convert pixels to points at 72 DPI', () => {
      expect(coordinateSystem.pixelsToPhysical(72, 'points')).toBe(72);
      expect(coordinateSystem.pixelsToPhysical(36, 'points')).toBe(36);
    });

    it('should convert pixels correctly at 150 DPI', () => {
      const cs150 = new CoordinateSystem(150);
      expect(cs150.pixelsToPhysical(150, 'inches')).toBe(1);
      expect(cs150.pixelsToPhysical(300, 'inches')).toBe(2);
    });

    it('should convert pixels correctly at 300 DPI', () => {
      const cs300 = new CoordinateSystem(300);
      expect(cs300.pixelsToPhysical(300, 'inches')).toBe(1);
      expect(cs300.pixelsToPhysical(600, 'inches')).toBe(2);
    });

    it('should handle zero and negative values', () => {
      expect(coordinateSystem.pixelsToPhysical(0, 'inches')).toBe(0);
      expect(coordinateSystem.pixelsToPhysical(-72, 'inches')).toBe(-1);
      expect(coordinateSystem.pixelsToPhysical(-144, 'inches')).toBe(-2);
    });

    it('should handle fractional pixels', () => {
      expect(coordinateSystem.pixelsToPhysical(36, 'inches')).toBe(0.5);
      expect(coordinateSystem.pixelsToPhysical(18, 'inches')).toBe(0.25);
    });
  });

  describe('physicalToPixels', () => {
    it('should convert pixels to pixels (identity)', () => {
      expect(coordinateSystem.physicalToPixels(100, 'pixels')).toBe(100);
      expect(coordinateSystem.physicalToPixels(0, 'pixels')).toBe(0);
    });

    it('should convert inches to pixels at 72 DPI', () => {
      expect(coordinateSystem.physicalToPixels(1, 'inches')).toBe(72);
      expect(coordinateSystem.physicalToPixels(2, 'inches')).toBe(144);
      expect(coordinateSystem.physicalToPixels(0.5, 'inches')).toBe(36);
    });

    it('should convert cm to pixels at 72 DPI', () => {
      const result = coordinateSystem.physicalToPixels(2.54, 'cm');
      expect(result).toBeCloseTo(72, 1);
    });

    it('should convert mm to pixels at 72 DPI', () => {
      const result = coordinateSystem.physicalToPixels(25.4, 'mm');
      expect(result).toBeCloseTo(72, 1);
    });

    it('should convert points to pixels at 72 DPI', () => {
      expect(coordinateSystem.physicalToPixels(72, 'points')).toBe(72);
      expect(coordinateSystem.physicalToPixels(36, 'points')).toBe(36);
    });

    it('should convert correctly at 150 DPI', () => {
      const cs150 = new CoordinateSystem(150);
      expect(cs150.physicalToPixels(1, 'inches')).toBe(150);
      expect(cs150.physicalToPixels(2, 'inches')).toBe(300);
    });

    it('should convert correctly at 300 DPI', () => {
      const cs300 = new CoordinateSystem(300);
      expect(cs300.physicalToPixels(1, 'inches')).toBe(300);
      expect(cs300.physicalToPixels(2, 'inches')).toBe(600);
    });

    it('should roundtrip with pixelsToPhysical', () => {
      const original = 100;
      const toInches = coordinateSystem.pixelsToPhysical(original, 'inches');
      const back = coordinateSystem.physicalToPixels(toInches, 'inches');
      expect(back).toBeCloseTo(original, 5);

      const toCm = coordinateSystem.pixelsToPhysical(original, 'cm');
      const backCm = coordinateSystem.physicalToPixels(toCm, 'cm');
      expect(backCm).toBeCloseTo(original, 5);

      const toMm = coordinateSystem.pixelsToPhysical(original, 'mm');
      const backMm = coordinateSystem.physicalToPixels(toMm, 'mm');
      expect(backMm).toBeCloseTo(original, 5);
    });

    it('should handle zero and negative values', () => {
      expect(coordinateSystem.physicalToPixels(0, 'inches')).toBe(0);
      expect(coordinateSystem.physicalToPixels(-1, 'inches')).toBe(-72);
      expect(coordinateSystem.physicalToPixels(-2, 'inches')).toBe(-144);
    });
  });

  describe('roundToSubPixel', () => {
    it('should round to default precision (1/8 pixel)', () => {
      expect(coordinateSystem.roundToSubPixel(100.123)).toBe(100.125);
      expect(coordinateSystem.roundToSubPixel(50.049)).toBe(50);
      expect(coordinateSystem.roundToSubPixel(75.067)).toBe(75.125);
    });

    it('should round to custom precision', () => {
      expect(coordinateSystem.roundToSubPixel(100.55, 2)).toBe(100.5);
      expect(coordinateSystem.roundToSubPixel(100.25, 4)).toBe(100.25);
      expect(coordinateSystem.roundToSubPixel(99.99, 10)).toBeCloseTo(100, 1);
    });

    it('should handle integer values', () => {
      expect(coordinateSystem.roundToSubPixel(100)).toBe(100);
      expect(coordinateSystem.roundToSubPixel(0)).toBe(0);
    });

    it('should handle negative values', () => {
      expect(coordinateSystem.roundToSubPixel(-100.123)).toBe(-100.125);
      expect(coordinateSystem.roundToSubPixel(-50.067)).toBe(-50.125);
    });

    it('should handle very small values', () => {
      expect(coordinateSystem.roundToSubPixel(0.001)).toBe(0);
      expect(coordinateSystem.roundToSubPixel(0.065)).toBe(0.125);
    });

    it('should respect precision parameter', () => {
      const value = 100.123;
      expect(coordinateSystem.roundToSubPixel(value, 1)).toBe(100);
      expect(coordinateSystem.roundToSubPixel(value, 2)).toBe(100);
      expect(coordinateSystem.roundToSubPixel(value, 16)).toBeCloseTo(100.125, 3);
    });
  });

  describe('getDPI and setDPI', () => {
    it('should get current DPI', () => {
      expect(coordinateSystem.getDPI()).toBe(72);
    });

    it('should set DPI to 72', () => {
      coordinateSystem.setDPI(72);
      expect(coordinateSystem.getDPI()).toBe(72);
    });

    it('should set DPI to 150', () => {
      coordinateSystem.setDPI(150);
      expect(coordinateSystem.getDPI()).toBe(150);
    });

    it('should set DPI to 300', () => {
      coordinateSystem.setDPI(300);
      expect(coordinateSystem.getDPI()).toBe(300);
    });

    it('should snap invalid DPI to nearest valid value', () => {
      coordinateSystem.setDPI(100);
      expect(coordinateSystem.getDPI()).toBe(72);

      coordinateSystem.setDPI(140);
      expect(coordinateSystem.getDPI()).toBe(150);

      coordinateSystem.setDPI(250);
      expect(coordinateSystem.getDPI()).toBe(300);

      coordinateSystem.setDPI(180);
      expect(coordinateSystem.getDPI()).toBe(150);
    });

    it('should emit dpi-changed event when setting DPI', () => {
      const listener = vi.fn();
      coordinateSystem.on('dpi-changed', listener);
      coordinateSystem.setDPI(150);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ dpi: 150 }));
    });

    it('should emit dpi-changed with snapped value when invalid DPI provided', () => {
      const listener = vi.fn();
      coordinateSystem.on('dpi-changed', listener);
      coordinateSystem.setDPI(100);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ dpi: 72 }));
    });
  });

  describe('Ruler Configuration', () => {
    it('should return defensive copy of ruler configuration', () => {
      const ruler1 = coordinateSystem.getRuler();
      const ruler2 = coordinateSystem.getRuler();
      expect(ruler1).not.toBe(ruler2);
      expect(ruler1).toEqual(ruler2);
    });

    it('should not mutate returned ruler when modifying original', () => {
      const ruler = coordinateSystem.getRuler();
      ruler.visible = false;
      const rulerAfter = coordinateSystem.getRuler();
      expect(rulerAfter.visible).toBe(true);
    });

    it('should not allow mutation of guides array in returned copy', () => {
      coordinateSystem.addGuide('g1', 'horizontal', 100);
      const ruler = coordinateSystem.getRuler();
      const initialLength = ruler.guides.length;
      ruler.guides.push({
        id: 'g2',
        orientation: 'vertical',
        position: 200,
        locked: false,
      });
      const rulerAfter = coordinateSystem.getRuler();
      expect(rulerAfter.guides.length).toBe(initialLength);
    });

    it('should merge partial ruler config with setRuler', () => {
      coordinateSystem.setRuler({ visible: false });
      const ruler = coordinateSystem.getRuler();
      expect(ruler.visible).toBe(false);
      expect(ruler.unit).toBe('pixels');
      expect(ruler.origin).toEqual({ x: 0, y: 0 });
    });

    it('should emit ruler-changed event when updating ruler', () => {
      const listener = vi.fn();
      coordinateSystem.on('ruler-changed', listener);
      coordinateSystem.setRuler({ visible: false });
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ ruler: expect.objectContaining({ visible: false }) }));
    });
  });

  describe('Ruler Visibility', () => {
    it('should set ruler visibility to true', () => {
      coordinateSystem.setRulerVisible(true);
      expect(coordinateSystem.getRuler().visible).toBe(true);
    });

    it('should set ruler visibility to false', () => {
      coordinateSystem.setRulerVisible(false);
      expect(coordinateSystem.getRuler().visible).toBe(false);
    });

    it('should emit ruler-visibility-changed event', () => {
      const listener = vi.fn();
      coordinateSystem.on('ruler-visibility-changed', listener);
      coordinateSystem.setRulerVisible(false);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ visible: false }));
    });
  });

  describe('Measurement Unit', () => {
    it('should set measurement unit to inches', () => {
      coordinateSystem.setMeasurementUnit('inches');
      expect(coordinateSystem.getRuler().unit).toBe('inches');
    });

    it('should set measurement unit to cm', () => {
      coordinateSystem.setMeasurementUnit('cm');
      expect(coordinateSystem.getRuler().unit).toBe('cm');
    });

    it('should set measurement unit to mm', () => {
      coordinateSystem.setMeasurementUnit('mm');
      expect(coordinateSystem.getRuler().unit).toBe('mm');
    });

    it('should set measurement unit to points', () => {
      coordinateSystem.setMeasurementUnit('points');
      expect(coordinateSystem.getRuler().unit).toBe('points');
    });

    it('should emit unit-changed event', () => {
      const listener = vi.fn();
      coordinateSystem.on('unit-changed', listener);
      coordinateSystem.setMeasurementUnit('inches');
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ unit: 'inches' }));
    });
  });

  describe('Guide Management', () => {
    it('should add guide with correct properties', () => {
      coordinateSystem.addGuide('guide1', 'horizontal', 100);
      const ruler = coordinateSystem.getRuler();
      expect(ruler.guides).toHaveLength(1);
      expect(ruler.guides[0]).toEqual({
        id: 'guide1',
        orientation: 'horizontal',
        position: 100,
        locked: false,
      });
    });

    it('should add multiple guides', () => {
      coordinateSystem.addGuide('g1', 'horizontal', 100);
      coordinateSystem.addGuide('g2', 'vertical', 200);
      coordinateSystem.addGuide('g3', 'horizontal', 300);
      const ruler = coordinateSystem.getRuler();
      expect(ruler.guides).toHaveLength(3);
    });

    it('should emit guide-added event', () => {
      const listener = vi.fn();
      coordinateSystem.on('guide-added', listener);
      coordinateSystem.addGuide('guide1', 'horizontal', 100);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        guide: expect.objectContaining({ id: 'guide1', orientation: 'horizontal', position: 100 })
      }));
    });

    it('should remove guide by id', () => {
      coordinateSystem.addGuide('g1', 'horizontal', 100);
      coordinateSystem.addGuide('g2', 'vertical', 200);
      coordinateSystem.removeGuide('g1');
      const ruler = coordinateSystem.getRuler();
      expect(ruler.guides).toHaveLength(1);
      expect(ruler.guides[0].id).toBe('g2');
    });

    it('should emit guide-removed event', () => {
      coordinateSystem.addGuide('guide1', 'horizontal', 100);
      const listener = vi.fn();
      coordinateSystem.on('guide-removed', listener);
      coordinateSystem.removeGuide('guide1');
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ id: 'guide1' }));
    });

    it('should be no-op when removing non-existent guide', () => {
      coordinateSystem.addGuide('g1', 'horizontal', 100);
      expect(() => {
        coordinateSystem.removeGuide('non-existent');
      }).not.toThrow();
      expect(coordinateSystem.getRuler().guides).toHaveLength(1);
    });

    it('should move guide to new position', () => {
      coordinateSystem.addGuide('g1', 'horizontal', 100);
      coordinateSystem.moveGuide('g1', 200);
      expect(coordinateSystem.getRuler().guides[0].position).toBe(200);
    });

    it('should emit guide-moved event', () => {
      coordinateSystem.addGuide('g1', 'horizontal', 100);
      const listener = vi.fn();
      coordinateSystem.on('guide-moved', listener);
      coordinateSystem.moveGuide('g1', 200);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ id: 'g1', position: 200 }));
    });

    it('should not move locked guide', () => {
      coordinateSystem.addGuide('g1', 'horizontal', 100);
      coordinateSystem.setGuideLocked('g1', true);
      coordinateSystem.moveGuide('g1', 200);
      expect(coordinateSystem.getRuler().guides[0].position).toBe(100);
    });

    it('should set guide locked state', () => {
      coordinateSystem.addGuide('g1', 'horizontal', 100);
      coordinateSystem.setGuideLocked('g1', true);
      expect(coordinateSystem.getRuler().guides[0].locked).toBe(true);
    });

    it('should unlock guide', () => {
      coordinateSystem.addGuide('g1', 'horizontal', 100);
      coordinateSystem.setGuideLocked('g1', true);
      coordinateSystem.setGuideLocked('g1', false);
      expect(coordinateSystem.getRuler().guides[0].locked).toBe(false);
    });

    it('should emit guide-locked-changed event', () => {
      coordinateSystem.addGuide('g1', 'horizontal', 100);
      const listener = vi.fn();
      coordinateSystem.on('guide-locked-changed', listener);
      coordinateSystem.setGuideLocked('g1', true);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ id: 'g1', locked: true }));
    });

    it('should allow moving unlocked guide after being locked', () => {
      coordinateSystem.addGuide('g1', 'horizontal', 100);
      coordinateSystem.setGuideLocked('g1', true);
      coordinateSystem.moveGuide('g1', 200);
      expect(coordinateSystem.getRuler().guides[0].position).toBe(100);

      coordinateSystem.setGuideLocked('g1', false);
      coordinateSystem.moveGuide('g1', 200);
      expect(coordinateSystem.getRuler().guides[0].position).toBe(200);
    });
  });

  describe('getGuidesInRegion', () => {
    beforeEach(() => {
      coordinateSystem.addGuide('h1', 'horizontal', 100);
      coordinateSystem.addGuide('h2', 'horizontal', 200);
      coordinateSystem.addGuide('h3', 'horizontal', 300);
      coordinateSystem.addGuide('v1', 'vertical', 150);
      coordinateSystem.addGuide('v2', 'vertical', 250);
    });

    it('should return horizontal guides within y-region', () => {
      const rect: Rect = { x: 0, y: 50, width: 400, height: 200 };
      const guides = coordinateSystem.getGuidesInRegion(rect);
      const horizontalGuides = guides.filter((g) => g.orientation === 'horizontal');
      expect(horizontalGuides).toHaveLength(2);
      expect(horizontalGuides.map((g) => g.position)).toContain(100);
      expect(horizontalGuides.map((g) => g.position)).toContain(200);
    });

    it('should return vertical guides within x-region', () => {
      const rect: Rect = { x: 100, y: 0, width: 200, height: 400 };
      const guides = coordinateSystem.getGuidesInRegion(rect);
      const verticalGuides = guides.filter((g) => g.orientation === 'vertical');
      expect(verticalGuides).toHaveLength(2);
      expect(verticalGuides.map((g) => g.position)).toContain(150);
      expect(verticalGuides.map((g) => g.position)).toContain(250);
    });

    it('should return empty array when no guides in region', () => {
      const rect: Rect = { x: 0, y: 400, width: 100, height: 100 };
      const guides = coordinateSystem.getGuidesInRegion(rect);
      expect(guides).toHaveLength(0);
    });

    it('should include guides on region boundaries', () => {
      const rect: Rect = { x: 0, y: 100, width: 400, height: 100 };
      const guides = coordinateSystem.getGuidesInRegion(rect);
      expect(guides.map((g) => g.position)).toContain(100);
      expect(guides.map((g) => g.position)).toContain(200);
    });

    it('should handle overlapping regions', () => {
      const rect: Rect = { x: 100, y: 50, width: 200, height: 200 };
      const guides = coordinateSystem.getGuidesInRegion(rect);
      expect(guides.length).toBeGreaterThan(0);
    });
  });

  describe('snapToGuides', () => {
    beforeEach(() => {
      coordinateSystem.addGuide('h1', 'horizontal', 100);
      coordinateSystem.addGuide('h2', 'horizontal', 200);
      coordinateSystem.addGuide('v1', 'vertical', 150);
      coordinateSystem.addGuide('v2', 'vertical', 250);
    });

    it('should snap to horizontal guide within threshold', () => {
      const snapped = coordinateSystem.snapToGuides(105, 'horizontal', 8);
      expect(snapped).toBe(100);
    });

    it('should snap to vertical guide within threshold', () => {
      // v1 is at 150, distance 7 < threshold 8
      const snapped = coordinateSystem.snapToGuides(157, 'vertical', 8);
      expect(snapped).toBe(150);
    });

    it('should not snap when position outside threshold', () => {
      const snapped = coordinateSystem.snapToGuides(110, 'horizontal', 8);
      expect(snapped).toBe(110);
    });

    it('should use default threshold of 8', () => {
      const snappedWithin = coordinateSystem.snapToGuides(105, 'horizontal');
      expect(snappedWithin).toBe(100);

      const snappedOutside = coordinateSystem.snapToGuides(110, 'horizontal');
      expect(snappedOutside).toBe(110);
    });

    it('should respect custom threshold', () => {
      const snappedSmallThreshold = coordinateSystem.snapToGuides(105, 'horizontal', 4);
      expect(snappedSmallThreshold).toBe(105);

      const snappedLargeThreshold = coordinateSystem.snapToGuides(105, 'horizontal', 10);
      expect(snappedLargeThreshold).toBe(100);
    });

    it('should snap to first matching guide within threshold', () => {
      // snapToGuides returns the FIRST guide within threshold, not the nearest
      // horizontal guides: 100, 200. Distance from 175: 75 to 100, 25 to 200
      // Both within threshold 100, but 100 is checked first
      const snapped = coordinateSystem.snapToGuides(175, 'horizontal', 100);
      expect(snapped).toBe(100);
    });

    it('should return original position when no guides match orientation', () => {
      const snapped = coordinateSystem.snapToGuides(500, 'vertical', 8);
      expect(snapped).toBe(500);
    });

    it('should handle threshold of zero', () => {
      const snapped = coordinateSystem.snapToGuides(100, 'horizontal', 0);
      expect(snapped).toBe(100);
    });
  });

  describe('formatCoordinate', () => {
    it('should format pixels with px suffix', () => {
      expect(coordinateSystem.formatCoordinate(100, 'pixels')).toBe('100px');
      expect(coordinateSystem.formatCoordinate(0, 'pixels')).toBe('0px');
      expect(coordinateSystem.formatCoordinate(1440, 'pixels')).toBe('1440px');
    });

    it('should format inches with quote suffix and 2 decimals', () => {
      expect(coordinateSystem.formatCoordinate(72, 'inches')).toBe('1.00"');
      expect(coordinateSystem.formatCoordinate(144, 'inches')).toBe('2.00"');
      expect(coordinateSystem.formatCoordinate(36, 'inches')).toBe('0.50"');
    });

    it('should format cm with cm suffix and 1 decimal', () => {
      const result = coordinateSystem.formatCoordinate(72, 'cm');
      expect(result).toMatch(/cm$/);
      expect(result).toMatch(/\d\.\d/);
    });

    it('should format mm with mm suffix and 1 decimal', () => {
      const result = coordinateSystem.formatCoordinate(72, 'mm');
      expect(result).toMatch(/mm$/);
      expect(result).toMatch(/\d\.\d/);
    });

    it('should format points with pt suffix', () => {
      expect(coordinateSystem.formatCoordinate(72, 'points')).toBe('72pt');
      expect(coordinateSystem.formatCoordinate(36, 'points')).toBe('36pt');
    });

    it('should use ruler unit when no unit specified', () => {
      coordinateSystem.setMeasurementUnit('inches');
      expect(coordinateSystem.formatCoordinate(72)).toBe('1.00"');

      coordinateSystem.setMeasurementUnit('cm');
      const result = coordinateSystem.formatCoordinate(72);
      expect(result).toMatch(/cm$/);
    });

    it('should override ruler unit when unit specified', () => {
      coordinateSystem.setMeasurementUnit('cm');
      expect(coordinateSystem.formatCoordinate(72, 'inches')).toBe('1.00"');
    });

    it('should handle zero values', () => {
      expect(coordinateSystem.formatCoordinate(0, 'pixels')).toBe('0px');
      expect(coordinateSystem.formatCoordinate(0, 'inches')).toBe('0.00"');
    });

    it('should handle negative values', () => {
      expect(coordinateSystem.formatCoordinate(-100, 'pixels')).toBe('-100px');
      expect(coordinateSystem.formatCoordinate(-72, 'inches')).toBe('-1.00"');
    });
  });

  describe('formatPoint', () => {
    it('should format point with both x and y coordinates', () => {
      const point: Point = { x: 72, y: 144 };
      const formatted = coordinateSystem.formatPoint(point, 'inches');
      expect(formatted.x).toBe('1.00"');
      expect(formatted.y).toBe('2.00"');
    });

    it('should format point with pixels', () => {
      const point: Point = { x: 100, y: 200 };
      const formatted = coordinateSystem.formatPoint(point, 'pixels');
      expect(formatted.x).toBe('100px');
      expect(formatted.y).toBe('200px');
    });

    it('should use ruler unit when no unit specified', () => {
      coordinateSystem.setMeasurementUnit('inches');
      const point: Point = { x: 72, y: 144 };
      const formatted = coordinateSystem.formatPoint(point);
      expect(formatted.x).toBe('1.00"');
      expect(formatted.y).toBe('2.00"');
    });

    it('should handle zero point', () => {
      const point: Point = { x: 0, y: 0 };
      const formatted = coordinateSystem.formatPoint(point, 'pixels');
      expect(formatted.x).toBe('0px');
      expect(formatted.y).toBe('0px');
    });

    it('should handle negative coordinates', () => {
      const point: Point = { x: -72, y: -144 };
      const formatted = coordinateSystem.formatPoint(point, 'inches');
      expect(formatted.x).toBe('-1.00"');
      expect(formatted.y).toBe('-2.00"');
    });
  });

  describe('parseCoordinate', () => {
    it('should parse pixel values', () => {
      expect(coordinateSystem.parseCoordinate('100px')).toBe(100);
      expect(coordinateSystem.parseCoordinate('100')).toBe(100);
      expect(coordinateSystem.parseCoordinate('50.5px')).toBe(50.5);
    });

    it('should parse inch values', () => {
      expect(coordinateSystem.parseCoordinate('1"')).toBe(72);
      expect(coordinateSystem.parseCoordinate('1in')).toBe(72);
      expect(coordinateSystem.parseCoordinate('2"')).toBe(144);
      expect(coordinateSystem.parseCoordinate('0.5in')).toBe(36);
    });

    it('should parse cm values', () => {
      const result = coordinateSystem.parseCoordinate('2.54cm');
      expect(result).toBeCloseTo(72, 1);
    });

    it('should parse mm values', () => {
      const result = coordinateSystem.parseCoordinate('25.4mm');
      expect(result).toBeCloseTo(72, 1);
    });

    it('should parse point values', () => {
      expect(coordinateSystem.parseCoordinate('72pt')).toBe(72);
      expect(coordinateSystem.parseCoordinate('36pt')).toBe(36);
    });

    it('should handle whitespace', () => {
      expect(coordinateSystem.parseCoordinate('100 px')).toBe(100);
      expect(coordinateSystem.parseCoordinate('1 in')).toBe(72);
    });

    it('should handle fractional values', () => {
      expect(coordinateSystem.parseCoordinate('1.5"')).toBe(108);
      expect(coordinateSystem.parseCoordinate('0.25in')).toBe(18);
    });

    it('should return null for invalid format', () => {
      expect(coordinateSystem.parseCoordinate('invalid')).toBeNull();
      expect(coordinateSystem.parseCoordinate('abc100')).toBeNull();
      expect(coordinateSystem.parseCoordinate('')).toBeNull();
    });

    it('should return null for non-numeric values', () => {
      expect(coordinateSystem.parseCoordinate('apx')).toBeNull();
      expect(coordinateSystem.parseCoordinate('XY')).toBeNull();
    });

    it('should handle case-insensitive unit parsing', () => {
      expect(coordinateSystem.parseCoordinate('100PX')).toBe(100);
      expect(coordinateSystem.parseCoordinate('1IN')).toBe(72);
      expect(coordinateSystem.parseCoordinate('2CM')).toBeCloseTo(56.7, 0);
    });

    it('should handle zero values', () => {
      expect(coordinateSystem.parseCoordinate('0px')).toBe(0);
      expect(coordinateSystem.parseCoordinate('0in')).toBe(0);
      expect(coordinateSystem.parseCoordinate('0')).toBe(0);
    });

    it('should handle negative values', () => {
      expect(coordinateSystem.parseCoordinate('-100px')).toBeNull();
      expect(coordinateSystem.parseCoordinate('-1in')).toBeNull();
    });
  });

  describe('getRulerMarks', () => {
    it('should return ruler marks for given range', () => {
      const marks = coordinateSystem.getRulerMarks(0, 100, 10);
      expect(marks.length).toBeGreaterThan(0);
      expect(marks[0]).toHaveProperty('position');
      expect(marks[0]).toHaveProperty('label');
      expect(marks[0]).toHaveProperty('major');
    });

    it('should include major marks every 5th mark', () => {
      const marks = coordinateSystem.getRulerMarks(0, 200, 5);
      const majorMarks = marks.filter((m) => m.major);
      expect(majorMarks.length).toBeGreaterThan(0);
      majorMarks.forEach((mark) => {
        expect(mark.position % 50).toBe(0);
      });
    });

    it('should have labels for all marks', () => {
      const marks = coordinateSystem.getRulerMarks(0, 100, 10);
      marks.forEach((mark) => {
        expect(mark.label).toBeTruthy();
        expect(typeof mark.label).toBe('string');
      });
    });

    it('should respect start and end bounds', () => {
      const marks = coordinateSystem.getRulerMarks(50, 150, 10);
      marks.forEach((mark) => {
        expect(mark.position).toBeGreaterThanOrEqual(50);
        expect(mark.position).toBeLessThanOrEqual(150);
      });
    });

    it('should calculate marks based on pixels per mark', () => {
      // pixelsPerMark is INVERTED: smaller value → larger interval → FEWER marks
      // pixelsPerMark=5 → interval = ceil(100/5) = 20 → fewer marks
      // pixelsPerMark=50 → interval = ceil(100/50) = 2 → more marks
      const marksSmall = coordinateSystem.getRulerMarks(0, 100, 5);
      const marksLarge = coordinateSystem.getRulerMarks(0, 100, 50);
      expect(marksLarge.length).toBeGreaterThan(marksSmall.length);
    });

    it('should format marks using current ruler unit', () => {
      coordinateSystem.setMeasurementUnit('pixels');
      const marksPixels = coordinateSystem.getRulerMarks(0, 100, 10);
      expect(marksPixels[0].label).toMatch(/px$/);

      coordinateSystem.setMeasurementUnit('inches');
      const marksInches = coordinateSystem.getRulerMarks(0, 400, 10);
      expect(marksInches[0].label).toMatch(/"/);
    });
  });

  describe('distance', () => {
    it('should calculate distance between two points (Pythagorean theorem)', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 3, y: 4 };
      expect(coordinateSystem.distance(p1, p2)).toBe(5);
    });

    it('should calculate distance for same point as zero', () => {
      const p: Point = { x: 100, y: 200 };
      expect(coordinateSystem.distance(p, p)).toBe(0);
    });

    it('should calculate distance with negative coordinates', () => {
      const p1: Point = { x: -3, y: -4 };
      const p2: Point = { x: 0, y: 0 };
      expect(coordinateSystem.distance(p1, p2)).toBe(5);
    });

    it('should calculate distance symmetrically', () => {
      const p1: Point = { x: 10, y: 20 };
      const p2: Point = { x: 30, y: 50 };
      expect(coordinateSystem.distance(p1, p2)).toBe(coordinateSystem.distance(p2, p1));
    });

    it('should calculate horizontal distance', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 10, y: 0 };
      expect(coordinateSystem.distance(p1, p2)).toBe(10);
    });

    it('should calculate vertical distance', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 0, y: 10 };
      expect(coordinateSystem.distance(p1, p2)).toBe(10);
    });

    it('should calculate distance with fractional coordinates', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 0.6, y: 0.8 };
      expect(coordinateSystem.distance(p1, p2)).toBe(1);
    });

    it('should handle large distances', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 3000, y: 4000 };
      expect(coordinateSystem.distance(p1, p2)).toBe(5000);
    });
  });

  describe('angle', () => {
    it('should calculate angle between two points in degrees', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 1, y: 0 };
      expect(coordinateSystem.angle(p1, p2)).toBe(0);
    });

    it('should calculate angle of 90 degrees', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 0, y: 1 };
      expect(coordinateSystem.angle(p1, p2)).toBeCloseTo(90, 1);
    });

    it('should calculate angle of 45 degrees', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 1, y: 1 };
      expect(coordinateSystem.angle(p1, p2)).toBeCloseTo(45, 1);
    });

    it('should calculate angle of -90 degrees (pointing down)', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 0, y: -1 };
      expect(coordinateSystem.angle(p1, p2)).toBeCloseTo(-90, 1);
    });

    it('should calculate angle of 180 degrees (pointing left)', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: -1, y: 0 };
      expect(coordinateSystem.angle(p1, p2)).toBeCloseTo(180, 1);
    });

    it('should calculate angle of -135 degrees', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: -1, y: -1 };
      expect(coordinateSystem.angle(p1, p2)).toBeCloseTo(-135, 1);
    });

    it('should return angle of 0 for same point', () => {
      const p: Point = { x: 100, y: 200 };
      expect(coordinateSystem.angle(p, p)).toBe(0);
    });

    it('should calculate angle with negative coordinates', () => {
      const p1: Point = { x: -10, y: -10 };
      const p2: Point = { x: -9, y: -10 };
      expect(coordinateSystem.angle(p1, p2)).toBe(0);
    });

    it('should not be symmetric (direction matters)', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 1, y: 0 };
      const angle1 = coordinateSystem.angle(p1, p2);
      const angle2 = coordinateSystem.angle(p2, p1);
      expect(angle1).not.toBe(angle2);
      // angle(0,0 → 1,0) = 0° and angle(1,0 → 0,0) = 180°
      // They differ by exactly 180° (opposite directions)
      expect(Math.abs(angle1 - angle2)).toBeCloseTo(180, 0);
    });

    it('should calculate angles in quadrants', () => {
      const origin: Point = { x: 0, y: 0 };

      const q1: Point = { x: 1, y: 1 };
      expect(coordinateSystem.angle(origin, q1)).toBeCloseTo(45, 1);

      const q2: Point = { x: -1, y: 1 };
      expect(coordinateSystem.angle(origin, q2)).toBeCloseTo(135, 1);

      const q3: Point = { x: -1, y: -1 };
      expect(coordinateSystem.angle(origin, q3)).toBeCloseTo(-135, 1);

      const q4: Point = { x: 1, y: -1 };
      expect(coordinateSystem.angle(origin, q4)).toBeCloseTo(-45, 1);
    });
  });

  describe('Event Emission', () => {
    it('should support multiple event listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      coordinateSystem.on('dpi-changed', listener1);
      coordinateSystem.on('dpi-changed', listener2);
      coordinateSystem.setDPI(150);
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should emit all events in sequence', () => {
      const dpiListener = vi.fn();
      const unitListener = vi.fn();
      const guideListener = vi.fn();
      coordinateSystem.on('dpi-changed', dpiListener);
      coordinateSystem.on('unit-changed', unitListener);
      coordinateSystem.on('guide-added', guideListener);

      coordinateSystem.setDPI(150);
      coordinateSystem.setMeasurementUnit('inches');
      coordinateSystem.addGuide('g1', 'horizontal', 100);

      expect(dpiListener).toHaveBeenCalled();
      expect(unitListener).toHaveBeenCalled();
      expect(guideListener).toHaveBeenCalled();
    });

    it('should allow removing event listeners', () => {
      const listener = vi.fn();
      coordinateSystem.on('dpi-changed', listener);
      coordinateSystem.setDPI(150);
      expect(listener).toHaveBeenCalledTimes(1);
      coordinateSystem.removeListener('dpi-changed', listener);
      coordinateSystem.setDPI(300);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete workflow with DPI, units, guides, and formatting', () => {
      const cs = new CoordinateSystem(150);
      cs.setMeasurementUnit('inches');
      cs.addGuide('g1', 'horizontal', 150);
      cs.addGuide('g2', 'vertical', 300);

      const formatted = cs.formatCoordinate(150, 'inches');
      expect(formatted).toBe('1.00"');

      const parsed = cs.parseCoordinate('1"');
      expect(parsed).toBe(150);

      const snapped = cs.snapToGuides(152, 'horizontal', 5);
      expect(snapped).toBe(150);
    });

    it('should maintain consistency across unit conversions', () => {
      const cs = new CoordinateSystem(72);
      const pixelValue = 100;

      const toInches = cs.pixelsToPhysical(pixelValue, 'inches');
      const back = cs.physicalToPixels(toInches, 'inches');
      expect(back).toBeCloseTo(pixelValue, 5);

      const toCm = cs.pixelsToPhysical(pixelValue, 'cm');
      const backCm = cs.physicalToPixels(toCm, 'cm');
      expect(backCm).toBeCloseTo(pixelValue, 5);

      const toMm = cs.pixelsToPhysical(pixelValue, 'mm');
      const backMm = cs.physicalToPixels(toMm, 'mm');
      expect(backMm).toBeCloseTo(pixelValue, 5);

      const toPoints = cs.pixelsToPhysical(pixelValue, 'points');
      const backPoints = cs.physicalToPixels(toPoints, 'points');
      expect(backPoints).toBeCloseTo(pixelValue, 5);
    });

    it('should handle DPI changes and maintain guide positions', () => {
      const cs = new CoordinateSystem(72);
      cs.addGuide('g1', 'horizontal', 100);
      cs.addGuide('g2', 'vertical', 200);

      cs.setDPI(150);
      const ruler = cs.getRuler();
      expect(ruler.guides[0].position).toBe(100);
      expect(ruler.guides[1].position).toBe(200);
    });
  });
});
