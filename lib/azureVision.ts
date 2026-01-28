/**
 * Azure Computer Vision API Integration
 * 
 * Provides OCR, text extraction, image analysis, object detection, face detection,
 * and image tagging using Azure Computer Vision API.
 */

 
const ComputerVisionClient = require('@azure/cognitiveservices-computervision').ComputerVisionClient;
 
const ApiKeyCredentials = require('@azure/ms-rest-js').ApiKeyCredentials;
import * as fs from 'fs/promises';
import { serverLogger } from './logger/serverLogger';

// ============================================================================
// TYPES
// ============================================================================

export interface OCRRegion {
  lines: Array<{
    words: Array<{
      text: string;
    }>;
  }>;
  [key: string]: unknown;
}

export interface OCRResult {
  text: string;
  lines: string[];
  regions: OCRRegion[];
}

export interface ReadResult {
  text: string;
  lines: string[];
  fullResult: unknown;
}

export interface AnalyzeImageOptions {
  visualFeatures?: string[];
  details?: string[];
  language?: string;
}

export interface DescribeImageOptions {
  maxCandidates?: number;
  language?: string;
}

// ============================================================================
// CLIENT INITIALIZATION
// ============================================================================

// Initialize the client
let computerVisionClient: typeof ComputerVisionClient | null = null;

function initializeClient(): typeof ComputerVisionClient {
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert local file path to base64 for Azure Vision
 */
async function convertFileToBase64(filePath: string): Promise<string> {
  try {
    const imageBuffer = await fs.readFile(filePath);
    return imageBuffer.toString('base64');
  } catch (error) {
    serverLogger.error('Error converting file to base64', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Extract text from image using OCR
 */
export async function extractTextFromImage(imageUrl: string): Promise<OCRResult> {
  try {
    const client = initializeClient();
    
    // Check if it's a local file path
    if (imageUrl.startsWith('./') || imageUrl.startsWith('/')) {
      const base64Image = await convertFileToBase64(imageUrl);
      const result = await client.recognizePrintedTextInStream(true, Buffer.from(base64Image, 'base64'));
      
      const extractedText: string[] = [];
      if (result.regions) {
        result.regions.forEach((region: OCRRegion) => {
          region.lines.forEach((line: { words: Array<{ text?: string }> }) => {
            const lineText = line.words.map((word: { text?: string }) => word.text || '').join(' ');
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
      
      const extractedText: string[] = [];
      if (result.regions) {
        result.regions.forEach((region: OCRRegion) => {
          region.lines.forEach((line: { words: Array<{ text?: string }> }) => {
            const lineText = line.words.map((word: { text?: string }) => word.text || '').join(' ');
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
    serverLogger.error('Error extracting text from image', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Extract text from image using Read API (better for documents)
 */
export async function readTextFromImage(imageUrl: string): Promise<ReadResult> {
  try {
    const client = initializeClient();
    
    let result: { operationLocation?: string; status?: string };
    // Check if it's a local file path
    if (imageUrl.startsWith('./') || imageUrl.startsWith('/')) {
      const base64Image = await convertFileToBase64(imageUrl);
      result = await client.readInStream(Buffer.from(base64Image, 'base64'));
    } else {
      // It's a URL, use the original method
      result = await client.read(imageUrl);
    }
    
    if (!result.operationLocation) {
      throw new Error('No operation location returned from Read API');
    }

    const operation = result.operationLocation.split('/').pop();
    if (!operation) {
      throw new Error('Could not extract operation ID from operation location');
    }
    
    // Wait for the operation to complete
    let readResult: {
      status?: string;
      analyzeResult?: {
        readResults?: Array<{
          lines?: Array<{ text?: string }>;
        }>;
      };
    };
    do {
      await new Promise(resolve => setTimeout(resolve, 1000));
      readResult = await client.getReadResult(operation);
    } while (readResult.status === 'Running' || readResult.status === 'NotStarted');
    
    // Extract text from the result
    const extractedText: string[] = [];
    if (readResult.analyzeResult && readResult.analyzeResult.readResults) {
      readResult.analyzeResult.readResults.forEach((page: { lines?: Array<{ text?: string }> }) => {
        if (page.lines) {
          page.lines.forEach((line: { text?: string }) => {
            if (line.text) {
              extractedText.push(line.text);
            }
          });
        }
      });
    }
    
    return {
      text: extractedText.join('\n'),
      lines: extractedText,
      fullResult: readResult
    };
  } catch (error) {
    serverLogger.error('Error reading text from image', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Analyze image for objects, faces, and other features
 */
export async function analyzeImage(imageUrl: string): Promise<unknown> {
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
    serverLogger.error('Error analyzing image', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Detect objects in image
 */
export async function detectObjects(imageUrl: string): Promise<unknown> {
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
    serverLogger.error('Error detecting objects', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Detect faces in image
 */
export async function detectFaces(imageUrl: string): Promise<unknown> {
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
    serverLogger.error('Error detecting faces', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Get image tags
 */
export async function getImageTags(imageUrl: string): Promise<unknown> {
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
    serverLogger.error('Error getting image tags', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Describe image
 */
export async function describeImage(imageUrl: string): Promise<unknown> {
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
    serverLogger.error('Error describing image', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Analyze image from base64
 */
export async function analyzeImageFromBase64(
  base64Image: string,
  mimeType: string = 'image/jpeg'
): Promise<unknown> {
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
    serverLogger.error('Error analyzing base64 image', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

// CommonJS exports for backward compatibility
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
