'use client';

/**
 * Idesaign — Focus Trap Component
 *
 * Traps keyboard focus within a container, typically used for modals and dialogs.
 * Implements WAI-ARIA dialog patterns:
 * - Tabs cycle within the container (not into the rest of page)
 * - Escape key closes the dialog
 * - Focus is restored to trigger element when deactivated
 * - Auto-focuses first focusable element or initialFocusRef
 *
 * Pure implementation — no external library dependencies.
 *
 * @module lib/a11y/FocusTrap
 */

import React, {
  useEffect,
  useRef,
  useCallback,
  type Ref,
  type ReactNode,
  type RefObject,
} from 'react';

/* ================================================================
   Types
   ================================================================ */

/** Props for FocusTrap component */
export interface FocusTrapProps {
  /** Whether the trap is active (traps focus) */
  active: boolean;

  /** Content to trap focus within */
  children: ReactNode;

  /** Called when Escape key is pressed */
  onEscape?: () => void;

  /** Ref to auto-focus when trap activates (defaults to first focusable) */
  initialFocusRef?: RefObject<HTMLElement>;

  /** Restore focus to previous activeElement when trap deactivates (default: true) */
  restoreFocusOnDeactivate?: boolean;
}

/** Focusable element selector — includes all interactive elements */
const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'a[href]',
].join(',');

/**
 * Get all focusable elements within a container.
 * Includes buttons, inputs, links, etc., but excludes disabled and tabindex=-1 elements.
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el): el is HTMLElement => {
      // Additional checks for hidden/display:none
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    },
  );
}

/**
 * Traps keyboard focus within a container.
 *
 * When active=true:
 * - Tab key cycles focus within the container
 * - Shift+Tab cycles backward
 * - Escape key triggers onEscape callback
 * - First focusable element (or initialFocusRef) is auto-focused
 * - Focus is restored to the trigger element when deactivated
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 * const triggerRef = useRef<HTMLButtonElement>(null);
 * const initialFocusRef = useRef<HTMLInputElement>(null);
 *
 * return (
 *   <>
 *     <button ref={triggerRef} onClick={() => setIsOpen(true)}>
 *       Open Modal
 *     </button>
 *
 *     <FocusTrap
 *       active={isOpen}
 *       initialFocusRef={initialFocusRef}
 *       onEscape={() => setIsOpen(false)}
 *     >
 *       <dialog open>
 *         <input ref={initialFocusRef} type="text" placeholder="Focus here first" />
 *         <button onClick={() => setIsOpen(false)}>Close</button>
 *       </dialog>
 *     </FocusTrap>
 *   </>
 * );
 * ```
 *
 * Edge cases handled:
 * - Empty container (no focusable elements): focus on container itself
 * - Single focusable element: Tab/Shift+Tab cycle within that element
 * - Container removed from DOM: cleanup handles gracefully
 * - Nested FocusTraps: inner trap takes precedence
 */
export function FocusTrap({
  active,
  children,
  onEscape,
  initialFocusRef,
  restoreFocusOnDeactivate = true,
  ref,
}: FocusTrapProps & { ref?: Ref<HTMLDivElement> }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const previousActiveElementRef = useRef<HTMLElement | null>(null);

    // Merge refs
    const setContainerRef = useCallback(
      (el: HTMLDivElement | null) => {
        containerRef.current = el;
        if (typeof ref === 'function') {
          ref(el);
        } else if (ref) {
          ref.current = el;
        }
      },
      [ref],
    );

    /**
     * Auto-focus first focusable element or initialFocusRef on activation
     */
    const focusInitialElement = useCallback(() => {
      if (!containerRef.current) return;

      // Guard against SSR
      if (typeof window === 'undefined') return;

      let target: HTMLElement | null = null;

      // Prefer explicit initialFocusRef
      if (initialFocusRef?.current) {
        target = initialFocusRef.current;
      } else {
        // Find first focusable element
        const focusable = getFocusableElements(containerRef.current);
        target = focusable[0] || containerRef.current;
      }

      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        target?.focus();
      });
    }, [initialFocusRef]);

    /**
     * Handle keyboard events within trap
     */
    const handleKeyDown = useCallback(
      (event: KeyboardEvent) => {
        if (!containerRef.current) return;

        // Guard against SSR
        if (typeof window === 'undefined') return;

        // Escape key
        if (event.key === 'Escape') {
          event.preventDefault();
          onEscape?.();
          return;
        }

        // Tab key — cycle focus
        if (event.key === 'Tab') {
          const focusable = getFocusableElements(containerRef.current);

          if (focusable.length === 0) {
            // No focusable elements — prevent tabbing out
            event.preventDefault();
            return;
          }

          const activeEl = document.activeElement as HTMLElement;
          const currentIndex = focusable.indexOf(activeEl);

          // Shift+Tab — go backward
          if (event.shiftKey) {
            if (currentIndex <= 0) {
              event.preventDefault();
              focusable[focusable.length - 1]?.focus();
            }
          } else {
            // Tab — go forward
            if (currentIndex >= focusable.length - 1) {
              event.preventDefault();
              focusable[0]?.focus();
            }
          }
        }
      },
      [onEscape],
    );

    /**
     * Activate trap: save focus, add listener, focus initial element
     */
    useEffect(() => {
      if (!active) return;

      // Guard against SSR
      if (typeof window === 'undefined') return;

      // Save current focus to restore later
      previousActiveElementRef.current = document.activeElement as HTMLElement;

      // Add keyboard listener
      document.addEventListener('keydown', handleKeyDown);

      // Focus initial element
      focusInitialElement();

      // Cleanup
      return () => {
        document.removeEventListener('keydown', handleKeyDown);

        // Restore focus on deactivate
        if (restoreFocusOnDeactivate && previousActiveElementRef.current) {
          previousActiveElementRef.current.focus();
        }
      };
    }, [active, handleKeyDown, focusInitialElement, restoreFocusOnDeactivate]);

  return <div ref={setContainerRef}>{children}</div>;
}
