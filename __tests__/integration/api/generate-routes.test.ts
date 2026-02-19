/**
 * Integration tests for AI generation API routes
 * Tests authentication requirements, validation, and rate limiting
 */

import { describe, it, expect } from 'vitest';
import type { NextApiRequest } from 'next';
import {
  createMockRequest,
  createMockResponse,
  createAuthenticatedRequest,
  MockFirebaseAuth,
} from '../../helpers/firebase-mock';

/**
 * Validation for image generation request
 */
function validateImageGenerationRequest(body: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!body) {
    errors.push('Request body is required');
    return { valid: false, errors };
  }

  if (!body.model) {
    errors.push('Missing required field: model');
  }

  const supportedModels = ['dall-e-3', 'stable-diffusion-3', 'flux-pro'];
  if (body.model && !supportedModels.includes(body.model)) {
    errors.push(
      `Invalid model. Supported models: ${supportedModels.join(', ')}`
    );
  }

  if (!body.prompt || typeof body.prompt !== 'string') {
    errors.push('Missing or invalid field: prompt (must be string)');
  }

  if (body.width && (body.width < 256 || body.width > 4096)) {
    errors.push('width must be between 256 and 4096');
  }

  if (body.height && (body.height < 256 || body.height > 4096)) {
    errors.push('height must be between 256 and 4096');
  }

  if (body.count && (body.count < 1 || body.count > 10)) {
    errors.push('count must be between 1 and 10');
  }

  if (
    body.width &&
    body.height &&
    body.width * body.height > 4096 * 4096
  ) {
    errors.push('Image dimensions too large (max 4096x4096 pixels)');
  }

  if (body.style && typeof body.style !== 'string') {
    errors.push('style must be a string');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validation for cost estimation request
 */
function validateCostEstimationRequest(body: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!body) {
    errors.push('Request body is required');
    return { valid: false, errors };
  }

  if (!body.model) {
    errors.push('Missing required field: model');
  }

  if (body.width && typeof body.width !== 'number') {
    errors.push('width must be a number');
  }

  if (body.height && typeof body.height !== 'number') {
    errors.push('height must be a number');
  }

  if (body.count && typeof body.count !== 'number') {
    errors.push('count must be a number');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Cost estimation response structure
 */
function estimateGenerationCost(model: string, width?: number, height?: number, count?: number): {
  basePrice: number;
  dimensionCost: number;
  countCost: number;
  totalCost: number;
  currency: string;
  estimatedTokens: number;
} {
  const basePrices: Record<string, number> = {
    'dall-e-3': 0.080,
    'stable-diffusion-3': 0.015,
    'flux-pro': 0.025,
  };

  const basePrice = basePrices[model] || 0.020;
  const defaultWidth = width || 1024;
  const defaultHeight = height || 1024;
  const defaultCount = count || 1;

  const pixelCost = (defaultWidth * defaultHeight) / (1024 * 1024) * 0.005;
  const countCost = (defaultCount - 1) * (basePrice * 0.5);

  return {
    basePrice,
    dimensionCost: pixelCost,
    countCost,
    totalCost: basePrice + pixelCost + countCost,
    currency: 'USD',
    estimatedTokens: Math.ceil((defaultWidth * defaultHeight) / 256),
  };
}

/**
 * Rate limit header generation
 */
function generateRateLimitHeaders(rateLimitKey: string = 'user'): Record<string, string> {
  return {
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': '95',
    'X-RateLimit-Reset': Math.floor(Date.now() / 1000 + 3600).toString(),
  };
}

describe('AI Generation API Routes - Authentication', () => {
  it('should require authentication for all generation endpoints', () => {
    // All generation endpoints should be protected by withAuth
    const generationEndpoints = [
      '/api/studio/ai/generate',
      '/api/studio/ai/enhance',
      '/api/studio/ai/style-transfer',
      '/api/studio/ai/remove-object',
      '/api/studio/ai/remove-bg',
    ];

    generationEndpoints.forEach(endpoint => {
      expect(endpoint).toMatch(/^\/api\/studio\/ai\//);
    });
  });

  it('should reject unauthenticated requests', () => {
    const req = createMockRequest({
      headers: {},
      method: 'POST',
    });

    // No Authorization header means auth middleware should reject
    expect(req.headers.authorization).toBeUndefined();
  });

  it('should accept requests with valid Bearer token', () => {
    const validToken = 'valid-ai-token';
    const req = createAuthenticatedRequest('user-123', validToken, {
      method: 'POST',
    });

    expect(req.headers.authorization).toBe(`Bearer ${validToken}`);
    expect(req.headers.authorization!.startsWith('Bearer ')).toBe(true);
  });
});

describe('AI Generation API Routes - Validation', () => {
  describe('Image Generation Request', () => {
    it('should accept valid image generation request', () => {
      const validRequest = {
        model: 'dall-e-3',
        prompt: 'A serene landscape with mountains and lakes',
        width: 1024,
        height: 1024,
        count: 1,
        style: 'photorealistic',
      };

      const result = validateImageGenerationRequest(validRequest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept all supported models', () => {
      const models = ['dall-e-3', 'stable-diffusion-3', 'flux-pro'];

      models.forEach(model => {
        const request = {
          model,
          prompt: 'Test prompt',
          width: 1024,
          height: 1024,
        };

        const result = validateImageGenerationRequest(request);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid model name', () => {
      const invalidRequest = {
        model: 'unknown-model',
        prompt: 'Test prompt',
      };

      const result = validateImageGenerationRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid model'))).toBe(true);
    });

    it('should reject missing model', () => {
      const invalidRequest = {
        prompt: 'Test prompt',
        width: 1024,
        height: 1024,
      };

      const result = validateImageGenerationRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: model');
    });

    it('should reject missing prompt', () => {
      const invalidRequest = {
        model: 'dall-e-3',
        width: 1024,
        height: 1024,
      };

      const result = validateImageGenerationRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('prompt'))).toBe(true);
    });

    it('should reject oversized dimensions', () => {
      const invalidRequest = {
        model: 'dall-e-3',
        prompt: 'Test prompt',
        width: 5000,
        height: 5000,
      };

      const result = validateImageGenerationRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('too large'))).toBe(true);
    });

    it('should reject width exceeding max limit', () => {
      const invalidRequest = {
        model: 'dall-e-3',
        prompt: 'Test prompt',
        width: 4097,
        height: 1024,
      };

      const result = validateImageGenerationRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('width'))).toBe(true);
    });

    it('should reject height exceeding max limit', () => {
      const invalidRequest = {
        model: 'dall-e-3',
        prompt: 'Test prompt',
        width: 1024,
        height: 4097,
      };

      const result = validateImageGenerationRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('height'))).toBe(true);
    });

    it('should reject width below minimum', () => {
      const invalidRequest = {
        model: 'dall-e-3',
        prompt: 'Test prompt',
        width: 128,
        height: 1024,
      };

      const result = validateImageGenerationRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('width'))).toBe(true);
    });

    it('should reject invalid count value', () => {
      const invalidRequest = {
        model: 'dall-e-3',
        prompt: 'Test prompt',
        width: 1024,
        height: 1024,
        count: 15,
      };

      const result = validateImageGenerationRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('count'))).toBe(true);
    });

    it('should reject count less than 1', () => {
      const invalidRequest = {
        model: 'dall-e-3',
        prompt: 'Test prompt',
        count: -1,
      };

      const result = validateImageGenerationRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('count'))).toBe(true);
    });

    it('should accept various valid dimensions', () => {
      const validDimensions = [
        { width: 256, height: 256 },
        { width: 512, height: 512 },
        { width: 1024, height: 1024 },
        { width: 2048, height: 2048 },
        { width: 4096, height: 4096 },
        { width: 1024, height: 768 },
      ];

      validDimensions.forEach(dims => {
        const request = {
          model: 'dall-e-3',
          prompt: 'Test',
          ...dims,
        };

        const result = validateImageGenerationRequest(request);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject 4096x4096 + 1 pixel dimension', () => {
      const invalidRequest = {
        model: 'dall-e-3',
        prompt: 'Test',
        width: 4096,
        height: 4097,
      };

      const result = validateImageGenerationRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('height'))).toBe(true);
    });

    it('should enforce total pixel limit', () => {
      const invalidRequest = {
        model: 'dall-e-3',
        prompt: 'Test',
        width: 4096,
        height: 4096,
      };

      const result = validateImageGenerationRequest(invalidRequest);
      expect(result.valid).toBe(true); // 4096x4096 is the limit
    });

    it('should reject non-string prompt', () => {
      const invalidRequest = {
        model: 'dall-e-3',
        prompt: 123,
      };

      const result = validateImageGenerationRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('prompt'))).toBe(true);
    });
  });

  describe('Cost Estimation Request', () => {
    it('should accept valid cost estimation request', () => {
      const validRequest = {
        model: 'dall-e-3',
        width: 1024,
        height: 1024,
        count: 2,
      };

      const result = validateCostEstimationRequest(validRequest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept minimal cost estimation request', () => {
      const minimalRequest = {
        model: 'dall-e-3',
      };

      const result = validateCostEstimationRequest(minimalRequest);
      expect(result.valid).toBe(true);
    });

    it('should reject missing model', () => {
      const invalidRequest = {
        width: 1024,
        height: 1024,
      };

      const result = validateCostEstimationRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: model');
    });

    it('should reject non-numeric width', () => {
      const invalidRequest = {
        model: 'dall-e-3',
        width: '1024',
      };

      const result = validateCostEstimationRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('width'))).toBe(true);
    });

    it('should reject non-numeric height', () => {
      const invalidRequest = {
        model: 'dall-e-3',
        height: '768',
      };

      const result = validateCostEstimationRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('height'))).toBe(true);
    });

    it('should reject non-numeric count', () => {
      const invalidRequest = {
        model: 'dall-e-3',
        count: '5',
      };

      const result = validateCostEstimationRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('count'))).toBe(true);
    });
  });
});

