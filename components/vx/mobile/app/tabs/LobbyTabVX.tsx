/**
 * LobbyTabVX - Mobile Tournament Lobby (TypeScript)
 * 
 * Pixel-perfect match to: components/mobile/tabs/LobbyTab.js
 * 
 * Shows available tournaments for joining
 */

import React from 'react';
import TournamentCardVX from '../TournamentCardVX';

// ============================================================================
// PIXEL-PERFECT CONSTANTS
// ============================================================================

const LOBBY_PX = {
  // Container
  containerPaddingY: 16,
  
  // Tournament List
  listMarginTop: 24,
  listGap: 16,
  
  // Card positioning
  cardMarginTop: 44, // iOS touch target minimum
  
  // Featured card border
  featuredBorderWidth: 8,
} as const;

const LOBBY_COLORS = {
  background: '#101927',
  featuredBorder: '#14b8a6', // teal-500
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface LobbyTabVXProps {
  onJoinClick?: () => void;
}

// ============================================================================
// MOCK TOURNAMENT DATA
// ============================================================================

interface Tournament {
  id: string;
  title: string;
  entryFee: string;
  totalEntries: string;
  currentEntries?: number;
  maxEntries?: number;
  firstPlacePrize: string;
  isFeatured?: boolean;
  variant?: 'default' | 'compact' | 'progress';
}

const MOCK_TOURNAMENTS: Tournament[] = [
  {
    id: 'topdog-international',
    title: 'THE TOPDOG INTERNATIONAL',
    entryFee: '$25',
    totalEntries: '571,480',
    currentEntries: 571480,
    maxEntries: 672672,
    firstPlacePrize: '$2M',
    isFeatured: true,
    variant: 'default',
  },
  // Additional tournaments can be added here
  // {
  //   id: 'topdog-regional',
  //   title: 'THE TOPDOG REGIONAL',
  //   entryFee: '$10',
  //   totalEntries: '125,000',
  //   firstPlacePrize: '$500K',
  //   isFeatured: false,
  //   variant: 'compact',
  // },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LobbyTabVX({ 
  onJoinClick 
}: LobbyTabVXProps): React.ReactElement {
  return (
    <div 
      className="flex-1 flex flex-col"
      style={{ 
        paddingTop: `${LOBBY_PX.containerPaddingY}px`,
        paddingBottom: `${LOBBY_PX.containerPaddingY}px`,
        backgroundColor: LOBBY_COLORS.background,
      }}
    >
      {/* Tournament Cards List */}
      <div 
        style={{ 
          marginTop: `${LOBBY_PX.listMarginTop}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: `${LOBBY_PX.listGap}px`,
        }}
      >
        {MOCK_TOURNAMENTS.map((tournament) => (
          <TournamentCardVX
            key={tournament.id}
            title={tournament.title}
            entryFee={tournament.entryFee}
            totalEntries={tournament.totalEntries}
            currentEntries={tournament.currentEntries}
            maxEntries={tournament.maxEntries}
            firstPlacePrize={tournament.firstPlacePrize}
            onJoinClick={onJoinClick}
            variant={tournament.variant}
            className={tournament.isFeatured ? `border-[${LOBBY_PX.featuredBorderWidth}px]` : ''}
            style={{ 
              marginTop: tournament.isFeatured ? `${LOBBY_PX.cardMarginTop}px` : 0,
              borderWidth: tournament.isFeatured ? `${LOBBY_PX.featuredBorderWidth}px` : 0,
              borderColor: tournament.isFeatured ? LOBBY_COLORS.featuredBorder : 'transparent',
              borderStyle: 'solid',
            }}
          />
        ))}
      </div>
    </div>
  );
}
