/**
 * PlayerDropdownRow - Pure Wrapper Component
 * 
 * This component is a PURE WRAPPER that adds click functionality to ANY existing player cell.
 * It makes ZERO assumptions about the content structure, styling, or layout.
 * It simply wraps whatever you pass as children and makes it clickable for dropdown expansion.
 * 
 * @example
 * ```tsx
 * <PlayerDropdownRow
 *   player={player}
 *   isExpanded={isExpanded}
 *   onClick={handleClick}
 * >
 *   <YourExistingPlayerCell player={player} />
 * </PlayerDropdownRow>
 * ```
 */

import React from 'react';
import type { PlayerBase } from '@/types/player';
import type { PlayerPoolEntry } from '../../../lib/playerPool';

// ============================================================================
// TYPES
// ============================================================================

export interface PlayerDropdownRowProps {
  /** Player object (PlayerPoolEntry or PlayerBase) */
  player: PlayerPoolEntry | PlayerBase | null;
  /** Whether the dropdown is expanded (default: false) */
  isExpanded?: boolean;
  /** Whether the player is selected (default: false) */
  isSelected?: boolean;
  /** Click handler */
  onClick?: (player: PlayerBase) => void;
  /** Any existing player cell content */
  children: React.ReactNode;
  /** Custom wrapper styles */
  customWrapperStyles?: React.CSSProperties;
  /** Additional CSS classes for wrapper */
  wrapperClassName?: string;
  /** Whether dropdown is enabled (default: true) */
  enableDropdown?: boolean;
  /** Pixels below the row to position dropdown (default: 0) */
  dropdownOffset?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

const PlayerDropdownRow: React.FC<PlayerDropdownRowProps> = ({
  player,
  isExpanded = false,
  isSelected = false,
  onClick,
  children,
  customWrapperStyles = {},
  wrapperClassName = '',
  enableDropdown = true,
  dropdownOffset = 0,
}): React.ReactElement => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (!enableDropdown || !player) return;
    
    // Don't interfere with any existing click handlers in the children
    e.stopPropagation();
    // Convert to PlayerBase format (PlayerPoolEntry may not have id)
    const playerId = ('id' in player && typeof player.id === 'string' ? player.id : null) 
      || ('databaseId' in player && typeof player.databaseId === 'string' ? player.databaseId : null) 
      || player.name;
    const playerBase: PlayerBase = {
      id: playerId,
      name: player.name,
      position: player.position as PlayerBase['position'],
      team: player.team,
    };
    onClick?.(playerBase);
  };

  return (
    <div 
      className={`w-full relative ${wrapperClassName}`} 
      style={customWrapperStyles}
      data-player-name={player?.name || 'unknown'}
      data-dropdown-enabled={enableDropdown}
      data-dropdown-expanded={isExpanded}
    >
      {/* 
        PURE WRAPPER: This div adds click functionality without modifying content.
        
        The children can be:
        - Current draft room player row
        - A completely different player card design
        - A simple text list
        - A complex component with images, stats, buttons
        - ANYTHING - we don't care and don't modify it
      */}
      <div 
        onClick={handleClick}
        style={{
          cursor: enableDropdown ? 'pointer' : 'default',
          position: 'relative',
          width: '100%',
          // We add minimal styling - just enough to make it clickable
          // All visual styling comes from the children
        }}
        role={enableDropdown ? 'button' : undefined}
        tabIndex={enableDropdown ? 0 : undefined}
        onKeyDown={enableDropdown ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (player) {
              // Convert to PlayerBase format
              const playerId = ('id' in player && typeof player.id === 'string' ? player.id : null) 
                || ('databaseId' in player && typeof player.databaseId === 'string' ? player.databaseId : null) 
                || player.name;
              const playerBase: PlayerBase = {
                id: playerId,
                name: player.name,
                position: player.position as PlayerBase['position'],
                team: player.team,
              };
              onClick?.(playerBase);
            }
          }
        } : undefined}
        aria-expanded={isExpanded}
        aria-label={player ? `Expand ${player.name} details` : 'Player row'}
      >
        {/* 
          CRITICAL: This is the existing player cell content.
          We render it exactly as-is, with no modifications.
        */}
        {children}
      </div>
    </div>
  );
};

export default PlayerDropdownRow;
