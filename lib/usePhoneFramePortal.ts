/**
 * Hook for portaling content into the phone frame's modal root.
 *
 * Returns the portal target element when inside a phone frame,
 * or null when outside the frame (allowing normal rendering).
 *
 * The hook checks for the portal root DOM element and returns it
 * when available. Uses state to trigger re-render once the element
 * is found (handles SSR and timing edge cases).
 *
 * @example
 * const { portalRoot } = usePhoneFramePortal();
 * if (portalRoot) {
 *   return createPortal(<Modal />, portalRoot);
 * }
 * return <Modal />;
 */

import { useState, useEffect, useCallback } from 'react';

import { useInPhoneFrame } from './inPhoneFrameContext';

const PORTAL_ROOT_ID = 'phone-frame-modal-root';

export function usePhoneFramePortal(): { portalRoot: HTMLElement | null } {
  const inPhoneFrame = useInPhoneFrame();
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  // Find the portal root element
  const findPortalRoot = useCallback((): HTMLElement | null => {
    if (typeof document === 'undefined') return null;
    return document.getElementById(PORTAL_ROOT_ID);
  }, []);

  useEffect(() => {
    if (!inPhoneFrame) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional setState in effect
      setPortalRoot(null);
      return;
    }

    // Try to find the element immediately
    const root = findPortalRoot();
    if (root) {
      setPortalRoot(root);
      return;
    }

    // If not found, wait for it (handles render order edge cases)
    const observer = new MutationObserver(() => {
      const el = findPortalRoot();
      if (el) {
        setPortalRoot(el);
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [inPhoneFrame, findPortalRoot]);

  return { portalRoot };
}
