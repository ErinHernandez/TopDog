/**
 * SWR Configuration
 * 
 * Global configuration for SWR data fetching.
 * Provides default fetcher, error handling, and revalidation settings.
 */

import type { SWRConfiguration } from 'swr';

// ============================================================================
// CUSTOM ERROR TYPE
// ============================================================================

/** Extended Error with API response info */
export interface FetchError extends Error {
  info?: Record<string, unknown>;
  status?: number;
}


// ============================================================================
// FETCHERS
// ============================================================================

/**
 * Default JSON fetcher for SWR
 * Handles errors gracefully to prevent runtime crashes
 */
export async function fetcher<T = unknown>(url: string): Promise<T> {
  try {
    const res = await fetch(url);
    
    if (!res.ok) {
      // For client errors (4xx), return empty data instead of throwing
      // This allows components to use fallback/mock data gracefully
      if (res.status >= 400 && res.status < 500) {
        const errorData = await res.json().catch(() => ({}));
        // Log in development but don't throw
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[SWR Fetcher] ${res.status} error for ${url}:`, errorData);
        }
        // Return empty array for list endpoints, empty object for others
        const isListEndpoint = url.match(/\/api\/.*\/list|\/api\/.*s$/) || url.includes('slow-drafts');
        return (isListEndpoint ? [] : {}) as T;
      }
      
      // For server errors (5xx), still throw but with better error info
      const error: FetchError = new Error('An error occurred while fetching the data.');
      error.info = await res.json().catch(() => ({}));
      error.status = res.status;
      throw error;
    }
    
    const data = await res.json();
    
    // Handle API responses that wrap data in { ok, data } format
    if (data.ok !== undefined && data.data !== undefined) {
      return data.data as T;
    }
    
    return data as T;
  } catch (error) {
    // If it's already a FetchError with 5xx status, re-throw it
    const fetchError = error as FetchError;
    if (fetchError.status && fetchError.status >= 500) {
      throw error;
    }
    
    // For all other errors (network, 4xx, etc.), return empty data
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[SWR Fetcher] Error for ${url}, returning empty data:`, error);
    }
    // Return empty array for list endpoints, empty object for others
    const isListEndpoint = url.match(/\/api\/.*\/list|\/api\/.*s$/) || url.includes('slow-drafts');
    return (isListEndpoint ? [] : {}) as T;
  }
}

/**
 * Fetcher with custom options
 */
export async function fetcherWithOptions<T = unknown>(
  [url, options]: [string, RequestInit]
): Promise<T> {
  const res = await fetch(url, options);
  
  if (!res.ok) {
    const error: FetchError = new Error('An error occurred while fetching the data.');
    error.info = await res.json().catch(() => ({}));
    error.status = res.status;
    throw error;
  }
  
  const data = await res.json();
  
  if (data.ok !== undefined && data.data !== undefined) {
    return data.data as T;
  }
  
  return data as T;
}

/** POST fetcher argument type */
interface PostFetcherArg {
  arg: unknown;
}

/**
 * POST fetcher for mutations
 */
export async function postFetcher<T = unknown>(
  url: string, 
  { arg }: PostFetcherArg
): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  });
  
  if (!res.ok) {
    const error: FetchError = new Error('An error occurred while posting the data.');
    error.info = await res.json().catch(() => ({}));
    error.status = res.status;
    throw error;
  }
  
  return res.json() as Promise<T>;
}


// ============================================================================
// SWR CONFIGURATION
// ============================================================================

/**
 * Default SWR configuration options
 */
export const swrConfig: SWRConfiguration = {
  fetcher,
  
  // Revalidation settings
  revalidateOnFocus: false, // Don't refetch when window regains focus
  revalidateOnReconnect: true, // Refetch when network reconnects
  revalidateIfStale: true, // Refetch if data is stale
  
  // Deduplication - prevents duplicate requests within 2 seconds
  dedupingInterval: 2000,
  
  // Error retry settings - default retry count
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  
  // Custom retry logic - don't retry on 400/404 errors
  onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
    const fetchError = error as FetchError;
    // Don't retry on client errors (400, 404) - these are expected in some cases
    if (fetchError.status === 400 || fetchError.status === 404) {
      return; // Don't retry
    }
    // Retry up to 3 times for other errors
    if (retryCount >= 3) {
      return; // Stop retrying after 3 attempts
    }
    // Retry with exponential backoff
    setTimeout(() => revalidate({ retryCount }), 5000);
  },
  
  // Focus throttle - at most one revalidation per 5 seconds on focus
  focusThrottleInterval: 5000,
  
  // Keep previous data while fetching new data
  keepPreviousData: true,
  
  // Global error handler - only log in development, don't crash
  onError: (error: Error, key: string) => {
    const fetchError = error as FetchError;
    // Only log non-400/404 errors in development
    if (process.env.NODE_ENV === 'development' && fetchError.status !== 400 && fetchError.status !== 404) {
      console.error(`SWR Error [${key}]:`, error);
    }
  },
  
  // Loading timeout - show loading state after 3 seconds
  loadingTimeout: 3000,
  
  // Suspense mode disabled by default
  suspense: false,
};


// ============================================================================
// CACHE TIME CONSTANTS
// ============================================================================

/** Cache time constants (in milliseconds) */
export const CACHE_TIMES = {
  // Player data - rarely changes, long cache
  PLAYERS: 24 * 60 * 60 * 1000, // 24 hours
  HEADSHOTS: Infinity, // Immutable - headshots don't change during the season
  PROJECTIONS: 24 * 60 * 60 * 1000, // 24 hours
  
  // Stats - moderate cache
  SEASON_STATS: 6 * 60 * 60 * 1000, // 6 hours
  WEEKLY_STATS: 1 * 60 * 60 * 1000, // 1 hour
  
  // Rankings - moderate cache
  ADP: 6 * 60 * 60 * 1000, // 6 hours
  RANKINGS: 6 * 60 * 60 * 1000, // 6 hours
  
  // Live data - short cache
  INJURIES: 15 * 60 * 1000, // 15 minutes
  NEWS: 5 * 60 * 1000, // 5 minutes
  LIVE_SCORES: 10 * 1000, // 10 seconds
} as const;

/** Cache time type */
export type CacheTimeKey = keyof typeof CACHE_TIMES;


// ============================================================================
// API ENDPOINTS
// ============================================================================

/** API endpoint constants */
export const API_ENDPOINTS = {
  PLAYERS: '/api/nfl/players',
  HEADSHOTS: '/api/nfl/headshots',
  PROJECTIONS: '/api/nfl/projections',
  SEASON_STATS: '/api/nfl/stats/season',
  WEEKLY_STATS: '/api/nfl/stats/weekly',
  ADP: '/api/nfl/fantasy/adp',
  RANKINGS: '/api/nfl/fantasy/rankings',
  INJURIES: '/api/nfl/injuries',
  NEWS: '/api/nfl/news',
  TEAMS: '/api/nfl/teams',
  SCHEDULE: '/api/nfl/schedule',
  BYE_WEEKS: '/api/nfl/bye-weeks',
} as const;

/** API endpoint type */
export type ApiEndpointKey = keyof typeof API_ENDPOINTS;
export type ApiEndpointValue = typeof API_ENDPOINTS[ApiEndpointKey];


export default swrConfig;

