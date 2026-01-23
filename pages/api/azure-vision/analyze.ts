/**
 * Azure Vision API - Image Analysis
 * 
 * POST /api/azure-vision/analyze
 * 
 * Analyzes images using Azure Computer Vision API.
 * Supports OCR, read, objects, faces, tags, description, and full analysis.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  extractTextFromImage, 
  readTextFromImage, 
  analyzeImage, 
  detectObjects, 
  detectFaces, 
  getImageTags, 
  describeImage 
} from '../../../lib/azureVision';
import { RateLimiter } from '../../../lib/rateLimiter';
import { 
  withErrorHandling, 
  validateMethod, 
  validateBody,
  createErrorResponse,
  createSuccessResponse,
  ErrorType 
} from '../../../lib/apiErrorHandler';

// ============================================================================
// TYPES
// ============================================================================

export type AzureAnalysisType = 'ocr' | 'read' | 'objects' | 'faces' | 'tags' | 'description' | 'full';

export interface AzureVisionAnalyzeRequest {
  imageUrl: string;
  analysisType?: AzureAnalysisType;
}

export interface AzureVisionAnalyzeResponse {
  success: boolean;
  result: unknown;
  analysisType: AzureAnalysisType;
  error?: string;
  retryAfter?: number;
}

// ============================================================================
// CONFIG
// ============================================================================

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Increase limit for image uploads
    },
  },
};

// ============================================================================
// RATE LIMITER
// ============================================================================

// Rate limiter for vision API (10 per minute - these cost money)
const rateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000,
  endpoint: 'azure_vision',
});

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AzureVisionAnalyzeResponse>
): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
    // Validate HTTP method
    validateMethod(req, ['POST'], logger);
    
    // Rate limiting
    const rateLimitResult = await rateLimiter.check(req);
    if (!rateLimitResult.allowed) {
      const errorResponse = createErrorResponse(
        ErrorType.RATE_LIMIT,
        'Too many requests',
        { retryAfter: Math.ceil((rateLimitResult.retryAfterMs || 60) / 1000) }
      );
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.body.error.message,
        retryAfter: Math.ceil((rateLimitResult.retryAfterMs || 60) / 1000),
        success: false,
        result: null,
        analysisType: 'full',
      });
    }
    
    // Validate required body fields
    validateBody(req, ['imageUrl'], logger);
    
    const { imageUrl, analysisType = 'full' } = req.body as AzureVisionAnalyzeRequest;
    
    logger.info('Analyzing image with Azure Vision', {
      component: 'azure-vision',
      operation: 'analyze-image',
      analysisType: analysisType || 'full',
    });

    let result: unknown;

    switch (analysisType) {
      case 'ocr':
        result = await extractTextFromImage(imageUrl);
        break;

      case 'read':
        result = await readTextFromImage(imageUrl);
        break;

      case 'objects':
        result = await detectObjects(imageUrl);
        break;

      case 'faces':
        result = await detectFaces(imageUrl);
        break;

      case 'tags':
        result = await getImageTags(imageUrl);
        break;

      case 'description':
        result = await describeImage(imageUrl);
        break;

      case 'full':
      default:
        // Full analysis
        result = await analyzeImage(imageUrl);
        break;
    }

    const response = createSuccessResponse({
      success: true,
      result,
      analysisType: analysisType || 'full',
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body.data as AzureVisionAnalyzeResponse);
  });
}
