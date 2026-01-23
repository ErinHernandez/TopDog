/**
 * PlayerCell Component
 * 
 * The standard player list item template used across the app.
 * Displays: ADP/Rank | Position Badge | Name Team | Projection | Action Button
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
import { BG_COLORS, TEXT_COLORS, STATE_COLORS, POSITION_COLORS } from '../../vx2/core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../vx2/core/constants/sizes';
import { PositionBadge } from './PositionBadge';
import { Plus, Minus } from '../../vx2/components/icons';
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

  const Container = onClick ? 'button' : 'div';

  return (
    <Container
      onClick={onClick}
      disabled={disabled}
      className="flex items-center transition-all"
      style={{ 
        backgroundColor: BG_COLORS.secondary,
        borderLeft: `${CELL_PX.borderLeft}px solid ${posColor}`,
        borderRadius: `${RADIUS.lg}px`,
        padding: `${CELL_PX.paddingY}px ${CELL_PX.paddingX}px`,
        gap: `${CELL_PX.gap}px`,
        width: '100%',
        border: onClick ? 'none' : undefined,
        textAlign: 'left',
        cursor: onClick ? 'pointer' : 'default',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {/* ADP / Rank Value */}
      <div className="text-center flex-shrink-0" style={{ width: `${CELL_PX.valueWidth}px` }}>
        <div 
          className="font-bold" 
          style={{ 
            color: TEXT_COLORS.secondary, 
            fontSize: `${TYPOGRAPHY.fontSize.sm}px` 
          }}
        >
          {leftValue}
        </div>
      </div>

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
        <div 
          className="text-center flex-shrink-0" 
          style={{ marginRight: `${CELL_PX.projMarginRight}px` }}
        >
          <div 
            className="font-semibold" 
            style={{ 
              color: TEXT_COLORS.primary, 
              fontSize: `${TYPOGRAPHY.fontSize.xs}px` 
            }}
          >
            {projValue}
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
      {showAction && (
        renderAction ? renderAction() : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction?.();
            }}
            disabled={disabled}
            className="flex items-center justify-center transition-all flex-shrink-0"
            style={{ 
              width: `${CELL_PX.actionSize}px`,
              height: `${CELL_PX.actionSize}px`,
              borderRadius: `${RADIUS.lg}px`,
              backgroundColor: isActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(96, 165, 250, 0.15)', 
              color: isActive ? STATE_COLORS.error : STATE_COLORS.active,
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
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

