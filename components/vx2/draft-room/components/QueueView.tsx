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

import { cn } from '@/lib/styles';

import type { QueuedPlayer, Position } from '../types';

import styles from './QueueView.module.css';

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

// Queue colors come from global tokens (--queue-bg, --card-bg, --text-primary, etc.)
// and DRAFT_LIST_THEME in core/constants/colors.ts.

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

const PositionBadge = React.memo(function PositionBadge({ position }: PositionBadgeProps): React.ReactElement {
  return (
    <span
      className={styles.positionBadge}
      data-position={position.toLowerCase()}
    >
      {position}
    </span>
  );
});

interface IconButtonProps {
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  ariaLabel: string;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
  className?: string;
}

const IconButton = React.memo(function IconButton({
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
      className={cn(styles.iconButton, {
        [styles.danger as string]: variant === 'danger',
      })}
    >
      {children}
    </button>
  );
});

interface QueuedPlayerRowProps {
  player: QueuedPlayer;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: (e: React.MouseEvent) => void;
  onMoveDown: (e: React.MouseEvent) => void;
  onRemove: (e: React.MouseEvent) => void;
}

const QueuedPlayerRow = React.memo(function QueuedPlayerRow({
  player,
  index,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
}: QueuedPlayerRowProps): React.ReactElement {
  return (
    <div className={styles.queueRow}>
      {/* Queue Number */}
      <div className={styles.queueNumber}>
        {index + 1}
      </div>

      {/* Player Info (badge + name/team inline like PlayerList) */}
      <div className={styles.playerInfo}>
        <div className={styles.playerName}>
          {player.name}
        </div>
        <div className={styles.playerDetails}>
          <PositionBadge position={player.position} />
          <span className={styles.playerTeam}>
            {player.team}
          </span>
        </div>
      </div>

      {/* ADP (matched to PlayerList layout) */}
      <div className={styles.adpColumn}>
        {player.adp ? parseFloat(String(player.adp)).toFixed(1) : '-'}
      </div>

      {/* Reorder Controls */}
      <div className={styles.reorderControls}>
        {/* Move Up */}
        <IconButton
          onClick={onMoveUp}
          disabled={isFirst}
          ariaLabel="Move up"
        >
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M8 4L12 10H4L8 4Z" fill="currentColor" />
          </svg>
        </IconButton>

        {/* Move Down */}
        <IconButton
          onClick={onMoveDown}
          disabled={isLast}
          ariaLabel="Move down"
        >
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M8 12L4 6H12L8 12Z" fill="currentColor" />
          </svg>
        </IconButton>
      </div>

      {/* Remove Button */}
      <div className={styles.removeButtonWrapper}>
        <IconButton
          onClick={onRemove}
          ariaLabel="Remove from queue"
          variant="danger"
        >
          <svg className={styles.removeIcon} viewBox="0 0 14 14" fill="none">
            <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </IconButton>
      </div>
    </div>
  );
});

interface EmptyStateProps {
  onBrowse?: () => void;
}

const EmptyState = React.memo(function EmptyState({ onBrowse }: EmptyStateProps): React.ReactElement {
  return (
    <div className={styles.emptyState}>
      {/* Plus Icon */}
      <div className={styles.emptyIcon}>
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
      </div>

      {/* Title */}
      <h3 className={styles.emptyTitle}>
        No players queued
      </h3>

      {/* Description */}
      <p className={styles.emptyDescription}>
        Tap the + button on players to add them to your queue
      </p>

      {/* Browse Button */}
      {onBrowse && (
        <button
          onClick={onBrowse}
          className={styles.browseButton}
        >
          Browse Players
        </button>
      )}
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const QueueView = React.memo(function QueueView({
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
    <div className={styles.container}>
      {/* Queue List */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={styles.scrollContainer}
      >
        {queue.length === 0 ? (
          <EmptyState onBrowse={onAddPlayers} />
        ) : (
          <div className={styles.itemsWrapper}>
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
        <div className={styles.footer}>
          <span className={styles.footerText}>
            Your top queued player will be auto-drafted when it&apos;s your turn, unless you have reached the maximum players for that position (or your custom position limit)
          </span>
        </div>
      )}
    </div>
  );
});

export default QueueView;
