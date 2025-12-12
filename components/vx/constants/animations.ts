/**
 * VX Animation Constants
 * 
 * Consistent animation timings and easing functions.
 * Provides both CSS values and Framer Motion variants.
 */

// ============================================================================
// DURATION
// ============================================================================

export const DURATION = {
  /** Ultra fast - micro interactions (50ms) */
  instant: '50ms',
  /** Fast - button press, toggle (150ms) */
  fast: '150ms',
  /** Normal - most transitions (200ms) */
  normal: '200ms',
  /** Medium - modal open, panel slide (300ms) */
  medium: '300ms',
  /** Slow - page transitions (400ms) */
  slow: '400ms',
  /** Extra slow - complex animations (500ms) */
  extraSlow: '500ms',
} as const;

// Numeric values for JS animations
export const DURATION_MS = {
  instant: 50,
  fast: 150,
  normal: 200,
  medium: 300,
  slow: 400,
  extraSlow: 500,
} as const;

// ============================================================================
// EASING
// ============================================================================

export const EASING = {
  /** Standard ease - general purpose */
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Ease in - accelerating from zero */
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  /** Ease out - decelerating to zero */
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  /** Ease in-out - accelerate then decelerate */
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Spring - bouncy feel */
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  /** Sharp - quick snap */
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  /** Linear - constant speed */
  linear: 'linear',
} as const;

// ============================================================================
// TRANSITION PRESETS
// ============================================================================

export const TRANSITION = {
  /** Default transition for most elements */
  default: `all ${DURATION.normal} ${EASING.default}`,
  /** Fast transition for interactive elements */
  fast: `all ${DURATION.fast} ${EASING.default}`,
  /** Slow transition for background elements */
  slow: `all ${DURATION.slow} ${EASING.easeOut}`,
  /** Color only transition */
  colors: `background-color ${DURATION.normal} ${EASING.default}, border-color ${DURATION.normal} ${EASING.default}, color ${DURATION.normal} ${EASING.default}`,
  /** Opacity transition */
  opacity: `opacity ${DURATION.normal} ${EASING.default}`,
  /** Transform transition */
  transform: `transform ${DURATION.normal} ${EASING.default}`,
  /** Modal/overlay transition */
  modal: `all ${DURATION.medium} ${EASING.easeOut}`,
  /** Spring transition for playful interactions */
  spring: `all ${DURATION.medium} ${EASING.spring}`,
} as const;

// ============================================================================
// KEYFRAME ANIMATIONS (CSS)
// ============================================================================

export const KEYFRAMES = {
  /** Fade in from transparent */
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,
  /** Fade out to transparent */
  fadeOut: `
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `,
  /** Slide up from bottom */
  slideUp: `
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
  `,
  /** Slide down from top */
  slideDown: `
    @keyframes slideDown {
      from { transform: translateY(-100%); }
      to { transform: translateY(0); }
    }
  `,
  /** Scale in from small */
  scaleIn: `
    @keyframes scaleIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `,
  /** Pulse animation */
  pulse: `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `,
  /** Spin animation */
  spin: `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `,
  /** Bounce animation */
  bounce: `
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
  `,
} as const;

// ============================================================================
// ANIMATION CLASSES (for Tailwind-like usage)
// ============================================================================

export const ANIMATION_CLASSES = {
  fadeIn: 'animate-[fadeIn_200ms_ease-out]',
  fadeOut: 'animate-[fadeOut_200ms_ease-out]',
  slideUp: 'animate-[slideUp_300ms_ease-out]',
  slideDown: 'animate-[slideDown_300ms_ease-out]',
  scaleIn: 'animate-[scaleIn_200ms_ease-out]',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce',
} as const;

// ============================================================================
// REDUCED MOTION
// ============================================================================

/**
 * Check if user prefers reduced motion
 * Use this to disable animations for accessibility
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get duration based on reduced motion preference
 */
export function getAnimationDuration(duration: keyof typeof DURATION_MS): number {
  return prefersReducedMotion() ? 0 : DURATION_MS[duration];
}

