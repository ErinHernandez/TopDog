/**
 * PlayerDropdown - Reusable Player Dropdown Component
 * 
 * Identical styling to draft room dropdown, configurable for different contexts.
 * Supports daily data updates and cross-application usage.
 * 
 * @example
 * ```tsx
 * <PlayerDropdown
 *   players={players}
 *   context="DRAFT_ROOM"
 *   renderPlayerCell={(player) => <YourPlayerCell player={player} />}
 *   onDraftPlayer={handleDraft}
 * />
 * ```
 */

import React, { useState, useEffect, useRef } from 'react';
import { playerDataService } from '../../../lib/playerData/PlayerDataService';
import { DROPDOWN_STYLES, DROPDOWN_DIMENSIONS, CONTEXT_OVERRIDES } from './PlayerDropdownStyles';
import PlayerDropdownRow from './PlayerDropdownRow';
import PlayerExpandedCard from '../PlayerExpandedCard';
import type { PlayerPoolEntry } from '../../../lib/playerPool';
import type { DropdownContext, ContextConfig } from './PlayerDropdownContent';

// ============================================================================
// TYPES
// ============================================================================

export interface RenderPlayerCellContext {
  isExpanded: boolean;
  isSelected: boolean;
  isMyTurn: boolean;
  context: DropdownContext;
}

export type RenderPlayerCell = (
  player: PlayerPoolEntry,
  index: number,
  context: RenderPlayerCellContext
) => React.ReactNode;

export interface PlayerDropdownProps {
  // Data props
  /** External player data (if not provided, will fetch) */
  players?: PlayerPoolEntry[] | null;
  /** Currently selected player */
  selectedPlayer?: PlayerPoolEntry | null;
  
  // Context props
  /** Context for dropdown behavior (default: "DRAFT_ROOM") */
  context?: DropdownContext;
  /** Whether it's the user's turn (default: false) */
  isMyTurn?: boolean;
  
  // Filter props
  /** Filter by position */
  position?: string | null;
  /** Filter by team */
  team?: string | null;
  /** Search term */
  searchTerm?: string;
  /** Sort field (default: "rank") */
  sortBy?: string;
  
  // Action handlers
  /** Callback when player is selected */
  onPlayerSelect?: (player: PlayerPoolEntry) => void;
  /** Callback when player is drafted */
  onDraftPlayer?: (player: PlayerPoolEntry) => void;
  /** Callback when player is queued */
  onQueuePlayer?: (player: PlayerPoolEntry) => void;
  
  // Display options
  /** Whether to show action buttons (default: true) */
  showActions?: boolean;
  /** Whether to show stats (default: true) */
  showStats?: boolean;
  /** Maximum height of dropdown (default: "400px") */
  maxHeight?: string;
  
  // Custom styling
  /** Custom styles */
  customStyles?: React.CSSProperties;
  /** Additional CSS classes */
  className?: string;
  
  // Loading states
  /** Whether data is loading (default: false) */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  
  // CRITICAL: Render prop for existing player cells
  /** Function that renders the existing player cell */
  renderPlayerCell?: RenderPlayerCell | null;
  
