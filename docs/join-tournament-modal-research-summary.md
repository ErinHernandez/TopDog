# Join Tournament Modal - Research Summary

## Quick Reference

**Current Component:** `components/vx2/tabs/lobby/LobbyTabVX2.tsx` (JoinModal, lines 74-223)  
**Competitor Reference:** Underdog Fantasy tournament join modal  
**Full Enhancement Plan:** See `docs/join-tournament-modal-enhancement-plan.md`

---

## Key Findings

### ✅ Available Reusable Components

1. **Switch Component** (`components/vx/shared/Switch.tsx`)
   - Fully functional toggle switch
   - Supports sizes: sm, md, lg
   - Has label and description support
   - Accessible (ARIA, keyboard nav)
   - **Can be reused for Autopilot toggle**

2. **TournamentRulesModal** (`components/mobile/modals/TournamentRulesModal.js`)
   - Comprehensive rules modal already exists
   - Full-screen scrollable modal
   - Contains all tournament rules, scoring, roster, prizes
   - **Can be reused for "All rules" button**

3. **TournamentModalMobile** (`components/mobile/TournamentModalMobile.js`)
   - Has many features we need:
     - Number of entries input
     - Autopilot toggle
     - Scoring rules display
     - Roster requirements
     - Tournament info sections
   - **Can be used as reference/pattern**

### 📊 Current vs. Competitor Comparison

| Feature | Current (VX2) | Competitor (Underdog) | Status |
|---------|---------------|----------------------|--------|
| Tournament title | ✅ | ✅ | Complete |
| Entry fee display | ✅ | ✅ | Complete |
| 1st place prize | ✅ | ✅ | Complete |
| Entrants count | ❌ | ✅ | **Missing** |
| Total prizes | ❌ | ✅ | **Missing** |
| Number of entries input | ❌ | ✅ | **Missing** |
| Max entries indicator | ❌ | ✅ | **Missing** |
| Autopilot toggle | ❌ | ✅ | **Missing** |
| Total cost calculation | ❌ | ✅ | **Missing** |
| Draft settings (pick clock) | ❌ | ✅ | **Missing** |
| Tournament info section | ❌ | ✅ | **Missing** |
| Scoring rules display | ❌ | ✅ | **Missing** |
| Roster requirements | ❌ | ✅ | **Missing** |
| "All rules" button | ❌ | ✅ | **Missing** |
| Tournament subtitle | ❌ | ✅ | **Missing** |
| Badge indicators | ❌ | ✅ | **Missing** |

---

## Data Availability

### ✅ Available in Tournament Type:
```typescript
{
  id, title, entryFee, entryFeeCents,
  totalEntries, currentEntries, maxEntries,
  firstPlacePrize, isFeatured, status, startTime
}
```

### ❌ Missing from Tournament Type (Need to Add):
- `subtitle?: string`
- `sport?: string`
- `gameType?: string`
- `draftSize?: number`
- `pickClock?: number`
- `draftRounds?: number`
- `rake?: number`
- `slate?: string`
- `badges?: string[]`
- `scoring?: ScoringRules`
- `roster?: RosterRequirements`

### ✅ Available in Config Files:
- Scoring rules: `lib/tournamentConfig.js` → `tournamentTemplates.topdog.scoring`
- Roster requirements: `lib/tournamentConfig.js` → `tournamentTemplates.topdog.roster`
- Draft settings: Various locations (need consolidation)

---

## Implementation Strategy

### Recommended Approach: **Hybrid Data Strategy**

1. **Keep Tournament type minimal** (for now)
2. **Merge config data in component**:
   ```typescript
   const tournamentConfig = getTournamentConfig('topdog');
   const enhancedTournament = {
     ...tournament,
     scoring: tournamentConfig.scoring,
     roster: tournamentConfig.roster,
     // ... other config values
   };
   ```
3. **Calculate derived values**:
   - `fillPercentage = (currentEntries / maxEntries) * 100`
   - `totalCost = entryFeeCents * numberOfEntries`
   - `totalPrizes = calculateTotalPrizes(tournament)`

### Component Reuse Strategy:

1. **Switch Component:**
   - Import from `components/vx/shared/Switch.tsx`
   - Use for Autopilot toggle
   - May need VX2 styling adaptation

2. **TournamentRulesModal:**
   - Import from `components/mobile/modals/TournamentRulesModal.js`
   - Use as-is (already works)
   - May need VX2 styling adaptation

