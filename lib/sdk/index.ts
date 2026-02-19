/**
 * Idesaign API TypeScript SDK
 * Production-grade SDK with full type safety, retry logic, and event handling
 */

import * as Types from './types';
import * as Errors from './errors';

// ============================================================================
// Type Exports
// ============================================================================

export * from './types';
export * from './errors';

// ============================================================================
// SDK Configuration & Initialization
// ============================================================================

const DEFAULT_BASE_URL = 'https://api.idesaign.com/v1';
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;
const DEFAULT_AUTO_RETRY_RATE_LIMIT = true;

/**
 * Main Idesaign SDK Class
 * Provides fully typed access to all Idesaign API endpoints
 */
export class IdesaignSDK {
  private apiKey: string;
  private baseURL: string;
  private timeout: number;
  private maxRetries: number;
  private retryDelayMs: number;
  private autoRetryRateLimit: boolean;
  private fetchImpl: typeof fetch;
  private debug: boolean;
  private headers: Record<string, string>;
  private onTokenRefresh?: () => Promise<string>;

  // Internal state
  private requestInterceptors: Types.RequestInterceptor[] = [];
  private responseInterceptors: Types.ResponseInterceptor[] = [];
  private eventListeners: Map<keyof Types.EventMap, Set<any>> = new Map();

  // Public API namespaces
  public readonly ai: AIClient;
  public readonly files: FileClient;
  public readonly exports: ExportClient;
  public readonly generate: GenerateClient;
  public readonly history: HistoryClient;
  public readonly comparison: ComparisonClient;
  public readonly community: CommunityClient;
  public readonly marketplace: MarketplaceClient;
  public readonly jobs: JobsClient;

  constructor(options: Types.SDKOptions) {
    if (!options.apiKey) {
      throw new Errors.ConfigurationError('API key is required');
    }

    this.apiKey = options.apiKey;
    this.baseURL = options.baseURL || DEFAULT_BASE_URL;
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
    this.autoRetryRateLimit = options.autoRetryRateLimit ?? DEFAULT_AUTO_RETRY_RATE_LIMIT;
    this.debug = options.debug ?? false;
    this.onTokenRefresh = options.onTokenRefresh;

    // Fetch implementation
    if (options.fetch) {
      this.fetchImpl = options.fetch;
    } else if (typeof fetch !== 'undefined') {
      this.fetchImpl = fetch;
    } else {
      throw new Errors.ConfigurationError(
        'No fetch implementation found. Provide fetch in options or use in Node.js 18+'
      );
    }

    // Setup headers
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      ...options.headers,
    };

    if (options.userAgent) {
      this.headers['User-Agent'] = options.userAgent;
    }

