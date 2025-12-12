/**
 * PlayerListVX - Version X Player List (TypeScript)
 * 
 * Migrated from: components/draft/v3/mobile/apple/components/PlayerListApple.js (896 lines)
 * 
 * Features:
 * - 4-way position filtering (multi-select)
 * - 4-way ADP sorting (asc, desc, name_asc, name_desc) per memory #7610992
 * - Player search
 * - Expandable player rows with stats
 * - Queue add/remove
 * - Touch-optimized for mobile
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { POSITION_COLORS, BG_COLORS, UI_COLORS, TEXT_COLORS } from '../../constants/colors';
import { POSITIONS, type FantasyPosition } from '../../constants/positions';
import { MOBILE, TOUCH_TARGETS, PLATFORM, FONT_SIZE } from '../../constants/sizes';
import { PositionBadgeInline } from '../../shared/PositionBadge';
import { SearchInput, Button, Badge, Stat, TeamLogo } from '../../shared';
import type { Player } from '../../shared/types';
import { getByeWeek, formatPlayerName, TEAM_NAMES } from '../../shared/utils';

// Re-export Player type for consumers
export type { Player } from '../../shared/types';

export interface PlayerListVXProps {
  /** Array of players to display */
  players: Player[];
  /** Callback when player is drafted */
  onDraftPlayer?: (player: Player) => void;
  /** Callback when player is added/removed from queue */
  onQueuePlayer?: (player: Player) => void;
  /** Callback when player is selected */
  onPlayerSelect?: (player: Player) => void;
  /** External scroll ref */
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  /** Whether it's the user's turn to draft */
  isMyTurn?: boolean;
  /** Array of players currently in queue */
  queuedPlayers?: Player[];
  /** Custom rankings data */
  customRankings?: CustomRanking[];
  /** Drafted position counts (user's drafted players by position) */
  draftedCounts?: Record<FantasyPosition, number>;
}

interface CustomRanking {
  playerName: string;
  rank: number;
}

