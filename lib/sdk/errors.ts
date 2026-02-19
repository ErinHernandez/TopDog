/**
 * Idesaign SDK Error Classes
 * Comprehensive error handling for API responses and SDK operations
 */

/**
 * Base error class for all Idesaign SDK errors
 */
export class IdesaignError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly requestId?: string;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode?: number,
    requestId?: string
  ) {
    super(message);
    this.name = 'IdesaignError';
    this.code = code;
    this.statusCode = statusCode;
    this.requestId = requestId;
    this.timestamp = new Date();

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, IdesaignError.prototype);
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      requestId: this.requestId,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }

  /**
   * Create error from API response
   */
  static fromResponse(response: {
    status: number;
    statusText?: string;
    headers?: { [key: string]: string };
    data?: any;
  }): IdesaignError {
    const requestId = response.headers?.['x-request-id'];
    const errorData = response.data?.error || response.data;
    const message = errorData?.message || response.statusText || 'Unknown error';
    const code = errorData?.code || `HTTP_${response.status}`;

    switch (response.status) {
      case 400:
        return new ValidationError(
          message,
          code,
          errorData?.details,
          requestId
        );
      case 401:
        return new AuthenticationError(message, code, requestId);
      case 403:
        return new ForbiddenError(message, code, requestId);
      case 404:
        return new NotFoundError(message, code, requestId);
      case 429:
        const retryAfter = parseInt(
          response.headers?.['retry-after'] || '60',
          10
        );
        return new RateLimitError(message, code, retryAfter, requestId);
      case 500:
      case 502:
      case 503:
      case 504:
        return new ServerError(message, code, response.status, requestId);
      default:
        return new IdesaignError(message, code, response.status, requestId);
    }
  }
}

/**
 * Authentication error (401)
 * Thrown when API key is missing, invalid, or expired
 */
