/**
 * VX Auto Scroll Hook
 * 
 * Handles automatic scrolling to elements, commonly used for:
 * - Scrolling to current pick in draft board
 * - Scrolling to selected player in list
 * - Smooth scroll to top/bottom
 */

import { useRef, useCallback, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface UseAutoScrollOptions {
  /** Scroll behavior */
  behavior?: ScrollBehavior;
  /** Block alignment (vertical) */
  block?: ScrollLogicalPosition;
  /** Inline alignment (horizontal) */
  inline?: ScrollLogicalPosition;
  /** Offset from top in pixels */
  offsetTop?: number;
  /** Delay before scrolling (ms) */
  delay?: number;
}

export interface UseAutoScrollReturn<T extends HTMLElement> {
  /** Ref to attach to scrollable container */
  containerRef: React.RefObject<T | null>;
  /** Scroll to a specific element by selector or ref */
  scrollTo: (target: string | HTMLElement | null) => void;
  /** Scroll to top of container */
  scrollToTop: () => void;
  /** Scroll to bottom of container */
  scrollToBottom: () => void;
  /** Scroll by specific amount */
  scrollBy: (x: number, y: number) => void;
}

// ============================================================================
// HOOK
// ============================================================================

export default function useAutoScroll<T extends HTMLElement = HTMLDivElement>(
  options: UseAutoScrollOptions = {}
): UseAutoScrollReturn<T> {
  const {
    behavior = 'smooth',
    block = 'center',
    inline = 'center',
    offsetTop = 0,
    delay = 0,
  } = options;

  const containerRef = useRef<T>(null);

  const scrollTo = useCallback((target: string | HTMLElement | null) => {
    if (!target) return;

    const execute = () => {
      let element: HTMLElement | null = null;

      if (typeof target === 'string') {
        // Find by selector within container
        element = containerRef.current?.querySelector(target) as HTMLElement | null;
      } else {
        element = target;
      }

      if (element) {
        element.scrollIntoView({
          behavior,
          block,
          inline,
        });

        // Apply offset if needed
        if (offsetTop && containerRef.current) {
          containerRef.current.scrollTop -= offsetTop;
        }
      }
    };

    if (delay > 0) {
      setTimeout(execute, delay);
    } else {
      execute();
    }
  }, [behavior, block, inline, offsetTop, delay]);

  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior,
      });
    }
  }, [behavior]);

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior,
      });
    }
  }, [behavior]);

  const scrollBy = useCallback((x: number, y: number) => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        left: x,
        top: y,
        behavior,
      });
    }
  }, [behavior]);

  return {
    containerRef,
    scrollTo,
    scrollToTop,
    scrollToBottom,
    scrollBy,
  };
}

// ============================================================================
// SCROLL TO CURRENT PICK HOOK
// ============================================================================

export interface UseScrollToPickOptions {
  /** Current pick number */
  currentPick: number;
  /** Whether draft is active */
  isActive: boolean;
  /** Scroll behavior */
  behavior?: ScrollBehavior;
}

export function useScrollToPick<T extends HTMLElement = HTMLDivElement>({
  currentPick,
  isActive,
  behavior = 'smooth',
}: UseScrollToPickOptions): React.RefObject<T | null> {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (isActive && containerRef.current) {
      const pickElement = containerRef.current.querySelector(
        `[data-pick-number="${currentPick}"]`
      );
      
      if (pickElement) {
        pickElement.scrollIntoView({
          behavior,
          block: 'center',
          inline: 'center',
        });
      }
    }
  }, [currentPick, isActive, behavior]);

  return containerRef;
}

// ============================================================================
// HORIZONTAL SCROLL HOOK (for picks bar)
// ============================================================================

export interface UseHorizontalScrollReturn {
  /** Container ref */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Scroll left by one item */
  scrollLeft: () => void;
  /** Scroll right by one item */
  scrollRight: () => void;
  /** Whether can scroll left */
  canScrollLeft: boolean;
  /** Whether can scroll right */
  canScrollRight: boolean;
}

export function useHorizontalScroll(itemWidth: number = 110): UseHorizontalScrollReturn {
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        left: -itemWidth,
        behavior: 'smooth',
      });
    }
  }, [itemWidth]);

  const scrollRight = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        left: itemWidth,
        behavior: 'smooth',
      });
    }
  }, [itemWidth]);

  // Note: canScrollLeft/Right would need scroll position tracking
  // Simplified for now
  return {
    containerRef,
    scrollLeft,
    scrollRight,
    canScrollLeft: true,
    canScrollRight: true,
  };
}

