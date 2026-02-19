# Idesaign API TypeScript SDK

A production-grade TypeScript SDK for the Idesaign API with full type safety, automatic retry logic, rate limiting support, and comprehensive error handling.

## Features

- **Full TypeScript Support**: Complete type definitions for all API operations
- **Automatic Retries**: Exponential backoff with jitter for transient failures
- **Rate Limit Handling**: Automatic retry on 429 responses with Retry-After support
- **Request/Response Interceptors**: Middleware pattern for customizing requests and responses
- **Event Emitter**: Listen to SDK events (requests, responses, errors, retries)
- **Token Refresh**: Callback support for automatic API key refresh
- **Browser & Node.js Compatible**: Works in any JavaScript environment with fetch
- **Request Cancellation**: AbortController support for canceling requests
- **Comprehensive Error Classes**: Specialized error types for different failure scenarios

## Installation

```bash
npm install @idesaign/sdk
```

## Quick Start

### Basic Setup

```typescript
import { IdesaignSDK } from '@idesaign/sdk';

const sdk = new IdesaignSDK({
  apiKey: 'your-api-key',
  // Optional: other configuration
});
```

### Authentication

```typescript
// Static API key
const sdk = new IdesaignSDK({
  apiKey: process.env.IDESAIGN_API_KEY,
});

// Dynamic token refresh
const sdk = new IdesaignSDK({
  apiKey: 'initial-api-key',
  onTokenRefresh: async () => {
    const newKey = await refreshMyToken();
    return newKey;
  },
});
```

### Configuration

```typescript
const sdk = new IdesaignSDK({
  apiKey: 'your-api-key',
  baseURL: 'https://api.idesaign.com/v1', // Custom API endpoint
  timeout: 30000,                          // Request timeout in ms
  maxRetries: 3,                           // Max retry attempts
  retryDelayMs: 1000,                      // Initial retry delay
  autoRetryRateLimit: true,                // Auto-retry on 429
  debug: true,                             // Enable debug logging
  headers: {                               // Custom headers
    'X-Custom-Header': 'value',
  },
  userAgent: 'MyApp/1.0',                 // Custom user agent
});
```

## Core Methods

### AI Tools

The SDK provides access to advanced AI image processing capabilities.

#### Face Detection

```typescript
const result = await sdk.ai.detectFaces({
  file: imageFile, // File | Buffer
});

console.log(result.faces); // Array of detected faces
console.log(result.faces[0].confidence);
```

#### Portrait Enhancement

```typescript
const result = await sdk.ai.enhancePortrait(
  { url: 'https://example.com/portrait.jpg' },
  {
    strength: 0.8,
    smoothSkin: true,
    enhanceEyes: true,
    brightness: 0.1,
  }
);

console.log(result.imageUrl);
```

#### Inpainting (Content-Aware Fill)

```typescript
const result = await sdk.ai.inpaint(
  { file: imageFile },
  { file: maskFile },
  'a red ball in the center',
  {
    strength: 0.9,
    steps: 50,
    guidanceScale: 7.5,
    negativePrompt: 'blurry, low quality',
  }
);
```

#### Background Removal

```typescript
const result = await sdk.ai.removeBackground(
  { file: imageFile },
  {
    threshold: 0.5,
    edgeSmoothing: 3,
    format: 'png',
    backgroundMode: 'transparent',
  }
);
```

#### Object Removal

```typescript
const result = await sdk.ai.removeObject(
  { file: imageFile },
  { file: maskFile },
  {
    method: 'generative',
    dilate: 5,
    blurEdges: true,
  }
);
```

#### Style Transfer

```typescript
const result = await sdk.ai.styleTransfer(
  { file: imageFile },
  'van-gogh',
  {
    intensity: 0.8,
    preserveColor: true,
  }
);
```

#### Text Editing

```typescript
const result = await sdk.ai.textEdit(
  { file: imageFile },
  'make the text bigger and bolder',
  {
    strength: 0.8,
    steps: 20,
    guidanceScale: 7.5,
  }
);
```

#### Image Upscaling

