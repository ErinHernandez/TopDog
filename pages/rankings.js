import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Modal from '../components/Modal';

export default function Rankings() {
  const [activeTab, setActiveTab] = useState('limits');
  const [rankings, setRankings] = useState([]);
  const [limits, setLimits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [positionalLimits, setPositionalLimits] = useState({
    QB: 2,
    RB: 6,
    WR: 8,
    TE: 3
  });
  const [draggedPlayer, setDraggedPlayer] = useState(null);
  const [positionFilter, setPositionFilter] = useState('overall');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvUploadError, setCsvUploadError] = useState('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Mock rankings data - in a real app, this would come from an API
  const mockRankings = {
    overall: [
      { id: 1, name: 'Ja\'Marr Chase', team: 'CIN', position: 'WR', adp: 1.1, proj: 264.0, tier: 1 },
      { id: 2, name: 'Bijan Robinson', team: 'ATL', position: 'RB', adp: 2.6, proj: 274.7, tier: 1 },
      { id: 3, name: 'Justin Jefferson', team: 'MIN', position: 'WR', adp: 3.8, proj: 245.3, tier: 1 },
      { id: 4, name: 'Saquon Barkley', team: 'PHI', position: 'RB', adp: 4.3, proj: 284.7, tier: 2 },
      { id: 5, name: 'CeeDee Lamb', team: 'DAL', position: 'WR', adp: 4.4, proj: 236.6, tier: 2 },
      { id: 6, name: 'Jahmyr Gibbs', team: 'DET', position: 'RB', adp: 5.3, proj: 273.3, tier: 2 },
      { id: 7, name: 'Christian McCaffrey', team: 'SF', position: 'RB', adp: 7.4, proj: 243.5, tier: 2 },
      { id: 8, name: 'Puka Nacua', team: 'LAR', position: 'WR', adp: 8.3, proj: 227.7, tier: 2 },
      { id: 9, name: 'Malik Nabers', team: 'NYG', position: 'WR', adp: 9.5, proj: 215.7, tier: 3 },
      { id: 10, name: 'Amon-Ra St. Brown', team: 'DET', position: 'WR', adp: 11.6, proj: 219.8, tier: 3 },
      { id: 11, name: 'Josh Allen', team: 'BUF', position: 'QB', adp: 15.2, proj: 298.5, tier: 1 },
      { id: 12, name: 'Patrick Mahomes', team: 'KC', position: 'QB', adp: 18.5, proj: 285.2, tier: 1 },
      { id: 13, name: 'Travis Kelce', team: 'KC', position: 'TE', adp: 7.1, proj: 198.3, tier: 1 },
      { id: 14, name: 'Sam LaPorta', team: 'DET', position: 'TE', adp: 12.8, proj: 185.7, tier: 2 },
      { id: 15, name: 'Trey McBride', team: 'ARI', position: 'TE', adp: 16.2, proj: 172.4, tier: 2 },
    ],
    qb: [
      { id: 11, name: 'Josh Allen', team: 'BUF', position: 'QB', adp: 15.2, proj: 298.5, tier: 1 },
      { id: 12, name: 'Patrick Mahomes', team: 'KC', position: 'QB', adp: 18.5, proj: 285.2, tier: 1 },
      { id: 16, name: 'Jalen Hurts', team: 'PHI', position: 'QB', adp: 22.1, proj: 275.8, tier: 2 },
      { id: 17, name: 'Lamar Jackson', team: 'BAL', position: 'QB', adp: 25.8, proj: 268.3, tier: 2 },
      { id: 18, name: 'Dak Prescott', team: 'DAL', position: 'QB', adp: 28.3, proj: 262.1, tier: 2 },
    ],
    rb: [
      { id: 2, name: 'Bijan Robinson', team: 'ATL', position: 'RB', adp: 2.6, proj: 274.7, tier: 1 },
      { id: 4, name: 'Saquon Barkley', team: 'PHI', position: 'RB', adp: 4.3, proj: 284.7, tier: 2 },
      { id: 6, name: 'Jahmyr Gibbs', team: 'DET', position: 'RB', adp: 5.3, proj: 273.3, tier: 2 },
      { id: 7, name: 'Christian McCaffrey', team: 'SF', position: 'RB', adp: 7.4, proj: 243.5, tier: 2 },
      { id: 19, name: 'Josh Jacobs', team: 'GB', position: 'RB', adp: 10.1, proj: 235.2, tier: 3 },
    ],
    wr: [
      { id: 1, name: 'Ja\'Marr Chase', team: 'CIN', position: 'WR', adp: 1.1, proj: 264.0, tier: 1 },
      { id: 3, name: 'Justin Jefferson', team: 'MIN', position: 'WR', adp: 3.8, proj: 245.3, tier: 1 },
      { id: 5, name: 'CeeDee Lamb', team: 'DAL', position: 'WR', adp: 4.4, proj: 236.6, tier: 2 },
      { id: 8, name: 'Puka Nacua', team: 'LAR', position: 'WR', adp: 8.3, proj: 227.7, tier: 2 },
      { id: 9, name: 'Malik Nabers', team: 'NYG', position: 'WR', adp: 9.5, proj: 215.7, tier: 3 },
      { id: 10, name: 'Amon-Ra St. Brown', team: 'DET', position: 'WR', adp: 11.6, proj: 219.8, tier: 3 },
    ],
    te: [
      { id: 13, name: 'Travis Kelce', team: 'KC', position: 'TE', adp: 7.1, proj: 198.3, tier: 1 },
      { id: 14, name: 'Sam LaPorta', team: 'DET', position: 'TE', adp: 12.8, proj: 185.7, tier: 2 },
      { id: 15, name: 'Trey McBride', team: 'ARI', position: 'TE', adp: 16.2, proj: 172.4, tier: 2 },
      { id: 20, name: 'Mark Andrews', team: 'BAL', position: 'TE', adp: 19.5, proj: 165.8, tier: 3 },
      { id: 21, name: 'Jake Ferguson', team: 'DAL', position: 'TE', adp: 22.1, proj: 158.3, tier: 3 },
    ]
  };

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setRankings(mockRankings[positionFilter]);
      setLimits(mockRankings.overall.slice(0, 10)); // Start with top 10 in limits
      setLoading(false);
    }, 500);
  }, [positionFilter]);

  const getPositionColor = (position) => {
    switch (position) {
      case 'QB': return 'text-purple-400';
      case 'RB': return 'text-green-400';
      case 'WR': return 'text-orange-400';
      case 'TE': return 'text-pink-400';
      default: return 'text-gray-400';
    }
  };

  const handleDragStart = (e, player) => {
    console.log('Drag start:', player);
    setDraggedPlayer(player);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(player));
  };

  const handleDragOver = (e, index = null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDraggingOver(true);
    
    // Handle different drop zone formats
    if (typeof index === 'string' && index.startsWith('before-')) {
      setDragOverIndex(index);
    } else {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e, targetList, targetIndex) => {
    e.preventDefault();
    console.log('Drop event:', targetList, targetIndex);
    
    if (!draggedPlayer) {
      console.log('No dragged player');
      return;
    }

    const sourceList = draggedPlayer.sourceList || 'rankings';
    const sourceIndex = draggedPlayer.sourceIndex || 0;

    // Handle before-${index} format for drop zones
    let actualTargetIndex = targetIndex;
    if (typeof targetIndex === 'string' && targetIndex.startsWith('before-')) {
      actualTargetIndex = parseInt(targetIndex.replace('before-', ''));
    }

    if (sourceList === targetList && sourceIndex === actualTargetIndex) {
      console.log('Same position drop, ignoring');
      return;
    }

    if (targetList === 'limits') {
      // Check positional limits
      const currentCount = limits.filter(p => p.position === draggedPlayer.position).length;
      const limit = positionalLimits[draggedPlayer.position];
      
      if (currentCount >= limit) {
        alert(`Maximum ${limit} ${draggedPlayer.position} players allowed`);
        return;
      }
    }

    // Update the appropriate list
    if (sourceList === 'rankings' && targetList === 'limits') {
      // Remove from rankings, add to limits
      const newRankings = rankings.filter(p => p.id !== draggedPlayer.id);
      setRankings(newRankings);
      const newLimits = [...limits];
      newLimits.splice(actualTargetIndex, 0, draggedPlayer);
      setLimits(newLimits);
      console.log('Moved from rankings to limits');
    } else if (sourceList === 'limits' && targetList === 'limits') {
      // Reorder within limits
      const newLimits = [...limits];
      const [removed] = newLimits.splice(sourceIndex, 1);
      newLimits.splice(actualTargetIndex, 0, removed);
      setLimits(newLimits);
      console.log('Reordered within limits');
    }
    
    setDraggedPlayer(null);
  };

  const handleRemoveFromLimits = (index) => {
    const newLimits = [...limits];
    newLimits.splice(index, 1);
    setLimits(newLimits);
  };

  const handleQueuePlayer = (player) => {
    // Check positional limits
    const currentCount = limits.filter(p => p.position === player.position).length;
    const limit = positionalLimits[player.position];
    
    if (currentCount >= limit) {
      alert(`Maximum ${limit} ${player.position} players allowed`);
      return;
    }

    // Add player to limits if not already there
    if (!limits.find(p => p.id === player.id)) {
      setLimits([...limits, player]);
      console.log('Queued player:', player.name);
    } else {
      alert('Player is already in your rankings');
    }
  };

  const handlePositionalLimitChange = (position, value) => {
    setPositionalLimits(prev => ({
      ...prev,
      [position]: Math.max(0, parseInt(value) || 0)
    }));
  };

  const parseCSV = (csvContent) => {
    try {
      setCsvUploadError('');
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) {
        setCsvUploadError('CSV file is empty or invalid');
        return;
      }

      // Parse headers
      const headers = lines[0].split(',').map(h => h.trim());
      const idIndex = headers.findIndex(h => h.toLowerCase() === 'id');
      const nameIndex = headers.findIndex(h => h.toLowerCase() === 'name');
      const teamIndex = headers.findIndex(h => h.toLowerCase() === 'team');
      const positionIndex = headers.findIndex(h => h.toLowerCase() === 'position');
      const adpIndex = headers.findIndex(h => h.toLowerCase() === 'adp');
      const rankIndex = headers.findIndex(h => h.toLowerCase() === 'rank');
      
      // Handle "P Rk" column (position rank)
      let projIndex = headers.findIndex(h => h.toLowerCase() === 'proj');
      if (projIndex === -1) {
        projIndex = headers.findIndex(h => h.toLowerCase() === 'p rk');
      }

      if (nameIndex === -1 || teamIndex === -1 || positionIndex === -1) {
        setCsvUploadError('CSV must contain Name, Team, and Position columns');
        return;
      }

      // Parse data
      const parsedPlayers = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < headers.length) continue;

        // Skip empty rows
        if (!values[nameIndex]) continue;

        const player = {
          id: idIndex !== -1 ? parseInt(values[idIndex]) || i : i,
          name: values[nameIndex],
          team: values[teamIndex],
          position: values[positionIndex],
          adp: adpIndex !== -1 ? parseFloat(values[adpIndex]) || 0 : 0,
          proj: 0, // Will calculate based on rank
          tier: 1 // Default tier
        };

        // If we have a rank, use it to calculate a pseudo projection value
        if (rankIndex !== -1) {
          const rank = parseInt(values[rankIndex]) || 0;
          // Generate a projection value that decreases with rank
          player.proj = Math.max(100, 300 - rank * 2);
        }

        parsedPlayers.push(player);
      }

      // Update limits with parsed players
      setLimits(parsedPlayers);
      setShowCsvModal(false);
      setCsvText('');
      alert(`Successfully imported ${parsedPlayers.length} players`);
    } catch (error) {
      setCsvUploadError('Error parsing CSV: ' + error.message);
    }
  };

  const handleCsvUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        setCsvText(content);
        parseCSV(content);
      };
      reader.readAsText(file);
    }
  };

  const handleCsvTextSubmit = () => {
    if (csvText.trim()) {
      parseCSV(csvText);
    }
  };

  const exportToCSV = () => {
    const headers = ['Id', 'Name', 'Team', 'Position', 'ADP', 'Proj'];
    const rows = limits.map((player, index) => [
      index + 1,
      player.name,
      player.team,
      player.position,
      player.adp,
      player.proj
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rankings.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleClearAll = () => {
    setLimits([]);
  };

  const handleSave = () => {
    // Save rankings to database or local storage
    console.log('Saving rankings:', limits);
    alert('Rankings saved successfully!');
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDragOverFile = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          setCsvText(content);
          parseCSV(content);
        };
        reader.readAsText(file);
      } else {
        setCsvUploadError('Please upload a CSV file');
      }
    }
  };

  return (
    <>
      <Head>
        <title>Player Rankings - TopDog.dog</title>
        <meta name="description" content="Fantasy football player rankings and ADP data" />
      </Head>

      <div className="min-h-screen bg-gray-900">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <p className="text-gray-300">
                Drag and drop players to set your autodraft preferences
              </p>
            </div>

            {/* Position Filters */}
            <div className="mb-6">
              <div className="flex space-x-2">
                <button
                  onClick={() => setPositionFilter('overall')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    positionFilter === 'overall' ? 'bg-[#3B82F6] text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  All
                </button>
                <button
                  onClick={() => setPositionFilter('qb')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    positionFilter === 'qb' ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  QB
                </button>
                <button
                  onClick={() => setPositionFilter('rb')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    positionFilter === 'rb' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  RB
                </button>
                <button
                  onClick={() => setPositionFilter('wr')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    positionFilter === 'wr' ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  WR
                </button>
                <button
                  onClick={() => setPositionFilter('te')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    positionFilter === 'te' ? 'bg-pink-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  TE
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                {/* Players Container */}
              <div className="lg:col-span-2">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h2 className="text-xl font-bold mb-4" style={{ color: '#3B82F6' }}>
                    Players
                  </h2>
                  
                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B82F6]"></div>
                      <span className="ml-3 text-gray-300">Loading rankings...</span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {rankings.map((player, index) => (
                        <div
                          key={player.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, { ...player, sourceList: 'rankings', sourceIndex: index })}
                          className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-move border border-transparent hover:border-[#3B82F6]"
                          style={{ userSelect: 'none' }}
                        >
                          <div className="flex items-center space-x-3">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                            <div className="flex items-center space-x-2">
                              <div className="font-semibold text-white">{player.name}</div>
                              <div className="text-sm text-gray-300">
                                {player.position} • {player.team}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <div className="text-sm text-gray-400">ADP</div>
                                <div className="font-semibold text-white">{player.adp}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-400">Proj</div>
                                <div className="font-semibold text-white">{player.proj}</div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleQueuePlayer(player)}
                              className="px-3 py-1 bg-[#3B82F6] text-white text-sm rounded hover:bg-[#1d4ed8] transition-colors"
                            >
                              Queue
                            </button>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Secondary Container - Rankings and Positional Limits */}
              <div className="lg:col-span-2">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  {/* Secondary Tabs */}
                  <div className="flex space-x-1 bg-gray-700 rounded-lg p-1 mb-6">
                    <button
                      onClick={() => setActiveTab('limits')}
                      className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                        activeTab === 'limits' ? 'bg-[#3B82F6] text-white' : 'text-gray-300 hover:text-white hover:bg-gray-600'
                      }`}
                    >
                      Rankings ({limits.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('positional')}
                      className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                        activeTab === 'positional' ? 'bg-[#3B82F6] text-white' : 'text-gray-300 hover:text-white hover:bg-gray-600'
                      }`}
                    >
                      Limits
                    </button>
                  </div>

                  {/* Limits Tab Content */}
                  {activeTab === 'limits' && (
                    <div 
                      className={`space-y-2 max-h-64 overflow-y-auto border-2 border-dashed rounded-lg p-2 transition-colors ${
                        isDraggingOver ? 'border-[#3B82F6] bg-blue-900/20' : 'border-gray-600'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={() => setIsDraggingOver(false)}
                      onDrop={(e) => {
                        handleDrop(e, 'limits', limits.length);
                        setIsDraggingOver(false);
                      }}
                      style={{ minHeight: '200px' }}
                    >
                                              {limits.map((player, index) => (
                          <div key={`${player.id}-${index}`}>
                            {/* Drop line above item */}
                            <div 
                              className={`h-1 rounded transition-all ${
                                dragOverIndex === `before-${index}` ? 'bg-[#3B82F6]' : 'bg-transparent'
                              }`}
                              onDragOver={(e) => handleDragOver(e, `before-${index}`)}
                              onDragLeave={() => setDragOverIndex(null)}
                              onDrop={(e) => {
                                handleDrop(e, 'limits', index);
                                setDragOverIndex(null);
                              }}
                            />
                            
                            <div
                              draggable
                              onDragStart={(e) => handleDragStart(e, { ...player, sourceList: 'limits', sourceIndex: index })}
                              onDragOver={(e) => handleDragOver(e, index)}
                              onDragLeave={() => setDragOverIndex(null)}
                              onDrop={(e) => {
                                handleDrop(e, 'limits', index);
                                setDragOverIndex(null);
                              }}
                              className={`flex items-center justify-between p-3 rounded-lg border cursor-move transition-all ${
                                dragOverIndex === index 
                                  ? 'bg-blue-600 border-[#3B82F6] scale-105' 
                                  : 'bg-gray-700 border-transparent hover:border-[#3B82F6]'
                              }`}
                              style={{ userSelect: 'none' }}
                            >
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <div className="font-semibold text-white">{player.name}</div>
                              <div className="text-sm text-gray-300">
                                {player.position} • {player.team}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <div className="text-sm text-gray-400">ADP</div>
                                <div className="font-semibold text-white">{player.adp}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-400">Proj</div>
                                <div className="font-semibold text-white">{player.proj}</div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveFromLimits(index)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      ))}
                      {limits.length === 0 && (
                        <div 
                          className={`flex items-center justify-center p-8 rounded-lg border-2 border-dashed text-gray-400 transition-all ${
                            isDraggingOver ? 'border-[#3B82F6] bg-blue-900/20' : 'border-gray-500 bg-gray-700'
                          }`}
                          onDragOver={(e) => handleDragOver(e, 'empty')}
                          onDragLeave={() => setIsDraggingOver(false)}
                          onDrop={(e) => {
                            handleDrop(e, 'limits', 0);
                            setIsDraggingOver(false);
                          }}
                        >
                          <div className="text-center">
                            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p>Drop players here</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Drop zone at the end of the list */}
                      {limits.length > 0 && (
                        <div 
                          className={`h-2 rounded transition-all ${
                            dragOverIndex === 'end' ? 'bg-[#3B82F6]' : 'bg-transparent'
                          }`}
                          onDragOver={(e) => handleDragOver(e, 'end')}
                          onDragLeave={() => setDragOverIndex(null)}
                          onDrop={(e) => {
                            handleDrop(e, 'limits', limits.length);
                            setDragOverIndex(null);
                          }}
                        />
                      )}
                    </div>
                  )}

                  {/* Positional Limits Tab Content */}
                  {activeTab === 'positional' && (
                    <div className="p-4 bg-gray-700 rounded-lg">
                      <h3 className="font-semibold text-white mb-4">Positional Limits</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(positionalLimits).map(([position, limit]) => (
                          <div key={position} className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${getPositionColor(position)}`}>
                              {position}
                            </span>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={limit}
                              onChange={(e) => handlePositionalLimitChange(position, e.target.value)}
                              className="w-16 px-2 py-1 bg-gray-600 text-white rounded text-sm border border-gray-500 focus:border-[#3B82F6] focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-3 bg-gray-600 rounded-lg">
                        <h4 className="font-semibold text-white mb-2 text-sm">Current Summary</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {Object.entries(positionalLimits).map(([position, limit]) => {
                            const currentCount = limits.filter(p => p.position === position).length;
                            return (
                              <div key={position} className="flex justify-between">
                                <span className={`font-medium ${getPositionColor(position)}`}>{position}:</span>
                                <span className="text-white">{currentCount}/{limit}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 flex justify-between items-center">
              <div className="flex space-x-4">
                <button 
                  onClick={() => setShowCsvModal(true)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  CSV Upload/Download
                </button>
              </div>
              <div className="flex space-x-4">
                <button 
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Clear
                </button>
                <button 
                  onClick={handleSave}
                  className="px-4 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* CSV Upload/Download Modal */}
      <Modal open={showCsvModal} onClose={() => setShowCsvModal(false)}>
        <div className="w-[700px]">
          <h2 className="text-2xl font-bold mb-6 text-white">CSV upload</h2>
          
          <div className="flex justify-end mb-4 space-x-2">
            <button
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV download
            </button>
            <label className="flex items-center px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors cursor-pointer">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              CSV upload
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
              />
            </label>
          </div>

          <div 
            className={`bg-gray-900 rounded-lg border-2 border-dashed p-8 transition-colors ${
              isDraggingFile ? 'border-[#3B82F6] bg-blue-900/20' : 'border-gray-600'
            }`} 
            style={{ minHeight: '400px' }}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOverFile}
            onDragLeave={handleDragLeave}
            onDrop={handleFileDrop}
          >
            <label className="flex flex-col items-center justify-center h-full cursor-pointer">
              <svg className={`w-16 h-16 mb-4 ${isDraggingFile ? 'text-[#3B82F6]' : 'text-gray-500'} transition-colors`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-300 mb-2 text-center">
                Drag/click here or use the csv upload button to import players from a created list or copy and paste into this text field
              </p>
              <p className="text-gray-500 text-sm text-center">
                Be sure to press save so that your imported players are applied to your rankings.
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
              />
            </label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Or paste your CSV content here..."
              className="mt-6 w-full h-40 p-4 bg-gray-800 text-white border border-gray-700 rounded-lg resize-none focus:outline-none focus:border-[#3B82F6] placeholder-gray-500"
              style={{ fontFamily: 'monospace' }}
            />
          </div>

          {csvUploadError && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-500 text-red-300 rounded-lg">
              {csvUploadError}
            </div>
          )}

          <div className="flex justify-end mt-6 space-x-3">
            <button
              onClick={() => {
                setShowCsvModal(false);
                setCsvText('');
                setCsvUploadError('');
              }}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleCsvTextSubmit}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
} 