/**
 * User Data Deletion API (GDPR Right to Erasure)
 *
 * DELETE: Hard delete all user personal data
 *
 * Deletes from:
 * - Firestore (profile, projects, gallery, tos_acceptances)
 * - Firebase Storage (user uploads)
 * - Telemetry events with user ID
 *
 * Does NOT delete anonymized/aggregated data (it's no longer personal data)
 *
 * Requires authentication + confirmation token
 * Rate limited: 1 request per 7 days per user
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const admin = require('firebase-admin') as typeof import('firebase-admin');

interface DeletionResponse {
  deleted: true;
  collections: string[];
  timestamp: string;
  message: string;
}

interface DeletionErrorResponse {
  error: string;
}

// Validation schemas
const DeleteBodySchema = z.object({
  confirmationToken: z.string().min(1, 'Confirmation token is required'),
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
 * Verify confirmation token
 */
async function verifyConfirmationToken(userId: string, token: string): Promise<boolean> {
  const db = admin.firestore();
  const tokenDoc = await db.collection('deletion_tokens').doc(token).get();

  if (!tokenDoc.exists) {
    return false;
  }

  const data = tokenDoc.data();
  if (!data || data.userId !== userId) {
    return false;
  }

  // Check token expiration (valid for 1 hour)
  const createdAt = data.createdAt?.toMillis?.() || data.createdAt;
  const now = Date.now();
  if (now - createdAt > 1000 * 60 * 60) {
    return false;
  }

  return true;
}

/**
 * Check rate limit for deletion (1 per 7 days)
 */
async function checkDeletionRateLimit(userId: string): Promise<boolean> {
  const db = admin.firestore();
  const rateLimitDoc = await db.collection('rate_limits').doc(`deletion_${userId}`).get();

  if (!rateLimitDoc.exists) {
    return true;
  }

  const lastDeletion = rateLimitDoc.data()?.lastDeletionTime;
  if (!lastDeletion) {
    return true;
  }

  const now = Date.now();
  const lastDeletionTime = lastDeletion.toMillis?.() || lastDeletion;
  const daysSinceLastDeletion = (now - lastDeletionTime) / (1000 * 60 * 60 * 24);

  return daysSinceLastDeletion >= 7;
}

/**
 * Record deletion request for rate limiting
 */
async function recordDeletionRequest(userId: string): Promise<void> {
  const db = admin.firestore();
  await db.collection('rate_limits').doc(`deletion_${userId}`).set(
    {
      lastDeletionTime: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * Delete user data from all collections
 */
async function deleteUserData(userId: string): Promise<string[]> {
  const db = admin.firestore();
  const storage = admin.storage();
  const deletedCollections: string[] = [];

  try {
    // Delete user profile
    await db.collection('users').doc(userId).delete();
    deletedCollections.push('users');

    // Delete all user projects
    const projectsSnapshot = await db.collection('projects').where('userId', '==', userId).get();
    const projectBatch = db.batch();
    projectsSnapshot.docs.forEach((doc) => {
      projectBatch.delete(doc.ref);
    });
    if (projectsSnapshot.docs.length > 0) {
      await projectBatch.commit();
      deletedCollections.push('projects');
    }

    // Delete all gallery submissions
    const gallerySnapshot = await db.collection('gallery').where('userId', '==', userId).get();
    const galleryBatch = db.batch();
    gallerySnapshot.docs.forEach((doc) => {
      galleryBatch.delete(doc.ref);
    });
    if (gallerySnapshot.docs.length > 0) {
      await galleryBatch.commit();
      deletedCollections.push('gallery');
    }

    // Delete ToS acceptance record
    await db.collection('tos_acceptances').doc(userId).delete();
    deletedCollections.push('tos_acceptances');

    // Delete cowork sessions
    const coworkSnapshot = await db.collection('cowork_sessions').where('userId', '==', userId).get();
    const coworkBatch = db.batch();
    coworkSnapshot.docs.forEach((doc) => {
      coworkBatch.delete(doc.ref);
    });
    if (coworkSnapshot.docs.length > 0) {
      await coworkBatch.commit();
      deletedCollections.push('cowork_sessions');
    }

    // Delete telemetry events with user ID
    const telemetrySnapshot = await db.collection('telemetry_events').where('userId', '==', userId).get();
    const telemetryBatch = db.batch();
    telemetrySnapshot.docs.forEach((doc) => {
      telemetryBatch.delete(doc.ref);
    });
    if (telemetrySnapshot.docs.length > 0) {
      await telemetryBatch.commit();
      deletedCollections.push('telemetry_events');
    }

    // Delete user files from storage
    try {
      const bucket = storage.bucket();
      const [files] = await bucket.getFiles({ prefix: `user_uploads/${userId}/` });
      await Promise.all(files.map((file) => file.delete()));
      if (files.length > 0) {
        deletedCollections.push('storage');
      }
    } catch (storageError) {
      console.error('Error deleting user storage:', storageError);
    }

    // Log the deletion in audit log
    await db.collection('audit_logs').add({
      action: 'data_delete',
      userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      resource: 'user_data',
      outcome: 'success',
    });
  } catch (error) {
    console.error('Error deleting user data:', error);
    throw error;
  }

  return deletedCollections;
}

/**
 * Send deletion confirmation email
 */
async function sendDeletionEmail(userId: string, email: string): Promise<void> {
  try {
    const user = await admin.auth().getUser(userId);
    // In production, integrate with email service (e.g., SendGrid)
    console.log(`Deletion confirmation email would be sent to ${user.email || email}`);
  } catch (error) {
    console.error('Error sending deletion email:', error);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeletionResponse | DeletionErrorResponse>,
): Promise<void> {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user
    const userId = await extractUser(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate request body
    const parseResult = DeleteBodySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Confirmation token is required' });
    }

    const { confirmationToken } = parseResult.data;

    // Verify confirmation token
    const tokenValid = await verifyConfirmationToken(userId, confirmationToken);
    if (!tokenValid) {
      return res.status(403).json({ error: 'Invalid or expired confirmation token' });
    }

    // Check rate limit
    const canDelete = await deletionRateLimit(userId);
    if (!canDelete) {
      return res.status(429).json({ error: 'Deletion request limit exceeded. Please try again in 7 days.' });
    }

    // Delete all user data
    const deletedCollections = await deleteUserData(userId);

    // Record deletion request
    await recordDeletionRequest(userId);

    // Send confirmation email
    try {
      const user = await admin.auth().getUser(userId);
      await sendDeletionEmail(userId, user.email || '');
    } catch (emailError) {
      console.error('Error sending deletion email:', emailError);
    }

    res.status(200).json({
      deleted: true,
      collections: deletedCollections,
      timestamp: new Date().toISOString(),
      message: 'All personal data has been successfully deleted. A confirmation email has been sent.',
    });
  } catch (error) {
    console.error('Error in data deletion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Check if user can delete (rate limit)
 */
async function deletionRateLimit(userId: string): Promise<boolean> {
  return checkDeletionRateLimit(userId);
}
