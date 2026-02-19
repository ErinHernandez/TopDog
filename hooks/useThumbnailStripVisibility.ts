/**
 * useThumbnailStripVisibility — 3-state machine for thumbnail strip visibility
 *
 * States:
 *   HIDDEN      → strip is off-screen, only the invisible hover zone is active
 *   VISIBLE     → strip is slid in (scroll-triggered), auto-hides after 15s
 *   POPPED_OUT  → strip is slid in (hover-triggered), hides 10s after mouse-leave
 *
 * Transitions:
 *   HIDDEN ──(scroll past threshold)──▶ VISIBLE ──(15s no interaction)──▶ HIDDEN
 *   HIDDEN ──(hover zone 2s intent)───▶ POPPED_OUT ──(mouse leave + 10s)──▶ HIDDEN
 *   VISIBLE ──(mouse enters strip)────▶ POPPED_OUT
 */

import { useState, useRef, useCallback, useEffect } from 'react';

export type StripVisibility = 'hidden' | 'visible' | 'popped';

interface UseThumbnailStripVisibilityOptions {
  /** Scroll threshold in px before strip reveals (default: 200) */
  scrollThreshold?: number;
  /** How long the strip stays visible after scroll-reveal (default: 15000ms) */
  autoHideDelay?: number;
  /** How long user must hover the edge zone before strip pops out (default: 2000ms) */
  hoverIntentDelay?: number;
  /** How long strip stays after mouse leaves in popped state (default: 10000ms) */
  mouseLeaveDelay?: number;
  /** Scroll debounce interval (default: 300ms) */
  scrollDebounce?: number;
  /** The scrollable container ref — defaults to window */
  scrollContainerRef?: React.RefObject<HTMLElement>;
}

interface UseThumbnailStripVisibilityReturn {
  state: StripVisibility;
  /** Attach to the invisible hover zone's onMouseEnter */
  onHoverZoneEnter: () => void;
  /** Attach to the invisible hover zone's onMouseLeave */
  onHoverZoneLeave: () => void;
  /** Attach to the strip container's onMouseEnter */
  onStripMouseEnter: () => void;
  /** Attach to the strip container's onMouseLeave */
  onStripMouseLeave: () => void;
  /** Force-hide the strip (e.g., on Escape key) */
  forceHide: () => void;
  /** Force-show the strip (e.g., keyboard shortcut) */
  forceShow: () => void;
}

