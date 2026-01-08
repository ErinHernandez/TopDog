import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { saveCustomRankings, loadCustomRankings, clearCustomRankings } from '../lib/customRankings';
import { PLAYER_POOL } from '../lib/playerPool';
import { POSITIONS } from '../components/draft/v3/constants/positions';

// Mock rankings data - in a real app, this would come from an API
const mockRankings = {
  overall: [
    { id: 1, name: 'Ja\'Marr Chase', team: 'CIN', position: 'WR', adp: 1.1, proj: 264.0, tier: 1, lastYear: 268.3 },
    { id: 2, name: 'Justin Jefferson', team: 'MIN', position: 'WR', adp: 4.0, proj: 239.9, tier: 1, lastYear: 196.4 },
    { id: 3, name: 'Saquon Barkley', team: 'PHI', position: 'RB', adp: 4.4, proj: 284.7, tier: 1, lastYear: 195.2 },
    { id: 4, name: 'CeeDee Lamb', team: 'DAL', position: 'WR', adp: 4.4, proj: 236.6, tier: 2, lastYear: 272.8 },
    { id: 5, name: 'Bijan Robinson', team: 'ATL', position: 'RB', adp: 2.5, proj: 274.7, tier: 2, lastYear: 203.4 },
    { id: 6, name: 'Jahmyr Gibbs', team: 'DET', position: 'RB', adp: 5.2, proj: 273.3, tier: 2, lastYear: 259.8 },
    { id: 7, name: 'Puka Nacua', team: 'LAR', position: 'WR', adp: 8.6, proj: 227.7, tier: 2, lastYear: 239.1 },
    { id: 8, name: 'Malik Nabers', team: 'NYG', position: 'WR', adp: 9.5, proj: 215.7, tier: 3, lastYear: 0 },
    { id: 9, name: 'Ashton Jeanty', team: 'LV', position: 'RB', adp: 12.2, proj: 242.9, tier: 3, lastYear: 0 },
    { id: 10, name: 'Amon-Ra St. Brown', team: 'DET', position: 'WR', adp: 11.7, proj: 219.8, tier: 3, lastYear: 221.7 },
    { id: 11, name: 'Nico Collins', team: 'HOU', position: 'WR', adp: 9.9, proj: 228.6, tier: 3, lastYear: 189.3 },
    { id: 12, name: 'Brian Thomas Jr.', team: 'JAX', position: 'WR', adp: 13.0, proj: 222.8, tier: 3, lastYear: 0 },
    { id: 13, name: 'Brock Bowers', team: 'LV', position: 'TE', adp: 19.0, proj: 189.8, tier: 2, lastYear: 0 },
    { id: 14, name: 'Drake London', team: 'ATL', position: 'WR', adp: 15.9, proj: 201.7, tier: 3, lastYear: 156.2 },
    { id: 15, name: 'Ladd McConkey', team: 'LAC', position: 'WR', adp: 18.7, proj: 198.1, tier: 3, lastYear: 0 },
  ],
  qb: [
    { id: 11, name: 'Josh Allen', team: 'BUF', position: 'QB', adp: 15.2, proj: 298.5, tier: 1, lastYear: 314.2 },
    { id: 12, name: 'Patrick Mahomes', team: 'KC', position: 'QB', adp: 18.5, proj: 285.2, tier: 1, lastYear: 251.8 },
    { id: 16, name: 'Jalen Hurts', team: 'PHI', position: 'QB', adp: 22.1, proj: 275.8, tier: 2, lastYear: 273.4 },
    { id: 17, name: 'Lamar Jackson', team: 'BAL', position: 'QB', adp: 25.8, proj: 268.3, tier: 2, lastYear: 321.6 },
    { id: 18, name: 'Dak Prescott', team: 'DAL', position: 'QB', adp: 28.3, proj: 262.1, tier: 2, lastYear: 282.9 },
  ],
  rb: [
    { id: 2, name: 'Bijan Robinson', team: 'ATL', position: 'RB', adp: 2.6, proj: 274.7, tier: 1, lastYear: 203.4 },
    { id: 4, name: 'Saquon Barkley', team: 'PHI', position: 'RB', adp: 4.3, proj: 284.7, tier: 2, lastYear: 195.2 },
    { id: 6, name: 'Jahmyr Gibbs', team: 'DET', position: 'RB', adp: 5.3, proj: 273.3, tier: 2, lastYear: 259.8 },
    { id: 7, name: 'Christian McCaffrey', team: 'SF', position: 'RB', adp: 7.4, proj: 243.5, tier: 2, lastYear: 215.3 },
    { id: 19, name: 'Josh Jacobs', team: 'GB', position: 'RB', adp: 10.1, proj: 235.2, tier: 3, lastYear: 242.7 },
  ],
  wr: [
    { id: 1, name: 'Ja\'Marr Chase', team: 'CIN', position: 'WR', adp: 1.1, proj: 264.0, tier: 1, lastYear: 268.3 },
    { id: 3, name: 'Justin Jefferson', team: 'MIN', position: 'WR', adp: 3.8, proj: 245.3, tier: 1, lastYear: 196.4 },
    { id: 5, name: 'CeeDee Lamb', team: 'DAL', position: 'WR', adp: 4.4, proj: 236.6, tier: 2, lastYear: 272.8 },
    { id: 8, name: 'Puka Nacua', team: 'LAR', position: 'WR', adp: 8.3, proj: 227.7, tier: 2, lastYear: 239.1 },
    { id: 9, name: 'Malik Nabers', team: 'NYG', position: 'WR', adp: 9.5, proj: 215.7, tier: 3, lastYear: 0 },
    { id: 10, name: 'Amon-Ra St. Brown', team: 'DET', position: 'WR', adp: 11.6, proj: 219.8, tier: 3, lastYear: 221.7 },
  ],
  te: [
    { id: 13, name: 'Travis Kelce', team: 'KC', position: 'TE', adp: 7.1, proj: 198.3, tier: 1, lastYear: 184.9 },
    { id: 14, name: 'Sam LaPorta', team: 'DET', position: 'TE', adp: 12.8, proj: 185.7, tier: 2, lastYear: 219.4 },
    { id: 15, name: 'Trey McBride', team: 'ARI', position: 'TE', adp: 16.2, proj: 172.4, tier: 2, lastYear: 156.8 },
    { id: 20, name: 'Mark Andrews', team: 'BAL', position: 'TE', adp: 19.5, proj: 165.8, tier: 3, lastYear: 87.4 },
    { id: 21, name: 'Jake Ferguson', team: 'DAL', position: 'TE', adp: 22.1, proj: 158.3, tier: 3, lastYear: 134.7 },
  ]
};

