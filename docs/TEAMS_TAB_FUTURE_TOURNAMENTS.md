# Future Tournament Support - Flexible Schedule System

## Overview

The current team update logic is optimized for regular season tournaments (Weeks 1-17). Future tournaments with different schedules (e.g., playoff best ball tournaments) will require flexible update logic.

## Current Tournament Schedule

**Regular Season Tournament:**
- Duration: August - Week 17 (typically ends early January)
- Team updates: Game days only (until Week 17 ends)
- Player news: 3x daily (Aug-Week 17), 1x daily (after Week 17)

## Future Tournament Types

### 1. Playoff Best Ball Tournament
**Potential Schedule:**
- Duration: Wild Card Weekend - Super Bowl (typically January - February)
- Weeks: Playoff weeks only (4 weeks)
- Team updates: Game days only (during playoff weeks)
- Player news: 3x daily (during tournament), 1x daily (after)

**Update Logic Needed:**
- Real-time listeners active during playoff weeks
- Game days: Thursday, Saturday, Sunday (playoff schedule)
- Post-game days: Friday, Monday (score finalization)
- Tournament ends: After Super Bowl

### 2. Weekly Tournaments
**Potential Schedule:**
- Duration: Single week or multiple weeks
- Team updates: Game days only (during tournament weeks)
- Player news: 3x daily (during tournament), 1x daily (after)

**Update Logic Needed:**
- Real-time listeners active during tournament weeks only
- Flexible week range (not fixed to Weeks 1-17)

### 3. Off-Season Tournaments
**Potential Schedule:**
- Duration: March - July (off-season)
- Team updates: N/A (no games, but might have different scoring)
- Player news: 1x daily (standard off-season rate)

**Update Logic Needed:**
- Different update patterns (if applicable)
- Mostly static data

---

## Flexible Architecture Design

### Tournament Configuration

```typescript
interface TournamentConfig {
  id: string;
  name: string;
  type: 'regular_season' | 'playoff' | 'weekly' | 'off_season';
  
  // Schedule
  startDate: Date;
  endDate: Date;
  activeWeeks: number[]; // [1, 2, 3, ...] or [18, 19, 20, 21] for playoffs
  
  // Update Rules
  teamUpdateRules: {
    realTimeOnGameDays: boolean;
    realTimeOnPostGameDays: boolean;
    gameDays: number[]; // [0, 1, 4] for Sun, Mon, Thu
    postGameDays: number[]; // [1, 2, 5] for Mon, Tue, Fri
  };
  
  playerNewsRules: {
    updatesPerDay: number; // 3 during season, 1 off-season
    updateTimes: string[]; // ['09:00', '14:00', '19:00'] for 3x daily
  };
}
```

### Flexible Update Logic

```typescript
/**
 * Check if real-time team updates are needed based on tournament config
 */
function shouldUseRealTimeForTournament(
  tournament: TournamentConfig,
  currentDate: Date
): boolean {
  // Check if tournament is active
  if (currentDate < tournament.startDate || currentDate > tournament.endDate) {
    return false; // Tournament not active
  }
  
  // Check if today is a game day or post-game day
  const dayOfWeek = currentDate.getDay();
  const isGameDay = tournament.teamUpdateRules.gameDays.includes(dayOfWeek);
  const isPostGameDay = tournament.teamUpdateRules.postGameDays.includes(dayOfWeek);
  
  if (!tournament.teamUpdateRules.realTimeOnGameDays && isGameDay) {
    return false;
  }
  
  if (!tournament.teamUpdateRules.realTimeOnPostGameDays && isPostGameDay) {
    return false;
  }
  
  return isGameDay || isPostGameDay;
}

/**
 * Get player news update frequency for tournament
 */
function getPlayerNewsFrequency(
  tournament: TournamentConfig,
  currentDate: Date
): number {
  if (currentDate < tournament.startDate || currentDate > tournament.endDate) {
    return 1; // Off-season: 1x daily
  }
  
  return tournament.playerNewsRules.updatesPerDay;
}
```

### Hook with Tournament Awareness

```typescript
export function useMyTeamsFlexible(): UseMyTeamsResult {
  const [teams, setTeams] = useState<MyTeam[]>([]);
  const { user } = useAuth();
  const userId = user?.uid;
  
  // Get user's active tournaments
  const { tournaments } = useUserTournaments(userId);
  
  // Determine if any tournament needs real-time updates
  const shouldUseRealTime = useMemo(() => {
    const now = new Date();
    
    // Check each tournament
    for (const tournament of tournaments) {
      if (shouldUseRealTimeForTournament(tournament, now)) {
        return true; // At least one tournament needs real-time
      }
    }
    
    return false; // No tournaments need real-time right now
  }, [tournaments]);
  
  // Set up listener or one-time fetch
  useEffect(() => {
    if (!userId) return;
    
    if (shouldUseRealTime) {
      // Real-time listener
      const unsubscribe = setupRealTimeListener(userId);
      return () => unsubscribe();
    } else {
      // One-time fetch
      fetchTeamsOnce(userId).then(setTeams);
    }
  }, [userId, shouldUseRealTime]);
  
  // ... rest of implementation
}
```

---

## Tournament Type Examples

### Regular Season Tournament (Current)

```typescript
const regularSeasonConfig: TournamentConfig = {
  id: 'regular-season-2025',
  name: 'The TopDog International',
  type: 'regular_season',
  startDate: new Date('2025-08-01'),
  endDate: new Date('2026-01-10'), // Week 17 ends ~Jan 7-10
  activeWeeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
  teamUpdateRules: {
    realTimeOnGameDays: true,
    realTimeOnPostGameDays: true,
    gameDays: [0, 1, 4], // Sun, Mon, Thu
    postGameDays: [1, 2, 5], // Mon, Tue, Fri
  },
  playerNewsRules: {
    updatesPerDay: 3,
    updateTimes: ['09:00', '14:00', '19:00'],
  },
};
```

