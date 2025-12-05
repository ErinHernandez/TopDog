/**
 * MobileAppVX - Main Mobile App Orchestrator (TypeScript)
 * 
 * Migrated from: components/mobile/pages/MobileHomeContent.js
 * 
 * Main mobile app container with tab navigation
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MobilePhoneFrameVX, { MobilePhoneContentVX } from '../shared/MobilePhoneFrameVX';
import MobileHeaderVX from '../shared/MobileHeaderVX';
import MobileFooterAppVX, { type AppTab } from '../shared/MobileFooterAppVX';
import {
  LobbyTabVX,
  LiveDraftsTabVX,
  MyTeamsTabVX,
  ExposureTabVX,
  ProfileTabVX,
} from './tabs';

// ============================================================================
// TYPES
// ============================================================================

export interface MobileAppVXProps {
  /** Initial tab to show */
  initialTab?: AppTab;
}

interface SelectedTeam {
  id: string;
  tournamentName: string;
  rank: number;
  totalTeams: number;
  points: number;
  projectedPoints: number;
  status: 'active' | 'eliminated' | 'pending';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MobileAppVX({ 
  initialTab = 'Lobby' 
}: MobileAppVXProps): React.ReactElement {
  const router = useRouter();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<AppTab>(initialTab);
  
  // Team selection state (for My Teams tab)
  const [selectedTeam, setSelectedTeam] = useState<SelectedTeam | null>(null);
  
  // Draft board state
  const [showDraftBoard, setShowDraftBoard] = useState(false);
  const [draftBoardTeam, setDraftBoardTeam] = useState<SelectedTeam | null>(null);
  
  // Modal states
  const [showTournamentModal, setShowTournamentModal] = useState(false);

  // Handle tab parameter from URL
  useEffect(() => {
    if (router.isReady && router.query.tab) {
      const validTabs: AppTab[] = ['Lobby', 'My Teams', 'Exposure', 'Profile'];
      if (validTabs.includes(router.query.tab as AppTab)) {
        setActiveTab(router.query.tab as AppTab);
      }
    }
  }, [router.isReady, router.query.tab]);

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'Lobby':
        return <LobbyTabVX onJoinClick={() => setShowTournamentModal(true)} />;
      
      case 'Live Drafts':
        return (
          <LiveDraftsTabVX 
            onJoinDraft={() => {
              setActiveTab('Lobby');
              setShowTournamentModal(true);
            }}
            onEnterDraft={(draftId) => {
              // Navigate to VX draft room (would pass draftId in real implementation)
              router.push('/testing-grounds/vx-mobile-demo');
            }}
          />
        );
      
      case 'My Teams':
        return (
          <div className="flex-1 min-h-0">
            <MyTeamsTabVX 
              selectedTeam={selectedTeam} 
              setSelectedTeam={setSelectedTeam}
              setDraftBoardTeam={setDraftBoardTeam}
              setShowDraftBoard={setShowDraftBoard}
            />
          </div>
        );
      
      case 'Exposure':
        return (
          <div className="flex-1 min-h-0">
            <ExposureTabVX />
          </div>
        );
      
      case 'Profile':
        return <ProfileTabVX />;
      
      default:
        return (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-2">Coming Soon</h2>
              <p className="text-gray-400">This feature is under development</p>
            </div>
          </div>
        );
    }
  };

  return (
    <MobilePhoneFrameVX>
      <MobilePhoneContentVX>
        {/* Mobile Header */}
        <MobileHeaderVX
          showBackButton={activeTab === 'My Teams' && selectedTeam !== null}
          onBackClick={() => setSelectedTeam(null)}
          showDepositButton={true}
        />

        {/* Main Content */}
        <div 
          className="flex flex-col overflow-hidden"
          style={{ 
            height: (activeTab === 'Exposure' || activeTab === 'My Teams')
              ? 'calc(100% - 80px + 15px)'
              : 'calc(100% - 60px - 80px)'
          }}
        >
          {renderTabContent()}
        </div>

        {/* Mobile Footer Navigation */}
        <MobileFooterAppVX 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onTabClick={() => {}} 
        />

        {/* Tournament Modal */}
        {showTournamentModal && (
          <div 
            className="absolute inset-0 bg-black/80 flex items-center justify-center z-50"
            onClick={() => setShowTournamentModal(false)}
          >
            <div 
              className="bg-gray-800 rounded-xl p-6 m-4 max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-4">Join Tournament</h2>
              <p className="text-gray-400 mb-2">The TopDog International</p>
              <p className="text-sm text-gray-500 mb-6">Entry: $25 | 12-team draft</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTournamentModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowTournamentModal(false);
                    // Navigate to VX draft room
                    router.push('/testing-grounds/vx-mobile-demo');
                  }}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Join Draft
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Completed Draft Board Sheet */}
        {showDraftBoard && draftBoardTeam && (
          <CompletedDraftBoardSheet
            team={draftBoardTeam}
            onClose={() => {
              setShowDraftBoard(false);
              setDraftBoardTeam(null);
            }}
          />
        )}
      </MobilePhoneContentVX>
    </MobilePhoneFrameVX>
  );
}

// ============================================================================
// COMPLETED DRAFT BOARD SHEET
// ============================================================================

interface CompletedDraftBoardSheetProps {
  team: SelectedTeam;
  onClose: () => void;
}

