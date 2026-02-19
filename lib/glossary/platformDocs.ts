/**
 * TopDog Glossary - Platform Documentation
 *
 * Per-platform documentation for all Draft Room elements.
 * Currently implements: web (Next.js/React)
 * Ready for: ios, ipad, android (Swift/SwiftUI)
 *
 * @see types.ts for AllPlatformDocs, PlatformDocumentation interfaces
 */

import type { AllPlatformDocs, PlatformDocumentation } from './types';

// ============================================================================
// Helper: Create Web Platform Doc
// ============================================================================

function createWebDoc(
  doc: Omit<PlatformDocumentation, 'platform'>
): PlatformDocumentation {
  return { platform: 'web', ...doc };
}

// ============================================================================
// Status Bar Elements (DR-SB-*)
// ============================================================================

/**
 * DR-SB-001: Leave Button
 * Part of DraftStatusBar - clicking safe area triggers leave modal
 */
export const drSb001PlatformDocs: AllPlatformDocs = {
  web: createWebDoc({
    architecture: {
      summary:
        'The Leave Button is integrated into DraftStatusBar as a clickable safe area. ' +
        'Clicking anywhere in the status bar header triggers the leave confirmation modal.',
      componentPath: 'components/vx2/draft-room/components/DraftStatusBar.tsx',
      componentTree: `DraftRoomVX2
  └── DraftStatusBar (clickable safe area)
        └── onClick → LeaveConfirmModal`,
      parentComponent: 'DraftRoomVX2',
      childComponents: [],
      dataFlow:
        'Receives onLeave callback from DraftRoomVX2. Click triggers handleSafeAreaClick ' +
        'which calls onLeave, setting showLeaveModal state in parent.',
      stateManagement:
        'No internal state for leave functionality. Parent manages modal visibility ' +
        'via useState(showLeaveModal).',
      dependencies: ['react', 'cn (classnames)', 'DraftStatusBar.module.css'],
      relatedFiles: [
        'components/vx2/draft-room/components/LeaveConfirmModal.tsx',
        'components/vx2/draft-room/components/DraftStatusBar.module.css',
      ],
    },
    visuals: {
      dimensions: 'Full width header, 64px height (HEADER_HEIGHT constant)',
      touchTarget: 'Entire header safe area is clickable (exceeds 44px minimum)',
      spacing: 'Safe area click zone spans full header width',
      colors: {
        background: 'Dynamic - #1F2937 (idle), blue-tiled (on-clock), #DC2626 (urgent)',
        text: '#FFFFFF',
      },
      cornerRadius: '0 (full-width header)',
      assets: [],
      animations: 'Shake animation on timer=0 (alarm clock effect)',
    },
    bestPractices: {
      summary:
        'Leave action is triggered by clicking anywhere in the safe area header. ' +
        'This follows mobile conventions where tapping header areas can navigate back.',
      doList: [
        'DO: Use the onLeave callback pattern for modal triggering',
        'DO: Add cursor: pointer via CSS when onLeave is provided',
        'DO: Include aria-label explaining the tap-to-leave behavior',
      ],
      dontList: [
        "DON'T: Add a separate button - the safe area IS the tap target",
        "DON'T: Allow leave during shake animation (grace period)",
      ],
      performanceTips: [
        'React.memo wraps component to prevent unnecessary re-renders',
        'onLeave callback is stable (defined in parent)',
      ],
      accessibilityRequirements: [
        'role="banner" on container',
        'aria-label describes tap-to-leave when onLeave provided',
        'Cursor changes to pointer for sighted keyboard users',
      ],
      designSystemRefs: ['TopDog Design System: Draft Room Header'],
      officialDocs: ['https://react.dev/reference/react/memo'],
    },
    improvements: [
      {
        id: 'IMP-WEB-DR-SB-001-1',
        category: 'accessibility',
        title: 'Add keyboard support for leave action',
        summary:
          'Safe area click is mouse-only. Add onKeyDown handler for Enter/Space.',
        currentState: 'Click-only leave trigger',
        proposedChange: 'Add keyboard event handler with Enter/Space support',
        impact: 'medium',
        effort: 'small',
        rationale: 'Keyboard users cannot trigger leave without mouse',
      },
    ],
  }),
  // iOS placeholder - ready for Swift implementation
  // ios: createIOSDoc({ ... }),
  crossPlatform: {
    sharedBehavior:
      'All platforms show confirmation modal before leaving. ' +
      'Leave action is always reversible (cancel option in modal).',
    keyDivergences: [
      'Web: Click safe area header | iOS: Dedicated X button (planned)',
      'Web: Modal confirmation | iOS: Native action sheet (planned)',
    ],
    featureParity: {
      confirmationModal: true,
      hapticFeedback: false, // Web has no haptics
      swipeToLeave: false, // Future iOS feature
    },
  },
};

/**
 * DR-SB-002: Timer Display
 * Large centered countdown timer in status bar
 */
