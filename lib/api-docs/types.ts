/**
 * API Documentation Types
 *
 * Type definitions for the route registry and OpenAPI spec generation system.
 * These types define how route metadata is structured and how it maps to
 * OpenAPI 3.1.0 specification objects.
 *
 * @module lib/api-docs/types
 */

// ============================================================================
// ROUTE METADATA TYPES
// ============================================================================

/** HTTP methods supported by the API */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/** Authentication methods used by routes */
export type AuthMethod = 'bearer' | 'apiKey' | 'admin' | 'webhook' | 'optional' | 'none';

/** Route categories for grouping in docs */
export type RouteCategory =
  | 'Health'
  | 'AI Tools'
  | 'Files'
  | 'Formats'
  | 'Generation'
  | 'History'
  | 'Feedback'
  | 'Comparison'
  | 'Projects'
  | 'Uploads'
  | 'Jobs'
  | 'Community'
  | 'Marketplace'
  | 'Checkout'
  | 'Notifications'
  | 'Admin'
  | 'Admin Audit'
  | 'Admin Buyers'
  | 'Admin Products'
  | 'Admin Observability'
  | 'Integration'
  | 'Webhooks'
  | 'SMS'
  | 'Versioning';

/** Parameter location in the request */
export type ParameterLocation = 'query' | 'path' | 'header' | 'body';

/** OpenAPI-compatible parameter type */
export type ParameterType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'file';

// ============================================================================
// PARAMETER DEFINITIONS
// ============================================================================

/** A single API parameter definition */
export interface RouteParameter {
  /** Parameter name */
  name: string;
  /** Where the parameter appears */
  in: ParameterLocation;
  /** Whether the parameter is required */
  required: boolean;
  /** Human-readable description */
  description: string;
  /** Data type */
  type: ParameterType;
  /** Example value */
  example?: string | number | boolean;
  /** Default value */
  default?: string | number | boolean;
  /** Enum values (for constrained strings) */
  enum?: string[];
  /** Format hint (e.g., 'email', 'date-time', 'uri') */
  format?: string;
  /** Nested properties for object types */
  properties?: Record<string, {
    type: ParameterType;
    description: string;
    required?: boolean;
    example?: string | number | boolean;
    enum?: string[];
  }>;
}

// ============================================================================
// RESPONSE DEFINITIONS
// ============================================================================

/** A single API response definition */
export interface RouteResponse {
  /** HTTP status code */
  statusCode: number;
  /** Human-readable description */
  description: string;
  /** Example response body as JSON string */
  example?: string;
  /** Content type (defaults to application/json) */
  contentType?: string;
  /** Response headers */
  headers?: Record<string, {
    description: string;
    type: ParameterType;
    example?: string;
  }>;
}

// ============================================================================
// ROUTE DEFINITION
// ============================================================================

/** Complete metadata for a single API route operation */
export interface RouteDefinition {
  /** Unique operation ID (e.g., 'getHealth', 'createProject') */
  operationId: string;
  /** HTTP method */
  method: HttpMethod;
  /** URL path (e.g., '/api/studio/projects/list') */
  path: string;
  /** Short summary (< 80 chars) */
  summary: string;
  /** Detailed description */
  description: string;
  /** Category tag for grouping */
  category: RouteCategory;
  /** Authentication method required */
  auth: AuthMethod;
  /** Rate limit description (e.g., '100/min', '1000/hour') */
  rateLimit: string;
  /** Request parameters */
  parameters: RouteParameter[];
  /** Response definitions */
  responses: RouteResponse[];
  /** Whether this route is deprecated */
  deprecated?: boolean;
  /** Body size limit override (e.g., '10mb') */
  bodyLimit?: string;
  /** Whether this is a streaming/SSE endpoint */
  streaming?: boolean;
}

// ============================================================================
// REGISTRY TYPES
// ============================================================================

/** Tag definition for OpenAPI spec */
export interface TagDefinition {
  name: RouteCategory;
  description: string;
}

/** Server definition for OpenAPI spec */
export interface ServerDefinition {
  url: string;
  description: string;
}

/** Registry configuration */
export interface RegistryConfig {
  /** API title */
  title: string;
  /** API version */
  version: string;
  /** API description */
  description: string;
  /** Contact info */
  contact: {
    name: string;
    url: string;
  };
  /** License info */
  license: {
    name: string;
    url: string;
  };
  /** Server environments */
  servers: ServerDefinition[];
  /** Category tags with descriptions */
  tags: TagDefinition[];
}

// ============================================================================
// OPENAPI OUTPUT TYPES (simplified for our generator)
// ============================================================================

/** Generated OpenAPI specification (JSON-serializable) */
export interface OpenApiSpec {
  openapi: '3.1.0';
  info: {
    title: string;
    version: string;
    description: string;
    contact: { name: string; url: string };
    license: { name: string; url: string };
  };
  servers: Array<{ url: string; description: string }>;
  security: Array<Record<string, string[]>>;
  tags: Array<{ name: string; description: string }>;
  paths: Record<string, Record<string, OpenApiOperation>>;
  components: {
    securitySchemes: Record<string, OpenApiSecurityScheme>;
    schemas: Record<string, OpenApiSchema>;
    responses: Record<string, OpenApiResponseDef>;
  };
}

export interface OpenApiOperation {
  summary: string;
  description: string;
  operationId: string;
  tags: string[];
  security: Array<Record<string, string[]>>;
  deprecated?: boolean;
  parameters?: OpenApiParameter[];
  requestBody?: OpenApiRequestBody;
  responses: Record<string, OpenApiResponse>;
}

export interface OpenApiParameter {
  name: string;
  in: string;
  required: boolean;
  description: string;
  schema: OpenApiSchema;
}

export interface OpenApiRequestBody {
  required: boolean;
  content: Record<string, { schema: OpenApiSchema; example?: unknown }>;
}

export interface OpenApiResponse {
  description: string;
  content?: Record<string, { schema: OpenApiSchema; example?: unknown }>;
  headers?: Record<string, { schema: OpenApiSchema; description: string }>;
}

export interface OpenApiResponseDef {
  description: string;
  content?: Record<string, { schema: OpenApiSchema }>;
  headers?: Record<string, { schema: OpenApiSchema; description: string }>;
}

export interface OpenApiSecurityScheme {
  type: string;
  scheme?: string;
  bearerFormat?: string;
  name?: string;
  in?: string;
  description: string;
}

export interface OpenApiSchema {
  type?: string;
  format?: string;
  description?: string;
  example?: unknown;
  enum?: string[];
  properties?: Record<string, OpenApiSchema>;
  required?: string[];
  items?: OpenApiSchema;
  default?: unknown;
  $ref?: string;
}
