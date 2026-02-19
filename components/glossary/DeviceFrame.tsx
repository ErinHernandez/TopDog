/**
 * DeviceFrame Component
 *
 * Renders a device mockup (iPhone, iPad, Desktop, Android) as a clickable
 * platform selector. Can contain existing WireframePreview or custom content.
 * Styling matches reference screenshots exactly.
 */

import Image from 'next/image';
import React from 'react';

import styles from './DeviceFrame.module.css';

export type Platform = 'web' | 'ios' | 'ipad' | 'android';

interface DeviceFrameProps {
  platform: Platform;
  isSelected: boolean;
  onClick: () => void;
  children?: React.ReactNode;
  wireframeImage?: string;
  label?: string;
}

const PLATFORM_CONFIG: Record<Platform, { label: string; aspectRatio: string; width: number }> = {
  ios: { label: 'iPhone', aspectRatio: '9/19.5', width: 140 },
  ipad: { label: 'iPad', aspectRatio: '3/4', width: 180 },
  web: { label: 'Desktop', aspectRatio: '16/10', width: 220 },
  android: { label: 'Android', aspectRatio: '9/19.5', width: 140 },
};

export function DeviceFrame({
  platform,
  isSelected,
  onClick,
  children,
  wireframeImage,
  label
}: DeviceFrameProps) {
  const config = PLATFORM_CONFIG[platform];

  return (
    <button
      className={`${styles.deviceFrame} ${styles[platform]} ${isSelected ? styles.selected : ''}`}
      onClick={onClick}
      style={{ width: config.width }}
      aria-pressed={isSelected}
      aria-label={`Select ${config.label} platform`}
    >
      <div
        className={styles.deviceScreen}
        style={{ aspectRatio: config.aspectRatio }}
      >
        {/* Render children (WireframePreview) if provided */}
        {children ? (
          <div className={styles.wireframeContent}>
            {children}
          </div>
        ) : wireframeImage ? (
          <Image
            src={wireframeImage}
            alt={`${config.label} wireframe`}
            className={styles.wireframeImage}
            fill
            sizes={`${config.width}px`}
          />
        ) : (
          <div className={styles.placeholderContent}>
            <div className={styles.placeholderLines}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        {/* Device notch for phones */}
        {(platform === 'ios' || platform === 'android') && !children && (
          <div className={styles.notch} />
        )}

        {/* Home indicator for modern devices */}
        {platform !== 'web' && !children && (
          <div className={styles.homeIndicator} />
        )}
      </div>

      <span className={styles.deviceLabel}>
        {label || config.label}
      </span>
    </button>
  );
}

export default DeviceFrame;
