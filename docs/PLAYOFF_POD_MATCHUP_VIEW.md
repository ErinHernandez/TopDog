# Playoff Pod Matchup View - Design

**Last Updated:** 2025-01-XX  
**Status:** Design & Planning  
**Context:** Playoff pod with 11 opponents (user + 11 opponents = 12 teams total)

---

## Design Goals

1. **Quick Understanding:** See all 11 opponents at a glance
2. **Matchup Details:** Drill down to see player-by-player comparison
3. **Navigation:** Easy to switch between opponents
4. **Key Data:** Show current scores, projected, best case, overlap, chances

---

## Competitor Analysis

### What They Do Well (Single Opponent):
- Side-by-side team comparison
- Current vs. projected scores
- Win probability visualization
- Player-by-player breakdown
- Live game updates
- Status indicators (Out, Doubtful)

### What We Need (11 Opponents):
- Show all 11 opponents in one view
- Quick comparison across all opponents
- Ability to drill down to detailed matchup
- Show overlap (shared players) for each opponent
- Show chances data (best case, etc.)

---

## Design Options

### Option A: List View with Expandable Details

**Layout:**
```
Playoff Pod - Week 15 (Top 2 Advance)
Your Team: "A Goofy Team" - 250 pts (Rank: 1)

Opponents (11):
─────────────────────────────────────────────
┌──────────────────────────────────────────┐
│ Opponent 1: "Team Alpha"                 │
│ 245 pts (Rank: 2) | Best: 390 | Overlap: 3│
│ [View Matchup] [Best Case: 2nd]          │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ Opponent 2: "Team Beta"                  │
│ 240 pts (Rank: 3) | Best: 375 | Overlap: 5│
│ [View Matchup] [Best Case: 3rd]          │
└──────────────────────────────────────────┘

... (9 more opponents)
```

**Pros:**
- See all opponents at once
- Compact, scrollable list
- Quick actions to view details

**Cons:**
- Less visual comparison
- Need to scroll to see all
- Less "matchup" feel

### Option B: Grid View with Cards

**Layout:**
```
Playoff Pod - Week 15 (Top 2 Advance)
Your Team: "A Goofy Team" - 250 pts (Rank: 1)

[Filter: All | Can Advance | Drawing Dead]

┌──────────┐ ┌──────────┐ ┌──────────┐
│ Team A   │ │ Team B   │ │ Team C   │
│ 245 pts  │ │ 240 pts  │ │ 235 pts  │
│ Rank: 2  │ │ Rank: 3  │ │ Rank: 4  │
│ Best:390 │ │ Best:375 │ │ Best:370 │
│ Over: 3  │ │ Over: 5  │ │ Over: 2  │
│ [Matchup]│ │ [Matchup]│ │ [Matchup]│
└──────────┘ └──────────┘ └──────────┘
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Team D   │ │ Team E   │ │ Team F   │
│ ...      │ │ ...      │ │ ...      │
└──────────┘ └──────────┘ └──────────┘
... (5 more cards)
```

**Pros:**
- Visual grid, easy to scan
- Can see multiple at once
- Good for quick comparison

**Cons:**
- Takes more space
- May need multiple rows
- Less detail visible

### Option C: Hybrid - Summary + Detail View (Recommended)

**Main View: Compact Opponent List**
```
Playoff Pod - Week 15 (Top 2 Advance)
Your Team: "A Goofy Team" - 250 pts (Rank: 1)

[Sort: Rank | Points | Best Case | Overlap]

Opponents (11):
─────────────────────────────────────────────
Rank  Points  Best Case  Overlap  Actions
─────────────────────────────────────────────
2     245     390 (2nd)   3      [Matchup ▼]
3     240     375 (3rd)   5      [Matchup ▼]
4     235     370 (4th)   2      [Matchup ▼]
5     230     365 (5th)   4      [Matchup ▼]
... (7 more)
```

**Expanded Matchup View (Like Competitor):**
When clicking "Matchup" or expanding row, show detailed side-by-side:

