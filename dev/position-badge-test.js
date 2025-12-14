/**
 * Position Badge Development Area
 * 
 * This is a dedicated dev space to work on position badge centering
 * without affecting any production code.
 */

import React, { useState } from 'react';
import CleanPositionBadge from './CleanPositionBadge';
import CleanPlayerList from './CleanPlayerList';

export default function PositionBadgeTest() {
  const [selectedApproach, setSelectedApproach] = useState('clean');

  // Test position badges with different approaches
  const PositionBadgeFlexbox = ({ position }) => {
    const getPositionColor = (pos) => {
      switch (pos) {
        case 'QB': return '#F472B6';
        case 'RB': return '#0fba80';
        case 'WR': return '#4285F4';
        case 'TE': return '#7C3AED';
        default: return '#6B7280';
      }
    };

    return (
      <div
        style={{
          width: '32px',
          height: '28px',
          backgroundColor: getPositionColor(position),
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <span
          style={{
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: '700',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: '1',
            textAlign: 'center'
          }}
        >
          {position}
        </span>
      </div>
    );
  };

  const PositionBadgeAbsolute = ({ position }) => {
    const getPositionColor = (pos) => {
      switch (pos) {
        case 'QB': return '#F472B6';
        case 'RB': return '#0fba80';
        case 'WR': return '#4285F4';
        case 'TE': return '#7C3AED';
        default: return '#6B7280';
      }
    };

    return (
      <div
        style={{
          width: '32px',
          height: '28px',
          backgroundColor: getPositionColor(position),
          borderRadius: '4px',
          position: 'relative',
          flexShrink: 0
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: '700',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: '1',
            textAlign: 'center'
          }}
        >
          {position}
        </span>
      </div>
    );
  };

  const positions = ['QB', 'RB', 'WR', 'TE'];

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Desktop Controls */}
      <div className="fixed top-4 left-4 z-50">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h3 className="font-semibold mb-3 text-gray-800">Implementation</h3>
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => setSelectedApproach('clean')}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                selectedApproach === 'clean' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Clean (New)
            </button>
            <button
              onClick={() => setSelectedApproach('flexbox')}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                selectedApproach === 'flexbox' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Flexbox (Old)
            </button>
            <button
              onClick={() => setSelectedApproach('absolute')}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                selectedApproach === 'absolute' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Absolute (Old)
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Phone Outline */}
      <div className="relative">
        {/* Phone Frame */}
        <div 
          className="bg-black rounded-[3rem] p-2 shadow-2xl"
          style={{ width: '375px', height: '812px' }}
        >
          {/* Screen */}
          <div 
            className="bg-[#101927] rounded-[2.5rem] overflow-hidden relative"
            style={{ width: '359px', height: '796px' }}
          >
            {/* Status Bar */}
            <div className="h-11 bg-[#101927] flex items-center justify-between px-6 text-white text-sm">
              <span>9:41</span>
              <div className="flex space-x-1">
                <div className="w-4 h-2 bg-white rounded-sm"></div>
                <div className="w-6 h-2 bg-white rounded-sm"></div>
                <div className="w-6 h-2 bg-white rounded-sm"></div>
              </div>
            </div>

            {/* Mobile Content */}
            <div className="flex-1 bg-[#101927] text-white overflow-hidden">
              {selectedApproach === 'clean' ? (
                <CleanPlayerList />
              ) : (
                <div className="p-4">
                  <h1 className="text-lg font-bold mb-4 text-center">Position Badges</h1>
                  
                  <div className="mb-6">
                    <h2 className="text-sm font-medium mb-3 text-center text-gray-300">
                      {selectedApproach === 'flexbox' ? 'Flexbox Centering' : 'Absolute Positioning'}
                    </h2>
                    
                    {/* Badge Grid */}
                    <div className="grid grid-cols-2 gap-4 justify-items-center">
                      {positions.map(position => (
                        <div key={position} className="text-center">
                          <div className="mb-2">
                            {selectedApproach === 'flexbox' ? (
                              <PositionBadgeFlexbox position={position} />
                            ) : (
                              <PositionBadgeAbsolute position={position} />
                            )}
                          </div>
                          <div className="text-xs text-gray-400">{position}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mock Player List Context */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">In Player List Context:</h3>
                    
                    {[
                      { name: "Ja'Marr Chase", pos: "WR", team: "CIN" },
                      { name: "Saquon Barkley", pos: "RB", team: "PHI" },
                      { name: "Lamar Jackson", pos: "QB", team: "BAL" },
                      { name: "Travis Kelce", pos: "TE", team: "KC" }
                    ].map((player, index) => (
                      <div key={index} className="bg-gray-800 rounded-lg p-3 flex items-center space-x-3">
                        <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        
                        {selectedApproach === 'flexbox' ? (
                          <PositionBadgeFlexbox position={player.pos} />
                        ) : (
                          <PositionBadgeAbsolute position={player.pos} />
                        )}

                        <div className="flex-1">
                          <div className="text-sm font-medium">{player.name}</div>
                          <div className="text-xs text-gray-400">{player.team}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="w-32 h-1 bg-white rounded-full opacity-60"></div>
            </div>
          </div>
        </div>

        {/* Phone Label */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
          <div className="text-sm text-gray-600 font-medium">iPhone 12 Pro (375×812)</div>
        </div>
      </div>
    </div>
  );
}
