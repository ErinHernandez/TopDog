# Join Tournament Modal Enhancement Plan

## Executive Summary

This document outlines the research and preplanning for enhancing the Join Tournament modal in the VX2 lobby to match or exceed competitor standards (Underdog Fantasy). The current implementation is minimal, while competitors provide comprehensive tournament information, entry controls, and detailed rules.

---

## Current State Analysis

### Current Implementation (`components/vx2/tabs/lobby/LobbyTabVX2.tsx`)

**Current Features:**
- Basic modal with header (title + close button)
- Tournament title display
- Entry fee and 1st place prize (side-by-side)
- Simple informational message
- Cancel and Join Tournament buttons
- Loading state during join process

**Current Data Available:**
```typescript
interface Tournament {
  id: string;
  title: string;
  entryFee: string;           // "$25"
  entryFeeCents: number;      // 2500
  totalEntries: string;        // "571,480"
  currentEntries: number;      // 571480
  maxEntries: number;          // 672672
  firstPlacePrize: string;     // "$2M"
  isFeatured: boolean;
  status: 'filling' | 'full' | 'drafting' | 'complete';
  startTime?: string;
}
```

**Limitations:**
- No multi-entry support (number of entries input)
- No autopilot toggle
- No detailed tournament information (draft settings, scoring, roster)
- No "All rules" link/button
- No tournament metadata display (sport, fill %, game type, draft size, pick clock, etc.)
- No scoring rules section
- No roster requirements section
- Limited visual hierarchy and information density

---

## Competitor Analysis (Underdog Fantasy)

### Key Features Observed:

1. **Header Section:**
   - Tournament name (e.g., "Fullback Dive")
   - Subtitle (e.g., "NFL Wild Card Main Slate")
   - Icon badges (NFL, Guaranteed, Multi-entry indicators)
   - Close button (X)

2. **Primary Statistics Bar:**
   - Entry fee: "$25 Entry"
   - Entrants: "1,128 Entrants"
   - Prizes: "$25k Prizes"
   - Horizontal layout, prominent display

3. **Draft Settings Display:**
   - Pick clock: "30 seconds per pick" (button-like element)
   - Entry limit: "5 entry max - $5k to first!"

4. **Entry Controls:**
   - Number of entries input field (with min/max validation)
   - Max entries indicator: "Max: 5"
   - Autopilot toggle switch
   - Info icon next to "Number of entries" label

5. **Detailed Tournament Information:**
   - Sport: NFL
   - Fill: 6.3%
   - Game type: Draft
   - Draft size: 6
   - Pick clock: 30 seconds
   - Current entrants: 72
   - Slate: NFL Wild Card Main Slate
   - Max entries: 5
   - Draft rounds: 6
   - Rake: 10%

6. **Scoring Rules Section:**
   - Receiving Yard: 0.1 points
   - Rushing TD: 6.0 points
   - Rushing Yard: 0.1 points
   - Passing Yard: 0.04 points
   - Passing TD: 4.0 points
   - Interception: -1.0 points
   - 2-PT Conversion: 2.0 points
   - Fumble Lost: -2.0 points

7. **Roster Requirements:**
   - QB: 1 player
   - RB: 1 player
   - WR: 2 players
   - FLEX: 1 player
   - TE: 1 player

8. **Action Buttons:**
   - "All rules" button (left) - opens detailed rules modal
   - "Enter" button (right) - primary action

---

## Data Requirements

### Available in Codebase:

✅ **Already Available:**
- Entry fee (formatted and cents)
- Max entries per user
- Current/total entries
- First place prize
- Tournament title
- Tournament status

✅ **Available in Config Files:**
- Scoring rules (`lib/tournamentConfig.js`)
- Roster requirements (`lib/tournamentConfig.js`)
- Draft settings (various locations)

❌ **Needs to be Added/Extended:**
- Draft size (number of players per draft)
- Pick clock (seconds per pick)
- Fill percentage (currentEntries / maxEntries)
- Game type (Best Ball, etc.)
- Draft rounds
- Rake percentage
- Slate information (if applicable)
- Tournament subtitle/description
- Sport indicator
- Tournament badges (Guaranteed, Multi-entry, etc.)

