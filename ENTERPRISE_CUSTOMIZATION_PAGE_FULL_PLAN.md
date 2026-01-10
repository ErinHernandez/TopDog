# Enterprise-Grade Customization Page - Complete Implementation Plan

**Status:** Ready for Implementation  
**Created:** Based on `.cursor/plans/enterprise_customization_page_346e3877.plan.md`  
**Purpose:** Complete specification for building a customization system for draft room backgrounds

---

## Overview

Build a comprehensive customization system that allows users to personalize their draft room backgrounds with country/state flags and pattern overlays. The architecture will be extensible to support future features like badges, additional images, and more customization options.

**Key Requirements:**

- Customization applies to **user's unpicked cells only** in draft rooms (where `isUserPick && !pick` in DraftBoard.tsx)
- Preview component must match ProfileTabVX2 avatar box exactly (120px × 140px, username in top border)
- Geolocation tracking happens on app open/page load, not just on customization page
- Flag naming: Countries use ISO codes, US states use "US-{stateCode}" format to avoid conflicts (e.g., "US-CA" for California vs "CA" for Canada)
- Standalone page route (not a tab), but uses VX2 design patterns

---

## Architecture

### Data Structure

**Firebase Collections:**

1. **`userLocations/{userId}`** - Geolocation history (separate collection)
   ```typescript
   interface UserLocation {
     userId: string;
     countries: Array<{
       code: string; // ISO 3166-1 alpha-2 (e.g., "US", "CA", "GB")
       name: string; // Full country name
       firstSeen: Timestamp;
       lastSeen: Timestamp;
       visitCount: number;
     }>;
     states: Array<{ // Only for US states
       code: string; // US state code (e.g., "CA", "NY", "TX")
       name: string; // Full state name
       firstSeen: Timestamp;
       lastSeen: Timestamp;
       visitCount: number;
     }>;
     updatedAt: Timestamp;
   }
   ```

2. **`users/{userId}/preferences`** - Extended preferences (nested in user document)
   ```typescript
   interface CustomizationPreferences {
     // Existing fields (keep backward compatible)
     borderColor: string;
     cellBackgroundColor?: string; // Legacy, may be deprecated
     
     // New background customization
     background?: {
       type: 'flag' | 'solid' | 'none';
       flagCode?: string; // Country code (e.g., "US") or "US-{stateCode}" (e.g., "US-CA")
       solidColor?: string; // Hex color for solid backgrounds
     };
     overlay?: {
       enabled: boolean; // Toggle overlay on/off
       imageId: string; // Starting with "hotdog", extensible for future images
       pattern: 'polka-dot' | 'single' | 'single-upside-down' | 'overwhelm-collage' | 'placement-cell';
       size: number; // 0-100 slider value (percentage of cell size)
       position?: { // Only for 'placement-cell' pattern
         x: number; // 0-100 (percentage from left)
         y: number; // 0-100 (percentage from top)
       };
     };
   }
   ```

### File Structure

```
components/vx2/customization/
  ├── ProfileCustomizationPage.tsx        # Main page component (VX2-style)
  ├── sections/
  │   ├── BackgroundSection.tsx           # Flag/background selection
  │   ├── OverlaySection.tsx              # Pattern overlay controls
  │   └── PreviewSection.tsx              # Live preview component
  ├── components/
  │   ├── FlagSelector.tsx                # Country/state flag grid
  │   ├── PatternSelector.tsx             # Pattern type selector
  │   ├── SizeSlider.tsx                  # Size control for patterns
  │   ├── PositionControls.tsx            # X/Y position for placement-cell pattern
  │   └── CustomizationPreview.tsx        # Preview player cell (matches ProfileTabVX2)
  ├── hooks/
  │   ├── useUserLocations.ts             # Fetch user geolocation history
  │   ├── useCustomization.ts             # Manage customization preferences
  │   └── useGeolocationTracking.ts       # Track new locations (called on app open)
  └── utils/
      ├── flagUtils.ts                    # Flag image paths, country/state codes
      ├── patternUtils.ts                 # Pattern CSS generation
      └── backgroundUtils.ts              # Background style generation

lib/customization/
  ├── geolocationTracking.ts              # Track and store user locations
  ├── customizationStorage.ts             # Firebase operations for preferences
  └── types.ts                           # TypeScript interfaces

public/
  └── flags/
      ├── countries/                      # Country flag images (ISO codes)
      │   ├── us.svg                      # United States
      │   ├── ca.svg                      # Canada
      │   ├── gb.svg                      # United Kingdom
      │   └── ...                         # All ISO 3166-1 alpha-2 codes
      └── states/                         # US state flags
          ├── ca.svg                      # California (US-CA)
          ├── ny.svg                      # New York (US-NY)
          ├── tx.svg                      # Texas (US-TX)
          └── ...                         # All 50 US states
  └── customization/
      └── images/
          └── hotdog.svg                  # Initial overlay image (cartoon hot dog)
```

