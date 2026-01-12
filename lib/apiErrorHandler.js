/**
 * Centralized API Error Handling and Logging System
 * 
 * Provides consistent error handling, structured logging, and request tracking
 * across all API routes for better debugging and monitoring.
 */

/**
 * Generate a unique request ID for tracking requests across logs
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Error types for categorization
 */
export const ErrorType = {
  VALIDATION: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  RATE_LIMIT: 'RATE_LIMIT',
  EXTERNAL_API: 'EXTERNAL_API_ERROR',
  DATABASE: 'DATABASE_ERROR',
  INTERNAL: 'INTERNAL_SERVER_ERROR',
  CONFIGURATION: 'CONFIGURATION_ERROR',
  STRIPE: 'STRIPE_ERROR',
};

/**
 * Log levels
 */
const LogLevel = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

/**
 * Structured logger with request context
 */
class ApiLogger {
  constructor(requestId, route, method) {
    this.requestId = requestId;
    this.route = route;
    this.method = method;
    this.startTime = Date.now();
  }

  /**
   * Format log entry with context
   */
  formatLog(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const duration = Date.now() - this.startTime;
    
    const logEntry = {
      timestamp,
      level,
      requestId: this.requestId,
      route: this.route,
      method: this.method,
      duration: `${duration}ms`,
      message,
      ...data,
    };

    // In production, only log errors and warnings
    // In development, log everything
    const shouldLog = 
      process.env.NODE_ENV === 'development' ||
      level === LogLevel.ERROR ||
      level === LogLevel.WARN;

    if (shouldLog) {
      const logMethod = level === LogLevel.ERROR ? console.error : 
                       level === LogLevel.WARN ? console.warn : 
                       console.log;
      
      logMethod(JSON.stringify(logEntry, null, process.env.NODE_ENV === 'development' ? 2 : 0));
    }

    return logEntry;
  }

  error(message, error = null, context = {}) {
    const data = {
      ...context,
    };

    if (error) {
      data.error = {
        message: error.message,
        name: error.name,
        code: error.code,
      };

      // Include stack trace in development
      if (process.env.NODE_ENV === 'development' && error.stack) {
        data.error.stack = error.stack;
      }
    }

    return this.formatLog(LogLevel.ERROR, message, data);
  }

  warn(message, context = {}) {
    return this.formatLog(LogLevel.WARN, message, context);
  }

  info(message, context = {}) {
    return this.formatLog(LogLevel.INFO, message, context);
  }

