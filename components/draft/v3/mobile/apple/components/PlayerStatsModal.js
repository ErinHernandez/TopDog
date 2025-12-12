/**
 * Player Stats Modal - iOS Optimized
 * 
 * Shows detailed player statistics and information
 */

import React from 'react';

export default function PlayerStatsModal({ player, isOpen, onClose }) {
  if (!player || !isOpen) return null;

  const getPositionColor = (position) => {
    const colors = {
      QB: '#F472B6',
      RB: '#0fba80', 
      WR: '#FBBF25',
      TE: '#7C3AED'
    };
    return colors[position] || '#6b7280';
  };

  return (
    <>
      <style jsx>{`
        .modal-scroll::-webkit-scrollbar {
          width: 0px;
          height: 0px;
        }
        .modal-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .modal-scroll::-webkit-scrollbar-thumb {
          background-color: transparent;
        }
        .modal-scroll::-webkit-scrollbar-thumb:hover {
          background-color: transparent;
        }
        .modal-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
        <div className="absolute inset-0" onClick={onClose}></div>
        <div className="relative bg-white rounded-xl shadow-2xl p-6 z-10 w-full max-w-sm max-h-[85vh] overflow-y-auto mx-4 modal-scroll">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-4 text-2xl text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
        <div className="w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {player.name}
          </h2>
          <div 
            className="inline-block px-3 py-1 rounded-full text-white font-medium text-sm"
            style={{ backgroundColor: getPositionColor(player.position) }}
          >
            {player.position} • {player.team}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-900">
              {player.adp ? parseFloat(player.adp).toFixed(1) : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">ADP</div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-900">
              {player.rank || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Rank</div>
          </div>
        </div>

        {/* 2024 Season Stats */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">2024 Stats</h3>
          
          {/* QB 2024 Stats */}
          {player.position === 'QB' && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {player.passingYards || player.passing_yards || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600">Pass Yards</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {player.passingTDs || player.passing_tds || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600">Pass TDs</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {player.interceptions || player.ints || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600">INTs</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {player.rushingTDs || player.rushing_tds || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600">Rush TDs</div>
                </div>
              </div>
            </div>
          )}

          {/* RB 2024 Stats */}
          {player.position === 'RB' && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {player.rushingYards || player.rushing_yards || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600">Rush Yards</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {player.rushingTDs || player.rushing_tds || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600">Rush TDs</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {player.receptions || player.rec || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600">Receptions</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {player.receivingYards || player.receiving_yards || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600">Rec Yards</div>
                </div>
              </div>
            </div>
          )}

          {/* WR/TE 2024 Stats */}
          {(player.position === 'WR' || player.position === 'TE') && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {player.receptions || player.rec || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600">Receptions</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {player.receivingYards || player.receiving_yards || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600">Rec Yards</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {player.receivingTDs || player.receiving_tds || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600">Rec TDs</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {player.targets || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600">Targets</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2025 Projections */}
        {(player.projectedPoints || player.projected_points) && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">2025 Projections</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Projected Points</span>
                <span className="font-semibold text-gray-900">
                  {player.projectedPoints || player.projected_points}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="text-center">
          <button
            onClick={onClose}
            className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
        </div>
      </div>
      </div>
    </>
  );
}
