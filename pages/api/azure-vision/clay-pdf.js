import { processPdfWithAzureVision, processMultiplePdfPages } from '../../../lib/pdfProcessor';
import { RateLimiter } from '../../../lib/rateLimiter';
import { logger } from '../../../lib/structuredLogger.js';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Rate limiting
    const rateLimitResult = await rateLimiter.check(req);
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: 'Too many PDF processing requests',
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

    res.status(200).json({ 
      success: true, 
      result,
      analysisType: finalAnalysisType,
      source: 'Clay Projections PDF'
    });

  } catch (error) {
    logger.error('Clay PDF processing error', error, {
      component: 'azure-vision',
      operation: 'clay-pdf',
    });
    res.status(500).json({ 
      error: 'Failed to process Clay PDF',
      details: error.message 
    });
  }
} 