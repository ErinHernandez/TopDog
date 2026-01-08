# Teams Tab Sortability Features - Comprehensive Analysis & Planning

**Last Updated:** 2025-01-XX  
**Status:** Pre-Planning & Analysis  
**Priority:** High - Defining Feature  
**Philosophy:** Enterprise grade. Fanatical about UX. Be thorough, take your time, quality over speed.

---

## Executive Summary

The Teams tab sortability is a **defining feature** of TopDog, enabling users to easily navigate through the specifics of teams and combinatorics. This document provides comprehensive planning for a robust sorting system that empowers users to organize and view their portfolio data with maximum granularity - without providing analysis or strategic insights.

### Key Constraints
- **Single Tournament:** Only one tournament this year - tournament-based sorting is simplified
- **Focus Areas:** Team composition, combinatorics, and performance metrics are primary

### Key Principles
1. **Data Only - No Tools, No Analysis** - Provide raw data only. No derived metrics, no analysis tools, no recommendations, no strategic insights (per TopDog strategy - don't give away whale's alpha)
2. **Raw Data Display** - Show only the actual data points (player names, teams, positions, picks, ADPs, projected points, ranks, etc.)
3. **Basic Sorting** - Allow sorting by raw data fields only (name, date, rank, points, etc.)
4. **Persistent Preferences** - Remember user sort preferences across sessions
5. **Performance First** - Handle 100+ teams efficiently with virtual scrolling where needed

### Critical Constraint: Data Only, No Tools, No Analysis
- ✅ **Allowed:** 
  - Raw data display (player names, teams, positions, picks, ADPs, projected points, ranks, bye weeks)
  - Basic sorting by raw data fields
  - Filtering by raw data fields
- ❌ **Not Allowed:** 
  - Derived metrics (roster value, stack counts, overlap scores, correlation scores, position balance metrics)
  - Analysis tools (conflict detection, spread calculations, diversity metrics)
  - Recommendations, optimization suggestions, "good/bad" indicators
  - Strategic insights or interpretations
- **Philosophy:** Give users raw data only. They do their own analysis. No tools, no analysis.

---

## Current State Analysis

### Existing Functionality
✅ **Search & Filter:**
- Player name search
- NFL team filtering
- Multi-select dropdown for players/teams
- Direct NFL team name matching

✅ **Basic Display:**
- Team cards with name, tournament, rank
- Team details view with position grouping
- Player rows with stats cards

❌ **Missing:**
- No team-level sorting
- No player-level sorting within teams
- No combinatorics detection/counting
- No saved sort preferences
- No multi-criteria sorting

### Available Data Structure

#### Team-Level Data (`MyTeam`)
```typescript
{
  id: string
  name: string
  tournament: string
  tournamentId: string
  rank?: number              // Current tournament rank
  totalTeams?: number        // Total teams in tournament
  projectedPoints: number    // Total projected points
  draftedAt: string          // ISO date string
  players: TeamPlayer[]      // 18 players
  // Playoff context (if applicable):
  playoffRoom?: string        // Playoff room/pod identifier
  playoffMatchups?: {        // Playoff week matchups
    week15?: { opponentId: string, opponentName: string }
    week16?: { opponentId: string, opponentName: string }
    week17?: { opponentId: string, opponentName: string }
  }
}
```

#### Player-Level Data (`TeamPlayer`)
```typescript
{
  name: string
  team: string              // NFL team abbreviation
  bye: number              // Bye week (0-18)
  adp: number              // Average draft position
  pick: number             // Pick number when drafted
  projectedPoints: number  // Projected fantasy points
  position: 'QB' | 'RB' | 'WR' | 'TE'
}
```

---

## Sortability Requirements

### 1. Team-Level Sorting (Team List View)

#### Primary Sort Options

**A. Chronological**
- `draftedAt-asc` - Oldest first
- `draftedAt-desc` - Newest first
- **Description:** Sort teams by when they were drafted