export const drSb002PlatformDocs: AllPlatformDocs = {
  web: createWebDoc({
    architecture: {
      summary:
        'Timer Display is a centered div within DraftStatusBar showing seconds remaining. ' +
        'Supports both draft timer and pre-draft countdown modes.',
      componentPath: 'components/vx2/draft-room/components/DraftStatusBar.tsx',
      componentTree: `DraftStatusBar
  └── div.timerContainer
        └── div.timerValue (displays seconds)`,
      parentComponent: 'DraftStatusBar',
      dataFlow:
        'Receives timerSeconds and preDraftCountdown from parent. ' +
        'Conditionally displays countdown or timer based on draftStatus.',
      stateManagement:
        'Stateless display component. Timer value controlled by parent via props.',
      dependencies: ['react', 'DraftStatusBar.module.css'],
      relatedFiles: ['components/vx2/draft-room/hooks/useDraftTimer.ts'],
    },
    visuals: {
      dimensions: 'Font size defined in CSS (large, ~48px)',
      touchTarget: 'Not interactive - display only',
      spacing: 'Centered horizontally, positioned below Dynamic Island safe area',
      colors: {
        text: '#FFFFFF',
        background: 'Inherits from DraftStatusBar (dynamic)',
      },
      typography: 'Bold monospace for consistent digit width',
      assets: [],
      animations: 'Inherits shake animation from parent container',
    },
    bestPractices: {
      summary:
        'Timer uses aria-live="polite" for screen reader announcements. ' +
        'Displays pre-draft countdown when in waiting state.',
      doList: [
        'DO: Use aria-live for timer updates',
        'DO: Show pre-draft countdown when draftStatus=waiting',
        'DO: Use monospace font to prevent layout shift',
      ],
      dontList: [
        "DON'T: Update timer more than once per second",
        'DON\'T: Use aria-live="assertive" (too disruptive)',
      ],
      performanceTips: [
        'Timer updates are throttled by parent hook',
        'CSS transforms for animations (GPU accelerated)',
      ],
      accessibilityRequirements: [
        'aria-live="polite" announces timer changes',
        'aria-label provides context (X seconds remaining)',
      ],
      designSystemRefs: ['TopDog Design System: Typography/Display'],
      officialDocs: ['https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-live'],
    },
    improvements: [],
  }),
  crossPlatform: {
    sharedBehavior: 'All platforms display same timer value synchronized via WebSocket',
    keyDivergences: [
      'Web: CSS animations | iOS: Core Animation (planned)',
      'Web: No haptics | iOS: Haptic pulse at key thresholds (planned)',
    ],
    featureParity: {
      timerDisplay: true,
      preDraftCountdown: true,
      urgentColorChange: true,
      hapticPulse: false,
    },
  },
};

/**
 * DR-SB-003: Timer Background
 * Dynamic background color system for status bar
 */
export const drSb003PlatformDocs: AllPlatformDocs = {
  web: createWebDoc({
    architecture: {
      summary:
        'Timer Background is controlled via CSS custom properties and conditional classes ' +
        'in DraftStatusBar. Background changes based on turn state and timer value.',
      componentPath: 'components/vx2/draft-room/components/DraftStatusBar.tsx',
      componentTree: `DraftStatusBar (container with dynamic background)
  └── getContainerStyles() → CSS custom properties
  └── showTiledBg → 'bg-tiled' class`,
      parentComponent: 'DraftRoomVX2',
      dataFlow:
        'isUserTurn and timerSeconds props determine background color. ' +
        'getContainerStyles() returns CSS variables for --bg-color.',
      stateManagement: 'Computed from props - no internal state',
      dependencies: ['BG_COLORS', 'PICKS_BAR_THEME from core/constants/colors'],
      relatedFiles: [
        'components/vx2/core/constants/colors.ts',
        'styles/tokens.css (bg-tiled class)',
      ],
    },
    visuals: {
      dimensions: 'Full width, HEADER_HEIGHT (64px)',
      touchTarget: 'N/A - background element',
      spacing: 'N/A',
      colors: {
        idle: '#1F2937 (BG_COLORS.primary)',
        onClock: 'Blue tiled pattern (bg-tiled class)',
        urgent: '#DC2626 (PICKS_BAR_THEME.onTheClockUrgent)',
        preDraft: '#1F2937 (matches idle)',
      },
      assets: [],
      animations: 'Smooth color transition on state change',
    },
    bestPractices: {
      summary:
        'Background uses CSS custom properties for dynamic theming. ' +
        'Tiled pattern uses repeating CSS gradient for performance.',
      doList: [
        'DO: Use CSS custom properties for dynamic colors',
        'DO: Define colors in constants file for consistency',
        'DO: Use GPU-accelerated transitions',
      ],
      dontList: [
        "DON'T: Use inline styles for static colors",
        "DON'T: Re-compute styles on every render (memoize if needed)",
      ],
      performanceTips: [
        'CSS custom properties update efficiently',
        'Tiled background uses CSS gradient (no image request)',
      ],
      accessibilityRequirements: [
        'Color alone does not convey state - timer value also changes',
        'Sufficient contrast ratio maintained in all states',
      ],
      designSystemRefs: ['TopDog Design System: Colors/Semantic'],
      officialDocs: [],
    },
    improvements: [
      {
        id: 'IMP-WEB-DR-SB-003-1',
        category: 'accessibility',
        title: 'Add reduced-motion alternative for tiled animation',
        summary: 'Tiled background may animate. Respect prefers-reduced-motion.',
        currentState: 'Tiled pattern may have subtle animation',
        proposedChange: 'Add @media (prefers-reduced-motion) rule',
        impact: 'low',
        effort: 'small',
        rationale: 'Motion sensitivity accommodation',
      },
    ],
  }),
  crossPlatform: {
    sharedBehavior: 'All platforms use same color tokens and state logic',
    keyDivergences: [
      'Web: CSS custom properties | iOS: SwiftUI @State bindings (planned)',
    ],
    featureParity: {
      dynamicBackground: true,
      tiledPattern: true,
      urgentState: true,
    },
  },
};

/**
 * DR-SB-004: Your Turn Indicator
 * Visual state when it's the current user's turn
 */
