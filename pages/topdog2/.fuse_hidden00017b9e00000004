import React, { useState } from 'react';

interface Pick {
  position: string;
  pickNumber: number;
}

interface PositionPercentages {
  qb: number;
  rb: number;
  wr: number;
  te: number;
}

export default function TopDog2() {
  const [draftingTeam, setDraftingTeam] = useState<string>('NEWUSERNAME');
  const [isOnClock, setIsOnClock] = useState(true);
  const [pickNumber, setPickNumber] = useState(1);
  const [roundNumber, setRoundNumber] = useState(1);
  const [overallPick, setOverallPick] = useState(1);
  const [picksMade, setPicksMade] = useState<Pick[]>([]);
  const [currentCardPickNumber, setCurrentCardPickNumber] = useState(1.01);
  const [isCardPicked, setIsCardPicked] = useState(false);

  // Function to get the current drafting team username
  const getDraftingTeam = (): string => {
    return draftingTeam.toUpperCase().replace(/\s/g, '');
  };

  // Function to determine if team is on the clock
  const isTeamOnClock = (): boolean => {
    return isOnClock;
  };

  // Function to get the formatted pick number (e.g., "1.01", "2.05", etc.)
  const getPickNumber = (): string => {
    return `${roundNumber}.${String(pickNumber).padStart(2, '0')}`;
  };

  // Example function to update drafting team (would be called when draft state changes)
  const updateDraftingTeam = (username: string): void => {
    setDraftingTeam(username);
  };

  // Example function to update pick number (would be called when draft state changes)
  const updatePickNumber = (round: number, pick: number): void => {
    setRoundNumber(round);
    setPickNumber(pick);
  };

  // Calculate position percentages based on picks made
  const calculatePositionPercentages = (): PositionPercentages => {
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
  const getPositionPercentagesAtPick = (pickNum: number): PositionPercentages => {
    const picksUpToThisPoint = picksMade.filter(pick => pick.pickNumber <= pickNum);
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
  const addPick = (position: string, pickNum: number): void => {
    const newPick: Pick = { position, pickNumber: pickNum };
    setPicksMade(prev => [...prev, newPick]);
    
    // Check if this pick is for the current card
    if (pickNum === currentCardPickNumber && !isCardPicked) {
      setIsCardPicked(true);
    }
  };

  // Function to simulate picks for testing
  const simulatePicks = (): void => {
    const testPicks: Pick[] = [
      { position: 'QB', pickNumber: 1.01 },
      { position: 'RB', pickNumber: 1.02 },
      { position: 'WR', pickNumber: 1.03 },
      { position: 'RB', pickNumber: 1.04 },
      { position: 'WR', pickNumber: 1.05 },
      { position: 'TE', pickNumber: 1.06 },
      { position: 'QB', pickNumber: 1.07 },
      { position: 'RB', pickNumber: 1.08 },
      { position: 'WR', pickNumber: 1.09 },
      { position: 'TE', pickNumber: 1.10 },
      { position: 'RB', pickNumber: 1.11 },
      { position: 'WR', pickNumber: 1.12 }
    ];
    setPicksMade(testPicks);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center justify-center min-h-screen">
        {/* Absolute Pixels Card */}
        <div className="flex-shrink-0 text-sm font-medium w-48 h-64 flex flex-col border-6" style={{ borderWidth: '6px', position: 'relative', borderColor: '#FBBF25', borderTopWidth: '42px', backgroundColor: '#18181a', borderRadius: '11px', overflow: 'visible' }}>
          {/* Drafting team username positioned in yellow border area */}
          <div 
            className="absolute left-0 right-0 font-bold text-center truncate whitespace-nowrap overflow-hidden"
            style={{ 
              fontSize: '15px', 
              color: isTeamOnClock() ? 'black' : 'white',
              backgroundColor: 'transparent',
              zIndex: 9999,
              padding: '2px',
              top: '-20px',
              transform: 'translateY(-50%)',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              maxWidth: '100%',
              width: '100%'
            }}
            title={getDraftingTeam()}
          >
            {getDraftingTeam()}
          </div>

          {/* Pick number positioned at top left */}
          <div 
            className="absolute text-sm cursor-pointer"
            style={{ 
              top: '5px',
              left: '8px',
              color: 'white',
              zIndex: 9999
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
              width: '78.75px',
              height: '78.75px',
              borderRadius: '50%',
              border: '2px dotted #808080',
              zIndex: 9999
            }}
          ></div>

          <div className="text-sm w-full text-center leading-tight flex-1 flex items-end justify-center">
            <div className="w-full">
              <div className="font-bold text-xs h-4 flex items-center justify-center"></div>
            </div>
          </div>

          {/* Player name positioned absolutely */}
          <div 
            className="absolute text-center"
            style={{ 
              bottom: '38px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              maxWidth: '85%',
              width: '85%'
            }}
          >
            <div 
              className="font-bold text-sm truncate whitespace-nowrap overflow-hidden" 
              style={{ 
                marginTop: '-4px',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                width: '100%'
              }}
              title="Christian McCaffrey"
            >
              Christian McCaffrey
            </div>
            <div 
              className="text-sm text-gray-400 mt-1 truncate whitespace-nowrap overflow-hidden" 
              style={{ 
                marginTop: '2px',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                width: '100%',
                lineHeight: '1.0'
              }}
              title="RB - SF"
            >
              RB - SF
            </div>
          </div>

          <div className="text-xs text-center flex justify-center" style={{ position: 'absolute', bottom: '11px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, width: '90%' }}>
            <div style={{ height: 16, width: '100%', borderRadius: 6, display: 'flex', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
              {(() => {
                try {
                  // If no picks have been made yet, show grey tracker
                  if (picksMade.length === 0) {
                    return (
                      <div style={{ height: 16, width: '100%', background: '#808080' }}></div>
                    );
                  }
                  
                  const percentages = calculatePositionPercentages();
                  return (
                    <>
                      <div style={{ height: 16, width: `${Math.max(percentages.qb, 1)}%`, background: '#F472B6' }}></div>
                      <div style={{ height: 16, width: `${Math.max(percentages.rb, 1)}%`, background: '#0fba80' }}></div>
                      <div style={{ height: 16, width: `${Math.max(percentages.wr, 1)}%`, background: 'url(/wr_blue.png)' }}></div>
                      <div style={{ height: 16, width: `${Math.max(percentages.te, 1)}%`, background: '#7C3AED' }}></div>
                    </>
                  );
                } catch (error) {
                  // Fallback to grey if calculation fails
                  return (
                    <div style={{ height: 16, width: '100%', background: '#808080' }}></div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
