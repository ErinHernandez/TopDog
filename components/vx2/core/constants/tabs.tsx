/**
 * VX2 Tab Configuration
 * 
 * Master tab registry - single source of truth for all tab configurations.
 * This file defines the structure, behavior, and metadata for each tab.
 */

import React from 'react';
import type { TabId, TabConfig, TabIconProps } from '../types';

// ============================================================================
// TAB ICONS
// ============================================================================

/**
 * Lobby icon component
 */
function LobbyIcon({ size, color, filled }: TabIconProps): React.ReactElement {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill={filled ? color : 'none'} 
      stroke={color}
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={filled ? 0 : 2} 
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v8z" 
      />
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M8 21l4-4 4 4M3 7l9-4 9 4" 
      />
    </svg>
  );
}

/**
 * Live Drafts icon component
 */
function LiveDraftsIcon({ size, color, filled }: TabIconProps): React.ReactElement {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill={filled ? color : 'none'} 
      stroke={color}
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={filled ? 0 : 2} 
        d="M13 10V3L4 14h7v7l9-11h-7z" 
      />
    </svg>
  );
}

/**
 * My Teams icon component
 */
function MyTeamsIcon({ size, color, filled }: TabIconProps): React.ReactElement {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill={filled ? color : 'none'} 
      stroke={color}
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={filled ? 0 : 2} 
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
      />
    </svg>
  );
}

/**
 * Exposure icon component
 */
function ExposureIcon({ size, color }: TabIconProps): React.ReactElement {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color}
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
      />
    </svg>
  );
}

/**
 * Profile icon component
 */
function ProfileIcon({ size, color }: TabIconProps): React.ReactElement {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color}
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
      />
    </svg>
  );
}

// ============================================================================
// TAB REGISTRY
// ============================================================================

/**
 * Master tab registry - single source of truth
 */
export const TAB_REGISTRY: Record<TabId, TabConfig> = {
  'lobby': {
    id: 'lobby',
    displayName: 'Lobby',
    path: '/',
    icon: {
      component: LobbyIcon,
    },
    lazyComponent: () => import('../../tabs/LobbyTab'),
    preloadPriority: 1,
    requiresAuth: false,
    preserveState: true,
    analyticsName: 'tab_lobby',
    accessibilityLabel: 'Lobby - View available tournaments',
  },
  
  'live-drafts': {
    id: 'live-drafts',
    displayName: 'Live Drafts',
    path: '/drafts',
    icon: {
      component: LiveDraftsIcon,
    },
    badge: {
      source: 'context',
      contextKey: 'activeDraftsCount',
      maxDisplay: 99,
      backgroundColor: '#60A5FA',
      textColor: '#000000',
    },
    lazyComponent: () => import('../../tabs/LiveDraftsTab'),
    preloadPriority: 2,
    requiresAuth: true,
    preserveState: true,
    analyticsName: 'tab_live_drafts',
    accessibilityLabel: 'Live Drafts - View your active drafts',
  },
  
  'my-teams': {
    id: 'my-teams',
    displayName: 'My Teams',
    path: '/teams',
    icon: {
      component: MyTeamsIcon,
    },
    lazyComponent: () => import('../../tabs/MyTeamsTab'),
    preloadPriority: 3,
    requiresAuth: true,
    preserveState: true,
    analyticsName: 'tab_my_teams',
    accessibilityLabel: 'My Teams - View your drafted teams',
  },
  
  'exposure': {
    id: 'exposure',
    displayName: 'Exposure',
    path: '/exposure',
    icon: {
      component: ExposureIcon,
    },
    lazyComponent: () => import('../../tabs/ExposureTab'),
    preloadPriority: 4,
    requiresAuth: true,
    preserveState: true,
    analyticsName: 'tab_exposure',
    accessibilityLabel: 'Exposure - View your player exposure',
  },
  
  'profile': {
    id: 'profile',
    displayName: 'Profile',
    path: '/profile',
    icon: {
      component: ProfileIcon,
    },
    lazyComponent: () => import('../../tabs/ProfileTab'),
    preloadPriority: 5,
    requiresAuth: true,
    preserveState: false, // Profile always loads fresh
    analyticsName: 'tab_profile',
    accessibilityLabel: 'Profile - Manage your account',
  },
};

// ============================================================================
// TAB ORDERING & DEFAULTS
// ============================================================================

/**
 * Ordered array of tab IDs (for rendering tab bar)
 */
export const TAB_ORDER: TabId[] = [
  'lobby',
  'live-drafts',
  'my-teams',
  'exposure',
  'profile',
];

/**
 * Default tab to show on app load
 */
export const DEFAULT_TAB: TabId = 'lobby';

/**
 * Get all tab configs in display order
 */
export function getOrderedTabs(): TabConfig[] {
  return TAB_ORDER.map(id => TAB_REGISTRY[id]);
}

/**
 * Get tab config by ID
 */
export function getTabConfig(tabId: TabId): TabConfig {
  return TAB_REGISTRY[tabId];
}

// ============================================================================
// URL MAPPING
// ============================================================================

/**
 * URL path to tab ID mapping for deep linking
 */
export const PATH_TO_TAB: Record<string, TabId> = {
  '/': 'lobby',
  '/lobby': 'lobby',
  '/drafts': 'live-drafts',
  '/teams': 'my-teams',
  '/exposure': 'exposure',
  '/profile': 'profile',
};

/**
 * Get tab ID from URL path
 */
export function getTabFromPath(path: string): TabId | null {
  // Remove query string and trailing slash
  const cleanPath = path.split('?')[0].replace(/\/$/, '') || '/';
  
  // Exact match
  if (PATH_TO_TAB[cleanPath]) {
    return PATH_TO_TAB[cleanPath];
  }
  
  // Prefix match for nested routes
  if (cleanPath.startsWith('/drafts')) return 'live-drafts';
  if (cleanPath.startsWith('/teams')) return 'my-teams';
  if (cleanPath.startsWith('/profile')) return 'profile';
  
  return null;
}

/**
 * Get URL path from tab ID
 */
export function getPathFromTab(tabId: TabId): string {
  return TAB_REGISTRY[tabId].path;
}

