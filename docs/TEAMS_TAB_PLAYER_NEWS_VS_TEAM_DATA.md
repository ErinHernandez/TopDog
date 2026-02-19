# Player News vs Team Data - Architecture Distinction

## Overview

It's critical to understand that **player news updates** and **team data updates** are separate concerns with different update frequencies and requirements.

## Data Types

### Team Data (Roster, Points, Status, Rankings)
**What it includes:**
- Team roster (which players are on the team)
- Total points scored
- Team status (active, eliminated, won)
- Tournament ranking
- Draft picks

**Update Frequency:**
- **Game days only**: Updates during/after NFL games
- **Post-game days**: Score finalization (1 day after games)
- **Non-game days**: Static (no changes)
- **After Week 17**: Static (tournaments complete)
- **Off-season**: Static (no changes)

**Real-Time Needs:**
- ✅ Real-time listeners on game days + post-game days (until Week 17)
- ❌ No real-time needed on non-game days or after Week 17

**Cost Impact:**
- Real-time only ~102 days/year
- Saves 75-85% vs year-round real-time

---

### Player News (Injuries, Transactions, Updates)
**What it includes:**
- Injury reports
- Player transactions (trades, signings, releases)
- Practice reports
- Status updates
- News articles

**Update Frequency:**
- **August - Week 17**: Updates 3 times per day (preseason, regular season)
- **After Week 17 - July**: Updates once per day (off-season)
- **During season**: More frequent on game days (3x daily)
- **Off-season**: Once daily (free agency, draft, etc.)

**Real-Time Needs:**
- ⚠️ Needs 3x daily updates during season (Aug-Week 17), 1x daily otherwise
- ✅ Can use separate, lighter-weight system (batch updates, not real-time listeners)
- ✅ Doesn't change team data (roster, points, status)
- ✅ Doesn't require team data real-time listeners

**Cost Impact:**
- Separate from team data listeners
- Can use batch updates or separate collection
- Minimal cost if handled efficiently

---

## Architecture Recommendation

### Separate Systems

```typescript
// Team Data - Real-time only on game days
const useMyTeams = () => {
  if (isGameDayOrPostGame() && isTournamentActive()) {
    // Real-time listener for team data
    return useRealTimeTeamData();
  } else {
    // One-time fetch for team data
    return useOneTimeTeamData();
  }
};

// Player News - Separate system, daily updates
const usePlayerNews = () => {
  // Always fetch player news (separate collection)
  // Can use lighter-weight system (batch updates, not real-time)
  return usePlayerNewsData();
};
```

### Why Separate?

1. **Different Update Frequencies**
   - Team data: Game days only
   - Player news: Daily, year-round

2. **Different Cost Profiles**
   - Team data: Expensive real-time listeners
   - Player news: Cheaper batch updates

3. **Different Data Sources**
   - Team data: From your draft/scoring system
   - Player news: From external APIs/feeds

4. **Different User Needs**
   - Team data: Users want real-time during games
   - Player news: Users can tolerate slight delay (batch updates fine)

---

## Implementation Options

### Option 1: Separate Collections (Recommended)

```typescript
// Firestore structure
/users/{userId}/teams/{teamId}          // Team data (roster, points, status)
/playerNews/{playerId}/updates/{date}   // Player news (separate collection)
```

**Pros:**
- Clear separation of concerns
- Different update strategies
- Team data listeners only when needed
- Player news can use batch updates

**Cons:**
- Two separate queries
- Slightly more complex

---

### Option 2: Denormalized Player News in Teams

```typescript
// Firestore structure
/users/{userId}/teams/{teamId}
  - roster: [...]
  - points: 1234
  - playerNews: { // Denormalized
      'playerId1': { lastUpdate: '2025-01-15', news: '...' },
      'playerId2': { lastUpdate: '2025-01-15', news: '...' }
    }
```

**Pros:**
- Single query for teams + news
- Simpler data fetching