```typescript
const result = await sdk.ai.upscale(
  { file: imageFile },
  {
    scale: 4, // 2x, 3x, or 4x
    restoreFaces: true,
  }
);
```

### File Management

```typescript
// Upload file
const result = await sdk.files.upload(file, {
  projectId: 'project-123',
  metadata: { tags: 'portrait,enhancement' },
  onProgress: (loaded, total) => {
    console.log(`${(loaded / total * 100).toFixed(0)}%`);
  },
});

// List files
const files = await sdk.files.list({
  limit: 20,
  offset: 0,
  fileType: 'image',
  sort: 'created',
  direction: 'desc',
});

// Delete file
await sdk.files.delete('project-123');
```

### Image Generation

```typescript
// Generate images
const result = await sdk.generate.create(
  'a serene landscape with mountains and lake',
  {
    model: 'idesaign-v1',
    numImages: 2,
    size: 1024,
    quality: 'premium',
    guidanceScale: 7.5,
    steps: 30,
    seed: 12345,
    negativePrompt: 'distorted, blurry',
  }
);

console.log(result.images); // Array of generated images

// Estimate cost before generation
const estimate = await sdk.generate.estimate({
  prompt: 'my prompt',
  model: 'idesaign-v1',
  numImages: 4,
  size: 1024,
  quality: 'premium',
});

console.log(`Cost: ${estimate.estimatedCost} ${estimate.currency}`);
console.log(`Time: ${estimate.estimatedTime}ms`);

// Check generation status
const status = await sdk.generate.status('request-id');

// Batch generation
const batch = await sdk.generate.batch([
  { prompt: 'prompt 1', options: { numImages: 1 } },
  { prompt: 'prompt 2', options: { numImages: 2 } },
]);

// List available models
const models = await sdk.generate.listModels();
```

### History

```typescript
// List history
const history = await sdk.history.list({
  limit: 50,
  offset: 0,
  status: 'completed',
  tool: 'enhance-portrait',
  dateRange: {
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-01-31T23:59:59Z',
  },
  sort: 'created',
});

// Delete history entry
await sdk.history.delete('result-id');
```

### Model Comparison

```typescript
// Create comparison
const comparison = await sdk.comparison.create(
  'a beautiful sunset',
  'model-a-id',
  'model-b-id',
  {
    numImages: 2,
    size: 512,
  }
);

// List comparisons
const list = await sdk.comparison.list({
  limit: 20,
  offset: 0,
});

// Record choice
await sdk.comparison.recordChoice(
  comparison.comparisonId,
  'a', // or 'b' or 'tie'
  {
    reason: 'better quality',
    quality: 9,
    speed: 8,
  }
);
```

### Community Features

#### Gallery

```typescript
// List gallery items
const items = await sdk.community.gallery.list({ limit: 20 });

// Get gallery item
const item = await sdk.community.gallery.get('item-id');

// Like/Unlike
await sdk.community.gallery.like('item-id');
await sdk.community.gallery.unlike('item-id');

// Report
await sdk.community.gallery.report('item-id', 'inappropriate');
```

#### Prompts

```typescript
// List prompts
const prompts = await sdk.community.prompts.list({ limit: 20 });

// Get prompt
const prompt = await sdk.community.prompts.get('prompt-id');

// Create prompt
const created = await sdk.community.prompts.create({
  title: 'My Prompt',
  description: 'A great prompt',
  content: 'detailed prompt text',
  tags: ['landscape', 'nature'],
  category: 'landscape',
  isPublic: true,
});

// Fork prompt
const forked = await sdk.community.prompts.fork('prompt-id');

// Like/Unlike
await sdk.community.prompts.like('prompt-id');
```

#### Collections

```typescript
// List collections
const collections = await sdk.community.collections.list();

// Get collection
const collection = await sdk.community.collections.get('collection-id');

// Create collection
const created = await sdk.community.collections.create({
  title: 'My Collection',
  description: 'Collection of great images',
  items: ['item-1', 'item-2'],
  isPublic: true,
});

// Manage items
await sdk.community.collections.addItem('collection-id', 'item-id');
await sdk.community.collections.removeItem('collection-id', 'item-id');
```

