/**
 * OpenAPI Spec Generator
 *
 * Generates an OpenAPI 3.1.0 specification from the route registry.
 * Transforms route definitions into valid OpenAPI paths, operations,
 * parameters, request bodies, and responses.
 *
 * @module lib/api-docs/specGenerator
 */

import type {
  RouteDefinition,
  RouteParameter,
  RouteResponse,
  AuthMethod,
  OpenApiSpec,
  OpenApiOperation,
  OpenApiParameter,
  OpenApiRequestBody,
  OpenApiResponse,
  OpenApiSchema,
  OpenApiSecurityScheme,
  OpenApiResponseDef,
} from './types';
import { REGISTRY_CONFIG, getRoutes, getActiveTags } from './registry';

// ============================================================================
// SECURITY SCHEME MAPPINGS
// ============================================================================

const SECURITY_SCHEMES: Record<string, OpenApiSecurityScheme> = {
  BearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'Firebase ID Token',
    description: 'Firebase Authentication ID token obtained via Google sign-in.',
  },
  ApiKeyAuth: {
    type: 'apiKey',
    name: 'X-API-Key',
    in: 'header',
    description: 'API key for marketplace and third-party integrations.',
  },
  AdminAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'Admin JWT',
    description: 'Admin JWT token with admin custom claims (customClaims.admin === true).',
  },
};

/**
 * Map auth method to OpenAPI security requirement
 */
function getSecurityForAuth(auth: AuthMethod): Array<Record<string, string[]>> {
  switch (auth) {
    case 'bearer':
      return [{ BearerAuth: [] }];
    case 'apiKey':
      return [{ ApiKeyAuth: [] }];
    case 'admin':
      return [{ AdminAuth: [] }];
    case 'optional':
      // Optional auth: empty array means "no auth required but auth is accepted"
      return [];
    case 'webhook':
    case 'none':
      return [];
    default:
      return [];
  }
}

// ============================================================================
// SHARED RESPONSE DEFINITIONS
// ============================================================================

const SHARED_RESPONSES: Record<string, OpenApiResponseDef> = {
  Unauthorized: {
    description: 'Authentication required or invalid token',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
      },
    },
  },
  Forbidden: {
    description: 'Insufficient permissions',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
      },
    },
  },
  NotFound: {
    description: 'Resource not found',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
      },
    },
  },
  RateLimitExceeded: {
    description: 'Rate limit exceeded. See Retry-After header.',
    headers: {
      'Retry-After': {
        schema: { type: 'integer' },
        description: 'Seconds until next request allowed',
      },
      'X-RateLimit-Limit': {
        schema: { type: 'integer' },
        description: 'Requests per window',
      },
      'X-RateLimit-Remaining': {
        schema: { type: 'integer' },
        description: 'Remaining requests in current window',
      },
    },
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
      },
    },
  },
  ServerError: {
    description: 'Internal server error',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
      },
    },
  },
};

// ============================================================================
// SHARED SCHEMAS
// ============================================================================

const SHARED_SCHEMAS: Record<string, OpenApiSchema> = {
  ErrorResponse: {
    type: 'object',
    properties: {
      error: { type: 'string', description: 'Error message' },
      code: { type: 'string', description: 'Error code' },
      details: { type: 'object', description: 'Additional error context' },
    },
    required: ['error'],
  },
  PaginationMeta: {
    type: 'object',
    properties: {
      total: { type: 'integer', description: 'Total number of items' },
      limit: { type: 'integer', description: 'Items per page' },
      offset: { type: 'integer', description: 'Current offset' },
      hasMore: { type: 'boolean', description: 'Whether more items exist' },
    },
  },
  TimestampRange: {
    type: 'object',
    properties: {
      startTime: { type: 'string', format: 'date-time', description: 'Range start' },
      endTime: { type: 'string', format: 'date-time', description: 'Range end' },
    },
  },
};

// ============================================================================
// PARAMETER CONVERSION
// ============================================================================

/**
 * Convert a RouteParameter to OpenAPI schema
 */