**Cons:**
- Team data listeners fire on player news updates (wasteful)
- Higher costs (listeners active when team data doesn't change)
- Not recommended

---

### Option 3: Hybrid Approach

```typescript
// Team data: Real-time on game days only
const teams = useMyTeams(); // Real-time only when needed

// Player news: Separate, daily batch updates
const playerNews = usePlayerNews(); // Daily fetch, not real-time
```

**Pros:**
- Best of both worlds
- Team data: Real-time when needed
- Player news: Efficient batch updates
- Lowest cost

**Cons:**
- Two separate hooks
- Need to combine data in UI

---

## Cost Analysis

### Team Data Listeners (Current Plan - 100,000 Users)
- Real-time: ~102 days/year (game days + post-game, until Week 17)
- One-time: ~263 days/year (non-game days, after Week 17, off-season)
- **Cost: ~$1,500-6,000/year**

### Player News Updates (Separate System - 100,000 Users)

**Implementation Approach:**
- Use batch updates (one-time fetch per update), NOT real-time listeners
- Store player news in separate Firestore collection: `/playerNews/{playerId}/updates/{date}`
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

**Optimization Opportunities:**
- Cache news items (reduce redundant reads)
- Use CDN for static news content
- Batch user queries (fetch news for multiple players at once)
- Limit news history (only fetch recent updates)

### Total Cost (100,000 Users)
- **Team data: ~$1,500-6,000/year** (real-time on game days only)
- **Player news: ~$800-2,500/year** (3x daily during season, 1x daily off-season)
- **Total: ~$2,300-8,500/year**
- vs Year-round team listeners: $18,000-60,000/year
- **Savings: 75-85%**

---

## Recommended Architecture

### 1. Team Data System
```typescript
// Real-time only on game days until Week 17
const useMyTeams = () => {
  const shouldUseRealTime = isGameDayOrPostGame() && isTournamentActive();
  
  if (shouldUseRealTime) {
    // Real-time listener for team data
    return useRealTimeTeamData();
  } else {
    // One-time fetch
    return useOneTimeTeamData();
  }
};
```

### 2. Player News System
```typescript
// Separate system, frequency varies by season
const usePlayerNews = () => {
  const isSeason = isNFLSeasonActive(); // Aug-Week 17
  
  // During season: 3x daily batch updates
  // Off-season: 1x daily batch updates
  // Not real-time (batch updates are fine for news)
  return usePlayerNewsBatch(isSeason ? 3 : 1);
};
```

### 3. Combined in UI
```typescript
// In Teams tab component
const TeamsTab = () => {
  const teams = useMyTeams(); // Real-time only when needed
  const playerNews = usePlayerNews(); // Daily updates, separate
  
  // Combine in UI
  const teamsWithNews = teams.map(team => ({
    ...team,
    players: team.players.map(player => ({
      ...player,
      news: playerNews[player.id] || null
    }))
  }));
  
  return <TeamList teams={teamsWithNews} />;
};
```

---

## Key Takeaways

1. **Team data and player news are separate concerns**
   - Different update frequencies
   - Different cost profiles
   - Different user needs

2. **Team data listeners should be game-day optimized**
   - Real-time only on game days until Week 17
   - Saves 75-85% on team data listener costs

3. **Player news can use separate, efficient system**
   - Daily batch updates (not real-time)
   - Separate collection/query
   - Minimal cost

4. **Combined in UI, separate in data layer**
   - Fetch separately
   - Combine in components
   - Best of both worlds

---

## Implementation Checklist

- [ ] Separate team data and player news in data layer
- [ ] Team data: Real-time only on game days until Week 17
- [ ] Player news: 3x daily during season (Aug-Week 17), 1x daily off-season
- [ ] Design flexible tournament schedule system for future tournaments
- [ ] Combine data in UI components
- [ ] Monitor costs separately
- [ ] Test both systems independently
- [ ] Plan for future tournament types (playoff tournaments, etc.)