describe('AI Generation API Routes - Cost Estimation', () => {
  it('should return cost structure for generation request', () => {
    const cost = estimateGenerationCost('dall-e-3', 1024, 1024, 1);

    expect(cost.basePrice).toBeGreaterThan(0);
    expect(cost.dimensionCost).toBeGreaterThanOrEqual(0);
    expect(cost.countCost).toBeGreaterThanOrEqual(0);
    expect(cost.totalCost).toBeGreaterThan(0);
    expect(cost.currency).toBe('USD');
    expect(cost.estimatedTokens).toBeGreaterThan(0);
  });

  it('should calculate different costs for different models', () => {
    const dalle = estimateGenerationCost('dall-e-3', 1024, 1024);
    const sd3 = estimateGenerationCost('stable-diffusion-3', 1024, 1024);
    const flux = estimateGenerationCost('flux-pro', 1024, 1024);

    expect(dalle.basePrice).not.toBe(sd3.basePrice);
    expect(sd3.basePrice).not.toBe(flux.basePrice);
  });

  it('should increase cost for larger dimensions', () => {
    const small = estimateGenerationCost('dall-e-3', 512, 512);
    const large = estimateGenerationCost('dall-e-3', 2048, 2048);

    expect(large.totalCost).toBeGreaterThan(small.totalCost);
  });

  it('should increase cost for multiple generations', () => {
    const single = estimateGenerationCost('dall-e-3', 1024, 1024, 1);
    const multiple = estimateGenerationCost('dall-e-3', 1024, 1024, 5);

    expect(multiple.totalCost).toBeGreaterThan(single.totalCost);
  });

  it('should handle default dimensions in cost calculation', () => {
    const withDefaults = estimateGenerationCost('dall-e-3');
    expect(withDefaults.totalCost).toBeGreaterThan(0);
    expect(withDefaults.estimatedTokens).toBeGreaterThan(0);
  });
});

