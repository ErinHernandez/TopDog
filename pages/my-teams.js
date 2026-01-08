import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUser } from '../lib/userContext';
import { nflLogoMapping, getNflLogoUrl } from '../lib/nflLogos';
import { getRandomMockDrafters } from '../lib/mockDrafters';
import { PLAYER_POOL } from '../lib/playerPool';
import { getPlayerPhotoUrl } from '../lib/playerPhotos';
import { 
  findTeamByTerm, 
  getTeamFullName, 
  getSearchSuggestions,
  TEAM_SEARCH_MAPPING 
} from '../lib/nflConstants';

// Mock tournaments for demonstration
const tournaments = [
  { name: 'The TopDog', entries: 571480, entryFee: 25, prizes: '$15,000,000', rounds: '1 of 4' },
];

// Team data based on the provided images
const mockTeamData = {
  'The TopDog': {
    'The TopDog (1)': {
      players: {
        QB: [
          { name: 'Jayden Daniels', team: 'WAS', bye: 12, adp: 42.8, pick: 48 },
          { name: 'Joe Burrow', team: 'CIN', bye: 10, adp: 53.9, pick: 72 },
        ],
                  RB: [
            { name: 'Jordan Mason', team: 'MIN', bye: 6, adp: 105.2, pick: 96 },
            { name: 'Bhayshul Tuten', team: 'JAX', bye: 8, adp: 116.6, pick: 97 },
            { name: 'Austin Ekeler', team: 'WAS', bye: 12, adp: 157.8, pick: 121 },
            { name: 'Jarquez Hunter', team: 'LAR', bye: 8, adp: 198.2, pick: 169 },
            { name: 'Jacory Croskey-Merritt', team: 'WAS', bye: 12, adp: 215.2, pick: 192 },
            { name: 'Brashard Smith', team: 'KC', bye: 10, adp: 208.8, pick: 193 },
            { name: 'Jerome Ford', team: 'CLE', bye: 9, adp: 207.0, pick: 216 },
          ],
                  WR: [
            { name: 'Ja\'Marr Chase', team: 'CIN', bye: 10, adp: 1.1, pick: 1 },
            { name: 'Terry McLaurin', team: 'WAS', bye: 12, adp: 27.8, pick: 24 },
            { name: 'Rashee Rice', team: 'KC', bye: 10, adp: 29.7, pick: 25 },
            { name: 'Jerry Jeudy', team: 'CLE', bye: 9, adp: 67.4, pick: 73 },
            { name: 'Rashod Bateman', team: 'BAL', bye: 7, adp: 115.7, pick: 120 },
            { name: 'Alec Pierce', team: 'IND', bye: 11, adp: 170.8, pick: 168 },
          ],
                  TE: [
            { name: 'George Kittle', team: 'SF', bye: 14, adp: 51.6, pick: 49 },
            { name: 'Zach Ertz', team: 'WAS', bye: 12, adp: 166.2, pick: 144 },
            { name: 'Mike Gesicki', team: 'CIN', bye: 10, adp: 172.3, pick: 145 },
          ],
      },
      positionCounts: { QB: 2, RB: 7, WR: 6, TE: 3 }
    },
    'The TopDog (2)': {
      players: {
        QB: [
          { name: 'Baker Mayfield', team: 'TB', bye: 9, adp: 92.4, pick: 94 },
          { name: 'Jared Goff', team: 'DET', bye: 8, adp: 116.7, pick: 118 },
          { name: 'J.J. McCarthy', team: 'MIN', bye: 6, adp: 133.1, pick: 123 },
        ],
        RB: [
          { name: 'Chase Brown', team: 'CIN', bye: 10, adp: 28.3, pick: 22 },
          { name: 'Chuba Hubbard', team: 'CAR', bye: 14, adp: 55.3, pick: 51 },
          { name: 'James Conner', team: 'ARI', bye: 8, adp: 65.8, pick: 70 },
          { name: 'Austin Ekeler', team: 'WAS', bye: 12, adp: 156.6, pick: 147 },
          { name: 'Keaton Mitchell', team: 'BAL', bye: 7, adp: 209.2, pick: 195 },
          { name: 'Jacory Croskey-Merritt', team: 'WAS', bye: 12, adp: 214.9, pick: 214 },
        ],
        WR: [
          { name: 'Justin Jefferson', team: 'MIN', bye: 6, adp: 3.1, pick: 3 },
          { name: 'Mike Evans', team: 'TB', bye: 9, adp: 34.9, pick: 27 },
          { name: 'Jameson Williams', team: 'DET', bye: 8, adp: 43.3, pick: 46 },
          { name: 'Darnell Mooney', team: 'ATL', bye: 5, adp: 85.1, pick: 75 },
          { name: 'Rashod Bateman', team: 'BAL', bye: 7, adp: 111.7, pick: 99 },
        ],
        TE: [
          { name: 'Isaiah Likely', team: 'BAL', bye: 7, adp: 144.9, pick: 142 },
          { name: 'Dallas Goedert', team: 'PHI', bye: 9, adp: 142.1, pick: 166 },
          { name: 'Brenton Strange', team: 'JAX', bye: 8, adp: 161.4, pick: 171 },
          { name: 'Zach Ertz', team: 'WAS', bye: 12, adp: 173.2, pick: 190 },
        ],
      },
      positionCounts: { QB: 3, RB: 6, WR: 5, TE: 4 }
    },
    'The TopDog (3)': {
    players: {
      QB: [
          { name: 'Jaxson Dart', team: 'NYG', bye: 14, adp: 90.3, pick: 78 },
          { name: 'Aaron Rodgers', team: 'PIT', bye: 5, adp: 103.0, pick: 91 },
          { name: 'Daniel Jones', team: 'IND', bye: 11, adp: 114.8, pick: 102 },
          { name: 'Joe Flacco', team: 'CLE', bye: 9, adp: 163.0, pick: 139 },
      ],
      RB: [
          { name: 'Saquon Barkley', team: 'PHI', bye: 9, adp: 7.5, pick: 6 },
          { name: 'Chase Brown', team: 'CIN', bye: 10, adp: 45.2, pick: 54 },
          { name: 'Cam Skattebo', team: 'NYG', bye: 14, adp: 113.6, pick: 115 },
          { name: 'Brashard Smith', team: 'KC', bye: 10, adp: 217.2, pick: 211 },
          { name: 'Jacory Croskey-Merritt', team: 'WAS', bye: 12, adp: 234.0, pick: 222 },
      ],
      WR: [
          { name: 'Malik Nabers', team: 'NYG', bye: 14, adp: 21.8, pick: 19 },
          { name: 'Nico Collins', team: 'HOU', bye: 6, adp: 25.9, pick: 30 },
          { name: 'Rashee Rice', team: 'KC', bye: 10, adp: 56.4, pick: 43 },
          { name: 'Mike Evans', team: 'TB', bye: 9, adp: 63.2, pick: 67 },
          { name: 'Alec Pierce', team: 'IND', bye: 11, adp: 184.4, pick: 187 },
          { name: 'Calvin Austin III', team: 'PIT', bye: 5, adp: 220.3, pick: 235 },
      ],
      TE: [
          { name: 'Jonnu Smith', team: 'PIT', bye: 5, adp: 120.1, pick: 126 },
          { name: 'Zach Ertz', team: 'WAS', bye: 12, adp: 171.7, pick: 150 },
          { name: 'Brenton Strange', team: 'JAX', bye: 8, adp: 166.7, pick: 163 },
          { name: 'Pat Freiermuth', team: 'PIT', bye: 5, adp: 173.3, pick: 174 },
          { name: 'Theo Johnson', team: 'NYG', bye: 14, adp: 214.2, pick: 198 },
        ],
      },
      positionCounts: { QB: 4, RB: 5, WR: 6, TE: 5 }
    },
    'The TopDog (4)': {
      players: {
        QB: [
          { name: 'Baker Mayfield', team: 'TB', bye: 9, adp: 92.0, pick: 88 },
          { name: 'Bryce Young', team: 'CAR', bye: 14, adp: 157.7, pick: 160 },
        ],
        RB: [
          { name: 'RJ Harvey', team: 'DEN', bye: 12, adp: 54.1, pick: 57 },
          { name: 'David Montgomery', team: 'DET', bye: 8, adp: 70.5, pick: 64 },
          { name: 'Kaleb Johnson', team: 'PIT', bye: 5, adp: 75.3, pick: 81 },
          { name: 'Cam Skattebo', team: 'NYG', bye: 14, adp: 100.2, pick: 105 },
          { name: 'Jacory Croskey-Merritt', team: 'WAS', bye: 12, adp: 215.0, pick: 208 },
        ],
        WR: [
          { name: 'Malik Nabers', team: 'NYG', bye: 14, adp: 9.3, pick: 9 },
          { name: 'Rashee Rice', team: 'KC', bye: 10, adp: 27.7, pick: 16 },
          { name: 'Mike Evans', team: 'TB', bye: 9, adp: 34.7, pick: 33 },
          { name: 'Jameson Williams', team: 'DET', bye: 8, adp: 45.0, pick: 40 },
          { name: 'Kyle Williams', team: 'NE', bye: 14, adp: 118.0, pick: 112 },
          { name: 'Alec Pierce', team: 'IND', bye: 11, adp: 169.9, pick: 153 },
          { name: 'Jalen Coker', team: 'CAR', bye: 14, adp: 198.4, pick: 184 },
        ],
        TE: [
          { name: 'Jake Ferguson', team: 'DAL', bye: 10, adp: 142.1, pick: 129 },
          { name: 'Isaiah Likely', team: 'BAL', bye: 7, adp: 148.9, pick: 136 },
          { name: 'Cade Otton', team: 'TB', bye: 9, adp: 183.6, pick: 177 },
          { name: 'Theo Johnson', team: 'NYG', bye: 14, adp: 211.0, pick: 201 },
        ],
      },
      positionCounts: { QB: 2, RB: 5, WR: 7, TE: 4 }
    }
  }
};

