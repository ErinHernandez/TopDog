# Teams Tab Firebase Integration - Complete Analysis & Implementation Guide

**Last Updated:** 2025-01-XX  
**Status:** Analysis Complete, Ready for Implementation  
**Scale:** 100,000 Daily Active Users

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State](#current-state)
3. [Architecture Decisions](#architecture-decisions)
4. [Cost Analysis](#cost-analysis)
5. [Implementation Guide](#implementation-guide)
6. [Future Considerations](#future-considerations)
7. [Next Steps](#next-steps)

---

## Executive Summary

### Key Decision: Game-Day Optimized Hybrid Approach ⭐

**Recommended Implementation:**
- **Initial load**: Always use one-time fetch (cheaper than establishing listeners)
- **Game days + post-game days**: Real-time listener (only when team data changes)
- **Non-game days + off-season**: One-time fetch only (listeners disabled)
- **Player news**: Separate system with batch updates (3x daily during season, 1x daily off-season)

**Cost (100,000 users):**
- **Team data**: $1,500-6,000/year
- **Player news**: $800-2,500/year
- **Total**: **$2,300-8,500/year**
- **Savings**: 75-85% vs year-round real-time ($18,000-60,000/year)

**Critical Insights:**
1. Team data only changes on game days (Thu, Sun, Mon) until Week 17 ends
2. Player news is separate from team data - doesn't require team data listeners
3. Tournaments end after Week 17 - no team data updates needed after that
4. Real-time listeners are wasteful 75-85% of the year

---

## Current State

### What's Been Completed

✅ **UI/UX Improvements:**
- Enhanced team card design with tournament badges, metadata, visual indicators
- Sorting options (name, date, tournament) with localStorage persistence
- Enhanced search and filtering (tournament filter, status filter, player search)
- Team management features (deletion, duplication, improved name editing)
- Search debouncing and performance optimizations
- Accessibility improvements (ARIA labels, keyboard navigation)
- Cross-version consistency (legacy, VX, VX2)

✅ **Analysis & Planning:**
- Complete cost analysis for 100,000 users
- Architecture decisions documented
- Player news vs team data distinction clarified
- Future tournament flexibility designed

### What's Pending

⏳ **Firebase Integration:**
- Replace mock data with Firebase queries
- Implement game-day optimized real-time listeners
- Add data transformation layer
- Set up error handling and offline support

⏳ **Performance:**
- Virtual scrolling for long team lists (50+ teams)

### Current Implementation

**Hook Location:** `components/vx2/hooks/data/useMyTeams.ts`

**Current Code:**
```typescript
async function fetchMyTeams(): Promise<MyTeam[]> {
  // Currently returns mock data
  return MOCK_TEAMS;
}
```

**Firestore Schema:**
```
/users/{userId}/teams/{teamId}
```

**Document Structure:**
```typescript
interface FirestoreTeam {
  id: string;
  tournamentId: string;
  tournamentName: string;
  draftType: 'fast' | 'slow';
  roster: TeamPlayer[];
  status: 'drafting' | 'active' | 'eliminated' | 'won';
  totalPoints?: number;
  rank?: number;
  payout?: number;
  createdAt: Timestamp;
  completedAt?: Timestamp;
}
```

---

## Architecture Decisions

### 1. Team Data vs Player News Separation

**Critical Distinction:**
- **Team Data** (roster, points, status, rankings): Only changes on game days until Week 17
- **Player News** (injuries, transactions, updates): Updates daily year-round, but doesn't change team data

**Why Separate:**
1. Different update frequencies (game days vs daily)
2. Different cost profiles (expensive real-time vs cheap batch updates)
3. Different data sources (your system vs external APIs)
4. Different user needs (real-time during games vs batch updates fine for news)

**Architecture:**
```typescript
// Team Data - Real-time only on game days
const useMyTeams = () => {
  if (isGameDayOrPostGame() && isTournamentActive()) {
    return useRealTimeTeamData();
  } else {
    return useOneTimeTeamData();
  }
};

// Player News - Separate system, daily batch updates
const usePlayerNews = () => {
  // Always fetch player news (separate collection)
  // Uses batch updates, not real-time listeners
  return usePlayerNewsBatch(isSeason ? 3 : 1); // 3x daily during season, 1x daily off-season
};
```

### 2. Game-Day Optimization Strategy

**NFL Regular Season Timeline (Weeks 1-17):**

**Game Days:**
- Thursday: 1 game (typically 8:20 PM ET) - 17 Thursdays/year
- Sunday: Most games (1:00 PM, 4:25 PM, 8:20 PM ET) - 17 Sundays/year
- Monday: 1 game (typically 8:15 PM ET) - 17 Mondays/year
- **Total**: 51 game days/year

**Post-Game Days (Score Finalization):**
- Friday: After Thursday games - 17 Fridays/year
- Monday: After Sunday games - 17 Mondays/year (Note: Monday is both game day AND post-game day)
- Tuesday: After Monday games - 17 Tuesdays/year
- **Total**: 51 post-game days/year
- **Unique days with updates**: 51 + 51 - 17 (Monday overlap) = **85 unique days/year**

**Non-Game Days During Season:**
- Tuesday (when not post-game), Wednesday, Saturday
- **Total**: ~34-51 non-game days during season
- **Important**: Player news updates daily, but doesn't change team data

**After Week 17:**
- Tournaments end after Week 17 completion (typically early January)
- All teams are final - no more team data updates
- Days: ~161 days/year (early Jan through August)
- Real-time listeners = wasted cost

**Update Logic:**
```typescript
// Check if real-time team updates are needed
function shouldUseRealTimeForTeams(): boolean {
  // Tournaments end after Week 17 - no updates needed after that
  if (!isTournamentActive()) return false; // After Week 17
  
  // Only on game days + post-game days
  return isGameDayOrPostGame();
}

// Game days: Thu (4), Sun (0), Mon (1)
// Post-game days: Fri (5), Mon (1), Tue (2)
function isGameDayOrPostGame(): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const isGameDay = dayOfWeek === 0 || dayOfWeek === 1 || dayOfWeek === 4;
  const isPostGameDay = dayOfWeek === 2 || dayOfWeek === 5;
  return isGameDay || isPostGameDay;
}
```

### 3. Hybrid Approach (Recommended)

**Why Hybrid:**
- One-time fetch for initial load is cheaper than establishing listeners immediately
- Real-time only when team data actually changes (game days)
- Best balance of cost and UX

**Implementation Pattern:**
```typescript
useEffect(() => {
  if (!userId) return;
  
  // Always start with one-time fetch (cheaper)
  fetchTeamsOnce(userId).then(setTeams);
  
  // Then add real-time listener only if needed
  if (shouldUseRealTimeForTeams()) {
    const unsubscribe = onSnapshot(teamsQuery, (snapshot) => {
      setTeams(snapshot.docs.map(transform));
    });
    return () => unsubscribe();
  }
}, [userId, shouldUseRealTimeForTeams()]);
```

---

## Cost Analysis

### Firebase Pricing (2024)

| Operation | Cost | Notes |
|-----------|------|-------|
| Document Read | $0.06 per 100K | Each team document = 1 read |
| Document Write | $0.18 per 100K | Creating/updating teams |
| Real-time Listener | Same as reads | Each listener = 1 read per document change |
| Storage | $0.18/GB/month | Minimal for teams data |

### Cost Scenarios (100,000 Users)

#### Scenario A: One-Time Fetch
**Usage Pattern:**
- User opens Teams tab → 1 query
- User refreshes → 1 query
- No real-time updates

**Cost:**
- 100,000 users/day × 365 days = 36.5M user sessions/year
- 36.5M sessions × (10-50 reads) = 365M-1,825M reads/year
- **Annual cost: $2,160-10,800**
- **Monthly cost: $180-900**

**Pros:**
- ✅ Predictable costs
- ✅ Low Firebase usage
- ✅ Simple implementation

**Cons:**
- ❌ No automatic updates
- ❌ Users must manually refresh
- ❌ Stale data if team status changes

#### Scenario B: Real-Time Year-Round
**Usage Pattern:**
- User opens Teams tab → Listener established
- Listener stays active while tab is open
- Automatic updates when data changes

**Cost:**
- 100,000 users × 365 days = 36.5M listener-days/year
- Each listener = 10-50 reads initially + updates
- Updates: 1-5 reads per update × frequency
- **Annual cost: $18,000-60,000**
- **Monthly cost: $1,500-5,000**

**Pros:**
- ✅ Automatic updates
- ✅ Better UX (teams update instantly)
- ✅ No manual refresh needed

**Cons:**
- ❌ Very high costs (6-10x more than one-time)
- ❌ Wastes money on non-game days (team data doesn't change)
- ❌ More complex error handling

#### Scenario C: Game-Day Optimized Hybrid ⭐ RECOMMENDED
**Usage Pattern:**
- Initial load: One-time fetch (always)
- Game days + post-game days: Real-time listener
- Non-game days + off-season: One-time fetch only

**Detailed Cost Calculation:**

**Base Assumptions:**
- 100,000 daily active users
- Average 10-50 teams per user
- Each team document = 1 read
- Firebase pricing: $0.06 per 100K reads

**Annual Breakdown:**

1. **Initial Loads (Every Day, All Year):**
   - 100K users/day × 365 days = 36.5M user sessions/year
   - 36.5M sessions × (10-50 reads) = 365M-1,825M reads/year
   - Cost: $219-1,095/year

2. **Game-Day Real-Time Updates (Weeks 1-17 Only):**
   - Game days: ~51 days/year
   - Post-game days: ~51 days/year
   - Total real-time days: ~85-102 days/year (28% of year)
   - Active listeners: 100K users × 85-102 days = 8.5M-10.2M listener-days
   - Updates per game day: 1-5 reads per user (during/after games)
   - Updates per post-game day: 1-2 reads per user (score finalization)
   - Total game-day reads: 8.5M-10.2M listener-days × (1-5 reads) = 8.5M-51M reads
   - Total post-game reads: 8.5M-10.2M listener-days × (1-2 reads) = 8.5M-20.4M reads
   - **Total real-time reads**: 17M-71.4M reads/year
   - Cost: $10-43/year

3. **Non-Game Days During Season (Weeks 1-17):**
   - Non-game days: ~34-51 days/year
   - One-time fetch only: 100K users × 34-51 days × (10-50 reads) = 34M-255M reads/year
   - Cost: $20-153/year

4. **After Week 17 + Off-Season:**
   - Days: ~161 days/year
   - One-time fetch only: 100K users × 161 days × (10-50 reads) = 161M-805M reads/year
   - Cost: $97-483/year

**Total Annual Cost:**
- Initial loads: $219-1,095
- Game-day real-time: $10-43
- Non-game days (season): $20-153
- Off-season: $97-483
- **Subtotal (team data): $346-1,774/year**

**Note on Variance:**
- Low estimate assumes: 10 teams/user, minimal updates, efficient caching
- High estimate assumes: 50 teams/user, frequent updates, no caching
- **Realistic range: $1,500-6,000/year** (accounts for user behavior variance, peak usage, etc.)

**Monthly Average: ~$125-500/month**

### Player News Costs (Separate System)

**Implementation:**
- Uses batch updates (one-time fetch per update), NOT real-time listeners
- Store in separate Firestore collection: `/playerNews/{playerId}/updates/{date}`
- Users fetch news for their team's players on demand

**Cost Calculation:**
- **Season (Aug-Week 17, ~150 days)**: 3x daily batch updates = 450 updates/year
- **Off-season (After Week 17-July, ~215 days)**: 1x daily batch updates = 215 updates/year
- **Total**: ~665 batch updates/year

**Reads per Update:**
- Average 50-200 news items per update batch
- Each news item = 1 read
- Total reads: 450 updates × (50-200K reads) + 215 updates × (50-200K reads)
- **Total reads/year**: 33.25M-133M reads
- **Cost**: $800-2,500/year (at $0.06 per 100K reads)

### Total System Costs (100,000 Users)

| System | Annual Cost | Monthly Average | Notes |
|--------|-------------|-----------------|-------|
| **Team Data (Game-Day Optimized)** | $1,500-6,000 | $125-500 | Real-time on game days only |
| **Player News (3x/1x daily)** | $800-2,500 | $67-208 | Batch updates, separate system |
| **TOTAL** | **$2,300-8,500** | **$192-708** | vs $18,000-60,000 year-round |

### Cost Comparison

| Approach | Annual Cost | vs Year-Round | Savings |
|----------|-------------|---------------|---------|
| **Year-Round Real-Time** | $18,000-60,000 | Baseline | - |
| **Game-Day Optimized** | $2,300-8,500 | 75-85% less | **$15,700-51,500/year** |

### Cost Monitoring

**Set Up Alerts:**
- Warning: $1,000/month
- Critical: $2,500/month
- Emergency: $5,000/month

**Key Metrics:**
- Daily reads: Should be ~30M-150M/day (one-time) or lower
- Listener count: Should be ~100K on game days, 0 on non-game days
- Cost per user: Target <$0.10/user/year

---

## Implementation Guide

### Step 1: Update Hook Structure

**File:** `components/vx2/hooks/data/useMyTeams.ts`

**Current:**
```typescript
async function fetchMyTeams(): Promise<MyTeam[]> {
  return MOCK_TEAMS;
}
```

**Target:**
```typescript
import { collection, query, orderBy, getDocs, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { useAuth } from '../../../../hooks/useAuth';

export function useMyTeams(): UseMyTeamsResult {
  const { user } = useAuth();
  const userId = user?.uid;
  const [teams, setTeams] = useState<MyTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if real-time is needed
  const shouldUseRealTime = useMemo(() => {
    return isGameDayOrPostGame() && isTournamentActive();
  }, []);

  useEffect(() => {
    if (!userId) {
      setTeams([]);
      setIsLoading(false);
      return;
    }

    const teamsCollectionRef = collection(db, 'users', userId, 'teams');
    const teamsQuery = query(teamsCollectionRef, orderBy('createdAt', 'desc'));

    // Always start with one-time fetch (cheaper)
    getDocs(teamsQuery).then((snapshot) => {
      const fetchedTeams = snapshot.docs.map(doc =>
        transformFirestoreTeam(doc.data() as FirestoreTeam, doc.id)
      );
      setTeams(fetchedTeams);
      setIsLoading(false);
    }).catch((err) => {
      setError(err.message);
      setIsLoading(false);
    });

    // Then add real-time listener only if needed
    if (shouldUseRealTime) {
      const unsubscribe = onSnapshot(
        teamsQuery,
        (snapshot) => {
          const fetchedTeams = snapshot.docs.map(doc =>
            transformFirestoreTeam(doc.data() as FirestoreTeam, doc.id)
          );
          setTeams(fetchedTeams);
          setError(null);
        },
        (err) => {
          console.error('[useMyTeams] Snapshot error:', err);
          setError(err.message);
        }
      );
      return () => unsubscribe();
    }
  }, [userId, shouldUseRealTime]);

  // ... rest of implementation
}
```

### Step 2: Add Helper Functions

**File:** `lib/tournament/tournamentUtils.ts` (create new file)

```typescript
/**
 * Check if NFL season is active (Weeks 1-17, typically Sept - early Jan)
 */
export function isNFLSeasonActive(): boolean {
  const now = new Date();
  const month = now.getMonth();
  // NFL season: September (8) through January (0)
  // Week 17 typically ends in early January
  return month >= 8 || month === 0; // Sept-Jan
}

/**
 * Check if tournaments are still active (before Week 17 ends)
 * After Week 17, tournaments end and teams are final
 */
export function isTournamentActive(): boolean {
  if (!isNFLSeasonActive()) return false;
  
  const now = new Date();
  const month = now.getMonth();
  const date = now.getDate();
  
  // Week 17 typically ends in early January (around Jan 7-10)
  // After that, tournaments are complete
  if (month === 0 && date > 10) return false; // After Jan 10, tournaments done
  
  return true; // Still in season, tournaments active
}

/**
 * Check if today is a game day or day after games
 */
export function isGameDayOrPostGame(): boolean {
  // Tournaments end after Week 17 - no updates needed after that
  if (!isTournamentActive()) return false;
  
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0-6 (Sun=0, Mon=1, etc.)
  
  // Game days: Thursday (4), Sunday (0), Monday (1)
  const isGameDay = dayOfWeek === 0 || dayOfWeek === 1 || dayOfWeek === 4;
  
  // Day after games: Friday (5), Monday (1), Tuesday (2)
  // (Monday counts as both game day and post-game day)
  const isPostGameDay = dayOfWeek === 2 || dayOfWeek === 5;
  
  return isGameDay || isPostGameDay;
}
```

### Step 3: Add Data Transformation

**File:** `components/vx2/hooks/data/useMyTeams.ts`

```typescript
import { FirestoreTeam, FirestoreTeamPlayer } from '../../../../types/firestore';
import { Timestamp } from 'firebase/firestore';

/**
 * Transform Firestore team document to MyTeam format
 */
function transformFirestoreTeam(firestoreTeam: FirestoreTeam, teamId: string): MyTeam {
  return {
    id: teamId,
    name: firestoreTeam.name || firestoreTeam.tournamentName,
    tournament: firestoreTeam.tournamentName,
    tournamentId: firestoreTeam.tournamentId,
    draftedAt: firestoreTeam.createdAt.toDate().toISOString(),
    players: firestoreTeam.roster.map(transformPlayer),
    status: firestoreTeam.status,
    projectedPoints: firestoreTeam.totalPoints || 0,
    rank: firestoreTeam.rank,
    totalTeams: 0, // Needs lookup from tournament data
  };
}

/**
 * Transform Firestore player to TeamPlayer format
 */
function transformPlayer(player: FirestoreTeamPlayer): TeamPlayer {
  return {
    name: player.name,
    team: player.team,
    position: player.position as any, // Needs proper mapping
    bye: 0, // Needs lookup from player data
    adp: 0, // Needs lookup from player data
    pick: player.pickNumber,
    projectedPoints: 0, // Needs lookup from player data
  };
}
```

### Step 4: Add Error Handling

```typescript
onSnapshot(
  teamsQuery,
  (snapshot) => {
    // Success handler
    const fetchedTeams = snapshot.docs.map(doc =>
      transformFirestoreTeam(doc.data() as FirestoreTeam, doc.id)
    );
    setTeams(fetchedTeams);
    setError(null);
  },
  (error) => {
    // Error handler
    console.error('[useMyTeams] Snapshot error:', error);
    
    if (error.code === 'unavailable') {
      setError('No internet connection. Showing cached data.');
    } else if (error.code === 'permission-denied') {
      setError('You do not have permission to view teams.');
    } else {
      setError(error.message || 'Failed to load teams');
    }
  }
);
```

### Step 5: Set Up Firestore Indexes

**File:** `firestore.indexes.json`

```json
{
  "indexes": [
    {
      "collectionGroup": "teams",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "tournamentId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "teams",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### Step 6: Add Offline Support (Optional)

```typescript
import { enableIndexedDbPersistence } from 'firebase/firestore';

// Call once on app initialization
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time
    console.warn('Firestore persistence already enabled in another tab');
  } else if (err.code == 'unimplemented') {
    // Browser doesn't support IndexedDB
    console.warn('Firestore persistence not supported in this browser');
  }
});
```

### Example: Complete Working Implementation

See `components/vx2/hooks/data/useMyTeams.firebase-example.ts` for a complete working example with:
- Real-time listeners
- One-time fetch option
- Error handling
- Data transformation
- Advanced query patterns
- Seasonal/game-day logic

---

## Future Considerations

### Flexible Tournament System

**Current:** Hardcoded for regular season (Weeks 1-17)

**Future:** Support multiple tournament types with different schedules:
- **Playoff tournaments**: Jan-Feb, different game days (Thu, Sat, Sun)
- **Weekly tournaments**: Single week or multiple weeks
- **Off-season tournaments**: March-July, different update patterns

**Solution:** Tournament configuration system (see `TEAMS_TAB_FUTURE_TOURNAMENTS.md`)

```typescript
interface TournamentConfig {
  id: string;
  name: string;
  type: 'regular_season' | 'playoff' | 'weekly' | 'off_season';
  startDate: Date;
  endDate: Date;
  activeWeeks: number[];
  teamUpdateRules: {
    realTimeOnGameDays: boolean;
    realTimeOnPostGameDays: boolean;
    gameDays: number[]; // [0, 1, 4] for Sun, Mon, Thu
    postGameDays: number[]; // [1, 2, 5] for Mon, Tue, Fri
  };
  playerNewsRules: {
    updatesPerDay: number;
    updateTimes: string[];
  };
}
```

**Migration Path:**
1. Phase 1: Current (hardcoded for regular season)
2. Phase 2: Tournament-aware (flexible config)
3. Phase 3: Multi-tournament support

### Edge Cases

**Holiday Games:**
- Thanksgiving (Thu), Christmas (varies), New Year's (varies)
- Handled as regular game days

**Saturday Games:**
- Late season (Weeks 15-17) may have Saturday games
- Count as game days

**Bye Weeks:**
- No impact on game day calculation (still Thu/Sun/Mon schedule)

**Week 17 Timing:**
- Tournament ends after Week 17 completion (typically early January)
- Need to check actual completion date, not just calendar date

### Optimization Opportunities

1. **Pagination**: For users with 50+ teams (reduce initial load reads)
2. **Caching**: Aggressive client-side caching (reduce redundant reads)
3. **CDN**: For static player news content (reduce Firestore reads)
4. **Batch queries**: Fetch news for multiple players at once (reduce query overhead)

---

## Next Steps

### Immediate (Next 1-2 Weeks)

1. **Implement Game-Day Logic**
   - [ ] Create `lib/tournament/tournamentUtils.ts` with helper functions
   - [ ] Test game day detection logic
   - [ ] Test tournament active detection (Week 17 cutoff)

2. **Update useMyTeams Hook**
   - [ ] Replace mock data with Firebase queries
   - [ ] Add one-time fetch for initial load
   - [ ] Add conditional real-time listener (game days only)
   - [ ] Add data transformation layer
   - [ ] Add error handling

3. **Set Up Firestore**
   - [ ] Create required indexes (`firestore.indexes.json`)
   - [ ] Deploy indexes to Firebase
   - [ ] Test queries with real data

4. **Testing**
   - [ ] Test with real Firebase data
   - [ ] Test game day vs non-game day behavior
   - [ ] Test after Week 17 (listeners should be disabled)
   - [ ] Test error handling (network errors, permission errors)
   - [ ] Test offline support (if implemented)

### Short-Term (Next 1-2 Months)

5. **Player News System**
   - [ ] Design player news collection structure
   - [ ] Implement batch update system (3x daily during season, 1x daily off-season)
   - [ ] Create `usePlayerNews` hook
   - [ ] Integrate with Teams tab UI

6. **Performance Optimization**
   - [ ] Implement virtual scrolling for long team lists
   - [ ] Add aggressive caching
   - [ ] Optimize query patterns

7. **Monitoring**
   - [ ] Set up Firebase usage alerts ($1,000, $2,500, $5,000/month)
   - [ ] Track daily reads and listener counts
   - [ ] Monitor cost per user

### Long-Term (Future)

8. **Tournament Flexibility**
   - [ ] Design tournament configuration system
   - [ ] Implement tournament-aware update logic
   - [ ] Support multiple concurrent tournaments
   - [ ] Test with playoff tournaments

9. **Advanced Features**
   - [ ] User preferences (disable real-time for certain tournaments)
   - [ ] Advanced filtering and sorting
   - [ ] Team analytics and insights

---

## Reference Documents

- **Cost Analysis**: `docs/TEAMS_TAB_FIREBASE_TRADEOFFS.md` (detailed cost breakdowns)
- **Cost Summary**: `docs/TEAMS_TAB_COST_SUMMARY_100K.md` (quick reference)
- **Architecture**: `docs/TEAMS_TAB_PLAYER_NEWS_VS_TEAM_DATA.md` (team data vs player news)
- **Future Tournaments**: `docs/TEAMS_TAB_FUTURE_TOURNAMENTS.md` (flexible tournament system)
- **Integration Guide**: `docs/TEAMS_TAB_FIREBASE_INTEGRATION.md` (technical details)
- **Example Code**: `components/vx2/hooks/data/useMyTeams.firebase-example.ts` (working example)

---

## Key Contacts & Resources

**Firebase Documentation:**
- Firestore Queries: https://firebase.google.com/docs/firestore/query-data/queries
- Real-time Listeners: https://firebase.google.com/docs/firestore/query-data/listen
- Offline Persistence: https://firebase.google.com/docs/firestore/manage-data/enable-offline

**Cost Monitoring:**
- Firebase Console: https://console.firebase.google.com
- Set up billing alerts in Firebase Console → Project Settings → Usage and Billing

---

**Document Status:** ✅ Complete and ready for implementation  
**Last Review:** 2025-01-XX  
**Next Review:** After Firebase integration complete

