# Playoff Team Tab Sandbox - Development Plan

**Last Updated:** 2025-01-XX  
**Status:** Planning  
**Purpose:** Isolated development environment for playoff team tab features

---

## Overview

Create a sandbox environment for developing and testing playoff team tab features without affecting production code. This allows for:
- Rapid iteration on UI/UX
- Testing with various playoff scenarios
- Isolated development without breaking existing features
- Easy sharing and review of work-in-progress

---

## Sandbox Structure

### 1. Route/Page
**Location:** `/testing-grounds/playoff-teams` or `/dev/playoff-teams`

**Purpose:**
- Standalone page for playoff tab development
- No dependencies on production team tab
- Easy to access and share

### 2. Mock Data Generator
**Location:** `lib/mockData/playoffTeams.ts` or `components/dev/playoffSandbox/mockData.ts`

**Purpose:**
- Generate realistic playoff pod scenarios
- Configurable parameters (number of teams, weeks, etc.)
- Various edge cases (drawing dead, close races, etc.)

### 3. UI Components (Isolated)
**Location:** `components/dev/playoffSandbox/` or `components/vx2/tabs/my-teams/playoff/`

**Purpose:**
- Playoff-specific components developed in isolation
- Can be integrated into main tab later
- Reusable across different views

### 4. Development Tools
**Location:** `components/dev/playoffSandbox/tools/`

**Purpose:**
- Data manipulation tools
- Scenario switcher
- Debug panels
- Performance monitoring

---

## Implementation Plan

### Phase 1: Basic Sandbox Setup

#### 1.1 Create Sandbox Page
```typescript
// pages/testing-grounds/playoff-teams.tsx or pages/dev/playoff-teams.tsx

import React from 'react';
import PlayoffTeamsSandbox from '../../components/dev/playoffSandbox/PlayoffTeamsSandbox';

export default function PlayoffTeamsSandboxPage() {
  return <PlayoffTeamsSandbox />;
}
```

**Features:**
- Standalone page
- No auth required (or dev-only auth)
- Clear "SANDBOX" banner/indicator
- Link from dev menu

#### 1.2 Mock Data Generator
```typescript
// lib/mockData/playoffTeams.ts

interface PlayoffPodConfig {
  podId: string;
  podName: string;
  week: number; // 15, 16, or 17
  advancementCriteria: 'top2' | 'top4' | 'pointsThreshold';
  teams: number; // 12 (user + 11 opponents)
  includeDrawingDead?: boolean;
  includeCloseRace?: boolean;
  includeLockedIn?: boolean;
}

interface PlayoffTeam {
  id: string;
  name: string;
  userId?: string; // null for opponents
  currentPoints: number;
  rank: number;
  projectedPoints: number;
  bestCaseTotal: number;
  bestCaseRank: number;
  players: PlayoffPlayer[];
  playoffMatchups: {
    week15?: { opponentId: string; opponentName: string };
    week16?: { opponentId: string; opponentName: string };
    week17?: { opponentId: string; opponentName: string };
  };
}

export function generatePlayoffPod(config: PlayoffPodConfig): PlayoffPod {
  // Generate realistic playoff pod data
  // Include various scenarios based on config flags
}

export function generateMultiplePods(count: number): PlayoffPod[] {
  // Generate multiple pods for testing navigation
}
```

**Scenarios to Generate:**
- **Drawing Dead Scenario:** Teams that cannot advance
- **Close Race:** Teams very close in points
- **Locked In:** Teams that have clinched advancement
- **Mixed:** Combination of above scenarios
- **Edge Cases:** Ties, single point differences, etc.

#### 1.3 Basic UI Shell
```typescript
// components/dev/playoffSandbox/PlayoffTeamsSandbox.tsx

export default function PlayoffTeamsSandbox() {
  const [selectedPod, setSelectedPod] = useState<PlayoffPod | null>(null);
  const [scenario, setScenario] = useState<ScenarioType>('default');
  
  const pods = useMemo(() => {
    return generatePlayoffPods(scenario);
  }, [scenario]);
  
  return (
    <div className="playoff-sandbox">
      <SandboxHeader />
      <ScenarioSelector scenario={scenario} onChange={setScenario} />
      <PlayoffPodList pods={pods} onSelectPod={setSelectedPod} />
      {selectedPod && (
        <PlayoffPodView pod={selectedPod} />
      )}
    </div>
  );
}
```

### Phase 2: Core Components

#### 2.1 Pod List View
**Component:** `PlayoffPodList.tsx`

