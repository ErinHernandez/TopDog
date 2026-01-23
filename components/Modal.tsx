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

import React from 'react';

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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
      <div className="relative bg-white rounded-xl shadow-2xl p-8 z-10 w-full max-w-md max-h-[90vh] overflow-y-auto">
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
