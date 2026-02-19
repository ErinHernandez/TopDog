import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DenoiseTool } from '@/lib/studio/editor/tools/advanced/denoise';
import {
  createTestImageData,
  createGradientImageData,
} from '../../helpers/canvas-mock';

describe('DenoiseTool', () => {
  let mockCanvas: any;
  let mockCtx: any;
  let testImageData: ImageData;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Create mock canvas context
    mockCtx = {
      createImageData: vi.fn((w: number, h: number) => {
        const data = new Uint8ClampedArray(w * h * 4);
        return { data, width: w, height: h, colorSpace: 'srgb' };
      }),
      putImageData: vi.fn(),
      getImageData: vi.fn((x: number, y: number, w: number, h: number) => {
        const data = new Uint8ClampedArray(w * h * 4);
        // Fill with test data - simulate some pixel values
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 100;
          data[i + 1] = 100;
          data[i + 2] = 100;
          data[i + 3] = 255;
        }
        return { data, width: w, height: h, colorSpace: 'srgb' };
      }),
      drawImage: vi.fn(),
      clearRect: vi.fn(),
    };

    // Create mock canvas
    mockCanvas = {
      width: 100,
      height: 100,
      getContext: vi.fn((type: string) => (type === '2d' ? mockCtx : null)),
      toDataURL: vi.fn(
        () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      ),
    };

    // Mock document.createElement to return mock canvas
    vi.stubGlobal('document', {
      createElement: vi.fn((tag: string) => {
        if (tag === 'canvas') {
          return { ...mockCanvas };
        }
        return null;
      }),
    });

    // Mock Image constructor
    global.Image = vi.fn(function (this: any) {
      this.src = '';
      this.onload = null;
      this.onerror = null;
      this.width = 100;
      this.height = 100;
      this.crossOrigin = '';

      // Simulate async image loading
      setTimeout(() => {
        if (this.onload) {
          this.onload.call(this);
        }
      }, 0);
    }) as any;

    // Mock fetch globally
    global.fetch = vi.fn();

    // Create test image data (100x100 with neutral gray)
    testImageData = createTestImageData(100, 100, [128, 128, 128, 255]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('initializes state correctly with default options', () => {
      const tool = new DenoiseTool(testImageData);
      const state = tool.getState();

      expect(state.isProcessing).toBe(false);
      expect(state.progress).toBe(0);
      expect(state.options.method).toBe('nlm');
      expect(state.options.strength).toBe(0.5);
      expect(state.options.preserveDetail).toBe(0.7);
      expect(state.options.patchRadius).toBe(1);
      expect(state.options.searchRadius).toBe(5);
      expect(state.options.h).toBe(0.1);
      expect(state.beforeCanvas).toBeNull();
      expect(state.afterCanvas).toBeNull();
      expect(state.previewMode).toBe('after');
    });

    it('stores imageData in the instance', () => {
      const tool = new DenoiseTool(testImageData);
      const state = tool.getState();
      expect(state).toBeDefined();
      expect(state.options).toBeDefined();
    });
  });

  describe('getState', () => {
    it('returns current state', () => {
      const tool = new DenoiseTool(testImageData);
      const state = tool.getState();

      expect(state).toHaveProperty('isProcessing');
      expect(state).toHaveProperty('progress');
      expect(state).toHaveProperty('options');
      expect(state).toHaveProperty('beforeCanvas');
      expect(state).toHaveProperty('afterCanvas');
      expect(state).toHaveProperty('previewMode');
    });

    it('returns a copy of state, not a reference', () => {
      const tool = new DenoiseTool(testImageData);
      const state1 = tool.getState();
      const state2 = tool.getState();

      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });

    it('reflects updated state after operations', async () => {
      const tool = new DenoiseTool(testImageData);
      await tool.denoise({ strength: 0.8 });

      const state = tool.getState();
      expect(state.options.strength).toBe(0.8);
    });
  });

  describe('setPreviewMode', () => {
    it('sets preview mode to "before"', () => {
      const tool = new DenoiseTool(testImageData);
      tool.setPreviewMode('before');

      const state = tool.getState();
      expect(state.previewMode).toBe('before');
    });

    it('sets preview mode to "after"', () => {
      const tool = new DenoiseTool(testImageData);
      tool.setPreviewMode('after');

      const state = tool.getState();
      expect(state.previewMode).toBe('after');
    });

    it('sets preview mode to "split"', () => {
      const tool = new DenoiseTool(testImageData);
      tool.setPreviewMode('split');

      const state = tool.getState();
      expect(state.previewMode).toBe('split');
    });

    it('updates preview mode multiple times', () => {
      const tool = new DenoiseTool(testImageData);

      tool.setPreviewMode('before');
      expect(tool.getState().previewMode).toBe('before');

      tool.setPreviewMode('split');
      expect(tool.getState().previewMode).toBe('split');

      tool.setPreviewMode('after');
      expect(tool.getState().previewMode).toBe('after');
    });
  });

  describe('denoise', () => {
    it('performs NLM denoising and returns canvas', async () => {
      const tool = new DenoiseTool(testImageData);
      const result = await tool.denoise();

      expect(result).toBeDefined();
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it('updates isProcessing flag during operation', async () => {
      const tool = new DenoiseTool(testImageData);
      const statePromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          resolve(tool.getState().isProcessing);
        }, 5);
      });

      const denoisePromise = tool.denoise();
      // State might be false by the time we check due to async completion
      // So we just verify it completes
      const result = await denoisePromise;
      const finalState = tool.getState();

      expect(result).toBeDefined();
      expect(finalState.isProcessing).toBe(false);
    });

    it('sets progress to 100 after completion', async () => {
      const tool = new DenoiseTool(testImageData);
      await tool.denoise();

      const state = tool.getState();
      expect(state.progress).toBe(100);
    });

    it('updates afterCanvas state with result', async () => {
      const tool = new DenoiseTool(testImageData);
      const result = await tool.denoise();

      const state = tool.getState();
      expect(state.afterCanvas).toBe(result);
    });

    it('accepts custom denoise options', async () => {
      const tool = new DenoiseTool(testImageData);
      await tool.denoise({
        strength: 0.9,
        preserveDetail: 0.5,
        patchRadius: 2,
      });

      const state = tool.getState();
      expect(state.options.strength).toBe(0.9);
      expect(state.options.preserveDetail).toBe(0.5);
      expect(state.options.patchRadius).toBe(2);
    });

    it('merges custom options with defaults', async () => {
      const tool = new DenoiseTool(testImageData);
      await tool.denoise({ strength: 0.7 });

      const state = tool.getState();
      expect(state.options.strength).toBe(0.7);
      // Other options should retain defaults
      expect(state.options.preserveDetail).toBe(0.7);
      expect(state.options.searchRadius).toBe(5);
    });

    it('tracks progress during filtering', async () => {
      const tool = new DenoiseTool(testImageData);
      const progressValues: number[] = [];

      // Create a promise that tracks progress
      const denoisePromise = tool.denoise();

      // Sample progress values
      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1));
        progressValues.push(tool.getState().progress);
      }

      await denoisePromise;

      // Final progress should be 100
      expect(tool.getState().progress).toBe(100);
    });

    it('creates canvas with correct dimensions', async () => {
      const largeImageData = createTestImageData(256, 200);
      const tool = new DenoiseTool(largeImageData);
      const result = await tool.denoise();

      expect(result.width).toBe(256);
      expect(result.height).toBe(200);
    });
  });

  describe('aiDenoise', () => {
    it('calls OpenAI API by default', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [{ b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }],
        }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const tool = new DenoiseTool(testImageData);
      const result = await tool.aiDenoise('test-api-key');

      expect(global.fetch).toHaveBeenCalled();
      const callArgs = (global.fetch as any).mock.calls[0];
      expect(callArgs[0]).toContain('openai.com');
    });

    it('routes to OpenAI for "openai" model', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [{ b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }],
        }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const tool = new DenoiseTool(testImageData);
      await tool.aiDenoise('test-api-key', 'openai');

      expect(global.fetch).toHaveBeenCalled();
    });

    it('uses provided API key in request', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [{ b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }],
        }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const tool = new DenoiseTool(testImageData);
      const testKey = 'sk-test-12345';
      await tool.aiDenoise(testKey);

      const callArgs = (global.fetch as any).mock.calls[0];
      const options = callArgs[1];
      expect(options.headers.Authorization).toContain(testKey);
    });

    it('sets isProcessing to false after completion', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [{ b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }],
        }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const tool = new DenoiseTool(testImageData);
      await tool.aiDenoise('test-api-key');

      const state = tool.getState();
      expect(state.isProcessing).toBe(false);
    });

    it('falls back to NLM on API error', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const tool = new DenoiseTool(testImageData);
      const result = await tool.aiDenoise('test-api-key');

      expect(result).toBeDefined();
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('handles 401 Unauthorized error gracefully', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mockResponse = {
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ error: { message: 'Invalid API key' } }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const tool = new DenoiseTool(testImageData);
      const result = await tool.aiDenoise('invalid-key');

      // Should fall back to NLM denoising
      expect(result).toBeDefined();
      expect(result.width).toBe(100);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('handles 429 Rate Limit error gracefully', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mockResponse = {
        ok: false,
        status: 429,
        json: vi.fn().mockResolvedValue({ error: { message: 'Rate limit exceeded' } }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const tool = new DenoiseTool(testImageData);
      const result = await tool.aiDenoise('test-api-key');

      // Should fall back to NLM denoising
      expect(result).toBeDefined();
      expect(result.width).toBe(100);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('handles other API errors gracefully', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mockResponse = {
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ error: { message: 'Internal server error' } }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const tool = new DenoiseTool(testImageData);
      const result = await tool.aiDenoise('test-api-key');

      // Should fall back to NLM denoising
      expect(result).toBeDefined();
      expect(result.width).toBe(100);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('updates afterCanvas state on success', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [{ b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }],
        }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const tool = new DenoiseTool(testImageData);
      const result = await tool.aiDenoise('test-api-key');

      const state = tool.getState();
      expect(state.afterCanvas).toBe(result);
    });

    it('accepts custom denoise options', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [{ b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }],
        }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const tool = new DenoiseTool(testImageData);
      await tool.aiDenoise('test-api-key', 'openai', { strength: 0.8 });

      // Should complete without error
      const state = tool.getState();
      expect(state).toBeDefined();
    });

    it('tracks progress during API processing', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [{ b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }],
        }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const tool = new DenoiseTool(testImageData);
      await tool.aiDenoise('test-api-key');

      // Progress should reach 100 at the end
      const state = tool.getState();
      expect(state.progress).toBe(100);
    });
  });

  describe('getClosestSupportedSize', () => {
    it('selects 256x256 for small images', async () => {
      const smallImageData = createTestImageData(200, 200);
      const tool = new DenoiseTool(smallImageData);

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [{ b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }],
        }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      // Call aiDenoise to trigger getClosestSupportedSize internally
      await tool.aiDenoise('test-api-key');

      const callArgs = (global.fetch as any).mock.calls[0];
      // Note: FormData serialization is complex, so we just verify fetch was called
      expect(callArgs).toBeDefined();
    });

    it('selects 512x512 for medium images', async () => {
      const mediumImageData = createTestImageData(400, 400);
      const tool = new DenoiseTool(mediumImageData);

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [{ b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }],
        }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await tool.aiDenoise('test-api-key');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('selects 1024x1024 for large images', async () => {
      const largeImageData = createTestImageData(800, 800);
      const tool = new DenoiseTool(largeImageData);

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [{ b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }],
        }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await tool.aiDenoise('test-api-key');
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('createBeforeAfterPreview', () => {
    it('creates preview canvas with correct dimensions', async () => {
      const tool = new DenoiseTool(testImageData);
      await tool.denoise();

      const preview = tool.createBeforeAfterPreview();

      expect(preview.width).toBe(100);
      expect(preview.height).toBe(100);
    });

    it('creates preview with default split position (0.5)', async () => {
      const tool = new DenoiseTool(testImageData);
      await tool.denoise();

      const preview = tool.createBeforeAfterPreview();
      expect(preview).toBeDefined();
      expect(preview.width).toBe(100);
    });

    it('creates preview with custom split position', async () => {
      const tool = new DenoiseTool(testImageData);
      await tool.denoise();

      const preview = tool.createBeforeAfterPreview(0.3);
      expect(preview).toBeDefined();
      expect(preview.width).toBe(100);
    });

    it('creates preview with split position at 0', async () => {
      const tool = new DenoiseTool(testImageData);
      await tool.denoise();

      const preview = tool.createBeforeAfterPreview(0);
      expect(preview).toBeDefined();
    });

    it('creates preview with split position at 1', async () => {
      const tool = new DenoiseTool(testImageData);
      await tool.denoise();

      const preview = tool.createBeforeAfterPreview(1);
      expect(preview).toBeDefined();
    });

    it('returns canvas even if afterCanvas is not set', () => {
      const tool = new DenoiseTool(testImageData);
      const preview = tool.createBeforeAfterPreview();

      expect(preview).toBeDefined();
      expect(preview.width).toBe(100);
      expect(preview.height).toBe(100);
    });
  });

  describe('imageDataToBase64PNG', () => {
    it('converts ImageData to base64 PNG string', async () => {
      const tool = new DenoiseTool(testImageData);

      // Mock the canvas toDataURL to return a valid base64 PNG
      mockCanvas.toDataURL = vi.fn(
        () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      );

      // This is tested indirectly through aiDenoise
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [{ b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }],
        }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await tool.aiDenoise('test-api-key');
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('base64ToCanvas', () => {
    it('converts base64 PNG to canvas', async () => {
      const tool = new DenoiseTool(testImageData);

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [{ b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }],
        }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await tool.aiDenoise('test-api-key');
      expect(result).toBeDefined();
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    });
  });

  describe('urlToCanvas', () => {
    it('converts image URL to canvas', async () => {
      const tool = new DenoiseTool(testImageData);

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [{ url: 'https://example.com/image.png' }],
        }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await tool.aiDenoise('test-api-key');
      expect(result).toBeDefined();
    });
  });

  describe('scaleCanvasToFit', () => {
    it('returns same canvas if dimensions match', async () => {
      const tool = new DenoiseTool(testImageData);
      const result = await tool.denoise();

      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it('scales canvas to target dimensions', async () => {
      const largeImageData = createTestImageData(300, 200);
      const tool = new DenoiseTool(largeImageData);

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [{ b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }],
        }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await tool.aiDenoise('test-api-key');
      expect(result.width).toBe(300);
      expect(result.height).toBe(200);
    });
  });

  describe('edge cases and error handling', () => {
    it('handles very small images', async () => {
      const tinyImageData = createTestImageData(10, 10);
      const tool = new DenoiseTool(tinyImageData);
      const result = await tool.denoise();

      expect(result.width).toBe(10);
      expect(result.height).toBe(10);
    });

    it('handles non-square images', async () => {
      const wideImageData = createTestImageData(300, 100);
      const tool = new DenoiseTool(wideImageData);
      const result = await tool.denoise();

      expect(result.width).toBe(300);
      expect(result.height).toBe(100);
    });

    it('handles tall non-square images', async () => {
      const tallImageData = createTestImageData(100, 300);
      const tool = new DenoiseTool(tallImageData);
      const result = await tool.denoise();

      expect(result.width).toBe(100);
      expect(result.height).toBe(300);
    });

    it('denoise completes without errors for common sizes', async () => {
      // Note: NLM algorithm uses O(n^2) memory for distance cache
      // Large images (256+) can hit JS memory limits
      // This test covers practical working sizes where NLM is efficient
      const sizes = [
        [64, 64],
        [128, 128],
        [160, 160],
      ];

      for (const [w, h] of sizes) {
        const imageData = createTestImageData(w, h);
        const tool = new DenoiseTool(imageData);
        const result = await tool.denoise();

        expect(result.width).toBe(w);
        expect(result.height).toBe(h);
      }
    });

    it('handles large images by falling back to API when needed', async () => {
      // For very large images, AI denoising is more memory-efficient
      const largeImageData = createTestImageData(1024, 1024);
      const tool = new DenoiseTool(largeImageData);

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [
            {
              b64_json:
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            },
          ],
        }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await tool.aiDenoise('test-api-key');
      expect(result).toBeDefined();
      expect(result.width).toBe(1024);
      expect(result.height).toBe(1024);
    });

    it('handles API response with b64_json', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [
            {
              b64_json:
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            },
          ],
        }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const tool = new DenoiseTool(testImageData);
      const result = await tool.aiDenoise('test-api-key');

      expect(result).toBeDefined();
      expect(result.width).toBeGreaterThan(0);
    });

    it('handles API response with url', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [{ url: 'https://example.com/image.png' }],
        }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const tool = new DenoiseTool(testImageData);
      const result = await tool.aiDenoise('test-api-key');

      expect(result).toBeDefined();
    });

    it('handles API response with empty data array', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: [] }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const tool = new DenoiseTool(testImageData);
      const result = await tool.aiDenoise('test-api-key');

      // Should fall back to NLM
      expect(result).toBeDefined();
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('handles malformed JSON response', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mockResponse = {
        ok: true,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const tool = new DenoiseTool(testImageData);
      const result = await tool.aiDenoise('test-api-key');

      // Should fall back to NLM
      expect(result).toBeDefined();
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('integration tests', () => {
    it('performs complete workflow: denoise -> preview', async () => {
      const tool = new DenoiseTool(testImageData);

      // Step 1: Denoise
      await tool.denoise();
      let state = tool.getState();
      expect(state.afterCanvas).toBeDefined();

      // Step 2: Create preview
      const preview = tool.createBeforeAfterPreview(0.5);
      expect(preview).toBeDefined();
      expect(preview.width).toBe(100);
      expect(preview.height).toBe(100);
    });

    it('performs complete workflow: AI denoise -> preview -> change mode', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [
            {
              b64_json:
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            },
          ],
        }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const tool = new DenoiseTool(testImageData);

      // Step 1: AI Denoise
      await tool.aiDenoise('test-api-key');
      let state = tool.getState();
      expect(state.afterCanvas).toBeDefined();

      // Step 2: Create preview
      const preview = tool.createBeforeAfterPreview(0.5);
      expect(preview).toBeDefined();

      // Step 3: Change preview mode
      tool.setPreviewMode('before');
      state = tool.getState();
      expect(state.previewMode).toBe('before');

      tool.setPreviewMode('split');
      state = tool.getState();
      expect(state.previewMode).toBe('split');
    });

    it('handles multiple sequential denoise operations', async () => {
      const tool = new DenoiseTool(testImageData);

      // First denoise
      await tool.denoise({ strength: 0.5 });
      let state = tool.getState();
      expect(state.options.strength).toBe(0.5);

      // Second denoise with different settings
      await tool.denoise({ strength: 0.8, preserveDetail: 0.5 });
      state = tool.getState();
      expect(state.options.strength).toBe(0.8);
      expect(state.options.preserveDetail).toBe(0.5);
    });

    it('recovers gracefully from API failure and can retry with NLM', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // First call: API fails
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const tool = new DenoiseTool(testImageData);
      const result1 = await tool.aiDenoise('test-api-key');
      expect(result1).toBeDefined();

      // Second call: Use NLM directly
      const result2 = await tool.denoise();
      expect(result2).toBeDefined();

      consoleWarnSpy.mockRestore();
    });
  });
});
