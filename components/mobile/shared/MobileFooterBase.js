/**
 * MobileFooterBase - Shared Mobile Footer Component
 * 
 * Base component for iOS-style bottom navigation bars.
 * Used by both app navigation and draft room navigation.
 * 
 * Props:
 *   - tabs: Array of tab configurations
 *   - activeTab: Current active tab ID
 *   - onTabChange: Callback when tab changes
 *   - showHomeIndicator: Whether to show iOS home indicator (default: true)
 *   - bottomOffset: CSS value for bottom position (default: '0px')
 */

import React from 'react';
import { MOBILE_SIZES, PLATFORM_SPECIFIC } from '../../draft/v3/mobile/shared/constants/mobileSizes';

export default function MobileFooterBase({
  tabs = [],
  activeTab,
  onTabChange,
  showHomeIndicator = true,
  bottomOffset = '0px'
}) {
  return (
    <div 
      className="absolute left-0 right-0 bg-black border-t border-gray-700"
      style={{
        bottom: bottomOffset,
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 50
      }}
    >
      {/* Tab Bar */}
      <div className="flex">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className="flex-1 flex flex-col items-center justify-center px-1 relative"
              style={{
                minHeight: MOBILE_SIZES.TOUCH_TARGET_MIN,
                transition: `all ${PLATFORM_SPECIFIC.IOS.ANIMATION_DURATION} ease`,
                paddingTop: '10px',
                paddingBottom: '10px'
              }}
            >
              {/* Icon */}
              <div className="relative">
                {tab.icon(isActive)}
                
                {/* Badge - only show when count is greater than 0 */}
                {tab.badge > 0 && (
                  <div 
                    className="absolute bg-blue-400 text-black text-xs font-bold rounded-full flex items-center justify-center"
                    style={{
                      top: tab.badgePosition?.top || '1px',
                      right: tab.badgePosition?.right || '-12px',
                      minWidth: '18px',
                      height: '18px',
                      fontSize: '10.5px',
                      lineHeight: '1'
                    }}
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </div>
                )}
              </div>
              
              {/* Label */}
              <span 
                className={`text-xs mt-1 ${isActive ? 'text-blue-400 font-medium' : 'text-gray-400'}`}
                style={{ fontSize: '10px', lineHeight: '12px' }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Home Indicator */}
      {showHomeIndicator && (
        <div 
          className="w-32 h-1 bg-white/30 rounded-full mx-auto"
          style={{
            marginTop: '8px',
            marginBottom: 'max(4px, env(safe-area-inset-bottom))'
          }}
        />
      )}
    </div>
  );
}

// ============================================
// ICON FACTORIES
// ============================================

/**
 * Create an icon component with active/inactive states
 */
export const createIcon = (paths, options = {}) => {
  const { filled = false, strokeWidth = 2, name = 'Icon' } = options;
  
  const IconComponent = (isActive) => (
    <svg 
      className={`w-6 h-6 ${isActive ? 'text-blue-400' : 'text-gray-400'}`}
      fill={filled || isActive ? 'currentColor' : 'none'}
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      {typeof paths === 'function' ? paths(isActive) : paths}
    </svg>
  );
  IconComponent.displayName = name;
  return IconComponent;
};

// ============================================
// COMMON ICONS
// ============================================

export const FOOTER_ICONS = {
  // App Navigation Icons
  lobby: (isActive) => (
    <svg className={`w-6 h-6 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 0 : 2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v8z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21l4-4 4 4M3 7l9-4 9 4" />
    </svg>
  ),
  
  liveDrafts: (isActive) => (
    <svg className={`w-6 h-6 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 0 : 2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  
  teams: (isActive) => (
    <svg className={`w-6 h-6 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 0 : 2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  
  exposure: (isActive) => (
    <svg className={`w-6 h-6 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  
  profile: (isActive) => (
    <svg className={`w-6 h-6 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  
  // Draft Room Icons
  players: (isActive) => (
    <svg className={`w-6 h-6 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 0 : 2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  
  queue: (isActive) => (
    <svg className={`w-6 h-6 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeWidth={2} d="M12 5v14M5 12h14" />
    </svg>
  ),
  
  roster: (isActive) => (
    <svg className={`w-6 h-6 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M1,6H23a1,1,0,0,0,0-2H1A1,1,0,0,0,1,6Z"/>
      <path d="M23,9H1a1,1,0,0,0,0,2H23a1,1,0,0,0,0-2Z"/>
      <path d="M23,19H1a1,1,0,0,0,0,2H23a1,1,0,0,0,0-2Z"/>
      <path d="M23,14H1a1,1,0,0,0,0,2H23a1,1,0,0,0,0-2Z"/>
    </svg>
  ),
  
  board: (isActive) => (
    <svg className={`w-6 h-6 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
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
  ),
  
  info: (isActive) => (
    <svg className={`w-6 h-6 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="8" r="1.5" fill="currentColor"/>
      <rect x="11" y="11" width="2" height="6" rx="1" fill="currentColor"/>
    </svg>
  )
};

