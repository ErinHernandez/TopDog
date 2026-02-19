/**
 * Adapter Pattern Type Definitions
 * 
 * Type-safe interfaces and type guards for adapter pattern implementations.
 * Provides type safety for data transformation layers.
 * 
 * Usage:
 * ```typescript
 * import { DataAdapter, createAdapter, isAdapter } from '@/lib/adapters/types';
 * 
 * const playerAdapter: DataAdapter<RawPlayer, Player> = createAdapter({
 *   transform: (raw) => ({ ... }),
 *   validate: (data) => boolean,
 * });
 * ```
 */

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Data adapter interface
 * 
 * Transforms data from source format (T) to target format (U) with validation.
 */
export interface DataAdapter<T, U> {
  /**
   * Transform source data to target format
   */
  transform(source: T): U;

  /**
   * Validate source data before transformation
   */
  validate?(source: unknown): source is T;

  /**
   * Validate transformed data after transformation
   */
  validateOutput?(data: unknown): data is U;

  /**
   * Optional: Reverse transformation (target to source)
   */
  reverseTransform?(target: U): T;

  /**
   * Optional: Batch transformation
   */
  transformBatch?(sources: T[]): U[];
}

/**
 * Adapter result with error handling
 */
export interface AdapterResult<U> {
  success: boolean;
  data?: U;
  error?: string;
  source?: unknown;
}

/**
 * Adapter error
 */
export class AdapterError extends Error {
  constructor(
    message: string,
    public readonly source?: unknown,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'AdapterError';
  }
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard: Check if value is an adapter
 */
export function isAdapter<T, U>(value: unknown): value is DataAdapter<T, U> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'transform' in value &&
    typeof (value as DataAdapter<T, U>).transform === 'function'
  );
}

/**
 * Type guard: Check if value has required fields
 */
export function hasRequiredFields<T extends Record<string, unknown>>(
  value: unknown,
  requiredFields: (keyof T)[]
): value is T {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return requiredFields.every((field) => field in value);
}

/**
 * Type guard: Check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard: Check if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard: Check if value is an array
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type guard: Check if value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// ============================================================================
// ADAPTER CREATION
// ============================================================================

/**
 * Create a data adapter with type safety
 */
export function createAdapter<T, U>(
  adapter: DataAdapter<T, U>
): DataAdapter<T, U> {
  return {
    transform: (source: T): U => {
      // Validate input if validator provided
      if (adapter.validate && !adapter.validate(source)) {
        throw new AdapterError('Source data validation failed', source);
      }

      try {
        const transformed = adapter.transform(source);

        // Validate output if validator provided
        if (adapter.validateOutput && !adapter.validateOutput(transformed)) {
          throw new AdapterError('Output data validation failed', transformed);
        }

        return transformed;
      } catch (error) {
        if (error instanceof AdapterError) {
          throw error;
        }
        throw new AdapterError(
          `Transformation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          source,
          error instanceof Error ? error : undefined
        );
      }
    },
    validate: adapter.validate,
    validateOutput: adapter.validateOutput,
    reverseTransform: adapter.reverseTransform,
    transformBatch: adapter.transformBatch || ((sources: T[]) => {
      return sources.map(source => adapter.transform(source));
    }),
  };
}

/**
 * Create adapter with safe transformation (returns result instead of throwing)
 */
export function createSafeAdapter<T, U>(
  adapter: DataAdapter<T, U>
): {
  transform: (source: T) => AdapterResult<U>;
  transformBatch: (sources: T[]) => AdapterResult<U>[];
} {
  return {
    transform: (source: T): AdapterResult<U> => {
      try {
        // Validate input if validator provided
        if (adapter.validate && !adapter.validate(source)) {
          return {
            success: false,
            error: 'Source data validation failed',
            source,
          };
        }

        const transformed = adapter.transform(source);

        // Validate output if validator provided
        if (adapter.validateOutput && !adapter.validateOutput(transformed)) {
          return {
            success: false,
            error: 'Output data validation failed',
            source: transformed,
          };
        }

        return {
          success: true,
          data: transformed,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          source,
        };
      }
    },
    transformBatch: (sources: T[]): AdapterResult<U>[] => {
      return sources.map((source) => {
        try {
          if (adapter.validate && !adapter.validate(source)) {
            return {
              success: false,
              error: 'Source data validation failed',
              source,
            };
          }

          const transformed = adapter.transform(source);

          if (adapter.validateOutput && !adapter.validateOutput(transformed)) {
            return {
              success: false,
              error: 'Output data validation failed',
              source: transformed,
            };
          }

          return {
            success: true,
            data: transformed,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            source,
          };
        }
      });
    },
  };
}

// ============================================================================
// COMMON ADAPTERS
// ============================================================================

/**
 * Identity adapter (no transformation)
 */
export function identityAdapter<T>(): DataAdapter<T, T> {
  return createAdapter({
    transform: (source: T) => source,
  });
}

/**
 * Map adapter (applies function to each item)
 */
export function mapAdapter<T, U>(
  transformFn: (item: T) => U
): DataAdapter<T, U> {
  return createAdapter({
    transform: transformFn,
  });
}

/**
 * Filter adapter (filters then transforms)
 */
export function filterAdapter<T, U>(
  filterFn: (item: T) => boolean,
  transformFn: (item: T) => U
): DataAdapter<T[], U[]> {
  return createAdapter({
    transform: (sources: T[]) => {
      return sources.filter(filterFn).map(transformFn);
    },
  });
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Create validator from schema
 */
export function createValidator<T extends Record<string, unknown>>(
  schema: Record<keyof T, (value: unknown) => boolean>
): (value: unknown) => value is T {
  return (value: unknown): value is T => {
    if (!isObject(value)) {
      return false;
    }

    return Object.keys(schema).every((key) => {
      const validator = schema[key as keyof T];
      return validator(value[key]);
    });
  };
}

/**
 * Combine validators with AND logic
 */
export function andValidators<T>(
  ...validators: Array<(value: unknown) => value is T>
): (value: unknown) => value is T {
  return (value: unknown): value is T => {
    return validators.every((validator) => validator(value));
  };
}

/**
 * Combine validators with OR logic
 */
export function orValidators<T>(
  ...validators: Array<(value: unknown) => value is T>
): (value: unknown) => value is T {
  return (value: unknown): value is T => {
    return validators.some((validator) => validator(value));
  };
}
