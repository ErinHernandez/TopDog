/**
 * LobbyTab - VX2 Lobby Tab
 * 
 * Placeholder for migration from VX.
 * Will be populated with LobbyTabVX content.
 */

import React from 'react';
import { BG_COLORS, TEXT_COLORS, STATE_COLORS } from '../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../core/constants/sizes';

export default function LobbyTab(): React.ReactElement {
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
          Lobby
        </h1>
        <p style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
          VX2 - Enterprise Tab System
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Sample Tournament Card */}
        <div 
          className="mb-4"
          style={{
            backgroundColor: BG_COLORS.secondary,
            borderRadius: `${RADIUS.lg}px`,
            padding: `${SPACING.lg}px`,
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 
                className="font-semibold"
                style={{ color: TEXT_COLORS.primary }}
              >
                Best Ball Mania V
              </h3>
              <p style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
                $25 Entry - 12 Team Draft
              </p>
            </div>
            <div 
              className="px-2 py-1 rounded text-xs font-medium"
              style={{ 
                backgroundColor: 'rgba(96, 165, 250, 0.2)',
                color: STATE_COLORS.active,
              }}
            >
              FILLING
            </div>
          </div>
          
          <div 
            className="h-2 rounded-full mb-3"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <div 
              className="h-full rounded-full"
              style={{ 
                width: '75%',
                backgroundColor: STATE_COLORS.active,
              }}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <span style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
              9/12 Entered
            </span>
            <button
              className="font-medium"
              style={{
                backgroundColor: STATE_COLORS.active,
                color: '#000',
                padding: '8px 16px',
                borderRadius: `${RADIUS.md}px`,
                fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
              }}
            >
              Join $25
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div 
          style={{
            backgroundColor: BG_COLORS.secondary,
            borderRadius: `${RADIUS.lg}px`,
            padding: `${SPACING.lg}px`,
          }}
        >
          <h3 
            className="font-semibold mb-2"
            style={{ color: TEXT_COLORS.primary }}
          >
            VX2 Foundation Complete
          </h3>
          <p style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
            This is a placeholder tab demonstrating the new enterprise-grade tab system. 
            Content from VX will be migrated here.
          </p>
        </div>
      </div>
    </div>
  );
}

