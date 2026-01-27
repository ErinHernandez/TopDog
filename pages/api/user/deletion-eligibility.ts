/**
 * GET /api/user/deletion-eligibility
 *
 * Returns whether the authenticated user can delete their account:
 * - Balance must be $0 (must withdraw/claim all funds first)
 * - Must not be in any active tournaments (or must schedule deletion for when they're done)
 *
 * Response: { ok, canDelete, balanceCents, activeTeamCount, reasons[] }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/firebase-utils';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { verifyAuthToken } from '@/lib/apiAuth';
import { serverLogger } from '@/lib/logger/serverLogger';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET allowed' } });
  }

  const authResult = await verifyAuthToken(req.headers.authorization as string);
  if (!authResult.uid) {
    return res.status(401).json({ ok: false, error: { code: 'UNAUTHORIZED', message: authResult.error || 'Authentication required' } });
  }

  const uid = authResult.uid;
  const reasons: string[] = [];

  try {
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
    const teamsSnap = await getDocs(teamsRef);
    const activeTeamCount = teamsSnap.size;

    if (balanceCents > 0) {
      reasons.push('Account balance must be $0. Withdraw or claim all funds before deleting.');
    }
    if (activeTeamCount > 0) {
      reasons.push(`You are in ${activeTeamCount} tournament ${activeTeamCount === 1 ? 'entry' : 'entries'}. Finish or withdraw from active tournaments before deleting, or use "Schedule deletion when my tournaments end."`);
    }

    const canDelete = reasons.length === 0;

    return res.status(200).json({
      ok: true,
      canDelete,
      balanceCents,
      activeTeamCount,
      reasons,
    });
  } catch (err) {
    serverLogger.error('[deletion-eligibility] Failed to check eligibility', err instanceof Error ? err : null, { uid });
    return res.status(500).json({
      ok: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to check eligibility' },
    });
  }
}