function parameterToSchema(param: RouteParameter): OpenApiSchema {
  const schema: OpenApiSchema = {
    type: param.type === 'file' ? 'string' : param.type,
  };

  if (param.type === 'file') {
    schema.format = 'binary';
  }
  if (param.format) {
    schema.format = param.format;
  }
  if (param.enum) {
    schema.enum = param.enum;
  }
  if (param.default !== undefined) {
    schema.default = param.default;
  }
  if (param.example !== undefined) {
    schema.example = param.example;
  }
  if (param.type === 'array') {
    schema.items = { type: 'string' };
  }
  if (param.type === 'object' && param.properties) {
    schema.properties = {};
    for (const [key, prop] of Object.entries(param.properties)) {
      schema.properties[key] = {
        type: prop.type,
        description: prop.description,
        ...(prop.enum ? { enum: prop.enum } : {}),
        ...(prop.example !== undefined ? { example: prop.example } : {}),
      };
    }
  }

  return schema;
}

/**
 * Extract path and query parameters from route definition
 */
function extractPathQueryParams(
  params: RouteParameter[]
): OpenApiParameter[] {
  return params
    .filter((p) => p.in === 'path' || p.in === 'query' || p.in === 'header')
    .map((p) => ({
      name: p.name,
      in: p.in,
      required: p.required,
      description: p.description,
      schema: parameterToSchema(p),
    }));
}

/**
 * Extract body parameters and build request body
 */
function extractRequestBody(
  params: RouteParameter[]
): OpenApiRequestBody | undefined {
  const bodyParams = params.filter((p) => p.in === 'body');
  if (bodyParams.length === 0) return undefined;

  // Check if any parameter is a file upload
  const hasFile = bodyParams.some((p) => p.type === 'file');
  const contentType = hasFile ? 'multipart/form-data' : 'application/json';

  const properties: Record<string, OpenApiSchema> = {};
  const required: string[] = [];

  for (const param of bodyParams) {
    properties[param.name] = {
      ...parameterToSchema(param),
      description: param.description,
    };
    if (param.required) {
      required.push(param.name);
    }
  }

  return {
    required: required.length > 0,
    content: {
      [contentType]: {
        schema: {
          type: 'object',
          properties,
          ...(required.length > 0 ? { required } : {}),
        },
      },
    },
  };
}

// ============================================================================
// RESPONSE CONVERSION
// ============================================================================

/**
 * Convert RouteResponse to OpenAPI response object
 */
function convertResponse(resp: RouteResponse): OpenApiResponse {
  const result: OpenApiResponse = {
    description: resp.description,
  };

  if (resp.example) {
    const contentType = resp.contentType || 'application/json';
    try {
      const parsed = contentType === 'application/json'
        ? JSON.parse(resp.example)
        : resp.example;
      result.content = {
        [contentType]: {
          schema: { type: 'object' },
          example: parsed,
        },
      };
    } catch {
      result.content = {
        [contentType]: {
          schema: { type: 'string' },
          example: resp.example,
        },
      };
    }
  } else if (resp.contentType) {
    result.content = {
      [resp.contentType]: {
        schema: resp.contentType === 'text/csv'
          ? { type: 'string' }
          : { type: 'string', format: 'binary' },
      },
    };
  }

  if (resp.headers) {
    result.headers = {};
    for (const [name, header] of Object.entries(resp.headers)) {
      result.headers[name] = {
        schema: { type: header.type },
        description: header.description,
      };
    }
  }

  return result;
}

/**
 * Build response map for a route, including standard error responses
 */
function buildResponses(
  route: RouteDefinition
): Record<string, OpenApiResponse> {
  const responses: Record<string, OpenApiResponse> = {};

  // Add declared responses
  for (const resp of route.responses) {
    responses[String(resp.statusCode)] = convertResponse(resp);
  }

  // Add standard error responses based on auth type
  if (route.auth === 'bearer' || route.auth === 'admin' || route.auth === 'apiKey') {
    if (!responses['401']) {
      responses['401'] = { description: 'Authentication required', $ref: '#/components/responses/Unauthorized' } as unknown as OpenApiResponse;
    }
  }
  if (route.auth === 'admin') {
    if (!responses['403']) {
      responses['403'] = { description: 'Admin access required', $ref: '#/components/responses/Forbidden' } as unknown as OpenApiResponse;
    }
  }
  if (route.rateLimit !== 'Unlimited') {
    if (!responses['429']) {
      responses['429'] = { description: 'Rate limit exceeded', $ref: '#/components/responses/RateLimitExceeded' } as unknown as OpenApiResponse;
    }
  }

  return responses;
}