    // Initialize API clients
    this.ai = new AIClient(this);
    this.files = new FileClient(this);
    this.exports = new ExportClient(this);
    this.generate = new GenerateClient(this);
    this.history = new HistoryClient(this);
    this.comparison = new ComparisonClient(this);
    this.community = new CommunityClient(this);
    this.marketplace = new MarketplaceClient(this);
    this.jobs = new JobsClient(this);
  }

  // =========================================================================
  // Core Request Method
  // =========================================================================

  /**
   * Make an HTTP request to the API
   */
  async request<T = any>(
    method: string,
    path: string,
    options: {
      body?: any;
      query?: Record<string, any>;
      headers?: Record<string, string>;
      signal?: AbortSignal;
    } = {}
  ): Promise<T> {
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= this.maxRetries) {
      try {
        return await this.executeRequest<T>(method, path, options, attempt);
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        if (!this.shouldRetry(error, attempt)) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = this.getRetryDelay(error, attempt);
        this.emit('retry', { attempt, delay });

        if (this.debug) {
          console.log(
            `[SDK] Retry attempt ${attempt + 1}/${this.maxRetries} after ${delay}ms`
          );
        }

        await this.sleep(delay);
        attempt++;
      }
    }

    throw lastError || new Errors.IdesaignError('Request failed after retries');
  }

  /**
   * Execute a single request
   */
  private async executeRequest<T = any>(
    method: string,
    path: string,
    options: {
      body?: any;
      query?: Record<string, any>;
      headers?: Record<string, string>;
      signal?: AbortSignal;
    },
    attempt: number
  ): Promise<T> {
    // Build URL
    const url = this.buildUrl(path, options.query);

    // Prepare headers
    let headers = { ...this.headers, ...options.headers };

    // Run request interceptors
    let config: Types.RequestConfig = {
      method,
      url,
      headers,
      body: options.body,
      signal: options.signal,
    };

    for (const interceptor of this.requestInterceptors) {
      config = await Promise.resolve(interceptor(config));
    }

    // Create abort controller if timeout specified
    let controller: AbortController | null = null;
    let timeoutHandle: NodeJS.Timeout | null = null;

    if (!config.signal && this.timeout > 0) {
      controller = new AbortController();
      config.signal = controller.signal;

      timeoutHandle = setTimeout(() => {
        controller?.abort();
      }, this.timeout);
    }

    try {
      // Emit request event
      this.emit('request', config);

      if (this.debug) {
        console.log(`[SDK] ${config.method} ${config.url}`);
      }

      // Make request
      const response = await this.fetchImpl(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: config.signal,
      });

      // Clear timeout
      if (timeoutHandle) clearTimeout(timeoutHandle);

      // Parse response
      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Emit response event
      this.emit('response', response as any);

      // Handle rate limit
      if (response.status === 429) {
        const retryAfter = parseInt(
          response.headers.get('retry-after') || '60',
          10
        );
        const error = new Errors.RateLimitError(
          data?.error?.message || 'Rate limit exceeded',
          'RATE_LIMIT',
          retryAfter,
          response.headers.get('x-request-id') || undefined
        );

        this.emit('rateLimit', { retryAfter });

        if (this.autoRetryRateLimit) {
          throw error; // Will be caught by retry logic
        } else {
          throw error;
        }
      }

      // Handle non-2xx responses
      if (!response.ok) {
        const error = Errors.IdesaignError.fromResponse({
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data,
        });

        this.emit('error', error);
        throw error;
      }

      // Extract response data
      const result = data.data ?? data;

      // Run response interceptors
      let processed = result;
      for (const interceptor of this.responseInterceptors) {
        processed = await Promise.resolve(interceptor(processed));
      }

      return processed as T;
    } catch (error) {
      // Clear timeout
      if (timeoutHandle) clearTimeout(timeoutHandle);

      // Handle abort
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Errors.TimeoutError(this.timeout);
      }

      // Handle network errors
      if (error instanceof TypeError) {
        const networkError = new Errors.NetworkError(
          `Network request failed: ${error.message}`,
          error
        );
        this.emit('error', networkError);
        throw networkError;
      }

      // Re-throw SDK errors
      if (error instanceof Errors.IdesaignError) {
        this.emit('error', error);
        throw error;
      }

      // Unknown error
      const unknownError = new Errors.IdesaignError(
        error instanceof Error ? error.message : String(error),
        'UNKNOWN_ERROR'
      );
      this.emit('error', unknownError);
      throw unknownError;
    }
  }

  // =========================================================================
  // Retry Logic
  // =========================================================================

  private shouldRetry(error: unknown, attempt: number): boolean {
    if (attempt >= this.maxRetries) return false;

    if (error instanceof Errors.RateLimitError) {
      return this.autoRetryRateLimit;
    }

    if (Errors.isRetryableError(error)) {
      return true;
    }

    return false;
  }

  private getRetryDelay(error: unknown, attempt: number): number {
    if (error instanceof Errors.RateLimitError) {
      return error.getRetryDelayMs();
    }

    // Exponential backoff with jitter
    const exponentialDelay = this.retryDelayMs * Math.pow(2, attempt);
    const jitter = Math.random() * exponentialDelay * 0.1;
    return exponentialDelay + jitter;
  }

  // =========================================================================
  // Interceptor Management
  // =========================================================================

  /**
   * Add a request interceptor
   */
  addRequestInterceptor(interceptor: Types.RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);
    return () => {
      const index = this.requestInterceptors.indexOf(interceptor);
      if (index > -1) {
        this.requestInterceptors.splice(index, 1);
      }
    };
  }

  /**
   * Add a response interceptor
   */
  addResponseInterceptor<T = any>(
    interceptor: Types.ResponseInterceptor<T>
  ): () => void {
    this.responseInterceptors.push(interceptor);
    return () => {
      const index = this.responseInterceptors.indexOf(interceptor);
      if (index > -1) {
        this.responseInterceptors.splice(index, 1);
      }
    };
  }

  // =========================================================================
  // Event Emitter
  // =========================================================================

  /**
   * Listen for SDK events
   */
  on<K extends keyof Types.EventMap>(
    event: K,
    listener: Types.EventListener<Types.EventMap[K]>
  ): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    this.eventListeners.get(event)!.add(listener);

    return () => {
      this.eventListeners.get(event)?.delete(listener);
    };
  }

  /**
   * Listen for event once
   */
  once<K extends keyof Types.EventMap>(
    event: K,
    listener: Types.EventListener<Types.EventMap[K]>
  ): () => void {
    const wrappedListener = (data: Types.EventMap[K]) => {
      listener(data);
      unsubscribe();
    };

    const unsubscribe = this.on(event, wrappedListener);
    return unsubscribe;
  }

  /**
   * Emit event
   */
  private emit<K extends keyof Types.EventMap>(
    event: K,
    data: Types.EventMap[K]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          if (this.debug) {
            console.error(`[SDK] Event listener error for ${String(event)}:`, error);
          }
        }
      });
    }
  }

  // =========================================================================
  // Utility Methods
  // =========================================================================

  private buildUrl(
    path: string,
    query?: Record<string, any>
  ): string {
    let url = `${this.baseURL}${path}`;

    if (query) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, String(v)));
          } else {
            params.set(key, String(value));
          }
        }
      }

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return url;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get SDK configuration
   */
  getConfig(): {
    baseURL: string;
    timeout: number;
    maxRetries: number;
    autoRetryRateLimit: boolean;
  } {
    return {
      baseURL: this.baseURL,
      timeout: this.timeout,
      maxRetries: this.maxRetries,
      autoRetryRateLimit: this.autoRetryRateLimit,
    };
  }
}