**B. Tournament-Based** (Simplified - Single Tournament)
- `rank-asc` - Best rank first (lowest number = best) - **PRIMARY**
- `rank-desc` - Worst rank first
- `rankPercentile-asc` - Best percentile first (if totalTeams available)
- `rankPercentile-desc` - Worst percentile first
- **Note:** Tournament name sorting not needed (single tournament)
- **Description:** Sort teams by their current tournament rank or percentile

**C. Performance-Based**
- `projectedPoints-asc` - Lowest projected points first
- `projectedPoints-desc` - Highest projected points first (most common)
- `rank-asc` - Best rank first (1st place = best) - **PRIMARY**
- `rank-desc` - Worst rank first
- `rankPercentile-asc` - Best percentile first (if totalTeams available)
- `rankPercentile-desc` - Worst percentile first
- **Description:** Sort teams by projected points or current rank

**D. Name-Based**
- `name-asc` - Team name A-Z
- `name-desc` - Team name Z-A
- **Description:** Sort teams alphabetically by name

**E. Playoff Week Matchup Overlap** (Playoff Weeks Only)
- `playoffOverlap-asc/desc` - Number of shared players with playoff week opponent
- **Context:** Only active during playoff weeks (15, 16, 17)
- **Scope:** Only teams in same playoff room/pod, only teams facing each other that week
- **Description:** Sort teams by number of shared players with their playoff week opponent (raw matchup data)
- **Purpose:** Help users see if they're "covered" (shared players with opponents)

#### Derived Metrics - REMOVED
- **Note:** All derived metrics removed per philosophy (data only, no tools)
- Removed: rosterValue, earlyRoundValue, lateRoundValue, positionBalance, position counts, NFL team counts, stack counts, overlap metrics, diversity metrics
- **Rationale:** These are tools/calculations, not raw data. Users can calculate these themselves if needed.

### 2. Player-Level Sorting (Team Details View)

#### Primary Sort Options

**A. Draft-Based**
- `pick-asc` - Draft order (earliest pick first)
- `pick-desc` - Reverse draft order
- `adp-asc` - ADP ascending
- `adp-desc` - ADP descending
- **Note:** `adpValue` removed - this is a derived metric (tool), not raw data
- **Description:** Sort players by raw draft data (pick number, ADP)

**B. Projection-Based**
- `projectedPoints-asc` - Lowest projected points first
- `projectedPoints-desc` - Highest projected points first
- **Note:** `pointsPerDollar` removed - this is a derived metric (tool), not raw data
- **Description:** Sort players by raw projected points data

**C. Position-Based**
- `position-asc` - QB, RB, WR, TE order
- `position-desc` - TE, WR, RB, QB order
- **Description:** Sort players by position

**D. NFL Team-Based**
- `nflTeam-asc` - NFL team A-Z
- `nflTeam-desc` - NFL team Z-A
- **Note:** `nflTeamCount` removed - this is a derived metric (tool)
- **Description:** Sort players by raw NFL team data

**E. Bye Week-Based**
- `bye-asc` - Bye week 0-18
- `bye-desc` - Bye week 18-0
- **Note:** `byeGroup` removed - grouping is a tool
- **Description:** Sort players by raw bye week data

#### Advanced Player Sorting

**F. Positional Rank**
- `positionRank-asc/desc` - Rank within position (if available)
- `tier-asc/desc` - Player tier (if available)
- **Description:** Sort players by positional rank or tier

**G. Name-Based**
- `name-asc` - Player name A-Z
- `name-desc` - Player name Z-A
- **Description:** Sort players alphabetically by name

### 3. Multi-Criteria Sorting

#### Primary + Secondary Sort
- Allow users to set primary sort (e.g., `projectedPoints-desc`)
- Then secondary sort for ties (e.g., `draftedAt-asc`)
- Visual indicator showing sort hierarchy
- **Description:** Sort by primary criteria, then secondary for ties

#### Custom Sort Rules
- User-defined sort rules (e.g., "QB count > 2, then by projected points")
- Save custom sort presets
- **Description:** Allow users to create and save custom sort configurations

---

## UI/UX Design Considerations

### Sort Control Placement