// ============================================================================
// OPERATION BUILDER
// ============================================================================

/**
 * Convert a route definition to an OpenAPI operation
 */
function routeToOperation(route: RouteDefinition): OpenApiOperation {
  const operation: OpenApiOperation = {
    summary: route.summary,
    description: route.description,
    operationId: route.operationId,
    tags: [route.category],
    security: getSecurityForAuth(route.auth),
    responses: buildResponses(route),
  };

  if (route.deprecated) {
    operation.deprecated = true;
  }

  // Path and query parameters
  const pathQueryParams = extractPathQueryParams(route.parameters);
  if (pathQueryParams.length > 0) {
    operation.parameters = pathQueryParams;
  }

  // Request body
  if (route.method !== 'GET' && route.method !== 'DELETE') {
    const requestBody = extractRequestBody(route.parameters);
    if (requestBody) {
      operation.requestBody = requestBody;
    }
  }

  return operation;
}

// ============================================================================
// SPEC GENERATOR
// ============================================================================

/**
 * Generate a complete OpenAPI 3.1.0 specification from the route registry.
 *
 * @returns Complete OpenAPI spec object
 */
export function generateSpec(): OpenApiSpec {
  const routes = getRoutes();
  const tags = getActiveTags();

  // Build paths
  const paths: Record<string, Record<string, OpenApiOperation>> = {};

  for (const route of routes) {
    // Convert Next.js dynamic routes to OpenAPI path params
    const openApiPath = route.path.replace(/\[(\w+)\]/g, '{$1}');

    if (!paths[openApiPath]) {
      paths[openApiPath] = {};
    }

    const method = route.method.toLowerCase();
    paths[openApiPath][method] = routeToOperation(route);
  }

  // Sort paths alphabetically for consistent output
  const sortedPaths: Record<string, Record<string, OpenApiOperation>> = {};
  for (const key of Object.keys(paths).sort()) {
    sortedPaths[key] = paths[key];
  }

  return {
    openapi: '3.1.0',
    info: {
      title: REGISTRY_CONFIG.title,
      version: REGISTRY_CONFIG.version,
      description: REGISTRY_CONFIG.description,
      contact: REGISTRY_CONFIG.contact,
      license: REGISTRY_CONFIG.license,
    },
    servers: REGISTRY_CONFIG.servers,
    security: [
      { BearerAuth: [] },
      { ApiKeyAuth: [] },
      { AdminAuth: [] },
    ],
    tags: tags.map((t) => ({ name: t.name, description: t.description })),
    paths: sortedPaths,
    components: {
      securitySchemes: SECURITY_SCHEMES,
      schemas: SHARED_SCHEMAS,
      responses: SHARED_RESPONSES,
    },
  };
}

/**
 * Generate spec as a formatted JSON string
 */
export function generateSpecJson(indent: number = 2): string {
  return JSON.stringify(generateSpec(), null, indent);
}

/**
 * Get a summary of what the spec contains
 */
export function getSpecSummary(): {
  version: string;
  totalPaths: number;
  totalOperations: number;
  tags: string[];
  securitySchemes: string[];
} {
  const spec = generateSpec();
  let totalOperations = 0;
  for (const methods of Object.values(spec.paths)) {
    totalOperations += Object.keys(methods).length;
  }

  return {
    version: spec.info.version,
    totalPaths: Object.keys(spec.paths).length,
    totalOperations,
    tags: spec.tags.map((t) => t.name),
    securitySchemes: Object.keys(spec.components.securitySchemes),
  };
}
