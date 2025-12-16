/**
 * VX2 Navigation Types
 * 
 * Single source of truth for all navigation-related types.
 * Enterprise-grade tab navigation system.
 */

import React from 'react';

// ============================================================================
// TAB IDENTIFIERS
// ============================================================================

/**
 * Tab identifiers - kebab-case for URLs, used as keys throughout the system
 */
export type TabId = 'lobby' | 'live-drafts' | 'my-teams' | 'exposure' | 'profile';

/**
 * Display names for UI rendering
 */
export type TabDisplayName = 'Lobby' | 'Live Drafts' | 'Teams' | 'Exposure' | 'Profile';

/**
 * Mapping from TabId to display name
 */
export const TAB_DISPLAY_NAMES: Record<TabId, TabDisplayName> = {
  'lobby': 'Lobby',
  'live-drafts': 'Live Drafts',
  'my-teams': 'Teams',
  'exposure': 'Exposure',
  'profile': 'Profile',
};

// ============================================================================
// TAB CONFIGURATION
// ============================================================================

/**
 * Icon component props
 */
export interface TabIconProps {
  size: number;
  color: string;
  filled?: boolean;
}

/**
 * Tab icon configuration
 */
export interface TabIconConfig {
  component: React.ComponentType<TabIconProps>;
  /** SVG markup for CSS mask (used for active state with image background) */
  svgMask?: string;
}

/**
 * Badge data source types
 */
export type BadgeSource = 'static' | 'context' | 'callback';

/**
 * Tab badge configuration
 */
export interface TabBadgeConfig {
  /** How to get the badge value */
  source: BadgeSource;
  /** Static value (if source is 'static') */
  staticValue?: number;
  /** Callback to get value (if source is 'callback') */
  getValue?: () => number | null;
  /** Context key to read from (if source is 'context') */
  contextKey?: string;
  /** Maximum number to display before showing "99+" */
  maxDisplay: number;
  /** Badge background color */
  backgroundColor: string;
  /** Badge text color */
  textColor: string;
}

/**
 * Complete tab configuration
 */
export interface TabConfig {
  /** Unique identifier */
  id: TabId;
  /** Display name for UI */
  displayName: TabDisplayName;
  /** URL path segment (e.g., '/lobby', '/drafts') */
  path: string;
  /** Icon configuration */
  icon: TabIconConfig;
  /** Optional badge configuration */
  badge?: TabBadgeConfig;
  /** Dynamic import for lazy loading */
  lazyComponent: () => Promise<{ default: React.ComponentType<any> }>;
  /** Preload priority (1 = highest) */
  preloadPriority: number;
  /** Whether tab requires authentication */
  requiresAuth: boolean;
  /** Whether to preserve state when switching away */
  preserveState: boolean;
  /** Analytics event name */
  analyticsName: string;
  /** Accessibility label */
  accessibilityLabel: string;
}

// ============================================================================
// NAVIGATION STATE
// ============================================================================

/**
 * History entry for navigation stack
 */
export interface TabHistoryEntry {
  /** Tab that was visited */
  tabId: TabId;
  /** When it was visited */
  timestamp: number;
  /** Any URL parameters */
  params?: Record<string, string>;
  /** Scroll position when leaving */
  scrollPosition?: ScrollPosition;
}

/**
 * Scroll position
 */
export interface ScrollPosition {
  x: number;
  y: number;
}

/**
 * Per-tab persisted state
 */
export interface TabPersistedState {
  /** Scroll position in the tab */
  scrollPosition: ScrollPosition;
  /** Any form data being edited */
  formData?: Record<string, unknown>;
  /** Expanded sections/accordions */
  expandedSections?: string[];
  /** Selected items (multi-select scenarios) */
  selectedItems?: string[];
  /** Last time this tab was visited */
  lastVisited: number;
  /** Custom state specific to the tab */
  customState?: Record<string, unknown>;
}

/**
 * Complete navigation state
 */
export interface TabNavigationState {
  /** Currently active tab */
  activeTab: TabId;
  /** Previously active tab (for transitions) */
  previousTab: TabId | null;
  /** Navigation history stack */
  history: TabHistoryEntry[];
  /** History index for forward/back */
  historyIndex: number;
  /** Per-tab persisted states */
  tabStates: Partial<Record<TabId, TabPersistedState>>;
  /** Whether a transition is in progress */
  isTransitioning: boolean;
  /** Deep link parameters from URL */
  deepLinkParams: Record<string, string> | null;
  /** Tabs that have been preloaded */
  preloadedTabs: Set<TabId>;
}

// ============================================================================
// NAVIGATION ACTIONS
// ============================================================================

/**
 * All possible navigation actions for the reducer
 */
export type TabNavigationAction =
  | { type: 'NAVIGATE_TO_TAB'; payload: { tabId: TabId; params?: Record<string, string>; addToHistory?: boolean } }
  | { type: 'GO_BACK' }
  | { type: 'GO_FORWARD' }
  | { type: 'REPLACE_TAB'; payload: { tabId: TabId; params?: Record<string, string> } }
  | { type: 'SET_DEEP_LINK_PARAMS'; payload: Record<string, string> | null }
  | { type: 'CLEAR_DEEP_LINK_PARAMS' }
  | { type: 'SAVE_TAB_STATE'; payload: { tabId: TabId; state: Partial<TabPersistedState> } }
  | { type: 'CLEAR_TAB_STATE'; payload: TabId }
  | { type: 'SET_TRANSITIONING'; payload: boolean }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'MARK_TAB_PRELOADED'; payload: TabId }
  | { type: 'RESET_NAVIGATION' };

// ============================================================================
// CONTEXT VALUE
// ============================================================================

/**
 * Value provided by TabNavigationContext
 */
export interface TabNavigationContextValue {
  // State
  state: TabNavigationState;
  
  // Navigation actions
  navigateToTab: (tabId: TabId, params?: Record<string, string>) => void;
  replaceTab: (tabId: TabId, params?: Record<string, string>) => void;
  goBack: () => boolean;
  goForward: () => boolean;
  
  // Tab state management
  saveTabState: (tabId: TabId, state: Partial<TabPersistedState>) => void;
  getTabState: (tabId: TabId) => TabPersistedState | undefined;
  clearTabState: (tabId: TabId) => void;
  
  // Deep linking
  setDeepLinkParams: (params: Record<string, string> | null) => void;
  clearDeepLinkParams: () => void;
  
  // Registry access
  getTabConfig: (tabId: TabId) => TabConfig;
  getAllTabs: () => TabConfig[];
  getTabByPath: (path: string) => TabConfig | undefined;
  
  // Utilities
  isActiveTab: (tabId: TabId) => boolean;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  
  // Preloading
  preloadTab: (tabId: TabId) => void;
  isTabPreloaded: (tabId: TabId) => boolean;
}

// ============================================================================
// DEEP LINKING
// ============================================================================

/**
 * Deep link route configuration
 */
export interface DeepLinkRoute {
  /** URL pattern (e.g., '/teams/:teamId') */
  pattern: string;
  /** Target tab */
  tabId: TabId;
  /** Parameter names to extract */
  paramNames: string[];
}

/**
 * Parsed deep link result
 */
export interface ParsedDeepLink {
  tabId: TabId;
  params: Record<string, string>;
  matched: boolean;
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Tab navigation analytics event
 */
export interface TabAnalyticsEvent {
  eventName: string;
  fromTab: TabId | null;
  toTab: TabId;
  timestamp: number;
  params?: Record<string, string>;
  duration?: number;
}