### Tournament Type Extension Needed:

```typescript
export interface Tournament {
  // ... existing fields ...
  
  // NEW FIELDS NEEDED:
  subtitle?: string;              // "NFL Wild Card Main Slate"
  sport?: string;                  // "NFL"
  gameType?: string;              // "Best Ball", "Draft", etc.
  draftSize?: number;             // 6, 12, etc.
  pickClock?: number;              // 30 (seconds)
  draftRounds?: number;            // 6, 18, etc.
  rake?: number;                   // 10 (percentage)
  slate?: string;                  // "NFL Wild Card Main Slate"
  badges?: string[];               // ["guaranteed", "multi-entry"]
  
  // Scoring (from config or direct)
  scoring?: {
    reception?: number;
    receivingTD?: number;
    receivingYard?: number;
    rushingTD?: number;
    rushingYard?: number;
    passingYard?: number;
    passingTD?: number;
    interception?: number;
    twoPointConversion?: number;
    fumbleLost?: number;
  };
  
  // Roster (from config or direct)
  roster?: {
    QB?: number;
    RB?: number;
    WR?: number;
    TE?: number;
    FLEX?: number;
    BENCH?: number;
  };
}
```

---

## Enhancement Plan

### Phase 1: Core Information Display

**Priority: High**

1. **Enhanced Header:**
   - Add tournament subtitle/description
   - Add badge indicators (if applicable)
   - Improve visual hierarchy

2. **Statistics Bar Enhancement:**
   - Add "Entrants" count (currently only shows in title)
   - Add "Total Prizes" (if available)
   - Better visual grouping and spacing

3. **Draft Settings Display:**
   - Pick clock display (e.g., "30 seconds per pick")
   - Draft size indicator
   - Entry limit reminder (e.g., "5 entry max")

### Phase 2: Entry Controls

**Priority: High**

1. **Number of Entries Input:**
   - Number input field with min/max validation
   - Max entries indicator
   - Info tooltip/icon explaining multi-entry
   - Real-time total cost calculation (entryFee × numberOfEntries)

2. **Autopilot Toggle:**
   - Toggle switch component
   - Label: "Autopilot"
   - Visual feedback (on/off states)
   - Tooltip explaining autopilot functionality

3. **Total Cost Display:**
   - Show calculated total: "Total: $125" (if 5 entries × $25)
   - Update dynamically as entries change

### Phase 3: Detailed Information Sections

**Priority: Medium**

1. **Basic Tournament Info Section:**
   - Sport
   - Fill percentage (calculated: currentEntries / maxEntries)
   - Game type
   - Draft size
   - Pick clock
   - Current entrants
   - Max entries
   - Draft rounds
   - Rake (if applicable)

2. **Scoring Rules Section:**
   - Collapsible or always visible
   - List of scoring rules with point values
   - Clean, scannable format

3. **Roster Requirements Section:**
   - Position requirements with counts
   - Visual format (e.g., "QB: 1", "RB: 2", etc.)

### Phase 4: Rules Integration

**Priority: Medium**

1. **"All Rules" Button:**
   - Link to comprehensive rules modal/page
   - Reuse existing `TournamentRulesModal` component if available
   - Or create new rules view

2. **Rules Modal Content:**
   - Full payout structure
   - Complete scoring rules
   - Tournament advancement schedule
   - Terms and conditions
   - Maximum entries policy

### Phase 5: UX Enhancements

**Priority: Low**

1. **Visual Improvements:**
   - Better spacing and typography
   - Icon usage for key information
   - Color coding for important stats
   - Improved button styling

2. **Accessibility:**
   - ARIA labels
   - Keyboard navigation
   - Screen reader support
   - Focus management

3. **Responsive Design:**
   - Mobile optimization
   - Tablet optimization
   - Desktop optimization

---

## Component Structure

### Proposed Component Hierarchy:

