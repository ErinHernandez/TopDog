/**
 * GET /api/user/deletion-eligibility
 *
 * Returns whether the authenticated user can delete their account:
 * - Balance must be $0 (must withdraw/claim all funds first)
 * - Must not be in any active tournaments (or must schedule deletion for when they're done)
 *
 * Response: { ok: true, data: { canDelete, balanceCents, activeTeamCount, reasons }, timestamp }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/firebase-utils';
import { doc, getDoc, collection, getDocs, query, limit } from 'firebase/firestore';
import { verifyAuthToken } from '@/lib/apiAuth';
import {
  withErrorHandling,
  validateMethod,
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
  type ApiLogger,
} from '@/lib/apiErrorHandler';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger: ApiLogger) => {
    // Validate HTTP method
    validateMethod(req, ['GET'], logger);

    // Verify authentication
    const authResult = await verifyAuthToken(req.headers.authorization as string);
    if (!authResult.uid) {
      const errorResponse = createErrorResponse(
        ErrorType.UNAUTHORIZED,
        authResult.error || 'Authentication required',
        {},
        null
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }

    const uid = authResult.uid;
    const reasons: string[] = [];

    logger.info('Checking deletion eligibility', { uid });

    const db = getDb();
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : {};

    const balanceCents = typeof userData.balanceCents === 'number'
      ? userData.balanceCents
      : typeof userData.balance === 'number'
        ? Math.round(userData.balance * 100)
        : 0;

    const teamsRef = collection(db, 'users', uid, 'teams');
    const teamsSnap = await getDocs(query(teamsRef, limit(500)));
    const activeTeamCount = teamsSnap.size;

    if (balanceCents > 0) {
      reasons.push('Account balance must be $0. Withdraw or claim all funds before deleting.');
    }
    if (activeTeamCount > 0) {
      reasons.push(`You are in ${activeTeamCount} tournament ${activeTeamCount === 1 ? 'entry' : 'entries'}. Finish or withdraw from active tournaments before deleting, or use "Schedule deletion when my tournaments end."`);
    }

    const canDelete = reasons.length === 0;

    logger.info('Deletion eligibility checked', { uid, canDelete, balanceCents, activeTeamCount });

    const response = createSuccessResponse(
      { canDelete, balanceCents, activeTeamCount, reasons },
      200,
      logger
    );
    return res.status(response.statusCode).json(response.body);
  });
}
