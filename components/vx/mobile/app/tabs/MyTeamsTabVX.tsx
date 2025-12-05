/**
 * MyTeamsTabVX - My Teams Tab (TypeScript)
 * 
 * Migrated from: components/mobile/tabs/MyTeamsTab.js
 * 
 * Shows user's drafted teams with full roster view
 */

import React, { useState } from 'react';
import { POSITION_COLORS } from '../../../constants/colors';

// ============================================================================
// TYPES
// ============================================================================

export interface MyTeamsTabVXProps {
  selectedTeam: MockTeam | null;
  setSelectedTeam: (team: MockTeam | null) => void;
  setDraftBoardTeam?: (team: MockTeam | null) => void;
  setShowDraftBoard?: (show: boolean) => void;
}

interface RosterPlayer {
  name: string;
  position: 'QB' | 'RB' | 'WR' | 'TE';
  team: string;
  points: number;
  pickNumber: number;
}

interface MockTeam {
  id: string;
  tournamentName: string;
  rank: number;
  totalTeams: number;
  points: number;
  projectedPoints: number;
  status: 'active' | 'eliminated' | 'pending';
  roster?: RosterPlayer[];
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_ROSTER: RosterPlayer[] = [
  { name: "Josh Allen", position: 'QB', team: 'BUF', points: 24.8, pickNumber: 36 },
  { name: "Saquon Barkley", position: 'RB', team: 'PHI', points: 18.2, pickNumber: 5 },
  { name: "Breece Hall", position: 'RB', team: 'NYJ', points: 15.6, pickNumber: 17 },
  { name: "Ja'Marr Chase", position: 'WR', team: 'CIN', points: 22.4, pickNumber: 2 },
  { name: "CeeDee Lamb", position: 'WR', team: 'DAL', points: 19.8, pickNumber: 12 },
  { name: "Tyreek Hill", position: 'WR', team: 'MIA', points: 16.2, pickNumber: 24 },
  { name: "Travis Kelce", position: 'TE', team: 'KC', points: 14.6, pickNumber: 29 },
  { name: "Amon-Ra St. Brown", position: 'WR', team: 'DET', points: 12.8, pickNumber: 41 },
  { name: "Jahmyr Gibbs", position: 'RB', team: 'DET', points: 11.4, pickNumber: 48 },
  { name: "Puka Nacua", position: 'WR', team: 'LAR', points: 9.2, pickNumber: 53 },
  { name: "George Kittle", position: 'TE', team: 'SF', points: 8.6, pickNumber: 60 },
  { name: "Bijan Robinson", position: 'RB', team: 'ATL', points: 7.8, pickNumber: 65 },
  { name: "Garrett Wilson", position: 'WR', team: 'NYJ', points: 6.4, pickNumber: 72 },
  { name: "Kyren Williams", position: 'RB', team: 'LAR', points: 5.2, pickNumber: 77 },
  { name: "Lamar Jackson", position: 'QB', team: 'BAL', points: 4.8, pickNumber: 84 },
  { name: "Nico Collins", position: 'WR', team: 'HOU', points: 3.6, pickNumber: 89 },
  { name: "Mark Andrews", position: 'TE', team: 'BAL', points: 2.4, pickNumber: 96 },
  { name: "Tank Dell", position: 'WR', team: 'HOU', points: 1.8, pickNumber: 101 },
];

const MOCK_TEAMS: MockTeam[] = [
  {
    id: '1',
    tournamentName: 'TopDog International',
    rank: 1234,
    totalTeams: 672672,
    points: 145.6,
    projectedPoints: 1820.5,
    status: 'active',
    roster: MOCK_ROSTER
  },
  {
    id: '2',
    tournamentName: 'TopDog International',
    rank: 45678,
    totalTeams: 672672,
    points: 132.1,
    projectedPoints: 1756.2,
    status: 'active',
    roster: MOCK_ROSTER.map(p => ({ ...p, points: p.points * 0.9 }))
  },
  {
    id: '3',
    tournamentName: 'TopDog International',
    rank: 89012,
    totalTeams: 672672,
    points: 0,
    projectedPoints: 1698.4,
    status: 'pending',
    roster: MOCK_ROSTER.map(p => ({ ...p, points: 0 }))
  },
];

// Roster slot configuration
const ROSTER_SLOTS = [
  { label: 'QB', count: 1 },
  { label: 'RB', count: 2 },
  { label: 'WR', count: 3 },
  { label: 'TE', count: 1 },
  { label: 'FLEX', count: 2 },
  { label: 'BN', count: 9 },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MyTeamsTabVX({ 
  selectedTeam,
  setSelectedTeam,
  setDraftBoardTeam,
  setShowDraftBoard
}: MyTeamsTabVXProps): React.ReactElement {
  if (selectedTeam) {
    return (
      <TeamDetailView 
        team={selectedTeam}
        onBack={() => setSelectedTeam(null)}
        onViewDraftBoard={() => {
          setDraftBoardTeam?.(selectedTeam);
          setShowDraftBoard?.(true);
        }}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700/50">
        <h2 className="text-lg font-semibold text-white">My Teams</h2>
        <p className="text-sm text-gray-400">{MOCK_TEAMS.length} teams</p>
      </div>

      {/* Teams List */}
      <div 
        className="flex-1 overflow-y-auto"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div className="px-4 py-2 space-y-3">
          {MOCK_TEAMS.map((team) => (
            <TeamCard 
              key={team.id} 
              team={team} 
              onClick={() => setSelectedTeam(team)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TEAM CARD (List View)
// ============================================================================

interface TeamCardProps {
  team: MockTeam;
  onClick: () => void;
}

function TeamCard({ team, onClick }: TeamCardProps): React.ReactElement {
  const percentile = ((team.totalTeams - team.rank) / team.totalTeams * 100).toFixed(1);
  
  return (
    <button
      onClick={onClick}
      className="w-full p-4 rounded-xl bg-gray-800/50 border border-gray-700/50 text-left hover:bg-gray-700/50 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-white">{team.tournamentName}</h3>
        <span className={`px-2 py-1 text-xs font-bold rounded ${
          team.status === 'active' 
            ? 'bg-green-500/20 text-green-400'
            : team.status === 'eliminated'
            ? 'bg-red-500/20 text-red-400'
            : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {team.status.toUpperCase()}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-400">Rank:</span>
          <span className="text-white ml-2">
            {team.rank.toLocaleString()} / {team.totalTeams.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Percentile:</span>
          <span className="text-teal-400 ml-2">{percentile}%</span>
        </div>
      </div>
      
      <div className="mt-2 text-sm">
        <span className="text-gray-400">Points:</span>
        <span className="text-white ml-2">{team.points.toFixed(1)}</span>
        <span className="text-gray-500 ml-2">
          (Proj: {team.projectedPoints.toFixed(1)})
        </span>
      </div>
    </button>
  );
}

// ============================================================================
// TEAM DETAIL VIEW (Roster)
// ============================================================================

interface TeamDetailViewProps {
  team: MockTeam;
  onBack: () => void;
  onViewDraftBoard: () => void;
}

function TeamDetailView({ 
  team, 
  onBack, 
  onViewDraftBoard 
}: TeamDetailViewProps): React.ReactElement {
  const [viewMode, setViewMode] = useState<'roster' | 'stats'>('roster');
  const roster = team.roster || [];
  const percentile = ((team.totalTeams - team.rank) / team.totalTeams * 100).toFixed(1);

  // Organize players by position for roster view
  const getPlayersForSlot = (position: string, startIndex: number, count: number): RosterPlayer[] => {
    if (position === 'FLEX' || position === 'BN') {
      // For FLEX and BENCH, just take remaining players in order
      const starters = 1 + 2 + 3 + 1; // QB + RB + WR + TE
      const flexCount = 2;
      if (position === 'FLEX') {
        return roster.slice(starters, starters + flexCount);
      } else {
        return roster.slice(starters + flexCount);
      }
    }
    return roster.filter(p => p.position === position).slice(0, count);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Team Header */}
      <div className="px-4 py-3 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{team.tournamentName}</h2>
            <p className="text-sm text-gray-400">
              Rank: {team.rank.toLocaleString()} ({percentile}%)
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-white">{team.points.toFixed(1)}</div>
            <div className="text-xs text-gray-400">points</div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="px-4 py-2 border-b border-gray-700/50 flex gap-2">
        <button
          onClick={() => setViewMode('roster')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'roster'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}
        >
          Roster
        </button>
        <button
          onClick={onViewDraftBoard}
          className="flex-1 py-2 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 transition-colors"
        >
          Draft Board
        </button>
      </div>

      {/* Roster List */}
      <div 
        className="flex-1 overflow-y-auto"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div className="px-4 py-2 space-y-1">
          {roster.map((player, index) => (
            <RosterRow 
              key={`${player.name}-${index}`} 
              player={player}
              slotLabel={getSlotLabel(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Get slot label based on roster position
function getSlotLabel(index: number): string {
  if (index === 0) return 'QB';
  if (index <= 2) return 'RB';
  if (index <= 5) return 'WR';
  if (index === 6) return 'TE';
  if (index <= 8) return 'FLEX';
  return 'BN';
}

// ============================================================================
// ROSTER ROW
// ============================================================================

interface RosterRowProps {
  player: RosterPlayer;
  slotLabel: string;
}

function RosterRow({ player, slotLabel }: RosterRowProps): React.ReactElement {
  const positionColor = POSITION_COLORS[player.position];
  const isBench = slotLabel === 'BN';
  
  return (
    <div className={`flex items-center py-2 px-3 rounded-lg ${isBench ? 'bg-gray-800/30' : 'bg-gray-800/50'}`}>
      {/* Slot Label */}
      <div className="w-10 text-xs font-medium text-gray-500">
        {slotLabel}
      </div>
      
      {/* Position Badge */}
      <div 
        className="w-8 h-5 flex items-center justify-center rounded text-xs font-bold text-white mr-3"
        style={{ backgroundColor: positionColor }}
      >
        {player.position}
      </div>
      
      {/* Player Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white text-sm truncate">{player.name}</div>
        <div className="text-xs text-gray-400">{player.team} | Pick #{player.pickNumber}</div>
      </div>
      
      {/* Points */}
      <div className="text-right">
        <div className="font-bold text-white text-sm">{player.points.toFixed(1)}</div>
        <div className="text-xs text-gray-500">pts</div>
      </div>
    </div>
  );
}

// Export the MockTeam type for use in MobileAppVX
export type { MockTeam };
