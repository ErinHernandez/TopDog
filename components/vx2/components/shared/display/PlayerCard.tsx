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
import { BG_COLORS, TEXT_COLORS, STATE_COLORS, POSITION_COLORS } from '../../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../../core/constants/sizes';
import { PositionBadge } from './PositionBadge';
import { Plus, Minus, ChevronUp, ChevronDown } from '../../icons';
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

const CARD_PX = {
  sm: {
    paddingY: SPACING.xs,
    paddingX: SPACING.md,
    gap: SPACING.sm,
    borderLeft: 4,
    adpWidth: 28,
    actionSize: 32,
    actionIconSize: 18,
  },
  md: {
    paddingY: SPACING.sm,
    paddingX: SPACING.md,
    gap: SPACING.sm,
    borderLeft: 4,
    adpWidth: 32,
    actionSize: 36,
    actionIconSize: 20,
  },
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
  const px = CARD_PX[size];
  
  if (action.type === 'none') return null;
  
  if (action.type === 'custom') {
    return <>{action.render()}</>;
  }
  
  if (action.type === 'toggle') {
    return (
      <button
        onClick={action.onToggle}
        disabled={disabled}
        className="flex items-center justify-center transition-all flex-shrink-0"
        style={{ 
          width: `${px.actionSize}px`,
          height: `${px.actionSize}px`,
          borderRadius: `${RADIUS.lg}px`,
          backgroundColor: action.isActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(96, 165, 250, 0.15)', 
          color: action.isActive ? STATE_COLORS.error : STATE_COLORS.active,
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
        aria-label={action.isActive ? `Remove ${playerName}` : `Add ${playerName}`}
      >
        {action.isActive ? <Minus size={px.actionIconSize} /> : <Plus size={px.actionIconSize} />}
      </button>
    );
  }
  
  if (action.type === 'remove') {
    return (
      <button
        onClick={action.onRemove}
        disabled={disabled}
        className="flex items-center justify-center transition-all flex-shrink-0"
        style={{ 
          width: `${px.actionSize}px`,
          height: `${px.actionSize}px`,
          borderRadius: `${RADIUS.lg}px`,
          backgroundColor: 'rgba(239, 68, 68, 0.15)', 
          color: STATE_COLORS.error,
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
        aria-label={`Remove ${playerName}`}
      >
        <Minus size={px.actionIconSize} />
      </button>
    );
  }
  
  if (action.type === 'reorder') {
    return (
      <div className="flex flex-col gap-0.5 flex-shrink-0">
        <button
          onClick={action.onMoveUp}
          disabled={disabled || action.isFirst}
          className="flex items-center justify-center transition-all"
          style={{ 
            width: `${px.actionSize}px`,
            height: `${px.actionSize / 2}px`,
            borderRadius: `${RADIUS.sm}px`,
            backgroundColor: action.isFirst ? 'transparent' : 'rgba(255, 255, 255, 0.1)', 
            color: action.isFirst ? TEXT_COLORS.disabled : TEXT_COLORS.primary,
            border: 'none',
            cursor: (disabled || action.isFirst) ? 'not-allowed' : 'pointer',
            opacity: action.isFirst ? 0.3 : 1,
          }}
          aria-label={`Move ${playerName} up`}
        >
          <ChevronUp size={14} />
        </button>
        <button
          onClick={action.onMoveDown}
          disabled={disabled || action.isLast}
          className="flex items-center justify-center transition-all"
          style={{ 
            width: `${px.actionSize}px`,
            height: `${px.actionSize / 2}px`,
            borderRadius: `${RADIUS.sm}px`,
            backgroundColor: action.isLast ? 'transparent' : 'rgba(255, 255, 255, 0.1)', 
            color: action.isLast ? TEXT_COLORS.disabled : TEXT_COLORS.primary,
            border: 'none',
            cursor: (disabled || action.isLast) ? 'not-allowed' : 'pointer',
            opacity: action.isLast ? 0.3 : 1,
          }}
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
  const px = CARD_PX[size];
  const posColor = POSITION_COLORS[player.position.toUpperCase() as keyof typeof POSITION_COLORS] || TEXT_COLORS.muted;
  
  // Format values
  const adpDisplay = typeof player.adp === 'number' ? player.adp.toFixed(1) : player.adp || '-';
  const projDisplay = typeof player.proj === 'number' ? Math.round(player.proj) : player.proj || '-';
  const rankDisplay = showRank && rank ? rank : null;
  
  const Container = onClick ? 'button' : 'div';
  
  return (
    <Container
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center transition-all ${className}`}
      style={{ 
        backgroundColor: BG_COLORS.secondary,
        borderLeft: `${px.borderLeft}px solid ${posColor}`,
        borderRadius: `${RADIUS.lg}px`,
        padding: `${px.paddingY}px ${px.paddingX}px`,
        gap: `${px.gap}px`,
        cursor: onClick ? 'pointer' : 'default',
        opacity: disabled ? 0.5 : 1,
        width: '100%',
        border: onClick ? 'none' : undefined,
        textAlign: 'left',
      }}
    >
      {/* ADP or Rank */}
      {(showAdp || showRank) && (
        <div className="text-center flex-shrink-0" style={{ width: `${px.adpWidth}px` }}>
          <div 
            className="font-bold" 
            style={{ 
              color: TEXT_COLORS.secondary, 
              fontSize: `${TYPOGRAPHY.fontSize.sm}px` 
            }}
          >
            {rankDisplay ?? adpDisplay}
          </div>
        </div>
      )}
      
      {/* Position Badge */}
      <PositionBadge position={player.position as Position} size="sm" />
      
      {/* Name & Team */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        <span 
          className="font-semibold truncate" 
          style={{ 
            color: TEXT_COLORS.primary, 
            fontSize: `${TYPOGRAPHY.fontSize.sm}px` 
          }}
        >
          {player.name}
        </span>
        <span 
          className="flex-shrink-0" 
          style={{ 
            color: TEXT_COLORS.muted, 
            fontSize: `${TYPOGRAPHY.fontSize.xs}px` 
          }}
        >
          {player.team}
        </span>
      </div>
      
      {/* Projection */}
      {showProjection && player.proj !== undefined && (
        <div className="text-center flex-shrink-0">
          <div 
            className="font-semibold" 
            style={{ 
              color: TEXT_COLORS.primary, 
              fontSize: `${TYPOGRAPHY.fontSize.xs}px` 
            }}
          >
            {projDisplay}
          </div>
          <div 
            style={{ 
              color: TEXT_COLORS.muted, 
              fontSize: `${TYPOGRAPHY.fontSize.xs}px` 
            }}
          >
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