// ============================================================================
// AI Tools Client
// ============================================================================

class AIClient {
  constructor(private sdk: IdesaignSDK) {}

  async detectFaces(image: Types.ImageInput): Promise<Types.FaceDetectionResult> {
    const imageData = await this.normalizeImage(image);
    return this.sdk.request('POST', '/ai/detect-faces', {
      body: { image: imageData },
    });
  }

  async enhancePortrait(
    image: Types.ImageInput,
    options?: Types.PortraitOptions
  ): Promise<Types.EnhanceResult> {
    const imageData = await this.normalizeImage(image);
    return this.sdk.request('POST', '/ai/enhance-portrait', {
      body: { image: imageData, options },
    });
  }

  async inpaint(
    image: Types.ImageInput,
    mask: Types.ImageInput,
    prompt: string,
    options?: Types.InpaintOptions
  ): Promise<Types.InpaintResult> {
    const imageData = await this.normalizeImage(image);
    const maskData = await this.normalizeImage(mask);
    return this.sdk.request('POST', '/ai/inpaint', {
      body: { image: imageData, mask: maskData, prompt, options },
    });
  }

  async removeBackground(
    image: Types.ImageInput,
    options?: Types.RemoveBgOptions
  ): Promise<Types.RemoveBgResult> {
    const imageData = await this.normalizeImage(image);
    return this.sdk.request('POST', '/ai/remove-background', {
      body: { image: imageData, options },
    });
  }

