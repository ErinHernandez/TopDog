/**
 * MobileFooter - App Navigation Footer
 * 
 * Bottom navigation for main app screens:
 * Lobby, Live Drafts, My Teams, Exposure, Profile
 * 
 * @example
 * ```tsx
 * <MobileFooter 
 *   activeTab="Lobby" 
 *   onTabChange={handleTabChange}
 * />
 * ```
 */

import React, { useState } from 'react';
import MobileFooterBase, { FOOTER_ICONS } from './shared/MobileFooterBase';

// ============================================================================
// TYPES
// ============================================================================

export type MobileTabId = 'Lobby' | 'Live Drafts' | 'My Teams' | 'Exposure' | 'Profile';

export interface MobileFooterProps {
  /** Active tab ID (default: "Lobby") */
  activeTab?: MobileTabId;
  /** Callback when tab changes */
  onTabChange?: (tabId: MobileTabId) => void;
  /** Callback when tab is clicked */
  onTabClick?: () => void;
}

interface TabConfig {
  id: MobileTabId;
  label: string;
  icon: (isActive: boolean) => React.ReactElement;
  badge?: number;
  badgePosition?: {
    top?: string;
    right?: string;
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

const MobileFooter: React.FC<MobileFooterProps> = ({ 
  activeTab = 'Lobby', 
  onTabChange,
  onTabClick,
}): React.ReactElement => {
  // Mock data for active drafts count - replace with real data source
  const [activeDraftsCount] = useState(3);

  const tabs: TabConfig[] = [
    {
      id: 'Lobby',
      label: 'Lobby',
      icon: FOOTER_ICONS.lobby,
    },
    {
      id: 'Live Drafts',
      label: 'Live Drafts',
      icon: FOOTER_ICONS.liveDrafts,
      badge: activeDraftsCount > 1 ? activeDraftsCount : 0,
    },
    {
      id: 'My Teams',
      label: 'My Teams',
      icon: FOOTER_ICONS.teams,
    },
    {
      id: 'Exposure',
      label: 'Exposure',
      icon: FOOTER_ICONS.exposure,
    },
    {
      id: 'Profile',
      label: 'Profile',
      icon: FOOTER_ICONS.profile,
    },
  ];

  const handleTabChange = (tabId: string): void => {
    onTabChange?.(tabId as MobileTabId);
    onTabClick?.();
  };

  return (
    <MobileFooterBase
      // @ts-expect-error - MobileFooterBase is JavaScript, accepts tabs array
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      bottomOffset="-20px"
      showHomeIndicator={true}
    />
  );
};

export default MobileFooter;
