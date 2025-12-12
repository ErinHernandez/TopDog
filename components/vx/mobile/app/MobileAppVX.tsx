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
import AppHeaderVX from '../shared/AppHeaderVX';
import MobileFooterAppVX, { type AppTab } from '../shared/MobileFooterAppVX';
import {
  LobbyTabVX,
  LiveDraftsTabVX,
  MyTeamsTabVX,
  ExposureTabVX,
  ProfileTabVX,
} from './tabs';
import AutodraftLimitsModalVX from './tabs/modals/AutodraftLimitsModalVX';
import RankingsModalVX from './tabs/modals/RankingsModalVX';
import DepositHistoryModalVX from './tabs/modals/DepositHistoryModalVX';
import WithdrawModalVX from './tabs/modals/WithdrawModalVX';

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
  const [showAutodraftModal, setShowAutodraftModal] = useState(false);
  const [showRankingsModal, setShowRankingsModal] = useState(false);
  const [rankingsHasUnsavedChanges, setRankingsHasUnsavedChanges] = useState(false);
  const [rankingsExternalCloseAttempt, setRankingsExternalCloseAttempt] = useState(false);
  const [showDepositHistoryModal, setShowDepositHistoryModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Handle tab parameter from URL
  useEffect(() => {
    if (router.isReady && router.query.tab) {
      const validTabs: AppTab[] = ['Lobby', 'Live Drafts', 'My Teams', 'Exposure', 'Profile'];
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
          <MyTeamsTabVX 
            selectedTeam={selectedTeam} 
            setSelectedTeam={setSelectedTeam}
            setDraftBoardTeam={setDraftBoardTeam}
            setShowDraftBoard={setShowDraftBoard}
          />
        );
      
      case 'Exposure':
        return <ExposureTabVX />;
      
      case 'Profile':
        return (
          <ProfileTabVX 
            onOpenAutodraftLimits={() => setShowAutodraftModal(true)}
            onOpenRankings={() => setShowRankingsModal(true)}
            onOpenDepositHistory={() => setShowDepositHistoryModal(true)}
            onOpenWithdraw={() => setShowWithdrawModal(true)}
          />
        );
      
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
        {/* App Header */}
        <AppHeaderVX
          showBackButton={activeTab === 'My Teams' && selectedTeam !== null}
          onBackClick={() => setSelectedTeam(null)}
          showDeposit={true}
          onLogoClick={() => {
            // Check if Rankings modal is open with unsaved changes
            if (showRankingsModal && rankingsHasUnsavedChanges) {
              setRankingsExternalCloseAttempt(true);
            } else {
              setShowRankingsModal(false);
              setActiveTab('Lobby');
            }
          }}
        />

        {/* Main Content - uses flex-1 to fill remaining space between header and footer */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
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

        {/* Autodraft Limits Modal */}
        <AutodraftLimitsModalVX
          isOpen={showAutodraftModal}
          onClose={() => setShowAutodraftModal(false)}
        />

        {/* Rankings Modal */}
        <RankingsModalVX
          isOpen={showRankingsModal}
          onClose={() => {
            setShowRankingsModal(false);
            setActiveTab('Lobby');
          }}
          onUnsavedChangesChange={setRankingsHasUnsavedChanges}
          externalCloseAttempt={rankingsExternalCloseAttempt}
          onExternalCloseHandled={() => setRankingsExternalCloseAttempt(false)}
        />

        {/* Deposit History Modal */}
        <DepositHistoryModalVX
          isOpen={showDepositHistoryModal}
          onClose={() => setShowDepositHistoryModal(false)}
        />

        {/* Withdraw Modal */}
        <WithdrawModalVX
          isOpen={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
        />
      </MobilePhoneContentVX>
    </MobilePhoneFrameVX>
  );
}

// ============================================================================
// COMPLETED DRAFT BOARD SHEET - REPLICATING DraftBoardVX LAYOUT
// ============================================================================

// Pixel-perfect constants matching DraftBoardVX
const COMPLETED_BOARD_PX = {
  // Cell dimensions (from DraftBoardVX)
  cellWidth: 92,
  cellHeight: 62,
  cellMargin: 1,
  cellBorderRadius: 6,
  cellBorderWidth: 4,
  
  // Team header
  headerHeight: 20,
  headerFontSize: 10,
  headerContentHeight: 70,
  
  // Pick cell content
  pickNumberFontSize: 8,
  firstNameFontSize: 10,
  lastNameFontSize: 11,
  posTeamFontSize: 9,
  
  // Nav header
  navPaddingX: 16,
  navPaddingY: 12,
  navBackButtonSize: 40,
  navBackIconSize: 24,
  
  // Footer
  footerPaddingX: 16,
  footerPaddingY: 12,
  footerButtonHeight: 48,
  footerButtonFontSize: 16,
  footerButtonBorderRadius: 12,
} as const;

const COMPLETED_BOARD_COLORS = {
  // Backgrounds
  background: '#101927',
  headerBg: '#1f2937',
  
  // Position colors (matching DraftBoardVX)
  QB: '#F472B6',
  RB: '#0fba80',
  WR: '#FBBF25',
  TE: '#7C3AED',
  
  // User colors
  userBorder: '#3B82F6',
  
  // Text
  white: '#ffffff',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  
  // Footer
  buttonBg: '#374151',
} as const;

interface CompletedDraftBoardSheetProps {
  team: SelectedTeam;
  onClose: () => void;
}

// Mock participants for completed draft
const MOCK_PARTICIPANTS = [
  { name: 'YOU', id: '1' },
  { name: 'FLIGHT800', id: '2' },
  { name: 'TITANIMPLOS1', id: '3' },
  { name: 'LOLITAEXPRES', id: '4' },
  { name: 'DRAFTER5', id: '5' },
  { name: 'DRAFTER6', id: '6' },
  { name: 'DRAFTER7', id: '7' },
  { name: 'DRAFTER8', id: '8' },
  { name: 'DRAFTER9', id: '9' },
  { name: 'DRAFTER10', id: '10' },
  { name: 'DRAFTER11', id: '11' },
  { name: 'DRAFTER12', id: '12' },
];

// Mock completed draft picks (full 18 rounds x 12 teams = 216 picks)
const generateMockPicks = () => {
  const players = [
    { name: "Ja'Marr Chase", pos: 'WR', team: 'CIN' },
    { name: 'Bijan Robinson', pos: 'RB', team: 'ATL' },
    { name: 'Jahmyr Gibbs', pos: 'RB', team: 'DET' },
    { name: 'CeeDee Lamb', pos: 'WR', team: 'DAL' },
    { name: 'Ladd McConkey', pos: 'WR', team: 'LAC' },
    { name: 'Trey McBride', pos: 'TE', team: 'ARI' },
    { name: 'Bucky Irving', pos: 'RB', team: 'TB' },
    { name: 'Chase Brown', pos: 'RB', team: 'CIN' },
    { name: 'Josh Allen', pos: 'QB', team: 'BUF' },
    { name: 'Lamar Jackson', pos: 'QB', team: 'BAL' },
    { name: 'Kyren Williams', pos: 'RB', team: 'LAR' },
    { name: 'Jaxon Smith-Njigba', pos: 'WR', team: 'SEA' },
    { name: 'Joe Burrow', pos: 'QB', team: 'CIN' },
    { name: 'Tetairoa McMillan', pos: 'WR', team: 'CAR' },
    { name: 'DK Metcalf', pos: 'WR', team: 'PIT' },
    { name: 'Breece Hall', pos: 'RB', team: 'NYJ' },
    { name: 'Chuba Hubbard', pos: 'RB', team: 'CAR' },
    { name: 'James Conner', pos: 'RB', team: 'ARI' },
    { name: 'DJ Moore', pos: 'WR', team: 'CHI' },
    { name: 'DeVonta Smith', pos: 'WR', team: 'PHI' },
    { name: 'Baker Mayfield', pos: 'QB', team: 'TB' },
    { name: 'Tyrone Tracy Jr.', pos: 'RB', team: 'NYG' },
    { name: 'Travis Hunter', pos: 'WR', team: 'JAC' },
    { name: 'Emeka Egbuka', pos: 'WR', team: 'TB' },
    { name: 'Chris Olave', pos: 'WR', team: 'NO' },
    { name: 'Bo Nix', pos: 'QB', team: 'DEN' },
    { name: 'Ricky Pearsall', pos: 'WR', team: 'SF' },
    { name: 'Jaylen Warren', pos: 'RB', team: 'PIT' },
    { name: 'Tyler Warren', pos: 'TE', team: 'IND' },
    { name: 'Jauan Jennings', pos: 'WR', team: 'SF' },
    { name: 'Brock Purdy', pos: 'QB', team: 'SF' },
    { name: 'Evan Engram', pos: 'TE', team: 'DEN' },
  ];
  
  const picks = [];
  const totalTeams = 12;
  const totalRounds = 18;
  
  for (let round = 1; round <= totalRounds; round++) {
    const isSnakeRound = round % 2 === 0;
    
    for (let pos = 1; pos <= totalTeams; pos++) {
      const actualPos = isSnakeRound ? totalTeams - pos + 1 : pos;
      const pickNumber = (round - 1) * totalTeams + actualPos;
      const displayPosition = pos;
      const participantIndex = displayPosition - 1;
      const playerIndex = (pickNumber - 1) % players.length;
      
      picks.push({
        pickNumber,
        round,
        position: displayPosition,
        participantIndex,
        player: players[playerIndex],
      });
    }
  }
  
  return picks.sort((a, b) => {
    if (a.round !== b.round) return a.round - b.round;
    return a.position - b.position;
  });
};

const MOCK_COMPLETED_PICKS = generateMockPicks();

function CompletedDraftBoardSheet({ team, onClose }: CompletedDraftBoardSheetProps): React.ReactElement {
  const totalTeams = MOCK_PARTICIPANTS.length;
  const totalRounds = 18;
  
  const getPositionColor = (pos: string): string => {
    return COMPLETED_BOARD_COLORS[pos as keyof typeof COMPLETED_BOARD_COLORS] as string || COMPLETED_BOARD_COLORS.gray500;
  };
  
  // Format pick number like DraftBoardVX: "1.01", "2.12", etc.
  const formatPickNumber = (pickNumber: number): string => {
    const round = Math.ceil(pickNumber / totalTeams);
    const posInRound = ((pickNumber - 1) % totalTeams) + 1;
    return `${round}.${String(posInRound).padStart(2, '0')}`;
  };

  // Group picks by round for rendering
  const picksByRound = Array.from({ length: totalRounds }, (_, i) => {
    const round = i + 1;
    return MOCK_COMPLETED_PICKS.filter(p => p.round === round);
  });

  return (
    <div 
      className="absolute inset-0 flex flex-col"
      style={{ 
        backgroundColor: COMPLETED_BOARD_COLORS.background,
        zIndex: 50,
      }}
    >
      {/* Navigation Header */}
      <div 
        className="flex items-center flex-shrink-0"
        style={{
          paddingLeft: `${COMPLETED_BOARD_PX.navPaddingX}px`,
          paddingRight: `${COMPLETED_BOARD_PX.navPaddingX}px`,
          paddingTop: `${COMPLETED_BOARD_PX.navPaddingY}px`,
          paddingBottom: `${COMPLETED_BOARD_PX.navPaddingY}px`,
          background: 'url(/wr_blue.png) no-repeat center center',
          backgroundSize: 'cover',
        }}
      >
        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-full hover:bg-white/10"
          style={{
            width: `${COMPLETED_BOARD_PX.navBackButtonSize}px`,
            height: `${COMPLETED_BOARD_PX.navBackButtonSize}px`,
          }}
        >
          <svg 
            width={COMPLETED_BOARD_PX.navBackIconSize} 
            height={COMPLETED_BOARD_PX.navBackIconSize} 
            viewBox="0 0 24 24" 
            fill="none"
          >
            <path 
              d="M15 19L8 12L15 5" 
              stroke={COMPLETED_BOARD_COLORS.white} 
              strokeWidth="2.5"
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          </svg>
        </button>
        <div className="flex-1 flex justify-center">
          <img
            src="/logo.png"
            alt="TopDog"
            style={{ height: '48px', width: 'auto' }}
          />
        </div>
        <div style={{ width: `${COMPLETED_BOARD_PX.navBackButtonSize}px` }} />
      </div>

      {/* Scrollable Draft Board */}
      <div 
        className="flex-1 overflow-auto"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Team Headers - Sticky */}
        <div 
          className="sticky top-0 z-10"
          style={{ 
            backgroundColor: COMPLETED_BOARD_COLORS.background,
            paddingTop: '8px',
          }}
        >
          <div 
            className="flex"
            style={{ 
              minWidth: `${totalTeams * (COMPLETED_BOARD_PX.cellWidth + COMPLETED_BOARD_PX.cellMargin * 2)}px`,
              width: 'max-content',
            }}
          >
            {MOCK_PARTICIPANTS.map((participant, index) => {
              const isUser = index === 0;
              const borderColor = isUser ? COMPLETED_BOARD_COLORS.userBorder : '#6B7280';
              
              return (
                <div 
                  key={participant.id}
                  className="flex-shrink-0 flex flex-col"
                  style={{ 
                    margin: `${COMPLETED_BOARD_PX.cellMargin}px`,
                    minWidth: `${COMPLETED_BOARD_PX.cellWidth}px`,
                    width: `${COMPLETED_BOARD_PX.cellWidth}px`,
                    borderRadius: `${COMPLETED_BOARD_PX.cellBorderRadius}px`,
                    border: `${COMPLETED_BOARD_PX.cellBorderWidth}px solid ${borderColor}`,
                    backgroundColor: COMPLETED_BOARD_COLORS.headerBg,
                    overflow: 'hidden',
                  }}
                >
                  {/* Username Header */}
                  <div 
                    className="text-center font-medium flex items-center justify-center px-1"
                    style={{ 
                      height: `${COMPLETED_BOARD_PX.headerHeight}px`,
                      fontSize: `${COMPLETED_BOARD_PX.headerFontSize}px`,
                      textTransform: 'uppercase',
                      backgroundColor: borderColor,
                      color: COMPLETED_BOARD_COLORS.white,
                    }}
                  >
                    {participant.name.length > 12 
                      ? participant.name.substring(0, 12) 
                      : participant.name
                    }
                  </div>
                  
                  {/* Spacer for header alignment */}
                  <div style={{ height: `${COMPLETED_BOARD_PX.headerContentHeight}px` }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Draft Grid */}
        <div>
          {picksByRound.map((roundPicks, roundIndex) => (
            <div 
              key={roundIndex}
              className="flex"
              style={{ 
                minWidth: `${totalTeams * (COMPLETED_BOARD_PX.cellWidth + COMPLETED_BOARD_PX.cellMargin * 2)}px`,
                width: 'max-content',
              }}
            >
              {roundPicks.map((pickData) => {
                const isUserPick = pickData.participantIndex === 0;
                const posColor = getPositionColor(pickData.player.pos);
                
                return (
                  <div
                    key={pickData.pickNumber}
                    className="flex-shrink-0 transition-colors"
                    style={{
                      minWidth: `${COMPLETED_BOARD_PX.cellWidth}px`,
                      width: `${COMPLETED_BOARD_PX.cellWidth}px`,
                      margin: `${COMPLETED_BOARD_PX.cellMargin}px`,
                      marginTop: roundIndex === 0 ? '7px' : `${COMPLETED_BOARD_PX.cellMargin}px`,
                      borderRadius: `${COMPLETED_BOARD_PX.cellBorderRadius}px`,
                      border: `${COMPLETED_BOARD_PX.cellBorderWidth}px solid ${posColor}`,
                      backgroundColor: `${posColor}20`,
                    }}
                  >
                    <div 
                      className="flex flex-col" 
                      style={{ 
                        height: `${COMPLETED_BOARD_PX.cellHeight}px`, 
                        padding: '2px 3px',
                      }}
                    >
                      {/* Pick number - top left */}
                      <div 
                        className="font-medium flex-shrink-0"
                        style={{ 
                          fontSize: `${COMPLETED_BOARD_PX.pickNumberFontSize}px`,
                          lineHeight: '1',
                          marginTop: '2px',
                          marginLeft: '1px',
                          color: COMPLETED_BOARD_COLORS.white,
                        }}
                      >
                        {formatPickNumber(pickData.pickNumber)}
                      </div>
                      
                      {/* Content area */}
                      <div className="flex-1 flex flex-col justify-center items-center">
                        {/* First name */}
                        <div 
                          className="font-bold text-center truncate w-full"
                          style={{ 
                            fontSize: `${COMPLETED_BOARD_PX.firstNameFontSize}px`,
                            lineHeight: '1.2',
                            marginTop: '-1px',
                            color: COMPLETED_BOARD_COLORS.white,
                          }}
                        >
                          {pickData.player.name.split(' ')[0]}
                        </div>
                        
                        {/* Last name */}
                        <div 
                          className="font-bold text-center truncate w-full"
                          style={{ 
                            fontSize: `${COMPLETED_BOARD_PX.lastNameFontSize}px`,
                            lineHeight: '1.2',
                            color: COMPLETED_BOARD_COLORS.white,
                          }}
                        >
                          {pickData.player.name.split(' ').slice(1).join(' ') || pickData.player.name}
                        </div>
                        
                        {/* Position-Team */}
                        <div 
                          className="text-center"
                          style={{ 
                            fontSize: `${COMPLETED_BOARD_PX.posTeamFontSize}px`,
                            lineHeight: '1.2',
                            marginTop: '6px',
                            color: COMPLETED_BOARD_COLORS.white,
                          }}
                        >
                          {pickData.player.pos}-{pickData.player.team}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div 
        className="flex-shrink-0"
        style={{
          paddingLeft: `${COMPLETED_BOARD_PX.footerPaddingX}px`,
          paddingRight: `${COMPLETED_BOARD_PX.footerPaddingX}px`,
          paddingTop: `${COMPLETED_BOARD_PX.footerPaddingY}px`,
          paddingBottom: `${COMPLETED_BOARD_PX.footerPaddingY}px`,
          backgroundColor: COMPLETED_BOARD_COLORS.background,
          borderTop: `1px solid #374151`,
        }}
      >
        <button
          onClick={onClose}
          className="w-full font-semibold transition-colors hover:bg-gray-600"
          style={{
            backgroundColor: COMPLETED_BOARD_COLORS.buttonBg,
            color: COMPLETED_BOARD_COLORS.white,
            height: `${COMPLETED_BOARD_PX.footerButtonHeight}px`,
            fontSize: `${COMPLETED_BOARD_PX.footerButtonFontSize}px`,
            borderRadius: `${COMPLETED_BOARD_PX.footerButtonBorderRadius}px`,
          }}
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

