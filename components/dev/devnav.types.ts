/**
 * DevNav V2 TypeScript Types
 *
 * Type definitions for the redesigned developer navigation panel.
 */

// ============================================================================
// Link Types
// ============================================================================

export type DevNavCategory =
  | 'navigation'    // Testing pages
  | 'admin'         // Glossary admin tools
  | 'ios';          // iOS development tools

export interface DevNavLink {
  id: string;
  href: string;
  label: string;
  category: DevNavCategory;
}

// ============================================================================
// State Types
// ============================================================================

export interface DevNavPosition {
  x: number | null;
  y: number | null;
}

export interface DevNavSize {
  width: number;
  height: number | null;
}

export interface DevNavPersistedState {
  position: DevNavPosition;
  isExpanded: boolean;
  linkOrder?: string[];
}

// ============================================================================
// Draft Controls Types
// ============================================================================

export interface DraftControlState {
  status: 'waiting' | 'loading' | 'active';
  isPaused: boolean;
  fastMode: boolean;
}

export type DraftControlAction =
  | 'start'
  | 'pause'
  | 'resume'
  | 'forcePick'
  | 'toggleSpeed'
  | 'restart';

// ============================================================================
// Auth Override Types
// ============================================================================

export type DevAuthOverride = 'logged-in' | 'logged-out' | null;

// ============================================================================
// Component Props
// ============================================================================

export interface DevNavHeaderProps {
  isExpanded: boolean;
  onToggle: () => void;
  onStartDrag: (e: React.MouseEvent) => void;
  isDragging: boolean;
}

export interface DevNavSectionProps {
  title: string;
  children: React.ReactNode;
}

export interface DevNavLinkItemProps {
  link: DevNavLink;
  isActive: boolean;
}

export interface DevNavAuthToggleProps {
  isLoggedIn: boolean;
  isLoading: boolean;
  onToggle: () => void;
}

export interface DevNavDraftControlsProps {
  state: DraftControlState;
  onAction: (action: DraftControlAction) => void;
}

// ============================================================================
// Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
  position: 'devnav-v2-position',
  expanded: 'devnav-v2-expanded',
  linkOrder: 'devnav-v2-link-order',
  authOverride: 'devnav-auth-override',
  draftControls: 'devnav-draft-controls',
} as const;

// ============================================================================
// Keyboard Shortcuts
// ============================================================================

export const KEYBOARD_SHORTCUTS = {
  toggle: '`',           // Backtick - primary toggle
  toggleAlt: 'd',        // With Ctrl/Cmd+Shift
  minimize: 'Escape',    // Minimize when expanded
} as const;
