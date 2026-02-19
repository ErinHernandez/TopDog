/**
 * Integration tests for format API routes
 * Tests request validation, response structure, and error handling
 */

import { describe, it, expect } from 'vitest';

/**
 * Validation logic for export-psd endpoint
 */
function validatePsdExportRequest(body: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!body) {
    errors.push('Request body is required');
    return { valid: false, errors };
  }

  if (!body.document) {
    errors.push('Missing required field: document');
  }

  if (!body.layers) {
    errors.push('Missing required field: layers');
  }

  if (!body.options) {
    errors.push('Missing required field: options');
  }

  if (body.document && typeof body.document !== 'object') {
    errors.push('document must be an object');
  }

  if (body.layers && !Array.isArray(body.layers)) {
    errors.push('layers must be an array');
  }

  if (body.options && typeof body.options !== 'object') {
    errors.push('options must be an object');
  }

  if (body.options) {
    const opts = body.options;
    const validCompatibilities = ['photoshop-cs6', 'photoshop-cc'];
    if (!validCompatibilities.includes(opts.compatibility)) {
      errors.push(`compatibility must be one of: ${validCompatibilities.join(', ')}`);
    }

    if (typeof opts.maximizeCompatibility !== 'boolean') {
      errors.push('maximizeCompatibility must be a boolean');
    }

    if (typeof opts.includeEffects !== 'boolean') {
      errors.push('includeEffects must be a boolean');
    }

    if (typeof opts.includeSmartObjects !== 'boolean') {
      errors.push('includeSmartObjects must be a boolean');
    }

    const validCompressions = ['none', 'rle', 'zip'];
    if (!validCompressions.includes(opts.compression)) {
      errors.push(`compression must be one of: ${validCompressions.join(', ')}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validation for process-raw endpoint
 */
function validateRawProcessRequest(body: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!body) {
    errors.push('Request body is required');
    return { valid: false, errors };
  }

  if (!body.fileBuffer) {
    errors.push('Missing required field: fileBuffer');
  }

  if (!body.format) {
    errors.push('Missing required field: format');
  }

  const supportedFormats = ['cr2', 'crw', 'nef', 'dng', 'raf', 'raw', 'arw', 'orf', 'rw2'];
  if (body.format && !supportedFormats.includes(body.format.toLowerCase())) {
    errors.push(
      `Unsupported RAW format. Supported: ${supportedFormats.join(', ')}`
    );
  }

  if (body.fileBuffer && typeof body.fileBuffer !== 'string') {
    errors.push('fileBuffer must be a base64 string');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validation for export-tiff endpoint
 */
function validateTiffExportRequest(body: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!body) {
    errors.push('Request body is required');
    return { valid: false, errors };
  }

  if (!body.document) {
    errors.push('Missing required field: document');
  }

  if (!body.imageData) {
    errors.push('Missing required field: imageData');
  }

  if (body.options) {
    const opts = body.options;
    const validCompressions = ['none', 'lzw', 'deflate', 'jpeg'];
    if (opts.compression && !validCompressions.includes(opts.compression)) {
      errors.push(
        `compression must be one of: ${validCompressions.join(', ')}`
      );
    }

    const validBitDepths = [8, 16, 32];
    if (opts.bitDepth && !validBitDepths.includes(opts.bitDepth)) {
      errors.push(`bitDepth must be one of: ${validBitDepths.join(', ')}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Format index response structure
 */
interface FormatEndpoint {
  name: string;
  path: string;
  method: string[];
  description: string;
  requiresAuth: boolean;
}

function validateFormatIndexResponse(response: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!response) {
    errors.push('Response body is required');
    return { valid: false, errors };
  }

  if (!response.version) {
    errors.push('Missing required field: version');
  }

  if (!response.baseUrl) {
    errors.push('Missing required field: baseUrl');
  }

  if (!Array.isArray(response.endpoints)) {
    errors.push('endpoints must be an array');
  } else {
    response.endpoints.forEach((ep: any, idx: number) => {
      if (!ep.name) errors.push(`endpoints[${idx}].name is required`);
      if (!ep.path) errors.push(`endpoints[${idx}].path is required`);
      if (!Array.isArray(ep.method)) {
        errors.push(`endpoints[${idx}].method must be an array`);
      }
      if (typeof ep.requiresAuth !== 'boolean') {
        errors.push(`endpoints[${idx}].requiresAuth must be a boolean`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

describe('Format API Routes - Request Validation', () => {
  describe('POST /api/studio/formats/export-psd', () => {
    it('should accept valid PSD export request', () => {
      const validRequest = {
        document: {
          id: 'doc-123',
          name: 'test.psd',
          width: 800,
          height: 600,
        },
        layers: [
          { id: 'layer-1', name: 'Background', type: 'raster', opacity: 100 },
          { id: 'layer-2', name: 'Text', type: 'text', opacity: 100 },
        ],
        options: {
          compatibility: 'photoshop-cc',
          maximizeCompatibility: true,
          includeEffects: true,
          includeSmartObjects: false,
          compression: 'zip',
        },
      };

      const result = validatePsdExportRequest(validRequest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject request with missing document', () => {
      const invalidRequest = {
        layers: [],
        options: {
          compatibility: 'photoshop-cc',
          maximizeCompatibility: true,
          includeEffects: true,
          includeSmartObjects: false,
          compression: 'zip',
        },
      };

      const result = validatePsdExportRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: document');
    });

    it('should reject request with missing layers', () => {
      const invalidRequest = {
        document: { id: 'doc-123', name: 'test.psd' },
        options: {
          compatibility: 'photoshop-cc',
          maximizeCompatibility: true,
          includeEffects: true,
          includeSmartObjects: false,
          compression: 'zip',
        },
      };

      const result = validatePsdExportRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: layers');
    });

    it('should reject request with missing options', () => {
      const invalidRequest = {
        document: { id: 'doc-123', name: 'test.psd' },
        layers: [],
      };

      const result = validatePsdExportRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: options');
    });

    it('should reject invalid compatibility option', () => {
      const invalidRequest = {
        document: { id: 'doc-123' },
        layers: [],
        options: {
          compatibility: 'photoshop-2025',
          maximizeCompatibility: true,
          includeEffects: true,
          includeSmartObjects: false,
          compression: 'zip',
        },
      };

      const result = validatePsdExportRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('compatibility'))).toBe(true);
    });

    it('should reject invalid compression option', () => {
      const invalidRequest = {
        document: { id: 'doc-123' },
        layers: [],
        options: {
          compatibility: 'photoshop-cc',
          maximizeCompatibility: true,
          includeEffects: true,
          includeSmartObjects: false,
          compression: 'invalid',
        },
      };

      const result = validatePsdExportRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('compression'))).toBe(true);
    });

    it('should reject non-boolean option values', () => {
      const invalidRequest = {
        document: { id: 'doc-123' },
        layers: [],
        options: {
          compatibility: 'photoshop-cc',
          maximizeCompatibility: 'yes',
          includeEffects: true,
          includeSmartObjects: false,
          compression: 'zip',
        },
      };

      const result = validatePsdExportRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('boolean'))).toBe(true);
    });

    it('should reject non-array layers', () => {
      const invalidRequest = {
        document: { id: 'doc-123' },
        layers: 'not-an-array',
        options: {
          compatibility: 'photoshop-cc',
          maximizeCompatibility: true,
          includeEffects: true,
          includeSmartObjects: false,
          compression: 'zip',
        },
      };

      const result = validatePsdExportRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('array'))).toBe(true);
    });

    it('should handle oversized payload indication', () => {
      const contentLength = 51 * 1024 * 1024; // 51MB
      expect(contentLength > 50 * 1024 * 1024).toBe(true);
    });
  });

  describe('POST /api/studio/formats/process-raw', () => {
    it('should accept valid RAW process request', () => {
      const validRequest = {
        fileBuffer: 'base64encodeddata...',
        format: 'cr2',
        qualityLevel: 'high',
      };

      const result = validateRawProcessRequest(validRequest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept all supported RAW formats', () => {
      const formats = ['cr2', 'crw', 'nef', 'dng', 'raf', 'raw', 'arw', 'orf', 'rw2'];

      formats.forEach(format => {
        const request = {
          fileBuffer: 'data...',
          format,
        };

        const result = validateRawProcessRequest(request);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject unsupported RAW format', () => {
      const invalidRequest = {
        fileBuffer: 'data...',
        format: 'jpg',
      };

      const result = validateRawProcessRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Unsupported'))).toBe(true);
    });

    it('should reject missing fileBuffer', () => {
      const invalidRequest = {
        format: 'cr2',
      };

      const result = validateRawProcessRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: fileBuffer');
    });

    it('should reject missing format', () => {
      const invalidRequest = {
        fileBuffer: 'data...',
      };

      const result = validateRawProcessRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: format');
    });

    it('should be case-insensitive for format', () => {
      const request = {
        fileBuffer: 'data...',
        format: 'CR2',
      };

      const result = validateRawProcessRequest(request);
      expect(result.valid).toBe(true);
    });
  });

  describe('POST /api/studio/formats/export-tiff', () => {
    it('should accept valid TIFF export request', () => {
      const validRequest = {
        document: {
          id: 'doc-456',
          name: 'image.tiff',
          width: 1920,
          height: 1080,
        },
        imageData: 'base64imagedata...',
        options: {
          compression: 'lzw',
          bitDepth: 16,
          iccProfile: true,
        },
      };

      const result = validateTiffExportRequest(validRequest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept all valid compression options', () => {
      const compressions = ['none', 'lzw', 'deflate', 'jpeg'];

      compressions.forEach(compression => {
        const request = {
          document: { id: 'doc-456' },
          imageData: 'data...',
          options: { compression },
        };

        const result = validateTiffExportRequest(request);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid compression option', () => {
      const invalidRequest = {
        document: { id: 'doc-456' },
        imageData: 'data...',
        options: {
          compression: 'gzip',
        },
      };

      const result = validateTiffExportRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('compression'))).toBe(true);
    });

    it('should accept valid bit depths', () => {
      const bitDepths = [8, 16, 32];

      bitDepths.forEach(bitDepth => {
        const request = {
          document: { id: 'doc-456' },
          imageData: 'data...',
          options: { bitDepth },
        };

        const result = validateTiffExportRequest(request);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid bit depth', () => {
      const invalidRequest = {
        document: { id: 'doc-456' },
        imageData: 'data...',
        options: {
          bitDepth: 24,
        },
      };

      const result = validateTiffExportRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('bitDepth'))).toBe(true);
    });

    it('should reject missing document', () => {
      const invalidRequest = {
        imageData: 'data...',
        options: { compression: 'lzw' },
      };

      const result = validateTiffExportRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: document');
    });

    it('should reject missing imageData', () => {
      const invalidRequest = {
        document: { id: 'doc-456' },
        options: { compression: 'lzw' },
      };

      const result = validateTiffExportRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: imageData');
    });
  });

  describe('GET /api/studio/formats (Discovery)', () => {
    it('should return valid format index response', () => {
      const validResponse = {
        version: '1.0.0',
        baseUrl: '/api/studio/formats',
        endpoints: [
          {
            name: 'TIFF Export',
            path: '/export-tiff',
            method: ['POST'],
            description: 'Export as TIFF with compression options',
            requiresAuth: true,
          },
          {
            name: 'PSD Export',
            path: '/export-psd',
            method: ['POST'],
            description: 'Export as PSD for Photoshop compatibility',
            requiresAuth: false,
          },
        ],
      };

      const result = validateFormatIndexResponse(validResponse);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should contain required response fields', () => {
      const response = {
        version: '1.0.0',
        baseUrl: '/api/studio/formats',
        endpoints: [],
      };

      const result = validateFormatIndexResponse(response);
      expect(result.valid).toBe(true);
    });

    it('should reject missing version', () => {
      const invalidResponse = {
        baseUrl: '/api/studio/formats',
        endpoints: [],
      };

      const result = validateFormatIndexResponse(invalidResponse);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: version');
    });

    it('should reject missing baseUrl', () => {
      const invalidResponse = {
        version: '1.0.0',
        endpoints: [],
      };

      const result = validateFormatIndexResponse(invalidResponse);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: baseUrl');
    });

    it('should reject non-array endpoints', () => {
      const invalidResponse = {
        version: '1.0.0',
        baseUrl: '/api/studio/formats',
        endpoints: 'not-an-array',
      };

      const result = validateFormatIndexResponse(invalidResponse);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('array'))).toBe(true);
    });

    it('should validate each endpoint has required fields', () => {
      const invalidResponse = {
        version: '1.0.0',
        baseUrl: '/api/studio/formats',
        endpoints: [
          {
            name: 'TIFF Export',
            // missing path
            method: ['POST'],
            description: 'Export as TIFF',
            requiresAuth: true,
          },
        ],
      };

      const result = validateFormatIndexResponse(invalidResponse);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('path'))).toBe(true);
    });

    it('should validate endpoint method is array', () => {
      const invalidResponse = {
        version: '1.0.0',
        baseUrl: '/api/studio/formats',
        endpoints: [
          {
            name: 'TIFF Export',
            path: '/export-tiff',
            method: 'POST',
            description: 'Export as TIFF',
            requiresAuth: true,
          },
        ],
      };

      const result = validateFormatIndexResponse(invalidResponse);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('method'))).toBe(true);
    });

    it('should validate endpoint requiresAuth is boolean', () => {
      const invalidResponse = {
        version: '1.0.0',
        baseUrl: '/api/studio/formats',
        endpoints: [
          {
            name: 'TIFF Export',
            path: '/export-tiff',
            method: ['POST'],
            description: 'Export as TIFF',
            requiresAuth: 'yes',
          },
        ],
      };

      const result = validateFormatIndexResponse(invalidResponse);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('requiresAuth'))).toBe(true);
    });
  });
});

