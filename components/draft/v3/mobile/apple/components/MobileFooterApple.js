/**
 * MobileFooterApple - Draft Room Navigation Footer
 * 
 * Bottom navigation for draft room screens:
 * Players, Queue, Rosters, Board, Info
 */

import React from 'react';
import MobileFooterBase, { FOOTER_ICONS } from '../../../../../mobile/shared/MobileFooterBase';

export default function MobileFooterApple({ 
  activeTab = 'Players',
  onTabChange,
  queueCount = 0
}) {
  const tabs = [
    {
      id: 'Players',
      label: 'Players',
      icon: FOOTER_ICONS.players
    },
    {
      id: 'Queue',
      label: 'Queue',
      icon: FOOTER_ICONS.queue,
      badge: queueCount,
      badgePosition: { top: '50%', right: '-16px' }
    },
    {
      id: 'Rosters',
      label: 'Roster',
      icon: FOOTER_ICONS.roster
    },
    {
      id: 'Board',
      label: 'Board',
      icon: FOOTER_ICONS.board
    },
    {
      id: 'Info',
      label: 'Info',
      icon: FOOTER_ICONS.info
    }
  ];

  const handleTabChange = (tabId) => {
    // Dispatch custom events for modals
    const eventMap = {
      'Board': 'showBoardModal',
      'Rosters': 'showTeamModal',
      'Queue': 'showQueueModal',
      'Info': 'showInfoModal'
    };
    
    if (eventMap[tabId]) {
      window.dispatchEvent(new CustomEvent(eventMap[tabId]));
    }
    
    onTabChange?.(tabId);
  };

  return (
    <MobileFooterBase
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      bottomOffset="0px"
      showHomeIndicator={true}
    />
  );
}
