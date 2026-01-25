// File: pages/api/user/update-contact.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandling } from '@/lib/apiErrorHandler';
import type { ApiLogger } from '@/lib/apiErrorHandler';
import { getDb } from '@/lib/firebase-utils';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { verifyAuthToken, verifyUserAccess } from '@/lib/apiAuth';

interface UpdateContactBody {
  userId: string;
  email?: string;
  phone?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return withErrorHandling(req, res, async (req, res, logger: ApiLogger) => {
    // Only allow POST
    if (req.method !== 'POST') {
      return res.status(405).json({
        ok: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only POST method is allowed',
        },
      });
    }

    // Verify authentication
    const authHeader = req.headers.authorization;
    const authResult = await verifyAuthToken(authHeader);
    
    if (!authResult.uid) {
      return res.status(401).json({
        ok: false,
        error: {
          code: 'UNAUTHORIZED',
          message: authResult.error || 'Authentication required',
        },
      });
    }

    const { userId, email, phone } = req.body as UpdateContactBody;

    // Verify user access - user can only update their own contact info
    if (!verifyUserAccess(authResult.uid, userId)) {
      return res.status(403).json({
        ok: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied - can only update your own contact information',
        },
      });
    }

    // Validate input
    if (!userId) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'userId is required',
        },
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Either email or phone is required',
        },
      });
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email format',
        },
      });
    }

    // Validate phone format if provided (basic validation)
    if (phone && phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid phone format',
        },
      });
    }

    logger.info('Updating user contact information', { userId, hasEmail: !!email, hasPhone: !!phone });

    try {
      const db = getDb();
      const userRef = doc(db, 'users', userId);

      const updates: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };

      if (email) {
        updates.email = email;
        updates.emailVerified = false; // Reset verification when email changes
      }

      if (phone) {
        updates.phone = phone;
        updates.phoneVerified = false; // Reset verification when phone changes
      }

      await updateDoc(userRef, updates);

      logger.info('User contact information updated successfully', { userId });

      return res.status(200).json({
        ok: true,
        data: {
          userId,
          ...(email && { email }),
          ...(phone && { phone }),
        },
      });
    } catch (error: unknown) {
      logger.error('Failed to update user contact information', error instanceof Error ? error : new Error(String(error)), { userId });
      
      return res.status(500).json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update contact information',
        },
      });
    }
  });
}
