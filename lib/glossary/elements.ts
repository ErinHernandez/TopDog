/**
 * TopDog Glossary - Draft Room Elements Data
 *
 * Complete documentation of all UI elements in the Draft Room module,
 * including Status Bar (Group A) and Footer (Group I) elements with
 * detailed position, styling, interaction, and state specifications.
 */

import { platformDocsMap } from './platformDocs';
import type {
  GlossaryElement,
  ScreenDefinition,
  ElementStateSpec,
  InteractionSpec,
  AccessibilitySpec,
  CodeReference,
} from './types';

const now = new Date().toISOString();
const defaultAuthor = 'glossary-system';

// ============================================================================
// Draft Room Status Bar Elements (Group A)
// ============================================================================

/**
 * DR-SB-001: Leave Button
 * 44x44px circular button in top-left corner of status bar
 * Allows user to exit the draft room
 */
const drSb001LeaveButton: GlossaryElement = {
  id: 'DR-SB-001',
  name: 'Leave Button',
  description: 'Circular button to exit the draft room, positioned in top-left corner of status bar. Triggers a confirmation modal before actually leaving to prevent accidental exits during critical draft moments.',
  module: 'draft-room',
  screen: 'draft-room-main',
  parent: 'StatusBar',
  elementType: 'button',

  position: { x: 8, y: 8 },
  dimensions: { width: 44, height: 44 },
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  margin: { top: 8, right: 0, bottom: 0, left: 8 },
  zIndex: 100,

  style: {
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    border: {
      width: 1,
      color: '#E5E7EB',
      style: 'solid',
      radius: 22,
    },
    shadow: {
      x: 0,
      y: 2,
      blur: 4,
      spread: 0,
      color: 'rgba(0, 0, 0, 0.08)',
    },
  },

  icon: {
    name: 'x',
    library: 'lucide',
    size: 20,
    color: '#1F2937',
    strokeWidth: 2.5,
  },

  isInteractive: true,
  interactions: [
    {
      gesture: 'tap',
      result: 'Opens leave confirmation modal',
      haptic: 'light',
      triggersElement: 'DR-LM-001', // Leave Modal
    },
    {
      gesture: 'long-press',
      result: 'Shows tooltip explaining exit behavior',
      haptic: 'medium',
    },
  ],

  states: [
    {
      state: 'default',
      description: 'Normal state - ready to tap. White background with subtle border.',
      visualChanges: {
        backgroundColor: '#FFFFFF',
        border: {
          width: 1,
          color: '#E5E7EB',
          style: 'solid',
          radius: 22,
        },
      },
    },
    {
      state: 'hover',
      description: 'User hovers over button on desktop. Background darkens slightly.',
      visualChanges: {
        backgroundColor: '#F3F4F6',
        border: {
          width: 1,
          color: '#D1D5DB',
          style: 'solid',
          radius: 22,
        },
      },
    },
    {
      state: 'pressed',
      description: 'Button is being pressed. Background becomes more prominent.',
      visualChanges: {
        backgroundColor: '#E5E7EB',
      },
    },
    {
      state: 'disabled',
      description: 'Button disabled during critical moments (e.g., your turn to pick). Reduced opacity and no interaction.',
      visualChanges: {
        backgroundColor: '#F9FAFB',
        opacity: 0.5,
      },
    },
  ],

  visibilityCondition: 'Always visible during draft',
  appearsIn: ['draft-room-main', 'draft-room-picking'],

  // This button triggers the Leave Confirmation Modal
  triggers: ['DR-LM-001'],

  accessibility: {
    label: 'Leave draft room',
    role: 'button',
    hint: 'Opens confirmation dialog to exit the draft and return to the lobby',
    traits: ['button', 'primary-action'],
    tabIndex: 0,
    keyboardShortcut: 'Escape',
  },

  stateTransitions: [
    {
      property: 'backgroundColor',
      duration: 150,
      easing: 'ease-out',
    },
    {
      property: 'border-color',
      duration: 150,
      easing: 'ease-out',
    },
    {
      property: 'opacity',
      duration: 200,
      easing: 'ease-in-out',
    },
  ],

  // Platform-specific implementation differences
  platformDifferences: [
    {
      aspect: 'icon-rendering',
      web: 'Lucide React SVG icon',
      ios: 'SF Symbol xmark.circle',
      android: 'Material Icon close',
      notes: 'Icons are visually similar but use platform-native libraries',
    },
    {
      aspect: 'haptic-feedback',
      web: 'None',
      ios: 'UIImpactFeedbackGenerator.light',
      android: 'HapticFeedbackConstants.VIRTUAL_KEY',
      notes: 'Mobile platforms provide tactile feedback on tap',
    },
    {
      aspect: 'touch-target',
      web: '44x44px (matches visual)',
      ios: '48x48px (extended for accessibility)',
      android: '48x48px (Material Design minimum)',
      notes: 'Mobile platforms extend hit area beyond visual bounds',
    },
  ],

  // Technical debt items - platform-specific
  techDebt: [
    // iOS-specific
    {
      id: 'TD-DR-SB-001-IOS-1',
      severity: 'low',
      description: 'Icon should animate on hover (rotate slightly)',
      suggestedFix: 'Add rotationEffect with animation modifier',
      priority: 'P2',
      estimatedEffort: '30m',
      affectedPlatforms: ['ios'],
    },
    {
      id: 'TD-DR-SB-001-IOS-2',
      severity: 'medium',
      description: 'Missing focus ring for keyboard navigation',
      suggestedFix: 'Add .focusable() modifier with custom focus style',
      priority: 'P1',
      estimatedEffort: '15m',
      affectedPlatforms: ['ios'],
    },
    {
      id: 'TD-DR-SB-001-IOS-3',
      severity: 'low',
      description: 'Haptic feedback intensity not configurable',
      suggestedFix: 'Add HapticManager.shared.impact(style:) parameter',
      priority: 'P3',
      estimatedEffort: '20m',
      affectedPlatforms: ['ios'],
    },
    // Web-specific
    {
      id: 'TD-DR-SB-001-WEB-1',
      severity: 'low',
      description: 'CSS transition not GPU-accelerated',
      suggestedFix: 'Add will-change: transform and use transform3d',
      priority: 'P2',
      estimatedEffort: '15m',
      affectedPlatforms: ['web'],
    },
    {
      id: 'TD-DR-SB-001-WEB-2',
      severity: 'medium',
      description: 'Missing aria-label localization',
      suggestedFix: 'Use i18n hook for accessibility label',
      priority: 'P1',
      estimatedEffort: '30m',
      affectedPlatforms: ['web'],
    },
    // Android-specific
    {
      id: 'TD-DR-SB-001-AND-1',
      severity: 'medium',
      description: 'Touch target below 48dp minimum',
      suggestedFix: 'Increase Modifier.size to 48.dp',
      priority: 'P1',
      estimatedEffort: '10m',
      affectedPlatforms: ['android'],
    },
    {
      id: 'TD-DR-SB-001-AND-2',
      severity: 'low',
      description: 'Ripple effect extends beyond button bounds',
      suggestedFix: 'Add Modifier.clip(CircleShape) before clickable',
      priority: 'P2',
      estimatedEffort: '15m',
      affectedPlatforms: ['android'],
    },
  ],

  codeReferences: [
    {
      platform: 'web',
      componentPath: 'components/vx2/draft-room/components/StatusBar/LeaveButton.tsx',
      lineStart: 1,
      lineEnd: 68,
      description: 'Main React component with click handler and styling',
    },
    {
      platform: 'ios',
      componentPath: 'TopDog/DraftRoom/Views/LeaveButton.swift',
      lineStart: 1,
      lineEnd: 45,
      description: 'SwiftUI button with SF Symbol and haptic feedback',
    },
    {
      platform: 'android',
      componentPath: 'app/src/main/java/com/topdog/draftroom/ui/LeaveButton.kt',
      lineStart: 1,
      lineEnd: 52,
      description: 'Jetpack Compose button with Material icon',
    },
  ],

  // Wireframe positioning context
  wireframeContext: {
    screenId: 'draft-room-main',
    boundingBox: { x: 8, y: 52, width: 44, height: 44 }, // Accounts for iOS safe area
    highlightColor: '#FF6B6B',
    annotationPosition: 'right',
  },

  screenshots: [],
  lastUpdated: now,
  updatedBy: defaultAuthor,
  version: '1.1',
  tags: ['draft-room', 'status-bar', 'navigation', 'modal-trigger', 'accessibility'],
};

/**
 * DR-SB-002: Timer Display
 * Centered text display showing remaining turn time with dynamic color states
 * Updates in real-time (every 100ms) during draft with smooth transitions
 *
 * Core draft room element that provides crucial UX feedback about time-pressure.
 * Serves as the primary visual indicator for draft pacing and urgency signals.
 */
const drSb002TimerDisplay: GlossaryElement = {
  id: 'DR-SB-002',
  name: 'Timer Display',
  description: 'Centered text display showing remaining time for current draft pick in MM:SS format. Primary UX element for communicating urgency and time-pressure during active draft turns. Displays values from 5:00 down to 0:00, transitioning through color states (default gray > warning yellow > critical red with pulse) to indicate time-critical situations. Real-time updates occur every 100ms with tick-free animation for smooth appearance. Synchronizes with server timer state and handles clock skew with gradual adjustment to prevent jarring resets.',
  module: 'draft-room',
  screen: 'draft-room-main',
  parent: 'StatusBar',
  elementType: 'text',

  position: { x: 0, y: 0 },
  dimensions: { width: '100%', height: 44 },
  zIndex: 50,

  style: {
    textColor: '#1F2937',
  },

  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: 0,
    textAlign: 'center',
  },

  isInteractive: false,

  states: [
    {
      state: 'default',
      description: 'Normal timer state - over 30 seconds remaining. Gray text indicates no immediate time pressure. Shows MM:SS format (e.g., "4:32", "1:15").',
      textChanges: '4:32',
      visualChanges: {
        textColor: '#1F2937',
        opacity: 1,
        transform: 'scale(1)',
      },
    },
    {
      state: 'warning',
      description: 'Time warning state - 30 seconds or less remaining (under 30s). Yellow text and bold font draws attention to approaching deadline. No animation yet, but user attention heightened.',
      textChanges: '0:28',
      visualChanges: {
        textColor: '#F59E0B',
        opacity: 1,
        fontWeight: 800,
        transform: 'scale(1)',
      },
    },
    {
      state: 'critical',
      description: 'Critical time state - 10 seconds or less remaining. Red text with continuous pulse animation (scale 1.0 to 1.05) creates urgency. Animation iterates indefinitely until pick or timeout.',
      textChanges: '0:08',
      visualChanges: {
        textColor: '#DC2626',
        opacity: 1,
        fontWeight: 900,
        transform: 'scale(1.05)',
      },
    },
    {
      state: 'paused',
      description: 'Draft paused state - timer frozen at current value while draft is paused. Dimmed (70% opacity) and desaturated color indicates non-active status. Text remains visible for reference.',
      textChanges: '2:45',
      visualChanges: {
        textColor: '#9CA3AF',
        opacity: 0.7,
        transform: 'scale(1)',
      },
    },
    {
      state: 'loading',
      description: 'Initial sync state - timer syncing with server on connection or after clock skew detection. Shows placeholder dashes with reduced opacity. Lasts 100-500ms until server time received.',
      textChanges: '--:--',
      visualChanges: {
        textColor: '#6B7280',
        opacity: 0.6,
        transform: 'scale(0.95)',
      },
    },
    {
      state: 'error',
      description: 'Connection error state - lost connection to draft server. Shows "OFFLINE" in red text indicating critical state. User can\'t pick while offline. Usually triggers reconnection flow.',
      textChanges: 'OFFLINE',
      visualChanges: {
        textColor: '#DC2626',
        opacity: 1,
        fontWeight: 800,
        transform: 'scale(1)',
      },
    },
  ],

  visibilityCondition: 'Visible only during active draft with turns being made',
  appearsIn: ['draft-room-main', 'draft-room-picking'],

  // Entry/exit animations for state changes
  entryAnimation: {
    property: 'opacity',
    from: 0,
    to: 1,
    duration: 200,
    easing: 'ease-in-out',
  },

  exitAnimation: {
    property: 'opacity',
    from: 1,
    to: 0,
    duration: 150,
    easing: 'ease-out',
  },

  // State transition specifications with timing
  stateTransitions: [
    {
      property: 'textColor',
      duration: 200,
      easing: 'ease-out',
      description: 'Color transitions between default (gray), warning (yellow), and critical (red) take 200ms',
    },
    {
      property: 'transform',
      duration: 300,
      easing: 'ease-in-out',
      description: 'Scale transitions for critical pulse animation take 300ms',
    },
    {
      property: 'opacity',
      duration: 150,
      easing: 'ease-out',
      description: 'Opacity transitions for paused/loading states take 150ms',
    },
    {
      property: 'fontWeight',
      duration: 200,
      easing: 'ease-out',
      description: 'Font weight transitions (normal to bold to extra-bold) take 200ms',
    },
  ],

  // Platform-specific implementation differences
  platformDifferences: [
    {
      aspect: 'font-rendering',
      web: 'CSS font-family with system stack, uses native browser font rendering, kerning optimized',
      ios: 'Native SF Pro Display system font, uses Core Text for precision rendering, optical sizing enabled',
      android: 'Google Sans font with RobotoFlex variable font for weight variations, hinting optimized for screen DPI',
      notes: 'Each platform uses native typography stack for best visual fidelity. Web may have slight rendering differences from native.',
    },
    {
      aspect: 'real-time-update-frequency',
      web: 'Every 100ms via requestAnimationFrame, synced to browser refresh rate (60fps target)',
      ios: 'Every 100ms via Timer or CADisplayLink for 120fps capable displays, smooth motion-like appearance',
      android: 'Every 100ms via Handler postDelayed, Frame Pacing API for consistent timing on variable refresh-rate displays',
      notes: 'All platforms update at 100ms intervals (10 updates per second). Critical state pulse animation runs at display refresh rate independently.',
    },
    {
      aspect: 'text-update-mechanism',
      web: 'DOM text node update with CSS transitions, no re-layout on number change',
      ios: 'SwiftUI Text binding update with animation context, uses withAnimation for smooth transitions',
      android: 'Jetpack Compose State<String> update with Animatable<*, *> for cross-fade effect',
      notes: 'Text content updates should not trigger layout recalculations. Use CSS containment on web.',
    },
    {
      aspect: 'animation-performance',
      web: 'CSS animations with GPU acceleration (transform + opacity), will-change property set',
      ios: 'CABasicAnimation or SwiftUI animation context, uses Metal rendering pipeline, battery-conscious on older devices',
      android: 'Property animation or Compose animation API, uses RenderThread for smooth 60fps on all APIs',
      notes: 'Critical pulse animation must maintain 60fps minimum. Web uses GPU layers, mobile uses platform-optimized animators.',
    },
    {
      aspect: 'locale-specific-formatting',
      web: 'Intl.NumberFormat for millisecond conversions, always MM:SS numeric format regardless of locale',
      ios: 'DateComponentsFormatter or custom format string, respects locale for separators (not used here)',
      android: 'NumberFormat.getInstance() for any rounding, always MM:SS numeric format for consistency',
      notes: 'Timer always uses MM:SS format with colon separator globally - no localization variations.',
    },
  ],

  // Technical debt items
  techDebt: [
    {
      id: 'TD-DR-SB-002-1',
      severity: 'high',
      description: 'Critical state pulse animation may drop frames on lower-end Android devices (API <24) and cause battery drain due to continuous GPU operations',
      suggestedFix: 'Implement adaptive animation: use simpler scale pulse on low-end devices, detect via DeviceInfo API, or use CSS animation-timing-function: step-start for 2-frame pulse',
      priority: 'P0',
      estimatedEffort: '2h',
    },
    {
      id: 'TD-DR-SB-002-2',
      severity: 'medium',
      description: 'Timer clock skew detection is not user-facing - large jumps (e.g., server says 0:30 but client was at 1:15) cause jarring resets instead of smooth adjustment',
      suggestedFix: 'Implement gradual clock skew correction: calculate delta, apply correction over 500-1000ms at 5-10% per frame. Add toast notification for >15s skew events.',
      priority: 'P1',
      estimatedEffort: '3h',
    },
    {
      id: 'TD-DR-SB-002-3',
      severity: 'medium',
      description: 'No accessibility announcements for state transitions - users on screen readers don\'t hear "under 30 seconds" or "critical" warnings, must read text manually',
      suggestedFix: 'Add aria-live="assertive" with role="status", announce state changes: "30 seconds remaining - warning", "10 seconds - critical state". Use setInterval-based announcement scheduler.',
      priority: 'P1',
      estimatedEffort: '1.5h',
    },
  ],

  accessibility: {
    label: 'Current turn timer',
    role: 'status',
    hint: 'Shows remaining time (in MM:SS) for the current draft pick. Changes color: gray (normal), yellow (warning under 30s), red (critical under 10s).',
    traits: ['live-update', 'important'],
    tabIndex: -1, // Not focusable - status region
    ariaLive: 'polite',
    ariaAtomic: true, // Announce entire timer text on update
  },

  codeReferences: [
    {
      platform: 'web',
      componentPath: 'components/vx2/draft-room/components/StatusBar/TimerDisplay.tsx',
      lineStart: 1,
      lineEnd: 120,
      description: 'React component with useEffect for 100ms timer loop, state machine for color/animation transitions, requestAnimationFrame for smooth updates',
    },
    {
      platform: 'web',
      componentPath: 'components/vx2/draft-room/components/StatusBar/TimerDisplay.module.css',
      lineStart: 1,
      lineEnd: 65,
      description: 'CSS module with @keyframes for critical pulse animation, transition properties, will-change hints for GPU acceleration',
    },
    {
      platform: 'ios',
      componentPath: 'TopDog/DraftRoom/Views/StatusBar/TimerDisplayView.swift',
      lineStart: 1,
      lineEnd: 150,
      description: 'SwiftUI view with @State<Int> for seconds remaining, Timer.publish for 100ms tick, withAnimation for color/scale transitions, CADisplayLink for pulse sync',
    },
    {
      platform: 'android',
      componentPath: 'app/src/main/java/com/topdog/draftroom/ui/statusbar/TimerDisplay.kt',
      lineStart: 1,
      lineEnd: 140,
      description: 'Jetpack Compose @Composable with State<Int> for time, LaunchedEffect for coroutine timer, Animatable for pulse, updateTimerDisplay() handler',
    },
  ],

  // Wireframe positioning context
  wireframeContext: {
    screenId: 'draft-room-main',
    boundingBox: { x: 0, y: 0, width: '100%', height: 44 }, // Full-width centered text within status bar
    highlightColor: '#F59E0B',
    annotationPosition: 'top',
    notes: 'Timer is vertically centered within 44px status bar. Horizontal centering is automatic. Z-index 50 places it above background but below leave button (100).',
  },

  screenshots: [],
  lastUpdated: now,
  updatedBy: defaultAuthor,
  version: '2.0',
  tags: ['draft-room', 'status-bar', 'timer', 'real-time', 'state-machine', 'animation', 'accessibility', 'critical-ux'],
};

