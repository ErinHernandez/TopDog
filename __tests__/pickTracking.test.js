// Test for pick tracking logic
describe('Pick Tracking Logic', () => {
  // Mock picks data with gaps
  const mockPicksWithGaps = [
    { pickNumber: 1, player: 'Player1', user: 'User1' },
    { pickNumber: 2, player: 'Player2', user: 'User2' },
    { pickNumber: 4, player: 'Player4', user: 'User4' }, // Gap: missing pick 3
    { pickNumber: 6, player: 'Player6', user: 'User6' }, // Gap: missing pick 5
  ];

  const mockPicksWithoutGaps = [
    { pickNumber: 1, player: 'Player1', user: 'User1' },
    { pickNumber: 2, player: 'Player2', user: 'User2' },
    { pickNumber: 3, player: 'Player3', user: 'User3' },
    { pickNumber: 4, player: 'Player4', user: 'User4' },
  ];

  // Test the calculateCurrentPickNumber function logic
  const calculateCurrentPickNumber = (picks) => {
    if (picks.length === 0) return 1;
    
    // Sort picks by pickNumber to ensure proper order
    const sortedPicks = [...picks].sort((a, b) => a.pickNumber - b.pickNumber);
    
    // Check for gaps in pick numbers
    for (let i = 0; i < sortedPicks.length; i++) {
      const expectedPickNumber = i + 1;
      const actualPickNumber = sortedPicks[i].pickNumber;
      
      if (actualPickNumber !== expectedPickNumber) {
        return expectedPickNumber;
      }
    }
    
    // If no gaps found, return the next pick number
    return picks.length + 1;
  };

  it('should detect gaps in pick numbers', () => {
    const currentPick = calculateCurrentPickNumber(mockPicksWithGaps);
    expect(currentPick).toBe(3); // Should return 3 because that's the first gap
  });

  it('should return next pick number when no gaps exist', () => {
    const currentPick = calculateCurrentPickNumber(mockPicksWithoutGaps);
    expect(currentPick).toBe(5); // Should return 5 because that's the next pick after 4
  });

  it('should return 1 when no picks exist', () => {
    const currentPick = calculateCurrentPickNumber([]);
    expect(currentPick).toBe(1);
  });

  it('should handle single pick correctly', () => {
    const singlePick = [{ pickNumber: 1, player: 'Player1', user: 'User1' }];
    const currentPick = calculateCurrentPickNumber(singlePick);
    expect(currentPick).toBe(2);
  });

  it('should handle multiple gaps correctly', () => {
    const picksWithMultipleGaps = [
      { pickNumber: 1, player: 'Player1', user: 'User1' },
      { pickNumber: 3, player: 'Player3', user: 'User3' }, // Gap: missing pick 2
      { pickNumber: 5, player: 'Player5', user: 'User5' }, // Gap: missing pick 4
    ];
    const currentPick = calculateCurrentPickNumber(picksWithMultipleGaps);
    expect(currentPick).toBe(2); // Should return the first gap
  });
}); 