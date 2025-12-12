/**
 * Quick Actions - iOS Style
 * 
 * Floating action buttons with iOS design:
 * - Context-sensitive actions
 * - iOS-style button animations
 * - Touch-optimized sizing
 */

import React, { useState } from 'react';
import { MOBILE_SIZES, PLATFORM_SPECIFIC } from '../../shared/constants/mobileSizes';
import PlayerStatsModal from './PlayerStatsModal';

export default function QuickActionsApple({ 
  selectedPlayer, 
  onDraft, 
  onQueue, 
  isMyTurn = false 
}) {
  const [statsPlayer, setStatsPlayer] = useState(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  if (!selectedPlayer || !isMyTurn) return null;

  // Handle opening stats modal
  const handlePlayerStatsClick = () => {
    setStatsPlayer(selectedPlayer);
    setIsStatsModalOpen(true);
  };

  // Handle closing stats modal
  const handleCloseStatsModal = () => {
    setIsStatsModalOpen(false);
    setStatsPlayer(null);
  };

  const handleDraft = () => {
    onDraft?.(selectedPlayer);
  };

  const handleQueue = () => {
    onQueue?.(selectedPlayer);
  };

  return (
    <div 
      className="fixed bottom-6 left-4 right-4 z-40"
      style={{
        paddingBottom: PLATFORM_SPECIFIC.IOS.SAFE_AREA_BOTTOM
      }}
    >
      {/* Selected Player Info */}
      <div 
        className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-4"
        style={{
          borderRadius: PLATFORM_SPECIFIC.IOS.BORDER_RADIUS,
          backdropFilter: 'blur(20px)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div 
              className="text-white font-medium cursor-pointer hover:text-blue-300 transition-colors"
              onClick={handlePlayerStatsClick}
            >
              {selectedPlayer.name}
            </div>
            <div className="text-gray-300 text-sm">
              {selectedPlayer.position} • {selectedPlayer.team} • ADP: {selectedPlayer.adp}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 ml-4">
            <button
              onClick={handleQueue}
              className="px-6 py-3 bg-gray-700 rounded-xl font-medium text-white"
              style={{
                minHeight: MOBILE_SIZES.TOUCH_TARGET_COMFORT,
                borderRadius: PLATFORM_SPECIFIC.IOS.BORDER_RADIUS,
                transition: `all ${PLATFORM_SPECIFIC.IOS.ANIMATION_DURATION} ease`
              }}
            >
              Queue
            </button>
            <button
              onClick={handleDraft}
              className="px-6 py-3 bg-blue-600 rounded-xl font-medium text-white"
              style={{
                minHeight: MOBILE_SIZES.TOUCH_TARGET_COMFORT,
                borderRadius: PLATFORM_SPECIFIC.IOS.BORDER_RADIUS,
                transition: `all ${PLATFORM_SPECIFIC.IOS.ANIMATION_DURATION} ease`
              }}
            >
              Draft
            </button>
          </div>
        </div>
      </div>

      {/* Player Stats Modal */}
      <PlayerStatsModal
        player={statsPlayer}
        isOpen={isStatsModalOpen}
        onClose={handleCloseStatsModal}
      />
    </div>
  );
}