```
┌─────────────────────────────────────────────────┐
│ Your Team: "A Goofy Team"                       │
│ 250 pts | Projected: 400 | Best: 400 (1st)      │
│                                 vs               │
│ Opponent: "Team Alpha"                          │
│ 245 pts | Projected: 390 | Best: 390 (2nd)     │
└─────────────────────────────────────────────────┘

Shared Players (3):
• J. Chase (CIN) - You: 21.3 pts | Them: 17.0 pts
• C. McCaffrey (SF) - You: 26.2 pts | Them: 28.5 pts
• T. Hockenson (MIN) - You: 17.2 pts | Them: 15.8 pts

STARTERS                    WEEK 15
─────────────────────────────────────────────────
Your Team              Opponent: Team Alpha
─────────────────────────────────────────────────
QB  J. Herbert (LAC)   QB  J. Burrow (CIN)
    21.3 pts (↑29.6)       17.0 pts (17.3)
    NE, 21-7 15:00 2nd     @PIT, 34-17 3:30 3rd

RB  B. Hall (NYJ)      RB  C. McCaffrey (SF)
    5.0 pts (↑7.5)         26.2 pts (↑35.1)
    @GB, 0-17 3:30 2nd     KC, 49-0 10:21 1st
    [OUT]                   [Shared Player]

RB  D. Montgomery      RB  B. Irving (TB)
    0.3 pts (↓3.6)         7.5 pts (↓9.2)
    BUF, 7-12 5:28 1st     @NYG, 19-24 8:29 4th

WR  J. Jennings (SF)   WR  J. Meyers (LV)
    7.5 pts (↑14.7)        0.5 pts (↓1.2)
    KC, 49-0 10:21 1st     DAL, 21-7 15:00 2nd
                          [DOUBTFUL]

WR  J. Chase (CIN)     WR  T. Hunter (JAX)
    21.3 pts (↑33.6)       - pts (11.2)
    @PIT, 34-17 3:30 3rd   WAS, Thu 7:00 PM
    [Shared Player]        [Not Started]

TE  T. Hockenson       TE  M. Andrews (BAL)
    17.2 pts (↑29.6)       - pts (11.2)
    CHI, 23-2 11:28 2nd    @CLE, Mon 5:00 PM
    [Shared Player]

FL  M. Evans (TB)      FL  M. Harrison Jr.
    10.5 pts               - pts
    @NYG, 19-24 8:29 4th   ARI, Sun 1:00 PM
```

**Pros:**
- ✅ Quick overview of all 11 opponents
- ✅ Detailed matchup view when needed
- ✅ Shows overlap clearly
- ✅ Shows chances data (best case)
- ✅ Similar to competitor's detailed view
- ✅ Easy navigation

**Cons:**
- Need to expand to see details
- May need to scroll through 11 opponents

---

## Recommended Design: Hybrid Approach

### 1. Main Pod View (All 11 Opponents)

**Layout:**
```
Playoff Pod - Week 15
Your Team: "A Goofy Team" - 250 pts (Rank: 1)
Advancement: Top 2 teams

[Sort: Rank ▼] [Filter: All ▼]

Opponents (11):
┌────────────────────────────────────────────────────┐
│ Rank  Team Name        Points  Best Case  Overlap │
├────────────────────────────────────────────────────┤
│  2    Team Alpha       245     390 (2nd)    3     │
│       [Matchup] [Best: 2nd] [Shared: 3 players]   │
├────────────────────────────────────────────────────┤
│  3    Team Beta        240     375 (3rd)    5     │
│       [Matchup] [Best: 3rd] [Shared: 5 players]   │
├────────────────────────────────────────────────────┤
│  4    Team Gamma       235     370 (4th)    2     │
│       [Matchup] [Best: 4th] [Shared: 2 players]   │
│ ... (8 more)                                        │
└────────────────────────────────────────────────────┘
```

**Features:**
- Sortable columns (Rank, Points, Best Case, Overlap)
- Filter by status (if needed)
- Quick actions: View Matchup, See Overlap
- Compact but informative

### 2. Detailed Matchup View (Single Opponent)