#### Team List View
**Option A: Header Bar (Recommended)**
- Sort dropdown/button in header, right of search
- Icon: Sort icon (↕️ or ⇅)
- Click opens sort menu
- Current sort displayed as badge/chip

**Option B: Inline with Search**
- Sort controls integrated with search bar
- Dropdown next to search input
- More compact, less discoverable

**Option C: Floating Action Button**
- FAB in bottom-right corner
- Opens sort panel/modal
- Good for mobile, less discoverable

#### Team Details View
**Option A: Player List Header**
- Sort controls in player list header
- Similar to draft room player list
- Clickable column headers for sort
- Visual indicators (arrows) for sort direction

**Option B: Toolbar Above Players**
- Dedicated toolbar with sort dropdown
- Can include filters, view options
- More space for controls

### Sort Menu Design

#### Quick Sort Buttons
- Common sorts as buttons/chips
- "Newest", "Best Rank", "Highest Projected", etc.
- One-click sorting
- Visual feedback on active sort

#### Advanced Sort Dialog
- Full sort menu with all options
- Primary + secondary sort selection
- Sort direction toggles
- Preview of sort results
- Save as preset option

#### Sort Indicators
- Visual arrows (↑↓) showing direction
- Highlighted column/field when sorted
- Sort order badge (1st, 2nd sort)
- Clear sort button

### Mobile Considerations

#### Touch Targets
- Minimum 44px touch targets
- Large, tappable sort buttons
- Swipe gestures for quick sort change?

#### Space Constraints
- Collapsible sort menu
- Bottom sheet for sort options
- Sticky sort bar when scrolling

#### Performance
- Virtual scrolling for 100+ teams
- Debounced sort calculations
- Memoized sort results
- Lazy loading of team details

---

## Technical Implementation

### State Management

#### Sort State Structure
```typescript
interface SortState {
  // Team list sorting
  teamList: {
    primary: TeamSortOption
    secondary?: TeamSortOption
    direction: 'asc' | 'desc'
  }
  
  // Player list sorting (per team)
  playerList: {
    [teamId: string]: {
      primary: PlayerSortOption
      secondary?: PlayerSortOption
      direction: 'asc' | 'desc'
    }
  }
  
  // Saved presets
  presets: SortPreset[]
}

type TeamSortOption = 
  | 'draftedAt' | 'rank' | 'projectedPoints' | 'rankPercentile' | 'name'
  | 'playoffOverlap' // Playoff week matchup overlap (raw data - shared players with opponent)
  // Raw data only - no derived metrics, no tools
  // Note: 'tournament' removed - single tournament this year
  // Note: All derived metrics removed (rosterValue, position counts, stack counts, general overlap, etc.) - these are tools, not data
  // Note: 'playoffOverlap' is raw matchup data (shared players), not a calculated metric

type PlayerSortOption =
  | 'pick' | 'adp' | 'projectedPoints' | 'position' | 'nflTeam' | 'bye' | 'name'
  // Raw data only - no derived metrics, no tools
  // Note: 'positionRank', 'adpValue', 'pointsPerDollar' removed - these are derived metrics (tools)
```

#### Persistence
- Store in `localStorage` with key `topdog_teams_sort_preferences`
- Sync across tabs using `storage` event
- Include version for migration if schema changes

### Sort Functions

#### Team Sorting
```typescript
function sortTeams(
  teams: MyTeam[],
  sortOption: TeamSortOption,
  direction: 'asc' | 'desc',
  secondary?: { option: TeamSortOption, direction: 'asc' | 'desc' }
): MyTeam[] {
  const sorted = [...teams].sort((a, b) => {
    let comparison = 0;
    
    switch (sortOption) {
      case 'draftedAt':
        comparison = new Date(a.draftedAt).getTime() - new Date(b.draftedAt).getTime();
        break;
      case 'projectedPoints':
        comparison = a.projectedPoints - b.projectedPoints;
        break;
      case 'rank':
      case 'rankPercentile':
        // Handle undefined ranks (put at end)
        if (a.rank === undefined && b.rank === undefined) return 0;
        if (a.rank === undefined) return 1;
        if (b.rank === undefined) return -1;
        if (sortOption === 'rankPercentile' && a.totalTeams && b.totalTeams) {
          // Calculate percentile: (rank / totalTeams) * 100
          const percentileA = (a.rank / a.totalTeams) * 100;
          const percentileB = (b.rank / b.totalTeams) * 100;
          comparison = percentileA - percentileB;
        } else {
          comparison = a.rank - b.rank;
        }
        break;
      // All derived metrics removed - only raw data sorting
      // Removed: rosterValue, stackCount, position counts, etc.
    }
    
    if (comparison === 0 && secondary) {
      // Apply secondary sort
      return sortBySecondary(a, b, secondary);
    }
    
    return direction === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
}
```