  async removeObject(
    image: Types.ImageInput,
    mask: Types.ImageInput,
    options?: Types.RemoveObjectOptions
  ): Promise<Types.RemoveObjectResult> {
    const imageData = await this.normalizeImage(image);
    const maskData = await this.normalizeImage(mask);
    return this.sdk.request('POST', '/ai/remove-object', {
      body: { image: imageData, mask: maskData, options },
    });
  }

  async styleTransfer(
    image: Types.ImageInput,
    style: string,
    options?: Types.StyleTransferOptions
  ): Promise<Types.StyleTransferResult> {
    const imageData = await this.normalizeImage(image);
    return this.sdk.request('POST', '/ai/style-transfer', {
      body: { image: imageData, style, options },
    });
  }

  async textEdit(
    image: Types.ImageInput,
    instruction: string,
    options?: Types.TextEditOptions
  ): Promise<Types.TextEditResult> {
    const imageData = await this.normalizeImage(image);
    return this.sdk.request('POST', '/ai/text-edit', {
      body: { image: imageData, instruction, options },
    });
  }

  async upscale(
    image: Types.ImageInput,
    options?: Types.UpscaleOptions
  ): Promise<Types.UpscaleResult> {
    const imageData = await this.normalizeImage(image);
    return this.sdk.request('POST', '/ai/upscale', {
      body: { image: imageData, options },
    });
  }

  private async normalizeImage(image: Types.ImageInput): Promise<string> {
    if ('data' in image) {
      return image.data;
    }
    if ('url' in image) {
      return image.url;
    }
    if ('file' in image) {
      return this.fileToBase64(image.file);
    }
    throw new Errors.ValidationError('Invalid image input');
  }

  private fileToBase64(file: File | Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      if (file instanceof Buffer) {
        resolve(file.toString('base64'));
      } else if (file instanceof File) {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      } else {
        reject(new Error('Invalid file type'));
      }
    });
  }
}

// ============================================================================
// File Management Client
// ============================================================================

class FileClient {
  constructor(private sdk: IdesaignSDK) {}

