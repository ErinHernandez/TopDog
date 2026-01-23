/**
 * StrictModeDroppable - React DnD Wrapper for Strict Mode
 * 
 * Wraps react-beautiful-dnd's Droppable to work with React Strict Mode.
 * Uses requestAnimationFrame to delay initialization and avoid hydration issues.
 * 
 * @example
 * ```tsx
 * <StrictModeDroppable droppableId="list">
 *   {(provided) => (
 *     <div {...provided.droppableProps} ref={provided.innerRef}>
 *       {items.map((item, index) => (
 *         <Draggable key={item.id} draggableId={item.id} index={index}>
 *           {item.content}
 *         </Draggable>
 *       ))}
 *       {provided.placeholder}
 *     </div>
 *   )}
 * </StrictModeDroppable>
 * ```
 */

import React, { useEffect, useState } from 'react';
// @ts-expect-error - react-beautiful-dnd doesn't have TypeScript types
import { Droppable } from 'react-beautiful-dnd';

// ============================================================================
// TYPES
// ============================================================================

// Droppable props from react-beautiful-dnd (no official types)
export interface StrictModeDroppableProps {
  /** Droppable ID (required) */
  droppableId: string;
  /** Droppable children (render function) */
  children: (provided: {
    innerRef: (element: HTMLElement | null) => void;
    droppableProps: React.HTMLAttributes<HTMLDivElement>;
    placeholder: React.ReactElement | null;
  }, snapshot: {
    isDraggingOver: boolean;
    draggingOverWith: string | null;
    draggingFromThisWith: string | null;
  }) => React.ReactNode;
  /** Type of droppable */
  type?: string;
  /** Whether droppable is disabled */
  isDropDisabled?: boolean;
  /** Direction of droppable */
  direction?: 'horizontal' | 'vertical';
  /** Whether to ignore container clipping */
  ignoreContainerClipping?: boolean;
  /** Render mode */
  renderClone?: (provided: unknown, snapshot: unknown, rubric: unknown) => React.ReactElement;
  /** Get container for portal */
  getContainerForClone?: () => HTMLElement;
  /** Additional props */
  [key: string]: unknown;
}

// ============================================================================
// COMPONENT
// ============================================================================

const StrictModeDroppable: React.FC<StrictModeDroppableProps> = ({ 
  children, 
  ...props 
}): React.ReactElement | null => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));

    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return <Droppable {...props}>{children}</Droppable>;
};

export default StrictModeDroppable;
