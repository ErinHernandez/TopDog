/**
 * LeaveConfirmModal - Confirmation modal for leaving draft
 *
 * Renders inside the phone frame using absolute positioning.
 * No portal needed - renders directly in component tree.
 * iOS-native design pattern.
 *
 * A-Grade Requirements:
 * - TypeScript: Full type coverage
 * - Constants: VX2 constants for colors/sizes
 * - Accessibility: ARIA labels, focus trap
 * - CSP Compliance: CSS Modules for all styles
 */

import React, { useEffect, useRef, useMemo } from 'react';

import { cn, cssVars } from '@/lib/styles';

import { createScopedLogger } from '../../../../lib/clientLogger';
import { MODAL_THEME_LEAVE_CONFIRM } from '../../core/constants/colors';
import { TYPOGRAPHY } from '../../core/constants/sizes';
import type { DraftStatus } from '../types';


import styles from './LeaveConfirmModal.module.css';

const logger = createScopedLogger('[LeaveConfirmModal]');

// ============================================================================
// CONSTANTS - CSS VARIABLE MAPPINGS
// ============================================================================

/**
 * CSS variable names for modal styling.
 * Values are set dynamically via cssVars() in the render phase.
 * Separated from component logic for easier theming.
 */
const MODAL_CSS_VARS = {
  backdropColor: '--backdrop-color',
  bgColor: '--bg-color',
  titleColor: '--title-color',
  descriptionColor: '--description-color',
  primaryButtonBg: '--primary-button-bg',
  primaryButtonText: '--primary-button-text',
  secondaryButtonBg: '--secondary-button-bg',
  secondaryButtonText: '--secondary-button-text',
  warningIconColor: '--warning-icon-color',
  warningIconBg: '--warning-icon-bg',
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface LeaveConfirmModalProps {
  /** Whether modal is visible */
  isOpen: boolean;
  /** Draft status to determine if withdrawal is available */
  draftStatus?: DraftStatus;
  /** Called when user confirms leaving (during active draft) */
  onConfirm: () => void;
  /** Called when user wants to withdraw entry (before draft starts) */
  onWithdraw?: () => void;
  /** Called when user cancels */
  onCancel: () => void;
  /** Whether to show hint about top bar exit option */
  showTopBarHint?: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LeaveConfirmModal({
  isOpen,
  draftStatus = 'loading',
  onConfirm,
  onWithdraw,
  onCancel,
  showTopBarHint = false,
}: LeaveConfirmModalProps): React.ReactElement | null {
  // Determine if we're before draft starts (can withdraw)
  const isBeforeDraftStart = draftStatus === 'loading' || draftStatus === 'waiting';
  const canWithdraw = isBeforeDraftStart && !!onWithdraw;
  const stayButtonRef = useRef<HTMLButtonElement>(null);
  
  // Focus stay button when modal opens
  useEffect(() => {
    if (isOpen && stayButtonRef.current) {
      stayButtonRef.current.focus();
    }
  }, [isOpen]);
  
  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  // Prepare CSS variables for modal colors
  // NOTE: Must be called before early return to follow React hooks rules
  const cssVariables = useMemo(
    () =>
      cssVars({
        'backdrop-color': MODAL_THEME_LEAVE_CONFIRM.backdrop,
        'bg-color': MODAL_THEME_LEAVE_CONFIRM.background,
        'title-color': MODAL_THEME_LEAVE_CONFIRM.title,
        'description-color': MODAL_THEME_LEAVE_CONFIRM.description,
        'primary-button-bg': MODAL_THEME_LEAVE_CONFIRM.primaryButton,
        'primary-button-text': MODAL_THEME_LEAVE_CONFIRM.primaryButtonText,
        'secondary-button-bg': MODAL_THEME_LEAVE_CONFIRM.secondaryButton,
        'secondary-button-text': MODAL_THEME_LEAVE_CONFIRM.secondaryButtonText,
        'warning-icon-color': MODAL_THEME_LEAVE_CONFIRM.warningIcon,
        'warning-icon-bg': MODAL_THEME_LEAVE_CONFIRM.warningIconBg,
      }),
    []
  );
  
  if (!isOpen) return null;

  // Render modal directly (no portal - stays inside parent container)
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-modal-title"
      aria-describedby="leave-modal-description"
      className={styles.backdrop}
      style={cssVariables}
      onClick={(e) => {
        // Only cancel if clicking the backdrop, not the content
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      {/* Modal Content */}
      <div
        className={styles.content}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Warning Icon */}
        <div className={styles.iconWrapper}>
          <div className={styles.iconCircle}>
            {/* Warning Triangle Icon */}
            <svg
              className={styles.warningIcon}
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        </div>
        
        {/* Title */}
        <h2 id="leave-modal-title" className={styles.title}>
          Exit Draft Room?
        </h2>

        {/* Description */}
        <p id="leave-modal-description" className={styles.description}>
          {canWithdraw
            ? 'You can leave the draft room or withdraw your entry. Withdrawing will remove you from this draft and refund your entry fee.'
            : (
              <>
                Are you sure you want to exit the draft room? You can return later, but draft will continue while you&apos;re gone.
                {showTopBarHint && (
                  <>
                    <br />
                    <br />
                    You can also click the area at the very top of the screen to exit.
                  </>
                )}
              </>
            )}
        </p>
        
        {/* Buttons - Stacked */}
        <div
          className={styles.buttonContainer}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {/* Primary: Withdraw Button (only before draft starts) */}
          {canWithdraw && (
            <button
              type="button"
              className={cn(styles.button, styles.buttonPrimary)}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                logger.debug('Withdraw button clicked - calling onWithdraw');
                try {
                  if (onWithdraw && typeof onWithdraw === 'function') {
                    onWithdraw();
                  } else {
                    logger.error('onWithdraw callback not provided or not a function', undefined, { onWithdraw });
                  }
                } catch (error) {
                  logger.error('Error in onWithdraw', error instanceof Error ? error : new Error(String(error)));
                }
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                logger.debug('Withdraw button touched - calling onWithdraw');
                try {
                  if (onWithdraw && typeof onWithdraw === 'function') {
                    onWithdraw();
                  }
                } catch (error) {
                  logger.error('Error in onWithdraw (touch)', error instanceof Error ? error : new Error(String(error)));
                }
              }}
            >
              Withdraw Entry
            </button>
          )}

          {/* Primary: Leave Button (during active draft or as secondary option before start) */}
          <button
            type="button"
            className={cn(
              styles.button,
              canWithdraw ? styles.buttonSecondaryStyle : styles.buttonPrimary
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              logger.debug('Leave button clicked - calling onConfirm');
              try {
                if (onConfirm && typeof onConfirm === 'function') {
                  onConfirm();
                } else {
                  logger.error('onConfirm callback not provided or not a function', undefined, { onConfirm });
                }
              } catch (error) {
                logger.error('Error in onConfirm', error instanceof Error ? error : new Error(String(error)));
              }
            }}
            onMouseDown={(e) => {
              // Prevent any potential issues with mouse down interfering
              e.preventDefault();
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              logger.debug('Leave button touched - calling onConfirm');
              try {
                if (onConfirm && typeof onConfirm === 'function') {
                  onConfirm();
                }
              } catch (error) {
                logger.error('Error in onConfirm (touch)', error instanceof Error ? error : new Error(String(error)));
              }
            }}
          >
            {canWithdraw ? 'Leave Draft Room' : 'Yes, Leave Draft Room'}
          </button>
          
          {/* Secondary: Stay Button */}
          <button
            ref={stayButtonRef}
            type="button"
            className={cn(styles.button, styles.buttonSecondary)}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCancel();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCancel();
            }}
          >
            Stay
          </button>
        </div>
      </div>
    </div>
  );
}
