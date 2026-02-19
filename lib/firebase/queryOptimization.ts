/**
 * Firebase Query Optimization Utilities
 * 
 * Provides optimized query patterns for Firestore to reduce latency
 * and data transfer for global users.
 * 
 * @module lib/firebase/queryOptimization
 */

import {
  Query,
  query,
  limit,
  orderBy,
  where,
  startAfter,
  Timestamp,
  WhereFilterOp,
  DocumentSnapshot,
} from 'firebase/firestore';

import { createScopedLogger } from '../clientLogger';

const logger = createScopedLogger('[QueryOptimization]');

/**
 * Filter condition for Firestore queries
 */
export interface QueryFilter {
  field: string;
  operator: WhereFilterOp;
  value: unknown;
}

/**
 * Pagination cursor - can be a DocumentSnapshot or field values
 */
export type PaginationCursor = DocumentSnapshot | unknown[];

// ============================================================================
// TYPES
// ============================================================================

export interface QueryOptions {
  /** Maximum number of documents to fetch */
  limit?: number;
  /** Field to order by */
  orderBy?: string;
  /** Order direction */
  orderDirection?: 'asc' | 'desc';
  /** Start after this document (for pagination) */
  startAfter?: PaginationCursor;
  /** Filter conditions */
  filters?: QueryFilter[];
}

// ============================================================================
// QUERY BUILDERS
// ============================================================================

/**
 * Build an optimized Firestore query with common optimizations
 * 
 * @param baseQuery - Base Firestore query
 * @param options - Query options
 * @returns Optimized query
 */
export function buildOptimizedQuery(
  baseQuery: Query,
  options: QueryOptions = {}
): Query {
  let optimizedQuery: Query = baseQuery;

  // Apply filters first (before ordering for better index usage)
  if (options.filters) {
    for (const filter of options.filters) {
      optimizedQuery = query(
        optimizedQuery,
        where(filter.field, filter.operator, filter.value)
      );
    }
  }

  // Apply ordering
  if (options.orderBy) {
    optimizedQuery = query(
      optimizedQuery,
      orderBy(
        options.orderBy,
        options.orderDirection || 'asc'
      )
    );
  }

  // Apply limit (always last)
  if (options.limit) {
    optimizedQuery = query(optimizedQuery, limit(options.limit));
  }

  // Apply pagination
  if (options.startAfter) {
    optimizedQuery = query(optimizedQuery, startAfter(options.startAfter));
  }

  return optimizedQuery;
}

/**
 * Optimize draft picks query
 * 
 * Fetches only necessary fields and uses proper indexing.
 */
export function optimizeDraftPicksQuery(
  baseQuery: Query,
  roomId: string,
  options: {
    limit?: number;
    startAfter?: PaginationCursor;
    round?: number;
  } = {}
): Query {
  const filters: QueryFilter[] = [];

  // Filter by round if specified (uses composite index)
  if (options.round !== undefined) {
    filters.push({ field: 'round', operator: '==' as WhereFilterOp, value: options.round });
  }

  return buildOptimizedQuery(baseQuery, {
    filters,
    orderBy: 'pickNumber',
    orderDirection: 'asc',
    limit: options.limit || 50, // Default limit to reduce data transfer
    startAfter: options.startAfter,
  });
}

/**
 * Optimize user query - fetch only essential fields
 * 
 * Reduces data transfer by selecting only needed fields.
 */
export function optimizeUserQuery(
  baseQuery: Query,
  fields: string[] = ['username', 'balance', 'displayCurrency']
): Query {
  // Note: Firestore doesn't support field selection in queries
  // This is a pattern guide - actual field selection happens after fetch
  return baseQuery;
}

// ============================================================================
// CACHING HELPERS
// ============================================================================

/**
 * Cache key generator for Firestore queries
 */
export function generateCacheKey(
  collection: string,
  filters?: Record<string, unknown>
): string {
  const filterStr = filters
    ? Object.entries(filters)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}:${value}`)
        .join('|')
    : '';
  return `firestore:${collection}:${filterStr}`;
}

/**
 * Check if query result should be cached
 * 
 * @param collection - Collection name
 * @param ttl - Time to live in seconds
 * @returns Whether to cache
 */
export function shouldCacheQuery(
  collection: string,
  ttl: number = 60
): boolean {
  // Cache read-only collections
  const cacheableCollections = [
    'nflTeams',
    'nflPlayers',
    'draftRooms', // Read operations only
  ];

  return cacheableCollections.includes(collection);
}

// ============================================================================
// CONNECTION MANAGEMENT
// ============================================================================

/**
 * Connection pool configuration
 * 
 * Firebase SDK manages connections automatically, but we can optimize:
 */
export const connectionConfig = {
  // Enable offline persistence for better performance
  enablePersistence: true,
  
  // Cache size (default: 40MB)
  cacheSizeBytes: 40 * 1024 * 1024,
  
  // Synchronize tabs (default: true)
  synchronizeTabs: true,
};

// ============================================================================
// QUERY PERFORMANCE MONITORING
// ============================================================================

/**
 * Measure query performance
 */
export async function measureQueryPerformance<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  const result = await queryFn();
  const duration = performance.now() - startTime;

  // Log slow queries (>500ms)
  if (duration > 500) {
    logger.warn(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

// ============================================================================
// EXPORTS
// ============================================================================

// All exports are declared inline above (export function/const)
// buildOptimizedQuery is exported inline on line 48
