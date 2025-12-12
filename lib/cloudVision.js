const vision = require('@google-cloud/vision');

// Initialize the client
const client = new vision.ImageAnnotatorClient({
  // If you have a service account key file, specify it here
  // keyFilename: 'path/to/service-account-key.json',
  // Or use environment variables for authentication
  // The client will automatically use GOOGLE_APPLICATION_CREDENTIALS env var
});

/**
 * Detect text in an image
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<Array>} Array of detected text
 */
async function detectText(imagePath) {
  try {
    const [result] = await client.textDetection(imagePath);
    const detections = result.textAnnotations;
    
    if (!detections || detections.length === 0) {
      return [];
    }
    
    // Return all detected text (excluding the first element which contains the full text)
    return detections.slice(1).map(text => text.description);
  } catch (error) {
    console.error('Error detecting text:', error);
    throw error;
  }
}

/**
 * Detect document text (better for documents with structured text)
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<Object>} Document text detection result
 */
async function detectDocumentText(imagePath) {
  try {
    const [result] = await client.documentTextDetection(imagePath);
    const fullTextAnnotation = result.fullTextAnnotation;
    
    if (!fullTextAnnotation) {
      return { text: '', blocks: [] };
    }
    
    return {
      text: fullTextAnnotation.text,
      blocks: fullTextAnnotation.pages.map(page => ({
        width: page.width,
        height: page.height,
        blocks: page.blocks.map(block => ({
          confidence: block.confidence,
          text: block.paragraphs.map(para => 
            para.words.map(word => 
              word.symbols.map(symbol => symbol.text).join('')
            ).join(' ')
          ).join('\n')
        }))
      }))
    };
  } catch (error) {
    console.error('Error detecting document text:', error);
    throw error;
  }
}

/**
 * Analyze image for labels (objects, places, activities)
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<Array>} Array of detected labels
 */
async function detectLabels(imagePath) {
  try {
    const [result] = await client.labelDetection(imagePath);
    const labels = result.labelAnnotations;
    
    return labels.map(label => ({
      description: label.description,
      confidence: label.score
    }));
  } catch (error) {
    console.error('Error detecting labels:', error);
    throw error;
  }
}

/**
 * Detect faces in an image
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<Array>} Array of face detection results
 */
async function detectFaces(imagePath) {
  try {
    const [result] = await client.faceDetection(imagePath);
    const faces = result.faceAnnotations;
    
    return faces.map(face => ({
      confidence: face.detectionConfidence,
      joy: face.joyLikelihood,
      sorrow: face.sorrowLikelihood,
      anger: face.angerLikelihood,
      surprise: face.surpriseLikelihood,
      bounds: face.boundingPoly
    }));
  } catch (error) {
    console.error('Error detecting faces:', error);
    throw error;
  }
}

/**
 * Detect objects in an image
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<Array>} Array of detected objects
 */
async function detectObjects(imagePath) {
  try {
    const [result] = await client.objectLocalization(imagePath);
    const objects = result.localizedObjectAnnotations;
    
    return objects.map(object => ({
      name: object.name,
      confidence: object.score,
      bounds: object.boundingPoly
    }));
  } catch (error) {
    console.error('Error detecting objects:', error);
    throw error;
  }
}

/**
 * Analyze image from base64 data
 * @param {string} base64Image - Base64 encoded image data
 * @param {string} mimeType - MIME type of the image
 * @returns {Promise<Object>} Analysis results
 */
async function analyzeImageFromBase64(base64Image, mimeType = 'image/jpeg') {
  try {
    const request = {
      image: {
        content: base64Image
      },
      features: [
        { type: 'TEXT_DETECTION' },
        { type: 'LABEL_DETECTION' },
        { type: 'FACE_DETECTION' },
        { type: 'OBJECT_LOCALIZATION' }
      ]
    };

    const [result] = await client.annotateImage(request);
    
    return {
      text: result.textAnnotations,
      labels: result.labelAnnotations,
      faces: result.faceAnnotations,
      objects: result.localizedObjectAnnotations
    };
  } catch (error) {
    console.error('Error analyzing image from base64:', error);
    throw error;
  }
}

module.exports = {
  detectText,
  detectDocumentText,
  detectLabels,
  detectFaces,
  detectObjects,
  analyzeImageFromBase64
}; 