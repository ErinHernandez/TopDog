/**
 * Draft Room V3 - Horizontal Picks Bar
 * 
 * The scrolling picks display at the top of the draft room.
 * This component preserves your exact measurements and behavior.
 * 
 * Key specs preserved:
 * - 256px height
 * - 4.5px gap between cards
 * - 158px card width
 * - Smooth scrolling behavior
 * - Precise countdown positioning
 */

import React, { useRef, useEffect, useState } from 'react';

// Helper function for position colors
const getPositionColor = (position) => {
  const colors = {
    QB: '#7C3AED',
    RB: '#0fba80', 
    WR: '#4285F4',
    TE: '#7C3AED'
  };
  return colors[position] || '#6b7280';
};

/**
 * Helper function for scroll management
 * Auto-scrolls to keep the current pick visible
 */
function useHorizontalPicksScroll(scrollRef, currentPickNumber) {
  useEffect(() => {
    if (!scrollRef.current || !currentPickNumber) return;
    
    const container = scrollRef.current;
    const cardWidth = 158; // Card width in pixels
    const cardGap = 4.5;   // Gap between cards
    const cardTotalWidth = cardWidth + cardGap;
    
    // Calculate position of current pick card
    const currentPickIndex = currentPickNumber - 1;
    const targetScrollPosition = currentPickIndex * cardTotalWidth;
    
    // Get container dimensions
    const containerWidth = container.offsetWidth;
    const scrollLeft = container.scrollLeft;
    const scrollRight = scrollLeft + containerWidth;
    
    // Check if current pick is visible
    const cardLeft = targetScrollPosition;
    const cardRight = targetScrollPosition + cardWidth;
    
    // Scroll to center the current pick if it's not fully visible
    if (cardLeft < scrollLeft || cardRight > scrollRight) {
      const centerPosition = targetScrollPosition - (containerWidth / 2) + (cardWidth / 2);
      
      container.scrollTo({
        left: Math.max(0, centerPosition),
        behavior: 'smooth'
      });
    }
    
  }, [currentPickNumber, scrollRef]);
}