```
JoinModal
├── ModalOverlay
├── ModalContainer
    ├── Header
    │   ├── Title
    │   ├── Subtitle (optional)
    │   ├── Badges (optional)
    │   └── CloseButton
    ├── StatisticsBar
    │   ├── EntryFee
    │   ├── Entrants
    │   └── Prizes
    ├── DraftSettings
    │   ├── PickClock
    │   └── EntryLimit
    ├── EntryControls
    │   ├── NumberOfEntriesInput
    │   ├── AutopilotToggle
    │   └── TotalCost
    ├── TournamentInfo (collapsible?)
    │   ├── BasicInfo
    │   ├── ScoringRules
    │   └── RosterRequirements
    └── Actions
        ├── AllRulesButton
        └── EnterButton
```

---

## Implementation Considerations

### 1. Data Source Strategy

**Option A: Extend Tournament Type**
- Add all new fields to Tournament interface
- Update mock data and API responses
- Pros: Type-safe, centralized
- Cons: Requires backend changes if using real API

**Option B: Hybrid Approach**
- Keep core Tournament type minimal
- Fetch/calculate additional data from config files
- Merge tournament data with config data in component
- Pros: Flexible, doesn't break existing code
- Cons: More complex data merging logic

**Recommendation: Option B (Hybrid)**
- Start with config-based approach
- Can migrate to Option A later when backend is ready

### 2. State Management

**Local State:**
- `numberOfEntries` (number, default: 1)
- `autopilotEnabled` (boolean, default: false)
- `isJoining` (boolean)
- `showRulesModal` (boolean)
- `expandedSections` (object, for collapsible sections)

**Calculated Values:**
- `totalCost` = `entryFeeCents × numberOfEntries`
- `fillPercentage` = `(currentEntries / maxEntries) × 100`
- `canEnter` = validation checks (balance, max entries, etc.)

### 3. Validation Logic

```typescript
const validateEntry = () => {
  // Check user balance
  if (userBalance < totalCost) {
    return { valid: false, error: 'Insufficient balance' };
  }
  
  // Check max entries
  if (numberOfEntries > tournament.maxEntries) {
    return { valid: false, error: 'Exceeds max entries' };
  }
  
  // Check min entries
  if (numberOfEntries < 1) {
    return { valid: false, error: 'Must enter at least 1 entry' };
  }
  
  return { valid: true };
};
```

### 4. Integration Points

**Existing Components to Reuse:**
- `TournamentRulesModal` (if exists) for "All rules"
- Scoring/roster data from `lib/tournamentConfig.js`
- Constants from VX2 constants files

**New Components Needed:**
- `NumberOfEntriesInput` (with validation)
- `AutopilotToggle` (reusable toggle component)
- `StatisticsBar` (reusable stats display)
- `TournamentInfoSection` (collapsible info display)

---

## Design Specifications

### Layout (Mobile-First):

```
┌─────────────────────────────┐
│ Join Tournament          [X] │ Header
├─────────────────────────────┤
│ THE TOPDOG INTERNATIONAL     │ Title
│ NFL Season-Long Tournament   │ Subtitle
├─────────────────────────────┤
│ $25     571,480    $2M       │ Stats Bar
│ Entry   Entrants   1st Place │
├─────────────────────────────┤
│ 30 seconds per pick          │ Draft Settings
│ 5 entry max - $2M to first!  │
├─────────────────────────────┤
│ Number of entries      [ℹ]  │ Entry Controls
│ [1] Max: 5                   │
│ Autopilot [Toggle]           │
│ Total: $25                   │
├─────────────────────────────┤
│ ▼ Tournament Info            │ Info Section
│ Sport: NFL                   │
│ Fill: 85.0%                  │
│ Game type: Best Ball          │
│ Draft size: 12                │
│ Pick clock: 30s               │
│ Draft rounds: 18              │
│                              │
│ Scoring Rules:                │
│ • Receiving Yard: 0.1 pts     │
│ • Rushing TD: 6.0 pts         │
│ • ...                         │
│                              │
│ Roster:                       │
│ • QB: 1                       │
│ • RB: 2                       │
│ • ...                         │
├─────────────────────────────┤
│ [All rules]  [Join Tournament]│ Actions
└─────────────────────────────┘
```