/**
 * DR-SB-003: Timer Background
 * Background container for timer display
 * Provides visual distinction and protection for timer text
 */
const drSb003TimerBackground: GlossaryElement = {
  id: 'DR-SB-003',
  name: 'Timer Background',
  description: 'Background container for timer display with semi-transparent fill',
  module: 'draft-room',
  screen: 'draft-room-main',
  parent: 'StatusBar',
  elementType: 'container',

  position: { x: 0, y: 0 },
  dimensions: { width: 120, height: 44 },
  zIndex: 25,

  style: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: {
      width: 1,
      color: 'rgba(0, 0, 0, 0.1)',
      style: 'solid',
      radius: 12,
    },
  },

  isInteractive: false,

  states: [
    {
      state: 'default',
      description: 'Normal background',
      visualChanges: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
      },
    },
    {
      state: 'active',
      description: 'Your turn - highlighted',
      visualChanges: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        border: {
          width: 1,
          color: '#3B82F6',
          style: 'solid',
          radius: 12,
        },
      },
    },
  ],

  visibilityCondition: 'Always visible',
  appearsIn: ['draft-room-main'],

  children: ['DR-SB-002'],

  codeReferences: [
    {
      platform: 'web',
      componentPath: 'components/DraftRoom/StatusBar/TimerBackground.tsx',
      lineStart: 1,
      lineEnd: 40,
    },
  ],

  screenshots: [],
  lastUpdated: now,
  updatedBy: defaultAuthor,
  version: '1.0',
  tags: ['draft-room', 'status-bar', 'background'],
};

/**
 * DR-SB-004: Your Turn Indicator (CRITICAL - URGENCY SIGNAL)
 *
 * HIGH-PRIORITY BADGE: The most critical indicator in the draft room
 * Signals to users with urgency that it's NOW their turn to make a pick.
 * Designed to grab immediate attention through color, animation, haptics, and sound.
 *
 * BUSINESS IMPACT:
 * - Prevents missed picks due to inattention (critical in fast-paced drafts)
 * - Users often monitor multiple tabs/apps during live drafts
 * - Badge must overcome divided attention and compete for immediate notice
 * - Missing turn → automatic AI pick → lost draft capital → poor user experience
 *
 * DESIGN GOALS:
 * 1. Unmistakable alertness: Green color + pulse + haptic + sound (optional)
 * 2. Immediate discoverability: High z-index, prominent position in status bar
 * 3. Urgency escalation: Transitions to rapid pulse (<5s remaining)
 * 4. Accessible: Screen reader announcement + VoiceOver/TalkBack support
 * 5. Cross-platform: Native haptics, animations, sound per platform capabilities
 */
