/**
 * Vision / Image Analysis Validation Schemas
 *
 * Schemas for Cloud Vision, Azure Vision, and image analysis API inputs.
 *
 * @module lib/validation/vision
 */

import { z } from 'zod';

const analysisTypeSchema = z.enum(['text', 'document', 'labels', 'faces', 'objects', 'full']);

/**
 * Vision analyze request (POST /api/vision/analyze)
 * imageData: base64 string or data URL or file path
 */
export const visionAnalyzeSchema = z.object({
  imageData: z.string().min(1, 'imageData is required'),
  imageType: z.string().max(50).optional(),
  analysisType: analysisTypeSchema.optional().default('full'),
});

export type VisionAnalyzeInput = z.infer<typeof visionAnalyzeSchema>;

// ============================================================================
// AZURE VISION
// ============================================================================

const azureAnalysisTypeSchema = z.enum([
  'ocr',
  'read',
  'objects',
  'faces',
  'tags',
  'description',
  'full',
]);

/**
 * Azure Vision analyze request (POST /api/azure-vision/analyze)
 * imageUrl: URL to image (validated for SSRF in handler)
 */
export const azureVisionAnalyzeSchema = z.object({
  imageUrl: z.string().min(1, 'imageUrl is required').max(2048, 'imageUrl too long'),
  analysisType: azureAnalysisTypeSchema.optional().default('full'),
});

export type AzureVisionAnalyzeInput = z.infer<typeof azureVisionAnalyzeSchema>;
