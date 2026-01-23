/**
 * Cloud Vision API - Image Analysis
 * 
 * POST /api/vision/analyze
 * 
 * Analyzes images using Google Cloud Vision API.
 * Supports text detection, document text, labels, faces, objects, and full analysis.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { analyzeImageFromBase64, detectText, detectDocumentText, detectLabels, detectFaces, detectObjects } from '../../../lib/cloudVision';
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

export type AnalysisType = 'text' | 'document' | 'labels' | 'faces' | 'objects' | 'full';

export interface VisionAnalyzeRequest {
  imageData: string;
  imageType?: string;
  analysisType?: AnalysisType;
}

export interface VisionAnalyzeResponse {
  success: boolean;
  result: unknown;
  analysisType: AnalysisType;
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
  endpoint: 'cloud_vision',
});

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VisionAnalyzeResponse>
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
    validateBody(req, ['imageData'], logger);
    
    const { imageData, imageType, analysisType = 'full' } = req.body as VisionAnalyzeRequest;
    
    logger.info('Analyzing image with Cloud Vision', {
      component: 'cloud-vision',
      operation: 'analyze-image',
      analysisType: analysisType || 'full',
    });

    let result: unknown;

    switch (analysisType) {
      case 'text':
        // For text detection, we need to handle base64 data
        if (imageData.startsWith('data:')) {
          // Handle data URL
          const base64Data = imageData.split(',')[1];
          const mimeType = imageData.split(';')[0].split(':')[1];
          const analysisResult = await analyzeImageFromBase64(base64Data, mimeType);
          result = (analysisResult as { text?: unknown }).text || [];
        } else {
          // Handle file path (for server-side files)
          result = await detectText(imageData);
        }
        break;

      case 'document':
        if (imageData.startsWith('data:')) {
          const base64Data = imageData.split(',')[1];
          const mimeType = imageData.split(';')[0].split(':')[1];
          const analysisResult = await analyzeImageFromBase64(base64Data, mimeType);
          result = (analysisResult as { text?: unknown }).text || [];
        } else {
          result = await detectDocumentText(imageData);
        }
        break;

      case 'labels':
        if (imageData.startsWith('data:')) {
          const base64Data = imageData.split(',')[1];
          const mimeType = imageData.split(';')[0].split(':')[1];
          const analysisResult = await analyzeImageFromBase64(base64Data, mimeType);
          result = (analysisResult as { labels?: unknown }).labels || [];
        } else {
          result = await detectLabels(imageData);
        }
        break;

      case 'faces':
        if (imageData.startsWith('data:')) {
          const base64Data = imageData.split(',')[1];
          const mimeType = imageData.split(';')[0].split(':')[1];
          const analysisResult = await analyzeImageFromBase64(base64Data, mimeType);
          result = (analysisResult as { faces?: unknown }).faces || [];
        } else {
          result = await detectFaces(imageData);
        }
        break;

      case 'objects':
        if (imageData.startsWith('data:')) {
          const base64Data = imageData.split(',')[1];
          const mimeType = imageData.split(';')[0].split(':')[1];
          const analysisResult = await analyzeImageFromBase64(base64Data, mimeType);
          result = (analysisResult as { objects?: unknown }).objects || [];
        } else {
          result = await detectObjects(imageData);
        }
        break;

      case 'full':
      default:
        // Full analysis
        if (imageData.startsWith('data:')) {
          const base64Data = imageData.split(',')[1];
          const mimeType = imageData.split(';')[0].split(':')[1];
          result = await analyzeImageFromBase64(base64Data, mimeType);
        } else {
          // For file paths, we'll do individual calls
          const [textResult, labelsResult, facesResult, objectsResult] = await Promise.all([
            detectText(imageData),
            detectLabels(imageData),
            detectFaces(imageData),
            detectObjects(imageData)
          ]);
          
          result = {
            text: textResult,
            labels: labelsResult,
            faces: facesResult,
            objects: objectsResult
          };
        }
        break;
    }

    const response = createSuccessResponse({
      success: true,
      result,
      analysisType: analysisType || 'full',
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body.data as VisionAnalyzeResponse);
  });
}
