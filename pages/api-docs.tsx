import { useState, useMemo, useCallback } from 'react';
import styles from '../styles/api-docs.module.css';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ApiParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: string;
}

interface ApiResponse {
  code: number;
  description: string;
  example: string;
}

interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'SSE';
  path: string;
  summary: string;
  description: string;
  auth: 'token' | 'key' | 'admin' | 'webhook';
  rateLimit: string;
  category: string;
  parameters: ApiParameter[];
  responses: ApiResponse[];
  example?: {
    request: string;
    response: string;
  };
}

// ============================================================================
// API ENDPOINTS DATA
// ============================================================================

const API_ENDPOINTS: ApiEndpoint[] = [
  // Health Endpoints
  {
    id: 'health-basic',
    method: 'GET',
    path: '/api/health',
    summary: 'Basic health check',
    description: 'Simple endpoint to verify the API is running and responding',
    auth: 'token',
    rateLimit: 'Unlimited',
    category: 'Health',
    parameters: [],
    responses: [
      {
        code: 200,
        description: 'Service is healthy',
        example: '{"status": "ok", "timestamp": "2024-02-11T12:00:00Z"}'
      }
    ]
  },
  {
    id: 'health-deep',
    method: 'GET',
    path: '/api/health/deep',
    summary: 'Deep health check with dependencies',
    description: 'Checks API and all critical dependencies (database, cache, external services)',
    auth: 'token',
    rateLimit: 'Unlimited',
    category: 'Health',
    parameters: [],
    responses: [
      {
        code: 200,
        description: 'All services healthy',
        example: '{"status": "ok", "database": "ok", "cache": "ok", "timestamp": "2024-02-11T12:00:00Z"}'
      },
      {
        code: 503,
        description: 'One or more dependencies unhealthy',
        example: '{"status": "degraded", "database": "ok", "cache": "error"}'
      }
    ]
  },

  // AI Tools Endpoints
  {
    id: 'ai-detect-faces',
    method: 'POST',
    path: '/api/ai/detect-faces',
    summary: 'Detect faces in image',
    description: 'Detect and identify faces in uploaded images with bounding boxes and confidence scores',
    auth: 'token',
    rateLimit: '100/hour',
    category: 'AI Tools',
    parameters: [
      {
        name: 'image',
        type: 'file',
        required: true,
        description: 'Image file (JPG, PNG, WebP)'
      },
      {
        name: 'min_confidence',
        type: 'number',
        required: false,
        description: 'Minimum confidence threshold (0.0-1.0)',
        example: '0.8'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Faces detected successfully',
        example: '{"faces": [{"x": 100, "y": 150, "width": 80, "height": 100, "confidence": 0.95}]}'
      }
    ]
  },
  {
    id: 'ai-enhance-portrait',
    method: 'POST',
    path: '/api/ai/enhance-portrait',
    summary: 'Enhance portrait image',
    description: 'Apply AI-powered enhancements to portrait photos (skin smoothing, lighting, etc)',
    auth: 'token',
    rateLimit: '50/hour',
    category: 'AI Tools',
    parameters: [
      {
        name: 'image',
        type: 'file',
        required: true,
        description: 'Portrait image file'
      },
      {
        name: 'intensity',
        type: 'number',
        required: false,
        description: 'Enhancement intensity (0.0-1.0)',
        example: '0.7'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Portrait enhanced',
        example: '{"id": "enh_12345", "output_url": "https://cdn.example.com/enhanced.jpg"}'
      }
    ]
  },
  {
    id: 'ai-inpaint',
    method: 'POST',
    path: '/api/ai/inpaint',
    summary: 'Inpaint/remove objects',
    description: 'Intelligently fill masked regions using contextual AI inpainting',
    auth: 'token',
    rateLimit: '30/hour',
    category: 'AI Tools',
    parameters: [
      {
        name: 'image',
        type: 'file',
        required: true,
        description: 'Image file'
      },
      {
        name: 'mask',
        type: 'file',
        required: true,
        description: 'Mask image (white = inpaint, black = preserve)'
      },
      {
        name: 'prompt',
        type: 'string',
        required: false,
        description: 'Optional text guidance for inpainting'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Inpainting completed',
        example: '{"id": "inp_12345", "output_url": "https://cdn.example.com/inpainted.jpg"}'
      }
    ]
  },
  {
    id: 'ai-remove-bg',
    method: 'POST',
    path: '/api/ai/remove-bg',
    summary: 'Remove background',
    description: 'Automatically remove background from images with transparency',
    auth: 'token',
    rateLimit: '100/hour',
    category: 'AI Tools',
    parameters: [
      {
        name: 'image',
        type: 'file',
        required: true,
        description: 'Image file'
      },
      {
        name: 'format',
        type: 'string',
        required: false,
        description: 'Output format (png or webp)',
        example: 'png'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Background removed',
        example: '{"id": "bg_12345", "output_url": "https://cdn.example.com/no-bg.png"}'
      }
    ]
  },
  {
    id: 'ai-remove-object',
    method: 'POST',
    path: '/api/ai/remove-object',
    summary: 'Remove specific object',
    description: 'Remove specific objects from images using mask',
    auth: 'token',
    rateLimit: '50/hour',
    category: 'AI Tools',
    parameters: [
      {
        name: 'image',
        type: 'file',
        required: true,
        description: 'Image file'
      },
      {
        name: 'mask',
        type: 'file',
        required: true,
        description: 'Object mask'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Object removed',
        example: '{"id": "obj_12345", "output_url": "https://cdn.example.com/removed.jpg"}'
      }
    ]
  },
  {
    id: 'ai-style-transfer',
    method: 'POST',
    path: '/api/ai/style-transfer',
    summary: 'Apply style transfer',
    description: 'Apply artistic style from reference image to target image',
    auth: 'token',
    rateLimit: '30/hour',
    category: 'AI Tools',
    parameters: [
      {
        name: 'image',
        type: 'file',
        required: true,
        description: 'Content image'
      },
      {
        name: 'style',
        type: 'file',
        required: true,
        description: 'Style reference image'
      },
      {
        name: 'strength',
        type: 'number',
        required: false,
        description: 'Style strength (0.0-1.0)',
        example: '0.8'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Style transferred',
        example: '{"id": "sty_12345", "output_url": "https://cdn.example.com/styled.jpg"}'
      }
    ]
  },
  {
    id: 'ai-text-edit',
    method: 'POST',
    path: '/api/ai/text-edit',
    summary: 'Edit text in images',
    description: 'Detect and edit text within images using AI',
    auth: 'token',
    rateLimit: '50/hour',
    category: 'AI Tools',
    parameters: [
      {
        name: 'image',
        type: 'file',
        required: true,
        description: 'Image containing text'
      },
      {
        name: 'replacements',
        type: 'object',
        required: true,
        description: 'Object mapping old text to new text'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Text edited',
        example: '{"id": "txt_12345", "output_url": "https://cdn.example.com/edited.jpg"}'
      }
    ]
  },
  {
    id: 'ai-upscale',
    method: 'POST',
    path: '/api/ai/upscale',
    summary: 'Upscale image resolution',
    description: 'Intelligently upscale image while maintaining quality (2x-4x)',
    auth: 'token',
    rateLimit: '40/hour',
    category: 'AI Tools',
    parameters: [
      {
        name: 'image',
        type: 'file',
        required: true,
        description: 'Image to upscale'
      },
      {
        name: 'scale',
        type: 'integer',
        required: true,
        description: 'Upscale factor (2, 3, or 4)',
        example: '2'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Image upscaled',
        example: '{"id": "up_12345", "output_url": "https://cdn.example.com/upscaled.jpg", "original_size": "800x600", "new_size": "1600x1200"}'
      }
    ]
  },

  // Files Endpoints
  {
    id: 'files-upload',
    method: 'POST',
    path: '/api/files/upload',
    summary: 'Upload file',
    description: 'Upload design files, assets, or images to your workspace',
    auth: 'token',
    rateLimit: '500/day',
    category: 'Files',
    parameters: [
      {
        name: 'file',
        type: 'file',
        required: true,
        description: 'File to upload'
      },
      {
        name: 'type',
        type: 'string',
        required: false,
        description: 'File type (auto-detected if not provided)'
      }
    ],
    responses: [
      {
        code: 201,
        description: 'File uploaded',
        example: '{"id": "file_12345", "name": "design.psd", "url": "https://cdn.example.com/files/design.psd", "size": 5242880}'
      }
    ]
  },
  {
    id: 'files-list',
    method: 'GET',
    path: '/api/files/list',
    summary: 'List files',
    description: 'Get list of all uploaded files in your workspace',
    auth: 'token',
    rateLimit: 'Unlimited',
    category: 'Files',
    parameters: [
      {
        name: 'limit',
        type: 'integer',
        required: false,
        description: 'Maximum results (default: 20)',
        example: '50'
      },
      {
        name: 'offset',
        type: 'integer',
        required: false,
        description: 'Pagination offset',
        example: '0'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Files retrieved',
        example: '{"files": [{"id": "file_12345", "name": "design.psd", "size": 5242880}], "total": 150}'
      }
    ]
  },
  {
    id: 'files-delete',
    method: 'DELETE',
    path: '/api/files/{id}',
    summary: 'Delete file',
    description: 'Permanently delete a file from your workspace',
    auth: 'token',
    rateLimit: 'Unlimited',
    category: 'Files',
    parameters: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'File ID',
        example: 'file_12345'
      }
    ],
    responses: [
      {
        code: 204,
        description: 'File deleted',
        example: ''
      }
    ]
  },

  // Formats Endpoints
  {
    id: 'formats-list',
    method: 'GET',
    path: '/api/formats/list',
    summary: 'List supported formats',
    description: 'Get list of all supported file formats and export options',
    auth: 'token',
    rateLimit: 'Unlimited',
    category: 'Formats',
    parameters: [],
    responses: [
      {
        code: 200,
        description: 'Formats listed',
        example: '{"formats": [{"name": "PSD", "extension": ".psd"}, {"name": "PNG", "extension": ".png"}]}'
      }
    ]
  },
  {
    id: 'formats-export-psd',
    method: 'POST',
    path: '/api/formats/export-psd',
    summary: 'Export as PSD',
    description: 'Export design to Photoshop PSD format with layers',
    auth: 'token',
    rateLimit: '50/day',
    category: 'Formats',
    parameters: [
      {
        name: 'project_id',
        type: 'string',
        required: true,
        description: 'Project ID'
      },
      {
        name: 'include_layers',
        type: 'boolean',
        required: false,
        description: 'Include layer information',
        example: 'true'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'PSD exported',
        example: '{"download_url": "https://cdn.example.com/export.psd", "expires_in": 3600}'
      }
    ]
  },
  {
    id: 'formats-export-tiff',
    method: 'POST',
    path: '/api/formats/export-tiff',
    summary: 'Export as TIFF',
    description: 'Export design to TIFF format with compression options',
    auth: 'token',
    rateLimit: '50/day',
    category: 'Formats',
    parameters: [
      {
        name: 'project_id',
        type: 'string',
        required: true,
        description: 'Project ID'
      },
      {
        name: 'compression',
        type: 'string',
        required: false,
        description: 'Compression method (lzw, zip, or none)',
        example: 'lzw'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'TIFF exported',
        example: '{"download_url": "https://cdn.example.com/export.tiff", "size": 10485760}'
      }
    ]
  },
  {
    id: 'formats-process-raw',
    method: 'POST',
    path: '/api/formats/process-raw',
    summary: 'Process RAW image',
    description: 'Process RAW camera files with white balance and tone mapping',
    auth: 'token',
    rateLimit: '30/day',
    category: 'Formats',
    parameters: [
      {
        name: 'file',
        type: 'file',
        required: true,
        description: 'RAW image file'
      },
      {
        name: 'white_balance',
        type: 'string',
        required: false,
        description: 'White balance preset',
        example: 'daylight'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'RAW processed',
        example: '{"output_url": "https://cdn.example.com/processed.jpg"}'
      }
    ]
  },

  // Generation Endpoints
  {
    id: 'gen-generate',
    method: 'POST',
    path: '/api/generation/generate/{model}',
    summary: 'Generate design',
    description: 'Generate designs using AI models (dalle, midjourney, stability)',
    auth: 'token',
    rateLimit: '20/hour',
    category: 'Generation',
    parameters: [
      {
        name: 'model',
        type: 'string',
        required: true,
        description: 'Model to use (dalle, midjourney, or stability)',
        example: 'dalle'
      },
      {
        name: 'prompt',
        type: 'string',
        required: true,
        description: 'Text prompt for generation'
      },
      {
        name: 'style',
        type: 'string',
        required: false,
        description: 'Style preset',
        example: 'photorealistic'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Generation started',
        example: '{"job_id": "gen_12345", "status": "pending", "estimated_time": 30}'
      }
    ]
  },
  {
    id: 'gen-estimate',
    method: 'GET',
    path: '/api/generation/estimate',
    summary: 'Estimate generation cost',
    description: 'Estimate credits needed for generation request',
    auth: 'token',
    rateLimit: 'Unlimited',
    category: 'Generation',
    parameters: [
      {
        name: 'model',
        type: 'string',
        required: true,
        description: 'Model name'
      },
      {
        name: 'size',
        type: 'string',
        required: false,
        description: 'Output size',
        example: '1024x1024'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Estimate returned',
        example: '{"credits_required": 100, "estimated_time": 30}'
      }
    ]
  },
  {
    id: 'gen-status',
    method: 'GET',
    path: '/api/generation/status/{job_id}',
    summary: 'Check generation status',
    description: 'Poll status of a generation job',
    auth: 'token',
    rateLimit: 'Unlimited',
    category: 'Generation',
    parameters: [
      {
        name: 'job_id',
        type: 'string',
        required: true,
        description: 'Job ID',
        example: 'gen_12345'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Status returned',
        example: '{"status": "completed", "output_url": "https://cdn.example.com/generated.jpg", "created_at": "2024-02-11T12:00:00Z"}'
      }
    ]
  },
  {
    id: 'gen-batch',
    method: 'POST',
    path: '/api/generation/batch',
    summary: 'Batch generation',
    description: 'Generate multiple designs in a single request',
    auth: 'token',
    rateLimit: '10/hour',
    category: 'Generation',
    parameters: [
      {
        name: 'prompts',
        type: 'array',
        required: true,
        description: 'Array of prompts'
      },
      {
        name: 'model',
        type: 'string',
        required: true,
        description: 'Model to use'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Batch jobs created',
        example: '{"job_ids": ["gen_12345", "gen_12346", "gen_12347"], "count": 3}'
      }
    ]
  },
  {
    id: 'gen-webhook',
    method: 'POST',
    path: '/api/generation/webhook',
    summary: 'Register webhook',
    description: 'Get notified when generation is complete',
    auth: 'token',
    rateLimit: 'Unlimited',
    category: 'Generation',
    parameters: [
      {
        name: 'job_id',
        type: 'string',
        required: true,
        description: 'Job ID'
      },
      {
        name: 'webhook_url',
        type: 'string',
        required: true,
        description: 'Webhook URL for callback'
      }
    ],
    responses: [
      {
        code: 201,
        description: 'Webhook registered',
        example: '{"webhook_id": "wh_12345", "retry_count": 3}'
      }
    ]
  },

  // History Endpoints
  {
    id: 'history-list',
    method: 'GET',
    path: '/api/history/list',
    summary: 'List history',
    description: 'Get list of recent operations and changes',
    auth: 'token',
    rateLimit: 'Unlimited',
    category: 'History',
    parameters: [
      {
        name: 'limit',
        type: 'integer',
        required: false,
        description: 'Maximum results',
        example: '100'
      },
      {
        name: 'type',
        type: 'string',
        required: false,
        description: 'Filter by type (upload, generation, etc)'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'History retrieved',
        example: '{"events": [{"id": "evt_123", "type": "upload", "timestamp": "2024-02-11T12:00:00Z"}]}'
      }
    ]
  },
  {
    id: 'history-delete',
    method: 'DELETE',
    path: '/api/history/{id}',
    summary: 'Delete history entry',
    description: 'Remove a history entry',
    auth: 'token',
    rateLimit: 'Unlimited',
    category: 'History',
    parameters: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'History entry ID'
      }
    ],
    responses: [
      {
        code: 204,
        description: 'Entry deleted',
        example: ''
      }
    ]
  },

  // Feedback Endpoints
  {
    id: 'feedback-submit',
    method: 'POST',
    path: '/api/feedback/submit',
    summary: 'Submit feedback',
    description: 'Submit user feedback, bug reports, or feature requests',
    auth: 'token',
    rateLimit: '100/day',
    category: 'Feedback',
    parameters: [
      {
        name: 'type',
        type: 'string',
        required: true,
        description: 'Feedback type (bug, feature, suggestion)'
      },
      {
        name: 'message',
        type: 'string',
        required: true,
        description: 'Feedback message'
      },
      {
        name: 'attachments',
        type: 'array',
        required: false,
        description: 'File IDs to attach'
      }
    ],
    responses: [
      {
        code: 201,
        description: 'Feedback submitted',
        example: '{"id": "fb_12345", "status": "received"}'
      }
    ]
  },
  {
    id: 'feedback-get',
    method: 'GET',
    path: '/api/feedback/{id}',
    summary: 'Get feedback status',
    description: 'Check status and response to submitted feedback',
    auth: 'token',
    rateLimit: 'Unlimited',
    category: 'Feedback',
    parameters: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'Feedback ID'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Feedback details',
        example: '{"id": "fb_12345", "status": "in_review", "response": "Thanks for your feedback!"}'
      }
    ]
  },
  {
    id: 'feedback-broadcast',
    method: 'POST',
    path: '/api/feedback/broadcast',
    summary: 'Broadcast message',
    description: 'Send message to all users (admin only)',
    auth: 'admin',
    rateLimit: '10/day',
    category: 'Feedback',
    parameters: [
      {
        name: 'message',
        type: 'string',
        required: true,
        description: 'Message to broadcast'
      },
      {
        name: 'target_group',
        type: 'string',
        required: false,
        description: 'Target specific user group'
      }
    ],
    responses: [
      {
        code: 201,
        description: 'Message broadcasted',
        example: '{"id": "bc_12345", "recipients": 50000}'
      }
    ]
  },
  {
    id: 'feedback-snapshot',
    method: 'GET',
    path: '/api/feedback/snapshot',
    summary: 'Feedback snapshot',
    description: 'Get summary of recent feedback',
    auth: 'admin',
    rateLimit: 'Unlimited',
    category: 'Feedback',
    parameters: [],
    responses: [
      {
        code: 200,
        description: 'Snapshot returned',
        example: '{"total": 1250, "by_type": {"bug": 450, "feature": 800}}'
      }
    ]
  },
  {
    id: 'feedback-drift',
    method: 'GET',
    path: '/api/feedback/drift',
    summary: 'Sentiment drift analysis',
    description: 'Analyze sentiment trends over time',
    auth: 'admin',
    rateLimit: 'Unlimited',
    category: 'Feedback',
    parameters: [
      {
        name: 'period',
        type: 'string',
        required: false,
        description: '7d, 30d, or 90d',
        example: '30d'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Drift analysis',
        example: '{"trend": "improving", "sentiment_change": 5.2}'
      }
    ]
  },

  // Comparison Endpoints
  {
    id: 'comparison-create',
    method: 'POST',
    path: '/api/comparison/create',
    summary: 'Create comparison',
    description: 'Create a comparison between design versions',
    auth: 'token',
    rateLimit: '100/day',
    category: 'Comparison',
    parameters: [
      {
        name: 'before_id',
        type: 'string',
        required: true,
        description: 'Before version ID'
      },
      {
        name: 'after_id',
        type: 'string',
        required: true,
        description: 'After version ID'
      }
    ],
    responses: [
      {
        code: 201,
        description: 'Comparison created',
        example: '{"id": "cmp_12345", "viewer_url": "https://app.example.com/compare/cmp_12345"}'
      }
    ]
  },
  {
    id: 'comparison-list',
    method: 'GET',
    path: '/api/comparison/list',
    summary: 'List comparisons',
    description: 'Get all comparisons for a project',
    auth: 'token',
    rateLimit: 'Unlimited',
    category: 'Comparison',
    parameters: [
      {
        name: 'project_id',
        type: 'string',
        required: false,
        description: 'Filter by project'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Comparisons listed',
        example: '{"comparisons": [{"id": "cmp_12345", "created_at": "2024-02-11T12:00:00Z"}]}'
      }
    ]
  },
  {
    id: 'comparison-record',
    method: 'POST',
    path: '/api/comparison/record-choice',
    summary: 'Record preference',
    description: 'Record user preference between compared versions',
    auth: 'token',
    rateLimit: '1000/day',
    category: 'Comparison',
    parameters: [
      {
        name: 'comparison_id',
        type: 'string',
        required: true,
        description: 'Comparison ID'
      },
      {
        name: 'preferred_version',
        type: 'string',
        required: true,
        description: 'before or after'
      }
    ],
    responses: [
      {
        code: 201,
        description: 'Choice recorded',
        example: '{"recorded": true}'
      }
    ]
  },

  // Uploads Endpoints
  {
    id: 'uploads-image',
    method: 'POST',
    path: '/api/uploads/image',
    summary: 'Upload image',
    description: 'Upload image asset',
    auth: 'token',
    rateLimit: '500/day',
    category: 'Uploads',
    parameters: [
      {
        name: 'file',
        type: 'file',
        required: true,
        description: 'Image file (JPG, PNG, WebP)'
      },
      {
        name: 'optimize',
        type: 'boolean',
        required: false,
        description: 'Auto-optimize image',
        example: 'true'
      }
    ],
    responses: [
      {
        code: 201,
        description: 'Image uploaded',
        example: '{"id": "img_12345", "url": "https://cdn.example.com/image.jpg", "size": 1048576}'
      }
    ]
  },
  {
    id: 'uploads-asset',
    method: 'POST',
    path: '/api/uploads/asset',
    summary: 'Upload asset',
    description: 'Upload design asset (SVG, icon, etc)',
    auth: 'token',
    rateLimit: '500/day',
    category: 'Uploads',
    parameters: [
      {
        name: 'file',
        type: 'file',
        required: true,
        description: 'Asset file'
      },
      {
        name: 'category',
        type: 'string',
        required: false,
        description: 'Asset category'
      }
    ],
    responses: [
      {
        code: 201,
        description: 'Asset uploaded',
        example: '{"id": "ast_12345", "url": "https://cdn.example.com/asset.svg"}'
      }
    ]
  },
  {
    id: 'uploads-font',
    method: 'POST',
    path: '/api/uploads/font',
    summary: 'Upload font',
    description: 'Upload custom font file',
    auth: 'token',
    rateLimit: '50/day',
    category: 'Uploads',
    parameters: [
      {
        name: 'file',
        type: 'file',
        required: true,
        description: 'Font file (TTF, OTF, WOFF)'
      },
      {
        name: 'family_name',
        type: 'string',
        required: true,
        description: 'Font family name'
      }
    ],
    responses: [
      {
        code: 201,
        description: 'Font uploaded',
        example: '{"id": "fnt_12345", "family_name": "CustomFont", "url": "https://cdn.example.com/font.woff2"}'
      }
    ]
  },

  // Jobs Endpoints
  {
    id: 'jobs-progress',
    method: 'GET',
    path: '/api/jobs/progress/{job_id}',
    summary: 'Stream job progress',
    description: 'Stream real-time progress updates using Server-Sent Events',
    auth: 'token',
    rateLimit: 'Unlimited',
    category: 'Jobs',
    parameters: [
      {
        name: 'job_id',
        type: 'string',
        required: true,
        description: 'Job ID',
        example: 'job_12345'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Event stream',
        example: 'data: {"type": "progress", "percent": 45, "message": "Processing..."}\\n\\n'
      }
    ]
  },

  // Community Endpoints
  {
    id: 'community-gallery',
    method: 'GET',
    path: '/api/community/gallery',
    summary: 'Community gallery',
    description: 'Browse shared community designs',
    auth: 'token',
    rateLimit: 'Unlimited',
    category: 'Community',
    parameters: [
      {
        name: 'sort',
        type: 'string',
        required: false,
        description: 'Sort by (trending, recent, popular)',
        example: 'trending'
      },
      {
        name: 'limit',
        type: 'integer',
        required: false,
        description: 'Results limit'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Gallery items',
        example: '{"items": [{"id": "gal_123", "title": "Design Title", "author": "user123"}]}'
      }
    ]
  },
  {
    id: 'community-posts',
    method: 'GET',
    path: '/api/community/posts',
    summary: 'Community posts',
    description: 'Get community discussion posts',
    auth: 'token',
    rateLimit: 'Unlimited',
    category: 'Community',
    parameters: [
      {
        name: 'topic',
        type: 'string',
        required: false,
        description: 'Filter by topic'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Posts retrieved',
        example: '{"posts": [{"id": "pst_123", "title": "Discussion", "replies": 15}]}'
      }
    ]
  },
  {
    id: 'community-prompts',
    method: 'GET',
    path: '/api/community/prompts',
    summary: 'Community prompts',
    description: 'Get shared AI generation prompts',
    auth: 'token',
    rateLimit: 'Unlimited',
    category: 'Community',
    parameters: [
      {
        name: 'tags',
        type: 'array',
        required: false,
        description: 'Filter by tags'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Prompts retrieved',
        example: '{"prompts": [{"id": "prm_123", "text": "Professional logo", "uses": 450}]}'
      }
    ]
  },
  {
    id: 'community-collections',
    method: 'GET',
    path: '/api/community/collections',
    summary: 'Design collections',
    description: 'Get curated design collections',
    auth: 'token',
    rateLimit: 'Unlimited',
    category: 'Community',
    parameters: [],
    responses: [
      {
        code: 200,
        description: 'Collections retrieved',
        example: '{"collections": [{"id": "col_123", "name": "Modern UI", "items": 50}]}'
      }
    ]
  },
  {
    id: 'community-follows',
    method: 'GET',
    path: '/api/community/follows',
    summary: 'Followed designers',
    description: 'Get list of followed designers and updates',
    auth: 'token',
    rateLimit: 'Unlimited',
    category: 'Community',
    parameters: [],
    responses: [
      {
        code: 200,
        description: 'Follows retrieved',
        example: '{"follows": [{"user_id": "usr_123", "username": "designer_pro"}]}'
      }
    ]
  },
  {
    id: 'community-remix',
    method: 'POST',
    path: '/api/community/remix',
    summary: 'Remix design',
    description: 'Create remix of community design',
    auth: 'token',
    rateLimit: '100/day',
    category: 'Community',
    parameters: [
      {
        name: 'design_id',
        type: 'string',
        required: true,
        description: 'Original design ID'
      }
    ],
    responses: [
      {
        code: 201,
        description: 'Remix created',
        example: '{"id": "remix_12345", "original_id": "design_123"}'
      }
    ]
  },
  {
    id: 'community-users',
    method: 'GET',
    path: '/api/community/users',
    summary: 'Search users',
    description: 'Search for community users',
    auth: 'token',
    rateLimit: 'Unlimited',
    category: 'Community',
    parameters: [
      {
        name: 'query',
        type: 'string',
        required: false,
        description: 'Search query'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Users retrieved',
        example: '{"users": [{"id": "usr_123", "username": "designer123"}]}'
      }
    ]
  },
  {
    id: 'community-telemetry',
    method: 'POST',
    path: '/api/community/telemetry',
    summary: 'Record interaction',
    description: 'Record view, like, or share interaction',
    auth: 'token',
    rateLimit: '1000/day',
    category: 'Community',
    parameters: [
      {
        name: 'design_id',
        type: 'string',
        required: true,
        description: 'Design ID'
      },
      {
        name: 'event',
        type: 'string',
        required: true,
        description: 'Event type (view, like, share)'
      }
    ],
    responses: [
      {
        code: 201,
        description: 'Event recorded',
        example: '{"recorded": true}'
      }
    ]
  },

  // Marketplace Endpoints
  {
    id: 'marketplace-catalog',
    method: 'GET',
    path: '/api/marketplace/catalog',
    summary: 'Marketplace catalog',
    description: 'Browse marketplace templates and assets',
    auth: 'key',
    rateLimit: '1000/hour',
    category: 'Marketplace',
    parameters: [
      {
        name: 'category',
        type: 'string',
        required: false,
        description: 'Filter by category'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Catalog retrieved',
        example: '{"items": [{"id": "mkt_123", "name": "Template", "price": 29.99}]}'
      }
    ]
  },
  {
    id: 'marketplace-usage',
    method: 'GET',
    path: '/api/marketplace/usage',
    summary: 'Usage metrics',
    description: 'Get marketplace usage and analytics',
    auth: 'key',
    rateLimit: '100/hour',
    category: 'Marketplace',
    parameters: [],
    responses: [
      {
        code: 200,
        description: 'Usage data',
        example: '{"total_downloads": 5000, "revenue": 150000}'
      }
    ]
  },
  {
    id: 'marketplace-sample',
    method: 'GET',
    path: '/api/marketplace/sample/{id}',
    summary: 'Get sample',
    description: 'Download sample of marketplace item',
    auth: 'key',
    rateLimit: '100/hour',
    category: 'Marketplace',
    parameters: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'Item ID'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Sample provided',
        example: '{"url": "https://cdn.example.com/sample.zip"}'
      }
    ]
  },
  {
    id: 'marketplace-data',
    method: 'GET',
    path: '/api/marketplace/data',
    summary: 'Export data',
    description: 'Export marketplace data for analysis',
    auth: 'key',
    rateLimit: '10/hour',
    category: 'Marketplace',
    parameters: [
      {
        name: 'format',
        type: 'string',
        required: false,
        description: 'Export format (json, csv)',
        example: 'csv'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Data exported',
        example: '{"url": "https://cdn.example.com/data.csv", "expires_in": 3600}'
      }
    ]
  },

  // Admin Endpoints
  {
    id: 'admin-analytics',
    method: 'GET',
    path: '/api/admin/analytics',
    summary: 'Analytics dashboard',
    description: 'Get platform analytics and metrics (admin only)',
    auth: 'admin',
    rateLimit: '100/hour',
    category: 'Admin',
    parameters: [
      {
        name: 'period',
        type: 'string',
        required: false,
        description: '7d, 30d, 90d, or 365d',
        example: '30d'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Analytics data',
        example: '{"active_users": 50000, "revenue": 500000, "growth": 15.2}'
      }
    ]
  },
  {
    id: 'admin-logs',
    method: 'GET',
    path: '/api/admin/access-logs',
    summary: 'Access logs',
    description: 'View API access and error logs',
    auth: 'admin',
    rateLimit: 'Unlimited',
    category: 'Admin',
    parameters: [
      {
        name: 'limit',
        type: 'integer',
        required: false,
        description: 'Results limit'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Logs retrieved',
        example: '{"logs": [{"timestamp": "2024-02-11T12:00:00Z", "endpoint": "/api/files/upload"}]}'
      }
    ]
  },
  {
    id: 'admin-buyers',
    method: 'GET',
    path: '/api/admin/buyers',
    summary: 'Buyer management',
    description: 'Manage marketplace buyers',
    auth: 'admin',
    rateLimit: 'Unlimited',
    category: 'Admin',
    parameters: [
      {
        name: 'status',
        type: 'string',
        required: false,
        description: 'Filter by status'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Buyers retrieved',
        example: '{"buyers": [{"id": "buyer_123", "total_spent": 5000}]}'
      }
    ]
  },
  {
    id: 'admin-products',
    method: 'GET',
    path: '/api/admin/products',
    summary: 'Product management',
    description: 'Manage marketplace products',
    auth: 'admin',
    rateLimit: 'Unlimited',
    category: 'Admin',
    parameters: [],
    responses: [
      {
        code: 200,
        description: 'Products retrieved',
        example: '{"products": [{"id": "prod_123", "name": "Template", "status": "active"}]}'
      }
    ]
  },
  {
    id: 'admin-revenue',
    method: 'GET',
    path: '/api/admin/revenue',
    summary: 'Revenue reporting',
    description: 'Get detailed revenue reports',
    auth: 'admin',
    rateLimit: '100/hour',
    category: 'Admin',
    parameters: [
      {
        name: 'period',
        type: 'string',
        required: false,
        description: 'Reporting period'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Revenue data',
        example: '{"total": 500000, "by_source": {"templates": 300000, "assets": 200000}}'
      }
    ]
  },

  // Integration Endpoints
  {
    id: 'integration-design-analysis',
    method: 'POST',
    path: '/api/integration/design-analysis',
    summary: 'Design analysis',
    description: 'Analyze design for accessibility and best practices',
    auth: 'token',
    rateLimit: '100/day',
    category: 'Integration',
    parameters: [
      {
        name: 'project_id',
        type: 'string',
        required: true,
        description: 'Project ID'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Analysis complete',
        example: '{"issues": 5, "warnings": 12, "score": 78}'
      }
    ]
  },
  {
    id: 'integration-sandbox',
    method: 'POST',
    path: '/api/integration/sandbox-transfer',
    summary: 'Transfer to sandbox',
    description: 'Transfer design to sandbox environment for testing',
    auth: 'token',
    rateLimit: '50/day',
    category: 'Integration',
    parameters: [
      {
        name: 'project_id',
        type: 'string',
        required: true,
        description: 'Project ID'
      }
    ],
    responses: [
      {
        code: 201,
        description: 'Transfer started',
        example: '{"sandbox_id": "snd_12345", "url": "https://sandbox.example.com/snd_12345"}'
      }
    ]
  },
  {
    id: 'integration-telemetry',
    method: 'POST',
    path: '/api/integration/telemetry-bridge',
    summary: 'Telemetry bridge',
    description: 'Bridge telemetry data from external services',
    auth: 'token',
    rateLimit: '1000/hour',
    category: 'Integration',
    parameters: [
      {
        name: 'service',
        type: 'string',
        required: true,
        description: 'External service name'
      },
      {
        name: 'data',
        type: 'object',
        required: true,
        description: 'Telemetry data'
      }
    ],
    responses: [
      {
        code: 201,
        description: 'Data bridged',
        example: '{"recorded": true}'
      }
    ]
  },

  // Webhooks Endpoints
  {
    id: 'webhooks-stripe',
    method: 'POST',
    path: '/api/webhooks/stripe',
    summary: 'Stripe webhook',
    description: 'Receive Stripe payment webhook events',
    auth: 'webhook',
    rateLimit: 'Unlimited',
    category: 'Webhooks',
    parameters: [],
    responses: [
      {
        code: 200,
        description: 'Event processed',
        example: '{"received": true}'
      }
    ]
  },

  // SMS/Cowork Endpoints
  {
    id: 'sms-send',
    method: 'POST',
    path: '/api/sms/send',
    summary: 'Send SMS',
    description: 'Send SMS message via Twilio',
    auth: 'token',
    rateLimit: '100/hour',
    category: 'SMS/Cowork',
    parameters: [
      {
        name: 'to',
        type: 'string',
        required: true,
        description: 'Phone number'
      },
      {
        name: 'message',
        type: 'string',
        required: true,
        description: 'Message text'
      }
    ],
    responses: [
      {
        code: 201,
        description: 'SMS sent',
        example: '{"id": "sms_12345", "status": "queued"}'
      }
    ]
  },
  {
    id: 'sms-inbound',
    method: 'POST',
    path: '/api/sms/inbound',
    summary: 'Inbound SMS webhook',
    description: 'Receive inbound SMS messages',
    auth: 'webhook',
    rateLimit: 'Unlimited',
    category: 'SMS/Cowork',
    parameters: [],
    responses: [
      {
        code: 200,
        description: 'Message received',
        example: '{"received": true}'
      }
    ]
  },
  {
    id: 'sms-process',
    method: 'POST',
    path: '/api/sms/process',
    summary: 'Process SMS command',
    description: 'Process command from SMS message',
    auth: 'token',
    rateLimit: '100/hour',
    category: 'SMS/Cowork',
    parameters: [
      {
        name: 'message_id',
        type: 'string',
        required: true,
        description: 'SMS message ID'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Command processed',
        example: '{"processed": true}'
      }
    ]
  },
  {
    id: 'sms-status',
    method: 'GET',
    path: '/api/sms/status/{id}',
    summary: 'SMS status',
    description: 'Check SMS delivery status',
    auth: 'token',
    rateLimit: 'Unlimited',
    category: 'SMS/Cowork',
    parameters: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'SMS ID'
      }
    ],
    responses: [
      {
        code: 200,
        description: 'Status returned',
        example: '{"status": "delivered", "timestamp": "2024-02-11T12:00:00Z"}'
      }
    ]
  },
  {
    id: 'sms-reply',
    method: 'POST',
    path: '/api/sms/reply',
    summary: 'Reply to SMS',
    description: 'Send reply to inbound SMS',
    auth: 'token',
    rateLimit: '100/hour',
    category: 'SMS/Cowork',
    parameters: [
      {
        name: 'message_id',
        type: 'string',
        required: true,
        description: 'Original message ID'
      },
      {
        name: 'reply',
        type: 'string',
        required: true,
        description: 'Reply text'
      }
    ],
    responses: [
      {
        code: 201,
        description: 'Reply sent',
        example: '{"id": "sms_12346", "status": "queued"}'
      }
    ]
  }
];

