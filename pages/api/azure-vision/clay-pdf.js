import { processPdfWithAzureVision, processMultiplePdfPages } from '../../../lib/pdfProcessor';
import { RateLimiter } from '../../../lib/rateLimiter';
import { logger } from '../../../lib/structuredLogger.js';
import { 
  withErrorHandling, 
  validateMethod,
  createErrorResponse,
  createSuccessResponse,
  ErrorType 
} from '../../../lib/apiErrorHandler.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Increase limit for PDF processing
    },
  },
};

// Rate limiter for PDF processing (5 per hour - very expensive operation)
const rateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 60 * 60 * 1000,
  endpoint: 'clay_pdf',
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
        'Too many PDF processing requests',
        { retryAfter: Math.ceil(rateLimitResult.retryAfterMs / 1000) },
        res.getHeader('X-Request-ID') as string
      );
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.body.message,
        retryAfter: Math.ceil(rateLimitResult.retryAfterMs / 1000),
      });
    }
    const { pageNumber, analysisType, processMultiple, startPage, endPage } = req.body;

    // Default to the Clay projections PDF
    const pdfPath = './clay_projections_2025.pdf';
    
    // Validate analysis type
    const validAnalysisTypes = ['ocr', 'read'];
    const finalAnalysisType = validAnalysisTypes.includes(analysisType) ? analysisType : 'read';

    let result;

    if (processMultiple && startPage && endPage) {
      // Process multiple pages
      logger.info('Processing Clay PDF pages', {
        component: 'azure-vision',
        operation: 'clay-pdf',
        startPage,
        endPage,
        analysisType: finalAnalysisType,
      });
      result = await processMultiplePdfPages(pdfPath, startPage, endPage, finalAnalysisType);
    } else {
      // Process single page
      const page = pageNumber || 1;
      logger.info('Processing Clay PDF page', {
        component: 'azure-vision',
        operation: 'clay-pdf',
        page,
        analysisType: finalAnalysisType,
      });
      result = await processPdfWithAzureVision(pdfPath, page, finalAnalysisType);
    }

    const response = createSuccessResponse({
      success: true,
      result,
      analysisType: finalAnalysisType,
      source: 'Clay Projections PDF',
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
} 