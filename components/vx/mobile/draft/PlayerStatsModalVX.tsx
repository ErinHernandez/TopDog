/**
 * PlayerStatsModalVX - Version X Player Stats Modal (TypeScript)
 * 
 * Migrated from: components/draft/v3/mobile/apple/components/PlayerStatsModal.js
 * 
 * Shows detailed player statistics and information in a modal.
 */

import React from 'react';
import { POSITION_COLORS } from '../../constants/colors';
import { Z_INDEX } from '../../constants/sizes';
import { Button, Stat, StatGroup, PositionTag, Card, IconButton, SectionHeader } from '../../shared';
import type { Player } from '../../shared/types';

// ============================================================================
// TYPES
// ============================================================================

export interface PlayerStatsModalVXProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
}

// Extended player type with stats
interface PlayerWithStats extends Player {
  rank?: number;
  // QB stats
  passingYards?: number;
  passing_yards?: number;
  passingTDs?: number;
  passing_tds?: number;
  interceptions?: number;
  ints?: number;
  // RB stats
  rushingYards?: number;
  rushing_yards?: number;
  rushingTDs?: number;
  rushing_tds?: number;
  // WR/TE/RB receiving stats
  receptions?: number;
  rec?: number;
  receivingYards?: number;
  receiving_yards?: number;
  receivingTDs?: number;
  receiving_tds?: number;
  targets?: number;
  // Projections
  projected_points?: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getPositionColor(position: string): string {
  return POSITION_COLORS[position as keyof typeof POSITION_COLORS] || '#6b7280';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PlayerStatsModalVX({
  player,
  isOpen,
  onClose,
}: PlayerStatsModalVXProps): React.ReactElement | null {
  if (!player || !isOpen) return null;

  const p = player as PlayerWithStats;

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: Z_INDEX.modal }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Modal Content */}
      <div 
        className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm max-h-[85vh] overflow-y-auto mx-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Close Button */}
        <IconButton
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          }
          onClick={onClose}
          size="sm"
          variant="ghost"
          className="absolute top-3 right-3 text-gray-500"
          aria-label="Close"
        />

        <div className="w-full">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {player.name}
            </h2>
            <PositionTag position={player.position} size="md" />
            <span className="ml-2 text-gray-600">{player.team}</span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="p-4 text-center bg-gray-50">
              <Stat 
                label="ADP" 
                value={player.adp ? parseFloat(String(player.adp)).toFixed(1) : 'N/A'} 
                size="md"
                valueColor="#111827"
              />
            </Card>
            <Card className="p-4 text-center bg-gray-50">
              <Stat 
                label="Rank" 
                value={p.rank || 'N/A'} 
                size="md"
                valueColor="#111827"
              />
            </Card>
          </div>

          {/* 2024 Season Stats */}
          <div className="mb-6">
            <SectionHeader title="2024 Stats" spacing="sm" />
            
            {/* QB Stats */}
            {player.position === 'QB' && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <StatCell label="Pass Yards" value={p.passingYards || p.passing_yards} />
                  <StatCell label="Pass TDs" value={p.passingTDs || p.passing_tds} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <StatCell label="INTs" value={p.interceptions || p.ints} />
                  <StatCell label="Rush TDs" value={p.rushingTDs || p.rushing_tds} />
                </div>
              </div>
            )}

            {/* RB Stats */}
            {player.position === 'RB' && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <StatCell label="Rush Yards" value={p.rushingYards || p.rushing_yards} />
                  <StatCell label="Rush TDs" value={p.rushingTDs || p.rushing_tds} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <StatCell label="Receptions" value={p.receptions || p.rec} />
                  <StatCell label="Rec Yards" value={p.receivingYards || p.receiving_yards} />
                </div>
              </div>
            )}

            {/* WR/TE Stats */}
            {(player.position === 'WR' || player.position === 'TE') && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <StatCell label="Receptions" value={p.receptions || p.rec} />
                  <StatCell label="Rec Yards" value={p.receivingYards || p.receiving_yards} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <StatCell label="Rec TDs" value={p.receivingTDs || p.receiving_tds} />
                  <StatCell label="Targets" value={p.targets} />
                </div>
              </div>
            )}
          </div>

          {/* 2025 Projections */}
          {(player.projectedPoints || p.projected_points) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">2025 Projections</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Projected Points</span>
                  <span className="font-semibold text-gray-900">
                    {player.projectedPoints || p.projected_points}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="text-center">
            <Button onClick={onClose} variant="secondary" size="md">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STAT CELL COMPONENT
// ============================================================================

interface StatCellProps {
  label: string;
  value: number | string | undefined;
}

function StatCell({ label, value }: StatCellProps): React.ReactElement {
  return (
    <div className="text-center">
      <div className="text-xl font-bold text-gray-900">
        {value ?? 'N/A'}
      </div>
      <div className="text-xs text-gray-600">{label}</div>
    </div>
  );
}

