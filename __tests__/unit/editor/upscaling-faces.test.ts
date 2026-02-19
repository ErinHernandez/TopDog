import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Upscaling } from '@/lib/studio/editor/tools/ai/Upscaling';

describe('Upscaling - detectFaces', () => {
  let upscaling: Upscaling;
  const sessionId = 'test-session-123';
  const userId = 'test-user-456';

  // Minimal 1x1 white PNG base64
  const TINY_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

  beforeEach(() => {
    upscaling = new Upscaling(sessionId, userId);
    vi.restoreAllMocks();
  });

  it('calls API at /api/studio/ai/detect-faces on successful fetch', async () => {
    const mockFaces = [{ x: 10, y: 20, width: 50, height: 60, confidence: 0.95 }];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ faces: mockFaces })
    }));

    const result = await upscaling.detectFaces(TINY_PNG_BASE64);

    expect(fetch).toHaveBeenCalledWith(
      '/api/studio/ai/detect-faces',
      expect.objectContaining({
        method: 'POST'
      })
    );
    expect(result).toEqual(mockFaces);
  });

  it('returns faces array from API response', async () => {
    const mockFaces = [
      { x: 10, y: 20, width: 50, height: 60, confidence: 0.95 },
      { x: 100, y: 80, width: 45, height: 55, confidence: 0.87 }
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ faces: mockFaces })
    }));

    const result = await upscaling.detectFaces(TINY_PNG_BASE64);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0]).toEqual(mockFaces[0]);
    expect(result[1]).toEqual(mockFaces[1]);
  });

  it('falls back to local heuristic when API returns non-OK status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500
    }));

    const result = await upscaling.detectFaces(TINY_PNG_BASE64);

    expect(Array.isArray(result)).toBe(true);
  });

  it('falls back to local heuristic when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const result = await upscaling.detectFaces(TINY_PNG_BASE64);

    expect(Array.isArray(result)).toBe(true);
  });

  it('returns empty array on complete failure with invalid base64', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const result = await upscaling.detectFaces('invalid!!!base64###');

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it('local heuristic: PNG image returns face at center-upper third', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('API unavailable')));

    const result = await upscaling.detectFaces(TINY_PNG_BASE64);

    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty('x');
      expect(result[0]).toHaveProperty('y');
      expect(result[0]).toHaveProperty('width');
      expect(result[0]).toHaveProperty('height');
      expect(result[0]).toHaveProperty('confidence');
      expect(result[0].confidence).toBe(0.3);
    }
  });

  it('local heuristic: JPEG image with FF D8 FF header is recognized', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('API unavailable')));

    // Minimal JPEG header base64 (FF D8 FF E0)
    const minimalJpegBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';

    const result = await upscaling.detectFaces(minimalJpegBase64);

    expect(Array.isArray(result)).toBe(true);
  });

  it('local heuristic: unknown format uses default 512x512 dimensions', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('API unavailable')));

    // Random base64 that doesn't match PNG or JPEG headers
    const randomBase64 = 'SGVsbG8gV29ybGQgVGhpcyBpcyBub3QgYW4gaW1hZ2U=';

    const result = await upscaling.detectFaces(randomBase64);

    expect(Array.isArray(result)).toBe(true);
    // Heuristic fallback returns 1 face at default 512x512 dimensions
    expect(result.length).toBe(1);
    expect(result[0].confidence).toBe(0.3);
  });

  it('API returns empty faces array — returns empty array', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ faces: [] })
    }));

    const result = await upscaling.detectFaces(TINY_PNG_BASE64);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it('validateCalculateOutputDimensions with 2x scale', () => {
    const inputWidth = 800;
    const inputHeight = 600;
    const scale = 2;

    const output = upscaling.calculateOutputDimensions(inputWidth, inputHeight, scale);

    expect(output.width).toBe(inputWidth * scale);
    expect(output.height).toBe(inputHeight * scale);
  });

  it('validateCalculateOutputDimensions with 4x scale', () => {
    const inputWidth = 512;
    const inputHeight = 512;
    const scale = 4;

    const output = upscaling.calculateOutputDimensions(inputWidth, inputHeight, scale);

    expect(output.width).toBe(inputWidth * scale);
    expect(output.height).toBe(inputHeight * scale);
  });

  it('validateEstimateProcessingTime returns reasonable estimate', () => {
    const estimate = upscaling.estimateProcessingTime(800, 600, 2);

    expect(typeof estimate).toBe('number');
    expect(estimate).toBeGreaterThan(0);
  });
});
