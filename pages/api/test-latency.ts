/**
 * Latency Test API
 * 
 * Tests latency compensation by measuring round-trip time
 * and returning server timestamp for clock synchronization.
 * 
 * GET /api/test-latency
 * 
 * @module pages/api/test-latency
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandling, validateMethod, createSuccessResponse } from '../../lib/apiErrorHandler';
import { logger } from '../../lib/structuredLogger';

interface LatencyTestResponse {
  success: boolean;
  clientTimestamp: number;
  serverTimestamp: number;
  rtt: number;
  estimatedLatency: number;
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LatencyTestResponse>
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['GET'], logger);

    const clientTimestamp = req.query.clientTimestamp 
      ? parseInt(req.query.clientTimestamp as string, 10)
      : Date.now();

    const serverTimestamp = Date.now();
    const rtt = serverTimestamp - clientTimestamp;
    
    // Estimate one-way latency (half of RTT)
    const estimatedLatency = Math.max(0, rtt / 2);

    logger.info('Latency test', {
      clientTimestamp,
      serverTimestamp,
      rtt,
      estimatedLatency,
    });

    const response = createSuccessResponse({
      success: true,
      clientTimestamp,
      serverTimestamp,
      rtt,
      estimatedLatency: Math.round(estimatedLatency),
      message: 'Latency test successful',
    }, 200, logger);

    // Add server timestamp header for latency compensation
    res.setHeader('X-Server-Time', serverTimestamp.toString());
    res.setHeader('X-Client-Time', clientTimestamp.toString());
    res.setHeader('X-RTT', rtt.toString());

    return res.status(response.statusCode).json(response.body);
  });
}