### Spacing & Sizing:

- Modal width: `w-80` (320px) on mobile, `max-w-md` (448px) on desktop
- Padding: `SPACING.lg` (16px) for content sections
- Gap between sections: `SPACING.md` (12px)
- Button height: 44px (touch target)
- Input height: 44px (touch target)

### Colors (from VX2 constants):

- Background: `BG_COLORS.secondary`
- Text primary: `TEXT_COLORS.primary`
- Text muted: `TEXT_COLORS.muted`
- Brand primary: `BRAND_COLORS.primary`
- Border: `rgba(255,255,255,0.1)`

---

## Testing Considerations

### Unit Tests:
- Entry validation logic
- Cost calculation
- Max entries enforcement
- Autopilot toggle state

### Integration Tests:
- Modal open/close
- Join tournament flow
- Rules modal integration
- Error handling (insufficient balance, etc.)

### E2E Tests:
- Complete join flow
- Multi-entry join
- Autopilot enabled join
- Rules modal navigation

---

## Migration Strategy

### Step 1: Extend Tournament Data
- Add new fields to Tournament interface (optional fields)
- Update mock data with sample values
- Ensure backward compatibility

### Step 2: Create Sub-Components
- Build reusable components (Input, Toggle, StatsBar)
- Test in isolation
- Document props and usage

### Step 3: Enhance JoinModal
- Add new sections incrementally
- Test each section independently
- Maintain existing functionality

### Step 4: Integration
- Connect to rules modal
- Connect to join API
- Add error handling
- Add loading states

### Step 5: Polish
- Visual refinements
- Accessibility improvements
- Performance optimization
- Documentation

---

## Success Metrics

### User Experience:
- ✅ Users can see all relevant tournament information before joining
- ✅ Users can enter multiple entries easily
- ✅ Users understand autopilot functionality
- ✅ Users can access full rules easily

### Technical:
- ✅ Modal loads in < 200ms
- ✅ All interactions are responsive (< 100ms feedback)
- ✅ No accessibility violations
- ✅ Works on all device sizes

### Business:
- ✅ Increased tournament entry rate
- ✅ Reduced support questions about tournament details
- ✅ Better user confidence in joining

---

## Open Questions

1. **Autopilot Functionality:**
   - What exactly does autopilot do?
   - Is it draft autopick, or something else?
   - Need product clarification

2. **Rules Modal:**
   - Does `TournamentRulesModal` exist and work?
   - Should we reuse it or create new?
   - What content should it include?

3. **Multi-Entry Behavior:**
   - Are multiple entries separate drafts or same draft?
   - How does autopilot work with multiple entries?
   - Need product clarification

4. **Data Source:**
   - When will real tournament API be available?
   - Should we build for mock data first?
   - How to handle missing optional fields?

5. **Fill Percentage:**
   - Should we show fill % or just current/max?
   - Is there a "target" fill we should show?
   - Need design/product input

---

## Next Steps

1. **Review & Approval:**
   - Get stakeholder sign-off on plan
   - Clarify open questions
   - Prioritize phases

2. **Design Review:**
   - Create detailed mockups
   - Get design approval
   - Define exact spacing/colors

3. **Technical Spike:**
   - Prototype data merging approach
   - Test component structure
   - Validate performance

4. **Implementation:**
   - Follow phased approach
   - Test incrementally
   - Get feedback early

---

## References

- Current JoinModal: `components/vx2/tabs/lobby/LobbyTabVX2.tsx` (lines 74-223)
- Tournament Type: `components/vx2/hooks/data/useTournaments.ts` (lines 26-49)
- Tournament Config: `lib/tournamentConfig.js`
- Mobile Tournament Modal: `components/mobile/TournamentModalMobile.js`
- Tournament Rules Modal: `components/mobile/modals/TournamentRulesModal.js`
- VX2 Constants: `components/vx2/core/constants/`

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Status:** Research & Preplanning Complete - Ready for Implementation Planning

