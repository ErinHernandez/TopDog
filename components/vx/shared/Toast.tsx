/**
 * VX Toast Notification System
 * 
 * Lightweight toast notifications for user feedback.
 * Features:
 * - Auto-dismiss with configurable duration
 * - Multiple toast types (success, error, info, warning)
 * - Stack management
 * - Swipe to dismiss (touch)
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { BRAND_COLORS, TEXT_COLORS } from '../constants/colors';
import { Z_INDEX, PLATFORM } from '../constants/sizes';
import { DURATION } from '../constants/animations';

// ============================================================================
// TYPES
// ============================================================================

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => string;
  hideToast: (id: string) => void;
  clearAll: () => void;
}

export interface ToastProviderProps {
  children: React.ReactNode;
  /** Maximum number of visible toasts */
  maxToasts?: number;
  /** Default duration in ms */
  defaultDuration?: number;
  /** Position on screen */
  position?: 'top' | 'bottom';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: {
    bg: 'rgba(16, 185, 129, 0.15)',
    border: '#10B981',
    icon: '#10B981',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.15)',
    border: '#EF4444',
    icon: '#EF4444',
  },
  info: {
    bg: 'rgba(59, 130, 246, 0.15)',
    border: '#3B82F6',
    icon: '#3B82F6',
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.15)',
    border: '#F59E0B',
    icon: '#F59E0B',
  },
};

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

// ============================================================================
// CONTEXT
// ============================================================================

const ToastContext = createContext<ToastContextType | null>(null);

// ============================================================================
// HOOK
// ============================================================================

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

export function ToastProvider({
  children,
  maxToasts = 3,
  defaultDuration = 4000,
  position = 'bottom',
}: ToastProviderProps): React.ReactElement {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? defaultDuration,
    };

    setToasts(prev => {
      const updated = [...prev, newToast];
      // Limit number of toasts
      if (updated.length > maxToasts) {
        return updated.slice(-maxToasts);
      }
      return updated;
    });

    return id;
  }, [defaultDuration, maxToasts]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast, clearAll }}>
      {children}
      <ToastContainer toasts={toasts} position={position} onDismiss={hideToast} />
    </ToastContext.Provider>
  );
}

// ============================================================================
// TOAST CONTAINER
// ============================================================================

interface ToastContainerProps {
  toasts: Toast[];
  position: 'top' | 'bottom';
  onDismiss: (id: string) => void;
}

function ToastContainer({ toasts, position, onDismiss }: ToastContainerProps): React.ReactElement | null {
  if (toasts.length === 0) return null;

  return (
    <div
      className={`fixed left-0 right-0 flex flex-col gap-2 px-4 pointer-events-none ${
        position === 'top' ? 'top-4' : 'bottom-4'
      }`}
      style={{ zIndex: Z_INDEX.tooltip }}
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// ============================================================================
// TOAST ITEM
// ============================================================================

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps): React.ReactElement {
  const colors = TOAST_COLORS[toast.type];
  const icon = TOAST_ICONS[toast.type];

  // Auto-dismiss
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(toast.id);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg pointer-events-auto"
      style={{
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        backdropFilter: 'blur(8px)',
        animation: `slideUp ${DURATION.fast} ease-out`,
      }}
      role="alert"
    >
      {/* Icon */}
      <div style={{ color: colors.icon }}>
        {icon}
      </div>

      {/* Message */}
      <div className="flex-1" style={{ color: TEXT_COLORS.primary }}>
        {toast.message}
      </div>

      {/* Action */}
      {toast.action && (
        <button
          onClick={toast.action.onClick}
          className="font-medium text-sm hover:opacity-80 transition-opacity"
          style={{ color: BRAND_COLORS.primary }}
        >
          {toast.action.label}
        </button>
      )}

      {/* Close */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
        style={{ color: TEXT_COLORS.secondary }}
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ============================================================================
// CONVENIENCE FUNCTIONS (for use without context)
// ============================================================================

// These would need a global toast manager for standalone usage
// For now, recommend using the context-based approach

export default ToastProvider;

