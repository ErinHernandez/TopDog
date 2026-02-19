/**
 * Modal - Reusable Modal Component
 * 
 * Displays a modal overlay with centered content.
 * Supports closing via backdrop click or close button.
 * 
 * @example
 * ```tsx
 * <Modal open={isOpen} onClose={handleClose}>
 *   <h2>Modal Title</h2>
 *   <p>Modal content</p>
 * </Modal>
 * ```
 */

import React, { useEffect, useRef, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface ModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal content */
  children: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function Modal({
  open,
  onClose,
  children
}: ModalProps): React.ReactElement | null {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  /**
   * Handle keyboard navigation for focus trap
   * Traps Tab/Shift+Tab focus within modal content
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Close on Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    // Focus trap for Tab/Shift+Tab
    if (e.key === 'Tab') {
      if (!contentRef.current) return;

      // Get all focusable elements within the modal
      const focusableElements = contentRef.current.querySelectorAll<HTMLElement>(
        'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0]!;
      const lastElement = focusableElements[focusableElements.length - 1]!;
      const activeElement = document.activeElement;

      // Shift+Tab on first element: move to last
      if (e.shiftKey) {
        if (activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      }
      // Tab on last element: move to first
      else {
        if (activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, [onClose]);

  /**
   * Set initial focus when modal opens
   */
  useEffect(() => {
    if (!open || !contentRef.current) return;

    // Try to focus the close button or first focusable element
    const focusableElements = contentRef.current.querySelectorAll<HTMLElement>(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    if (firstElement) {
      firstElement.focus();
    }

    // Save previous focused element
    const previouslyFocused = document.activeElement as HTMLElement;

    // Restore focus when modal closes
    return () => {
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Modal dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black opacity-70"
        onClick={onClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Escape' || e.key === 'Enter') {
            onClose();
          }
        }}
        aria-label="Close modal"
      />

      {/* Modal Content */}
      <div
        ref={contentRef}
        className="relative bg-white rounded-xl shadow-2xl p-8 z-10 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onKeyDown={handleKeyDown}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-4 text-2xl hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-label="Close modal"
        >
          ×
        </button>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
