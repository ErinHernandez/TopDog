/**
 * NavigateAwayAlertsPromptModal
 *
 * Shown when the user tries to leave their first draft room. Asks if they want
 * draft alerts when navigating away, with options for in-app vs outside app.
 * We never ask for notification permission on app open or sign up — only here.
 */

import React, { useState, useCallback } from 'react';
import { TYPOGRAPHY } from '../../core/constants/sizes';
import { useAuth } from '../../auth/hooks/useAuth';
import { createScopedLogger } from '../../../../lib/clientLogger';
import styles from './NavigateAwayAlertsPromptModal.module.css';

const logger = createScopedLogger('[NavigateAwayAlertsPromptModal]');

const STORAGE_KEY = 'topdog_draft_alerts_prompt_seen';

const MODAL_COLORS = {
  backdrop: 'rgba(0, 0, 0, 0.7)',
  background: '#1E293B',
  title: '#FFFFFF',
  description: '#94A3B8',
  label: '#E2E8F0',
  border: 'rgba(255,255,255,0.1)',
  primaryButton: '#3B82F6',
  primaryText: '#FFFFFF',
  secondaryButton: 'rgba(255,255,255,0.1)',
  secondaryText: '#94A3B8',
} as const;

const ENABLED_ALERTS = {
  roomFilled: true,
  draftStarting: true,
  twoPicksAway: true,
  onTheClock: true,
  tenSecondsRemaining: true,
};

export interface NavigateAwayAlertsPromptModalProps {
  isOpen: boolean;
  /** Called when user finishes (Enable or No thanks). Opens leave confirmation next. */
  onContinue: () => void;
}

export function NavigateAwayAlertsPromptModal({
  isOpen,
  onContinue,
}: NavigateAwayAlertsPromptModalProps): React.ReactElement | null {
  const { profile, updateProfile } = useAuth();
  const [inApp, setInApp] = useState(true);
  const [outsideApp, setOutsideApp] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleEnable = useCallback(async () => {
    setSaving(true);
    try {
      if (inApp || outsideApp) {
        await updateProfile({
          preferences: {
            ...profile?.preferences,
            draftAlerts: ENABLED_ALERTS,
          },
        });
      }
      if (outsideApp && 'Notification' in window && Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch (e) {
          logger.error('Notification.requestPermission failed', e instanceof Error ? e : new Error(String(e)));
        }
      }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, 'true');
      }
    } catch (e) {
      logger.error('Failed to save alert preferences', e instanceof Error ? e : new Error(String(e)));
    } finally {
      setSaving(false);
    }
    onContinue();
  }, [inApp, outsideApp, profile?.preferences, updateProfile, onContinue]);

  const handleNoThanks = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, 'true');
    }
    onContinue();
  }, [onContinue]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alerts-prompt-title"
      className={styles.backdrop}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={styles.modal}
      >
        <h2
          id="alerts-prompt-title"
          className={styles.title}
        >
          Get alerts when you leave?
        </h2>
        <p className={styles.description}>
          Do you want to receive draft alerts when you're not on this screen?
        </p>

        <div className={styles.checkboxContainer}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={inApp}
              onChange={(e) => setInApp(e.target.checked)}
              className={styles.checkboxInput}
            />
            <span className={styles.checkboxText}>
              When I'm elsewhere in the app (other tabs, My Teams, etc.)
            </span>
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={outsideApp}
              onChange={(e) => setOutsideApp(e.target.checked)}
              className={styles.checkboxInput}
            />
            <span className={styles.checkboxText}>
              When I leave the app or switch browser tabs
            </span>
          </label>
        </div>

        <div className={styles.buttonContainer}>
          <button
            onClick={handleEnable}
            disabled={saving}
            className={styles.primaryButton}
          >
            {saving ? 'Saving...' : 'Enable'}
          </button>
          <button
            onClick={handleNoThanks}
            disabled={saving}
            className={styles.secondaryButton}
          >
            No thanks
          </button>
        </div>
      </div>
    </div>
  );
}

export const DRAFT_ALERTS_PROMPT_SEEN_KEY = STORAGE_KEY;

export default NavigateAwayAlertsPromptModal;
