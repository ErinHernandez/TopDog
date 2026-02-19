/**
 * PlayerCard Component
 * 
 * A reusable player list item component with consistent styling.
 * Can be used across Rankings, Draft Room, Queue, Roster, etc.
 * 
 * @example
 * // Basic usage
 * <PlayerCard player={player} />
 * 
 * @example
 * // With add/remove action
 * <PlayerCard 
 *   player={player} 
 *   action={{ type: 'toggle', isActive: true, onToggle: handleToggle }}
 * />
 * 
 * @example
 * // With reorder arrows
 * <PlayerCard 
 *   player={player}
 *   showRank={true}
 *   rank={1}
 *   action={{ type: 'reorder', onMoveUp: handleUp, onMoveDown: handleDown }}
 * />
 */

import React from 'react';

import { cn } from '@/lib/styles';

import { Plus, Minus, ChevronUp, ChevronDown } from '../../vx2/components/icons';

import styles from './PlayerCard.module.css';
import { PositionBadge } from './PositionBadge';
import type { Position, PlayerData } from './types';

// ============================================================================
// TYPES
// ============================================================================

// Re-export shared types for convenience
export type { Position, PlayerData };

export type ActionType =
  | { type: 'toggle'; isActive: boolean; onToggle: () => void }
  | { type: 'reorder'; onMoveUp?: () => void; onMoveDown?: () => void; isFirst?: boolean; isLast?: boolean }
  | { type: 'remove'; onRemove: () => void }
  | { type: 'custom'; render: () => React.ReactNode }
  | { type: 'none' };

export interface PlayerCardProps {
  /** Player data to display */
  player: PlayerData;
  /** Show ADP value (default: true) */
  showAdp?: boolean;
  /** Show projection value (default: true) */
  showProjection?: boolean;
  /** Show rank number instead of ADP */
  showRank?: boolean;
  /** Rank number to display (when showRank is true) */
  rank?: number;
  /** Action button configuration */
  action?: ActionType;
  /** Card size variant */
  size?: 'sm' | 'md';
  /** Optional click handler for the entire card */
  onClick?: () => void;
  /** Whether the card is disabled */
  disabled?: boolean;
  /** Custom className */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ICON_SIZES = {
  sm: 18,
  md: 20,
} as const;

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ActionButtonProps {
  action: ActionType;
  playerName: string;
  size: 'sm' | 'md';
  disabled?: boolean;
}

function ActionButton({ action, playerName, size, disabled }: ActionButtonProps): React.ReactElement | null {
  const iconSize = ICON_SIZES[size];

  if (action.type === 'none') return null;

  if (action.type === 'custom') {
    return <>{action.render()}</>;
  }

  if (action.type === 'toggle') {
    return (
      <button
        onClick={action.onToggle}
        disabled={disabled}
        className={styles.actionButton}
        data-size={size}
        data-action={action.isActive ? 'remove' : 'add'}
        data-disabled={disabled}
        aria-label={action.isActive ? `Remove ${playerName}` : `Add ${playerName}`}
      >
        {action.isActive ? <Minus size={iconSize} /> : <Plus size={iconSize} />}
      </button>
    );
  }

  if (action.type === 'remove') {
    return (
      <button
        onClick={action.onRemove}
        disabled={disabled}
        className={styles.actionButton}
        data-size={size}
        data-action="remove"
        data-disabled={disabled}
        aria-label={`Remove ${playerName}`}
      >
        <Minus size={iconSize} />
      </button>
    );
  }

  if (action.type === 'reorder') {
    return (
      <div className={styles.reorderContainer}>
        <button
          onClick={action.onMoveUp}
          disabled={disabled || action.isFirst}
          className={styles.reorderButton}
          data-size={size}
          data-disabled={disabled || action.isFirst}
          aria-label={`Move ${playerName} up`}
        >
          <ChevronUp size={14} />
        </button>
        <button
          onClick={action.onMoveDown}
          disabled={disabled || action.isLast}
          className={styles.reorderButton}
          data-size={size}
          data-disabled={disabled || action.isLast}
          aria-label={`Move ${playerName} down`}
        >
          <ChevronDown size={14} />
        </button>
      </div>
    );
  }

  return null;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PlayerCard({
  player,
  showAdp = true,
  showProjection = true,
  showRank = false,
  rank,
  action = { type: 'none' },
  size = 'sm',
  onClick,
  disabled = false,
  className = '',
}: PlayerCardProps): React.ReactElement {
  // Position for data attribute (used by CSS for border color via utilities.css)
  const positionLower = player.position.toLowerCase();

  // Format values
  const adpDisplay = typeof player.adp === 'number' ? player.adp.toFixed(1) : player.adp || '-';
  const projDisplay = typeof player.proj === 'number' ? Math.round(player.proj) : player.proj || '-';
  const rankDisplay = showRank && rank ? rank : null;

  const Container = onClick ? 'button' : 'div';

  return (
    <Container
      onClick={onClick}
      disabled={disabled}
      className={cn(styles.card, className)}
      data-position={positionLower}
      data-size={size}
      data-disabled={disabled}
      data-clickable={!!onClick}
    >
      {/* ADP or Rank */}
      {(showAdp || showRank) && (
        <div className={styles.adpColumn} data-size={size}>
          <div className={styles.adpValue}>
            {rankDisplay ?? adpDisplay}
          </div>
        </div>
      )}

      {/* Position Badge */}
      <PositionBadge position={player.position as Position} size="sm" />

      {/* Name & Team */}
      <div className={styles.playerInfo}>
        <span className={styles.playerName}>
          {player.name}
        </span>
        <span className={styles.playerTeam}>
          {player.team}
        </span>
      </div>

      {/* Projection */}
      {showProjection && player.proj !== undefined && (
        <div className={styles.projColumn}>
          <div className={styles.projValue}>
            {projDisplay}
          </div>
          <div className={styles.projLabel}>
            Proj
          </div>
        </div>
      )}

      {/* Action Button */}
      <ActionButton
        action={action}
        playerName={player.name}
        size={size}
        disabled={disabled}
      />
    </Container>
  );
}

export default PlayerCard;

