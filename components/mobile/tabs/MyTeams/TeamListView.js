/**
 * TeamListView - Shows list of user's teams with search/filter
 * 
 * Extracted from MyTeamsTab for maintainability.
 */

import React, { useState, useRef } from 'react';
import { NFL_TEAMS } from '../../../../lib/nflConstants';

export default function TeamListView({
  teams,
  allPlayers,
  onTeamSelect
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [selectedNFLTeams, setSelectedNFLTeams] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchInputRef = useRef(null);

  // Get unique NFL teams from player pool with enhanced search data
  const getNFLTeams = () => {
    const teamCodes = [...new Set(allPlayers.map(player => player.team))].sort();
    return teamCodes.map(code => ({
      name: code,
      displayName: NFL_TEAMS[code]?.fullName || code,
      city: NFL_TEAMS[code]?.city || '',
      teamName: NFL_TEAMS[code]?.name || '',
      fullName: NFL_TEAMS[code]?.fullName || code,
      type: 'nflTeam'
    }));
  };

  // Get filtered players and teams for dropdown
  const getFilteredResults = () => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    
    // Get matching players
    const players = allPlayers
      .filter(player => 
        player.name.toLowerCase().includes(query) && 
        !selectedPlayers.some(selected => selected.name === player.name)
      )
      .map(player => ({ ...player, type: 'player' }))
      .slice(0, 8);
    
    // Get matching NFL teams
    const nflTeams = getNFLTeams()
      .filter(team => {
        const matchesCode = team.name.toLowerCase().includes(query);
        const matchesCity = team.city.toLowerCase().includes(query);
        const matchesTeamName = team.teamName.toLowerCase().includes(query);
        const matchesFullName = team.fullName.toLowerCase().includes(query);
        
        return (matchesCode || matchesCity || matchesTeamName || matchesFullName) &&
               !selectedNFLTeams.some(selected => selected.name === team.name);
      })
      .slice(0, 4);
    
    return [...nflTeams, ...players];
  };

  // Handle selection from dropdown
  const handleSelection = (item) => {
    if (item.type === 'player') {
      setSelectedPlayers(prev => [...prev, item]);
    } else if (item.type === 'nflTeam') {
      setSelectedNFLTeams(prev => [...prev, item]);
    }
    setSearchQuery('');
    setShowDropdown(false);
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  };

  // Remove selected player
  const removeSelectedPlayer = (playerToRemove) => {
    setSelectedPlayers(prev => prev.filter(player => player.name !== playerToRemove.name));
  };

  // Remove selected NFL team
  const removeSelectedNFLTeam = (teamToRemove) => {
    setSelectedNFLTeams(prev => prev.filter(team => team.name !== teamToRemove.name));
  };

  // Filter teams by selected players and NFL teams
  const filteredTeams = teams.filter(team => {
    if (selectedPlayers.length === 0 && selectedNFLTeams.length === 0) return true;
    
    let matchesPlayerFilter = true;
    let matchesNFLTeamFilter = true;
    
    if (selectedPlayers.length > 0) {
      matchesPlayerFilter = selectedPlayers.every(selectedPlayer => {
        return Object.values(team.players).some(positionPlayers =>
          positionPlayers.some(player => player.name === selectedPlayer.name)
        );
      });
    }
    
    if (selectedNFLTeams.length > 0) {
      matchesNFLTeamFilter = selectedNFLTeams.some(selectedNFLTeam => {
        return Object.values(team.players).some(positionPlayers =>
          positionPlayers.some(player => player.team === selectedNFLTeam.name)
        );
      });
    }
    
    return matchesPlayerFilter && matchesNFLTeamFilter;
  });

  return (
    <div className="h-full bg-[#101927] text-white flex flex-col">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-700">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(e.target.value.trim().length > 0);
            }}
            onFocus={() => setShowDropdown(searchQuery.trim().length > 0)}
            className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
          />
          
          {showDropdown && getFilteredResults().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {getFilteredResults().map((item) => (
                <button
                  key={`${item.type}-${item.name}`}
                  onClick={() => handleSelection(item)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors text-sm border-b border-gray-700 last:border-b-0"
                >
                  <span className="font-medium text-white">
                    {item.type === 'player' ? item.name : item.fullName}
                  </span>
                  {item.type === 'player' && (
                    <span className="ml-2 text-xs text-gray-400">{item.position} - {item.team}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Selected Filters */}
        {(selectedPlayers.length > 0 || selectedNFLTeams.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedPlayers.map((player) => (
              <div key={player.name} className="flex items-center bg-blue-600 text-white px-3 py-1 rounded-full text-xs">
                <span>{player.name}</span>
                <button onClick={() => removeSelectedPlayer(player)} className="ml-2 text-blue-200 hover:text-white">x</button>
              </div>
            ))}
            {selectedNFLTeams.map((team) => (
              <div key={team.name} className="flex items-center bg-green-600 text-white px-3 py-1 rounded-full text-xs">
                <span>{team.fullName || team.name}</span>
                <button onClick={() => removeSelectedNFLTeam(team)} className="ml-2 text-green-200 hover:text-white">x</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Teams List */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-0 scrollable-list">
        {filteredTeams.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No teams found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTeams.map((team) => (
              <div 
                key={team.id}
                className="flex items-center justify-between p-3 bg-gray-800/40 rounded-lg hover:bg-gray-700/60 transition-colors cursor-pointer border border-gray-700/30"
                onClick={() => onTeamSelect(team)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{team.name}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

