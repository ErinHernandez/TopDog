/**
 * Idesaign API TypeScript SDK
 * Complete type definitions for all request/response types
 */

// ============================================================================
// Configuration & Options
// ============================================================================

export interface SDKOptions {
  /**
   * API key for authentication
   * @required
   */
  apiKey: string;

  /**
   * API base URL (defaults to https://api.idesaign.com/v1)
   * @optional
   */
  baseURL?: string;

  /**
   * Request timeout in milliseconds (defaults to 30000)
   * @optional
   */
  timeout?: number;

  /**
   * Maximum number of retries for failed requests (defaults to 3)
   * @optional
   */
  maxRetries?: number;

  /**
   * Initial retry delay in milliseconds (defaults to 1000)
   * Used for exponential backoff: delay * (2 ^ attempt)
   * @optional
   */
  retryDelayMs?: number;

  /**
   * Custom fetch implementation (useful for Node.js)
   * @optional
   */
  fetch?: typeof fetch;

  /**
   * Callback to refresh token when needed
   * Return new API key to continue, throw error to interrupt
   * @optional
   */
  onTokenRefresh?: () => Promise<string>;

  /**
   * Enable debug logging
   * @optional
   */
  debug?: boolean;

  /**
   * Custom request headers
   * @optional
   */
  headers?: Record<string, string>;

  /**
   * Enable automatic retry on 429 (rate limit) responses
   * @optional
   */
  autoRetryRateLimit?: boolean;

  /**
   * User agent string
   * @optional
   */
  userAgent?: string;
}

// ============================================================================
// Image & File Inputs
// ============================================================================

export type ImageInput = {
  /** Base64 encoded image data */
  data: string;
  /** MIME type (image/jpeg, image/png, etc.) */
  mimeType?: string;
} | {
  /** File URL */
  url: string;
} | {
  /** File object (browser) or Buffer (Node.js) */
  file: File | Buffer;
};

export interface UploadOptions {
  /**
   * Project ID to upload file to
   * @optional
   */
  projectId?: string;

  /**
   * File metadata
   * @optional
   */
  metadata?: Record<string, string>;

  /**
   * Upload timeout in milliseconds
   * @optional
   */
  timeout?: number;

  /**
   * Progress callback (bytes loaded, total bytes)
   * @optional
   */
  onProgress?: (loaded: number, total: number) => void;
}

export interface UploadResult {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  url: string;
  createdAt: string;
  projectId?: string;
  metadata?: Record<string, string>;
}

// ============================================================================
// AI Tools - Face Detection
// ============================================================================

export interface FaceDetectionResult {
  requestId: string;
  faces: Face[];
  imageMetadata: {
    width: number;
    height: number;
    format: string;
  };
  processingTime: number;
}

export interface Face {
  id: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  landmarks: FaceLandmarks;
  attributes: {
    age?: number;
    gender?: 'male' | 'female' | 'unknown';
    expression?: string;
    emotion?: string;
    glasses?: boolean;
    ethnicity?: string;
  };
}

export interface FaceLandmarks {
  leftEye: Point;
  rightEye: Point;
  nose: Point;
  leftMouth: Point;
  rightMouth: Point;
  leftEar: Point;
  rightEar: Point;
  points: Point[];
}

export interface Point {
  x: number;
  y: number;
  z?: number;
}

// ============================================================================
// AI Tools - Portrait Enhancement
// ============================================================================

export interface PortraitOptions {
  /**
   * Enhancement strength (0.0 - 1.0)
   * @optional
   */
  strength?: number;

  /**
   * Whether to apply skin smoothing
   * @optional
   */
  smoothSkin?: boolean;

  /**
   * Whether to enhance eyes
   * @optional
   */
  enhanceEyes?: boolean;

  /**
   * Whether to enhance lips
   * @optional
   */
  enhanceLips?: boolean;

  /**
   * Brightness adjustment (-1.0 to 1.0)
   * @optional
   */
  brightness?: number;

  /**
   * Contrast adjustment (-1.0 to 1.0)
   * @optional
   */
  contrast?: number;

  /**
   * Saturation adjustment (-1.0 to 1.0)
   * @optional
   */
  saturation?: number;
}

