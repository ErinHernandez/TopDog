/**
 * PlayerCard Component
 *
 * A reusable player list item component with consistent styling.
 * Can be used across Rankings, Draft Room, Queue, Roster, etc.
 *
 * Migrated to CSS Modules for CSP compliance.
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
import { cn } from '@/lib/styles';
import styles from './PlayerCard.module.css';
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
    const buttonStyle: React.CSSProperties = {
      '--action-size': `${px.actionSize}px`,
      '--action-radius': `${RADIUS.lg}px`,
      '--action-bg': action.isActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(96, 165, 250, 0.15)',
      '--action-color': action.isActive ? STATE_COLORS.error : STATE_COLORS.active,
    } as React.CSSProperties;

    return (
      <button
        onClick={action.onToggle}
        disabled={disabled}
        className={cn(styles.actionButton, disabled && styles.actionButtonDisabled)}
        style={buttonStyle}
        aria-label={action.isActive ? `Remove ${playerName}` : `Add ${playerName}`}
      >
        {action.isActive ? <Minus size={px.actionIconSize} /> : <Plus size={px.actionIconSize} />}
      </button>
    );
  }

  if (action.type === 'remove') {
    const buttonStyle: React.CSSProperties = {
      '--action-size': `${px.actionSize}px`,
      '--action-radius': `${RADIUS.lg}px`,
      '--action-bg': 'rgba(239, 68, 68, 0.15)',
      '--action-color': STATE_COLORS.error,
    } as React.CSSProperties;

    return (
      <button
        onClick={action.onRemove}
        disabled={disabled}
        className={cn(styles.actionButton, disabled && styles.actionButtonDisabled)}
        style={buttonStyle}
        aria-label={`Remove ${playerName}`}
      >
        <Minus size={px.actionIconSize} />
      </button>
    );
  }

  if (action.type === 'reorder') {
    const upStyle: React.CSSProperties = {
      '--action-size': `${px.actionSize}px`,
      '--reorder-height': `${px.actionSize / 2}px`,
      '--reorder-radius': `${RADIUS.sm}px`,
      '--reorder-bg': action.isFirst ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
      '--reorder-color': action.isFirst ? TEXT_COLORS.disabled : TEXT_COLORS.primary,
    } as React.CSSProperties;

    const downStyle: React.CSSProperties = {
      '--action-size': `${px.actionSize}px`,
      '--reorder-height': `${px.actionSize / 2}px`,
      '--reorder-radius': `${RADIUS.sm}px`,
      '--reorder-bg': action.isLast ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
      '--reorder-color': action.isLast ? TEXT_COLORS.disabled : TEXT_COLORS.primary,
    } as React.CSSProperties;

    return (
      <div className={styles.reorderWrapper}>
        <button
          onClick={action.onMoveUp}
          disabled={disabled || action.isFirst}
          className={cn(styles.reorderButton, (disabled || action.isFirst) && styles.reorderButtonDisabled)}
          style={upStyle}
          aria-label={`Move ${playerName} up`}
        >
          <ChevronUp size={14} />
        </button>
        <button
          onClick={action.onMoveDown}
          disabled={disabled || action.isLast}
          className={cn(styles.reorderButton, (disabled || action.isLast) && styles.reorderButtonDisabled)}
          style={downStyle}
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

  // CSS custom properties for dynamic values
  const containerStyle: React.CSSProperties = {
    '--card-bg': BG_COLORS.secondary,
    '--card-border-left': `${px.borderLeft}px solid ${posColor}`,
    '--card-radius': `${RADIUS.lg}px`,
    '--card-padding': `${px.paddingY}px ${px.paddingX}px`,
    '--card-gap': `${px.gap}px`,
    '--value-width': `${px.adpWidth}px`,
    '--text-primary': TEXT_COLORS.primary,
    '--text-secondary': TEXT_COLORS.secondary,
    '--text-muted': TEXT_COLORS.muted,
    '--font-size-sm': `${TYPOGRAPHY.fontSize.sm}px`,
    '--font-size-xs': `${TYPOGRAPHY.fontSize.xs}px`,
  } as React.CSSProperties;

  const Container = onClick ? 'button' : 'div';

  return (
    <Container
      onClick={onClick}
      disabled={disabled}
      className={cn(
        styles.container,
        onClick && styles.containerClickable,
        disabled && styles.containerDisabled,
        className
      )}
      style={containerStyle}
    >
      {/* ADP or Rank */}
      {(showAdp || showRank) && (
        <div className={styles.valueColumn}>
          <div className={styles.valueText}>
            {rankDisplay ?? adpDisplay}
          </div>
        </div>
      )}

      {/* Position Badge */}
      <PositionBadge position={player.position as Position} size="sm" />

      {/* Name & Team */}
      <div className={styles.nameTeamWrapper}>
        <span className={styles.playerName}>
          {player.name}
        </span>
        <span className={styles.playerTeam}>
          {player.team}
        </span>
      </div>

      {/* Projection */}
      {showProjection && player.proj !== undefined && (
        <div className={styles.projectionColumn}>
          <div className={styles.projectionValue}>
            {projDisplay}
          </div>
          <div className={styles.projectionLabel}>
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