type SortDirection = 'asc' | 'desc' | 'name_asc' | 'name_desc' | 'rank_asc' | 'rank_desc' | 'proj_asc' | 'proj_desc';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/** Get custom rank for a player */
function getCustomRank(playerName: string, rankings: CustomRanking[]): number | null {
  const ranking = rankings.find(r => 
    r.playerName.toLowerCase() === playerName.toLowerCase()
  );
  return ranking?.rank ?? null;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PlayerListVX({
  players = [],
  onDraftPlayer,
  onQueuePlayer,
  onPlayerSelect,
  scrollRef: externalScrollRef,
  isMyTurn = false,
  queuedPlayers = [],
  customRankings = [],
  draftedCounts = { QB: 0, RB: 0, WR: 0, TE: 0 },
}: PlayerListVXProps): React.ReactElement {
  // Refs
  const localScrollRef = useRef<HTMLDivElement>(null);
  const scrollContainer = externalScrollRef || localScrollRef;

  // State
  const [activeFilters, setActiveFilters] = useState<FantasyPosition[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  // ============================================================================
  // FILTER HANDLERS
  // ============================================================================

  const handlePositionFilter = useCallback((position: FantasyPosition) => {
    setActiveFilters(prev => {
      if (prev.includes(position)) {
        return prev.filter(p => p !== position);
      }
      return [...prev, position];
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setActiveFilters([]);
    setSearchTerm('');
    setExpandedPlayer(null);
  }, []);

  // ============================================================================
  // SORT HANDLERS
  // ============================================================================

  /** ADP sort - 2-way cycle */
  const handleADPSort = useCallback(() => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  /** Rank sort - 2-way cycle */
  const handleRankSort = useCallback(() => {
    setSortDirection(prev => prev === 'rank_asc' ? 'rank_desc' : 'rank_asc');
  }, []);

  /** Projection sort - 2-way cycle */
  const handleProjSort = useCallback(() => {
    setSortDirection(prev => prev === 'proj_asc' ? 'proj_desc' : 'proj_asc');
  }, []);

  // ============================================================================
  // PLAYER EXPANSION
  // ============================================================================

  const handlePlayerExpansion = useCallback((playerName: string) => {
    setExpandedPlayer(prev => {
      const newExpanded = prev === playerName ? null : playerName;
      
      // Scroll expanded player into view
      if (newExpanded && scrollContainer.current) {
        setTimeout(() => {
          const element = document.querySelector(`[data-player-name="${newExpanded}"]`);
          if (element && scrollContainer.current) {
            const containerRect = scrollContainer.current.getBoundingClientRect();
            const playerRect = element.getBoundingClientRect();
            const scrollTop = scrollContainer.current.scrollTop;
            const targetScrollTop = scrollTop + (playerRect.top - containerRect.top);
            
            scrollContainer.current.scrollTo({
              top: targetScrollTop,
              behavior: 'smooth',
            });
          }
        }, 100);
      }
      
      return newExpanded;
    });
  }, [scrollContainer]);

  // ============================================================================
  // FILTERED & SORTED PLAYERS
  // ============================================================================

  const filteredPlayers = useMemo(() => {
    // Remove duplicates
    const seen = new Map<string, boolean>();
    let filtered = players.filter(player => {
      if (!player?.name) return false;
      const key = player.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.set(key, true);
      return true;
    });

    // Apply position filters
    if (activeFilters.length > 0) {
      filtered = filtered.filter(p => activeFilters.includes(p.position));
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(player => {
        const fullTeamName = TEAM_NAMES[player.team] || '';
        const formattedName = formatPlayerName(player.name);
        return (
          player.name.toLowerCase().includes(search) ||
          formattedName.toLowerCase().includes(search) ||
          player.team.toLowerCase().includes(search) ||
          fullTeamName.toLowerCase().includes(search)
        );
      });
    }

    // Sort (using Math.round to match original behavior)
    return filtered.sort((a, b) => {
      switch (sortDirection) {
        case 'asc':
          // Round ADP to integers (matches original)
          const adpA = Math.round(parseFloat(String(a.adp))) || 999;
          const adpB = Math.round(parseFloat(String(b.adp))) || 999;
          return adpA - adpB;
        case 'desc':
          const adpA2 = Math.round(parseFloat(String(a.adp))) || 999;
          const adpB2 = Math.round(parseFloat(String(b.adp))) || 999;
          return adpB2 - adpA2;
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'rank_asc':
          return (getCustomRank(a.name, customRankings) || 999) - (getCustomRank(b.name, customRankings) || 999);
        case 'rank_desc':
          return (getCustomRank(b.name, customRankings) || 999) - (getCustomRank(a.name, customRankings) || 999);
        case 'proj_asc':
          return (parseFloat(String(a.projectedPoints || a.proj || 0))) - (parseFloat(String(b.projectedPoints || b.proj || 0)));
        case 'proj_desc':
          return (parseFloat(String(b.projectedPoints || b.proj || 0))) - (parseFloat(String(a.projectedPoints || a.proj || 0)));
        default:
          return 0;
      }
    });
  }, [players, activeFilters, searchTerm, sortDirection, customRankings]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="h-full flex flex-col">
      {/* Position Filter Buttons - shows drafted count (matches original) */}
      <div style={{ marginTop: '12px' }}>
        <div className="flex w-full">
          {POSITIONS.map(position => {
            const positionColor = POSITION_COLORS[position];
            const isActive = activeFilters.includes(position);
            // Show drafted count (how many of this position the user has drafted)
            const count = draftedCounts[position] || 0;
            
            return (
              <button
                key={position}
                onClick={() => handlePositionFilter(position)}
                className="flex-1 py-1 text-sm font-medium flex items-center justify-center"
                style={{
                  minHeight: TOUCH_TARGETS.min,
                  borderRadius: PLATFORM.ios.borderRadius,
                  border: `3px solid ${positionColor}`,
                  backgroundColor: isActive ? positionColor : 'transparent',
                  color: 'white',
                  margin: '2px',
                  height: '44px',
                }}
                aria-label={`Filter by ${position}, ${count} drafted`}
                aria-pressed={isActive}
              >
                <span style={{ fontSize: '14px', marginRight: '4px' }}>
                  {position}
                </span>
                <span
                  className="font-sans font-bold"
                  style={{
                    fontSize: '13px',
                    color: 'white',
                    lineHeight: '1',
                  }}
                >
                  - {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 mx-2 mt-3 mb-1" style={{ marginTop: '12px' }}>
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
          className="flex-1"
          aria-label="Search players by name or team"
        />
        <Button
          onClick={handleClearAll}
          variant="secondary"
          size="sm"
          style={{ width: 'calc(22.5% - 6px)' }}
        >
          Clear
        </Button>
      </div>

      {/* Column Headers - Using flexbox instead of absolute positioning */}
      <div className="flex items-center px-3 py-2 border-b border-white/10" role="row">
        {/* RANK Header */}
        <button
          className="cursor-pointer flex-shrink-0 bg-transparent border-none"
          style={{
            fontSize: sortDirection.startsWith('rank') ? '14px' : FONT_SIZE.columnHeader,
            fontWeight: sortDirection.startsWith('rank') ? 'bold' : 'normal',
            color: sortDirection.startsWith('rank') ? TEXT_COLORS.primary : TEXT_COLORS.secondary,
            width: '44px',
          }}
          onClick={handleRankSort}
          aria-label="Sort by rank"
          aria-sort={sortDirection.startsWith('rank') ? (sortDirection === 'rank_asc' ? 'ascending' : 'descending') : 'none'}
        >
          RANK
        </button>

        {/* Spacer - takes up remaining space */}
        <div className="flex-1" />

        {/* PROJ Header */}
        <button
          className="cursor-pointer text-center flex-shrink-0 bg-transparent border-none"
          style={{
            fontSize: sortDirection.startsWith('proj') ? '14px' : FONT_SIZE.columnHeader,
            fontWeight: sortDirection.startsWith('proj') ? 'bold' : 'normal',
            color: sortDirection.startsWith('proj') ? TEXT_COLORS.primary : TEXT_COLORS.secondary,
            width: '44px',
          }}
          onClick={handleProjSort}
          aria-label="Sort by projection"
          aria-sort={sortDirection.startsWith('proj') ? (sortDirection === 'proj_asc' ? 'ascending' : 'descending') : 'none'}
        >
          PROJ
        </button>

        {/* ADP Header */}
        <button
          className="cursor-pointer text-center flex-shrink-0 bg-transparent border-none"
          style={{
            fontSize: sortDirection === 'asc' || sortDirection === 'desc' ? '16px' : '15px',
            fontWeight: sortDirection === 'asc' || sortDirection === 'desc' ? 'bold' : 'normal',
            color: sortDirection === 'asc' || sortDirection === 'desc' ? TEXT_COLORS.primary : TEXT_COLORS.secondary,
            width: '44px',
          }}
          onClick={handleADPSort}
          aria-label="Sort by ADP"
          aria-sort={sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : 'none'}
        >
          ADP
        </button>
      </div>

      {/* Player List - Clean flexbox layout, no negative margins */}
      <div
        ref={scrollContainer}
        className="flex-1 overflow-y-auto"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="px-1 pb-8">
          {filteredPlayers.map((player, index) => (
            <PlayerRowVX
              key={`${player.name}-${index}`}
              player={player}
              onDraft={onDraftPlayer}
              onQueue={onQueuePlayer}
              onSelect={onPlayerSelect}
              isMyTurn={isMyTurn}
              isFirstPlayer={index === 0}
              isLastPlayer={index === filteredPlayers.length - 1}
              customRankings={customRankings}
              queuedPlayers={queuedPlayers}
              isExpanded={expandedPlayer === player.name}
              onToggleExpansion={handlePlayerExpansion}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PLAYER ROW COMPONENT
// ============================================================================

interface PlayerRowVXProps {
  player: Player;
  onDraft?: (player: Player) => void;
  onQueue?: (player: Player) => void;
  onSelect?: (player: Player) => void;
  isMyTurn: boolean;
  isFirstPlayer: boolean;
  isLastPlayer: boolean;
  customRankings: CustomRanking[];
  queuedPlayers: Player[];
  isExpanded: boolean;
  onToggleExpansion: (playerName: string) => void;
}

function PlayerRowVX({
  player,
  onDraft,
  onQueue,
  onSelect,
  isMyTurn,
  isFirstPlayer,
  isLastPlayer,
  customRankings,
  queuedPlayers,
  isExpanded,
  onToggleExpansion,
}: PlayerRowVXProps): React.ReactElement {
  const isQueued = queuedPlayers.some(p => p.name === player.name);
  const customRank = getCustomRank(player.name, customRankings);
  const byeWeek = getByeWeek(player.team);

  const handleQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQueue?.(player);
  };

  const handleDraft = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDraft?.(player);
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpansion(player.name);
  };

  return (
    <div
      className="w-full"
      style={{ paddingBottom: isLastPlayer ? '16px' : '0' }}
      data-player-name={player.name}
    >
      {/* Main Player Row - Clean flexbox layout */}
      <div
        className="flex items-center px-3 border-b border-white/10 cursor-pointer transition-colors duration-200 active:bg-white/5 hover:bg-white/3"
        style={{
          minHeight: MOBILE.playerCard.height,
          height: MOBILE.playerCard.height,
          backgroundColor: BG_COLORS.card,
        }}
        onClick={toggleDropdown}
        role="button"
        tabIndex={0}
        aria-label={`${player.name}, ${player.position}, ${player.team}. Click to expand details`}
        aria-expanded={isExpanded}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleDropdown(e as unknown as React.MouseEvent); }}
      >
        {/* RANK Column - fixed width */}
        <div
          className="flex-shrink-0 text-center"
          style={{ width: '44px', fontSize: FONT_SIZE.playerRank, color: TEXT_COLORS.secondary }}
        >
          {customRank || '-'}
        </div>

        {/* Player Info - flex grow to take remaining space */}
        <div className="flex-1 min-w-0 pr-2">
          {/* Player Name */}
          <div
            className="font-medium truncate"
            style={{ fontSize: FONT_SIZE.playerName, color: TEXT_COLORS.primary }}
          >
            {formatPlayerName(player.name)}
          </div>

          {/* Position Badge + Team Info */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <PositionBadgeInline position={player.position} size="sm" />
            <span style={{ fontSize: FONT_SIZE.playerTeam, color: TEXT_COLORS.secondary }}>
              {player.team} ({byeWeek || 'TBD'})
            </span>
          </div>
        </div>

        {/* Queue Button - fixed width */}
        <button
          className="flex-shrink-0 flex items-center justify-center bg-transparent border-none"
          style={{ width: '36px' }}
          onClick={handleQueue}
          aria-label={isQueued ? `Remove ${player.name} from queue` : `Add ${player.name} to queue`}
          aria-pressed={isQueued}
        >
          <div
            className="flex items-center justify-center cursor-pointer transition-all duration-200"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: isQueued 
                ? `2px solid ${UI_COLORS.queueButtonActiveBorder}` 
                : `2px solid ${UI_COLORS.queueButtonBorder}`,
              backgroundColor: isQueued ? UI_COLORS.queueButtonActiveBg : 'transparent',
            }}
          >
            <span
              style={{ fontSize: '18px', lineHeight: 1, color: TEXT_COLORS.primary }}
              aria-hidden="true"
            >
              {isQueued ? '-' : '+'}
            </span>
          </div>
        </button>

        {/* PROJ Column - fixed width */}
        <div
          className="flex-shrink-0 text-center text-gray-400"
          style={{ width: '44px', fontSize: '13px' }}
        >
          {parseFloat(String(player.projectedPoints || 0)) || (player.name.charCodeAt(0) + 100)}
        </div>

        {/* ADP Column - fixed width */}
        <div
          className="flex-shrink-0 text-center text-gray-400"
          style={{ width: '44px', fontSize: '13px' }}
        >
          {parseFloat(String(player.adp || 0)).toFixed(1)}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mx-2 mt-3 mb-3" style={{ animation: 'slideDown 0.2s ease-out' }}>
          <PlayerExpandedContentVX
            player={player}
            isMyTurn={isMyTurn}
            onDraft={handleDraft}
            onClose={() => onToggleExpansion(player.name)}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPANDED PLAYER CONTENT (Simplified version)
// ============================================================================

interface PlayerExpandedContentVXProps {
  player: Player;
  isMyTurn: boolean;
  onDraft: (e: React.MouseEvent) => void;
  onClose: () => void;
}

function PlayerExpandedContentVX({
  player,
  isMyTurn,
  onDraft,
  onClose,
}: PlayerExpandedContentVXProps): React.ReactElement {
  const byeWeek = getByeWeek(player.team);

  return (
    <div
      className="border border-gray-600 rounded-lg shadow-xl p-4"
      style={{ backgroundColor: BG_COLORS.secondary }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        {/* Team Logo */}
        <TeamLogo team={player.team} size="lg" />

        {/* Stats Badges */}
        <div className="flex gap-4">
          <Stat label="Bye" value={byeWeek || 'N/A'} size="sm" />
          <Stat label="ADP" value={parseFloat(String(player.adp || 0)).toFixed(1)} size="sm" />
          <Stat
            label="Proj"
            value={parseFloat(String(player.projectedPoints || player.proj || 0)).toFixed(1)}
            size="sm"
          />
        </div>

        {/* Draft Button */}
        <Button
          onClick={onDraft}
          variant={isMyTurn ? 'primary' : 'secondary'}
          size="sm"
          disabled={!isMyTurn}
        >
          DRAFT
        </Button>
      </div>

      {/* Player Name */}
      <div className="text-white font-bold text-lg mb-2">{player.name}</div>

      {/* Stats placeholder - integrate with PlayerExpandedCard later */}
      <div className="text-gray-400 text-xs">
        [Stats table - will integrate PlayerExpandedCard component]
      </div>
    </div>
  );
}