---

## Implementation Steps

### Phase 1: Infrastructure & Data Layer

#### 1. Type Definitions (`lib/customization/types.ts`)

- Define `UserLocation`, `CustomizationPreferences`, `BackgroundConfig`, `OverlayConfig`
- Export all interfaces for use across components
- Include validation helpers

#### 2. Geolocation Tracking System (`lib/customization/geolocationTracking.ts`)

- Service function: `trackUserLocation(userId: string, country: string, state?: string)`
- Called on app open/page load (not just customization page)
- Uses browser geolocation API or IP-based detection (fallback)
- Stores in `userLocations/{userId}` collection
- Updates existing entries (increment visitCount, update lastSeen) or creates new
- Handles both country and US state tracking
- Error handling: Gracefully fail if geolocation unavailable

#### 3. Customization Storage (`lib/customization/customizationStorage.ts`)

- Create `useCustomization` hook (extends existing preferences system)
- Functions:
  - `getCustomization()`: Read current preferences
  - `updateBackground(config: BackgroundConfig)`: Update background
  - `updateOverlay(config: OverlayConfig)`: Update overlay
  - `resetCustomization()`: Reset to defaults
- Integrates with existing `users/{userId}/preferences` path
- Real-time updates via Firestore listeners
- Optimistic updates with rollback on error

#### 4. Geolocation Hook (`components/vx2/customization/hooks/useGeolocationTracking.ts`)

- Wrapper hook that calls tracking service on mount
- Handles permission requests
- Debounced to avoid excessive tracking calls
- Returns tracking status (loading, success, error)

### Phase 2: Flag Image System

#### 5. Flag Utilities (`components/vx2/customization/utils/flagUtils.ts`)

- `getFlagPath(code: string, type: 'country' | 'state'): string`
  - Countries: `/flags/countries/${code.toLowerCase()}.svg`
  - States: `/flags/states/${code.toLowerCase()}.svg`
- `parseFlagCode(code: string): { type: 'country' | 'state', code: string }`
  - Parses "US-CA" → { type: 'state', code: 'ca' }
  - Parses "US" → { type: 'country', code: 'us' }
- `getFlagDisplayName(code: string): string`
  - Returns human-readable name (e.g., "United States", "California")
- `validateFlagCode(code: string, availableLocations: UserLocation): boolean`
  - Checks if user has visited this location
- Country/state name mappings (constants)

#### 6. Flag Assets Setup

- Create `public/flags/countries/` and `public/flags/states/` directories
- Flag image requirements:
  - Format: SVG (scalable, small file size)
  - Aspect ratio: 3:2 (standard flag ratio)
  - Naming: Lowercase ISO codes (e.g., `us.svg`, `ca.svg`)
- Initial set: Top 20 countries by user base + all 50 US states
- Future: Expand as needed based on user geolocation data
- Fallback: Show placeholder if flag image missing

### Phase 3: UI Components

#### 7. Main Page (`components/vx2/customization/ProfileCustomizationPage.tsx`)