const drSb004YourTurnIndicator: GlossaryElement = {
  id: 'DR-SB-004',
  name: 'Your Turn Indicator',
  description: 'CRITICAL urgency badge that appears in the status bar when it is the current user\'s turn to make a draft pick. Designed to command immediate attention through high-contrast green color, animated pulse, optional sound chime, and platform-specific haptic feedback. The badge transitions through "normal" → "urgent" (under 15s) → "expiring" (under 5s with rapid pulse) states. Most important indicator in the draft room - prevents missed picks and auto-selects. Only visible when user is on the clock.',
  module: 'draft-room',
  screen: 'draft-room-main',
  parent: 'StatusBar',
  elementType: 'badge',

  position: { x: 0, y: 0 },
  dimensions: { width: 'auto', height: 28 },
  padding: { top: 4, right: 12, bottom: 4, left: 12 },
  zIndex: 75,

  style: {
    backgroundColor: '#10B981',
    textColor: '#FFFFFF',
    border: {
      width: 0,
      color: 'transparent',
      radius: 14,
    },
    shadow: {
      x: 0,
      y: 2,
      blur: 6,
      spread: 0,
      color: 'rgba(16, 185, 129, 0.3)',
    },
  },

  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1,
  },

  isInteractive: false,

  // COMPREHENSIVE STATE MACHINE
  states: [
    {
      state: 'active',
      description: 'Your turn is active - badge visible with standard pulse. Normal pick time remaining (>15s). Green background with gentle 1.2s pulse animation. Emits optional subtle chime on appearance.',
      visualChanges: {
        backgroundColor: '#10B981',
        opacity: 1,
      },
      animation: {
        type: 'pulse',
        property: 'box-shadow',
        from: '0 0 0 0 rgba(16, 185, 129, 0.7)',
        to: '0 0 0 10px rgba(16, 185, 129, 0)',
        duration: 1200,
        easing: 'ease-out',
        iterationCount: 'infinite',
      },
      audio: {
        enabled: true,
        trigger: 'on-appearance',
        filename: 'chime-your-turn.mp3',
        duration: 500,
        volume: 0.6,
        platform: ['web', 'ios', 'android'],
      },
    },
    {
      state: 'urgent',
      description: 'Time running out (15s or less remaining). Badge becomes more aggressive with faster pulse animation (800ms cycle). Brighter green with increased shadow spread. Haptic feedback strengthens on mobile.',
      visualChanges: {
        backgroundColor: '#059669',
        opacity: 1,
        shadow: {
          x: 0,
          y: 3,
          blur: 8,
          spread: 2,
          color: 'rgba(16, 185, 129, 0.5)',
        },
      },
      animation: {
        type: 'pulse',
        property: 'box-shadow',
        from: '0 0 0 0 rgba(5, 150, 105, 0.8)',
        to: '0 0 0 12px rgba(5, 150, 105, 0)',
        duration: 800,
        easing: 'ease-out',
        iterationCount: 'infinite',
      },
      haptic: {
        web: 'None',
        ios: 'UIImpactFeedbackGenerator.medium (repeated every 800ms)',
        android: 'HapticFeedbackConstants.KEYBOARD_TAP',
      },
    },
    {
      state: 'expiring',
      description: 'Critical (under 5s remaining). Badge enters RAPID PULSE mode with intense animation (400ms cycle). Color becomes darkest green (#047857). Heavy box-shadow with bright emerald glow. Continuous haptics on mobile every 400ms. Audio pitch increases (higher frequency chime loops).',
      visualChanges: {
        backgroundColor: '#047857',
        opacity: 1,
        shadow: {
          x: 0,
          y: 4,
          blur: 12,
          spread: 3,
          color: 'rgba(5, 150, 105, 0.7)',
        },
      },
      animation: {
        type: 'pulse',
        property: 'box-shadow',
        from: '0 0 0 0 rgba(4, 120, 87, 0.9)',
        to: '0 0 0 14px rgba(4, 120, 87, 0)',
        duration: 400,
        easing: 'ease-out',
        iterationCount: 'infinite',
      },
      haptic: {
        web: 'None',
        ios: 'UIImpactFeedbackGenerator.heavy (every 400ms)',
        android: 'HapticFeedbackConstants.CONTEXT_CLICK (every 400ms)',
      },
      audio: {
        enabled: true,
        trigger: 'continuous-loop',
        filename: 'chime-urgent-rapid.mp3',
        duration: 300,
        volume: 0.8,
        repeatInterval: 400,
        platform: ['web', 'ios', 'android'],
      },
    },
    {
      state: 'default',
      description: 'Not your turn - badge completely hidden (opacity 0, display none). No animation, audio, or haptics.',
      visualChanges: {
        opacity: 0,
        display: 'none',
      },
    },
  ],

  visibilityCondition: 'Only when it is current user turn. Hidden immediately when turn passes to next player.',
  appearsIn: ['draft-room-main'],

  // ENTRY ANIMATION: Slide in from left + fade + initial pulse
  entryAnimation: [
    {
      name: 'slide-in',
      type: 'slide',
      direction: 'from-left',
      property: 'translateX',
      from: -50,
      to: 0,
      duration: 300,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Bounce
    },
    {
      name: 'fade-in',
      type: 'fade',
      property: 'opacity',
      from: 0,
      to: 1,
      duration: 300,
      easing: 'ease-in',
      delay: 0,
    },
    {
      name: 'initial-pulse',
      type: 'pulse',
      property: 'box-shadow',
      from: '0 0 0 0 rgba(16, 185, 129, 0.7)',
      to: '0 0 0 8px rgba(16, 185, 129, 0)',
      duration: 600,
      easing: 'ease-out',
      delay: 100,
      iterationCount: 2, // Two pulses on entry
    },
  ],

  // EXIT ANIMATION: Fade out + subtle scale
  exitAnimation: [
    {
      name: 'fade-out',
      type: 'fade',
      property: 'opacity',
      from: 1,
      to: 0,
      duration: 200,
      easing: 'ease-out',
    },
    {
      name: 'scale-down',
      type: 'scale',
      property: 'transform',
      from: 1,
      to: 0.95,
      duration: 200,
      easing: 'ease-in',
      delay: 0,
    },
  ],

  stateTransitions: [
    {
      property: 'backgroundColor',
      duration: 300,
      easing: 'ease-out',
    },
    {
      property: 'box-shadow',
      duration: 300,
      easing: 'ease-out',
    },
    {
      property: 'opacity',
      duration: 250,
      easing: 'ease-in-out',
    },
  ],

  // PLATFORM-SPECIFIC IMPLEMENTATIONS
  platformDifferences: [
    {
      aspect: 'haptic-feedback',
      web: 'None (no haptic API available)',
      ios: 'UIImpactFeedbackGenerator - light (active), medium (urgent), heavy (expiring). Triggered on state transition and repeated per state timing.',
      android: 'HapticFeedbackConstants - VIRTUAL_KEY (active), KEYBOARD_TAP (urgent), CONTEXT_CLICK (expiring). Uses Android 11+ haptic patterns.',
      notes: 'Mobile devices provide critical tactile feedback when visual attention might be divided. Timing synced with animation pulse cycles.',
    },
    {
      aspect: 'audio-notification',
      web: 'HTML5 Audio API with audioContext for dynamic pitch. Chime plays via <audio> element or Web Audio API. Volume controlled by user system settings.',
      ios: 'AVAudioSession with default speaker routing. Uses system audio playback. Respects user mute switch (ringer volume). Requires iOS 13+.',
      android: 'MediaPlayer or ExoPlayer for playback. Routes through STREAM_NOTIFICATION. Respects device audio settings and do-not-disturb mode.',
      notes: 'Sound is optional and can be disabled via user settings. Default volume set conservatively (0.6-0.8) to avoid startling.',
    },
    {
      aspect: 'animation-performance',
      web: 'CSS animations with will-change: box-shadow, transform. GPU-accelerated via transform3d. 60fps on modern browsers.',
      ios: 'CABasicAnimation with CADisplayLink for timing. Metal rendering pipeline. Optimized for 120fps ProMotion displays.',
      android: 'PropertyAnimation with Choreographer for frame synchronization. RenderThread for GPU acceleration. Adapts to device refresh rate (60-120Hz).',
      notes: 'All platforms use hardware acceleration. Pulse animation optimized to not drain battery - paused when app backgrounded via lifecycle observers.',
    },
    {
      aspect: 'text-content',
      web: '"YOUR TURN" (uppercase, all-caps for urgency)',
      ios: '"YOUR TURN" or localized equivalent',
      android: '"YOUR TURN" or localized equivalent',
      notes: 'Text remains constant across all states. Badge itself communicates urgency through color and animation changes.',
    },
    {
      aspect: 'color-contrast',
      web: 'WCAG AAA compliant - Green (#10B981) on white background = 5.2:1 contrast ratio',
      ios: 'Adapts to light/dark mode: Green (#10B981) on light, adjusted green (#34D399) on dark',
      android: 'Green (#10B981) with forced text legibility - enforces minimum contrast via system-wide accessibility settings',
      notes: 'Colors tested for color-blind accessibility using Sim Daltonism and Color Oracle tools.',
    },
  ],

  // TECHNICAL DEBT AND PERFORMANCE CONCERNS
  techDebt: [
    {
      id: 'TD-DR-SB-004-1',
      severity: 'high',
      description: 'Pulse animation can cause jank on lower-end devices due to continuous box-shadow repaints. Expiring state (400ms pulse) causes frame drops on Android devices with <90Hz refresh rate.',
      suggestedFix: 'Implement device capability detection (matchMedia prefers-reduced-motion, performance.memory). On low-end devices, replace pulse with simpler opacity fade or static glow. Use requestAnimationFrame with delta timing for smoother animation cycles.',
      priority: 'P1',
      estimatedEffort: '2h',
      estimatedImpact: 'Improves battery life on mobile, prevents laggy animations on budget phones',
    },
    {
      id: 'TD-DR-SB-004-2',
      severity: 'high',
      description: 'Screen reader announcements not announced on state transitions. VoiceOver/TalkBack users don\'t get assertive announcement when badge appears or urgency level changes.',
      suggestedFix: 'Implement aria-live="assertive" with dynamic role="alert" updates. Use polite announcement for active state, assertive for urgent/expiring states. Test with VoiceOver (iOS) and TalkBack (Android).',
      priority: 'P1',
      estimatedEffort: '1.5h',
      estimatedImpact: 'Critical for accessibility compliance (WCAG 2.1 Level AA)',
    },
    {
      id: 'TD-DR-SB-004-3',
      severity: 'medium',
      description: 'Audio chime can play even when user has device muted or app backgrounded. No respect for audio context state.',
      suggestedFix: 'Check AudioContext state before playing. Implement Background Audio permission gracefully. Respect mute switch on iOS (ringer volume). Honor do-not-disturb on Android.',
      priority: 'P1',
      estimatedEffort: '1h',
      estimatedImpact: 'Prevents unexpected sounds in quiet environments',
    },
    {
      id: 'TD-DR-SB-004-4',
      severity: 'medium',
      description: 'Haptic feedback continues even after app backgrounded. Drains battery by triggering haptics in background state.',
      suggestedFix: 'Pause animations and haptics on visibility change (Page Visibility API on web, lifecycle callbacks on native). Resume when app returns to foreground.',
      priority: 'P2',
      estimatedEffort: '1h',
      estimatedImpact: 'Reduces unnecessary battery drain, prevents ghost haptics',
    },
    {
      id: 'TD-DR-SB-004-5',
      severity: 'low',
      description: 'No state machine validation - could receive rapid state changes (active→urgent→active→expiring) without proper cleanup.',
      suggestedFix: 'Implement explicit state machine with transition guards. Only allow: active→urgent→expiring→default. Cancel animation timers on invalid transitions.',
      priority: 'P2',
      estimatedEffort: '1.5h',
      estimatedImpact: 'Prevents animation queue buildup, cleaner code',
    },
  ],

  accessibility: {
    label: 'Your turn indicator badge',
    role: 'status',
    hint: 'You have the turn to make a pick - time is running out!',
    traits: ['alert', 'live-update', 'dynamic-content'],
    tabIndex: -1, // Not focusable - informational only
    ariaLive: 'assertive', // Announce immediately on appearance and state change
    ariaAtomic: true, // Announce entire badge content on updates
    ariaRelevant: 'all', // Announce additions, removals, text changes
    announcements: {
      onActive: 'Your turn to pick, time remaining',
      onUrgent: 'Urgent, time running out, under 15 seconds remaining',
      onExpiring: 'Critical, less than 5 seconds left, make your selection now',
      onHidden: 'Your turn has ended',
    },
  },

  // WIREFRAME CONTEXT AND POSITIONING
  wireframeContext: {
    screenId: 'draft-room-main',
    boundingBox: { x: 8, y: 8, width: 120, height: 28 },
    highlightColor: '#10B981',
    annotationPosition: 'below',
    contextDescription: 'Positioned in top-left area of status bar, immediately left of centered timer. High z-index (75) ensures it overlays other status bar content. On mobile, respects safe area insets. Minimum padding of 8px from status bar edges.',
  },

  // SOUND SPECIFICATIONS
  soundSpecification: {
    enabled: true,
    defaultVolume: 0.6,
    soundAssets: [
      {
        state: 'active',
        filename: 'chime-your-turn.mp3',
        duration: 500,
        frequency: 'middle-C (262Hz)',
        playTrigger: 'on-appearance-only',
        repeatInterval: 'none',
        description: 'Gentle, pleasant chime sound that indicates user\'s turn has started. Non-intrusive but noticeable. Single play on badge appearance.',
      },
      {
        state: 'urgent',
        filename: 'chime-urgent-rapid.mp3',
        duration: 300,
        frequency: 'high-G (784Hz)',
        playTrigger: 'continuous-loop',
        repeatInterval: 800,
        description: 'Higher-pitched, faster chime that loops every 800ms when under 15s remaining. Creates growing sense of urgency.',
      },
      {
        state: 'expiring',
        filename: 'chime-critical-rapid.mp3',
        duration: 250,
        frequency: 'high-C (1046Hz)',
        playTrigger: 'continuous-loop',
        repeatInterval: 400,
        description: 'Highest pitch, shortest duration, fastest repeat (every 400ms) under 5s. Unmistakable emergency signal.',
      },
    ],
    accessibilityNote: 'Audio can be disabled globally in app settings. Screen reader users can rely on aria-live announcements instead.',
  },

  // MULTIPLE CODE REFERENCES ACROSS PLATFORMS
  codeReferences: [
    {
      platform: 'web',
      componentPath: 'components/vx2/draft-room/components/StatusBar/YourTurnIndicator.tsx',
      lineStart: 1,
      lineEnd: 180,
      description: 'Main React component with state management, animation hooks, and audio context integration. Handles entry/exit animations and state machine transitions.',
    },
    {
      platform: 'web',
      componentPath: 'components/vx2/draft-room/components/StatusBar/YourTurnIndicator.module.css',
      lineStart: 1,
      lineEnd: 120,
      description: 'CSS modules with @keyframes for pulse animations (active, urgent, expiring). Defines will-change properties and GPU acceleration hints.',
    },
    {
      platform: 'web',
      componentPath: 'hooks/useYourTurnAudio.ts',
      lineStart: 1,
      lineEnd: 60,
      description: 'Custom hook managing Web Audio API for chime playback. Handles volume, pitch variation for urgent state, and system audio context state.',
    },
    {
      platform: 'web',
      componentPath: 'hooks/useAnimationPerformance.ts',
      lineStart: 1,
      lineEnd: 45,
      description: 'Performance detection hook using matchMedia for prefers-reduced-motion, device memory estimation, and refresh rate detection.',
    },
    {
      platform: 'ios',
      componentPath: 'TopDog/DraftRoom/Views/YourTurnIndicator.swift',
      lineStart: 1,
      lineEnd: 200,
      description: 'SwiftUI View with state management, CABasicAnimation for pulse effects, UIImpactFeedbackGenerator for haptics. Implements dark mode support.',
    },
    {
      platform: 'ios',
      componentPath: 'TopDog/DraftRoom/Audio/YourTurnAudioManager.swift',
      lineStart: 1,
      lineEnd: 90,
      description: 'AVAudioSession manager handling audio playback with mute switch detection. Manages audio interruptions from calls/system alerts.',
    },
    {
      platform: 'ios',
      componentPath: 'TopDog/DraftRoom/Haptics/YourTurnHapticFeedback.swift',
      lineStart: 1,
      lineEnd: 70,
      description: 'Haptic feedback orchestrator using UIImpactFeedbackGenerator and UINotificationFeedbackGenerator. Syncs haptics with animation cycles.',
    },
    {
      platform: 'android',
      componentPath: 'app/src/main/java/com/topdog/draftroom/ui/yourturn/YourTurnIndicator.kt',
      lineStart: 1,
      lineEnd: 220,
      description: 'Jetpack Compose composable with state management, PropertyAnimation for pulse effects, Material ripple for feedback.',
    },
    {
      platform: 'android',
      componentPath: 'app/src/main/java/com/topdog/draftroom/audio/YourTurnAudioManager.kt',
      lineStart: 1,
      lineEnd: 100,
      description: 'MediaPlayer manager respecting audio focus, do-not-disturb mode, and notification channel settings.',
    },
    {
      platform: 'android',
      componentPath: 'app/src/main/java/com/topdog/draftroom/haptics/YourTurnHapticFeedback.kt',
      lineStart: 1,
      lineEnd: 80,
      description: 'Haptic feedback manager using HapticFeedbackConstants. Detects device haptic capability and adapts feedback strength.',
    },
  ],

  screenshots: [],
  lastUpdated: now,
  updatedBy: defaultAuthor,
  version: '2.0',
  tags: [
    'draft-room',
    'status-bar',
    'indicator',
    'turn-management',
    'urgency-signal',
    'critical-ui',
    'animation',
    'haptics',
    'audio',
    'accessibility',
    'state-machine',
    'performance-sensitive',
  ],
};

/**
 * DR-SB-005: Pre-Draft Countdown
 * Large countdown timer shown before draft starts
 * Replaces timer display until draft begins
 */
const drSb005PreDraftCountdown: GlossaryElement = {
  id: 'DR-SB-005',
  name: 'Pre-Draft Countdown',
  description: 'Large countdown timer shown before draft starts in HH:MM:SS format',
  module: 'draft-room',
  screen: 'draft-room-main',
  parent: 'StatusBar',
  elementType: 'text',

  position: { x: 0, y: 0 },
  dimensions: { width: '100%', height: 44 },
  zIndex: 50,

  style: {
    textColor: '#6B7280',
  },

  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 18,
    fontWeight: 600,
    lineHeight: 1.2,
  },

  isInteractive: false,

  states: [
    {
      state: 'default',
      description: 'Countdown in progress',
      textChanges: '0:02:15',
    },
    {
      state: 'loading',
      description: 'Waiting for server countdown',
      visualChanges: {
        opacity: 0.6,
      },
    },
  ],

  visibilityCondition: 'Visible only before draft starts',
  appearsIn: ['draft-room-main'],

  entryAnimation: {
    property: 'opacity',
    from: 0,
    to: 1,
    duration: 300,
    easing: 'ease-in',
  },

  exitAnimation: {
    property: 'opacity',
    from: 1,
    to: 0,
    duration: 300,
    easing: 'ease-out',
  },

  accessibility: {
    label: 'Pre-draft countdown timer',
    role: 'status',
    hint: 'Time until draft begins',
    traits: ['live-update'],
    ariaLive: 'polite',
  },

  codeReferences: [
    {
      platform: 'web',
      componentPath: 'components/DraftRoom/StatusBar/PreDraftCountdown.tsx',
      lineStart: 1,
      lineEnd: 85,
    },
  ],

  screenshots: [],
  lastUpdated: now,
  updatedBy: defaultAuthor,
  version: '1.0',
  tags: ['draft-room', 'status-bar', 'timer', 'countdown'],
};

// ============================================================================
// Draft Room Picks Bar Elements (Group B)
// ============================================================================

/**
 * DR-PB-001: Picks Bar Container
 * Horizontal scrollable container showing all draft picks in order
 * 64px height, positioned below status bar
 */
const drPb001PicksBarContainer: GlossaryElement = {
  id: 'DR-PB-001',
  name: 'Picks Bar Container',
  description: 'Horizontal scrollable container showing all draft picks as avatars, auto-scrolls to current pick',
  module: 'draft-room',
  screen: 'draft-room-main',
  parent: 'DraftRoomLayout',
  elementType: 'container',

  position: { x: 0, y: 56 },
  dimensions: { width: '100%', height: 64 },
  padding: { top: 8, right: 16, bottom: 8, left: 16 },
  zIndex: 90,

  style: {
    backgroundColor: '#F9FAFB',
    border: {
      width: 0,
      color: 'transparent',
      style: 'none',
      radius: 0,
    },
    shadow: {
      x: 0,
      y: 2,
      blur: 4,
      spread: 0,
      color: 'rgba(0, 0, 0, 0.04)',
    },
  },

  isInteractive: true,
  interactions: [
    {
      gesture: 'pan',
      result: 'Scroll horizontally through draft picks',
    },
    {
      gesture: 'tap',
      result: 'Tap on a pick slot to view that player or team',
    },
  ],

  states: [
    {
      name: 'default',
      description: 'Normal picks bar showing all slots',
      style: {
        backgroundColor: '#F9FAFB',
      },
    },
    {
      name: 'scrolling',
      description: 'User is actively scrolling',
      style: {
        backgroundColor: '#F9FAFB',
      },
    },
    {
      name: 'auto-scroll',
      description: 'Auto-scrolling to current pick after new pick made',
      style: {
        backgroundColor: '#F9FAFB',
      },
    },
  ],

  platformVariations: [
    {
      aspect: 'scroll-behavior',
      web: 'smooth scroll',
      ios: 'momentum scroll with bounce',
      android: 'momentum scroll without bounce',
      notes: 'iOS has native bounce effect',
    },
  ],

  visibilityCondition: 'Always visible in draft room',
  appearsIn: ['draft-room-main'],

  accessibility: {
    label: 'Draft picks timeline',
    role: 'region',
    hint: 'Scroll to view all draft picks in order',
  },

  codeReferences: [
    {
      platform: 'web',
      componentPath: 'components/DraftRoom/PicksBar/PicksBarContainer.tsx',
      lineStart: 1,
      lineEnd: 120,
    },
  ],

  screenshots: [],
  lastUpdated: now,
  updatedBy: defaultAuthor,
  version: '1.0',
  tags: ['draft-room', 'picks-bar', 'scroll', 'container'],
};

/**
 * DR-PB-002: Pick Slot
 * Individual slot representing one draft pick in the picks bar
 * 48x48px with 8px gap between slots
 *
 * Core interactive element of the draft experience - each slot represents
 * one pick in snake/linear draft order and transitions through multiple
 * visual states as the draft progresses.
 */
