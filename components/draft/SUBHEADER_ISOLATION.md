# Draft Room SubHeader Isolation

## Problem
The subheaders (7px blue bars) in draft rooms were sharing components with non-draft pages, causing cross-contamination when making adjustments. Changes intended for draft rooms would affect the main app and vice versa.

## Solution
Created completely independent SubHeader components for each draft context:

### Components Created

1. **`/components/draft/v3/ui/DraftSubHeader.js`**
   - For V3 draft rooms
   - Class: `draft-subheader`
   - Independent of main app SubHeader

2. **`/components/draft/v2/ui/DraftSubHeader.js`**
   - For V2 draft rooms  
   - Class: `draft-v2-subheader`
   - Independent of main app SubHeader

3. **`/components/draft/mobile/DraftSubHeaderMobile.js`**
   - For mobile draft rooms
   - Class: `draft-mobile-subheader`
   - Independent of main app SubHeader

### Main App SubHeader (Unchanged)
- **`/components/v3/Layout/SubHeader.js`**
- Used by: `/pages/exposure.js`, `/pages/my-teams.js`, `/pages/statistics.js`, etc.
- Via: `AppShell` component with `showSubHeader` prop
- Class: No specific class (uses default styling)

## Usage Guidelines

### For Draft Room Changes
- **V3 Draft Rooms**: Import and use `components/draft/v3/ui/DraftSubHeader`
- **V2 Draft Rooms**: Import and use `components/draft/v2/ui/DraftSubHeader`  
- **Mobile Draft Rooms**: Import and use `components/draft/mobile/DraftSubHeaderMobile`

### For Main App Changes
- **Non-Draft Pages**: Modify `components/v3/Layout/SubHeader.js`
- This affects: Exposure, My Teams, Statistics, etc.

## Implementation Status
- ✅ Components created
- ⏳ Integration with existing draft rooms (pending)
- ⏳ CSS isolation (pending)

## Next Steps
1. Integrate new components into existing draft room layouts
2. Add draft-specific CSS scoping
3. Test isolation is working correctly
4. Update any existing draft room subheader references

## Benefits
- **Independent Development**: Draft room subheaders can be modified without affecting main app
- **Reduced Risk**: No more accidental cross-contamination
- **Clear Separation**: Obvious which component affects which context
- **Easier Maintenance**: Each context has its own dedicated component
