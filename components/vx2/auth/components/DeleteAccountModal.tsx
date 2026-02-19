/**
 * DeleteAccountModal – Account deletion and pause flow
 *
 * - Pause account: reversible; disables adding funds / entering new tournaments
 * - Deletion: only when balance is $0 and user is not in any active tournaments.
 *   Requires password (for email users) and tracing a path to avoid accidental deletion.
 */

import { getAuth } from 'firebase/auth';
import React, { useState, useEffect, useCallback } from 'react';

import { cn } from '@/lib/styles';

import { createScopedLogger } from '../../../../lib/clientLogger';
import { Close } from '../../components/icons';
import { useAuth } from '../hooks/useAuth';

import sharedStyles from './auth-shared.module.css';
import styles from './DeleteAccountModal.module.css';
import { DeletionTracePath } from './DeletionTracePath';



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
      logger.warn('Fetch eligibility failed', { error: e instanceof Error ? e : new Error(String(e)) });
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
      className={styles.backdrop}
      style={{
        '--z-modal-backdrop': 1010,
      } as React.CSSProperties}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={styles.modalContent}
      >
        <div className={styles.headerContainer}>
          <h2 className={styles.headerTitle}>
            {step === 'options' && 'Account options'}
            {step === 'eligibility' && 'Request account deletion'}
            {step === 'confirm' && 'Confirm deletion'}
          </h2>
          <button onClick={onClose} className={styles.closeButton} aria-label="Close">
            <Close size={24} />
          </button>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        {step === 'options' && (
          <div className={styles.section}>
            <p className={styles.descriptionText}>
              Pause your account to disable new deposits and tournament entries. You can turn it back on anytime.
            </p>
            <button
              onClick={handlePause}
              disabled={pauseSaving}
              className={cn(styles.pauseButton, accountPaused && styles.pauseButtonPaused)}
            >
              {pauseSaving ? 'Saving...' : accountPaused ? 'Account paused – tap to resume' : 'Pause account'}
            </button>

            <p className={styles.warningText}>
              To permanently delete your account, you must have $0 balance and no active tournament entries. You&apos;ll
              need to withdraw all funds and finish or withdraw from any live drafts first.
            </p>
            <button
              onClick={handleRequestDeletion}
              className={styles.deleteButton}
            >
              Request account deletion
            </button>
          </div>
        )}

        {step === 'eligibility' && (
          <div className={styles.section}>
            {loading && <p className={styles.loadingText}>Checking...</p>}
            {!loading && eligibility && (
              <>
                {!eligibility.canDelete && (
                  <div className={styles.ineligibilityBox}>
                    <p className={styles.ineligibilityTitle}>
                      You can&apos;t delete yet
                    </p>
                    <ul className={styles.ineligibilityReasons}>
                      {eligibility.reasons.map((r, i) => (
                        <li key={i} className={styles.ineligibilityReason}>{r}</li>
                      ))}
                    </ul>
                    <p className={styles.ineligibilityHint}>
                      Your balance is ${balanceDollars}. Withdraw or claim all funds, and finish or withdraw from
                      active tournaments. You can also &quot;Pause account&quot; to stop new activity and delete
                      later when eligible.
                    </p>
                  </div>
                )}
                {eligibility.canDelete && (
                  <p className={styles.eligibilityMessage}>
                    Your balance is $0 and you have no active tournament entries. You can proceed to confirm deletion.
                  </p>
                )}
                <div className={styles.buttonGroup}>
                  <div className={styles.buttonGroupItem}>
                    <button
                      onClick={() => setStep('options')}
                      className={styles.backButton}
                    >
                      Back
                    </button>
                  </div>
                  {eligibility.canDelete && (
                    <div className={styles.buttonGroupItem}>
                      <button
                        onClick={handleConfirmDeletion}
                        className={styles.confirmButton}
                      >
                        Continue to confirm
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {step === 'confirm' && (
          <div className={styles.section}>
            <div className={styles.confirmationBox}>
              <p className={styles.confirmationText}>
                This will permanently delete your account and all data. To prevent accidental deletion, trace the path
                below and enter your password.
              </p>
            </div>

            <DeletionTracePath onComplete={() => setTraceComplete(true)} disabled={isDeleting} />

            {hasEmailPassword && (
              <div className={styles.passwordFieldWrapper}>
                <label className={styles.passwordLabel}>
                  Your password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  className={styles.passwordInput}
                />
              </div>
            )}

            <div className={styles.buttonGroup}>
              <div className={styles.buttonGroupItem}>
                <button
                  onClick={() => setStep('eligibility')}
                  disabled={isDeleting}
                  className={styles.backButton}
                >
                  Back
                </button>
              </div>
              <div className={styles.buttonGroupItem}>
                <button
                  onClick={handleDelete}
                  disabled={!traceComplete || (hasEmailPassword && !password.trim()) || isDeleting}
                  className={cn(
                    styles.deleteFinalButton,
                    traceComplete && (!hasEmailPassword || password.trim())
                      ? styles.deleteFinalButtonEnabled
                      : styles.deleteFinalButtonDisabled,
                    isDeleting && styles.deleting
                  )}
                >
                  {isDeleting ? 'Deleting...' : 'Delete my account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeleteAccountModal;