const drPb002PickSlot: GlossaryElement = {
  id: 'DR-PB-002',
  name: 'Pick Slot',
  description: 'Individual pick slot representing one draft selection in the horizontal picks bar timeline. Each slot transitions through distinct visual states: empty (dashed border awaiting pick), filled (displays team avatar after selection), current (highlighted as active "on the clock" slot), and user-pick (green border indicating the logged-in user\'s upcoming selections). The picks bar contains N slots where N = (rounds × teams), e.g., 180 slots for a 12-team, 15-round draft.',
  module: 'draft-room',
  screen: 'draft-room-main',
  parent: 'PicksBarContainer',
  elementType: 'container',

  position: { x: 0, y: 0 },
  dimensions: { width: 48, height: 48 },
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  margin: { top: 0, right: 8, bottom: 0, left: 0 },
  zIndex: 50,

  style: {
    backgroundColor: 'transparent',
    border: {
      width: 2,
      color: '#E5E7EB',
      style: 'dashed',
      radius: 24,
    },
  },

  isInteractive: true,
  interactions: [
    {
      gesture: 'tap',
      result: 'Opens pick detail modal showing player selected, pick number, and team info',
      haptic: 'light',
      triggersElement: 'DR-PM-001', // Pick Detail Modal
    },
    {
      gesture: 'long-press',
      result: 'Shows tooltip with pick number and team name without opening modal',
      haptic: 'medium',
    },
    {
      gesture: 'double-tap',
      result: 'Navigates to that team\'s roster view in the Rosters tab',
      haptic: 'medium',
      triggersElement: 'DR-RT-001', // Rosters Tab
    },
  ],

  states: [
    {
      state: 'empty',
      description: 'Awaiting pick - dashed border circle indicating no selection has been made yet. This is the default state for all future picks.',
      visualChanges: {
        backgroundColor: 'transparent',
        border: {
          width: 2,
          color: '#E5E7EB',
          style: 'dashed',
          radius: 24,
        },
        opacity: 0.6,
      },
    },
    {
      state: 'filled',
      description: 'Pick complete - displays team avatar image. Border is removed to give avatar full visual prominence. Shows the team that made this selection.',
      visualChanges: {
        backgroundColor: 'transparent',
        border: {
          width: 0,
          color: 'transparent',
          style: 'none',
          radius: 24,
        },
        opacity: 1,
      },
    },
    {
      state: 'current',
      description: 'On the clock - this slot is the current active pick. Prominent indigo border with light background pulse animation draws attention. Auto-scrolls into view when it becomes active.',
      visualChanges: {
        backgroundColor: '#EEF2FF',
        border: {
          width: 3,
          color: '#6366F1',
          style: 'solid',
          radius: 24,
        },
        opacity: 1,
      },
    },
    {
      state: 'user-pick',
      description: 'User\'s upcoming pick - green border indicates this slot belongs to the logged-in user. Helps users quickly identify when their turn is approaching in the timeline.',
      visualChanges: {
        backgroundColor: 'transparent',
        border: {
          width: 2,
          color: '#10B981',
          style: 'solid',
          radius: 24,
        },
        opacity: 1,
      },
    },
    {
      state: 'user-current',
      description: 'User is on the clock - combines current and user-pick states with animated gradient border (green to indigo) to create urgency.',
      visualChanges: {
        backgroundColor: '#ECFDF5',
        border: {
          width: 3,
          color: '#10B981',
          style: 'solid',
          radius: 24,
        },
        opacity: 1,
      },
    },
    {
      state: 'hover',
      description: 'Desktop hover state - subtle scale increase and shadow indicates interactivity.',
      visualChanges: {
        transform: 'scale(1.08)',
        shadow: {
          x: 0,
          y: 4,
          blur: 8,
          spread: 0,
          color: 'rgba(0, 0, 0, 0.15)',
        },
      },
    },
    {
      state: 'pressed',
      description: 'Active/pressed state - slight scale down provides tactile feedback.',
      visualChanges: {
        transform: 'scale(0.95)',
        opacity: 0.9,
      },
    },
  ],

  visibilityCondition: 'Always visible within picks bar scroll container',
  appearsIn: ['draft-room-main', 'draft-room-picking'],

  // Triggers pick detail modal when tapped
  triggers: ['DR-PM-001'],

  // Child elements within the slot
  children: ['DR-PB-003', 'DR-PB-004'], // Pick Avatar, Pick Number Badge

  stateTransitions: [
    {
      property: 'backgroundColor',
      duration: 200,
      easing: 'ease-out',
    },
    {
      property: 'border-color',
      duration: 200,
      easing: 'ease-out',
    },
    {
      property: 'border-width',
      duration: 150,
      easing: 'ease-in-out',
    },
    {
      property: 'transform',
      duration: 150,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Spring bounce
    },
    {
      property: 'opacity',
      duration: 200,
      easing: 'ease-in-out',
    },
    {
      property: 'box-shadow',
      duration: 200,
      easing: 'ease-out',
    },
  ],

  // Animation when slot becomes "current" (on the clock)
  entryAnimation: {
    type: 'pulse',
    property: 'box-shadow',
    from: '0 0 0 0 rgba(99, 102, 241, 0.4)',
    to: '0 0 0 8px rgba(99, 102, 241, 0)',
    duration: 1500,
    easing: 'ease-out',
    iterationCount: 'infinite',
  },

  platformDifferences: [
    {
      aspect: 'touch-target',
      web: '48x48px (matches visual)',
      ios: '52x52px (extended hit area)',
      android: '52x52px (Material minimum + extension)',
      notes: 'Mobile platforms extend touch target 2px in each direction for easier tapping during fast scroll',
    },
    {
      aspect: 'hover-state',
      web: 'Scale + shadow on hover',
      ios: 'No hover (touch only)',
      android: 'Ripple effect on touch',
      notes: 'Hover interactions only available on desktop web; mobile uses touch feedback',
    },
    {
      aspect: 'haptic-feedback',
      web: 'None',
      ios: 'UIImpactFeedbackGenerator.light on tap, .medium on long-press',
      android: 'HapticFeedbackConstants.VIRTUAL_KEY',
      notes: 'Haptics provide confirmation of interaction especially during fast-paced draft',
    },
    {
      aspect: 'animation-performance',
      web: 'CSS animations, GPU-accelerated transforms',
      ios: 'CAAnimation with Metal rendering',
      android: 'Property animations with hardware acceleration',
      notes: 'All platforms use hardware acceleration for smooth 60fps during scroll',
    },
    {
      aspect: 'scroll-snap',
      web: 'scroll-snap-align: center (CSS Scroll Snap)',
      ios: 'UICollectionView paging disabled, momentum scroll',
      android: 'RecyclerView SnapHelper optional',
      notes: 'Web snaps to center slot on scroll end; mobile prioritizes momentum',
    },
  ],

  techDebt: [
    {
      id: 'TD-DR-PB-002-1',
      severity: 'medium',
      description: 'Pick slots are rendered as individual DOM elements which can cause performance issues with large drafts (300+ picks)',
      suggestedFix: 'Implement windowed/virtualized rendering using react-window or similar to only render visible slots',
      priority: 'P1',
      estimatedEffort: '4h',
    },
    {
      id: 'TD-DR-PB-002-2',
      severity: 'low',
      description: 'Current slot pulse animation continues even when tab is not visible, wasting battery on mobile',
      suggestedFix: 'Use Intersection Observer to pause animation when picks bar not in viewport, and Page Visibility API to pause when tab inactive',
      priority: 'P2',
      estimatedEffort: '1h',
    },
    {
      id: 'TD-DR-PB-002-3',
      severity: 'low',
      description: 'No keyboard navigation support for picks bar - can\'t arrow through slots',
      suggestedFix: 'Add roving tabindex pattern with arrow key handlers and focus ring styling',
      priority: 'P2',
      estimatedEffort: '2h',
    },
    {
      id: 'TD-DR-PB-002-4',
      severity: 'medium',
      description: 'user-current state animation (gradient border) drops frames on lower-end Android devices',
      suggestedFix: 'Replace gradient animation with simpler opacity pulse or use static gradient on low-end devices',
      priority: 'P1',
      estimatedEffort: '1h',
    },
  ],

  accessibility: {
    label: 'Pick slot',
    role: 'button',
    hint: 'Tap to view pick details. Double-tap to see team roster.',
    traits: ['button', 'adjustable'],
    tabIndex: 0,
    keyboardShortcut: 'Enter to select, arrows to navigate',
    announceStateChange: true, // VoiceOver/TalkBack announces state changes
  },

  codeReferences: [
    {
      platform: 'web',
      componentPath: 'components/vx2/draft-room/components/PicksBar/PickSlot.tsx',
      lineStart: 1,
      lineEnd: 145,
      description: 'React component with framer-motion animations and state management',
    },
    {
      platform: 'web',
      componentPath: 'components/vx2/draft-room/components/PicksBar/PickSlot.module.css',
      lineStart: 1,
      lineEnd: 95,
      description: 'CSS modules with state-specific styling and transitions',
    },
    {
      platform: 'ios',
      componentPath: 'TopDog/DraftRoom/Views/PicksBar/PickSlotView.swift',
      lineStart: 1,
      lineEnd: 120,
      description: 'SwiftUI view with state-driven rendering and haptic feedback',
    },
    {
      platform: 'android',
      componentPath: 'app/src/main/java/com/topdog/draftroom/ui/picksbar/PickSlot.kt',
      lineStart: 1,
      lineEnd: 110,
      description: 'Jetpack Compose composable with Material ripple effects',
    },
  ],

  wireframeContext: {
    screenId: 'draft-room-main',
    boundingBox: { x: 24, y: 64, width: 48, height: 48 }, // First slot position
    highlightColor: '#6366F1',
    annotationPosition: 'bottom',
  },

  screenshots: [],
  lastUpdated: now,
  updatedBy: defaultAuthor,
  version: '1.1',
  tags: ['draft-room', 'picks-bar', 'slot', 'interactive', 'timeline', 'state-machine', 'animation', 'accessibility'],
};

/**
 * DR-PB-003: Pick Avatar
 * Team logo/avatar displayed in a filled pick slot
 * 44x44px circular image
 */
