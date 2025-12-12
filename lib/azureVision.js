const ComputerVisionClient = require('@azure/cognitiveservices-computervision').ComputerVisionClient;
const ApiKeyCredentials = require('@azure/ms-rest-js').ApiKeyCredentials;
const fs = require('fs').promises;

// Initialize the client
let computerVisionClient;

function initializeClient() {
  if (!computerVisionClient) {
    const computerVisionKey = process.env.AZURE_COMPUTER_VISION_KEY;
    const computerVisionEndpoint = process.env.AZURE_COMPUTER_VISION_ENDPOINT;
    
    if (!computerVisionKey || !computerVisionEndpoint) {
      throw new Error('Azure Computer Vision credentials not configured. Please set AZURE_COMPUTER_VISION_KEY and AZURE_COMPUTER_VISION_ENDPOINT environment variables.');
    }
    
    const computerVisionCredentials = new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': computerVisionKey } });
    computerVisionClient = new ComputerVisionClient(computerVisionCredentials, computerVisionEndpoint);
  }
  return computerVisionClient;
}

/**
 * Convert local file path to base64 for Azure Vision
 */
async function convertFileToBase64(filePath) {
  try {
    const imageBuffer = await fs.readFile(filePath);
    return imageBuffer.toString('base64');
  } catch (error) {
    console.error('Error converting file to base64:', error);
    throw error;
  }
}

/**
 * Extract text from image using OCR
 * @param {string} imageUrl - URL of the image or local file path
 * @returns {Promise<Object>} OCR results
 */
async function extractTextFromImage(imageUrl) {
  try {
    const client = initializeClient();
    
    // Check if it's a local file path
    if (imageUrl.startsWith('./') || imageUrl.startsWith('/')) {
      const base64Image = await convertFileToBase64(imageUrl);
      const result = await client.recognizePrintedTextInStream(true, Buffer.from(base64Image, 'base64'));
      
      const extractedText = [];
      if (result.regions) {
        result.regions.forEach(region => {
          region.lines.forEach(line => {
            const lineText = line.words.map(word => word.text).join(' ');
            extractedText.push(lineText);
          });
        });
      }
      
      return {
        text: extractedText.join('\n'),
        lines: extractedText,
        regions: result.regions || []
      };
    } else {
      // It's a URL, use the original method
      const result = await client.recognizePrintedText(true, imageUrl);
      
      const extractedText = [];
      if (result.regions) {
        result.regions.forEach(region => {
          region.lines.forEach(line => {
            const lineText = line.words.map(word => word.text).join(' ');
            extractedText.push(lineText);
          });
        });
      }
      
      return {
        text: extractedText.join('\n'),
        lines: extractedText,
        regions: result.regions || []
      };
    }
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw error;
  }
}

/**
 * Extract text from image using Read API (better for documents)
 * @param {string} imageUrl - URL of the image or local file path
 * @returns {Promise<Object>} Read API results
 */
async function readTextFromImage(imageUrl) {
  try {
    const client = initializeClient();
    
    let result;
    // Check if it's a local file path
    if (imageUrl.startsWith('./') || imageUrl.startsWith('/')) {
      const base64Image = await convertFileToBase64(imageUrl);
      result = await client.readInStream(Buffer.from(base64Image, 'base64'));
    } else {
      // It's a URL, use the original method
      result = await client.read(imageUrl);
    }
    
    const operation = result.operationLocation.split('/').pop();
    
    // Wait for the operation to complete
    let readResult;
    do {
      await new Promise(resolve => setTimeout(resolve, 1000));
      readResult = await client.getReadResult(operation);
    } while (readResult.status === 'Running' || readResult.status === 'NotStarted');
    
    // Extract text from the result
    const extractedText = [];
    if (readResult.analyzeResult && readResult.analyzeResult.readResults) {
      readResult.analyzeResult.readResults.forEach(page => {
        page.lines.forEach(line => {
          extractedText.push(line.text);
        });
      });
    }
    
    return {
      text: extractedText.join('\n'),
      lines: extractedText,
      fullResult: readResult
    };
  } catch (error) {
    console.error('Error reading text from image:', error);
    throw error;
  }
}

/**
 * Analyze image for objects, faces, and other features
 * @param {string} imageUrl - URL of the image or local file path
 * @returns {Promise<Object>} Analysis results
 */
