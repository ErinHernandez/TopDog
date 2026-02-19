/**
 * UnsavedChangesModal
 * 
 * Enterprise-grade confirmation modal for unsaved changes.
 * Appears when user attempts to navigate away from a tab with unsaved work.
 */

import React from 'react';

import { cn } from '@/lib/styles';

import styles from './UnsavedChangesModal.module.css';

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
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-changes-title"
    >
      <div
        className={styles.modalCard}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h2
          id="unsaved-changes-title"
          className={styles.title}
        >
          {title}
        </h2>

        {/* Message */}
        <p
          className={styles.message}
        >
          {message}
        </p>

        {/* Actions */}
        <div className={styles.actions}>
          {/* Save Button */}
          <button
            onClick={onSave}
            className={styles.saveButton}
          >
            Save
          </button>

          {/* Discard Button */}
          <button
            onClick={onDiscard}
            className={styles.discardButton}
          >
            Discard
          </button>

          {/* Cancel Button */}
          <button
            onClick={onCancel}
            className={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default UnsavedChangesModal;

