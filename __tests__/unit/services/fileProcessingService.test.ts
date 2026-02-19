/**
 * File Processing Service Tests
 *
 * Tests the fileProcessingService which handles:
 * - File validation with size and dimension constraints
 * - Image metadata extraction using Sharp
 * - Thumbnail generation
 * - Font metadata extraction
 *
 * @module __tests__/unit/services/fileProcessingService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// MOCKS — hoisted so they work with vi.mock()
// ============================================================================

const mocks = vi.hoisted(() => ({
  mockSharpInstance: {
    metadata: vi.fn(),
    resize: vi.fn(),
    jpeg: vi.fn(),
    png: vi.fn(),
    toBuffer: vi.fn(),
  },
}));

// Mock Sharp
vi.mock('sharp', () => {
  const mockSharpInstance = {
    metadata: mocks.mockSharpInstance.metadata,
    resize: mocks.mockSharpInstance.resize,
    jpeg: mocks.mockSharpInstance.jpeg,
    png: mocks.mockSharpInstance.png,
    toBuffer: mocks.mockSharpInstance.toBuffer,
  };

  // Setup the chainable API for sharp
  mocks.mockSharpInstance.resize.mockReturnValue(mockSharpInstance);
  mocks.mockSharpInstance.jpeg.mockReturnValue(mockSharpInstance);
  mocks.mockSharpInstance.png.mockReturnValue(mockSharpInstance);

  return {
    default: vi.fn(() => mockSharpInstance),
  };
});

// ============================================================================
// IMPORTS (after mocks)
// ============================================================================

const importService = async () => {
  const module = await import('@/lib/studio/services/fileProcessingService');
  return module.getFileProcessingService();
};

// ============================================================================
// TESTS
// ============================================================================

describe('fileProcessingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Sharp mock for each test
    mocks.mockSharpInstance.metadata.mockResolvedValue({
      width: 1920,
      height: 1080,
      format: 'jpeg',
      space: 'srgb',
      hasAlpha: false,
      density: 72,
    });
    mocks.mockSharpInstance.toBuffer.mockResolvedValue(
      Buffer.from('thumbnail-data')
    );
  });

  describe('validateFile', () => {
    it('should return valid for correct file within constraints', async () => {
      const service = await importService();

      const base64 = Buffer.from('test file content').toString('base64');
      const result = service.validateFile(base64, 'image/jpeg', {
        maxSize: 100 * 1024 * 1024,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sizeBytes).toBeGreaterThan(0);
    });

    it('should return invalid when file exceeds maxSizeBytes', async () => {
      const service = await importService();

      const largeBase64 = Buffer.alloc(20 * 1024 * 1024).toString('base64');
      const result = service.validateFile(largeBase64, 'image/jpeg', {
        maxSize: 10 * 1024 * 1024,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes('size'))).toBe(true);
    });

    it('should return invalid for unsupported MIME type', async () => {
      const service = await importService();

      const base64 = Buffer.from('test content').toString('base64');
      const result = service.validateFile(base64, 'application/x-executable', {
        maxSize: 100 * 1024 * 1024,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('extractImageMetadata', () => {
    it('should return correct metadata from Sharp', async () => {
      const service = await importService();
      mocks.mockSharpInstance.metadata.mockResolvedValue({
        width: 1920,
        height: 1080,
        format: 'jpeg',
        space: 'srgb',
        hasAlpha: false,
        density: 72,
      });

      const base64 = Buffer.from('fake jpeg').toString('base64');
      const metadata = await service.extractImageMetadata(base64);

      expect(metadata.width).toBe(1920);
      expect(metadata.height).toBe(1080);
      expect(metadata.format).toBe('jpeg');
      expect(metadata.colorSpace).toBe('srgb');
      expect(metadata.hasAlpha).toBe(false);
      expect(metadata.dpi).toBe(72);
    });

    it('should handle Sharp errors gracefully', async () => {
      const service = await importService();
      mocks.mockSharpInstance.metadata.mockRejectedValue(
        new Error('Invalid image format')
      );

      const base64 = Buffer.from('invalid image').toString('base64');

      await expect(service.extractImageMetadata(base64)).rejects.toThrow(
        'Invalid image format'
      );
    });
  });

  describe('generateThumbnail', () => {
    it('should produce a base64 string', async () => {
      const service = await importService();
      mocks.mockSharpInstance.toBuffer.mockResolvedValue(
        Buffer.from('thumbnail-bytes')
      );

      const base64 = Buffer.from('image content').toString('base64');
      const thumbnail = await service.generateThumbnail(base64);

      expect(typeof thumbnail).toBe('string');
      expect(thumbnail.length).toBeGreaterThan(0);
    });

    it('should use default 300px target size', async () => {
      const service = await importService();
      mocks.mockSharpInstance.toBuffer.mockResolvedValue(
        Buffer.from('thumb')
      );

      const base64 = Buffer.from('image').toString('base64');
      await service.generateThumbnail(base64);

      expect(mocks.mockSharpInstance.resize).toHaveBeenCalledWith(300, 300, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    });

    it('should accept custom target size', async () => {
      const service = await importService();
      mocks.mockSharpInstance.toBuffer.mockResolvedValue(
        Buffer.from('thumb')
      );

      const base64 = Buffer.from('image').toString('base64');
      await service.generateThumbnail(base64, 500);

      expect(mocks.mockSharpInstance.resize).toHaveBeenCalledWith(500, 500, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    });
  });

  describe('extractFontMetadata', () => {
    it('should return correct font info', async () => {
      const service = await importService();

      const base64 = Buffer.from('fake font').toString('base64');
      const metadata = await service.extractFontMetadata(base64, 'Arial.ttf');

      expect(metadata).toHaveProperty('familyName');
      expect(metadata).toHaveProperty('format');
      expect(typeof metadata.familyName).toBe('string');
      expect(typeof metadata.format).toBe('string');
    });

    it('should handle font extraction errors', async () => {
      const service = await importService();

      const base64 = Buffer.from('invalid font').toString('base64');

      // Font extraction should either succeed with defaults or throw
      const metadata = await service.extractFontMetadata(base64, 'font.ttf');
      expect(metadata).toBeDefined();
    });
  });

  describe('singleton behavior', () => {
    it('should return same instance from getFileProcessingService()', async () => {
      const service1 = await importService();
      const service2 = await importService();

      expect(service1).toBe(service2);
    });
  });
});
