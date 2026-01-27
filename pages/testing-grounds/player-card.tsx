import React, { useState, useEffect } from 'react';
import type { JSX } from 'react';
import SevenSegmentCountdown from '../../components/SevenSegmentCountdown';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type Position = 'QB' | 'RB' | 'WR' | 'TE';

interface Player {
  name: string;
  position: Position;
  team: string;
}

interface DraftPick {
  position: Position;
  pickNumber: string;
  player?: string;
  user: string;
}

interface PositionPercentages {
  qb: number;
  rb: number;
  wr: number;
  te: number;
}

type PickNumberFormat = 'round.pick' | 'overall';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function PlayerCardTest(): JSX.Element {
  const [draftingTeam, setDraftingTeam] = useState<string>('NEWUSERNAME');
  const [isOnClock, setIsOnClock] = useState<boolean>(true); // For testing - set to true to see black font
  const [pickNumber, setPickNumber] = useState<number>(1); // For testing - current pick number
  const [roundNumber, setRoundNumber] = useState<number>(1); // For testing - current round
  const [overallPick, setOverallPick] = useState<number>(6); // Overall pick number (1, 2, 3, 4, 5, 6, etc.) - set to 6 for pick 1.06
  const [picksMade, setPicksMade] = useState<DraftPick[]>([]); // Track all picks made - start with no picks
  const [currentCardPickNumber, setCurrentCardPickNumber] = useState<number>(1.06); // The pick number for this specific card
  const [isCardPicked, setIsCardPicked] = useState<boolean>(false); // Whether this specific card has been picked

  // Draft simulation state
  const [isDraftActive, setIsDraftActive] = useState<boolean>(true); // Set to true so timer runs
  const [draftTimer, setDraftTimer] = useState<number>(30);
  const [currentDraftingTeam, setCurrentDraftingTeam] = useState<number>(1);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [isDraftPaused, setIsDraftPaused] = useState<boolean>(false);
  const [showOverallPick, setShowOverallPick] = useState<boolean>(false);

  const [hoveredCard, setHoveredCard] = useState<number | null>(null); // Track which card is being hovered
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null); // Timer for hover delay
  const [showModal, setShowModal] = useState<boolean>(false); // Show modal after 2 seconds
  const [isHoveringButtons, setIsHoveringButtons] = useState<boolean>(false); // Track if hovering over button area
  const [hoverButtonTimer, setHoverButtonTimer] = useState<NodeJS.Timeout | null>(null); // Timer for hover delay
  const [pickNumberFormat, setPickNumberFormat] = useState<PickNumberFormat>('round.pick'); // Track pick number format: 'round.pick' or 'overall'

  // Function to get the current drafting team username
  const getDraftingTeam = (): string => {
    // Always use the calculated team name instead of hardcoded NEWUSERNAME
    return getTeamForPick(overallPick - 1);
  };

  // Create a proper team order array for snake draft
  const getTeamOrder = (): string[] => {
    // For now, create a simple team order array
    // In a real implementation, this would come from the draft state
    const teams: string[] = [];
    for (let i = 1; i <= 12; i++) {
      teams.push(`TEAM${i}`);
    }
    return teams;
  };

  // Function to get the team for a specific pick in snake draft
  const getTeamForPick = (pickIndex: number): string => {
    const teams = getTeamOrder();
    const round = Math.floor(pickIndex / 12) + 1;
    const pickInRound = (pickIndex % 12);
    
    // Snake draft logic: odd rounds go forward, even rounds go backward
    if (round % 2 === 1) {
      // Odd rounds (1, 3, 5, ...): teams pick in order 1-12
      return teams[pickInRound];
    } else {
      // Even rounds (2, 4, 6, ...): teams pick in reverse order 12-1
      return teams[11 - pickInRound];
    }
  };

  // Function to determine if team is on the clock
  const isTeamOnClock = (): boolean => {
    // This would typically check against current draft state
    // For now, we'll use the state variable for testing
    return isOnClock;
  };

  // Function to get the formatted pick number (e.g., "1.01", "2.05", etc.)
  const getPickNumber = (): string => {
    // Format: round.pick (e.g., 1.01, 2.05, etc.)
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
  const getPositionPercentagesAtPick = (pickNumber: number): PositionPercentages => {
    const picksUpToThisPoint = picksMade.filter(pick => {
      const pickNum = parseFloat(pick.pickNumber);
      return !isNaN(pickNum) && pickNum <= pickNumber;
    });
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
  const addPick = (position: Position, pickNumber: number): void => {
    const newPick: DraftPick = { position, pickNumber: pickNumber.toString(), user: 'Current User' };
    setPicksMade(prev => [...prev, newPick]);
    
    // Check if this pick is for the current card
    if (pickNumber === currentCardPickNumber && !isCardPicked) {
      setIsCardPicked(true);
    }
  };

  // Function to start a live draft simulation
  const startDraftSimulation = (): void => {
    // Initialize available players
    const allPlayers: Player[] = [
      // Round 1 picks (1-12)
      { name: 'Saquon Barkley', position: 'RB', team: 'NYG' },
      { name: 'Ja\'Marr Chase', position: 'WR', team: 'CIN' },
      { name: 'George Kittle', position: 'TE', team: 'SF' },
      { name: 'Josh Allen', position: 'QB', team: 'BUF' },
      { name: 'Justin Jefferson', position: 'WR', team: 'MIN' },
      { name: 'Bijan Robinson', position: 'RB', team: 'ATL' },
      { name: 'CeeDee Lamb', position: 'WR', team: 'DAL' },
      { name: 'Travis Kelce', position: 'TE', team: 'KC' },
      { name: 'Patrick Mahomes', position: 'QB', team: 'KC' },
      { name: 'Derrick Henry', position: 'RB', team: 'BAL' },
      { name: 'Amon-Ra St. Brown', position: 'WR', team: 'DET' },
      { name: 'Sam LaPorta', position: 'TE', team: 'DET' },
      // Add more players for all 18 rounds...
      // For brevity, I'll add a few more rounds
      { name: 'Christian McCaffrey', position: 'RB', team: 'SF' },
      { name: 'Tyreek Hill', position: 'WR', team: 'MIA' },
      { name: 'Trey McBride', position: 'TE', team: 'ARI' },
      { name: 'Jalen Hurts', position: 'QB', team: 'PHI' },
      { name: 'Jahmyr Gibbs', position: 'RB', team: 'DET' },
      { name: 'Deebo Samuel', position: 'WR', team: 'SF' },
      { name: 'Jake Ferguson', position: 'TE', team: 'DAL' },
      { name: 'Lamar Jackson', position: 'QB', team: 'BAL' },
      { name: 'Omarion Hampton', position: 'RB', team: 'LAC' },
      { name: 'Brandon Aiyuk', position: 'WR', team: 'SF' },
      { name: 'Mark Andrews', position: 'TE', team: 'BAL' },
      // Continue with more players to fill 216 picks...
    ];
    
    // Add more players to reach 216 total picks
    const additionalPlayers: Player[] = [];
    for (let i = 0; i < 216 - allPlayers.length; i++) {
      additionalPlayers.push({
        name: `Player ${i + 1}`,
        position: (['RB', 'WR', 'TE', 'QB'] as Position[])[i % 4],
        team: 'FA'
      });
    }
    
    const totalPlayers = [...allPlayers, ...additionalPlayers];
    setAvailablePlayers(totalPlayers);
    setPicksMade([]);
    setOverallPick(1);
    setCurrentDraftingTeam(1);
    setDraftTimer(30);
    setIsDraftActive(true);
  };
  
  // Function to pause the draft simulation
  const pauseDraft = (): void => {
    setIsDraftPaused(true);
  };

  // Function to resume the draft simulation
  const resumeDraft = (): void => {
    setIsDraftPaused(false);
  };
  
  // Function to make a pick (called when timer expires or manually)
  const makePick = (): void => {
    if (!isDraftActive || availablePlayers.length === 0) return;

    // Get the current player being picked
    const pickedPlayer = availablePlayers[0];
    
    // Calculate the current round and pick number
    const currentRound = Math.floor((overallPick - 1) / 12) + 1;
    const currentPick = ((overallPick - 1) % 12) + 1;
    
    // Snake draft logic: odd rounds go 1-12, even rounds go 12-1
    let teamNumber: number;
    if (currentRound % 2 === 1) {
      // Odd rounds (1, 3, 5, ...): teams pick in order 1-12
      teamNumber = currentPick;
    } else {
      // Even rounds (2, 4, 6, ...): teams pick in reverse order 12-1
      teamNumber = 13 - currentPick;
    }
    
    // Create the pick object
    const pick: DraftPick = {
      position: pickedPlayer.position,
      pickNumber: `${currentRound}.${String(currentPick).padStart(2, '0')}`,
      player: pickedPlayer.name,
      user: `TEAM${teamNumber}`
    };

    // Add the pick to picksMade
    setPicksMade(prev => [...prev, pick]);
    
    // Remove the picked player from available players
    setAvailablePlayers(prev => prev.slice(1));
    
    // Move to next team using snake draft logic
    const nextPick = overallPick + 1;
    const nextRound = Math.floor((nextPick - 1) / 12) + 1;
    const nextPickInRound = ((nextPick - 1) % 12) + 1;
    
    let nextTeamNumber: number;
    if (nextRound % 2 === 1) {
      // Odd rounds (1, 3, 5, ...): teams pick in order 1-12
      nextTeamNumber = nextPickInRound;
    } else {
      // Even rounds (2, 4, 6, ...): teams pick in reverse order 12-1
      nextTeamNumber = 13 - nextPickInRound;
    }
    
    setCurrentDraftingTeam(nextTeamNumber);
    
    // Increment overall pick
    setOverallPick(prev => prev + 1);
    
    // Reset timer
    setDraftTimer(30);
    
    // Check if draft is complete (216 picks)
    if (overallPick >= 216) {
      setIsDraftActive(false);
    }
  };
  
  // Timer effect for draft simulation
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isDraftActive && draftTimer > 0 && !isDraftPaused) {
      interval = setInterval(() => {
        setDraftTimer(prev => {
          if (prev <= 1) {
            // Time's up, make a pick
            makePick();
            return 30; // Reset timer for next pick
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- makePick is stable, excluded to prevent timer reset on each pick
  }, [isDraftActive, draftTimer, availablePlayers.length, isDraftPaused]);
  
  // Function to simulate picks for testing (old function - keeping for reference)
  const simulatePicks = (): void => {
    
    // Generate 206 picks to simulate picks 1-206 being made
    const testPicks: DraftPick[] = [];
    const players: Player[] = [
      // Round 1 picks (1-12)
      { name: 'Saquon Barkley', position: 'RB', team: 'NYG' },
      { name: 'Ja\'Marr Chase', position: 'WR', team: 'CIN' },
      { name: 'George Kittle', position: 'TE', team: 'SF' },
      { name: 'Josh Allen', position: 'QB', team: 'BUF' },
      { name: 'Justin Jefferson', position: 'WR', team: 'MIN' },
      { name: 'Bijan Robinson', position: 'RB', team: 'ATL' },
      { name: 'CeeDee Lamb', position: 'WR', team: 'DAL' },
      { name: 'Travis Kelce', position: 'TE', team: 'KC' },
      { name: 'Patrick Mahomes', position: 'QB', team: 'KC' },
      { name: 'Derrick Henry', position: 'RB', team: 'BAL' },
      { name: 'Amon-Ra St. Brown', position: 'WR', team: 'DET' },
      { name: 'Sam LaPorta', position: 'TE', team: 'DET' },
      // Round 2 picks (13-24)
      { name: 'Christian McCaffrey', position: 'RB', team: 'SF' },
      { name: 'Tyreek Hill', position: 'WR', team: 'MIA' },
      { name: 'Trey McBride', position: 'TE', team: 'ARI' },
      { name: 'Jalen Hurts', position: 'QB', team: 'PHI' },
      { name: 'Jahmyr Gibbs', position: 'RB', team: 'DET' },
      { name: 'Deebo Samuel', position: 'WR', team: 'SF' },
      { name: 'Jake Ferguson', position: 'TE', team: 'DAL' },
      { name: 'Lamar Jackson', position: 'QB', team: 'BAL' },
      { name: 'Omarion Hampton', position: 'RB', team: 'LAC' },
      { name: 'Brandon Aiyuk', position: 'WR', team: 'SF' },
      { name: 'Mark Andrews', position: 'TE', team: 'BAL' },
      // Round 3 picks (25-36)
      { name: 'TreVeyon Henderson', position: 'RB', team: 'NE' },
      { name: 'Tee Higgins', position: 'WR', team: 'CIN' },
      { name: 'Jake Ferguson', position: 'TE', team: 'DAL' },
      { name: 'Jayden Daniels', position: 'QB', team: 'WAS' },
      { name: 'Justice Hill', position: 'RB', team: 'BAL' },
      { name: 'Rome Odunze', position: 'WR', team: 'CHI' },
      { name: 'Trey McBride', position: 'TE', team: 'ARI' },
      { name: 'Caleb Williams', position: 'QB', team: 'CHI' },
      { name: 'Brashard Smith', position: 'RB', team: 'KC' },
      { name: 'Xavier Worthy', position: 'WR', team: 'KC' },
      { name: 'Sam LaPorta', position: 'TE', team: 'DET' },
      // Round 4 picks (37-48)
      { name: 'Bucky Irving', position: 'RB', team: 'TB' },
      { name: 'Puka Nacua', position: 'WR', team: 'LAR' },
      { name: 'Travis Kelce', position: 'TE', team: 'KC' },
      { name: 'Drake Maye', position: 'QB', team: 'NE' },
      { name: 'Malik Nabers', position: 'WR', team: 'NYG' },
      { name: 'Jake Ferguson', position: 'TE', team: 'DAL' },
      { name: 'Bo Nix', position: 'QB', team: 'DEN' },
      { name: 'Marvin Harrison Jr.', position: 'WR', team: 'ARI' },
      { name: 'Trey McBride', position: 'TE', team: 'ARI' },
      { name: 'Michael Penix Jr.', position: 'QB', team: 'ATL' },
      { name: 'Rome Odunze', position: 'WR', team: 'CHI' },
      { name: 'Sam LaPorta', position: 'TE', team: 'DET' },
      // Round 5 picks (49-60)
      { name: 'J.K. Dobbins', position: 'RB', team: 'LAC' },
      { name: 'Chris Olave', position: 'WR', team: 'NO' },
      { name: 'Dalton Kincaid', position: 'TE', team: 'BUF' },
      { name: 'Anthony Richardson', position: 'QB', team: 'IND' },
      { name: 'Rachaad White', position: 'RB', team: 'TB' },
      { name: 'Garrett Wilson', position: 'WR', team: 'NYJ' },
      { name: 'Kyle Pitts', position: 'TE', team: 'ATL' },
      { name: 'Deshaun Watson', position: 'QB', team: 'CLE' },
      { name: 'James Cook', position: 'RB', team: 'BUF' },
      { name: 'Drake London', position: 'WR', team: 'ATL' },
      { name: 'Evan Engram', position: 'TE', team: 'JAX' },
      // Round 6 picks (61-72)
      { name: 'Alvin Kamara', position: 'RB', team: 'NO' },
      { name: 'Jerry Jeudy', position: 'WR', team: 'CLE' },
      { name: 'Cole Kmet', position: 'TE', team: 'CHI' },
      { name: 'Kirk Cousins', position: 'QB', team: 'ATL' },
      { name: 'D\'Andre Swift', position: 'RB', team: 'CHI' },
      { name: 'Courtland Sutton', position: 'WR', team: 'DEN' },
      { name: 'Pat Freiermuth', position: 'TE', team: 'PIT' },
      { name: 'Baker Mayfield', position: 'QB', team: 'TB' },
      { name: 'Brian Robinson Jr.', position: 'RB', team: 'WAS' },
      { name: 'Christian Kirk', position: 'WR', team: 'JAX' },
      { name: 'Gerald Everett', position: 'TE', team: 'CHI' },
      // Round 7 picks (73-84)
      { name: 'Zamir White', position: 'RB', team: 'LV' },
      { name: 'Tyler Lockett', position: 'WR', team: 'SEA' },
      { name: 'Tyler Higbee', position: 'TE', team: 'LAR' },
      { name: 'Geno Smith', position: 'QB', team: 'SEA' },
      { name: 'Tyler Allgeier', position: 'RB', team: 'ATL' },
      { name: 'Gabe Davis', position: 'WR', team: 'JAX' },
      { name: 'Hunter Henry', position: 'TE', team: 'NE' },
      { name: 'Derek Carr', position: 'QB', team: 'NO' },
      { name: 'Khalil Herbert', position: 'RB', team: 'CHI' },
      { name: 'Rashid Shaheed', position: 'WR', team: 'NO' },
      { name: 'Jonnu Smith', position: 'TE', team: 'MIA' },
      // Round 8 picks (85-96)
      { name: 'Chuba Hubbard', position: 'RB', team: 'CAR' },
      { name: 'Marquise Brown', position: 'WR', team: 'KC' },
      { name: 'Cade Otton', position: 'TE', team: 'TB' },
      { name: 'Russell Wilson', position: 'QB', team: 'PIT' },
      { name: 'Tank Bigsby', position: 'RB', team: 'JAX' },
      { name: 'Josh Downs', position: 'WR', team: 'IND' },
      { name: 'Isaiah Likely', position: 'TE', team: 'BAL' },
      { name: 'Gardner Minshew', position: 'QB', team: 'LV' },
      { name: 'Roschon Johnson', position: 'RB', team: 'CHI' },
      { name: 'Jahan Dotson', position: 'WR', team: 'WAS' },
      { name: 'Juwan Johnson', position: 'TE', team: 'NO' },
      // Round 9 picks (97-108)
      { name: 'Devin Singletary', position: 'RB', team: 'NYG' },
      { name: 'Wan\'Dale Robinson', position: 'WR', team: 'NYG' },
      { name: 'Noah Fant', position: 'TE', team: 'SEA' },
      { name: 'Sam Darnold', position: 'QB', team: 'MIN' },
      { name: 'Elijah Mitchell', position: 'RB', team: 'SF' },
      { name: 'Alec Pierce', position: 'WR', team: 'IND' },
      { name: 'Logan Thomas', position: 'TE', team: 'WAS' },
      { name: 'Kenny Pickett', position: 'QB', team: 'PHI' },
      { name: 'Jerome Ford', position: 'RB', team: 'CLE' },
      { name: 'Marvin Mims Jr.', position: 'WR', team: 'DEN' },
      { name: 'Taysom Hill', position: 'TE', team: 'NO' },
      // Round 10 picks (109-120)
      { name: 'Clyde Edwards-Helaire', position: 'RB', team: 'KC' },
      { name: 'K.J. Osborn', position: 'WR', team: 'MIN' },
      { name: 'Hayden Hurst', position: 'TE', team: 'CAR' },
      { name: 'Jarrett Stidham', position: 'QB', team: 'DEN' },
      { name: 'Keaton Mitchell', position: 'RB', team: 'BAL' },
      { name: 'Dontayvion Wicks', position: 'WR', team: 'GB' },
      { name: 'Zach Ertz', position: 'TE', team: 'ARI' },
      { name: 'Tyrod Taylor', position: 'QB', team: 'NYJ' },
      { name: 'Tyjae Spears', position: 'RB', team: 'TEN' },
      { name: 'Jayden Reed', position: 'WR', team: 'GB' },
      { name: 'Mike Gesicki', position: 'TE', team: 'CIN' },
      // Round 11 picks (121-132)
      { name: 'Dameon Pierce', position: 'RB', team: 'HOU' },
      { name: 'Romeo Doubs', position: 'WR', team: 'GB' },
      { name: 'Austin Hooper', position: 'TE', team: 'LV' },
      { name: 'Jake Browning', position: 'QB', team: 'CIN' },
      { name: 'Jaleel McLaughlin', position: 'RB', team: 'DEN' },
      { name: 'Cedric Tillman', position: 'WR', team: 'CLE' },
      { name: 'Donald Parham Jr.', position: 'TE', team: 'LAC' },
      { name: 'Blaine Gabbert', position: 'QB', team: 'KC' },
      { name: 'Israel Abanikanda', position: 'RB', team: 'NYJ' },
      { name: 'Xavier Gipson', position: 'WR', team: 'NYJ' },
      { name: 'Tucker Kraft', position: 'TE', team: 'GB' },
      // Round 12 picks (133-144)
      { name: 'Ezekiel Elliott', position: 'RB', team: 'DAL' },
      { name: 'Demario Douglas', position: 'WR', team: 'NE' },
      { name: 'Brenton Strange', position: 'TE', team: 'JAX' },
      { name: 'Mason Rudolph', position: 'QB', team: 'PIT' },
      { name: 'Jordan Mason', position: 'RB', team: 'SF' },
      { name: 'Tutu Atwell', position: 'WR', team: 'LAR' },
      { name: 'Luke Musgrave', position: 'TE', team: 'GB' },
      { name: 'Tim Boyle', position: 'QB', team: 'NYJ' },
      { name: 'Sean Tucker', position: 'RB', team: 'TB' },
      { name: 'Puka Nacua', position: 'WR', team: 'LAR' },
      { name: 'Brock Bowers', position: 'TE', team: 'LV' },
      // Round 13 picks (145-156)
      { name: 'Latavius Murray', position: 'RB', team: 'BUF' },
      { name: 'Jalen McMillan', position: 'WR', team: 'TB' },
      { name: 'Theo Johnson', position: 'TE', team: 'NYG' },
      { name: 'Nathan Rourke', position: 'QB', team: 'JAX' },
      { name: 'DeeJay Dallas', position: 'RB', team: 'SEA' },
      { name: 'Malachi Corley', position: 'WR', team: 'NYJ' },
      { name: 'Ben Sinnott', position: 'TE', team: 'WAS' },
      { name: 'Easton Stick', position: 'QB', team: 'LAC' },
      { name: 'Tyrion Davis-Price', position: 'RB', team: 'SF' },
      { name: 'Brenden Rice', position: 'WR', team: 'LAC' },
      { name: 'Cade Stover', position: 'TE', team: 'HOU' },
      // Round 14 picks (157-168)
      { name: 'Chris Rodriguez Jr.', position: 'RB', team: 'WAS' },
      { name: 'Jalen McMillan', position: 'WR', team: 'TB' },
      { name: 'Theo Johnson', position: 'TE', team: 'NYG' },
      { name: 'Nathan Rourke', position: 'QB', team: 'JAX' },
      { name: 'DeeJay Dallas', position: 'RB', team: 'SEA' },
      { name: 'Malachi Corley', position: 'WR', team: 'NYJ' },
      { name: 'Ben Sinnott', position: 'TE', team: 'WAS' },
      { name: 'Easton Stick', position: 'QB', team: 'LAC' },
      { name: 'Tyrion Davis-Price', position: 'RB', team: 'SF' },
      { name: 'Brenden Rice', position: 'WR', team: 'LAC' },
      { name: 'Cade Stover', position: 'TE', team: 'HOU' },
      // Round 15 picks (169-180)
      { name: 'Kendre Miller', position: 'RB', team: 'NO' },
      { name: 'Johnny Wilson', position: 'WR', team: 'PHI' },
      { name: 'Erick All', position: 'TE', team: 'CIN' },
      { name: 'Tanner McKee', position: 'QB', team: 'PHI' },
      { name: 'Tyrone Tracy Jr.', position: 'RB', team: 'NYG' },
      { name: 'Cornelius Johnson', position: 'WR', team: 'LAC' },
      { name: 'AJ Barner', position: 'TE', team: 'SEA' },
      { name: 'Sean Clifford', position: 'QB', team: 'GB' },
      { name: 'Dylan Laube', position: 'RB', team: 'LV' },
      { name: 'Ryan Flournoy', position: 'WR', team: 'DAL' },
      { name: 'Tanner McLachlan', position: 'TE', team: 'ARI' },
      // Round 16 picks (181-192)
      { name: 'Isaac Guerendo', position: 'RB', team: 'SF' },
      { name: 'Jermaine Burton', position: 'WR', team: 'CIN' },
      { name: 'Devin Culp', position: 'TE', team: 'TB' },
      { name: 'Spencer Rattler', position: 'QB', team: 'NO' },
      { name: 'Braelon Allen', position: 'RB', team: 'NYJ' },
      { name: 'Jordan Travis', position: 'WR', team: 'NYJ' },
      { name: 'Zach Heins', position: 'TE', team: 'LV' },
      { name: 'Joe Milton III', position: 'QB', team: 'NE' },
      { name: 'Cody Schrader', position: 'RB', team: 'SF' },
      { name: 'Anthony Gould', position: 'WR', team: 'IND' },
      { name: 'Tanner Bangle', position: 'TE', team: 'CLE' },
      // Round 17 picks (193-204)
      { name: 'Austin Ekeler', position: 'RB', team: 'WAS' },
      { name: 'Kendrick Bourne', position: 'WR', team: 'NE' },
      { name: 'Robert Tonyan', position: 'TE', team: 'MIN' },
      { name: 'Drew Lock', position: 'QB', team: 'NYG' },
      { name: 'Gus Edwards', position: 'RB', team: 'LAC' },
      { name: 'Allen Lazard', position: 'WR', team: 'NYJ' },
      { name: 'Adam Trautman', position: 'TE', team: 'DEN' },
      { name: 'Case Keenum', position: 'QB', team: 'HOU' },
      { name: 'D\'Onta Foreman', position: 'RB', team: 'CLE' },
      { name: 'Marquez Valdes-Scantling', position: 'WR', team: 'BUF' },
      { name: 'Harrison Bryant', position: 'TE', team: 'CLE' }
    ];
    
    // Generate 206 picks (picks 1-206)
    for (let i = 0; i < 206; i++) {
      const round = Math.floor(i / 12) + 1;
      const pick = (i % 12) + 1;
      const pickNumber = `${round}.${String(pick).padStart(2, '0')}`;
      
      // Snake draft logic: odd rounds go 1-12, even rounds go 12-1
      let teamNumber: number;
      if (round % 2 === 1) {
        // Odd rounds (1, 3, 5, ...): teams pick in order 1-12
        teamNumber = pick;
      } else {
        // Even rounds (2, 4, 6, ...): teams pick in reverse order 12-1
        teamNumber = 13 - pick;
      }
      
      const user = `TEAM${teamNumber}`;
      const player = players[i] || { name: `Player ${i + 1}`, position: 'RB' as Position, team: 'FA' };
      
      testPicks.push({
        position: player.position,
        pickNumber: pickNumber,
        player: player.name,
        user: user
      });
    }
    
    setPicksMade(testPicks);
    setOverallPick(207); // Set to pick 207 (on the clock)
  };

  // Hover functions
  const handleMouseEnter = (cardIndex: number): void => {
    setHoveredCard(cardIndex);
    
    // Clear existing timer
    if (hoverTimer) {
      clearTimeout(hoverTimer);
    }
    
    // Set new timer for 1 second (1000ms) of still cursor
    const timer = setTimeout(() => {
      setShowModal(true);
    }, 1000);
    
    setHoverTimer(timer);
  };

  const handleMouseLeave = (): void => {
    setHoveredCard(null);
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    setShowModal(false);
  };

  // Cleanup hover button timer on unmount
  useEffect(() => {
    return () => {
      if (hoverButtonTimer) {
        clearTimeout(hoverButtonTimer);
      }
    };
  }, [hoverButtonTimer]);

  // Scroll to show pick 216 as far left when draft ends
  useEffect(() => {
    const scrollContainer = document.querySelector('.flex.overflow-x-auto');
    if (!scrollContainer || overallPick < 216) return;

    // When draft ends (pick 216), scroll to show pick 216 as the far left card
    const cardWidth = 192 + 3; // w-48 (192px) + marginRight (3px)
    const targetScrollPosition = (216 - 1) * cardWidth; // Position for pick 216 (0-indexed)
    
    // Smooth scroll to the target position
    scrollContainer.scrollTo({
      left: targetScrollPosition,
      behavior: 'smooth'
    });
  }, [overallPick]);

  // Scroll to show current pick as far left when team becomes on clock
  useEffect(() => {
    const scrollContainer = document.querySelector('.flex.overflow-x-auto');
    if (!scrollContainer || overallPick < 1) return;

    // When a team becomes on the clock, scroll to show the current pick as the far left card
    // but show 10% of the previous card for context
    const cardWidth = 192 + 3; // w-48 (192px) + marginRight (3px)
    const previousCardWidth = cardWidth * 0.1; // 10% of previous card
    const targetScrollPosition = Math.max(0, (overallPick - 1) * cardWidth - previousCardWidth); // Position for current pick with 10% of previous card showing
    
    // Smooth scroll to the target position
    scrollContainer.scrollTo({
      left: targetScrollPosition,
      behavior: 'smooth'
    });
  }, [overallPick]);

  // Define the players array for rendering (same as in simulatePicks)
  const players: Player[] = [
    // Round 1 picks (1-12)
    { name: 'Saquon Barkley', position: 'RB', team: 'NYG' },
    { name: 'Ja\'Marr Chase', position: 'WR', team: 'CIN' },
    { name: 'George Kittle', position: 'TE', team: 'SF' },
    { name: 'Josh Allen', position: 'QB', team: 'BUF' },
    { name: 'Justin Jefferson', position: 'WR', team: 'MIN' },
    { name: 'Bijan Robinson', position: 'RB', team: 'ATL' },
    { name: 'CeeDee Lamb', position: 'WR', team: 'DAL' },
    { name: 'Travis Kelce', position: 'TE', team: 'KC' },
    { name: 'Patrick Mahomes', position: 'QB', team: 'KC' },
    { name: 'Derrick Henry', position: 'RB', team: 'BAL' },
    { name: 'Amon-Ra St. Brown', position: 'WR', team: 'DET' },
    { name: 'Sam LaPorta', position: 'TE', team: 'DET' },
    // Round 2 picks (13-24)
    { name: 'Christian McCaffrey', position: 'RB', team: 'SF' },
    { name: 'Tyreek Hill', position: 'WR', team: 'MIA' },
    { name: 'Trey McBride', position: 'TE', team: 'ARI' },
    { name: 'Jalen Hurts', position: 'QB', team: 'PHI' },
    { name: 'Jahmyr Gibbs', position: 'RB', team: 'DET' },
    { name: 'Deebo Samuel', position: 'WR', team: 'SF' },
    { name: 'Jake Ferguson', position: 'TE', team: 'DAL' },
    { name: 'Lamar Jackson', position: 'QB', team: 'BAL' },
    { name: 'Omarion Hampton', position: 'RB', team: 'LAC' },
    { name: 'Brandon Aiyuk', position: 'WR', team: 'SF' },
    { name: 'Mark Andrews', position: 'TE', team: 'BAL' },
    // Round 3 picks (25-36)
    { name: 'TreVeyon Henderson', position: 'RB', team: 'NE' },
    { name: 'Tee Higgins', position: 'WR', team: 'CIN' },
    { name: 'Jake Ferguson', position: 'TE', team: 'DAL' },
    { name: 'Jayden Daniels', position: 'QB', team: 'WAS' },
    { name: 'Justice Hill', position: 'RB', team: 'BAL' },
    { name: 'Rome Odunze', position: 'WR', team: 'CHI' },
    { name: 'Trey McBride', position: 'TE', team: 'ARI' },
    { name: 'Caleb Williams', position: 'QB', team: 'CHI' },
    { name: 'Brashard Smith', position: 'RB', team: 'KC' },
    { name: 'Xavier Worthy', position: 'WR', team: 'KC' },
    { name: 'Sam LaPorta', position: 'TE', team: 'DET' },
    // Round 4 picks (37-48)
    { name: 'Bucky Irving', position: 'RB', team: 'TB' },
    { name: 'Puka Nacua', position: 'WR', team: 'LAR' },
    { name: 'Travis Kelce', position: 'TE', team: 'KC' },
    { name: 'Drake Maye', position: 'QB', team: 'NE' },
    { name: 'Malik Nabers', position: 'WR', team: 'NYG' },
    { name: 'Jake Ferguson', position: 'TE', team: 'DAL' },
    { name: 'Bo Nix', position: 'QB', team: 'DEN' },
    { name: 'Marvin Harrison Jr.', position: 'WR', team: 'ARI' },
    { name: 'Trey McBride', position: 'TE', team: 'ARI' },
    { name: 'Michael Penix Jr.', position: 'QB', team: 'ATL' },
    { name: 'Rome Odunze', position: 'WR', team: 'CHI' },
    { name: 'Sam LaPorta', position: 'TE', team: 'DET' },
    // Round 5 picks (49-60)
    { name: 'J.K. Dobbins', position: 'RB', team: 'LAC' },
    { name: 'Chris Olave', position: 'WR', team: 'NO' },
    { name: 'Dalton Kincaid', position: 'TE', team: 'BUF' },
    { name: 'Anthony Richardson', position: 'QB', team: 'IND' },
    { name: 'Rachaad White', position: 'RB', team: 'TB' },
    { name: 'Garrett Wilson', position: 'WR', team: 'NYJ' },
    { name: 'Kyle Pitts', position: 'TE', team: 'ATL' },
    { name: 'Deshaun Watson', position: 'QB', team: 'CLE' },
    { name: 'James Cook', position: 'RB', team: 'BUF' },
    { name: 'Drake London', position: 'WR', team: 'ATL' },
    { name: 'Evan Engram', position: 'TE', team: 'JAX' },
    // Round 6 picks (61-72)
    { name: 'Alvin Kamara', position: 'RB', team: 'NO' },
    { name: 'Jerry Jeudy', position: 'WR', team: 'CLE' },
    { name: 'Cole Kmet', position: 'TE', team: 'CHI' },
    { name: 'Kirk Cousins', position: 'QB', team: 'ATL' },
    { name: 'D\'Andre Swift', position: 'RB', team: 'CHI' },
    { name: 'Courtland Sutton', position: 'WR', team: 'DEN' },
    { name: 'Pat Freiermuth', position: 'TE', team: 'PIT' },
    { name: 'Baker Mayfield', position: 'QB', team: 'TB' },
    { name: 'Brian Robinson Jr.', position: 'RB', team: 'WAS' },
    { name: 'Christian Kirk', position: 'WR', team: 'JAX' },
    { name: 'Gerald Everett', position: 'TE', team: 'CHI' },
    // Round 7 picks (73-84)
    { name: 'Zamir White', position: 'RB', team: 'LV' },
    { name: 'Tyler Lockett', position: 'WR', team: 'SEA' },
    { name: 'Tyler Higbee', position: 'TE', team: 'LAR' },
    { name: 'Geno Smith', position: 'QB', team: 'SEA' },
    { name: 'Tyler Allgeier', position: 'RB', team: 'ATL' },
    { name: 'Gabe Davis', position: 'WR', team: 'JAX' },
    { name: 'Hunter Henry', position: 'TE', team: 'NE' },
    { name: 'Derek Carr', position: 'QB', team: 'NO' },
    { name: 'Khalil Herbert', position: 'RB', team: 'CHI' },
    { name: 'Rashid Shaheed', position: 'WR', team: 'NO' },
    { name: 'Jonnu Smith', position: 'TE', team: 'MIA' },
    // Round 8 picks (85-96)
    { name: 'Chuba Hubbard', position: 'RB', team: 'CAR' },
    { name: 'Marquise Brown', position: 'WR', team: 'KC' },
    { name: 'Cade Otton', position: 'TE', team: 'TB' },
    { name: 'Russell Wilson', position: 'QB', team: 'PIT' },
    { name: 'Tank Bigsby', position: 'RB', team: 'JAX' },
    { name: 'Josh Downs', position: 'WR', team: 'IND' },
    { name: 'Isaiah Likely', position: 'TE', team: 'BAL' },
    { name: 'Gardner Minshew', position: 'QB', team: 'LV' },
    { name: 'Roschon Johnson', position: 'RB', team: 'CHI' },
    { name: 'Jahan Dotson', position: 'WR', team: 'WAS' },
    { name: 'Juwan Johnson', position: 'TE', team: 'NO' },
    // Round 9 picks (97-108)
    { name: 'Devin Singletary', position: 'RB', team: 'NYG' },
    { name: 'Wan\'Dale Robinson', position: 'WR', team: 'NYG' },
    { name: 'Noah Fant', position: 'TE', team: 'SEA' },
    { name: 'Sam Darnold', position: 'QB', team: 'MIN' },
    { name: 'Elijah Mitchell', position: 'RB', team: 'SF' },
    { name: 'Alec Pierce', position: 'WR', team: 'IND' },
    { name: 'Logan Thomas', position: 'TE', team: 'WAS' },
    { name: 'Kenny Pickett', position: 'QB', team: 'PHI' },
    { name: 'Jerome Ford', position: 'RB', team: 'CLE' },
    { name: 'Marvin Mims Jr.', position: 'WR', team: 'DEN' },
    { name: 'Taysom Hill', position: 'TE', team: 'NO' },
    // Round 10 picks (109-120)
    { name: 'Clyde Edwards-Helaire', position: 'RB', team: 'KC' },
    { name: 'K.J. Osborn', position: 'WR', team: 'MIN' },
    { name: 'Hayden Hurst', position: 'TE', team: 'CAR' },
    { name: 'Jarrett Stidham', position: 'QB', team: 'DEN' },
    { name: 'Keaton Mitchell', position: 'RB', team: 'BAL' },
    { name: 'Dontayvion Wicks', position: 'WR', team: 'GB' },
    { name: 'Zach Ertz', position: 'TE', team: 'ARI' },
    { name: 'Tyrod Taylor', position: 'QB', team: 'NYJ' },
    { name: 'Tyjae Spears', position: 'RB', team: 'TEN' },
    { name: 'Jayden Reed', position: 'WR', team: 'GB' },
    { name: 'Mike Gesicki', position: 'TE', team: 'CIN' },
    // Round 11 picks (121-132)
    { name: 'Dameon Pierce', position: 'RB', team: 'HOU' },
    { name: 'Romeo Doubs', position: 'WR', team: 'GB' },
    { name: 'Austin Hooper', position: 'TE', team: 'LV' },
    { name: 'Jake Browning', position: 'QB', team: 'CIN' },
    { name: 'Jaleel McLaughlin', position: 'RB', team: 'DEN' },
    { name: 'Cedric Tillman', position: 'WR', team: 'CLE' },
    { name: 'Donald Parham Jr.', position: 'TE', team: 'LAC' },
    { name: 'Blaine Gabbert', position: 'QB', team: 'KC' },
    { name: 'Israel Abanikanda', position: 'RB', team: 'NYJ' },
    { name: 'Xavier Gipson', position: 'WR', team: 'NYJ' },
    { name: 'Tucker Kraft', position: 'TE', team: 'GB' },
    // Round 12 picks (133-144)
    { name: 'Ezekiel Elliott', position: 'RB', team: 'DAL' },
    { name: 'Demario Douglas', position: 'WR', team: 'NE' },
    { name: 'Brenton Strange', position: 'TE', team: 'JAX' },
    { name: 'Mason Rudolph', position: 'QB', team: 'PIT' },
    { name: 'Jordan Mason', position: 'RB', team: 'SF' },
    { name: 'Tutu Atwell', position: 'WR', team: 'LAR' },
    { name: 'Luke Musgrave', position: 'TE', team: 'GB' },
    { name: 'Tim Boyle', position: 'QB', team: 'NYJ' },
    { name: 'Sean Tucker', position: 'RB', team: 'TB' },
    { name: 'Puka Nacua', position: 'WR', team: 'LAR' },
    { name: 'Brock Bowers', position: 'TE', team: 'LV' },
    // Round 13 picks (145-156)
    { name: 'Latavius Murray', position: 'RB', team: 'BUF' },
    { name: 'Jalen McMillan', position: 'WR', team: 'TB' },
    { name: 'Theo Johnson', position: 'TE', team: 'NYG' },
    { name: 'Nathan Rourke', position: 'QB', team: 'JAX' },
    { name: 'DeeJay Dallas', position: 'RB', team: 'SEA' },
    { name: 'Malachi Corley', position: 'WR', team: 'NYJ' },
    { name: 'Ben Sinnott', position: 'TE', team: 'WAS' },
    { name: 'Easton Stick', position: 'QB', team: 'LAC' },
    { name: 'Tyrion Davis-Price', position: 'RB', team: 'SF' },
    { name: 'Brenden Rice', position: 'WR', team: 'LAC' },
    { name: 'Cade Stover', position: 'TE', team: 'HOU' },
    // Round 14 picks (157-168)
    { name: 'Chris Rodriguez Jr.', position: 'RB', team: 'WAS' },
    { name: 'Jalen McMillan', position: 'WR', team: 'TB' },
    { name: 'Theo Johnson', position: 'TE', team: 'NYG' },
    { name: 'Nathan Rourke', position: 'QB', team: 'JAX' },
    { name: 'DeeJay Dallas', position: 'RB', team: 'SEA' },
    { name: 'Malachi Corley', position: 'WR', team: 'NYJ' },
    { name: 'Ben Sinnott', position: 'TE', team: 'WAS' },
    { name: 'Easton Stick', position: 'QB', team: 'LAC' },
    { name: 'Tyrion Davis-Price', position: 'RB', team: 'SF' },
    { name: 'Brenden Rice', position: 'WR', team: 'LAC' },
    { name: 'Cade Stover', position: 'TE', team: 'HOU' },
    // Round 15 picks (169-180)
    { name: 'Kendre Miller', position: 'RB', team: 'NO' },
    { name: 'Johnny Wilson', position: 'WR', team: 'PHI' },
    { name: 'Erick All', position: 'TE', team: 'CIN' },
    { name: 'Tanner McKee', position: 'QB', team: 'PHI' },
    { name: 'Tyrone Tracy Jr.', position: 'RB', team: 'NYG' },
    { name: 'Cornelius Johnson', position: 'WR', team: 'LAC' },
    { name: 'AJ Barner', position: 'TE', team: 'SEA' },
    { name: 'Sean Clifford', position: 'QB', team: 'GB' },
    { name: 'Dylan Laube', position: 'RB', team: 'LV' },
    { name: 'Ryan Flournoy', position: 'WR', team: 'DAL' },
    { name: 'Tanner McLachlan', position: 'TE', team: 'ARI' },
    // Round 16 picks (181-192)
    { name: 'Isaac Guerendo', position: 'RB', team: 'SF' },
    { name: 'Jermaine Burton', position: 'WR', team: 'CIN' },
    { name: 'Devin Culp', position: 'TE', team: 'TB' },
    { name: 'Spencer Rattler', position: 'QB', team: 'NO' },
    { name: 'Braelon Allen', position: 'RB', team: 'NYJ' },
    { name: 'Jordan Travis', position: 'WR', team: 'NYJ' },
    { name: 'Zach Heins', position: 'TE', team: 'LV' },
    { name: 'Joe Milton III', position: 'QB', team: 'NE' },
    { name: 'Cody Schrader', position: 'RB', team: 'SF' },
    { name: 'Anthony Gould', position: 'WR', team: 'IND' },
    { name: 'Tanner Bangle', position: 'TE', team: 'CLE' },
    // Round 17 picks (193-204)
    { name: 'Austin Ekeler', position: 'RB', team: 'WAS' },
    { name: 'Kendrick Bourne', position: 'WR', team: 'NE' },
    { name: 'Robert Tonyan', position: 'TE', team: 'MIN' },
    { name: 'Drew Lock', position: 'QB', team: 'NYG' },
    { name: 'Gus Edwards', position: 'RB', team: 'LAC' },
    { name: 'Allen Lazard', position: 'WR', team: 'NYJ' },
    { name: 'Adam Trautman', position: 'TE', team: 'DEN' },
    { name: 'Case Keenum', position: 'QB', team: 'HOU' },
    { name: 'D\'Onta Foreman', position: 'RB', team: 'CLE' },
    { name: 'Marquez Valdes-Scantling', position: 'WR', team: 'BUF' },
    { name: 'Harrison Bryant', position: 'TE', team: 'CLE' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Player Card Development</h1>
        <p className="text-gray-300 mb-8">
          Fresh start for horizontal scrolling player cards based on snglcrd.png design
        </p>
        
        {/* Debug info */}
        <div className="mb-4 p-4 bg-gray-800 rounded text-sm">
          <p>Debug: picksMade length: {picksMade.length}</p>
          <p>Debug: overallPick: {overallPick}</p>
          <p>Debug: picksMade: {JSON.stringify(picksMade.slice(0, 3))}</p>
          <p>Debug: Draft Active: {isDraftActive ? 'Yes' : 'No'}</p>
          <p>Debug: Draft Paused: {isDraftPaused ? 'Yes' : 'No'}</p>
          <p>Debug: Timer: {draftTimer}s</p>
          <p>Debug: Current Team: {currentDraftingTeam}</p>
          <p>Debug: Available Players: {availablePlayers.length}</p>
        </div>
        
        {/* Mock Controls */}
        <div className="mb-8 flex gap-4">
          <button 
            onClick={startDraftSimulation}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Start Live Draft Simulation
          </button>
          <button 
            onClick={makePick}
            disabled={!isDraftActive}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Make Pick Now
          </button>
          <button 
            onClick={isDraftPaused ? resumeDraft : pauseDraft}
            disabled={!isDraftActive}
            className={`px-4 py-2 text-white rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${
              isDraftPaused 
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                : 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
            }`}
          >
            {isDraftPaused ? 'Resume Draft' : 'Pause Draft'}
          </button>
        </div>

        {/* Clean slate - ready for new development */}
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <h2 className="text-xl font-bold mb-4">Development Area</h2>
          <p className="text-gray-400 mb-4">
            Ready to build the new player card component...
          </p>

          {/* snglcrd.png and draft card comparison */}
          <div className="mt-8 flex items-start space-x-8">
            {/* snglcrd.png for reference */}
            <div className="p-4 bg-gray-700 rounded-md">
              <h3 className="text-lg font-semibold mb-2">Reference Image: snglcrd.png</h3>
              <img
                src="/snglcrd.png"
                alt="Single Card Design Reference"
                className="max-w-xs h-auto border border-gray-600 rounded-md"
              />
              <p className="text-sm text-gray-400 mt-2">
                This is the design we are aiming to replicate for the player cards.
              </p>
            </div>

            {/* Second card with absolute pixels only */}
            <div className="p-4 bg-gray-700 rounded-md">
              <h3 className="text-lg font-semibold mb-2">Absolute Pixels Card</h3>
              <div className="flex-shrink-0 text-sm font-medium w-44 h-56 flex flex-col" style={{ position: 'relative', backgroundColor: '#18181a', borderRadius: '11px', overflow: 'visible', border: 'none' }}>
                {/* Custom top border with curves only */}
                <div 
                  className="absolute"
                  style={{ 
                    top: '-50px',
                    left: '0px',
                    right: '0px',
                    height: '80px',
                    borderRadius: '11px 11px 0 0',
                    border: '8px solid #FBBF25',
                    borderBottom: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    backgroundColor: '#FBBF25',
                    zIndex: 1
                  }}
                ></div>
                
                {/* Inner border for thickness */}
                <div 
                  className="absolute"
                  style={{ 
                    top: '-42px',
                    left: '8px',
                    right: '8px',
                    height: '64px',
                    borderRadius: '8px 8px 0 0',
                    border: '4px solid #FBBF25',
                    borderBottom: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    backgroundColor: 'transparent',
                    zIndex: 2
                  }}
                ></div>
                
                {/* Extra thick inside border part */}
                <div 
                  className="absolute"
                  style={{ 
                    top: '-38px',
                    left: '16px',
                    right: '16px',
                    height: '50px',
                    borderRadius: '6px 6px 0 0',
                    border: '8px solid #FBBF25',
                    borderBottom: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    backgroundColor: 'transparent',
                    zIndex: 3
                  }}
                ></div>
                
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
                  {getTeamForPick(0)}
                </div>

                {/* Pick number positioned at top left */}
                <div 
                  className="absolute text-sm cursor-pointer"
                  style={{ 
                    top: '4px',
                    left: '8px',
                    color: 'white',
                    zIndex: 9999
                  }}
                  onClick={() => {
                    // Calculate the overall pick number for this card
                    const cardOverallPick = 1;
                    
                    // Toggle between showing overall pick number and round.pick format
                    const currentDisplay = document.querySelector(`[data-pick-index="0"]`);
                    if (currentDisplay) {
                      const round = Math.floor(0 / 12) + 1;
                      const pick = (0 % 12) + 1;
                      const roundPickFormat = `${round}.${String(pick).padStart(2, '0')}`;
                      
                      if (currentDisplay.textContent === roundPickFormat) {
                        currentDisplay.textContent = cardOverallPick.toString();
                      } else {
                        currentDisplay.textContent = roundPickFormat;
                      }
                    }
                  }}
                >
                  <span data-pick-index="0">
                    {`${Math.floor(0 / 12) + 1}.${String((0 % 12) + 1).padStart(2, '0')}`}
                  </span>
                </div>

                {/* User logo placeholder in top right corner */}
                <div 
                  className="absolute"
                  style={{ 
                    top: '15px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '69.46px',
                    height: '69.46px',
                    borderRadius: '50%',
                    border: '2px dotted #808080',
                    zIndex: 9999
                  }}
                ></div>

                <div className="text-sm w-full text-center leading-tight flex-1 flex items-center justify-center">
                  <div className="w-full">
                    <div className="font-bold text-xs h-4 flex items-center justify-center mb-2">
                      <div 
                        style={{
                          position: 'absolute',
                          top: 'calc(50% + 28px)',
                          left: 'calc(50% + 3px)',
                          transform: 'translate(-50%, -50%)',
                          zIndex: 9999
                        }}
                      >
                        <SevenSegmentCountdown initialSeconds={30} useMonocraft={true} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-center flex justify-center" style={{ position: 'absolute', bottom: '11px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, width: '90%' }}>
                  <div style={{ height: 16, width: '100%', borderRadius: 6, display: 'flex', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <div style={{ height: 16, width: '100%', background: '#808080' }}></div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Card using absolute pixels only - no margins, no calc.
              </p>
            </div>
          </div>
        </div>

        {/* Horizontal Scrolling Bar - From Draft Room - Full Width */}
        <div className="bg-white/5" style={{ 
          position: 'relative',
          left: '50%',
          right: '50%',
          width: '100vw',
          marginLeft: '-50vw',
          marginRight: '-50vw',
          paddingTop: '60px',
          paddingBottom: '8px'
        }}>
          <div className="relative" style={{ position: 'relative' }}>
            <div 
              className="flex overflow-x-auto"
              style={{ 
                height: '225px',
                paddingBottom: '18px',
                marginBottom: '-56px',
                position: 'relative',
                gap: '4.5px',
                paddingRight: '0',
                borderRadius: '11px'
              }}
            >
            {/* Display cards for visual appearance */}
            {Array.from({ length: 1 }, (_, setIndex) => 
              Array.from({ length: 216 }, (_, i) => {
                // Calculate the actual pick index for this card
                const actualPickIndex = i;
                const isPicked = actualPickIndex < 204;
                const isCurrentPick = actualPickIndex === (overallPick - 1);
                
                // Check if this specific pick has been made in the picksMade array
                const pickNumber = (Math.floor(actualPickIndex / 12) + 1) + '.' + String((actualPickIndex % 12) + 1).padStart(2, '0');
                const hasBeenPicked = picksMade.some(pick => pick.pickNumber === pickNumber);
                
                const player = isPicked && actualPickIndex < players.length ? players[actualPickIndex] : null;
                
                return (
                  <div
                    key={`${setIndex}-${actualPickIndex}`}
                    className="flex-shrink-0 text-sm font-medium w-40 h-52 flex flex-col border-6"
                    style={{ 
                      borderWidth: '6px', 
                      position: 'relative', 
                      borderColor: isCurrentPick ? '#FBBF25' : (hasBeenPicked ? (player && player.position === 'RB') ? '#0fba80' : (player && player.position === 'WR') ? '#3B82F6' : (player && player.position === 'TE') ? '#7C3AED' : (player && player.position === 'QB') ? '#F472B6' : '#808080' : '#808080'), 
                      borderTopWidth: '42px', 
                      backgroundColor: '#18181a', 
                      borderRadius: '11px', 
                      overflow: 'visible',
                      marginRight: '3px'
                    }}
                    onMouseEnter={() => handleMouseEnter(actualPickIndex)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* Modal for hover */}
                    {showModal && hoveredCard === actualPickIndex && !isPicked && !isCurrentPick && actualPickIndex < 204 && (
                      <div 
                        className="absolute text-gray-400"
                        style={{
                          bottom: '56px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          zIndex: 9999,
                          marginLeft: '20px',
                          fontSize: '19px'
                        }}
                      >
                        {(() => {
                          // Calculate picks away based on current pick and team position
                          const currentPickNumber = overallPick;
                          const teamPickNumber = actualPickIndex + 1;
                          
                          // If this is the current pick, show "on clock"
                          if (actualPickIndex === (currentPickNumber - 1)) {
                            return 'on clock';
                          }
                          
                          // Calculate picks away for future picks
                          const picksAway = Math.max(0, teamPickNumber - currentPickNumber);
                          return `${picksAway} picks away`;
                        })()}
                      </div>
                    )}
                    {/* Drafting team username positioned in yellow border area */}
                    <div 
                      className="absolute left-0 right-0 font-bold text-center"
                      style={{ 
                        fontSize: '15px', 
                        color: isCurrentPick ? (isTeamOnClock() ? 'black' : 'white') : (isPicked ? 'white' : 'black'),
                        backgroundColor: 'transparent',
                        zIndex: 9999,
                        padding: '2px',
                        top: '-20px',
                        transform: 'translateY(-50%)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {getTeamForPick(actualPickIndex)}
                    </div>

                    {/* Pick number positioned at top left */}
                    <div 
                      className="absolute text-sm cursor-pointer"
                      style={{ 
                        top: '4px',
                        left: '8px',
                        color: 'white',
                        zIndex: 9999
                      }}
                      onClick={() => {
                        // Calculate the overall pick number for this card
                        const cardOverallPick = actualPickIndex + 1;
                        const round = Math.floor(actualPickIndex / 12) + 1;
                        const pick = (actualPickIndex % 12) + 1;
                        const roundPickFormat = `${round}.${String(pick).padStart(2, '0')}`;
                        
                        // Check if this is pick 2.03 (round 2, pick 3 = index 14)
                        // 2.03 = (2-1)*12 + (3-1) = 1*12 + 2 = 14 (0-based index)
                        if (actualPickIndex === 14) {
                          // Toggle the format for all cards
                          setPickNumberFormat(prevFormat => prevFormat === 'round.pick' ? 'overall' : 'round.pick');
                        }
                        // Remove individual card toggle - only use global state
                      }}
                    >
                      <span data-pick-index={actualPickIndex}>
                        {pickNumberFormat === 'overall' 
                          ? (actualPickIndex + 1).toString()
                          : `${Math.floor(actualPickIndex / 12) + 1}.${String((actualPickIndex % 12) + 1).padStart(2, '0')}`
                        }
                      </span>
                    </div>

                    {/* User logo placeholder in top right corner */}
                    <div 
                      className="absolute"
                      style={{ 
                        top: '15px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '69.46px',
                        height: '69.46px',
                        borderRadius: '50%',
                        border: '2px dotted #808080',
                        zIndex: 9999
                      }}
                    ></div>

                    <div className="text-sm w-full text-center leading-tight flex-1 flex items-center justify-center">
                      <div className="w-full">
                        <div className="font-bold text-xs h-4 flex items-center justify-center mb-2">
                          {isCurrentPick && (
                            <div 
                              style={{
                                position: 'absolute',
                                top: 'calc(50% + 28px)',
                                left: 'calc(50% + 3px)',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 9999
                              }}
                            >
                              <SevenSegmentCountdown initialSeconds={30} useMonocraft={true} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Player name positioned absolutely */}
                    <div 
                      className="absolute text-center"
                      style={{ 
                        bottom: isPicked ? '38px' : '70px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 9999,
                        maxWidth: '85%',
                        width: '85%'
                      }}
                    >
                      <div 
                        className={`text-sm ${hasBeenPicked || !isCurrentPick ? 'font-bold' : ''} truncate whitespace-nowrap overflow-hidden`} 
                        style={{ 
                          marginTop: hasBeenPicked ? '-8px' : '-8px', 
                          lineHeight: '1.1',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          width: '100%'
                        }}
                        title={hasBeenPicked && player ? player.name : ''}
                      >
                        {hasBeenPicked && player ? player.name : ''}
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
                        title={hasBeenPicked && player ? `${player.position} - ${player.team}` : ''}
                      >
                        {hasBeenPicked && player ? `${player.position} - ${player.team}` : ''}
                      </div>
                    </div>

                    <div className="text-xs text-center flex justify-center" style={{ position: 'absolute', bottom: '11px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, width: '90%' }}>
                      <div style={{ height: 16, width: '100%', borderRadius: 6, display: 'flex', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                        {(() => {
                          // Calculate position percentages for this specific card
                          const getPositionPercentagesForCard = (cardIndex: number): PositionPercentages => {
                            // Determine the user for this card using snake draft logic
                            const round = Math.floor(cardIndex / 12) + 1;
                            const pick = (cardIndex % 12) + 1;
                            
                            // Snake draft logic: odd rounds go 1-12, even rounds go 12-1
                            let teamNumber: number;
                            if (round % 2 === 1) {
                              // Odd rounds (1, 3, 5, ...): teams pick in order 1-12
                              teamNumber = pick;
                            } else {
                              // Even rounds (2, 4, 6, ...): teams pick in reverse order 12-1
                              teamNumber = 13 - pick;
                            }
                            
                            const cardUser = cardIndex === (overallPick - 1) ? getDraftingTeam() : `TEAM${teamNumber}`;
                            
                            // Get the pick number for this card
                            const cardPickNumber = `${round}.${String(pick).padStart(2, '0')}`;
                            
                            // Filter picks made by this specific card's user up to this card's pick
                            const userPicksUpToThisCard = picksMade.filter(pick => 
                              pick.user === cardUser && pick.pickNumber <= cardPickNumber
                            );
                            
                            // Calculate percentages based on picks made by this user up to this point
                            const qbPicks = userPicksUpToThisCard.filter(pick => pick.position === 'QB').length;
                            const rbPicks = userPicksUpToThisCard.filter(pick => pick.position === 'RB').length;
                            const wrPicks = userPicksUpToThisCard.filter(pick => pick.position === 'WR').length;
                            const tePicks = userPicksUpToThisCard.filter(pick => pick.position === 'TE').length;
                            
                            const totalPicks = userPicksUpToThisCard.length;
                            if (totalPicks === 0) return { qb: 25, rb: 25, wr: 25, te: 25 };
                            
                            return {
                              qb: (qbPicks / totalPicks) * 100,
                              rb: (rbPicks / totalPicks) * 100,
                              wr: (wrPicks / totalPicks) * 100,
                              te: (tePicks / totalPicks) * 100
                            };
                          };
                          
                          const percentages = getPositionPercentagesForCard(actualPickIndex);
                          
                          // Only show colored tracker if this user has made picks
                          // Use snake draft logic for team assignment
                          const round = Math.floor(actualPickIndex / 12) + 1;
                          const pick = (actualPickIndex % 12) + 1;
                          
                          let teamNumber: number;
                          if (round % 2 === 1) {
                            // Odd rounds (1, 3, 5, ...): teams pick in order 1-12
                            teamNumber = pick;
                          } else {
                            // Even rounds (2, 4, 6, ...): teams pick in reverse order 12-1
                            teamNumber = 13 - pick;
                          }
                          
                          const cardUser = isCurrentPick ? getDraftingTeam() : `TEAM${teamNumber}`;
                          const userPicks = picksMade.filter(pick => pick.user === cardUser);
                          
                          return userPicks.length > 0 ? (
                            <>
                              {percentages.qb > 0 && (
                                <div style={{ height: 16, width: `${percentages.qb}%`, background: '#F472B6' }}></div>
                              )}
                              {percentages.rb > 0 && (
                                <div style={{ height: 16, width: `${percentages.rb}%`, background: '#0fba80' }}></div>
                              )}
                              {percentages.wr > 0 && (
                                <div style={{ height: 16, width: `${percentages.wr}%`, background: 'url(/wr_blue.png)' }}></div>
                              )}
                              {percentages.te > 0 && (
                                <div style={{ height: 16, width: `${percentages.te}%`, background: '#7C3AED' }}></div>
                              )}
                            </>
                          ) : (
                            <div style={{ height: 16, width: '100%', background: 'rgba(255,255,255,0.1)' }}></div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayerCardTest;
