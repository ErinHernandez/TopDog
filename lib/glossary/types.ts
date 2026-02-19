/**
 * TopDog Master Glossary - TypeScript Types
 *
 * Comprehensive type definitions for the glossary system that documents
 * every UI element across the entire TopDog application.
 */

// ============================================================================
// Core Types
// ============================================================================

export type ModuleId =
  | 'draft-room'
  | 'lobby'
  | 'my-teams'
  | 'live-slow-drafts'
  | 'auth'
  | 'settings'
  | 'payments'
  | 'onboarding'
  | 'navigation-shell';

export type ElementType =
  | 'button'
  | 'input'
  | 'text'
  | 'icon'
  | 'container'
  | 'card'
  | 'list'
  | 'modal'
  | 'tab'
  | 'badge'
  | 'toggle'
  | 'slider'
  | 'dropdown'
  | 'image'
  | 'indicator'
  | 'divider'
  | 'scroll-container';

export type ElementState =
  | 'default'
  | 'hover'
  | 'pressed'
  | 'active'
  | 'disabled'
  | 'loading'
  | 'error'
  | 'success'
  | 'focused'
  | 'empty'
  | 'filled'
  | 'current'
  | 'selected'
  | 'scrolling'
  | 'user-turn'
  | 'user-pick'
  | 'user-current' // Combined state when user is on the clock
  | 'auto-scroll'
  | 'loaded'
  // Timer/urgency states
  | 'warning' // Timer warning state (e.g., under 30s)
  | 'critical' // Timer critical state (e.g., under 10s)
  | 'urgent' // Highest urgency state
  | 'expiring' // About to expire
  | 'paused' // Timer paused
  // Layout states
  | 'compact' // Reduced size (e.g., keyboard open)
  | 'expanded' // Expanded size
  | 'hidden'; // Hidden/not visible

export type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST';

export type Platform = 'web' | 'ios' | 'ipad' | 'android';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3' | 'High' | 'Medium' | 'Low';

// ============================================================================
// Dimension & Position Types
// ============================================================================

export interface Dimensions {
  width: number | string;
  height: number | string;
}

export interface Position2D {
  x: number | string;
  y: number | string;
}

export interface Spacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Bounds {
  x?: number | string;
  y?: number | string;
  width: number | string;
  height: number | string;
}

// ============================================================================
// Typography Types
// ============================================================================

export interface Typography {
  fontFamily: string;
  fontSize: number;
  fontWeight: number | string;
  lineHeight: number | string;
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
}

// ============================================================================
// Visual Style Types
// ============================================================================

export interface BorderStyle {
  width: number;
  color: string;
  style?: 'solid' | 'dashed' | 'dotted' | 'none';
  radius?: number | string; // Made optional - not all borders need radius
  position?: 'top' | 'right' | 'bottom' | 'left' | 'all'; // Which side(s) to apply border
}

export interface ShadowStyle {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
}

export interface GradientStop {
  color: string;
  position: number; // 0-100
}

export interface GradientStyle {
  type: 'linear' | 'radial';
  angle?: number;
  stops: GradientStop[];
}

export interface VisualStyle {
  backgroundColor?: string;
  backgroundGradient?: GradientStyle;
  textColor?: string;
  border?: BorderStyle;
  shadow?: ShadowStyle;
  opacity?: number;
  transform?: string; // CSS transform value (e.g., 'scale(1.08)', 'rotate(45deg)')
  // Typography overrides for state changes
  fontWeight?: number | string;
  fontSize?: number;
  // Layout properties
  display?: string; // CSS display value (e.g., 'none', 'flex')
  height?: number | string; // Height override
  width?: number | string; // Width override
  // Filter effects
  filter?: string; // CSS filter (e.g., 'blur(4px)', 'grayscale(1)')
  // Pointer behavior
  pointerEvents?: string; // CSS pointer-events (e.g., 'none', 'auto')
}

// ============================================================================
// Icon Types
// ============================================================================

export interface IconSpec {
  name: string;
  library?: 'lucide' | 'heroicons' | 'sf-symbols' | 'custom';
  size: number;
  color: string;
  strokeWidth?: number;
  description?: string; // Human-readable description of the icon's purpose
}

