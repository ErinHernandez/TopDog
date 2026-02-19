/**
 * Files, Formats, and Upload Route Definitions
 * @module lib/api-docs/routes/files
 */
import type { RouteDefinition } from '../types';

export const fileRoutes: RouteDefinition[] = [
  // Files
  {
    operationId: 'uploadFile',
    method: 'POST',
    path: '/api/studio/files/upload',
    summary: 'Upload file',
    description: 'Upload a file to the user\'s storage. Supports images, PSDs, and other design assets up to 50MB.',
    category: 'Files',
    auth: 'bearer',
    rateLimit: '50/hour',
    bodyLimit: '50mb',
    parameters: [
      { name: 'file', in: 'body', required: true, description: 'File data (multipart/form-data)', type: 'file' },
      { name: 'folder', in: 'body', required: false, description: 'Destination folder path', type: 'string' },
    ],
    responses: [
      { statusCode: 200, description: 'File uploaded', example: '{"fileId":"abc123","url":"https://...","size":1048576,"mimeType":"image/png"}' },
      { statusCode: 413, description: 'File too large' },
    ],
  },
  {
    operationId: 'listFiles',
    method: 'GET',
    path: '/api/studio/files/list',
    summary: 'List uploaded files',
    description: 'List files in the user\'s storage with pagination and optional folder filtering.',
    category: 'Files',
    auth: 'bearer',
    rateLimit: '200/min',
    parameters: [
      { name: 'folder', in: 'query', required: false, description: 'Filter by folder path', type: 'string' },
      { name: 'limit', in: 'query', required: false, description: 'Max results (default 20, max 100)', type: 'integer', default: 20 },
      { name: 'offset', in: 'query', required: false, description: 'Pagination offset', type: 'integer', default: 0 },
    ],
    responses: [
      { statusCode: 200, description: 'File list', example: '{"files":[{"fileId":"abc","name":"photo.png","size":1024}],"total":42}' },
    ],
  },
  {
    operationId: 'deleteFile',
    method: 'DELETE',
    path: '/api/studio/files/delete',
    summary: 'Delete file',
    description: 'Delete a file from the user\'s storage by file ID.',
    category: 'Files',
    auth: 'bearer',
    rateLimit: '100/hour',
    parameters: [
      { name: 'fileId', in: 'query', required: true, description: 'ID of the file to delete', type: 'string' },
    ],
    responses: [
      { statusCode: 200, description: 'File deleted', example: '{"deleted":true}' },
      { statusCode: 404, description: 'File not found' },
    ],
  },
  // Formats
  {
    operationId: 'listFormats',
    method: 'GET',
    path: '/api/studio/formats',
    summary: 'List supported export formats',
    description: 'Returns all supported export formats with their capabilities and size limits.',
    category: 'Formats',
    auth: 'bearer',
    rateLimit: '200/min',
    parameters: [],
    responses: [
      { statusCode: 200, description: 'Format list', example: '{"formats":["png","jpg","webp","psd","tiff","svg","pdf"]}' },
    ],
  },
  {
    operationId: 'exportPsd',
    method: 'POST',
    path: '/api/studio/formats/export-psd',
    summary: 'Export to Photoshop (PSD)',
    description: 'Export project layers to PSD format with full layer support. Synchronous for small files, async with job ID for large files.',
    category: 'Formats',
    auth: 'bearer',
    rateLimit: '20/hour',
    parameters: [
      { name: 'projectId', in: 'body', required: true, description: 'Project to export', type: 'string' },
      { name: 'layers', in: 'body', required: false, description: 'Specific layer IDs to include (defaults to all)', type: 'array' },
      { name: 'colorProfile', in: 'body', required: false, description: 'Color profile', type: 'string', enum: ['srgb', 'adobe-rgb', 'prophoto'], default: 'srgb' },
    ],
    responses: [
      { statusCode: 200, description: 'PSD export complete or job started', example: '{"jobId":"job_123","status":"processing"}' },
    ],
  },
  {
    operationId: 'exportTiff',
    method: 'POST',
    path: '/api/studio/formats/export-tiff',
    summary: 'Export to TIFF',
    description: 'Export to TIFF format with optional compression and color profile settings.',
    category: 'Formats',
    auth: 'bearer',
    rateLimit: '20/hour',
    parameters: [
      { name: 'projectId', in: 'body', required: true, description: 'Project to export', type: 'string' },
      { name: 'compression', in: 'body', required: false, description: 'TIFF compression', type: 'string', enum: ['none', 'lzw', 'zip', 'jpeg'], default: 'lzw' },
      { name: 'bitDepth', in: 'body', required: false, description: 'Bit depth per channel', type: 'integer', enum: ['8', '16'], default: '8' },
    ],
    responses: [
      { statusCode: 200, description: 'TIFF export complete or job started', example: '{"jobId":"job_456","status":"processing"}' },
    ],
  },
  {
    operationId: 'processRaw',
    method: 'POST',
    path: '/api/studio/formats/process-raw',
    summary: 'Process RAW camera file',
    description: 'Process RAW camera files (CR2, NEF, ARW, etc.) with custom development settings. Always asynchronous.',
    category: 'Formats',
    auth: 'bearer',
    rateLimit: '10/hour',
    bodyLimit: '100mb',
    parameters: [
      { name: 'file', in: 'body', required: true, description: 'RAW file data', type: 'file' },
      { name: 'settings', in: 'body', required: false, description: 'Development settings (exposure, white balance, etc.)', type: 'object' },
    ],
    responses: [
      { statusCode: 202, description: 'Processing started', example: '{"jobId":"raw_789","status":"processing","estimatedTime":30}' },
    ],
  },
  // Uploads
  {
    operationId: 'uploadImage',
    method: 'POST',
    path: '/api/studio/upload/image',
    summary: 'Upload image asset',
    description: 'Upload an image asset for use in projects. Supports PNG, JPEG, WebP, and SVG.',
    category: 'Uploads',
    auth: 'bearer',
    rateLimit: '50/hour',
    bodyLimit: '10mb',
    parameters: [
      { name: 'image', in: 'body', required: true, description: 'Image file (multipart/form-data)', type: 'file' },
      { name: 'projectId', in: 'body', required: false, description: 'Associate with a project', type: 'string' },
    ],
    responses: [
      { statusCode: 200, description: 'Image uploaded', example: '{"assetId":"img_abc","url":"https://...","width":1920,"height":1080}' },
    ],
  },
  {
    operationId: 'uploadAsset',
    method: 'POST',
    path: '/api/studio/upload/asset',
    summary: 'Upload design asset',
    description: 'Upload design assets like SVG icons, patterns, and textures.',
    category: 'Uploads',
    auth: 'bearer',
    rateLimit: '50/hour',
    bodyLimit: '5mb',
    parameters: [
      { name: 'asset', in: 'body', required: true, description: 'Asset file', type: 'file' },
      { name: 'type', in: 'body', required: true, description: 'Asset type', type: 'string', enum: ['icon', 'pattern', 'texture', 'shape'] },
    ],
    responses: [
      { statusCode: 200, description: 'Asset uploaded', example: '{"assetId":"ast_xyz","type":"icon","url":"https://..."}' },
    ],
  },
  {
    operationId: 'uploadFont',
    method: 'POST',
    path: '/api/studio/upload/font',
    summary: 'Upload custom font',
    description: 'Upload a custom font file (TTF, OTF, WOFF, WOFF2) for use in text layers.',
    category: 'Uploads',
    auth: 'bearer',
    rateLimit: '20/hour',
    bodyLimit: '5mb',
    parameters: [
      { name: 'font', in: 'body', required: true, description: 'Font file', type: 'file' },
      { name: 'fontFamily', in: 'body', required: false, description: 'Custom font family name', type: 'string' },
    ],
    responses: [
      { statusCode: 200, description: 'Font uploaded', example: '{"fontId":"fnt_abc","family":"My Custom Font","style":"regular"}' },
    ],
  },
];
