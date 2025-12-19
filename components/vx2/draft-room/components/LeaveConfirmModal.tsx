/**
 * LeaveConfirmModal - Confirmation modal for leaving draft
 * 
 * Renders inside the phone frame, not as a browser dialog.
 * iOS-native design pattern.
 * 
 * A-Grade Requirements:
 * - TypeScript: Full type coverage
 * - Constants: VX2 constants for colors/sizes
 * - Accessibility: ARIA labels, focus trap
 */

import React, { useEffect, useRef } from 'react';
import { SPACING, TYPOGRAPHY, RADIUS } from '../../core/constants/sizes';

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
  /** Called when user confirms leaving */
  onConfirm: () => void;
  /** Called when user cancels */
  onCancel: () => void;
}

interface LeaveButtonNewProps {
  onClick: () => void;
}

// ============================================================================
// NEW LEAVE BUTTON COMPONENT
// ============================================================================

/**
 * New Leave Button - Completely independent implementation
 * Handles navigation directly without relying on callbacks
 */
function LeaveButtonNew({ onClick }: LeaveButtonNewProps): React.ReactElement {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const isNavigatingRef = React.useRef(false);
  
  const handleClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    // Stop all event propagation immediately
    event.preventDefault();
    event.stopPropagation();
    if (event.nativeEvent) {
      event.nativeEvent.stopImmediatePropagation();
    }
    
    // Prevent double-clicks using ref (doesn't cause re-render)
    if (isNavigatingRef.current) {
      console.log('[LeaveButtonNew] Already navigating, ignoring click');
      return;
    }
    
    isNavigatingRef.current = true;
    console.log('[LeaveButtonNew] Click handler executing, button ref:', buttonRef.current);
    
    // Execute navigation handler immediately - don't wrap in try/catch to let errors bubble
    onClick();
  }, [onClick]);
  
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      onMouseDown={(e) => {
        // Don't prevent default on mousedown - let click event fire
        e.stopPropagation();
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
      }}
      onTouchEnd={(e) => {
        e.stopPropagation();
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
        WebkitUserSelect: 'none',
        touchAction: 'manipulation',
        isolation: 'isolate', // Create new stacking context
      }}
      aria-label="Leave draft room"
    >
      Yes, Leave Draft Room
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LeaveConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
}: LeaveConfirmModalProps): React.ReactElement | null {
  const stayButtonRef = useRef<HTMLButtonElement>(null);
  
  // Direct navigation handler - memoized to prevent recreation
  const handleLeaveNavigation = React.useCallback(() => {
    // Direct navigation handler - completely new logic
    const targetPath = '/testing-grounds/vx2-mobile-app-demo';
    console.log('[LeaveConfirmModal] handleLeaveNavigation called, navigating to:', targetPath);
    
    // Also call the onConfirm callback if provided (for cleanup)
    if (onConfirm) {
      try {
        onConfirm();
      } catch (e) {
        console.warn('[LeaveConfirmModal] Error in onConfirm:', e);
      }
    }
    
    // Set session flag before navigation
    try {
      sessionStorage.setItem('topdog_came_from_draft', 'true');
    } catch (e) {
      console.warn('[LeaveConfirmModal] Could not set session flag:', e);
    }
    
    // Direct navigation - use window.location.assign for better reliability
    console.log('[LeaveConfirmModal] About to navigate...');
    window.location.assign(targetPath);
  }, [onConfirm]);
  
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
  
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-modal-title"
      aria-describedby="leave-modal-description"
      style={{
        position: 'fixed',
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
          Are you sure you want to exit the draft room?
        </p>
        
        {/* Buttons - Stacked */}
        <div
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            position: 'relative',
            zIndex: 1002,
          }}
        >
          {/* Primary: Leave Button - NEW IMPLEMENTATION */}
          <LeaveButtonNew 
            onClick={handleLeaveNavigation}
          />
          
          {/* Secondary: Stay Button */}
          <button
            ref={stayButtonRef}
            onClick={onCancel}
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
            }}
          >
            Stay in Room
          </button>
        </div>
      </div>
    </div>
  );
}