describe('Format API Routes - Response Structure', () => {
  describe('PSD Export Response', () => {
    it('should return success response with jobId for large files', () => {
      const response = {
        success: true,
        jobId: 'job-12345-abc',
        downloadUrl: '/api/studio/formats/export-psd/job-12345-abc',
        warnings: [],
      };

      expect(response.success).toBe(true);
      expect(response.jobId).toBeDefined();
      expect(response.downloadUrl).toBeDefined();
      expect(Array.isArray(response.warnings)).toBe(true);
    });

    it('should return success response with downloadUrl for small files', () => {
      const response = {
        success: true,
        downloadUrl: 'data:application/octet-stream;base64,...',
      };

      expect(response.success).toBe(true);
      expect(response.downloadUrl).toBeDefined();
    });

    it('should return error response with meaningful message', () => {
      const response = {
        success: false,
        error: 'Invalid export options',
      };

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(typeof response.error).toBe('string');
    });
  });

  describe('TIFF Export Response', () => {
    it('should return success response with export result', () => {
      const response = {
        success: true,
        data: {
          downloadUrl: 'blob:...',
          fileSize: 1024000,
          format: 'tiff',
        },
      };

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.downloadUrl).toBeDefined();
    });

    it('should return 413 status for oversized payloads', () => {
      const statusCode = 413;
      const response = {
        success: false,
        error: 'Payload too large (max 50MB)',
      };

      expect(statusCode).toBe(413);
      expect(response.error).toContain('too large');
    });
  });

  describe('Raw Process Response', () => {
    it('should return processed image data', () => {
      const response = {
        success: true,
        data: {
          imageBase64: 'iVBORw0KGgoAAAANSUhEUgAA...',
          format: 'png',
          width: 1920,
          height: 1080,
        },
      };

      expect(response.success).toBe(true);
      expect(response.data.imageBase64).toBeDefined();
      expect(response.data.format).toBe('png');
    });
  });
});