export interface EnhanceResult {
  requestId: string;
  imageUrl: string;
  imageData?: string;
  metadata: {
    originalSize: { width: number; height: number };
    processedSize: { width: number; height: number };
    enhancements: string[];
  };
  processingTime: number;
}

// ============================================================================
// AI Tools - Inpainting
// ============================================================================

export interface InpaintOptions {
  /**
   * Strength of inpainting (0.0 - 1.0)
   * @optional
   */
  strength?: number;

  /**
   * Number of inference steps (higher = better quality, slower)
   * @optional
   */
  steps?: number;

  /**
   * Guidance scale for prompt adherence
   * @optional
   */
  guidanceScale?: number;

  /**
   * Seed for reproducibility
   * @optional
   */
  seed?: number;

  /**
   * Negative prompt
   * @optional
   */
  negativePrompt?: string;
}

export interface InpaintResult {
  requestId: string;
  imageUrl: string;
  imageData?: string;
  mask: {
    url: string;
    area: number;
  };
  metadata: {
    prompt: string;
    model: string;
    steps: number;
    guidanceScale: number;
  };
  processingTime: number;
}

// ============================================================================
// AI Tools - Background Removal
// ============================================================================

export interface RemoveBgOptions {
  /**
   * Transparency threshold (0.0 - 1.0)
   * @optional
   */
  threshold?: number;

  /**
   * Edge smoothing (0 - 10)
   * @optional
   */
  edgeSmoothing?: number;

  /**
   * Format for output (png, webp, etc.)
   * @optional
   */
  format?: string;

  /**
   * Background color/removal (transparent, color, blur)
   * @optional
   */
  backgroundMode?: 'transparent' | 'color' | 'blur';

  /**
   * Background color if mode is 'color'
   * @optional
   */
  backgroundColor?: string;
}

export interface RemoveBgResult {
  requestId: string;
  imageUrl: string;
  imageData?: string;
  mask: {
    url: string;
    coverage: number;
  };
  metadata: {
    originalSize: { width: number; height: number };
    format: string;
  };
  processingTime: number;
}

// ============================================================================
// AI Tools - Object Removal
// ============================================================================

export interface RemoveObjectOptions {
  /**
   * Inpainting method (lama, generative, traditional)
   * @optional
   */
  method?: 'lama' | 'generative' | 'traditional';

  /**
   * Dilate mask by pixels
   * @optional
   */
  dilate?: number;

  /**
   * Blur dilated edges
   * @optional
   */
  blurEdges?: boolean;

  /**
   * Padding around mask
   * @optional
   */
  padding?: number;
}

export interface RemoveObjectResult {
  requestId: string;
  imageUrl: string;
  imageData?: string;
  mask: {
    url: string;
    area: number;
  };
  metadata: {
    method: string;
    objectArea: number;
    processingRegion: { x: number; y: number; width: number; height: number };
  };
  processingTime: number;
}

// ============================================================================
// AI Tools - Style Transfer
// ============================================================================

export interface StyleTransferOptions {
  /**
   * Style intensity (0.0 - 1.0)
   * @optional
   */
  intensity?: number;

  /**
   * Preserve original colors
   * @optional
   */
  preserveColor?: boolean;

  /**
   * Content weight
   * @optional
   */
  contentWeight?: number;

  /**
   * Style weight
   * @optional
   */
  styleWeight?: number;
}

export interface StyleTransferResult {
  requestId: string;
  imageUrl: string;
  imageData?: string;
  style: {
    name: string;
    category: string;
  };
  metadata: {
    intensity: number;
    preserveColor: boolean;
  };
  processingTime: number;
}

// ============================================================================
// AI Tools - Text Edit
// ============================================================================

export interface TextEditOptions {
  /**
   * Strength of edit (0.0 - 1.0)
   * @optional
   */
  strength?: number;

  /**
   * Number of inference steps
   * @optional
   */
  steps?: number;

  /**
   * Guidance scale
   * @optional
   */
  guidanceScale?: number;

  /**
   * Seed for reproducibility
   * @optional
   */
  seed?: number;
}

