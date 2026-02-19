/**
 * Spot Healing Brush AI Test Suite
 * Tests content-aware source finding and AI backend integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SpotHealingBrushTool } from '@/lib/studio/editor/tools/retouch/spotHealingBrush';
import type {
  Point,
  BrushContext,
} from '@/lib/studio/editor/tools/retouch/types';
import { createTestImageData } from '@/__tests__/helpers/canvas-mock';

// Track all XHR instances created during tests
let xhrInstances: MockXHR[] = [];

/**
 * Mock XMLHttpRequest — methods as prototype methods so vi.spyOn works
 */
class MockXHR {
  status = 200;
  responseText = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor() {
    xhrInstances.push(this);
  }

  open(_method: string, _url: string, _async?: boolean): void {}
  setRequestHeader(_header: string, _value: string): void {}
  send(_body?: string): void {
    if (this.onload) this.onload();
  }
}

// Mock document for Node.js environment
if (typeof document === 'undefined') {
  (globalThis as any).document = {
    createElement: () => ({
      width: 0,
      height: 0,
      getContext: () => null,
      toDataURL: () => 'data:image/png;base64,',
    }),
  };
}

describe('SpotHealingBrushTool - Content-Aware AI Backend', () => {
  let tool: SpotHealingBrushTool;
  let imageData: ImageData;
  let mockCanvas: any;
  let mockCtx: any;
  const originalXHR = (globalThis as any).XMLHttpRequest;
  const originalCreateElement = document.createElement;

  /**
   * Helper: set up XHR to respond with given status and body
   */
  function mockXHRResponse(status: number, responseBody: string) {
    vi.spyOn(MockXHR.prototype, 'send').mockImplementation(function (this: MockXHR) {
      this.status = status;
      this.responseText = responseBody;
      if (this.onload) this.onload();
    });
  }

  beforeEach(() => {
    xhrInstances = [];

    // Set up mock ImageData
    imageData = createTestImageData(100, 100, [128, 128, 128, 255]);

    // Set up mock canvas context
    mockCtx = {
      createImageData: vi.fn((w: number, h: number) => {
        const data = new Uint8ClampedArray(w * h * 4);
        return { data, width: w, height: h, colorSpace: 'srgb' };
      }),
      putImageData: vi.fn(),
    };

    // Set up mock canvas element
    mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mockBase64Data'),
    };

    // Mock document.createElement to return our mock canvas
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return mockCanvas as any;
      return originalCreateElement.call(document, tag);
    });

    // Install mock XMLHttpRequest
    (globalThis as any).XMLHttpRequest = MockXHR;

    // Reset tool instance
    tool = new SpotHealingBrushTool('proximity-match', false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    (globalThis as any).XMLHttpRequest = originalXHR;
  });

  // ──────────────────────────────────────────────────────────────
  // findContentAwareSource — API Integration
  // ──────────────────────────────────────────────────────────────
  describe('findContentAwareSource - API Integration', () => {
    it('returns source region on successful API response', () => {
      tool = new SpotHealingBrushTool('content-aware', true);
      mockXHRResponse(200, JSON.stringify({ sourceX: 10, sourceY: 15 }));

      const result = (tool as any).findContentAwareSource(imageData, 50, 50, 10);

      // startX = max(0, 50 - 20) = 30, startY = 30
      expect(result).not.toBeNull();
      expect(result.x).toBe(10 + 30); // sourceX + startX
      expect(result.y).toBe(15 + 30); // sourceY + startY
      expect(result.width).toBe(20);   // healRadius * 2
      expect(result.height).toBe(20);
    });

    it('returns null on API error (non-200 status)', () => {
      tool = new SpotHealingBrushTool('content-aware', true);
      mockXHRResponse(500, '');

      const result = (tool as any).findContentAwareSource(imageData, 50, 50, 10);
      expect(result).toBeNull();
    });

    it('returns null when canvas getContext returns null', () => {
      tool = new SpotHealingBrushTool('content-aware', true);
      mockCanvas.getContext = vi.fn().mockReturnValue(null);

      const result = (tool as any).findContentAwareSource(imageData, 50, 50, 10);
      expect(result).toBeNull();
    });

    it('sends correct JSON payload to API', () => {
      tool = new SpotHealingBrushTool('content-aware', true);
      const sendSpy = vi.spyOn(MockXHR.prototype, 'send').mockImplementation(
        function (this: MockXHR) {
          this.status = 200;
          this.responseText = JSON.stringify({ sourceX: 5, sourceY: 5 });
          if (this.onload) this.onload();
        },
      );

      (tool as any).findContentAwareSource(imageData, 50, 50, 10);

      expect(sendSpy).toHaveBeenCalled();
      const payload = JSON.parse(sendSpy.mock.calls[0][0] as string);

      expect(payload).toHaveProperty('imageBase64');
      expect(payload.centerX).toBe(20);   // 50 - startX(30)
      expect(payload.centerY).toBe(20);
      expect(payload.healRadius).toBe(10);
    });

    it('handles JSON parse error gracefully', () => {
      tool = new SpotHealingBrushTool('content-aware', true);
      mockXHRResponse(200, 'not-valid-json{{{');

      const result = (tool as any).findContentAwareSource(imageData, 50, 50, 10);
      expect(result).toBeNull();
    });

    it('adjusts centerX/Y near image edge', () => {
      tool = new SpotHealingBrushTool('content-aware', true);
      const sendSpy = vi.spyOn(MockXHR.prototype, 'send').mockImplementation(
        function (this: MockXHR) {
          this.status = 200;
          this.responseText = JSON.stringify({ sourceX: 2, sourceY: 2 });
          if (this.onload) this.onload();
        },
      );

      (tool as any).findContentAwareSource(imageData, 5, 5, 10);

      const payload = JSON.parse(sendSpy.mock.calls[0][0] as string);
      // startX = max(0, 5-20) = 0 → centerX - startX = 5
      expect(payload.centerX).toBe(5);
      expect(payload.centerY).toBe(5);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // findSourceRegion — Content-Aware Mode
  // ──────────────────────────────────────────────────────────────
  describe('findSourceRegion - Content-Aware Mode', () => {
    it('uses AI result when content-aware mode succeeds', () => {
      tool = new SpotHealingBrushTool('content-aware', true);
      mockXHRResponse(200, JSON.stringify({ sourceX: 15, sourceY: 20 }));

      const result = (tool as any).findSourceRegion(imageData, 50, 50, 10);

      expect(result).not.toBeNull();
      expect(result.x).toBe(15 + 30);
      expect(result.y).toBe(20 + 30);
    });

    it('falls back to proximity when AI returns null', () => {
      tool = new SpotHealingBrushTool('content-aware', true);
      mockXHRResponse(500, '');

      const result = (tool as any).findSourceRegion(imageData, 50, 50, 10);

      // Should still return a source (proximity fallback)
      expect(result).not.toBeNull();
      expect(result.width).toBe(20);
      expect(result.x).toBeGreaterThanOrEqual(0);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // apply — Integration
  // ──────────────────────────────────────────────────────────────
  describe('apply - Integration', () => {
    it('returns autoSourceFound=true when AI source found', () => {
      tool = new SpotHealingBrushTool('content-aware', true);
      mockXHRResponse(200, JSON.stringify({ sourceX: 10, sourceY: 10 }));

      const ctx: BrushContext = {
        canvas: mockCanvas,
        ctx: mockCtx,
        layerId: 'test-layer',
        imageData,
        offset: { x: 0, y: 0 },
      };

      const result = tool.apply(ctx, { x: 50, y: 50 }, 10, 0.8, 1.0);

      expect(result.type).toBe('spot-healing-brush');
      expect(result.autoSourceFound).toBe(true);
      expect(result.sourceRegion).toBeDefined();
    });

    it('includes correct mode and AI info in result', () => {
      tool = new SpotHealingBrushTool('content-aware', true);
      mockXHRResponse(200, JSON.stringify({ sourceX: 5, sourceY: 5 }));

      const ctx: BrushContext = {
        canvas: mockCanvas,
        ctx: mockCtx,
        layerId: 'test-layer',
        imageData,
        offset: { x: 0, y: 0 },
      };

      const result = tool.apply(ctx, { x: 50, y: 50 }, 10, 0.8, 1.0);

      expect(result.mode).toBe('content-aware');
      expect(result.useAIBackend).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Non-AI Modes — no XHR calls
  // ──────────────────────────────────────────────────────────────
  describe('Non-AI Modes', () => {
    it('proximity-match does not call XMLHttpRequest', () => {
      tool = new SpotHealingBrushTool('proximity-match', false);
      const openSpy = vi.spyOn(MockXHR.prototype, 'open');

      const ctx: BrushContext = {
        canvas: mockCanvas, ctx: mockCtx,
        layerId: 'l', imageData, offset: { x: 0, y: 0 },
      };

      tool.apply(ctx, { x: 50, y: 50 }, 10, 0.8, 1.0);
      expect(openSpy).not.toHaveBeenCalled();
    });

    it('create-texture does not call XMLHttpRequest', () => {
      tool = new SpotHealingBrushTool('create-texture', false);
      const openSpy = vi.spyOn(MockXHR.prototype, 'open');

      const ctx: BrushContext = {
        canvas: mockCanvas, ctx: mockCtx,
        layerId: 'l', imageData, offset: { x: 0, y: 0 },
      };

      tool.apply(ctx, { x: 50, y: 50 }, 10, 0.8, 1.0);
      expect(openSpy).not.toHaveBeenCalled();
    });

    it('content-aware without AI backend does not call XHR', () => {
      tool = new SpotHealingBrushTool('content-aware', false);
      const openSpy = vi.spyOn(MockXHR.prototype, 'open');

      const ctx: BrushContext = {
        canvas: mockCanvas, ctx: mockCtx,
        layerId: 'l', imageData, offset: { x: 0, y: 0 },
      };

      tool.apply(ctx, { x: 50, y: 50 }, 10, 0.8, 1.0);
      expect(openSpy).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Canvas & API Communication
  // ──────────────────────────────────────────────────────────────
  describe('Canvas & API Communication', () => {
    it('creates canvas element for content-aware source', () => {
      tool = new SpotHealingBrushTool('content-aware', true);
      mockXHRResponse(200, JSON.stringify({ sourceX: 5, sourceY: 5 }));

      (tool as any).findContentAwareSource(imageData, 50, 50, 10);

      expect(document.createElement).toHaveBeenCalledWith('canvas');
    });

    it('calls putImageData on canvas context', () => {
      tool = new SpotHealingBrushTool('content-aware', true);
      mockXHRResponse(200, JSON.stringify({ sourceX: 5, sourceY: 5 }));

      (tool as any).findContentAwareSource(imageData, 50, 50, 10);

      expect(mockCtx.putImageData).toHaveBeenCalled();
    });

    it('calls toDataURL with image/png', () => {
      tool = new SpotHealingBrushTool('content-aware', true);
      mockXHRResponse(200, JSON.stringify({ sourceX: 5, sourceY: 5 }));

      (tool as any).findContentAwareSource(imageData, 50, 50, 10);

      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png');
    });

    it('sets Content-Type header to application/json', () => {
      tool = new SpotHealingBrushTool('content-aware', true);
      const headerSpy = vi.spyOn(MockXHR.prototype, 'setRequestHeader');
      mockXHRResponse(200, JSON.stringify({ sourceX: 5, sourceY: 5 }));

      (tool as any).findContentAwareSource(imageData, 50, 50, 10);

      expect(headerSpy).toHaveBeenCalledWith('Content-Type', 'application/json');
    });

    it('opens synchronous XMLHttpRequest (false)', () => {
      tool = new SpotHealingBrushTool('content-aware', true);
      const openSpy = vi.spyOn(MockXHR.prototype, 'open');
      mockXHRResponse(200, JSON.stringify({ sourceX: 5, sourceY: 5 }));

      (tool as any).findContentAwareSource(imageData, 50, 50, 10);

      expect(openSpy).toHaveBeenCalledWith('POST', '/api/studio/ai/content-aware-fill', false);
    });

    it('returns null when response missing sourceY', () => {
      tool = new SpotHealingBrushTool('content-aware', true);
      mockXHRResponse(200, JSON.stringify({ sourceX: 10 })); // missing sourceY

      const result = (tool as any).findContentAwareSource(imageData, 50, 50, 10);

      expect(result).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Tool Configuration
  // ──────────────────────────────────────────────────────────────
  describe('Tool Configuration', () => {
    it('setMode + setUseAIBackend enables AI path', () => {
      tool = new SpotHealingBrushTool('proximity-match', false);
      tool.setMode('content-aware');
      tool.setUseAIBackend(true);

      const openSpy = vi.spyOn(MockXHR.prototype, 'open');
      mockXHRResponse(200, JSON.stringify({ sourceX: 5, sourceY: 5 }));

      const ctx: BrushContext = {
        canvas: mockCanvas, ctx: mockCtx,
        layerId: 'l', imageData, offset: { x: 0, y: 0 },
      };

      tool.apply(ctx, { x: 50, y: 50 }, 10, 0.8, 1.0);

      expect(openSpy).toHaveBeenCalled();
    });

    it('reset() clears affectedPixels', () => {
      tool = new SpotHealingBrushTool('proximity-match', false);
      const ctx: BrushContext = {
        canvas: mockCanvas, ctx: mockCtx,
        layerId: 'l', imageData, offset: { x: 0, y: 0 },
      };

      // First apply accumulates affectedPixels
      const first = tool.apply(ctx, { x: 50, y: 50 }, 10, 0.8, 1.0);
      const firstCount = first.affectedPixels;
      expect(firstCount).toBeGreaterThan(0);

      tool.reset();

      // After reset, affectedPixels should restart from 0 (not accumulate)
      const second = tool.apply(ctx, { x: 50, y: 50 }, 10, 0.8, 1.0);
      expect(second.affectedPixels).toBe(firstCount); // same as first, not doubled
    });
  });
});