#### Users

```typescript
// Get user profile
const user = await sdk.community.users.getProfile('user-id');

// Get current user
const me = await sdk.community.users.getMe();

// Update profile
const updated = await sdk.community.users.updateProfile({
  displayName: 'New Name',
  bio: 'My bio',
  avatar: { url: 'https://example.com/avatar.jpg' },
});

// Follow/Unfollow
await sdk.community.users.follow('user-id');
await sdk.community.users.unfollow('user-id');

// Get followers/following
const following = await sdk.community.users.getFollowing({ limit: 20 });
const followers = await sdk.community.users.getFollowers({ limit: 20 });
```

### Marketplace

```typescript
// Get catalog
const catalog = await sdk.marketplace.getCatalog();

// Get usage
const usage = await sdk.marketplace.getUsage({
  startDate: '2024-01-01T00:00:00Z',
  endDate: '2024-01-31T23:59:59Z',
});

// Get sample data
const sample = await sdk.marketplace.getSample('product-id');

// Query data
const data = await sdk.marketplace.getData('product-id', {
  filters: { country: 'US' },
  limit: 100,
  offset: 0,
  sort: '-date',
});
```

### Jobs

```typescript
// Get job progress
const progress = await sdk.jobs.getProgress('job-id');
console.log(`Progress: ${progress.progress}%`);

// Stream job progress
for await (const update of sdk.jobs.streamProgress('job-id')) {
  console.log(`Status: ${update.status}, Progress: ${update.progress}%`);
  if (update.result) {
    console.log('Job completed:', update.result);
  }
}
```

## Error Handling

### Error Types

The SDK provides specialized error classes for different failure scenarios:

```typescript
import { IdesaignSDK, ValidationError, RateLimitError } from '@idesaign/sdk';

try {
  const result = await sdk.generate.create('prompt');
} catch (error) {
  if (error instanceof ValidationError) {
    // Field validation failed
    console.log(error.fieldErrors);
    console.log(error.getFieldErrors('prompt'));
  } else if (error instanceof RateLimitError) {
    // Rate limit exceeded
    console.log(`Retry after ${error.retryAfter} seconds`);
    await new Promise(r => setTimeout(r, error.getRetryDelayMs()));
  } else if (error instanceof AuthenticationError) {
    // API key invalid
  } else if (error instanceof NotFoundError) {
    // Resource not found
  } else if (error instanceof ForbiddenError) {
    // Access denied
  } else if (error instanceof ServerError) {
    // Server error (5xx)
    if (error.isRetryable()) {
      // Will be auto-retried
    }
  } else {
    // Other errors
  }
}
```

### Error Utilities

```typescript
import {
  isValidationError,
  isRateLimitError,
  isTimeoutError,
  getErrorMessage,
  getErrorCode,
  getRequestId,
} from '@idesaign/sdk';

try {
  // ...
} catch (error) {
  if (isValidationError(error)) {
    console.log(error.fieldErrors);
  }

  // Get error details
  console.log(getErrorMessage(error));
  console.log(getErrorCode(error));
  console.log(getRequestId(error));
}
```

## Request/Response Interceptors

### Request Interceptors

Add custom logic before each request:

```typescript
const removeInterceptor = sdk.addRequestInterceptor(async (config) => {
  // Modify headers
  config.headers['X-Timestamp'] = new Date().toISOString();

  // Log request
  console.log(`${config.method} ${config.url}`);

  return config;
});

// Remove interceptor when done
removeInterceptor();
```

### Response Interceptors

Transform response data:

```typescript
sdk.addResponseInterceptor(async (data) => {
  // Transform data
  if (data && typeof data === 'object') {
    data.processedAt = new Date().toISOString();
  }
  return data;
});
```

## Event Handling

Listen to SDK events:

```typescript
// On request
sdk.on('request', (config) => {
  console.log('Request:', config.method, config.url);
});

// On response
sdk.on('response', (response) => {
  console.log('Response:', response.status);
});

// On error
sdk.on('error', (error) => {
  console.error('Error:', error);
});

// On retry
sdk.on('retry', ({ attempt, delay }) => {
  console.log(`Retry attempt ${attempt} after ${delay}ms`);
});

// On rate limit
sdk.on('rateLimit', ({ retryAfter }) => {
  console.log(`Rate limited. Retry after ${retryAfter}s`);
});

// Listen once
sdk.once('error', (error) => {
  console.error('First error:', error);
});
```