// ============================================================================
// Animation Types
// ============================================================================

export interface AnimationSpec {
  name?: string; // Animation name identifier
  type?: string; // Animation type shorthand (e.g., 'fade', 'scale', 'slide', 'pulse')
  property?: string;
  from?: string | number;
  to?: string | number;
  duration?: number; // ms (optional when type is specified)
  easing?: string; // easing function (optional when type is specified)
  timingFunction?: string; // CSS timing function (alias for easing)
  delay?: number;
  iterationCount?: number | 'infinite'; // For repeating animations
  direction?: string; // Animation direction (e.g., 'normal', 'reverse', 'from-left', 'from-right')
  description?: string; // Human-readable description of the animation
}

export interface TransitionSpec {
  property: string;
  duration: number;
  easing: string;
  description?: string; // Description of what this transition does
}

// ============================================================================
// Accessibility Types
// ============================================================================

export interface AccessibilitySpec {
  label: string;
  role: string;
  hint?: string;
  traits?: string[];
  tabIndex?: number;
  keyboardShortcut?: string;
  ariaLive?: 'off' | 'polite' | 'assertive';
  ariaAtomic?: boolean;
  ariaRelevant?: string;
  announceStateChange?: boolean; // VoiceOver/TalkBack announces state changes
  announcements?: Record<string, string>; // State-specific screen reader announcements
  // Additional accessibility properties
  altText?: string; // Alternative text for images
  ariaLabel?: string; // Explicit aria-label (alias for label in some contexts)
  focusIndicator?: string; // Description of focus indicator style
  ariaDescription?: string; // Explicit aria-description
  fallbackText?: string; // Text to show as fallback
}

// ============================================================================
// Interaction Types
// ============================================================================

export type GestureType =
  | 'tap'
  | 'double-tap'
  | 'long-press'
  | 'swipe'
  | 'drag'
  | 'pinch'
  | 'pan';

export type HapticType =
  | 'none'
  | 'light'
  | 'medium'
  | 'heavy'
  | 'selection'
  | 'success'
  | 'warning'
  | 'error';

export interface InteractionSpec {
  gesture: GestureType;
  result: string;
  animation?: AnimationSpec;
  sound?: string;
  haptic?: HapticType;
  triggersElement?: string; // Element ID that gets triggered
  // Analytics tracking
  analytics?: string | {
    event?: string;
    properties?: Record<string, unknown>;
  };
  // Timing
  duration?: number; // Duration of the interaction in ms
}

// ============================================================================
// State Types
// ============================================================================

// Platform-specific haptic specification
export interface PlatformHaptic {
  web?: string;
  ios?: string;
  android?: string;
  ipad?: string;
}

export interface ElementStateSpec {
  state?: ElementState;
  name?: string; // Alternative to state for custom state names
  description: string;
  style?: Partial<VisualStyle>; // Alternative to visualChanges
  visualChanges?: Partial<VisualStyle>;
  iconChanges?: Partial<IconSpec>;
  textChanges?: string;
  screenshotPath?: string;
  animation?: AnimationSpec | AnimationSpec[]; // State-specific animation(s)
  audio?: AudioSpec; // State-specific sound effect
  haptic?: HapticType | PlatformHaptic; // State-specific haptic feedback (simple or per-platform)
  // Fallback handling
  fallbackContent?: string | Record<string, unknown>; // Content to show if primary content unavailable
  fallbackBehavior?: string; // Behavior description for fallback scenarios
  // Conditional state triggers
  conditions?: string | string[]; // Conditions that trigger this state
  // Additional state properties
  imageSource?: string; // Image source for this state
  indicator?: string | Record<string, unknown>; // Indicator configuration
  tabHeight?: number | string; // Tab height for layout states
  iconSize?: number; // Icon size override for this state
  fontSize?: number | string; // Font size override for this state
}