### Playoff Tournament (Future)

```typescript
const playoffConfig: TournamentConfig = {
  id: 'playoff-2026',
  name: 'TopDog Playoff Challenge',
  type: 'playoff',
  startDate: new Date('2026-01-11'), // After Week 17
  endDate: new Date('2026-02-09'), // After Super Bowl
  activeWeeks: [18, 19, 20, 21], // Wild Card, Divisional, Conference, Super Bowl
  teamUpdateRules: {
    realTimeOnGameDays: true,
    realTimeOnPostGameDays: true,
    gameDays: [0, 4, 6], // Sun, Thu, Sat (playoff schedule)
    postGameDays: [1, 5], // Mon, Fri
  },
  playerNewsRules: {
    updatesPerDay: 3,
    updateTimes: ['09:00', '14:00', '19:00'],
  },
};
```

### Weekly Tournament (Future)

```typescript
const weeklyConfig: TournamentConfig = {
  id: 'weekly-week-10',
  name: 'Week 10 Showdown',
  type: 'weekly',
  startDate: new Date('2025-11-06'), // Week 10 Thursday
  endDate: new Date('2025-11-11'), // Week 10 Monday
  activeWeeks: [10],
  teamUpdateRules: {
    realTimeOnGameDays: true,
    realTimeOnPostGameDays: true,
    gameDays: [0, 1, 4], // Sun, Mon, Thu
    postGameDays: [1, 2, 5], // Mon, Tue, Fri
  },
  playerNewsRules: {
    updatesPerDay: 3,
    updateTimes: ['09:00', '14:00', '19:00'],
  },
};
```

---

## Migration Strategy

### Phase 1: Current Implementation (Hardcoded)
```typescript
// Current: Hardcoded for regular season
const shouldUseRealTime = isGameDayOrPostGame() && isTournamentActive();
```

### Phase 2: Tournament-Aware (Flexible)
```typescript
// Future: Tournament-aware
const shouldUseRealTime = tournaments.some(t => 
  shouldUseRealTimeForTournament(t, new Date())
);
```

### Phase 3: Multi-Tournament Support
```typescript
// Support multiple concurrent tournaments
const activeTournaments = tournaments.filter(t => 
  isTournamentActive(t, new Date())
);

const needsRealTime = activeTournaments.some(t =>
  shouldUseRealTimeForTournament(t, new Date())
);
```

---

## Implementation Recommendations

### 1. Abstract Tournament Logic

Create a tournament service that handles:
- Tournament configuration
- Update rule evaluation
- Schedule checking

```typescript
class TournamentService {
  getUpdateRules(tournamentId: string): TournamentConfig;
  shouldUseRealTime(tournamentId: string, date: Date): boolean;
  getPlayerNewsFrequency(tournamentId: string, date: Date): number;
  getActiveTournaments(userId: string, date: Date): TournamentConfig[];
}
```

### 2. Make Hooks Tournament-Aware

```typescript
// Instead of hardcoded logic
const useMyTeams = () => {
  // Get user's tournaments
  const tournaments = useUserTournaments();
  
  // Determine update strategy based on tournaments
  const updateStrategy = useTournamentUpdateStrategy(tournaments);
  
  // Use appropriate fetch/listener based on strategy
  return useTeamsWithStrategy(updateStrategy);
};
```

### 3. Store Tournament Configs in Firestore

```typescript
// Firestore structure
/tournaments/{tournamentId}
  - config: TournamentConfig
  - schedule: { startDate, endDate, activeWeeks }
  - updateRules: { teamUpdateRules, playerNewsRules }
```

---

## Cost Implications

### Multiple Concurrent Tournaments

**Scenario: Regular Season + Playoff Tournament**
- Regular season: Real-time on game days (Weeks 1-17)
- Playoff tournament: Real-time on game days (Weeks 18-21)
- **Cost**: Similar to single tournament (listeners only on game days)

**Key Insight**: Multiple tournaments don't multiply costs - listeners are still only active on game days, just across more weeks.

---

## Testing Strategy

### Test Cases

1. **Regular Season Tournament**
   - Game days: Real-time active
   - Non-game days: One-time fetch
   - After Week 17: One-time fetch

2. **Playoff Tournament**
   - Playoff game days: Real-time active
   - Non-game days: One-time fetch
   - After Super Bowl: One-time fetch

3. **Overlapping Tournaments**
   - Regular season + Playoff: Real-time on any game day
   - Multiple weekly tournaments: Real-time on any game day

4. **Player News Frequency**
   - During season (Aug-Week 17): 3x daily
   - After Week 17: 1x daily
   - Off-season: 1x daily

---

## Future Considerations

1. **Tournament-Specific Rules**
   - Some tournaments might have different update requirements
   - Some might need real-time even on non-game days
   - Configuration system allows flexibility

2. **User Preferences**
   - Users might want to disable real-time for certain tournaments
   - Allow per-tournament preferences

3. **Performance Optimization**
   - Cache tournament configs
   - Batch tournament checks
   - Minimize re-evaluations

---

## Summary

**Current State:**
- Hardcoded for regular season (Weeks 1-17)
- Game-day optimized real-time
- Player news: 3x daily during season, 1x daily off-season

**Future State:**
- Flexible tournament configuration system
- Tournament-aware update logic
- Support for multiple tournament types
- Easy to add new tournament types

**Key Principle:**
- Keep update logic flexible and tournament-agnostic
- Use configuration to drive behavior
- Don't hardcode schedules or rules