**Layout (Similar to Competitor):**
```
← Back to Pod View

Matchup: Your Team vs. Team Alpha
Week 15 | Top 2 Advance

┌─────────────────────────────────────────────────┐
│ Your Team: "A Goofy Team"                       │
│ 250 pts | Projected: 400 | Best: 400 (1st)      │
│                                 vs               │
│ Opponent: "Team Alpha"                          │
│ 245 pts | Projected: 390 | Best: 390 (2nd)     │
└─────────────────────────────────────────────────┘

Win Probability (Best Case):
[████████████░░░░] 60% (Your Best: 400 vs. Their Best: 390)

Shared Players (3):
┌─────────────────────────────────────────────────┐
│ J. Chase (CIN)                                  │
│ You: 21.3 pts (↑33.6) | Them: 17.0 pts (17.3)  │
│ @PIT, 34-17 3:30 3rd                            │
├─────────────────────────────────────────────────┤
│ C. McCaffrey (SF)                               │
│ You: 26.2 pts (↑35.1) | Them: 28.5 pts (↑30.2) │
│ KC, 49-0 10:21 1st                              │
├─────────────────────────────────────────────────┤
│ T. Hockenson (MIN)                              │
│ You: 17.2 pts (↑29.6) | Them: 15.8 pts (↑18.4)  │
│ CHI, 23-2 11:28 2nd                              │
└─────────────────────────────────────────────────┘

STARTERS                    WEEK 15
─────────────────────────────────────────────────
Your Team              Opponent: Team Alpha
─────────────────────────────────────────────────
QB  J. Herbert (LAC)   QB  J. Burrow (CIN)
    21.3 pts (↑29.6)       17.0 pts (17.3)
    NE, 21-7 15:00 2nd     @PIT, 34-17 3:30 3rd

RB  B. Hall (NYJ)      RB  C. McCaffrey (SF)
    5.0 pts (↑7.5)         26.2 pts (↑35.1)
    @GB, 0-17 3:30 2nd     KC, 49-0 10:21 1st
    [OUT]                   [Shared Player]

RB  D. Montgomery      RB  B. Irving (TB)
    0.3 pts (↓3.6)         7.5 pts (↓9.2)
    BUF, 7-12 5:28 1st     @NYG, 19-24 8:29 4th

WR  J. Jennings (SF)   WR  J. Meyers (LV)
    7.5 pts (↑14.7)        0.5 pts (↓1.2)
    KC, 49-0 10:21 1st     DAL, 21-7 15:00 2nd
                          [DOUBTFUL]

WR  J. Chase (CIN)     WR  T. Hunter (JAX)
    21.3 pts (↑33.6)       - pts (11.2)
    @PIT, 34-17 3:30 3rd   WAS, Thu 7:00 PM
    [Shared Player]        [Not Started]

TE  T. Hockenson       TE  M. Andrews (BAL)
    17.2 pts (↑29.6)       - pts (11.2)
    CHI, 23-2 11:28 2nd    @CLE, Mon 5:00 PM
    [Shared Player]

FL  M. Evans (TB)      FL  M. Harrison Jr.
    10.5 pts               - pts
    @NYG, 19-24 8:29 4th   ARI, Sun 1:00 PM
```

**Features:**
- Side-by-side player comparison (like competitor)
- Live game updates
- Status indicators (Out, Doubtful, Not Started)
- Shared players highlighted
- Points with trend arrows
- Win probability based on best case
- Back button to return to pod view

### 3. Quick Actions

**From Main Pod View:**
- Tap opponent row → Expand to show quick matchup summary
- Tap "Matchup" → Full detailed matchup view
- Tap "Shared: X players" → Show overlap list
- Swipe left/right → Navigate between opponents

**From Detailed Matchup View:**
- Swipe left/right → Navigate to next/previous opponent
- Back button → Return to pod view
- Share button → Share matchup

---

## Key Differences from Competitor

1. **11 Opponents vs. 1:** Show all opponents in list, drill down to details
2. **Playoff Context:** Show best case totals, ranks, advancement chances
3. **Overlap Focus:** Highlight shared players prominently
4. **Navigation:** Easy switching between 11 opponents
5. **Pod-Level View:** See entire pod situation, not just one matchup

---

## Implementation Considerations

### Data Requirements
- Current points for all 12 teams in pod
- Projected points for all teams
- Best case totals for all teams
- Player rosters for all teams
- Live game data (scores, time remaining)
- Player status (Out, Doubtful, etc.)
- Shared players between user and each opponent

### UI Components Needed
- Pod summary header (your team, advancement criteria)
- Opponent list/table (sortable, filterable)
- Expandable matchup cards
- Detailed matchup view (side-by-side)
- Shared players section
- Navigation controls (swipe, back, next/prev)

### Performance
- Lazy load detailed matchup data
- Cache opponent data
- Efficient rendering of 11+ opponent rows
- Smooth scrolling and navigation

---

## Next Steps

1. **UI Mockups:** Create detailed mockups for both views
2. **Data Model:** Define data structure for pod matchups
3. **Component Design:** Design reusable matchup components
4. **Navigation Flow:** Define user flow between views
5. **Implementation:** Build main pod view first, then detailed matchup view

---

**Status:** Ready for design refinement and implementation

