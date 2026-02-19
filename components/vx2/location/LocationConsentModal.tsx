/**
 * Location Consent Modal
 *
 * Prompts user to enable location tracking with context-aware messaging.
 * Enterprise-grade UX with clear value proposition.
 */

import React, { useState } from 'react';

import { createScopedLogger } from '@/lib/clientLogger';
import type { ConsentModalContext } from '@/lib/location/types';
import { CONSENT_MODAL_CONFIGS } from '@/lib/location/types';

import { STATE_COLORS } from '../core/constants/colors';

import { useLocationConsent } from './hooks/useLocationConsent';
import styles from './LocationConsentModal.module.css';

const logger = createScopedLogger('[LocationConsentModal]');

interface LocationConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: ConsentModalContext;
}

const BENEFITS = [
  {
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    text: 'Protect your drafts from unauthorized access',
  },
  {
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    text: 'Get alerts for suspicious login activity',
  },
  {
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
    text: 'Unlock country & state flags for customization',
  },
];

export function LocationConsentModal({
  isOpen,
  onClose,
  context
}: LocationConsentModalProps) {
  const { grantConsent, dismissPrompt } = useLocationConsent();
  const [rememberChoice, setRememberChoice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config = CONSENT_MODAL_CONFIGS[context];

  async function handleGrant() {
    setIsSubmitting(true);

    try {
      await grantConsent(rememberChoice);
      onClose();
    } catch (error) {
      logger.error('Failed to grant consent:', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeny() {
    setIsSubmitting(true);

    try {
      await dismissPrompt(rememberChoice);
      onClose();
    } catch (error) {
      logger.error('Failed to dismiss prompt:', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          handleDeny();
        }
      }}
    >
      <div
        className={styles.modal}
      >
        {/* Header */}
        <div
          className={styles.header}
        >
          <div className={styles.headerContent}>
            <div className={styles.iconContainer}>
              <svg
                width={24}
                height={24}
                viewBox="0 0 24 24"
                fill="none"
                stroke={STATE_COLORS.info}
                strokeWidth={2}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <div>
              <h2
                className={styles.title}
              >
                {config.title}
              </h2>
              <p
                className={styles.subtitle}
              >
                {config.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div
          className={styles.body}
        >
          {/* Benefits list */}
          <div className={styles.benefitsList}>
            {BENEFITS.map((benefit, index) => (
              <div key={index} className={styles.benefitItem}>
                <div className={styles.benefitIcon}>
                  {benefit.icon}
                </div>
                <span className={styles.benefitText}>
                  {benefit.text}
                </span>
              </div>
            ))}
          </div>

          {/* Privacy note */}
          <p className={styles.privacyNote}>
            We only track country/state level - never your precise location.
            <br />
            You can disable this anytime in Settings.
          </p>

          {/* Remember choice */}
          <label className={styles.rememberChoiceLabel}>
            <input
              type="checkbox"
              checked={rememberChoice}
              onChange={(e) => setRememberChoice(e.target.checked)}
              className={styles.checkbox}
            />
            <span className={styles.rememberChoiceText}>
              Remember my choice
            </span>
          </label>
        </div>

        {/* Footer */}
        <div
          className={styles.footer}
        >
          <button
            onClick={handleDeny}
            disabled={isSubmitting}
            className={styles.denyButton}
          >
            Not Now
          </button>
          <button
            onClick={handleGrant}
            disabled={isSubmitting}
            className={styles.grantButton}
          >
            {isSubmitting ? (
              <div className={styles.spinner} />
            ) : (
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            Enable
          </button>
        </div>
      </div>
    </div>
  );
}

export default LocationConsentModal;