  // Dropdown positioning
  /** Pixels below player row to show dropdown (default: 14) */
  dropdownOffset?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

const PlayerDropdown: React.FC<PlayerDropdownProps> = ({
  // Data props
  players: externalPlayers = null,
  selectedPlayer = null,
  
  // Context props
  context = 'DRAFT_ROOM',
  isMyTurn = false,
  
  // Filter props
  position = null,
  team = null,
  searchTerm = '',
  sortBy = 'rank',
  
  // Action handlers
  onPlayerSelect,
  onDraftPlayer,
  onQueuePlayer,
  
  // Display options
  showActions = true,
  showStats = true,
  maxHeight = '400px',
  
  // Custom styling
  customStyles = {},
  className = '',
  
  // Loading states
  loading = false,
  error = null,
  
  // Render prop
  renderPlayerCell = null,
  
  // Dropdown positioning
  dropdownOffset = 14,
}): React.ReactElement => {
  const [players, setPlayers] = useState<PlayerPoolEntry[]>(externalPlayers ?? []);
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(loading);
  const [dataError, setDataError] = useState<string | null>(error);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get context-specific configuration
  const contextConfig: ContextConfig = CONTEXT_OVERRIDES[context] || CONTEXT_OVERRIDES.DRAFT_ROOM;

  // Load player data if not provided externally
  useEffect(() => {
    if (!externalPlayers) {
      loadPlayers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- loadPlayers is stable
  }, [position, team, searchTerm, sortBy, externalPlayers]);

  // Subscribe to player data updates
  useEffect(() => {
    const unsubscribe = playerDataService.subscribe((data) => {
      if (!externalPlayers && data.players) {
        setPlayers(data.players);
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, [externalPlayers]);

  const loadPlayers = async (): Promise<void> => {
    if (externalPlayers) return;

    setIsLoading(true);
    setDataError(null);

    try {
      const playerData = await playerDataService.getPlayers({
        position,
        team,
        searchTerm,
        sortBy,
      });
      
      if (playerData) {
        setPlayers(playerData);
      }
    } catch (err) {
      const error = err as Error;
      setDataError(error.message);
      console.error('Failed to load players:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayerClick = (player: PlayerPoolEntry): void => {
    const wasExpanded = expandedPlayer === player.name;
    const willExpand = !wasExpanded;
    
    // Toggle expansion
    setExpandedPlayer(wasExpanded ? null : player.name);
    
    // Auto-scroll to make expanded dropdown fully visible
    if (willExpand && context === 'TEAM_MANAGEMENT') {
      setTimeout(() => {
        const playerElement = dropdownRef.current?.querySelector(`[data-player-name="${player.name}"]`);
        if (playerElement) {
          // Find the scroll container (should be the mobile scroll container)
          const scrollContainer = playerElement.closest('.h-full.overflow-y-auto.overflow-x-hidden') || 
                                 playerElement.closest('.h-full.overflow-y-auto') ||
                                 playerElement.closest('[style*="overflow-y"]') ||
                                 window;
          
          if (scrollContainer && scrollContainer !== window) {
            // Calculate the expanded dropdown height (approximate)
            const dropdownHeight = 200; // Approximate height of expanded dropdown
            const playerRect = playerElement.getBoundingClientRect();
            const containerRect = (scrollContainer as Element).getBoundingClientRect();
            
            // Check if dropdown would be cut off at bottom
            const dropdownBottom = playerRect.bottom + dropdownHeight;
            const containerBottom = containerRect.bottom;
            
            if (dropdownBottom > containerBottom) {
              // Scroll to show the full dropdown
              const scrollAmount = dropdownBottom - containerBottom + 20; // 20px padding
              (scrollContainer as Element).scrollTop += scrollAmount;
            }
          }
        }
      }, 50); // Small delay to allow DOM to update
    }
    
    // Notify parent of selection
    onPlayerSelect?.(player);
  };

  const handleDraftPlayer = (player: PlayerPoolEntry, event?: React.MouseEvent): void => {
    event?.stopPropagation();
    onDraftPlayer?.(player);
    
    // Close expansion after drafting
    setExpandedPlayer(null);
  };

  const handleQueuePlayer = (player: PlayerPoolEntry, event?: React.MouseEvent): void => {
    event?.stopPropagation();
    onQueuePlayer?.(player);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setExpandedPlayer(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8" role="status" aria-label="Loading players">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" aria-hidden="true" />
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="text-center py-8 text-red-400" role="alert">
        <p>Error loading players: {dataError}</p>
        <button 
          onClick={loadPlayers}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          aria-label="Retry loading players"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!players.length) {
    return (
      <div className="text-center py-8 text-gray-400" role="status" aria-label="No players found">
        <p>No players found</p>
      </div>
    );
  }

  return (
    <div 
      ref={dropdownRef}
      className={`player-dropdown ${className}`}
      style={{ 
        maxHeight: context === 'TEAM_MANAGEMENT' ? 'none' : maxHeight,
        overflowY: context === 'TEAM_MANAGEMENT' ? 'visible' : 'auto',
        position: 'relative',
        zIndex: 1,
        ...customStyles,
      }}
    >
      {/* Hide all scrollbars completely */}
      <style jsx>{`
        .player-dropdown::-webkit-scrollbar {
          display: none !important;
          width: 0px !important;
          height: 0px !important;
        }
        .player-dropdown::-webkit-scrollbar-track {
          display: none !important;
          background: transparent !important;
        }
        .player-dropdown::-webkit-scrollbar-thumb {
          display: none !important;
          background-color: transparent !important;
        }
        .player-dropdown::-webkit-scrollbar-thumb:hover {
          display: none !important;
          background-color: transparent !important;
        }
        .player-dropdown {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        /* Hide scrollbars in all child elements */
        .player-dropdown * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .player-dropdown *::-webkit-scrollbar {
          display: none !important;
          width: 0px !important;
          height: 0px !important;
        }
      `}</style>

      {players.map((player, index) => (
        <div key={player.name} className="relative" style={{ zIndex: expandedPlayer === player.name ? 9999 : 1 }}>
          {/* Pure Wrapper - Makes ANY existing player cell clickable */}
          <PlayerDropdownRow
            player={player}
            isExpanded={expandedPlayer === player.name}
            isSelected={selectedPlayer?.name === player.name}
            onClick={() => handlePlayerClick(player)}
            enableDropdown={true}
            dropdownOffset={dropdownOffset}
          >
            {/* 
              CRITICAL: This is where the existing player cell goes.
              
              The renderPlayerCell function should return the EXACT existing player cell
              without any modifications. Examples:
              
              1. Draft room usage:
                 renderPlayerCell={(player) => (
                   <ExistingDraftRoomPlayerRow player={player} />
                 )}
              
              2. Rankings page usage:
                 renderPlayerCell={(player) => (
                   <ExistingRankingsPlayerCard player={player} />
                 )}
              
              3. Custom usage:
                 renderPlayerCell={(player) => (
                   <div>Any custom player display</div>
                 )}
              
              If no renderPlayerCell is provided, we show a fallback:
            */}
            {renderPlayerCell ? (
              renderPlayerCell(player, index, {
                isExpanded: expandedPlayer === player.name,
                isSelected: selectedPlayer?.name === player.name,
                isMyTurn,
                context,
              })
            ) : (
              // Fallback: Basic player display (only used if no renderPlayerCell provided)
              <div className="flex items-center w-full py-2 px-3 bg-gray-800 text-white">
                <div className="flex-1">
                  <div className="font-medium">{player.name}</div>
                  <div className="text-sm text-gray-400">
                    {player.position} - {player.team}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{parseFloat(String(player.adp || 0)).toFixed(1)}</div>
                </div>
              </div>
            )}
          </PlayerDropdownRow>

          {/* Expanded Content - Uses shared PlayerExpandedCard from sandbox */}
          {expandedPlayer === player.name && (
            <div className="mx-2 mt-3 mb-3" style={{ animation: 'slideDown 0.2s ease-out' }}>
              <PlayerExpandedCard
                player={{
                  name: player.name,
                  team: player.team,
                  position: player.position,
                  adp: player.adp,
                  projectedPoints: typeof player.proj === 'string' ? parseFloat(player.proj || '0') || null : (player.proj as number) || null,
                  proj: typeof player.proj === 'string' ? player.proj : String(player.proj || ''),
                }}
                isMyTurn={isMyTurn}
                showDraftButton={context !== 'TEAM_MANAGEMENT'}
                onDraft={() => handleDraftPlayer(player)}
                onClose={() => setExpandedPlayer(null)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PlayerDropdown;
