# Draft Room Scrolling Architecture

## Problem Statement

The draft room mobile interface was experiencing recurring scrolling issues due to CSS class conflicts between draft room components and non-draft room components. This created a fundamental architectural problem where:

1. **Shared CSS Classes**: Components used generic classes like `.roster-scroll`, `.board-scroll`, `.info-scroll`
2. **Global CSS Conflicts**: Styles from non-draft pages affected draft room scrolling
3. **Inconsistent Behavior**: Scrolling worked differently across different parts of the app

## Solution: Isolated Draft-Specific CSS Classes

### New CSS Class Naming Convention

All draft room scrolling containers now use prefixed classes to prevent conflicts:

- `.roster-scroll` → `.draft-roster-scroll`
- `.board-scroll` → `.draft-board-scroll` 
- `.info-scroll` → `.draft-info-scroll`

### Component-Specific Isolation

Each draft room component now has its own isolated CSS:

#### 1. RosterPage.js
- **Class**: `.draft-roster-scroll`
- **Container**: Main roster list and dropdown
- **Padding**: `pb-16` for adequate bottom spacing

#### 2. DraftBoardApple.js
- **Class**: `.draft-board-scroll`
- **Container**: Draft board grid
- **Padding**: `paddingBottom: '48px'` for bottom spacing

#### 3. DraftRoomApple.js (Info Tab)
- **Class**: `.draft-info-scroll`
- **Container**: Info tab content
- **Padding**: `pb-16` for adequate bottom spacing

### CSS Properties Applied

Each draft-specific class includes:

```css
.draft-[component]-scroll::-webkit-scrollbar {
  width: 0px !important;
  height: 0px !important;
  display: none !important;
}
.draft-[component]-scroll {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
  -webkit-overflow-scrolling: touch !important;
}
```

### Mobile-Specific Enhancements

All classes include mobile-specific media queries:

```css
@media (max-width: 768px) {
  .draft-[component]-scroll::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }
  .draft-[component]-scroll {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
    -webkit-overflow-scrolling: touch !important;
  }
}
```

## Benefits

1. **No More Conflicts**: Draft room scrolling is completely isolated from non-draft components
2. **Consistent Behavior**: Each tab has predictable scrolling behavior
3. **Maintainable**: Clear naming convention prevents future conflicts
4. **Mobile Optimized**: Hidden scrollbars with touch scrolling support

## Future Guidelines

When adding new scrollable components to draft rooms:

1. Use the `draft-[component]-scroll` naming pattern
2. Include component-specific CSS isolation
3. Add adequate bottom padding for mobile scrolling
4. Test scrolling behavior independently from non-draft components

This architecture ensures that draft room scrolling issues are permanently resolved and won't recur due to CSS conflicts.
