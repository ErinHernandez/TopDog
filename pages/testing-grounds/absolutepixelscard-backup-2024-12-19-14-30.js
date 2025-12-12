import React, { useState, useEffect } from 'react';
import SevenSegmentCountdown from '../../components/SevenSegmentCountdown';

export default function AbsolutepixelscardBackup() {
  const [draftingTeam, setDraftingTeam] = useState('NEWUSERNAME');
  const [isOnClock, setIsOnClock] = useState(true); // For testing - set to true to see black font
  const [pickNumber, setPickNumber] = useState(1); // For testing - current pick number
  const [roundNumber, setRoundNumber] = useState(1); // For testing - current round
  const [overallPick, setOverallPick] = useState(6); // Overall pick number (1, 2, 3, 4, 5, 6, etc.)
  const [picksMade, setPicksMade] = useState([
    { position: 'RB', pickNumber: 1.01, player: 'Saquon Barkley' },
    { position: 'WR', pickNumber: 1.02, player: 'Ja\'Marr Chase' },
    { position: 'TE', pickNumber: 1.03, player: 'George Kittle' },
    { position: 'QB', pickNumber: 1.04, player: 'Josh Allen' },
    { position: 'WR', pickNumber: 1.05, player: 'Justin Jefferson' }
  ]); // Track all picks made - initialize with the 5 picks
  const [currentCardPickNumber, setCurrentCardPickNumber] = useState(1.06); // The pick number for this specific card
  const [isCardPicked, setIsCardPicked] = useState(false); // Whether this specific card has been picked

  const [hoveredCard, setHoveredCard] = useState(null); // Track which card is being hovered
  const [hoverTimer, setHoverTimer] = useState(null); // Timer for hover delay
  const [showModal, setShowModal] = useState(false); // Show modal after 2 seconds
  
  // Timer state for pulsing glow effect
  const [timer, setTimer] = useState(30);
  const [shouldPulse, setShouldPulse] = useState(false);

  // Sample player data for demonstration
  const samplePlayer = {
    name: 'Saquon Barkley',
    position: 'RB',
    team: 'NYG'
  };

  // Timer effect for pulsing glow
  useEffect(() => {
    if (!isCardPicked && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => {
          const newTime = prev - 1;
          // Start pulsing with great intensity at 5 seconds
          if (newTime <= 5 && newTime > 0) {
            setShouldPulse(true);
          } else if (newTime <= 0) {
            setShouldPulse(false);
          }
          return newTime;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isCardPicked, timer]);

  // Function to get the current drafting team username
  const getDraftingTeam = () => {
    // This would typically come from your draft state/context
    // For now, we'll simulate it with a placeholder
    return draftingTeam.toUpperCase().replace(/\s/g, '');
  };

  // Function to determine if team is on the clock
  const isTeamOnClock = () => {
    // This would typically check against current draft state
    // For now, we'll use the state variable for testing
    return isOnClock;
  };

  // Function to get the formatted pick number (e.g., "1.01", "2.05", etc.)
  const getPickNumber = () => {
    // Format: round.pick (e.g., 1.01, 2.05, etc.)
    return `${roundNumber}.${String(pickNumber).padStart(2, '0')}`;
  };

  // Example function to update drafting team (would be called when draft state changes)
  const updateDraftingTeam = (username) => {
    setDraftingTeam(username);
  };

  // Example function to update pick number (would be called when draft state changes)
  const updatePickNumber = (round, pick) => {
    setRoundNumber(round);
    setPickNumber(pick);
  };

  // Calculate position percentages based on picks made
  const calculatePositionPercentages = () => {
    // For future pick cards (not yet picked), always show current percentages
    if (!isCardPicked) {
      // Calculate based on all picks made so far
      const qbPicks = picksMade.filter(pick => pick.position === 'QB').length;
      const rbPicks = picksMade.filter(pick => pick.position === 'RB').length;
      const wrPicks = picksMade.filter(pick => pick.position === 'WR').length;
      const tePicks = picksMade.filter(pick => pick.position === 'TE').length;
      
      const totalPicks = picksMade.length;
      if (totalPicks === 0) return { qb: 25, rb: 25, wr: 25, te: 25 };
      
      return {
        qb: (qbPicks / totalPicks) * 100,
        rb: (rbPicks / totalPicks) * 100,
        wr: (wrPicks / totalPicks) * 100,
        te: (tePicks / totalPicks) * 100
      };
    }
    
    // If this card has been picked, use the percentages from when it was picked
    return getPositionPercentagesAtPick(currentCardPickNumber);
  };

  // Get position percentages at a specific pick number
  const getPositionPercentagesAtPick = (pickNumber) => {
    const picksUpToThisPoint = picksMade.filter(pick => pick.pickNumber <= pickNumber);
    const qbPicks = picksUpToThisPoint.filter(pick => pick.position === 'QB').length;
    const rbPicks = picksUpToThisPoint.filter(pick => pick.position === 'RB').length;
    const wrPicks = picksUpToThisPoint.filter(pick => pick.position === 'WR').length;
    const tePicks = picksUpToThisPoint.filter(pick => pick.position === 'TE').length;
    
    const totalPicks = picksUpToThisPoint.length;
    if (totalPicks === 0) return { qb: 25, rb: 25, wr: 25, te: 25 };
    
    return {
      qb: (qbPicks / totalPicks) * 100,
      rb: (rbPicks / totalPicks) * 100,
      wr: (wrPicks / totalPicks) * 100,
      te: (tePicks / totalPicks) * 100
    };
  };

  // Function to add a pick (simulates a pick being made)
  const addPick = (position, pickNumber) => {
    const newPick = { position, pickNumber };
    setPicksMade(prev => [...prev, newPick]);
    
    // Check if this pick is for the current card
    if (pickNumber === currentCardPickNumber && !isCardPicked) {
      setIsCardPicked(true);
    }
  };

  // Function to simulate picks for testing
  const simulatePicks = () => {
    const testPicks = [
      { position: 'RB', pickNumber: 1.01, player: 'Saquon Barkley' },
      { position: 'WR', pickNumber: 1.02, player: 'Ja\'Marr Chase' },
      { position: 'TE', pickNumber: 1.03, player: 'George Kittle' },
      { position: 'QB', pickNumber: 1.04, player: 'Josh Allen' },
      { position: 'WR', pickNumber: 1.05, player: 'Justin Jefferson' }
    ];
    setPicksMade(testPicks);
    setOverallPick(6); // Set to pick 6 (on the clock)
  };

  // Hover functions
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

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <style jsx>{`
        @keyframes pulse-glow {
          0% {
            text-shadow: 0 0 20px #ff0000, 0 0 30px #ff0000, 0 0 40px #ff0000;
          }
          100% {
            text-shadow: 0 0 30px #ff0000, 0 0 40px #ff0000, 0 0 50px #ff0000, 0 0 60px #ff0000;
          }
        }
      `}</style>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">
          Absolutepixelscard Backup - {new Date().toLocaleString()}
        </h1>
        
        {/* Absolute Pixels Card */}
        <div className="flex-shrink-0 text-sm font-medium w-48 h-64 flex flex-col border-6" style={{ borderWidth: '6px', position: 'relative', borderColor: '#FBBF25', borderTopWidth: '42px', backgroundColor: '#18181a', borderRadius: '11px', overflow: 'visible' }}>
          {/* Drafting team username positioned in yellow border area */}
          <div 
            className="absolute left-0 right-0 font-bold text-center"
            style={{ 
              fontSize: '15px', 
              color: isTeamOnClock() ? 'black' : 'white',
              backgroundColor: 'transparent',
              zIndex: 9999,
              padding: '2px',
              top: '-20px',
              transform: 'translateY(-50%)'
            }}
          >
            {getDraftingTeam()}
          </div>

          {/* Pick number positioned at top left */}
          <div 
            className="absolute text-sm cursor-pointer"
            style={{ 
              top: '4px',
              left: '8px',
              color: 'white',
              zIndex: 9999,
              textShadow: shouldPulse ? '0 0 20px #ff0000, 0 0 30px #ff0000, 0 0 40px #ff0000' : 'none',
              animation: shouldPulse ? 'pulse-glow 0.5s ease-in-out infinite alternate' : 'none'
            }}
            onClick={() => {
              setOverallPick(prev => prev >= 13 ? 1 : prev + 1);
            }}
          >
            {(() => {
              // Convert overall pick to round.pick format
              const round = Math.floor((overallPick - 1) / 12) + 1;
              const pick = ((overallPick - 1) % 12) + 1;
              return `${round}.${String(pick).padStart(2, '0')}`;
            })()}
          </div>

          {/* User logo placeholder in top right corner */}
          <div 
            className="absolute"
            style={{ 
              top: '15px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '77.18px',
              height: '77.18px',
              borderRadius: '50%',
              border: '2px dotted #808080',
              zIndex: 9999
            }}
          ></div>

          <div className="text-sm w-full text-center leading-tight flex-1 flex items-center justify-center">
            <div className="w-full">
              <div className="font-bold text-xs h-4 flex items-center justify-center mb-2">
                {/* Timer only shows when card is NOT picked */}
                {!isCardPicked && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: 'calc(50% + 28px)',
                      left: 'calc(50% + 3px)',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 9999,
                      filter: shouldPulse && !isTeamOnClock() ? 'drop-shadow(0 0 20px #ff0000) drop-shadow(0 0 30px #ff0000)' : 'none',
                      animation: shouldPulse && !isTeamOnClock() ? 'pulse-glow 0.5s ease-in-out infinite alternate' : 'none'
                    }}
                  >
                    <SevenSegmentCountdown initialSeconds={timer} useMonocraft={true} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Player name positioned absolutely - only shows when card IS picked */}
          {isCardPicked && (
            <div 
              className="absolute text-center"
              style={{ 
                bottom: '38px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                maxWidth: '90%'
              }}
            >
              <div className="text-sm font-bold truncate whitespace-nowrap" style={{ marginTop: '-8px', lineHeight: '1.2' }}>
                {samplePlayer.name}
              </div>
              <div className="text-sm text-gray-400 mt-1 truncate whitespace-nowrap" style={{ marginTop: '4px' }}>
                {`${samplePlayer.position} - ${samplePlayer.team}`}
              </div>
            </div>
          )}

          <div className="text-xs text-center flex justify-center" style={{ position: 'absolute', bottom: '11px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, width: '90%' }}>
            <div style={{ height: 16, width: '100%', borderRadius: 6, display: 'flex', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ height: 16, width: '100%', background: '#808080' }}></div>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mt-4">
          Card using absolute pixels only - no margins, no calc.
        </p>
        
        {/* Toggle button to demonstrate timer vs player name */}
        <div className="mt-6">
          <button 
            onClick={() => {
              setIsCardPicked(!isCardPicked);
              if (!isCardPicked) {
                setTimer(30); // Reset timer when showing timer
                setShouldPulse(false);
              }
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {isCardPicked ? 'Show Timer (Unpick Card)' : 'Show Player Name (Pick Card)'}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Click to toggle between timer and player name display
          </p>
        </div>
      </div>
    </div>
  );
} 