// Audio specification for sound effects
export interface AudioSpec {
  sound?: string; // Sound file name or identifier
  filename?: string; // Alias for sound
  volume?: number; // 0-1
  loop?: boolean;
  enabled?: boolean; // Whether audio is enabled for this state
  trigger?: 'enter' | 'exit' | 'continuous' | 'continuous-loop' | 'on-appearance' | 'on-transition'; // When the sound plays
  duration?: number; // Duration in ms
  repeatInterval?: number | string; // Interval between repeats in ms or 'none'
  platform?: Platform[]; // Which platforms support this audio
}

// Sound asset specification
export interface SoundAsset {
  state: ElementState | string;
  filename: string;
  duration: number;
  frequency?: string;
  playTrigger?: string;
  repeatInterval?: string | number;
  platform?: Platform[];
  notes?: string;
  description?: string;
}

// Full sound specification for an element
export interface SoundSpecification {
  enabled: boolean;
  defaultVolume: number;
  soundAssets: SoundAsset[];
  platformSupport?: Record<Platform, boolean>;
  notes?: string;
  accessibilityNote?: string;
}

// ============================================================================
// Code Reference Types
// ============================================================================

export interface CodeReference {
  platform: Platform;
  componentPath?: string; // Made optional - can use filePath instead
  lineStart: number;
  lineEnd: number;
  cssPath?: string;
  cssLineStart?: number;
  cssLineEnd?: number;
  description?: string; // Brief description of what this code reference contains
  // Additional code reference details
  filePath?: string; // Alternative file path (alias for componentPath)
  keyFunctions?: string[]; // Key functions in this file
  keyClasses?: string[]; // Key classes in this file
  keyMethods?: string[]; // Key methods in this file
}

// ============================================================================
// URL Slug Helper
// ============================================================================

/**
 * Generates a URL-friendly slug from element name
 * e.g., "Leave Button" -> "leave-button"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generates the URL path for a glossary element
 * e.g., element with name "Leave Button" -> "/glossary/leave-button"
 */
export function getElementUrl(element: { name: string }): string {
  return `/glossary/${generateSlug(element.name)}`;
}

/**
 * Finds an element by its slug
 * Used for dynamic routing with slug-based URLs
 */
export function findElementBySlug(
  elements: GlossaryElement[],
  slug: string
): GlossaryElement | undefined {
  return elements.find((el) => generateSlug(el.name) === slug);
}

/**
 * Gets the slug for an element ID (for related elements links)
 * Requires access to the elements array
 */
export function getSlugById(
  elements: GlossaryElement[],
  id: string
): string | undefined {
  const element = elements.find((el) => el.id === id);
  return element ? generateSlug(element.name) : undefined;
}

// ============================================================================
// Platform Difference Types
// ============================================================================

export interface PlatformDifference {
  aspect: string;
  web: string | number;
  ios: string | number;
  android?: string | number;
  notes?: string;
}

// Platform-keyed object format for detailed platform differences
export interface PlatformDifferencesByPlatform {
  web?: Record<string, unknown>;
  ios?: Record<string, unknown>;
  android?: Record<string, unknown>;
  ipad?: Record<string, unknown>;
}

// Union type to support both array and object formats
export type PlatformDifferencesType = PlatformDifference[] | PlatformDifferencesByPlatform;

// ============================================================================
// Per-Platform Complete Documentation
// ============================================================================

/**
 * Complete documentation for ONE platform (web, ios, ipad, or android).
 * Each platform gets its own independent, complete set of:
 * - Code architecture & structure
 * - Visual specifications
 * - Best practices (do's and don'ts)
 * - Improvement suggestions
 *
 * This ensures adding a new platform means adding a complete new doc set.
 */
export interface PlatformDocumentation {
  platform: Platform;

  // ---- ARCHITECTURE: Where this element lives in the codebase ----
  architecture: {
    summary: string; // Plain English: "The Leave Button is a SwiftUI View..."
    componentPath: string; // Primary file: "TopDog/DraftRoom/Views/LeaveButton.swift"
    componentTree: string; // ASCII hierarchy showing parent → this → children
    parentComponent: string; // "StatusBarView"
    childComponents?: string[]; // ["IconView", "RippleEffect"]
    dataFlow: string; // "Receives isEnabled from DraftRoomViewModel via @ObservedObject"
    stateManagement: string; // "Uses @State for press animation, @Binding for disabled state"
    dependencies: string[]; // ["SwiftUI", "Combine", "HapticManager"]
    relatedFiles?: string[]; // Other files involved (styles, tests, etc.)
    layerDiagram?: string; // ASCII showing View → ViewModel → Repository layers
  };

