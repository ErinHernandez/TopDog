/**
 * QueuePanelVX - Version X Queue Panel (TypeScript)
 * 
 * Migrated from: components/draft/v3/mobile/apple/components/QueuePage.js (230 lines)
 * 
 * Features:
 * - Display queued players
 * - Move up/down (reorder)
 * - Remove from queue
 * - Touch-optimized for mobile
 * - Drag-and-drop support (desktop)
 */

import React, { useCallback } from 'react';
import { POSITION_COLORS, BG_COLORS, TEXT_COLORS } from '../../constants/colors';
import { MOBILE, FONT_SIZE } from '../../constants/sizes';
import { PositionBadgeInline } from '../../shared/PositionBadge';
import { EmptyQueue, IconButton } from '../../shared';
import type { FantasyPosition } from '../../constants/positions';
import type { Player } from '../../shared/types';

// Re-export Player type
export type { Player } from '../../shared/types';

export interface QueuePanelVXProps {
  /** Array of queued players */
  queuedPlayers: Player[];
  /** Callback when queue order changes */
  onReorder?: (players: Player[]) => void;
  /** Callback to remove a player from queue */
  onRemove?: (player: Player) => void;
  /** Callback to move player up */
  onMoveUp?: (index: number) => void;
  /** Callback to move player down */
  onMoveDown?: (index: number) => void;
  /** Callback when player is clicked */
  onPlayerClick?: (player: Player) => void;
  /** Callback to navigate to players tab */
  onBrowsePlayers?: () => void;
  /** Whether reordering is enabled */
  enableReorder?: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function QueuePanelVX({
  queuedPlayers = [],
  onReorder,
  onRemove,
  onMoveUp,
  onMoveDown,
  onPlayerClick,
  onBrowsePlayers,
  enableReorder = true,
}: QueuePanelVXProps): React.ReactElement {
  // Handle move up
  const handleMoveUp = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index === 0) return;
    
    if (onMoveUp) {
      onMoveUp(index);
    } else if (onReorder) {
      const newOrder = [...queuedPlayers];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      onReorder(newOrder);
    }
  }, [queuedPlayers, onMoveUp, onReorder]);

  // Handle move down
  const handleMoveDown = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index === queuedPlayers.length - 1) return;
    
    if (onMoveDown) {
      onMoveDown(index);
    } else if (onReorder) {
      const newOrder = [...queuedPlayers];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      onReorder(newOrder);
    }
  }, [queuedPlayers, onMoveDown, onReorder]);

  // Handle remove
  const handleRemove = useCallback((player: Player, e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.(player);
  }, [onRemove]);

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: BG_COLORS.primary }}>
      {/* Queue List */}
      <div 
        className="flex-1 overflow-y-auto"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        {queuedPlayers.length === 0 ? (
          <EmptyQueue onBrowse={onBrowsePlayers} />
        ) : (
          <div className="px-2 py-2">
            {queuedPlayers.map((player, index) => (
              <QueuedPlayerRow
                key={`${player.name}-${index}`}
                player={player}
                index={index}
                isFirst={index === 0}
                isLast={index === queuedPlayers.length - 1}
                onMoveUp={(e) => handleMoveUp(index, e)}
                onMoveDown={(e) => handleMoveDown(index, e)}
                onRemove={(e) => handleRemove(player, e)}
                onClick={() => onPlayerClick?.(player)}
                enableReorder={enableReorder}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer hint */}
      {queuedPlayers.length > 0 && (
        <div className="px-4 py-2 border-t border-white/10 text-center">
          <span className="text-gray-500 text-xs">
            Your top queued player will be auto-drafted when it's your turn
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// QUEUED PLAYER ROW
// ============================================================================

interface QueuedPlayerRowProps {
  player: Player;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: (e: React.MouseEvent) => void;
  onMoveDown: (e: React.MouseEvent) => void;
  onRemove: (e: React.MouseEvent) => void;
  onClick: () => void;
  enableReorder: boolean;
}

function QueuedPlayerRow({
  player,
  index,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
  onClick,
  enableReorder,
}: QueuedPlayerRowProps): React.ReactElement {
  const positionColor = POSITION_COLORS[player.position];

  return (
    <div
      className="flex items-center rounded-lg mb-2 cursor-pointer transition-colors hover:bg-white/5 active:bg-white/10"
      style={{
        backgroundColor: BG_COLORS.card,
        border: '1px solid rgba(255,255,255,0.1)',
        minHeight: '56px',
      }}
      onClick={onClick}
    >
      {/* Queue Number */}
      <div
        className="flex items-center justify-center font-bold text-white"
        style={{
          width: '36px',
          fontSize: '16px',
        }}
      >
        {index + 1}
      </div>

      {/* Position Badge */}
      <div className="mr-3">
        <PositionBadgeInline position={player.position} size="md" />
      </div>

      {/* Player Info */}
      <div className="flex-1 min-w-0">
        <div
          className="text-white font-medium truncate"
          style={{ fontSize: '14px' }}
        >
          {player.name}
        </div>
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <span>{player.team}</span>
          {player.adp && (
            <>
              <span>ADP: {parseFloat(String(player.adp)).toFixed(1)}</span>
            </>
          )}
        </div>
      </div>

      {/* Reorder Controls */}
      {enableReorder && (
        <div className="flex items-center mr-1">
          {/* Move Up */}
          <IconButton
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 4L12 10H4L8 4Z" fill="currentColor" />
              </svg>
            }
            onClick={onMoveUp}
            size="sm"
            variant="ghost"
            disabled={isFirst}
            aria-label="Move up"
          />

          {/* Move Down */}
          <IconButton
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 12L4 6H12L8 12Z" fill="currentColor" />
              </svg>
            }
            onClick={onMoveDown}
            size="sm"
            variant="ghost"
            disabled={isLast}
            aria-label="Move down"
          />
        </div>
      )}

      {/* Remove Button */}
      <IconButton
        icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        }
        onClick={onRemove}
        size="sm"
        variant="ghost"
        className="mr-2 text-red-500 hover:bg-red-500/20"
        aria-label="Remove from queue"
      />
    </div>
  );
}

