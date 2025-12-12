/**
 * Draft Board - Apple/iOS Optimized
 * 
 * Full draft board showing all picks in a grid layout
 * Similar to the reference image with rounds and draft positions
 */

import React, { useState, useRef, useEffect } from 'react';
import { MOBILE_SIZES, PLATFORM_SPECIFIC } from '../../shared/constants/mobileSizes';
import { useUserPreferences } from '../../../../../../hooks/useUserPreferences';

export default function DraftBoardApple({ 
  picks = [], 
  participants = [], 
  currentPickNumber = 1,
  isDraftActive = false,
  timer = 120,
  activeTab = 'Board'
}) {
  const scrollRef = useRef(null);
  const [selectedPick, setSelectedPick] = useState(null);
  const [doubleClickTimers, setDoubleClickTimers] = useState({});
  const [showingPositionLabels, setShowingPositionLabels] = useState({});
  // Removed problematic scroll position management that was causing infinite jumping
  
  // Get user's custom border color
  const { getBorderColor } = useUserPreferences();
  const userBorderColor = getBorderColor();

  // Position colors matching the main app
  const getPositionColor = (position) => {
    const colors = {
      QB: '#F472B6',
      RB: '#0fba80', 
      WR: '#FBBF25',
      TE: '#7C3AED'
    };
    return colors[position] || '#6b7280';
  };

  // Calculate total rounds (assuming 18 rounds like in the image)
  const totalRounds = 18;
  const totalTeams = participants.length || 12;

  // Create grid data structure
  const createDraftGrid = () => {
    const grid = [];
    
    for (let round = 1; round <= totalRounds; round++) {
      const roundPicks = [];
      const isSnakeRound = round % 2 === 0;
      
      // Create picks in the correct snake draft order for display
      for (let displayPosition = 1; displayPosition <= totalTeams; displayPosition++) {
        // For snake rounds, reverse the display order
        const actualPosition = isSnakeRound ? totalTeams - displayPosition + 1 : displayPosition;
        const pickNumber = (round - 1) * totalTeams + actualPosition;
        
        // The participant index is based on display position (0-indexed)
        const participantIndex = displayPosition - 1;
        const participant = participants[participantIndex];
        
        // Find the actual pick for this slot
        const pick = picks.find(p => p.pickNumber === pickNumber);
        
        roundPicks.push({
          pickNumber,
          round,
          position: displayPosition,
          participant,
          participantIndex,
          pick,
          isCurrentPick: pickNumber === currentPickNumber,
          isPastPick: pickNumber < currentPickNumber,
          isUserPick: participantIndex === 0
        });
      }
      
      grid.push({
        round,
        picks: roundPicks
      });
    }
    
    return grid;
  };

  const draftGrid = createDraftGrid();

  // Auto-scroll to current pick
  useEffect(() => {
    if (scrollRef.current && isDraftActive) {
      const currentRound = Math.ceil(currentPickNumber / totalTeams);
      const roundElement = scrollRef.current.querySelector(`[data-round="${currentRound}"]`);
      if (roundElement) {
        roundElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentPickNumber, isDraftActive, totalTeams]);

  const handlePickClick = (pickData) => {
    if (pickData.pick) {
      setSelectedPick(pickData);
    }
  };


  // Handle position label click
  const handlePositionClick = (participantIndex, position) => {
    const key = `${participantIndex}-${position}`;
    setShowingPositionLabels(prev => ({ ...prev, [key]: true }));
    
    // Hide label after 2 seconds
    setTimeout(() => {
      setShowingPositionLabels(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  // Calculate picks away for user's future picks
  const getPicksAway = (pickNumber) => {
    if (pickNumber <= currentPickNumber) return 0;
    return pickNumber - currentPickNumber;
  };

  return (
    <>
      <style jsx>{`
        .draft-board-scroll::-webkit-scrollbar {
          width: 0px !important;
          height: 0px !important;
          display: none !important;
        }
        .draft-board-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .draft-board-scroll::-webkit-scrollbar-thumb {
          background-color: transparent;
        }
        .draft-board-scroll::-webkit-scrollbar-thumb:hover {
          background-color: transparent;
        }
        .draft-board-scroll {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
          -webkit-overflow-scrolling: touch !important;
        }
        @media (max-width: 768px) {
          .draft-board-scroll::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          .draft-board-scroll {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
            -webkit-overflow-scrolling: touch !important;
          }
        }
      `}</style>
      <div className="h-full flex flex-col relative" style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}>

      {/* Draft Grid */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-auto draft-board-scroll"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          width: '100%',
          position: 'relative',
          paddingRight: '0px',
          paddingBottom: '80px',
          touchAction: 'pan-y'
        }}
      >
        {/* Team Headers - Inside scroll container */}
         <div className="bg-[#101927] sticky top-0 z-10" style={{ paddingTop: '8px', paddingBottom: '0px', paddingLeft: '0px', paddingRight: '0px' }}>
          <div className="flex" style={{ 
            minWidth: `${totalTeams * 104}px`, // Content-based width but constrained by container
            width: 'max-content',
            position: 'relative'
          }}>
            {/* Team headers */}
            {participants.map((participant, index) => (
              <div 
                key={index}
                className="flex-shrink-0 relative bg-gray-800"
                style={{ 
                  margin: '2px',
                  minWidth: '104px', 
                  width: '104px',
                  height: '117px',
                  borderRadius: '6px', // Reduced corner curves
                  border: index === 0 
                    ? `4px solid ${userBorderColor}` // Custom border color for user
                    : '4px solid #6B7280', // Gray border for others
                  borderTop: index === 0 
                    ? `24px solid ${userBorderColor}` // Increased custom border color for user
                    : '24px solid #6B7280', // Increased gray top border for others
                  boxSizing: 'border-box',
                  flexShrink: 0,
                  flexGrow: 0
                }}
              >
                {/* Username positioned on top of the colored top border */}
                <div 
                  className={`absolute left-0 right-0 text-center font-medium text-xs overflow-hidden cursor-pointer flex items-center justify-center text-white`}
                  style={{ 
                    top: '-23px', // Position above the cell, on top of the border
                    height: '24px', // Match the border height
                    backgroundColor: 'transparent',
                    zIndex: 20,
                    fontSize: '12px',
                    lineHeight: '13px',
                    paddingLeft: '4px',
                    paddingRight: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0px',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none'
                  }}
                >
                  <div 
                    className="whitespace-nowrap text-center"
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                      boxShadow: 'none'
                    }}
                  >
                    {participant.name && typeof participant.name === 'string' 
                      ? (participant.name.length > 12 ? participant.name.substring(0, 12) : participant.name)
                      : `Team ${index + 1}`
                    }
                  </div>
                </div>

                {/* Main content area below the border */}
                <div className="text-center h-full relative" style={{ paddingTop: '20px', paddingBottom: '16px', backgroundColor: 'transparent' }}>
                  <div className="truncate flex justify-center absolute" style={{ fontSize: '17px', gap: '10px', bottom: '7px', left: '0', right: '0' }}>
                    {(() => {
                      // Calculate position counts for this participant
                      const participantPicks = picks.filter(pick => {
                        // Find which participant this pick belongs to using snake draft logic
                        const pickNumber = pick.pickNumber;
                        const round = Math.ceil(pickNumber / totalTeams);
                        const isSnakeRound = round % 2 === 0;
                        const pickIndexInRound = (pickNumber - 1) % totalTeams;
                        const participantIndex = isSnakeRound 
                          ? totalTeams - 1 - pickIndexInRound 
                          : pickIndexInRound;
                        return participantIndex === index;
                      });
                      
                      const counts = { QB: 0, RB: 0, WR: 0, TE: 0 };
                      participantPicks.forEach(pick => {
                        if (pick.player && counts.hasOwnProperty(pick.player.position)) {
                          counts[pick.player.position]++;
                        }
                      });
                      
                      // Calculate tracker data - unified bar only, no individual counters
                      const totalPicks = Object.values(counts).reduce((sum, count) => sum + count, 0);
                      
                      if (totalPicks === 0) {
                        // Show empty tracker bar when no picks
                        return (
                          <div 
                            style={{ 
                              height: '9px',
                              width: '83px',
                              backgroundColor: '#6B7280',
                              borderRadius: '1px'
                            }}
                          />
                        );
                      }

                      // Create segments for the tracker bar
                      const segments = [];
                      const positionColors = {
                        QB: '#F472B6',  // Pink - matches cell border
                        RB: '#0fba80',  // Green - matches cell border
                        WR: '#FBBF25',  // Blue - matches cell border
                        TE: '#7C3AED'   // Purple - matches cell border
                      };

                      Object.entries(counts).forEach(([position, count]) => {
                        if (count > 0) {
                          const percentage = (count / totalPicks) * 100;
                          segments.push({
                            position,
                            count,
                            percentage,
                            color: positionColors[position]
                          });
                        }
                      });

                      return (
                        <div 
                          className="flex"
                          style={{ 
                            height: '9px',
                            width: '82px',
                            borderRadius: '1px',
                            overflow: 'hidden'
                          }}
                        >
                          {segments.map((segment, segmentIndex) => (
                            <div
                              key={`${segment.position}-${segmentIndex}`}
                              style={{
                                width: `${segment.percentage}%`,
                                height: '100%',
                                backgroundColor: segment.color,
                                borderRadius: segmentIndex === 0 ? '1px 0 0 1px' : segmentIndex === segments.length - 1 ? '0 1px 1px 0' : '0'
                              }}
                              title={`${segment.position}: ${segment.count} player${segment.count !== 1 ? 's' : ''} (${segment.percentage.toFixed(1)}%)`}
                            />
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div> {/* Content container */}
          {draftGrid.map((roundData) => (
            <div 
              key={roundData.round}
              data-round={roundData.round}
              className="flex"
              style={{ 
                minHeight: '70px',
                minWidth: `${totalTeams * 108}px`, // Ensure minimum width for horizontal scrolling
                width: 'max-content' // Allow content to determine width
              }}
            >
              {/* Picks for this round */}
              {roundData.picks.map((pickData, pickIndex) => (
                <div 
                  key={pickData.pickNumber}
                  className="p-1 cursor-pointer transition-colors"
                  style={{ 
                    minWidth: '104px', 
                    width: '104px',
                    margin: '2px 2px',
                    marginRight: pickData.participantIndex === totalTeams - 1 ? '0px' : '2px', // No right margin for rightmost column
                    // Add 5px padding above 1.01-1.12 cells (first round)
                    marginTop: roundData.round === 1 ? '7px' : '2px', // 5px extra for first round
                    // Add rounded corners to all pick cells
                    borderRadius: '6px',
                    // Apply position color border with position-colored background to user's picks
                    ...(pickData.isUserPick && pickData.pick && {
                      // Each cell contributes 1px to shared borders, 4px to outer borders
                      border: `4px solid ${getPositionColor(pickData.pick.player.position)}`, // Position color border
                      backgroundColor: `${getPositionColor(pickData.pick.player.position)}20` // Position color background (20% opacity)
                    }),
                    // Apply custom styling to unpicked user cells (future picks)
                    ...(pickData.isUserPick && !pickData.pick && {
                      // Each cell contributes 1px to shared borders, 4px to outer borders
                      border: `4px solid ${userBorderColor}`, // Consistent 4px custom border for future picks
                      backgroundColor: 'transparent' // No background for unpicked
                    }),
                    // Apply position color border and background to all other picked cells
                    ...(!pickData.isUserPick && pickData.pick && {
                      border: `4px solid ${getPositionColor(pickData.pick.player.position)}`, // Position color border
                      backgroundColor: `${getPositionColor(pickData.pick.player.position)}20` // Position color background (20% opacity)
                    }),
                    // Default styling for unpicked cells (non-user)
                    ...(!pickData.isUserPick && !pickData.pick && {
                      border: '4px solid rgba(255, 255, 255, 0.1)', // Consistent 4px border for all grey cells
                      backgroundColor: 'transparent'
                    })
                  }}
                >
                  <div className="relative" style={{ height: pickData.pickNumber <= 216 ? '82px' : '78px' }}>
                    {/* Pick number in top left corner */}
                    <div className={`absolute left-1 text-gray-400 font-medium ${pickData.pick ? 'text-xs' : 'text-xs'}`} style={{ fontSize: pickData.pick ? '10px' : '12px', top: '2px' }}>
                      {Math.ceil(pickData.pickNumber / totalTeams)}.{String(((pickData.pickNumber - 1) % totalTeams) + 1).padStart(2, '0')}
                    </div>
                    
                    {pickData.pick ? (
                      // Player picked
                      <div className="h-full flex flex-col justify-center items-center text-center" style={{ paddingTop: '13px' }}>
                        {/* NFL Team Logo */}
                        <div style={{ 
                          marginBottom: (() => {
                            // Check if player name is likely to wrap to two lines
                            const playerName = `${pickData.pick.player.name.split(' ')[0].charAt(0)}. ${pickData.pick.player.name.split(' ').slice(1).join(' ')}`;
                            const isLongName = playerName.length > 12; // Approximate threshold for wrapping
                            return isLongName ? '-2px' : '2px';
                          })(),
                          transform: 'translateY(-4px)' 
                        }}>
                          <img 
                            src={`/logos/nfl/${pickData.pick.player.team.toLowerCase()}.png`}
                            alt={pickData.pick.player.team}
                            style={{
                              width: '32px',
                              height: '32px',
                              objectFit: 'contain'
                            }}
                            onError={(e) => {
                              console.log('Mobile logo failed to load:', `/logos/nfl/${pickData.pick.player.team.toLowerCase()}.png`);
                              // Fallback to text if logo fails to load
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'inline-block';
                            }}
                            onLoad={() => {
                              console.log('Mobile logo loaded successfully:', `/logos/nfl/${pickData.pick.player.team.toLowerCase()}.png`);
                            }}
                          />
                          <span 
                            style={{ 
                              display: 'none', 
                              fontSize: '8px',
                              color: '#fff',
                              fontWeight: 'bold'
                            }}
                          >
                            {pickData.pick.player.team}
                          </span>
                        </div>
                        <div className="font-bold text-white" style={{ 
                          marginTop: '0px', 
                          fontSize: '10px', 
                          lineHeight: '1.1',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                          hyphens: 'auto',
                          maxWidth: '100%',
                          padding: '0 2px',
                          transform: 'translateY(-2px)'
                        }}>
                          {pickData.pick.player.name.split(' ')[0].charAt(0)}. {pickData.pick.player.name.split(' ').slice(1).join(' ')}
                        </div>
                        <div className="text-gray-400" style={{ 
                          marginTop: '0px', 
                          fontSize: '10px',
                          lineHeight: '1.0',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                          maxWidth: '100%',
                          padding: '0 2px',
                          transform: 'translateY(2px)'
                        }}>
                          {pickData.pick.player.position} • {pickData.pick.player.team}
                        </div>
                      </div>
                    ) : pickData.isCurrentPick ? (
                      // Current pick on the clock - show white countdown timer for all players
                      <div className="h-full flex flex-col justify-center items-center text-center" style={{ paddingTop: '14px' }}>
                        <div 
                          className="font-bold" 
                          style={{ 
                            marginTop: '-3px',
                            fontSize: '32px', // Set to exactly 32px
                            color: pickData.isUserPick && timer <= 10 ? '#4285F4' : '#ffffff' // Blue at 10s or less for user picks only, white otherwise
                          }}
                        >
                          {timer}
                        </div>
                      </div>
                    ) : (
                      // Future pick - show picks away for user picks only
                      <div className="h-full flex flex-col justify-center items-center text-center" style={{ paddingTop: '14px' }}>
                        {pickData.isUserPick && (
                          <div className="text-gray-400" style={{ marginTop: '-3px', fontSize: '14px' }}>
                            {getPicksAway(pickData.pickNumber)} away
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pick Details Modal */}
      {selectedPick && selectedPick.pick && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPick(null)}
        >
          <div 
            className="bg-[#1a2332] rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 
                className="text-lg font-bold mb-2"
                style={{ color: getPositionColor(selectedPick.pick.player.position) }}
              >
                {selectedPick.pick.player.name}
              </h3>
              <p className="text-gray-300 mb-4">
                {selectedPick.pick.player.position} • {selectedPick.pick.player.team}
              </p>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex justify-between">
                  <span>Pick:</span>
                  <span className="text-white">{selectedPick.pickNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Round:</span>
                  <span className="text-white">{selectedPick.round}.{String(selectedPick.position).padStart(2, '0')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Drafted by:</span>
                  <span className="text-white">{selectedPick.participant?.name || 'Unknown'}</span>
                </div>
                {selectedPick.pick.player.adp && (
                  <div className="flex justify-between">
                    <span>ADP:</span>
                    <span className="text-white">{parseFloat(selectedPick.pick.player.adp).toFixed(1)}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedPick(null)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
