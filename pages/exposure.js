import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export default function Exposure() {
  const [exposureData, setExposureData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState('all');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [selectedDraftStatus, setSelectedDraftStatus] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [sortBy, setSortBy] = useState('exposure');
  const [sortOrder, setSortOrder] = useState('desc');
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
    const textAlign = (column === 'leagues' || column === 'exposure' || column === 'salary' || column === 'position') ? 'text-center' : 'text-left';
    return `${textAlign} py-1 px-2 font-normal cursor-pointer transition-all duration-200 select-none ${
      isActive 
        ? 'text-[#3B82F6]' 
        : 'text-white hover:bg-white/5'
    }`;
  };

  // Mock data structure based on the image
  const mockExposureData = {
    tournaments: [
      { id: 'topdog', name: 'the TopDog', entries: 1200, userEntries: 8, entryFee: 20, prizes: 15000000, type: 'TD', draftDate: '2024-05-15', isPostDraft: true }
    ],
    playerExposure: [
      { name: 'Patrick Mahomes', position: 'QB', team: 'KC', exposure: 40, leagues: 4, tournament: 'topdog', draftStatus: 'post-draft', salary: 80 },
      { name: 'Christian McCaffrey', position: 'RB', team: 'SF', exposure: 30, leagues: 3, tournament: 'topdog', draftStatus: 'post-draft', salary: 60 },
      { name: 'Travis Kelce', position: 'TE', team: 'KC', exposure: 20, leagues: 2, tournament: 'topdog', draftStatus: 'post-draft', salary: 40 }
    ],
    teamExposure: [
      { team: 'KC', exposure: 35, players: 8, tournament: 'topdog' },
      { team: 'SF', exposure: 28, players: 6, tournament: 'topdog' }
    ],
    positionDistribution: {
      QB: 3,
      RB: 6,
      WR: 6,
      TE: 3
    }
  };

  useEffect(() => {
    // For now, use mock data. In production, fetch real data from Firebase
    setExposureData(mockExposureData);
    setLoading(false);
  }, []);

  const getPositionColor = (position) => {
    switch (position) {
      case 'QB': return '#56A0D3';
      case 'RB': return '#059669';
      case 'WR': return '#fbbf24';
      case 'TE': return '#6366f1';
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

  const filteredPlayers = exposureData?.playerExposure?.filter(player => {
    const tournamentMatch = selectedTournament === 'all' || player.tournament === selectedTournament;
    const positionMatch = selectedPosition === 'all' || 
                         player.position === selectedPosition || 
                         (selectedPosition === 'FLEX' && ['RB', 'WR', 'TE'].includes(player.position));
    
    // Handle draft status filtering with tournament-specific post-draft options
    let draftStatusMatch = true;
    if (selectedDraftStatus === 'pre-draft') {
      draftStatusMatch = player.draftStatus === 'pre-draft';
    } else if (selectedDraftStatus === 'post-draft-topdog') {
      draftStatusMatch = player.draftStatus === 'post-draft' && player.tournament === 'topdog';
    } else if (selectedDraftStatus === 'post-draft-bigdog') {
      draftStatusMatch = player.draftStatus === 'post-draft' && player.tournament === 'bigdog';
    } else if (selectedDraftStatus === 'post-draft-bottomdog') {
      draftStatusMatch = player.draftStatus === 'post-draft' && player.tournament === 'bottomdog';
    } else if (selectedDraftStatus === 'post-draft') {
      draftStatusMatch = player.draftStatus === 'post-draft';
    }
    
    const teamMatch = selectedTeam === 'all' || player.team === selectedTeam;
    return tournamentMatch && positionMatch && draftStatusMatch && teamMatch;
  }).sort((a, b) => {
    if (sortBy === 'exposure') {
      return sortOrder === 'desc' ? b.exposure - a.exposure : a.exposure - b.exposure;
    } else if (sortBy === 'leagues') {
      return sortOrder === 'desc' ? b.leagues - a.leagues : a.leagues - b.leagues;
    } else if (sortBy === 'salary') {
      return sortOrder === 'desc' ? b.salary - a.salary : a.salary - b.salary;
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
    }
    return 0;
  }) || [];

  const filteredTeams = exposureData?.teamExposure?.filter(team => {
    return selectedTournament === 'all' || team.tournament === selectedTournament;
  }) || [];

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading exposure data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Exposure Report - TopDog.dog</title>
        <meta name="description" content="Check your player and team exposure across all drafts and leagues." />
      </Head>
      
      {/* Subheader Navigation */}
      <section className="bg-gray-900 border-b border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex justify-start space-x-8 h-14 items-center">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors font-medium text-base pb-1">
              Draft Lobby
            </Link>
            <Link href="/my-teams" className="text-gray-300 hover:text-white transition-colors font-medium text-base pb-1">
              My Teams
            </Link>
            <span className="text-yellow-400 font-medium border-b-2 border-yellow-400 pb-1 text-base">
              Exposure Report
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto px-4 pt-8" style={{ maxWidth: 'calc(48rem + 5% + 50px)' }}>

        <div className="w-full">
          {/* Player Exposure */}
          <div className="w-full">
            <div className="bg-gray-900 rounded-xl p-6 border-4 border-[#3B82F6] min-h-[710px]">
              <div className="flex justify-end items-center mb-6">
                <div className="flex space-x-4">
                  <select
                    value={selectedDraftStatus}
                    onChange={(e) => setSelectedDraftStatus(e.target.value)}
                    className="bg-gray-900 border border-[#3B82F6] rounded px-3 py-1 text-white"
                  >
                    <option value="all">All Contests ({getPlayerCount('all')})</option>
                    <option value="pre-draft">&nbsp;&nbsp;&nbsp;&nbsp;Pre-Draft ({getPlayerCount('pre-draft')})</option>
                    <option value="post-draft">&nbsp;&nbsp;&nbsp;&nbsp;Post-Draft ({getPlayerCount('post-draft')})</option>
                    <option value="post-draft-topdog">TopDog ({getPlayerCount('post-draft-topdog')})</option>
                  </select>
                  <select
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    className="bg-gray-900 border border-[#3B82F6] rounded px-3 py-1 text-white"
                  >
                    <option value="all">Position</option>
                    <option value="QB">QB</option>
                    <option value="RB">RB</option>
                    <option value="WR">WR</option>
                    <option value="TE">TE</option>
                    <option value="FLEX">FLEX</option>
                  </select>
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="bg-gray-900 border border-[#3B82F6] rounded px-3 py-1 text-white"
                  >
                    <option value="all">NFL Team</option>
                    <option value="KC">KC</option>
                    <option value="SF">SF</option>
                    <option value="MIA">MIA</option>
                    <option value="BUF">BUF</option>
                    <option value="PHI">PHI</option>
                    <option value="HOU">HOU</option>
                    <option value="BAL">BAL</option>
                  </select>
                  <button
                    onClick={() => {
                      setSelectedDraftStatus('all');
                      setSelectedPosition('all');
                      setSelectedTeam('all');
                      setSortBy('exposure');
                      setSortOrder('desc');
                    }}
                    className="bg-[#3B82F6] text-gray-900 px-3 py-1 rounded font-normal"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
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
                        style={{ width: '80px' }}
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
                          <span className="font-semibold">Drafted (%)</span>
                        </div>
                      </th>
                      <th 
                        className={getHeaderStyle('leagues')}
                        onClick={() => handleHeaderClick('leagues')}
                        style={{ width: '60px' }}
                      >
                        <div className="flex items-center justify-center group">
                          <span className="font-semibold">Drafted (#)</span>
                        </div>
                      </th>
                      <th 
                        className={getHeaderStyle('salary')}
                        onClick={() => handleHeaderClick('salary')}
                        style={{ width: '70px' }}
                      >
                        <div className="flex items-center justify-center group">
                          <span className="font-semibold">Drafted ($)</span>
                        </div>
                      </th>
              </tr>
            </thead>
            <tbody>
                    {filteredPlayers.map((player, index) => (
                      <tr key={index} className="border-b border-gray-700 hover:bg-white/5">
                        <td className="py-1 px-2 text-center">
                          <img 
                            src={`https://a.espncdn.com/i/teamlogos/nfl/500/${player.team.toLowerCase()}.png`}
                            alt={`${player.team} logo`}
                            className="w-8 h-8 object-contain mx-auto"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.team)}&background=3b82f6&color=ffffff&size=32&rounded=true`
                            }}
                          />
                        </td>
                        <td className="py-1 px-2 font-normal text-white" style={{ whiteSpace: 'nowrap' }}>
                          {player.name}
                        </td>
                        <td className="py-1 px-2 text-center">
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
                        <td className="py-1 px-2 font-normal text-white text-center">{player.exposure}%</td>
                        <td className="py-1 px-2 text-center text-white">{player.leagues}</td>
                        <td className="py-1 px-2 text-center text-white">${player.salary.toLocaleString()}</td>
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
  );
} 