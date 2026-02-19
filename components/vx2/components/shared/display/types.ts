/**
 * Shared Types for Display Components
 * 
 * Common type definitions used across PlayerCard, PlayerCell, and related components.
 * 
 * @module components/vx2/components/shared/display/types
 */

/**
 * Fantasy football positions
 * 
 * @public
 */
export type Position = 'QB' | 'RB' | 'WR' | 'TE';

/**
 * All positions as a readonly array (for iteration)
 * 
 * @public
 */
export const POSITIONS: readonly Position[] = ['QB', 'RB', 'WR', 'TE'] as const;

/**
 * Basic player data for display components
 * 
 * This is a simplified player data structure optimized for UI display components.
 * It supports flexible types (string | number) for ADP and projections to handle
 * various data formats from different sources.
 * 
 * @public
 * 
 * @property name - Player's full display name
 * @property position - Player's position (QB, RB, WR, TE)
 * @property team - NFL team abbreviation
 * @property adp - Average draft position (optional, can be number or string)
 * @property proj - Projected fantasy points (optional, can be number or string)
 * @property rank - Custom ranking (optional)
 * 
 * @example
 * ```ts
 * const player: PlayerData = {
 *   name: 'Josh Allen',
 *   position: 'QB',
 *   team: 'BUF',
 *   adp: 12.5,
 *   proj: 350.2
 * };
 * ```
 * 
 * @see {@link ../draft-room/types.DraftPlayer} For full draft player data with more fields
 */
export interface PlayerData {
  /** Player's full display name */
  name: string;
  /** Player's position (QB, RB, WR, TE) */
  position: string;
  /** NFL team abbreviation */
  team: string;
  /** Average draft position (optional, can be number or string) */
  adp?: number | string;
  /** Projected fantasy points (optional, can be number or string) */
  proj?: number | string;
  /** Custom ranking (optional) */
  rank?: number;
}