  // ---- VISUALS: Platform-specific visual specs ----
  visuals: {
    dimensions: string; // "44×44pt" (iOS), "48dp" (Android), "44px" (Web)
    touchTarget: string; // "48×48pt minimum for iOS HIG compliance"
    spacing: string; // "8pt margin from safe area edge"
    colors: Record<string, string>; // { background: "systemBackground", icon: "label" }
    typography?: string; // Font specs if text is involved
    cornerRadius?: string; // "22pt (circular)"
    shadows?: string; // Shadow specs
    assets: string[]; // ["xmark.circle (SF Symbol)", "close_icon.png"]
    animations?: string; // "0.15s ease-out scale transform on press"
  };

  // ---- BEST PRACTICES: Do's and Don'ts for this platform ----
  bestPractices: {
    summary: string; // 2-3 sentence overview of how to build this right
    doList: string[]; // ["DO: Use SF Symbols for consistent iOS look"]
    dontList: string[]; // ["DON'T: Hardcode colors - use semantic tokens"]
    performanceTips: string[]; // ["Avoid re-renders by using @ObservedObject sparingly"]
    accessibilityRequirements: string[]; // ["Must have accessibilityLabel", "Support VoiceOver"]
    codeExample?: string; // Short ideal implementation snippet
    designSystemRefs: string[]; // ["Apple HIG: Buttons", "TopDog Design System: Actions"]
    officialDocs: string[]; // ["https://developer.apple.com/design/human-interface-guidelines/buttons"]
  };

  // ---- IMPROVEMENTS: Platform-specific suggestions ----
  improvements: PlatformImprovement[];
}

export interface PlatformImprovement {
  id: string; // "IMP-IOS-DR-SB-001-1"
  category: 'architecture' | 'performance' | 'accessibility' | 'ux' | 'maintainability' | 'testing' | 'security';
  title: string; // "Add haptic feedback variation based on context"
  summary: string; // Plain English explanation
  currentState: string; // How it works NOW on this platform
  proposedChange: string; // What SHOULD change
  impact: 'high' | 'medium' | 'low';
  effort: 'trivial' | 'small' | 'medium' | 'large' | 'epic';
  rationale: string; // Why this matters for THIS platform specifically
  blockers?: string[]; // Platform-specific blockers
  relatedElements?: string[]; // Other elements affected
}

/**
 * Container for all platform documentation for ONE element.
 * Each platform is optional - element may not exist on all platforms.
 */
export interface AllPlatformDocs {
  web?: PlatformDocumentation;
  ios?: PlatformDocumentation;
  ipad?: PlatformDocumentation;
  android?: PlatformDocumentation;

  // Cross-platform notes
  crossPlatform?: {
    sharedBehavior: string; // What's identical across all platforms
    keyDivergences: string[]; // Important differences to know
    featureParity: Record<string, boolean>; // { "haptics": true, "3dTouch": false }
    syncConsiderations?: string; // Real-time state sync notes
  };
}

// ============================================================================
// Tech Debt Types
// ============================================================================

export type TechDebtSeverity = 'critical' | 'high' | 'medium' | 'low';
export type TechDebtCategory = 'bug' | 'performance' | 'consistency' | 'accessibility' | 'code-quality' | 'ux' | 'security';

