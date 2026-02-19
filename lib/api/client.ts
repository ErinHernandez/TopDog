/**
 * API Client with CSRF Protection
 *
 * Provides a fetch wrapper that automatically:
 * 1. Fetches and caches CSRF tokens from /api/csrf-token
 * 2. Injects x-csrf-token header on state-changing requests (POST, PUT, DELETE, PATCH)
 * 3. Refreshes tokens on 403 CSRF_TOKEN_INVALID responses
 * 4. Handles common error scenarios
 *
 * @module lib/api/client
 */

interface FetchOptions extends RequestInit {
  skipCsrf?: boolean;
}

interface ApiErrorResponse {
  success: false;
  error?: string;
  message?: string;
}

interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
}

type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// Global CSRF token cache
let cachedCsrfToken: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;

const STATE_CHANGING_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

/**
 * Fetch a fresh CSRF token from the endpoint
 */
async function fetchCsrfToken(): Promise<string> {
  try {
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'include', // Include cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.status}`);
    }

    const data = (await response.json()) as { csrfToken: string };
    cachedCsrfToken = data.csrfToken;
    return data.csrfToken;
  } catch (error) {
    console.error('CSRF token fetch failed:', error);
    cachedCsrfToken = null;
    throw error;
  }
}

/**
 * Get CSRF token (cached or fetch new one)
 */
async function getCsrfToken(): Promise<string> {
  // Return cached token if available
  if (cachedCsrfToken) {
    return cachedCsrfToken;
  }

  // Return existing fetch promise if in progress
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  // Fetch new token
  csrfTokenPromise = fetchCsrfToken();
  try {
    const token = await csrfTokenPromise;
    return token;
  } finally {
    csrfTokenPromise = null;
  }
}

/**
 * Clear cached CSRF token (call after token refresh)
 */
export function clearCsrfToken(): void {
  cachedCsrfToken = null;
}

/**
 * Fetch wrapper with automatic CSRF token injection
 *
 * @param url - The URL to fetch
 * @param options - Fetch options (automatically adds CSRF token for state-changing requests)
 * @returns Promise resolving to Response object
 *
 * @example
 * // GET request (no CSRF needed)
 * const data = await apiClient('/api/players', { method: 'GET' });
 *
 * @example
 * // POST request (CSRF token automatically injected)
 * const response = await apiClient('/api/user/update-contact', {
 *   method: 'POST',
 *   body: JSON.stringify({ phone: '+1234567890' }),
 * });
 *
 * @example
 * // Skip CSRF for specific requests
 * const response = await apiClient('/api/health', {
 *   method: 'POST',
 *   skipCsrf: true,
 * });
 */
export async function apiClient(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});

  // Set default content type if not specified
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Inject CSRF token for state-changing requests
  if (STATE_CHANGING_METHODS.includes(method) && !options.skipCsrf) {
    try {
      const token = await getCsrfToken();
      headers.set('x-csrf-token', token);
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
      // Continue anyway - server will reject with 403 if token is required
    }
  }

  // Make the request
  const response = await fetch(url, {
    ...options,
    method,
    headers,
    credentials: 'include', // Include cookies
  });

  // Handle CSRF token refresh on 403
  if (response.status === 403) {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      try {
        const body = (await response.json()) as ApiErrorResponse;
        if (body.error === 'CSRF_TOKEN_INVALID' && !options.skipCsrf) {
          // Clear cached token and retry
          clearCsrfToken();

          // Get new token
          const newToken = await getCsrfToken();
          headers.set('x-csrf-token', newToken);

          // Retry the request
          return fetch(url, {
            ...options,
            method,
            headers,
            credentials: 'include',
          });
        }
      } catch {
        // If JSON parsing fails, just return the original response
      }
    }
  }

  return response;
}

/**
 * Typed API client for JSON responses
 *
 * @example
 * const response = await apiJson<UserProfile>('/api/user/profile', {
 *   method: 'GET',
 * });
 * if (response.success) {
 *   console.log(response.data);
 * }
 */
export async function apiJson<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient(url, options);

    if (!response.ok) {
      const body = (await response.json()) as ApiErrorResponse;
      return body;
    }

    const body = (await response.json()) as ApiResponse<T>;
    return body;
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      error: 'Network error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Initialize CSRF token on app load
 * Call this in your root component or during app initialization
 *
 * @example
 * useEffect(() => {
 *   initializeCsrf().catch(console.error);
 * }, []);
 */
export async function initializeCsrf(): Promise<void> {
  try {
    await getCsrfToken();
  } catch (error) {
    console.warn('Failed to initialize CSRF token:', error);
    // Non-fatal - token will be fetched on first state-changing request
  }
}