const TOURNAMENTS = ['The TopDog'];

// Function to get NFL team logo for player
const getPlayerImageUrl = (playerName, teamCode, position = null) => {
  // Use NFL team logo if team code is provided
  if (teamCode && nflLogoMapping[teamCode]) {
    return getNflLogoUrl(teamCode);
  }
  
  // Fallback to avatar with position-based colors
  return getPlayerPhotoUrl(playerName, teamCode, position, 40);
};

export default function MyTeams() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);
  
  const userId = user?.uid;
  const [selectedTournament, setSelectedTournament] = useState(TOURNAMENTS[0]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  // Convert mock data to team format directly
  const tournamentTeams = mockTeamData[selectedTournament] || {};
  const convertedTeams = Object.entries(tournamentTeams).map(([teamName, teamData]) => {
    // Convert players to draftPicks format
    const draftPicks = [];
    Object.entries(teamData.players).forEach(([position, players]) => {
      players.forEach((player, index) => {
        draftPicks.push({
          round: Math.floor(player.pick / 12) + 1,
          pick: player.pick, // Use the actual pick number from the data
          player: player.name,
          position: position,
          team: player.team,
          bye: player.bye,
          adp: player.adp
        });
      });
    });
    
    return {
      id: teamName.toLowerCase().replace(/\s+/g, '-'),
      name: teamName,
      tournament: selectedTournament,
      draftPicks: draftPicks
    };
  });
  
  const [teams, setTeams] = useState(convertedTeams);
  const [editingTeamName, setEditingTeamName] = useState(null);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchTags, setSelectedSearchTags] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [showFullDraftBoard, setShowFullDraftBoard] = useState(false);
  const [showOverallPickNumbers, setShowOverallPickNumbers] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showFullDraftBoard) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showFullDraftBoard]);
  
  // Generate mock drafters once
  const mockDrafters = getRandomMockDrafters(11);
  const usernames = [...mockDrafters.slice(0, 8), 'DEV', ...mockDrafters.slice(8, 11)];

  // Function to populate draft board with available players
  const populateDraftBoard = () => {
    if (!selectedTeam) return {};
    
    // Get players that DEV already has
    const devPlayers = selectedTeam.draftPicks.map(pick => pick.player);
    
    // Get available players (excluding DEV's players)
    const availablePlayers = PLAYER_POOL
      .filter(player => !devPlayers.includes(player.name))
      .sort((a, b) => (a.adp || 999) - (b.adp || 999));
    
    // Create draft board data
    const draftBoardData = {};
    
    // Populate each user's picks (excluding DEV at index 8)
    for (let userIndex = 0; userIndex < 12; userIndex++) {
      if (userIndex === 8) continue; // Skip DEV
      
      const userPicks = [];
      for (let round = 1; round <= 18; round++) {
        const isReverse = round % 2 === 0; // Snake draft
        const actualColIndex = isReverse ? 11 - userIndex : userIndex;
        const pickNumber = (round - 1) * 12 + actualColIndex + 1;
        
        // Get the next available player for this user
        const playerIndex = (userIndex * 18) + (round - 1);
        if (playerIndex < availablePlayers.length) {
          const player = availablePlayers[playerIndex];
          userPicks.push({
            pick: pickNumber,
            player: player.name,
            position: player.position,
            team: player.team,
            adp: player.adp
          });
        }
      }
      draftBoardData[userIndex] = userPicks;
    }
    
    return draftBoardData;
  };

  // Handle team name editing
  const startEditingTeamName = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setEditingTeamName(teamId);
      setTeamNameInput(team.name);
    }
  };

  const saveTeamName = () => {
    if (editingTeamName && teamNameInput.trim()) {
      setTeams(teams.map(team => 
        team.id === editingTeamName 
          ? { ...team, name: teamNameInput.trim() }
          : team
      ));
      setEditingTeamName(null);
      setTeamNameInput('');
    }
  };

  const cancelEditingTeamName = () => {
    setEditingTeamName(null);
    setTeamNameInput('');
  };

  // Search functionality
  const getTeamsWithPlayers = (searchTerms) => {
    if (!searchTerms || searchTerms.length === 0) return teams;
    
    return teams.filter(team => {
      // Pre-compute lowercase arrays once per team instead of per term
      const teamPlayers = team.draftPicks.map(pick => pick.player.toLowerCase());
      const teamNflTeams = team.draftPicks.map(pick => pick.team.toLowerCase());
      const teamNflTeamsUpper = team.draftPicks.map(pick => pick.team.toUpperCase());
      
      // Team must contain ALL searched terms (AND logic, not OR)
      return searchTerms.every(term => {
        const lowerTerm = term.toLowerCase();
        
        // Check if term matches player names
        const playerMatch = teamPlayers.some(player => player.includes(lowerTerm));
        
        // Check if term matches NFL team abbreviations directly
        const directTeamMatch = teamNflTeams.some(nflTeam => nflTeam.includes(lowerTerm));
        
        // Check if term matches city/team names via centralized mapping
        const mappedTeams = findTeamByTerm(lowerTerm);
        let mappedTeamMatch = false;
        if (mappedTeams) {
          if (Array.isArray(mappedTeams)) {
            // For cities with multiple teams (LA, NY)
            mappedTeamMatch = mappedTeams.some(teamAbbr => teamNflTeamsUpper.includes(teamAbbr));
          } else {
            // Single team mapping
            mappedTeamMatch = teamNflTeamsUpper.includes(mappedTeams);
          }
        }
        
        return playerMatch || directTeamMatch || mappedTeamMatch;
      });
    });
  };

  const getSearchTerms = () => {
    return [...selectedSearchTags, searchQuery].filter(term => term.trim().length > 0);
  };

  // Generate suggestions based on current input
  const getSuggestions = () => {
    if (!searchQuery || searchQuery.length < 2) return [];
    
    const query = searchQuery.toLowerCase();
    const suggestions = [];
    
    // Get all unique players from all teams
    const allPlayers = [...new Set(
      teams.flatMap(team => 
        team.draftPicks.map(pick => pick.player)
      )
    )];
    
    // Get all unique NFL teams
    const allNflTeams = [...new Set(
      teams.flatMap(team => 
        team.draftPicks.map(pick => pick.team)
      )
    )];
    
    // Add matching players
    allPlayers
      .filter(player => player.toLowerCase().includes(query))
      .filter(player => !selectedSearchTags.includes(player))
      .slice(0, 5)
      .forEach(player => suggestions.push({ type: 'player', value: player, display: player }));
    
    // Add matching NFL team abbreviations with full names
    allNflTeams
      .filter(team => team.toLowerCase().includes(query))
      .filter(team => !selectedSearchTags.includes(team))
      .slice(0, 3)
      .forEach(team => {
        const fullName = getTeamFullName(team.toUpperCase());
        const display = fullName !== team.toUpperCase() ? `${fullName} (${team.toUpperCase()})` : team.toUpperCase();
        suggestions.push({ type: 'team', value: team, display: display });
      });
    
    // Add matching city/team names from centralized mapping
    Object.entries(TEAM_SEARCH_MAPPING)
      .flatMap(([code, terms]) => terms.map(term => ({ term, code })))
      .filter(({ term }) => term.includes(query))
      .filter(({ term }) => !selectedSearchTags.includes(term))
      .slice(0, 3)
      .forEach(({ term, code }) => {
        const fullName = getTeamFullName(code);
        const display = `${fullName} (${code})`;
        suggestions.push({ type: 'city', value: term, display: display });
      });
    
    return suggestions.slice(0, 8); // Limit total suggestions
  };

  // Add search tag
  const addSearchTag = (value) => {
    if (!selectedSearchTags.includes(value)) {
      setSelectedSearchTags([...selectedSearchTags, value]);
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  // Remove search tag
  const removeSearchTag = (value) => {
    setSelectedSearchTags(selectedSearchTags.filter(tag => tag !== value));
  };

  // Clear all search
  const clearAllSearch = () => {
    setSelectedSearchTags([]);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  // Count teams per tournament
  const teamCounts = TOURNAMENTS.reduce((acc, t) => {
    acc[t] = teams.filter(team => team.tournament === t).length;
    return acc;
  }, {});

  // Filter teams by tournament and search
  const teamsInTournament = teams.filter(team => team.tournament === selectedTournament);
  const filteredTeams = getTeamsWithPlayers(getSearchTerms()).filter(team => team.tournament === selectedTournament);
  const currentTeamData = mockTeamData[selectedTournament] || { players: {}, positionCounts: {} };

  return (
          <div className="min-h-screen text-white overflow-x-auto" style={{ background: 'url(/wr_blue.png) repeat-y', backgroundSize: '200% 100%', backgroundPosition: 'center center', backgroundAttachment: 'fixed' }}>
      <Head>
        <title>Drafted Teams - TopDog.dog</title>
      </Head>
      
      <div className="w-full">
      {/* Top Subheader with wr_blue background */}
      <section style={{ height: '7px', width: '100vw', background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', margin: '0', padding: '0' }}>
      </section>

      {/* White Navbar */}
      <section className="bg-white border-b border-gray-200" style={{ width: '100vw', height: '53.5px', overflow: 'hidden', margin: '0', padding: '0' }}>
        <div className="w-full px-4">
          <div className="flex justify-between items-center" style={{ marginTop: '0px', marginBottom: '0px', height: '53.5px', width: '100%' }}>
            <div className="flex space-x-8" style={{ marginTop: '2px' }}>
              <Link href="/" className="font-medium text-base pb-1 transition-colors" style={{ fontSize: '1.07rem', WebkitTextStroke: '0.12px #18181b', background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Draft Lobby
              </Link>
              <span className="font-medium border-b-2 border-yellow-400 pb-1 text-base" style={{ fontSize: '1.07rem', WebkitTextStroke: '0.12px #18181b', background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                My Teams
              </span>
              <Link href="/exposure" className="font-medium text-base pb-1 transition-colors" style={{ fontSize: '1.07rem', WebkitTextStroke: '0.12px #18181b', background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Exposure Report
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Subheader with wr_blue background */}
      <section style={{ height: '7px', width: '100vw', background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', marginTop: '0px', margin: '0', padding: '0' }}>
      </section>
      
      <div className="flex w-full mx-auto rounded-xl mt-8" style={{ minWidth: 'calc(1050px - 2rem)', maxWidth: 'calc(1050px - 2rem)', height: 'calc(100vh - 200px)' }}>
        {/* Main Content - Tournament Details and User Teams */}
        <div className="w-3/5 bg-gray-900 p-6 overflow-y-auto min-w-0 rounded-l-xl" style={{ padding: '18px' }}>
          {/* Tournament Details */}
          <div className="bg-gray-800/50 rounded-lg p-4 mb-4 border border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">


              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-2">
              <div className="relative" style={{ minHeight: '44px' }}>
                <div className="flex flex-wrap items-center gap-1 w-full bg-gray-800/70 text-white px-4 py-2 rounded-lg border border-gray-600/50 focus-within:border-[#59c5bf] min-h-[44px]">
                  {/* Selected Search Tags inside input */}
                  {selectedSearchTags.map(tag => (
                    <div key={tag} className="flex items-center bg-[#59c5bf] text-white px-2 py-1 rounded text-xs">
                      <span>{tag}</span>
                      <button
                        onClick={() => removeSearchTag(tag)}
                        className="ml-1 text-white hover:text-gray-200"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                <input
                  type="text"
                    placeholder={selectedSearchTags.length === 0 ? "Search by player(s) or NFL team..." : ""}
                  value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(e.target.value.length >= 2);
                    }}
                    onFocus={() => setShowSuggestions(searchQuery.length >= 2)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="flex-1 bg-transparent text-white outline-none border-none min-w-0"
                    style={{ minWidth: '120px' }}
                  />
                </div>
                {(searchQuery || selectedSearchTags.length > 0) && (
                  <button
                    onClick={clearAllSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}

                                {/* Suggestions Dropdown */}
                <div className={`absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 transition-all duration-200 ${
                  showSuggestions ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`} style={{ minHeight: showSuggestions ? 'auto' : '0px', maxHeight: '240px', overflowY: 'auto' }}>
                  {showSuggestions && getSuggestions().map((suggestion, index) => (
                    <button
                      key={`${suggestion.type}-${suggestion.value}-${index}`}
                      onClick={() => addSearchTag(suggestion.value)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center justify-between group"
                      style={{ minHeight: '44px' }}
                    >
                      <span className="text-white">{suggestion.display}</span>
                      <span className={`text-xs px-2 py-1 rounded text-white ${
                        suggestion.type === 'player' ? 'bg-blue-600' : 
                        suggestion.type === 'team' ? 'bg-green-600' : 'bg-purple-600'
                      }`}>
                        {suggestion.type === 'player' ? 'Player' : 
                         suggestion.type === 'team' ? 'Team' : 'City'}
                      </span>
                    </button>
                  ))}
                  {showSuggestions && getSuggestions().length === 0 && (
                    <div className="px-4 py-2 text-gray-400 text-sm" style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}>
                      No suggestions found
                </div>
              )}
                </div>
            </div>
            
              {/* Search Summary */}
              {(searchQuery || selectedSearchTags.length > 0) && (
                <div className="text-sm text-gray-400 mt-2">
                  {getSearchTerms().length > 0 ? (
                    <span className="text-[#59c5bf]">{getSearchTerms().join(', ')}</span>
                  ) : (
                    'Start typing to see suggestions...'
                  )}
              </div>
              )}
              </div>
            

          </div>

          {/* Your teams */}
          <div className="mt-6">
            {filteredTeams.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                {searchQuery ? `No teams found with players: ${getSearchTerms().join(', ')}` : 'No teams in this tournament.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTeams.slice().reverse().map((team, index) => (
                  <div 
                    key={team.id} 
                    className={`flex items-center justify-between p-4 bg-gray-800/40 rounded-lg hover:bg-gray-700/60 transition-colors cursor-pointer border border-gray-700/30 ${
                      selectedTeam?.id === team.id ? 'border-l-4 border-[#59c5bf]' : ''
                    }`}
                    onClick={() => setSelectedTeam(team)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-[#59c5bf] rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        {editingTeamName === team.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={teamNameInput}
                              onChange={(e) => setTeamNameInput(e.target.value)}
                              className="bg-gray-800/70 text-white px-2 py-1 rounded text-sm font-medium w-32 border border-gray-600/50"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') saveTeamName();
                                if (e.key === 'Escape') cancelEditingTeamName();
                              }}
                              autoFocus
                            />
                            <button 
                              onClick={(e) => { e.stopPropagation(); saveTeamName(); }}
                              className="text-green-400 hover:text-green-300 text-xs"
                            >
                              ✓
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); cancelEditingTeamName(); }}
                              className="text-red-400 hover:text-red-300 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                      <div>
                        <div className="font-medium">{team.name}</div>
                        <div className="text-sm text-gray-400">{team.draftPicks.length} players drafted</div>
                          </div>
                        )}
                      </div>
                      {editingTeamName !== team.id && (
                        <button
                          onClick={(e) => { e.stopPropagation(); startEditingTeamName(team.id); }}
                          className="text-gray-400 hover:text-white text-xs"
                          title="Edit team name"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <span className="text-gray-400">→</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Team Overview */}
        <div className="w-2/5 bg-gray-900 border-l border-gray-700 p-6 overflow-y-auto flex-shrink-0 rounded-r-xl">
          {/* User Profile/Team Overview */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => selectedTeam && setShowFullDraftBoard(true)}
                disabled={!selectedTeam}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  selectedTeam 
                    ? 'bg-[#3B82F6] text-white hover:bg-[#1d4ed8] cursor-pointer' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Draft Board
              </button>

            </div>
          </div>

          {/* Player Lists */}
          {selectedTeam ? (
            <>
              <div className="flex justify-between text-xs text-gray-400 mb-2 px-2">
                <span></span>
                <span></span>
                <div className="flex space-x-4">
                  <span className="text-center w-8">ADP</span>
                  <span className="text-center w-8">Pick</span>
                </div>
              </div>
              {Object.entries(
              selectedTeam.draftPicks.reduce((acc, pick) => {
                if (!acc[pick.position]) acc[pick.position] = [];
                acc[pick.position].push(pick);
                return acc;
              }, {})
            ).map(([position, picks]) => (
              <div key={position} className="mb-6">
                <h4 className="text-lg font-semibold mb-3">{position}</h4>
                <div className="space-y-2">
                  {picks.map((pick, i) => (
                    <div key={i} className="flex items-center space-x-3 p-2 bg-gray-800/40 rounded-lg border border-gray-700/30">
                      <div className="w-10 h-10 flex items-center justify-center">
                        <img 
                          src={getPlayerImageUrl(pick.player, pick.team, position)}
                          alt={pick.player}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            // Fallback to initials if image fails to load
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="w-full h-full bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ display: 'none' }}>
                        {pick.player.split(' ').map(n => n[0]).join('')}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {searchQuery && getSearchTerms().some(term => 
                            pick.player.toLowerCase().includes(term.toLowerCase())
                          ) ? (
                            <span className="bg-yellow-600 text-black px-1 rounded">
                              {pick.player}
                            </span>
                          ) : (
                            pick.player
                          )}
                        </div>
                        <div className="text-sm text-gray-400">{pick.team}</div>
                      </div>
                                             <div className="text-center text-sm">
                         <div className="flex space-x-4">
                           <span className="text-gray-400 w-8">{pick.adp}</span>
                           <span className="text-gray-400 w-8">{pick.pick}</span>
                         </div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            </>
          ) : (
            <div className="text-gray-400 text-center py-8">
              Select a team to view roster
            </div>
          )}


        </div>
      </div>

      {/* Full Draft Board Modal */}
      {showFullDraftBoard && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-8"
          onClick={() => setShowFullDraftBoard(false)}
        >
          <div 
            className="bg-[#1a1a18] border border-[#59c5bf] rounded-xl shadow-2xl px-8 py-8 min-w-[1200px] max-h-[90vh] overflow-auto relative mt-2"
            onClick={(e) => e.stopPropagation()}
          >
              <button 
                onClick={() => setShowFullDraftBoard(false)}
                className="absolute top-0 right-2 text-gray-400 hover:text-white text-xl z-10"
              >
                ×
              </button>
                <button 
                  onClick={() => {
                    const shareData = {
                      title: 'Draft Board - TopDog.dog',
                      text: `Check out this draft board from ${selectedTeam?.name || 'TopDog'}`,
                      url: window.location.href
                    };
                    
                    if (navigator.share) {
                      navigator.share(shareData);
                    } else {
                      // Fallback: copy to clipboard and show message
                      navigator.clipboard.writeText(window.location.href).then(() => {
                        alert('Draft board URL copied to clipboard!');
                      });
                    }
                  }}
                  className="absolute top-0 right-6 text-gray-400 hover:text-white text-xl z-10"
                  title="Share draft board"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button>
            
            
            <div className="grid grid-cols-12 gap-2 text-xs" style={{ minWidth: '1200px', width: '1200px' }}>
              {/* Row 1: Usernames */}
              <div className="contents">
                {Array.from({ length: 12 }, (_, colIndex) => {
                  const cleanUsername = usernames[colIndex]
                    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove hyphens, punctuation, etc.
                    .replace(/\s+/g, '') // Remove spaces
                    .toUpperCase(); // Convert to uppercase
                  
                  // Truncate if longer than 10 characters to ensure fit
                  const displayUsername = cleanUsername.length > 10 ? cleanUsername.substring(0, 10) + '...' : cleanUsername;
                  
                  return (
                                        <div key={colIndex} className="text-center p-2 bg-gray-800 rounded border border-gray-600 w-full h-full aspect-square flex flex-col items-center text-white font-semibold text-xs relative" style={{ fontSize: '9.2px' }}>
                      {/* Circle for future user logo */}
                      <div className="rounded-full border-2 border-gray-600 bg-gray-700 flex items-center justify-center absolute top-1" style={{ width: '42px', height: '42px' }}>
                        {/* Placeholder for future user logo */}
                      </div>
                                            {/* Position counts below username */}
                      <div className="absolute bottom-0 text-xs" style={{ fontSize: '12px', transform: 'translateY(-2px)' }}>
                        {(() => {
                          if (colIndex === 8) {
                            // For DEV, count actual picks
                            const devPicks = selectedTeam?.draftPicks || [];
                            const qbCount = devPicks.filter(p => p.position === 'QB').length;
                            const wrCount = devPicks.filter(p => p.position === 'WR').length;
                            const rbCount = devPicks.filter(p => p.position === 'RB').length;
                                                         const teCount = devPicks.filter(p => p.position === 'TE').length;
                             return (
                               <span>
                                 <span style={{ color: '#F472B6', marginRight: '12px' }}>{qbCount}</span>
                                 <span style={{ color: '#FBBF25', marginRight: '12px' }}>{wrCount}</span>
                                 <span style={{ color: '#0fba80', marginRight: '12px' }}>{rbCount}</span>
                                 <span style={{ color: '#7C3AED' }}>{teCount}</span>
                               </span>
                             );
                          } else {
                            // For other users, count from populated data
                            const draftBoardData = populateDraftBoard();
                            const userPicks = draftBoardData[colIndex] || [];
                            const qbCount = userPicks.filter(p => p.position === 'QB').length;
                            const wrCount = userPicks.filter(p => p.position === 'WR').length;
                            const rbCount = userPicks.filter(p => p.position === 'RB').length;
                                                         const teCount = userPicks.filter(p => p.position === 'TE').length;
                             return (
                               <span>
                                 <span style={{ color: '#F472B6', marginRight: '12px' }}>{qbCount}</span>
                                 <span style={{ color: '#FBBF25', marginRight: '12px' }}>{wrCount}</span>
                                 <span style={{ color: '#0fba80', marginRight: '12px' }}>{rbCount}</span>
                                 <span style={{ color: '#7C3AED' }}>{teCount}</span>
                               </span>
                             );
                          }
                        })()}
                </div>
                                            {/* Username above position counts */}
                      <div className="absolute bottom-6" style={{ transform: 'translateY(3px)' }}>
                        {displayUsername}
                  </div>
                    </div>
                  );
                })}
                {/* Horizontal line after first row */}
                <div className="col-span-12 h-0.5 bg-gray-600 my-1 mx-4"></div>
              </div>

              {/* Rows 2-19: Draft picks with snake pattern */}
              {Array.from({ length: 18 }, (_, rowIndex) => {
                const round = rowIndex + 1;
                const isReverse = round % 2 === 0; // Even rounds go right to left
                
                return (
                  <div key={rowIndex} className="contents">
                    {Array.from({ length: 12 }, (_, colIndex) => {
                      const actualColIndex = isReverse ? 11 - colIndex : colIndex;
                      const pickNumber = (round - 1) * 12 + actualColIndex + 1;
                      
                      // Find the player for this pick
                      let playerData = null;
                      if (selectedTeam) {
                        // First check if this is DEV's pick (column 8)
                        if (colIndex === 8) {
                          playerData = selectedTeam.draftPicks.find(pick => pick.pick === pickNumber);
                        } else {
                          // For other users, use populated draft board data
                          const draftBoardData = populateDraftBoard();
                          const userPicks = draftBoardData[colIndex] || [];
                          playerData = userPicks.find(pick => pick.pick === pickNumber);
                        }
                      }
                      
                      return (
                        <div 
                          key={colIndex} 
                          className={`text-center p-1 rounded border w-full h-full aspect-square flex flex-col items-center justify-center text-white text-xs relative ${
                            playerData ? 'border-2' : 'bg-gray-700 border-gray-600'
                          }`}
                          style={{
                            borderColor: playerData ? 
                              (playerData.position === 'QB' ? '#F472B6' : 
                               playerData.position === 'RB' ? '#0fba80' : 
                               playerData.position === 'WR' ? '#FBBF25' : 
                               playerData.position === 'TE' ? '#7C3AED' : '#2DE2C5') : undefined,
                            backgroundColor: playerData ? 
                              (playerData.position === 'QB' ? '#F472B620' : 
                               playerData.position === 'RB' ? '#0fba8020' : 
                               playerData.position === 'WR' ? '#FBBF2520' : 
                               playerData.position === 'TE' ? '#7C3AED20' : '#2DE2C520') : undefined
                          }}
                        >
                          {/* Clickable pick number positioned at top left */}
                          <div 
                            className="absolute text-xs cursor-pointer rounded px-1 text-gray-500"
                            style={{ 
                              top: '2px',
                              left: '0px',
                              zIndex: 10
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowOverallPickNumbers(!showOverallPickNumbers);
                            }}
                          >
                            {(() => {
                              if (showOverallPickNumbers) {
                                return pickNumber;
                              } else {
                                const round = Math.ceil(pickNumber / 12);
                                const pickInRound = ((pickNumber - 1) % 12) + 1;
                                return `${round}.${String(pickInRound).padStart(2, '0')}`;
                              }
                            })()}
                          </div>

                          {playerData ? (
                            <>
                              {/* Team logo */}
                              <div className="w-9 h-9 mx-auto mb-1 mt-2">
                                <img 
                                  src={getNflLogoUrl(playerData.team)}
                                  alt={playerData.team}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                              <div className="font-bold text-xs truncate w-full -mt-0.5">
                                {(() => {
                                  const nameParts = playerData.player.split(' ');
                                  const firstName = nameParts[0];
                                  const lastName = nameParts.slice(1).join(' '); // Include all parts after first name
                                  return `${firstName[0]}. ${lastName}`;
                                })()}
                              </div>
                              <div className="text-xs opacity-75">
                                {playerData.position} • {playerData.team}
                              </div>
                            </>
                          ) : (
                            <div className="text-gray-500 mt-8"></div>
                          )}
                        </div>
                      );
                    })}
                </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
  );
} 