**Features:**
- List of all pods user is in
- Quick stats per pod (rank, points, best case)
- Filter by week (15, 16, 17)
- Search/filter pods
- Click to view pod details

**Props:**
```typescript
interface PlayoffPodListProps {
  pods: PlayoffPod[];
  onSelectPod: (pod: PlayoffPod) => void;
  selectedPodId?: string;
}
```

#### 2.2 Pod Detail View
**Component:** `PlayoffPodDetail.tsx`

**Features:**
- Show all 12 teams in pod
- Current standings
- Best case totals and ranks
- Points needed calculations
- Quick actions (view matchup, etc.)

**Props:**
```typescript
interface PlayoffPodDetailProps {
  pod: PlayoffPod;
  userTeam: PlayoffTeam;
  onViewMatchup: (opponentId: string) => void;
}
```

#### 2.3 Opponent List/Table
**Component:** `OpponentList.tsx`

**Features:**
- Table/list of all 11 opponents
- Sortable columns (rank, points, best case, overlap)
- Filterable
- Quick actions per opponent
- Compact but informative

**Props:**
```typescript
interface OpponentListProps {
  opponents: PlayoffTeam[];
  userTeam: PlayoffTeam;
  onViewMatchup: (opponentId: string) => void;
  onViewOverlap: (opponentId: string) => void;
}
```

#### 2.4 Matchup Detail View
**Component:** `MatchupDetailView.tsx`

**Features:**
- Side-by-side player comparison
- Shared players section
- Live game updates
- Status indicators
- Win probability (best case)
- Navigation between opponents

**Props:**
```typescript
interface MatchupDetailViewProps {
  userTeam: PlayoffTeam;
  opponent: PlayoffTeam;
  week: number;
  onNextOpponent: () => void;
  onPrevOpponent: () => void;
  onBack: () => void;
}
```

### Phase 3: Development Tools

#### 3.1 Scenario Switcher
**Component:** `ScenarioSwitcher.tsx`

**Features:**
- Dropdown to switch between scenarios
- Pre-configured scenarios:
  - "Default" - Balanced pod
  - "Drawing Dead" - Some teams drawing dead
  - "Close Race" - Very close points
  - "Locked In" - Some teams clinched
  - "Mixed" - Combination
  - "Edge Cases" - Ties, single point differences
- Custom scenario builder (future)

#### 3.2 Data Manipulator
**Component:** `DataManipulator.tsx`

**Features:**
- Adjust points for any team
- Add/remove players
- Change rankings
- Modify best case totals
- Reset to original
- Export current state

#### 3.3 Debug Panel
**Component:** `DebugPanel.tsx`

**Features:**
- Show raw data
- Show calculations (best case, drawing dead logic)
- Performance metrics
- Component tree
- State inspector

#### 3.4 Performance Monitor
**Component:** `PerformanceMonitor.tsx`

**Features:**
- Render time tracking
- Re-render counts
- Memory usage
- Network requests (if applicable)

### Phase 4: Integration Points

#### 4.1 Data Adapter
**Component:** `PlayoffDataAdapter.ts`

**Purpose:**
- Convert mock data format to real data format (when ready)
- Or convert real data to mock format for testing
- Abstract data layer so components work with both

```typescript
export function adaptMockDataToReal(mockPod: MockPlayoffPod): RealPlayoffPod {
  // Convert mock format to real API format
}

export function adaptRealDataToMock(realPod: RealPlayoffPod): MockPlayoffPod {
  // Convert real API format to mock format
}
```

#### 4.2 Component Export
**Location:** `components/vx2/tabs/my-teams/playoff/index.ts`

**Purpose:**
- Export playoff components for integration
- Clean API for main team tab
- Version control for components

```typescript
export { PlayoffPodList } from './PlayoffPodList';
export { PlayoffPodDetail } from './PlayoffPodDetail';
export { OpponentList } from './OpponentList';
export { MatchupDetailView } from './MatchupDetailView';
```

---

## File Structure

```
components/
  dev/
    playoffSandbox/
      PlayoffTeamsSandbox.tsx          # Main sandbox container
      ScenarioSwitcher.tsx             # Switch between scenarios
      DataManipulator.tsx              # Adjust data for testing
      DebugPanel.tsx                   # Debug tools
      PerformanceMonitor.tsx           # Performance tracking
      
  vx2/
    tabs/
      my-teams/
        playoff/                       # Playoff components (for integration)
          PlayoffPodList.tsx
          PlayoffPodDetail.tsx
          OpponentList.tsx
          MatchupDetailView.tsx
          SharedPlayersList.tsx
          BestCaseDisplay.tsx
          index.ts                     # Exports

lib/
  mockData/
    playoffTeams.ts                    # Mock data generator
    playoffScenarios.ts                # Pre-configured scenarios

pages/
  testing-grounds/
    playoff-teams.tsx                  # Sandbox page route
```