// ============================================================================
// CATEGORIES WITH INFO
// ============================================================================

const CATEGORIES: Record<string, { name: string; description: string; count: number }> = {};

API_ENDPOINTS.forEach(endpoint => {
  if (!CATEGORIES[endpoint.category]) {
    CATEGORIES[endpoint.category] = {
      name: endpoint.category,
      description: '',
      count: 0
    };
  }
  CATEGORIES[endpoint.category].count += 1;
});

// Add descriptions
const categoryDescriptions: Record<string, string> = {
  Health: 'Service health and status monitoring',
  'AI Tools': 'AI-powered design and image processing',
  Files: 'File management and storage',
  Formats: 'Format conversion and export',
  Generation: 'AI design generation',
  History: 'Operation and change history',
  Feedback: 'User feedback and messaging',
  Comparison: 'Design version comparison',
  Uploads: 'Asset and file uploads',
  Jobs: 'Long-running job tracking',
  Community: 'Community and social features',
  Marketplace: 'Marketplace and commerce',
  Admin: 'Administrative functions',
  Integration: 'Third-party integrations',
  Webhooks: 'Webhook event handling',
  'SMS/Cowork': 'SMS and collaborative tools'
};

Object.keys(CATEGORIES).forEach(cat => {
  CATEGORIES[cat].description = categoryDescriptions[cat] || '';
});

