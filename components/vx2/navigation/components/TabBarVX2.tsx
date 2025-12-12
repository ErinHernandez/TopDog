/**
 * TabBarVX2 - Enterprise Tab Bar Component
 * 
 * Bottom navigation tab bar with:
 * - Full accessibility support (WCAG 2.1 AA)
 * - Keyboard navigation
 * - Badge support
 * - iOS home indicator
 */

import React, { useCallback } from 'react';
import { useTabNavigation } from '../../core';
import { TAB_BAR, Z_INDEX, SAFE_AREA } from '../../core/constants';
import { TAB_BAR_COLORS } from '../../core/constants/colors';
import type { TabId, TabConfig } from '../../core/types';

// ============================================================================
// TYPES
// ============================================================================

export interface TabBarVX2Props {
  /** Additional className */
  className?: string;
  /** Override badge values (for external data sources) */
  badgeOverrides?: Partial<Record<TabId, number>>;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface TabButtonProps {
  tab: TabConfig;
  isActive: boolean;
  badgeValue?: number;
  onPress: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  tabIndex: number;
}

function TabButton({ 
  tab, 
  isActive, 
  badgeValue, 
  onPress, 
  onKeyDown,
  tabIndex,
}: TabButtonProps): React.ReactElement {
  const IconComponent = tab.icon.component;
  const svgMask = tab.icon.svgMask;
  
  // Create data URI for mask
  const maskDataUri = svgMask 
    ? `url("data:image/svg+xml,${encodeURIComponent(svgMask)}")`
    : undefined;
  
  return (
    <button
      id={`tab-${tab.id}`}
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${tab.id}`}
      aria-label={tab.accessibilityLabel}
      tabIndex={tabIndex}
      onClick={onPress}
      onKeyDown={onKeyDown}
      className="flex-1 flex flex-col items-center justify-start relative outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-inset"
      style={{
        minHeight: `${TAB_BAR.minHeight}px`,
        paddingLeft: `${TAB_BAR.tabPaddingX}px`,
        paddingRight: `${TAB_BAR.tabPaddingX}px`,
        transition: 'all 0.15s ease',
      }}
    >
      {/* Icon with optional badge */}
      <div 
        className="relative" 
        style={{ 
          width: `${TAB_BAR.iconSize}px`, 
          height: `${TAB_BAR.iconSize}px` 
        }}
      >
        {isActive && maskDataUri ? (
          // Active: Use CSS mask to show navbar image through icon shape
          <div
            style={{
              width: `${TAB_BAR.iconSize}px`,
              height: `${TAB_BAR.iconSize}px`,
              background: 'url(/wr_blue.png) no-repeat center center',
              backgroundSize: 'cover',
              WebkitMaskImage: maskDataUri,
              WebkitMaskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskImage: maskDataUri,
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
            }}
            aria-hidden="true"
          />
        ) : (
          // Inactive: Regular colored icon
          <IconComponent 
            size={TAB_BAR.iconSize} 
            color={TAB_BAR_COLORS.iconInactive} 
            filled={false}
          />
        )}
        
        {/* Badge */}
        {badgeValue !== undefined && badgeValue > 0 && (
          <TabBadge value={badgeValue} config={tab.badge!} />
        )}
      </div>
      
      {/* Label - uses background-clip for image text effect when active */}
      <span 
        className={isActive ? 'font-medium' : 'font-normal'}
        style={isActive ? {
          fontSize: `${TAB_BAR.labelFontSize}px`, 
          lineHeight: `${TAB_BAR.labelLineHeight}px`,
          marginTop: `${TAB_BAR.labelMarginTop}px`,
          background: 'url(/wr_blue.png) no-repeat center center',
          backgroundSize: 'cover',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        } as React.CSSProperties : {
          fontSize: `${TAB_BAR.labelFontSize}px`, 
          lineHeight: `${TAB_BAR.labelLineHeight}px`,
          marginTop: `${TAB_BAR.labelMarginTop}px`,
          color: TAB_BAR_COLORS.labelInactive,
        }}
      >
        {tab.displayName}
      </span>
    </button>
  );
}

interface TabBadgeProps {
  value: number;
  config: NonNullable<TabConfig['badge']>;
}

function TabBadge({ value, config }: TabBadgeProps): React.ReactElement {
  const displayValue = value > config.maxDisplay ? `${config.maxDisplay}+` : value.toString();
  
  return (
    <div 
      className="absolute rounded-full flex items-center justify-center"
      style={{
        top: `${TAB_BAR.badgeOffsetTop}px`,
        right: `${TAB_BAR.badgeOffsetRight}px`,
        minWidth: `${TAB_BAR.badgeMinWidth}px`,
        height: `${TAB_BAR.badgeHeight}px`,
        paddingLeft: '4px',
        paddingRight: '4px',
        fontSize: `${TAB_BAR.badgeFontSize}px`,
        lineHeight: '1',
        background: 'url(/wr_blue.png) no-repeat center center',
        backgroundSize: 'cover',
        color: '#FFFFFF',
      }}
      aria-label={`${value} items`}
    >
      {displayValue}
    </div>
  );
}

function HomeIndicator(): React.ReactElement {
  return (
    <div 
      className="mx-auto rounded-full"
      style={{
        width: `${TAB_BAR.homeIndicatorWidth}px`,
        height: `${TAB_BAR.homeIndicatorHeight}px`,
        backgroundColor: TAB_BAR_COLORS.homeIndicator,
        marginTop: `${TAB_BAR.homeIndicatorMarginTop}px`,
        marginBottom: `max(${TAB_BAR.homeIndicatorMarginBottom}px, ${SAFE_AREA.bottom})`,
      }}
      aria-hidden="true"
    />
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TabBarVX2({ 
  className = '',
  badgeOverrides = {},
}: TabBarVX2Props): React.ReactElement {
  const { state, navigateToTab, getAllTabs } = useTabNavigation();
  const tabs = getAllTabs();
  
  // Get badge value for a tab
  const getBadgeValue = useCallback((tab: TabConfig): number | undefined => {
    // Check for override first
    if (badgeOverrides[tab.id] !== undefined) {
      return badgeOverrides[tab.id];
    }
    
    // Then check tab config
    if (!tab.badge) return undefined;
    
    switch (tab.badge.source) {
      case 'static':
        return tab.badge.staticValue;
      case 'callback':
        return tab.badge.getValue?.() ?? undefined;
      case 'context':
        // Would need to integrate with app context
        return undefined;
      default:
        return undefined;
    }
  }, [badgeOverrides]);
  
  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
    let newIndex = currentIndex;
    
    switch (e.key) {
      case 'ArrowRight':
        newIndex = (currentIndex + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = tabs.length - 1;
        break;
      default:
        return; // Don't prevent default for other keys
    }
    
    e.preventDefault();
    
    // Navigate to new tab
    navigateToTab(tabs[newIndex].id);
    
    // Focus the new tab button
    const newTabButton = document.getElementById(`tab-${tabs[newIndex].id}`);
    newTabButton?.focus();
  }, [tabs, navigateToTab]);
  
  return (
    <nav
      className={`flex-shrink-0 ${className}`}
      style={{
        backgroundColor: TAB_BAR_COLORS.background,
        borderTop: `1px solid ${TAB_BAR_COLORS.border}`,
        zIndex: Z_INDEX.tabBar,
      }}
      role="tablist"
      aria-label="Main navigation"
    >
      {/* Tab Buttons */}
      <div 
        className="flex"
        style={{ paddingTop: `${TAB_BAR.paddingTop}px` }}
      >
        {tabs.map((tab, index) => {
          const isActive = state.activeTab === tab.id;
          const badgeValue = getBadgeValue(tab);
          
          return (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={isActive}
              badgeValue={badgeValue}
              onPress={() => navigateToTab(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              tabIndex={isActive ? 0 : -1}
            />
          );
        })}
      </div>
      
      {/* Home Indicator (iOS style) */}
      <HomeIndicator />
    </nav>
  );
}

