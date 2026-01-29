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
import { BG_COLORS, TEXT_COLORS, STATE_COLORS, POSITION_COLORS } from '../../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../../core/constants/sizes';
import { PositionBadge } from './PositionBadge';
import { Plus, Minus } from '../../icons';
import { cn } from '@/lib/styles';
import styles from './PlayerCell.module.css';
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

const CELL_PX = {
  paddingY: SPACING.xs,    // 4px
  paddingX: SPACING.md,    // 12px
  gap: SPACING.sm,         // 8px
  borderLeft: 4,
  valueWidth: 28,
  actionSize: 36,
  actionIconSize: 20,
  projMarginRight: 4,
} as const;

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
  const posColor = POSITION_COLORS[player.position.toUpperCase() as keyof typeof POSITION_COLORS] || TEXT_COLORS.muted;

  // Format display values
  const leftValue = displayValue !== undefined
    ? (displayType === 'adp' && typeof displayValue === 'number' ? displayValue.toFixed(1) : displayValue)
    : (typeof player.adp === 'number' ? player.adp.toFixed(1) : player.adp || '-');

  const projValue = typeof player.proj === 'number' ? Math.round(player.proj) : player.proj || '-';

  // CSS custom properties for dynamic values
  const containerStyle: React.CSSProperties = {
    '--cell-bg': BG_COLORS.secondary,
    '--cell-border-left': `${CELL_PX.borderLeft}px solid ${posColor}`,
    '--cell-radius': `${RADIUS.lg}px`,
    '--cell-padding': `${CELL_PX.paddingY}px ${CELL_PX.paddingX}px`,
    '--cell-gap': `${CELL_PX.gap}px`,
    '--value-width': `${CELL_PX.valueWidth}px`,
    '--proj-margin-right': `${CELL_PX.projMarginRight}px`,
    '--text-primary': TEXT_COLORS.primary,
    '--text-secondary': TEXT_COLORS.secondary,
    '--text-muted': TEXT_COLORS.muted,
    '--font-size-sm': `${TYPOGRAPHY.fontSize.sm}px`,
    '--font-size-xs': `${TYPOGRAPHY.fontSize.xs}px`,
  } as React.CSSProperties;

  const actionStyle: React.CSSProperties = {
    '--action-size': `${CELL_PX.actionSize}px`,
    '--action-radius': `${RADIUS.lg}px`,
    '--action-bg': isActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(96, 165, 250, 0.15)',
    '--action-color': isActive ? STATE_COLORS.error : STATE_COLORS.active,
  } as React.CSSProperties;

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
      style={containerStyle}
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
            className={cn(styles.actionButton, disabled && styles.actionButtonDisabled)}
            style={actionStyle}
            aria-label={isActive ? `Remove ${player.name}` : `Add ${player.name}`}
          >
            {isActive ? <Minus size={CELL_PX.actionIconSize} /> : <Plus size={CELL_PX.actionIconSize} />}
          </button>
        )
      )}
    </Container>
  );
}

export default PlayerCell;