const drPb003PickAvatar: GlossaryElement = {
  id: 'DR-PB-003',
  name: 'Pick Avatar',
  description: 'Team logo or avatar image shown in a filled pick slot. High-performance image element with multiple fallback states, progressive image loading, and platform-specific optimization for caching and lazy loading. Appears 100+ times in typical draft scenarios.',

  extendedDescription: `
## Team Branding & Image Loading Strategy

The Pick Avatar is a critical visual element that displays team branding throughout the draft room interface.
It appears in the picks bar (100+ instances in a typical 12-team, 15-round draft), creating a dense visual landscape
where efficient image loading is essential for performance and user experience.

### Image Loading Architecture

- **Primary Source**: CDN-hosted team logo images (WebP with PNG fallback)
- **Caching Strategy**: Aggressive HTTP caching (1 year immutable) + service worker offline support
- **Lazy Loading**: Deferred loading with intersection observer until element enters viewport
- **Blur-Up Placeholder**: Low-quality image placeholder (LQIP) shown during load transition
- **Fallback Chain**: CDN image → Local cache → Team color + initials → Generic placeholder

### Team Branding Context

Each avatar represents a selected team in the draft order. The visual consistency of team logos
reinforces team identity and helps users quickly scan the draft board. Team colors are extracted
from logos and used in adjacent elements (DR-PB-002 Pick Slot background) for cohesive branding.

### Image Delivery & CDN Considerations

Images are served from a globally-distributed CDN with automatic format negotiation:
- Modern browsers receive WebP (60% smaller than PNG)
- Legacy browsers fall back to PNG
- Responsive sizing ensures 44x44px display at all DPI levels (optimized for 2x pixel density)
- ETag validation prevents unnecessary re-downloads on cache hits
  `,

  module: 'draft-room',
  screen: 'draft-room-main',
  parent: 'PickSlot',
  elementType: 'image',

  position: { x: 2, y: 2 },
  dimensions: { width: 44, height: 44 },

  wireframeContext: {
    boundingBox: {
      width: 44,
      height: 44,
      x: 2,
      y: 2,
    },
    containerDimensions: {
      width: 48,
      height: 48,
    },
    containerRadius: 24,
    description: 'Avatar positioned at top-left within the 48x48px Pick Slot with 2px inset padding',
  },

  style: {
    backgroundColor: '#FFFFFF',
    border: {
      width: 2,
      color: '#FFFFFF',
      style: 'solid',
      radius: 22,
    },
    shadow: {
      x: 0,
      y: 1,
      blur: 2,
      spread: 0,
      color: 'rgba(0, 0, 0, 0.1)',
    },
  },

  isInteractive: false,

  entryAnimation: {
    type: 'fade-in',
    duration: 200,
    delay: 0,
    timingFunction: 'ease-out',
    description: 'Subtle fade-in when image loads to prevent jarring placeholder disappearance',
  },

  imageLoadingSpecification: {
    lazyLoading: {
      enabled: true,
      strategy: 'intersection-observer',
      rootMargin: '50px',
      description: 'Images load when within 50px of viewport to provide smooth scrolling experience',
    },

    blurUpPlaceholder: {
      enabled: true,
      resolution: 'ultra-low (4x4px)',
      format: 'SVG data URI',
      description: 'Lightweight blurred team logo shown during load phase; decodes to full resolution on load',
      transitionDuration: 300,
    },

    formatNegotiation: {
      primary: 'image/webp',
      fallback: 'image/png',
      srcsetPattern: 'image-name.webp (web), image-name.png (legacy)',
    },

    cachingStrategy: {
      httpCaching: '1 year (immutable content)',
      serviceWorkerCache: 'Offline-first with network fallback',
      description: 'Team logos are long-lived assets; cached indefinitely with version fingerprinting',
    },
  },

  states: [
    {
      name: 'placeholder',
      description: 'Initial fallback state - single-letter team abbreviation on team-branded background before image loads',
      style: {
        backgroundColor: '#E5E7EB',
      },
      fallbackContent: {
        type: 'team-initials',
        fontSize: 16,
        fontWeight: '600',
        textColor: '#FFFFFF',
        example: 'KC (Kansas City Chiefs)',
      },
    },
    {
      name: 'loading',
      description: 'Blur-up placeholder displayed while CDN image is being fetched; shows pixelated version of logo',
      style: {
        backgroundColor: '#E5E7EB',
        opacity: 0.6,
        filter: 'blur(10px)',
      },
      imageSource: 'data:image/svg+xml...',
    },
    {
      name: 'loaded',
      description: 'Full-resolution team logo has loaded from CDN and is displayed with fade-in animation',
      style: {
        backgroundColor: 'transparent',
        opacity: 1,
      },
      animation: {
        type: 'fade-in',
        duration: 200,
      },
    },
    {
      name: 'error',
      description: 'Image failed to load (CDN unavailable, network error, etc.) - falls back to team initials on solid color',
      style: {
        backgroundColor: '#F3F4F6',
      },
      fallbackBehavior: 'Display team initials + team color',
    },
    {
      name: 'offline',
      description: 'No network connection - cached version served from service worker or IndexedDB backup',
      style: {
        backgroundColor: '#FEF2F2',
        border: {
          width: 2,
          color: '#FEE2E2',
          style: 'dashed',
        },
      },
      indicator: 'Visual border differentiation to indicate cached content',
    },
  ],

  appearsIn: ['draft-room-main', 'draft-room-picking'],

  usageFrequency: {
    instance: '100+ per draft (12 teams × 15 rounds; scales with league size)',
    criticalityToPerformance: 'High - primary UX bottleneck without lazy loading and optimization',
    estimatedBundleImpact: '~2.5KB gzipped per team logo asset',
  },

  accessibility: {
    label: 'Team avatar',
    role: 'image',
    hint: 'Team logo for this pick',
    altText: 'Dynamic - "[Team Name] team logo" (e.g., "Kansas City Chiefs team logo")',
    fallbackText: 'Team abbreviation (2-3 letters) during loading/offline states',
  },

  platformDifferences: {
    web: {
      lazyLoading: 'Native loading="lazy" with intersection observer fallback',
      imageCaching: 'HTTP caching + service worker + IndexedDB backup',
      cdnUsage: 'Global CDN with geographic origin selection',
      blurUp: 'SVG data URI LQIP decoded via requestIdleCallback',
      notes: 'Can leverage JPEG progressive rendering for additional optimization',
    },
    ios: {
      lazyLoading: 'UICollectionView cell reuse with URL-based image cache invalidation',
      imageCaching: 'NSURLSessionConfiguration.ephemeralSessionConfiguration + custom DiskCache',
      cdnUsage: 'CDN selected via network path optimization; edge caching for regional content',
      blurUp: 'CIBlur filter applied to cached LQIP until full resolution available',
      notes: 'Memory warnings trigger cache purge of offline storage; prioritize main bundle size',
    },
    android: {
      lazyLoading: 'RecyclerView item visibility tracking with Glide/Coil image loader',
      imageCaching: 'MediaStore integration + app-specific cache directory with LRU eviction',
      cdnUsage: 'Dynamic CDN selection based on network operator; fallback to regional mirror',
      blurUp: 'RenderScript blur for LQIP; optional fallback to software blur on low-end devices',
      notes: 'WebP format preferred; PNG required for devices below API 18. Monitor heap usage with dense lists.',
    },
  },

  techDebt: [
    {
      priority: 'High',
      item: 'Image optimization - Team logos not currently optimized for web (PNG instead of WebP)',
      impact: 'Each logo ~15-25KB; WebP would reduce to ~6-10KB per image. 100 instances = 1-1.5MB unnecessary data',
      estimatedEffort: '2-3 days (coordinate with design/brand team)',
    },
    {
      priority: 'High',
      item: 'WebP support missing from image tag fallback chain',
      impact: 'Modern browsers still downloading larger PNG; no graceful degradation for unsupported formats',
      estimatedEffort: '4-6 hours (update srcset and picture element templates)',
    },
    {
      priority: 'Medium',
      item: 'Skeleton loader component not implemented',
      impact: 'Placeholder state feels abrupt on slow connections; blur-up adds complexity without visual improvement',
      estimatedEffort: '3-4 days (design + component implementation)',
      suggestedApproach: 'Animated skeleton with subtle pulse animation; matches content dimensions',
    },
    {
      priority: 'Medium',
      item: 'No offline-first caching strategy',
      impact: 'Draft continues but avatars disappear on connection loss; poor offline experience',
      estimatedEffort: '2-3 days (integrate service worker + IndexedDB strategy)',
    },
    {
      priority: 'Low',
      item: 'Image compression via AVIF format not considered',
      impact: 'Future-proofing; AVIF is 15-20% smaller than WebP but support limited to Chrome/Edge',
      estimatedEffort: '1-2 days (add to pipeline; no immediate browser support needed)',
    },
    {
      priority: 'Low',
      item: 'Dynamic team color extraction not implemented',
      impact: 'Placeholder backgrounds are static gray; could extract dominant color from logo for better UX',
      estimatedEffort: '2-3 days (evaluate color-extraction library; compute server-side vs client-side)',
    },
  ],

  codeReferences: [
    {
      platform: 'web',
      componentPath: 'components/DraftRoom/PicksBar/PickAvatar.tsx',
      lineStart: 1,
      lineEnd: 120,
      description: 'React component with image loading state machine, error boundaries, and lazy loading integration',
      keyFunctions: ['useImageLoader', 'useLazyIntersection', 'getTeamLogoUrl', 'getFallbackInitials'],
    },
    {
      platform: 'web',
      filePath: 'services/imageLoader.ts',
      lineStart: 1,
      lineEnd: 85,
      description: 'Image loading service with CDN selection, fallback chain, and caching orchestration',
      keyFunctions: ['loadImage', 'getCachedImage', 'selectCDNRegion'],
    },
    {
      platform: 'web',
      filePath: 'hooks/useBlurUp.ts',
      lineStart: 1,
      lineEnd: 60,
      description: 'LQIP blur-up effect hook with request idle callback optimization',
      keyFunctions: ['useBlurUp', 'decodeBlurHash'],
    },
    {
      platform: 'ios',
      componentPath: 'DraftRoom/PickAvatar/PickAvatarView.swift',
      lineStart: 1,
      lineEnd: 150,
      description: 'UIView subclass with URLSession image caching, cell reuse management, and memory optimization',
      keyClasses: ['PickAvatarView', 'ImageCacheManager', 'PickAvatarDelegate'],
    },
    {
      platform: 'ios',
      filePath: 'Services/CDN/CDNImageLoader.swift',
      lineStart: 1,
      lineEnd: 100,
      description: 'CDN region selection and image delivery coordination for iOS',
      keyFunctions: ['selectCDNEndpoint', 'loadImageWithCache', 'handleNetworkTransition'],
    },
    {
      platform: 'android',
      componentPath: 'com.bestball.draftroom.ui.picks.PickAvatarView',
      lineStart: 1,
      lineEnd: 180,
      description: 'Custom View with Glide image loader integration, RecyclerView visibility tracking',
      keyMethods: ['bind', 'onViewAttachedToWindow', 'onViewDetachedFromWindow', 'setImageUrl'],
    },
    {
      platform: 'android',
      filePath: 'com.bestball.common.image.CDNImageLoader',
      lineStart: 1,
      lineEnd: 120,
      description: 'Glide AppGlideModule configuration for CDN selection, format negotiation, disk cache management',
      keyMethods: ['applyOptions', 'getCDNUrlForRegion', 'getPreferredImageFormat'],
    },
  ],

  screenshots: [],
  lastUpdated: now,
  updatedBy: defaultAuthor,
  version: '2.0',
  tags: ['draft-room', 'picks-bar', 'avatar', 'image', 'lazy-loading', 'caching', 'performance', 'team-branding'],
};

/**
 * DR-PB-004: Pick Number Badge
 * Small badge showing pick number overlaid on pick slot
 * 16x16px positioned at bottom-right
 */
const drPb004PickNumberBadge: GlossaryElement = {
  id: 'DR-PB-004',
  name: 'Pick Number Badge',
  description: 'Small badge showing the pick number (e.g., "1", "2", "12") on each slot',
  module: 'draft-room',
  screen: 'draft-room-main',
  parent: 'PickSlot',
  elementType: 'badge',

  position: { x: 32, y: 32 },
  dimensions: { width: 16, height: 16 },

  style: {
    backgroundColor: '#374151',
    textColor: '#FFFFFF',
    border: {
      width: 1,
      color: '#FFFFFF',
      style: 'solid',
      radius: 8,
    },
  },

  typography: {
    fontFamily: 'system-ui',
    fontSize: 9,
    fontWeight: '600',
    lineHeight: 1,
    textAlign: 'center',
  },

  isInteractive: false,

  states: [
    {
      name: 'default',
      description: 'Normal pick number display',
      style: {
        backgroundColor: '#374151',
        textColor: '#FFFFFF',
      },
    },
    {
      name: 'current',
      description: 'Badge for current pick',
      style: {
        backgroundColor: '#6366F1',
        textColor: '#FFFFFF',
      },
    },
    {
      name: 'user-pick',
      description: 'Badge for user\'s pick',
      style: {
        backgroundColor: '#10B981',
        textColor: '#FFFFFF',
      },
    },
  ],

  appearsIn: ['draft-room-main'],

  accessibility: {
    label: 'Pick number',
    role: 'text',
  },

  codeReferences: [
    {
      platform: 'web',
      componentPath: 'components/DraftRoom/PicksBar/PickNumberBadge.tsx',
      lineStart: 1,
      lineEnd: 35,
    },
  ],

  screenshots: [],
  lastUpdated: now,
  updatedBy: defaultAuthor,
  version: '1.0',
  tags: ['draft-room', 'picks-bar', 'badge', 'number'],
};

/**
 * DR-PB-005: Current Pick Indicator
 * Visual indicator highlighting the current pick slot
 * Animated ring around the active slot
 */
const drPb005CurrentPickIndicator: GlossaryElement = {
  id: 'DR-PB-005',
  name: 'Current Pick Indicator',
  description: 'Animated ring/glow effect around the currently active pick slot',
  module: 'draft-room',
  screen: 'draft-room-main',
  parent: 'PickSlot',
  elementType: 'indicator',

  position: { x: -4, y: -4 },
  dimensions: { width: 56, height: 56 },

  style: {
    backgroundColor: 'transparent',
    border: {
      width: 3,
      color: '#6366F1',
      style: 'solid',
      radius: 28,
    },
  },

  isInteractive: false,

  states: [
    {
      name: 'active',
      description: 'Pulsing animation when pick is active',
      style: {
        backgroundColor: 'transparent',
        border: {
          width: 3,
          color: '#6366F1',
          style: 'solid',
          radius: 28,
        },
      },
    },
    {
      name: 'user-turn',
      description: 'Special animation when it\'s the user\'s turn',
      style: {
        backgroundColor: 'transparent',
        border: {
          width: 3,
          color: '#10B981',
          style: 'solid',
          radius: 28,
        },
      },
    },
  ],

  entryAnimation: {
    type: 'scale',
    duration: 300,
    easing: 'ease-out',
  },

  appearsIn: ['draft-room-main'],

  accessibility: {
    label: 'Current pick indicator',
    role: 'status',
    hint: 'Indicates which pick is currently active',
    ariaLive: 'polite',
  },

  codeReferences: [
    {
      platform: 'web',
      componentPath: 'components/DraftRoom/PicksBar/CurrentPickIndicator.tsx',
      lineStart: 1,
      lineEnd: 50,
    },
  ],

  screenshots: [],
  lastUpdated: now,
  updatedBy: defaultAuthor,
  version: '1.0',
  tags: ['draft-room', 'picks-bar', 'indicator', 'animation'],
};

/**
 * DR-PB-006: Picks Bar Scroll Container
 * Inner scrollable wrapper for the picks bar
 * Contains all pick slots with horizontal scroll
 */
const drPb006ScrollContainer: GlossaryElement = {
  id: 'DR-PB-006',
  name: 'Picks Bar Scroll Container',
  description: 'Inner scrollable container holding all pick slots horizontally',
  module: 'draft-room',
  screen: 'draft-room-main',
  parent: 'PicksBarContainer',
  elementType: 'scroll-container',

  position: { x: 0, y: 0 },
  dimensions: { width: '100%', height: 48 },

  style: {
    backgroundColor: 'transparent',
  },

  isInteractive: true,
  interactions: [
    {
      gesture: 'pan',
      result: 'Scroll through picks',
    },
  ],

  states: [
    {
      name: 'scrollable',
      description: 'More content to scroll',
      style: {},
    },
    {
      name: 'at-start',
      description: 'Scrolled to the beginning',
      style: {},
    },
    {
      name: 'at-end',
      description: 'Scrolled to the end',
      style: {},
    },
  ],

  platformVariations: [
    {
      aspect: 'scrollbar',
      web: 'hidden by default, shows on hover',
      ios: 'hidden',
      android: 'hidden',
      notes: 'Scrollbar visibility varies',
    },
  ],

  appearsIn: ['draft-room-main'],

  accessibility: {
    label: 'Picks scroll area',
    role: 'list',
  },

  codeReferences: [
    {
      platform: 'web',
      componentPath: 'components/DraftRoom/PicksBar/ScrollContainer.tsx',
      lineStart: 1,
      lineEnd: 60,
    },
  ],

  screenshots: [],
  lastUpdated: now,
  updatedBy: defaultAuthor,
  version: '1.0',
  tags: ['draft-room', 'picks-bar', 'scroll', 'container'],
};

// ============================================================================
// Draft Room Footer Elements (Group I)
// ============================================================================

/**
 * DR-FT-001: Footer Container - Navigation Hub
 * Fixed bottom navigation container with 5 primary action tabs
 *
 * Primary navigation hub for draft room. Fixed bottom container holding all tab
 * navigation buttons (Players, Queue, Rosters, Board, Info) and system safe area
 * (iPhone home indicator). Serves as persistent navigation anchor enabling rapid
 * context switching during draft. Base height: 56px + platform-specific safe area
 * insets. Positions above Android system navigation bar and iPhone home indicator.
 *
 * NAVIGATION ROLE: Footer is primary navigation entry point for all draft
 * information panels. Each tab button (DR-FT-002 through DR-FT-006) switches
 * content while maintaining footer's fixed position. Acts as information hub for
 * quick access to Players board, Queue, Rosters, Board history, and league Info.
 * Highest z-index (999) keeps footer above all content except full-screen modals.
 *
 * SAFE AREA HANDLING: Respects platform-specific safe area insets to prevent
 * content overlap with system UI (notches, Dynamic Island, navigation bars).
 * Footer manages padding/insets automatically using environment variables (web)
 * or ViewInsets APIs (mobile).
 */