export const drSb004PlatformDocs: AllPlatformDocs = {
  web: createWebDoc({
    architecture: {
      summary:
        'Your Turn state is indicated by background color change and the shake animation. ' +
        'Controlled by isUserTurn prop in DraftStatusBar.',
      componentPath: 'components/vx2/draft-room/components/DraftStatusBar.tsx',
      componentTree: `DraftStatusBar
  └── isUserTurn → background color logic
  └── shouldShake (isUserTurn && timer=0) → shake animation`,
      parentComponent: 'DraftRoomVX2',
      dataFlow:
        'isUserTurn boolean from parent determines background color. ' +
        'Combined with timerSeconds for shake trigger.',
      stateManagement: 'shakeKey state triggers re-mount for animation restart',
      dependencies: ['react', 'useEffect for shake timing'],
      relatedFiles: ['components/vx2/draft-room/hooks/useDraftState.ts'],
    },
    visuals: {
      dimensions: 'Affects entire header background',
      touchTarget: 'N/A - visual indicator',
      spacing: 'N/A',
      colors: {
        yourTurn: 'Blue tiled (>9s) or red urgent (<=9s)',
        notYourTurn: '#1F2937 dark',
      },
      assets: [],
      animations:
        'Shake animation class (CSS keyframes) when timer hits 0. ' +
        'Grace period callback after animation completes.',
    },
    bestPractices: {
      summary:
        'Your Turn is communicated through multiple channels: color, position in picks bar, ' +
        'and shake animation. Never rely on color alone.',
      doList: [
        'DO: Combine visual indicators (color + animation + position)',
        'DO: Use aria-live to announce turn changes',
        'DO: Schedule grace period callback after shake animation',
      ],
      dontList: [
        "DON'T: Trigger shake more than once per turn",
        "DON'T: Allow interactions during shake animation",
      ],
      performanceTips: [
        'shakeScheduledRef prevents duplicate animations',
        'useEffect cleanup cancels timeout on unmount',
      ],
      accessibilityRequirements: [
        'Announce turn change via aria-live region',
        'Do not rely solely on color to indicate turn',
      ],
      designSystemRefs: ['TopDog Design System: States/Active'],
      officialDocs: [],
    },
    improvements: [
      {
        id: 'IMP-WEB-DR-SB-004-1',
        category: 'ux',
        title: 'Add sound effect option for turn notification',
        summary: 'Visual-only turn notification may be missed if tab is not focused.',
        currentState: 'Visual indicator only',
        proposedChange: 'Add optional audio chime with user preference',
        impact: 'medium',
        effort: 'medium',
        rationale: 'Users may miss their turn if multitasking',
      },
    ],
  }),
  crossPlatform: {
    sharedBehavior: 'All platforms indicate turn via color and animation',
    keyDivergences: [
      'Web: CSS shake animation | iOS: Core Animation + haptics (planned)',
      'Web: No haptics | iOS: Strong haptic on turn start (planned)',
      'Web: Optional sound | iOS: Native notification sound (planned)',
    ],
    featureParity: {
      colorIndicator: true,
      shakeAnimation: true,
      hapticFeedback: false,
      soundNotification: false,
    },
  },
};

/**
 * DR-SB-005: Pre-Draft Countdown
 * 60-second countdown before draft starts
 */
export const drSb005PlatformDocs: AllPlatformDocs = {
  web: createWebDoc({
    architecture: {
      summary:
        'Pre-Draft Countdown reuses the timer display component but shows ' +
        'preDraftCountdown value when draftStatus is "waiting".',
      componentPath: 'components/vx2/draft-room/components/DraftStatusBar.tsx',
      componentTree: `DraftStatusBar
  └── timerContainer
        └── Conditional: preDraftCountdown when draftStatus='waiting'`,
      parentComponent: 'DraftRoomVX2',
      dataFlow:
        'preDraftCountdown prop (number | null) from parent. ' +
        'Displayed when draftStatus="waiting" and countdown > 0.',
      stateManagement: 'Controlled by parent - no internal state for countdown',
      dependencies: ['react'],
      relatedFiles: ['components/vx2/draft-room/hooks/useDraftState.ts'],
    },
    visuals: {
      dimensions: 'Same as Timer Display',
      touchTarget: 'N/A - display only',
      spacing: 'Same as Timer Display',
      colors: {
        background: '#1F2937 (matches PicksBar pre-draft)',
        text: '#FFFFFF',
      },
      typography: 'Same as Timer Display',
      assets: [],
    },
    bestPractices: {
      summary:
        'Pre-draft countdown shares UI with draft timer for consistency. ' +
        'aria-label changes to reflect "Draft starts in X seconds".',
      doList: [
        'DO: Use same styling as draft timer for visual consistency',
        'DO: Update aria-label to reflect pre-draft context',
        'DO: Match background color with PicksBar pre-draft state',
      ],
      dontList: [
        "DON'T: Show shake animation during pre-draft",
        "DON'T: Allow leave during final countdown",
      ],
      performanceTips: ['Same as Timer Display'],
      accessibilityRequirements: [
        'aria-label: "Draft starts in X seconds"',
        'aria-live="polite" for countdown updates',
      ],
      designSystemRefs: [],
      officialDocs: [],
    },
    improvements: [],
  }),
  crossPlatform: {
    sharedBehavior: 'All platforms show same countdown value from server',
    keyDivergences: [],
    featureParity: {
      countdownDisplay: true,
      matchingPicksBarColor: true,
    },
  },
};

