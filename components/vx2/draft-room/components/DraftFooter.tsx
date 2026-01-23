/**
 * DraftFooter - Bottom tab navigation bar
 * 
 * Pixel-matched to VX FooterVX.tsx styling:
 * - Black background
 * - Blue active state (#60A5FA)
 * - Gray inactive state (#9CA3AF)
 * - Home indicator bar
 * 
 * A-Grade Requirements:
 * - TypeScript: Full type coverage
 * - Accessibility: ARIA labels, touch targets
 */

import React from 'react';
import type { DraftTab } from '../types';

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

const FOOTER_COLORS = {
  background: '#000000',
  border: '#374151',
  active: '#60A5FA',
  inactive: '#9CA3AF',
  homeIndicator: 'rgba(255, 255, 255, 0.3)',
  badgeBg: '#EF4444',
  badgeText: '#FFFFFF',
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
    style={{ color: isActive ? FOOTER_COLORS.active : FOOTER_COLORS.inactive }}
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
    style={{ color: isActive ? FOOTER_COLORS.active : FOOTER_COLORS.inactive }}
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
    style={{ color: isActive ? FOOTER_COLORS.active : FOOTER_COLORS.inactive }}
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
    style={{ color: isActive ? FOOTER_COLORS.active : FOOTER_COLORS.inactive }}
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
    style={{ color: isActive ? FOOTER_COLORS.active : FOOTER_COLORS.inactive }}
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
    <span
      style={{
        minWidth: FOOTER_PX.badgeMinWidth,
        height: FOOTER_PX.badgeHeight,
        borderRadius: FOOTER_PX.badgeHeight / 2,
        backgroundColor: FOOTER_COLORS.badgeBg,
        color: FOOTER_COLORS.badgeText,
        fontSize: FOOTER_PX.badgeFontSize,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 5px',
      }}
    >
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
      style={{
        backgroundColor: FOOTER_COLORS.background,
        height: FOOTER_PX.containerHeight,
        borderTop: `${FOOTER_PX.containerBorderTop}px solid ${FOOTER_COLORS.border}`,
        width: '100%',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Tab Bar */}
      <div 
        style={{ 
          display: 'flex',
          flex: 1,
          paddingTop: FOOTER_PX.tabPaddingTop,
          width: '100%',
          overflow: 'hidden',
        }}
      >
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
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                minHeight: FOOTER_PX.tabMinHeight,
                paddingLeft: 0,
                paddingRight: 0,
                minWidth: 0,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.25s ease',
              }}
            >
              {/* Icon with optional badge */}
              <div 
                style={{ 
                  position: 'relative',
                  width: FOOTER_PX.iconSize, 
                  height: FOOTER_PX.iconSize,
                }}
              >
                {tab.icon(isActive)}
                
                {/* Badge - only show when count > 0 */}
                {hasBadge && (
                  <span 
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: FOOTER_PX.badgeOffsetRight,
                      transform: 'translateY(-50%)',
                    }}
                  >
                    <CountBadge count={queueCount} />
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                style={{
                  fontSize: FOOTER_PX.labelFontSize,
                  lineHeight: `${FOOTER_PX.labelLineHeight}px`,
                  marginTop: FOOTER_PX.labelMarginTop,
                  color: isActive ? FOOTER_COLORS.active : FOOTER_COLORS.inactive,
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Home Indicator */}
      <div 
        style={{
          width: FOOTER_PX.homeIndicatorWidth,
          height: FOOTER_PX.homeIndicatorHeight,
          backgroundColor: FOOTER_COLORS.homeIndicator,
          borderRadius: FOOTER_PX.homeIndicatorHeight,
          margin: `${FOOTER_PX.homeIndicatorMarginTop}px auto ${FOOTER_PX.homeIndicatorMarginBottom}px`,
        }}
      />
    </nav>
  );
}