#### Player Sorting
```typescript
function sortPlayers(
  players: TeamPlayer[],
  sortOption: PlayerSortOption,
  direction: 'asc' | 'desc'
): TeamPlayer[] {
  // Similar structure to team sorting
  // Handle position grouping, NFL team grouping, etc.
}
```

### Derived Metrics Calculation

#### Derived Metrics - REMOVED
- **Note:** All derived metric calculations removed (rosterValue, stackCount, etc.)
- These are tools, not raw data. Users can calculate these themselves if needed.

### Performance Optimization

#### Memoization
```typescript
const sortedTeams = useMemo(() => {
  return sortTeams(teams, sortState.teamList.primary, sortState.teamList.direction);
}, [teams, sortState.teamList]);
```

#### Virtual Scrolling
- Use `react-window` or `react-virtual` for 100+ teams
- Only render visible teams
- Maintain scroll position during sort

#### Debouncing
- Debounce sort calculations if recalculating on every keystroke
- Batch multiple sort changes

---

## Playoff Week Matchup Overlap (Raw Data)

### Playoff Week Player Overlap
- **Context:** Playoff weeks only (Week 15, 16, 17)
- **Scope:** Only teams in the same playoff room/pod
- **Matchup-Specific:** Only compare to teams the user is facing that specific week
- **Purpose:** Help users see if they're "covered" (which players they share with opponents)

### What This Shows
- **Raw Data:** Which players appear on both the user's team AND their opponent's team for that specific playoff week matchup
- **Example:** User Team I vs. Opponent Team J in Week 15 - shows shared players between these two teams
- **Not a Tool:** This is raw matchup data, not a calculated metric

### Implementation Details
- Only active during playoff weeks (15, 16, 17)
- Only shows overlap for teams in the same playoff room/pod
- Only shows overlap for the specific matchup that week
- Display: List of shared players between user's team and opponent's team
- Sort: Allow sorting teams by overlap count with their playoff week opponents

### Other Combinatorics Features - REMOVED
- **Stack Detection:** REMOVED - This is a tool (counting/calculating), not raw data
- **General Portfolio Overlap:** REMOVED - This is a tool (counting/calculating), not raw data
- **Bye Week Analysis:** REMOVED - Only show individual player bye weeks (raw data)

---

## Implementation Phases

### Phase 1: Core Team Sorting (MVP)
**Priority:** High  
**Timeline:** Week 1

- [ ] Basic team sort dropdown
- [ ] Sort by: name, draftedAt, rank, projectedPoints
- [ ] Sort direction toggle (asc/desc)
- [ ] Persist sort preference
- [ ] Visual sort indicators
- [ ] **Note:** Tournament sorting simplified (single tournament)

**Files to Modify:**
- `components/vx2/tabs/my-teams/MyTeamsTabVX2.tsx`
- `components/vx2/hooks/data/useMyTeams.ts` (if needed)
- New: `components/vx2/tabs/my-teams/sortUtils.ts`

### Phase 2: Secondary Sort Support
**Priority:** Medium  
**Timeline:** Week 2

- [ ] Secondary sort support (for ties in primary sort)
- [ ] Quick sort buttons for common sorts
- [ ] **Note:** All derived metrics removed - only raw data sorting

**Files to Modify:**
- `components/vx2/tabs/my-teams/MyTeamsTabVX2.tsx`
- `components/vx2/tabs/my-teams/sortUtils.ts` (expand)

