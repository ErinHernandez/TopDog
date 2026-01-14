import { analyzeImageFromBase64, detectText, detectDocumentText, detectLabels, detectFaces, detectObjects } from '../../../lib/cloudVision';
import { RateLimiter } from '../../../lib/rateLimiter';
import { logger } from '../../../lib/structuredLogger';
import { 
  withErrorHandling, 
  validateMethod, 
  validateBody,
  createErrorResponse,
  createSuccessResponse,
  ErrorType 
} from '../../../lib/apiErrorHandler.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Increase limit for image uploads
    },
  },
};

// Rate limiter for vision API (10 per minute - these cost money)
const rateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000,
  endpoint: 'cloud_vision',
});

export default async function handler(req, res) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['POST'], logger);
    
    // Rate limiting
    const rateLimitResult = await rateLimiter.check(req);
    if (!rateLimitResult.allowed) {
      const errorResponse = createErrorResponse(
        ErrorType.RATE_LIMIT,
        'Too many requests',
        { retryAfter: Math.ceil(rateLimitResult.retryAfterMs / 1000) },
        res.getHeader('X-Request-ID')
      );
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.body.message,
        retryAfter: Math.ceil(rateLimitResult.retryAfterMs / 1000),
      });
    }
    
    // Validate required body fields
    validateBody(req, ['imageData'], logger);
    
    const { imageData, imageType, analysisType } = req.body;
    
    logger.info('Analyzing image with Cloud Vision', {
      component: 'cloud-vision',
      operation: 'analyze-image',
      analysisType: analysisType || 'full',
    });

    let result;

    switch (analysisType) {
      case 'text':
        // For text detection, we need to handle base64 data
        if (imageData.startsWith('data:')) {
          // Handle data URL
          const base64Data = imageData.split(',')[1];
          const mimeType = imageData.split(';')[0].split(':')[1];
          result = await analyzeImageFromBase64(base64Data, mimeType);
          result = result.text || [];
        } else {
          // Handle file path (for server-side files)
          result = await detectText(imageData);
        }
        break;

      case 'document':
        if (imageData.startsWith('data:')) {
          const base64Data = imageData.split(',')[1];
          const mimeType = imageData.split(';')[0].split(':')[1];
          result = await analyzeImageFromBase64(base64Data, mimeType);
          result = result.text || [];
        } else {
          result = await detectDocumentText(imageData);
        }
        break;

      case 'labels':
        if (imageData.startsWith('data:')) {
          const base64Data = imageData.split(',')[1];
          const mimeType = imageData.split(';')[0].split(':')[1];
          result = await analyzeImageFromBase64(base64Data, mimeType);
          result = result.labels || [];
        } else {
          result = await detectLabels(imageData);
        }
        break;

      case 'faces':
        if (imageData.startsWith('data:')) {
          const base64Data = imageData.split(',')[1];
          const mimeType = imageData.split(';')[0].split(':')[1];
          result = await analyzeImageFromBase64(base64Data, mimeType);
          result = result.faces || [];
        } else {
          result = await detectFaces(imageData);
        }
        break;

      case 'objects':
        if (imageData.startsWith('data:')) {
          const base64Data = imageData.split(',')[1];
          const mimeType = imageData.split(';')[0].split(':')[1];
          result = await analyzeImageFromBase64(base64Data, mimeType);
          result = result.objects || [];
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
    
    return res.status(response.statusCode).json(response.body);
  });
} 