/**
 * PlayerDropdownRow - Pure Wrapper Component
 * 
 * This component is a PURE WRAPPER that adds click functionality to ANY existing player cell.
 * It makes ZERO assumptions about the content structure, styling, or layout.
 * It simply wraps whatever you pass as children and makes it clickable for dropdown expansion.
 */

import React, { ReactNode } from 'react';
import type { JSX } from 'react';
import type { PlayerPoolEntry } from '../../../lib/playerPool';

// ============================================================================
// TYPES
// ============================================================================

export interface PlayerDropdownRowProps {
  player: PlayerPoolEntry;
  isExpanded?: boolean;
  isSelected?: boolean;
  onClick?: (player: PlayerPoolEntry) => void;
  children: ReactNode; // ANY existing player cell content - we don't care what it looks like
  customWrapperStyles?: React.CSSProperties;
  wrapperClassName?: string;
  // Dropdown positioning options
  enableDropdown?: boolean;
  dropdownOffset?: number; // Pixels below the row to position dropdown
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function PlayerDropdownRow({
  player,
  isExpanded = false,
  isSelected = false,
  onClick = () => {},
  children, // ANY existing player cell content - we don't care what it looks like
  customWrapperStyles = {},
  wrapperClassName = '',
  // Dropdown positioning options
  enableDropdown = true,
  dropdownOffset = 0, // Pixels below the row to position dropdown
}: PlayerDropdownRowProps): JSX.Element {

  const handleClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (!enableDropdown) return;
    
    // Don't interfere with any existing click handlers in the children
    e.stopPropagation();
    onClick(player);
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
      >
        {/* 
          CRITICAL: This is the existing player cell content.
          We render it exactly as-is, with no modifications.
          
          Examples of what children might contain:
          
          1. Draft room format:
             - Justin Jefferson / WR / MIN (6) / 174 / 3.1
          
          2. Different format:
             - [Player Photo] J. Jefferson - WR - Minnesota Vikings
          
          3. Simple format:
             - Jefferson, Justin (WR)
          
          4. Complex format:
             - Full player card with stats, images, buttons, etc.
          
          We don't care - we just render it and make it clickable.
        */}
        {children}
      </div>
      
    </div>
  );
}
