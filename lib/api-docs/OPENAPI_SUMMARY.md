# Idesaign API - OpenAPI 3.1.0 Specification

## Overview

Comprehensive OpenAPI 3.1.0 specification for the Idesaign API - a Next.js 15 AI-powered image processing and generation platform.

**File:** `/lib/api-docs/openapi.json`
**Version:** 1.0.0
**Format:** OpenAPI 3.1.0 (JSON)
**Size:** ~92KB
**Total Lines:** 3,379

## Specification Statistics

- **Endpoints:** 36 paths
- **Tags:** 16 route groups
- **Schemas:** 15 reusable components
- **Security Schemes:** 3 (BearerAuth, ApiKeyAuth, AdminAuth)

## Route Groups & Endpoints

### Health (2 endpoints)
- `GET /api/health` - Basic health check
- `GET /api/health/deep` - Deep health check (Redis, cache, queue)

### AI Tools (8 endpoints)
- `POST /api/studio/ai/detect-faces` - Face detection
- `POST /api/studio/ai/enhance-portrait` - Portrait enhancement
- `POST /api/studio/ai/inpaint` - Mask-based inpainting
- `POST /api/studio/ai/remove-bg` - Background removal
- `POST /api/studio/ai/remove-object` - Object removal
- `POST /api/studio/ai/style-transfer` - Style transfer (sync/async)
- `POST /api/studio/ai/text-edit` - Natural language image editing
- `POST /api/studio/ai/upscale` - Image upscaling (2x/4x)

### Files (3 endpoints)
- `POST /api/studio/files/upload` - File upload (50MB max)
- `GET /api/studio/files/list` - List user files with pagination
- `DELETE /api/studio/files/delete` - Delete file

### Formats (4 endpoints)
- `GET /api/studio/formats` - List export formats
- `POST /api/studio/formats/export-psd` - PSD export (sync/async)
- `POST /api/studio/formats/export-tiff` - TIFF export (sync/async)
- `POST /api/studio/formats/process-raw` - RAW processing (async)

### Generation (6 endpoints)
- `POST /api/studio/generate/{model}` - Generate images
- `GET /api/studio/generate/{model}` - Model info
- `POST /api/studio/generate/estimate` - Cost estimation
- `GET /api/studio/generate/estimate` - List models
- `POST/GET /api/studio/generate/status` - Job status
- `POST/GET /api/studio/generate/batch` - Batch generation

### History (2 endpoints)
- `GET /api/studio/history/list` - List generation history
- `DELETE /api/studio/history/{resultId}` - Delete history entry

### Feedback & Preferences (2 endpoints)
- `POST /api/studio/feedback/submit` - Submit feedback
- `GET /api/studio/feedback/{resultId}` - Get feedback

### Uploads (1 endpoint)
- `POST /api/studio/upload/image` - Upload image

### Jobs (1 endpoint)
- `GET /api/studio/jobs/{jobId}/progress` - SSE/JSON progress

### Community (2 endpoints)
- `GET /api/studio/community` - API docs
- `GET/POST /api/studio/community/gallery` - Gallery

### Marketplace (2 endpoints)
- `GET /api/studio/marketplace/catalog` - Catalog
- `GET /api/studio/marketplace/usage` - Usage report

### Admin (2 endpoints)
- `GET /api/studio/admin/analytics` - Revenue analytics
- `GET /api/studio/admin/access-logs` - Access logs

### SMS/Cowork (2 endpoints)
- `POST /api/cowork/sms/send` - Send SMS
- `GET /api/cowork/sms/status` - SMS status

### Webhooks (1 endpoint)
- `POST /api/studio/webhooks/stripe` - Stripe webhooks

## Security Schemes

### BearerAuth (HTTP Bearer)
- Type: HTTP
- Scheme: bearer
- Format: JWT
- Use: Firebase ID token for user authentication

### ApiKeyAuth (API Key)
- Type: apiKey
- In: header (X-API-Key)
- Use: Marketplace and integration access

### AdminAuth (HTTP Bearer)
- Type: HTTP
- Scheme: bearer
- Format: JWT
- Use: Admin operations with elevated privileges

## Common Response Schemas

### HealthResponse
- status: "healthy" | "degraded" | "unhealthy"
- timestamp: ISO 8601 date-time
- version: string

### JobStatus
- jobId: string (required)
- status: "pending" | "processing" | "completed" | "failed" (required)
- progress: 0-100 percentage
- result: object with imageUrl/images arrays
- error: string (if failed)

### ErrorResponse
- error: string (required)
- message: string (required)
- statusCode: integer (required)
- timestamp: ISO 8601 date-time
- requestId: string

### Pagination
- page: integer
- limit: integer
- total: integer
- totalPages: integer
- hasNextPage: boolean
- hasPrevPage: boolean

## Standard HTTP Status Codes

- **200**: Success
- **400**: Bad Request (invalid parameters)
- **401**: Unauthorized (auth required/invalid)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **413**: Payload Too Large
- **429**: Too Many Requests (rate limit)
- **500**: Internal Server Error
- **503**: Service Unavailable

## Rate Limiting

Rate limit information is provided in response headers:
- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp of reset time
- `Retry-After`: Seconds until next request allowed (429 responses)

## Servers

- **Production**: https://idesaign.ai
- **Staging**: https://staging.idesaign.ai
- **Local**: http://localhost:3000

## Request/Response Formats

All endpoints use:
- **Content-Type**: application/json (except multipart file uploads)
- **Character Encoding**: UTF-8

## Authentication

All endpoints except health checks and webhooks require authentication via:
1. `Authorization: Bearer <firebase-id-token>` for user operations
2. `X-API-Key: <api-key>` for marketplace access
3. Admin token for administrative operations

## Notable Features

### Async Processing
Multiple endpoints support asynchronous processing:
- `style-transfer` (async parameter)
- `text-edit` (async parameter)
- `upscale` (async parameter)
- PSD/TIFF export
- RAW processing

### File Management
- Maximum upload size: 50MB
- Multipart form-data support
- Automatic cleanup policies

### Batch Operations
- Support for batch image generation (up to 10 jobs)
- Batch status tracking
- Progress reporting

### Real-time Monitoring
- Server-Sent Events (SSE) support for job progress
- JSON polling alternative
- Webhook support for Stripe events

## Usage Examples

### Generate Images
```
POST /api/studio/generate/dall-e-3
Content-Type: application/json
Authorization: Bearer <token>

{
  "prompt": "A serene mountain landscape at sunset",
  "width": 1024,
  "height": 1024,
  "steps": 50,
  "guidanceScale": 7.5,
  "quantity": 1
}
```

### Check Job Status
```
GET /api/studio/generate/status?jobId=<jobId>
Authorization: Bearer <token>
```

### Upload File
```
POST /api/studio/files/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

[file data]
```

## Validation

The OpenAPI specification has been validated as:
- ✓ Valid JSON syntax
- ✓ OpenAPI 3.1.0 compliant
- ✓ 36 unique endpoint paths
- ✓ 15 reusable component schemas
- ✓ Comprehensive error responses
- ✓ Security schemes properly defined

## Integration

This specification is suitable for:
- API documentation generation
- Client SDK generation (OpenAPI Generator, etc.)
- API mocking and testing
- Postman/Insomnia imports
- API testing tools (Dredd, etc.)
- SwaggerUI/ReDoc documentation portals
