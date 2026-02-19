import { describe, it, expect, beforeEach } from 'vitest';
import { Inpainting } from '@/lib/studio/editor/tools/ai/Inpainting';

// Mock DOMRect for Node.js environment
if (typeof DOMRect === 'undefined') {
  (global as any).DOMRect = class DOMRect {
    constructor(
      public x: number,
      public y: number,
      public width: number,
      public height: number
    ) {}
  };
}

describe('Inpainting - createTelemetry and getMaskStats', () => {
  let inpainting: Inpainting;
  const sessionId = 'test-session-789';
  const userId = 'test-user-101';

  beforeEach(() => {
    inpainting = new Inpainting(sessionId, userId);
  });

  it('createTelemetry includes maskCoverage in metadata', () => {
    const telemetry = inpainting.createTelemetry(
      'hash_before',
      'hash_after',
      'test prompt',
      'hash_mask',
      0.8,
      [],
      0,
      1000,
      true,
      0,
      5000,
      25.5
    );

    expect(telemetry.metadata).toHaveProperty('maskCoverage');
    expect(typeof telemetry.metadata.maskCoverage).toBe('string');
  });

  it('createTelemetry with 50.5% coverage: metadata.maskCoverage === "50.5%"', () => {
    const telemetry = inpainting.createTelemetry(
      'hash_before',
      'hash_after',
      'test prompt',
      'hash_mask',
      0.8,
      [],
      0,
      1000,
      true,
      0,
      5000,
      50.5
    );

    expect(telemetry.metadata.maskCoverage).toBe('50.5%');
  });

  it('createTelemetry with 0% coverage (default): metadata.maskCoverage === "0.0%"', () => {
    const telemetry = inpainting.createTelemetry(
      'hash_before',
      'hash_after',
      'test prompt',
      'hash_mask',
      0.8,
      [],
      0,
      1000,
      true,
      0,
      5000
    );

    expect(telemetry.metadata.maskCoverage).toBe('0.0%');
  });

  it('createTelemetry with 100% coverage: metadata.maskCoverage === "100.0%"', () => {
    const telemetry = inpainting.createTelemetry(
      'hash_before',
      'hash_after',
      'test prompt',
      'hash_mask',
      0.8,
      [],
      0,
      1000,
      true,
      0,
      5000,
      100
    );

    expect(telemetry.metadata.maskCoverage).toBe('100.0%');
  });

  it('createTelemetry preserves all other fields (sessionId, prompt, etc.)', () => {
    const prompt = 'restore the background';
    const telemetry = inpainting.createTelemetry(
      'hash_before',
      'hash_after',
      prompt,
      'hash_mask',
      0.8,
      [],
      0,
      1000,
      true,
      0,
      5000,
      45.2
    );

    expect(telemetry.sessionId).toBe(sessionId);
    expect(telemetry.userId).toBe(userId);
    expect(telemetry.prompt).toBe(prompt);
    expect(telemetry.metadata).toHaveProperty('maskCoverage');
  });

  it('getMaskStats on empty mask returns coverage 0', () => {
    const mask = new ImageData(10, 10);
    const stats = inpainting.getMaskStats(mask);

    expect(stats.coverage).toBe(0);
  });

  it('getMaskStats on partially painted mask returns correct coverage', () => {
    const mask = new ImageData(10, 10);
    // Paint 50 pixels out of 100 (10x10)
    for (let i = 0; i < 50; i++) {
      mask.data[i * 4 + 3] = 255; // Set alpha to 255
    }

    const stats = inpainting.getMaskStats(mask);

    expect(stats.coverage).toBeGreaterThan(0);
    expect(stats.coverage).toBeLessThanOrEqual(100);
  });

  it('getMaskStats returns correct bounding box', () => {
    const mask = new ImageData(20, 20);
    // Paint a rectangular region from (5,5) to (15,15)
    for (let y = 5; y < 15; y++) {
      for (let x = 5; x < 15; x++) {
        const index = (y * 20 + x) * 4;
        mask.data[index + 3] = 255; // Set alpha
      }
    }

    const stats = inpainting.getMaskStats(mask);

    expect(stats.boundingBox).toBeDefined();
    expect(stats.boundingBox.x).toBeGreaterThanOrEqual(0);
    expect(stats.boundingBox.y).toBeGreaterThanOrEqual(0);
    expect(stats.boundingBox.width).toBeGreaterThan(0);
    expect(stats.boundingBox.height).toBeGreaterThan(0);
  });

  it('paintMask then getMaskStats shows non-zero coverage', () => {
    const mask = new ImageData(15, 15);

    // Paint some pixels
    inpainting.paintMask(mask, [{ x: 5, y: 5 }], 8, 0.8);

    const stats = inpainting.getMaskStats(mask);

    expect(stats.coverage).toBeGreaterThan(0);
  });

  it('eraseMask reduces coverage', () => {
    const mask = new ImageData(15, 15);

    // Paint the entire mask
    inpainting.paintMask(mask, [{ x: 7, y: 7 }], 20, 1.0);
    const statsAfterPaint = inpainting.getMaskStats(mask);
    const coverageAfterPaint = statsAfterPaint.coverage;

    // Erase part of it
    inpainting.eraseMask(mask, [{ x: 5, y: 5 }], 10);
    const statsAfterErase = inpainting.getMaskStats(mask);
    const coverageAfterErase = statsAfterErase.coverage;

    expect(coverageAfterErase).toBeLessThan(coverageAfterPaint);
  });
});
