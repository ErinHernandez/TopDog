/**
 * ExposureReportMobile - Mobile-Optimized Exposure Report
 *
 * Refactored to use extracted sub-components for maintainability.
 */

import React, { useState, useEffect, useMemo } from 'react';

import { createScopedLogger } from '../../lib/clientLogger';
import { exposureData as csvExposureData } from '../../lib/exposureData';
import exposurePreloader from '../../lib/exposurePreloader';
import { teamMatchesSearch } from '../../lib/nflConstants';
import { usePlayerData } from '../../lib/playerDataContext';
import { POSITIONS } from '../draft/v3/constants/positions';

import { ExposurePlayerRow, PositionFilterBar } from './ExposureReport';

const logger = createScopedLogger('[ExposureMobile]');

const ExposureReportMobile = () => {
  const [exposureData, setExposureData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPositions, setSelectedPositions] = useState([]);
  const [sortBy, setSortBy] = useState('exposure');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showShares, setShowShares] = useState({});

  // Set mounted state to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load exposure data
  useEffect(() => {
    const preloadedData = exposurePreloader.getPreloadedData();
    if (preloadedData) {
      setExposureData(preloadedData);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setExposureData(csvExposureData);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading exposure data', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Memoized filtering and sorting
  const filteredPlayers = useMemo(() => {
    if (!exposureData?.playerExposure) return [];
    
    const filtered = exposureData.playerExposure.filter(player => {
      if (selectedPositions.length > 0 && !selectedPositions.includes(player.position)) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          player.name.toLowerCase().includes(query) ||
          player.position.toLowerCase().includes(query) ||
          teamMatchesSearch(player.team, query)
        );
      }
      
      return true;
    });

    // Sort players
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'exposure':
          aVal = a.exposure;
          bVal = b.exposure;
          break;
        case 'player':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'leagues':
          aVal = a.leagues;
          bVal = b.leagues;
          break;
        case 'salary':
          aVal = a.salary;
          bVal = b.salary;
          break;
        case 'apd':
          aVal = parseFloat(a.averagePick) || 999;
          bVal = parseFloat(b.averagePick) || 999;
          break;
        default:
          aVal = a.exposure;
          bVal = b.exposure;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      return sortOrder === 'asc' 
        ? (aVal < bVal ? -1 : aVal > bVal ? 1 : 0)
        : (aVal > bVal ? -1 : aVal < bVal ? 1 : 0);
    });

    return filtered;
  }, [exposureData, selectedPositions, searchQuery, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const toggleSharesDisplay = (playerName) => {
    setShowShares(prev => ({
      ...prev,
      [playerName]: !prev[playerName]
    }));
  };

  // Loading states
  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading exposure data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 bg-[#101927] text-white flex flex-col">

      {/* Header Section */}
      <div className="flex-shrink-0 px-4 pt-2 pb-4 border-b border-gray-700">
        <div className="space-y-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Position Filter - Hidden when search is active */}
          {!searchQuery && (
            <PositionFilterBar
              selectedPositions={selectedPositions}
              onPositionToggle={setSelectedPositions}
              positions={POSITIONS}
            />
          )}
        </div>
      </div>

      {/* Player List */}
      {exposureData?.playerExposure && mounted && (
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Sort Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-2 py-1">
            <div className="flex items-center space-x-4 flex-1">
              <div style={{ width: '40px', marginLeft: '6px' }}></div>
              <div className="flex-1" style={{ marginLeft: '16px' }}></div>
            </div>
            <div className="flex items-center justify-center" style={{ width: '60px', marginRight: '2px' }}>
              <button
                onClick={() => handleSort('exposure')}
                className="text-white text-lg hover:text-gray-300 transition-colors cursor-pointer"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Player Rows */}
          <div className="flex-1 min-h-0 overflow-y-auto mobile-no-scrollbar pb-8">
            {filteredPlayers.map((player, index) => (
              <ExposurePlayerRow
                key={`${player.name}-${index}`}
                player={player}
                index={index}
                isFirst={index === 0}
                isLast={index === filteredPlayers.length - 1}
                showShares={showShares[player.name]}
                onToggleShares={toggleSharesDisplay}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExposureReportMobile;
