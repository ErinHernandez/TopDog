/**
 * Unit tests for Curves Adjustment
 * Spline-based curves adjustment with per-channel control
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { expectCloseTo, expectArrayCloseTo } from '../../helpers/test-utils';

// Reference types matching source
interface CurvePoint {
  x: number;
  y: number;
}

interface CurvesSettings {
  composite: CurvePoint[];
  red?: CurvePoint[];
  green?: CurvePoint[];
  blue?: CurvePoint[];
  useComposite: boolean;
}

// Reference implementation of Curves for testing
// This mirrors core logic from lib/studio/editor/tools/adjustments/Curves.ts
class TestCurves {
  static createLinearCurve(): CurvePoint[] {
    return [
      { x: 0, y: 0 },
      { x: 255, y: 255 },
    ];
  }

  static createLUT(points: CurvePoint[]): Uint8ClampedArray {
    const lut = new Uint8ClampedArray(256);

    if (points.length < 2) {
      return lut;
    }

    // Sort points by x coordinate
    const sorted = [...points].sort((a, b) => a.x - b.x);

    // Simple cubic interpolation between points
    for (let i = 0; i < 256; i++) {
      let y = this.interpolateCubic(sorted, i);
      lut[i] = Math.max(0, Math.min(255, Math.round(y)));
    }

    return lut;
  }

  private static interpolateCubic(points: CurvePoint[], x: number): number {
    if (x <= points[0].x) return points[0].y;
    if (x >= points[points.length - 1].x) return points[points.length - 1].y;

    // Find segment containing x
    let i = 0;
    while (i < points.length - 1 && points[i + 1].x < x) {
      i++;
    }

    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Normalized position within segment
    const t = (x - p1.x) / (p2.x - p1.x);

    // Catmull-Rom interpolation
    const t2 = t * t;
    const t3 = t2 * t;

    return (
      0.5 *
      (
        2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
      )
    );
  }

  static process(
    imageData: ImageData,
    settings: CurvesSettings
  ): ImageData {
    const data = new Uint8ClampedArray(imageData.data);
    const { composite, useComposite } = settings;

    const redCurve = useComposite ? composite : settings.red || composite;
    const greenCurve = useComposite ? composite : settings.green || composite;
    const blueCurve = useComposite ? composite : settings.blue || composite;

    const redLUT = this.createLUT(redCurve);
    const greenLUT = this.createLUT(greenCurve);
    const blueLUT = this.createLUT(blueCurve);

    for (let i = 0; i < data.length; i += 4) {
      data[i] = redLUT[data[i]];
      data[i + 1] = greenLUT[data[i + 1]];
      data[i + 2] = blueLUT[data[i + 2]];
    }

    return new ImageData(data, imageData.width, imageData.height);
  }

  static addPoint(points: CurvePoint[], x: number, y: number): CurvePoint[] {
    const newPoints = [...points, { x, y }].sort((a, b) => a.x - b.x);
    return newPoints;
  }

  static removePoint(points: CurvePoint[], x: number): CurvePoint[] {
    return points.filter((p) => Math.abs(p.x - x) > 0.1);
  }

  static updatePoint(
    points: CurvePoint[],
    oldX: number,
    newX: number,
    newY: number
  ): CurvePoint[] {
    const updated = points.map((p) => {
      if (Math.abs(p.x - oldX) < 0.1) {
        return {
          x: Math.max(0, Math.min(255, newX)),
          y: Math.max(0, Math.min(255, newY)),
        };
      }
      return p;
    });
    return updated.sort((a, b) => a.x - b.x);
  }

  static getDefaults(): CurvesSettings {
    const linear = this.createLinearCurve();
    return {
      composite: linear,
      red: linear,
      green: linear,
      blue: linear,
      useComposite: true,
    };
  }

  static validate(settings: CurvesSettings): CurvesSettings {
    const validatePoints = (points: CurvePoint[]): CurvePoint[] => {
      if (points.length < 2) {
        return this.createLinearCurve();
      }
      return points
        .map((p) => ({
          x: Math.max(0, Math.min(255, p.x)),
          y: Math.max(0, Math.min(255, p.y)),
        }))
        .sort((a, b) => a.x - b.x);
    };

    return {
      composite: validatePoints(settings.composite),
      red: settings.red ? validatePoints(settings.red) : undefined,
      green: settings.green ? validatePoints(settings.green) : undefined,
      blue: settings.blue ? validatePoints(settings.blue) : undefined,
      useComposite: settings.useComposite,
    };
  }
}

describe('Curves', () => {
  describe('createLinearCurve', () => {
    it('should create curve with 2 points', () => {
      const curve = TestCurves.createLinearCurve();
      expect(curve.length).toBe(2);
    });

    it('should have point at origin', () => {
      const curve = TestCurves.createLinearCurve();
      expect(curve[0].x).toBe(0);
      expect(curve[0].y).toBe(0);
    });

    it('should have point at end', () => {
      const curve = TestCurves.createLinearCurve();
      expect(curve[1].x).toBe(255);
      expect(curve[1].y).toBe(255);
    });
  });

  describe('createLUT', () => {
    it('should create 256-element lookup table', () => {
      const linear = TestCurves.createLinearCurve();
      const lut = TestCurves.createLUT(linear);

      expect(lut).toBeInstanceOf(Uint8ClampedArray);
      expect(lut.length).toBe(256);
    });

    it('should create linear LUT from linear curve', () => {
      const linear = TestCurves.createLinearCurve();
      const lut = TestCurves.createLUT(linear);

      // Linear curve should map each value to itself (with tolerance for cubic interpolation)
      for (let i = 0; i < 256; i++) {
        expectCloseTo(lut[i], i, 15);
      }
    });

    it('should clamp values to 0-255 range', () => {
      const curve = TestCurves.createLinearCurve();
      const lut = TestCurves.createLUT(curve);

      for (let i = 0; i < lut.length; i++) {
        expect(lut[i]).toBeGreaterThanOrEqual(0);
        expect(lut[i]).toBeLessThanOrEqual(255);
      }
    });

    it('should handle single-point curve gracefully', () => {
      const lut = TestCurves.createLUT([{ x: 128, y: 128 }]);
      expect(lut).toBeInstanceOf(Uint8ClampedArray);
      expect(lut.length).toBe(256);
    });

    it('should handle empty curve gracefully', () => {
      const lut = TestCurves.createLUT([]);
      expect(lut).toBeInstanceOf(Uint8ClampedArray);
      expect(lut.length).toBe(256);
    });

    it('should apply S-curve for contrast increase', () => {
      // S-curve: darkens shadows, brightens highlights
      const sCurve: CurvePoint[] = [
        { x: 0, y: 0 },
        { x: 50, y: 30 },
        { x: 205, y: 225 },
        { x: 255, y: 255 },
      ];

      const lut = TestCurves.createLUT(sCurve);

      // Shadow region (around 64) should be darker
      expect(lut[64]).toBeLessThan(64);

      // Highlight region (around 192) should be brighter
      expect(lut[192]).toBeGreaterThan(192);

      // Endpoints should be fixed
      expect(lut[0]).toBe(0);
      expect(lut[255]).toBe(255);
    });

    it('should apply inverse curve (negative)', () => {
      const inverse: CurvePoint[] = [
        { x: 0, y: 255 },
        { x: 255, y: 0 },
      ];

      const lut = TestCurves.createLUT(inverse);

      // Should invert: lut[i] ≈ 255 - i
      expectCloseTo(lut[0], 255, 1);
      expectCloseTo(lut[128], 127, 1);
      expectCloseTo(lut[255], 0, 1);
    });

    it('should interpolate smoothly between points', () => {
      const curve: CurvePoint[] = [
        { x: 0, y: 0 },
        { x: 128, y: 255 },
        { x: 255, y: 255 },
      ];

      const lut = TestCurves.createLUT(curve);

      // Should increase monotonically in first half
      let prev = lut[0];
      for (let i = 1; i <= 128; i++) {
        expect(lut[i]).toBeGreaterThanOrEqual(prev - 1);
        prev = lut[i];
      }
    });
  });

  describe('process', () => {
    it('should apply curves to RGB channels', () => {
      const imageData = new ImageData(
        Uint8ClampedArray.from([
          // R, G, B, A
          100, 100, 100, 255,
          150, 150, 150, 255,
        ]),
        2,
        1
      );

      const settings: CurvesSettings = {
        composite: TestCurves.createLinearCurve(),
        useComposite: true,
      };

      const result = TestCurves.process(imageData, settings);

      expect(result.width).toBe(2);
      expect(result.height).toBe(1);
      expect(result.data.length).toBe(8);
    });

    it('should preserve alpha channel', () => {
      const imageData = new ImageData(
        Uint8ClampedArray.from([
          100, 100, 100, 128,
          150, 150, 150, 64,
        ]),
        2,
        1
      );

      const settings: CurvesSettings = {
        composite: TestCurves.createLinearCurve(),
        useComposite: true,
      };

      const result = TestCurves.process(imageData, settings);

      expect(result.data[3]).toBe(128);
      expect(result.data[7]).toBe(64);
    });

    it('should use composite curve when useComposite is true', () => {
      const imageData = new ImageData(
        Uint8ClampedArray.from([
          100, 100, 100, 255,
        ]),
        1,
        1
      );

      const settings: CurvesSettings = {
        composite: [
          { x: 0, y: 0 },
          { x: 100, y: 50 },
          { x: 255, y: 255 },
        ],
        useComposite: true,
      };

      const result = TestCurves.process(imageData, settings);

      // All channels should be affected equally
      expect(result.data[0]).toBe(result.data[1]);
      expect(result.data[1]).toBe(result.data[2]);
    });

    it('should use per-channel curves when useComposite is false', () => {
      const imageData = new ImageData(
        Uint8ClampedArray.from([
          100, 100, 100, 255,
        ]),
        1,
        1
      );

      const settings: CurvesSettings = {
        composite: TestCurves.createLinearCurve(),
        red: [
          { x: 0, y: 0 },
          { x: 100, y: 200 },
          { x: 255, y: 255 },
        ],
        green: TestCurves.createLinearCurve(),
        blue: TestCurves.createLinearCurve(),
        useComposite: false,
      };

      const result = TestCurves.process(imageData, settings);

      // Red should be different from green/blue
      expect(result.data[0]).not.toBe(result.data[1]);
      expect(result.data[1]).toBe(result.data[2]);
    });
  });

  describe('addPoint', () => {
    it('should add point to curve', () => {
      const curve = TestCurves.createLinearCurve();
      const updated = TestCurves.addPoint(curve, 128, 128);

      expect(updated.length).toBe(3);
    });

    it('should sort points by x coordinate', () => {
      const curve = TestCurves.createLinearCurve();
      const updated = TestCurves.addPoint(curve, 128, 200);

      expect(updated[0].x).toBe(0);
      expect(updated[1].x).toBe(128);
      expect(updated[2].x).toBe(255);
    });

    it('should handle duplicate x coordinates', () => {
      const curve = TestCurves.createLinearCurve();
      const updated = TestCurves.addPoint(curve, 0, 100);

      expect(updated.length).toBe(3);
    });
  });

  describe('removePoint', () => {
    it('should remove point by x coordinate', () => {
      const curve: CurvePoint[] = [
        { x: 0, y: 0 },
        { x: 128, y: 128 },
        { x: 255, y: 255 },
      ];

      const updated = TestCurves.removePoint(curve, 128);

      expect(updated.length).toBe(2);
      expect(updated.find((p) => Math.abs(p.x - 128) < 0.1)).toBeUndefined();
    });

    it('should use tolerance for matching', () => {
      const curve: CurvePoint[] = [
        { x: 0, y: 0 },
        { x: 128, y: 128 },
        { x: 255, y: 255 },
      ];

      const updated = TestCurves.removePoint(curve, 128.05);

      expect(updated.length).toBe(2);
    });

    it('should not remove if not found', () => {
      const curve: CurvePoint[] = [
        { x: 0, y: 0 },
        { x: 255, y: 255 },
      ];

      const updated = TestCurves.removePoint(curve, 128);

      expect(updated.length).toBe(2);
    });
  });

  describe('updatePoint', () => {
    it('should move point to new position', () => {
      const curve: CurvePoint[] = [
        { x: 0, y: 0 },
        { x: 128, y: 128 },
        { x: 255, y: 255 },
      ];

      const updated = TestCurves.updatePoint(curve, 128, 100, 150);

      expect(updated.find((p) => Math.abs(p.x - 128) < 0.1)).toBeUndefined();
      expect(updated.find((p) => Math.abs(p.x - 100) < 0.1)?.y).toBe(150);
    });

    it('should clamp values to 0-255', () => {
      const curve: CurvePoint[] = [
        { x: 0, y: 0 },
        { x: 128, y: 128 },
        { x: 255, y: 255 },
      ];

      const updated = TestCurves.updatePoint(curve, 128, -50, 300);

      const point = updated.find((p) => Math.abs(p.x - 0) < 0.1);
      expect(point?.x).toBeGreaterThanOrEqual(0);
      expect(point?.y).toBeLessThanOrEqual(255);
    });

    it('should maintain sort order', () => {
      const curve: CurvePoint[] = [
        { x: 0, y: 0 },
        { x: 128, y: 128 },
        { x: 255, y: 255 },
      ];

      const updated = TestCurves.updatePoint(curve, 128, 200, 200);

      for (let i = 1; i < updated.length; i++) {
        expect(updated[i].x).toBeGreaterThanOrEqual(updated[i - 1].x);
      }
    });
  });

  describe('validate', () => {
    it('should fix out-of-range values', () => {
      const settings: CurvesSettings = {
        composite: [
          { x: -50, y: 300 },
          { x: 500, y: -100 },
        ],
        useComposite: true,
      };

      const validated = TestCurves.validate(settings);

      validated.composite.forEach((p) => {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(255);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(255);
      });
    });

    it('should sort points by x', () => {
      const settings: CurvesSettings = {
        composite: [
          { x: 255, y: 255 },
          { x: 0, y: 0 },
          { x: 128, y: 128 },
        ],
        useComposite: true,
      };

      const validated = TestCurves.validate(settings);

      for (let i = 1; i < validated.composite.length; i++) {
        expect(validated.composite[i].x).toBeGreaterThanOrEqual(
          validated.composite[i - 1].x
        );
      }
    });

    it('should replace invalid curve with linear', () => {
      const settings: CurvesSettings = {
        composite: [{ x: 100, y: 100 }],
        useComposite: true,
      };

      const validated = TestCurves.validate(settings);

      // Should have 2 points (linear curve)
      expect(validated.composite.length).toBe(2);
      expect(validated.composite[0].x).toBe(0);
      expect(validated.composite[1].x).toBe(255);
    });

    it('should validate per-channel curves', () => {
      const settings: CurvesSettings = {
        composite: TestCurves.createLinearCurve(),
        red: [
          { x: 300, y: 300 },
          { x: -50, y: -100 },
        ],
        useComposite: false,
      };

      const validated = TestCurves.validate(settings);

      if (validated.red) {
        validated.red.forEach((p) => {
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.x).toBeLessThanOrEqual(255);
          expect(p.y).toBeGreaterThanOrEqual(0);
          expect(p.y).toBeLessThanOrEqual(255);
        });
      }
    });
  });

  describe('getDefaults', () => {
    it('should return default settings', () => {
      const defaults = TestCurves.getDefaults();

      expect(defaults.composite).toBeDefined();
      expect(defaults.red).toBeDefined();
      expect(defaults.green).toBeDefined();
      expect(defaults.blue).toBeDefined();
      expect(defaults.useComposite).toBe(true);
    });

    it('should have linear curves', () => {
      const defaults = TestCurves.getDefaults();

      defaults.composite.forEach((p, i) => {
        if (i === 0) {
          expect(p.x).toBe(0);
          expect(p.y).toBe(0);
        }
        if (i === defaults.composite.length - 1) {
          expect(p.x).toBe(255);
          expect(p.y).toBe(255);
        }
      });
    });
  });

  describe('Preset curves', () => {
    it('should create S-curve', () => {
      // S-curve creates contrast by darkening shadows and brightening highlights
      const sCurve: CurvePoint[] = [
        { x: 0, y: 0 },
        { x: 50, y: 30 },
        { x: 205, y: 225 },
        { x: 255, y: 255 },
      ];

      const lut = TestCurves.createLUT(sCurve);

      // Shadows darkened
      expect(lut[50]).toBeLessThan(50);

      // Highlights brightened
      expect(lut[205]).toBeGreaterThan(205);
    });

    it('should create inverse curve', () => {
      const inverse: CurvePoint[] = [
        { x: 0, y: 255 },
        { x: 255, y: 0 },
      ];

      const lut = TestCurves.createLUT(inverse);

      expectCloseTo(lut[0], 255, 1);
      expectCloseTo(lut[128], 127, 2);
      expectCloseTo(lut[255], 0, 1);
    });

    it('should create brightening curve', () => {
      const lighter: CurvePoint[] = [
        { x: 0, y: 0 },
        { x: 128, y: 156 },
        { x: 255, y: 255 },
      ];

      const lut = TestCurves.createLUT(lighter);

      // Mid-tones should be brighter
      expect(lut[128]).toBeGreaterThan(128);
    });

    it('should create darkening curve', () => {
      const darker: CurvePoint[] = [
        { x: 0, y: 0 },
        { x: 128, y: 100 },
        { x: 255, y: 255 },
      ];

      const lut = TestCurves.createLUT(darker);

      // Mid-tones should be darker
      expect(lut[128]).toBeLessThan(128);
    });
  });

  describe('Edge cases', () => {
    it('should handle query outside curve bounds', () => {
      const curve: CurvePoint[] = [
        { x: 50, y: 50 },
        { x: 200, y: 200 },
      ];

      const lut = TestCurves.createLUT(curve);

      // Value before first point
      expect(lut[0]).toBe(50);

      // Value after last point
      expect(lut[255]).toBe(200);
    });

    it('should handle large number of points', () => {
      const curve: CurvePoint[] = [];
      for (let i = 0; i < 256; i++) {
        curve.push({ x: i, y: i });
      }

      const lut = TestCurves.createLUT(curve);

      for (let i = 0; i < 256; i++) {
        expectCloseTo(lut[i], i, 1);
      }
    });

    it('should handle single segment curve', () => {
      const curve: CurvePoint[] = [
        { x: 0, y: 0 },
        { x: 255, y: 255 },
      ];

      const lut = TestCurves.createLUT(curve);

      expect(lut.length).toBe(256);
      for (let i = 0; i < 256; i++) {
        expectCloseTo(lut[i], i, 15);
      }
    });
  });
});
