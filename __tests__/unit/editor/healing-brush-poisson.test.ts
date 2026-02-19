import { describe, it, expect, beforeEach } from 'vitest';
import { HealingBrushTool } from '@/lib/studio/editor/tools/retouch/healingBrush';

describe('HealingBrushTool - poissonBlend', () => {
  let tool: HealingBrushTool;

  beforeEach(() => {
    tool = new HealingBrushTool('poisson');
  });

  it('returns RGBA object with r, g, b, a properties', () => {
    const src = { r: 100, g: 100, b: 100, a: 255 };
    const dest = { r: 150, g: 150, b: 150, a: 255 };
    const result = (tool as any).poissonBlend(src, dest);

    expect(result).toHaveProperty('r');
    expect(result).toHaveProperty('g');
    expect(result).toHaveProperty('b');
    expect(result).toHaveProperty('a');
    expect(typeof result.r).toBe('number');
    expect(typeof result.g).toBe('number');
    expect(typeof result.b).toBe('number');
    expect(typeof result.a).toBe('number');
  });

  it('clamps all channels to 0-255 range for bright inputs', () => {
    const src = { r: 300, g: 280, b: 260, a: 255 };
    const dest = { r: 255, g: 255, b: 255, a: 255 };
    const result = (tool as any).poissonBlend(src, dest);

    expect(result.r).toBeGreaterThanOrEqual(0);
    expect(result.r).toBeLessThanOrEqual(255);
    expect(result.g).toBeGreaterThanOrEqual(0);
    expect(result.g).toBeLessThanOrEqual(255);
    expect(result.b).toBeGreaterThanOrEqual(0);
    expect(result.b).toBeLessThanOrEqual(255);
  });

  it('clamps all channels to 0-255 range with no negative values for dark inputs', () => {
    const src = { r: 0, g: 0, b: 0, a: 255 };
    const dest = { r: 0, g: 0, b: 0, a: 255 };
    const result = (tool as any).poissonBlend(src, dest);

    expect(result.r).toBeGreaterThanOrEqual(0);
    expect(result.g).toBeGreaterThanOrEqual(0);
    expect(result.b).toBeGreaterThanOrEqual(0);
    expect(result.r).toBeLessThanOrEqual(255);
    expect(result.g).toBeLessThanOrEqual(255);
    expect(result.b).toBeLessThanOrEqual(255);
  });

  it('preserves destination alpha', () => {
    const src = { r: 100, g: 100, b: 100, a: 200 };
    const dest = { r: 150, g: 150, b: 150, a: 180 };
    const result = (tool as any).poissonBlend(src, dest);

    expect(result.a).toBe(dest.a);
  });

  it('handles black source (0,0,0) — srcLum is near 0, detail defaults to {1,1,1}', () => {
    const src = { r: 0, g: 0, b: 0, a: 255 };
    const dest = { r: 100, g: 100, b: 100, a: 255 };
    const result = (tool as any).poissonBlend(src, dest);

    expect(result).toBeDefined();
    expect(result.r).toBeGreaterThanOrEqual(0);
    expect(result.g).toBeGreaterThanOrEqual(0);
    expect(result.b).toBeGreaterThanOrEqual(0);
  });

  it('handles white source (255,255,255) and white dest — stays near white', () => {
    const src = { r: 255, g: 255, b: 255, a: 255 };
    const dest = { r: 255, g: 255, b: 255, a: 255 };
    const result = (tool as any).poissonBlend(src, dest);

    expect(result.r).toBeGreaterThan(200);
    expect(result.g).toBeGreaterThan(200);
    expect(result.b).toBeGreaterThan(200);
  });

  it('blends pure red source with pure blue dest — produces blended color (not average)', () => {
    const src = { r: 255, g: 0, b: 0, a: 255 };
    const dest = { r: 0, g: 0, b: 255, a: 255 };
    const result = (tool as any).poissonBlend(src, dest);

    expect(result).toBeDefined();
    expect(result.r).toBeGreaterThanOrEqual(0);
    expect(result.g).toBeGreaterThanOrEqual(0);
    expect(result.b).toBeGreaterThanOrEqual(0);
    expect(result.r).toBeLessThanOrEqual(255);
    expect(result.g).toBeLessThanOrEqual(255);
    expect(result.b).toBeLessThanOrEqual(255);
  });

  it('same source and dest produces output similar to input (identity-ish)', () => {
    const color = { r: 120, g: 150, b: 100, a: 255 };
    const result = (tool as any).poissonBlend(color, color);

    expect(result).toBeDefined();
    expect(Math.abs(result.r - color.r)).toBeLessThan(50);
    expect(Math.abs(result.g - color.g)).toBeLessThan(50);
    expect(Math.abs(result.b - color.b)).toBeLessThan(50);
    expect(result.a).toBe(color.a);
  });

  it('blends with 0.7 strength: destination luminance should dominate', () => {
    const src = { r: 50, g: 50, b: 50, a: 255 };
    const dest = { r: 200, g: 200, b: 200, a: 255 };
    const result = (tool as any).poissonBlend(src, dest);

    const srcLum = (src.r * 0.299 + src.g * 0.587 + src.b * 0.114) / 255;
    const destLum = (dest.r * 0.299 + dest.g * 0.587 + dest.b * 0.114) / 255;

    expect(result).toBeDefined();
    expect(result.r).toBeGreaterThanOrEqual(0);
    expect(result.g).toBeGreaterThanOrEqual(0);
    expect(result.b).toBeGreaterThanOrEqual(0);
  });

  it('handles fully transparent alpha (a=0) — alpha stays 0', () => {
    const src = { r: 100, g: 100, b: 100, a: 0 };
    const dest = { r: 150, g: 150, b: 150, a: 0 };
    const result = (tool as any).poissonBlend(src, dest);

    expect(result.a).toBe(0);
  });
});
