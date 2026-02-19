/**
 * Generation, History, Jobs Route Definitions
 * @module lib/api-docs/routes/generation
 */
import type { RouteDefinition } from '../types';

export const generationRoutes: RouteDefinition[] = [
  // Generation
  {
    operationId: 'generateImage',
    method: 'POST',
    path: '/api/studio/generate/{model}',
    summary: 'Generate image with AI model',
    description: 'Generate images using the specified AI model. Supports text-to-image and image-to-image modes.',
    category: 'Generation',
    auth: 'bearer',
    rateLimit: '50/hour',
    parameters: [
      { name: 'model', in: 'path', required: true, description: 'AI model identifier', type: 'string' },
      { name: 'prompt', in: 'body', required: true, description: 'Text prompt for generation', type: 'string' },
      { name: 'negativePrompt', in: 'body', required: false, description: 'Things to exclude from generation', type: 'string' },
      { name: 'width', in: 'body', required: false, description: 'Output width in pixels', type: 'integer', default: 1024 },
      { name: 'height', in: 'body', required: false, description: 'Output height in pixels', type: 'integer', default: 1024 },
      { name: 'steps', in: 'body', required: false, description: 'Number of inference steps', type: 'integer', default: 30 },
      { name: 'seed', in: 'body', required: false, description: 'Random seed for reproducibility', type: 'integer' },
    ],
    responses: [
      { statusCode: 200, description: 'Image generated (sync)', example: '{"imageBase64":"...","seed":42,"model":"stable-diffusion"}' },
      { statusCode: 202, description: 'Job queued (async)', example: '{"jobId":"gen_abc","status":"queued","estimatedTime":15}' },
    ],
  },
  {
    operationId: 'getModelInfo',
    method: 'GET',
    path: '/api/studio/generate/{model}',
    summary: 'Get model information',
    description: 'Get details about a specific AI model including capabilities, limits, and pricing.',
    category: 'Generation',
    auth: 'bearer',
    rateLimit: '200/min',
    parameters: [
      { name: 'model', in: 'path', required: true, description: 'AI model identifier', type: 'string' },
    ],
    responses: [
      { statusCode: 200, description: 'Model info', example: '{"model":"stable-diffusion","maxWidth":2048,"maxHeight":2048,"modes":["text2img","img2img"]}' },
    ],
  },
  {
    operationId: 'estimateGeneration',
    method: 'POST',
    path: '/api/studio/generate/estimate',
    summary: 'Estimate generation cost',
    description: 'Estimate the compute cost and time for a generation request without executing it.',
    category: 'Generation',
    auth: 'bearer',
    rateLimit: '200/min',
    parameters: [
      { name: 'model', in: 'body', required: true, description: 'AI model identifier', type: 'string' },
      { name: 'width', in: 'body', required: false, description: 'Output width', type: 'integer' },
      { name: 'height', in: 'body', required: false, description: 'Output height', type: 'integer' },
      { name: 'steps', in: 'body', required: false, description: 'Inference steps', type: 'integer' },
    ],
    responses: [
      { statusCode: 200, description: 'Cost estimate', example: '{"estimatedTime":12,"credits":5}' },
    ],
  },
  {
    operationId: 'getGenerationStatus',
    method: 'GET',
    path: '/api/studio/generate/status',
    summary: 'Check generation job status',
    description: 'Check the status and progress of an async generation job.',
    category: 'Generation',
    auth: 'bearer',
    rateLimit: '200/min',
    parameters: [
      { name: 'jobId', in: 'query', required: true, description: 'Job ID from generation request', type: 'string' },
    ],
    responses: [
      { statusCode: 200, description: 'Job status', example: '{"jobId":"gen_abc","status":"complete","progress":100,"imageUrl":"https://..."}' },
    ],
  },
  {
    operationId: 'batchGenerate',
    method: 'POST',
    path: '/api/studio/generate/batch',
    summary: 'Batch image generation',
    description: 'Submit multiple generation requests as a batch. Always asynchronous.',
    category: 'Generation',
    auth: 'bearer',
    rateLimit: '10/hour',
    parameters: [
      { name: 'requests', in: 'body', required: true, description: 'Array of generation requests', type: 'array' },
    ],
    responses: [
      { statusCode: 202, description: 'Batch queued', example: '{"batchId":"batch_123","jobIds":["gen_1","gen_2"],"total":2}' },
    ],
  },
  // History
  {
    operationId: 'listHistory',
    method: 'GET',
    path: '/api/studio/history/list',
    summary: 'List generation history',
    description: 'List the user\'s generation history with pagination.',
    category: 'History',
    auth: 'bearer',
    rateLimit: '200/min',
    parameters: [
      { name: 'limit', in: 'query', required: false, description: 'Max results', type: 'integer', default: 20 },
      { name: 'offset', in: 'query', required: false, description: 'Pagination offset', type: 'integer', default: 0 },
      { name: 'model', in: 'query', required: false, description: 'Filter by model', type: 'string' },
    ],
    responses: [
      { statusCode: 200, description: 'History list', example: '{"results":[{"resultId":"res_abc","prompt":"...","createdAt":"..."}],"total":150}' },
    ],
  },
  {
    operationId: 'getHistoryItem',
    method: 'GET',
    path: '/api/studio/history/{resultId}',
    summary: 'Get history item details',
    description: 'Get full details of a specific generation result including parameters and output.',
    category: 'History',
    auth: 'bearer',
    rateLimit: '200/min',
    parameters: [
      { name: 'resultId', in: 'path', required: true, description: 'Result ID', type: 'string' },
    ],
    responses: [
      { statusCode: 200, description: 'Result details', example: '{"resultId":"res_abc","prompt":"...","imageUrl":"...","parameters":{}}' },
      { statusCode: 404, description: 'Result not found' },
    ],
  },
  // Jobs
  {
    operationId: 'getJobProgress',
    method: 'GET',
    path: '/api/studio/jobs/{jobId}/progress',
    summary: 'Stream job progress (SSE)',
    description: 'Stream real-time progress updates for an async job via Server-Sent Events. Falls back to JSON polling.',
    category: 'Jobs',
    auth: 'bearer',
    rateLimit: '200/min',
    streaming: true,
    parameters: [
      { name: 'jobId', in: 'path', required: true, description: 'Job ID', type: 'string' },
      { name: 'format', in: 'query', required: false, description: 'Response format', type: 'string', enum: ['sse', 'json'], default: 'sse' },
    ],
    responses: [
      { statusCode: 200, description: 'Progress stream or JSON', example: '{"jobId":"gen_abc","progress":75,"status":"processing"}' },
    ],
  },
];
