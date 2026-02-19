/**
 * API Documentation Endpoint
 *
 * Returns the OpenAPI specification for the TopDog API.
 * Can be used with Swagger UI or other API documentation tools.
 *
 * GET /api/docs - Returns OpenAPI JSON specification
 *
 * @module pages/api/docs
 */

import type { NextApiRequest, NextApiResponse } from 'next';

import { openAPISpec } from '../../lib/openapi/swagger';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
): void {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Set CORS headers for Swagger UI
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json');

  // Cache the spec for 1 hour
  res.setHeader('Cache-Control', 'public, max-age=3600');

  res.status(200).json(openAPISpec);
}
