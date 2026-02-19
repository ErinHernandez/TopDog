/**
 * WireframePhone - TopDog Glossary System Component
 *
 * Renders a realistic iPhone 15 Pro device frame with interactive element visualization.
 * Highlights a specific element with a blue glow while showing all other screen elements
 * as wireframe outlines with gray dashed borders.
 *
 * Features:
 * - iPhone 15 Pro style frame (393x852 logical pixels)
 * - Dynamic Island notch at top
 * - Customizable device type support
 * - Real-time element highlighting with glow effect
 * - Wireframe visualization for context elements
 *
 * @example
 * ```tsx
 * <WireframePhone
 *   screenId="DR-HOME-001"
 *   highlightElementId="DR-BTN-001"
 *   deviceType="iphone15pro"
 * />
 * ```
 */

import React, { useMemo } from 'react';

import type { GlossaryElement, Bounds, WireframeContext } from '@/lib/glossary/types';

import styles from './WireframePhone.module.css';

// ============================================================================
// TYPES
// ============================================================================

export type DeviceType = 'iphone15pro' | 'iphone14pro' | 'iphone13pro';

export interface WireframePhoneProps {
  /** Screen/Element ID to render content for */
  screenId: string;

  /** Element ID to highlight as "real" with glow effect */
  highlightElementId: string;

  /** Device type to determine frame dimensions and styling */
  deviceType?: DeviceType;

  /** Optional array of screen elements for rendering */
  elements?: GlossaryElement[];

  /** Optional custom CSS class name */
  className?: string;

  /** Optional callback when element is clicked */
  onElementClick?: (elementId: string) => void;

  /** Show element labels/IDs (useful for debugging) */
  showLabels?: boolean;
}

// ============================================================================
// DEVICE SPECIFICATIONS
// ============================================================================

