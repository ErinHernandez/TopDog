/**
 * Player List - iOS Optimized
 * 
 * Touch-friendly player list with iOS design patterns:
 * - Large touch targets (44px minimum)
 * - Smooth scrolling with momentum
 * - iOS-style list items
 * - Swipe gestures for actions
 */

import React, { useRef, useEffect, useState } from 'react';
import { MOBILE_SIZES, PLATFORM_SPECIFIC } from '../../shared/constants/mobileSizes';
import { createQueueGradient, createTeamGradient } from '../../../../../../lib/gradientUtils';
import { loadCustomRankings, getCustomPlayerRanking } from '../../../../../../lib/customRankings';
// Note: Scrollbar hiding is now handled globally in globals.css
import PositionBadge from './PositionBadge';
import PlayerExpandedCard from '../../../../../../components/shared/PlayerExpandedCard';
import { POSITIONS } from '../../../constants/positions';

export default function PlayerListApple({ 
  players = [], 
  onDraftPlayer, 
  onQueuePlayer, 
  onPlayerSelect,
  scrollRef,
  isMyTurn = false,
  queuedPlayers = []
}) {
  const localScrollRef = useRef(null);
  const scrollContainer = scrollRef || localScrollRef;
  const [activeFilters, setActiveFilters] = useState([]); // array of selected positions
  const [searchTerm, setSearchTerm] = useState(''); // search term for player names
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc', 'desc', 'name_asc', 'name_desc'
  const [customRankings, setCustomRankings] = useState([]);
  const [expandedPlayer, setExpandedPlayer] = useState(null); // track which player is expanded

  // Format player names with abbreviations for specific players
  const formatPlayerName = (playerName) => {
    if (!playerName) return playerName;
    
    // Convert to lowercase for comparison
    const lowerName = playerName.toLowerCase();
    
    // Check for specific players and abbreviate first names
    if (lowerName.includes('clyde') && lowerName.includes('edwards')) {
      return playerName.replace(/clyde/i, 'C.');
    }
    if (lowerName.includes('rahmondre')) {
      return playerName.replace(/rahmondre/i, 'R.');
    }
    if (lowerName.includes('anthony') && lowerName.includes('richardson')) {
      return playerName.replace(/anthony/i, 'A.');
    }
    
    return playerName;
  };

  // Load custom rankings on component mount
  useEffect(() => {
    const rankings = loadCustomRankings();
    
    // Add fake rankings for dev purposes
    const fakeRankings = [
      { playerName: "Ja'Marr Chase", rank: 1 },
      { playerName: "Justin Jefferson", rank: 2 },
      { playerName: "Tyreek Hill", rank: 3 },
      { playerName: "Davante Adams", rank: 4 },
      { playerName: "Stefon Diggs", rank: 5 },
      { playerName: "Cooper Kupp", rank: 6 },
      { playerName: "Mike Evans", rank: 7 },
      { playerName: "Keenan Allen", rank: 8 },
      { playerName: "A.J. Brown", rank: 9 },
      { playerName: "DK Metcalf", rank: 10 },
      { playerName: "CeeDee Lamb", rank: 11 },
      { playerName: "Amari Cooper", rank: 12 },
      { playerName: "DeAndre Hopkins", rank: 13 },
      { playerName: "Calvin Ridley", rank: 14 },
      { playerName: "Chris Godwin", rank: 15 },
      { playerName: "Amon-Ra St. Brown", rank: 16 },
      { playerName: "Puka Nacua", rank: 17 },
      { playerName: "Garrett Wilson", rank: 18 },
      { playerName: "DJ Moore", rank: 19 },
      { playerName: "Jaylen Waddle", rank: 20 },
      { playerName: "Bijan Robinson", rank: 21 },
      { playerName: "Christian McCaffrey", rank: 22 },
      { playerName: "Austin Ekeler", rank: 23 },
      { playerName: "Saquon Barkley", rank: 24 },
      { playerName: "Josh Jacobs", rank: 25 },
      { playerName: "Nick Chubb", rank: 26 },
      { playerName: "Derrick Henry", rank: 27 },
      { playerName: "Aaron Jones", rank: 28 },
      { playerName: "Joe Mixon", rank: 29 },
      { playerName: "Alvin Kamara", rank: 30 },
      { playerName: "Josh Allen", rank: 31 },
      { playerName: "Lamar Jackson", rank: 32 },
      { playerName: "Jalen Hurts", rank: 33 },
      { playerName: "Patrick Mahomes", rank: 34 },
      { playerName: "Joe Burrow", rank: 35 },
      { playerName: "Dak Prescott", rank: 36 },
      { playerName: "Tua Tagovailoa", rank: 37 },
      { playerName: "Justin Herbert", rank: 38 },
      { playerName: "Russell Wilson", rank: 39 },
      { playerName: "Kirk Cousins", rank: 40 },
      { playerName: "Travis Kelce", rank: 41 },
      { playerName: "Mark Andrews", rank: 42 },
      { playerName: "T.J. Hockenson", rank: 43 },
      { playerName: "George Kittle", rank: 44 },
      { playerName: "Kyle Pitts", rank: 45 },
      { playerName: "Darren Waller", rank: 46 },
      { playerName: "Dallas Goedert", rank: 47 },
      { playerName: "Evan Engram", rank: 48 },
      { playerName: "Pat Freiermuth", rank: 49 },
      { playerName: "David Njoku", rank: 50 }
    ];
    
    // Combine real rankings with fake ones (fake ones take priority for dev)
    const combinedRankings = [...fakeRankings, ...rankings];
    setCustomRankings(combinedRankings);
  }, []);



  // Position colors (same as desktop)
  const getPositionColor = (position) => {
    const colors = {
      QB: '#F472B6',
      RB: '#0fba80', 
      WR: '#FBBF25',
      TE: '#7C3AED'
    };
    return colors[position] || '#6b7280';
  };

  // Handle position filter clicks - allow multiple positions
  const handlePositionFilter = (position) => {
    setActiveFilters(prev => {
      if (prev.includes(position)) {
        // Remove position if already selected
        return prev.filter(p => p !== position);
      } else {
        // Add position if not selected
        return [...prev, position];
      }
    });
  };

  // Handle clear all filters and search
  const handleClearAll = () => {
    setActiveFilters([]);
    setSearchTerm('');
    setExpandedPlayer(null); // Close any expanded player
  };

  // Handle player expansion - only one player can be expanded at a time
  const handlePlayerExpansion = (playerName) => {
    setExpandedPlayer(prevExpanded => {
      const newExpanded = prevExpanded === playerName ? null : playerName;
      
      // If expanding a player, scroll that player to top of viewable area
      if (newExpanded) {
        setTimeout(() => {
          // Find the expanded player element
          const playerElement = document.querySelector(`[data-player-name="${newExpanded}"]`);
          if (playerElement && scrollContainer?.current) {
            const containerRect = scrollContainer.current.getBoundingClientRect();
            const playerRect = playerElement.getBoundingClientRect();
            const scrollTop = scrollContainer.current.scrollTop;
            
            // Calculate position to scroll the player to the top of the viewable area
            const targetScrollTop = scrollTop + (playerRect.top - containerRect.top);
            
            scrollContainer.current.scrollTo({
              top: targetScrollTop,
              behavior: 'smooth'
            });
          }
        }, 100);
      }
      
      return newExpanded;
    });
  };


  // Handle ADP sorting - 2-way cycle (ADP only)
  const handleADPSort = () => {
    setSortDirection(prev => {
      switch(prev) {
        case 'asc': return 'desc';
        case 'desc': return 'asc';
        default: return 'asc';
      }
    });
  };

  // Handle RANK sorting
  const handleRankSort = () => {
    setSortDirection(prev => {
      switch(prev) {
        case 'rank_asc': return 'rank_desc';
        case 'rank_desc': return 'rank_asc';
        default: return 'rank_asc';
      }
    });
  };

  // Handle PROJ sorting
  const handleProjSort = () => {
    setSortDirection(prev => {
      switch(prev) {
        case 'proj_asc': return 'proj_desc';
        case 'proj_desc': return 'proj_asc';
        default: return 'proj_asc';
      }
    });
  };

  // Data Quality Check - Fix duplicate ranks automatically for dev
  const fixDuplicateRanks = (playerList) => {
    const usedRanks = new Set();
    const usedNames = new Set();
    
    // Fix duplicate ADP values and ensure unique player names
    playerList.forEach((player, index) => {
      // Handle duplicate player names
      if (usedNames.has(player.name)) {
        console.warn(`⚠️ Duplicate player name found: ${player.name} - keeping first instance`);
        return; // Skip duplicate names
      }
      usedNames.add(player.name);
      
      let adp = parseFloat(player.adp || 0);
      
      // If ADP is 0 or invalid, assign a reasonable default based on index
      if (adp <= 0 || isNaN(adp)) {
        adp = index + 1;
      }
      
      // If this rank is already used, find the next available one
      let adjustedAdp = adp;
      while (usedRanks.has(adjustedAdp)) {
        adjustedAdp += 0.01; // Smaller increment for better precision
      }
      
      usedRanks.add(adjustedAdp);
      player.adp = adjustedAdp.toFixed(2);
    });
    
    return true;
  };

  // Clean up custom rankings - remove duplicates and invalid entries
  const cleanCustomRankings = (rankings) => {
    if (!Array.isArray(rankings)) return [];
    
    const seen = new Set();
    const cleaned = rankings.filter(playerName => {
      // Remove empty, null, or duplicate entries
      if (!playerName || typeof playerName !== 'string' || seen.has(playerName)) {
        return false;
      }
      seen.add(playerName);
      return true;
    });
    
    console.log(`🧹 Cleaned custom rankings: ${rankings.length} → ${cleaned.length} entries`);
    return cleaned;
  };



  // Remove duplicate players from the list
  const deduplicatedPlayers = React.useMemo(() => {
    const seen = new Map();
    const unique = [];
    
    players.forEach(player => {
      if (!player || !player.name) return;
      
      const key = player.name.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.set(key, true);
        unique.push(player);
      } else {
        console.warn(`🚫 Removing duplicate player: ${player.name}`);
      }
    });
    
    return unique;
  }, [players]);

  // Fix duplicate ranks when players data changes
  React.useEffect(() => {
    if (deduplicatedPlayers.length > 0) {
      fixDuplicateRanks(deduplicatedPlayers);
    }
  }, [deduplicatedPlayers]);

  // Clean custom rankings when they change
  React.useEffect(() => {
    if (customRankings.length > 0) {
      const cleaned = cleanCustomRankings(customRankings);
      if (cleaned.length !== customRankings.length) {
        setCustomRankings(cleaned);
      }
    }
  }, [customRankings]);

  // Filter and sort players
  const filteredPlayers = React.useMemo(() => {
    let filtered = deduplicatedPlayers;
    
    // Apply position filters (multiple positions allowed)
    if (activeFilters.length > 0) {
      filtered = filtered.filter(player => activeFilters.includes(player.position));
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(player => {
        const fullTeamName = teamNames[player.team] || '';
        const formattedName = formatPlayerName(player.name);
        return player.name.toLowerCase().includes(search) ||
               formattedName.toLowerCase().includes(search) ||
               player.team.toLowerCase().includes(search) ||
               fullTeamName.toLowerCase().includes(search);
      });
    }
    
    // Sort by different criteria
    return filtered.sort((a, b) => {
      switch(sortDirection) {
        case 'asc':
          const adpA = Math.round(parseFloat(a.adp)) || 999;
          const adpB = Math.round(parseFloat(b.adp)) || 999;
          return adpA - adpB;
        case 'desc':
          const adpA2 = Math.round(parseFloat(a.adp)) || 999;
          const adpB2 = Math.round(parseFloat(b.adp)) || 999;
          return adpB2 - adpA2;
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'rank_asc':
          const rankA = getPlayerCustomRank(a.name, customRankings) || 999;
          const rankB = getPlayerCustomRank(b.name, customRankings) || 999;
          return rankA - rankB;
        case 'rank_desc':
          const rankA2 = getPlayerCustomRank(a.name, customRankings) || 999;
          const rankB2 = getPlayerCustomRank(b.name, customRankings) || 999;
          return rankB2 - rankA2;
        case 'proj_asc':
          const projA = parseFloat(a.projectedPoints) || (a.name.charCodeAt(0) + 100);
          const projB = parseFloat(b.projectedPoints) || (b.name.charCodeAt(0) + 100);
          return projA - projB;
        case 'proj_desc':
          const projA2 = parseFloat(a.projectedPoints) || (a.name.charCodeAt(0) + 100);
          const projB2 = parseFloat(b.projectedPoints) || (b.name.charCodeAt(0) + 100);
          return projB2 - projA2;
        default:
          return 0;
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- customRankings handled separately
  }, [deduplicatedPlayers, activeFilters, searchTerm, sortDirection]);

  return (
    <>
      <div className="h-full flex flex-col">
            {/* Position Filter Buttons with Counts Inside */}
      <div style={{ marginTop: '12px' }}>
        <div className="flex w-full">
          {POSITIONS.map(position => {
            const positionColor = getPositionColor(position);
            const isActive = activeFilters.includes(position);
            
            return (
              <button
                key={position}
                onClick={() => handlePositionFilter(position)}
                className="flex-1 py-1 text-sm font-medium flex items-center justify-center"
                style={{ 
                  minHeight: MOBILE_SIZES.TOUCH_TARGET_MIN,
                  borderRadius: PLATFORM_SPECIFIC.IOS.BORDER_RADIUS,
                  border: `3px solid ${positionColor}`,
                  backgroundColor: isActive ? positionColor : 'transparent',
                  color: 'white',
                  margin: '2px',
                  height: '44px'
                }}
              >
                <span style={{ fontSize: '14px', marginRight: '4px' }}>
                {position}
                </span>
                <span 
                  className="font-sans font-bold"
                  style={{ 
                    fontSize: '13px',
                    color: 'white',
                    lineHeight: '1'
                  }}
                >
                  - 0
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar with Clear Button */}
      <div className="flex items-center gap-2 mx-2 mt-3 mb-1" style={{ marginTop: '12px' }}>
        <input
          type="search"
          inputMode="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleClearAll}
          className="py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center"
          style={{ 
            width: 'calc(22.5% - 6px)' // 10% smaller than TE button (25% * 0.9 = 22.5%)
          }}
        >
          Clear
        </button>
      </div>

      {/* RANK, QUEUE, PROJ and ADP Headers */}
      <div className="relative flex justify-center items-center" style={{ height: '40px' }}>
        {/* RANK Header - Moved to left */}
        {true && (
          <div
            className={`text-xs font-medium flex items-center justify-center absolute cursor-pointer ${
              (sortDirection === 'rank_asc' || sortDirection === 'rank_desc') ? 'text-white font-bold' : 'text-gray-400'
            }`}
            style={{ 
              fontSize: (sortDirection === 'rank_asc' || sortDirection === 'rank_desc') ? '14px' : '13px',
              left: '14px', // Centered over RANK column
              top: '12px',
              width: '28px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onClick={handleRankSort}
          >
            RANK
          </div>
        )}


        {/* PROJ Header */}
        <div
          className={`text-xs font-medium flex items-center justify-center absolute cursor-pointer ${
            (sortDirection === 'proj_asc' || sortDirection === 'proj_desc') ? 'text-white font-bold' : 'text-gray-400'
          }`}
          style={{ 
            fontSize: (sortDirection === 'proj_asc' || sortDirection === 'proj_desc') ? '14px' : '13px',
            right: '70px', // Perfectly centered over PROJ column
            top: '12px',
            width: (sortDirection === 'proj_asc' || sortDirection === 'proj_desc') ? '29px' : '28px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          onClick={handleProjSort}
        >
          PROJ
        </div>
        
        {/* ADP Header */}
        <div
          className={`text-xs font-medium flex items-center justify-center absolute cursor-pointer ${
            (sortDirection === 'asc' || sortDirection === 'desc' || sortDirection === 'name_asc' || sortDirection === 'name_desc') ? 'text-white font-bold' : 'text-gray-400'
          }`}
          style={{ 
            fontSize: (sortDirection === 'asc' || sortDirection === 'desc' || sortDirection === 'name_asc' || sortDirection === 'name_desc') ? '16px' : '15px',
            right: '9px', // Move 1px left from 8px (8px + 1px = 9px)
            top: '12px',
            width: '40px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          onClick={handleADPSort}
        >
          ADP
        </div>
      </div>

      {/* Column Header */}
      <div className="px-1 py-2 border-b border-white/10" style={{ marginTop: '-13px' }}>
      </div>

      {/* Player List */}
      <div 
        ref={scrollContainer}
        className="flex-1 overflow-y-auto player-list-scroll"
        style={{
          WebkitOverflowScrolling: 'touch', // iOS momentum scrolling
          overscrollBehavior: 'contain',
          paddingBottom: 'env(safe-area-inset-bottom)', // Extend to bottom of screen
          minHeight: 'calc(100vh - 192px)', // Ensure it reaches near bottom (8px taller)
          maxHeight: 'calc(100vh - 142px)', // Allow scrolling if content exceeds (8px taller)
          marginTop: '-6px' // Move scrolling container up 6px
        }}
      >
        <div className="px-1 pb-8">
          {filteredPlayers.map((player, index) => (
            <PlayerRowApple
              key={`${player.name}-${index}`}
              player={player}
              onDraft={onDraftPlayer}
              onQueue={onQueuePlayer}
              onSelect={onPlayerSelect}
              sortDirection={sortDirection}
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
    </>
  );
}

// Helper function to get custom rank for a player (moved to global scope)
const getPlayerCustomRank = (playerName, customRankings = []) => {
  const rank = getCustomPlayerRanking(playerName, customRankings);
  return rank === '-' ? null : parseInt(rank);
};

/**
 * Individual Player Row - iOS Style
 */
function PlayerRowApple({ player, onDraft, onQueue, onSelect, sortDirection, isMyTurn, isFirstPlayer, isLastPlayer, customRankings, queuedPlayers, isExpanded, onToggleExpansion }) {
  const positionColor = getPositionColor(player.position);

  // Format player names with abbreviations for specific players
  const formatPlayerName = (playerName) => {
    if (!playerName) return playerName;
    
    // Convert to lowercase for comparison
    const lowerName = playerName.toLowerCase();
    
    // Check for specific players and abbreviate first names
    if (lowerName.includes('clyde') && lowerName.includes('edwards')) {
      return playerName.replace(/clyde/i, 'C.');
    }
    if (lowerName.includes('rahmondre')) {
      return playerName.replace(/rahmondre/i, 'R.');
    }
    if (lowerName.includes('anthony') && lowerName.includes('richardson')) {
      return playerName.replace(/anthony/i, 'A.');
    }
    
    return playerName;
  };

  // Get team colors for gradient background
  const getTeamColors = (team) => {
    const teamColors = {
      'ARI': ['#97233F', '#000000'], // Cardinals: Red, Black
      'ATL': ['#A71930', '#000000'], // Falcons: Red, Black
      'BAL': ['#241773', '#000000'], // Ravens: Purple, Black
      'BUF': ['#00338D', '#C60C30'], // Bills: Blue, Red
      'CAR': ['#0085CA', '#101820'], // Panthers: Blue, Black
      'CHI': ['#0B162A', '#C83803'], // Bears: Navy, Orange
      'CIN': ['#FB4F14', '#000000'], // Bengals: Orange, Black
      'CLE': ['#311D00', '#FF3C00'], // Browns: Brown, Orange
      'DAL': ['#003594', '#869397'], // Cowboys: Blue, Silver
      'DEN': ['#FB4F14', '#002244'], // Broncos: Orange, Navy
      'DET': ['#0076B6', '#B0B7BC'], // Lions: Blue, Silver
      'GB': ['#203731', '#FFB612'], // Packers: Green, Gold
      'HOU': ['#03202F', '#A71930'], // Texans: Navy, Red
      'IND': ['#002C5F', '#A2AAAD'], // Colts: Blue, Silver
      'JAX': ['#101820', '#D7A22A'], // Jaguars: Black, Gold
      'KC': ['#E31837', '#FFB81C'], // Chiefs: Red, Gold
      'LV': ['#000000', '#A5ACAF'], // Raiders: Black, Silver
      'LAC': ['#0080C6', '#FFC20E'], // Chargers: Blue, Gold
      'LAR': ['#003594', '#FFA300'], // Rams: Blue, Gold
      'MIA': ['#008E97', '#FC4C02'], // Dolphins: Aqua, Orange
      'MIN': ['#4F2683', '#FFC62F'], // Vikings: Purple, Gold
      'NE': ['#002244', '#C60C30'], // Patriots: Navy, Red
      'NO': ['#101820', '#D3BC8D'], // Saints: Black, Gold
      'NYG': ['#FF4500', '#0B2265'], // Giants: Bright Orange-Red, Blue
      'NYJ': ['#125740', '#000000'], // Jets: Green, Black
      'PHI': ['#004C54', '#A5ACAF'], // Eagles: Green, Silver
      'PIT': ['#FFB612', '#101820'], // Steelers: Gold, Black
      'SF': ['#AA0000', '#B3995D'], // 49ers: Red, Gold
      'SEA': ['#002244', '#69BE28'], // Seahawks: Navy, Green
      'TB': ['#D50A0A', '#FF7900'], // Buccaneers: Red, Orange
      'TEN': ['#0C2340', '#4B92DB'], // Titans: Navy, Blue
      'WAS': ['#5A1414', '#FFB612']  // Commanders: Burgundy, Gold
    };
    
    return teamColors[team?.toUpperCase()] || ['#374151', '#1F2937']; // Default gray gradient
  };

  const handleQueue = (e) => {
    e.stopPropagation();
    const isCurrentlyQueued = queuedPlayers?.some(queuedPlayer => queuedPlayer.name === player.name);
    console.log(`Queue button clicked for ${player.name}, currently queued: ${isCurrentlyQueued}`);
    onQueue?.(player);
  };



  const toggleDropdown = (e) => {
    e.stopPropagation();
    onToggleExpansion?.(player.name);
  };

  const handleDraft = (e) => {
    e.stopPropagation();
    onDraft?.(player);
  };

  return (
    <div className="w-full relative" style={{ paddingBottom: isLastPlayer ? '16px' : '0px' }} data-player-name={player.name}>

      {/* Main Player Row */}
      <div 
        className="flex items-center active:bg-white/5 hover:bg-white/3 relative overflow-hidden border-b border-white/10 cursor-pointer transition-colors duration-200"
        style={{ 
          minHeight: '40px', // Fixed height for all cells - matches QueuePage
          height: '40px', // Ensure consistent height
          backgroundColor: '#1f2833',
          zIndex: 1,
        }}
        onClick={toggleDropdown}
      >
        {/* RANK Column - Moved to left (where queue button was) */}
        {true && (
          <div className="flex items-center relative z-10" style={{ width: '10%', marginLeft: '10px' }}>
            <div
              className="text-center text-xs font-sans text-gray-400 relative z-10"
              style={{
                fontSize: '13px',
                width: '28px',
                paddingLeft: '4px',
                paddingRight: '8px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative'
              }}
            >
              {getPlayerCustomRank(player.name, customRankings) || '-'}
            </div>
          </div>
        )}



      {/* Player Info */}
        <div className="flex-1 min-w-0 relative z-10" style={{ marginTop: '0px', marginLeft: '30px' }}>
          <div className="flex-1 min-w-0">
        <div 
               className="font-medium text-white"
            style={{ 
                  fontSize: '13px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginLeft: '-20px' // Move player names 10px right from previous position (-30px + 10px = -20px)
            }}
        >
          {(() => {
            const name = formatPlayerName(player.name);
            const nameParts = name.split(' ');
            if (nameParts.length >= 2) {
              // Show full first name
              const firstName = nameParts[0];
              const lastName = nameParts.slice(1).join(' ');
              return `${firstName} ${lastName}`;
            }
            return name;
          })()}
        </div>
        {/* Players Sub 2.0: Badge-First Architecture */}
        <div style={{ 
          fontSize: '11.5px',
          marginTop: '1px',
          marginLeft: '-20px', // Align under player name (moved 10px right from previous position)
          display: 'flex',
          alignItems: 'center'
        }}>
          {/* Badge Container - Isolated positioning */}
          <div style={{
            position: 'relative',
            width: '25px',
            height: '16px',
            marginRight: '6px',
            flexShrink: 0 // Prevent badge from shrinking
          }}>
            <PositionBadge position={player.position} />
          </div>
          
          {/* Team and Bye Week Info */}
          <span className="text-xs text-gray-400">
            {(() => {
              const byeWeeks = {
                'ARI': 11, 'ATL': 12, 'BAL': 14, 'BUF': 12, 'CAR': 11, 'CHI': 7,
                'CIN': 12, 'CLE': 10, 'DAL': 7, 'DEN': 14, 'DET': 5, 'GB': 10,
                'HOU': 14, 'IND': 14, 'JAX': 12, 'KC': 6, 'LV': 10, 'LAC': 5,
                'LAR': 6, 'MIA': 6, 'MIN': 6, 'NE': 14, 'NO': 12, 'NYG': 11,
                'NYJ': 12, 'PHI': 5, 'PIT': 9, 'SF': 9, 'SEA': 10, 'TB': 11,
                'TEN': 5, 'WAS': 14
              };
              const byeWeek = byeWeeks[player.team] || 'TBD';
              return `${player.team} (${byeWeek})`;
            })()}
          </span>
        </div>
          </div>
        </div>

        {/* New Queue Button */}
        <div
          style={{
            position: 'relative',
            right: '44px',
            zIndex: 10
          }}
        >
          <div
            onClick={handleQueue}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: queuedPlayers?.some(queuedPlayer => queuedPlayer.name === player.name) ? '2px solid #ffffff' : '2px solid #6b7280',
              backgroundColor: queuedPlayers?.some(queuedPlayer => queuedPlayer.name === player.name) ? '#6b7280' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div
              style={{
                color: queuedPlayers?.some(queuedPlayer => queuedPlayer.name === player.name) ? '#ffffff' : '#ffffff',
                fontSize: '18px',
                fontWeight: 'normal',
                lineHeight: '1',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontFamily: 'Arial, sans-serif',
                textAlign: 'center',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                userSelect: 'none',
                pointerEvents: 'none'
              }}
            >
              {queuedPlayers?.some(queuedPlayer => queuedPlayer.name === player.name) ? '-' : '+'}
            </div>
          </div>
        </div>

        {/* PROJ Column */}
        <div
          className="text-center text-xs font-sans text-gray-400 relative z-10"
          style={{
            fontSize: '13px',
            width: '28px',
            paddingLeft: '4px',
            paddingRight: '8px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            right: '18px' // Move 4px more right to align under header
          }}
        >
          {parseFloat(player.projectedPoints) || (player.name.charCodeAt(0) + 100)}
        </div>

                {/* ADP (moved right) */}
        <div
          className="text-center text-xs font-sans text-gray-400 absolute z-10"
          style={{
            fontSize: '13px',
            width: '40px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            right: '6px'
          }}
        >
          {parseFloat(player.adp || 0).toFixed(1)}
        </div>

        {/* Dropdown Button (invisible but functional) */}
        <div className="flex items-center justify-center relative z-10" style={{ width: '15%', marginRight: '-9px' }}>
          <button
            onClick={toggleDropdown}
            className="p-2 text-transparent"
            style={{ 
              minHeight: MOBILE_SIZES.TOUCH_TARGET_MIN,
              borderRadius: PLATFORM_SPECIFIC.IOS.BORDER_RADIUS
            }}
          >
            {/* No visible content, but button remains functional */}
          </button>
        </div>
      </div>

      {/* Dropdown Content - Uses shared PlayerExpandedCard component */}
        {isExpanded && (
        <div className="mx-2 mt-3 mb-3" style={{ animation: 'slideDown 0.2s ease-out' }}>
          <PlayerExpandedCard
            player={player}
            isMyTurn={isMyTurn}
            onDraft={handleDraft}
            onClose={() => onToggleExpansion?.(player.name)}
          />
        </div>
      )}
    </div>
  );
}

// Helper function for position colors
function getPositionColor(position) {
  const colors = {
    QB: '#F472B6',
    RB: '#0fba80', 
    WR: '#FBBF25',
    TE: '#7C3AED'
  };
  return colors[position] || '#6b7280';
}

// Helper function to convert team abbreviations to full names
function getFullTeamName(abbreviation) {
  const teamNames = {
    'ARI': 'Arizona Cardinals',
    'ATL': 'Atlanta Falcons',
    'BAL': 'Baltimore Ravens',
    'BUF': 'Buffalo Bills',
    'CAR': 'Carolina Panthers',
    'CHI': 'Chicago Bears',
    'CIN': 'Cincinnati Bengals',
    'CLE': 'Cleveland Browns',
    'DAL': 'Dallas Cowboys',
    'DEN': 'Denver Broncos',
    'DET': 'Detroit Lions',
    'GB': 'Green Bay Packers',
    'HOU': 'Houston Texans',
    'IND': 'Indianapolis Colts',
    'JAX': 'Jacksonville Jaguars',
    'KC': 'Kansas City Chiefs',
    'LV': 'Las Vegas Raiders',
    'LAC': 'Los Angeles Chargers',
    'LAR': 'Los Angeles Rams',
    'MIA': 'Miami Dolphins',
    'MIN': 'Minnesota Vikings',
    'NE': 'New England Patriots',
    'NO': 'New Orleans Saints',
    'NYG': 'New York Giants',
    'NYJ': 'New York Jets',
    'PHI': 'Philadelphia Eagles',
    'PIT': 'Pittsburgh Steelers',
    'SF': 'San Francisco 49ers',
    'SEA': 'Seattle Seahawks',
    'TB': 'Tampa Bay Buccaneers',
    'TEN': 'Tennessee Titans',
    'WAS': 'Washington Commanders'
  };
  return teamNames[abbreviation] || abbreviation;
}
