import type { SWRConfiguration } from 'swr';

/**
 * Global SWR Configuration
 *
 * Optimized for enterprise fantasy football platform:
 * - Deduplicates requests within 5-second windows
 * - Revalidates on focus every 5 minutes (not every tab switch)
 * - 3 error retries with exponential backoff
 * - Keeps previous data during revalidation (no loading flicker)
 */
export const swrConfig: SWRConfiguration = {
  dedupingInterval: 5000,           // 5s dedup window
  focusThrottleInterval: 300000,    // 5min between focus revalidations
  errorRetryCount: 3,               // Max 3 retries
  errorRetryInterval: 5000,         // 5s base retry interval (SWR applies backoff)
  revalidateOnFocus: true,          // Revalidate on window focus (throttled)
  revalidateOnReconnect: true,      // Revalidate when network reconnects
  revalidateIfStale: true,          // Revalidate stale data
  keepPreviousData: true,           // Show stale data while revalidating
  shouldRetryOnError: true,         // Enable error retry
  onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
    // Don't retry on 404 or 403
    if (error.status === 404 || error.status === 403) return;
    // Don't retry on 401 (auth required — redirect instead)
    if (error.status === 401) return;
    // Max retries
    if (retryCount >= 3) return;
    // Exponential backoff: 5s, 10s, 20s
    setTimeout(() => revalidate({ retryCount }), 5000 * Math.pow(2, retryCount));
  },
};