export function useThumbnailStripVisibility(
  options: UseThumbnailStripVisibilityOptions = {},
): UseThumbnailStripVisibilityReturn {
  const {
    scrollThreshold = 200,
    autoHideDelay = 15_000,
    hoverIntentDelay = 2_000,
    mouseLeaveDelay = 10_000,
    scrollDebounce = 300,
    scrollContainerRef,
  } = options;

  const [state, setState] = useState<StripVisibility>('hidden');

  // Timer refs — all cleared on unmount
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverIntentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mouseLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasScrollRevealedRef = useRef(false);

  // ─── Timer helpers ───────────────────────────────────────────────────

  const clearAllTimers = useCallback(() => {
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    if (hoverIntentTimerRef.current) clearTimeout(hoverIntentTimerRef.current);
    if (mouseLeaveTimerRef.current) clearTimeout(mouseLeaveTimerRef.current);
    if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
    autoHideTimerRef.current = null;
    hoverIntentTimerRef.current = null;
    mouseLeaveTimerRef.current = null;
    scrollDebounceRef.current = null;
  }, []);

  const clearAutoHide = useCallback(() => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  }, []);

  const clearHoverIntent = useCallback(() => {
    if (hoverIntentTimerRef.current) {
      clearTimeout(hoverIntentTimerRef.current);
      hoverIntentTimerRef.current = null;
    }
  }, []);

  const clearMouseLeave = useCallback(() => {
    if (mouseLeaveTimerRef.current) {
      clearTimeout(mouseLeaveTimerRef.current);
      mouseLeaveTimerRef.current = null;
    }
  }, []);

  // ─── Scroll-based reveal ─────────────────────────────────────────────

  useEffect(() => {
    const scrollTarget = scrollContainerRef?.current || window;

    const handleScroll = () => {
      if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);

      scrollDebounceRef.current = setTimeout(() => {
        const scrollY = scrollContainerRef?.current
          ? scrollContainerRef.current.scrollTop
          : window.scrollY;

        if (scrollY > scrollThreshold && !hasScrollRevealedRef.current) {
          hasScrollRevealedRef.current = true;

          setState((prev) => {
            // Don't override popped state with visible
            if (prev === 'popped') return prev;

            // Clear any existing timers
            clearAutoHide();

            // Start 15s auto-hide
            autoHideTimerRef.current = setTimeout(() => {
              setState((current) => {
                // Only auto-hide if still in 'visible' — not if user hovered → popped
                if (current === 'visible') return 'hidden';
                return current;
              });
              hasScrollRevealedRef.current = false;
            }, autoHideDelay);

            return 'visible';
          });
        }

        // Reset scroll-reveal flag when user scrolls back up
        if (scrollY <= scrollThreshold / 2) {
          hasScrollRevealedRef.current = false;
        }
      }, scrollDebounce);
    };

    scrollTarget.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollTarget.removeEventListener('scroll', handleScroll);
  }, [scrollThreshold, autoHideDelay, scrollDebounce, scrollContainerRef, clearAutoHide]);

  // ─── Hover zone handlers ─────────────────────────────────────────────

  /** Mouse enters the invisible 12px hover zone on the left edge */
  const onHoverZoneEnter = useCallback(() => {
    // Only trigger from hidden state
    setState((prev) => {
      if (prev !== 'hidden') return prev;

      // Start 2s hover intent timer
      clearHoverIntent();
      hoverIntentTimerRef.current = setTimeout(() => {
        setState('popped');
      }, hoverIntentDelay);

      return prev; // stay hidden until 2s elapses
    });
  }, [hoverIntentDelay, clearHoverIntent]);

  /** Mouse leaves the hover zone before 2s — cancel intent */
  const onHoverZoneLeave = useCallback(() => {
    clearHoverIntent();
  }, [clearHoverIntent]);

  // ─── Strip container handlers ────────────────────────────────────────

  /** Mouse enters the actual strip container */
  const onStripMouseEnter = useCallback(() => {
    // Cancel any pending auto-hide or mouse-leave timers
    clearAutoHide();
    clearMouseLeave();

    // Promote to popped state
    setState((prev) => {
      if (prev === 'visible' || prev === 'popped') return 'popped';
      return prev;
    });
  }, [clearAutoHide, clearMouseLeave]);

  /** Mouse leaves the strip container — start 10s countdown */
  const onStripMouseLeave = useCallback(() => {
    clearMouseLeave();

    mouseLeaveTimerRef.current = setTimeout(() => {
      setState('hidden');
      hasScrollRevealedRef.current = false;
    }, mouseLeaveDelay);
  }, [mouseLeaveDelay, clearMouseLeave]);

  // ─── Force controls ──────────────────────────────────────────────────

  const forceHide = useCallback(() => {
    clearAllTimers();
    setState('hidden');
    hasScrollRevealedRef.current = false;
  }, [clearAllTimers]);

  const forceShow = useCallback(() => {
    clearAllTimers();
    setState('popped');
  }, [clearAllTimers]);

  // ─── Keyboard: Escape to hide ────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        forceHide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [forceHide]);

  // ─── Cleanup ─────────────────────────────────────────────────────────

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  return {
    state,
    onHoverZoneEnter,
    onHoverZoneLeave,
    onStripMouseEnter,
    onStripMouseLeave,
    forceHide,
    forceShow,
  };
}
