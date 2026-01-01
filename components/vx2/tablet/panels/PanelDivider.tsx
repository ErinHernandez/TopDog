/**
 * PanelDivider - Draggable Panel Separator
 * 
 * Thin divider line between panels that can be dragged to resize.
 * Provides visual feedback during drag operations.
 */

import React, { 
  useState, 
  useCallback, 
  useRef, 
  useEffect,
  type ReactElement,
  type MouseEvent,
  type TouchEvent,
} from 'react';
import { BORDER_COLORS, STATE_COLORS } from '../../core/constants/colors';
import { TABLET_PANELS, TABLET_Z_INDEX } from '../../core/constants/tablet';
import type { PanelDividerProps } from '../../core/types/tablet';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * PanelDivider - Resizable divider between panels
 * 
 * Supports both mouse and touch drag operations.
 * Visually indicates drag state with color change.
 */
export default function PanelDivider({
  position,
  draggable = true,
  onDragStart,
  onDrag,
  onDragEnd,
}: PanelDividerProps): ReactElement {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const startXRef = useRef(0);
  const dividerRef = useRef<HTMLDivElement>(null);
  
  // Handle mouse down
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!draggable) return;
    
    e.preventDefault();
    startXRef.current = e.clientX;
    setIsDragging(true);
    onDragStart?.();
  }, [draggable, onDragStart]);
  
  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!draggable || e.touches.length !== 1) return;
    
    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
    onDragStart?.();
  }, [draggable, onDragStart]);
  
  // Global mouse/touch move and up handlers
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const delta = e.clientX - startXRef.current;
      startXRef.current = e.clientX;
      onDrag?.(delta);
    };
    
    const handleTouchMove = (e: globalThis.TouchEvent) => {
      if (e.touches.length !== 1) return;
      const delta = e.touches[0].clientX - startXRef.current;
      startXRef.current = e.touches[0].clientX;
      onDrag?.(delta);
    };
    
    const handleEnd = () => {
      setIsDragging(false);
      onDragEnd?.();
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleEnd);
    document.addEventListener('touchcancel', handleEnd);
    
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
      document.removeEventListener('touchcancel', handleEnd);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, onDrag, onDragEnd]);
  
  // Determine visual state
  const isActive = isDragging || isHovered;
  const lineColor = isActive ? STATE_COLORS.active : BORDER_COLORS.default;
  
  return (
    <div
      ref={dividerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: TABLET_PANELS.dividerHitArea,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: draggable ? 'col-resize' : 'default',
        zIndex: TABLET_Z_INDEX.panelDivider,
        flexShrink: 0,
        touchAction: 'none', // Prevent scroll on touch
      }}
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={undefined}
      tabIndex={draggable ? 0 : -1}
    >
      {/* Visual divider line */}
      <div
        style={{
          width: TABLET_PANELS.dividerWidth,
          height: '100%',
          backgroundColor: lineColor,
          transition: 'background-color 150ms ease',
        }}
      />
      
      {/* Drag handle indicator (visible on hover/drag) */}
      {draggable && isActive && (
        <div
          style={{
            position: 'absolute',
            width: 4,
            height: 32,
            backgroundColor: STATE_COLORS.active,
            borderRadius: 2,
            opacity: 0.8,
          }}
        />
      )}
    </div>
  );
}

