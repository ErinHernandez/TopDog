/**
 * Idesaign — useTouchDevice Hook
 *
 * Detect if the device supports touch input.
 * Used to adapt editor UI for touch-based interactions.
 *
 * Detection methods:
 * 1. window.ontouchstart capability check
 * 2. matchMedia('(pointer: coarse)') for coarse-pointer devices
 *
 * SSR-safe: returns false on server, true/false on client.
 *
 * @module hooks/useTouchDevice
 */

import { useEffect, useState } from 'react';

/**
 * Detect if device supports touch input.
 *
 * Uses multiple detection methods to identify touch-capable devices:
 * - Checks for 'ontouchstart' in window object
 * - Uses matchMedia to detect coarse pointer (touch)
 * - SSR-safe: returns false during server-side rendering
 *
 * @returns boolean - true if device supports touch, false otherwise
 *
 * @example
 * const isTouch = useTouchDevice();
 * if (isTouch) {
 *   return <TouchFriendlyToolbar />;
 * }
 * return <MouseToolbar />;
 *
 * @example
 * const isTouch = useTouchDevice();
 * const minTapTarget = isTouch ? 44 : 32; // iOS Human Interface Guidelines
 */
export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Check if window is available (not on server)
    if (typeof window === 'undefined') {
      return;
    }

    // Method 1: Check for ontouchstart capability
    const hasTouchStart = 'ontouchstart' in window;

    // Method 2: Check for coarse pointer via matchMedia
    let hasCoarsePointer = false;
    if (window.matchMedia) {
      try {
        hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
      } catch (e) {
        // matchMedia not supported or error occurred
      }
    }

    // Device is touch if either method detected touch capability
    const touchSupported = hasTouchStart || hasCoarsePointer;
    setIsTouch(touchSupported);
  }, []);

  // Return false on server to prevent hydration mismatch
  return isMounted && isTouch;
}

/**
 * Detect if device has a fine pointer (mouse/trackpad).
 *
 * Inverse of touch detection. Useful for mouse-only interactions.
 *
 * @returns boolean - true if device has fine pointer
 *
 * @example
 * const isMouse = useFinePointer();
 * if (isMouse) return <PrecisionControls />;
 */
export function useFinePointer(): boolean {
  const [isFine, setIsFine] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    try {
      const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
      setIsFine(hasFinePointer);
    } catch (e) {
      // matchMedia not supported
    }
  }, []);

  return isMounted && isFine;
}

/**
 * Get optimal tap target size based on device input method.
 *
 * Returns 44px for touch devices (Apple iOS HIG standard),
 * 32px for mouse/trackpad devices.
 *
 * @returns number - tap target size in pixels
 *
 * @example
 * const tapSize = useTapTargetSize();
 * const buttonStyle = {
 *   width: `${tapSize}px`,
 *   height: `${tapSize}px`,
 * };
 */
export function useTapTargetSize(): number {
  const isTouch = useTouchDevice();
  return isTouch ? 44 : 32;
}

/**
 * Detect if device has both touch and pointer support.
 *
 * @returns boolean - true if device supports both touch and pointer
 *
 * @example
 * const hasHybridInput = useHybridInput();
 * if (hasHybridInput) return <HybridUIMode />;
 */
export function useHybridInput(): boolean {
  const [isHybrid, setIsHybrid] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const hasTouchStart = 'ontouchstart' in window;

    try {
      const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
      // Device has hybrid input if it supports both touch and fine pointer
      setIsHybrid(hasTouchStart && hasFinePointer);
    } catch (e) {
      // If matchMedia fails, fall back to touchStart check
      setIsHybrid(hasTouchStart);
    }
  }, []);

  return isMounted && isHybrid;
}
