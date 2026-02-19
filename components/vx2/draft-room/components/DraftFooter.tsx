/**
 * DraftFooter - Bottom tab navigation bar
 *
 * Pixel-matched to VX FooterVX.tsx styling.
 * Colors come from global tokens (--footer-*) defined in styles/tokens.css,
 * which align with DRAFT_FOOTER_THEME / TAB_BAR_COLORS in core/constants/colors.ts.
 *
 * A-Grade Requirements:
 * - TypeScript: Full type coverage
 * - Accessibility: ARIA labels, touch targets
 */

import React from 'react';

import { cn } from '@/lib/styles';

import type { DraftTab } from '../types';

import styles from './DraftFooter.module.css';

// ============================================================================
// PIXEL-PERFECT CONSTANTS (matched from VX FooterVX.tsx)
// ============================================================================

const FOOTER_PX = {
  // Container
  containerHeight: 70,
  containerBorderTop: 1,

  // Tab buttons
  tabMinHeight: 44,
  tabPaddingTop: 0,
  tabPaddingBottom: 12,
  tabPaddingX: 0,

  // Icons
  iconSize: 24,

  // Labels
  labelFontSize: 10,
  labelLineHeight: 12,
  labelMarginTop: 4,

  // Badge
  badgeMinWidth: 18,
  badgeHeight: 18,
  badgeFontSize: 10.5,
  badgeOffsetRight: -16,

  // Home indicator
  homeIndicatorWidth: 134,
  homeIndicatorHeight: 5,
  homeIndicatorMarginTop: 4,
  homeIndicatorMarginBottom: 4,
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface DraftFooterProps {
  /** Currently active tab */
  activeTab: DraftTab;
  /** Callback when tab is clicked */
  onTabChange: (tab: DraftTab) => void;
  /** Number of items in queue (shows badge) */
  queueCount?: number;
}

interface FooterTabConfig {
  id: DraftTab;
  label: string;
  icon: (isActive: boolean) => React.ReactNode;
  hasBadge?: boolean;
}

// ============================================================================
// ICONS (matched from VX FooterVX.tsx)
// ============================================================================

// Players icon - single person
const PlayersIcon = (isActive: boolean) => (
  <svg
    width={FOOTER_PX.iconSize}
    height={FOOTER_PX.iconSize}
    viewBox="0 0 24 24"
    fill={isActive ? 'currentColor' : 'none'}
    stroke="currentColor"
    className={isActive ? 'icon-active' : 'icon-inactive'}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={isActive ? 0 : 2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

// Queue icon - plus sign
const QueueIcon = (isActive: boolean) => (
  <svg
    width={FOOTER_PX.iconSize}
    height={FOOTER_PX.iconSize}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    className={isActive ? 'icon-active' : 'icon-inactive'}
  >
    <path strokeLinecap="round" strokeWidth={2} d="M12 5v14M5 12h14" />
  </svg>
);

// Roster icon - horizontal lines
const RosterIcon = (isActive: boolean) => (
  <svg
    width={FOOTER_PX.iconSize}
    height={FOOTER_PX.iconSize}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={isActive ? 'icon-active' : 'icon-inactive'}
  >
    <path d="M1,6H23a1,1,0,0,0,0-2H1A1,1,0,0,0,1,6Z"/>
    <path d="M23,9H1a1,1,0,0,0,0,2H23a1,1,0,0,0,0-2Z"/>
    <path d="M23,19H1a1,1,0,0,0,0,2H23a1,1,0,0,0,0-2Z"/>
    <path d="M23,14H1a1,1,0,0,0,0,2H23a1,1,0,0,0,0-2Z"/>
  </svg>
);

// Board icon - 3x3 grid
const BoardIcon = (isActive: boolean) => (
  <svg
    width={FOOTER_PX.iconSize}
    height={FOOTER_PX.iconSize}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={isActive ? 'icon-active' : 'icon-inactive'}
  >
    <rect x="4" y="4" width="4" height="4" rx="0.5" />
    <rect x="10" y="4" width="4" height="4" rx="0.5" />
    <rect x="16" y="4" width="4" height="4" rx="0.5" />
    <rect x="4" y="10" width="4" height="4" rx="0.5" />
    <rect x="10" y="10" width="4" height="4" rx="0.5" />
    <rect x="16" y="10" width="4" height="4" rx="0.5" />
    <rect x="4" y="16" width="4" height="4" rx="0.5" />
    <rect x="10" y="16" width="4" height="4" rx="0.5" />
    <rect x="16" y="16" width="4" height="4" rx="0.5" />
  </svg>
);

// Info icon
const InfoIcon = (isActive: boolean) => (
  <svg
    width={FOOTER_PX.iconSize}
    height={FOOTER_PX.iconSize}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={isActive ? 'icon-active' : 'icon-inactive'}
  >
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="8" r="1.5" fill="currentColor"/>
    <rect x="11" y="11" width="2" height="6" rx="1" fill="currentColor"/>
  </svg>
);

// ============================================================================
// TABS CONFIG
// ============================================================================

const TABS: FooterTabConfig[] = [
  { id: 'players', label: 'Players', icon: PlayersIcon },
  { id: 'queue', label: 'Queue', icon: QueueIcon, hasBadge: true },
  { id: 'rosters', label: 'Roster', icon: RosterIcon },
  { id: 'board', label: 'Board', icon: BoardIcon },
  { id: 'info', label: 'Info', icon: InfoIcon },
];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface CountBadgeProps {
  count: number;
}

function CountBadge({ count }: CountBadgeProps): React.ReactElement {
  return (
    <span className={styles.badge}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DraftFooter({
  activeTab,
  onTabChange,
  queueCount = 0,
}: DraftFooterProps): React.ReactElement {
  return (
    <nav
      role="tablist"
      aria-label="Draft room navigation"
      className={styles.nav}
    >
      {/* Tab Bar */}
      <div className={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const hasBadge = tab.hasBadge && queueCount > 0;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              onClick={() => onTabChange(tab.id)}
              className={styles.tabButton}
            >
              {/* Icon with optional badge */}
              <div className={styles.iconContainer}>
                {tab.icon(isActive)}
                
                {/* Badge - only show when count > 0 */}
                {hasBadge && (
                  <span className={styles.badgeWrapper}>
                    <CountBadge count={queueCount} />
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={cn(styles.tabLabel, isActive ? styles.active : styles.inactive)}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Home Indicator */}
      <div className={styles.homeIndicator} />
    </nav>
  );
}
