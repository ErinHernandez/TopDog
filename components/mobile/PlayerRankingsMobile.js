/**
 * PlayerRankingsMobile - Consolidated Mobile Rankings Component
 * 
 * Unified component replacing RankingsMobile and RankingsPageMobile.
 * Supports multiple modes via props.
 * 
 * Props:
 *   - variant: 'compact' | 'full' (default: 'full')
 *   - showAllFilter: boolean (default: true)
 *   - showToggleButtons: boolean (default: true)
 *   - showHeader: boolean (default: true)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { PLAYER_POOL } from '../../lib/playerPool';
import { saveCustomRankings, loadCustomRankings, clearCustomRankings } from '../../lib/customRankings';
import { PositionBadge } from '../../ui';
import { POSITIONS, POSITION_COLORS } from '../../lib/constants/positions';
// MOBILE_SIZES - using default spacing from VX2 (SPACING from vx2/core/constants/sizes)

export default function PlayerRankingsMobile({
  variant = 'full',
  showAllFilter = true,
  showToggleButtons = true,
  showHeader = true
}) {
  const [customRankings, setCustomRankings] = useState([]);
  const [positionFilter, setPositionFilter] = useState(showAllFilter ? 'ALL' : null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [draggedPlayer, setDraggedPlayer] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Load rankings on mount
  useEffect(() => {
    setMounted(true);
    const savedRankings = loadCustomRankings();
    if (savedRankings && savedRankings.length > 0) {
      setCustomRankings(savedRankings);
    }
  }, []);

  // Get position color from centralized constants
  const getPositionColor = (position) => {
    return POSITION_COLORS[position]?.primary || '#6B7280';
  };

  // Create unified player list with custom rankings prioritized
  const allPlayers = useMemo(() => {
    const rankedPlayers = customRankings.map(playerName => 
      PLAYER_POOL.find(p => p.name === playerName)
    ).filter(Boolean);
    
    const unrankedPlayers = PLAYER_POOL.filter(player => 
      !customRankings.includes(player.name)
    ).sort((a, b) => {
      const adpA = parseFloat(a.adp) || 999;
      const adpB = parseFloat(b.adp) || 999;
      return adpA - adpB;
    });
    
    return [...rankedPlayers, ...unrankedPlayers];
  }, [customRankings]);

  // Apply filters
  const filteredPlayers = useMemo(() => {
    let players = [...allPlayers];
    
    if (positionFilter && positionFilter !== 'ALL') {
      players = players.filter(player => player.position === positionFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      players = players.filter(player => 
        player.name.toLowerCase().includes(query) ||
        player.team.toLowerCase().includes(query)
      );
    }
    
    return players;
  }, [allPlayers, positionFilter, searchQuery]);

  // Ranking helpers
  const getCustomRank = (playerName) => {
    const index = customRankings.indexOf(playerName);
    return index >= 0 ? index + 1 : null;
  };

  const isPlayerRanked = (playerName) => customRankings.includes(playerName);

  // Drag handlers
  const handleDragStart = (e, player) => {
    setDraggedPlayer(player);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index = null) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedPlayer(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex = null) => {
    e.preventDefault();
    if (!draggedPlayer) return;

    const playerName = draggedPlayer.name;
    const isCurrentlyRanked = customRankings.includes(playerName);
    let newRankings = [...customRankings];

    if (isCurrentlyRanked) {
      const currentIndex = customRankings.indexOf(playerName);
      if (dropIndex !== null) {
        newRankings.splice(currentIndex, 1);
        const insertIndex = dropIndex > currentIndex ? dropIndex - 1 : dropIndex;
        newRankings.splice(insertIndex, 0, playerName);
      }
    } else {
      if (dropIndex !== null) {
        newRankings.splice(dropIndex, 0, playerName);
      } else {
        newRankings.push(playerName);
      }
    }

    setCustomRankings(newRankings);
    saveCustomRankings(newRankings);
    handleDragEnd();
  };

  // Toggle ranking
  const togglePlayerRanking = (player) => {
    const playerName = player.name;
    let newRankings = isPlayerRanked(playerName)
      ? customRankings.filter(name => name !== playerName)
      : [...customRankings, playerName];

    setCustomRankings(newRankings);
    saveCustomRankings(newRankings);
  };

  // Clear rankings
  const handleClearRankings = () => {
    setCustomRankings([]);
    clearCustomRankings();
  };

  // Loading state
  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading rankings...</p>
        </div>
      </div>
    );
  }

  // Filter buttons config
  const filterButtons = showAllFilter ? ['ALL', ...POSITIONS] : POSITIONS;
  const isCompact = variant === 'compact';

  return (
    <div className="h-full min-h-0 bg-[#101927] text-white flex flex-col mobile-no-scrollbar">
      {/* Header Section */}
      <div className="flex-shrink-0 px-4 pt-4 pb-4 border-b border-gray-700">
        {/* Title and Stats (optional) */}
        {showHeader && (
          <div className="mb-4 text-center">
            <h1 className="text-xl font-bold text-white mb-1">Player Rankings</h1>
            <p className="text-sm text-gray-400">
              Drag to reorder • {customRankings.length} custom rankings • {filteredPlayers.length} players shown
            </p>
          </div>
        )}

        {/* Clear Rankings Button */}
        {customRankings.length > 0 && (
          <div className={`${showHeader ? '' : 'pt-2'} mb-4 text-center`}>
            <button
              onClick={handleClearRankings}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-md transition-colors"
            >
              {showHeader ? 'Clear All Rankings' : 'Reset Rankings'}
            </button>
          </div>
        )}

        {/* Search and Filters */}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />

          <div className={`grid gap-2 ${showAllFilter ? 'grid-cols-5' : 'grid-cols-4'}`}>
            {filterButtons.map(position => (
              <button
                key={position}
                onClick={() => setPositionFilter(
                  showAllFilter 
                    ? position 
                    : (positionFilter === position ? null : position)
                )}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors border-2 ${
                  (showAllFilter ? positionFilter === position : positionFilter === position)
                    ? 'text-white'
                    : 'bg-transparent text-gray-300 hover:bg-gray-800/50'
                }`}
                style={{
                  backgroundColor: (showAllFilter ? positionFilter === position : positionFilter === position)
                    ? (position === 'ALL' ? '#3B82F6' : getPositionColor(position))
                    : 'transparent',
                  borderColor: position === 'ALL' ? '#3B82F6' : getPositionColor(position)
                }}
              >
                {position}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Player List */}
      <div className="flex-1 min-h-0 overflow-y-auto mobile-no-scrollbar pb-8">
        <div className="px-1">
          {filteredPlayers.map((player, index) => {
            const customRank = getCustomRank(player.name);
            const isRanked = customRank !== null;
            const isDragging = draggedPlayer?.name === player.name;
            const showDropLine = dragOverIndex === index && draggedPlayer && !isDragging;

            return (
              <div key={`${player.name}-${index}`}>
                {/* Drop indicator */}
                {showDropLine && (
                  <div className="h-1 bg-blue-500 rounded-full mx-2 mb-1 shadow-lg shadow-blue-500/50" />
                )}
                
                <div 
                  draggable
                  onDragStart={(e) => handleDragStart(e, player)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`px-2 border-b border-gray-700 cursor-move transition-all duration-200 ${
                    index === 0 ? 'border-t border-gray-700' : ''
                  } ${
                    index === filteredPlayers.length - 1 ? 'pt-1 pb-4' : 'py-1'
                  } ${
                    isDragging ? 'opacity-50 scale-95' : ''
                  } ${
                    isRanked ? 'bg-blue-900/30' : 'hover:bg-gray-800/50'
                  }`}
                  style={{ minHeight: isCompact ? '52px' : MOBILE_SIZES.TOUCH_TARGET_LARGE }}
                >
                  <div className="flex items-center justify-between">
                    {/* Left Side */}
                    <div className="flex items-center flex-1 min-w-0">
                      {/* Drag Handle */}
                      <div className="mr-2 text-gray-400 hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 6h2v2H8V6zm0 4h2v2H8v-2zm0 4h2v2H8v-2zm6-8h2v2h-2V6zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z"/>
                        </svg>
                      </div>
                      
                      {/* Rank Number */}
                      <div className={`w-8 text-center font-bold mr-2 ${
                        isRanked ? 'text-blue-400' : 'text-gray-400'
                      } ${isCompact ? 'text-sm' : 'text-lg'}`}>
                        {isRanked ? customRank : (index + 1)}
                      </div>
                      
                      {/* Player Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center overflow-hidden">
                          <h3 className={`font-medium text-white truncate max-w-[160px] ${
                            isCompact ? 'text-sm' : 'text-base'
                          }`}>
                            {player.name}
                          </h3>
                          {isRanked && !isCompact && (
                            <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                              RANKED
                            </span>
                          )}
                        </div>
                        
                        <div className={`text-gray-400 mt-1 flex items-center ${
                          isCompact ? 'text-xs' : 'text-sm'
                        }`}>
                          <div style={{ 
                            position: 'relative', 
                            width: isCompact ? '25px' : '28px', 
                            height: isCompact ? '16px' : '18px', 
                            marginRight: isCompact ? '6px' : '8px' 
                          }}>
                            <PositionBadge 
                              position={player.position} 
                              width={isCompact ? '25px' : '28px'} 
                              height={isCompact ? '16px' : '18px'} 
                            />
                          </div>
                          <span>{player.team} • ADP: {player.adp || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <div className="text-right">
                        {isRanked && !isCompact ? (
                          <div className="text-blue-400 text-lg font-bold">#{customRank}</div>
                        ) : (
                          <div className="text-gray-400 text-sm">ADP {player.adp || '-'}</div>
                        )}
                      </div>
                      
                      {showToggleButtons && (
                        <button
                          onClick={() => togglePlayerRanking(player)}
                          className={`px-3 py-1 text-xs rounded-md transition-colors ${
                            isRanked
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {isRanked ? 'Remove' : 'Rank'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Legacy exports for backwards compatibility
export { PlayerRankingsMobile as RankingsMobile };
export { PlayerRankingsMobile as RankingsPageMobile };