export interface TextEditResult {
  requestId: string;
  imageUrl: string;
  imageData?: string;
  editRegions: EditRegion[];
  metadata: {
    instruction: string;
    model: string;
  };
  processingTime: number;
}

export interface EditRegion {
  boundingBox: { x: number; y: number; width: number; height: number };
  confidence: number;
  editType: string;
}

// ============================================================================
// AI Tools - Upscaling
// ============================================================================

export interface UpscaleOptions {
  /**
   * Upscale factor (2, 3, or 4)
   * @optional
   */
  scale?: 2 | 3 | 4;

  /**
   * Face restoration enabled
   * @optional
   */
  restoreFaces?: boolean;

  /**
   * Tile size for processing (useful for large images)
   * @optional
   */
  tileSize?: number;

  /**
   * Tile padding
   * @optional
   */
  tilePadding?: number;
}

export interface UpscaleResult {
  requestId: string;
  imageUrl: string;
  imageData?: string;
  metadata: {
    originalSize: { width: number; height: number };
    upscaledSize: { width: number; height: number };
    scale: number;
    faceRestoration: boolean;
  };
  processingTime: number;
}

// ============================================================================
// File Management
// ============================================================================

export interface ListOptions {
  /**
   * Number of files to return (defaults to 20)
   * @optional
   */
  limit?: number;

  /**
   * Pagination offset
   * @optional
   */
  offset?: number;

  /**
   * Filter by file type
   * @optional
   */
  fileType?: string;

  /**
   * Sort order
   * @optional
   */
  sort?: 'created' | 'updated' | 'name';

  /**
   * Sort direction
   * @optional
   */
  direction?: 'asc' | 'desc';

  /**
   * Project ID filter
   * @optional
   */
  projectId?: string;
}

export interface FileListResult {
  files: FileInfo[];
  pagination: {
    offset: number;
    limit: number;
    total: number;
  };
}

export interface FileInfo {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  projectId?: string;
}

// ============================================================================
// Export Formats
// ============================================================================

export interface PSDDocument {
  layers: Layer[];
  width: number;
  height: number;
  metadata?: Record<string, any>;
}

export interface Layer {
  name: string;
  visible: boolean;
  opacity: number;
  blendMode?: string;
  content: ImageInput | string;
}

export interface TIFFOptions {
  /**
   * Compression type (none, lzw, rle)
   * @optional
   */
  compression?: 'none' | 'lzw' | 'rle';

  /**
   * Photometric interpretation (rgb, cmyk, grayscale)
   * @optional
   */
  photometric?: 'rgb' | 'cmyk' | 'grayscale';

  /**
   * Bit depth (8, 16, 32)
   * @optional
   */
  bitDepth?: 8 | 16 | 32;
}

export interface RAWSettings {
  /**
   * Camera model for demosaicing
   * @optional
   */
  cameraModel?: string;

  /**
   * White balance temperature
   * @optional
   */
  whiteBalance?: number;

  /**
   * ISO sensitivity
   * @optional
   */
  iso?: number;

  /**
   * Color matrix
   * @optional
   */
  colorMatrix?: number[][];
}

export interface ExportResult {
  requestId: string;
  fileUrl: string;
  fileSize: number;
  format: string;
  metadata?: Record<string, any>;
  processingTime: number;
}

export interface JobResult {
  jobId: string;
  status: JobStatus;
  result?: ExportResult;
}

// ============================================================================
// Generation
// ============================================================================

export interface GenerateOptions {
  /**
   * Model to use for generation
   * @optional
   */
  model?: string;

  /**
   * Number of images to generate (1-4)
   * @optional
   */
  numImages?: number;

  /**
   * Image size (256, 512, 768, 1024)
   * @optional
   */
  size?: 256 | 512 | 768 | 1024;

  /**
   * Guidance scale for prompt adherence
   * @optional
   */
  guidanceScale?: number;

  /**
   * Number of inference steps
   * @optional
   */
  steps?: number;

  /**
   * Seed for reproducibility
   * @optional
   */
  seed?: number;

  /**
   * Negative prompt
   * @optional
   */
  negativePrompt?: string;

  /**
   * Style preset
   * @optional
   */
  style?: string;

