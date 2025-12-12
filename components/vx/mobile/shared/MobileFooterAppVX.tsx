/**
 * MobileFooterAppVX - App Navigation Footer (TypeScript)
 * 
 * Migrated from: components/mobile/MobileFooter.js
 * 
 * Bottom navigation for main app screens:
 * Lobby, Live Drafts, My Teams, Exposure, Profile
 */

import React, { useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type AppTab = 'Lobby' | 'Live Drafts' | 'My Teams' | 'Exposure' | 'Profile';

export interface MobileFooterAppVXProps {
  activeTab?: AppTab;
  onTabChange?: (tab: AppTab) => void;
  onTabClick?: () => void;
}

interface TabConfig {
  id: AppTab;
  label: string;
  icon: (isActive: boolean) => React.ReactElement;
  badge?: number;
  badgePosition?: { top?: string; right?: string };
}

// ============================================================================
// PIXEL-PERFECT CONSTANTS
// ============================================================================

const FOOTER_APP_PX = {
  // Container
  bottomOffset: -20,
  
  // Tab buttons
  tabMinHeight: 44,
  tabPaddingTop: 10,
  tabPaddingBottom: 10,
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
  badgeOffsetTop: 1,
  badgeOffsetRight: -12,
  
  // Home indicator
  homeIndicatorWidth: 134,
  homeIndicatorHeight: 5,
  homeIndicatorMarginTop: 8,
  homeIndicatorMarginBottom: 4,
} as const;

// ============================================================================
// ICONS
// ============================================================================

const ICONS = {
  lobby: (isActive: boolean) => (
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
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v8z" 
      />
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M8 21l4-4 4 4M3 7l9-4 9 4" 
      />
    </svg>
  ),
  
  liveDrafts: (isActive: boolean) => (
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
        d="M13 10V3L4 14h7v7l9-11h-7z" 
      />
    </svg>
  ),
  
  teams: (isActive: boolean) => (
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
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
      />
    </svg>
  ),
  
  exposure: (isActive: boolean) => (
    <svg 
      className={`w-6 h-6 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
      />
    </svg>
  ),
  
  profile: (isActive: boolean) => (
    <svg 
      className={`w-6 h-6 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
      />
    </svg>
  ),
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MobileFooterAppVX({ 
  activeTab = 'Lobby', 
  onTabChange,
  onTabClick
}: MobileFooterAppVXProps): React.ReactElement {
  // Mock data for active drafts count - replace with real data source
  const [activeDraftsCount] = useState(3);

  const tabs: TabConfig[] = [
    {
      id: 'Lobby',
      label: 'Lobby',
      icon: ICONS.lobby
    },
    {
      id: 'Live Drafts',
      label: 'Live Drafts',
      icon: ICONS.liveDrafts,
      badge: activeDraftsCount > 1 ? activeDraftsCount : 0
    },
    {
      id: 'My Teams',
      label: 'My Teams',
      icon: ICONS.teams
    },
    {
      id: 'Exposure',
      label: 'Exposure',
      icon: ICONS.exposure
    },
    {
      id: 'Profile',
      label: 'Profile',
      icon: ICONS.profile
    }
  ];

  const handleTabChange = (tabId: AppTab) => {
    onTabChange?.(tabId);
    onTabClick?.();
  };

  return (
    <div 
      className="absolute left-0 right-0 border-t border-gray-700"
      style={{
        bottom: `${FOOTER_APP_PX.bottomOffset}px`,
        backgroundColor: '#000000',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Tab Bar */}
      <div 
        className="flex"
        style={{ paddingTop: `${FOOTER_APP_PX.tabPaddingTop}px` }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className="flex-1 flex flex-col items-center justify-start relative"
              style={{
                minHeight: `${FOOTER_APP_PX.tabMinHeight}px`,
                transition: 'all 0.25s ease',
                paddingLeft: `${FOOTER_APP_PX.tabPaddingX}px`,
                paddingRight: `${FOOTER_APP_PX.tabPaddingX}px`,
              }}
            >
              {/* Icon */}
              <div 
                className="relative" 
                style={{ 
                  width: `${FOOTER_APP_PX.iconSize}px`, 
                  height: `${FOOTER_APP_PX.iconSize}px` 
                }}
              >
                {tab.icon(isActive)}
                
                {/* Badge - only show when count is greater than 0 */}
                {tab.badge && tab.badge > 0 && (
                  <div 
                    className="absolute bg-blue-400 text-black font-bold rounded-full flex items-center justify-center"
                    style={{
                      top: tab.badgePosition?.top || `${FOOTER_APP_PX.badgeOffsetTop}px`,
                      right: tab.badgePosition?.right || `${FOOTER_APP_PX.badgeOffsetRight}px`,
                      minWidth: `${FOOTER_APP_PX.badgeMinWidth}px`,
                      height: `${FOOTER_APP_PX.badgeHeight}px`,
                      fontSize: `${FOOTER_APP_PX.badgeFontSize}px`,
                      lineHeight: '1',
                    }}
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </div>
                )}
              </div>
              
              {/* Label */}
              <span 
                className={isActive ? 'text-blue-400 font-medium' : 'text-gray-400'}
                style={{ 
                  fontSize: `${FOOTER_APP_PX.labelFontSize}px`, 
                  lineHeight: `${FOOTER_APP_PX.labelLineHeight}px`,
                  marginTop: `${FOOTER_APP_PX.labelMarginTop}px`,
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
          width: `${FOOTER_APP_PX.homeIndicatorWidth}px`,
          height: `${FOOTER_APP_PX.homeIndicatorHeight}px`,
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          marginTop: `${FOOTER_APP_PX.homeIndicatorMarginTop}px`,
          marginBottom: `max(${FOOTER_APP_PX.homeIndicatorMarginBottom}px, env(safe-area-inset-bottom))`,
        }}
      />
    </div>
  );
}