## Advanced Configuration

### Custom Fetch Implementation

```typescript
import fetch from 'node-fetch'; // For Node.js

const sdk = new IdesaignSDK({
  apiKey: 'key',
  fetch: fetch, // Use custom fetch
});
```

### Request Cancellation

```typescript
const controller = new AbortController();

setTimeout(() => controller.abort(), 5000); // Cancel after 5s

try {
  const result = await sdk.generate.create('prompt', {
    // Note: AbortSignal not directly exposed in current API,
    // but can be passed via advanced configuration
  });
} catch (error) {
  if (error instanceof AbortError) {
    console.log('Request was cancelled');
  }
}
```

### Debugging

```typescript
const sdk = new IdesaignSDK({
  apiKey: 'key',
  debug: true, // Enable debug logging
});

// Logs will be printed to console:
// [SDK] POST /generate
// [SDK] Retry attempt 1/3 after 1234ms
// etc.
```

## Rate Limiting

The SDK handles rate limiting automatically:

```typescript
const sdk = new IdesaignSDK({
  apiKey: 'key',
  autoRetryRateLimit: true, // Default: true
});

// When rate limited (429):
// 1. SDK reads Retry-After header
// 2. Emits 'rateLimit' event
// 3. Waits specified duration
// 4. Automatically retries request

// Listen to rate limit events
sdk.on('rateLimit', ({ retryAfter }) => {
  console.log(`Rate limited for ${retryAfter} seconds`);
});
```

## TypeScript Support

All methods are fully typed:

```typescript
import {
  IdesaignSDK,
  GenerationResult,
  FaceDetectionResult,
  ValidationError,
} from '@idesaign/sdk';

const sdk = new IdesaignSDK({ apiKey: 'key' });

// Types are inferred
const result: GenerationResult = await sdk.generate.create('prompt');

const faces: FaceDetectionResult = await sdk.ai.detectFaces({
  file: imageFile,
});

// Error types
try {
  // ...
} catch (error: unknown) {
  if (error instanceof ValidationError) {
    const errors: string[] = error.getAllErrors();
  }
}
```

## Browser Usage

```typescript
// Browser automatically provides fetch
const sdk = new IdesaignSDK({
  apiKey: 'your-api-key',
});

// Use normally
const result = await sdk.generate.create('prompt');
```

## Node.js Usage

```typescript
// Node.js 18+ has native fetch
const sdk = new IdesaignSDK({
  apiKey: 'your-api-key',
});

// For older Node.js versions, provide fetch
import fetch from 'node-fetch';

const sdk = new IdesaignSDK({
  apiKey: 'your-api-key',
  fetch: fetch,
});
```

## API Reference

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | string | required | API authentication key |
| `baseURL` | string | https://api.idesaign.com/v1 | API endpoint |
| `timeout` | number | 30000 | Request timeout (ms) |
| `maxRetries` | number | 3 | Maximum retry attempts |
| `retryDelayMs` | number | 1000 | Initial retry delay (ms) |
| `autoRetryRateLimit` | boolean | true | Auto-retry on 429 |
| `debug` | boolean | false | Enable debug logging |
| `headers` | object | {} | Custom headers |
| `userAgent` | string | - | Custom user agent |
| `fetch` | function | - | Custom fetch implementation |
| `onTokenRefresh` | function | - | Token refresh callback |

### Event Types

| Event | Data | Description |
|-------|------|-------------|
| `request` | RequestConfig | Before request |
| `response` | Response | After response |
| `error` | Error | On error |
| `retry` | { attempt, delay } | On retry |
| `rateLimit` | { retryAfter } | On rate limit |
| `progress` | JobProgress | Job progress update |
| `complete` | any | Operation complete |

## License

MIT

## Support

For issues, questions, or feedback, please visit the official documentation or support channels.