### Phase 3: Player-Level Sorting
**Priority:** Medium  
**Timeline:** Week 3

- [ ] Player sort controls in team details view
- [ ] Sort by: pick, adp, projectedPoints, position, nflTeam, bye (individual player bye only)
- [ ] Clickable column headers
- [ ] Per-team sort preferences
- [ ] Position grouping toggle
- [ ] **Note:** Bye week sorting is for individual player bye weeks only, no team-level analysis

**Files to Modify:**
- `components/vx2/tabs/my-teams/MyTeamsTabVX2.tsx` (TeamDetailsView)
- `components/vx2/tabs/my-teams/sortUtils.ts` (add player sorting)

### Phase 4: Playoff Week Matchup Overlap
**Priority:** High (Playoff Context)  
**Timeline:** Week 4-5

- [ ] Playoff week detection (weeks 15, 16, 17)
- [ ] Playoff room/pod identification
- [ ] Matchup identification (which teams face each other each week)
- [ ] Shared players calculation (raw data - which players appear on both teams)
- [ ] Display shared players for each playoff week matchup
- [ ] Sort teams by playoff overlap count
- [ ] **Note:** This is raw matchup data, not a derived metric
- [ ] **Scope:** Only playoff weeks, only same room/pod, only matchup-specific

**Files to Create:**
- `components/vx2/tabs/my-teams/combinatoricsUtils.ts`
- `components/vx2/tabs/my-teams/StackIndicator.tsx`

**Files to Modify:**
- `components/vx2/tabs/my-teams/MyTeamsTabVX2.tsx`
- `components/vx2/tabs/my-teams/sortUtils.ts`

### Phase 5: Advanced Features
**Priority:** Medium  
**Timeline:** Week 6+

- [ ] Custom sort presets
- [ ] Saved sort configurations
- [ ] Multi-criteria sort builder
- [ ] Sort analytics (most used sorts)
- [ ] Export sorted teams
- [ ] Virtual scrolling for performance

---

## Testing Considerations

### Unit Tests
- Sort functions with various inputs
- Edge cases (empty teams, undefined values, ties)
- Sort persistence (localStorage)
- **Note:** No derived metrics to test - only raw data sorting

### Integration Tests
- Sort UI interactions
- Sort state persistence across sessions
- Sort with filters/search
- Performance with 100+ teams

### User Testing
- Sort discoverability
- Sort menu usability
- Mobile sort experience
- Power user workflows

---

## Success Metrics

### Usage Metrics
- % of users who use sorting
- Most popular sort options
- Average sorts per session
- Sort preset usage

### Performance Metrics
- Sort calculation time (<50ms for 100 teams)
- Render time after sort (<100ms)
- Memory usage with virtual scrolling

### User Satisfaction
- User feedback on sortability
- Feature requests for additional sorts
- Reported bugs/issues

---

## Open Questions

1. **Real-Time Updates:** Should sort recalculate when team data updates, or require manual refresh?
2. **Sort Presets:** Should we provide default presets, or let users create all?
3. **Mobile Gestures:** Should we support swipe gestures for quick sort changes?
4. **Export:** Should sorted teams be exportable in sorted order?
5. **Rank Percentile:** Is `rankPercentile` considered raw data (if we have rank and totalTeams) or a derived metric?

---

## Related Documentation

- `docs/TEAMS_TAB_COMPLETE_ANALYSIS.md` - Overall teams tab analysis
- `components/vx2/draft-room/components/PlayerList.tsx` - Reference for player sorting UI
- `components/vx2/hooks/data/useExposure.ts` - Reference for sort state management
- `components/vx2/draft-room/constants/index.ts` - Reference for sort option definitions

---

## Next Steps

1. **Review & Approval** - Get stakeholder approval on sort options and UI design
2. **Technical Design** - Finalize sort state structure and utility functions
3. **UI Mockups** - Create mockups for sort controls and indicators
4. **Phase 1 Implementation** - Begin with core team sorting
5. **Iterative Development** - Build out phases incrementally with user feedback

---

**Document Status:** Ready for Review  
**Next Review Date:** TBD  
**Owner:** Development Team

