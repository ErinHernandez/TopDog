import React from 'react';
import { CustomizationPreferences, DEFAULT_PREFERENCES } from '@/lib/customization/types';
import { generateBackgroundStyle, generateOverlayStyle } from '@/lib/customization/patterns';
import { useAuth } from '@/components/vx2/auth/hooks/useAuth';

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
    <div className="flex flex-col items-center">
      <p className="text-sm mb-2" style={{ color: '#9CA3AF' }}>Preview</p>

      {/* Cell preview - exact dimensions from ProfileTabVX2 */}
      <div
        className="relative overflow-hidden"
        style={{
          width: 120,
          height: 140,
          borderRadius: 8,
          border: `3px solid ${borderColor}`,
        }}
      >
        {/* Username banner */}
        <div
          className="absolute top-0 left-0 right-0 text-center text-xs font-medium text-white py-1 truncate px-1"
          style={{ backgroundColor: borderColor }}
        >
          {username}
        </div>

        {/* Background layer */}
        <div className="absolute inset-0" style={backgroundStyle} />

        {/* Overlay layer */}
        {preferences.overlayEnabled && (
          <div className="absolute inset-0 pointer-events-none" style={overlayStyle} />
        )}

        {/* "Your Pick" text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-gray-400 font-medium">Your Pick</span>
        </div>
      </div>
    </div>
  );
}
