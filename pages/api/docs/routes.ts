/**
 * Route Registry Endpoint
 *
 * Serves registered route metadata for the docs UI. Provides endpoints
 * for listing routes by category, searching, and getting statistics.
 *
 * GET /api/docs/routes — List all routes
 * GET /api/docs/routes?category=Admin — Filter by category
 * GET /api/docs/routes?search=upload — Search by path or summary
 * GET /api/docs/routes?stats=true — Get registry statistics
 *
 * @module pages/api/docs/routes
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { wrapPublicRoute } from '@/lib/studio/api/wrapRoute';
import { initializeRoutes } from '@/lib/api-docs/routes';
import {
  getRoutes,
  getRoutesByCategory,
  getRegistryStats,
  clearRoutes,
} from '@/lib/api-docs/registry';
import type { RouteCategory } from '@/lib/api-docs/types';

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
    clearRoutes();
    initializeRoutes();

    const { category, search, stats } = req.query;

    // Stats mode
    if (stats === 'true') {
      const registryStats = getRegistryStats();
      res.status(200).json(registryStats);
      return;
    }

    // Category filter
    if (typeof category === 'string') {
      const routes = getRoutesByCategory(category as RouteCategory);
      res.status(200).json({
        category,
        routes,
        count: routes.length,
      });
      return;
    }

    // Search
    if (typeof search === 'string') {
      const query = search.toLowerCase();
      const allRoutes = getRoutes();
      const matched = allRoutes.filter(
        (r) =>
          r.path.toLowerCase().includes(query) ||
          r.summary.toLowerCase().includes(query) ||
          r.operationId.toLowerCase().includes(query)
      );
      res.status(200).json({
        query: search,
        routes: matched,
        count: matched.length,
      });
      return;
    }

    // Default: all routes
    const allRoutes = getRoutes();
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    res.status(200).json({
      routes: allRoutes,
      count: allRoutes.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list routes';
    res.status(500).json({ error: message });
  }
}

export default wrapPublicRoute(handler);
