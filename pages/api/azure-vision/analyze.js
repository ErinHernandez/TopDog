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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Rate limiting
    const rateLimitResult = await rateLimiter.check(req);
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(rateLimitResult.retryAfterMs / 1000),
      });
    }
    const { imageUrl, analysisType } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

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

    res.status(200).json({ 
      success: true, 
      result,
      analysisType: analysisType || 'full'
    });

  } catch (error) {
    console.error('Azure Vision API error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze image',
      details: error.message 
    });
  }
} 