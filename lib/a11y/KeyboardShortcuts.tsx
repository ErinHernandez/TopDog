'use client';

/**
 * Idesaign — Keyboard Shortcuts Help Dialog
 *
 * A modal dialog that displays all available keyboard shortcuts organized
 * by category. Triggered by the '?' key or menu button.
 *
 * Features:
 * - Groups shortcuts by category (General, Canvas Tools, Selection, etc.)
 * - Keyboard accessible with FocusTrap
 * - Escape key closes the dialog
 * - Responsive layout
 *
 * @module lib/a11y/KeyboardShortcuts
 */

import React, { useEffect, useRef, useState } from 'react';
import { FocusTrap } from './FocusTrap';
import styles from './KeyboardShortcuts.module.css';

/* ================================================================
   Types
   ================================================================ */

/** A single keyboard shortcut */
export interface Shortcut {
  /** Key combination(s), e.g., ['Ctrl', 'Z'] */
  keys: string[];

  /** Human-readable description of what the shortcut does */
  description: string;
}

/** A group of related shortcuts */
export interface ShortcutGroup {
  /** Category title, e.g., "General" */
  title: string;

  /** Array of shortcuts in this group */
  shortcuts: Shortcut[];
}

/** Props for KeyboardShortcuts component */
export interface KeyboardShortcutsProps {
  /** Whether the dialog is open */
  open: boolean;

  /** Called when user closes the dialog */
  onClose: () => void;

  /** Shortcut groups to display */
  groups: ShortcutGroup[];
}

/* ================================================================
   Shortcut Groups (Default)
   ================================================================ */

/**
 * Default keyboard shortcuts for Idesaign.
 * Can be customized by passing different groups to the component.
 */
export const DEFAULT_SHORTCUTS: ShortcutGroup[] = [
  {
    title: 'General',
    shortcuts: [
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['Ctrl', 'S'], description: 'Save project' },
      { keys: ['Ctrl', 'O'], description: 'Open project' },
      { keys: ['Ctrl', 'N'], description: 'New project' },
      { keys: ['Ctrl', 'W'], description: 'Close project' },
    ],
  },
  {
    title: 'Canvas Tools',
    shortcuts: [
      { keys: ['V'], description: 'Selection tool' },
      { keys: ['P'], description: 'Pencil / paintbrush' },
      { keys: ['I'], description: 'Color picker' },
      { keys: ['T'], description: 'Text tool' },
      { keys: ['M'], description: 'Move tool' },
      { keys: ['L'], description: 'Lasso selection' },
    ],
  },
  {
    title: 'Selection',
    shortcuts: [
      { keys: ['Ctrl', 'A'], description: 'Select all' },
      { keys: ['Ctrl', 'Shift', 'A'], description: 'Deselect all' },
      { keys: ['Ctrl', 'D'], description: 'Duplicate selection' },
      { keys: ['Delete'], description: 'Delete selection' },
    ],
  },
  {
    title: 'View',
    shortcuts: [
      { keys: ['Ctrl', 'Plus'], description: 'Zoom in' },
      { keys: ['Ctrl', 'Minus'], description: 'Zoom out' },
      { keys: ['Ctrl', '0'], description: 'Fit to window' },
      { keys: ['Ctrl', '1'], description: 'Actual size (100%)' },
      { keys: ['Space'], description: 'Temporary pan (hold)' },
    ],
  },
  {
    title: 'Layers',
    shortcuts: [
      { keys: ['Ctrl', 'L'], description: 'Show/hide layers panel' },
      { keys: ['Ctrl', 'Shift', 'L'], description: 'Lock layer' },
      { keys: ['Ctrl', 'Alt', 'L'], description: 'Hide layer' },
    ],
  },
  {
    title: 'History',
    shortcuts: [
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
      { keys: ['Ctrl', 'Y'], description: 'Redo (alternative)' },
    ],
  },
];

/* ================================================================
   KeyboardShortcuts Component
   ================================================================ */

/**
 * Keyboard shortcuts help dialog.
 * Displays organized groups of shortcuts in a modal.
 *
 * @example
 * ```tsx
 * const [showShortcuts, setShowShortcuts] = useState(false);
 *
 * useEffect(() => {
 *   const handleKeyDown = (e: KeyboardEvent) => {
 *     if (e.key === '?') setShowShortcuts(true);
 *   };
 *   window.addEventListener('keydown', handleKeyDown);
 *   return () => window.removeEventListener('keydown', handleKeyDown);
 * }, []);
 *
 * return (
 *   <>
 *     <KeyboardShortcuts
 *       open={showShortcuts}
 *       onClose={() => setShowShortcuts(false)}
 *       groups={DEFAULT_SHORTCUTS}
 *     />
 *     {/* rest of app * /}
 *   </>
 * );
 * ```
 */
export function KeyboardShortcuts({
  open,
  onClose,
  groups,
}: KeyboardShortcutsProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Trap focus within the modal when open
  // Listen for Escape key
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <FocusTrap
        active={open}
        onEscape={onClose}
        initialFocusRef={closeButtonRef}
      >
        <div
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.header}>
            <h1 id="shortcuts-title" className={styles.title}>
              Keyboard Shortcuts
            </h1>
            <button
              ref={closeButtonRef}
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close keyboard shortcuts"
              title="Close (Esc)"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 5L5 15M5 5L15 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className={styles.content}>
            {groups.map((group, i) => (
              <div key={i} className={styles.group}>
                <h2 className={styles.groupTitle}>{group.title}</h2>
                <div className={styles.shortcutList}>
                  {group.shortcuts.map((shortcut, j) => (
                    <div key={j} className={styles.shortcutItem}>
                      <div className={styles.keysContainer}>
                        {shortcut.keys.map((key, k) => (
                          <React.Fragment key={k}>
                            {k > 0 && <span className={styles.plus}>+</span>}
                            <kbd className={styles.key}>{key}</kbd>
                          </React.Fragment>
                        ))}
                      </div>
                      <span className={styles.description}>
                        {shortcut.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <p className={styles.hint}>Press <kbd>Esc</kbd> to close</p>
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}