export default function HorizontalPicksBar({ 
  picks = [], 
  participants = [],
  currentPickNumber = 1,
  isDraftActive = false,
  timer = 120,
  preDraftCountdown = 300,
  isOnTheClock = false,
  isMyTurn = false,
  picksScrollRef // Will be passed from parent for scroll control
}) {
  
  // Use passed ref or create local one
  const localScrollRef = useRef(null);
  const scrollRef = picksScrollRef || localScrollRef;
  
  // Auto-scroll to current pick
  useHorizontalPicksScroll(scrollRef, currentPickNumber);

  // Get current pick data for countdown display
  const getCurrentPickData = () => {
    if (!picks.length || !participants.length) return null;
    
    // This logic will be extracted from current implementation
    // For now, return mock data to show the structure
    return {
      playerName: 'Ja\'Marr Chase',
      position: 'WR',
      team: 'CIN',
      bye: '10'
    };
  };

  const currentPickData = getCurrentPickData();

  return (
    <div 
      className="zoom-resistant" 
      style={{
        position: 'relative',
        width: '100vw',
        paddingTop: '30px',
        paddingBottom: '30px',
        backgroundColor: '#101927'
      }}
    >
      <div 
        className="relative zoom-resistant" 
        style={{ 
          position: 'relative', 
          transform: 'translateZ(0)', 
          overflow: 'visible', 
          minWidth: '100%', 
          width: '100%' 
        }}
      >
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto custom-scrollbar zoom-resistant"
          style={{
            height: '256px',
            gap: '4.5px',
            overflowX: 'auto',
            scrollBehavior: 'smooth'
          }}
        >
          {/* Generate pick cards - 18 rounds for all participants */}
          {Array.from({ length: participants.length * 18 }, (_, index) => {
            const pickNumber = index + 1;
            const pick = picks.find(p => p.pickNumber === pickNumber);
            const isCurrentPick = pickNumber === currentPickNumber;
            const isFuturePick = pickNumber > currentPickNumber;
            
            return (
              <PickCard
                key={`pick-${pickNumber}`}
                pickNumber={pickNumber}
                pick={pick}
                isCurrentPick={isCurrentPick}
                isFuturePick={isFuturePick}
                isDraftActive={isDraftActive}
                timer={timer}
                preDraftCountdown={preDraftCountdown}
                isOnTheClock={isOnTheClock}
                isMyTurn={isMyTurn}
                currentPickData={currentPickData}
                participants={participants}
                picks={picks}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Individual Pick Card Component
 * Preserves exact styling and countdown positioning from current implementation
 */
function PickCard({ 
  pickNumber, 
  pick, 
  isCurrentPick, 
  isFuturePick, 
  isDraftActive,
  timer,
  preDraftCountdown,
  isOnTheClock,
  isMyTurn,
  currentPickData,
  participants,
  picks
}) {
  
  // Get participant for this pick (snake draft logic)
  const getParticipantForPick = () => {
    if (!participants.length) return null;
    
    // Snake draft logic: even rounds reverse the order
    const round = Math.ceil(pickNumber / participants.length);
    const isSnakeRound = round % 2 === 0;
    const pickIndexInRound = (pickNumber - 1) % participants.length;
    
    // For snake rounds (even), reverse the order
    const participantIndex = isSnakeRound 
      ? participants.length - 1 - pickIndexInRound 
      : pickIndexInRound;
    
    return participants[participantIndex] || null;
  };

  const participant = getParticipantForPick();
  const playerData = pick?.player || currentPickData;

  // Card styling based on state
  const getCardStyling = () => {
    if (isCurrentPick && isDraftActive) {
      return {
        border: '2px solid #FBBF25', // Gold border for current pick
        background: 'rgba(251, 191, 37, 0.1)'
      };
    }
    if (pick) {
      // Completed pick styling
      return {
        border: '1px solid rgba(255, 255, 255, 0.2)',
        background: 'rgba(255, 255, 255, 0.05)'
      };
    }
    // Future pick styling
    return {
      border: '1px solid rgba(255, 255, 255, 0.1)',
      background: 'rgba(255, 255, 255, 0.02)'
    };
  };

  const cardStyling = getCardStyling();

  return (
    <div 
      className="flex-shrink-0 relative"
      style={{
        width: '158px',
        ...cardStyling,
        borderRadius: '8px',
        padding: '2px'
      }}
    >
      {/* Pick Number - Top Left Corner */}
      <div 
        className="absolute top-1 left-1 text-white font-bold text-xs bg-black/50 px-1 rounded"
        style={{ zIndex: 10 }}
      >
        {(() => {
          const round = Math.ceil(pickNumber / participants.length);
          const pickInRound = ((pickNumber - 1) % participants.length) + 1;
          return `${round}.${pickInRound < 10 ? `0${pickInRound}` : pickInRound}`;
        })()}
      </div>

      {/* Participant Name */}
      <div 
        className={participant?.name === 'TITANIMPLOSION' ? 'text-center font-bold text-xs mb-2' : 'text-center font-bold text-xs mb-2'}
        style={{ 
          fontSize: '13px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textTransform: 'uppercase',
          backgroundColor: participant?.name === 'TITANIMPLOSION' ? '#FBBF25' : 'transparent',
          borderRadius: participant?.name === 'TITANIMPLOSION' ? '4px' : '0',
          color: pick ? 'black' : (participant?.name === 'TITANIMPLOSION' ? 'black' : 'white'),
          border: participant?.name === 'TITANIMPLOSION' ? '2px solid red' : 'none'
        }}
        data-participant={participant?.name}
      >
        {participant?.name?.replace(/[,\s]/g, '').substring(0, 18) || 'TBD'}
      </div>

      {/* Player Circle or Countdown */}
      <div 
        className="mx-auto mb-3 rounded-full border-2 border-dashed border-white flex items-center justify-center"
        style={{
          width: '70.875px',
          height: '70.875px',
          marginBottom: '12px'
        }}
      >
        {pick?.player ? (
          // Show picked player number or initials
          <div className="text-white font-bold text-lg">
            {pick.player.jerseyNumber || pick.player.name?.charAt(0) || '?'}
          </div>
        ) : isCurrentPick && isOnTheClock ? (
          // Show countdown timer with exact positioning
          <div 
            className="text-sm w-full text-center leading-tight flex-1 flex items-end justify-center"
            style={{ paddingBottom: '20px', position: 'relative' }}
          >
            <div className="w-full">
              <div 
                className="flex items-center justify-center"
                style={{
                  transform: 'translateX(-50%) scale(0.9)',
                  position: 'absolute',
                  bottom: '28px',
                  left: '50%'
                }}
              >
                {/* SevenSegmentCountdown component would go here */}
                <div className="text-white font-mono text-lg">
                  {isDraftActive ? 
                    `${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}` :
                    `${Math.floor(preDraftCountdown / 60)}:${(preDraftCountdown % 60).toString().padStart(2, '0')}`
                  }
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Empty future pick
          <div className="text-gray-500 text-xs">
            {pickNumber}
          </div>
        )}
      </div>

      {/* Player Info (if picked) */}
      {pick?.player && (
        <div className="text-center">
          <div 
            className="font-bold text-white text-xs leading-tight"
            style={{ 
              marginTop: '4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden'
            }}
          >
            {pick.player.name}
          </div>
          <div 
            className="text-xs text-gray-400"
            style={{
              marginTop: '4px',
              whiteSpace: 'nowrap'
            }}
          >
            {pick.player.position} - {pick.player.team}
          </div>
        </div>
      )}

      {/* Current Pick Player Preview */}
      {isCurrentPick && currentPickData && !pick && (
        <div className="text-center">
          <div 
            className="font-bold text-white text-xs leading-tight"
            style={{ 
              marginTop: '4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden'
            }}
          >
            {currentPickData.playerName}
          </div>
          <div 
            className="text-xs"
            style={{
              marginTop: '4px',
              whiteSpace: 'nowrap',
              color: getPositionColor(currentPickData.position)
            }}
          >
            {currentPickData.position} - {currentPickData.team}
          </div>
        </div>
      )}

      {/* Colored Position Tracker (at bottom) */}
      <ColoredPositionTracker 
        pickNumber={pickNumber}
        participants={participants}
        picks={picks}
      />
    </div>
  );
}

/**
 * Colored Position Tracker Component
 * Shows position distribution across all picks in draft
 */
function ColoredPositionTracker({ pickNumber, participants, picks }) {
  // Calculate position percentages for all picks made so far
  const getPositionBreakdown = () => {
    if (!picks.length) return { QB: 0, RB: 0, WR: 0, TE: 0 };
    
    const positionCounts = { QB: 0, RB: 0, WR: 0, TE: 0 };
    const totalPicks = picks.length;
    
    picks.forEach(pick => {
      if (pick.player && pick.player.position) {
        const pos = pick.player.position;
        if (positionCounts.hasOwnProperty(pos)) {
          positionCounts[pos]++;
        }
      }
    });
    
    // Convert to percentages
    return {
      QB: totalPicks > 0 ? (positionCounts.QB / totalPicks) * 100 : 0,
      RB: totalPicks > 0 ? (positionCounts.RB / totalPicks) * 100 : 0,
      WR: totalPicks > 0 ? (positionCounts.WR / totalPicks) * 100 : 0,
      TE: totalPicks > 0 ? (positionCounts.TE / totalPicks) * 100 : 0
    };
  };

  const breakdown = getPositionBreakdown();

  return (
    <div 
      className="absolute bottom-0 left-0 right-0 flex"
      style={{ 
        height: '16px',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}
    >
      {/* QB Bar */}
      <div 
        style={{ 
          width: `${breakdown.QB}%`,
          height: '100%',
          backgroundColor: '#7C3AED',
          transition: 'width 0.3s ease'
        }}
      />
      
      {/* RB Bar */}
      <div 
        style={{ 
          width: `${breakdown.RB}%`,
          height: '100%',
          backgroundColor: '#0fba80',
          transition: 'width 0.3s ease'
        }}
      />
      
      {/* WR Bar */}
      <div 
        style={{ 
          width: `${breakdown.WR}%`,
          height: '100%',
          backgroundColor: '#4285F4',
          transition: 'width 0.3s ease'
        }}
      />
      
      {/* TE Bar */}
      <div 
        style={{ 
          width: `${breakdown.TE}%`,
          height: '100%',
          backgroundColor: '#7C3AED',
          transition: 'width 0.3s ease'
        }}
      />
      
      {/* Remaining space (transparent) */}
      <div 
        style={{ 
          flex: 1,
          height: '100%',
          backgroundColor: 'transparent'
        }}
      />
    </div>
  );
}

/**
 * Manual scroll controls for picks bar
 */
export function usePicksScrollControls(scrollRef) {
  const scrollLeft = () => {
    if (!scrollRef.current) return;
    const cardTotalWidth = 158 + 4.5; // Card width + gap
    scrollRef.current.scrollBy({
      left: -cardTotalWidth * 3, // Scroll 3 cards at a time
      behavior: 'smooth'
    });
  };

  const scrollRight = () => {
    if (!scrollRef.current) return;
    const cardTotalWidth = 158 + 4.5; // Card width + gap
    scrollRef.current.scrollBy({
      left: cardTotalWidth * 3, // Scroll 3 cards at a time
      behavior: 'smooth'
    });
  };

  const scrollToStart = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      left: 0,
      behavior: 'smooth'
    });
  };

  const scrollToEnd = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      left: scrollRef.current.scrollWidth,
      behavior: 'smooth'
    });
  };

  const scrollToPick = (pickNumber) => {
    if (!scrollRef.current || !pickNumber) return;
    const cardTotalWidth = 158 + 4.5; // Card width + gap
    const targetPosition = (pickNumber - 1) * cardTotalWidth;
    const containerWidth = scrollRef.current.offsetWidth;
    const centerPosition = targetPosition - (containerWidth / 2) + (158 / 2);
    
    scrollRef.current.scrollTo({
      left: Math.max(0, centerPosition),
      behavior: 'smooth'
    });
  };

  return {
    scrollLeft,
    scrollRight,
    scrollToStart,
    scrollToEnd,
    scrollToPick
  };
}

/**
 * Development component for testing the picks bar with scroll controls
 */
export function HorizontalPicksBarDemo() {
  const [currentPick, setCurrentPick] = useState(2);
  const scrollRef = useRef(null);
  const scrollControls = usePicksScrollControls(scrollRef);

  // Mock data for testing - 12 participants
  const mockParticipants = [
    { name: 'NOTTODDMIDDLETON' },
    { name: 'FLIGHT800' }, 
    { name: 'TITANIMPLOSION' },
    { name: 'LOLITAEXPRESS' },
    { name: 'BPWASFRAMED' },
    { name: 'SEXWORKISWORK' },
    { name: 'TRAPPEDINTHECLOSET' },
    { name: 'KANYEAPOLOGISTS' },
    { name: 'ICEWALL' },
    { name: 'MOONLANDINGFAKE' },
    { name: 'BIRDSARENTREAL' },
    { name: 'CHEMTRAILSROCK' }
  ];

  const mockPicks = [
    { 
      pickNumber: 1, 
      player: { 
        name: 'Josh Allen', 
        position: 'QB', 
        team: 'BUF',
        jerseyNumber: '17'
      }
    }
  ];

  return (
    <div className="bg-[#101927] min-h-screen p-8">
      <div className="text-white text-center mb-8">
        <h1 className="text-2xl font-bold mb-4">Horizontal Picks Bar Demo</h1>
        <p className="text-gray-300">Exact measurements preserved: 256px height, 4.5px gaps, 158px cards</p>
        
        {/* Scroll Controls */}
        <div className="flex justify-center gap-4 mt-4 mb-8">
          <button 
            onClick={scrollControls.scrollToStart}
            className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700"
          >
            Start
          </button>
          <button 
            onClick={scrollControls.scrollLeft}
            className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700"
          >
            ← Scroll Left
          </button>
          <button 
            onClick={scrollControls.scrollRight}
            className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700"
          >
            Scroll Right →
          </button>
          <button 
            onClick={scrollControls.scrollToEnd}
            className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700"
          >
            End
          </button>
        </div>

        {/* Pick Navigation */}
        <div className="flex justify-center gap-2 mb-4">
          <button 
            onClick={() => setCurrentPick(Math.max(1, currentPick - 1))}
            className="px-3 py-1 bg-green-600 rounded text-white hover:bg-green-700"
            disabled={currentPick <= 1}
          >
            Previous Pick
          </button>
          <span className="px-4 py-1 bg-gray-700 rounded text-white">
            Pick: {currentPick}
          </span>
          <button 
            onClick={() => setCurrentPick(currentPick + 1)}
            className="px-3 py-1 bg-green-600 rounded text-white hover:bg-green-700"
          >
            Next Pick
          </button>
          <button 
            onClick={() => scrollControls.scrollToPick(currentPick)}
            className="px-3 py-1 bg-purple-600 rounded text-white hover:bg-purple-700"
          >
            Scroll to Current
          </button>
        </div>
      </div>
      
      <HorizontalPicksBar
        picks={mockPicks}
        participants={mockParticipants}
        currentPickNumber={currentPick}
        isDraftActive={true}
        timer={95}
        isOnTheClock={true}
        isMyTurn={false}
        picksScrollRef={scrollRef}
      />
    </div>
  );
}
