import React from 'react';

import { OverlayPattern } from '@/lib/customization/types';
import { cn } from '@/lib/styles';

import styles from './OverlayControls.module.css';

interface OverlayControlsProps {
  size: number;
  onSizeChange: (size: number) => void;
  pattern: OverlayPattern;
  positionX?: number;
  positionY?: number;
  onPositionChange?: (x: number, y: number) => void;
}

export function OverlayControls({
  size,
  onSizeChange,
  pattern,
  positionX = 50,
  positionY = 50,
  onPositionChange,
}: OverlayControlsProps) {
  return (
    <div className={styles.container}>
      {/* Size Slider */}
      <div className={styles.controlGroup}>
        <label className={styles.label}>
          Size: {size}%
        </label>
        <input
          type="range"
          min={10}
          max={100}
          value={size}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          className={styles.slider}
        />
      </div>

      {/* Position Controls (only for placement pattern) */}
      {pattern === 'placement' && onPositionChange && (
        <div className={styles.positionControls}>
          <div className={styles.controlGroup}>
            <label className={styles.label}>
              Horizontal: {positionX}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={positionX}
              onChange={(e) => onPositionChange(Number(e.target.value), positionY)}
              className={styles.slider}
            />
          </div>
          <div className={styles.controlGroup}>
            <label className={styles.label}>
              Vertical: {positionY}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={positionY}
              onChange={(e) => onPositionChange(positionX, Number(e.target.value))}
              className={styles.slider}
            />
          </div>
        </div>
      )}
    </div>
  );
}