// ============================================================================
// Picks Bar Elements (DR-PB-*)
// ============================================================================

/**
 * DR-PB-001: Picks Bar Container
 * Horizontal scrolling container for draft pick cards
 */
export const drPb001PlatformDocs: AllPlatformDocs = {
  web: createWebDoc({
    architecture: {
      summary:
        'PicksBar is a horizontally scrolling container showing all draft picks. ' +
        'Auto-scrolls to center the current pick and supports drag/touch scrolling.',
      componentPath: 'components/vx2/draft-room/components/PicksBar.tsx',
      componentTree: `DraftRoomVX2
  └── PicksBar
        └── scrollRef (div with overflow-x: auto)
              └── Pick cards array`,
      parentComponent: 'DraftRoomVX2',
      childComponents: ['PicksBarCard', 'ScrollingUsername', 'ShareOptionsModal'],
      dataFlow:
        'Receives picks[], participants[], currentPickNumber from DraftRoomVX2. ' +
        'Calculates snake draft positions and renders cards.',
      stateManagement:
        'scrollRef for imperative scroll control. ' +
        'shareModalOpen state for share modal. ' +
        'useMemo for pick calculations.',
      dependencies: [
        'react',
        'useRef',
        'useMemo',
        'useCallback',
        'useImageShare hook',
        'PICKS_BAR_THEME constants',
      ],
      relatedFiles: [
        'components/vx2/draft-room/components/PicksBar.module.css',
        'components/vx2/draft-room/components/PicksBarCard.tsx',
        'components/vx2/draft-room/hooks/useImageShare.ts',
      ],
    },
    visuals: {
      dimensions: '116px height (PICKS_BAR_PX.containerHeight)',
      touchTarget: 'Cards are 96px wide, entire bar is scrollable',
      spacing: '8px horizontal padding, 2px top padding',
      colors: {
        background: 'Token --picks-bar-container-bg',
        cardBorder: 'Dynamic per participant color',
      },
      assets: [],
      animations: 'Smooth scroll to current pick on mount and pick change',
    },
    bestPractices: {
      summary:
        'PicksBar uses CSS scroll-snap for card alignment. ' +
        'Auto-scroll is debounced to avoid interrupting user scrolling.',
      doList: [
        'DO: Use scroll-snap-type for predictable stopping points',
        'DO: Debounce auto-scroll to respect user input',
        'DO: Show position tracker gradient on each card',
      ],
      dontList: [
        "DON'T: Force scroll while user is actively dragging",
        "DON'T: Re-render entire list on scroll position change",
      ],
      performanceTips: [
        'useMemo for pick calculations (expensive snake math)',
        'React.memo on PicksBarCard to prevent card re-renders',
        'CSS scroll-snap is GPU accelerated',
      ],
      accessibilityRequirements: [
        'role="list" on container',
        'role="listitem" on each card',
        'aria-current="true" on current pick',
      ],
      designSystemRefs: ['TopDog Design System: Components/PicksBar'],
      officialDocs: ['https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-type'],
    },
    improvements: [
      {
        id: 'IMP-WEB-DR-PB-001-1',
        category: 'performance',
        title: 'Virtualize picks bar for large drafts',
        summary: 'Rendering 200+ pick cards impacts initial load time.',
        currentState: 'All cards rendered upfront',
        proposedChange: 'Implement windowing (react-window or custom)',
        impact: 'medium',
        effort: 'large',
        rationale: '18-team drafts = 324 picks rendered at once',
      },
    ],
  }),
  crossPlatform: {
    sharedBehavior:
      'All platforms show same pick data with auto-scroll to current',
    keyDivergences: [
      'Web: CSS scroll-snap | iOS: UICollectionView with paging (planned)',
      'Web: Mouse drag + touch | iOS: Native scroll physics (planned)',
    ],
    featureParity: {
      horizontalScroll: true,
      autoScrollToCurrent: true,
      participantColors: true,
      positionTracker: true,
    },
  },
};

/**
 * DR-PB-002: Pick Slot
 * Individual pick slot in the picks bar
 */
export const drPb002PlatformDocs: AllPlatformDocs = {
  web: createWebDoc({
    architecture: {
      summary:
        'Pick Slot is rendered as part of the picks array in PicksBar. ' +
        'Each slot shows pick number, participant info, and picked player.',
      componentPath: 'components/vx2/draft-room/components/PicksBar.tsx',
      componentTree: `PicksBar
  └── picks.map() → Pick card div
        └── Header (username)
        └── Content (avatar/player)
        └── Footer (pick number, position)`,
      parentComponent: 'PicksBar',
      dataFlow:
        'Pick data from picks[] prop. Participant color from participants[]. ' +
        'Current pick highlighted based on currentPickNumber.',
      stateManagement: 'Computed from props - cards are stateless',
      dependencies: ['PICKS_BAR_PX constants', 'PICKS_BAR_THEME colors'],
    },
    visuals: {
      dimensions: '96px width × 78px content height',
      touchTarget: 'Full card is tappable (96×116px)',
      spacing: '0px gap between cards, 4px border width',
      colors: {
        cardBackground: 'Token --picks-bar-card-bg',
        borderColor: 'Participant-specific from color assignment',
      },
      cornerRadius: '6px (PICKS_BAR_PX.cardBorderRadius)',
      assets: [],
    },
    bestPractices: {
      summary:
        'Pick slots use consistent dimensions from PICKS_BAR_PX constants. ' +
        'Border color provides participant identification.',
      doList: [
        'DO: Use constants for all dimensions',
        'DO: Maintain consistent card size regardless of content',
        'DO: Truncate long usernames with ellipsis',
      ],
      dontList: [
        "DON'T: Allow card width to vary",
        "DON'T: Hide border on empty picks",
      ],
      performanceTips: ['Cards are memoized to prevent re-renders'],
      accessibilityRequirements: [
        'role="listitem"',
        'aria-label describing pick number and participant',
      ],
      designSystemRefs: [],
      officialDocs: [],
    },
    improvements: [],
  }),
  crossPlatform: {
    sharedBehavior: 'All platforms use same card dimensions and border colors',
    keyDivergences: [],
    featureParity: {
      cardDimensions: true,
      participantBorder: true,
    },
  },
};

