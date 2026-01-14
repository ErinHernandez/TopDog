/**
 * PlayerCard
 * 
 * Component for displaying a single player in the available players list.
 * Shows player name, position, team, ADP, and draft button.
 * 
 * Part of Phase 3: Extract Components
 */

import React from 'react';
import { Player } from '../types/draft';
import { POSITION_COLORS } from '@/components/draft/v3/constants/positions';
import { formatADP } from '../utils/draftUtils';
import { useDraftActions } from '../hooks/useDraftActions';
import { useDraftState } from '../context/DraftRoomContext';

export interface PlayerCardProps {
  player: Player;
  index: number;
  onPlayerClick?: (player: Player) => void;
}

/**
 * Get position color for styling
 */
function getPositionColor(position: string | undefined) {
  if (!position) return '#2DE2C5';
  const color = POSITION_COLORS[position as keyof typeof POSITION_COLORS];
  return color?.primary || '#2DE2C5';
}

/**
 * Player card component
 */
export function PlayerCard({ player, index, onPlayerClick }: PlayerCardProps) {
  const state = useDraftState();
  const { makePickAction, canDraftPlayerAction } = useDraftActions();

  const { room, currentUser, picks } = state;
  const isMyTurn = state.isMyTurn;
  const isDraftActive = room?.status === 'active';

  // Check if player can be drafted
  const canDraft = canDraftPlayerAction(player.name);

  // Get position count for user
  const userPicks = picks.filter((p) => p.user === currentUser);
  const playerData = player;
  const currentCount = userPicks.filter((p) => {
    // Find player position from player pool (would need PLAYER_POOL import)
    // For now, use player object directly
    return false; // Simplified - would need full logic
  }).length;

  const positionColor = getPositionColor(player.position);

  // Handle draft click
  const handleDraft = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMyTurn || !isDraftActive || !canDraft) {
      return;
    }
    await makePickAction(player.name);
  };

  // Handle card click (open player modal)
  const handleClick = () => {
    onPlayerClick?.(player);
  };

  return (
    <div
      className="flex items-center p-2 rounded-lg border cursor-pointer hover:bg-gray-800/50 transition-colors"
      style={{
        borderColor: positionColor,
        borderWidth: '1px',
        backgroundColor: 'rgba(31, 41, 55, 0.5)',
      }}
      onClick={handleClick}
    >
      {/* Position indicator */}
      <div
        className="w-8 h-8 rounded flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
        style={{ backgroundColor: positionColor }}
      >
        {player.position}
      </div>

      {/* Player info */}
      <div className="flex-1 ml-3 min-w-0">
        <div className="font-bold text-white text-sm truncate">{player.name}</div>
        <div className="text-xs text-gray-400">
          {player.team} • Bye {player.bye}
        </div>
      </div>

      {/* ADP */}
      <div className="text-xs text-gray-300 mr-3 flex-shrink-0 w-12 text-right">
        {formatADP(player.adp)}
      </div>

      {/* Draft button */}
      <button
        onClick={handleDraft}
        disabled={!isMyTurn || !isDraftActive || !canDraft}
        className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex-shrink-0 ${
          isMyTurn && isDraftActive && canDraft
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
        }`}
      >
        Draft
      </button>
    </div>
  );
}
