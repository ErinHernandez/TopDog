# Scrolling Issue Diagnosis

## Key Discovery: Architecture Independence

After investigating the codebase, I found that:

### Non-Draft Room Structure
- Uses `AppShell` component with `SubHeader` 
- `SubHeader` creates blue gradient bars (7px height)
- Uses standard CSS classes like `.scrollable-list`

### Draft Room Structure  
- **Completely independent** - doesn't use `AppShell` or `SubHeader`
- Has its own layout components (`DraftRoomApple`, `RosterPage`, etc.)
- Uses different CSS classes (`.draft-roster-scroll`, etc.)

## The Real Problem

The issue isn't CSS conflicts between draft/non-draft - they're separate!

The problem is likely:

1. **Flex Layout Issues**: Incorrect `flex-1`, `min-h-0`, `overflow` combinations
2. **Container Height**: Missing proper height constraints  
3. **Padding/Margin**: Bottom content getting cut off
4. **Mobile Viewport**: iOS Safari specific scrolling issues

## Testing Strategy

Let's test each scrolling area individually:

### Test 1: Non-Draft Scrolling (Baseline)
- My Teams mobile tab
- Exposure Report mobile tab  
- Check if these work properly

### Test 2: Draft Room Scrolling (Problem Areas)
- Roster tab in draft room
- Board tab in draft room
- Info tab in draft room

## Questions to Answer
1. Do non-draft mobile tabs scroll properly?
2. Which draft room tab fails first?
3. Is it a height calculation issue?
4. Is it a flex layout issue?

## Next Steps
1. Create isolated test components
2. Test each scrolling area separately  
3. Identify the specific CSS/layout issue
4. Fix systematically
