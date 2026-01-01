/**
 * QueueViewVX2 - Enterprise-grade draft queue panel
 * 
 * Pixel-matched to VX QueuePanelVX.tsx:
 * - Queue number + position badge + player info + ADP
 * - Move up/down arrows for reordering
 * - Remove button (red X)
 * - Empty state with + icon
 * - Footer hint about auto-draft
 * 
 * A-Grade Standards:
 * - TypeScript: Full type coverage
 * - Constants: Pixel-perfect values from VX
 * - Accessibility: ARIA labels, keyboard navigation
 * - Co-located sub-components
 */

import React, { useCallback, useRef, useEffect } from 'react';
import type { QueuedPlayer, Position } from '../types';
import { POSITION_COLORS } from '../constants';
import { BG_COLORS, TEXT_COLORS } from '../../core/constants/colors';

// ============================================================================
// PIXEL-PERFECT CONSTANTS (matched from VX QueuePanelVX.tsx)
// ============================================================================

const QUEUE_PX = {
  // Container
  containerPaddingX: 4,
  containerPaddingY: 8,
  
  // Row (matched to PlayerList: rowHeight: 40)
  rowHeight: 40,
  rowBorderRadius: 0,
  rowMarginBottom: 0,
  rowBorderWidth: 1,
  
  // Queue Number
  queueNumberWidth: 28,
  queueNumberFontSize: 13,
  
  // Position Badge (matched to PlayerList inline badge)
  badgeMarginRight: 6,
  badgePaddingX: 5,
  badgePaddingY: 1,
  badgeFontSize: 10,
  badgeBorderRadius: 3,
  
  // Player Info (matched to PlayerList: playerNameFontSize: 13, playerTeamFontSize: 11)
  playerNameFontSize: 13,
  playerInfoFontSize: 11,
  
  // Reorder Buttons
  reorderButtonSize: 24,
  reorderIconSize: 12,
  
  // Remove Button
  removeButtonSize: 24,
  removeIconSize: 14,
  removeButtonMarginRight: 4,
  
  // ADP column (matched to PlayerList)
  adpWidth: 48,
  adpFontSize: 13,
  
  // Empty State
  emptyIconSize: 56,
  emptyTitleFontSize: 16,
  emptyDescFontSize: 14,
  emptyPadding: 24,
  
  // Footer
  footerPaddingX: 16,
  footerPaddingY: 8,
  footerFontSize: 12,
} as const;

