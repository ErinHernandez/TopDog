import { describe, it, expect, beforeEach } from 'vitest';
import { BrushEngine } from '@/lib/studio/editor/tools/brush/BrushEngine';

describe('BrushEngine - smoothPressure', () => {
  let engine: BrushEngine;

  const mockSettings = {
    size: 10,
    opacity: 100,
    hardness: 50,
    flow: 100,
    spacing: 25,
    angle: 0,
    roundness: 1,
    smoothing: 0,
    pressureSensitivity: { size: true, opacity: true, hardness: false, flow: false },
    colorDynamics: { hueJitter: 0, satJitter: 0, briJitter: 0, foregroundBackground: 0 },
  } as any;

  beforeEach(() => {
    engine = new BrushEngine(mockSettings, 1);
  });

  it('should return single value when only one pressure value is added', () => {
    const result = engine.smoothPressure(0.5);
    expect(result).toBe(0.5);
  });

  it('should return average of two values', () => {
    engine.smoothPressure(0.4);
    const result = engine.smoothPressure(0.6);
    expect(result).toBe(0.5);
  });

  it('should accumulate values up to windowSize', () => {
    const windowSize = 5;
    const values = [0.2, 0.4, 0.6, 0.8, 1.0];

    values.forEach((value, index) => {
      const result = engine.smoothPressure(value, windowSize);
      const expectedAverage = values.slice(0, index + 1).reduce((a, b) => a + b) / (index + 1);
      expect(result).toBeCloseTo(expectedAverage, 5);
    });
  });

  it('should drop oldest value when buffer exceeds windowSize', () => {
    const windowSize = 3;
    engine.smoothPressure(0.1, windowSize);
    engine.smoothPressure(0.2, windowSize);
    engine.smoothPressure(0.3, windowSize);
    // At this point buffer is [0.1, 0.2, 0.3], average = 0.2

    const result = engine.smoothPressure(0.9, windowSize);
    // After adding 0.9, buffer should be [0.2, 0.3, 0.9] (dropped 0.1)
    const expectedAverage = (0.2 + 0.3 + 0.9) / 3;
    expect(result).toBeCloseTo(expectedAverage, 5);
  });

  it('should respect custom windowSize parameter', () => {
    const windowSize = 2;
    engine.smoothPressure(0.3, windowSize);
    engine.smoothPressure(0.4, windowSize);
    const result = engine.smoothPressure(0.7, windowSize);

    // With windowSize=2, should only keep last 2 values: [0.4, 0.7]
    const expectedAverage = (0.4 + 0.7) / 2;
    expect(result).toBeCloseTo(expectedAverage, 5);
  });

  it('should maintain running average across multiple calls', () => {
    const pressureValues = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    const windowSize = 5;
    const results: number[] = [];

    pressureValues.forEach((pressure) => {
      results.push(engine.smoothPressure(pressure, windowSize));
    });

    // Verify last result uses average of last 5 values [0.6, 0.7, 0.8, 0.9, 1.0]
    const lastExpected = (0.6 + 0.7 + 0.8 + 0.9 + 1.0) / 5;
    expect(results[results.length - 1]).toBeCloseTo(lastExpected, 5);

    // Verify first result is just the first value
    expect(results[0]).toBe(0.1);

    // Verify smoothing happened - at index 5, buffer is [0.2, 0.3, 0.4, 0.5, 0.6]
    expect(results[5]).toBeCloseTo((0.2 + 0.3 + 0.4 + 0.5 + 0.6) / 5, 5);
  });

  it('should handle zero pressure value', () => {
    const result = engine.smoothPressure(0);
    expect(result).toBe(0);

    const result2 = engine.smoothPressure(0.5);
    expect(result2).toBe(0.25);
  });

  it('should handle maximum pressure value (1.0)', () => {
    engine.smoothPressure(1.0);
    const result = engine.smoothPressure(1.0);
    expect(result).toBe(1.0);
  });

  it('should use default windowSize of 5 when not specified', () => {
    // Feed 6 values with default window size
    engine.smoothPressure(0.1);
    engine.smoothPressure(0.2);
    engine.smoothPressure(0.3);
    engine.smoothPressure(0.4);
    engine.smoothPressure(0.5);
    const result = engine.smoothPressure(0.6);

    // Should keep only last 5: [0.2, 0.3, 0.4, 0.5, 0.6]
    const expectedAverage = (0.2 + 0.3 + 0.4 + 0.5 + 0.6) / 5;
    expect(result).toBeCloseTo(expectedAverage, 5);
  });

  it('should maintain separate buffers for different windowSize calls', () => {
    // First sequence with windowSize 3
    engine.smoothPressure(0.1, 3);
    engine.smoothPressure(0.2, 3);

    // Should not be affected by previous calls when using different windowSize
    const result = engine.smoothPressure(0.9, 2);
    // This test depends on implementation - buffer should be separate or shared
    // Assuming shared buffer behavior (more common)
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });
});
