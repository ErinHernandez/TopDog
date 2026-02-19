/**
 * TabBarVX2 - Enterprise Tab Bar Component
 *
 * Bottom navigation tab bar with:
 * - Full accessibility support (WCAG 2.1 AA)
 * - Keyboard navigation
 * - Badge support
 * - iOS home indicator
 *
 * Migrated to CSS Modules for CSP compliance.
 */

import React, { useCallback } from 'react';

import { cn } from '@/lib/styles';

import { useTabNavigation } from '../../core';
import { TAB_BAR, SAFE_AREA } from '../../core/constants';
import { TAB_BAR_COLORS } from '../../core/constants/colors';
import type { TabId, TabConfig } from '../../core/types';

import styles from './TabBarVX2.module.css';

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

  // CSS custom properties for dynamic values from constants
  const buttonStyle: React.CSSProperties = {
    '--tab-min-height': `${TAB_BAR.minHeight}px`,
    '--tab-padding-x': `${TAB_BAR.tabPaddingX}px`,
  } as React.CSSProperties;

  const iconStyle: React.CSSProperties = {
    '--tab-icon-size': `${TAB_BAR.iconSize}px`,
  } as React.CSSProperties;

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
      className={styles.tabButton}
      style={buttonStyle}
    >
      {/* Icon with optional badge */}
      <div className={styles.iconContainer} style={iconStyle}>
        {isActive && maskDataUri ? (
          // Active: Use CSS mask to show navbar image through icon shape
          <div
            className={styles.activeIcon}
            style={{
              WebkitMaskImage: maskDataUri,
              maskImage: maskDataUri,
            } as React.CSSProperties}
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
        className={cn(
          styles.label,
          isActive ? styles.labelActive : styles.labelInactive
        )}
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

  const badgeStyle: React.CSSProperties = {
    '--badge-offset-top': `${TAB_BAR.badgeOffsetTop}px`,
    '--badge-offset-right': `${TAB_BAR.badgeOffsetRight}px`,
    '--badge-min-width': `${TAB_BAR.badgeMinWidth}px`,
    '--badge-height': `${TAB_BAR.badgeHeight}px`,
    '--badge-font-size': `${TAB_BAR.badgeFontSize}px`,
  } as React.CSSProperties;

  return (
    <div
      className={styles.badge}
      style={badgeStyle}
      aria-label={`${value} items`}
    >
      {displayValue}
    </div>
  );
}

function HomeIndicator(): React.ReactElement {
  const indicatorStyle: React.CSSProperties = {
    '--home-indicator-width': `${TAB_BAR.homeIndicatorWidth}px`,
    '--home-indicator-height': `${TAB_BAR.homeIndicatorHeight}px`,
    '--home-indicator-color': TAB_BAR_COLORS.homeIndicator,
    '--home-indicator-margin-top': `${TAB_BAR.homeIndicatorMarginTop}px`,
    '--home-indicator-margin-bottom': `${TAB_BAR.homeIndicatorMarginBottom}px`,
  } as React.CSSProperties;

  return (
    <div
      className={styles.homeIndicator}
      style={indicatorStyle}
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
    // Guard against empty tabs array (defensive programming)
    if (tabs.length === 0) return;

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

    // Ensure newIndex is valid (defensive check)
    if (newIndex < 0 || newIndex >= tabs.length) return;

    e.preventDefault();

    // Navigate to new tab
    const newTab = tabs[newIndex];
    if (!newTab) return;

    navigateToTab(newTab.id);

    // Focus the new tab button
    const newTabButton = document.getElementById(`tab-${newTab.id}`);
    newTabButton?.focus();
  }, [tabs, navigateToTab]);

  return (
    <nav
      className={cn('vx2-tab-bar', styles.nav, className)}
      style={{
        '--tab-bar-bg': TAB_BAR_COLORS.background,
        '--tab-bar-border': TAB_BAR_COLORS.border,
      } as React.CSSProperties}
      role="tablist"
      aria-label="Main navigation"
    >
      {/* Tab Buttons */}
      <div className={styles.tabButtonsContainer}>
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
