/**
 * PlayerCell Component
 *
 * The standard player list item template used across the app.
 * Displays: ADP/Rank | Position Badge | Name Team | Projection | Action Button
 *
 * Migrated to CSS Modules for CSP compliance.
 *
 * @example
 * // Basic display only
 * <PlayerCell player={player} />
 *
 * @example
 * // With add/remove toggle
 * <PlayerCell
 *   player={player}
 *   showAction={true}
 *   isActive={isSelected}
 *   onAction={() => handleToggle(player)}
 * />
 *
 * @example
 * // With rank instead of ADP
 * <PlayerCell
 *   player={player}
 *   displayValue={1}
 *   displayType="rank"
 * />
 */

import React from 'react';

import { cn } from '@/lib/styles';

import { Plus, Minus } from '../../icons';

import styles from './PlayerCell.module.css';
import { PositionBadge } from './PositionBadge';
import type { Position, PlayerData } from './types';

// ============================================================================
// TYPES
// ============================================================================

// Re-export shared types for convenience
export type { Position, PlayerData };

export interface PlayerCellProps {
  /** Player data to display */
  player: PlayerData;
  /** Override the left value display (rank number, custom value, etc.) */
  displayValue?: number | string;
  /** Type of display value: 'adp' shows decimal, 'rank' shows integer */
  displayType?: 'adp' | 'rank';
  /** Show the projection column (default: true) */
  showProjection?: boolean;
  /** Show the action button (default: false) */
  showAction?: boolean;
  /** Is the action in active state (for toggle: true = remove, false = add) */
  isActive?: boolean;
  /** Action button click handler */
  onAction?: () => void;
  /** Custom action button render */
  renderAction?: () => React.ReactNode;
  /** Whether the cell is disabled */
  disabled?: boolean;
  /** Optional click handler for entire cell */
  onClick?: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ACTION_ICON_SIZE = 20;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PlayerCell({
  player,
  displayValue,
  displayType = 'adp',
  showProjection = true,
  showAction = false,
  isActive = false,
  onAction,
  renderAction,
  disabled = false,
  onClick,
}: PlayerCellProps): React.ReactElement {
  // Format display values
  const leftValue = displayValue !== undefined
    ? (displayType === 'adp' && typeof displayValue === 'number' ? displayValue.toFixed(1) : displayValue)
    : (typeof player.adp === 'number' ? player.adp.toFixed(1) : player.adp || '-');

  const projValue = typeof player.proj === 'number' ? Math.round(player.proj) : player.proj || '-';

  // Position for data attribute (used by CSS for border color)
  const positionLower = player.position.toLowerCase();

  const Container = onClick ? 'button' : 'div';

  return (
    <Container
      onClick={onClick}
      disabled={disabled}
      className={cn(
        styles.container,
        onClick && styles.containerClickable,
        disabled && styles.containerDisabled
      )}
      data-position={positionLower}
    >
      {/* ADP / Rank Value */}
      <div className={styles.valueColumn}>
        <div className={styles.valueText}>
          {leftValue}
        </div>
      </div>

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
            {projValue}
          </div>
          <div className={styles.projectionLabel}>
            Proj
          </div>
        </div>
      )}

      {/* Action Button */}
      {showAction && (
        renderAction ? renderAction() : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction?.();
            }}
            disabled={disabled}
            className={styles.actionButton}
            data-action={isActive ? 'remove' : 'add'}
            data-disabled={disabled}
            aria-label={isActive ? `Remove ${player.name}` : `Add ${player.name}`}
          >
            {isActive ? <Minus size={ACTION_ICON_SIZE} /> : <Plus size={ACTION_ICON_SIZE} />}
          </button>
        )
      )}
    </Container>
  );
}

export default PlayerCell;
