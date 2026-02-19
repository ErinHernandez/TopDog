/**
 * AI Tools Route Definitions
 * @module lib/api-docs/routes/ai
 */
import type { RouteDefinition } from '../types';

const aiBase = {
  category: 'AI Tools' as const,
  auth: 'bearer' as const,
  rateLimit: '100/hour',
};

export const aiRoutes: RouteDefinition[] = [
  {
    ...aiBase,
    operationId: 'detectFaces',
    method: 'POST',
    path: '/api/studio/ai/detect-faces',
    summary: 'Detect faces in image',
    description: 'Detect and identify faces in uploaded images with bounding boxes and confidence scores.',
    parameters: [
      { name: 'imageBase64', in: 'body', required: true, description: 'Base64-encoded image data', type: 'string' },
    ],
    responses: [
      { statusCode: 200, description: 'Faces detected', example: '{"faces":[{"box":{"x":10,"y":20,"w":100,"h":120},"confidence":0.97}],"count":1}' },
      { statusCode: 400, description: 'Invalid image data' },
    ],
  },
  {
    ...aiBase,
    operationId: 'enhancePortrait',
    method: 'POST',
    path: '/api/studio/ai/enhance-portrait',
    summary: 'Enhance portrait photo',
    description: 'Apply AI-powered portrait enhancements including skin smoothing, blemish removal, eye enhancement, and teeth whitening.',
    parameters: [
      { name: 'imageBase64', in: 'body', required: true, description: 'Base64-encoded image data', type: 'string' },
      { name: 'enhancements', in: 'body', required: false, description: 'Enhancement settings object', type: 'object', properties: {
        skinSmoothing: { type: 'number', description: 'Skin smoothing intensity (0-100)' },
        blemishRemoval: { type: 'number', description: 'Blemish removal intensity (0-100)' },
        eyeEnhancement: { type: 'number', description: 'Eye enhancement intensity (0-100)' },
        teethWhitening: { type: 'number', description: 'Teeth whitening intensity (0-100)' },
        ageAdjustment: { type: 'number', description: 'Age adjustment (-20 to +20 years)' },
      }},
      { name: 'qualityLevel', in: 'body', required: false, description: 'Processing quality', type: 'string', enum: ['fast', 'quality', 'ultra'], default: 'quality' },
    ],
    responses: [
      { statusCode: 200, description: 'Portrait enhanced', example: '{"imageBase64":"...","metadata":{"applied":["skinSmoothing","blemishRemoval"]}}' },
    ],
  },
  {
    ...aiBase,
    operationId: 'removeBg',
    method: 'POST',
    path: '/api/studio/ai/remove-bg',
    summary: 'Remove image background',
    description: 'Remove background from an image using AI segmentation. Supports transparent, white, black, or custom color backgrounds.',
    parameters: [
      { name: 'imageBase64', in: 'body', required: true, description: 'Base64-encoded image data', type: 'string' },
      { name: 'qualityLevel', in: 'body', required: false, description: 'Processing quality', type: 'string', enum: ['fast', 'quality', 'ultra'], default: 'quality' },
      { name: 'background', in: 'body', required: false, description: 'Replacement background', type: 'string', enum: ['transparent', 'white', 'black', 'custom'], default: 'transparent' },
      { name: 'customColor', in: 'body', required: false, description: 'Custom hex color (when background=custom)', type: 'string', format: 'hex-color' },
    ],
    responses: [
      { statusCode: 200, description: 'Background removed', example: '{"imageBase64":"...","format":"png"}' },
    ],
  },
  {
    ...aiBase,
    operationId: 'removeObject',
    method: 'POST',
    path: '/api/studio/ai/remove-object',
    summary: 'Remove object from image',
    description: 'Remove specific objects from images using mask-guided inpainting.',
    parameters: [
      { name: 'imageBase64', in: 'body', required: true, description: 'Base64-encoded image data', type: 'string' },
      { name: 'maskBase64', in: 'body', required: true, description: 'Base64-encoded mask data (white = area to remove)', type: 'string' },
      { name: 'qualityLevel', in: 'body', required: false, description: 'Processing quality', type: 'string', enum: ['fast', 'quality', 'ultra'], default: 'quality' },
      { name: 'fillMode', in: 'body', required: false, description: 'Fill mode for removed area', type: 'string', enum: ['inpaint', 'contentAware'], default: 'inpaint' },
    ],
    responses: [
      { statusCode: 200, description: 'Object removed', example: '{"imageBase64":"..."}' },
    ],
  },
  {
    ...aiBase,
    operationId: 'inpaint',
    method: 'POST',
    path: '/api/studio/ai/inpaint',
    summary: 'Intelligent inpainting',
    description: 'Fill masked regions of an image with AI-generated content guided by a text prompt.',
    parameters: [
      { name: 'imageBase64', in: 'body', required: true, description: 'Base64-encoded image data', type: 'string' },
      { name: 'maskBase64', in: 'body', required: true, description: 'Base64-encoded mask data', type: 'string' },
      { name: 'prompt', in: 'body', required: true, description: 'Text prompt describing desired fill content', type: 'string' },
      { name: 'qualityLevel', in: 'body', required: false, description: 'Processing quality', type: 'string', enum: ['fast', 'quality', 'ultra'], default: 'quality' },
    ],
    responses: [
      { statusCode: 200, description: 'Inpainting complete', example: '{"imageBase64":"..."}' },
    ],
  },
  {
    ...aiBase,
    operationId: 'styleTransfer',
    method: 'POST',
    path: '/api/studio/ai/style-transfer',
    summary: 'Apply artistic style transfer',
    description: 'Transform image appearance using predefined or custom artistic styles.',
    parameters: [
      { name: 'imageBase64', in: 'body', required: true, description: 'Base64-encoded image data', type: 'string' },
      { name: 'style', in: 'body', required: true, description: 'Style to apply', type: 'string', enum: ['oil_painting', 'watercolor', 'anime_manga', 'sketch', 'pop_art', 'impressionist', 'pixel_art', 'cyberpunk', 'vintage_film', 'comic_book', 'custom'] },
      { name: 'stylePrompt', in: 'body', required: false, description: 'Custom style description (when style=custom)', type: 'string' },
      { name: 'strength', in: 'body', required: false, description: 'Style intensity (0-100)', type: 'number', default: 75 },
    ],
    responses: [
      { statusCode: 200, description: 'Style applied', example: '{"imageBase64":"...","style":"watercolor"}' },
    ],
  },
  {
    ...aiBase,
    operationId: 'textEdit',
    method: 'POST',
    path: '/api/studio/ai/text-edit',
    summary: 'Natural language image editing',
    description: 'Edit images using natural language instructions (e.g., "make the sky more blue", "add a sunset glow").',
    parameters: [
      { name: 'imageBase64', in: 'body', required: true, description: 'Base64-encoded image data', type: 'string' },
      { name: 'prompt', in: 'body', required: true, description: 'Natural language editing instruction', type: 'string' },
      { name: 'qualityLevel', in: 'body', required: false, description: 'Processing quality', type: 'string', enum: ['fast', 'quality', 'ultra'], default: 'quality' },
    ],
    responses: [
      { statusCode: 200, description: 'Edit applied', example: '{"imageBase64":"...","editsApplied":["sky color adjustment"]}' },
    ],
  },
  {
    ...aiBase,
    operationId: 'upscale',
    method: 'POST',
    path: '/api/studio/ai/upscale',
    summary: 'Upscale image resolution',
    description: 'Upscale images by 2x or 4x using AI super-resolution.',
    parameters: [
      { name: 'imageBase64', in: 'body', required: true, description: 'Base64-encoded image data', type: 'string' },
      { name: 'scale', in: 'body', required: false, description: 'Upscale factor', type: 'integer', enum: ['2', '4'], default: '2' },
      { name: 'qualityLevel', in: 'body', required: false, description: 'Processing quality', type: 'string', enum: ['fast', 'quality', 'ultra'], default: 'quality' },
    ],
    responses: [
      { statusCode: 200, description: 'Image upscaled', example: '{"imageBase64":"...","originalSize":{"w":512,"h":512},"newSize":{"w":1024,"h":1024}}' },
    ],
  },
];