async function analyzeImage(imageUrl) {
  try {
    const client = initializeClient();
    
    let result;
    // Check if it's a local file path
    if (imageUrl.startsWith('./') || imageUrl.startsWith('/')) {
      const base64Image = await convertFileToBase64(imageUrl);
      result = await client.analyzeImageInStream(Buffer.from(base64Image, 'base64'), {
        visualFeatures: ['Categories', 'Description', 'Color', 'Tags', 'Faces', 'ImageType', 'Objects'],
        details: ['Celebrities', 'Landmarks'],
        language: 'en'
      });
    } else {
      // It's a URL, use the original method
      result = await client.analyzeImage(imageUrl, {
        visualFeatures: ['Categories', 'Description', 'Color', 'Tags', 'Faces', 'ImageType', 'Objects'],
        details: ['Celebrities', 'Landmarks'],
        language: 'en'
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}

/**
 * Detect objects in image
 * @param {string} imageUrl - URL of the image or local file path
 * @returns {Promise<Object>} Object detection results
 */
async function detectObjects(imageUrl) {
  try {
    const client = initializeClient();
    
    let result;
    // Check if it's a local file path
    if (imageUrl.startsWith('./') || imageUrl.startsWith('/')) {
      const base64Image = await convertFileToBase64(imageUrl);
      result = await client.detectObjectsInStream(Buffer.from(base64Image, 'base64'));
    } else {
      // It's a URL, use the original method
      result = await client.detectObjects(imageUrl);
    }
    
    return result;
  } catch (error) {
    console.error('Error detecting objects:', error);
    throw error;
  }
}

/**
 * Detect faces in image
 * @param {string} imageUrl - URL of the image or local file path
 * @returns {Promise<Object>} Face detection results
 */
async function detectFaces(imageUrl) {
  try {
    const client = initializeClient();
    
    let result;
    // Check if it's a local file path
    if (imageUrl.startsWith('./') || imageUrl.startsWith('/')) {
      const base64Image = await convertFileToBase64(imageUrl);
      result = await client.detectFacesInStream(Buffer.from(base64Image, 'base64'));
    } else {
      // It's a URL, use the original method
      result = await client.detectFaces(imageUrl);
    }
    
    return result;
  } catch (error) {
    console.error('Error detecting faces:', error);
    throw error;
  }
}

/**
 * Get image tags
 * @param {string} imageUrl - URL of the image or local file path
 * @returns {Promise<Object>} Tag results
 */
async function getImageTags(imageUrl) {
  try {
    const client = initializeClient();
    
    let result;
    // Check if it's a local file path
    if (imageUrl.startsWith('./') || imageUrl.startsWith('/')) {
      const base64Image = await convertFileToBase64(imageUrl);
      result = await client.tagImageInStream(Buffer.from(base64Image, 'base64'));
    } else {
      // It's a URL, use the original method
      result = await client.tagImage(imageUrl);
    }
    
    return result;
  } catch (error) {
    console.error('Error getting image tags:', error);
    throw error;
  }
}

/**
 * Describe image
 * @param {string} imageUrl - URL of the image or local file path
 * @returns {Promise<Object>} Description results
 */
async function describeImage(imageUrl) {
  try {
    const client = initializeClient();
    
    let result;
    // Check if it's a local file path
    if (imageUrl.startsWith('./') || imageUrl.startsWith('/')) {
      const base64Image = await convertFileToBase64(imageUrl);
      result = await client.describeImageInStream(Buffer.from(base64Image, 'base64'), {
        maxCandidates: 3,
        language: 'en'
      });
    } else {
      // It's a URL, use the original method
      result = await client.describeImage(imageUrl, {
        maxCandidates: 3,
        language: 'en'
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error describing image:', error);
    throw error;
  }
}

/**
 * Analyze image from base64
 * @param {string} base64Image - Base64 encoded image
 * @param {string} mimeType - MIME type of the image
 * @returns {Promise<Object>} Analysis results
 */
async function analyzeImageFromBase64(base64Image, mimeType = 'image/jpeg') {
  try {
    const client = initializeClient();
    
    // Remove data URL prefix if present
    const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    const result = await client.analyzeImageInStream(imageBuffer, {
      visualFeatures: ['Categories', 'Description', 'Color', 'Tags', 'Faces', 'ImageType', 'Objects'],
      details: ['Celebrities', 'Landmarks'],
      language: 'en'
    });
    
    return result;
  } catch (error) {
    console.error('Error analyzing base64 image:', error);
    throw error;
  }
}

module.exports = {
  extractTextFromImage,
  readTextFromImage,
  analyzeImage,
  detectObjects,
  detectFaces,
  getImageTags,
  describeImage,
  analyzeImageFromBase64
}; 