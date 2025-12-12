/**
 * Roster Page - iOS Style
 * 
 * Full page roster view with dropdown team selection
 */

import React, { useState, useEffect, useRef } from 'react';
import { MOBILE_SIZES, PLATFORM_SPECIFIC } from '../../shared/constants/mobileSizes';
import PositionBadge from './PositionBadge';

export default function RosterPage({ participants = [], picks = [], selectedParticipantIndex = 0, onParticipantChange, onDraftPlayer, isMyTurn = false }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // NFL Bye Week Data for 2024 Season
  const getByeWeek = (teamAbbr) => {
    const byeWeeks = {
      'ARI': 11, 'ATL': 12, 'BAL': 14, 'BUF': 12, 'CAR': 11, 'CHI': 7,
      'CIN': 12, 'CLE': 10, 'DAL': 7, 'DEN': 14, 'DET': 5, 'GB': 10,
      'HOU': 14, 'IND': 14, 'JAX': 12, 'KC': 6, 'LV': 10, 'LAC': 5,
      'LAR': 6, 'MIA': 6, 'MIN': 6, 'NE': 14, 'NO': 12, 'NYG': 11,
      'NYJ': 12, 'PHI': 5, 'PIT': 9, 'SF': 9, 'SEA': 10, 'TB': 11,
      'TEN': 5, 'WAS': 14
    };
    return byeWeeks[teamAbbr?.toUpperCase()] || null;
  };

  // Get the team for the selected participant
  const getTeamForParticipant = (participantIndex) => {
    const participantCount = participants.length || 12; // Default to 12 if participants is empty
    return picks.filter(pick => {
      const round = Math.ceil(pick.pickNumber / participantCount);
      const isSnakeRound = round % 2 === 0;
      const pickIndexInRound = (pick.pickNumber - 1) % participantCount;
      const pickParticipantIndex = isSnakeRound 
        ? participantCount - 1 - pickIndexInRound 
        : pickIndexInRound;
      return pickParticipantIndex === participantIndex && pick.player;
    }).map(pick => pick.player);
  };

  const team = getTeamForParticipant(selectedParticipantIndex);
  const selectedParticipant = participants[selectedParticipantIndex];



  return (
    <>
      <style jsx>{`
        .draft-roster-scroll::-webkit-scrollbar {
          width: 0px !important;
          height: 0px !important;
          display: none !important;
        }
        .draft-roster-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .draft-roster-scroll::-webkit-scrollbar-thumb {
          background-color: transparent;
        }
        .draft-roster-scroll::-webkit-scrollbar-thumb:hover {
          background-color: transparent;
        }
        .draft-roster-scroll {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
          -webkit-overflow-scrolling: touch !important;
        }
        @media (max-width: 768px) {
          .draft-roster-scroll::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          .draft-roster-scroll {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
            -webkit-overflow-scrolling: touch !important;
          }
        }
      `}</style>
      <div className="h-full bg-[#101927] text-white flex flex-col">
        {/* Header with Dropdown - Updated */}
        <div className="flex-shrink-0 px-6 flex justify-center" style={{ paddingTop: '14px', paddingBottom: '16px' }}>
        <div className="relative" style={{ width: '250px' }}>
          {/* Dropdown Button */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between w-full text-left bg-gray-700 rounded-lg px-3 py-1.5"
            style={{ borderRadius: PLATFORM_SPECIFIC.IOS.BORDER_RADIUS }}
          >
            <div className="flex-1 text-center">
              <div className="text-sm font-bold text-white">
                {selectedParticipant?.name || 'Select Team'}
              </div>
            </div>
            <div className={`w-5 h-5 text-gray-400 transition-transform flex items-center justify-center ${isDropdownOpen ? 'rotate-180' : ''}`}>
              <svg 
                className="w-4 h-4"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div 
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 rounded-lg z-50 max-h-120 overflow-y-auto draft-roster-scroll"
              style={{ 
                borderRadius: PLATFORM_SPECIFIC.IOS.BORDER_RADIUS, 
                marginTop: '9px',
                backgroundColor: '#374151',
                border: '1px solid #1f2833'
              }}
            >
              {participants.filter((participant, index) => index !== selectedParticipantIndex).map((participant, originalIndex) => {
                const index = participants.indexOf(participant);
                return (
                <button
                  key={index}
                  onClick={() => {
                    onParticipantChange?.(index);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 hover:bg-gray-600 transition-colors ${
                    index === selectedParticipantIndex ? 'bg-blue-600' : ''
                  } ${index === 0 ? 'rounded-t-lg' : ''} ${index === participants.length - 1 ? 'rounded-b-lg' : ''}`}
                  style={{ paddingTop: '7px', paddingBottom: '9px' }}
                >
                                      <div className="flex items-center justify-start">
                      <div className="text-white font-medium text-sm" style={{ paddingBottom: '2px', paddingLeft: '8px', transform: 'translateY(-1px)' }}>{participant.name}</div>
                    </div>
                </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Team Roster */}
      <div 
        className="overflow-y-auto border-t-2 border-white/10 draft-roster-scroll"
        style={{
          height: '600px',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        <div className="px-1 pb-32">
            {/* Starting Lineup Slots */}
            {['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'FLEX'].map((position, index) => (
              <div 
                key={index}
                className="flex items-center relative overflow-hidden border-b border-white/10 cursor-pointer transition-colors duration-200"
                style={{ 
                  height: '40px',
                  maxHeight: '40px',
                  minHeight: '40px',
                  boxSizing: 'border-box',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  ...(index <= 2 ? { transform: 'translateY(1px)' } : {})
                }}
              >
                {/* Position Badge */}
                <div className="w-12 text-center font-medium text-gray-300 absolute z-10" style={{ left: '8.5px' }}>
                  <div style={{
                    position: 'relative',
                    width: '43px',
                    height: '27px',
                    margin: '0 auto',
                    flexShrink: 0
                  }}>
                    <PositionBadge position={position} width="44px" height="28px" />
                  </div>
                </div>
                <div className="flex-1 ml-8 relative z-10" style={{ marginLeft: '46px' }}>
                  {/* Find player for this position slot */}
                  {(() => {
                    // Find first available player that matches this position
                    let slotPlayer = null;
                    
                    if (position === 'FLEX') {
                      // FLEX can be RB, WR, or TE
                      slotPlayer = team.find(player => 
                        (player.position === 'RB' || player.position === 'WR' || player.position === 'TE') &&
                        !team.slice(0, index).some(p => p === player) // Not already used in earlier slots
                      );
                    } else {
                      // Regular position matching
                      const positionPlayers = team.filter(player => player.position === position);
                      const positionIndex = ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'FLEX']
                        .slice(0, index + 1)
                        .filter(pos => pos === position).length - 1;
                      slotPlayer = positionPlayers[positionIndex];
                    }
                    
                    if (slotPlayer) {
                      return (
                        <>
                          {/* Player Name and Team Info - Same Line */}
                          <div className="flex-1 min-w-0 flex items-center" style={{ marginLeft: '34px', marginRight: '80px' }}>
                            <div 
                              className="font-medium text-white"
                              style={{ 
                                fontSize: '13px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                marginRight: '10px'
                              }}
                            >
                              {slotPlayer.name}
                            </div>
                            <div className="text-xs text-gray-400" style={{ fontSize: '11px' }}>
                              {slotPlayer.team} ({getByeWeek(slotPlayer.team) || 'TBD'})
                            </div>
                          </div>
                          
                          {/* Projected Points */}
                          <div className="absolute right-0 top-0 h-full flex items-center" style={{ marginRight: '20px' }}>
                            <span className="text-xs text-gray-400">
                              Proj. {parseFloat(slotPlayer.projectedPoints || 0).toFixed(1)}
                            </span>
                          </div>
                        </>
                      );
                    } else {
                      return <div className="text-gray-400 italic flex justify-end" style={{ marginRight: '22px', fontSize: 'calc(1rem - 1.5px)' }}></div>;
                    }
                  })()}
                </div>
              </div>
            ))}
            
            {/* Bench */}
            <div className="pt-4">
              <div className="text-gray-400 text-sm font-medium mb-2 px-6" style={{ transform: 'translateY(-4px)' }}>BENCH</div>
              {[...Array(9)].map((_, index) => (
                <div 
                  key={`bench-${index}`}
                  className={`flex items-center relative overflow-hidden border-b border-white/10 cursor-pointer transition-colors duration-200 ${index === 0 ? 'border-t border-white/10' : ''}`}
                  style={{ 
                    height: '40px',
                    maxHeight: '40px',
                    minHeight: '40px',
                    boxSizing: 'border-box',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)'
                  }}
                >
                  {/* Bench Gradient Overlay - Use position gradient if player exists */}
                  {(() => {
                    const benchPlayers = team.slice(9);
                    const benchPlayer = benchPlayers[index];
                    
                    return (
                      <div 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '100%',
                          background: benchPlayer 
                            ? createRosterGradient(benchPlayer.position).firstGradient
                            : 'transparent',
                          zIndex: 1,
                          pointerEvents: 'none'
                        }}
                      />
                    );
                  })()}
                  <div className="w-12 text-center font-medium text-gray-300 absolute z-10" style={{ left: '8.5px' }}>
                    {(() => {
                      const benchPlayers = team.slice(9);
                      const benchPlayer = benchPlayers[index];
                      
                      if (benchPlayer) {
                        return (
                          <div style={{
                            position: 'relative',
                            width: '30px',
                            height: '19px',
                            margin: '0 auto',
                            flexShrink: 0
                          }}>
                            <PositionBadge position={benchPlayer.position} width="30px" height="19px" />
                          </div>
                        );
                      } else {
                        return (
                          <div style={{
                            position: 'relative',
                            width: '44px',
                            height: '28px',
                            margin: '0 auto',
                            flexShrink: 0
                          }}>
                            <PositionBadge position="BN" width="44px" height="28px" />
                          </div>
                        );
                      }
                    })()}
                  </div>
                  <div className="flex-1 ml-8 relative z-10" style={{ marginLeft: '46px' }}>
                    {/* Find bench player for this slot */}
                    {(() => {
                      // Get players not in starting lineup (beyond first 9)
                      const benchPlayers = team.slice(9); // Players beyond starting 9
                      const benchPlayer = benchPlayers[index];
                      
                      if (benchPlayer) {
                        return (
                          <>
                            {/* Player Name - Next to Badge */}
                            <div className="flex-1 min-w-0" style={{ marginLeft: '36px', marginRight: '130px' }}>
                              <div 
                                className="font-medium text-white"
                                style={{ 
                                  fontSize: '13px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {benchPlayer.name}
                              </div>
                            </div>
                            
                            {/* Team/Bye Column - Centered */}
                            <div className="absolute flex items-center justify-center" style={{ 
                              right: '118px', 
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '50px'
                            }}>
                              <div className="text-xs text-gray-400 text-center" style={{ fontSize: '11px' }}>
                                {benchPlayer.team} ({getByeWeek(benchPlayer.team) || 'TBD'})
                              </div>
                            </div>
                            
                            {/* Projected Points */}
                            <div className="absolute right-0 top-0 h-full flex items-center" style={{ marginRight: '20px' }}>
                              <span className="text-xs text-gray-400">
                                Proj. {parseFloat(benchPlayer.projectedPoints || 0).toFixed(1)}
                              </span>
                            </div>
                          </>
                        );
                      } else {
                        return <div className="text-gray-400 italic flex justify-end" style={{ marginRight: '22px', fontSize: 'calc(1rem - 1.5px)' }}></div>;
                      }
                    })()}
                  </div>
                </div>
              ))}
            </div>
        </div>
      </div>

      </div>
    </>
  );
}
