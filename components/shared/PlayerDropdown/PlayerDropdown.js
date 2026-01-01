/**
 * PlayerDropdown - Reusable Player Dropdown Component
 * 
 * Identical styling to draft room dropdown, configurable for different contexts.
 * Supports daily data updates and cross-application usage.
 */

import React, { useState, useEffect, useRef } from 'react';
import { playerDataService } from '../../../lib/playerData/PlayerDataService';
import { DROPDOWN_STYLES, DROPDOWN_DIMENSIONS, CONTEXT_OVERRIDES } from './PlayerDropdownStyles';
import PlayerDropdownRow from './PlayerDropdownRow';
import PlayerExpandedCard from '../PlayerExpandedCard';

export default function PlayerDropdown({
  // Data props
  players: externalPlayers = null,
  selectedPlayer = null,
  
  // Context props
  context = 'DRAFT_ROOM', // DRAFT_ROOM, TEAM_MANAGEMENT, RANKINGS, MOBILE_DRAFT
  isMyTurn = false,
  
  // Filter props
  position = null,
  team = null,
  searchTerm = '',
  sortBy = 'rank',
  
  // Action handlers
  onPlayerSelect = () => {},
  onDraftPlayer = () => {},
  onQueuePlayer = () => {},
  
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
  
  // CRITICAL: Render prop for existing player cells
  renderPlayerCell = null, // Function that renders the existing player cell
  
  // Dropdown positioning
  dropdownOffset = 14, // Pixels below player row to show dropdown
}) {
  const [players, setPlayers] = useState(externalPlayers || []);
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(loading);
  const [dataError, setDataError] = useState(error);
  const dropdownRef = useRef(null);

  // Get context-specific configuration
  const contextConfig = CONTEXT_OVERRIDES[context] || CONTEXT_OVERRIDES.DRAFT_ROOM;

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
      if (!externalPlayers) {
        setPlayers(data.players || []);
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, [externalPlayers]);

  const loadPlayers = async () => {
    if (externalPlayers) return;

    setIsLoading(true);
    setDataError(null);

    try {
      const playerData = await playerDataService.getPlayers({
        position,
        team,
        searchTerm,
        sortBy
      });
      
      setPlayers(playerData);
    } catch (err) {
      setDataError(err.message);
      console.error('Failed to load players:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayerClick = (player) => {
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
            const containerRect = scrollContainer.getBoundingClientRect();
            
            // Check if dropdown would be cut off at bottom
            const dropdownBottom = playerRect.bottom + dropdownHeight;
            const containerBottom = containerRect.bottom;
            
            if (dropdownBottom > containerBottom) {
              // Scroll to show the full dropdown
              const scrollAmount = dropdownBottom - containerBottom + 20; // 20px padding
              scrollContainer.scrollTop += scrollAmount;
            }
          }
        }
      }, 50); // Small delay to allow DOM to update
    }
    
    // Notify parent of selection
    onPlayerSelect(player);
  };

  const handleDraftPlayer = (player, event) => {
    event?.stopPropagation();
    onDraftPlayer(player);
    
    // Close expansion after drafting
    setExpandedPlayer(null);
  };

  const handleQueuePlayer = (player, event) => {
    event?.stopPropagation();
    onQueuePlayer(player);
  };


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setExpandedPlayer(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="text-center py-8 text-red-400">
        <p>Error loading players: {dataError}</p>
        <button 
          onClick={loadPlayers}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!players.length) {
    return (
      <div className="text-center py-8 text-gray-400">
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
        ...customStyles 
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
                context
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
                  <div className="text-sm">{parseFloat(player.adp || 0).toFixed(1)}</div>
                </div>
              </div>
            )}
          </PlayerDropdownRow>

          {/* Expanded Content - Uses shared PlayerExpandedCard from sandbox */}
          {expandedPlayer === player.name && (
            <div className="mx-2 mt-3 mb-3" style={{ animation: 'slideDown 0.2s ease-out' }}>
              <PlayerExpandedCard
                player={player}
                isMyTurn={isMyTurn}
                showDraftButton={context !== 'TEAM_MANAGEMENT'}
                onDraft={(e) => handleDraftPlayer(player, e)}
                onClose={() => setExpandedPlayer(null)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
