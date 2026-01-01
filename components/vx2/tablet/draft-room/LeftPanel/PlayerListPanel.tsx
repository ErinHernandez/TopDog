/**
 * PlayerListPanel - Left Panel Content
 * 
 * Available players list optimized for tablet.
 * Includes search, filters, and player rows.
 */

import React, { useState, useCallback, type ReactElement } from 'react';
import { BG_COLORS, TEXT_COLORS, POSITION_COLORS } from '../../../core/constants/colors';
import { TABLET_DRAFT, TABLET_SPACING, TABLET_TYPOGRAPHY } from '../../../core/constants/tablet';
import type { Position } from '../../../draft-room/types';

// ============================================================================
// TYPES
// ============================================================================

interface DraftPlayer {
  id: string;
  name: string;
  team: string;
  position: Position;
  adp?: number;
  projectedPoints?: number;
  byeWeek?: number;
}

export interface PlayerListPanelProps {
  /** Available players */
  players: DraftPlayer[];
  /** Whether it's user's turn */
  isMyTurn: boolean;
  /** Draft a player */
  onDraft: (player: DraftPlayer) => void;
  /** Toggle player in queue */
  onToggleQueue: (player: DraftPlayer) => void;
  /** Check if player is queued */
  isQueued: (playerId: string) => boolean;
  /** Position filter state */
  positionFilters: Position[];
  /** Toggle position filter */
  onToggleFilter: (position: Position) => void;
  /** Search query */
  searchQuery: string;
  /** Update search */
  onSearchChange: (query: string) => void;
  /** Clear all filters */
  onClearAll: () => void;
  /** Player click handler (show expanded card) */
  onPlayerClick?: (player: DraftPlayer) => void;
}

// ============================================================================
// POSITION FILTERS
// ============================================================================

const POSITIONS: Position[] = ['QB', 'RB', 'WR', 'TE'];

interface FilterButtonProps {
  position: Position;
  isActive: boolean;
  onToggle: () => void;
}

function FilterButton({ position, isActive, onToggle }: FilterButtonProps): ReactElement {
  const color = POSITION_COLORS[position];
  
  return (
    <button
      onClick={onToggle}
      style={{
        flex: 1,
        height: TABLET_DRAFT.filterButtonHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
        border: 'none',
        borderBottom: `2px solid ${color}`,
        color: isActive ? color : TEXT_COLORS.muted,
        fontSize: TABLET_TYPOGRAPHY.fontSize.sm,
        fontWeight: 600,
        cursor: 'pointer',
        opacity: isActive ? 1 : 0.5,
        transition: 'all 150ms ease',
      }}
      aria-pressed={isActive}
    >
      {position}
    </button>
  );
}

// ============================================================================
// SEARCH BAR
// ============================================================================

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

function SearchBar({ value, onChange, onClear }: SearchBarProps): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: `${TABLET_SPACING.sm}px ${TABLET_SPACING.md}px`,
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          height: TABLET_DRAFT.searchBarHeight,
          backgroundColor: BG_COLORS.secondary,
          borderRadius: 8,
          paddingLeft: 12,
          paddingRight: 12,
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6B7280"
          strokeWidth="2"
          style={{ marginRight: 8, flexShrink: 0 }}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search players..."
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            color: TEXT_COLORS.primary,
            fontSize: TABLET_TYPOGRAPHY.fontSize.base,
            outline: 'none',
          }}
        />
      </div>
      
      <button
        onClick={onClear}
        style={{
          height: TABLET_DRAFT.searchBarHeight,
          paddingLeft: 16,
          paddingRight: 16,
          backgroundColor: BG_COLORS.secondary,
          border: 'none',
          borderRadius: 8,
          color: TEXT_COLORS.primary,
          fontSize: TABLET_TYPOGRAPHY.fontSize.sm,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        Clear
      </button>
    </div>
  );
}

// ============================================================================
// PLAYER ROW
// ============================================================================

interface PlayerRowProps {
  player: DraftPlayer;
  isQueued: boolean;
  onToggleQueue: () => void;
  onClick: () => void;
}

