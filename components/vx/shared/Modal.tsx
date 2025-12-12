/**
 * VX Modal & Sheet Components
 * 
 * Reusable overlay components for dialogs, bottom sheets, and confirmations.
 * Handles backdrop, focus trap, and escape key.
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { BG_COLORS, TEXT_COLORS } from '../constants/colors';
import { Z_INDEX, PLATFORM } from '../constants/sizes';
import { DURATION, EASING } from '../constants/animations';

// ============================================================================
// TYPES
// ============================================================================

export interface ModalProps {
  /** Whether modal is visible */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Modal content */
  children: React.ReactNode;
  /** Modal title (optional) */
  title?: string;
  /** Show close button */
  showCloseButton?: boolean;
  /** Close on backdrop click */
  closeOnBackdropClick?: boolean;
  /** Close on escape key */
  closeOnEscape?: boolean;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'full';
  /** Custom className for content */
  className?: string;
  /** 
   * Use absolute positioning instead of fixed.
   * Set to true when modal should stay within a container (e.g., phone frame demo).
   * Parent container must have position: relative.
   */
  contained?: boolean;
}

export interface SheetProps {
  /** Whether sheet is visible */
  isOpen: boolean;
  /** Callback to close sheet */
  onClose: () => void;
  /** Sheet content */
  children: React.ReactNode;
  /** Sheet title (optional) */
  title?: string;
  /** Sheet position */
  position?: 'bottom' | 'top' | 'left' | 'right';
  /** Sheet height for bottom/top (CSS value) */
  height?: string;
  /** Sheet width for left/right (CSS value) */
  width?: string;
  /** Show drag handle (bottom sheet) */
  showDragHandle?: boolean;
  /** Custom className */
  className?: string;
  /** 
   * Use absolute positioning instead of fixed.
   * Set to true when sheet should stay within a container (e.g., phone frame demo).
   * Parent container must have position: relative.
   */
  contained?: boolean;
}

export interface ConfirmDialogProps {
  /** Whether dialog is visible */
  isOpen: boolean;
  /** Callback to close */
  onClose: () => void;
  /** Callback for confirm action */
  onConfirm: () => void;
  /** Dialog title */
  title: string;
  /** Dialog message */
  message: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Confirm button style */
  confirmVariant?: 'primary' | 'danger';
}

// ============================================================================
// SIZE CONFIG
// ============================================================================

const MODAL_SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  full: 'max-w-full mx-4',
} as const;

// ============================================================================
// MODAL COMPONENT
// ============================================================================

export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  size = 'md',
  className = '',
  contained = false,
}: ModalProps): React.ReactElement | null {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when open (skip for contained modals - parent handles scroll)
  useEffect(() => {
    if (contained) return; // Don't modify body scroll for contained modals
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      if (!contained) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, contained]);

  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  }, [closeOnBackdropClick, onClose]);

  if (!isOpen) return null;

  // Use absolute for contained (stays within parent), fixed for full viewport
  const positionClass = contained ? 'absolute' : 'fixed';

  return (
    <div
      className={`${positionClass} inset-0 flex items-center justify-center p-4`}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: Z_INDEX.modal,
        animation: `fadeIn ${DURATION.fast} ${EASING.easeOut}`,
      }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={modalRef}
        className={`w-full rounded-2xl ${MODAL_SIZES[size]} ${className}`}
        style={{
          backgroundColor: BG_COLORS.secondary,
          animation: `scaleIn ${DURATION.normal} ${EASING.easeOut}`,
        }}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            {title && (
              <h2
                id="modal-title"
                className="text-lg font-bold"
                style={{ color: TEXT_COLORS.primary }}
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                style={{ color: TEXT_COLORS.secondary }}
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// BOTTOM SHEET COMPONENT
// ============================================================================

export function Sheet({
  isOpen,
  onClose,
  children,
  title,
  position = 'bottom',
  height = '50vh',
  width = '300px',
  showDragHandle = true,
  className = '',
  contained = false,
}: SheetProps): React.ReactElement | null {
  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll (skip for contained sheets - parent handles scroll)
  useEffect(() => {
    if (contained) return;
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      if (!contained) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, contained]);

  if (!isOpen) return null;

  const isVertical = position === 'bottom' || position === 'top';
  const isHorizontal = position === 'left' || position === 'right';

  // Use absolute for contained (stays within parent), fixed for full viewport
  const positionClass = contained ? 'absolute' : 'fixed';

  const positionStyles: React.CSSProperties = {
    ...(position === 'bottom' && { bottom: 0, left: 0, right: 0, height }),
    ...(position === 'top' && { top: 0, left: 0, right: 0, height }),
    ...(position === 'left' && { top: 0, bottom: 0, left: 0, width }),
    ...(position === 'right' && { top: 0, bottom: 0, right: 0, width }),
  };

  const animationName = {
    bottom: 'slideUp',
    top: 'slideDown',
    left: 'slideRight',
    right: 'slideLeft',
  }[position];

  return (
    <div
      className={`${positionClass} inset-0`}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: Z_INDEX.modal,
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`${positionClass} ${className}`}
        style={{
          ...positionStyles,
          backgroundColor: BG_COLORS.secondary,
          borderRadius: isVertical
            ? position === 'bottom' ? `${PLATFORM.ios.borderRadius} ${PLATFORM.ios.borderRadius} 0 0` : `0 0 ${PLATFORM.ios.borderRadius} ${PLATFORM.ios.borderRadius}`
            : PLATFORM.ios.borderRadius,
          animation: `${animationName} ${DURATION.medium} ${EASING.easeOut}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle (bottom sheet) */}
        {showDragHandle && position === 'bottom' && (
          <div className="flex justify-center pt-3 pb-1">
            <div
              className="w-10 h-1 rounded-full"
              style={{ backgroundColor: TEXT_COLORS.muted }}
            />
          </div>
        )}

        {/* Title */}
        {title && (
          <div className="px-4 py-3 border-b border-white/10">
            <h2 className="text-lg font-bold" style={{ color: TEXT_COLORS.primary }}>
              {title}
            </h2>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CONFIRM DIALOG
// ============================================================================

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
}: ConfirmDialogProps): React.ReactElement | null {
  const handleConfirm = useCallback(() => {
    onConfirm();
    onClose();
  }, [onConfirm, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showCloseButton={false}
    >
      <p className="mb-6" style={{ color: TEXT_COLORS.secondary }}>
        {message}
      </p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2 px-4 rounded-lg font-medium transition-colors"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: TEXT_COLORS.primary,
          }}
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 py-2 px-4 rounded-lg font-medium transition-colors"
          style={{
            backgroundColor: confirmVariant === 'danger' ? '#EF4444' : '#2DE2C5',
            color: confirmVariant === 'danger' ? '#ffffff' : '#000000',
          }}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