const QUEUE_COLORS = {
  background: '#101927',
  cardBg: '#1f2833',
  cardBorder: 'rgba(255, 255, 255, 0.1)',
  textPrimary: '#ffffff',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  removeButton: '#ef4444',
  removeButtonHover: 'rgba(239, 68, 68, 0.2)',
  footerBorder: 'rgba(255, 255, 255, 0.1)',
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface QueueViewProps {
  /** Queued players */
  queue: QueuedPlayer[];
  /** Remove a player from queue */
  onRemove: (playerId: string) => void;
  /** Move player up in queue */
  onMoveUp?: (index: number) => void;
  /** Move player down in queue */
  onMoveDown?: (index: number) => void;
  /** Reorder queue (alternative to onMoveUp/onMoveDown) */
  onReorder?: (fromIndex: number, toIndex: number) => void;
  /** Clear entire queue */
  onClear: () => void;
  /** Switch to players tab to add more */
  onAddPlayers?: () => void;
  /** Initial scroll position to restore */
  initialScrollPosition?: number;
  /** Callback when scroll position changes */
  onScrollPositionChange?: (position: number) => void;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface PositionBadgeProps {
  position: Position;
}

function PositionBadge({ position }: PositionBadgeProps): React.ReactElement {
  const color = POSITION_COLORS[position] || QUEUE_COLORS.textSecondary;
  
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${QUEUE_PX.badgePaddingY}px ${QUEUE_PX.badgePaddingX}px`,
        borderRadius: QUEUE_PX.badgeBorderRadius,
        backgroundColor: color,
        color: '#000000',
        fontSize: QUEUE_PX.badgeFontSize,
        fontWeight: 700,
        marginRight: QUEUE_PX.badgeMarginRight,
      }}
    >
      {position}
    </span>
  );
}

interface IconButtonProps {
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  ariaLabel: string;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
  className?: string;
}

function IconButton({
  onClick,
  disabled = false,
  ariaLabel,
  children,
  variant = 'default',
}: IconButtonProps): React.ReactElement {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: QUEUE_PX.reorderButtonSize,
        height: QUEUE_PX.reorderButtonSize,
        background: 'transparent',
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        padding: 0,
        color: disabled
          ? 'rgba(156, 163, 175, 0.3)'
          : variant === 'danger'
            ? QUEUE_COLORS.removeButton
            : QUEUE_COLORS.textSecondary,
        opacity: disabled ? 0.3 : 1,
        transition: 'color 0.15s, background-color 0.15s',
        borderRadius: 4,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {children}
    </button>
  );
}

interface QueuedPlayerRowProps {
  player: QueuedPlayer;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: (e: React.MouseEvent) => void;
  onMoveDown: (e: React.MouseEvent) => void;
  onRemove: (e: React.MouseEvent) => void;
}

function QueuedPlayerRow({
  player,
  index,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
}: QueuedPlayerRowProps): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: QUEUE_COLORS.cardBg,
        borderBottom: `${QUEUE_PX.rowBorderWidth}px solid ${QUEUE_COLORS.cardBorder}`,
        height: QUEUE_PX.rowHeight,
        cursor: 'pointer',
        transition: 'background-color 0.15s',
        paddingLeft: 4,
        paddingRight: 4,
      }}
    >
      {/* Queue Number */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: QUEUE_PX.queueNumberWidth,
          fontWeight: 600,
          fontSize: QUEUE_PX.queueNumberFontSize,
          color: QUEUE_COLORS.textSecondary,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {index + 1}
      </div>
      
      {/* Player Info (badge + name/team inline like PlayerList) */}
      <div style={{ flex: 1, minWidth: 0, paddingLeft: 6 }}>
        <div
          style={{
            fontWeight: 500,
            fontSize: QUEUE_PX.playerNameFontSize,
            color: QUEUE_COLORS.textPrimary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {player.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <PositionBadge position={player.position} />
          <span style={{ fontSize: QUEUE_PX.playerInfoFontSize, color: QUEUE_COLORS.textSecondary }}>
            {player.team}
          </span>
        </div>
      </div>
      
      {/* ADP (matched to PlayerList layout) */}
      <div
        style={{
          width: QUEUE_PX.adpWidth,
          textAlign: 'center',
          fontSize: QUEUE_PX.adpFontSize,
          color: QUEUE_COLORS.textSecondary,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {player.adp ? parseFloat(String(player.adp)).toFixed(1) : '-'}
      </div>
      
      {/* Reorder Controls */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* Move Up */}
        <IconButton
          onClick={onMoveUp}
          disabled={isFirst}
          ariaLabel="Move up"
        >
          <svg width={QUEUE_PX.reorderIconSize} height={QUEUE_PX.reorderIconSize} viewBox="0 0 16 16" fill="none">
            <path d="M8 4L12 10H4L8 4Z" fill="currentColor" />
          </svg>
        </IconButton>
        
        {/* Move Down */}
        <IconButton
          onClick={onMoveDown}
          disabled={isLast}
          ariaLabel="Move down"
        >
          <svg width={QUEUE_PX.reorderIconSize} height={QUEUE_PX.reorderIconSize} viewBox="0 0 16 16" fill="none">
            <path d="M8 12L4 6H12L8 12Z" fill="currentColor" />
          </svg>
        </IconButton>
      </div>
      
      {/* Remove Button */}
      <div style={{ marginRight: QUEUE_PX.removeButtonMarginRight }}>
        <IconButton
          onClick={onRemove}
          ariaLabel="Remove from queue"
          variant="danger"
        >
          <svg width={QUEUE_PX.removeIconSize} height={QUEUE_PX.removeIconSize} viewBox="0 0 14 14" fill="none">
            <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </IconButton>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  onBrowse?: () => void;
}

function EmptyState({ onBrowse }: EmptyStateProps): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: QUEUE_PX.emptyPadding,
        height: '100%',
      }}
    >
      {/* Plus Icon */}
      <div
        style={{
          width: QUEUE_PX.emptyIconSize,
          height: QUEUE_PX.emptyIconSize,
          marginBottom: 16,
          color: QUEUE_COLORS.textMuted,
        }}
      >
        <svg width="100%" height="100%" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
      </div>
      
      {/* Title */}
      <h3
        style={{
          fontWeight: 600,
          fontSize: QUEUE_PX.emptyTitleFontSize,
          color: QUEUE_COLORS.textPrimary,
          marginBottom: 4,
        }}
      >
        No players queued
      </h3>
      
      {/* Description */}
      <p
        style={{
          fontSize: QUEUE_PX.emptyDescFontSize,
          color: QUEUE_COLORS.textSecondary,
          maxWidth: 280,
        }}
      >
        Tap the + button on players to add them to your queue
      </p>
      
      {/* Browse Button */}
      {onBrowse && (
        <button
          onClick={onBrowse}
          style={{
            marginTop: 16,
            padding: '8px 16px',
            backgroundColor: '#3B82F6',
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 500,
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Browse Players
        </button>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function QueueView({
  queue,
  onRemove,
  onMoveUp,
  onMoveDown,
  onReorder,
  onClear,
  onAddPlayers,
  initialScrollPosition = 0,
  onScrollPositionChange,
}: QueueViewProps): React.ReactElement {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Restore scroll position on mount
  useEffect(() => {
    if (scrollContainerRef.current && initialScrollPosition > 0) {
      scrollContainerRef.current.scrollTop = initialScrollPosition;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Save scroll position on scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (onScrollPositionChange) {
      onScrollPositionChange(e.currentTarget.scrollTop);
    }
  }, [onScrollPositionChange]);
  
  // Handle move up
  const handleMoveUp = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index === 0) return;
    
    if (onMoveUp) {
      onMoveUp(index);
    } else if (onReorder) {
      onReorder(index, index - 1);
    }
  }, [onMoveUp, onReorder]);
  
  // Handle move down
  const handleMoveDown = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index === queue.length - 1) return;
    
    if (onMoveDown) {
      onMoveDown(index);
    } else if (onReorder) {
      onReorder(index, index + 1);
    }
  }, [queue.length, onMoveDown, onReorder]);
  
  // Handle remove
  const handleRemove = useCallback((playerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(playerId);
  }, [onRemove]);
  
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: QUEUE_COLORS.background,
      }}
    >
      {/* Queue List */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {queue.length === 0 ? (
          <EmptyState onBrowse={onAddPlayers} />
        ) : (
          <div
            style={{
              marginLeft: QUEUE_PX.containerPaddingX,
              marginRight: QUEUE_PX.containerPaddingX,
              paddingTop: QUEUE_PX.containerPaddingY,
              paddingBottom: 24,
            }}
          >
            {queue.map((player, index) => (
              <QueuedPlayerRow
                key={player.id}
                player={player}
                index={index}
                isFirst={index === 0}
                isLast={index === queue.length - 1}
                onMoveUp={(e) => handleMoveUp(index, e)}
                onMoveDown={(e) => handleMoveDown(index, e)}
                onRemove={(e) => handleRemove(player.id, e)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Footer Hint */}
      {queue.length > 0 && (
        <div
          style={{
            paddingLeft: QUEUE_PX.footerPaddingX,
            paddingRight: QUEUE_PX.footerPaddingX,
            paddingTop: QUEUE_PX.footerPaddingY,
            paddingBottom: QUEUE_PX.footerPaddingY,
            borderTop: `1px solid ${QUEUE_COLORS.footerBorder}`,
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontSize: QUEUE_PX.footerFontSize,
              color: QUEUE_COLORS.textMuted,
            }}
          >
            Your top queued player will be auto-drafted when it&apos;s your turn
          </span>
        </div>
      )}
    </div>
  );
}
