import { analyzeImageFromBase64, detectText, detectDocumentText, detectLabels, detectFaces, detectObjects } from '../../../lib/cloudVision';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Increase limit for image uploads
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageData, imageType, analysisType } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'Image data is required' });
    }

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

    res.status(200).json({ 
      success: true, 
      result,
      analysisType: analysisType || 'full'
    });

  } catch (error) {
    console.error('Vision API error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze image',
      details: error.message 
    });
  }
} 