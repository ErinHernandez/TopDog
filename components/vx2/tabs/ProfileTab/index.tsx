/**
 * ProfileTab - VX2 Profile Tab
 * 
 * Placeholder for migration from VX.
 */

import React from 'react';
import { BG_COLORS, TEXT_COLORS } from '../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../core/constants/sizes';

export default function ProfileTab(): React.ReactElement {
  return (
    <div 
      className="flex-1 flex flex-col"
      style={{ backgroundColor: BG_COLORS.primary }}
    >
      {/* Header */}
      <div 
        className="px-4 py-3"
        style={{ borderBottom: `1px solid rgba(255,255,255,0.1)` }}
      >
        <h1 
          className="font-bold"
          style={{ 
            color: TEXT_COLORS.primary,
            fontSize: `${TYPOGRAPHY.fontSize.xl}px`,
          }}
        >
          Profile
        </h1>
      </div>

      {/* Profile Avatar */}
      <div className="p-6 flex flex-col items-center">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center mb-3"
          style={{ backgroundColor: BG_COLORS.secondary }}
        >
          <span style={{ color: TEXT_COLORS.primary, fontSize: 32 }}>U</span>
        </div>
        <h2 
          className="font-semibold"
          style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.lg}px` }}
        >
          Username
        </h2>
        <p style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
          Member since 2024
        </p>
      </div>

      {/* Menu Items */}
      <div className="flex-1 px-4">
        {['Rankings', 'Autodraft Limits', 'Deposit History', 'Settings'].map((item) => (
          <div
            key={item}
            className="mb-2 p-4 flex items-center justify-between"
            style={{
              backgroundColor: BG_COLORS.secondary,
              borderRadius: `${RADIUS.lg}px`,
            }}
          >
            <span style={{ color: TEXT_COLORS.primary }}>{item}</span>
            <span style={{ color: TEXT_COLORS.secondary }}>{'>'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

