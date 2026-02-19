/**
 * User Data Export API (CCPA Right to Know)
 *
 * GET: Export all user data as JSON
 *
 * Collects data from:
 * - Firestore user profile
 * - User projects
 * - Gallery submissions
 * - Telemetry events
 * - Cowork sessions
 *
 * Rate limited: 1 request per 24 hours per user
 */

import type { NextApiRequest, NextApiResponse } from 'next';

const admin = require('firebase-admin') as typeof import('firebase-admin');

interface ExportMetadata {
  exportDate: string;
  userId: string;
  dataCategories: string[];
}

interface DataExportResponse {
  metadata: ExportMetadata;
  userProfile?: Record<string, any>;
  projects?: Record<string, any>[];
  gallery?: Record<string, any>[];
  telemetryEvents?: Record<string, any>[];
  coworkSessions?: Record<string, any>[];
}

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
 * Check rate limit for export (1 per 24 hours)
 */
async function checkExportRateLimit(userId: string): Promise<boolean> {
  const db = admin.firestore();
  const rateLimitDoc = await db.collection('rate_limits').doc(`export_${userId}`).get();

  if (!rateLimitDoc.exists) {
    return true;
  }

  const lastExport = rateLimitDoc.data()?.lastExportTime;
  if (!lastExport) {
    return true;
  }

  const now = Date.now();
  const lastExportTime = lastExport.toMillis?.() || lastExport;
  const hoursSinceLastExport = (now - lastExportTime) / (1000 * 60 * 60);

  return hoursSinceLastExport >= 24;
}

/**
 * Record export request for rate limiting
 */
async function recordExportRequest(userId: string): Promise<void> {
  const db = admin.firestore();
  await db.collection('rate_limits').doc(`export_${userId}`).set(
    {
      lastExportTime: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * Export user data from all collections
 */
async function getUserData(userId: string): Promise<DataExportResponse> {
  const db = admin.firestore();
  const dataCategories: string[] = [];
  const exportData: DataExportResponse = {
    metadata: {
      exportDate: new Date().toISOString(),
      userId,
      dataCategories,
    },
  };

  try {
    // Get user profile
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      exportData.userProfile = userDoc.data();
      dataCategories.push('userProfile');
    }

    // Get user projects
    const projectsSnapshot = await db.collection('projects').where('userId', '==', userId).get();
    if (!projectsSnapshot.empty) {
      exportData.projects = projectsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      dataCategories.push('projects');
    }

    // Get gallery submissions
    const gallerySnapshot = await db.collection('gallery').where('userId', '==', userId).get();
    if (!gallerySnapshot.empty) {
      exportData.gallery = gallerySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      dataCategories.push('gallery');
    }

    // Get telemetry events for this user
    const telemetrySnapshot = await db
      .collection('telemetry_events')
      .where('userId', '==', userId)
      .limit(1000)
      .get();
    if (!telemetrySnapshot.empty) {
      exportData.telemetryEvents = telemetrySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      dataCategories.push('telemetryEvents');
    }

    // Get cowork sessions
    const coworkSnapshot = await db
      .collection('cowork_sessions')
      .where('userId', '==', userId)
      .get();
    if (!coworkSnapshot.empty) {
      exportData.coworkSessions = coworkSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      dataCategories.push('coworkSessions');
    }

    exportData.metadata.dataCategories = dataCategories;
  } catch (error) {
    console.error('Error exporting user data:', error);
    throw error;
  }

  return exportData;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DataExportResponse | { error: string }>,
): Promise<void> {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user
    const userId = await extractUser(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check rate limit
    const canExport = await checkExportRateLimit(userId);
    if (!canExport) {
      return res.status(429).json({ error: 'Export request limit exceeded. Please try again in 24 hours.' });
    }

    // Record export request
    await recordExportRequest(userId);

    // Collect all user data
    const exportData = await getUserData(userId);

    // Return as JSON
    res.status(200).json(exportData);
  } catch (error) {
    console.error('Error in data export:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