const drFt001FooterContainer: GlossaryElement = {
  id: 'DR-FT-001',
  name: 'Footer Container',
  description: 'Fixed bottom navigation hub with 5 tab buttons (Players, Queue, Rosters, Board, Info) and safe area handling. Persistent navigation above system UI (notches, home indicator, nav bar). Routes all information panel access.',
  extendedDescription: 'Enterprise-grade footer container serving as primary navigation anchor in draft room. Contains five tab buttons for rapid context switching between draft information panels. Manages safe area insets automatically based on platform (iOS notch/Dynamic Island: 34px bottom, Android navigation bar: 0-48px bottom). Remains fixed during interactions, modals, keyboard except full-screen modal overlays which hide footer. Transitions between compact state (keyboard open: 48px) and expanded state (more space: 64px).',
  module: 'draft-room',
  screen: 'draft-room-main',
  parent: 'DraftRoomLayout',
  elementType: 'container',
  role: 'tablist',

  position: { x: 0, y: 'calc(100% - 56px)' },
  dimensions: { width: '100%', height: 56 },
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  zIndex: 999,

  style: {
    backgroundColor: '#FFFFFF',
    border: {
      width: 1,
      color: '#E5E7EB',
      style: 'solid',
      radius: 0,
    },
    shadow: {
      x: 0,
      y: -2,
      blur: 8,
      spread: 0,
      color: 'rgba(0, 0, 0, 0.08)',
    },
  },

  isInteractive: true,

  states: [
    {
      state: 'default',
      description: 'Normal footer state with standard height (56px). All tabs visible and responsive. Default gray text for inactive tabs.',
      visualChanges: {
        backgroundColor: '#FFFFFF',
        height: 56,
        opacity: 1,
      },
    },
    {
      state: 'compact',
      description: 'Compact state when software keyboard opens on mobile. Height reduces to 48px, icons/text smaller. Footer remains visible and interactive above keyboard for tab switching while typing.',
      visualChanges: {
        backgroundColor: '#FFFFFF',
        height: 48,
        opacity: 0.98,
      },
      tabHeight: 48,
      iconSize: 20,
      fontSize: 10,
    },
    {
      state: 'expanded',
      description: 'Expanded state showing more footer info. Height increases to 64px with larger touch targets and prominent tab labels. Used when additional context beneficial or sufficient vertical space available.',
      visualChanges: {
        backgroundColor: '#FFFFFF',
        height: 64,
        opacity: 1,
      },
      tabHeight: 64,
      iconSize: 28,
      fontSize: 12,
    },
    {
      state: 'hidden',
      description: 'Footer completely hidden during full-screen modals (player detail sheets, settings). Opacity 0 and pointer-events none. Navigation unavailable while modal presented.',
      visualChanges: {
        opacity: 0,
        pointerEvents: 'none',
        display: 'none',
      },
    },
  ],

  stateTransitions: [
    {
      property: 'height',
      duration: 250,
      easing: 'ease-in-out',
    },
    {
      property: 'opacity',
      duration: 200,
      easing: 'ease-out',
    },
    {
      property: 'backgroundColor',
      duration: 200,
      easing: 'ease-out',
    },
  ],

  visibilityCondition: 'Always visible except during full-screen modal overlays (player detail sheets, bottom sheet modals with fullScreen flag, image preview fullscreen). Hidden when modals presented with fullScreen or overCurrentContext style. Reappears when modal dismissed.',
  appearsIn: ['draft-room-main'],
  hiddenDuring: [
    'full-screen-modals',
    'bottom-sheet-modals-with-fullscreen-flag',
    'image-preview-fullscreen',
    'settings-modal-fullscreen',
  ],

  children: [
    'DR-FT-002', // Tab Button - Players (left, 20% width)
    'DR-FT-003', // Tab Button - Queue (20% width)
    'DR-FT-004', // Tab Button - Rosters (20% width)
    'DR-FT-005', // Tab Button - Board (20% width)
    'DR-FT-006', // Tab Button - Info (right, 20% width)
    'DR-FT-007', // Home Indicator Bar (safe area inset container, 34px on iOS)
  ],

  platformDifferences: [
    {
      aspect: 'safe-area-inset-bottom',
      web: '0px (no system UI)',
      ios: '20px to 34px depending on device (iPhone 12+ notch/Dynamic Island: 34px; iPhone SE: 0px; home button devices: 20px)',
      android: '0px to 56px depending on nav mode (3-button nav: 48px; gesture nav: 0-48px)',
      notes: 'Footer positioned at viewport bottom and shifts up by safe area inset. Final footer.y = screen.height - 56 - insetBottom. Insets queried at runtime.',
    },
    {
      aspect: 'safe-area-inset-left-right',
      web: '0px (full width)',
      ios: '0px on standard devices; 40px+ on devices with rounded corners or Dynamic Island side position insets',
      android: '0px typically; some devices may have 12px side insets',
      notes: 'Footer spans full screen width. Tab buttons adjust padding to avoid corner radius notches on ultra-wide displays.',
    },
    {
      aspect: 'ios-notch-handling',
      web: 'N/A - no notch on desktop',
      ios: 'Respects useSafeAreaInsets() via @Environment(.safeAreaInsets) in SwiftUI or safeAreaLayoutGuide in UIKit. Footer y = screen.height - 56 - safeAreaBottom. Dynamic Island (15-17px tall) requires 34px bottom inset on iPhone 14 Pro.',
      android: 'N/A',
      notes: 'Use SwiftUI @Environment(.safeAreaInsets) or UIView.safeAreaInsets for dynamic values. Notch/Dynamic Island managed by system; footer does not extend into safe area.',
    },
    {
      aspect: 'android-nav-bar-handling',
      web: 'N/A',
      ios: 'N/A',
      android: 'Respects View.setSystemUiVisibility() or WindowInsets.displayCutout. Footer positioned above nav bar (48px on 3-button), or 0px with gesture nav. Use ViewCompat.getRootWindowInsets().getSystemGestureInsetBottom() to query at runtime.',
      notes: 'Gesture nav hides system nav bar but footer respects gesture inset (48px from bottom on Pixel) to prevent conflict with back/home/recents gestures.',
    },
    {
      aspect: 'keyboard-avoidance',
      web: 'N/A',
      ios: 'Footer animates up by keyboard height when keyboard opens. Example: 346px keyboard, footer shifts from (screen.height - 56) to (screen.height - 346 - 56). Animated with keyboard curve (UIViewAnimationCurve.easeOut, ~300ms). Enters compact state (48px).',
      android: 'Footer adjusts position and enters compact state when keyboard shown. Use OnPreDrawListener + ViewCompat.getRootWindowInsets().getInsets(Type.ime()) to detect keyboard height and animate constraints.',
      notes: 'Both platforms: Footer remains fully visible and interactive above keyboard. Does NOT hide beyond compact state. Keyboard notification posted via KeyboardManager (iOS) or WindowInsets API (Android).',
    },
    {
      aspect: 'landscape-orientation',
      web: 'Spans full width horizontally, height remains 56px',
      ios: 'Height may reduce to 44px in landscape on iPhone SE to maximize content. Safe area insets differ in landscape (left/right may have insets if notch positioned on side).',
      android: 'Height typically 56px in landscape. Some devices reduce to 48px if system nav bar repositions to right side. Gesture nav reduces visible inset to 0-24px on right.',
      notes: 'Tech debt: Landscape support incomplete on iOS. Footer height not optimized for landscape. Needs orientation change listeners and testing.',
    },
    {
      aspect: 'touch-target-size',
      web: '56px height (tab buttons get full height)',
      ios: '56px height minimum (exceeds HIG 44pt minimum). Tab buttons extended to 48x56pt minimum per Apple HIG.',
      android: '56px height (tab buttons 48x56dp minimum per Material Design 3)',
      notes: 'All platforms exceed minimum touch targets (44x44). Horizontal space per tab ~72px on iPhone 12 (100% / 5 tabs).',
    },
    {
      aspect: 'shadow-rendering',
      web: 'CSS box-shadow: 0 -2px 8px rgba(0,0,0,0.08)',
      ios: 'CALayer.shadowOpacity = 0.08, shadowRadius = 8pt, shadowOffset = (0, -2pt). Optimized with shadowPath for performance.',
      android: 'android:elevation="8dp" (Material elevation) or Canvas.drawShadow(). Elevation creates downward shadow only (platform limitation).',
      notes: 'Web/iOS support negative shadow Y offset (y: -2). Android elevation points downward; approximate with CAM elevation.',
    },
    {
      aspect: 'separator-line',
      web: 'border-top: 1px solid #E5E7EB (visible light gray)',
      ios: 'borderTop: 1pt, borderTopColor: UIColor(red: 229/255, green: 231/255, blue: 235/255)',
      android: 'Divider(color = Color(0xFFE5E7EB), thickness = 1.dp)',
      notes: 'Light gray separator line (Tailwind gray-200) visually separates footer from content above.',
    },
  ],

  techDebt: [
    {
      id: 'TD-DR-FT-001-1',
      severity: 'high',
      description: 'Keyboard avoidance not fully implemented. Footer does not automatically adjust position when software keyboard opens on iOS/Android. Can be partially obscured by keyboard.',
      suggestedFix: 'iOS: Observe KeyboardManager notifications using Combine and animate footer.bottom constraint adjustment matching keyboard height/curve. Android: Use ViewCompat.getRootWindowInsets().getInsets(Type.ime()) in doOnLayout to detect keyboard height and animate ConstraintLayout.',
      priority: 'P0',
      estimatedEffort: '3h',
      affectedPlatforms: ['ios', 'android'],
      testingRequirements: 'Test on iPhone 12, iPhone SE, Pixel 6, Samsung Galaxy S21 with gesture and 3-button nav.',
    },
    {
      id: 'TD-DR-FT-001-2',
      severity: 'medium',
      description: 'Landscape orientation support incomplete. Footer height not optimized for landscape on iOS (should compress to 44px). No testing coverage for Android landscape.',
      suggestedFix: 'Add orientation change listener. iOS: Listen to viewWillTransition and reduce height to 44px in landscape on small iPhones. Android: Override onConfigurationChanged and test layout adaptation.',
      priority: 'P1',
      estimatedEffort: '2h',
      affectedPlatforms: ['ios', 'android'],
      testingRequirements: 'Rotate iPhone 12/SE and Pixel 6 in landscape with gesture and 3-button navigation.',
    },
    {
      id: 'TD-DR-FT-001-3',
      severity: 'medium',
      description: 'Safe area inset handling brittle. Hardcoded inset values (34px iOS, 48px Android) not fully dynamic. New device models require code changes.',
      suggestedFix: 'Query safe area insets at runtime: iOS safeAreaInsets.bottom, Android WindowInsets.getSystemGestureInsetBottom(). Store in @State/@EnvironmentObject and subscribe to changes.',
      priority: 'P1',
      estimatedEffort: '1.5h',
      affectedPlatforms: ['ios', 'android'],
    },
    {
      id: 'TD-DR-FT-001-4',
      severity: 'low',
      description: 'Compact/expanded state transitions lack haptic feedback. No tactile confirmation when footer animates between states.',
      suggestedFix: 'Add light haptic pulse (UIImpactFeedbackGenerator.lightImpact) when transitioning to/from compact state. Provides tactile confirmation matching system keyboard behavior.',
      priority: 'P2',
      estimatedEffort: '30m',
      affectedPlatforms: ['ios', 'android'],
    },
    {
      id: 'TD-DR-FT-001-5',
      severity: 'low',
      description: 'No accessibility announcement when footer hides during full-screen modals. Screen reader users (VoiceOver/TalkBack) not informed navigation temporarily unavailable.',
      suggestedFix: 'When footer visibility changes, announce to accessibility system: "Navigation hidden" (hide) / "Navigation available" (show). iOS: UIAccessibility.post(notification: .announcement, argument: message). Android: announce() via AccessibilityAnnouncement API.',
      priority: 'P2',
      estimatedEffort: '45m',
      affectedPlatforms: ['ios', 'android'],
    },
  ],

  accessibility: {
    label: 'Draft room primary navigation',
    role: 'tablist',
    hint: 'Contains 5 navigation tabs to switch between Players, Queue, Rosters, Board, and Info panels',
    traits: ['tablist', 'navigation'],
    ariaLabel: 'Draft navigation hub',
    ariaDescription: 'Tab navigation hub with 5 tabs: Players, Queue, Rosters, Board, and Info. Current active tab indicated by blue bottom border (3px). Use arrow keys to navigate between tabs.',
    announceStateChange: true,
    tabIndex: 0,
  },

  codeReferences: [
    {
      platform: 'web',
      componentPath: 'components/vx2/draft-room/components/Footer/FooterContainer.tsx',
      lineStart: 1,
      lineEnd: 110,
      description: 'React container managing tab state (active index) and visibility logic for modals. Respects safe area CSS env variables (safe-area-inset-bottom). Observes keyboard height via window resize events and enters compact state.',
    },
    {
      platform: 'web',
      componentPath: 'components/vx2/draft-room/components/Footer/Footer.module.css',
      lineStart: 1,
      lineEnd: 85,
      description: 'CSS module with padding-bottom: env(safe-area-inset-bottom) for dynamic safe area handling. State styles for compact (48px), default (56px), expanded (64px), and hidden (display: none). Media queries for landscape.',
    },
    {
      platform: 'ios',
      componentPath: 'TopDog/DraftRoom/Views/FooterContainer.swift',
      lineStart: 1,
      lineEnd: 155,
      description: 'SwiftUI container with @Environment(.safeAreaInsets) for runtime safe area queries. Observes keyboard height via KeyboardHeightHelper (Combine publisher). Animates footer.bottom constraint and height. Listens to modal presentation state and toggles visibility.',
    },
    {
      platform: 'ios',
      componentPath: 'TopDog/DraftRoom/Views/KeyboardHeightHelper.swift',
      lineStart: 1,
      lineEnd: 52,
      description: 'Helper class (Combine ObservableObject) monitoring keyboard height via NotificationCenter KeyboardWillShow/Hide. Published keyboardHeight value for SwiftUI to observe. Animates transitions matching system keyboard curve.',
    },
    {
      platform: 'ios',
      componentPath: 'TopDog/DraftRoom/Views/ScreenOrientationHelper.swift',
      lineStart: 1,
      lineEnd: 40,
      description: 'Helper class observing device orientation changes via AppDelegate or SceneDelegate. Published orientation value enables reactive footer height adjustments for landscape mode.',
    },
    {
      platform: 'android',
      componentPath: 'app/src/main/java/com/topdog/draftroom/ui/footer/FooterContainer.kt',
      lineStart: 1,
      lineEnd: 165,
      description: 'Jetpack Compose container. Observes IME height via ViewCompat.getRootWindowInsets().getInsets(Type.ime()). Animates constraints via animateTo when keyboard shown/hidden. Observes modal state from ViewModel and conditionally renders footer.',
    },
    {
      platform: 'android',
      componentPath: 'app/src/main/java/com/topdog/draftroom/ui/footer/SafeAreaHelper.kt',
      lineStart: 1,
      lineEnd: 68,
      description: 'Utility object computing safe area insets from DisplayCutout and NavigationBarHeight APIs. Exports getSystemGestureInset() and getNavBarInset() for runtime queries on different device configurations.',
    },
  ],

  wireframeContext: {
    screenId: 'draft-room-main',
    description: 'Footer positioned at bottom spanning full width. Base height 56px plus variable safe area bottom inset (34px iOS, 0-48px Android). Positioned above all content and system UI. Contains 5 equally-sized tab buttons (20% width each) + safe area bar.',
    boundingBox: {
      x: 0,
      y: 'calc(100% - 56px - safe_area_bottom)',
      width: '100%',
      height: 56,
    },
    safeAreaContext: {
      iosNotch: 'iPhone 14 Pro/Pro Max: Footer positioned 34px above bottom (Dynamic Island safe area)',
      iosSafeHome: 'iPhone SE/11: Footer positioned 20px above bottom (home button safe area)',
      androidGestureNav: 'Pixel 6/6 Pro: Footer positioned 48px above bottom to avoid gesture inset area',
      androidButtonNav: 'Older Android: Footer positioned at screen bottom (no inset, 3-button nav below tab bar)',
    },
    tabLayout: {
      totalTabs: 5,
      tabWidths: 'Each tab = 20% width of footer (100% / 5 tabs)',
      tabPositions: [
        { tabId: 'DR-FT-002', label: 'Players', xStart: '0%', xEnd: '20%' },
        { tabId: 'DR-FT-003', label: 'Queue', xStart: '20%', xEnd: '40%' },
        { tabId: 'DR-FT-004', label: 'Rosters', xStart: '40%', xEnd: '60%' },
        { tabId: 'DR-FT-005', label: 'Board', xStart: '60%', xEnd: '80%' },
        { tabId: 'DR-FT-006', label: 'Info', xStart: '80%', xEnd: '100%' },
      ],
    },
    highlightColor: '#3B82F6',
    annotationPosition: 'top',
  },

  screenshots: [],
  lastUpdated: now,
  updatedBy: defaultAuthor,
  version: '2.0',
  tags: [
    'draft-room',
    'footer',
    'navigation',
    'tablist',
    'safe-area',
    'keyboard-handling',
    'modal-interaction',
    'accessibility',
    'enterprise',
    'primary-navigation',
    'persistent-ui',
  ],
};

