/**
 * TeamListView - Shows list of user's teams with search/filter
 * 
 * Extracted from MyTeamsTab for maintainability.
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { NFL_TEAMS, BYE_WEEKS } from '../../../../lib/nflConstants';
import { getTotalPlayers } from './mockTeamData';

// Helper function to calculate total projected points for a team
function getTotalProjectedPoints(team) {
  if (!team || !team.players) return 0;
  try {
    return Object.values(team.players).reduce((total, positionPlayers) => {
      if (!Array.isArray(positionPlayers)) return total;
      return total + positionPlayers.reduce((posTotal, player) => {
        return posTotal + (player?.projectedPoints || 0);
      }, 0);
    }, 0);
  } catch (error) {
    console.error('Error calculating projected points:', error);
    return 0;
  }
}

// Helper function to get unique bye weeks for a team
function getTeamByeWeeks(team) {
  if (!team || !team.players) return [];
  try {
    const byeWeeks = new Set();
    Object.values(team.players).forEach(positionPlayers => {
      if (!Array.isArray(positionPlayers)) return;
      positionPlayers.forEach(player => {
        if (!player) return;
        if (player.bye) {
          byeWeeks.add(player.bye);
        } else if (player.team && BYE_WEEKS[player.team]) {
          byeWeeks.add(BYE_WEEKS[player.team]);
        }
      });
    });
    return Array.from(byeWeeks).sort((a, b) => a - b);
  } catch (error) {
    console.error('Error calculating bye weeks:', error);
    return [];
  }
}

// Team Card Row Component for Virtual Scrolling
function TeamCardRow({ index, style, data }) {
  const { teams, onTeamSelect, getTotalPlayers, getTotalProjectedPoints, getTeamByeWeeks } = data;
  const team = teams[index];
  
  if (!team || !team.players) {
    return null;
  }
  
  const totalPlayers = getTotalPlayers(team);
  const totalProjectedPoints = getTotalProjectedPoints(team);
  const byeWeeks = getTeamByeWeeks(team);
  const status = team.status || 'active';
  
  return (
    <div style={{ ...style, paddingBottom: '12px' }}>
      <div 
        className="bg-gray-800/40 rounded-lg hover:bg-gray-700/60 transition-all duration-200 cursor-pointer border border-gray-700/30 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:outline-none"
        onClick={() => onTeamSelect(team)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onTeamSelect(team);
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`View team ${team.name}`}
      >
        <div className="p-3">
          {/* Header Row */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-white truncate text-base">{team.name}</h3>
                {status === 'eliminated' && (
                  <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-red-600/20 text-red-400 rounded">
                    Eliminated
                  </span>
                )}
                {status === 'pending' && (
                  <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-yellow-600/20 text-yellow-400 rounded">
                    Pending
                  </span>
                )}
              </div>
              {/* Tournament Badge */}
              {team.tournament && (
                <div className="flex items-center gap-1.5 mb-2">
                  <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xs text-blue-400 font-medium">{team.tournament}</span>
                </div>
              )}
            </div>
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          
          {/* Metadata Row */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{totalPlayers} players</span>
            </div>
            {totalProjectedPoints > 0 && (
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>{Math.round(totalProjectedPoints)} pts</span>
              </div>
            )}
            {byeWeeks.length > 0 && (
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Byes: {byeWeeks.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeamListView({
  teams = [],
  allPlayers = [],
  onTeamSelect
}) {
  // Handle missing props gracefully
  if (!Array.isArray(teams)) {
    console.warn('TeamListView: teams prop is not an array');
    teams = [];
  }
  if (!Array.isArray(allPlayers)) {
    console.warn('TeamListView: allPlayers prop is not an array');
    allPlayers = [];
  }
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [selectedNFLTeams, setSelectedNFLTeams] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTournamentFilter, setShowTournamentFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [sortBy, setSortBy] = useState(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      return localStorage.getItem('teamsSortBy') || 'name_asc';
    }
    return 'name_asc';
  });
  const [showSortMenu, setShowSortMenu] = useState(false);
  const searchInputRef = useRef(null);
  const listContainerRef = useRef(null);
  const [listHeight, setListHeight] = useState(600);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Calculate list height based on container
  useEffect(() => {
    const updateHeight = () => {
      if (listContainerRef.current) {
        const container = listContainerRef.current.parentElement;
        if (container) {
          const rect = container.getBoundingClientRect();
          // Subtract header/search area (approximately 300px)
          setListHeight(Math.max(400, rect.height - 300));
        }
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

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
  const getFilteredResults = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return [];
    const query = debouncedSearchQuery.toLowerCase();
    
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
  }, [debouncedSearchQuery, allPlayers, selectedPlayers, selectedNFLTeams]);

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

  // Get unique tournaments from teams
  const uniqueTournaments = useMemo(() => {
    const tournaments = new Set();
    teams.forEach(team => {
      if (team.tournament) {
        tournaments.add(team.tournament);
      }
    });
    return Array.from(tournaments).sort();
  }, [teams]);

  // Filter teams by selected players, NFL teams, tournament, and status
  const filteredTeams = useMemo(() => {
    let filtered = teams.filter(team => {
      // Tournament filter
      if (selectedTournament && team.tournament !== selectedTournament) {
        return false;
      }
      
      // Status filter
      if (selectedStatus) {
        const teamStatus = team.status || 'active';
        if (teamStatus !== selectedStatus) {
          return false;
        }
      }
      
      // Player filter
      if (selectedPlayers.length > 0) {
        const matchesPlayerFilter = selectedPlayers.every(selectedPlayer => {
          return Object.values(team.players).some(positionPlayers =>
            positionPlayers.some(player => player.name === selectedPlayer.name)
          );
        });
        if (!matchesPlayerFilter) return false;
      }
      
      // NFL Team filter
      if (selectedNFLTeams.length > 0) {
        const matchesNFLTeamFilter = selectedNFLTeams.some(selectedNFLTeam => {
          return Object.values(team.players).some(positionPlayers =>
            positionPlayers.some(player => player.team === selectedNFLTeam.name)
          );
        });
        if (!matchesNFLTeamFilter) return false;
      }
      
      return true;
    });

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'tournament_asc':
          const tournamentCompare = (a.tournament || '').localeCompare(b.tournament || '');
          return tournamentCompare !== 0 ? tournamentCompare : a.name.localeCompare(b.name);
        case 'tournament_desc':
          const tournamentCompareDesc = (b.tournament || '').localeCompare(a.tournament || '');
          return tournamentCompareDesc !== 0 ? tournamentCompareDesc : a.name.localeCompare(b.name);
        case 'date_newest':
          // Assuming teams have a createdAt or draftDate field
          const dateA = a.draftDate || a.createdAt || 0;
          const dateB = b.draftDate || b.createdAt || 0;
          return dateB - dateA;
        case 'date_oldest':
          const dateAOld = a.draftDate || a.createdAt || 0;
          const dateBOld = b.draftDate || b.createdAt || 0;
          return dateAOld - dateBOld;
        default:
          return 0;
      }
    });

    return sorted;
  }, [teams, selectedPlayers, selectedNFLTeams, sortBy]);

  // Handle sort change
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setShowSortMenu(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('teamsSortBy', newSort);
    }
  };

  const sortOptions = [
    { value: 'name_asc', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
    { value: 'tournament_asc', label: 'Tournament (A-Z)' },
    { value: 'tournament_desc', label: 'Tournament (Z-A)' },
    { value: 'date_newest', label: 'Date (Newest)' },
    { value: 'date_oldest', label: 'Date (Oldest)' },
  ];

  const currentSortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || 'Name (A-Z)';

  return (
    <div className="h-full bg-[#101927] text-white flex flex-col">
      {/* Search Bar and Sort */}
      <div className="p-4 border-b border-gray-700 space-y-3">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search for player(s)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(e.target.value.trim().length > 0);
            }}
            onFocus={() => setShowDropdown(debouncedSearchQuery.trim().length > 0)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowDropdown(false);
                setSearchQuery('');
              }
            }}
            className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
            aria-label="Search for players or teams"
            aria-describedby="search-description"
          />
          <span id="search-description" className="sr-only">
            Search for players or NFL teams to filter your teams list
          </span>
          
          {showDropdown && getFilteredResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {getFilteredResults.map((item) => (
                <button
                  key={`${item.type}-${item.name}`}
                  onClick={() => handleSelection(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelection(item);
                    }
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors text-sm border-b border-gray-700 last:border-b-0 focus:outline-none focus:bg-gray-700"
                  aria-label={`Select ${item.type === 'player' ? 'player' : 'NFL team'} ${item.type === 'player' ? item.name : item.fullName}`}
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
        
        {/* Clear All Filters Button */}
        {(selectedPlayers.length > 0 || selectedNFLTeams.length > 0 || selectedTournament || selectedStatus) && (
          <button
            onClick={() => {
              setSelectedPlayers([]);
              setSelectedNFLTeams([]);
              setSelectedTournament(null);
              setSelectedStatus(null);
            }}
            className="text-xs text-gray-400 hover:text-white transition-colors underline"
          >
            Clear all filters
          </button>
        )}
        
        {/* Filter Buttons Row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tournament Filter */}
          {uniqueTournaments.length > 0 && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowTournamentFilter(!showTournamentFilter);
                  setShowStatusFilter(false);
                  setShowSortMenu(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
                  selectedTournament
                    ? 'bg-blue-600/20 text-blue-400 border-blue-600/50'
                    : 'bg-gray-800/60 hover:bg-gray-800 text-gray-300 border-gray-700/50'
                }`}
                aria-label="Filter by tournament"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>{selectedTournament || 'Tournament'}</span>
                {selectedTournament && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTournament(null);
                    }}
                    className="ml-1 hover:text-white"
                    aria-label="Clear tournament filter"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </button>
              
              {showTournamentFilter && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowTournamentFilter(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 overflow-hidden min-w-[200px]">
                    <button
                      onClick={() => {
                        setSelectedTournament(null);
                        setShowTournamentFilter(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                        !selectedTournament
                          ? 'bg-blue-600/20 text-blue-400'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      All Tournaments
                    </button>
                    {uniqueTournaments.map((tournament) => (
                      <button
                        key={tournament}
                        onClick={() => {
                          setSelectedTournament(tournament);
                          setShowTournamentFilter(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                          selectedTournament === tournament
                            ? 'bg-blue-600/20 text-blue-400'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {tournament}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Status Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowStatusFilter(!showStatusFilter);
                setShowTournamentFilter(false);
                setShowSortMenu(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
                selectedStatus
                  ? 'bg-blue-600/20 text-blue-400 border-blue-600/50'
                  : 'bg-gray-800/60 hover:bg-gray-800 text-gray-300 border-gray-700/50'
              }`}
              aria-label="Filter by status"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{selectedStatus ? selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1) : 'Status'}</span>
              {selectedStatus && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStatus(null);
                  }}
                  className="ml-1 hover:text-white"
                  aria-label="Clear status filter"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </button>
            
            {showStatusFilter && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowStatusFilter(false)}
                />
                <div className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 overflow-hidden min-w-[150px]">
                  {['active', 'eliminated', 'pending'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setSelectedStatus(status === selectedStatus ? null : status);
                        setShowStatusFilter(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                        selectedStatus === status
                          ? 'bg-blue-600/20 text-blue-400'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          
          {/* Sort Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSortMenu(!showSortMenu);
                setShowTournamentFilter(false);
                setShowStatusFilter(false);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800/60 hover:bg-gray-800 rounded-lg text-sm text-gray-300 border border-gray-700/50 transition-colors"
              aria-label="Sort teams"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              <span>{currentSortLabel}</span>
              <svg className={`w-4 h-4 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          
          {showSortMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowSortMenu(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 overflow-hidden">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                      sortBy === option.value
                        ? 'bg-blue-600/20 text-blue-400'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      {sortBy === option.value && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
          </div>
        </div>
      </div>

      {/* Teams List */}
      <div 
        ref={listContainerRef}
        className="flex-1 overflow-hidden px-4 pt-4 scrollable-list"
        role="list"
        aria-label="Teams list"
      >
        {filteredTeams.length === 0 ? (
          <div className="text-center py-8" role="status" aria-live="polite">
            <p className="text-gray-400">
              {selectedPlayers.length > 0 || selectedNFLTeams.length > 0 || selectedTournament || selectedStatus
                ? 'No teams match your filters'
                : 'No teams found'}
            </p>
            {(selectedPlayers.length > 0 || selectedNFLTeams.length > 0 || selectedTournament || selectedStatus) && (
              <button
                onClick={() => {
                  setSelectedPlayers([]);
                  setSelectedNFLTeams([]);
                  setSelectedTournament(null);
                  setSelectedStatus(null);
                }}
                className="mt-2 text-sm text-blue-400 hover:text-blue-300 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : filteredTeams.length > 20 ? (
          // Use virtual scrolling for lists with more than 20 teams
          <List
            height={listHeight}
            itemCount={filteredTeams.length}
            itemSize={120}
            itemData={{
              teams: filteredTeams,
              onTeamSelect,
              getTotalPlayers,
              getTotalProjectedPoints,
              getTeamByeWeeks
            }}
            width="100%"
            style={{ paddingRight: '16px' }}
          >
            {TeamCardRow}
          </List>
        ) : (
          // Use regular rendering for smaller lists (better for accessibility and simpler)
          <div className="space-y-3" role="list">
            {filteredTeams.map((team) => {
              const totalPlayers = getTotalPlayers(team);
              const totalProjectedPoints = getTotalProjectedPoints(team);
              const byeWeeks = getTeamByeWeeks(team);
              const status = team.status || 'active';
              
              if (!team || !team.players) {
                return null;
              }
              
              return (
                <div 
                  key={team.id}
                  className="bg-gray-800/40 rounded-lg hover:bg-gray-700/60 transition-all duration-200 cursor-pointer border border-gray-700/30 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:outline-none"
                  onClick={() => onTeamSelect(team)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onTeamSelect(team);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View team ${team.name}`}
                >
                  <div className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white truncate text-base">{team.name}</h3>
                          {status === 'eliminated' && (
                            <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-red-600/20 text-red-400 rounded">
                              Eliminated
                            </span>
                          )}
                          {status === 'pending' && (
                            <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-yellow-600/20 text-yellow-400 rounded">
                              Pending
                            </span>
                          )}
                        </div>
                        {team.tournament && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-xs text-blue-400 font-medium">{team.tournament}</span>
                          </div>
                        )}
                      </div>
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>{totalPlayers} players</span>
                      </div>
                      {totalProjectedPoints > 0 && (
                        <div className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span>{Math.round(totalProjectedPoints)} pts</span>
                        </div>
                      )}
                      {byeWeeks.length > 0 && (
                        <div className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Byes: {byeWeeks.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