  debug(message, context = {}) {
    return this.formatLog(LogLevel.DEBUG, message, context);
  }
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(errorType, message, details = {}, requestId = null) {
  const statusCodes = {
    [ErrorType.VALIDATION]: 400,
    [ErrorType.UNAUTHORIZED]: 401,
    [ErrorType.FORBIDDEN]: 403,
    [ErrorType.NOT_FOUND]: 404,
    [ErrorType.METHOD_NOT_ALLOWED]: 405,
    [ErrorType.RATE_LIMIT]: 429,
    [ErrorType.EXTERNAL_API]: 502,
    [ErrorType.DATABASE]: 503,
    [ErrorType.CONFIGURATION]: 500,
    [ErrorType.INTERNAL]: 500,
  };

  const statusCode = statusCodes[errorType] || 500;

  const response = {
    error: {
      type: errorType,
      message,
      requestId,
      timestamp: new Date().toISOString(),
    },
  };

  // Add details if provided (but not in production for sensitive info)
  if (Object.keys(details).length > 0) {
    if (process.env.NODE_ENV === 'development' || details.safeForProduction) {
      response.error.details = details;
    }
  }

  return {
    statusCode,
    body: response,
  };
}

/**
 * Wrapper for API route handlers with error handling
 * 
 * Usage:
 * ```js
 * export default async function handler(req, res) {
 *   return withErrorHandling(req, res, async (req, res, logger) => {
 *     // Your route logic here
 *     logger.info('Processing request');
 *     // ...
 *   });
 * }
 * ```
 */
export function withErrorHandling(req, res, handler) {
  const requestId = generateRequestId();
  const route = req.url || 'unknown';
  const method = req.method || 'UNKNOWN';
  const logger = new ApiLogger(requestId, route, method);

  // Set request ID in response header for client tracking
  res.setHeader('X-Request-ID', requestId);

  // Log incoming request (in development)
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Incoming request', {
      query: req.query,
      body: req.body,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
      },
    });
  }

  return Promise.resolve()
    .then(() => handler(req, res, logger))
    .catch((error) => {
      // Determine error type
      let errorType = ErrorType.INTERNAL;
      let statusCode = 500;
      let message = 'An internal server error occurred';
      let details = {};

      // Handle known error types
      if (error.name === 'ValidationError' || error.message?.includes('required')) {
        errorType = ErrorType.VALIDATION;
        statusCode = 400;
        message = error.message || 'Invalid request parameters';
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        errorType = ErrorType.EXTERNAL_API;
        statusCode = 502;
        message = 'External service unavailable';
        details = { service: 'external_api' };
      } else if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        errorType = ErrorType.FORBIDDEN;
        statusCode = 403;
        message = error.message || 'Permission denied';
      } else if (error.message?.includes('not found')) {
        errorType = ErrorType.NOT_FOUND;
        statusCode = 404;
        message = error.message || 'Resource not found';
      } else if (error.message?.includes('API key') || error.message?.includes('configured')) {
        errorType = ErrorType.CONFIGURATION;
        statusCode = 500;
        message = error.message || 'Configuration error';
      } else {
        // Use error message if available, otherwise default
        message = error.message || message;
        details = {
          name: error.name,
          code: error.code,
        };
      }

      // Log the error
      logger.error(message, error, {
        errorType,
        statusCode,
        ...details,
      });

      // Create and send error response
      const errorResponse = createErrorResponse(errorType, message, details, requestId);
      
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    });
}

/**
 * Helper to validate required query parameters
 */
export function validateQueryParams(req, requiredParams, logger) {
  const missing = [];
  
  for (const param of requiredParams) {
    if (!req.query[param] && req.query[param] !== 0) {
      missing.push(param);
    }
  }

  if (missing.length > 0) {
    const error = new Error(`Missing required query parameters: ${missing.join(', ')}`);
    error.name = 'ValidationError';
    logger.warn('Validation failed', { missingParams: missing });
    throw error;
  }

  return true;
}

/**
 * Helper to validate required request body fields
 */
export function validateBody(req, requiredFields, logger) {
  const missing = [];
  
  for (const field of requiredFields) {
    if (!req.body || !req.body[field] && req.body[field] !== 0) {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    const error = new Error(`Missing required body fields: ${missing.join(', ')}`);
    error.name = 'ValidationError';
    logger.warn('Validation failed', { missingFields: missing });
    throw error;
  }

  return true;
}

/**
 * Helper to validate HTTP method
 */
export function validateMethod(req, allowedMethods, logger) {
  if (!allowedMethods.includes(req.method)) {
    logger.warn('Method not allowed', { 
      requested: req.method, 
      allowed: allowedMethods 
    });
    throw new Error(`Method ${req.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`);
  }
  return true;
}

/**
 * Helper to check required environment variables
 */
export function requireEnvVar(varName, logger) {
  const value = process.env[varName];
  if (!value) {
    logger.error(`Missing required environment variable: ${varName}`);
    const error = new Error(`${varName} not configured`);
    error.name = 'ConfigurationError';
    throw error;
  }
  return value;
}

/**
 * Create a success response helper
 */
export function createSuccessResponse(data, statusCode = 200, logger = null) {
  if (logger) {
    logger.info('Request completed successfully', { 
      statusCode,
      dataSize: JSON.stringify(data).length 
    });
  }
  
  return {
    statusCode,
    body: {
      ok: true,
      data,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Export error types and logger class for direct use if needed
 */
export { ApiLogger, ErrorType as ApiErrorType };