/**
 * DR-FT-002: Tab Button - Players
 *
 * CRITICAL ELEMENT: Primary tab for player selection during draft. This is the
 * most-used element in the draft interface - analytics show players spend 80%
 * of draft time on this tab. Default selected state when entering the draft room.
 *
 * Function: Switches draft room view to Players panel showing searchable/filterable
 * list of all available players in the league with ADP, positional ranks, and
 * injury status. Serves as the primary interface for player selection and queue
 * management during all phases of the draft.
 */
const drFt002TabPlayers: GlossaryElement = {
  id: 'DR-FT-002',
  name: 'Tab Button - Players',
  description: 'Primary footer tab button serving as the main interface for player selection and viewing during draft. Shows comprehensive player list with filtering, search, and ADP/ranking data. Positioned as first of five tabs in footer navigation. Players spend approximately 80% of active draft time on this tab. Default selected tab when draft room loads. Icon displays Lucide users icon with optional badge showing count of queued players. Tap gesture immediately switches main content area from current tab view to full Players panel.',
  module: 'draft-room',
  screen: 'draft-room-main',
  parent: 'FooterContainer',
  elementType: 'tab',

  position: { x: 0, y: 0 },
  dimensions: { width: 'calc(20% - 0.8px)', height: 56 },
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  padding: { top: 4, right: 0, bottom: 8, left: 0 },
  zIndex: 100,

  style: {
    backgroundColor: '#FFFFFF',
    textColor: '#6B7280',
    border: {
      width: 0,
      color: 'transparent',
      radius: 0,
    },
    shadow: {
      x: 0,
      y: -1,
      blur: 0,
      spread: 0,
      color: 'transparent',
    },
  },

  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 11,
    fontWeight: 500,
    lineHeight: 1.2,
    textAlign: 'center',
  },

  icon: {
    name: 'users',
    library: 'lucide',
    size: 24,
    color: '#6B7280',
    strokeWidth: 2,
    description: 'Lucide users icon representing player/team selection. Two-head silhouette indicating group/player concept.',
  },

  isInteractive: true,
  interactions: [
    {
      gesture: 'tap',
      result: 'Switches main content area to Players panel view. Animates content transition (200ms fade + slide). Updates tab indicator. Content now shows searchable player list with filtering by position, team, bye week, and ADP range.',
      haptic: 'light',
      triggersElement: 'players-panel',
      analytics: 'track_tab_switch:players',
    },
    {
      gesture: 'long-press',
      result: 'Shows tooltip "Players - View available players and manage queue"',
      haptic: 'medium',
      duration: 500,
    },
  ],

  states: [
    {
      state: 'default',
      description: 'Inactive tab state - tab not currently selected. Gray icon and label text. White background. Used when any other tab is active.',
      visualChanges: {
        textColor: '#6B7280',
        backgroundColor: '#FFFFFF',
        border: {
          width: 0,
          color: 'transparent',
          radius: 0,
        },
      },
      iconChanges: {
        color: '#6B7280',
      },
    },
    {
      state: 'active',
      description: 'Active/selected tab state - this tab is currently displayed. Blue accent color for icon and label. Blue bottom border (3px, full width) indicates selection. This is the default state when draft room first loads.',
      visualChanges: {
        textColor: '#3B82F6',
        backgroundColor: '#FFFFFF',
        border: {
          width: 3,
          color: '#3B82F6',
          style: 'solid',
          position: 'bottom',
          radius: 0,
        },
      },
      iconChanges: {
        color: '#3B82F6',
      },
    },
    {
      state: 'hover',
      description: 'Desktop-only hover state when cursor moves over tab. Subtle background tint indicates interactivity. Not applicable on touch devices.',
      visualChanges: {
        backgroundColor: '#F9FAFB',
        textColor: '#374151',
      },
      iconChanges: {
        color: '#374151',
      },
      conditions: 'Web only, pointer input',
    },
    {
      state: 'pressed',
      description: 'Active press state - finger/cursor pressing down on tab. Background becomes slightly darker. Visual feedback that interaction is registered.',
      visualChanges: {
        backgroundColor: '#F3F4F6',
        textColor: '#111827',
      },
      iconChanges: {
        color: '#111827',
      },
    },
    {
      state: 'disabled',
      description: 'Disabled state during pick animation when user is on the clock to make a selection. Tab remains visible but interaction disabled. Opacity reduced to 0.6. Users cannot navigate away while their timer is active - must make pick or let timer expire. Prevents accidental tab switches during critical moments.',
      visualChanges: {
        opacity: 0.6,
        textColor: '#D1D5DB',
        backgroundColor: '#F9FAFB',
      },
      iconChanges: {
        color: '#D1D5DB',
      },
      conditions: 'Active user turn with timer running',
    },
  ],

  visibilityCondition: 'Always visible during draft',
  appearsIn: ['draft-room-main', 'draft-room-picking'],

  children: ['DR-FT-002-BADGE'],

  triggers: ['players-panel'],

  stateTransitions: [
    {
      property: 'color',
      duration: 150,
      easing: 'ease-out',
    },
    {
      property: 'background-color',
      duration: 150,
      easing: 'ease-out',
    },
    {
      property: 'border-color',
      duration: 150,
      easing: 'ease-out',
    },
    {
      property: 'opacity',
      duration: 200,
      easing: 'ease-in-out',
    },
  ],

  platformDifferences: [
    {
      aspect: 'tab-bar-style',
      web: 'Fixed footer tab bar with 5 equal-width tabs (20% each) and top border indicator',
      ios: 'iOS-style bottom tab bar (UITabBar) with automatic safe area inset handling. Tab bar scales down on iPhone SE. Appearance uses tintColor for blue accent.',
      android: 'Material 3 bottom navigation bar with 5 destinations. Uses Material ripple effect on press. Icon size adapts: 24dp (small phones) to 32dp (tablets). Typography uses Material headline/label styles.',
      notes: 'iOS uses tab bar native animations. Android uses Material motion specs. Web uses CSS transitions. Touch target areas extend beyond visual bounds on mobile.',
    },
    {
      aspect: 'icon-rendering',
      web: 'Lucide React SVG icon, crisp at any size, color applied via fill/stroke CSS',
      ios: 'Lucide iOS icons (converted to SF Symbol equivalents) rendered at @3x resolution with renderingMode: .alwaysTemplate for tint color support',
      android: 'Lucide icon converted to Material Design icon or custom vector drawable (VectorDrawable XML), tinted via tint attribute',
      notes: 'Ensure icon remains visually recognizable at 24px size. Test on small screens (320px width).',
    },
    {
      aspect: 'haptic-feedback',
      web: 'None - no haptic capability on desktop',
      ios: 'UIImpactFeedbackGenerator.light on tap, UISelectionFeedbackGenerator on state change',
      android: 'HapticFeedbackConstants.VIRTUAL_KEY on tap, performHapticFeedback() on state transition',
      notes: 'Mobile platforms provide tactile confirmation especially important during fast-paced drafting',
    },
    {
      aspect: 'touch-target',
      web: '56x56px (visual size matches touch target)',
      ios: '56x56px minimum, extended to 60x60px hit area for accessibility compliance (44pt minimum per Apple)',
      android: '56dp visual, 64dp minimum touch target per Material Design (TOUCH_TARGET_MIN_SIZE)',
      notes: 'Mobile platforms extend invisible hit area to meet accessibility guidelines. Minimum 44pt (iOS) / 48dp (Android) for user comfort.',
    },
    {
      aspect: 'badge-position',
      web: 'Absolutely positioned at top-right corner of icon, 4px from edges',
      ios: 'Positioned using SwiftUI offset modifier, respects safe area',
      android: 'Badge position adjusted based on layout density (compact vs default)',
      notes: 'Badge may hide on very small screens (< 320px). Consider ellipsis (3+) for large queue counts.',
    },
    {
      aspect: 'animation-performance',
      web: 'CSS transitions, GPU-accelerated via will-change: transform',
      ios: 'CABasicAnimation or UIView.animate with CADisplayLink for smooth 60fps. Use metal rendering for complex effects.',
      android: 'ObjectAnimator or ValueAnimator with hardware acceleration enabled. Use choreographer for animation sync.',
      notes: 'Maintain 60fps during tab transitions. Monitor frame drops on low-end devices using Android Profiler.',
    },
    {
      aspect: 'focus-ring',
      web: 'Outline ring (2px solid #3B82F6) visible on :focus-visible for keyboard navigation',
      ios: 'No visible focus ring on touch. Keyboard navigation shows blue focus border via UITabBar default behavior.',
      android: 'Material ripple effect serves as focus indicator. Accessibility focus box shown in gray outline.',
      notes: 'Tech debt: Web focus ring needs CSS implementation. See techDebt items.',
    },
  ],

  techDebt: [
    {
      id: 'TD-DR-FT-002-1',
      severity: 'high',
      description: 'Missing focus ring for keyboard navigation on web platform. Tab key navigation works but no visible focus indicator for accessibility.',
      suggestedFix: 'Add CSS rule: button:focus-visible { outline: 2px solid #3B82F6; outline-offset: 2px; }. Test with Tab key navigation.',
      priority: 'P0',
      estimatedEffort: '30m',
      wcagCriteria: '2.4.7 Focus Visible (AA)',
    },
    {
      id: 'TD-DR-FT-002-2',
      severity: 'medium',
      description: 'Touch target size (56x56px) below Material Design minimum (64dp) on Android. May cause mis-taps during fast drafting.',
      suggestedFix: 'Extend hit area to 64x64px by wrapping with transparent padding or increasing button size. Coordinate with other tabs.',
      priority: 'P1',
      estimatedEffort: '1h',
      wcagCriteria: '2.5.5 Target Size (AAA)',
    },
    {
      id: 'TD-DR-FT-002-3',
      severity: 'medium',
      description: 'Badge count animation (on queue update) is laggy on low-end Android devices. Numeric transitions cause jank.',
      suggestedFix: 'Remove count transition animation. Use static text updates only. Alternatively, use scale animation instead of number animation.',
      priority: 'P1',
      estimatedEffort: '1h',
    },
    {
      id: 'TD-DR-FT-002-4',
      severity: 'low',
      description: 'Icon should pulse/scale slightly when new players are queued (visual cue). Currently no animation on queue update.',
      suggestedFix: 'Add subtle scale animation (1.0 -> 1.1 -> 1.0, 300ms) when badge count increases. Use reduced-motion media query.',
      priority: 'P2',
      estimatedEffort: '45m',
    },
    {
      id: 'TD-DR-FT-002-5',
      severity: 'low',
      description: 'Tab bar overflow text label "Players" is cut off on very small screens (< 320px). Label hidden but icon visible.',
      suggestedFix: 'Implement responsive typography: hide label on screens < 330px width, show icon only. Use CSS media query.',
      priority: 'P2',
      estimatedEffort: '20m',
    },
    {
      id: 'TD-DR-FT-002-6',
      severity: 'low',
      description: 'No keyboard shortcut to switch to Players tab. Other tabs may get shortcuts in future.',
      suggestedFix: 'Add keyboard shortcut (e.g., "1" key or Cmd+1) to activate Players tab. Announce in settings/help.',
      priority: 'P3',
      estimatedEffort: '1h',
    },
  ],

  accessibility: {
    label: 'Players',
    role: 'tab',
    hint: 'Switch to Players view. Shows searchable list of available players to draft. Currently 80% of active draft time spent here.',
    traits: ['tab', 'selected-default'],
    tabIndex: 0,
    keyboardShortcut: 'Tab key for navigation, Enter/Space to select, Alt+1 (future)',
    announceStateChange: true,
    focusIndicator: 'visible-on-focus',
  },

  wireframeContext: {
    screenId: 'draft-room-main',
    boundingBox: { x: 0, y: 'calc(100% - 56px)', width: '20%', height: 56 },
    highlightColor: '#3B82F6',
    annotationPosition: 'top',
    notes: 'First tab in 5-tab footer. Extends full width divided by 5. Active state shows blue underline at bottom.',
  },

  codeReferences: [
    {
      platform: 'web',
      componentPath: 'components/vx2/draft-room/components/Footer/TabButton.tsx',
      lineStart: 1,
      lineEnd: 110,
      description: 'Main React component with tab state management, click handlers, badge rendering, and CSS transitions. Imports Lucide users icon. Manages active state via Redux/Context.',
    },
    {
      platform: 'web',
      componentPath: 'components/vx2/draft-room/components/Footer/TabButton.module.css',
      lineStart: 1,
      lineEnd: 65,
      description: 'CSS module with all state styling, transitions, hover effects, and responsive media queries. Will-change optimization for transforms.',
    },
    {
      platform: 'web',
      componentPath: 'hooks/useDraftTabNavigation.ts',
      lineStart: 1,
      lineEnd: 40,
      description: 'Custom React hook managing tab switching logic, panel visibility state, and keyboard navigation for all tabs.',
    },
    {
      platform: 'ios',
      componentPath: 'TopDog/DraftRoom/Views/Footer/PlayersTabBarItem.swift',
      lineStart: 1,
      lineEnd: 85,
      description: 'SwiftUI View conforming to tab bar delegate. Uses SF Symbol "person.2" or custom Lucide SVG rendered to UIImage. Implements haptic feedback and badge binding.',
    },
    {
      platform: 'ios',
      componentPath: 'TopDog/DraftRoom/ViewModels/DraftTabViewModel.swift',
      lineStart: 1,
      lineEnd: 55,
      description: 'MVVM view model managing tab selection state and queuedPlayerCount @Published property that updates badge in real-time.',
    },
    {
      platform: 'android',
      componentPath: 'app/src/main/java/com/topdog/draftroom/ui/footer/PlayersTabItem.kt',
      lineStart: 1,
      lineEnd: 95,
      description: 'Jetpack Compose @Composable for Players tab. Uses NavigationBarItem with Material ripple effect. Badge rendered as overlay on icon.',
    },
    {
      platform: 'android',
      componentPath: 'app/src/main/res/drawable/ic_users.xml',
      lineStart: 1,
      lineEnd: 25,
      description: 'Vector drawable (VectorDrawable) for users icon - 24dp size, Material Design compatible. Tinted dynamically based on state.',
    },
  ],

  screenshots: [],
  lastUpdated: now,
  updatedBy: defaultAuthor,
  version: '2.0',
  tags: [
    'draft-room',
    'footer',
    'tab',
    'players',
    'navigation',
    'primary-interaction',
    'high-usage',
    'critical-element',
    'badge',
    'mobile-optimized',
    'accessibility',
    'keyboard-navigation',
    'haptic-feedback',
  ],
};


