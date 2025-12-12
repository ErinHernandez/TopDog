/**
 * FooterVX - Version X Footer Navigation (TypeScript)
 * 
 * Migrated from: components/draft/v3/mobile/apple/components/MobileFooterApple.js
 * Pixel-matched with original icons and styling
 */

import React from 'react';
import { CountBadge } from '../../shared';

// ============================================================================
// TYPES
// ============================================================================

export type DraftTabId = 'Players' | 'Queue' | 'Rosters' | 'Board' | 'Info';

export interface FooterTab {
  id: DraftTabId;
  label: string;
  icon: (isActive: boolean) => React.ReactNode;
  badge?: number;
}

export interface FooterVXProps {
  /** Current active tab */
  activeTab: DraftTabId;
  /** Callback when tab is selected */
  onTabChange: (tab: DraftTabId) => void;
  /** Number of players in queue (for badge) */
  queueCount?: number;
  /** Whether to show the draft board tab */
  showBoardTab?: boolean;
  /** Whether to show the info tab */
  showInfoTab?: boolean;
}

// ============================================================================
// ICONS - Pixel-matched from original MobileFooterBase
// ============================================================================

// Players icon - single person (matches original)
const PlayersIcon = (isActive: boolean) => (
  <svg 
    className={`w-6 h-6 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} 
    fill={isActive ? 'currentColor' : 'none'} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={isActive ? 0 : 2} 
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
    />
  </svg>
);

// Queue icon - plus sign (matches original)
const QueueIcon = (isActive: boolean) => (
  <svg 
    className={`w-6 h-6 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeWidth={2} d="M12 5v14M5 12h14" />
  </svg>
);

// Roster icon - horizontal lines (matches original)
const RosterIcon = (isActive: boolean) => (
  <svg 
    className={`w-6 h-6 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} 
    fill="currentColor" 
    viewBox="0 0 24 24"
  >
    <path d="M1,6H23a1,1,0,0,0,0-2H1A1,1,0,0,0,1,6Z"/>
    <path d="M23,9H1a1,1,0,0,0,0,2H23a1,1,0,0,0,0-2Z"/>
    <path d="M23,19H1a1,1,0,0,0,0,2H23a1,1,0,0,0,0-2Z"/>
    <path d="M23,14H1a1,1,0,0,0,0,2H23a1,1,0,0,0,0-2Z"/>
  </svg>
);

// Board icon - 3x3 grid (matches original)
const BoardIcon = (isActive: boolean) => (
  <svg 
    className={`w-6 h-6 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} 
    fill="currentColor" 
    viewBox="0 0 24 24"
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

// Info icon (matches original)
const InfoIcon = (isActive: boolean) => (
  <svg 
    className={`w-6 h-6 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} 
    fill="currentColor" 
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="8" r="1.5" fill="currentColor"/>
    <rect x="11" y="11" width="2" height="6" rx="1" fill="currentColor"/>
  </svg>
);

// ============================================================================
// PIXEL-PERFECT CONSTANTS
// ============================================================================

const FOOTER_PX = {
  // Container
  containerHeight: 70,
  containerBorderTop: 1,
  
  // Tab buttons
  tabMinHeight: 44,
  tabPaddingTop: 8,
  tabPaddingBottom: 12,
  tabPaddingX: 2,
  
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
// MAIN COMPONENT
// ============================================================================

export default function FooterVX({
  activeTab,
  onTabChange,
  queueCount = 0,
  showBoardTab = true,
  showInfoTab = true,
}: FooterVXProps): React.ReactElement {
  // Build tabs - labels match original exactly
  const tabs: FooterTab[] = [
    { id: 'Players', label: 'Players', icon: PlayersIcon },
    { id: 'Queue', label: 'Queue', icon: QueueIcon, badge: queueCount },
    { id: 'Rosters', label: 'Roster', icon: RosterIcon }, // Note: "Roster" singular to match original
  ];

  if (showBoardTab) {
    tabs.push({ id: 'Board', label: 'Board', icon: BoardIcon });
  }

  if (showInfoTab) {
    tabs.push({ id: 'Info', label: 'Info', icon: InfoIcon });
  }

  return (
    <nav
      className="flex-shrink-0 border-t border-gray-700"
      style={{
        backgroundColor: '#000000',
        height: `${FOOTER_PX.containerHeight}px`,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Tab Bar */}
      <div 
        className="flex flex-1"
        style={{ paddingTop: `${FOOTER_PX.tabPaddingTop}px` }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const hasBadge = tab.badge !== undefined && tab.badge > 0;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex-1 flex flex-col items-center justify-start relative"
              style={{
                minHeight: `${FOOTER_PX.tabMinHeight}px`,
                transition: 'all 0.25s ease',
                paddingLeft: `${FOOTER_PX.tabPaddingX}px`,
                paddingRight: `${FOOTER_PX.tabPaddingX}px`,
              }}
            >
              {/* Icon with optional badge */}
              <div className="relative" style={{ width: `${FOOTER_PX.iconSize}px`, height: `${FOOTER_PX.iconSize}px` }}>
                {tab.icon(isActive)}
                
                {/* Badge - only show when count > 0 */}
                {hasBadge && (
                  <span 
                    className="absolute"
                    style={{
                      top: '50%',
                      right: `${FOOTER_PX.badgeOffsetRight}px`,
                      transform: 'translateY(-50%)',
                    }}
                  >
                    <CountBadge count={tab.badge!} />
                  </span>
                )}
              </div>

              {/* Label */}
              <span 
                className={isActive ? 'text-blue-400 font-medium' : 'text-gray-400'}
                style={{ 
                  fontSize: `${FOOTER_PX.labelFontSize}px`, 
                  lineHeight: `${FOOTER_PX.labelLineHeight}px`,
                  marginTop: `${FOOTER_PX.labelMarginTop}px`,
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
        className="mx-auto rounded-full"
        style={{
          width: `${FOOTER_PX.homeIndicatorWidth}px`,
          height: `${FOOTER_PX.homeIndicatorHeight}px`,
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          marginTop: `${FOOTER_PX.homeIndicatorMarginTop}px`,
          marginBottom: `max(${FOOTER_PX.homeIndicatorMarginBottom}px, env(safe-area-inset-bottom))`,
        }}
      />
    </nav>
  );
}