/**
 * DR-PB-003: Pick Avatar
 * Avatar/logo display within pick slot
 */
export const drPb003PlatformDocs: AllPlatformDocs = {
  web: createWebDoc({
    architecture: {
      summary:
        'Pick Avatar displays team logo for completed picks, user avatar for empty picks, ' +
        'or timer for current pick.',
      componentPath: 'components/vx2/draft-room/components/PicksBar.tsx',
      componentTree: `Pick card content area
  └── Conditional rendering:
        └── Completed: Team logo + player name
        └── Current: Timer display
        └── Future: Avatar/placeholder`,
      parentComponent: 'Pick Slot (within PicksBar)',
      dataFlow:
        'Pick status determines content. Player data provides team logo. ' +
        'Timer value for current pick only.',
      stateManagement: 'Stateless - computed from pick data',
      dependencies: ['Team logo assets', 'Avatar placeholder'],
    },
    visuals: {
      dimensions: '48×48px avatar area',
      touchTarget: 'Inherits from parent card',
      spacing: 'Centered in content area',
      colors: {
        avatarBackground: 'Participant color (faded)',
        placeholder: 'Gray silhouette',
      },
      cornerRadius: '50% (circular)',
      assets: ['Team logos (CDN)', 'Default avatar (SVG)'],
    },
    bestPractices: {
      summary:
        'Avatar supports multiple states: empty, current (timer), completed (logo). ' +
        'Uses lazy loading for team logo images.',
      doList: [
        'DO: Lazy load team logos',
        'DO: Provide fallback for missing logos',
        'DO: Use circular mask consistently',
      ],
      dontList: [
        "DON'T: Block render waiting for logo load",
        "DON'T: Show broken image if logo fails",
      ],
      performanceTips: [
        'loading="lazy" on logo images',
        'Inline SVG for placeholder (no request)',
      ],
      accessibilityRequirements: [
        'alt text on team logos',
        'Empty avatar has aria-hidden',
      ],
      designSystemRefs: [],
      officialDocs: [],
    },
    improvements: [],
  }),
  crossPlatform: {
    sharedBehavior: 'All platforms show same avatar states',
    keyDivergences: [
      'Web: <img> with lazy loading | iOS: AsyncImage (planned)',
    ],
    featureParity: {
      teamLogos: true,
      timerInCurrentPick: true,
      placeholderAvatar: true,
    },
  },
};

/**
 * DR-PB-004: Pick Number Badge
 * Small badge showing pick number
 */
export const drPb004PlatformDocs: AllPlatformDocs = {
  web: createWebDoc({
    architecture: {
      summary:
        'Pick Number Badge displays the overall pick number (1-324 for 18-team draft). ' +
        'Positioned in top-left of pick card.',
      componentPath: 'components/vx2/draft-room/components/PicksBar.tsx',
      componentTree: `Pick card
  └── pickNumberRow (top left)
        └── pickNumber span`,
      parentComponent: 'Pick Slot',
      dataFlow: 'Pick index + 1 displayed. No calculation needed.',
      stateManagement: 'Stateless',
      dependencies: ['PICKS_BAR_PX.pickNumberFontSize'],
    },
    visuals: {
      dimensions: '9px font size (PICKS_BAR_PX.pickNumberFontSize)',
      touchTarget: 'N/A - display only',
      spacing: '2px margin-left, 0px top',
      colors: {
        text: 'Token --picks-bar-pick-number-text',
      },
      typography: 'Monospace, small caps',
      assets: [],
    },
    bestPractices: {
      summary: 'Pick number is purely informational, positioned consistently.',
      doList: [
        'DO: Use monospace for consistent number widths',
        'DO: Keep font size small to not compete with content',
      ],
      dontList: ["DON'T: Make pick number interactive"],
      performanceTips: [],
      accessibilityRequirements: ['Included in card aria-label'],
      designSystemRefs: [],
      officialDocs: [],
    },
    improvements: [],
  }),
  crossPlatform: {
    sharedBehavior: 'All platforms display pick number in same position',
    keyDivergences: [],
    featureParity: { pickNumberDisplay: true },
  },
};

/**
 * DR-PB-005: Current Pick Indicator
 * Visual indicator for the currently active pick
 */
