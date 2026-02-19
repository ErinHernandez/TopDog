/**
 * Terms of Service Acceptance API
 *
 * POST: Record ToS acceptance with timestamp and version
 * GET: Check if user has accepted latest ToS version
 *
 * Requires Firebase Auth via Bearer token
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const admin = require('firebase-admin') as typeof import('firebase-admin');

interface TOSRecord {
  userId: string;
  acceptedAt: string;
  tosVersion: string;
  ipAddress: string;
}

interface TOSCheckResponse {
  accepted: boolean;
  version?: string;
  acceptedAt?: string;
}

interface TOSAcceptanceResponse {
  success: boolean;
  version: string;
  acceptedAt: string;
}

const LATEST_TOS_VERSION = '1.0.0';

// Validation schemas
const PostBodySchema = z.object({
  version: z.string().default(LATEST_TOS_VERSION),
});

/**
 * Extract user from Authorization Bearer token
 */
async function extractUser(req: NextApiRequest): Promise<string | null> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken.uid;
  } catch {
    return null;
  }
}

/**
 * Get client IP address from request
 */
function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    const first = forwarded.split(',')[0];
    return first ? first.trim() : 'unknown';
  }
  const realIp = req.headers['x-real-ip'];
  const ip = Array.isArray(realIp) ? realIp[0] : realIp;
  return ip || req.socket.remoteAddress || 'unknown';
}

/**
 * POST: Record ToS acceptance
 */
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse<TOSAcceptanceResponse | { error: string }>,
): Promise<void> {
  try {
    // Extract and verify user
    const userId = await extractUser(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate request body
    const parseResult = PostBodySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { version } = parseResult.data;
    const db = admin.firestore();
    const ipAddress = getClientIp(req);
    const acceptedAt = new Date().toISOString();

    const tosRecord: TOSRecord = {
      userId,
      acceptedAt,
      tosVersion: version,
      ipAddress,
    };

    // Store in Firestore
    await db.collection('tos_acceptances').doc(userId).set(tosRecord, { merge: true });

    res.status(200).json({
      success: true,
      version,
      acceptedAt,
    });
  } catch (error) {
    console.error('Error recording ToS acceptance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET: Check if user has accepted latest ToS
 */
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<TOSCheckResponse | { error: string }>,
): Promise<void> {
  try {
    // Extract and verify user
    const userId = await extractUser(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = admin.firestore();
    const tosDoc = await db.collection('tos_acceptances').doc(userId).get();

    if (!tosDoc.exists) {
      return res.status(200).json({
        accepted: false,
      });
    }

    const data = tosDoc.data() as TOSRecord;

    res.status(200).json({
      accepted: data.tosVersion === LATEST_TOS_VERSION,
      version: data.tosVersion,
      acceptedAt: data.acceptedAt,
    });
  } catch (error) {
    console.error('Error checking ToS acceptance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>,
): Promise<void> {
  if (req.method === 'POST') {
    await handlePost(req, res);
  } else if (req.method === 'GET') {
    await handleGet(req, res);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