export interface TechDebtItem {
  id?: string; // Made optional - some items use 'item' as alternative
  description?: string; // Made optional - some items use 'item' as alternative
  priority: Priority;
  severity?: TechDebtSeverity;
  category?: TechDebtCategory;
  suggestedFix?: string; // Alias for remediation
  remediation?: string;
  effort?: 'low' | 'medium' | 'high';
  estimatedEffort?: string; // e.g., "30m", "2h", "1d"
  estimatedImpact?: string; // Description of expected impact when fixed
  // Platform and compliance
  affectedPlatforms?: Platform[]; // Platforms affected by this tech debt
  wcagCriteria?: string | string[]; // WCAG criteria affected (e.g., ['2.1.1', '4.1.2'])
  // Additional properties
  item?: string; // Alternative description field
  testingRequirements?: string; // Testing requirements for the fix
  impact?: string; // Impact description of the tech debt
  suggestedApproach?: string; // Suggested approach for fixing this tech debt
}

// ============================================================================
// Wireframe Context Types
// ============================================================================

export interface WireframeContext {
  screenId?: string; // Made optional for simpler wireframes
  highlightBounds?: Bounds;
  boundingBox?: Bounds; // Alias for highlightBounds
  siblingElements?: string[]; // Element IDs to show as wireframes
  highlightColor?: string; // Color for the highlight box
  annotationPosition?: 'top' | 'right' | 'bottom' | 'left' | 'below' | 'above';
  notes?: string; // Additional positioning notes
  contextDescription?: string; // Description of context in the wireframe
  containerDimensions?: Bounds; // Dimensions of the parent container
  // Additional wireframe properties
  description?: string; // Alternative to contextDescription
  containerRadius?: number; // Border radius of the container
  safeAreaContext?: string | Record<string, unknown>; // Safe area information
  tabLayout?: string | Record<string, unknown>; // Tab layout information
}

// ============================================================================
// Screenshot Types
// ============================================================================

export interface Screenshot {
  state: ElementState;
  platform: Platform;
  path: string;
  width: number;
  height: number;
  isHero?: boolean; // Primary screenshot for this element (displayed prominently at top)
  alt?: string; // Alt text for accessibility
  caption?: string; // Optional caption describing what's shown
  context?: 'isolated' | 'in-situ'; // isolated = cropped element only, in-situ = element in context
}

// ============================================================================
// Main Element Type
// ============================================================================

export interface GlossaryElement {
  // Identification
  id: string; // e.g., 'DR-SB-001'
  name: string;
  description: string;
  extendedDescription?: string; // Longer, more detailed description for documentation

  // Classification
  module: string;
  screen: string | string[];
  parent: string; // Parent element ID or container name
  elementType: ElementType;

  // Position & Size
  position: Position2D;
  dimensions: Dimensions;
  padding?: Spacing;
  margin?: Spacing;
  zIndex?: number;

  // Visual Style
  style: VisualStyle;
  typography?: Typography;
  icon?: IconSpec;

  // Interaction
  isInteractive: boolean;
  interactions?: InteractionSpec[];

  // States
  states: ElementStateSpec[];

  // Visibility
  visibilityCondition?: string;
  appearsIn: string[]; // List of screens/states where visible

  // Accessibility
  accessibility?: AccessibilitySpec;

  // Animation
  entryAnimation?: AnimationSpec | AnimationSpec[];
  exitAnimation?: AnimationSpec | AnimationSpec[];
  stateTransitions?: TransitionSpec[];

  // Related Elements
  triggers?: string[]; // Element IDs this opens/activates
  triggeredBy?: string[]; // Element IDs that open/activate this
  siblings?: string[]; // Other elements at same level
  children?: string[]; // Elements contained within this

  // Code References
  codeReferences: CodeReference[];

  // Platform Differences
  platformDifferences?: PlatformDifferencesType;
  platformVariations?: PlatformDifferencesType; // Alias for platformDifferences

  // Tech Debt
  techDebt?: TechDebtItem[];

  // Screenshots
  screenshots: Screenshot[];

  // Wireframe Context
  wireframeContext?: WireframeContext;

  // Sound Specification
  soundSpecification?: SoundSpecification;

  // Image Loading Specification
  imageLoadingSpecification?: {
    strategy?: 'eager' | 'lazy' | 'progressive';
    placeholder?: string;
    fallback?: string;
    caching?: Record<string, unknown>;
    lazyLoading?: boolean | Record<string, unknown>;
    blurUpPlaceholder?: boolean | Record<string, unknown>;
    formatNegotiation?: Record<string, unknown>;
    cachingStrategy?: Record<string, unknown>;
  };

