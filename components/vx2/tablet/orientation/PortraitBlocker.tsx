/**
 * PortraitBlocker - "Please Rotate" Screen
 * 
 * Displayed when iPad is held in portrait orientation.
 * Clean, branded design matching TopDog aesthetics.
 * No emojis per user preference [[memory:8869171]].
 */

import React, { type ReactElement } from 'react';
import { BG_COLORS, TEXT_COLORS, BRAND_COLORS } from '../../core/constants/colors';
import { TABLET_Z_INDEX, TABLET_TYPOGRAPHY, TABLET_SPACING } from '../../core/constants/tablet';
import type { PortraitBlockerProps } from '../../core/types/tablet';

// ============================================================================
// ROTATION ICON COMPONENT
// ============================================================================

function RotationIcon(): ReactElement {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      {/* Device outline (portrait) */}
      <rect 
        x="30" 
        y="15" 
        width="40" 
        height="70" 
        rx="6" 
        stroke={TEXT_COLORS.secondary}
        strokeWidth="2"
        fill="none"
      />
      
      {/* Home indicator bar */}
      <line 
        x1="42" 
        y1="78" 
        x2="58" 
        y2="78" 
        stroke={TEXT_COLORS.secondary}
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* Rotation arrow */}
      <path
        d="M75 50 C75 30 60 20 45 25"
        stroke={BRAND_COLORS.primary}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Arrow head */}
      <path
        d="M50 20 L45 25 L50 30"
        stroke={BRAND_COLORS.primary}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * PortraitBlocker - Full-screen overlay prompting user to rotate device
 */
export default function PortraitBlocker({
  message = 'Rotate Your iPad',
  submessage = 'This experience is designed for landscape orientation. Please rotate your device to continue.',
  showLogo = true,
}: PortraitBlockerProps): ReactElement {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: BG_COLORS.primary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: TABLET_SPACING['2xl'],
        textAlign: 'center',
        zIndex: TABLET_Z_INDEX.orientationBlocker,
      }}
      role="alert"
      aria-live="polite"
    >
      {/* TopDog Logo */}
      {showLogo && (
        <img
          src="/logo.png"
          alt="TopDog"
          style={{
            height: 48,
            marginBottom: TABLET_SPACING['2xl'],
            opacity: 0.8,
          }}
        />
      )}
      
      {/* Rotation Icon */}
      <div
        style={{
          width: 120,
          height: 120,
          marginBottom: TABLET_SPACING.xl,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            animation: 'tablet-rotate-hint 2s ease-in-out infinite',
          }}
        >
          <RotationIcon />
        </div>
      </div>
      
      {/* Message */}
      <h1
        style={{
          fontSize: TABLET_TYPOGRAPHY.fontSize['2xl'],
          fontWeight: TABLET_TYPOGRAPHY.fontWeight.semibold,
          color: TEXT_COLORS.primary,
          marginBottom: TABLET_SPACING.sm,
          margin: 0,
        }}
      >
        {message}
      </h1>
      
      {/* Submessage */}
      <p
        style={{
          fontSize: TABLET_TYPOGRAPHY.fontSize.base,
          color: TEXT_COLORS.secondary,
          maxWidth: 320,
          lineHeight: TABLET_TYPOGRAPHY.lineHeight.normal,
          margin: 0,
          marginTop: TABLET_SPACING.sm,
        }}
      >
        {submessage}
      </p>
      
      {/* Animation keyframes */}
      <style>{`
        @keyframes tablet-rotate-hint {
          0%, 100% { 
            transform: rotate(0deg); 
          }
          25% { 
            transform: rotate(-15deg); 
          }
          75% { 
            transform: rotate(15deg); 
          }
        }
      `}</style>
    </div>
  );
}

