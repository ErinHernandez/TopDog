/**
 * QuickActionsVX - Version X Quick Actions (TypeScript)
 * 
 * Migrated from: components/draft/v3/mobile/apple/components/QuickActionsApple.js
 * 
 * Floating action buttons for draft actions:
 * - Shows selected player info
 * - Draft and Queue buttons
 * - Only visible when player selected and it's user's turn
 */

import React, { useState } from 'react';
import { Button, PositionTag } from '../../shared';
import type { Player } from '../../shared/types';

// ============================================================================
// PIXEL CONSTANTS
// ============================================================================

const QUICK_ACTIONS_PX = {
  // Container positioning
  containerBottom: 24,
  containerLeftRight: 16,
  safeAreaBottom: 34, // Approximate iOS safe area
  
  // Card
  cardPadding: 16,
  cardMarginBottom: 16,
  cardBorderRadius: 16,
  cardBlur: 20,
  
  // Player info
  playerNameFontSize: 16,
  playerDetailsFontSize: 14,
  playerDetailsGap: 8,
  playerDetailsMarginTop: 4,
  
  // Buttons
  buttonGap: 12,
  buttonMarginLeft: 16,
  buttonPaddingX: 24,
  buttonPaddingY: 12,
  buttonBorderRadius: 12,
  buttonMinHeight: 48,
  buttonFontSize: 16,
} as const;

const QUICK_ACTIONS_COLORS = {
  cardBg: 'rgba(255, 255, 255, 0.1)',
  textPrimary: '#ffffff',
  textSecondary: '#d1d5db',
  buttonPrimaryBg: '#2563eb',
  buttonSecondaryBg: '#374151',
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface QuickActionsVXProps {
  /** Currently selected player */
  selectedPlayer: Player | null;
  /** Callback when drafting player */
  onDraft?: (player: Player) => void;
  /** Callback when queuing player */
  onQueue?: (player: Player) => void;
  /** Whether it's the user's turn */
  isMyTurn?: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function QuickActionsVX({
  selectedPlayer,
  onDraft,
  onQueue,
  isMyTurn = false,
}: QuickActionsVXProps): React.ReactElement | null {
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  
  // Only show when player selected and it's user's turn
  if (!selectedPlayer || !isMyTurn) return null;

  const handleDraft = () => {
    onDraft?.(selectedPlayer);
  };

  const handleQueue = () => {
    onQueue?.(selectedPlayer);
  };

  const handlePlayerClick = () => {
    setIsStatsModalOpen(true);
  };

  return (
    <div 
      className="fixed z-40"
      style={{
        bottom: `${QUICK_ACTIONS_PX.containerBottom}px`,
        left: `${QUICK_ACTIONS_PX.containerLeftRight}px`,
        right: `${QUICK_ACTIONS_PX.containerLeftRight}px`,
        paddingBottom: `env(safe-area-inset-bottom, ${QUICK_ACTIONS_PX.safeAreaBottom}px)`,
      }}
    >
      {/* Selected Player Card */}
      <div 
        style={{
          padding: `${QUICK_ACTIONS_PX.cardPadding}px`,
          marginBottom: `${QUICK_ACTIONS_PX.cardMarginBottom}px`,
          borderRadius: `${QUICK_ACTIONS_PX.cardBorderRadius}px`,
          backgroundColor: QUICK_ACTIONS_COLORS.cardBg,
          backdropFilter: `blur(${QUICK_ACTIONS_PX.cardBlur}px)`,
          WebkitBackdropFilter: `blur(${QUICK_ACTIONS_PX.cardBlur}px)`,
        }}
      >
        <div className="flex items-center justify-between">
          {/* Player Info */}
          <div className="flex-1">
            <div 
              className="font-medium cursor-pointer hover:text-blue-300 transition-colors"
              style={{ 
                color: QUICK_ACTIONS_COLORS.textPrimary,
                fontSize: `${QUICK_ACTIONS_PX.playerNameFontSize}px`,
              }}
              onClick={handlePlayerClick}
            >
              {selectedPlayer.name}
            </div>
            <div 
              className="flex items-center"
              style={{ 
                gap: `${QUICK_ACTIONS_PX.playerDetailsGap}px`,
                marginTop: `${QUICK_ACTIONS_PX.playerDetailsMarginTop}px`,
              }}
            >
              <PositionTag position={selectedPlayer.position} size="sm" />
              <span 
                style={{ 
                  color: QUICK_ACTIONS_COLORS.textSecondary,
                  fontSize: `${QUICK_ACTIONS_PX.playerDetailsFontSize}px`,
                }}
              >
                {selectedPlayer.team} - ADP: {selectedPlayer.adp?.toFixed(1) || 'N/A'}
              </span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div 
            className="flex"
            style={{ 
              gap: `${QUICK_ACTIONS_PX.buttonGap}px`,
              marginLeft: `${QUICK_ACTIONS_PX.buttonMarginLeft}px`,
            }}
          >
            <button
              onClick={handleQueue}
              className="font-medium"
              style={{
                paddingLeft: `${QUICK_ACTIONS_PX.buttonPaddingX}px`,
                paddingRight: `${QUICK_ACTIONS_PX.buttonPaddingX}px`,
                paddingTop: `${QUICK_ACTIONS_PX.buttonPaddingY}px`,
                paddingBottom: `${QUICK_ACTIONS_PX.buttonPaddingY}px`,
                borderRadius: `${QUICK_ACTIONS_PX.buttonBorderRadius}px`,
                minHeight: `${QUICK_ACTIONS_PX.buttonMinHeight}px`,
                backgroundColor: QUICK_ACTIONS_COLORS.buttonSecondaryBg,
                color: QUICK_ACTIONS_COLORS.textPrimary,
                fontSize: `${QUICK_ACTIONS_PX.buttonFontSize}px`,
                transition: 'all 0.25s ease',
              }}
            >
              Queue
            </button>
            <button
              onClick={handleDraft}
              className="font-medium"
              style={{
                paddingLeft: `${QUICK_ACTIONS_PX.buttonPaddingX}px`,
                paddingRight: `${QUICK_ACTIONS_PX.buttonPaddingX}px`,
                paddingTop: `${QUICK_ACTIONS_PX.buttonPaddingY}px`,
                paddingBottom: `${QUICK_ACTIONS_PX.buttonPaddingY}px`,
                borderRadius: `${QUICK_ACTIONS_PX.buttonBorderRadius}px`,
                minHeight: `${QUICK_ACTIONS_PX.buttonMinHeight}px`,
                backgroundColor: QUICK_ACTIONS_COLORS.buttonPrimaryBg,
                color: QUICK_ACTIONS_COLORS.textPrimary,
                fontSize: `${QUICK_ACTIONS_PX.buttonFontSize}px`,
                transition: 'all 0.25s ease',
              }}
            >
              Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

