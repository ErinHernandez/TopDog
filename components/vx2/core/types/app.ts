/**
 * VX2 Application Types
 * 
 * Core application-level types for the VX2 mobile app.
 */

// ============================================================================
// USER TYPES
// ============================================================================

/**
 * User authentication status
 */
export type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading';

/**
 * Basic user information
 */
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  balance: number;
  createdAt: Date;
}

// ============================================================================
// APP STATE
// ============================================================================

/**
 * Global application state
 */
export interface AppState {
  /** User authentication status */
  authStatus: AuthStatus;
  /** Current user (if authenticated) */
  user: User | null;
  /** Whether the app is in a loading state */
  isLoading: boolean;
  /** Global error message */
  error: string | null;
  /** Active drafts count (for badge) */
  activeDraftsCount: number;
  /** Whether app is online */
  isOnline: boolean;
}

/**
 * App state actions
 */
export type AppAction =
  | { type: 'SET_AUTH_STATUS'; payload: AuthStatus }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ACTIVE_DRAFTS_COUNT'; payload: number }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'LOGOUT' };

// ============================================================================
// MODAL TYPES
// ============================================================================

/**
 * Modal identifiers
 */
export type ModalId = 
  | 'tournament-join'
  | 'autodraft-limits'
  | 'rankings'
  | 'deposit-history'
  | 'withdraw'
  | 'confirmation';

/**
 * Modal state
 */
export interface ModalState {
  /** Currently open modal (null if none) */
  activeModal: ModalId | null;
  /** Modal-specific data */
  modalData?: Record<string, unknown>;
  /** Whether modal has unsaved changes */
  hasUnsavedChanges: boolean;
}

/**
 * Modal actions
 */
export type ModalAction =
  | { type: 'OPEN_MODAL'; payload: { modalId: ModalId; data?: Record<string, unknown> } }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_UNSAVED_CHANGES'; payload: boolean }
  | { type: 'FORCE_CLOSE_MODAL' };

// ============================================================================
// TOAST/NOTIFICATION TYPES
// ============================================================================

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast notification
 */
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

// ============================================================================
// THEME TYPES
// ============================================================================

/**
 * App theme (for future customization)
 */
export type ThemeMode = 'dark' | 'light' | 'system';

/**
 * Theme configuration
 */
export interface ThemeConfig {
  mode: ThemeMode;
  primaryColor: string;
  accentColor: string;
}

// ============================================================================
// RESPONSIVE TYPES
// ============================================================================

/**
 * Device type
 */
export type DeviceType = 'mobile' | 'desktop';

/**
 * Orientation
 */
export type Orientation = 'portrait' | 'landscape';

/**
 * Viewport information
 */
export interface ViewportInfo {
  width: number;
  height: number;
  deviceType: DeviceType;
  orientation: Orientation;
  hasSafeArea: boolean;
  safeAreaInsets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

