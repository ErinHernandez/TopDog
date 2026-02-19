/**
 * DevNav V2 Constants
 *
 * Color palette, link configurations, and sizing constants
 * matching TopDog's design language.
 */

import { DevNavLink, DevNavCategory } from './devnav.types';

// Re-export category type for convenience
export type { DevNavCategory } from './devnav.types';

// ============================================================================
// Color Palette (Matching TopDog Design)
// ============================================================================

export const COLORS = {
  // Backgrounds
  bgPrimary: '#0f1419',        // Deepest background
  bgSurface: '#1a1f2e',        // Panel background
  bgElevated: '#252b3d',       // Elevated elements
  bgHover: 'rgba(56, 189, 248, 0.08)',  // Hover state
  bgActive: 'rgba(56, 189, 248, 0.05)', // Active link bg

  // Borders
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderAccent: 'rgba(56, 189, 248, 0.25)',
  borderGlow: 'rgba(56, 189, 248, 0.15)',

  // Text
  textPrimary: '#e2e8f0',      // Main text
  textSecondary: '#94a3b8',    // Secondary text
  textMuted: '#64748b',        // Muted/labels
  textAccent: '#38bdf8',       // Cyan accent

  // Accent
  accent: '#38bdf8',           // Primary cyan
  accentDim: 'rgba(56, 189, 248, 0.6)',

  // Status Colors
  statusActive: '#22c55e',     // Green - running
  statusPaused: '#f59e0b',     // Amber - paused
  statusInactive: '#64748b',   // Gray - inactive
  statusError: '#ef4444',      // Red - error

  // Toggle Switch
  toggleBgOff: '#374151',
  toggleBgOn: '#065f46',
  toggleKnobOff: '#6b7280',
  toggleKnobOn: '#10b981',
} as const;

// ============================================================================
// Sizing Constants
// ============================================================================

export const SIZES = {
  // Collapsed state
  collapsedWidth: 110,
  collapsedHeight: 36,

  // Expanded state
  expandedWidth: 260,
  expandedMinHeight: 300,
  expandedMaxHeight: 600,

  // Spacing
  padding: 16,
  paddingSmall: 12,
  gap: 8,
  gapSmall: 4,

  // Border radius
  radiusContainer: 12,
  radiusItem: 8,
  radiusSmall: 6,

  // Typography
  fontSizeLabel: 10,
  fontSizeLink: 13,
  fontSizeSmall: 11,
} as const;

// ============================================================================
// Navigation Links Configuration
// ============================================================================

export const NAV_LINKS: DevNavLink[] = [
  // Navigation - Testing Pages
  { id: 'vx2-shell', href: '/testing-grounds/vx2-mobile-app-demo', label: 'Mobile App (VX2)', category: 'navigation' },
  { id: 'vx2-lobby', href: '/testing-grounds/lobby-tab-sandbox', label: 'Lobby Tab Sandbox', category: 'navigation' },
  { id: 'vx2-draft', href: '/testing-grounds/vx2-draft-room', label: 'Draft Room (VX2)', category: 'navigation' },
  { id: 'slow-draft-sandbox', href: '/testing-grounds/slow-draft-sandbox', label: 'Slow Draft Sandbox', category: 'navigation' },
  { id: 'dynamic-island-sandbox', href: '/testing-grounds/dynamic-island-sandbox', label: 'Dynamic Island', category: 'navigation' },
  { id: 'navbar-sandbox', href: '/testing-grounds/navbar-sandbox', label: 'Navbar Sandbox', category: 'navigation' },
  { id: 'device-compare', href: '/testing-grounds/device-comparison', label: 'Device Comparison', category: 'navigation' },
  { id: 'join-modal-mobile', href: '/testing-grounds/join-tournament-modal-mobile', label: 'Join Modal', category: 'navigation' },
  { id: 'auth-test', href: '/testing-grounds/vx2-auth-test', label: 'Auth Components', category: 'navigation' },

  // Admin - Glossary Tools
  { id: 'glossary-admin', href: '/glossary/admin', label: 'Glossary Admin', category: 'admin' },
  { id: 'screenshot-depot', href: '/glossary/admin/screenshot-depot', label: 'Screenshot Depot', category: 'admin' },
  { id: 'element-extractor', href: '/glossary/admin/element-extractor', label: 'Element Extractor', category: 'admin' },
  { id: 'cleaned-elements', href: '/glossary/admin/cleaned-elements', label: 'Cleaned Elements', category: 'admin' },

  // iOS Development Tools
  { id: 'wireframe', href: '/dev/wireframe', label: 'iOS Wireframe', category: 'ios' },
  { id: 'extraction', href: '/dev/extraction', label: 'Screenshot → Swift', category: 'ios' },
];

// ============================================================================
// Category Labels
// ============================================================================

export const CATEGORY_LABELS: Record<DevNavCategory, string> = {
  navigation: 'NAVIGATION',
  admin: 'ADMIN TOOLS',
  ios: 'IOS DEV',
};

// ============================================================================
// Animation Timings
// ============================================================================

export const ANIMATIONS = {
  expandDuration: 200,
  hoverDuration: 150,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// ============================================================================
// Z-Index
// ============================================================================

export const Z_INDEX = {
  devNav: 9999,
  devNavOverlay: 9998,
} as const;
