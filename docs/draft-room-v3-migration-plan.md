# Draft Room V3 - Migration Plan

## Overview
Transform the monolithic 4614-line draft room into a clean, maintainable architecture while preserving every pixel of your carefully crafted design.

## Week 1: Foundation & Constants

### Day 1-2: Extract Visual Constants
Create a constants file with every exact measurement:

```javascript
// /components/draft/v3/constants/layout.js
export const LAYOUT = {
  MAIN_CONTAINER: {
    width: '1391px',
    minWidth: '1391px', 
    maxWidth: '1391px',
    backgroundColor: '#101927',
    minHeight: '1500px'
  },
  HORIZONTAL_PICKS: {
    height: '256px',
    gap: '4.5px',
    cardWidth: '158px',
    cardHeight: '70.875px',
    paddingTop: '30px',
    paddingBottom: '30px'
  },
  FIXED_ELEMENTS: {
    ON_THE_CLOCK: {
      top: '0px',
      left: '45.5px',
      width: 288,
      height: '100px',
      border: '2px solid #FBBF25'
    },
    FULL_BOARD_BUTTON: {
      top: '118px',
      left: '45.5px',
      width: '288px'
    },
    AUTODRAFT: {
      top: '182px',
      left: '45.5px',
      width: '174px',
      height: '90px'
    },
    PICKS_AWAY: {
      top: '182px',
      left: '215.5px'
    },
    MAIN_CONTENT: {
      top: '380px',
      left: '0px',
      width: '100vw',
      paddingLeft: '20px'
    }
  },
  YOUR_QUEUE: {
    top: '290px',
    left: '45.5px',
    marginLeft: '-17px',
    width: '288px',
    height: '797px'
  }
};

export const POSITIONS = {
  QB: { 
    color: '#7C3AED',
    name: 'QB',
    filterWidth: '80px'
  },
  RB: { 
    color: '#0fba80',
    name: 'RB',
    filterWidth: '80px'
  },
  WR: { 
    color: '#4285F4',
    name: 'WR', 
    filterWidth: '80px'
  },
  TE: { 
    color: '#7C3AED',
    name: 'TE',
    filterWidth: '80px'
  }
};
```

### Day 3-4: Create Shell Components
Build component shells that output identical HTML:

```javascript
// /components/draft/v3/DraftRoomV3.js
import { LAYOUT } from './constants/layout';

export default function DraftRoomV3({ roomId }) {
  // Exact same logic as current implementation
  // But structured for clarity
  
  return (
    <div 
      className="min-h-screen bg-[#101927] text-white overflow-x-auto zoom-resistant" 
      style={{ minHeight: LAYOUT.MAIN_CONTAINER.minHeight }}
    >
      <DraftNavbar />
      <div 
        className="zoom-stable" 
        style={{
          width: LAYOUT.MAIN_CONTAINER.width,
          minWidth: LAYOUT.MAIN_CONTAINER.minWidth,
          maxWidth: LAYOUT.MAIN_CONTAINER.maxWidth
        }}
      >
        <HorizontalPicksBar />
        <FixedElementsLayer />
        <ThreeColumnLayout />
      </div>
    </div>
  );
}
```

### Day 5-7: Verification & Testing
- Screenshot comparison testing
- Pixel-perfect validation
- Performance baseline measurement

## Week 2: Component Separation

### Day 8-10: Extract Components
Move each major section to its own component while maintaining exact output.

### Day 11-12: State Management
Extract state logic while keeping the same behavior.

### Day 13-14: Hook Creation
Create custom hooks for complex logic.

## Week 3: File Organization

### Day 15-17: Component Files
Move components to separate files with comprehensive tests.

### Day 18-19: Logic Separation
Separate business logic from presentation components.

### Day 20-21: Integration Testing
Ensure everything works together perfectly.

## Week 4: Optimization & Polish

### Day 22-24: Performance
Optimize without changing behavior.

### Day 25-26: Documentation
Complete documentation and developer guides.

### Day 27-28: Final Validation
Comprehensive testing and sign-off.

## First Concrete Step: Create Constants File

Let me create the actual constants file as the first migration step:

```javascript
// This file will contain every exact pixel measurement
// from your current draft room so we can preserve them perfectly
```

Would you like me to proceed with creating this constants file? This would be the very first step - just extracting the measurements into a organized format without changing anything about how the current room works. We can then gradually use these constants to replace hardcoded values one tiny piece at a time.

## Risk Mitigation

### 1. Parallel Routing
- V3 will be accessible via `/draft/v3/[roomId]`
- Original remains at `/draft/topdog/[roomId]`
- Easy switching for testing

### 2. Feature Flags
```javascript
const useV3 = process.env.DRAFT_V3_ENABLED === 'true' || 
              router.query.v3 === 'true';
```

### 3. Rollback Plan
- Instant flag toggle
- No database changes
- User session preservation

### 4. Gradual Migration
- Developer testing first
- Beta user group
- Gradual percentage rollout

This approach ensures we never risk losing your months of pixel-perfect work while creating a maintainable foundation for future development.