// ============================================================================
// COMPONENT
// ============================================================================

export default function ApiDocsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(CATEGORIES))
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tryItData, setTryItData] = useState<Record<string, Record<string, string>>>({});
  const [responses, setResponses] = useState<Record<string, { status: 'pending' | 'success' | 'error'; data: string }>>(
    {}
  );

  // Filter endpoints based on search
  const filteredEndpoints = useMemo(() => {
    if (!searchQuery.trim()) return API_ENDPOINTS;

    const query = searchQuery.toLowerCase();
    return API_ENDPOINTS.filter(
      endpoint =>
        endpoint.path.toLowerCase().includes(query) ||
        endpoint.summary.toLowerCase().includes(query) ||
        endpoint.description.toLowerCase().includes(query) ||
        endpoint.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Group endpoints by category
  const groupedEndpoints = useMemo(() => {
    const groups: Record<string, ApiEndpoint[]> = {};
    filteredEndpoints.forEach(endpoint => {
      if (!groups[endpoint.category]) {
        groups[endpoint.category] = [];
      }
      groups[endpoint.category].push(endpoint);
    });
    return groups;
  }, [filteredEndpoints]);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const toggleEndpoint = useCallback((id: string) => {
    setExpandedEndpoints(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleTryIt = useCallback(async (endpoint: ApiEndpoint) => {
    const endpointId = endpoint.id;
    setResponses(prev => ({
      ...prev,
      [endpointId]: { status: 'pending', data: '' }
    }));

    try {
      // Build request options from endpoint definition
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const fetchOptions: RequestInit = {
        method: endpoint.method === 'SSE' ? 'GET' : endpoint.method,
        headers,
      };

      // Include sample body for POST/PUT/PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(endpoint.method) && endpoint.parameters?.length) {
        const sampleBody: Record<string, unknown> = {};
        for (const param of endpoint.parameters) {
          if (param.example) {
            try {
              sampleBody[param.name] = JSON.parse(param.example);
            } catch {
              sampleBody[param.name] = param.example;
            }
          }
        }
        if (Object.keys(sampleBody).length > 0) {
          fetchOptions.body = JSON.stringify(sampleBody);
        }
      }

      const response = await fetch(endpoint.path, fetchOptions);
      const contentType = response.headers.get('content-type') || '';
      let data: string;

      if (contentType.includes('application/json')) {
        const json = await response.json();
        data = JSON.stringify(json, null, 2);
      } else {
        data = await response.text();
      }

      const statusLabel = response.ok ? 'success' : 'error';
      setResponses(prev => ({
        ...prev,
        [endpointId]: {
          status: statusLabel,
          data: `HTTP ${response.status} ${response.statusText}\n\n${data}`,
        }
      }));
    } catch (err) {
      // Network error or auth redirect — fall back to showing the example response
      const fallbackData = JSON.stringify(
        JSON.parse(endpoint.responses[0].example || '{}'),
        null,
        2
      );
      setResponses(prev => ({
        ...prev,
        [endpointId]: {
          status: 'error',
          data: `Request failed: ${err instanceof Error ? err.message : String(err)}\n\nExample response:\n${fallbackData}`,
        }
      }));
    }
  }, []);

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <div className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.sidebarTitle}>Idesaign API</h1>
          <p className={styles.sidebarSubtitle}>v1.0 Documentation</p>
        </div>

        {/* API Overview */}
        <div className={styles.categorySection}>
          <div
            className={styles.categoryHeader}
            onClick={() => toggleCategory('overview')}
          >
            <span className={styles.categoryToggle}>›</span>
            <span>Overview</span>
          </div>
        </div>

        {/* Categories */}
        {Object.entries(CATEGORIES).map(([categoryKey, categoryInfo]) => (
          <div key={categoryKey} className={styles.categorySection}>
            <div
              className={styles.categoryHeader}
              onClick={() => toggleCategory(categoryKey)}
            >
              <span
                className={`${styles.categoryToggle} ${
                  !expandedCategories.has(categoryKey) ? styles.collapsed : ''
                }`}
              >
                ›
              </span>
              <span>{categoryKey}</span>
              <span className={styles.categoryCount}>{categoryInfo.count}</span>
            </div>

            <div
              className={`${styles.categoryItems} ${
                !expandedCategories.has(categoryKey) ? styles.collapsed : ''
              }`}
            >
              {API_ENDPOINTS.filter(e => e.category === categoryKey).map(endpoint => (
                <div
                  key={endpoint.id}
                  className={`${styles.endpointLink} ${
                    expandedEndpoints.has(endpoint.id) ? styles.active : ''
                  }`}
                  onClick={() => toggleEndpoint(endpoint.id)}
                >
                  <span className={`${styles.methodBadge} ${styles[endpoint.method.toLowerCase()]}`}>
                    {endpoint.method === 'SSE' ? 'SSE' : endpoint.method.substring(0, 3)}
                  </span>
                  <span style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {endpoint.path.split('/').pop()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className={styles.main}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.headerTitle}>API Documentation</h1>
            <div className={styles.searchContainer}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search endpoints..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Authentication Section */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Authentication</h2>
            <p className={styles.sectionDescription}>
              The Idesaign API uses multiple authentication methods depending on the endpoint. Include your credentials in the request header.
            </p>

            <div className={styles.endpointCard}>
              <div className={styles.endpointHeader}>
                <span className={styles.endpointSummary}>Bearer Token (Firebase ID)</span>
              </div>
              <div className={styles.endpointContent}>
                <div className={styles.detailGroup}>
                  <p className={styles.sectionDescription}>
                    Most endpoints require a Firebase ID token. Include it in the Authorization header:
                  </p>
                  <pre className={styles.codeBlock}>
                    {`Authorization: Bearer YOUR_FIREBASE_ID_TOKEN`}
                  </pre>
                </div>
              </div>
            </div>

            <div className={styles.endpointCard}>
              <div className={styles.endpointHeader}>
                <span className={styles.endpointSummary}>API Key</span>
              </div>
              <div className={styles.endpointContent}>
                <div className={styles.detailGroup}>
                  <p className={styles.sectionDescription}>
                    Marketplace endpoints require an API key:
                  </p>
                  <pre className={styles.codeBlock}>
                    {`X-API-Key: YOUR_API_KEY`}
                  </pre>
                </div>
              </div>
            </div>

            <div className={styles.endpointCard}>
              <div className={styles.endpointHeader}>
                <span className={styles.endpointSummary}>Admin Token</span>
              </div>
              <div className={styles.endpointContent}>
                <div className={styles.detailGroup}>
                  <p className={styles.sectionDescription}>
                    Admin endpoints require an admin access token:
                  </p>
                  <pre className={styles.codeBlock}>
                    {`X-Admin-Token: YOUR_ADMIN_TOKEN`}
                  </pre>
                </div>
              </div>
            </div>

            <div className={styles.infoBox}>
              <strong>Rate Limiting:</strong> Each endpoint has its own rate limit. Check individual endpoint documentation for limits. Rate limit status is included in response headers.
            </div>
          </div>

          {/* Endpoints by Category */}
          {Object.entries(groupedEndpoints).map(([category, endpoints]) => (
            <div key={category} className={styles.section}>
              <h2 className={styles.sectionTitle}>{category}</h2>
              <p className={styles.sectionDescription}>{CATEGORIES[category]?.description}</p>

              {endpoints.map(endpoint => (
                <EndpointCard
                  key={endpoint.id}
                  endpoint={endpoint}
                  isExpanded={expandedEndpoints.has(endpoint.id)}
                  onToggle={() => toggleEndpoint(endpoint.id)}
                  onTryIt={() => handleTryIt(endpoint)}
                  response={responses[endpoint.id]}
                />
              ))}
            </div>
          ))}

          {/* Empty state */}
          {filteredEndpoints.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>🔍</div>
              <h3 className={styles.emptyStateTitle}>No endpoints found</h3>
              <p className={styles.emptyStateDescription}>
                Try adjusting your search query
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ENDPOINT CARD COMPONENT
// ============================================================================

interface EndpointCardProps {
  endpoint: ApiEndpoint;
  isExpanded: boolean;
  onToggle: () => void;
  onTryIt: () => void;
  response?: { status: 'pending' | 'success' | 'error'; data: string };
}

function EndpointCard({ endpoint, isExpanded, onToggle, onTryIt, response }: EndpointCardProps) {
  const [authColor] = useState(
    endpoint.auth === 'token'
      ? 'blue'
      : endpoint.auth === 'key'
      ? 'green'
      : endpoint.auth === 'admin'
      ? 'red'
      : 'purple'
  );

  return (
    <div className={styles.endpointCard}>
      <div className={styles.endpointHeader} onClick={onToggle}>
        <span className={`${styles.endpointToggle} ${!isExpanded ? styles.collapsed : ''}`}>
          ›
        </span>
        <div className={`${styles.methodBadge} ${styles[endpoint.method.toLowerCase()]}`}>
          {endpoint.method === 'SSE' ? 'SSE' : endpoint.method.substring(0, 3)}
        </div>
        <div className={styles.endpointPath}>{endpoint.path}</div>
        <div className={styles.endpointSummary}>{endpoint.summary}</div>
      </div>

      <div className={`${styles.endpointContent} ${!isExpanded ? styles.collapsed : ''}`}>
        {/* Description */}
        <div className={styles.detailGroup}>
          <div className={styles.detailGroupTitle}>Description</div>
          <p style={{ color: '#c9d1d9', fontSize: '13px', margin: 0 }}>
            {endpoint.description}
          </p>
        </div>

        {/* Details */}
        <div className={styles.detailGroup}>
          <div className={styles.detailGroupTitle}>Details</div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Authentication:</span>
            <span className={styles.detailValue}>
              <span className={`${styles.authBadge} ${styles[endpoint.auth]}`}>
                {endpoint.auth.toUpperCase()}
              </span>
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Rate Limit:</span>
            <span className={styles.detailValue}>{endpoint.rateLimit}</span>
          </div>
        </div>

        {/* Parameters */}
        {endpoint.parameters.length > 0 && (
          <div className={styles.detailGroup}>
            <div className={styles.detailGroupTitle}>Parameters</div>
            <table className={styles.paramsTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Required</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {endpoint.parameters.map((param, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className={styles.paramName}>{param.name}</span>
                    </td>
                    <td>
                      <span className={styles.paramType}>{param.type}</span>
                    </td>
                    <td>
                      {param.required ? (
                        <span className={styles.paramRequired}>Required</span>
                      ) : (
                        <span className={styles.paramOptional}>Optional</span>
                      )}
                    </td>
                    <td>
                      <span className={styles.paramDescription}>{param.description}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Responses */}
        <div className={styles.detailGroup}>
          <div className={styles.detailGroupTitle}>Responses</div>
          {endpoint.responses.map((resp, idx) => (
            <div key={idx} style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#c9d1d9', marginBottom: '4px' }}>
                {resp.code} {resp.description}
              </div>
              {resp.example && (
                <pre className={styles.codeBlock}>{resp.example}</pre>
              )}
            </div>
          ))}
        </div>

        {/* Try It Panel */}
        <div className={styles.tryItPanel}>
          <div className={styles.tryItHeader}>
            <span className={styles.tryItIcon}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
            </span>
            Try It Out
          </div>

          <div className={styles.formActions}>
            <button className={styles.buttonPrimary} onClick={onTryIt}>
              Send Request
            </button>
            {response && (
              <div
                style={{
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: response.status === 'success' ? '#3fb950' : '#ff7b72'
                }}
              >
                {response.status === 'pending' && <span className={styles.loading} />}
                {response.status === 'success' && '✓ Success'}
                {response.status === 'error' && '✗ Error'}
              </div>
            )}
          </div>

          {response && response.data && (
            <div className={styles.responsePanel}>
              <div className={`${styles.responseStatus} ${styles[response.status]}`}>
                <span className={`${styles.statusDot} ${styles[response.status]}`} />
                {response.status === 'success' ? '200 OK' : 'Error'}
              </div>
              <pre className={styles.codeBlock}>{response.data}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
