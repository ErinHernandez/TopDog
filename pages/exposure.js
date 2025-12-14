import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { exposureData as csvExposureData } from '../lib/exposureData';
import { getNflLogoUrl, nflLogoMapping } from '../lib/nflLogos';
import userMetrics from '../lib/userMetrics';
import exposurePreloader from '../lib/exposurePreloader';
import { PLAYER_POOL } from '../lib/playerPool';
import { POSITIONS } from '../components/draft/v3/constants/positions';

export default function Exposure() {
  console.log('CSV Exposure Data:', csvExposureData);
  const [exposureData, setExposureData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState('all');
  const [selectedPositions, setSelectedPositions] = useState([...POSITIONS]);
  const [selectedDraftStatus, setSelectedDraftStatus] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [sortBy, setSortBy] = useState('exposure');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isEmailingCSV, setIsEmailingCSV] = useState(false);
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  // Calculate max APD based on tournament rounds (12 picks per round)
  const getMaxApdForTournaments = () => {
    if (!exposureData?.playerExposure) return 216; // Default fallback
    
    // Get unique tournaments from current filtered data
    const tournaments = [...new Set(exposureData.playerExposure.map(p => p.tournament))];
    // For now, assume 18 rounds (216 picks) as standard, but this can be dynamic
    return 216; // 12 picks × 18 rounds
  };

  const maxApd = getMaxApdForTournaments();
  const [apdRange, setApdRange] = useState([1, maxApd]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchTags, setSelectedSearchTags] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const userId = 'Not Todd Middleton'; // Replace with real user ID in production

  // Function to handle header clicks for sorting
  const handleHeaderClick = (column) => {
    if (sortBy === column) {
      // If clicking the same column, toggle sort order
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      // If clicking a different column, set it as new sort column with desc order
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Function to get sort indicator
  const getSortIndicator = (column) => {
    if (sortBy !== column) return '';
    return sortOrder === 'desc' ? '↓' : '↑';
  };

  // Function to get header styling
  const getHeaderStyle = (column) => {
    const isActive = sortBy === column;
    const textAlign = (column === 'leagues' || column === 'exposure' || column === 'entryFee' || column === 'position' || column === 'apd') ? 'text-center' : 'text-left';
    return `${textAlign} py-1 px-1 font-normal cursor-pointer transition-all duration-200 select-none ${
      isActive 
        ? 'text-[#3B82F6]' 
        : 'text-white hover:bg-white/5'
    }`;
  };

  // Record page visit for metrics
  useEffect(() => {
    userMetrics.recordPageVisit('/exposure', document.referrer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isTeamDropdownOpen && !event.target.closest('[data-team-dropdown]')) {
        setIsTeamDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTeamDropdownOpen]);

  useEffect(() => {
    // Try to get preloaded data first
    const preloadedData = exposurePreloader.getPreloadedData();
    if (preloadedData) {
      setExposureData(preloadedData);
      setLoading(false);
      return;
    }

    // If no preloaded data, try to start preloading and fallback to static data
    const loadData = async () => {
      try {
        // Try to get preloaded data (might be loading in background)
        const data = await exposurePreloader.startPreload();
        if (data) {
          setExposureData(data);
        } else {
          // Fallback to static data if preloading fails
          setExposureData(csvExposureData);
        }
      } catch (error) {
        // Fallback to static data if everything fails
        setExposureData(csvExposureData);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Additional pre-download when coming from My Teams page
  useEffect(() => {
    const checkReferrer = () => {
      const referrer = document.referrer;
      const isFromMyTeams = referrer.includes('/my-teams');
      
      if (isFromMyTeams && exposureData) {
        // Pre-download additional data that might be needed
        const preloadAdditionalData = async () => {
          try {
            // Pre-download any additional CSV files or data that might be needed
            const additionalFiles = [
              '/33b5de97-dc20-4c7d-919c-b35ca06a3ac9_100fec91-ff4f-4368-bbee-c7fcc07307d2_2025-08-25.csv'
            ];
            
            // Pre-fetch additional data in background
            additionalFiles.forEach(async (file) => {
              try {
                await fetch(file, { method: 'HEAD' });
              } catch (e) {
                // Silently fail - this is just preloading
              }
            });
          } catch (error) {
            // Silently fail - this is just preloading
          }
        };
        
        preloadAdditionalData();
      }
    };

    // Check referrer after a short delay to ensure page is loaded
    const timer = setTimeout(checkReferrer, 1000);
    return () => clearTimeout(timer);
  }, [exposureData]);

  // Pre-download additional page data after initial load
  useEffect(() => {
    if (exposureData && !loading) {
      const preloadPageData = async () => {
        try {
          // Pre-download any additional resources that might be needed
          const resources = [
            '/wr_blue.png',
            '/logo.png',
            '/secondary_logo.png'
          ];
          
          // Pre-fetch resources in background
          resources.forEach(async (resource) => {
            try {
              await fetch(resource, { method: 'HEAD' });
            } catch (e) {
              // Silently fail - this is just preloading
            }
          });
        } catch (error) {
          // Silently fail - this is just preloading
        }
      };
      
      preloadPageData();
    }
  }, [exposureData, loading]);

  // Function to process CSV data into the expected format
  const processCSVData = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',');
    
    // Parse CSV data
    const picks = lines.slice(1).map(line => {
      const values = line.split(',');
      const pick = {};
      headers.forEach((header, index) => {
        pick[header.trim()] = values[index]?.trim() || '';
      });
      return pick;
    });

    // Group by player and calculate exposure
    const playerMap = new Map();
    const tournamentMap = new Map();

    picks.forEach(pick => {
      const playerName = `${pick['First Name']} ${pick['Last Name']}`;
      const position = pick['Position'];
      const team = pick['Team'];
      const tournament = pick['Tournament Title'];
      const draftId = pick['Draft'];
      const draftEntry = pick['Draft Entry'];
      const pickNumber = parseInt(pick['Pick Number']) || 0;
      const pickedAt = pick['Picked At'];

      // Track player exposure
      if (!playerMap.has(playerName)) {
        playerMap.set(playerName, {
          name: playerName,
          position: position,
          team: team,
          exposure: 0,
          leagues: 0,
          entryFee: 0,
          tournament: tournament,
          draftStatus: 'post-draft', // Assuming all data is post-draft
          draftIds: new Set(),
          averagePick: 0,
          totalPicks: 0,
          totalEntryFee: 0
        });
      }

      const player = playerMap.get(playerName);
      player.exposure += 1;
      player.draftIds.add(draftId);
      player.totalPicks += pickNumber;
      player.leagues = player.draftIds.size;
      player.averagePick = player.totalPicks / player.exposure;
      
      // Calculate entry fee: user's teams (drafted #) × entry fee per tournament
      const userTeams = 1; // Each pick represents 1 team for this user
      const entryFee = parseFloat(pick['Tournament Entry Fee']) || 0;
      const userEntryFee = userTeams * entryFee;
      player.entryFee += userEntryFee;

      // Track tournament exposure
      if (!tournamentMap.has(tournament)) {
        tournamentMap.set(tournament, {
          name: tournament,
          entries: 0,
          userEntries: 0,
          entryFee: parseFloat(pick['Tournament Entry Fee']) || 0,
          prizes: parseFloat(pick['Tournament Total Prizes']) || 0,
          type: 'BB',
          draftDate: '2024-05-15',
          isPostDraft: true
        });
      }
      tournamentMap.get(tournament).entries += 1;


    });

    // Convert maps to arrays
    const playerExposure = Array.from(playerMap.values()).map(player => ({
      ...player,
      draftIds: Array.from(player.draftIds)
    }));

    const tournaments = Array.from(tournamentMap.values());

    return {
      playerExposure,
      tournaments
    };
  };

  const getPositionColor = (position) => {
    switch (position) {
      case 'QB': return '#F472B6';
      case 'RB': return '#0fba80';
              case 'WR': return '#377aff';
      case 'TE': return '#7C3AED';
      default: return '#6b7280';
    }
  };

  const getTeamMascot = (abbreviation) => {
    const teamMascots = {
      'KC': 'Chiefs',
      'SF': 'Z49ers', // Using 'Z' prefix to make it sort last
      'MIA': 'Dolphins',
      'BUF': 'Bills',
      'PHI': 'Eagles',
      'HOU': 'Texans',
      'BAL': 'Ravens'
    };
    return teamMascots[abbreviation] || abbreviation;
  };

  const getFullTeamName = (abbreviation) => {
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
  };

  // Search functionality
  const addSearchTag = (tag) => {
    if (!selectedSearchTags.includes(tag)) {
      setSelectedSearchTags([...selectedSearchTags, tag]);
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const removeSearchTag = (tagToRemove) => {
    setSelectedSearchTags(selectedSearchTags.filter(tag => tag !== tagToRemove));
  };

  const clearAllSearch = () => {
    setSearchQuery('');
    setSelectedSearchTags([]);
    setShowSuggestions(false);
  };

  const getSearchTerms = () => {
    return [...selectedSearchTags, searchQuery].filter(term => term.trim().length > 0);
  };

  // Generate suggestions based on current input
  const getSuggestions = () => {
    if (!searchQuery || searchQuery.length < 2) return [];
    
    const query = searchQuery.toLowerCase();
    const suggestions = [];
    
    // Get all unique players from comprehensive player pool
    const allPlayersForSuggestions = [...new Set(
      PLAYER_POOL.map(player => player.name).filter(Boolean) || []
    )];
    
    // Get all unique NFL teams from comprehensive player pool
    const allNflTeams = [...new Set(
      PLAYER_POOL.map(player => player.team).filter(Boolean) || []
    )];
    
    // Add matching players
    allPlayersForSuggestions
      .filter(player => player && player.toLowerCase().includes(query))
      .filter(player => !selectedSearchTags.includes(player))
      .slice(0, 5)
      .forEach(player => suggestions.push({ type: 'player', value: player, display: player }));
    
    // Add matching NFL teams
    allNflTeams
      .filter(team => team && (team.toLowerCase().includes(query) || (getFullTeamName(team)?.toLowerCase() || '').includes(query)))
      .filter(team => !selectedSearchTags.includes(team))
      .slice(0, 3)
      .forEach(team => {
        const fullName = getFullTeamName(team);
        const display = fullName !== team ? `${fullName} (${team})` : team;
        suggestions.push({ type: 'team', value: team, display: display });
      });
    
    return suggestions.slice(0, 8); // Limit total suggestions
  };

  // Filtered players for top container (user's drafted players)
  const filteredPlayers = exposureData?.playerExposure?.filter(player => {
    const tournamentMatch = selectedTournament === 'all' || player.tournament === selectedTournament;
    // Position filtering with OR logic - show if player matches ANY selected position
    const positionMatch = selectedPositions.length === 0 || 
                         selectedPositions.includes('all') || 
                         selectedPositions.includes(player.position);
    
    // Handle draft status filtering with tournament-specific post-draft options
    let draftStatusMatch = true;
    if (selectedDraftStatus === 'pre-draft') {
      draftStatusMatch = player.draftStatus === 'pre-draft';
    } else if (selectedDraftStatus === 'post-draft-topdog') {
      draftStatusMatch = player.draftStatus === 'post-draft' && player.tournament === 'topdog';

    } else if (selectedDraftStatus === 'post-draft') {
      draftStatusMatch = player.draftStatus === 'post-draft';
    }
    
    // Team filtering removed - now handled by search functionality
    
    // APD range filtering
    const playerApd = parseFloat(player.averagePick) || maxApd + 1;
    const apdMatch = playerApd >= apdRange[0] && playerApd <= apdRange[1];
    
    // Search filtering
    const searchTerms = getSearchTerms();
    let searchMatch = true;
    if (searchTerms.length > 0) {
      searchMatch = searchTerms.every(term => {
        const lowerTerm = term?.toLowerCase() || '';
        return (
          (player.name?.toLowerCase() || '').includes(lowerTerm) ||
          (player.team?.toLowerCase() || '').includes(lowerTerm) ||
          (getFullTeamName(player.team || '')?.toLowerCase() || '').includes(lowerTerm)
        );
      });
    }
    
    return tournamentMatch && positionMatch && draftStatusMatch && apdMatch && searchMatch;
  }).sort((a, b) => {
    if (sortBy === 'exposure') {
      return sortOrder === 'desc' ? b.exposure - a.exposure : a.exposure - b.exposure;
    } else if (sortBy === 'leagues') {
      return sortOrder === 'desc' ? b.leagues - a.leagues : a.leagues - b.leagues;
    } else if (sortBy === 'entryFee') {
      return sortOrder === 'desc' ? b.entryFee - a.entryFee : a.entryFee - b.entryFee;
    } else if (sortBy === 'player') {
      const aLastName = a.name.split(' ').pop();
      const bLastName = b.name.split(' ').pop();
      return sortOrder === 'desc' ? bLastName.localeCompare(aLastName) : aLastName.localeCompare(bLastName);
    } else if (sortBy === 'position') {
      return sortOrder === 'desc' ? b.position.localeCompare(a.position) : a.position.localeCompare(b.position);
    } else if (sortBy === 'team') {
      const aTeamMascot = getTeamMascot(a.team);
      const bTeamMascot = getTeamMascot(b.team);
      return sortOrder === 'desc' ? bTeamMascot.localeCompare(aTeamMascot) : aTeamMascot.localeCompare(bTeamMascot);
    } else if (sortBy === 'apd') {
      const aApd = parseFloat(a.averagePick) || 999;
      const bApd = parseFloat(b.averagePick) || 999;
      return sortOrder === 'desc' ? bApd - aApd : aApd - bApd;
    }
    return 0;
  }) || [];

  // All players for bottom container (comprehensive player pool)
  const allPlayers = PLAYER_POOL.map(player => {
    // Find if this player exists in user's exposure data
    const userPlayer = exposureData?.playerExposure?.find(p => 
      p.name.toLowerCase() === player.name.toLowerCase()
    );
    
    return {
      name: player.name,
      position: player.position,
      team: player.team,
      exposure: userPlayer?.exposure || 0,
      leagues: userPlayer?.leagues || 0,
      entryFee: userPlayer?.entryFee || 0,
      tournament: userPlayer?.tournament || 'N/A',
      draftStatus: userPlayer?.draftStatus || 'available',
      averagePick: userPlayer?.averagePick || player.adp || 999,
      adp: player.adp || 999
    };
  }).filter(player => {
    // Position filtering
    const positionMatch = selectedPositions.length === 0 || 
                         selectedPositions.includes('all') || 
                         selectedPositions.includes(player.position);
    
    // APD range filtering
    const playerApd = parseFloat(player.averagePick) || maxApd + 1;
    const apdMatch = playerApd >= apdRange[0] && playerApd <= apdRange[1];
    
    // Search filtering
    const searchTerms = getSearchTerms();
    let searchMatch = true;
    if (searchTerms.length > 0) {
      searchMatch = searchTerms.every(term => {
        const lowerTerm = term?.toLowerCase() || '';
        return (
          (player.name?.toLowerCase() || '').includes(lowerTerm) ||
          (player.team?.toLowerCase() || '').includes(lowerTerm) ||
          (getFullTeamName(player.team || '')?.toLowerCase() || '').includes(lowerTerm)
        );
      });
    }
    
    return positionMatch && apdMatch && searchMatch;
  }).sort((a, b) => {
    if (sortBy === 'exposure') {
      return sortOrder === 'desc' ? b.exposure - a.exposure : a.exposure - b.exposure;
    } else if (sortBy === 'leagues') {
      return sortOrder === 'desc' ? b.leagues - a.leagues : a.leagues - b.leagues;
    } else if (sortBy === 'entryFee') {
      return sortOrder === 'desc' ? b.entryFee - a.entryFee : a.entryFee - b.entryFee;
    } else if (sortBy === 'player') {
      const aLastName = a.name.split(' ').pop();
      const bLastName = b.name.split(' ').pop();
      return sortOrder === 'desc' ? bLastName.localeCompare(aLastName) : aLastName.localeCompare(bLastName);
    } else if (sortBy === 'position') {
      return sortOrder === 'desc' ? b.position.localeCompare(a.position) : a.position.localeCompare(b.position);
    } else if (sortBy === 'team') {
      const aTeamMascot = getTeamMascot(a.team);
      const bTeamMascot = getTeamMascot(b.team);
      return sortOrder === 'desc' ? bTeamMascot.localeCompare(aTeamMascot) : aTeamMascot.localeCompare(bTeamMascot);
    } else if (sortBy === 'apd') {
      const aApd = parseFloat(a.averagePick) || 999;
      const bApd = parseFloat(b.averagePick) || 999;
      return sortOrder === 'desc' ? bApd - aApd : aApd - bApd;
    }
    return 0;
  });



  // Calculate counts for dropdown options
  const getPlayerCount = (filterType) => {
    if (!exposureData?.playerExposure) return 0;
    
    return exposureData.playerExposure.filter(player => {
      if (filterType === 'all') return true;
      if (filterType === 'pre-draft') return player.draftStatus === 'pre-draft';
      if (filterType === 'post-draft') return player.draftStatus === 'post-draft';
      if (filterType === 'post-draft-topdog') return player.draftStatus === 'post-draft' && player.tournament === 'topdog';

      return false;
    }).length;
  };

  const getPositionCount = (position) => {
    if (!exposureData?.playerExposure) return 0;
    if (position === 'all') return exposureData.playerExposure.length;
    return exposureData.playerExposure.filter(player => player.position === position).length;
  };

  const togglePosition = (position) => {
      setSelectedPositions(prev => {
      // Remove 'all' from previous selections
      const currentPositions = prev.filter(p => p !== 'all');
      
        if (prev.includes(position)) {
          // Remove position if already selected
        const filtered = currentPositions.filter(p => p !== position);
        // If no positions left, keep at least one position selected
        return filtered.length === 0 ? [position] : filtered;
        } else {
          // Add position
        return [...currentPositions, position];
      }
    });
  };

  // Function to convert filtered players to CSV format
  const convertToCSV = (players) => {
    const headers = ['Player', 'Position', 'Team', 'Drafted (%)', 'Drafted (#)', 'Drafted $', 'APD'];
    const csvData = [headers];

    players.forEach(player => {
      const row = [
        player.name,
        player.position,
        player.team,
        exposureData?.playerExposure ? Math.round((player.exposure / 210) * 100) + '%' : player.exposure + '%',
        player.leagues,
        '$' + player.entryFee.toLocaleString(),
        player.averagePick ? player.averagePick.toFixed(1) : 'N/A'
      ];
      csvData.push(row);
    });

    return csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  };

  // Function to handle email CSV export
  const handleEmailCSV = async () => {
    if (isEmailingCSV) return;
    
    setIsEmailingCSV(true);
    
    try {
      const csvContent = convertToCSV(allPlayers);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `exposure-report-${timestamp}.csv`;
      
      // For now, we'll create the API call structure
      // In production, this would call your email service
      const emailData = {
        userId: userId,
        csvContent: csvContent,
        filename: filename,
        subject: `TopDog Exposure Report - ${timestamp}`,
        message: `Please find your exposure report attached. This report contains ${allPlayers.length} players based on your current filters.`
      };

      // Mock API call - replace with actual email service
      const response = await fetch('/api/email-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok) {
        alert('✅ Exposure report has been emailed successfully!');
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Error emailing CSV:', error);
      // Fallback: Download the CSV locally
      const csvContent = convertToCSV(allPlayers);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `exposure-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      alert('📧 Email service unavailable. CSV downloaded locally instead.');
    } finally {
      setIsEmailingCSV(false);
    }
  };

  if (loading || !exposureData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'url(/wr_blue.png) repeat-y', backgroundSize: 'auto 100%', backgroundPosition: 'center center' }}>
        <div className="text-white text-xl">Loading exposure data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white overflow-x-auto" style={{ background: 'url(/wr_blue.png) repeat-y', backgroundSize: '200% 100%', backgroundPosition: 'center center', backgroundAttachment: 'fixed' }}>
      <Head>
        <title>Exposure Report - TopDog.dog</title>
        <meta name="description" content="Check your player exposure across all drafts and leagues." />
        {/* Preload background image with highest priority for immediate loading */}
        <link rel="preload" href="/wr_blue.png" as="image" type="image/png" fetchpriority="high" />
        <link rel="preload" href="/wr_blue.png" as="image" type="image/png" />
      </Head>

      <div className="min-w-[1050px]">
      {/* Top Subheader with wr_blue background */}
      <section className="zoom-resistant" style={{ height: '7px', width: '100vw', background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', margin: '0', padding: '0', transform: 'translateZ(0)' }}>
        {/* Preload background image */}
        <img src="/wr_blue.png" alt="" style={{ display: 'none' }} />
      </section>

      {/* White Navbar */}
      <section className="bg-white border-b border-gray-200 zoom-resistant" style={{ width: '100vw', height: '53.5px', overflow: 'hidden', margin: '0', padding: '0', transform: 'translateZ(0)' }}>
        <div className="w-full px-4 zoom-resistant">
          <div className="flex justify-between items-center zoom-resistant" style={{ marginTop: '0px', marginBottom: '0px', height: '53.5px', width: '100%', transform: 'translateZ(0)' }}>
            <div className="flex space-x-8" style={{ marginTop: '2px' }}>
              <Link href="/" className="font-medium text-base pb-1 transition-colors" style={{ fontSize: '1.07rem', WebkitTextStroke: '0.12px #18181b', background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Draft Lobby
              </Link>
              <Link href="/my-teams" className="font-medium text-base pb-1 transition-colors" style={{ fontSize: '1.07rem', WebkitTextStroke: '0.12px #18181b', background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                My Teams
              </Link>
              <span className="font-medium border-b-2 border-yellow-400 pb-1 text-base" style={{ fontSize: '1.07rem', WebkitTextStroke: '0.12px #18181b', background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Exposure Report
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 7px wr_blue container */}
      <section style={{ height: '7px', width: '100vw', background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', margin: '0', padding: '0' }}>
        {/* Preload background image */}
        <img src="/wr_blue.png" alt="" style={{ display: 'none' }} />
      </section>

      {/* Bottom Subheader with wr_blue background */}
      <section style={{ height: '7px', width: '100vw', background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', marginTop: '0px', margin: '0', padding: '0' }}>
        {/* Preload background image */}
        <img src="/wr_blue.png" alt="" style={{ display: 'none' }} />
      </section>

      <div className="container mx-auto px-4 pt-8" style={{ maxWidth: '1200px' }}>

        {/* Top Container - Copy of Player Table */}
        <div className="w-full mb-8">
          <div className="bg-gray-900 rounded-xl p-6 border-4 border-[#3B82F6] overflow-hidden" style={{ height: '400px' }}>
            <h2 className="text-white text-xl mb-4">Player Exposure - Top Copy</h2>
            <div className="overflow-x-auto overflow-y-auto bg-gray-800 rounded-lg p-4" style={{ height: 'calc(100% - 60px)', marginBottom: '0', paddingBottom: '0' }}>
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th 
                      className={getHeaderStyle('team')}
                      onClick={() => handleHeaderClick('team')}
                      style={{ width: '50px' }}
                    >
                      <div className="flex items-center justify-center group">
                        <span className="font-semibold"></span>
                        {getSortIndicator('team')}
                      </div>
                    </th>
                    <th 
                      className={getHeaderStyle('player')}
                      onClick={() => handleHeaderClick('player')}
                      style={{ width: '20px' }}
                    >
                      <div className="flex items-center justify-between group">
                        <span className="font-semibold">Player</span>
                      </div>
                    </th>
                    <th 
                      className="text-center py-1 px-2 font-normal text-white"
                      style={{ width: '60px' }}
                    >
                      <div className="flex items-center justify-center">
                        <span className="font-semibold">Position</span>
                      </div>
                    </th>
                    <th 
                      className={getHeaderStyle('exposure')}
                      onClick={() => handleHeaderClick('exposure')}
                      style={{ width: '50px' }}
                    >
                      <div className="flex items-center justify-center group">
                        <span className="font-semibold">Drafted %</span>
                        {getSortIndicator('exposure')}
                      </div>
                    </th>
                    <th 
                      className={getHeaderStyle('leagues')}
                      onClick={() => handleHeaderClick('leagues')}
                      style={{ width: '60px' }}
                    >
                      <div className="flex items-center justify-center group">
                        <span className="font-semibold">Drafted #</span>
                      </div>
                    </th>
                    <th 
                      className={getHeaderStyle('entryFee')}
                      onClick={() => handleHeaderClick('entryFee')}
                      style={{ width: '70px' }}
                    >
                      <div className="flex items-center justify-center group">
                        <span className="font-semibold">Drafted $</span>
                      </div>
                    </th>
                    <th 
                      className={`${getHeaderStyle('apd')} group relative`}
                      onClick={() => handleHeaderClick('apd')}
                      style={{ width: '60px' }}
                    >
                      <div className="flex items-center justify-center">
                        <span className="font-semibold">APD</span>
                      </div>
                      <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap border border-gray-600" style={{ zIndex: 9999 }}>
                        Average Position Drafted
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player, index) => (
                    <tr key={`top-${index}`} className="border-b border-gray-700 hover:bg-white/5">
                      <td className="py-1 px-1 text-center">
                        <img 
                          src={getNflLogoUrl(player.team)}
                          alt={`${player.team} logo`}
                          className="w-8 h-8 object-contain mx-auto"
                          onError={(e) => {
                            e.target.src = `/logos/nfl/default.png`
                          }}
                        />
                      </td>
                      <td className="py-1 px-1 font-normal text-white" style={{ whiteSpace: 'nowrap', maxWidth: '100px' }}>
                        {player.name}
                      </td>
                      <td className="py-1 px-1 text-center">
                        <span
                          className="px-4 py-1 rounded text-xs font-normal inline-block"
                          style={{
                            backgroundColor: getPositionColor(player.position),
                            color: '#000',
                            width: '60px'
                          }}
                        >
                          {player.position}
                        </span>
                      </td>
                      <td className="py-1 px-1 font-normal text-white text-center">
                        {exposureData?.playerExposure ? 
                          Math.round((player.exposure / 210) * 100) : 
                          player.exposure
                        }%
                      </td>
                      <td className="py-1 px-1 text-center text-white">{player.leagues}</td>
                      <td className="py-1 px-1 text-center text-white">${player.entryFee.toLocaleString()}</td>
                      <td className="py-1 px-1 text-center text-white">{player.averagePick ? player.averagePick.toFixed(1) : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="w-full">
          {/* Player Exposure - Bottom Container */}
          <div className="w-full">
            <div className="bg-gray-900 rounded-xl p-6 border-4 border-[#3B82F6] overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>

              {/* Player Table with controls inside */}
              <div className="overflow-x-auto overflow-y-auto bg-gray-800 rounded-lg p-4" style={{ height: '100%', marginBottom: '0', paddingBottom: '0' }}>
                
                {/* APD Range Slider at Top of Table */}
              <div className="flex justify-end mb-4">
                <div className="flex flex-col space-y-1">
                  <div className="bg-gray-900 rounded px-3 text-white flex flex-col justify-center" style={{ width: '241px', height: '84px' }}>
                    <div className="flex items-center justify-between text-xs">
                      <span>{apdRange[0]}</span>
                      <span className="text-gray-400">APD</span>
                      <span>{apdRange[1]}</span>
                    </div>
                    <div className="relative mt-1">
                      <div className="h-1 bg-gray-600 rounded-full">
                        <div 
                          className="h-1 bg-white rounded-full"
                          style={{
                            marginLeft: `${((apdRange[0] - 1) / (maxApd - 1)) * 100}%`,
                            width: `${((apdRange[1] - apdRange[0]) / (maxApd - 1)) * 100}%`
                          }}
                        ></div>
                      </div>
                      {/* Min handle */}
                      <div 
                        className="absolute w-5 h-5 bg-white border-2 border-[#3B82F6] rounded-full cursor-pointer transform -translate-y-1.5 -translate-x-2.5"
                        style={{
                          left: `${((apdRange[0] - 1) / (maxApd - 1)) * 100}%`,
                          top: '0px'
                        }}
                      ></div>
                      {/* Max handle */}
                      <div 
                        className="absolute w-5 h-5 bg-white border-2 border-[#3B82F6] rounded-full cursor-pointer transform -translate-y-1.5 -translate-x-2.5"
                        style={{
                          left: `${((apdRange[1] - 1) / (maxApd - 1)) * 100}%`,
                          top: '0px'
                        }}
                      ></div>
                      <input
                        type="range"
                        min="1"
                        max={maxApd}
                        value={apdRange[0]}
                        onChange={(e) => {
                          const newMin = parseInt(e.target.value);
                          if (newMin <= apdRange[1]) {
                            setApdRange([newMin, apdRange[1]]);
                          }
                        }}
                        className="absolute top-0 w-full h-1 opacity-0 cursor-pointer"
                      />
                      <input
                        type="range"
                        min="1"
                        max={maxApd}
                        value={apdRange[1]}
                        onChange={(e) => {
                          const newMax = parseInt(e.target.value);
                          if (newMax >= apdRange[0]) {
                            setApdRange([apdRange[0], newMax]);
                          }
                        }}
                        className="absolute top-0 w-full h-1 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Bar and Position Buttons Row */}
              <div className="flex items-center space-x-4 mb-4">
                                {/* Search Bar */}
                <div className="relative flex-1" style={{ minHeight: '44px' }}>
                  <div className="flex flex-wrap items-center gap-1 bg-gray-800/70 text-white px-4 py-2 rounded-lg border border-gray-600/50 focus-within:border-[#59c5bf] min-h-[44px]" style={{ width: '51%' }}>
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

                {/* Position Buttons - Hidden when filters dropdown is populated */}
                {!showSuggestions && (
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => togglePosition('QB')}
                      className={`px-3 py-1 rounded font-normal ${
                      selectedPositions.includes('QB') 
                          ? 'bg-[#F472B6] text-white border border-[#F472B6]' 
                          : 'bg-transparent text-white border-2 border-[#E066A5] hover:border-[#F472B6]'
                    }`}
                      style={{ width: '68px' }}
                  >
                    QB
                  </button>
                  <button
                    onClick={() => togglePosition('RB')}
                      className={`px-3 py-1 rounded font-normal ${
                      selectedPositions.includes('RB') 
                          ? 'bg-[#0fba80] text-white border border-[#0fba80]' 
                          : 'bg-transparent text-white border-2 border-[#0da673] hover:border-[#0fba80]'
                    }`}
                      style={{ width: '68px' }}
                  >
                    RB
                  </button>
                  <button
                    onClick={() => togglePosition('WR')}
                      className={`px-3 py-1 rounded font-normal ${
                      selectedPositions.includes('WR') 
                          ? 'bg-[#377aff] text-white border border-[#377aff]' 
                          : 'bg-transparent text-white border-2 border-[#316ee6] hover:border-[#377aff]'
                    }`}
                      style={{ width: '68px' }}
                  >
                    WR
                  </button>
                  <button
                    onClick={() => togglePosition('TE')}
                      className={`px-3 py-1 rounded font-normal ${
                      selectedPositions.includes('TE') 
                          ? 'bg-[#7C3AED] text-white border border-[#7C3AED]' 
                          : 'bg-transparent text-white border-2 border-[#7033d6] hover:border-[#7C3AED]'
                    }`}
                      style={{ width: '68px' }}
                  >
                    TE
                  </button>
                                      <button
                      onClick={() => {
                        setSelectedDraftStatus('all');
                        setSelectedPositions([...POSITIONS]);
                        setApdRange([1, maxApd]);
                        clearAllSearch();
                        setSortBy('exposure');
                        setSortOrder('desc');
                      }}
                      className="bg-transparent text-white border-2 border-[#3B82F6] px-3 py-1 rounded font-normal hover:border-[#3B82F6]"
                      style={{ width: '68px' }}
                    >
                      Clear
                    </button>
                  </div>
                )}
                </div>
              </div>

              {/* Player Table - moved directly under search */}
              <div className="overflow-x-auto overflow-y-auto bg-gray-800 rounded-lg p-4" style={{ height: 'calc(100% - 200px)', marginBottom: '0', paddingBottom: '0' }}>
                <table className="min-w-full">
            <thead>
                    <tr className="border-b border-gray-600">
                      <th 
                        className={getHeaderStyle('team')}
                        onClick={() => handleHeaderClick('team')}
                        style={{ width: '50px' }}
                      >
                        <div className="flex items-center justify-center group">
                          <span className="font-semibold"></span>
                          {getSortIndicator('team')}
                        </div>
                      </th>
                      <th 
                        className={getHeaderStyle('player')}
                        onClick={() => handleHeaderClick('player')}
                        style={{ width: '20px' }}
                      >
                        <div className="flex items-center justify-between group">
                          <span className="font-semibold">Player</span>
                        </div>
                      </th>
                      <th 
                        className="text-center py-1 px-2 font-normal text-white"
                        style={{ width: '60px' }}
                      >
                        <div className="flex items-center justify-center">
                          <span className="font-semibold">Position</span>
                        </div>
                      </th>
                      <th 
                        className={getHeaderStyle('exposure')}
                        onClick={() => handleHeaderClick('exposure')}
                        style={{ width: '50px' }}
                      >
                        <div className="flex items-center justify-center group">
                          <span className="font-semibold">Drafted %</span>
                          {getSortIndicator('exposure')}
                        </div>
                      </th>
                      <th 
                        className={getHeaderStyle('leagues')}
                        onClick={() => handleHeaderClick('leagues')}
                        style={{ width: '60px' }}
                      >
                        <div className="flex items-center justify-center group">
                          <span className="font-semibold">Drafted #</span>
                        </div>
                      </th>
                      <th 
                        className={getHeaderStyle('entryFee')}
                        onClick={() => handleHeaderClick('entryFee')}
                        style={{ width: '70px' }}
                      >
                        <div className="flex items-center justify-center group">
                          <span className="font-semibold">Drafted $</span>
                        </div>
                      </th>

                      <th 
                        className={`${getHeaderStyle('apd')} group relative`}
                        onClick={() => handleHeaderClick('apd')}
                        style={{ width: '60px' }}
                      >
                        <div className="flex items-center justify-center">
                          <span className="font-semibold">APD</span>
                        </div>
                        <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap border border-gray-600" style={{ zIndex: 9999 }}>
                          Average Position Drafted
                        </div>
                      </th>
              </tr>
            </thead>
                <tbody>
                    {allPlayers.map((player, index) => (
                      <tr key={index} className="border-b border-gray-700 hover:bg-white/5">
                        <td className="py-1 px-1 text-center">
                          <img 
                            src={getNflLogoUrl(player.team)}
                            alt={`${player.team} logo`}
                            className="w-8 h-8 object-contain mx-auto"
                            onError={(e) => {
                              e.target.src = `/logos/nfl/default.png`
                            }}
                          />
                        </td>
                        <td className="py-1 px-1 font-normal text-white" style={{ whiteSpace: 'nowrap', maxWidth: '100px' }}>
                          {player.name}
                        </td>
                        <td className="py-1 px-1 text-center">
                          <span
                            className="px-4 py-1 rounded text-xs font-normal inline-block"
                            style={{
                              backgroundColor: getPositionColor(player.position),
                              color: '#000',
                              width: '60px'
                            }}
                          >
                            {player.position}
                          </span>
                        </td>
                        <td className="py-1 px-1 font-normal text-white text-center">
                          {player.exposure > 0 ? 
                            Math.round((player.exposure / 210) * 100) : 
                            0
                          }%
                        </td>
                        <td className="py-1 px-1 text-center text-white">{player.leagues}</td>
                        <td className="py-1 px-1 text-center text-white">${player.entryFee.toLocaleString()}</td>
                        <td className="py-1 px-1 text-center text-white">{player.averagePick ? player.averagePick.toFixed(1) : 'N/A'}</td>
                      </tr>
                    ))}
            </tbody>
          </table>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
      <div className="pb-8"></div>
    </div>
  );
} 