// Mock completed draft data
const MOCK_DRAFT_PICKS = [
  // Round 1
  { pick: 1, player: "Ja'Marr Chase", pos: 'WR', team: 'CIN', drafter: 'Team 1' },
  { pick: 2, player: 'CeeDee Lamb', pos: 'WR', team: 'DAL', drafter: 'Team 2' },
  { pick: 3, player: 'Tyreek Hill', pos: 'WR', team: 'MIA', drafter: 'Team 3' },
  { pick: 4, player: 'Bijan Robinson', pos: 'RB', team: 'ATL', drafter: 'Team 4' },
  { pick: 5, player: 'Saquon Barkley', pos: 'RB', team: 'PHI', drafter: 'YOU' },
  { pick: 6, player: 'Breece Hall', pos: 'RB', team: 'NYJ', drafter: 'Team 6' },
  { pick: 7, player: 'Amon-Ra St. Brown', pos: 'WR', team: 'DET', drafter: 'Team 7' },
  { pick: 8, player: 'Garrett Wilson', pos: 'WR', team: 'NYJ', drafter: 'Team 8' },
  { pick: 9, player: 'Puka Nacua', pos: 'WR', team: 'LAR', drafter: 'Team 9' },
  { pick: 10, player: 'Chris Olave', pos: 'WR', team: 'NO', drafter: 'Team 10' },
  { pick: 11, player: 'Jahmyr Gibbs', pos: 'RB', team: 'DET', drafter: 'Team 11' },
  { pick: 12, player: 'A.J. Brown', pos: 'WR', team: 'PHI', drafter: 'Team 12' },
  // Round 2
  { pick: 13, player: 'Davante Adams', pos: 'WR', team: 'LV', drafter: 'Team 12' },
  { pick: 14, player: 'Travis Kelce', pos: 'TE', team: 'KC', drafter: 'Team 11' },
  { pick: 15, player: 'Josh Allen', pos: 'QB', team: 'BUF', drafter: 'Team 10' },
  { pick: 16, player: 'Kyren Williams', pos: 'RB', team: 'LAR', drafter: 'Team 9' },
  { pick: 17, player: 'Jonathan Taylor', pos: 'RB', team: 'IND', drafter: 'Team 8' },
  { pick: 18, player: 'Stefon Diggs', pos: 'WR', team: 'HOU', drafter: 'Team 7' },
  { pick: 19, player: 'DeVonta Smith', pos: 'WR', team: 'PHI', drafter: 'Team 6' },
  { pick: 20, player: "De'Von Achane", pos: 'RB', team: 'MIA', drafter: 'YOU' },
  { pick: 21, player: 'Mike Evans', pos: 'WR', team: 'TB', drafter: 'Team 4' },
  { pick: 22, player: 'Travis Etienne', pos: 'RB', team: 'JAX', drafter: 'Team 3' },
  { pick: 23, player: 'DK Metcalf', pos: 'WR', team: 'SEA', drafter: 'Team 2' },
  { pick: 24, player: 'Deebo Samuel', pos: 'WR', team: 'SF', drafter: 'Team 1' },
];

const POSITION_COLORS_MAP: Record<string, string> = {
  QB: '#F472B6',
  RB: '#0fba80',
  WR: '#FBBF25',
  TE: '#7C3AED',
};

function CompletedDraftBoardSheet({ team, onClose }: CompletedDraftBoardSheetProps): React.ReactElement {
  return (
    <div className="absolute inset-0 bg-black/90 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50 bg-gray-900">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 19L8 12L15 5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="text-center flex-1">
          <div className="text-white font-semibold">Completed Draft Board</div>
          <div className="text-xs text-gray-400">{team.tournamentName}</div>
        </div>
        <div className="w-10" />
      </div>

      {/* Draft Stats */}
      <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700/50">
        <div className="flex justify-around text-center text-sm">
          <div>
            <div className="text-white font-bold">12</div>
            <div className="text-xs text-gray-400">Teams</div>
          </div>
          <div>
            <div className="text-white font-bold">18</div>
            <div className="text-xs text-gray-400">Rounds</div>
          </div>
          <div>
            <div className="text-white font-bold">216</div>
            <div className="text-xs text-gray-400">Total Picks</div>
          </div>
        </div>
      </div>

      {/* Draft Board Grid */}
      <div 
        className="flex-1 overflow-auto"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div className="p-2">
          {/* Round Headers */}
          {[1, 2].map((round) => (
            <div key={round} className="mb-4">
              <div className="text-xs text-gray-400 mb-2 px-1">Round {round}</div>
              <div className="grid grid-cols-4 gap-1">
                {MOCK_DRAFT_PICKS
                  .filter(p => Math.ceil(p.pick / 12) === round)
                  .map((pick) => {
                    const isYourPick = pick.drafter === 'YOU';
                    return (
                      <div
                        key={pick.pick}
                        className={`p-2 rounded text-center ${
                          isYourPick 
                            ? 'bg-teal-600/30 border border-teal-500/50' 
                            : 'bg-gray-800/80'
                        }`}
                      >
                        <div className="text-xs text-gray-500 mb-1">#{pick.pick}</div>
                        <div 
                          className="text-xs font-bold px-1 py-0.5 rounded mx-auto w-fit"
                          style={{ backgroundColor: POSITION_COLORS_MAP[pick.pos], color: 'white' }}
                        >
                          {pick.pos}
                        </div>
                        <div className="text-xs text-white mt-1 truncate">{pick.player.split(' ').pop()}</div>
                        <div className="text-xs text-gray-500">{pick.team}</div>
                        {isYourPick && (
                          <div className="text-xs text-teal-400 font-bold mt-1">YOU</div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
          
          {/* Show more rounds indicator */}
          <div className="text-center py-4 text-gray-500 text-sm">
            Showing rounds 1-2 of 18
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-700/50 bg-gray-900">
        <button
          onClick={onClose}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// DEMO EXPORT
// ============================================================================

/**
 * MobileAppVXDemo - Demo wrapper for testing
 */
export function MobileAppVXDemo(): React.ReactElement {
  return <MobileAppVX />;
}

