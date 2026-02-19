/**
 * Draft Version Analytics API Endpoint
 *
 * POST /api/analytics/draft-version
 *
 * Tracks which draft room version (v2/v3/vx/vx2) users are accessing.
 * Used for Phase 4: Draft Version Consolidation.
 *
 * This endpoint is lightweight and designed to not block the user experience.
 * Analytics failures are silent and don't affect draft room functionality.
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { NextApiRequest, NextApiResponse } from 'next';

import { setCacheHeaders } from '../../../lib/api/cacheHeaders';
import { withErrorHandling } from '../../../lib/apiErrorHandler';
import { getDb } from '../../../lib/firebase-utils';
import { RateLimiter } from '../../../lib/rateLimiter';
import { getClientIP } from '../../../lib/securityLogger';
import { sanitizeErrorMessage } from '../../../lib/utils/errorSanitizer';

interface DraftVersionEvent {
  version: 'v2' | 'v3' | 'vx' | 'vx2';
  userId?: string | null;
  sessionId?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  roomId?: string | null;
  timestamp: ReturnType<typeof serverTimestamp>;
}

interface DraftVersionRequest {
  version: string;
  userId?: string;
  sessionId?: string;
  roomId?: string;
}

// ============================================================================
// RATE LIMITER
// ============================================================================

const rateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
  endpoint: 'draft_version_analytics',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed. Use POST.',
      });
    }

    // Set cache headers - analytics tracking should not be cached
    setCacheHeaders(res, 'no-cache');

    // Rate limiting
    const rateLimitResult = await rateLimiter.check(req);
    res.setHeader('X-RateLimit-Limit', '100');
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt / 1000).toString());

    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
      });
    }

    const body = req.body as DraftVersionRequest;
    const { version, userId, sessionId, roomId } = body;

    // Validate version
    if (!version || !['v2', 'v3', 'vx', 'vx2'].includes(version)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid version. Must be one of: v2, v3, vx, vx2',
      });
    }

    try {
      const db = getDb();
      const ipAddress = getClientIP(req);
      
      // Create event document
      const event: DraftVersionEvent = {
        version: version as 'v2' | 'v3' | 'vx' | 'vx2',
        userId: userId || null,
        sessionId: sessionId || null,
        roomId: roomId || null,
        userAgent: req.headers['user-agent'] || null,
        ipAddress: ipAddress || null,
        timestamp: serverTimestamp(),
      };

      // Store in Firestore
      await addDoc(collection(db, 'draftVersionAnalytics'), event);

      logger.info('Draft version tracked', {
        component: 'analytics',
        operation: 'draft-version-track',
        version,
        userId: userId || 'anonymous',
        roomId: roomId || 'unknown',
      });

      return res.status(200).json({
        success: true,
        message: 'Draft version tracked successfully',
      });
    } catch (error) {
      // Analytics failures should be silent - don't break the user experience
      logger.warn('Failed to track draft version', {
        component: 'analytics',
        operation: 'draft-version-track',
        error: sanitizeErrorMessage(error),
        version,
      });

      // Still return success to not block the user
      return res.status(200).json({
        success: true,
        message: 'Event logged (analytics may be delayed)',
      });
    }
  });
}
