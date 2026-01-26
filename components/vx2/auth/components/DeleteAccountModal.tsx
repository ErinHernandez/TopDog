/**
 * DeleteAccountModal – Account deletion and pause flow
 *
 * - Pause account: reversible; disables adding funds / entering new tournaments
 * - Deletion: only when balance is $0 and user is not in any active tournaments.
 *   Requires password (for email users) and tracing a path to avoid accidental deletion.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { SPACING, TYPOGRAPHY, Z_INDEX } from '../../core/constants/sizes';
import { BG_COLORS, TEXT_COLORS, STATE_COLORS, BORDER_COLORS } from '../../core/constants/colors';
import { Close } from '../../components/icons';
import { useAuth } from '../hooks/useAuth';
import { getAuth } from 'firebase/auth';
import { DeletionTracePath } from './DeletionTracePath';
import { createScopedLogger } from '../../../../lib/clientLogger';

const logger = createScopedLogger('[DeleteAccountModal]');

type Step = 'options' | 'eligibility' | 'confirm';

export interface DeletionEligibility {
  ok: boolean;
  canDelete: boolean;
  balanceCents: number;
  activeTeamCount: number;
  reasons: string[];
}

export interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  onDeleted,
}: DeleteAccountModalProps): React.ReactElement | null {
  const { user, profile, deleteAccount, updateProfile } = useAuth();
  const [step, setStep] = useState<Step>('options');
  const [eligibility, setEligibility] = useState<DeletionEligibility | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [traceComplete, setTraceComplete] = useState(false);
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [pauseSaving, setPauseSaving] = useState(false);
  const accountPaused = profile?.preferences?.accountPaused ?? false;

  const hasEmailPassword = Boolean(user?.email && !user?.isAnonymous);

  const fetchEligibility = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAuth().currentUser?.getIdToken();
      const res = await fetch('/api/user/deletion-eligibility', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setEligibility(null);
        setError(data?.error?.message || 'Could not load eligibility');
        return;
      }
      setEligibility({
        ok: true,
        canDelete: data.canDelete,
        balanceCents: data.balanceCents ?? 0,
        activeTeamCount: data.activeTeamCount ?? 0,
        reasons: data.reasons ?? [],
      });
    } catch (e) {
      logger.warn('Fetch eligibility failed', e instanceof Error ? e : new Error(String(e)));
      setError('Could not load eligibility');
      setEligibility(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setStep('options');
    setEligibility(null);
    setError(null);
    setTraceComplete(false);
    setPassword('');
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && step === 'eligibility') {
      fetchEligibility();
    }
  }, [isOpen, step, fetchEligibility]);

  const handlePause = async () => {
    setPauseSaving(true);
    setError(null);
    try {
      const result = await updateProfile({
        preferences: {
          ...profile?.preferences,
          accountPaused: !accountPaused,
        },
      });
      if (result.success) {
        onClose();
      } else {
        setError(result.error?.message ?? 'Failed to update');
      }
    } catch (e) {
      setError('Failed to update');
    } finally {
      setPauseSaving(false);
    }
  };

  const handleRequestDeletion = () => {
    setStep('eligibility');
  };

  const handleConfirmDeletion = () => {
    setStep('confirm');
    setTraceComplete(false);
    setPassword('');
  };

  const handleDelete = async () => {
    if (!traceComplete) return;
    if (hasEmailPassword && !password.trim()) {
      setError('Enter your password to confirm.');
      return;
    }
    setIsDeleting(true);
    setError(null);
    try {
      const result = await deleteAccount(hasEmailPassword ? password : undefined);
      if (result.success) {
        onDeleted?.();
        onClose();
      } else {
        setError(result.error?.message ?? 'Failed to delete account');
      }
    } catch (e) {
      setError('Something went wrong.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const balanceDollars = eligibility ? (eligibility.balanceCents / 100).toFixed(2) : '—';

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z_INDEX.modal + 10,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.lg,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 400,
          maxHeight: '90vh',
          overflow: 'auto',
          background: BG_COLORS.secondary,
          borderRadius: 16,
          padding: SPACING.lg,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg }}>
          <h2 style={{ color: TEXT_COLORS.primary, fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: 700 }}>
            {step === 'options' && 'Account options'}
            {step === 'eligibility' && 'Request account deletion'}
            {step === 'confirm' && 'Confirm deletion'}
          </h2>
          <button onClick={onClose} className="p-2" aria-label="Close">
            <Close size={24} color={TEXT_COLORS.muted} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: SPACING.sm,
              marginBottom: SPACING.md,
              borderRadius: 8,
              background: 'rgba(239,68,68,0.1)',
              color: STATE_COLORS.error,
              fontSize: TYPOGRAPHY.fontSize.sm,
            }}
          >
            {error}
          </div>
        )}

        {step === 'options' && (
          <div className="space-y-4">
            <p style={{ color: TEXT_COLORS.secondary, fontSize: TYPOGRAPHY.fontSize.sm }}>
              Pause your account to disable new deposits and tournament entries. You can turn it back on anytime.
            </p>
            <button
              onClick={handlePause}
              disabled={pauseSaving}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: `1px solid ${BORDER_COLORS.default}`,
                background: accountPaused ? 'url(/wr_blue.png) no-repeat center center' : BG_COLORS.tertiary,
                backgroundSize: accountPaused ? 'cover' : undefined,
                color: accountPaused ? '#000' : TEXT_COLORS.primary,
                fontWeight: 600,
                fontSize: TYPOGRAPHY.fontSize.base,
              }}
            >
              {pauseSaving ? 'Saving...' : accountPaused ? 'Account paused – tap to resume' : 'Pause account'}
            </button>

            <p style={{ color: TEXT_COLORS.muted, fontSize: TYPOGRAPHY.fontSize.sm, marginTop: 24 }}>
              To permanently delete your account, you must have $0 balance and no active tournament entries. You’ll
              need to withdraw all funds and finish or withdraw from any live drafts first.
            </p>
            <button
              onClick={handleRequestDeletion}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: `1px solid ${STATE_COLORS.error}`,
                background: 'transparent',
                color: STATE_COLORS.error,
                fontWeight: 600,
                fontSize: TYPOGRAPHY.fontSize.base,
              }}
            >
              Request account deletion
            </button>
          </div>
        )}

        {step === 'eligibility' && (
          <div className="space-y-4">
            {loading && <p style={{ color: TEXT_COLORS.muted }}>Checking...</p>}
            {!loading && eligibility && (
              <>
                {!eligibility.canDelete && (
                  <div
                    style={{
                      padding: SPACING.md,
                      borderRadius: 12,
                      background: 'rgba(239,68,68,0.1)',
                      border: `1px solid ${STATE_COLORS.error}40`,
                    }}
                  >
                    <p style={{ color: STATE_COLORS.error, fontWeight: 600, marginBottom: 8 }}>
                      You can’t delete yet
                    </p>
                    <ul style={{ color: TEXT_COLORS.secondary, fontSize: TYPOGRAPHY.fontSize.sm, margin: 0, paddingLeft: 20 }}>
                      {eligibility.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                    <p style={{ color: TEXT_COLORS.muted, fontSize: TYPOGRAPHY.fontSize.xs, marginTop: 12 }}>
                      Your balance is ${balanceDollars}. Withdraw or claim all funds, and finish or withdraw from
                      active tournaments. You can also &quot;Pause account&quot; to stop new activity and delete
                      later when eligible.
                    </p>
                  </div>
                )}
                {eligibility.canDelete && (
                  <p style={{ color: TEXT_COLORS.secondary, fontSize: TYPOGRAPHY.fontSize.sm }}>
                    Your balance is $0 and you have no active tournament entries. You can proceed to confirm deletion.
                  </p>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button
                    onClick={() => setStep('options')}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: `1px solid ${BORDER_COLORS.default}`,
                      background: 'transparent',
                      color: TEXT_COLORS.primary,
                      fontSize: TYPOGRAPHY.fontSize.base,
                    }}
                  >
                    Back
                  </button>
                  {eligibility.canDelete && (
                    <button
                      onClick={handleConfirmDeletion}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: 12,
                        border: 'none',
                        background: 'url(/wr_blue.png) no-repeat center center',
                        backgroundSize: 'cover',
                        color: '#000',
                        fontWeight: 600,
                        fontSize: TYPOGRAPHY.fontSize.base,
                      }}
                    >
                      Continue to confirm
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-6">
            <div style={{ padding: SPACING.md, background: 'rgba(239,68,68,0.1)', borderRadius: 12 }}>
              <p style={{ color: TEXT_COLORS.primary, fontSize: TYPOGRAPHY.fontSize.sm }}>
                This will permanently delete your account and all data. To prevent accidental deletion, trace the path
                below and enter your password.
              </p>
            </div>

            <DeletionTracePath onComplete={() => setTraceComplete(true)} disabled={isDeleting} />

            {hasEmailPassword && (
              <div>
                <label
                  className="block font-medium mb-1"
                  style={{ color: TEXT_COLORS.primary, fontSize: TYPOGRAPHY.fontSize.sm }}
                >
                  Your password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: `2px solid ${BORDER_COLORS.default}`,
                    background: 'rgba(255,255,255,0.05)',
                    color: TEXT_COLORS.primary,
                    fontSize: TYPOGRAPHY.fontSize.base,
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setStep('eligibility')}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: `1px solid ${BORDER_COLORS.default}`,
                  background: 'transparent',
                  color: TEXT_COLORS.primary,
                  fontSize: TYPOGRAPHY.fontSize.base,
                }}
              >
                Back
              </button>
              <button
                onClick={handleDelete}
                disabled={!traceComplete || (hasEmailPassword && !password.trim()) || isDeleting}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: 'none',
                  background:
                    traceComplete && (!hasEmailPassword || password.trim())
                      ? STATE_COLORS.error
                      : BG_COLORS.tertiary,
                  color:
                    traceComplete && (!hasEmailPassword || password.trim()) ? '#fff' : TEXT_COLORS.disabled,
                  fontWeight: 600,
                  fontSize: TYPOGRAPHY.fontSize.base,
                  opacity: isDeleting ? 0.7 : 1,
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete my account'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeleteAccountModal;