- VX2-style layout matching ProfileTabVX2 design patterns
- Uses VX2 constants: `BG_COLORS`, `TEXT_COLORS`, `SPACING`, `RADIUS`, `TYPOGRAPHY`
- Layout structure:
  ```tsx
  <div className="flex-1 flex flex-col overflow-y-auto" style={{ padding: SPACING.lg }}>
    <AppHeaderVX2 title="Customization" showBackButton />
    <BackgroundSection />
    <OverlaySection />
    <PreviewSection />
  </div>
  ```
- Loading states with Skeleton components
- Error boundaries for graceful error handling

#### 8. Background Section (`components/vx2/customization/sections/BackgroundSection.tsx`)

- Fetches user's visited locations via `useUserLocations` hook
- Displays only flags for countries/states user has visited
- Options:
  - "None" option (transparent background)
  - "Solid Color" option (color picker)
  - Flag grid (only visited locations)
- Grouping: Countries first, then US states (if user has visited US)
- Empty state: "Visit more locations to unlock flags" message
- Loading state: Skeleton grid

#### 9. Flag Selector (`components/vx2/customization/components/FlagSelector.tsx`)

- Props: `locations: UserLocation`, `selectedCode?: string`, `onSelect: (code: string) => void`
- Grid layout: 3-4 columns (responsive)
- Each flag item:
  - Flag image (lazy loaded)
  - Country/state name below
  - Selected state: Border highlight + checkmark
  - Hover state: Slight scale + shadow
- Image loading: Placeholder while loading, error fallback
- Accessibility: Keyboard navigation, ARIA labels

#### 10. Overlay Section (`components/vx2/customization/sections/OverlaySection.tsx`)

- Toggle: Enable/disable overlay
- Pattern selector (when enabled)
- Size slider (when enabled)
- Position controls (only for "placement-cell" pattern)
- Image selector: Currently just "Hot Dog" (extensible)
- Collapsible/expandable sections for better UX

#### 11. Pattern Selector (`components/vx2/customization/components/PatternSelector.tsx`)

- Props: `selected: PatternType`, `onSelect: (pattern: PatternType) => void`
- Visual pattern previews (small thumbnails)
- Pattern descriptions:
  - **Polka Dot**: Repeating circular pattern
  - **Single**: One image centered
  - **Single Upside Down**: One image rotated 180°
  - **Overwhelm Collage**: Dense tiled pattern
  - **Placement Cell**: Position image anywhere in cell
- Radio button or tab-style selection
- Shows position controls when "placement-cell" selected

#### 12. Size Slider (`components/vx2/customization/components/SizeSlider.tsx`)

- Props: `value: number`, `onChange: (value: number) => void`, `min: 0`, `max: 100`
- Range input with visual feedback
- Shows current value (percentage)
- Debounced updates (200ms) to avoid excessive re-renders
- Real-time preview updates

#### 13. Position Controls (`components/vx2/customization/components/PositionControls.tsx`)

- Props: `position: { x: number, y: number }`, `onChange: (pos: { x: number, y: number }) => void`
- Interactive preview area (cell-sized)
- Drag to position or use X/Y sliders
- Shows grid overlay for alignment
- Values: 0-100 (percentage)

#### 14. Preview Section (`components/vx2/customization/sections/PreviewSection.tsx`)

- Live preview of player cell
- **Exact dimensions**: 120px width × 140px height (matches ProfileTabVX2)
- Shows background + overlay exactly as it will appear in draft room
- Username in top border (matches ProfileTabVX2 styling)
- Updates in real-time as user changes settings
- Uses `backgroundUtils.generateBackgroundStyle()` for consistency

### Phase 4: Pattern Implementation

#### 15. Pattern Utilities (`components/vx2/customization/utils/patternUtils.ts`)

- `generatePatternStyle(pattern: PatternType, imagePath: string, size: number, position?: Position): React.CSSProperties`
- Pattern implementations:

**Polka Dot:**
```typescript
{
  backgroundImage: `radial-gradient(circle, url(${imagePath}) ${size}px, transparent ${size}px)`,
  backgroundSize: `${size * 2}px ${size * 2}px`,
  backgroundRepeat: 'repeat',
  backgroundPosition: '0 0',
}
```

