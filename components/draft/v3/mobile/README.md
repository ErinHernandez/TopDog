# Draft Room V3 - Mobile Architecture

Mobile-first design for iOS and Android with streamlined features and optimized UX.

## Philosophy
- **Less features, better experience** - Focus on core draft functionality
- **Touch-optimized** - Designed for finger navigation, not mouse
- **Performance-first** - Lightweight components, fast loading
- **Platform-specific** - Leveraging iOS/Android design patterns

## Architecture

### Core Components
```
mobile/
├── README.md
├── apple/
│   ├── DraftRoomApple.js     # iOS-optimized draft room
│   ├── components/
│   │   ├── PicksBar.js       # Horizontal swipe picks
│   │   ├── PlayerList.js     # Vertical scroll players
│   │   ├── TeamRoster.js     # Modal-based team view
│   │   └── QuickActions.js   # Draft/Queue buttons
│   └── styles/
│       └── apple.js          # iOS design tokens
├── android/
│   ├── DraftRoomAndroid.js   # Android-optimized draft room
│   ├── components/
│   │   ├── PicksBar.js       # Material Design picks
│   │   ├── PlayerList.js     # Swipe-to-action players
│   │   ├── TeamRoster.js     # Bottom sheet team view
│   │   └── QuickActions.js   # Floating action buttons
│   └── styles/
│       └── material.js       # Material Design tokens
└── shared/
    ├── hooks/
    │   ├── useSwipeGestures.js
    │   ├── useTouchOptimized.js
    │   └── useMobileLayout.js
    ├── utils/
    │   ├── deviceDetection.js
    │   ├── performanceOptimized.js
    │   └── touchTargets.js
    └── constants/
        ├── mobileSizes.js
        └── mobileBreakpoints.js
```

## Mobile Features (Streamlined)

### Core Draft Actions
- ✅ **Pick/Queue Players** - Large touch targets
- ✅ **View Available Players** - Infinite scroll, search
- ✅ **See Your Team** - Quick modal/sheet access
- ✅ **Draft Progress** - Horizontal swipe picks bar
- ✅ **Timer Display** - Prominent countdown

### Removed/Simplified Features
- ❌ **Complex Statistics** - Focus on name, position, team
- ❌ **Advanced Filters** - Simple position filters only
- ❌ **Multiple Sort Options** - ADP sort only
- ❌ **Drag & Drop** - Tap-based actions only
- ❌ **Hover States** - Touch-optimized interactions

## Design Principles

### Apple (iOS)
- **Native feel** - iOS design patterns and animations
- **Gesture-driven** - Swipe, tap, long-press interactions
- **Clean typography** - SF Pro font system
- **Minimal chrome** - Focus on content

### Android (Material)
- **Material Design 3** - Latest design system
- **Floating Actions** - Speed dial for quick actions
- **Bottom Sheets** - Android-native modals
- **Adaptive layouts** - Various screen sizes

### Shared Mobile Optimizations
- **44px minimum touch targets** - Accessible tap areas
- **Thumb-friendly navigation** - Bottom-based actions
- **Fast transitions** - 60fps animations
- **Offline resilience** - Smart caching strategies

## Routes

### Development Routes
- `/draft/v3/mobile/apple/demo` - iOS demo with test data
- `/draft/v3/mobile/android/demo` - Android demo with test data

### Production Routes  
- `/draft/v3/mobile/apple/[roomId]` - iOS production draft
- `/draft/v3/mobile/android/[roomId]` - Android production draft

## Implementation Strategy

### Phase 1: Core Layout ✅
- Device detection and routing
- Basic mobile layouts for both platforms
- Touch-optimized player list

### Phase 2: Draft Actions
- Pick/Queue functionality with large touch targets
- Simple position filtering
- Team roster modal/sheet

### Phase 3: Polish
- Platform-specific animations
- Gesture support (swipe actions)
- Performance optimization

### Phase 4: Testing
- Cross-device testing
- Touch target validation
- Performance profiling