  async upload(
    file: File | Buffer,
    options?: Types.UploadOptions
  ): Promise<Types.UploadResult> {
    const formData = new FormData();

    if (file instanceof Buffer) {
      const blob = new Blob([file]);
      formData.append('file', blob);
    } else {
      formData.append('file', file);
    }

    if (options?.projectId) {
      formData.append('projectId', options.projectId);
    }

    if (options?.metadata) {
      formData.append('metadata', JSON.stringify(options.metadata));
    }

    return this.sdk.request('POST', '/files/upload', {
      body: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async list(options?: Types.ListOptions): Promise<Types.FileListResult> {
    return this.sdk.request('GET', '/files', { query: options });
  }

  async delete(projectId: string): Promise<void> {
    await this.sdk.request('DELETE', `/files/${projectId}`);
  }
}

// ============================================================================
// Export Client
// ============================================================================

class ExportClient {
  constructor(private sdk: IdesaignSDK) {}

  async toPSD(document: Types.PSDDocument): Promise<Types.ExportResult> {
    return this.sdk.request('POST', '/exports/psd', { body: { document } });
  }

  async toTIFF(
    image: Types.ImageInput,
    options?: Types.TIFFOptions
  ): Promise<Types.ExportResult> {
    return this.sdk.request('POST', '/exports/tiff', {
      body: { image, options },
    });
  }

  async processRAW(
    file: Buffer,
    settings?: Types.RAWSettings
  ): Promise<Types.JobResult> {
    return this.sdk.request('POST', '/exports/raw', {
      body: { file: file.toString('base64'), settings },
    });
  }
}

// ============================================================================
// Generation Client
// ============================================================================

class GenerateClient {
  constructor(private sdk: IdesaignSDK) {}

  async create(
    prompt: string,
    options?: Types.GenerateOptions
  ): Promise<Types.GenerationResult> {
    return this.sdk.request('POST', '/generate', {
      body: { prompt, ...options },
    });
  }

  async estimate(options: Types.EstimateOptions): Promise<Types.CostEstimate> {
    return this.sdk.request('POST', '/generate/estimate', { body: options });
  }

  async status(requestId: string): Promise<Types.JobStatus> {
    return this.sdk.request('GET', `/generate/${requestId}`);
  }

  async batch(requests: Types.GenerateRequest[]): Promise<Types.BatchResult> {
    return this.sdk.request('POST', '/generate/batch', { body: { requests } });
  }

  async listModels(): Promise<Types.ModelInfo[]> {
    return this.sdk.request('GET', '/generate/models');
  }
}

// ============================================================================
// History Client
// ============================================================================

class HistoryClient {
  constructor(private sdk: IdesaignSDK) {}

  async list(options?: Types.HistoryListOptions): Promise<Types.HistoryResult> {
    return this.sdk.request('GET', '/history', { query: options });
  }

  async delete(resultId: string): Promise<void> {
    await this.sdk.request('DELETE', `/history/${resultId}`);
  }
}

// ============================================================================
// Comparison Client
// ============================================================================

class ComparisonClient {
  constructor(private sdk: IdesaignSDK) {}

  async create(
    prompt: string,
    modelA: string,
    modelB: string,
    options?: Types.ComparisonOptions
  ): Promise<Types.ComparisonResult> {
    return this.sdk.request('POST', '/comparison', {
      body: { prompt, modelA, modelB, ...options },
    });
  }

  async list(options?: Types.PaginationOptions): Promise<Types.ComparisonListResult> {
    return this.sdk.request('GET', '/comparison', { query: options });
  }

  async recordChoice(
    comparisonId: string,
    winner: 'a' | 'b' | 'tie',
    metadata?: Types.ChoiceMetadata
  ): Promise<void> {
    await this.sdk.request('POST', `/comparison/${comparisonId}/choice`, {
      body: { winner, metadata },
    });
  }
}

// ============================================================================
// Community Client
// ============================================================================

class CommunityClient {
  public readonly gallery: GalleryClient;
  public readonly prompts: PromptClient;
  public readonly collections: CollectionClient;
  public readonly users: UserClient;

  constructor(private sdk: IdesaignSDK) {
    this.gallery = new GalleryClient(sdk);
    this.prompts = new PromptClient(sdk);
    this.collections = new CollectionClient(sdk);
    this.users = new UserClient(sdk);
  }
}

class GalleryClient implements Types.GalleryClient {
  constructor(private sdk: IdesaignSDK) {}

  async list(options?: Types.PaginationOptions): Promise<Types.GalleryListResult> {
    return this.sdk.request('GET', '/community/gallery', { query: options });
  }

  async get(id: string): Promise<Types.GalleryItem> {
    return this.sdk.request('GET', `/community/gallery/${id}`);
  }

  async like(id: string): Promise<void> {
    await this.sdk.request('POST', `/community/gallery/${id}/like`);
  }

  async unlike(id: string): Promise<void> {
    await this.sdk.request('DELETE', `/community/gallery/${id}/like`);
  }

  async report(id: string, reason: string): Promise<void> {
    await this.sdk.request('POST', `/community/gallery/${id}/report`, {
      body: { reason },
    });
  }
}

class PromptClient implements Types.PromptClient {
  constructor(private sdk: IdesaignSDK) {}

  async list(options?: Types.PaginationOptions): Promise<Types.PromptListResult> {
    return this.sdk.request('GET', '/community/prompts', { query: options });
  }

  async get(id: string): Promise<Types.PromptItem> {
    return this.sdk.request('GET', `/community/prompts/${id}`);
  }

  async create(prompt: Types.CreatePromptRequest): Promise<Types.PromptItem> {
    return this.sdk.request('POST', '/community/prompts', { body: prompt });
  }

  async fork(id: string): Promise<Types.PromptItem> {
    return this.sdk.request('POST', `/community/prompts/${id}/fork`);
  }

  async like(id: string): Promise<void> {
    await this.sdk.request('POST', `/community/prompts/${id}/like`);
  }

  async unlike(id: string): Promise<void> {
    await this.sdk.request('DELETE', `/community/prompts/${id}/like`);
  }
}

class CollectionClient implements Types.CollectionClient {
  constructor(private sdk: IdesaignSDK) {}

  async list(options?: Types.PaginationOptions): Promise<Types.CollectionListResult> {
    return this.sdk.request('GET', '/community/collections', { query: options });
  }

  async get(id: string): Promise<Types.CollectionItem> {
    return this.sdk.request('GET', `/community/collections/${id}`);
  }

  async create(
    collection: Types.CreateCollectionRequest
  ): Promise<Types.CollectionItem> {
    return this.sdk.request('POST', '/community/collections', { body: collection });
  }

  async addItem(collectionId: string, itemId: string): Promise<void> {
    await this.sdk.request('POST', `/community/collections/${collectionId}/items`, {
      body: { itemId },
    });
  }

  async removeItem(collectionId: string, itemId: string): Promise<void> {
    await this.sdk.request('DELETE', `/community/collections/${collectionId}/items/${itemId}`);
  }
}

class UserClient implements Types.UserClient {
  constructor(private sdk: IdesaignSDK) {}

  async getProfile(userId: string): Promise<Types.UserProfile> {
    return this.sdk.request('GET', `/community/users/${userId}`);
  }

  async getMe(): Promise<Types.UserProfile> {
    return this.sdk.request('GET', '/community/users/me');
  }

  async updateProfile(updates: Types.UpdateProfileRequest): Promise<Types.UserProfile> {
    return this.sdk.request('PATCH', '/community/users/me', { body: updates });
  }

  async follow(userId: string): Promise<void> {
    await this.sdk.request('POST', `/community/users/${userId}/follow`);
  }

  async unfollow(userId: string): Promise<void> {
    await this.sdk.request('DELETE', `/community/users/${userId}/follow`);
  }

  async getFollowing(options?: Types.PaginationOptions): Promise<Types.UserListResult> {
    return this.sdk.request('GET', '/community/users/me/following', { query: options });
  }

  async getFollowers(options?: Types.PaginationOptions): Promise<Types.UserListResult> {
    return this.sdk.request('GET', '/community/users/me/followers', { query: options });
  }
}

// ============================================================================
// Marketplace Client
// ============================================================================

class MarketplaceClient {
  constructor(private sdk: IdesaignSDK) {}

  async getCatalog(): Promise<Types.CatalogResult> {
    return this.sdk.request('GET', '/marketplace/catalog');
  }

  async getUsage(dateRange?: Types.DateRange): Promise<Types.UsageResult> {
    return this.sdk.request('GET', '/marketplace/usage', {
      query: dateRange,
    });
  }

  async getSample(productId: string): Promise<Types.SampleResult> {
    return this.sdk.request('GET', `/marketplace/products/${productId}/sample`);
  }

  async getData(
    productId: string,
    options?: Types.DataQueryOptions
  ): Promise<Types.DataResult> {
    return this.sdk.request('GET', `/marketplace/products/${productId}/data`, {
      query: options,
    });
  }
}

// ============================================================================
// Jobs Client
// ============================================================================

class JobsClient {
  constructor(private sdk: IdesaignSDK) {}

  async getProgress(jobId: string): Promise<Types.JobProgress> {
    return this.sdk.request('GET', `/jobs/${jobId}`);
  }

  async *streamProgress(jobId: string): AsyncGenerator<Types.JobProgress> {
    while (true) {
      const progress = await this.getProgress(jobId);
      yield progress;

      if (progress.status === 'completed' || progress.status === 'failed') {
        break;
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
