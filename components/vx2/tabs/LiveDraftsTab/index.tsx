/**
 * LiveDraftsTab - VX2 Live Drafts Tab
 * 
 * Placeholder for migration from VX.
 */

import React from 'react';
import { BG_COLORS, TEXT_COLORS, STATE_COLORS } from '../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../core/constants/sizes';

export default function LiveDraftsTab(): React.ReactElement {
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
          Live Drafts
        </h1>
      </div>

      {/* Empty State */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div 
          className="flex items-center justify-center rounded-full mb-4"
          style={{
            width: '64px',
            height: '64px',
            backgroundColor: 'rgba(96, 165, 250, 0.1)',
          }}
        >
          <svg 
            width="32" 
            height="32" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke={STATE_COLORS.active}
            strokeWidth="2"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M13 10V3L4 14h7v7l9-11h-7z" 
            />
          </svg>
        </div>
        
        <h2 
          className="font-semibold text-center mb-2"
          style={{ color: TEXT_COLORS.primary }}
        >
          No Active Drafts
        </h2>
        
        <p 
          className="text-center mb-6"
          style={{ 
            color: TEXT_COLORS.secondary,
            fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
            maxWidth: '260px',
          }}
        >
          Join a tournament from the Lobby to start drafting
        </p>
        
        <button
          className="font-medium"
          style={{
            backgroundColor: STATE_COLORS.active,
            color: '#000',
            padding: '12px 24px',
            borderRadius: `${RADIUS.md}px`,
          }}
        >
          Browse Lobby
        </button>
      </div>
    </div>
  );
}