export const drPb005PlatformDocs: AllPlatformDocs = {
  web: createWebDoc({
    architecture: {
      summary:
        'Current Pick is indicated by special styling on the pick card ' +
        'and centered position via auto-scroll.',
      componentPath: 'components/vx2/draft-room/components/PicksBar.tsx',
      componentTree: `PicksBar
  └── picks.map() with isCurrent check
        └── Current pick card gets special classes`,
      parentComponent: 'PicksBar',
      dataFlow:
        'currentPickNumber prop compared to pick index. ' +
        'isCurrent = pickIndex === currentPickNumber - 1.',
      stateManagement: 'Computed boolean per card',
      dependencies: [],
    },
    visuals: {
      dimensions: 'Same as other cards',
      touchTarget: 'Same as other cards',
      spacing: 'Centered via scrollIntoView',
      colors: {
        border: 'Enhanced/glowing effect',
        background: 'Highlighted',
      },
      assets: [],
      animations: 'Subtle pulse or glow animation',
    },
    bestPractices: {
      summary:
        'Current pick stands out through border enhancement and auto-scroll centering.',
      doList: [
        'DO: Auto-scroll to center current pick',
        'DO: Use aria-current="true" for accessibility',
        'DO: Maintain indicator even during user scroll',
      ],
      dontList: [
        "DON'T: Override user scroll while they're interacting",
        "DON'T: Use only color to indicate current",
      ],
      performanceTips: [
        'Debounce auto-scroll after pick change',
        'requestAnimationFrame for scroll animation',
      ],
      accessibilityRequirements: [
        'aria-current="true" on current pick card',
        'Focus management for keyboard users',
      ],
      designSystemRefs: [],
      officialDocs: [],
    },
    improvements: [],
  }),
  crossPlatform: {
    sharedBehavior: 'All platforms highlight current pick and auto-scroll',
    keyDivergences: [],
    featureParity: {
      currentIndicator: true,
      autoScroll: true,
    },
  },
};

/**
 * DR-PB-006: Scroll Container
 * Scrollable wrapper for picks bar
 */
export const drPb006PlatformDocs: AllPlatformDocs = {
  web: createWebDoc({
    architecture: {
      summary:
        'Scroll Container is the div with overflow-x: auto wrapping pick cards. ' +
        'Provides native scroll behavior with custom scrollbar styling.',
      componentPath: 'components/vx2/draft-room/components/PicksBar.tsx',
      componentTree: `PicksBar
  └── scrollRef div (overflow-x: auto)
        └── Inner flex container for cards`,
      parentComponent: 'PicksBar',
      dataFlow: 'scrollRef used for imperative scrollIntoView calls',
      stateManagement: 'useRef for scroll element reference',
      dependencies: [],
    },
    visuals: {
      dimensions: 'Full width of PicksBar minus padding',
      touchTarget: 'Entire container responds to scroll gestures',
      spacing: '-webkit-scrollbar-width: none (hidden scrollbar)',
      colors: {},
      assets: [],
    },
    bestPractices: {
      summary:
        'Scroll container hides scrollbar but maintains scroll functionality. ' +
        'Uses CSS scroll-snap for predictable stopping.',
      doList: [
        'DO: Hide scrollbar with CSS',
        'DO: Use scroll-snap-type: x mandatory',
        'DO: Support touch and mouse drag',
      ],
      dontList: [
        "DON'T: Prevent scroll momentum",
        "DON'T: Block scroll events for JS handling",
      ],
      performanceTips: [
        'Native scroll is GPU accelerated',
        'Avoid scroll event listeners (use IntersectionObserver if needed)',
      ],
      accessibilityRequirements: [
        'role="list" on scrollable content',
        'Keyboard users can scroll with arrow keys',
      ],
      designSystemRefs: [],
      officialDocs: [],
    },
    improvements: [],
  }),
  crossPlatform: {
    sharedBehavior: 'All platforms provide smooth horizontal scrolling',
    keyDivergences: [
      'Web: CSS scroll | iOS: UIScrollView (planned)',
    ],
    featureParity: {
      hiddenScrollbar: true,
      scrollSnap: true,
      touchScroll: true,
    },
  },
};

// ============================================================================
// Footer Elements (DR-FT-*)
// ============================================================================

/**
 * DR-FT-001: Footer Container
 * Main footer navigation bar
 */
export const drFt001PlatformDocs: AllPlatformDocs = {
  web: createWebDoc({
    architecture: {
      summary:
        'DraftFooter is a bottom-fixed navigation bar with 5 tabs. ' +
        'Uses native nav element with tablist role.',
      componentPath: 'components/vx2/draft-room/components/DraftFooter.tsx',
      componentTree: `DraftRoomVX2
  └── DraftFooter
        └── nav (role="tablist")
              └── Tab buttons (5)
              └── Home Indicator bar`,
      parentComponent: 'DraftRoomVX2',
      childComponents: ['Tab buttons', 'CountBadge', 'Home Indicator'],
      dataFlow:
        'activeTab and onTabChange props from parent. ' +
        'queueCount for badge display.',
      stateManagement: 'Stateless - controlled by parent',
      dependencies: ['react', 'cn (classnames)', 'DraftFooter.module.css'],
      relatedFiles: ['components/vx2/draft-room/components/DraftFooter.module.css'],
    },
    visuals: {
      dimensions: '70px height (FOOTER_PX.containerHeight)',
      touchTarget: '44px minimum tab height (FOOTER_PX.tabMinHeight)',
      spacing: 'Equal width tabs, flex: 1',
      colors: {
        background: 'Token --footer-bg',
        borderTop: 'Token --footer-border',
        activeTab: 'Token --footer-active',
        inactiveTab: 'Token --footer-inactive',
      },
      cornerRadius: '0 (full-width footer)',
      assets: [],
    },
    bestPractices: {
      summary:
        'Footer uses semantic nav element with proper ARIA roles. ' +
        'Icons have both filled and outlined states for active indication.',
      doList: [
        'DO: Use role="tablist" on nav, role="tab" on buttons',
        'DO: Set aria-selected on active tab',
        'DO: Provide aria-label on each tab',
      ],
      dontList: [
        "DON'T: Use div for navigation - use nav element",
        "DON'T: Rely solely on color for active state",
      ],
      performanceTips: [
        'Icons are inline SVG (no requests)',
        'Minimal re-renders via stable onTabChange',
      ],
      accessibilityRequirements: [
        'role="tablist" on container',
        'role="tab" on each button',
        'aria-selected for active state',
        'aria-label on each tab',
      ],
      designSystemRefs: ['TopDog Design System: Navigation/TabBar'],
      officialDocs: ['https://www.w3.org/WAI/ARIA/apg/patterns/tabs/'],
    },
    improvements: [],
  }),
  crossPlatform: {
    sharedBehavior: 'All platforms have 5 tabs with same icons and labels',
    keyDivergences: [
      'Web: Fixed position | iOS: UITabBarController (planned)',
      'Web: No haptics | iOS: Selection haptic (planned)',
    ],
    featureParity: {
      fiveTabsLayout: true,
      activeIndicator: true,
      queueBadge: true,
      homeIndicator: true,
    },
  },
};