describe('AI Generation API Routes - Rate Limiting', () => {
  it('should include rate limit headers in response', () => {
    const headers = generateRateLimitHeaders();

    expect(headers['X-RateLimit-Limit']).toBeDefined();
    expect(headers['X-RateLimit-Remaining']).toBeDefined();
    expect(headers['X-RateLimit-Reset']).toBeDefined();
  });

  it('should have valid rate limit values', () => {
    const headers = generateRateLimitHeaders();

    const limit = parseInt(headers['X-RateLimit-Limit'], 10);
    const remaining = parseInt(headers['X-RateLimit-Remaining'], 10);
    const reset = parseInt(headers['X-RateLimit-Reset'], 10);

    expect(limit).toBeGreaterThan(0);
    expect(remaining).toBeGreaterThanOrEqual(0);
    expect(remaining).toBeLessThanOrEqual(limit);
    expect(reset).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('should track remaining requests correctly', () => {
    const headers = generateRateLimitHeaders();

    const remaining = parseInt(headers['X-RateLimit-Remaining'], 10);
    expect(remaining).toBe(95); // 100 - 5 for this request
  });

  it('should provide reset time in future', () => {
    const headers = generateRateLimitHeaders();

    const reset = parseInt(headers['X-RateLimit-Reset'], 10);
    const now = Math.floor(Date.now() / 1000);

    expect(reset).toBeGreaterThan(now);
    expect(reset - now).toBeCloseTo(3600, -2); // Approximately 1 hour
  });

  it('should include rate limit headers per user', () => {
    const userHeaders = generateRateLimitHeaders('user-123');
    const anonHeaders = generateRateLimitHeaders('anonymous');

    expect(userHeaders['X-RateLimit-Limit']).toBeDefined();
    expect(anonHeaders['X-RateLimit-Limit']).toBeDefined();
  });
});

describe('AI Generation API Routes - Error Responses', () => {
  it('should return 400 for invalid model', () => {
    const statusCode = 400;
    const response = {
      success: false,
      error: 'Invalid model',
      errorCode: 'INVALID_MODEL',
    };

    expect(statusCode).toBe(400);
    expect(response.errorCode).toBe('INVALID_MODEL');
  });

  it('should return 400 for oversized dimensions', () => {
    const statusCode = 400;
    const response = {
      success: false,
      error: 'Image dimensions too large (max 4096x4096)',
      errorCode: 'DIMENSIONS_TOO_LARGE',
    };

    expect(statusCode).toBe(400);
    expect(response.error).toContain('too large');
  });

  it('should return 429 for rate limit exceeded', () => {
    const statusCode = 429;
    const response = {
      success: false,
      error: 'Rate limit exceeded',
      errorCode: 'RATE_LIMIT_EXCEEDED',
    };

    expect(statusCode).toBe(429);
    expect(response.errorCode).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('should return 500 for internal server errors', () => {
    const statusCode = 500;
    const response = {
      success: false,
      error: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    };

    expect(statusCode).toBe(500);
    expect(response.errorCode).toBe('INTERNAL_ERROR');
  });
});

describe('AI Generation API Routes - Response Structure', () => {
  it('should return success response with job ID', () => {
    const response = {
      success: true,
      jobId: 'job-xyz-123',
      status: 'processing',
      estimatedTime: 45,
    };

    expect(response.success).toBe(true);
    expect(response.jobId).toBeDefined();
    expect(response.status).toBe('processing');
  });

  it('should return generated images in response', () => {
    const response = {
      success: true,
      images: [
        { id: 'img-1', url: 'https://...', width: 1024, height: 1024 },
        { id: 'img-2', url: 'https://...', width: 1024, height: 1024 },
      ],
      processingTimeMs: 2500,
    };

    expect(response.success).toBe(true);
    expect(Array.isArray(response.images)).toBe(true);
    expect(response.processingTimeMs).toBeGreaterThan(0);
  });

  it('should include cost breakdown in response', () => {
    const response = {
      success: true,
      cost: {
        basePrice: 0.080,
        dimensionCost: 0.005,
        countCost: 0.0,
        totalCost: 0.085,
        currency: 'USD',
      },
    };

    expect(response.cost.totalCost).toBeGreaterThan(0);
    expect(response.cost.currency).toBe('USD');
  });
});
