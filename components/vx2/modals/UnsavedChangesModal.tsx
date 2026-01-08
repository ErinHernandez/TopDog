/**
 * UnsavedChangesModal
 * 
 * Enterprise-grade confirmation modal for unsaved changes.
 * Appears when user attempts to navigate away from a tab with unsaved work.
 */

import React from 'react';
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
      className="fixed inset-0 flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: Z_INDEX.modal + 10,
      }}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-changes-title"
    >
      <div
        className="flex flex-col"
        style={{
          backgroundColor: BG_COLORS.card,
          borderRadius: `${RADIUS.lg}px`,
          padding: `${SPACING.lg}px`,
          margin: `${SPACING.md}px`,
          maxWidth: 320,
          width: '100%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h2
          id="unsaved-changes-title"
          style={{
            color: TEXT_COLORS.primary,
            fontSize: `${TYPOGRAPHY.fontSize.lg}px`,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            marginBottom: `${SPACING.sm}px`,
          }}
        >
          {title}
        </h2>

        {/* Message */}
        <p
          style={{
            color: TEXT_COLORS.secondary,
            fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
            lineHeight: 1.5,
            marginBottom: `${SPACING.lg}px`,
          }}
        >
          {message}
        </p>

        {/* Actions */}
        <div
          className="flex flex-col gap-2"
          style={{ marginTop: 'auto' }}
        >
          {/* Save Button */}
          <button
            onClick={onSave}
            className="w-full font-semibold transition-all"
            style={{
              height: 48,
              background: 'url(/wr_blue.png) no-repeat center center',
              backgroundSize: 'cover',
              color: '#fff',
              borderRadius: `${RADIUS.md}px`,
              border: 'none',
              fontSize: `${TYPOGRAPHY.fontSize.md}px`,
              cursor: 'pointer',
            }}
          >
            Save
          </button>

          {/* Discard Button */}
          <button
            onClick={onDiscard}
            className="w-full font-semibold transition-all"
            style={{
              height: 48,
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#EF4444',
              borderRadius: `${RADIUS.md}px`,
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontSize: `${TYPOGRAPHY.fontSize.md}px`,
              cursor: 'pointer',
            }}
          >
            Discard
          </button>

          {/* Cancel Button */}
          <button
            onClick={onCancel}
            className="w-full font-medium transition-all"
            style={{
              height: 48,
              backgroundColor: 'transparent',
              color: TEXT_COLORS.secondary,
              borderRadius: `${RADIUS.md}px`,
              border: 'none',
              fontSize: `${TYPOGRAPHY.fontSize.md}px`,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default UnsavedChangesModal;

