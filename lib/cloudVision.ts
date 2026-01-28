/**
 * Google Cloud Vision API Integration
 *
 * Provides text detection, document analysis, label detection, face detection,
 * and object localization using Google Cloud Vision API.
 */

import { serverLogger } from './logger/serverLogger';

 
const vision = require('@google-cloud/vision');

// ============================================================================
// TYPES
// ============================================================================

export interface TextAnnotation {
  description?: string;
  [key: string]: unknown;
}

export interface DocumentBlock {
  confidence?: number;
  text: string;
}

export interface DocumentPage {
  width?: number;
  height?: number;
  blocks: DocumentBlock[];
}

export interface DocumentTextResult {
  text: string;
  blocks: DocumentPage[];
}

export interface Label {
  description: string;
  confidence: number;
}

export interface FaceAnnotation {
  confidence?: number;
  joy?: string;
  sorrow?: string;
  anger?: string;
  surprise?: string;
  bounds?: unknown;
  [key: string]: unknown;
}

export interface ObjectAnnotation {
  name: string;
  confidence: number;
  bounds?: unknown;
}

export interface ImageAnalysisResult {
  text?: TextAnnotation[];
  labels?: Label[];
  faces?: FaceAnnotation[];
  objects?: ObjectAnnotation[];
}

// ============================================================================
// CLIENT INITIALIZATION
// ============================================================================

// Initialize the client
const client = new vision.ImageAnnotatorClient({
  // If you have a service account key file, specify it here
  // keyFilename: 'path/to/service-account-key.json',
  // Or use environment variables for authentication
  // The client will automatically use GOOGLE_APPLICATION_CREDENTIALS env var
});

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Detect text in an image
 */
export async function detectText(imagePath: string): Promise<string[]> {
  try {
    const [result] = await client.textDetection(imagePath);
    const detections = result.textAnnotations;
    
    if (!detections || detections.length === 0) {
      return [];
    }
    
    // Return all detected text (excluding the first element which contains the full text)
    return detections.slice(1).map((text: TextAnnotation) => text.description || '');
  } catch (error) {
    serverLogger.error('Error detecting text', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Detect document text (better for documents with structured text)
 */
export async function detectDocumentText(imagePath: string): Promise<DocumentTextResult> {
  try {
    const [result] = await client.documentTextDetection(imagePath);
    const fullTextAnnotation = result.fullTextAnnotation;
    
    if (!fullTextAnnotation) {
      return { text: '', blocks: [] };
    }
    
    return {
      text: fullTextAnnotation.text || '',
      blocks: (fullTextAnnotation.pages || []).map((page: {
        width?: number;
        height?: number;
        blocks?: Array<{
          confidence?: number;
          paragraphs?: Array<{
            words?: Array<{
              symbols?: Array<{ text?: string }>;
            }>;
          }>;
        }>;
      }) => ({
        width: page.width,
        height: page.height,
        blocks: (page.blocks || []).map((block: {
          confidence?: number;
          paragraphs?: Array<{
            words?: Array<{
              symbols?: Array<{ text?: string }>;
            }>;
          }>;
        }) => ({
          confidence: block.confidence,
          text: (block.paragraphs || [])
            .map((para: { words?: Array<{ symbols?: Array<{ text?: string }> }> }) => 
              (para.words || [])
                .map((word: { symbols?: Array<{ text?: string }> }) => 
                  (word.symbols || [])
                    .map((symbol: { text?: string }) => symbol.text || '')
                    .join('')
                )
                .join(' ')
            )
            .join('\n')
        }))
      }))
    };
  } catch (error) {
    serverLogger.error('Error detecting document text', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Analyze image for labels (objects, places, activities)
 */
export async function detectLabels(imagePath: string): Promise<Label[]> {
  try {
    const [result] = await client.labelDetection(imagePath);
    const labels = result.labelAnnotations || [];
    
    return labels.map((label: { description?: string; score?: number }) => ({
      description: label.description || '',
      confidence: label.score || 0
    }));
  } catch (error) {
    serverLogger.error('Error detecting labels', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Detect faces in an image
 */
export async function detectFaces(imagePath: string): Promise<FaceAnnotation[]> {
  try {
    const [result] = await client.faceDetection(imagePath);
    const faces = result.faceAnnotations || [];
    
    return faces.map((face: {
      detectionConfidence?: number;
      joyLikelihood?: string;
      sorrowLikelihood?: string;
      angerLikelihood?: string;
      surpriseLikelihood?: string;
      boundingPoly?: unknown;
    }) => ({
      confidence: face.detectionConfidence,
      joy: face.joyLikelihood,
      sorrow: face.sorrowLikelihood,
      anger: face.angerLikelihood,
      surprise: face.surpriseLikelihood,
      bounds: face.boundingPoly
    }));
  } catch (error) {
    serverLogger.error('Error detecting faces', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Detect objects in an image
 */
export async function detectObjects(imagePath: string): Promise<ObjectAnnotation[]> {
  try {
    const [result] = await client.objectLocalization(imagePath);
    const objects = result.localizedObjectAnnotations || [];
    
    return objects.map((object: { name?: string; score?: number; boundingPoly?: unknown }) => ({
      name: object.name || '',
      confidence: object.score || 0,
      bounds: object.boundingPoly
    }));
  } catch (error) {
    serverLogger.error('Error detecting objects', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Analyze image from base64 data
 */
export async function analyzeImageFromBase64(
  base64Image: string,
  mimeType: string = 'image/jpeg'
): Promise<ImageAnalysisResult> {
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
      labels: result.labelAnnotations?.map((label: { description?: string; score?: number }) => ({
        description: label.description || '',
        confidence: label.score || 0
      })),
      faces: result.faceAnnotations,
      objects: result.localizedObjectAnnotations?.map((object: { name?: string; score?: number; boundingPoly?: unknown }) => ({
        name: object.name || '',
        confidence: object.score || 0,
        bounds: object.boundingPoly
      }))
    };
  } catch (error) {
    serverLogger.error('Error analyzing image from base64', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

// CommonJS exports for backward compatibility
module.exports = {
  detectText,
  detectDocumentText,
  detectLabels,
  detectFaces,
  detectObjects,
  analyzeImageFromBase64
};
