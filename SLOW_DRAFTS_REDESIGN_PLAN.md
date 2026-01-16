# Slow Drafts Redesign: Enterprise-Grade Implementation Plan

## Executive Summary

The current Live Drafts tab is functionally adequate but visually underwhelming—particularly for slow drafts where users may be managing 50+ simultaneous drafts over weeks. This redesign transforms the slow draft experience into a **competitive differentiator** that could capture market share from competitors like Underdog who, as noted, do a "dogshit job" with this specific product.

### The Core Problem
When users are in 50 slow drafts simultaneously:
- They can't quickly recall **what they've drafted** in THIS specific draft
- They can't identify **where they are** in draft progress
- They miss **notable events** (reaches, steals, key players taken)
- Every draft card looks identical—no visual memory hooks

### The Solution
Transform each draft card into a **rich mini-dashboard** that provides instant context without entering the draft room.

---

## Design Philosophy

### Match Draft Room Visual Language
Based on the Draft Room screenshots, the visual language includes:
- **Position-colored cards** (WR gold #FBBF25, RB green #0fba80, TE purple #7C3AED, QB pink #F472B6)
- **Blue tiled pattern** for active/on-the-clock states
- **Position tracker bars** showing roster composition at a glance
- **Dense but scannable** information hierarchy
- **Premium dark theme** with subtle elevation and borders

### Slow Draft Specific Needs
Unlike fast drafts (30-second urgency), slow drafts are:
- **Multi-day affairs** spanning 1-3 weeks
- **Context-heavy** requiring memory aids
- **Event-driven** with notable picks happening at unpredictable times
- **Strategic** where seeing others' rosters matters more

---

## Component Architecture

### 1. SlowDraftsTabVX2 (New Component)
Completely separate from FastDraftsTabVX2—different use cases warrant different implementations.

```
SlowDraftsTabVX2/
├── index.tsx                    # Main tab orchestrator
├── components/
│   ├── SlowDraftCard.tsx        # Rich mini-dashboard card
│   ├── MyRosterStrip.tsx        # Horizontal roster visualization
│   ├── DraftTimeline.tsx        # Recent activity feed
│   ├── PositionNeedsIndicator.tsx
│   ├── NotablePicks.tsx         # Reaches/steals/key picks
│   ├── CardExpandedView.tsx     # Full inline expansion
│   └── QuickActions.tsx         # Swipe/button actions
├── hooks/
│   ├── useSlowDraftDetails.ts   # Fetches enhanced draft data
│   └── useNotableEvents.ts      # Calculates reaches/steals
└── constants.ts                 # Slow-draft specific values
```

---

## Card Design: The Mini-Dashboard

### Card States

#### 1. Collapsed State (Default)
Height: ~180px - Information dense but scannable

```
┌──────────────────────────────────────────────────────────┐
│  TopDog International III                    ⏰ 4h 23m   │
│  Pick 7.04 • Round 7 of 18                   [YOUR TURN] │
├──────────────────────────────────────────────────────────┤
│  MY ROSTER                                               │
│  [QB][QB][RB][RB][RB][RB][WR][WR][WR][WR][WR][TE][__]   │
│   ▲ Position-colored mini squares showing drafted slots  │
├──────────────────────────────────────────────────────────┤
│  NEEDS: 1 TE • 5 FLEX                                    │
│  ━━━━━━━━━━━━━━━━━━━━━●━━━━━━━━━━━━━  Round 7/18        │
└──────────────────────────────────────────────────────────┘
```

#### 2. Expanded State (Tap to Expand)
Height: ~380px - Full context without leaving the list

```
┌──────────────────────────────────────────────────────────┐
│  TopDog International III                    ⏰ 4h 23m   │
│  Pick 7.04 • Round 7 of 18                   [YOUR TURN] │
├──────────────────────────────────────────────────────────┤
│  MY ROSTER (12 picks)                                    │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┐                  │
│  │ J.  │ L.  │ B.  │ J.  │ K.  │ C.  │                  │
│  │Allen│Jack │Robn │Gibs │Will │Lamb │  +6 more         │
│  │ QB  │ QB  │ RB  │ RB  │ RB  │ WR  │                  │
│  └─────┴─────┴─────┴─────┴─────┴─────┘                  │
├──────────────────────────────────────────────────────────┤
│  RECENT ACTIVITY                                         │
│  • 6.09  GridironGuru took Garrett Wilson (WR) - ADP 4.2│
│          ⚠️ REACH: 29 picks early                        │
│  • 6.10  FFChampion took Amon-Ra St. Brown (WR)         │
│  • 6.11  DragonSlayer took David Njoku (TE) - ADP 9.1   │
│          💎 STEAL: Available 26 picks late               │
├──────────────────────────────────────────────────────────┤
│  TOP AVAILABLE AT NEED                                   │
│  TE: Dalton Kincaid (6.2), Sam LaPorta (7.1)            │
├──────────────────────────────────────────────────────────┤
│  [ Enter Draft ]              [ Quick Pick: Kincaid ]    │
└──────────────────────────────────────────────────────────┘
```

---

## Feature Specifications

### Feature 1: My Roster Strip
**Purpose:** Instant visual recall of who you've drafted in THIS draft

**Implementation:**
```tsx
// Compact visualization showing position slots
<MyRosterStrip
  picks={draft.myPicks}       // Array of drafted players
  rosterSize={18}             // Total slots
  showPlayerInitials={false}  // Collapsed: just colors
/>
```

**Visual Design:**
- 18 small squares (one per roster slot)
- Each square colored by position: QB pink, RB green, WR gold, TE purple
- Empty slots shown as dark gray with subtle border
- Hover/tap on square shows player name tooltip
- Supports both compact (collapsed) and detailed (expanded) modes

**Data Required:**
```typescript
interface MyPick {
  slotIndex: number;        // 0-17
  player: {
    name: string;
    position: 'QB' | 'RB' | 'WR' | 'TE';
    team: string;
  };
  pickNumber: number;       // Overall pick (e.g., 1.07 = 7)
  round: number;
}
```

### Feature 2: Position Needs Indicator
**Purpose:** At-a-glance understanding of roster construction needs

**Implementation:**
```tsx
<PositionNeedsIndicator
  currentRoster={draft.myPicks}
  recommendedLimits={POSITION_LIMITS}
/>
```

**Logic:**
- Compare current roster composition to recommended limits
- Show "NEEDS: 1 TE • 5 FLEX" style indicator
- Color-code urgency:
  - Red: Below minimum (e.g., 0 TEs drafted by round 10)
  - Yellow: Approaching minimum
  - Green: Within recommended range

### Feature 3: Notable Events Feed
**Purpose:** Surface interesting draft activity so users don't miss key moments

**Event Types:**
1. **Reaches** - Player taken 15+ picks before ADP
2. **Steals** - Player taken 15+ picks after ADP
3. **Position Runs** - 3+ players of same position in a row
4. **Your Queue Alerts** - Player from your queue was taken
5. **Competitor Roster Alerts** - Key pickup by draft leader

**Implementation:**
```tsx
<NotablePicks
  events={draft.notableEvents}
  maxVisible={3}
  highlightQueuedPlayers={true}
/>
```

**Visual Treatment:**
- Reaches: Orange/amber warning icon, "REACH: 29 picks early"
- Steals: Teal/green gem icon, "STEAL: Available 26 picks late"
- Queue alerts: Red alert icon, "⚠️ Ja'Marr Chase was taken!"

### Feature 4: Smart Sorting & Filtering
**Purpose:** Help users prioritize which of their 50 drafts need attention

**Sort Options:**
1. **My Turn First** (default) - Drafts where it's your pick
2. **Picks Until Turn** - How soon you need to act
3. **Time Remaining** - Urgent picks first
4. **Draft Progress** - Early drafts first (more decisions)
5. **Recently Active** - Latest activity first

**Filter Options:**
- My Turn Only
- Drafts I'm Winning (most projected points)
- Needs Attention (position needs urgent)

**UI Implementation:**
```tsx
<FilterSortBar
  sortBy={sortOption}
  filters={activeFilters}
  onSortChange={setSortOption}
  onFilterChange={setFilters}
  draftCounts={{
    total: 47,
    myTurn: 3,
    needsAttention: 8,
  }}
/>
```

### Feature 5: Quick Actions
**Purpose:** Common actions without entering full draft room

**Actions:**
1. **Quick Pick** - If it's your turn, show top recommended pick for one-tap draft
2. **View Roster** - Expand inline to see full roster
3. **View Board** - Quick peek at draft board state
4. **Mute Draft** - Reduce notifications for low-priority drafts

**Swipe Gestures (iOS-style):**
- Swipe left: Quick Pick (if your turn) or View Roster
- Swipe right: Mute/Unmute draft

### Feature 6: Visual Memory Anchors
**Purpose:** Help users distinguish between 50 similar-looking drafts

**Techniques:**
1. **Tournament Badges** - Visual icon/color per tournament type
2. **Draft Position Indicator** - "Picking 3rd" shown prominently
3. **Unique Identifiers** - Last 4 of draft ID or custom nickname
4. **Roster Signature** - The roster strip itself becomes a visual fingerprint

### Feature 7: Draft Health Score
**Purpose:** Quick assessment of how the draft is going

**Calculation:**
```typescript
function calculateDraftHealth(draft: SlowDraft): DraftHealth {
  return {
    score: 0-100,
    factors: {
      rosterBalance: 0-25,      // Good position mix
      valueCapture: 0-25,       // Picks vs ADP
      projectedPoints: 0-25,    // Overall strength
      positionNeeds: 0-25,      // Met minimums
    },
    trend: 'improving' | 'stable' | 'declining',
  };
}
```

**Visual Treatment:**
- Circular progress indicator with color (red/yellow/green)
- Small trend arrow (↑↓→)
- Tap to see breakdown

---

## Data Layer Requirements

### Enhanced Draft Data Model
```typescript
interface SlowDraftEnhanced extends LiveDraft {
  // Existing fields inherited...

  // New fields for slow draft features
  myPicks: MyPick[];                    // Full roster with details
  recentPicks: RecentPick[];            // Last 10-15 picks
  notableEvents: NotableEvent[];        // Reaches, steals, alerts
  positionCounts: PositionCounts;       // {QB: 2, RB: 4, WR: 5, TE: 1}
  draftHealth?: DraftHealth;            // Optional health score
  topAvailable?: TopAvailable;          // Best available at each position
  queueAlerts?: QueueAlert[];           // Queued players that were taken
}

interface RecentPick {
  pickNumber: number;
  round: number;
  pickInRound: number;
  player: DraftPlayer;
  drafter: {
    id: string;
    name: string;
    isCurrentUser: boolean;
  };
  timestamp: number;
  adpDelta?: number;                    // + means reach, - means steal
}

interface NotableEvent {
  type: 'reach' | 'steal' | 'position_run' | 'queue_alert' | 'competitor_alert';
  pickNumber: number;
  description: string;
  severity: 'info' | 'warning' | 'alert';
  player?: DraftPlayer;
  timestamp: number;
}
```

### API Endpoints Needed
```typescript
// Batch fetch for slow drafts list
GET /api/drafts/slow?include=myPicks,recentPicks,notableEvents

// Individual draft detail (for expansion)
GET /api/drafts/{id}/enhanced

// Quick pick action
POST /api/drafts/{id}/quick-pick
Body: { playerId: string }

// Mute/unmute draft
PATCH /api/drafts/{id}/preferences
Body: { muted: boolean }
```

---

## Animation & Interaction Design

### Card Expansion Animation
```typescript
const EXPAND_ANIMATION = {
  duration: 250,                    // ms
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',  // Material ease-out
  stagger: 50,                      // Stagger child elements
};
```

### Swipe Gesture Specs
```typescript
const SWIPE_CONFIG = {
  threshold: 80,                    // px before action triggers
  resistance: 0.5,                  // Rubber band effect
  velocityThreshold: 0.3,           // Instant trigger on fast swipe
};
```

### Micro-interactions
1. **Roster strip build** - Squares animate in sequence when card appears
2. **Timer urgency** - Pulse animation when < 1 hour remaining
3. **New pick notification** - Brief glow on recent activity item
4. **Position needs warning** - Subtle shake on urgent needs

---

## Performance Considerations

### Virtualization
With 50+ drafts, must virtualize the list:
```tsx
<VirtualizedList
  itemCount={drafts.length}
  itemHeight={getItemHeight}        // Dynamic based on expanded state
  overscanCount={3}
  renderItem={renderDraftCard}
/>
```

### Data Fetching Strategy
```typescript
// Initial load: Fetch minimal data for all drafts
const minimalFields = ['id', 'tournamentName', 'status', 'pickNumber', 'timeLeft'];

// On scroll into view: Fetch enhanced data
const enhancedFields = ['myPicks', 'recentPicks', 'notableEvents'];

// On expansion: Fetch full detail
const fullFields = ['board', 'allParticipants', 'queue'];
```

### Caching
- Cache my picks per draft (rarely changes)
- Cache notable events with 30s TTL
- Invalidate on WebSocket pick event

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal:** New card layout with roster strip and position needs

**Tasks:**
1. Create SlowDraftsTabVX2 component structure
2. Implement MyRosterStrip component
3. Implement PositionNeedsIndicator component
4. Create collapsed card layout
5. Add sort/filter bar (sort only initially)
6. Update data hooks for enhanced data

**Deliverable:** Visually distinct slow draft cards with roster visualization

### Phase 2: Intelligence (Week 2)
**Goal:** Notable events and draft health

**Tasks:**
1. Implement notable events detection logic
2. Create NotablePicks component
3. Implement draft health calculation
4. Add draft health visual indicator
5. Implement expanded card view
6. Add card expansion animation

**Deliverable:** Rich mini-dashboard with activity feed

### Phase 3: Actions (Week 3)
**Goal:** Quick actions and interactivity

**Tasks:**
1. Implement swipe gesture handler
2. Create QuickActions component
3. Implement quick pick flow
4. Add mute/unmute functionality
5. Implement filter options
6. Performance optimization (virtualization)

**Deliverable:** Fully interactive slow drafts experience

### Phase 4: Polish (Week 4)
**Goal:** Premium feel and edge cases

**Tasks:**
1. Micro-interaction animations
2. Empty/loading/error states
3. Accessibility audit
4. Performance profiling
5. Edge case handling
6. User testing feedback integration

**Deliverable:** Production-ready feature

---

## Visual Design Specifications

### Colors (Aligned with Draft Room)
```typescript
const SLOW_DRAFT_COLORS = {
  // Position colors (locked)
  positions: {
    QB: '#F472B6',
    RB: '#0fba80',
    WR: '#FBBF25',
    TE: '#7C3AED',
    empty: '#374151',
  },

  // Card states
  card: {
    default: '#1f2937',
    yourTurn: 'tiled-blue-pattern',
    urgent: '#7f1d1d',           // Deep red for < 30min
  },

  // Events
  events: {
    reach: '#F59E0B',           // Amber
    steal: '#10B981',           // Green
    alert: '#EF4444',           // Red
    info: '#6B7280',            // Gray
  },

  // Health score
  health: {
    excellent: '#10B981',       // 80-100
    good: '#3B82F6',            // 60-79
    fair: '#F59E0B',            // 40-59
    poor: '#EF4444',            // 0-39
  },
};
```

### Typography
```typescript
const SLOW_DRAFT_TYPOGRAPHY = {
  tournamentName: {
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: '-0.01em',
  },
  pickInfo: {
    fontSize: 13,
    fontWeight: 500,
    color: TEXT_COLORS.secondary,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: TEXT_COLORS.muted,
  },
  playerName: {
    fontSize: 12,
    fontWeight: 600,
  },
  eventDescription: {
    fontSize: 12,
    fontWeight: 400,
    color: TEXT_COLORS.secondary,
  },
};
```

### Spacing
```typescript
const SLOW_DRAFT_SPACING = {
  cardPadding: 16,
  sectionGap: 12,
  rosterSquareSize: 24,         // Collapsed
  rosterSquareGap: 4,
  expandedPlayerCardSize: 64,
  expandedPlayerCardGap: 8,
};
```

---

## Success Metrics

### User Experience
- **Time to find specific draft:** < 3 seconds (vs current ~10s scanning)
- **Recall accuracy:** Users can identify draft by roster strip in 50-draft list
- **Action completion:** 40% of picks made via quick-pick without entering room

### Engagement
- **Session length increase:** Users spend more time in app managing slow drafts
- **Return rate:** Higher daily active rate during slow draft season
- **Feature adoption:** 80% of slow draft users use expanded view

### Business
- **Competitive differentiation:** Users choose TopDog for slow drafts over Underdog
- **Retention:** Slow draft users have higher 30-day retention
- **NPS improvement:** Slow draft-specific satisfaction increase

---

## Risk Assessment

### Technical Risks
1. **Data fetching complexity** - Mitigation: Incremental loading, caching
2. **Performance with 50+ cards** - Mitigation: Virtualization, lazy loading
3. **Real-time updates** - Mitigation: WebSocket batching, optimistic UI

### UX Risks
1. **Information overload** - Mitigation: Progressive disclosure, collapsed default
2. **Learning curve** - Mitigation: Onboarding tooltips, intuitive defaults
3. **Gesture conflicts** - Mitigation: Clear affordances, haptic feedback

---

## Appendix: Competitive Analysis

### Underdog Fantasy (Slow Drafts)
**Weaknesses we exploit:**
- Basic list view with minimal context
- Must enter draft room to see roster
- No activity feed or notable events
- No quick actions
- No visual differentiation between drafts

### Sleeper
**What they do well:**
- Good notification system
- Social features
- Clean UI

**What we can beat:**
- More information density
- Better visual memory hooks
- Superior position visualization

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Design mockups** in Figma based on specs above
3. **API contract** finalization with backend team
4. **Sprint planning** for Phase 1
5. **User testing** recruitment for beta feedback

---

*Plan Version: 1.0*
*Author: Claude*
*Date: January 16, 2026*