---

## Mock Data Scenarios

### Scenario 1: Default Pod
- 12 teams, balanced points spread
- User team in middle (rank 6)
- Mix of teams that can/can't advance
- Realistic player data

### Scenario 2: Drawing Dead
- Some teams clearly drawing dead (best case rank > advancement threshold)
- User team may or may not be drawing dead
- Clear separation between teams

### Scenario 3: Close Race
- All teams very close in points
- Small differences in best case totals
- User team in contention

### Scenario 4: Locked In
- Some teams have clinched advancement
- User team may be locked in or fighting for spot
- Clear winners and losers

### Scenario 5: Mixed
- Combination of all above scenarios
- Realistic playoff pod with various situations

### Scenario 6: Edge Cases
- Tied points
- Single point differences
- Teams with same best case totals
- Maximum/minimum values

---

## Development Workflow

### 1. Start Development
```bash
# Navigate to sandbox
http://localhost:3000/testing-grounds/playoff-teams

# Or add to dev menu
```

### 2. Select Scenario
- Use scenario switcher to load different test data
- Or use data manipulator to customize

### 3. Develop Components
- Build components in isolation
- Test with various scenarios
- Use debug panel to inspect state

### 4. Test Navigation
- Test switching between pods
- Test viewing different opponents
- Test all user flows

### 5. Performance Testing
- Use performance monitor
- Test with large datasets (many pods, many teams)
- Optimize as needed

### 6. Integration Prep
- Use data adapter to test with real data format
- Export components for integration
- Document integration steps

---

## Testing Checklist

### Functional Testing
- [ ] Pod list displays correctly
- [ ] Pod detail shows all teams
- [ ] Opponent list shows all 11 opponents
- [ ] Matchup view shows side-by-side comparison
- [ ] Shared players displayed correctly
- [ ] Best case calculations accurate
- [ ] Navigation works (between pods, opponents)
- [ ] Sorting works (rank, points, best case, overlap)
- [ ] Filtering works
- [ ] All scenarios render correctly

### Edge Cases
- [ ] Tied points handled
- [ ] Single point differences
- [ ] Drawing dead teams (best case rank > threshold)
- [ ] Locked in teams (clinched advancement)
- [ ] Teams with no shared players
- [ ] Teams with many shared players
- [ ] Empty pods (shouldn't happen, but test)
- [ ] Missing data handled gracefully

### Performance
- [ ] Renders quickly with 12 teams
- [ ] Smooth scrolling through opponents
- [ ] No lag when switching scenarios
- [ ] Efficient re-renders
- [ ] Memory usage reasonable

### UI/UX
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Touch targets appropriate size
- [ ] Clear visual hierarchy
- [ ] Status indicators clear
- [ ] Navigation intuitive
- [ ] Loading states handled
- [ ] Error states handled

---

## Integration Plan

### Step 1: Component Maturity
- Components fully developed in sandbox
- All scenarios tested
- Performance optimized

### Step 2: Data Integration
- Create data adapter for real API
- Test with real data format
- Handle API differences

### Step 3: Integration into Main Tab
- Add playoff detection logic
- Conditionally show playoff view vs. regular view
- Integrate navigation

### Step 4: Testing
- Test with real playoff data
- User testing
- Bug fixes

### Step 5: Production
- Deploy to production
- Monitor performance
- Gather feedback

---

## Documentation

### For Developers
- How to use sandbox
- How to add new scenarios
- How to create new components
- How to integrate components

### For Designers
- How to view designs in sandbox
- How to test different scenarios
- How to provide feedback

### For QA
- How to test features
- What scenarios to test
- Known issues/limitations

---

## Next Steps

1. **Create Sandbox Page** - Basic route and shell
2. **Mock Data Generator** - Generate realistic playoff data
3. **Basic Components** - Pod list, pod detail, opponent list
4. **Development Tools** - Scenario switcher, debug panel
5. **Iterate** - Build out features, test, refine
6. **Integrate** - When ready, integrate into main tab

---

**Status:** Ready for implementation  
**Priority:** High - Enables rapid playoff tab development

