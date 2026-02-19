/**
 * API Version Information Endpoint
 *
 * GET /api/v1/version
 *
 * Returns the current API version, supported versions, and deprecation
 * schedule. This is the canonical endpoint for API consumers to check
 * version compatibility and migration requirements.
 *
 * No authentication required -- version info is public.
 *
 * Response includes:
 * - Current stable version
 * - All supported versions with status and release dates
 * - Deprecated versions with sunset dates
 * - API documentation links
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { getVersionInfo, setVersionHeaders, CURRENT_API_VERSION } from '@/lib/studio/api/apiVersion';
import { wrapPublicRoute } from '@/lib/studio/api/wrapRoute';

// ============================================================================
// TYPES
// ============================================================================

interface VersionResponse {
  api: string;
  current: string;
  supported: string[];
  deprecated: string[];
  versions: Record<string, {
    version: string;
    status: string;
    releasedAt: string;
    sunsetAt: string | null;
    changelog: string;
  }>;
  endpoints: {
    studio: string;
    cowork: string;
    health: string;
  };
  requestId: string;
}

interface ErrorResponse {
  error: string;
  requestId: string;
}

// ============================================================================
// HANDLER
// ============================================================================

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VersionResponse | ErrorResponse>
): Promise<void> {
  const requestId = `req_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;

  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed. Use GET.',
      requestId,
    });
  }

  // Set version headers
  setVersionHeaders(res, CURRENT_API_VERSION);

  // Cache version info — changes only on deployment
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=300');

  const versionInfo = getVersionInfo();

  return res.status(200).json({
    api: 'idesaign',
    current: versionInfo.current,
    supported: versionInfo.supported,
    deprecated: versionInfo.deprecated,
    versions: versionInfo.versions,
    endpoints: {
      studio: `/api/${CURRENT_API_VERSION}/studio`,
      cowork: `/api/${CURRENT_API_VERSION}/cowork`,
      health: `/api/${CURRENT_API_VERSION}/health`,
    },
    requestId,
  });
}

export default wrapPublicRoute(handler);
