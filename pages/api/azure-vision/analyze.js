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
  endpoint: 'azure_vision',
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
    validateBody(req, ['imageUrl'], logger);
    
    const { imageUrl, analysisType } = req.body;
    
    logger.info('Analyzing image with Azure Vision', {
      component: 'azure-vision',
      operation: 'analyze-image',
      analysisType: analysisType || 'full',
    });

    let result;

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
    
    return res.status(response.statusCode).json(response.body);
  });
} 