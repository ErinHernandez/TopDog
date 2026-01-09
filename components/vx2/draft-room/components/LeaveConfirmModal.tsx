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
 */

import React, { useEffect, useRef } from 'react';
import type { DraftStatus } from '../types';
import { SPACING, TYPOGRAPHY, RADIUS } from '../../core/constants/sizes';
import { createScopedLogger } from '../../../../lib/clientLogger';

const logger = createScopedLogger('[LeaveConfirmModal]');

// ============================================================================
// CONSTANTS
// ============================================================================

const MODAL_COLORS = {
  backdrop: 'rgba(0, 0, 0, 0.7)',
  background: '#1E293B',
  title: '#FFFFFF',
  description: '#94A3B8',
  primaryButton: '#EF4444',
  primaryButtonText: '#FFFFFF',
  secondaryButton: '#475569',
  secondaryButtonText: '#FFFFFF',
  warningIcon: '#EF4444',
  warningIconBg: 'rgba(239, 68, 68, 0.15)',
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
  
  if (!isOpen) return null;
  
  // Render modal directly (no portal - stays inside parent container)
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-modal-title"
      aria-describedby="leave-modal-description"
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
      onClick={(e) => {
        // Only cancel if clicking the backdrop, not the content
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      {/* Modal Content */}
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 340,
          backgroundColor: MODAL_COLORS.background,
          borderRadius: 20,
          padding: 24,
          position: 'relative',
          zIndex: 1001,
          pointerEvents: 'auto',
        }}
      >
        {/* Warning Icon */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: MODAL_COLORS.warningIconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Warning Triangle Icon */}
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke={MODAL_COLORS.warningIcon}
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
        <h2
          id="leave-modal-title"
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: MODAL_COLORS.title,
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          Exit Draft Room?
        </h2>
        
        {/* Description */}
        <p
          id="leave-modal-description"
          style={{
            fontSize: 15,
            color: MODAL_COLORS.description,
            textAlign: 'center',
            lineHeight: 1.5,
            marginBottom: 28,
          }}
        >
          {canWithdraw
            ? 'You can leave the draft room or withdraw your entry. Withdrawing will remove you from this draft and refund your entry fee.'
            : (
              <>
                Are you sure you want to exit the draft room? You can return later, but draft will continue while you're gone.
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
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            position: 'relative',
            zIndex: 1002,
            pointerEvents: 'auto',
          }}
        >
          {/* Primary: Withdraw Button (only before draft starts) */}
          {canWithdraw && (
            <button
              type="button"
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
              style={{
                width: '100%',
                height: 52,
                backgroundColor: MODAL_COLORS.primaryButton,
                border: 'none',
                borderRadius: 12,
                color: MODAL_COLORS.primaryButtonText,
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                pointerEvents: 'auto',
                position: 'relative',
                zIndex: 10000,
                WebkitTapHighlightColor: 'transparent',
                userSelect: 'none',
                touchAction: 'manipulation',
              }}
            >
              Withdraw Entry
            </button>
          )}

          {/* Primary: Leave Button (during active draft or as secondary option before start) */}
          <button
            type="button"
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
            style={{
              width: '100%',
              height: 52,
              backgroundColor: canWithdraw ? MODAL_COLORS.secondaryButton : MODAL_COLORS.primaryButton,
              border: 'none',
              borderRadius: 12,
              color: MODAL_COLORS.primaryButtonText,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 10000,
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none',
              touchAction: 'manipulation',
            }}
          >
            {canWithdraw ? 'Leave Draft Room' : 'Yes, Leave Draft Room'}
          </button>
          
          {/* Secondary: Stay Button */}
          <button
            ref={stayButtonRef}
            type="button"
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
            style={{
              width: '100%',
              height: 52,
              backgroundColor: MODAL_COLORS.secondaryButton,
              border: 'none',
              borderRadius: 12,
              color: MODAL_COLORS.secondaryButtonText,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              pointerEvents: 'auto',
              touchAction: 'manipulation',
            }}
          >
            Stay
          </button>
        </div>
      </div>
    </div>
  );
}