/**
 * DR-FT-003: Tab Button - Queue
 * Second footer tab for viewing queue of upcoming picks
 * Shows user's draft queue and recommendations
 */
const drFt003TabQueue: GlossaryElement = {
  id: 'DR-FT-003',
  name: 'Tab Button - Queue',
  description: 'Footer tab button to view draft queue and upcoming picks',
  module: 'draft-room',
  screen: 'draft-room-main',
  parent: 'FooterContainer',
  elementType: 'tab',

  position: { x: 'calc(20% + 0.2px)', y: 0 },
  dimensions: { width: 'calc(20% - 0.8px)', height: 56 },
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  zIndex: 100,

  style: {
    backgroundColor: '#FFFFFF',
    textColor: '#6B7280',
    border: {
      width: 0,
      color: 'transparent',
      radius: 0,
    },
  },

  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 11,
    fontWeight: 500,
    lineHeight: 1.2,
  },

  icon: {
    name: 'list',
    library: 'lucide',
    size: 24,
    color: '#6B7280',
    strokeWidth: 2,
  },

  isInteractive: true,
  interactions: [
    {
      gesture: 'tap',
      result: 'Switch to Queue tab view',
      haptic: 'light',
      triggersElement: 'queue-panel',
    },
  ],

  states: [
    {
      state: 'default',
      description: 'Inactive tab state',
      visualChanges: {
        textColor: '#6B7280',
        backgroundColor: '#FFFFFF',
      },
      iconChanges: {
        color: '#6B7280',
      },
    },
    {
      state: 'active',
      description: 'Active selected tab',
      visualChanges: {
        textColor: '#3B82F6',
        backgroundColor: '#FFFFFF',
        border: {
          width: 3,
          color: '#3B82F6',
          radius: 0,
        },
      },
      iconChanges: {
        color: '#3B82F6',
      },
    },
  ],

  visibilityCondition: 'Always visible',
  appearsIn: ['draft-room-main'],

  accessibility: {
    label: 'Queue tab',
    role: 'tab',
    hint: 'View your draft queue',
    traits: ['tab'],
    tabIndex: -1,
  },

  stateTransitions: [
    {
      property: 'color',
      duration: 150,
      easing: 'ease-out',
    },
  ],

  codeReferences: [
    {
      platform: 'web',
      componentPath: 'components/DraftRoom/Footer/TabButton.tsx',
      lineStart: 1,
      lineEnd: 90,
    },
  ],

  screenshots: [],
  lastUpdated: now,
  updatedBy: defaultAuthor,
  version: '1.0',
  tags: ['draft-room', 'footer', 'tab', 'queue'],
};

/**
 * DR-FT-004: Tab Button - Rosters
 * Third footer tab for viewing team rosters
 * Shows current rosters for all teams in the league
 */
const drFt004TabRosters: GlossaryElement = {
  id: 'DR-FT-004',
  name: 'Tab Button - Rosters',
  description: 'Footer tab button to view team rosters',
  module: 'draft-room',
  screen: 'draft-room-main',
  parent: 'FooterContainer',
  elementType: 'tab',

  position: { x: 'calc(40% + 0.4px)', y: 0 },
  dimensions: { width: 'calc(20% - 0.8px)', height: 56 },
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  zIndex: 100,

  style: {
    backgroundColor: '#FFFFFF',
    textColor: '#6B7280',
    border: {
      width: 0,
      color: 'transparent',
      radius: 0,
    },
  },

  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 11,
    fontWeight: 500,
    lineHeight: 1.2,
  },

  icon: {
    name: 'grid-3x3',
    library: 'lucide',
    size: 24,
    color: '#6B7280',
    strokeWidth: 2,
  },

  isInteractive: true,
  interactions: [
    {
      gesture: 'tap',
      result: 'Switch to Rosters tab view',
      haptic: 'light',
      triggersElement: 'rosters-panel',
    },
  ],

  states: [
    {
      state: 'default',
      description: 'Inactive tab state',
      visualChanges: {
        textColor: '#6B7280',
        backgroundColor: '#FFFFFF',
      },
      iconChanges: {
        color: '#6B7280',
      },
    },
    {
      state: 'active',
      description: 'Active selected tab',
      visualChanges: {
        textColor: '#3B82F6',
        backgroundColor: '#FFFFFF',
        border: {
          width: 3,
          color: '#3B82F6',
          radius: 0,
        },
      },
      iconChanges: {
        color: '#3B82F6',
      },
    },
  ],

  visibilityCondition: 'Always visible',
  appearsIn: ['draft-room-main'],

  accessibility: {
    label: 'Rosters tab',
    role: 'tab',
    hint: 'View team rosters',
    traits: ['tab'],
    tabIndex: -1,
  },

  stateTransitions: [
    {
      property: 'color',
      duration: 150,
      easing: 'ease-out',
    },
  ],

  codeReferences: [
    {
      platform: 'web',
      componentPath: 'components/DraftRoom/Footer/TabButton.tsx',
      lineStart: 1,
      lineEnd: 90,
    },
  ],

  screenshots: [],
  lastUpdated: now,
  updatedBy: defaultAuthor,
  version: '1.0',
  tags: ['draft-room', 'footer', 'tab', 'rosters'],
};

/**
 * DR-FT-005: Tab Button - Board
 * Fourth footer tab for viewing full draft board
 * Shows all picks made so far in the draft
 */
const drFt005TabBoard: GlossaryElement = {
  id: 'DR-FT-005',
  name: 'Tab Button - Board',
  description: 'Footer tab button to view full draft board and pick history',
  module: 'draft-room',
  screen: 'draft-room-main',
  parent: 'FooterContainer',
  elementType: 'tab',

  position: { x: 'calc(60% + 0.6px)', y: 0 },
  dimensions: { width: 'calc(20% - 0.8px)', height: 56 },
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  zIndex: 100,

  style: {
    backgroundColor: '#FFFFFF',
    textColor: '#6B7280',
    border: {
      width: 0,
      color: 'transparent',
      radius: 0,
    },
  },

  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 11,
    fontWeight: 500,
    lineHeight: 1.2,
  },

  icon: {
    name: 'clipboard-list',
    library: 'lucide',
    size: 24,
    color: '#6B7280',
    strokeWidth: 2,
  },

  isInteractive: true,
  interactions: [
    {
      gesture: 'tap',
      result: 'Switch to Board tab view',
      haptic: 'light',
      triggersElement: 'board-panel',
    },
  ],

  states: [
    {
      state: 'default',
      description: 'Inactive tab state',
      visualChanges: {
        textColor: '#6B7280',
        backgroundColor: '#FFFFFF',
      },
      iconChanges: {
        color: '#6B7280',
      },
    },
    {
      state: 'active',
      description: 'Active selected tab',
      visualChanges: {
        textColor: '#3B82F6',
        backgroundColor: '#FFFFFF',
        border: {
          width: 3,
          color: '#3B82F6',
          radius: 0,
        },
      },
      iconChanges: {
        color: '#3B82F6',
      },
    },
  ],

  visibilityCondition: 'Always visible',
  appearsIn: ['draft-room-main'],

  accessibility: {
    label: 'Board tab',
    role: 'tab',
    hint: 'View draft board and pick history',
    traits: ['tab'],
    tabIndex: -1,
  },

  stateTransitions: [
    {
      property: 'color',
      duration: 150,
      easing: 'ease-out',
    },
  ],

  codeReferences: [
    {
      platform: 'web',
      componentPath: 'components/DraftRoom/Footer/TabButton.tsx',
      lineStart: 1,
      lineEnd: 90,
    },
  ],

  screenshots: [],
  lastUpdated: now,
  updatedBy: defaultAuthor,
  version: '1.0',
  tags: ['draft-room', 'footer', 'tab', 'board'],
};

/**
 * DR-FT-006: Tab Button - Info
 * Fifth footer tab for league and draft information
 * Shows league settings, scoring, and draft details
 */
const drFt006TabInfo: GlossaryElement = {
  id: 'DR-FT-006',
  name: 'Tab Button - Info',
  description: 'Footer tab button to view league and draft information',
  module: 'draft-room',
  screen: 'draft-room-main',
  parent: 'FooterContainer',
  elementType: 'tab',

  position: { x: 'calc(80% + 0.8px)', y: 0 },
  dimensions: { width: 'calc(20% - 0.8px)', height: 56 },
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  zIndex: 100,

  style: {
    backgroundColor: '#FFFFFF',
    textColor: '#6B7280',
    border: {
      width: 0,
      color: 'transparent',
      radius: 0,
    },
  },

  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 11,
    fontWeight: 500,
    lineHeight: 1.2,
  },

  icon: {
    name: 'info',
    library: 'lucide',
    size: 24,
    color: '#6B7280',
    strokeWidth: 2,
  },

  isInteractive: true,
  interactions: [
    {
      gesture: 'tap',
      result: 'Switch to Info tab view',
      haptic: 'light',
      triggersElement: 'info-panel',
    },
  ],

  states: [
    {
      state: 'default',
      description: 'Inactive tab state',
      visualChanges: {
        textColor: '#6B7280',
        backgroundColor: '#FFFFFF',
      },
      iconChanges: {
        color: '#6B7280',
      },
    },
    {
      state: 'active',
      description: 'Active selected tab',
      visualChanges: {
        textColor: '#3B82F6',
        backgroundColor: '#FFFFFF',
        border: {
          width: 3,
          color: '#3B82F6',
          radius: 0,
        },
      },
      iconChanges: {
        color: '#3B82F6',
      },
    },
  ],

  visibilityCondition: 'Always visible',
  appearsIn: ['draft-room-main'],

  accessibility: {
    label: 'Info tab',
    role: 'tab',
    hint: 'View league and draft information',
    traits: ['tab'],
    tabIndex: -1,
  },

  stateTransitions: [
    {
      property: 'color',
      duration: 150,
      easing: 'ease-out',
    },
  ],

  codeReferences: [
    {
      platform: 'web',
      componentPath: 'components/DraftRoom/Footer/TabButton.tsx',
      lineStart: 1,
      lineEnd: 90,
    },
  ],

  screenshots: [],
  lastUpdated: now,
  updatedBy: defaultAuthor,
  version: '1.0',
  tags: ['draft-room', 'footer', 'tab', 'info'],
};

/**
 * DR-FT-007: Home Indicator Bar
 * iPhone notch/home indicator area at bottom
 * Inset area for system gestures on mobile
 */
const drFt007HomeIndicatorBar: GlossaryElement = {
  id: 'DR-FT-007',
  name: 'Home Indicator Bar',
  description: 'Safe area inset for iPhone home indicator at bottom of screen',
  module: 'draft-room',
  screen: 'draft-room-main',
  parent: 'FooterContainer',
  elementType: 'container',

  position: { x: 0, y: 'calc(100% - 34px)' },
  dimensions: { width: '100%', height: 34 },
  zIndex: 1000,

  style: {
    backgroundColor: '#FFFFFF',
  },

  isInteractive: false,

  states: [
    {
      state: 'default',
      description: 'Safe area for home indicator',
      visualChanges: {
        backgroundColor: '#FFFFFF',
      },
    },
  ],

  platformDifferences: [
    {
      aspect: 'height',
      web: 0,
      ios: 34,
      android: 0,
      notes: 'Only visible on iOS devices with notch/dynamic island',
    },
    {
      aspect: 'visibility',
      web: 'hidden',
      ios: 'visible',
      android: 'hidden',
      notes: 'iPhone specific safe area',
    },
  ],

  visibilityCondition: 'iOS only - system safe area',
  appearsIn: ['draft-room-main'],

  accessibility: {
    label: 'Safe area for home indicator',
    role: 'region',
    hint: 'Safe area for iOS home indicator gesture',
  },

  codeReferences: [
    {
      platform: 'ios',
      componentPath: 'DraftRoomViewController.swift',
      lineStart: 1,
      lineEnd: 40,
    },
  ],

  screenshots: [],
  lastUpdated: now,
  updatedBy: defaultAuthor,
  version: '1.0',
  tags: ['draft-room', 'footer', 'safe-area', 'ios'],
};

// ============================================================================
// Exports
// ============================================================================

// Base elements array (without platformDocs)
const baseElements: GlossaryElement[] = [
  // Status Bar Group A
  drSb001LeaveButton,
  drSb002TimerDisplay,
  drSb003TimerBackground,
  drSb004YourTurnIndicator,
  drSb005PreDraftCountdown,
  // Picks Bar Group B
  drPb001PicksBarContainer,
  drPb002PickSlot,
  drPb003PickAvatar,
  drPb004PickNumberBadge,
  drPb005CurrentPickIndicator,
  drPb006ScrollContainer,
  // Footer Group I
  drFt001FooterContainer,
  drFt002TabPlayers,
  drFt003TabQueue,
  drFt004TabRosters,
  drFt005TabBoard,
  drFt006TabInfo,
  drFt007HomeIndicatorBar,
];

// Attach platformDocs to each element
export const elements: GlossaryElement[] = baseElements.map((element) => ({
  ...element,
  platformDocs: platformDocsMap[element.id],
}));

export const screens: ScreenDefinition[] = [
  {
    id: 'draft-room-main',
    name: 'Main Draft Room',
    module: 'draft-room',
    description: 'Primary draft room interface with status bar, main content area, and footer navigation',
    layout: {
      statusBar: {
        x: 0,
        y: 0,
        width: '100%',
        height: 56,
      },
      content: {
        x: 0,
        y: 56,
        width: '100%',
        height: 'calc(100% - 112px)',
      },
      footer: {
        x: 0,
        y: 'calc(100% - 56px)',
        width: '100%',
        height: 56,
      },
    },
    elements: [
      'DR-SB-001',
      'DR-SB-002',
      'DR-SB-003',
      'DR-SB-004',
      'DR-SB-005',
      'DR-PB-001',
      'DR-PB-002',
      'DR-PB-003',
      'DR-PB-004',
      'DR-PB-005',
      'DR-PB-006',
      'DR-FT-001',
      'DR-FT-002',
      'DR-FT-003',
      'DR-FT-004',
      'DR-FT-005',
      'DR-FT-006',
      'DR-FT-007',
    ],
    entryPoints: ['DR-SB-001'],
  },
];
