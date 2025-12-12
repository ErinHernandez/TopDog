/**
 * useLongPress - UI hook for long press gesture detection
 * 
 * Detects long press gestures on touch and mouse devices.
 * Returns handlers for onMouseDown, onMouseUp, onTouchStart, onTouchEnd.
 * 
 * @example
 * ```tsx
 * const { handlers, isPressed } = useLongPress({
 *   onLongPress: () => console.log('Long pressed!'),
 *   onPress: () => console.log('Short pressed!'),
 *   threshold: 500,
 * });
 * 
 * <button {...handlers}>Hold me</button>
 * ```
 */

import { useCallback, useRef, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Hook options
 */
export interface UseLongPressOptions {
  /** Callback for long press */
  onLongPress: () => void;
  /** Callback for short press (optional) */
  onPress?: () => void;
  /** Time in ms to trigger long press (default: 500) */
  threshold?: number;
  /** Whether to prevent default on touch events */
  preventDefault?: boolean;
}

/**
 * Event handlers returned by hook
 */
export interface LongPressHandlers {
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

/**
 * Hook return type
 */
export interface UseLongPressResult {
  /** Event handlers to spread on element */
  handlers: LongPressHandlers;
  /** Whether element is currently pressed */
  isPressed: boolean;
  /** Whether long press was triggered */
  isLongPressed: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for detecting long press gestures
 */
export function useLongPress(options: UseLongPressOptions): UseLongPressResult {
  const { 
    onLongPress, 
    onPress, 
    threshold = 500,
    preventDefault = true,
  } = options;

  const [isPressed, setIsPressed] = useState(false);
  const [isLongPressed, setIsLongPressed] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const start = useCallback(() => {
    setIsPressed(true);
    isLongPressRef.current = false;
    
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setIsLongPressed(true);
      onLongPress();
    }, threshold);
  }, [onLongPress, threshold]);

  const stop = useCallback((shouldTriggerClick = true) => {
    setIsPressed(false);
    setIsLongPressed(false);
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // If it wasn't a long press and we have onPress, call it
    if (shouldTriggerClick && !isLongPressRef.current && onPress) {
      onPress();
    }
  }, [onPress]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // Only handle left click
    if (e.button !== 0) return;
    start();
  }, [start]);

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    stop(true);
  }, [stop]);

  const onMouseLeave = useCallback(() => {
    stop(false);
  }, [stop]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }
    start();
  }, [start, preventDefault]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }
    stop(true);
  }, [stop, preventDefault]);

  const handlers: LongPressHandlers = {
    onMouseDown,
    onMouseUp,
    onMouseLeave,
    onTouchStart,
    onTouchEnd,
  };

  return {
    handlers,
    isPressed,
    isLongPressed,
  };
}

export default useLongPress;

