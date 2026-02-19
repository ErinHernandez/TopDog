/**
 * WireframeElement.tsx
 * Generic wireframe placeholder component for visual reference
 *
 * Features:
 * - Gray dashed border style
 * - Customizable dimensions
 * - Optional label on hover
 * - Position and size configuration
 */

import React, { useState } from 'react';

import type { Bounds } from '@/lib/glossary/types';

import styles from './WireframeElement.module.css';

interface WireframeElementProps {
  bounds: Bounds;
  label?: string;
  variant?: 'default' | 'highlight' | 'sibling';
  onClick?: () => void;
  interactive?: boolean;
}

export function WireframeElement({
  bounds,
  label,
  variant = 'default',
  onClick,
  interactive = false,
}: WireframeElementProps) {
  const [showLabel, setShowLabel] = useState(false);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${bounds.x}px`,
    top: `${bounds.y}px`,
    width: `${bounds.width}px`,
    height: `${bounds.height}px`,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };

  return (
    <div
      className={`${styles.wireframe} ${styles[`variant${variant.charAt(0).toUpperCase() + variant.slice(1)}`]} ${
        interactive ? styles.interactive : ''
      }`}
      style={style}
      onClick={handleClick}
      onMouseEnter={() => setShowLabel(true)}
      onMouseLeave={() => setShowLabel(false)}
      role={interactive ? 'button' : 'presentation'}
      tabIndex={interactive ? 0 : -1}
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Corner Markers */}
      <div className={styles.corner} style={{ top: 0, left: 0 }} />
      <div className={styles.corner} style={{ top: 0, right: 0 }} />
      <div className={styles.corner} style={{ bottom: 0, left: 0 }} />
      <div className={styles.corner} style={{ bottom: 0, right: 0 }} />

      {/* Dimensions Display */}
      <div className={styles.dimensionsDisplay}>
        <span className={styles.dimensionText}>
          {bounds.width} x {bounds.height}
        </span>
      </div>

      {/* Label on Hover */}
      {label && showLabel && (
        <div className={styles.labelTooltip}>
          <span className={styles.labelText}>{label}</span>
        </div>
      )}
    </div>
  );
}

/**
 * WireframeContainer
 * Container for displaying multiple wireframe elements
 */

interface WireframeContainerProps {
  children: React.ReactNode;
  containerBounds?: Bounds;
  label?: string;
}

export function WireframeContainer({
  children,
  containerBounds,
  label,
}: WireframeContainerProps) {
  const [showLabel, setShowLabel] = useState(false);

  const style: React.CSSProperties = containerBounds
    ? {
        position: 'absolute',
        left: `${containerBounds.x}px`,
        top: `${containerBounds.y}px`,
        width: `${containerBounds.width}px`,
        height: `${containerBounds.height}px`,
      }
    : {};

  return (
    <div
      className={styles.wireframeContainer}
      style={style}
      onMouseEnter={() => setShowLabel(true)}
      onMouseLeave={() => setShowLabel(false)}
    >
      {children}

      {label && showLabel && (
        <div className={styles.containerLabelTooltip}>
          <span className={styles.labelText}>{label}</span>
        </div>
      )}
    </div>
  );
}

export default WireframeElement;
