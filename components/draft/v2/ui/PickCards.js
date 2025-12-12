import React, { useState, useRef, useEffect } from 'react';
import { useDraft } from '../providers/DraftProvider';
import SevenSegmentCountdown from '../../../SevenSegmentCountdown';

/**
 * PickCards - Horizontal scrolling draft cards
 * 
 * Based on the snglcrd.png design from testing-grounds/player-card.js
 * Features:
 * - Horizontal scrolling layout
 * - Real-time pick updates
 * - Position-based color coding
 * - Timer integration
 * - Touch/mouse navigation
 */
export default function PickCards({ 
  cardStyle = 'horizontal',
  showTimer = true,
  showPositionBar = true,
  hidePositionBar = false,
  compact = false,
  enableAnimations = false,
  showDebugOverlay = false
}) {
  const { 
    picks, 
    participants, 
    currentPick, 
    currentRound, 
    timer, 
    isMyTurn, 
    userName,
    room,
    availablePlayers,
    makePick,
    selectedPlayer,
    setSelectedPlayer
  } = useDraft();

  const scrollRef = useRef(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [hoverTimer, setHoverTimer] = useState(null);

  const totalRounds = room?.settings?.totalRounds || 18;
  const totalPicks = participants.length * totalRounds;

  // Position colors from memory
  const getPositionColor = (position) => {
    switch (position) {
      case 'QB': return '#F472B6'; // pink
      case 'RB': return '#0fba80'; // softer green  
      case 'WR': return '#3B82F6'; // blue (since wr_blue.png isn't accessible here)
      case 'TE': return '#7C3AED'; // deep purple
      default: return '#808080'; // gray
    }
  };

  // Get team name for pick
  const getTeamName = (pickIndex) => {
    const round = Math.floor(pickIndex / participants.length) + 1;
    const isSnakeRound = round % 2 === 0;
    let teamIndex;
    
    if (isSnakeRound) {
      teamIndex = participants.length - 1 - (pickIndex % participants.length);
    } else {
      teamIndex = pickIndex % participants.length;
    }
    
    return participants[teamIndex] || `TEAM${teamIndex + 1}`;
  };

  // Get pick number display (1.01, 1.02, etc.)
  const getPickNumber = (pickIndex) => {
    const round = Math.floor(pickIndex / participants.length) + 1;
    const pick = (pickIndex % participants.length) + 1;
    return `${round}.${String(pick).padStart(2, '0')}`;
  };

  // Calculate position percentages for a given pick
  const getPositionPercentages = (pickIndex) => {
    const picksUpToIndex = picks.slice(0, pickIndex);
    const qbPicks = picksUpToIndex.filter(p => p.position === 'QB').length;
    const rbPicks = picksUpToIndex.filter(p => p.position === 'RB').length;
    const wrPicks = picksUpToIndex.filter(p => p.position === 'WR').length;
    const tePicks = picksUpToIndex.filter(p => p.position === 'TE').length;
    
    const totalPicksAtIndex = picksUpToIndex.length;
    if (totalPicksAtIndex === 0) return { QB: 25, RB: 25, WR: 25, TE: 25 };
    
    return {
      QB: (qbPicks / totalPicksAtIndex) * 100,
      RB: (rbPicks / totalPicksAtIndex) * 100,
      WR: (wrPicks / totalPicksAtIndex) * 100,
      TE: (tePicks / totalPicksAtIndex) * 100
    };
  };

  // Hover handlers
  const handleMouseEnter = (cardIndex) => {
    setHoveredCard(cardIndex);
    const timer = setTimeout(() => {
      setShowModal(true);
    }, 2000);
    setHoverTimer(timer);
  };

  const handleMouseLeave = () => {
    setHoveredCard(null);
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    setShowModal(false);
  };

  // Handle card click for current pick
  const handleCardClick = (pickIndex) => {
    if (pickIndex === picks.length && isMyTurn && selectedPlayer) {
      makePick(selectedPlayer.name);
    }
  };

  // Auto-scroll to current pick
  useEffect(() => {
    if (scrollRef.current && picks.length > 0) {
      const currentCardIndex = picks.length;
      const cardWidth = compact ? 160 : 193; // Card width + margin
      const scrollPosition = currentCardIndex * cardWidth - (scrollRef.current.clientWidth / 2);
      
      scrollRef.current.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
    }
  }, [picks.length, compact]);

  return (
    <div className="bg-gray-800 border-b border-gray-700">
      <div className="relative">
        {/* Scroll container */}
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto custom-scrollbar"
          style={{ scrollbarWidth: 'thin' }}
        >
          {Array.from({ length: totalPicks }, (_, i) => {
            const pick = picks[i];
            const isPicked = !!pick;
            const isCurrentPick = i === picks.length;
            const teamName = getTeamName(i);
            const pickNumber = getPickNumber(i);
            const isMyPickTurn = isCurrentPick && isMyTurn;
            const percentages = getPositionPercentages(i);
            
            // Get border color
            let borderColor = '#808080'; // default gray
            if (isCurrentPick) {
              borderColor = '#FBBF25'; // yellow for current pick
            } else if (isPicked && pick.position) {
              borderColor = getPositionColor(pick.position);
            }

            return (
              <div
                key={i}
                className={`flex-shrink-0 text-sm font-medium ${compact ? 'w-28.8 h-39.6' : 'w-36 h-46.8'} flex flex-col border-6 cursor-pointer`}
                style={{ 
                  borderWidth: '5.4px', 
                  position: 'relative', 
                  borderColor,
                  borderTopWidth: compact ? '28.8px' : '37.8px', 
                  backgroundColor: '#18181a', 
                  borderRadius: '9.9px', 
                  overflow: 'visible',
                  marginRight: '0.9px',
                  transition: enableAnimations ? 'all 0.3s ease' : 'none'
                }}
                onMouseEnter={() => handleMouseEnter(i)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleCardClick(i)}
              >
                {/* Hover modal */}
                {showModal && hoveredCard === i && !isPicked && !isCurrentPick && (
                  <div 
                    className="absolute text-gray-400 pointer-events-none"
                    style={{
                      bottom: '56px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 9999,
                      fontSize: compact ? '14px' : '19px'
                    }}
                  >
                    {i - picks.length} picks away
                  </div>
                )}

                {/* Debug overlay */}
                {showDebugOverlay && process.env.NODE_ENV === 'development' && (
                  <div className="absolute top-0 left-0 bg-black/50 text-xs p-1 text-white z-50">
                    {i}: {isPicked ? 'picked' : isCurrentPick ? 'current' : 'future'}
                  </div>
                )}

                {/* Team name in border area */}
                <div 
                  className="absolute left-0 right-0 font-bold text-center truncate whitespace-nowrap overflow-hidden"
                  style={{ 
                    fontSize: compact ? '12px' : '15px', 
                    color: isPicked ? 'white' : isCurrentPick ? 'black' : 'white',
                    backgroundColor: 'transparent',
                    zIndex: 9999,
                    padding: '2px',
                    top: compact ? '-16px' : '-20px',
                    transform: 'translateY(-50%)',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    maxWidth: '100%',
                    width: '100%'
                  }}
                  title={isCurrentPick ? (teamName === userName ? 'YOU' : teamName) : teamName}
                >
                  {isCurrentPick ? (teamName === userName ? 'YOU' : teamName) : teamName}
                </div>

                {/* Pick number */}
                <div 
                  className="absolute text-sm"
                  style={{ 
                    top: '4px',
                    left: '6px',
                    color: 'white',
                    zIndex: 9999,
                    fontSize: compact ? '10px' : '12px'
                  }}
                >
                  {pickNumber}
                </div>

                {/* Team logo placeholder */}
                <div 
                  className="absolute"
                  style={{ 
                    top: compact ? '10px' : '15px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: compact ? '54px' : '69.3px',
                    height: compact ? '54px' : '69.3px',
                    borderRadius: '50%',
                    border: '2px dotted #808080',
                    zIndex: 9999
                  }}
                />

                {/* Timer for current pick */}
                {isCurrentPick && showTimer && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: compact ? 'calc(50% + 20px)' : 'calc(50% + 28px)',
                      left: 'calc(50% + 3px)',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 9999
                    }}
                  >
                    <SevenSegmentCountdown 
                      initialSeconds={timer} 
                      useMonocraft={true}
                      size={compact ? 'small' : 'medium'}
                    />
                  </div>
                )}

                {/* Player name */}
                <div 
                  className="absolute text-center"
                  style={{ 
                    bottom: isPicked ? (compact ? '30px' : '38px') : (compact ? '55px' : '70px'),
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    maxWidth: '85%',
                    width: '85%'
                  }}
                >
                  {isPicked && pick ? (
                    <>
                      <div 
                        className={`${compact ? 'text-xs' : 'text-sm'} font-bold truncate whitespace-nowrap overflow-hidden`} 
                        style={{ 
                          lineHeight: '1.1',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          width: '100%'
                        }}
                        title={pick.player}
                      >
                        {pick.player}
                      </div>
                      <div 
                        className={`${compact ? 'text-xs' : 'text-sm'} text-gray-400 mt-1 truncate whitespace-nowrap overflow-hidden`}
                        style={{ 
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          width: '100%',
                          lineHeight: '1.0',
                          marginTop: '2px'
                        }}
                        title={`${pick.position} - ${pick.team}`}
                      >
                        {pick.position} - {pick.team}
                      </div>
                    </>
                  ) : isCurrentPick ? (
                    <div 
                      className={`${compact ? 'text-xs' : 'text-sm'} text-yellow-400 truncate whitespace-nowrap overflow-hidden`}
                      style={{ 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        width: '100%'
                      }}
                    >
                      {isMyTurn ? 'YOUR PICK' : 'ON THE CLOCK'}
                    </div>
                  ) : i > picks.length ? (
                    <div 
                      className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500 truncate whitespace-nowrap overflow-hidden`}
                      style={{ 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        width: '100%'
                      }}
                    >
                      {i - picks.length}
                    </div>
                  ) : null}
                </div>

                {/* Position percentage bar */}
                {!hidePositionBar && showPositionBar && (
                  <div 
                    className="absolute flex justify-center" 
                    style={{ 
                      bottom: '11px', 
                      left: '50%', 
                      transform: 'translateX(-50%)', 
                      zIndex: 9999, 
                      width: '90%' 
                    }}
                  >
                    <div style={{ 
                      height: compact ? 12 : 16, 
                      width: '100%', 
                      borderRadius: 6, 
                      display: 'flex', 
                      overflow: 'hidden', 
                      backgroundColor: 'rgba(255,255,255,0.1)', 
                      border: '1px solid rgba(255,255,255,0.2)' 
                    }}>
                      {isCurrentPick ? (
                        <div style={{ height: '100%', width: '100%', background: '#808080' }} />
                      ) : (
                        <>
                          <div style={{ height: '100%', width: `${Math.max(percentages.QB, 0)}%`, background: getPositionColor('QB'), minWidth: percentages.QB > 0 ? '2px' : '0px' }} />
                          <div style={{ height: '100%', width: `${Math.max(percentages.RB, 0)}%`, background: getPositionColor('RB'), minWidth: percentages.RB > 0 ? '2px' : '0px' }} />
                          <div style={{ height: '100%', width: `${Math.max(percentages.WR, 0)}%`, background: getPositionColor('WR'), minWidth: percentages.WR > 0 ? '2px' : '0px' }} />
                          <div style={{ height: '100%', width: `${Math.max(percentages.TE, 0)}%`, background: getPositionColor('TE'), minWidth: percentages.TE > 0 ? '2px' : '0px' }} />
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}