/**
 * UnsavedChangesModal
 * 
 * Enterprise-grade confirmation modal for unsaved changes.
 * Appears when user attempts to navigate away from a tab with unsaved work.
 */

import React from 'react';
import { cn } from '@/lib/styles';
import styles from './UnsavedChangesModal.module.css';
import { BG_COLORS, TEXT_COLORS, RADIUS, SPACING, TYPOGRAPHY, Z_INDEX } from '../core/constants';

// ============================================================================
// TYPES
// ============================================================================

export interface UnsavedChangesModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Called when user chooses to save */
  onSave: () => void;
  /** Called when user chooses to discard changes */
  onDiscard: () => void;
  /** Called when user chooses to cancel (stay on page) */
  onCancel: () => void;
  /** Custom title (default: "Unsaved Changes") */
  title?: string;
  /** Custom message */
  message?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function UnsavedChangesModal({
  isOpen,
  onSave,
  onDiscard,
  onCancel,
  title = 'Unsaved Changes',
  message = 'You have unsaved changes. Would you like to save before leaving?',
}: UnsavedChangesModalProps): React.ReactElement | null {
  if (!isOpen) return null;

  return (
    <div
      className={cn('fixed inset-0 flex items-center justify-center', styles.overlay)}
      style={{
        '--z-index-modal': Z_INDEX.modal + 10,
      } as React.CSSProperties}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-changes-title"
    >
      <div
        className={styles.modalCard}
        style={{
          '--bg-color-card': BG_COLORS.card,
          '--radius-lg': `${RADIUS.lg}px`,
          '--spacing-lg': `${SPACING.lg}px`,
          '--spacing-md': `${SPACING.md}px`,
        } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h2
          id="unsaved-changes-title"
          className={styles.title}
          style={{
            '--text-color-primary': TEXT_COLORS.primary,
            '--font-size-lg': `${TYPOGRAPHY.fontSize.lg}px`,
            '--font-weight-semibold': TYPOGRAPHY.fontWeight.semibold,
            '--spacing-sm': `${SPACING.sm}px`,
          } as React.CSSProperties}
        >
          {title}
        </h2>

        {/* Message */}
        <p
          className={styles.message}
          style={{
            '--text-color-secondary': TEXT_COLORS.secondary,
            '--font-size-sm': `${TYPOGRAPHY.fontSize.sm}px`,
            '--spacing-lg': `${SPACING.lg}px`,
          } as React.CSSProperties}
        >
          {message}
        </p>

        {/* Actions */}
        <div className={styles.actions}>
          {/* Save Button */}
          <button
            onClick={onSave}
            className={styles.saveButton}
            style={{
              '--radius-md': `${RADIUS.md}px`,
              '--font-size-base': `${TYPOGRAPHY.fontSize.base}px`,
            } as React.CSSProperties}
          >
            Save
          </button>

          {/* Discard Button */}
          <button
            onClick={onDiscard}
            className={styles.discardButton}
            style={{
              '--radius-md': `${RADIUS.md}px`,
              '--font-size-base': `${TYPOGRAPHY.fontSize.base}px`,
            } as React.CSSProperties}
          >
            Discard
          </button>

          {/* Cancel Button */}
          <button
            onClick={onCancel}
            className={styles.cancelButton}
            style={{
              '--text-color-secondary': TEXT_COLORS.secondary,
              '--radius-md': `${RADIUS.md}px`,
              '--font-size-base': `${TYPOGRAPHY.fontSize.base}px`,
            } as React.CSSProperties}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default UnsavedChangesModal;

