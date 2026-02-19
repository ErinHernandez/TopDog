/**
 * OpenAPI Spec Endpoint
 *
 * Serves the auto-generated OpenAPI 3.1.0 specification as JSON.
 * The spec is generated from the route registry at request time,
 * ensuring it always reflects the current route definitions.
 *
 * GET /api/docs/openapi — Returns the full OpenAPI spec
 * GET /api/docs/openapi?summary=true — Returns a summary only
 *
 * @module pages/api/docs/openapi
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { wrapPublicRoute } from '@/lib/studio/api/wrapRoute';
import { initializeRoutes } from '@/lib/api-docs/routes';
import { generateSpec, getSpecSummary } from '@/lib/api-docs/specGenerator';
import { clearRoutes } from '@/lib/api-docs/registry';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Clear and re-initialize to ensure fresh state
    clearRoutes();
    initializeRoutes();

    const { summary } = req.query;

    if (summary === 'true') {
      const specSummary = getSpecSummary();
      res.status(200).json(specSummary);
      return;
    }

    const spec = generateSpec();

    // Cache the spec for 5 minutes in production
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(spec);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate spec';
    res.status(500).json({ error: message });
  }
}

export default wrapPublicRoute(handler);