export class AuthenticationError extends IdesaignError {
  constructor(
    message: string = 'Authentication failed',
    code: string = 'AUTHENTICATION_ERROR',
    requestId?: string
  ) {
    super(message, code, 401, requestId);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Forbidden error (403)
 * Thrown when user lacks permission for the requested resource
 */
export class ForbiddenError extends IdesaignError {
  constructor(
    message: string = 'Access forbidden',
    code: string = 'FORBIDDEN_ERROR',
    requestId?: string
  ) {
    super(message, code, 403, requestId);
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Not found error (404)
 * Thrown when requested resource does not exist
 */
export class NotFoundError extends IdesaignError {
  constructor(
    message: string = 'Resource not found',
    code: string = 'NOT_FOUND_ERROR',
    requestId?: string
  ) {
    super(message, code, 404, requestId);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Rate limit error (429)
 * Thrown when API rate limit is exceeded
 */
export class RateLimitError extends IdesaignError {
  public readonly retryAfter: number;

  constructor(
    message: string = 'Rate limit exceeded',
    code: string = 'RATE_LIMIT_ERROR',
    retryAfter: number = 60,
    requestId?: string
  ) {
    super(message, code, 429, requestId);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }

  /**
   * Get retry delay in milliseconds
   */
  getRetryDelayMs(): number {
    return this.retryAfter * 1000;
  }

  /**
   * Check if should retry now
   */
  shouldRetryAfter(delayMs: number): boolean {
    return delayMs >= this.getRetryDelayMs();
  }
}

/**
 * Validation error (400)
 * Thrown when request validation fails
 */
export class ValidationError extends IdesaignError {
  public readonly fieldErrors: Record<string, string[]>;

  constructor(
    message: string = 'Validation failed',
    code: string = 'VALIDATION_ERROR',
    fieldErrors?: Record<string, string[]> | Record<string, any>,
    requestId?: string
  ) {
    super(message, code, 400, requestId);
    this.name = 'ValidationError';
    this.fieldErrors = normalizeFieldErrors(fieldErrors);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  /**
   * Get all error messages flattened
   */
  getAllErrors(): string[] {
    return Object.values(this.fieldErrors).flat();
  }

  /**
   * Check if specific field has errors
   */
  hasFieldError(fieldName: string): boolean {
    return fieldName in this.fieldErrors && this.fieldErrors[fieldName].length > 0;
  }

  /**
   * Get errors for specific field
   */
  getFieldErrors(fieldName: string): string[] {
    return this.fieldErrors[fieldName] || [];
  }

  /**
   * Get error message for first field error
   */
  getFirstFieldError(): string | null {
    const allErrors = this.getAllErrors();
    return allErrors.length > 0 ? allErrors[0] : null;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      fieldErrors: this.fieldErrors,
    };
  }
}

/**
 * Server error (500+)
 * Thrown when server encounters an error
 */
export class ServerError extends IdesaignError {
  constructor(
    message: string = 'Server error',
    code: string = 'SERVER_ERROR',
    statusCode: number = 500,
    requestId?: string
  ) {
    super(message, code, statusCode, requestId);
    this.name = 'ServerError';
    Object.setPrototypeOf(this, ServerError.prototype);
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return this.statusCode ? this.statusCode >= 500 && this.statusCode < 600 : false;
  }
}

/**
 * Network error
 * Thrown when network request fails
 */
export class NetworkError extends IdesaignError {
  public readonly cause?: Error;

  constructor(
    message: string = 'Network request failed',
    cause?: Error,
    requestId?: string
  ) {
    super(message, 'NETWORK_ERROR', undefined, requestId);
    this.name = 'NetworkError';
    this.cause = cause;
    Object.setPrototypeOf(this, NetworkError.prototype);
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    if (!this.cause) return true;
    const message = this.cause.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('econnreset') ||
      message.includes('econnrefused') ||
      message.includes('etimedout')
    );
  }
}

/**
 * Timeout error
 * Thrown when request exceeds timeout
 */
export class TimeoutError extends NetworkError {
  public readonly timeoutMs: number;

  constructor(timeoutMs: number, requestId?: string) {
    super(`Request timeout after ${timeoutMs}ms`, undefined, requestId);
    this.name = 'TimeoutError';
    this.code = 'TIMEOUT_ERROR';
    this.timeoutMs = timeoutMs;
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      timeoutMs: this.timeoutMs,
    };
  }
}

/**
 * Abort error
 * Thrown when request is aborted
 */
export class AbortError extends IdesaignError {
  constructor(message: string = 'Request aborted', requestId?: string) {
    super(message, 'ABORT_ERROR', undefined, requestId);
    this.name = 'AbortError';
    Object.setPrototypeOf(this, AbortError.prototype);
  }
}

/**
 * Configuration error
 * Thrown when SDK configuration is invalid
 */
export class ConfigurationError extends IdesaignError {
  constructor(message: string, code: string = 'CONFIGURATION_ERROR') {
    super(message, code);
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * Async operation error
 * Thrown when async operation fails
 */
export class AsyncOperationError extends IdesaignError {
  public readonly operationId: string;
  public readonly operationType: string;

  constructor(
    message: string,
    operationId: string,
    operationType: string,
    code: string = 'ASYNC_OPERATION_ERROR',
    requestId?: string
  ) {
    super(message, code, undefined, requestId);
    this.name = 'AsyncOperationError';
    this.operationId = operationId;
    this.operationType = operationType;
    Object.setPrototypeOf(this, AsyncOperationError.prototype);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      operationId: this.operationId,
      operationType: this.operationType,
    };
  }
}

// ============================================================================
// Error Utility Functions
// ============================================================================

/**
 * Normalize field errors from API response
 */
function normalizeFieldErrors(
  fieldErrors?: Record<string, string[]> | Record<string, any>
): Record<string, string[]> {
  if (!fieldErrors) return {};

  const normalized: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(fieldErrors)) {
    if (Array.isArray(value)) {
      normalized[key] = value.map(v => String(v));
    } else if (typeof value === 'string') {
      normalized[key] = [value];
    } else {
      normalized[key] = [String(value)];
    }
  }

  return normalized;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof RateLimitError) return true;
  if (error instanceof TimeoutError) return true;
  if (error instanceof NetworkError) return error.isRetryable();
  if (error instanceof ServerError) return error.isRetryable();
  return false;
}

/**
 * Extract request ID from error
 */
export function getRequestId(error: unknown): string | undefined {
  if (error instanceof IdesaignError) {
    return error.requestId;
  }
  return undefined;
}

/**
 * Extract error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Extract error code
 */
export function getErrorCode(error: unknown): string | undefined {
  if (error instanceof IdesaignError) {
    return error.code;
  }
  return undefined;
}

/**
 * Type guard for IdesaignError
 */
export function isIdesaignError(error: unknown): error is IdesaignError {
  return error instanceof IdesaignError;
}

/**
 * Type guard for ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Type guard for RateLimitError
 */
export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}

/**
 * Type guard for AuthenticationError
 */
export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

/**
 * Type guard for TimeoutError
 */
export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}