/**
 * DR-FT-002: Tab - Players
 */
export const drFt002PlatformDocs: AllPlatformDocs = {
  web: createWebDoc({
    architecture: {
      summary: 'Players tab button in DraftFooter. Shows player list panel when active.',
      componentPath: 'components/vx2/draft-room/components/DraftFooter.tsx',
      componentTree: `DraftFooter
  └── TABS array → 'players' config
        └── Tab button with PlayersIcon`,
      parentComponent: 'DraftFooter',
      dataFlow: "onClick triggers onTabChange('players')",
      stateManagement: 'Controlled by parent activeTab',
      dependencies: [],
    },
    visuals: {
      dimensions: 'Flex: 1 (equal width with siblings)',
      touchTarget: '44px min height',
      spacing: 'Centered icon + label',
      colors: {
        activeIcon: 'Filled white',
        inactiveIcon: 'Outlined gray',
      },
      assets: ['PlayersIcon (inline SVG)'],
    },
    bestPractices: {
      summary: 'Tab follows standard pattern with icon + label.',
      doList: [
        'DO: Use filled icon for active, outlined for inactive',
        'DO: Include aria-label "Players"',
      ],
      dontList: [],
      performanceTips: [],
      accessibilityRequirements: ['aria-label="Players"', 'aria-selected'],
      designSystemRefs: [],
      officialDocs: [],
    },
    improvements: [],
  }),
  crossPlatform: {
    sharedBehavior: 'All platforms show Players tab first',
    keyDivergences: [],
    featureParity: { playersTab: true },
  },
};

/**
 * DR-FT-003: Tab - Queue
 */
export const drFt003PlatformDocs: AllPlatformDocs = {
  web: createWebDoc({
    architecture: {
      summary: 'Queue tab with badge showing queue count. Plus icon indicates adding players.',
      componentPath: 'components/vx2/draft-room/components/DraftFooter.tsx',
      componentTree: `DraftFooter
  └── TABS array → 'queue' config (hasBadge: true)
        └── Tab button with QueueIcon + CountBadge`,
      parentComponent: 'DraftFooter',
      dataFlow: "queueCount prop displayed in badge. onClick → onTabChange('queue')",
      stateManagement: 'Badge conditionally rendered based on queueCount > 0',
      dependencies: ['CountBadge component'],
    },
    visuals: {
      dimensions: 'Same as other tabs',
      touchTarget: '44px min height',
      spacing: 'Badge positioned offset from icon',
      colors: {
        badge: 'Red background, white text',
      },
      assets: ['QueueIcon (plus sign)'],
    },
    bestPractices: {
      summary: 'Queue tab shows badge only when count > 0.',
      doList: [
        'DO: Hide badge when queue is empty',
        'DO: Show 99+ for counts over 99',
      ],
      dontList: ["DON'T: Show badge with 0"],
      performanceTips: [],
      accessibilityRequirements: [
        'aria-label should include queue count',
        'Badge has aria-hidden (info in label)',
      ],
      designSystemRefs: [],
      officialDocs: [],
    },
    improvements: [],
  }),
  crossPlatform: {
    sharedBehavior: 'All platforms show queue count badge',
    keyDivergences: [],
    featureParity: { queueTab: true, badgeCount: true },
  },
};

/**
 * DR-FT-004: Tab - Rosters
 */
export const drFt004PlatformDocs: AllPlatformDocs = {
  web: createWebDoc({
    architecture: {
      summary: 'Roster tab shows team rosters. Icon is horizontal lines.',
      componentPath: 'components/vx2/draft-room/components/DraftFooter.tsx',
      componentTree: `DraftFooter
  └── TABS array → 'rosters' config
        └── Tab button with RosterIcon`,
      parentComponent: 'DraftFooter',
      dataFlow: "onClick → onTabChange('rosters')",
      stateManagement: 'Controlled by parent',
      dependencies: [],
    },
    visuals: {
      dimensions: 'Same as other tabs',
      touchTarget: '44px min height',
      spacing: 'Centered',
      colors: {},
      assets: ['RosterIcon (horizontal lines)'],
    },
    bestPractices: {
      summary: 'Standard tab following common pattern.',
      doList: [],
      dontList: [],
      performanceTips: [],
      accessibilityRequirements: ['aria-label="Roster"'],
      designSystemRefs: [],
      officialDocs: [],
    },
    improvements: [],
  }),
  crossPlatform: {
    sharedBehavior: 'All platforms show Roster tab',
    keyDivergences: [],
    featureParity: { rosterTab: true },
  },
};

