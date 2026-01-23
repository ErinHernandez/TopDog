/**
 * Azure Vision API - Clay PDF Processing
 * 
 * POST /api/azure-vision/clay-pdf
 * 
 * Processes Clay projections PDF using Azure Vision API.
 * Supports single page or multiple page processing.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { processPdfWithAzureVision, processMultiplePdfPages } from '../../../lib/pdfProcessor';
import { RateLimiter } from '../../../lib/rateLimiter';
import { 
  withErrorHandling, 
  validateMethod,
  createErrorResponse,
  createSuccessResponse,
  ErrorType 
} from '../../../lib/apiErrorHandler';

// ============================================================================
// TYPES
// ============================================================================

export type ClayPdfAnalysisType = 'ocr' | 'read';

export interface ClayPdfRequest {
  pageNumber?: number;
  analysisType?: ClayPdfAnalysisType;
  processMultiple?: boolean;
  startPage?: number;
  endPage?: number;
}

export interface ClayPdfResponse {
  success: boolean;
  result: unknown;
  analysisType: ClayPdfAnalysisType;
  source: string;
  error?: string;
  retryAfter?: number;
}

// ============================================================================
// CONFIG
// ============================================================================

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Increase limit for PDF processing
    },
  },
};

// ============================================================================
// RATE LIMITER
// ============================================================================

// Rate limiter for PDF processing (5 per hour - very expensive operation)
const rateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 60 * 60 * 1000,
  endpoint: 'clay_pdf',
});

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ClayPdfResponse>
): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
    // Validate HTTP method
    validateMethod(req, ['POST'], logger);
    
    // Rate limiting
    const rateLimitResult = await rateLimiter.check(req);
    if (!rateLimitResult.allowed) {
      const errorResponse = createErrorResponse(
        ErrorType.RATE_LIMIT,
        'Too many PDF processing requests',
        { retryAfter: Math.ceil((rateLimitResult.retryAfterMs || 60) / 1000) },
        res.getHeader('X-Request-ID') as string | undefined
      );
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.body.error.message,
        retryAfter: Math.ceil((rateLimitResult.retryAfterMs || 60) / 1000),
        success: false,
        result: null,
        analysisType: 'read',
        source: 'Clay Projections PDF',
      });
    }
    
    const { pageNumber, analysisType, processMultiple, startPage, endPage } = req.body as ClayPdfRequest;

    // Default to the Clay projections PDF
    const pdfPath = './clay_projections_2025.pdf';
    
    // Validate analysis type
    const validAnalysisTypes: ClayPdfAnalysisType[] = ['ocr', 'read'];
    const finalAnalysisType: ClayPdfAnalysisType = validAnalysisTypes.includes(analysisType || 'read') 
      ? (analysisType || 'read') 
      : 'read';

    let result: unknown;

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
    
    return res.status(response.statusCode).json(response.body.data as ClayPdfResponse);
  });
}