export default function Rankings() {
  const [activeTab, setActiveTab] = useState('limits');
  const [rankings, setRankings] = useState(PLAYER_POOL);
  const [limits, setLimits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [positionalLimits, setPositionalLimits] = useState({
    QB: 2,
    RB: 6,
    WR: 8,
    TE: 3
  });
  const [draggedPlayer, setDraggedPlayer] = useState(null);
  const [positionFilters, setPositionFilters] = useState(['overall']);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [sortBy, setSortBy] = useState('adp');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetchUserStats();
    
    // Load saved data from customRankings system
    const savedCustomRankings = loadCustomRankings();
    const savedPositionalLimits = typeof window !== 'undefined' ? localStorage.getItem('rankingsPositionalLimits') : null;
    
    // Convert custom rankings array to limits format
    if (savedCustomRankings && savedCustomRankings.length > 0) {
      const limitsFromCustomRankings = savedCustomRankings.map((playerName, index) => {
        // Find player in PLAYER_POOL to get full data
        const foundPlayer = PLAYER_POOL.find(p => p.name === playerName);
        return foundPlayer || {
          id: index + 1000,
          name: playerName,
          team: 'UNK',
          position: 'UNK',
          adp: 0,
          proj: 0,
          tier: 1,
          lastYear: 0
        };
      });
      setLimits(limitsFromCustomRankings);
    }
    
    if (savedPositionalLimits) {
      try {
        setPositionalLimits(JSON.parse(savedPositionalLimits));
      } catch (error) {
        console.error('Error loading saved positional limits:', error);
      }
    }
  }, []);

  const fetchUserStats = async () => {
    // This function is called for consistency with other pages
    // but rankings page doesn't need to fetch user stats
    console.log('Rankings page loaded');
  };

  useEffect(() => {
    // Update rankings when position filter changes
    // Safeguard: if no position filters are selected, show all players
    const effectivePositionFilters = positionFilters.length === 0 ? ['overall'] : positionFilters;
    if (effectivePositionFilters.includes('overall')) {
      setRankings(PLAYER_POOL);
    } else {
      const filteredPlayers = PLAYER_POOL.filter(player => 
        effectivePositionFilters.includes(player.position.toLowerCase())
      );
      setRankings(filteredPlayers);
    }
  }, [positionFilters]);

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
    setDraggedPlayer(player);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index = null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (index === 'empty') {
      setIsDraggingOver(true);
    } else if (index === 'end') {
      setDragOverIndex('end');
    } else if (index !== null) {
      setDragOverIndex(`before-${index}`);
    }
  };

  const handleDrop = (e, targetList, targetIndex) => {
    e.preventDefault();
    
    if (!draggedPlayer) {
      return;
    }

    if (targetList === 'limits') {
      const newLimits = [...limits];
      newLimits.splice(targetIndex, 0, draggedPlayer);
      setLimits(newLimits);
      
      // Save to customRankings
      const customRankingsArray = newLimits.map(player => player.name);
      saveCustomRankings(customRankingsArray);
    }
    
    setDraggedPlayer(null);
    setDragOverIndex(null);
    setIsDraggingOver(false);
  };

  const handleRemoveFromLimits = (index) => {
    const newLimits = limits.filter((_, i) => i !== index);
    setLimits(newLimits);
    
    // Save to customRankings
    const customRankingsArray = newLimits.map(player => player.name);
    saveCustomRankings(customRankingsArray);
  };

  const handleQueuePlayer = (player) => {
    // Add to limits if not already there
    if (!limits.find(p => p.id === player.id)) {
      const newLimits = [...limits, player];
      setLimits(newLimits);
      
      // Save to customRankings
      const customRankingsArray = newLimits.map(p => p.name);
      saveCustomRankings(customRankingsArray);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortedRankings = () => {
    const sorted = [...rankings].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      // Handle special field mappings for PLAYER_POOL
      if (sortBy === 'proj') {
        aValue = a.proj || a.projection || 0;
        bValue = b.proj || b.projection || 0;
      } else if (sortBy === 'lastYear') {
        aValue = a.lastYear || a.lastYearPoints || 0;
        bValue = b.lastYear || b.lastYearPoints || 0;
      } else if (sortBy === 'adp') {
        // For ADP: missing/0 values should sort as highest (worst) ADP
        aValue = (a.adp && a.adp > 0) ? a.adp : 9999;
        bValue = (b.adp && b.adp > 0) ? b.adp : 9999;
      }
      
      // Handle numeric values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Handle string values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      // Handle mixed or undefined values
      if (aValue === undefined || aValue === null) aValue = sortBy === 'lastYear' ? 0 : '';
      if (bValue === undefined || bValue === null) bValue = sortBy === 'lastYear' ? 0 : '';
      
      // Convert to strings for comparison if needed
      aValue = String(aValue);
      bValue = String(bValue);
      
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    });
    
    return sorted;
  };

  const handlePositionalLimitChange = (position, value) => {
    const newValue = parseInt(value) || 0;
    setPositionalLimits(prev => ({
      ...prev,
      [position]: newValue
    }));
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file before processing
    const { validateFile } = await import('../lib/fileUploadValidation');
    const validation = await validateFile(file, 'csv', { validateContent: true });
    
    if (!validation.valid) {
      alert(`File validation failed: ${validation.error}`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target.result;
        const lines = csv.split('\n').filter(line => line.trim()); // Remove empty lines
        const headers = lines[0].split(',').map(h => h.trim());
        
        console.log('📊 CSV Headers:', headers);
        
        const newLimits = [];
        const errors = [];
        const duplicateRanks = new Set();
        const usedRanks = new Set();
        
        lines.slice(1).forEach((line, index) => {
          const values = line.split(',').map(v => v.trim());
          
          // Skip incomplete rows
          if (values.length < 4) {
            errors.push(`Row ${index + 2}: Incomplete data (${values.length} columns, expected at least 4)`);
            return;
          }
          
          const playerData = {
            id: index + 1,
            name: values[0] || '',
            team: values[1] || '',
            position: values[2] || '',
            adp: parseFloat(values[3]) || 0,
            proj: parseFloat(values[4]) || 0,
            tier: parseInt(values[5]) || 1
          };
          
          // Validate player data
          if (!playerData.name) {
            errors.push(`Row ${index + 2}: Missing player name`);
            return;
          }
          
          if (!playerData.position || !POSITIONS.includes(playerData.position)) {
            errors.push(`Row ${index + 2}: Invalid position "${playerData.position}" for ${playerData.name}`);
          }
          
          if (playerData.adp <= 0) {
            errors.push(`Row ${index + 2}: Invalid ADP "${values[3]}" for ${playerData.name}`);
            return;
          }
          
          // Check for duplicate ranks (using ADP as rank)
          const rank = Math.round(playerData.adp);
          if (usedRanks.has(rank)) {
            duplicateRanks.add(rank);
            errors.push(`Row ${index + 2}: Duplicate rank ${rank} for ${playerData.name}`);
          } else {
            usedRanks.add(rank);
          }
          
          newLimits.push(playerData);
        });
        
        // Show validation results
        console.log('🔍 Validation Results:', {
          totalRows: lines.length - 1,
          validPlayers: newLimits.length,
          errors: errors.length,
          duplicateRanks: Array.from(duplicateRanks)
        });
        
        if (errors.length > 0) {
          console.warn('⚠️ CSV Upload Errors:', errors);
          const showErrors = confirm(`Found ${errors.length} errors in CSV. Continue anyway?\n\nFirst 5 errors:\n${errors.slice(0, 5).join('\n')}`);
          if (!showErrors) return;
        }
        
        if (duplicateRanks.size > 0) {
          alert(`🚨 DATA QUALITY ISSUE: Found duplicate ranks: ${Array.from(duplicateRanks).join(', ')}\n\nThis will cause ranking problems. Please fix the CSV file.`);
          return;
        }
        
        // Sort by ADP to ensure proper ranking order
        newLimits.sort((a, b) => a.adp - b.adp);
        
        setLimits(newLimits);
        
        // Also save to customRankings
        const customRankingsArray = newLimits.map(player => player.name);
        saveCustomRankings(customRankingsArray);
        
        alert(`✅ CSV uploaded successfully!\n\n📊 Stats:\n- ${newLimits.length} players imported\n- ${errors.length} errors found\n- Sorted by ADP ranking`);
      } catch (error) {
        console.error('❌ Error parsing CSV:', error);
        alert(`Error parsing CSV file: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleCSVDownload = () => {
    const csvContent = [
      'Name,Team,Position,ADP,Projection,Tier',
      ...rankings.map(player => 
        `${player.name},${player.team},${player.position},${player.adp},${player.proj},${player.tier}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rankings.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCSVUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = handleCSVUpload;
    input.click();
  };

  const handleCSVDownloadClick = () => {
    handleCSVDownload();
  };

  const handleClear = () => {
    setLimits([]);
    clearCustomRankings();
    setPositionalLimits({
      QB: 2,
      RB: 6,
      WR: 8,
      TE: 3
    });
  };

  const handleSave = () => {
    // Convert limits to customRankings format (array of player names)
    const customRankingsArray = limits.map(player => player.name);
    saveCustomRankings(customRankingsArray);
    
    // Save positional limits separately (still using localStorage)
    if (typeof window !== 'undefined') {
      localStorage.setItem('rankingsPositionalLimits', JSON.stringify(positionalLimits));
    }
    alert('Rankings and limits saved successfully!');
  };

  return (
    <>
      <Head>
        <title>Player Rankings - TopDog.dog</title>
        <meta name="description" content="Fantasy football player rankings and ADP data" />
        <style jsx global>{`
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          html {
            margin: 0 !important;
            padding: 0 !important;
          }
        `}</style>
      </Head>

      <div className="min-h-screen overflow-x-auto" style={{ background: 'url(/wr_blue.png) repeat-y', backgroundSize: 'auto 100%', backgroundPosition: 'center center', margin: 0, padding: 0 }}>
        <div className="min-w-[1400px]" style={{ margin: 0, padding: 0 }}>
        <main className="px-4 py-8" style={{ minWidth: '1400px', margin: 0 }}>
          <div className="mx-auto" style={{ minWidth: '1400px', maxWidth: 'none', margin: 0, paddingLeft: '1rem', paddingRight: '1rem' }}>

            {/* Side by Side Layout */}
            <div className="grid gap-6" style={{ minWidth: '1400px', gridTemplateColumns: '2fr 1fr' }}>
                              {/* Players Container - Left */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
                            {/* Position Filters */}
                <div className="mb-2">
              <div className="flex space-x-2">
                <button
                  onClick={() => setPositionFilters(['overall'])}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    positionFilters.includes('overall') ? 'bg-[#3B82F6] text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => {
                    if (positionFilters.includes('qb')) {
                      const newFilters = positionFilters.filter(p => p !== 'qb');
                      // If removing qb would leave no filters, default to overall
                      setPositionFilters(newFilters.length > 0 ? newFilters : ['overall']);
                    } else {
                      setPositionFilters([...positionFilters.filter(p => p !== 'overall'), 'qb']);
                    }
                  }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    positionFilters.includes('qb') ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  QB
                </button>
                <button
                  onClick={() => {
                    if (positionFilters.includes('rb')) {
                      const newFilters = positionFilters.filter(p => p !== 'rb');
                      // If removing rb would leave no filters, default to overall
                      setPositionFilters(newFilters.length > 0 ? newFilters : ['overall']);
                    } else {
                      setPositionFilters([...positionFilters.filter(p => p !== 'overall'), 'rb']);
                    }
                  }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    positionFilters.includes('rb') ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  RB
                </button>
                <button
                  onClick={() => {
                    if (positionFilters.includes('wr')) {
                      const newFilters = positionFilters.filter(p => p !== 'wr');
                      // If removing wr would leave no filters, default to overall
                      setPositionFilters(newFilters.length > 0 ? newFilters : ['overall']);
                    } else {
                      setPositionFilters([...positionFilters.filter(p => p !== 'overall'), 'wr']);
                    }
                  }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    positionFilters.includes('wr') ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  WR
                </button>
                <button
                  onClick={() => {
                    if (positionFilters.includes('te')) {
                      const newFilters = positionFilters.filter(p => p !== 'te');
                      // If removing te would leave no filters, default to overall
                      setPositionFilters(newFilters.length > 0 ? newFilters : ['overall']);
                    } else {
                      setPositionFilters([...positionFilters.filter(p => p !== 'overall'), 'te']);
                    }
                  }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    positionFilters.includes('te') ? 'bg-pink-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  TE
                </button>
              </div>
            </div>

                <h2 className="text-xl font-bold mb-4" style={{ color: '#3B82F6' }}>
                  
                </h2>
                
                {/* Column Headers */}
                <div className="flex items-center justify-between p-1.5 bg-gray-700 rounded-lg mb-2 border border-gray-600">
                  <div className="flex items-center">
                    <button 
                      onClick={() => handleSort('name')}
                      className="w-32 text-left text-gray-300 font-semibold text-xs hover:text-white transition-colors cursor-pointer flex items-center"
                    >
                      Player
                      {sortBy === 'name' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                    <button 
                      onClick={() => handleSort('adp')}
                      className="w-20 text-center text-gray-300 font-semibold text-xs hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                    >
                      ADP
                      {sortBy === 'adp' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                    <button 
                      onClick={() => handleSort('proj')}
                      className="w-20 text-center text-gray-300 font-semibold text-xs hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                    >
                      Projection
                      {sortBy === 'proj' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                    <button 
                      onClick={() => handleSort('lastYear')}
                      className="w-20 text-center text-gray-300 font-semibold text-xs hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                    >
                      {new Date().getFullYear() - 1}
                      {sortBy === 'lastYear' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                    <button 
                      onClick={() => handleSort('position')}
                      className="w-12 text-center text-gray-300 font-semibold text-xs hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                    >
                      Pos
                      {sortBy === 'position' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                    <button 
                      onClick={() => handleSort('team')}
                      className="w-16 text-center mr-2 text-gray-300 font-semibold text-xs hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                    >
                      Team
                      {sortBy === 'team' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center">
                    <div className="w-12 text-center text-gray-300 font-semibold text-xs">
                      Action
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {getSortedRankings().map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-1.5 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors border border-transparent"
                    >
                      <div className="flex items-center">
                        <div className="w-32 text-left text-white font-medium text-sm">
                          <div className="overflow-hidden whitespace-nowrap" title={player.name}>
                            {player.name}
                          </div>
                        </div>
                        <div className="w-20 text-center">
                          <div className="font-semibold text-white text-sm">{player.adp && player.adp > 0 ? player.adp : '-'}</div>
                        </div>
                        <div className="w-20 text-center">
                          <div className="font-semibold text-white text-sm">{player.proj || player.projection || 'N/A'}</div>
                        </div>
                        <div className="w-20 text-center">
                          <div className="font-semibold text-white text-sm">{player.lastYear || player.lastYearPoints || 'Rookie'}</div>
                        </div>
                        <div className="w-12 text-center text-white text-sm">
                          {player.position}
                        </div>
                        <div className="w-16 text-center mr-2 text-white text-sm">
                          {player.team}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => handleQueuePlayer(player)}
                          className="px-3 py-1 bg-[#3B82F6] text-white text-xs rounded hover:bg-[#1d4ed8] transition-colors"
                        >
                          Add
                        </button>
                        <svg className="w-4 h-4 text-gray-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* CSV Actions */}
                <div className="mt-4 flex space-x-2">
                  <button 
                    onClick={handleCSVUploadClick}
                    className="flex-1 px-3 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors" style={{ border: '1px solid #59c5bf' }}
                  >
                    Upload CSV
                  </button>
                  <button 
                    onClick={handleCSVDownloadClick}
                    className="flex-1 px-3 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors" style={{ border: '1px solid #59c5bf' }}
                  >
                    Download CSV
                  </button>
                </div>
              </div>

              {/* Rankings Container - Right */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
                {/* Secondary Tabs */}
                <div className="flex space-x-1 bg-gray-700 rounded-lg p-1 mb-2">
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
                    Autopick Limits
                  </button>
                </div>
                {/* Limits Tab Content */}
                {activeTab === 'limits' && (
                  <div 
                    className={`space-y-2 flex-1 overflow-y-auto rounded-lg p-2 transition-colors ${
                      isDraggingOver ? 'bg-blue-900/20' : ''
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={() => setIsDraggingOver(false)}
                    onDrop={(e) => {
                      handleDrop(e, 'limits', limits.length);
                      setIsDraggingOver(false);
                    }}
                  >
                    {limits.map((player, index) => (
                      <div key={`${player.id}-${index}`}>
                        {/* Drop line above item */}
                        <div 
                          className={`h-1 rounded transition-all ${
                            dragOverIndex === `before-${index}` ? 'bg-[#3B82F6]' : 'bg-transparent'
                          }`}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragLeave={() => setDragOverIndex(null)}
                          onDrop={(e) => {
                            handleDrop(e, 'limits', index);
                            setDragOverIndex(null);
                          }}
                        />
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, player)}
                          className="flex items-center justify-between p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-move"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                              <div className="flex items-center space-x-1">
                                <div className="font-semibold text-white text-sm">{player.name}</div>
                                <div className="text-xs text-gray-300">
                                  {player.position} • {player.team}
                                </div>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveFromLimits(index)}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    {limits.length === 0 && (
                      <div 
                        className={`flex items-center justify-center rounded-lg text-gray-400 transition-all ${
                          isDraggingOver ? 'bg-blue-900/20' : 'bg-gray-700'
                        }`}
                        style={{ height: '530px', marginTop: '0px' }}
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
                          <p className="text-sm font-medium">Drop players here</p>
                          <p className="text-xs text-gray-500 mt-1">or upload a CSV file</p>
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
                    <h3 className="font-semibold text-white mb-4">Autopick Position Limits</h3>
                    <p className="text-sm text-gray-300 mb-4">Set maximum players per position for autopick during drafts</p>
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
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="mt-auto flex space-x-2">
                  <button onClick={handleClear} className="flex-1 px-3 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors" style={{ border: '1px solid #59c5bf' }}>
                  Clear
                </button>
                  <button onClick={handleSave} className="flex-1 px-3 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors" style={{ border: '1px solid #59c5bf' }}>
                  Save
                </button>
                </div>
              </div>
            </div>
          </div>
        </main>
        </div>
      </div>
    </>
  );
} 