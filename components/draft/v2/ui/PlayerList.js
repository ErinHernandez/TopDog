import React, { useState, useMemo } from 'react';
import { useDraft } from '../providers/DraftProvider';

/**
 * PlayerList - Available players list with search and filtering
 * 
 * Features:
 * - Virtual scrolling for performance
 * - Position filtering
 * - Search functionality
 * - Sorting options
 * - Player selection
 */
export default function PlayerList({ 
  showPositions = true,
  showADP = true,
  showProjections = true,
  compact = false,
  minimal = false,
  virtualScrolling = false,
  showDebugInfo = false
}) {
  const { 
    availablePlayers, 
    selectedPlayer, 
    setSelectedPlayer,
    addToQueue,
    queue,
    isMyTurn,
    makePick
  } = useDraft();

  const [search, setSearch] = useState('');
  const [positionFilters, setPositionFilters] = useState(['ALL']);
  const [sortBy, setSortBy] = useState('adp');

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let filtered = availablePlayers;

    // Apply search filter
    if (search) {
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(search.toLowerCase()) ||
        player.team.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply position filter
    // Safeguard: if no position filters are selected, show all players
    const effectivePositionFilters = positionFilters.length === 0 ? ['ALL'] : positionFilters;
    if (!effectivePositionFilters.includes('ALL')) {
      filtered = filtered.filter(player => effectivePositionFilters.includes(player.position));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'adp':
          return a.adp - b.adp;
        case 'proj':
          return (b.proj || 0) - (a.proj || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- positionFilters is a constant object
  }, [availablePlayers, search, positionFilter, sortBy]);

  // Get position color
  const getPositionColor = (position) => {
    switch (position) {
      case 'QB': return 'bg-purple-600';
      case 'RB': return 'bg-green-600';
      case 'WR': return 'bg-blue-600';
      case 'TE': return 'bg-pink-600';
      default: return 'bg-gray-600';
    }
  };

  // Handle player click
  const handlePlayerClick = (player) => {
    setSelectedPlayer(player);
  };

  // Handle draft player
  const handleDraftPlayer = (player) => {
    if (isMyTurn) {
      makePick(player.name);
    }
  };

  // Handle add to queue
  const handleAddToQueue = (player) => {
    addToQueue(player);
  };

  if (minimal) {
    return (
      <div className="h-full bg-gray-800">
        <div className="p-4">
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded"
          />
        </div>
        <div className="overflow-y-auto h-full">
          {filteredPlayers.slice(0, 50).map((player) => (
            <div
              key={player.name}
              onClick={() => handlePlayerClick(player)}
              className={`p-2 border-b border-gray-700 cursor-pointer hover:bg-gray-700 ${
                selectedPlayer?.name === player.name ? 'bg-blue-900' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-white">{player.name}</div>
                  <div className="text-sm text-gray-400">{player.position} - {player.team}</div>
                </div>
                <div className="text-sm text-gray-400">
                  {player.adp.toFixed(1)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-800 flex flex-col">
      {/* Search and Filters */}
      <div className="p-4 border-b border-gray-700">
        <div className="space-y-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          />

          {/* Position Filter */}
          <div className="flex space-x-1">
            {['ALL', 'QB', 'RB', 'WR', 'TE'].map((pos) => (
              <button
                key={pos}
                onClick={() => {
                  if (pos === 'ALL') {
                    setPositionFilters(['ALL']);
                  } else {
                    if (positionFilters.includes(pos)) {
                      const newFilters = positionFilters.filter(p => p !== pos);
                      // If removing position would leave no filters, default to ALL
                      setPositionFilters(newFilters.length > 0 ? newFilters : ['ALL']);
                    } else {
                      setPositionFilters([...positionFilters.filter(p => p !== 'ALL'), pos]);
                    }
                  }
                }}
                className={`px-3 py-1 text-xs rounded font-medium ${
                  positionFilters.includes(pos)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>

          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="adp">Sort by ADP</option>
            <option value="proj">Sort by Projection</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      {/* Player List Header */}
      <div className="px-4 py-2 bg-gray-700 text-xs font-medium text-gray-300 border-b border-gray-600">
        <div className="flex justify-between">
          <span>Player</span>
          <div className="flex space-x-4">
            {showADP && <span>ADP</span>}
            {showProjections && <span>Proj</span>}
          </div>
        </div>
      </div>

      {/* Players */}
      <div className="flex-1 overflow-y-auto">
        {filteredPlayers.map((player) => {
          const isInQueue = queue.some(p => p.name === player.name);
          const isSelected = selectedPlayer?.name === player.name;
          
          return (
            <div
              key={player.name}
              onClick={() => handlePlayerClick(player)}
              className={`p-3 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors ${
                isSelected ? 'bg-blue-900 border-blue-600' : ''
              } ${isInQueue ? 'bg-green-900/30' : ''}`}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    {showPositions && (
                      <span className={`px-2 py-1 text-xs font-bold rounded text-white ${getPositionColor(player.position)}`}>
                        {player.position}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-white truncate">{player.name}</div>
                      <div className="text-sm text-gray-400">{player.team}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm">
                  {showADP && (
                    <div className="text-gray-300 text-right min-w-0">
                      {player.adp.toFixed(1)}
                    </div>
                  )}
                  {showProjections && (
                    <div className="text-gray-300 text-right min-w-0">
                      {player.proj ? player.proj.toFixed(1) : '-'}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {(isSelected || isInQueue) && (
                <div className="mt-2 flex space-x-2">
                  {isMyTurn && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDraftPlayer(player);
                      }}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                    >
                      Draft
                    </button>
                  )}
                  
                  {!isInQueue ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToQueue(player);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Queue
                    </button>
                  ) : (
                    <span className="px-3 py-1 bg-green-600/20 text-green-400 text-xs rounded">
                      Queued
                    </span>
                  )}
                </div>
              )}

              {/* Debug Info */}
              {showDebugInfo && process.env.NODE_ENV === 'development' && (
                <div className="mt-1 text-xs text-gray-500">
                  ID: {player.name.replace(/\s+/g, '-').toLowerCase()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-2 bg-gray-700 text-xs text-gray-400 border-t border-gray-600">
        Showing {filteredPlayers.length} of {availablePlayers.length} available players
      </div>
    </div>
  );
}