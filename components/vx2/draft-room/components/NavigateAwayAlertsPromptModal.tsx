/**
 * NavigateAwayAlertsPromptModal
 *
 * Shown when the user tries to leave their first draft room. Asks if they want
 * draft alerts when navigating away, with options for in-app vs outside app.
 * We never ask for notification permission on app open or sign up — only here.
 */

import React, { useState, useCallback } from 'react';
import { SPACING, TYPOGRAPHY, RADIUS } from '../../core/constants/sizes';
import { useAuth } from '../../auth/hooks/useAuth';
import { createScopedLogger } from '../../../../lib/clientLogger';

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
          logger.warn('Notification.requestPermission failed', e instanceof Error ? e : new Error(String(e)));
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
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: MODAL_COLORS.backdrop,
        zIndex: 9999,
        padding: SPACING.lg,
        pointerEvents: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 340,
          backgroundColor: MODAL_COLORS.background,
          borderRadius: RADIUS.xl,
          padding: 24,
          position: 'relative',
          zIndex: 10001,
          pointerEvents: 'auto',
        }}
      >
        <h2
          id="alerts-prompt-title"
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: MODAL_COLORS.title,
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          Get alerts when you leave?
        </h2>
        <p
          style={{
            fontSize: TYPOGRAPHY.fontSize.sm,
            color: MODAL_COLORS.description,
            textAlign: 'center',
            lineHeight: 1.5,
            marginBottom: 24,
          }}
        >
          Do you want to receive draft alerts when you're not on this screen?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: RADIUS.lg,
              border: `1px solid ${MODAL_COLORS.border}`,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={inApp}
              onChange={(e) => setInApp(e.target.checked)}
              style={{ width: 20, height: 20 }}
            />
            <span style={{ color: MODAL_COLORS.label, fontSize: 15 }}>
              When I'm elsewhere in the app (other tabs, My Teams, etc.)
            </span>
          </label>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: RADIUS.lg,
              border: `1px solid ${MODAL_COLORS.border}`,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={outsideApp}
              onChange={(e) => setOutsideApp(e.target.checked)}
              style={{ width: 20, height: 20 }}
            />
            <span style={{ color: MODAL_COLORS.label, fontSize: 15 }}>
              When I leave the app or switch browser tabs
            </span>
          </label>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleEnable}
            disabled={saving}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: RADIUS.lg,
              border: 'none',
              backgroundColor: MODAL_COLORS.primaryButton,
              color: MODAL_COLORS.primaryText,
              fontWeight: 600,
              fontSize: 16,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Enable'}
          </button>
          <button
            onClick={handleNoThanks}
            disabled={saving}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: RADIUS.lg,
              border: 'none',
              backgroundColor: MODAL_COLORS.secondaryButton,
              color: MODAL_COLORS.secondaryText,
              fontWeight: 500,
              fontSize: 16,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
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