function PlayerRow({ player, isQueued, onToggleQueue, onClick }: PlayerRowProps): ReactElement {
  const positionColor = POSITION_COLORS[player.position];
  
  return (
    <div
      onClick={onClick}
      style={{
        height: TABLET_DRAFT.playerRowHeight,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: TABLET_SPACING.md,
        paddingRight: TABLET_SPACING.sm,
        backgroundColor: BG_COLORS.card,
        borderBottom: `1px solid rgba(255,255,255,0.05)`,
        cursor: 'pointer',
      }}
    >
      {/* ADP */}
      <div
        style={{
          width: 48,
          fontSize: TABLET_TYPOGRAPHY.fontSize.sm,
          color: TEXT_COLORS.secondary,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {player.adp?.toFixed(1) || '-'}
      </div>
      
      {/* Player Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: TABLET_TYPOGRAPHY.fontSize.base,
            fontWeight: 500,
            color: TEXT_COLORS.primary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {player.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1px 6px',
              borderRadius: 3,
              backgroundColor: positionColor,
              color: '#000',
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            {player.position}
          </span>
          <span style={{ fontSize: TABLET_TYPOGRAPHY.fontSize.xs, color: TEXT_COLORS.secondary }}>
            {player.team}
          </span>
        </div>
      </div>
      
      {/* Queue Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleQueue();
        }}
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          border: `2px solid ${isQueued ? '#60A5FA' : '#6B7280'}`,
          backgroundColor: isQueued ? 'rgba(96,165,250,0.2)' : 'transparent',
          cursor: 'pointer',
          marginRight: 8,
        }}
        aria-label={isQueued ? 'Remove from queue' : 'Add to queue'}
      >
        <svg width="12" height="12" viewBox="0 0 12 12">
          {isQueued ? (
            <rect x="1" y="5" width="10" height="2" rx="1" fill="#fff" />
          ) : (
            <>
              <rect x="5" y="1" width="2" height="10" rx="1" fill="#fff" />
              <rect x="1" y="5" width="10" height="2" rx="1" fill="#fff" />
            </>
          )}
        </svg>
      </button>
      
      {/* Projected Points */}
      <div
        style={{
          width: 48,
          textAlign: 'right',
          fontSize: TABLET_TYPOGRAPHY.fontSize.sm,
          color: TEXT_COLORS.secondary,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {player.projectedPoints ? Math.round(player.projectedPoints) : '-'}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PlayerListPanel({
  players,
  isMyTurn,
  onDraft,
  onToggleQueue,
  isQueued,
  positionFilters,
  onToggleFilter,
  searchQuery,
  onSearchChange,
  onClearAll,
  onPlayerClick,
}: PlayerListPanelProps): ReactElement {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Position Filters */}
      <div
        style={{
          display: 'flex',
          backgroundColor: 'rgba(255,255,255,0.03)',
          flexShrink: 0,
        }}
      >
        {POSITIONS.map((position) => (
          <FilterButton
            key={position}
            position={position}
            isActive={positionFilters.includes(position)}
            onToggle={() => onToggleFilter(position)}
          />
        ))}
      </div>
      
      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChange={onSearchChange}
        onClear={onClearAll}
      />
      
      {/* Column Headers */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 36,
          paddingLeft: TABLET_SPACING.md,
          paddingRight: TABLET_SPACING.sm,
          borderBottom: `1px solid rgba(255,255,255,0.1)`,
          fontSize: TABLET_TYPOGRAPHY.fontSize.xs,
          color: TEXT_COLORS.secondary,
          fontWeight: 500,
          flexShrink: 0,
        }}
      >
        <div style={{ width: 48 }}>ADP</div>
        <div style={{ flex: 1 }}>PLAYER</div>
        <div style={{ width: 40 }} />
        <div style={{ width: 48, textAlign: 'right' }}>PROJ</div>
      </div>
      
      {/* Player List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
        className="tablet-scroll-hidden"
      >
        {players.length === 0 ? (
          <div
            style={{
              padding: TABLET_SPACING.xl,
              textAlign: 'center',
              color: TEXT_COLORS.secondary,
            }}
          >
            No players found
          </div>
        ) : (
          players.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              isQueued={isQueued(player.id)}
              onToggleQueue={() => onToggleQueue(player)}
              onClick={() => onPlayerClick?.(player)}
            />
          ))
        )}
      </div>
      
      {/* Hidden scrollbar styles */}
      <style>{`
        .tablet-scroll-hidden::-webkit-scrollbar {
          display: none !important;
        }
        .tablet-scroll-hidden {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
      `}</style>
    </div>
  );
}

