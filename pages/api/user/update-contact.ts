// File: pages/api/user/update-contact.ts
/**
 * User Contact Update API
 *
 * FIX #2 - IDOR PREVENTION: Verifies authenticated user matches the userId being updated
 * to prevent users from modifying other users' contact information.
 */
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { NextApiRequest, NextApiResponse } from 'next';

import { verifyAuthToken, verifyUserAccess } from '@/lib/apiAuth';
import {
  withErrorHandling,
  validateMethod,
  validateRequestBody,
} from '@/lib/apiErrorHandler';
import type { ApiLogger } from '@/lib/apiErrorHandler';
import { withCSRFProtection } from '@/lib/csrfProtection';
import { getDb } from '@/lib/firebase-utils';
import { updateContactSchema } from '@/lib/validation/user';

const contactHandler = async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  await withErrorHandling(req, res, async (req, res, logger: ApiLogger) => {
    validateMethod(req, ['POST'], logger);

    // NOTE: CSRF protection should be added via middleware.ts matcher coverage
    // of /api/v1/* routes for stateless token validation

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

    const { userId, email, phone } = validateRequestBody(req, updateContactSchema, logger);

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
};

// Export with CSRF protection wrapper - FIX #3
export default withCSRFProtection(contactHandler as any);
