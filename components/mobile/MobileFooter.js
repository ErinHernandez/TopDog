/**
 * MobileFooter - App Navigation Footer
 * 
 * Bottom navigation for main app screens:
 * Lobby, Live Drafts, My Teams, Exposure, Profile
 */

import React, { useState } from 'react';
import MobileFooterBase, { FOOTER_ICONS } from './shared/MobileFooterBase';

export default function MobileFooter({ 
  activeTab = 'Lobby', 
  onTabChange = () => {}, 
  onTabClick = () => {} 
}) {
  // Mock data for active drafts count - replace with real data source
  const [activeDraftsCount] = useState(3);

  const tabs = [
    {
      id: 'Lobby',
      label: 'Lobby',
      icon: FOOTER_ICONS.lobby
    },
    {
      id: 'Live Drafts',
      label: 'Live Drafts',
      icon: FOOTER_ICONS.liveDrafts,
      badge: activeDraftsCount > 1 ? activeDraftsCount : 0
    },
    {
      id: 'My Teams',
      label: 'My Teams',
      icon: FOOTER_ICONS.teams
    },
    {
      id: 'Exposure',
      label: 'Exposure',
      icon: FOOTER_ICONS.exposure
    },
    {
      id: 'Profile',
      label: 'Profile',
      icon: FOOTER_ICONS.profile
    }
  ];

  const handleTabChange = (tabId) => {
    onTabChange?.(tabId);
    onTabClick?.();
  };

  return (
    <MobileFooterBase
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      bottomOffset="-20px"
      showHomeIndicator={true}
    />
  );
}