3. **Pattern Reference:**
   - Use `TournamentModalMobile.js` as pattern reference
   - Adapt patterns to VX2 design system
   - Use VX2 constants (colors, spacing, typography)

---

## Priority Implementation Order

### Phase 1: Critical (High Priority)
1. ✅ Add entrants count to statistics bar
2. ✅ Add number of entries input with validation
3. ✅ Add autopilot toggle (reuse Switch component)
4. ✅ Add total cost calculation
5. ✅ Connect "All rules" button to TournamentRulesModal

### Phase 2: Important (Medium Priority)
6. ✅ Add draft settings display (pick clock, draft size)
7. ✅ Add tournament info section (collapsible)
8. ✅ Add scoring rules display
9. ✅ Add roster requirements display

### Phase 3: Enhancement (Low Priority)
10. ✅ Add tournament subtitle
11. ✅ Add badge indicators
12. ✅ Add fill percentage
13. ✅ Visual polish and refinements

---

## Technical Notes

### State Management:
```typescript
const [numberOfEntries, setNumberOfEntries] = useState(1);
const [autopilotEnabled, setAutopilotEnabled] = useState(false);
const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
const [expandedSections, setExpandedSections] = useState({
  tournamentInfo: false,
  scoring: false,
  roster: false,
});
```

### Validation:
```typescript
const validateEntry = () => {
  if (numberOfEntries > tournament.maxEntries) {
    return { valid: false, error: 'Exceeds max entries' };
  }
  if (userBalance < totalCost) {
    return { valid: false, error: 'Insufficient balance' };
  }
  return { valid: true };
};
```

### Cost Calculation:
```typescript
const totalCost = tournament.entryFeeCents * numberOfEntries;
const totalCostFormatted = formatCurrency(totalCost);
```

---

## Design System Integration

### Use VX2 Constants:
- Colors: `BG_COLORS`, `TEXT_COLORS`, `BRAND_COLORS`, `STATE_COLORS`
- Spacing: `SPACING` (xs, sm, md, lg, xl)
- Typography: `TYPOGRAPHY.fontSize` (xs, sm, base, lg, xl)
- Radius: `RADIUS` (sm, md, lg, xl)
- Z-Index: `Z_INDEX.modal`

### Modal Specifications:
- Width: `w-80` (320px) mobile, `max-w-md` (448px) desktop
- Padding: `SPACING.lg` (16px)
- Border radius: `RADIUS.xl`
- Background: `BG_COLORS.secondary`
- Overlay: `rgba(0,0,0,0.8)`

---

## Open Questions (Need Clarification)

1. **Autopilot Functionality:**
   - What does autopilot do exactly?
   - Is it draft autopick?
   - How does it work with multiple entries?

2. **Multi-Entry Behavior:**
   - Are multiple entries in separate drafts?
   - Or same draft with multiple teams?
   - How does autopilot work with multiple entries?

3. **Data Source:**
   - When will real tournament API be ready?
   - Should we build for mock data first?
   - How to handle missing optional fields gracefully?

4. **Fill Percentage:**
   - Show fill % or just current/max?
   - Is there a "target" fill to show?
   - Design preference?

5. **Tournament Subtitle:**
   - What should subtitle be?
   - "NFL Season-Long Tournament"?
   - Or tournament-specific description?

---

## Next Steps

1. ✅ **Research Complete** - This document
2. ⏳ **Get Stakeholder Approval** - Review plan, clarify questions
3. ⏳ **Design Review** - Create mockups, get design approval
4. ⏳ **Technical Spike** - Prototype data merging, test components
5. ⏳ **Implementation** - Follow phased approach

---

## File References

### Current Implementation:
- `components/vx2/tabs/lobby/LobbyTabVX2.tsx` - JoinModal component
- `components/vx2/hooks/data/useTournaments.ts` - Tournament type & data

### Reusable Components:
- `components/vx/shared/Switch.tsx` - Toggle switch component
- `components/mobile/modals/TournamentRulesModal.js` - Rules modal

### Reference Implementations:
- `components/mobile/TournamentModalMobile.js` - Mobile tournament modal
- `lib/tournamentConfig.js` - Tournament configuration

### Constants:
- `components/vx2/core/constants/colors.ts`
- `components/vx2/core/constants/sizes.ts`

---

**Status:** Research & Preplanning Complete ✅  
**Ready For:** Implementation Planning & Design Review

