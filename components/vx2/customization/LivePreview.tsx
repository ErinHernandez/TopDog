import React from 'react';

import { useAuth } from '@/components/vx2/auth/hooks/useAuth';
import { generateBackgroundStyle, generateOverlayStyle } from '@/lib/customization/patterns';
import { CustomizationPreferences, DEFAULT_PREFERENCES } from '@/lib/customization/types';

import styles from './LivePreview.module.css';

interface LivePreviewProps {
  preferences: CustomizationPreferences;
}

export function LivePreview({ preferences }: LivePreviewProps) {
  const { user } = useAuth();
  const username = user?.displayName || 'Username';

  // Use grey as default, fallback from DEFAULT_PREFERENCES if borderColor is missing or old gold
  const borderColor = preferences.borderColor && preferences.borderColor !== '#FFD700'
    ? preferences.borderColor
    : DEFAULT_PREFERENCES.borderColor;

  const backgroundStyle = generateBackgroundStyle(
    preferences.backgroundType,
    preferences.backgroundFlagCode,
    preferences.backgroundSolidColor
  );

  const overlayStyle = preferences.overlayEnabled
    ? generateOverlayStyle(
        `/customization/images/${preferences.overlayImageId}.svg`,
        preferences.overlayPattern,
        preferences.overlaySize,
        preferences.overlayPattern === 'placement'
          ? { x: preferences.overlayPositionX ?? 50, y: preferences.overlayPositionY ?? 50 }
          : undefined
      )
    : {};

  return (
    <div className={styles.previewContainer}>
      <p className={styles.previewLabel}>Preview</p>

      {/* Cell preview - exact dimensions from ProfileTabVX2 */}
      <div
        className={styles.cellPreview}
        style={{ '--border-color': borderColor } as React.CSSProperties}
        data-border={borderColor}
      >
        {/* Username banner */}
        <div className={styles.usernameBanner}>
          {username}
        </div>

        {/* Background layer */}
        <div className={styles.backgroundLayer} style={backgroundStyle} />

        {/* Overlay layer */}
        {preferences.overlayEnabled && (
          <div className={styles.overlayLayer} style={overlayStyle} />
        )}

        {/* "Your Pick" text */}
        <div className={styles.contentLayer}>
          <span className={styles.pickText}>Your Pick</span>
        </div>
      </div>
    </div>
  );
}