interface DeviceSpec {
  width: number; // logical pixels
  height: number; // logical pixels
  borderRadius: number;
  notchWidth: number;
  notchHeight: number;
  safeAreaInset: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

const DEVICE_SPECS: Record<DeviceType, DeviceSpec> = {
  iphone15pro: {
    width: 393,
    height: 852,
    borderRadius: 55,
    notchWidth: 250,
    notchHeight: 29,
    safeAreaInset: {
      top: 47,
      bottom: 34,
      left: 0,
      right: 0,
    },
  },
  iphone14pro: {
    width: 393,
    height: 852,
    borderRadius: 52,
    notchWidth: 240,
    notchHeight: 28,
    safeAreaInset: {
      top: 47,
      bottom: 34,
      left: 0,
      right: 0,
    },
  },
  iphone13pro: {
    width: 390,
    height: 844,
    borderRadius: 50,
    notchWidth: 230,
    notchHeight: 27,
    safeAreaInset: {
      top: 47,
      bottom: 34,
      left: 0,
      right: 0,
    },
  },
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Renders the Dynamic Island notch at top of device
 */
function DynamicIsland({ spec }: { spec: DeviceSpec }): React.ReactElement {
  return (
    <div className={styles.dynamicIsland} style={{
      width: `${spec.notchWidth}px`,
      height: `${spec.notchHeight}px`,
      borderRadius: `${spec.notchHeight / 2}px`,
    }} />
  );
}

/**
 * Renders a wireframe element box with dashed border
 */
interface WireframeElementProps {
  bounds: Bounds;
  elementId: string;
  isHighlighted: boolean;
  showLabel: boolean;
  onClick?: () => void;
}

function WireframeElement({
  bounds,
  elementId,
  isHighlighted,
  showLabel,
  onClick,
}: WireframeElementProps): React.ReactElement {
  const elementStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${bounds.x}px`,
    top: `${bounds.y}px`,
    width: `${bounds.width}px`,
    height: `${bounds.height}px`,
  };

  return (
    <div
      className={isHighlighted ? styles.highlightedElement : styles.wireframeElement}
      style={elementStyle}
      onClick={onClick}
      role="button"
      tabIndex={0}
      data-element-id={elementId}
    >
      {showLabel && (
        <div className={styles.elementLabel}>
          {elementId}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WireframePhone({
  screenId,
  highlightElementId,
  deviceType = 'iphone15pro',
  elements = [],
  className = '',
  onElementClick,
  showLabels = false,
}: WireframePhoneProps): React.ReactElement {
  const spec = DEVICE_SPECS[deviceType];

  // Generate mock bounds for demonstration if no elements provided
  const mockElements = useMemo(() => {
    if (elements.length > 0) return elements;

    // Create sample wireframe elements for visual reference
    return [
      {
        id: 'HEADER',
        name: 'Header Container',
        bounds: { x: 12, y: spec.safeAreaInset.top + 8, width: spec.width - 24, height: 60 },
      },
      {
        id: 'TITLE',
        name: 'Screen Title',
        bounds: { x: 20, y: spec.safeAreaInset.top + 16, width: 200, height: 24 },
      },
      {
        id: 'CONTENT-1',
        name: 'Content Card 1',
        bounds: { x: 12, y: spec.safeAreaInset.top + 90, width: spec.width - 24, height: 120 },
      },
      {
        id: 'CONTENT-2',
        name: 'Content Card 2',
        bounds: { x: 12, y: spec.safeAreaInset.top + 230, width: spec.width - 24, height: 120 },
      },
      {
        id: 'BUTTON-PRIMARY',
        name: 'Primary Action',
        bounds: { x: 20, y: spec.height - spec.safeAreaInset.bottom - 100, width: spec.width - 40, height: 48 },
      },
      {
        id: 'BUTTON-SECONDARY',
        name: 'Secondary Action',
        bounds: { x: 20, y: spec.height - spec.safeAreaInset.bottom - 44, width: spec.width - 40, height: 40 },
      },
    ];
  }, [elements, spec]);

  const scale = 0.5; // Scale factor for display (can be adjusted)
  const displayWidth = spec.width * scale;
  const displayHeight = spec.height * scale;

  return (
    <div
      className={`${styles.container} ${className}`}
      style={{
        width: `${displayWidth}px`,
        height: `${displayHeight}px`,
      }}
    >
      {/* Device Frame (Bezel) */}
      <div
        className={styles.deviceFrame}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: `${spec.borderRadius * scale}px`,
        }}
      >
        {/* Screen Area */}
        <div
          className={styles.screen}
          style={{
            paddingTop: `${spec.safeAreaInset.top * scale}px`,
            paddingBottom: `${spec.safeAreaInset.bottom * scale}px`,
            paddingLeft: `${spec.safeAreaInset.left * scale}px`,
            paddingRight: `${spec.safeAreaInset.right * scale}px`,
          }}
        >
          {/* Dynamic Island Notch */}
          <div className={styles.notchContainer}>
            <DynamicIsland spec={spec} />
          </div>

          {/* Content Area - Wireframe Elements */}
          <div
            className={styles.contentArea}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            {mockElements.map((element: any) => (
              <WireframeElement
                key={element.id}
                bounds={{
                  x: element.bounds.x * scale,
                  y: element.bounds.y * scale,
                  width: element.bounds.width * scale,
                  height: element.bounds.height * scale,
                }}
                elementId={element.id}
                isHighlighted={element.id === highlightElementId}
                showLabel={showLabels}
                onClick={() => onElementClick?.(element.id)}
              />
            ))}
          </div>
        </div>

        {/* Status Bar Simulation */}
        <div className={styles.statusBar} />
      </div>

      {/* Screen Meta Information */}
      <div className={styles.metadata}>
        <div className={styles.metadataRow}>
          <span className={styles.metadataLabel}>Screen:</span>
          <span className={styles.metadataValue}>{screenId}</span>
        </div>
        <div className={styles.metadataRow}>
          <span className={styles.metadataLabel}>Highlighted:</span>
          <span className={styles.metadataValue}>{highlightElementId}</span>
        </div>
        <div className={styles.metadataRow}>
          <span className={styles.metadataLabel}>Device:</span>
          <span className={styles.metadataValue}>{deviceType}</span>
        </div>
      </div>
    </div>
  );
}

// Export types for external use
export type { WireframeContext };