  /**
   * Quality level (draft, standard, premium)
   * @optional
   */
  quality?: 'draft' | 'standard' | 'premium';

  /**
   * Base image for image-to-image
   * @optional
   */
  initImage?: ImageInput;

  /**
   * Strength for image-to-image (0.0 - 1.0)
   * @optional
   */
  strength?: number;

  /**
   * Webhook URL for async processing
   * @optional
   */
  webhookUrl?: string;
}

export interface GenerationResult {
  requestId: string;
  images: GeneratedImage[];
  model: string;
  metadata: {
    prompt: string;
    guidanceScale: number;
    steps: number;
    seed: number;
    size: number;
  };
  processingTime: number;
}

export interface GeneratedImage {
  url: string;
  data?: string;
  index: number;
  seed: number;
}

export interface GenerateRequest {
  prompt: string;
  options?: GenerateOptions;
}

export interface EstimateOptions {
  prompt: string;
  model?: string;
  numImages?: number;
  size?: number;
  quality?: 'draft' | 'standard' | 'premium';
}

export interface CostEstimate {
  estimatedCost: number;
  currency: string;
  estimatedTime: number;
  credits: number;
}

export interface JobStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: GenerationResult;
  error?: string;
}

export interface BatchResult {
  batchId: string;
  requests: BatchRequestStatus[];
  status: 'processing' | 'completed' | 'failed';
}

export interface BatchRequestStatus {
  requestId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  result?: GenerationResult;
  error?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  maxTokens?: number;
  costPerUnit: number;
  recommended: boolean;
  capabilities: string[];
}

// ============================================================================
// History
// ============================================================================

export interface HistoryListOptions extends PaginationOptions {
  /**
   * Filter by status
   * @optional
   */
  status?: 'completed' | 'failed' | 'processing';

  /**
   * Filter by tool
   * @optional
   */
  tool?: string;

  /**
   * Date range filter
   * @optional
   */
  dateRange?: DateRange;

  /**
   * Sort field
   * @optional
   */
  sort?: 'created' | 'updated';
}

export interface HistoryResult {
  results: HistoryEntry[];
  pagination: Pagination;
}

export interface HistoryEntry {
  id: string;
  tool: string;
  status: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  processingTime: number;
  cost: number;
}

// ============================================================================
// Comparison
// ============================================================================

export interface ComparisonOptions {
  /**
   * Number of images per model
   * @optional
   */
  numImages?: number;

  /**
   * Size for generation
   * @optional
   */
  size?: number;

  /**
   * Additional model parameters
   * @optional
   */
  modelParams?: Record<string, any>;
}

export interface ComparisonResult {
  comparisonId: string;
  prompt: string;
  modelA: {
    id: string;
    name: string;
    images: GeneratedImage[];
  };
  modelB: {
    id: string;
    name: string;
    images: GeneratedImage[];
  };
  createdAt: string;
}

export interface ComparisonListResult {
  comparisons: ComparisonEntry[];
  pagination: Pagination;
}

export interface ComparisonEntry {
  id: string;
  prompt: string;
  modelA: string;
  modelB: string;
  createdAt: string;
  choices?: {
    a: number;
    b: number;
    tie: number;
  };
}

export interface ChoiceMetadata {
  reason?: string;
  quality?: number;
  speed?: number;
  cost?: number;
}

// ============================================================================
// Community
// ============================================================================

export interface GalleryClient {
  list(options?: PaginationOptions): Promise<GalleryListResult>;
  get(id: string): Promise<GalleryItem>;
  like(id: string): Promise<void>;
  unlike(id: string): Promise<void>;
  report(id: string, reason: string): Promise<void>;
}

export interface GalleryListResult {
  items: GalleryItem[];
  pagination: Pagination;
}

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  tags: string[];
  likes: number;
  liked: boolean;
  createdAt: string;
}

export interface PromptClient {
  list(options?: PaginationOptions): Promise<PromptListResult>;
  get(id: string): Promise<PromptItem>;
  create(prompt: CreatePromptRequest): Promise<PromptItem>;
  fork(id: string): Promise<PromptItem>;
  like(id: string): Promise<void>;
  unlike(id: string): Promise<void>;
}