/**
 * DR-FT-005: Tab - Board
 */
export const drFt005PlatformDocs: AllPlatformDocs = {
  web: createWebDoc({
    architecture: {
      summary: 'Board tab shows draft board grid. Icon is 3x3 grid.',
      componentPath: 'components/vx2/draft-room/components/DraftFooter.tsx',
      componentTree: `DraftFooter
  └── TABS array → 'board' config
        └── Tab button with BoardIcon`,
      parentComponent: 'DraftFooter',
      dataFlow: "onClick → onTabChange('board')",
      stateManagement: 'Controlled by parent',
      dependencies: [],
    },
    visuals: {
      dimensions: 'Same as other tabs',
      touchTarget: '44px min height',
      spacing: 'Centered',
      colors: {},
      assets: ['BoardIcon (3x3 grid)'],
    },
    bestPractices: {
      summary: 'Standard tab following common pattern.',
      doList: [],
      dontList: [],
      performanceTips: [],
      accessibilityRequirements: ['aria-label="Board"'],
      designSystemRefs: [],
      officialDocs: [],
    },
    improvements: [],
  }),
  crossPlatform: {
    sharedBehavior: 'All platforms show Board tab',
    keyDivergences: [],
    featureParity: { boardTab: true },
  },
};

/**
 * DR-FT-006: Tab - Info
 */
export const drFt006PlatformDocs: AllPlatformDocs = {
  web: createWebDoc({
    architecture: {
      summary: 'Info tab shows draft information modal. Icon is circled i.',
      componentPath: 'components/vx2/draft-room/components/DraftFooter.tsx',
      componentTree: `DraftFooter
  └── TABS array → 'info' config
        └── Tab button with InfoIcon`,
      parentComponent: 'DraftFooter',
      dataFlow: "onClick → onTabChange('info')",
      stateManagement: 'Controlled by parent',
      dependencies: [],
    },
    visuals: {
      dimensions: 'Same as other tabs',
      touchTarget: '44px min height',
      spacing: 'Centered',
      colors: {},
      assets: ['InfoIcon (circled i)'],
    },
    bestPractices: {
      summary: 'Standard tab following common pattern.',
      doList: [],
      dontList: [],
      performanceTips: [],
      accessibilityRequirements: ['aria-label="Info"'],
      designSystemRefs: [],
      officialDocs: [],
    },
    improvements: [],
  }),
  crossPlatform: {
    sharedBehavior: 'All platforms show Info tab',
    keyDivergences: [],
    featureParity: { infoTab: true },
  },
};

/**
 * DR-FT-007: Home Indicator Bar
 * iOS-style home indicator at bottom of footer
 */
export const drFt007PlatformDocs: AllPlatformDocs = {
  web: createWebDoc({
    architecture: {
      summary:
        'Home Indicator is a visual-only element mimicking iOS home indicator. ' +
        'Purely decorative on web.',
      componentPath: 'components/vx2/draft-room/components/DraftFooter.tsx',
      componentTree: `DraftFooter
  └── div.homeIndicator (after tab bar)`,
      parentComponent: 'DraftFooter',
      dataFlow: 'N/A - purely decorative',
      stateManagement: 'N/A',
      dependencies: [],
    },
    visuals: {
      dimensions: '134px width × 5px height',
      touchTarget: 'N/A - not interactive',
      spacing: '4px margin top and bottom',
      colors: {
        background: 'Semi-transparent white/gray',
      },
      cornerRadius: '2.5px (rounded pill shape)',
      assets: [],
    },
    bestPractices: {
      summary:
        'Home indicator maintains visual parity with iOS. aria-hidden on web.',
      doList: [
        'DO: Use aria-hidden="true" (decorative)',
        'DO: Match iOS home indicator dimensions',
      ],
      dontList: ["DON'T: Make it interactive on web"],
      performanceTips: [],
      accessibilityRequirements: ['aria-hidden="true"'],
      designSystemRefs: ['Apple HIG: Home Indicator'],
      officialDocs: [],
    },
    improvements: [],
  }),
  crossPlatform: {
    sharedBehavior: 'Visual indicator at footer bottom',
    keyDivergences: [
      'Web: Decorative only | iOS: System-provided swipe gesture area',
    ],
    featureParity: {
      homeIndicatorVisual: true,
      swipeToHome: false, // iOS only
    },
  },
};

// ============================================================================
// Export Map
// ============================================================================

export const platformDocsMap: Record<string, AllPlatformDocs> = {
  // Status Bar
  'DR-SB-001': drSb001PlatformDocs,
  'DR-SB-002': drSb002PlatformDocs,
  'DR-SB-003': drSb003PlatformDocs,
  'DR-SB-004': drSb004PlatformDocs,
  'DR-SB-005': drSb005PlatformDocs,
  // Picks Bar
  'DR-PB-001': drPb001PlatformDocs,
  'DR-PB-002': drPb002PlatformDocs,
  'DR-PB-003': drPb003PlatformDocs,
  'DR-PB-004': drPb004PlatformDocs,
  'DR-PB-005': drPb005PlatformDocs,
  'DR-PB-006': drPb006PlatformDocs,
  // Footer
  'DR-FT-001': drFt001PlatformDocs,
  'DR-FT-002': drFt002PlatformDocs,
  'DR-FT-003': drFt003PlatformDocs,
  'DR-FT-004': drFt004PlatformDocs,
  'DR-FT-005': drFt005PlatformDocs,
  'DR-FT-006': drFt006PlatformDocs,
  'DR-FT-007': drFt007PlatformDocs,
};
