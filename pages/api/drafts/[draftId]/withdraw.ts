/**
 * Draft Withdrawal API
 *
 * Handles user withdrawal from a draft before it starts.
 * Processes refunds and removes participant from draft room.
 *
 * POST /api/drafts/[draftId]/withdraw
 *
 * @module pages/api/drafts/[draftId]/withdraw
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  doc,
  getDoc,
  serverTimestamp,
  runTransaction,
  increment,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import {
  withErrorHandling,
  validateMethod,
  createSuccessResponse,
} from '../../../../lib/apiErrorHandler';

// ============================================================================
// TYPES
// ============================================================================

interface WithdrawRequest {
  /** User ID requesting withdrawal */
  userId: string;
}

interface WithdrawResponse {
  success: boolean;
  refundAmount?: number;
  refundStatus?: 'processed' | 'pending' | 'not_applicable';
  removedFromParticipants: boolean;
  message?: string;
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['POST'], logger);

    const { draftId } = req.query;
    const { userId } = req.body as WithdrawRequest;

    if (!draftId || typeof draftId !== 'string') {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_DRAFT_ID', message: 'Draft ID is required' },
      });
    }

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_USER_ID', message: 'User ID is required' },
      });
    }

    if (!db) {
      return res.status(500).json({
        ok: false,
        error: { code: 'DATABASE_ERROR', message: 'Database not available' },
      });
    }

    logger.info('Processing withdrawal request', {
      component: 'draft-withdraw',
      operation: 'withdraw',
      draftId,
      userId,
    });

    // Get draft room document
    const draftRef = doc(db, 'draftRooms', draftId);
    const draftSnap = await getDoc(draftRef);

    if (!draftSnap.exists()) {
      logger.warn('Draft room not found for withdrawal', { draftId, userId });
      return res.status(404).json({
        ok: false,
        error: { code: 'DRAFT_NOT_FOUND', message: 'Draft room not found' },
      });
    }

    const draftData = draftSnap.data();
    const draftStatus = draftData.status as string;

    // Only allow withdrawal if draft hasn't started
    if (draftStatus === 'active' || draftStatus === 'complete') {
      logger.warn('Cannot withdraw from active/complete draft', {
        draftId,
        userId,
        status: draftStatus,
      });
      return res.status(400).json({
        ok: false,
        error: {
          code: 'DRAFT_ALREADY_STARTED',
          message: 'Cannot withdraw from a draft that has already started',
        },
      });
    }

    // Find participant
    const participants = draftData.participants as Array<{
      id: string;
      name: string;
      userId?: string;
      entryFee?: number;
    }>;
    const participant = participants.find(
      p => p.id === userId || p.userId === userId
    );

    if (!participant) {
      logger.warn('User not found in draft participants', { draftId, userId });
      return res.status(404).json({
        ok: false,
        error: {
          code: 'PARTICIPANT_NOT_FOUND',
          message: 'User is not a participant in this draft',
        },
      });
    }

    // Process withdrawal in a transaction
    let refundAmount = 0;
    let refundStatus: 'processed' | 'pending' | 'not_applicable' = 'not_applicable';

    await runTransaction(db, async transaction => {
      // Re-read draft data in transaction
      const draftDoc = await transaction.get(draftRef);
      if (!draftDoc.exists()) {
        throw new Error('Draft room not found');
      }

      const currentData = draftDoc.data();
      const currentParticipants = currentData.participants as Array<{
        id: string;
        name: string;
        userId?: string;
        entryFee?: number;
      }>;

      // Remove participant from list
      const updatedParticipants = currentParticipants.filter(
        p => p.id !== userId && p.userId !== userId
      );

      // Check if there was an entry fee to refund
      const withdrawingParticipant = currentParticipants.find(
        p => p.id === userId || p.userId === userId
      );

      if (withdrawingParticipant?.entryFee && withdrawingParticipant.entryFee > 0) {
        refundAmount = withdrawingParticipant.entryFee;
        refundStatus = 'pending';

        // Credit balance back to user account
        const userRef = doc(db!, 'users', userId);
        transaction.update(userRef, {
          balance: increment(refundAmount),
          updatedAt: serverTimestamp(),
        });

        refundStatus = 'processed';
      }

      // Update draft room - track withdrawal for auditing
      transaction.update(draftRef, {
        participants: updatedParticipants,
        participantCount: updatedParticipants.length,
        updatedAt: serverTimestamp(),
        withdrawalHistory: arrayUnion({
          participantId: withdrawingParticipant?.id,
          participantName: withdrawingParticipant?.name,
          withdrawnAt: new Date().toISOString(),
          refundAmount,
        }),
      });
    });

    logger.info('Withdrawal processed successfully', {
      component: 'draft-withdraw',
      operation: 'withdraw',
      draftId,
      userId,
      refundAmount,
      refundStatus,
    });

    const response: WithdrawResponse = {
      success: true,
      refundAmount,
      refundStatus,
      removedFromParticipants: true,
      message: refundAmount > 0
        ? `Successfully withdrawn. $${(refundAmount / 100).toFixed(2)} has been refunded to your balance.`
        : 'Successfully withdrawn from the draft.',
    };

    return res.status(200).json(createSuccessResponse(response));
  });
}