**Single:**
```typescript
{
  backgroundImage: `url(${imagePath})`,
  backgroundSize: `${size}%`,
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
}
```

**Single Upside Down:**
```typescript
{
  backgroundImage: `url(${imagePath})`,
  backgroundSize: `${size}%`,
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  transform: 'rotate(180deg)',
}
```

**Overwhelm Collage:**
```typescript
{
  backgroundImage: Array(20).fill(`url(${imagePath})`).join(', '),
  backgroundSize: `${size}% ${size}%`,
  backgroundPosition: generateCollagePositions(20), // Staggered positions
  backgroundRepeat: 'repeat',
}
```

**Placement Cell:**
```typescript
{
  backgroundImage: `url(${imagePath})`,
  backgroundSize: `${size}%`,
  backgroundPosition: `${position.x}% ${position.y}%`,
  backgroundRepeat: 'no-repeat',
}
```

#### 16. Background Utilities (`components/vx2/customization/utils/backgroundUtils.ts`)

- `generateBackgroundStyle(config: CustomizationPreferences): React.CSSProperties`
- Combines flag background + overlay pattern
- Layering order:
  1. Flag/solid background (base layer)
  2. Overlay pattern (on top)
- Returns complete style object for direct use in components
- Handles missing images gracefully (fallback to transparent)
- Optimizes CSS generation (memoization)

### Phase 5: Draft Room Integration

#### 17. Apply Customization in Draft Rooms