export interface PromptListResult {
  prompts: PromptItem[];
  pagination: Pagination;
}

export interface PromptItem {
  id: string;
  title: string;
  description: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  likes: number;
  liked: boolean;
  forks: number;
  tags: string[];
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromptRequest {
  title: string;
  description: string;
  content: string;
  tags: string[];
  category: string;
  isPublic?: boolean;
}

export interface CollectionClient {
  list(options?: PaginationOptions): Promise<CollectionListResult>;
  get(id: string): Promise<CollectionItem>;
  create(collection: CreateCollectionRequest): Promise<CollectionItem>;
  addItem(collectionId: string, itemId: string): Promise<void>;
  removeItem(collectionId: string, itemId: string): Promise<void>;
}

export interface CollectionListResult {
  collections: CollectionItem[];
  pagination: Pagination;
}

export interface CollectionItem {
  id: string;
  title: string;
  description: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  items: string[];
  itemCount: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCollectionRequest {
  title: string;
  description: string;
  items?: string[];
  isPublic?: boolean;
}

export interface UserClient {
  getProfile(userId: string): Promise<UserProfile>;
  getMe(): Promise<UserProfile>;
  updateProfile(updates: UpdateProfileRequest): Promise<UserProfile>;
  follow(userId: string): Promise<void>;
  unfollow(userId: string): Promise<void>;
  getFollowing(options?: PaginationOptions): Promise<UserListResult>;
  getFollowers(options?: PaginationOptions): Promise<UserListResult>;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  verified: boolean;
  followers: number;
  following: number;
  createdAt: string;
  badges?: string[];
}

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  avatar?: ImageInput;
}

export interface UserListResult {
  users: UserProfile[];
  pagination: Pagination;
}

// ============================================================================
// Marketplace
// ============================================================================

export interface CatalogResult {
  products: Product[];
  categories: string[];
  filters: Record<string, string[]>;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  provider: string;
  rating: number;
  reviews: number;
  documentation?: string;
  apiReference?: string;
}

export interface UsageResult {
  dateRange: DateRange;
  usage: UsageEntry[];
  totalCost: number;
  currency: string;
}

export interface UsageEntry {
  date: string;
  product: string;
  units: number;
  cost: number;
}

export interface SampleResult {
  productId: string;
  sample: Record<string, any>;
}

export interface DataQueryOptions {
  /**
   * Query filters
   * @optional
   */
  filters?: Record<string, any>;

  /**
   * Pagination options
   * @optional
   */
  limit?: number;

  /**
   * Pagination offset
   * @optional
   */
  offset?: number;

  /**
   * Sort field
   * @optional
   */
  sort?: string;
}

export interface DataResult {
  productId: string;
  data: Record<string, any>[];
  pagination: Pagination;
}

// ============================================================================
// Jobs
// ============================================================================

export interface JobProgress {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  estimatedTimeRemaining?: number;
  error?: string;
  result?: any;
}

// ============================================================================
// Common Types
// ============================================================================

export interface PaginationOptions {
  /**
   * Number of items to return
   * @optional
   */
  limit?: number;

  /**
   * Pagination offset
   * @optional
   */
  offset?: number;
}

export interface Pagination {
  offset: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface DateRange {
  startDate: string; // ISO 8601
  endDate: string;   // ISO 8601
}

// ============================================================================
// Request/Response Interceptors
// ============================================================================

export interface RequestInterceptor {
  (config: RequestConfig): Promise<RequestConfig> | RequestConfig;
}

export interface ResponseInterceptor<T = any> {
  (response: Response): Promise<T> | T;
}

export interface RequestConfig {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  signal?: AbortSignal;
}

// ============================================================================
// Event Emitter Types
// ============================================================================

export type EventListener<T = any> = (data: T) => void;

export interface EventMap {
  'request': RequestConfig;
  'response': Response;
  'error': Error;
  'retry': { attempt: number; delay: number };
  'rateLimit': { retryAfter: number };
  'progress': JobProgress;
  'complete': any;
}

// ============================================================================
// API Response Wrapper
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  metadata?: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}