  // Role (ARIA role override)
  role?: string;

  // Hidden During (screens/states when element is hidden)
  hiddenDuring?: string[];

  // Usage Frequency (how often element is interacted with)
  usageFrequency?: 'high' | 'medium' | 'low' | string | {
    instance?: string;
    criticalityToPerformance?: string;
    estimatedBundleImpact?: string;
  };

  // ========================================================================
  // COMPLETE PER-PLATFORM DOCUMENTATION
  // Each OS (web, ios, ipad, android) gets its own full documentation set:
  // - Architecture (code structure, data flow, dependencies)
  // - Visuals (dimensions, colors, assets in platform units)
  // - Best Practices (do's, don'ts, performance, accessibility)
  // - Improvements (platform-specific suggestions)
  // ========================================================================
  platformDocs?: AllPlatformDocs;

  // Metadata
  lastUpdated: string; // ISO date
  updatedBy: string;
  version?: string;
  tags?: string[];
}

// ============================================================================
// Screen Definition Types
// ============================================================================

export interface ScreenLayout {
  [region: string]: {
    x: number | string;
    y: number | string;
    width: number | string;
    height: number | string;
  };
}

export interface ScreenDefinition {
  id: string;
  name: string;
  module: string;
  layout: ScreenLayout;
  elements: string[]; // Element IDs on this screen
  description?: string;
  entryPoints?: string[];
  exitPoints?: string[];
}

// ============================================================================
// Module Definition Types
// ============================================================================

export interface ModuleDefinition {
  id: ModuleId;
  name: string;
  description: string;
  elementCount: number;
  complexity: 'low' | 'medium' | 'high';
  status: 'current' | 'pending' | 'complete';
  screens: ScreenDefinition[];
  elements: GlossaryElement[];
}

// ============================================================================
// Action Catalog Types
// ============================================================================

export interface UserAction {
  id: string;
  name: string;
  element: string; // Element ID
  gesture: GestureType;
  precondition?: string;
  result: string;
  animation?: string;
  sound?: string;
  haptic?: HapticType;
}

// ============================================================================
// Search & Filter Types
// ============================================================================

export interface GlossaryFilters {
  module?: ModuleId;
  screen?: string;
  elementType?: ElementType;
  isInteractive?: boolean;
  hasTechDebt?: boolean;
  tags?: string[];
}

export interface SearchResult {
  element: GlossaryElement;
  score: number;
  matchedFields: string[];
}

// ============================================================================
// Export Types
// ============================================================================

export interface GlossaryExport {
  version: string;
  exportDate: string;
  modules: ModuleDefinition[];
  screens: ScreenDefinition[];
  elements: GlossaryElement[];
  actions: UserAction[];
}

// ============================================================================
// Constants
// ============================================================================

export const MODULE_NAMES: Record<string, string> = {
  'draft-room': 'Draft Room',
  'lobby': 'Lobby/Home',
  'my-teams': 'My Teams',
  'live-slow-drafts': 'Live/Slow Drafts',
  'auth': 'Authentication',
  'settings': 'Settings/Profile',
  'payments': 'Payments',
  'onboarding': 'Onboarding',
  'navigation-shell': 'Navigation Shell',
};

export const ELEMENT_TYPE_LABELS: Record<ElementType, string> = {
  button: 'Button',
  input: 'Input Field',
  text: 'Text',
  icon: 'Icon',
  container: 'Container',
  card: 'Card',
  list: 'List',
  modal: 'Modal',
  tab: 'Tab',
  badge: 'Badge',
  toggle: 'Toggle',
  slider: 'Slider',
  dropdown: 'Dropdown',
  image: 'Image',
  indicator: 'Indicator',
  divider: 'Divider',
  'scroll-container': 'Scroll Container',
};

export const POSITION_COLORS: Record<Position, string> = {
  QB: '#FF4444',
  RB: '#44AA44',
  WR: '#4488FF',
  TE: '#FF8844',
  K: '#AA44AA',
  DST: '#888888',
};