- Update `components/vx2/draft-room/components/DraftBoard.tsx`
- Modify `PickCell` component's `getCellStyle()` function
- Apply customization **only** when `isUserPick && !pick` (user's unpicked cells)
- Integration point (line ~324-329):
  ```typescript
  if (isUserPick) {
    const customizationStyle = generateBackgroundStyle(userPreferences);
    return {
      ...base,
      border: `${BOARD_PX.cellBorderWidth}px solid ${userBorderColor}`,
      ...customizationStyle, // Apply background + overlay
    };
  }
  ```
- Read user preferences via `useCustomization` hook
- Cache preferences to avoid excessive re-renders
- Ensure customization doesn't affect picked cells (they keep position colors)

#### 18. ProfileTabVX2 Preview Update

- Update the preview button's inner area (line ~415-433)
- Apply background + overlay to the `backgroundColor` style
- Use `generateBackgroundStyle()` for consistency
- Show "Customize" text only if no customization set
- Real-time preview updates when preferences change

### Phase 6: Page Route

#### 19. Update Route (`pages/profile-customization.tsx`)

- Replace existing desktop-style page with VX2 design
- Structure:
  ```tsx
  export default function ProfileCustomizationPage() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    
    // Redirect if not authenticated
    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/');
      }
    }, [isAuthenticated, isLoading, router]);
    
    if (isLoading) return <LoadingSkeleton />;
    if (!isAuthenticated) return null;
    
    return (
      <div className="min-h-screen" style={{ backgroundColor: BG_COLORS.primary }}>
        <ProfileCustomizationPage />
      </div>
    );
  }
  ```
- Use AppHeaderVX2 for navigation
- Mobile-responsive layout
- Handle deep linking (preserve state if needed)

---

## Extensibility Considerations

### Future Badges Section

- Add `badges` array to user document: `badges: Array<{ id: string, earnedAt: Timestamp }>`
- Create `BadgesSection.tsx` component
- Badge display logic: Show earned badges, gray out locked badges
- Badge images in `public/customization/badges/`
- Badge earning triggers (tournament wins, milestones, etc.)

### Future Additional Images

- Extend `overlay.imageId` to support multiple image types
- Create `ImageLibrary.tsx` component
- Image metadata: `{ id: string, name: string, category: string, unlocked: boolean }`
- Image unlock system (earn through gameplay, purchase, etc.)
- Image upload/storage system (if user-generated content allowed)

### Future Customization Options

- Theme system (light/dark/auto)
- Border styles (beyond color: dashed, dotted, double)
- Animation preferences (subtle animations on cells)
- Sound preferences (custom notification sounds)

---

## Technical Details

### Geolocation Tracking Implementation

**When to Track:**
- On app open (AppShellVX2 mount)
- On page navigation (if location changed)
- Debounced: Max once per 5 minutes per session

**How to Track:**
1. Try browser geolocation API (if permission granted)
2. Fallback to IP-based geolocation (service like BigDataCloud)
3. Store country + state (if in US)
4. Update Firestore `userLocations/{userId}` collection

**Privacy:**
- Only track country/state level (not precise coordinates)
- User can opt-out (future feature)
- Clear data retention policy

### Pattern CSS Details

**Polka Dot Calculation:**
- Size slider (0-100) maps to circle radius: `radius = (size / 100) * 30` (max 30px)
- Spacing: `spacing = radius * 2`
- Creates repeating circular pattern

**Overwhelm Collage:**
- Generate 20+ image instances
- Staggered positions: `x: (i % 5) * 20px, y: Math.floor(i / 5) * 20px`
- Size affects density: Smaller size = more visible, larger size = more overlap

**Placement Cell:**
- Position values (0-100) map to percentage from top-left
- `backgroundPosition: ${x}% ${y}%` centers image at that point
- Size slider controls image size relative to cell

### Performance Considerations

- **Lazy load flag images**: Use `loading="lazy"` attribute
- **Cache flag image paths**: Memoize flag path calculations
- **Optimize pattern CSS generation**: Memoize style objects
- **React.memo for preview components**: Prevent unnecessary re-renders
- **Debounce slider updates**: 200ms debounce for size/position changes
- **Virtualize flag grid**: If user has 50+ visited locations, use virtualization
- **Image preloading**: Preload selected flag and overlay image

### Error Handling

- **Missing flag images**: Show placeholder icon + country name
- **Geolocation unavailable**: Gracefully fail, show message to user
- **Firestore errors**: Retry with exponential backoff
- **Invalid preference data**: Reset to defaults, log error
- **Network failures**: Show offline message, queue updates

### Accessibility

- **ARIA labels**: All interactive elements have descriptive labels
- **Keyboard navigation**: Full keyboard support for flag grid, sliders
- **Screen reader support**: Descriptive text for patterns, current selections
- **High contrast mode**: Ensure patterns visible in high contrast
- **Focus indicators**: Clear focus states for all interactive elements
- **Color contrast**: Text over flags meets WCAG AA standards

---

## Testing Strategy

1. **Unit Tests**:
   - `flagUtils`: Path generation, code parsing, validation
   - `patternUtils`: CSS generation for each pattern type
   - `backgroundUtils`: Style combination logic
   - `geolocationTracking`: Location tracking, Firestore updates

2. **Integration Tests**:
   - Firebase operations (read/write preferences)
   - Geolocation tracking flow
   - Preference updates trigger UI updates

3. **Component Tests**:
   - Flag selector: Selection, loading states, error states
   - Pattern selector: Pattern switching, position controls
   - Preview: Real-time updates, style application

4. **E2E Tests**:
   - Full customization flow: Select flag → Choose pattern → Adjust size → Save
   - Draft room: Verify customization appears in user's cells
   - Profile preview: Verify preview updates correctly

5. **Visual Regression Tests**:
   - Pattern rendering: Each pattern type at various sizes
   - Flag display: Various flag images
   - Preview component: Matches ProfileTabVX2 exactly

---

## Migration Notes

- **Existing users**: Default preferences (no background/overlay)
- **Geolocation history**: Starts tracking from implementation date (no retroactive data)
- **Backward compatibility**: Existing `borderColor` and `cellBackgroundColor` preferences preserved
- **Gradual rollout**: 
  1. Phase 1: Flag backgrounds only
  2. Phase 2: Add overlay patterns
  3. Phase 3: Add badges section (future)
- **Data migration**: None required (new fields are optional)

---

## Edge Cases & Considerations

1. **User has no visited locations**: Show message "Visit more locations to unlock flags", allow solid color option
2. **Flag image missing**: Show placeholder, log error, allow selection (will show placeholder in draft room too)
3. **User clears customization**: Reset to transparent background, remove overlay
4. **Invalid preference data**: Validate on read, reset to defaults if invalid
5. **Concurrent updates**: Use Firestore transactions for preference updates
6. **Offline mode**: Queue preference updates, sync when online
7. **Very large overlay size**: Ensure patterns don't break layout (max size constraints)
8. **Placement-cell at edges**: Ensure image doesn't overflow cell bounds

---

## Implementation Checklist

### Phase 1: Infrastructure & Data Layer
- [ ] Create `lib/customization/types.ts` with all TypeScript interfaces
- [ ] Implement `lib/customization/geolocationTracking.ts` service
- [ ] Implement `lib/customization/customizationStorage.ts` with Firebase operations
- [ ] Create `components/vx2/customization/hooks/useGeolocationTracking.ts`
- [ ] Create `components/vx2/customization/hooks/useUserLocations.ts`
- [ ] Create `components/vx2/customization/hooks/useCustomization.ts`

### Phase 2: Flag Image System
- [ ] Create `components/vx2/customization/utils/flagUtils.ts`
- [ ] Set up `public/flags/countries/` directory structure
- [ ] Set up `public/flags/states/` directory structure
- [ ] Add initial flag SVG assets (top 20 countries + 50 US states)
- [ ] Implement flag image fallback/placeholder system

### Phase 3: UI Components
- [ ] Create `components/vx2/customization/ProfileCustomizationPage.tsx`
- [ ] Create `components/vx2/customization/sections/BackgroundSection.tsx`
- [ ] Create `components/vx2/customization/sections/OverlaySection.tsx`
- [ ] Create `components/vx2/customization/sections/PreviewSection.tsx`
- [ ] Create `components/vx2/customization/components/FlagSelector.tsx`
- [ ] Create `components/vx2/customization/components/PatternSelector.tsx`
- [ ] Create `components/vx2/customization/components/SizeSlider.tsx`
- [ ] Create `components/vx2/customization/components/PositionControls.tsx`
- [ ] Create `components/vx2/customization/components/CustomizationPreview.tsx`

### Phase 4: Pattern Implementation
- [ ] Create `components/vx2/customization/utils/patternUtils.ts`
- [ ] Implement all 5 pattern types (polka-dot, single, single-upside-down, overwhelm-collage, placement-cell)
- [ ] Create `components/vx2/customization/utils/backgroundUtils.ts`
- [ ] Implement style combination logic

### Phase 5: Draft Room Integration
- [ ] Update `components/vx2/draft-room/components/DraftBoard.tsx` to apply customization
- [ ] Update `components/vx2/profile/ProfileTabVX2.tsx` preview button
- [ ] Test customization appears only in user's unpicked cells
- [ ] Verify picked cells maintain position colors

### Phase 6: Page Route
- [ ] Update `pages/profile-customization.tsx` with VX2 design
- [ ] Add authentication checks
- [ ] Add AppHeaderVX2 navigation
- [ ] Test mobile responsiveness

### Testing & Polish
- [ ] Write unit tests for utilities
- [ ] Write integration tests for Firebase operations
- [ ] Write component tests
- [ ] Write E2E tests for full flow
- [ ] Performance optimization (memoization, lazy loading)
- [ ] Accessibility audit and fixes
- [ ] Error handling and edge cases

---

## Notes for Implementation

- **VX2 Conventions**: All components must follow VX2 design patterns, use VX2 constants, and match existing VX2 component styles
- **TypeScript**: All new code must be TypeScript with strict typing
- **Firebase**: Use existing Firebase setup, integrate with current user preferences system
- **Mobile-First**: All components must be mobile-responsive
- **Performance**: Optimize for performance with memoization, lazy loading, and debouncing
- **Accessibility**: Ensure WCAG AA compliance throughout

---

**End of Plan**
