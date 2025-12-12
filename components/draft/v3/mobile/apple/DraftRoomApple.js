/**
 * Draft Room V3 - Apple/iOS Optimized
 * 
 * Native iOS feel with streamlined features:
 * - Touch-optimized interactions
 * - iOS design patterns and animations
 * - Gesture-driven navigation
 * - Performance-focused components
 */

import React, { useState, useRef, useEffect } from 'react';
import { MOBILE_SIZES, PLATFORM_SPECIFIC } from '../shared/constants/mobileSizes';
import MobileNavbarApple from './components/MobileNavbarApple';
import PicksBarApple from './components/PicksBarApple';
import PlayerListApple from './components/PlayerListApple';
import RosterPage from './components/RosterPage';
import QueuePage from './components/QueuePage';
import QuickActionsApple from './components/QuickActionsApple';
import MobileFooterApple from './components/MobileFooterApple';
import DraftBoardContainer from './components/DraftBoardContainer';
import DraftBoard3Apple from './components/DraftBoard3Apple';
import LoadingSpinner from '../../../../LoadingSpinner';
import RippleEffect from './components/RippleEffect';

export default function DraftRoomApple({ roomId, mockState: propMockState, setMockState: propSetMockState }) {
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Ripple effect state
  const [showRipple, setShowRipple] = useState(false);
  
  // Simplified state for mobile experience (use props if available, otherwise local state)
  const [localMockState, setLocalMockState] = useState({
    // Draft state (simplified)
    currentPickNumber: 1,
    isDraftActive: false, // Start with draft inactive
    isPaused: false,
    isMockDraft: false,
    timer: 30,
    isMyTurn: false, // User is not on the clock until draft starts
    
    // Participants (12-team)
    participants: [
      { name: 'NOTTODDMIDDLETON', team: 'TopDogs' },
      { name: 'FLIGHT800', team: 'AirForce' },
      { name: 'TITANIMPLOSION', team: 'BigBang' },
      { name: 'LOLITAEXPRESS', team: 'FastLane' },
      { name: 'BPWASFRAMED', team: 'Justice' },
      { name: 'SEXWORKISWORK', team: 'Labor' },
      { name: 'TRAPPEDINTHECLOSET', team: 'Secrets' },
      { name: 'KANYEAPOLOGISTS', team: 'YeStans' },
      { name: 'ICEWALL', team: 'ColdTruth' },
      { name: 'MOONLANDINGFAKE', team: 'Hoax' },
      { name: 'BIRDSARENTREAL', team: 'Drones' },
      { name: 'CHEMTRAILSROCK', team: 'SkyWriters' }
    ],
    
    // Draft picks (start with empty array - draft hasn't started)
    picks: [],
    
    // Available players (simplified data)
    availablePlayers: [
      { name: 'Ja\'Marr Chase', position: 'WR', team: 'CIN', adp: 1.1 },
      { name: 'Bijan Robinson', position: 'RB', team: 'ATL', adp: 2.8 },
      { name: 'Justin Jefferson', position: 'WR', team: 'MIN', adp: 3.1 },
      { name: 'Saquon Barkley', position: 'RB', team: 'PHI', adp: 3.7 },
      { name: 'Amon-Ra St. Brown', position: 'WR', team: 'DET', adp: 4.1 },
      { name: 'Puka Nacua', position: 'WR', team: 'LAR', adp: 4.3 },
      { name: 'Jahmyr Gibbs', position: 'RB', team: 'DET', adp: 5.4 }
    ],
    
    // User's team (simplified)
    userTeam: []
  });

  // Use props if available, otherwise use local state
  const mockState = propMockState || localMockState;
  const setMockState = propSetMockState || setLocalMockState;

  // Simulate loading for mobile initialization
  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // 1.5 second loading simulation

    return () => clearTimeout(loadingTimer);
  }, []);

  // Mobile-specific UI state
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [activeTab, setActiveTab] = useState('Players');
  const [selectedParticipantIndex, setSelectedParticipantIndex] = useState(0);
  const [queuedPlayers, setQueuedPlayers] = useState([]);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // Listen for footer navigation events
  React.useEffect(() => {
    const handleShowTeam = () => setActiveTab('Rosters');
    const handleShowQueue = () => setActiveTab('Queue');
    const handleShowBoard = () => setActiveTab('Board');
    const handleShowInfo = () => setActiveTab('Info');
    
    window.addEventListener('showTeamModal', handleShowTeam);
    window.addEventListener('showQueueModal', handleShowQueue);
    window.addEventListener('showBoardModal', handleShowBoard);
    window.addEventListener('showInfoModal', handleShowInfo);
    
    return () => {
      window.removeEventListener('showTeamModal', handleShowTeam);
      window.removeEventListener('showQueueModal', handleShowQueue);
      window.removeEventListener('showBoardModal', handleShowBoard);
      window.removeEventListener('showInfoModal', handleShowInfo);
    };
  }, []);
  
  // Refs for mobile scroll management
  const picksScrollRef = useRef(null);
  const playersScrollRef = useRef(null);

  // Mobile-optimized handlers
  const handleDraftPlayer = (player) => {
    console.log('Draft player:', player);
    
    // Check if it's actually the user's turn
    if (!mockState.isMyTurn) {
      console.log('❌ Not your turn to draft');
      return;
    }

    // Check if player is available
    const isPlayerAvailable = mockState.availablePlayers.some(p => p.name === player.name);
    if (!isPlayerAvailable) {
      console.log('❌ Player not available:', player.name);
      return;
    }

    // Draft the player
    setMockState(prevState => {
      const currentPick = prevState.currentPickNumber;
      
      // Create the pick object
      const newPick = {
        pickNumber: currentPick,
        player: player,
        timestamp: Date.now(),
        teamCompositionAtTime: getTrackerColor(player, prevState, currentPick)
      };
      
      // Remove picked player from available players
      const updatedAvailablePlayers = prevState.availablePlayers.filter(p => p.name !== player.name);
      
      // Remove player from queue if they were queued
      setQueuedPlayers(prevQueue => prevQueue.filter(queuedPlayer => queuedPlayer.name !== player.name));
      
      // Advance to next pick
      const nextPickNumber = currentPick + 1;
      const nextParticipantIndex = getParticipantIndexForPick(nextPickNumber, prevState.participants.length);
      const isUserTurn = nextParticipantIndex === 0; // Assume user is first participant
      
      console.log(`✅ Drafted: ${player.name} (${player.position}) - Pick ${currentPick}`);
      console.log(`⏭️ Next up: Pick ${nextPickNumber} - ${isUserTurn ? 'Your turn' : 'CPU turn'}`);
      
      return {
        ...prevState,
        picks: [...prevState.picks, newPick],
        availablePlayers: updatedAvailablePlayers,
        currentPickNumber: nextPickNumber,
        timer: 30, // Reset timer for next pick
        isMyTurn: isUserTurn,
        isInGracePeriod: false, // Reset grace period
        isAutopickTriggered: false // Reset autopick flag
      };
    });
  };

  // Helper function to get participant index for a given pick number
  const getParticipantIndexForPick = (pickNumber, totalParticipants) => {
    const round = Math.ceil(pickNumber / totalParticipants);
    const isSnakeRound = round % 2 === 0;
    const pickIndexInRound = (pickNumber - 1) % totalParticipants;
    return isSnakeRound 
      ? totalParticipants - 1 - pickIndexInRound 
      : pickIndexInRound;
  };

  // Helper function to get tracker color based on team needs
  const getTrackerColor = (player, state, pickNumber) => {
    const participantIndex = getParticipantIndexForPick(pickNumber, state.participants.length);
    
    // Get current picks for this participant
    const participantPicks = state.picks.filter(p => {
      const pParticipantIndex = getParticipantIndexForPick(p.pickNumber, state.participants.length);
      return pParticipantIndex === participantIndex && p.player;
    });
    
    const positionCounts = {
      QB: participantPicks.filter(p => p.player.position === 'QB').length,
      RB: participantPicks.filter(p => p.player.position === 'RB').length,
      WR: participantPicks.filter(p => p.player.position === 'WR').length,
      TE: participantPicks.filter(p => p.player.position === 'TE').length
    };
    
    // Add the current pick to counts
    positionCounts[player.position]++;
    
    // Determine tracker color based on most needed position after this pick
    const maxCount = Math.max(...Object.values(positionCounts));
    const minCount = Math.min(...Object.values(positionCounts));
    
    if (minCount !== maxCount) {
      // Find position with least players
      for (const [position, count] of Object.entries(positionCounts)) {
        if (count === minCount) {
          const colors = {
            QB: '#F472B6',
            RB: '#0fba80',
            WR: '#FBBF25',
            TE: '#7C3AED'
          };
          return colors[position];
        }
      }
    }
    
    return '#6B7280'; // Default grey
  };

  const handleQueuePlayer = (player) => {
    console.log('Queue player:', player);
    // Toggle player in queue - add if not queued, remove if already queued
    setQueuedPlayers(prevQueue => {
      const isAlreadyQueued = prevQueue.some(queuedPlayer => queuedPlayer.name === player.name);
      if (isAlreadyQueued) {
        console.log('Removing player from queue:', player.name);
        return prevQueue.filter(queuedPlayer => queuedPlayer.name !== player.name);
      } else {
        console.log('Adding player to queue:', player.name);
        return [...prevQueue, player];
      }
    });
  };

  // Handle clicking on a player card in picks bar
  const handlePlayerCardClick = (pickNumber) => {
    // Calculate which participant this pick belongs to using snake draft logic
    const round = Math.ceil(pickNumber / mockState.participants.length);
    const isSnakeRound = round % 2 === 0;
    const pickIndexInRound = (pickNumber - 1) % mockState.participants.length;
    const participantIndex = isSnakeRound 
      ? mockState.participants.length - 1 - pickIndexInRound 
      : pickIndexInRound;
    
    // Switch to roster tab and select the participant
    setActiveTab('Rosters');
    setSelectedParticipantIndex(participantIndex);
    
    console.log(`Clicked pick ${pickNumber}, switching to participant ${participantIndex}: ${mockState.participants[participantIndex]?.name}`);
  };



  // Show loading spinner while initializing
  if (isLoading) {
    return (
      <div className="w-full h-full bg-[#101927] flex items-center justify-center">
        <LoadingSpinner message="Loading draft room..." size="large" />
      </div>
    );
  }

  return (
    <div 
      className="w-full h-full bg-[#101927] text-white relative"
      style={{
        paddingBottom: PLATFORM_SPECIFIC.IOS.SAFE_AREA_BOTTOM, // Just safe area, no extra padding
        paddingLeft: '0px',
        paddingRight: '0px'
      }}
    >
      {/* Mobile Navbar */}
      <MobileNavbarApple 
        title="Draft Room"
        showBack={true}
        isMyTurn={mockState.isMyTurn}
        timer={mockState.timer}
        isDraftActive={mockState.isDraftActive}
        participantCount={mockState.participants.length}
        roomId={roomId}
      />
      


      {/* Horizontal Picks Bar - Hidden on Board tab */}
      {activeTab !== 'Board' && (
        <div style={{ height: `${parseInt(MOBILE_SIZES.PICKS_BAR.height) * 1.35}px`, marginBottom: '16px', paddingBottom: '8px' }}>
          <PicksBarApple
            picks={mockState.picks}
            participants={mockState.participants}
            currentPickNumber={mockState.currentPickNumber}
            isDraftActive={mockState.isDraftActive}
            timer={mockState.timer}
            isInGracePeriod={mockState.isInGracePeriod}
            isMyTurn={mockState.isMyTurn}
            scrollRef={picksScrollRef}
            onPlayerCardClick={handlePlayerCardClick}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
        {activeTab === 'Players' && (
          <>
        {/* Available Players List */}
        <PlayerListApple
          players={mockState.availablePlayers}
          onDraftPlayer={handleDraftPlayer}
          onQueuePlayer={handleQueuePlayer}
          onPlayerSelect={setSelectedPlayer}
          scrollRef={playersScrollRef}
          isMyTurn={mockState.isMyTurn}
          queuedPlayers={queuedPlayers}
          picks={mockState.picks}
          participants={mockState.participants}
        />
        
        {/* Floating Quick Actions (iOS Style) */}
        <QuickActionsApple
          selectedPlayer={selectedPlayer}
          onDraft={handleDraftPlayer}
          onQueue={handleQueuePlayer}
          isMyTurn={mockState.isMyTurn}
        />
          </>
        )}

        {activeTab === 'Queue' && (
          <QueuePage
            queuedPlayers={queuedPlayers}
            onRemoveFromQueue={(playerToRemove) => {
              setQueuedPlayers(prevQueue => 
                prevQueue.filter(player => player.name !== playerToRemove.name)
              );
            }}
            onReorderQueue={(newQueue) => {
              setQueuedPlayers(newQueue);
            }}
            onDraftPlayer={handleDraftPlayer}
            isMyTurn={mockState.isMyTurn}
          />
        )}

        {activeTab === 'Rosters' && (
          <RosterPage
            participants={mockState.participants}
            picks={mockState.picks}
            selectedParticipantIndex={selectedParticipantIndex}
            onParticipantChange={setSelectedParticipantIndex}
            onDraftPlayer={handleDraftPlayer}
            isMyTurn={mockState.isMyTurn}
          />
        )}

        {activeTab === 'Board' && (
          <DraftBoardContainer
            picks={mockState.picks}
            participants={mockState.participants}
            currentPickNumber={mockState.currentPickNumber}
            isDraftActive={mockState.isDraftActive}
            timer={mockState.timer}
            activeTab={activeTab}
            hasNavbar={true}
            hasFooter={true}
            hasPicksBar={false}
            isStandalone={false}
          />
        )}

        {activeTab === 'Info' && (
          <div style={{ paddingBottom: '8px' }}>
            <style jsx>{`
              .draft-info-scroll::-webkit-scrollbar {
                width: 0px !important;
                height: 0px !important;
                display: none !important;
              }
              .draft-info-scroll::-webkit-scrollbar-track {
                background: transparent;
              }
              .draft-info-scroll::-webkit-scrollbar-thumb {
                background-color: transparent;
              }
              .draft-info-scroll::-webkit-scrollbar-thumb:hover {
                background-color: transparent;
              }
              .draft-info-scroll {
                scrollbar-width: none !important;
                -ms-overflow-style: none !important;
                -webkit-overflow-scrolling: touch !important;
              }
              @media (max-width: 768px) {
                .draft-info-scroll::-webkit-scrollbar {
                  display: none !important;
                  width: 0 !important;
                  height: 0 !important;
                }
                .draft-info-scroll {
                  scrollbar-width: none !important;
                  -ms-overflow-style: none !important;
                  -webkit-overflow-scrolling: touch !important;
                }
              }
            `}</style>
            <div 
              className="overflow-y-auto draft-info-scroll" 
              style={{ 
                height: '600px',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              <div className="px-4 pt-0 pb-16">
                <div className="text-center">
              
              {/* Draft Details */}
              <div className="bg-gray-800/40 rounded-lg p-4 mb-4 text-left">
                <h3 className="text-lg font-medium text-white mb-3">Draft Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Entry:</span>
                    <span className="text-white">$25</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Entrants:</span>
                    <span className="text-white">672,672</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Prizes:</span>
                    <span className="text-white">$15M</span>
                  </div>
                </div>
              </div>

              {/* Basic Tournament Info */}
              <div className="bg-gray-800/40 rounded-lg p-4 mb-4 text-left">
                <h3 className="text-lg font-medium text-white mb-3">Basic tournament info</h3>
                
                {/* Round Advancement - Full Width */}
                <div className="mb-4">
                  <div className="text-gray-400 mb-1">Round Advancement:</div>
                  <div className="text-white">2/12 - 1/13 - 1/16 - 539 Seat Final</div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {/* Left Column */}
                  <div className="space-y-3">
                    <div>
                      <div className="text-gray-400">Sport</div>
                      <div className="text-white">NFL</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Fill</div>
                      <div className="text-white">100%</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Rake</div>
                      <div className="text-white">10.8%</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Game type</div>
                      <div className="text-white">NFL Best Ball</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Draft rounds</div>
                      <div className="text-white">18</div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-3">
                    <div>
                      <div className="text-gray-400">Current entrants</div>
                      <div className="text-white">672,672</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Tournament rounds</div>
                      <div className="text-white">4</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Max entries</div>
                      <div className="text-white">150</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Draft size</div>
                      <div className="text-white">12</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Start time</div>
                      <div className="text-white">9/04/25 8:00PM EDT</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tournament Prize Breakdown */}
              <div className="bg-gray-800/40 rounded-lg p-4 mb-4 text-left">
                <h3 className="text-lg font-medium text-white mb-3">Tournament prize breakdown</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {/* Left Column */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">1st:</span>
                      <span className="text-white">$2,000,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">2nd:</span>
                      <span className="text-white">$1,000,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">3rd:</span>
                      <span className="text-white">$504,370</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">4th:</span>
                      <span className="text-white">$400,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">5th:</span>
                      <span className="text-white">$300,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">6th:</span>
                      <span className="text-white">$250,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">7th:</span>
                      <span className="text-white">$200,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">8th:</span>
                      <span className="text-white">$175,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">9th:</span>
                      <span className="text-white">$150,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">10th:</span>
                      <span className="text-white">$125,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">11 - 15th:</span>
                      <span className="text-white">$100,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">16 - 20th:</span>
                      <span className="text-white">$70,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">21 - 30th:</span>
                      <span className="text-white">$50,000</span>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">31 - 40th:</span>
                      <span className="text-white">$30,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">41 - 50th:</span>
                      <span className="text-white">$15,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">51 - 100th:</span>
                      <span className="text-white">$10,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">101 - 200th:</span>
                      <span className="text-white">$7,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">201 - 300th:</span>
                      <span className="text-white">$5,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">301 - 539th:</span>
                      <span className="text-white">$3,750</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">540 - 1078th:</span>
                      <span className="text-white">$1,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">1079 - 1617th:</span>
                      <span className="text-white">$500</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">1618 - 2156th:</span>
                      <span className="text-white">$250</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">2157 - 2695th:</span>
                      <span className="text-white">$100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">2696 - 8624th:</span>
                      <span className="text-white">$70</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">8625 - 112112th:</span>
                      <span className="text-white">$25</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scoring Settings */}
              <div className="bg-gray-800/40 rounded-lg p-4 mb-4 text-left">
                <h3 className="text-lg font-medium text-white mb-3">Scoring</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {/* Left Column */}
                  <div className="space-y-3">
                    <div>
                      <div className="text-gray-400">Reception</div>
                      <div className="text-white">0.5</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Receiving TD</div>
                      <div className="text-white">6.0</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Receiving Yard</div>
                      <div className="text-white">0.1</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Rushing TD</div>
                      <div className="text-white">6.0</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Rushing Yard</div>
                      <div className="text-white">0.1</div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-3">
                    <div>
                      <div className="text-gray-400">Passing Yard</div>
                      <div className="text-white">0.05</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Passing TD</div>
                      <div className="text-white">4.0</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Interception</div>
                      <div className="text-white">-1.0</div>
                    </div>
                    <div>
                      <div className="text-gray-400">2-PT Conversion</div>
                      <div className="text-white">2.0</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Fumble Lost</div>
                      <div className="text-white">-2.0</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Roster Configuration */}
              <div className="bg-gray-800/40 rounded-lg p-4 mb-4 text-left">
                <h3 className="text-lg font-medium text-white mb-3">Roster</h3>
                <div className="grid grid-cols-3 gap-x-6 gap-y-3 text-sm">
                  {/* First Row */}
                  <div className="text-center">
                    <div className="text-gray-400">QB</div>
                    <div className="text-white">1</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">RB</div>
                    <div className="text-white">2</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">WR</div>
                    <div className="text-white">3</div>
                  </div>
                  
                  {/* Second Row */}
                  <div className="text-center">
                    <div className="text-gray-400">TE</div>
                    <div className="text-white">1</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">FLEX</div>
                    <div className="text-white">2</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">BENCH</div>
                    <div className="text-white">9</div>
                  </div>
                </div>
              </div>

              {/* Tournament Schedule */}
              <div className="bg-gray-800/40 rounded-lg p-4 mb-4 text-left">
                <h3 className="text-lg font-medium text-white mb-3">Tournament schedule</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Qualifiers:</span>
                    <span className="text-white">Weeks 1-14</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Quarterfinals:</span>
                    <span className="text-white">Week 15</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Semifinals:</span>
                    <span className="text-white">Week 16</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Championship:</span>
                    <span className="text-white">Week 17</span>
                  </div>
                </div>
              </div>

              {/* Rules Button */}
              <div className="flex justify-center" style={{ paddingBottom: '40px' }}>
                <button
                  onClick={() => setIsRulesModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Full Rules
                </button>
              </div>

                </div>
              </div>
            </div>
          </div>
        )}

      </div>



      {/* Mobile Footer Navigation */}
      <MobileFooterApple
        activeTab={activeTab}
        onTabChange={setActiveTab}
        queueCount={queuedPlayers.length}
      />

      {/* Ripple Effect - positioned to radiate from logo */}
      <RippleEffect 
        isActive={showRipple}
        centerX="50%"
        centerY="32px" // Position at navbar logo height
        onComplete={() => setShowRipple(false)}
      />

      {/* Mobile-First Rules Modal - Below Picks Bar */}
      {isRulesModalOpen && (
        <div className="absolute z-50 bg-black/80" style={{ 
          top: `${parseInt(MOBILE_SIZES.PICKS_BAR.height) * 1.35 + 68}px`, 
          left: 0, 
          right: 0, 
          bottom: 0 
        }}>
          <style jsx>{`
            .modal-scroll::-webkit-scrollbar {
              display: none;
            }
            .modal-scroll {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
          
          {/* Modal Content Below Light Blue Bar */}
          <div className="h-full flex flex-col bg-[#101927]">
            {/* Close Button - Top Right */}
            <div className="p-4 flex justify-end">
              <button
                onClick={() => setIsRulesModalOpen(false)}
                className="flex items-center justify-center text-white font-medium w-8 h-8"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto modal-scroll px-4 pb-8">
              <div className="text-white space-y-6 pt-2">
                {/* Title Section */}
                <div className="text-center">
                  <h1 className="text-xl font-semibold mb-4 text-white">TOPDOG INTERNATIONAL TOURNAMENT RULES</h1>
                  <p className="text-gray-400 text-sm mb-4">
                    TopDog.dog contests are governed by our Terms of Use, Privacy Policy, and the rules listed below.
                  </p>
                  <p className="text-gray-400 text-sm mb-6">
                    Entrants in TopDog.dog contests compete to accumulate points based on athletes' statistical performance in sporting events. Contest results are determined by the total points accumulated by each individual lineup entry according to the relevant scoring rules.
                  </p>
                </div>

                {/* General Contest Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-white">General Contest Information</h3>
                  <div className="space-y-3 text-gray-300 text-sm">
                    <p>• Entrants select players through a snake draft. In a snake draft, the pick order is reversed each round. In other words, the entrant with the first pick in round 1, will have the last pick in round 2 and the first pick in round 3.</p>
                    <p>• Entrants are required to pay an entry fee of $25 per entry to enter TopDog International (the "Tournament").</p>
                    <p>• Entry to the Tournament will be closed prior to the 1st game of the 2025 season. This means that the Tournament closure time would move if the timing of the first game were to change for any reason.</p>
                    <p>• Entrants draft a team of players who accumulate points throughout the duration of the contest period.</p>
                    <p>• Once entrants draft, their rosters are set—there are no waivers, substitutions, or trades during the contest period.</p>
                    <p>• At the end of each NFL week, TopDog.dog automatically selects the entrant's highest scoring players at the designated positions to be "starters" and only those players' statistics over that week are counted toward the entrant's accumulated score. This means entrants do not need to set their lineups.</p>
                    <p>• Entrants compete in groups ("Groups") over the course of multiple rounds ("Rounds").</p>
                  </div>
                </div>

                {/* Tournament Structure */}
                <div>
                  <h4 className="font-semibold mb-2 text-white">The Tournament will have 4 rounds, with each round consisting of player groups as seen below:</h4>
                  <div className="space-y-1 text-gray-300 text-sm ml-4">
                    <p>• Round 1 - 12 person groups</p>
                    <p>• Round 2 - 13 person groups</p>
                    <p>• Round 3 - 16 person groups</p>
                    <p>• Round 4 - 539 person final group</p>
                  </div>
                </div>

                {/* Tournament Details */}
                <div className="space-y-3 text-gray-300 text-sm">
                  <p>The Tournament will consist of 672,672 total entries and in the first round, a total of 56,056 12-person Groups.</p>
                  <p>At the end of Round 1, the top two (2) performing entries in each Group will advance to Round 2. and be awarded a prize (as described below). Round 2 will consist of 112,112 entries in 8,624 13-person Groups.</p>
                  <p>At the end of Round 2, the top one (1) performing entry from each Group will advance to Round 3 and be awarded a prize (as described below). Round 3 will consist of 8,624 entries in 539 16-person Groups.</p>
                  <p>At the end of Round 3, the top one (1) performing entry from each Group will advance to Round 4 and be awarded a prize (as described below). Round 4 will consist of 539 entries in a single 539-person Group.</p>
                  <p>At the end of Round 4, the top one (1) performing entry from the Group will be the Grand Prize winner and prizes will be awarded to all entries in Round 4 (as described below).</p>
                </div>

                {/* Rounds */}
                <div>
                  <h4 className="font-semibold mb-2 text-white">Rounds</h4>
                  <div className="space-y-1 text-gray-300 text-sm ml-4">
                    <p>• Round 1 - NFL Weeks 1 - 14</p>
                    <p>• Round 2 - NFL Week 15</p>
                    <p>• Round 3 - NFL Week 16</p>
                    <p>• Round 4 - NFL Week 17</p>
                  </div>
                  <p className="text-gray-300 text-sm mt-2">In the event of season postponement, any missed weeks will lead to a shortening of Round 1.</p>
                </div>

                {/* Roster Makeup */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-white">Roster makeup</h3>
                  <p className="text-gray-300 text-sm mb-4">The roster makeup and scoring will follow the details below.</p>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold mb-3 text-white">Roster</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div><span className="text-gray-400">QB:</span> <span className="text-white">1</span></div>
                      </div>
                      <div>
                        <span className="text-gray-400">RB:</span> <span className="text-white">1</span>
                      </div>
                      <div>
                        <span className="text-gray-400">WR:</span> <span className="text-white">3</span>
                      </div>
                      <div className="text-center">
                        <div><span className="text-gray-400">TE:</span> <span className="text-white">1</span></div>
                      </div>
                      <div>
                        <span className="text-gray-400">FLEX:</span> <span className="text-white">2</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Bench:</span> <span className="text-white">9</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prize Pool */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-white">Prize pool</h3>
                  <p className="text-gray-300 text-sm mb-4">Note that at TopDog.dog's discretion, TopDog.dog could pay out partial prizes upon advancement that eventually will equal the total prizes per user as seen below.</p>
                  
                  <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold mb-3 text-white">Tournament prize breakdown</h4>
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="flex justify-between"><span className="text-gray-400">1st:</span><span className="text-white text-right">$2,000,000</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">2nd:</span><span className="text-white text-right">$1,000,000</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">3rd:</span><span className="text-white text-right">$504,370</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">4th:</span><span className="text-white text-right">$400,000</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">5th:</span><span className="text-white text-right">$300,000</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">6th:</span><span className="text-white text-right">$250,000</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">7th:</span><span className="text-white text-right">$200,000</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">8th:</span><span className="text-white text-right">$175,000</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">9th:</span><span className="text-white text-right">$150,000</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">10th:</span><span className="text-white text-right">$125,000</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">11-15th:</span><span className="text-white text-right">$100,000</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">16-20th:</span><span className="text-white text-right">$70,000</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">21-30th:</span><span className="text-white text-right">$50,000</span></div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between"><span className="text-gray-400">31-40th:</span><span className="text-white text-right">$30,000</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">41-50th:</span><span className="text-white text-right">$15,000</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">51-100th:</span><span className="text-white text-right">$10,000</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">101-200th:</span><span className="text-white text-right">$7,000</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">201-300th:</span><span className="text-white text-right">$5,000</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">301-539th:</span><span className="text-white text-right">$3,750</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">540-1078th:</span><span className="text-white text-right">$1,000</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">1079-1617th:</span><span className="text-white text-right">$500</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">1618-2156th:</span><span className="text-white text-right">$250</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">2157-2695th:</span><span className="text-white text-right">$100</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">2696-8624th:</span><span className="text-white text-right">$70</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">8625-112112th:</span><span className="text-white text-right">$25</span></div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Additional Sections */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Maximum entries</h3>
                    <p className="text-gray-300 text-sm">TopDog.dog limits the maximum number of entries that a single entrant may enter into a single contest. This Tournament will have a maximum of 150 entry per entrant.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Scoring</h3>
                    <p className="text-gray-300 text-sm mb-2">TopDog.dog uses official league statistics provided by reputable partners and only includes statistics from sporting events the relevant league deems to be official.</p>
                    <p className="text-gray-300 text-sm">We endeavor to promptly settle contests and distribute prizes, but it is also important to us to make sure we do so accurately. On a weekly basis, final scores will be confirmed within 72 hours after the final game of the week is played.</p>
                  </div>

                  <div>
                    <div className="space-y-2 text-gray-300 text-sm">
                      <p>Following each specified contest round, entries will be advanced within 72 hours after the final game for that NFL Week is played. Once entries are advanced, scores will be considered final and no changes will be made.</p>
                      <p>Normally, any scoring changes or stat corrections provided by our partners after a contest has ended and TopDog.dog has settled the contest will not impact the already-settled contest. However, TopDog.dog reserves the right, in its sole discretion, to revise scores after they are released in the unlikely event of potential scoring error by a provider or TopDog.dog.</p>
                      <p>If a league declares a game "postponed" or "suspended", then the statistics generated in the sporting event before that point will count toward the contest. Any statistics generated when the sporting event takes place or resumes will count only if it occurs before the relevant contest period or Round closes.</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Ties</h3>
                    <div className="space-y-2 text-gray-300 text-sm">
                      <p><strong>Tournament Advancement:</strong> Ties that take place in Advancement Rounds will be broken by whichever team has the highest scoring player in that round. If entrants have the same highest scoring player or a player with equivalent high scores, then it would go to the second highest scoring player, then the third, and so forth, until one entrant has a higher scoring player than the other entrant. If they are still tied after that, the entrant that entered the contest first will advance.</p>
                      <p><strong>Tournament Finals:</strong> As it relates to Tournament Finals and Prizes, any entrants that tie will evenly split the combined prize allocation for the finishing spots they occupy. For example, if two entrants tie for first place, those two entrants would evenly split the combined prize for first and second.</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Round advancements</h3>
                    <div className="space-y-2 text-gray-300 text-sm">
                      <p>If there are not enough entries to fill the Tournament, some entries may advance to the next Round of the Tournament, even if they do not place high enough in their Group to qualify for automatic advancement, these are called "wild cards".</p>
                      <p>The wild cards will be provided to the highest scoring entries from the Round who did not automatically advance. For wild card advancements, place in the Group is irrelevant, highest scoring lineups will advance.</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Multiple entries</h3>
                    <p className="text-gray-300 text-sm">If an entrant enters more than one entry in the Tournament, each entry will be placed in a different Group for Round 1. Similarly, a single entrant's entries will not be in the same Group if the number of groups is greater than the entrant's remaining number of entries.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Slow drafts</h3>
                    <div className="space-y-2 text-gray-300 text-sm">
                      <p>For drafts operating at an 12 hour pick clock, the schedule for picks being sped up will be as follows:</p>
                      <p>• 2 weeks ahead of the draft cutoff time, the pick clock will be reduced to 4 hours per pick.</p>
                      <p>• 1 week ahead of the draft cutoff time, the pick clock will be reduced to 1 hour per pick.</p>
                      <p>• On the day of cutoff, the pick clock will be reduced to 10 minutes per pick.</p>
                      <p>• 2 hours ahead of cutoff, the pick clock will be reduced to 60 seconds per pick.</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Eligibility</h3>
                    <p className="text-gray-300 text-sm">Please review the other eligibility requirements in our Terms of Use.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Multiple accounts and collusion</h3>
                    <p className="text-gray-300 text-sm">Each user on TopDog.dog is permitted to maintain one account. "Multi-accounting" or colluding with any other entrant is expressly prohibited. If you have opened, maintained, used, colluded with, or controlled more than one account, as determined in TopDog.dog's sole discretion, we may terminate or suspend any or all of your accounts and may revoke or withhold any prizes that you have won.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Suspended accounts</h3>
                    <p className="text-gray-300 text-sm">If you undertake any actions that are detrimental to TopDog.dog or other users on TopDog.dog's service, we may suspend some or all functions associated with your account. If you want to communicate with us regarding restoration of your account, please email support@topdog.dog.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Cancelling entries</h3>
                    <p className="text-gray-300 text-sm">TopDog.dog permits entrants to cancel entries as long as the draft that you are attempting to enter has not yet been filled.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Lineup restrictions</h3>
                    <p className="text-gray-300 text-sm">Player positions are determined at the sole discretion of TopDog.dog. Lineups must include players from at least two different teams.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Lineup edits</h3>
                    <p className="text-gray-300 text-sm">Entrants may not edit Tournament rosters after they are drafted.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Traded and retired players</h3>
                    <p className="text-gray-300 text-sm">When players are traded in real life or retire, entrants will accumulate points based on the player's performance on the new team. Entrants are not permitted to swap players, even if a player in their lineup is no longer eligible to earn points.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Contest cancellation</h3>
                    <p className="text-gray-300 text-sm">TopDog.dog reserves the right to cancel contests at our sole discretion, without any restrictions. Typically, we would only do so in cases where we believe that due to problems with our services or occurring in events impacting the sporting events, there would be questions regarding the contest's integrity.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Demo Component for Testing iOS Experience
 */
export function DraftRoomAppleDemo() {
  const [isDraftActive, setIsDraftActive] = useState(false);
  const [isDraftPaused, setIsDraftPaused] = useState(false);
  const [mockDraftSpeed, setMockDraftSpeed] = useState(false);
  
  // Ripple effect state
  const [showRipple, setShowRipple] = useState(false);
  
  // Mobile-specific UI state
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [activeTab, setActiveTab] = useState('Players');
  const [selectedParticipantIndex, setSelectedParticipantIndex] = useState(0);
  const [queuedPlayers, setQueuedPlayers] = useState([]);
  
  const [mockState, setMockState] = useState({
    // Draft state (simplified)
    currentPickNumber: 1,
    isDraftActive: false, // Start with draft inactive
    isPaused: false,
    isMockDraft: false,
    timer: 59, // Pre-draft countdown starts at 59 seconds
    isMyTurn: false, // User is not on the clock until draft starts
    isInGracePeriod: false, // New state for 1-second grace period at 00
    isAutopickTriggered: false, // Prevent multiple autopicks
    
    // Participants (12-team)
    participants: [
      { name: 'NOTTODDMIDDLETON', team: 'TopDogs' },
      { name: 'FLIGHT800', team: 'AirForce' },
      { name: 'TITANIMPLOSION', team: 'BigBang' },
      { name: 'LOLITAEXPRESS', team: 'FastLane' },
      { name: 'BPWASFRAMED', team: 'Justice' },
      { name: 'SEXWORKISWORK', team: 'Labor' },
      { name: 'TRAPPEDINTHECLOSET', team: 'Secrets' },
      { name: 'KANYEAPOLOGISTS', team: 'YeStans' },
      { name: 'ICEWALL', team: 'ColdTruth' },
      { name: 'MOONLANDINGFAKE', team: 'Hoax' },
      { name: 'BIRDSARENTREAL', team: 'Drones' },
      { name: 'CHEMTRAILSROCK', team: 'SkyWriters' }
    ],
    
    // Draft picks (start with empty array - draft hasn't started)
    picks: [],
    
    // Available players (comprehensive player pool)
    availablePlayers: [
      // Top Tier WRs
      { name: 'Ja\'Marr Chase', position: 'WR', team: 'CIN', adp: 1.1 },
      { name: 'Justin Jefferson', position: 'WR', team: 'MIN', adp: 3.1 },
      { name: 'Amon-Ra St. Brown', position: 'WR', team: 'DET', adp: 4.1 },
      { name: 'Puka Nacua', position: 'WR', team: 'LAR', adp: 4.3 },
      { name: 'Tyreek Hill', position: 'WR', team: 'MIA', adp: 6.2 },
      { name: 'CeeDee Lamb', position: 'WR', team: 'DAL', adp: 7.1 },
      { name: 'A.J. Brown', position: 'WR', team: 'PHI', adp: 8.4 },
      { name: 'Stefon Diggs', position: 'WR', team: 'HOU', adp: 9.2 },
      { name: 'DK Metcalf', position: 'WR', team: 'SEA', adp: 12.3 },
      { name: 'Mike Evans', position: 'WR', team: 'TB', adp: 13.1 },
      { name: 'DeVonta Smith', position: 'WR', team: 'PHI', adp: 14.2 },
      { name: 'Chris Olave', position: 'WR', team: 'NO', adp: 15.4 },
      { name: 'Garrett Wilson', position: 'WR', team: 'NYJ', adp: 16.1 },
      { name: 'DJ Moore', position: 'WR', team: 'CHI', adp: 17.3 },
      { name: 'Tee Higgins', position: 'WR', team: 'CIN', adp: 18.2 },
      { name: 'Calvin Ridley', position: 'WR', team: 'TEN', adp: 19.4 },
      { name: 'Amari Cooper', position: 'WR', team: 'CLE', adp: 22.1 },
      { name: 'Keenan Allen', position: 'WR', team: 'CHI', adp: 23.3 },
      { name: 'Cooper Kupp', position: 'WR', team: 'LAR', adp: 24.2 },
      { name: 'Diontae Johnson', position: 'WR', team: 'CAR', adp: 25.1 },
      { name: 'Marvin Harrison Jr.', position: 'WR', team: 'ARI', adp: 42.1 },
      { name: 'Jaylen Waddle', position: 'WR', team: 'MIA', adp: 44.4 },
      { name: 'Terry McLaurin', position: 'WR', team: 'WAS', adp: 46.3 },
      { name: 'Brandon Aiyuk', position: 'WR', team: 'SF', adp: 48.2 },
      { name: 'Malik Nabers', position: 'WR', team: 'NYG', adp: 50.3 },
      { name: 'Courtland Sutton', position: 'WR', team: 'DEN', adp: 52.4 },
      { name: 'Michael Pittman Jr.', position: 'WR', team: 'IND', adp: 54.1 },
      { name: 'Rome Odunze', position: 'WR', team: 'CHI', adp: 58.2 },
      
      // Top Tier RBs
      { name: 'Bijan Robinson', position: 'RB', team: 'ATL', adp: 2.8 },
      { name: 'Saquon Barkley', position: 'RB', team: 'PHI', adp: 3.7 },
      { name: 'Jahmyr Gibbs', position: 'RB', team: 'DET', adp: 5.4 },
      { name: 'Jonathan Taylor', position: 'RB', team: 'IND', adp: 10.1 },
      { name: 'Derrick Henry', position: 'RB', team: 'BAL', adp: 11.2 },
      { name: 'Josh Jacobs', position: 'RB', team: 'GB', adp: 20.1 },
      { name: 'Kenneth Walker III', position: 'RB', team: 'SEA', adp: 21.2 },
      { name: 'Joe Mixon', position: 'RB', team: 'HOU', adp: 26.1 },
      { name: 'Aaron Jones', position: 'RB', team: 'MIN', adp: 27.3 },
      { name: 'David Montgomery', position: 'RB', team: 'DET', adp: 28.2 },
      { name: 'Alvin Kamara', position: 'RB', team: 'NO', adp: 29.1 },
      { name: 'Tony Pollard', position: 'RB', team: 'TEN', adp: 32.4 },
      { name: 'Rhamondre Stevenson', position: 'RB', team: 'NE', adp: 33.2 },
      { name: 'James Cook', position: 'RB', team: 'BUF', adp: 34.1 },
      { name: 'Najee Harris', position: 'RB', team: 'PIT', adp: 35.3 },
      { name: 'De\'Von Achane', position: 'RB', team: 'MIA', adp: 36.2 },
      { name: 'Rachaad White', position: 'RB', team: 'TB', adp: 38.1 },
      { name: 'Travis Etienne', position: 'RB', team: 'JAX', adp: 39.2 },
      { name: 'Breece Hall', position: 'RB', team: 'NYJ', adp: 40.1 },
      { name: 'Brian Robinson Jr.', position: 'RB', team: 'WAS', adp: 42.3 },
      
      // Top Tier QBs
      { name: 'Josh Allen', position: 'QB', team: 'BUF', adp: 30.1 },
      { name: 'Lamar Jackson', position: 'QB', team: 'BAL', adp: 31.2 },
      { name: 'Jalen Hurts', position: 'QB', team: 'PHI', adp: 37.1 },
      { name: 'Dak Prescott', position: 'QB', team: 'DAL', adp: 41.2 },
      { name: 'Joe Burrow', position: 'QB', team: 'CIN', adp: 43.1 },
      { name: 'Tua Tagovailoa', position: 'QB', team: 'MIA', adp: 45.2 },
      { name: 'C.J. Stroud', position: 'QB', team: 'HOU', adp: 46.1 },
      { name: 'Anthony Richardson', position: 'QB', team: 'IND', adp: 48.3 },
      { name: 'Kyler Murray', position: 'QB', team: 'ARI', adp: 52.1 },
      { name: 'Brock Purdy', position: 'QB', team: 'SF', adp: 54.2 },
      { name: 'Trevor Lawrence', position: 'QB', team: 'JAX', adp: 56.1 },
      { name: 'Jordan Love', position: 'QB', team: 'GB', adp: 58.3 },
      { name: 'Jayden Daniels', position: 'QB', team: 'WAS', adp: 62.1 },
      { name: 'Caleb Williams', position: 'QB', team: 'CHI', adp: 64.2 },
      { name: 'Aaron Rodgers', position: 'QB', team: 'NYJ', adp: 68.1 },
      
      // Top Tier TEs
      { name: 'Travis Kelce', position: 'TE', team: 'KC', adp: 44.1 },
      { name: 'Mark Andrews', position: 'TE', team: 'BAL', adp: 47.2 },
      { name: 'Sam LaPorta', position: 'TE', team: 'DET', adp: 49.1 },
      { name: 'Trey McBride', position: 'TE', team: 'ARI', adp: 51.3 },
      { name: 'George Kittle', position: 'TE', team: 'SF', adp: 53.2 },
      { name: 'Evan Engram', position: 'TE', team: 'JAX', adp: 65.1 },
      { name: 'Kyle Pitts', position: 'TE', team: 'ATL', adp: 67.2 },
      { name: 'Dallas Goedert', position: 'TE', team: 'PHI', adp: 69.1 },
      { name: 'Jake Ferguson', position: 'TE', team: 'DAL', adp: 72.3 },
      { name: 'David Njoku', position: 'TE', team: 'CLE', adp: 74.2 },
      { name: 'T.J. Hockenson', position: 'TE', team: 'MIN', adp: 76.1 },
      { name: 'Brock Bowers', position: 'TE', team: 'LV', adp: 78.3 },
      { name: 'Pat Freiermuth', position: 'TE', team: 'PIT', adp: 82.1 },
      { name: 'Jonnu Smith', position: 'TE', team: 'MIA', adp: 85.2 },
      { name: 'Tyler Conklin', position: 'TE', team: 'NYJ', adp: 88.1 },
      
      // Additional WRs (Mid-Late Round)
      { name: 'Jordan Addison', position: 'WR', team: 'MIN', adp: 60.2 },
      { name: 'Tank Dell', position: 'WR', team: 'HOU', adp: 62.4 },
      { name: 'Zay Flowers', position: 'WR', team: 'BAL', adp: 64.1 },
      { name: 'Christian Kirk', position: 'WR', team: 'JAX', adp: 66.3 },
      { name: 'Jerry Jeudy', position: 'WR', team: 'CLE', adp: 68.2 },
      { name: 'Rashee Rice', position: 'WR', team: 'KC', adp: 70.1 },
      { name: 'Tyler Lockett', position: 'WR', team: 'SEA', adp: 72.4 },
      { name: 'Ladd McConkey', position: 'WR', team: 'LAC', adp: 74.3 },
      { name: 'Jaxon Smith-Njigba', position: 'WR', team: 'SEA', adp: 76.2 },
      { name: 'Hollywood Brown', position: 'WR', team: 'KC', adp: 78.1 },
      { name: 'Xavier Worthy', position: 'WR', team: 'KC', adp: 80.3 },
      { name: 'Darnell Mooney', position: 'WR', team: 'ATL', adp: 82.2 },
      { name: 'Josh Downs', position: 'WR', team: 'IND', adp: 84.1 },
      { name: 'Jameson Williams', position: 'WR', team: 'DET', adp: 86.4 },
      { name: 'Gabe Davis', position: 'WR', team: 'JAX', adp: 88.3 },
      { name: 'Curtis Samuel', position: 'WR', team: 'BUF', adp: 90.2 },
      { name: 'Adam Thielen', position: 'WR', team: 'CAR', adp: 92.1 },
      { name: 'Wan\'Dale Robinson', position: 'WR', team: 'NYG', adp: 94.4 },
      { name: 'Brandin Cooks', position: 'WR', team: 'DAL', adp: 96.3 },
      { name: 'Tyler Boyd', position: 'WR', team: 'TEN', adp: 98.2 },
      { name: 'Demario Douglas', position: 'WR', team: 'NE', adp: 100.1 },
      { name: 'Tutu Atwell', position: 'WR', team: 'LAR', adp: 102.4 },
      { name: 'Jayden Reed', position: 'WR', team: 'GB', adp: 104.3 },
      { name: 'Quentin Johnston', position: 'WR', team: 'LAC', adp: 106.2 },
      { name: 'Jahan Dotson', position: 'WR', team: 'PHI', adp: 108.1 },
      { name: 'DeAndre Hopkins', position: 'WR', team: 'TEN', adp: 110.4 },
      { name: 'Mike Williams', position: 'WR', team: 'NYJ', adp: 112.3 },
      { name: 'Elijah Moore', position: 'WR', team: 'CLE', adp: 114.2 },
      { name: 'Noah Brown', position: 'WR', team: 'HOU', adp: 116.1 },
      { name: 'Kendrick Bourne', position: 'WR', team: 'NE', adp: 118.4 },
      
      // Additional RBs (Mid-Late Round)
      { name: 'Ezekiel Elliott', position: 'RB', team: 'DAL', adp: 44.2 },
      { name: 'Raheem Mostert', position: 'RB', team: 'MIA', adp: 46.1 },
      { name: 'Zack Moss', position: 'RB', team: 'CIN', adp: 48.4 },
      { name: 'Jerome Ford', position: 'RB', team: 'CLE', adp: 50.3 },
      { name: 'Tyjae Spears', position: 'RB', team: 'TEN', adp: 52.2 },
      { name: 'Rico Dowdle', position: 'RB', team: 'DAL', adp: 54.1 },
      { name: 'Chuba Hubbard', position: 'RB', team: 'CAR', adp: 56.4 },
      { name: 'Jaylen Warren', position: 'RB', team: 'PIT', adp: 58.3 },
      { name: 'Antonio Gibson', position: 'RB', team: 'NE', adp: 60.2 },
      { name: 'Ty Chandler', position: 'RB', team: 'MIN', adp: 62.1 },
      { name: 'Gus Edwards', position: 'RB', team: 'LAC', adp: 64.4 },
      { name: 'Jaleel McLaughlin', position: 'RB', team: 'DEN', adp: 66.3 },
      { name: 'Ray Davis', position: 'RB', team: 'BUF', adp: 68.2 },
      { name: 'Bucky Irving', position: 'RB', team: 'TB', adp: 70.1 },
      { name: 'Trey Benson', position: 'RB', team: 'ARI', adp: 72.4 },
      { name: 'Blake Corum', position: 'RB', team: 'LAR', adp: 74.3 },
      { name: 'MarShawn Lloyd', position: 'RB', team: 'GB', adp: 76.2 },
      { name: 'Jonathon Brooks', position: 'RB', team: 'CAR', adp: 78.1 },
      { name: 'Audric Estime', position: 'RB', team: 'DEN', adp: 80.4 },
      { name: 'Braelon Allen', position: 'RB', team: 'NYJ', adp: 82.3 },
      { name: 'Kimani Vidal', position: 'RB', team: 'LAC', adp: 84.2 },
      { name: 'Isaac Guerendo', position: 'RB', team: 'SF', adp: 86.1 },
      { name: 'Tyler Allgeier', position: 'RB', team: 'ATL', adp: 88.4 },
      { name: 'Samaje Perine', position: 'RB', team: 'KC', adp: 90.3 },
      { name: 'Justice Hill', position: 'RB', team: 'BAL', adp: 92.2 },
      { name: 'Cam Akers', position: 'RB', team: 'HOU', adp: 94.1 },
      { name: 'Miles Sanders', position: 'RB', team: 'CAR', adp: 96.4 },
      { name: 'Dameon Pierce', position: 'RB', team: 'HOU', adp: 98.3 },
      { name: 'Alexander Mattison', position: 'RB', team: 'LV', adp: 100.2 },
      { name: 'Roschon Johnson', position: 'RB', team: 'CHI', adp: 102.1 },
      { name: 'Clyde Edwards-Helaire', position: 'RB', team: 'KC', adp: 104.4 },
      
      // Additional QBs (Mid-Late Round)
      { name: 'Russell Wilson', position: 'QB', team: 'PIT', adp: 70.2 },
      { name: 'Kirk Cousins', position: 'QB', team: 'ATL', adp: 72.1 },
      { name: 'Geno Smith', position: 'QB', team: 'SEA', adp: 74.4 },
      { name: 'Derek Carr', position: 'QB', team: 'NO', adp: 76.3 },
      { name: 'Matthew Stafford', position: 'QB', team: 'LAR', adp: 78.2 },
      { name: 'Baker Mayfield', position: 'QB', team: 'TB', adp: 80.1 },
      { name: 'Daniel Jones', position: 'QB', team: 'NYG', adp: 82.4 },
      { name: 'Justin Fields', position: 'QB', team: 'PIT', adp: 84.3 },
      { name: 'Sam Darnold', position: 'QB', team: 'MIN', adp: 86.2 },
      { name: 'Bo Nix', position: 'QB', team: 'DEN', adp: 88.1 },
      { name: 'Drake Maye', position: 'QB', team: 'NE', adp: 90.4 },
      { name: 'J.J. McCarthy', position: 'QB', team: 'MIN', adp: 92.3 },
      { name: 'Michael Penix Jr.', position: 'QB', team: 'ATL', adp: 94.2 },
      { name: 'Jacoby Brissett', position: 'QB', team: 'NE', adp: 96.1 },
      { name: 'Gardner Minshew', position: 'QB', team: 'LV', adp: 98.4 },
      { name: 'Aidan O\'Connell', position: 'QB', team: 'LV', adp: 100.3 },
      { name: 'Will Levis', position: 'QB', team: 'TEN', adp: 102.2 },
      { name: 'Deshaun Watson', position: 'QB', team: 'CLE', adp: 104.1 },
      { name: 'Mac Jones', position: 'QB', team: 'JAX', adp: 106.4 },
      { name: 'Bryce Young', position: 'QB', team: 'CAR', adp: 108.3 },
      
      // Additional TEs (Mid-Late Round)
      { name: 'Isaiah Likely', position: 'TE', team: 'BAL', adp: 90.2 },
      { name: 'Cade Otton', position: 'TE', team: 'TB', adp: 92.1 },
      { name: 'Chigoziem Okonkwo', position: 'TE', team: 'TEN', adp: 94.4 },
      { name: 'Hunter Henry', position: 'TE', team: 'NE', adp: 96.3 },
      { name: 'Noah Fant', position: 'TE', team: 'SEA', adp: 98.2 },
      { name: 'Cole Kmet', position: 'TE', team: 'CHI', adp: 100.1 },
      { name: 'Dalton Schultz', position: 'TE', team: 'HOU', adp: 102.4 },
      { name: 'Mike Gesicki', position: 'TE', team: 'CIN', adp: 104.3 },
      { name: 'Zach Ertz', position: 'TE', team: 'WAS', adp: 106.2 },
      { name: 'Logan Thomas', position: 'TE', team: 'WAS', adp: 108.1 },
      { name: 'Dawson Knox', position: 'TE', team: 'BUF', adp: 110.4 },
      { name: 'Gerald Everett', position: 'TE', team: 'CHI', adp: 112.3 },
      { name: 'Austin Hooper', position: 'TE', team: 'NE', adp: 114.2 },
      { name: 'Taysom Hill', position: 'TE', team: 'NO', adp: 116.1 },
      { name: 'Tucker Kraft', position: 'TE', team: 'GB', adp: 118.4 },
      { name: 'Juwan Johnson', position: 'TE', team: 'NO', adp: 120.3 },
      { name: 'Luke Musgrave', position: 'TE', team: 'GB', adp: 122.2 },
      { name: 'Daniel Bellinger', position: 'TE', team: 'NYG', adp: 124.1 },
      { name: 'Durham Smythe', position: 'TE', team: 'MIA', adp: 126.4 },
      { name: 'Irv Smith Jr.', position: 'TE', team: 'KC', adp: 128.3 },
      
      // Deep Sleepers & Handcuffs
      { name: 'Kendre Miller', position: 'RB', team: 'NO', adp: 130.2 },
      { name: 'Keaton Mitchell', position: 'RB', team: 'BAL', adp: 132.1 },
      { name: 'Tank Bigsby', position: 'RB', team: 'JAX', adp: 134.4 },
      { name: 'Khalil Herbert', position: 'RB', team: 'CHI', adp: 136.3 },
      { name: 'Kenneth Gainwell', position: 'RB', team: 'PHI', adp: 138.2 },
      { name: 'Devin Singletary', position: 'RB', team: 'NYG', adp: 140.1 },
      { name: 'Kareem Hunt', position: 'RB', team: 'KC', adp: 142.4 },
      { name: 'D\'Onta Foreman', position: 'RB', team: 'CLE', adp: 144.3 },
      { name: 'Nyheim Hines', position: 'RB', team: 'CLE', adp: 146.2 },
      { name: 'Cordarrelle Patterson', position: 'RB', team: 'PIT', adp: 148.1 },
      
      // Deep WR Sleepers
      { name: 'Adonai Mitchell', position: 'WR', team: 'IND', adp: 150.4 },
      { name: 'Keon Coleman', position: 'WR', team: 'BUF', adp: 152.3 },
      { name: 'Brian Thomas Jr.', position: 'WR', team: 'JAX', adp: 154.2 },
      { name: 'Ricky Pearsall', position: 'WR', team: 'SF', adp: 156.1 },
      { name: 'Troy Franklin', position: 'WR', team: 'DEN', adp: 158.4 },
      { name: 'Ja\'Lynn Polk', position: 'WR', team: 'NE', adp: 160.3 },
      { name: 'Malachi Corley', position: 'WR', team: 'NYJ', adp: 162.2 },
      { name: 'Luke McCaffrey', position: 'WR', team: 'WAS', adp: 164.1 },
      { name: 'Jermaine Burton', position: 'WR', team: 'CIN', adp: 166.4 },
      { name: 'Xavier Legette', position: 'WR', team: 'CAR', adp: 168.3 },
      
      // Veteran WRs
      { name: 'Allen Robinson', position: 'WR', team: 'DET', adp: 170.2 },
      { name: 'Nelson Agholor', position: 'WR', team: 'BAL', adp: 172.1 },
      { name: 'Mecole Hardman', position: 'WR', team: 'KC', adp: 174.4 },
      { name: 'Parris Campbell', position: 'WR', team: 'PHI', adp: 176.3 },
      { name: 'KJ Osborn', position: 'WR', team: 'NE', adp: 178.2 },
      { name: 'Van Jefferson', position: 'WR', team: 'PIT', adp: 180.1 },
      { name: 'Marquez Valdes-Scantling', position: 'WR', team: 'BUF', adp: 182.4 },
      { name: 'Cedrick Wilson Jr.', position: 'WR', team: 'NO', adp: 184.3 },
      { name: 'Tre Tucker', position: 'WR', team: 'LV', adp: 186.2 },
      { name: 'Kalif Raymond', position: 'WR', team: 'DET', adp: 188.1 },
      
      // More Deep Sleepers & Rookies
      { name: 'Rome Odunze', position: 'WR', team: 'CHI', adp: 190.4 },
      { name: 'Marvin Harrison Jr.', position: 'WR', team: 'ARI', adp: 192.3 },
      { name: 'Jaylen Wright', position: 'RB', team: 'MIA', adp: 194.2 },
      { name: 'Will Shipley', position: 'RB', team: 'PHI', adp: 196.1 },
      { name: 'Frank Gore Jr.', position: 'RB', team: 'BUF', adp: 198.4 },
      { name: 'Emari Demercado', position: 'RB', team: 'ARI', adp: 200.3 },
      { name: 'Keaontay Ingram', position: 'RB', team: 'ARI', adp: 202.2 },
      { name: 'Chris Rodriguez Jr.', position: 'RB', team: 'WAS', adp: 204.1 },
      { name: 'Ty Johnson', position: 'RB', team: 'BUF', adp: 206.4 },
      { name: 'Dare Ogunbowale', position: 'RB', team: 'HOU', adp: 208.3 },
      
      // More WR Depth
      { name: 'Jalen Tolbert', position: 'WR', team: 'DAL', adp: 210.2 },
      { name: 'Skyy Moore', position: 'WR', team: 'KC', adp: 212.1 },
      { name: 'Alec Pierce', position: 'WR', team: 'IND', adp: 214.4 },
      { name: 'Nico Collins', position: 'WR', team: 'HOU', adp: 216.3 },
      { name: 'John Metchie III', position: 'WR', team: 'HOU', adp: 218.2 },
      { name: 'Velus Jones Jr.', position: 'WR', team: 'CHI', adp: 220.1 },
      { name: 'Tyquan Thornton', position: 'WR', team: 'NE', adp: 222.4 },
      { name: 'Danny Gray', position: 'WR', team: 'SF', adp: 224.3 },
      { name: 'Britain Covey', position: 'WR', team: 'PHI', adp: 226.2 },
      { name: 'Ihmir Smith-Marsette', position: 'WR', team: 'CAR', adp: 228.1 },
      { name: 'Terrace Marshall Jr.', position: 'WR', team: 'CAR', adp: 230.4 },
      { name: 'Laviska Shenault Jr.', position: 'WR', team: 'SEA', adp: 232.3 },
      { name: 'Donovan Peoples-Jones', position: 'WR', team: 'DET', adp: 234.2 },
      { name: 'Marquise Goodwin', position: 'WR', team: 'KC', adp: 236.1 },
      { name: 'Robbie Anderson', position: 'WR', team: 'MIA', adp: 238.4 },
      
      // More QB Depth
      { name: 'Malik Willis', position: 'QB', team: 'GB', adp: 240.3 },
      { name: 'Tyler Huntley', position: 'QB', team: 'CLE', adp: 242.2 },
      { name: 'Mason Rudolph', position: 'QB', team: 'TEN', adp: 244.1 },
      { name: 'Mitch Trubisky', position: 'QB', team: 'BUF', adp: 246.4 },
      { name: 'Jimmy Garoppolo', position: 'QB', team: 'LAR', adp: 248.3 },
      { name: 'Ryan Tannehill', position: 'QB', team: 'TEN', adp: 250.2 },
      { name: 'Jameis Winston', position: 'QB', team: 'CLE', adp: 252.1 },
      { name: 'Andy Dalton', position: 'QB', team: 'CAR', adp: 254.4 },
      { name: 'Tyrod Taylor', position: 'QB', team: 'NYG', adp: 256.3 },
      { name: 'Joe Flacco', position: 'QB', team: 'IND', adp: 258.2 },
      
      // More TE Depth
      { name: 'Brevin Jordan', position: 'TE', team: 'HOU', adp: 260.1 },
      { name: 'Hayden Hurst', position: 'TE', team: 'LAC', adp: 262.4 },
      { name: 'Robert Tonyan', position: 'TE', team: 'CHI', adp: 264.3 },
      { name: 'C.J. Uzomah', position: 'TE', team: 'NYJ', adp: 266.2 },
      { name: 'Tyler Higbee', position: 'TE', team: 'LAR', adp: 268.1 },
      { name: 'Colby Parkinson', position: 'TE', team: 'LAR', adp: 270.4 },
      { name: 'Foster Moreau', position: 'TE', team: 'NO', adp: 272.3 },
      { name: 'Adam Trautman', position: 'TE', team: 'DEN', adp: 274.2 },
      { name: 'Cameron Brate', position: 'TE', team: 'TB', adp: 276.1 },
      { name: 'O.J. Howard', position: 'TE', team: 'BUF', adp: 278.4 },
      
      // Veteran RBs & Handcuffs
      { name: 'Latavius Murray', position: 'RB', team: 'BUF', adp: 280.3 },
      { name: 'Jerick McKinnon', position: 'RB', team: 'KC', adp: 282.2 },
      { name: 'Boston Scott', position: 'RB', team: 'PHI', adp: 284.1 },
      { name: 'Deon Jackson', position: 'RB', team: 'IND', adp: 286.4 },
      { name: 'Jordan Mason', position: 'RB', team: 'SF', adp: 288.3 },
      { name: 'Elijah Mitchell', position: 'RB', team: 'SF', adp: 290.2 },
      { name: 'Tyrion Davis-Price', position: 'RB', team: 'SF', adp: 292.1 },
      { name: 'Rachaad White', position: 'RB', team: 'TB', adp: 294.4 },
      { name: 'Ke\'Shawn Vaughn', position: 'RB', team: 'TB', adp: 296.3 },
      { name: 'Leonard Fournette', position: 'RB', team: 'FA', adp: 298.2 },
      
      // International & Practice Squad Players
      { name: 'Jakob Johnson', position: 'RB', team: 'LV', adp: 300.1 },
      { name: 'Reggie Gilliam', position: 'RB', team: 'BUF', adp: 302.4 },
      { name: 'Trent Sherfield', position: 'WR', team: 'SF', adp: 304.3 },
      { name: 'River Cracraft', position: 'WR', team: 'MIA', adp: 306.2 },
      { name: 'Nsimba Webster', position: 'WR', team: 'CHI', adp: 308.1 },
      { name: 'Isaiah McKenzie', position: 'WR', team: 'IND', adp: 310.4 },
      { name: 'Pharoh Cooper', position: 'WR', team: 'NYG', adp: 312.3 },
      { name: 'Gunner Olszewski', position: 'WR', team: 'NYG', adp: 314.2 },
      { name: 'Deonte Harty', position: 'WR', team: 'BUF', adp: 316.1 },
      { name: 'Braxton Berrios', position: 'WR', team: 'MIA', adp: 318.4 },
      
      // More Rookie WRs
      { name: 'Malik Washington', position: 'WR', team: 'MIA', adp: 320.3 },
      { name: 'Devontez Walker', position: 'WR', team: 'BAL', adp: 322.2 },
      { name: 'Tahj Washington', position: 'WR', team: 'MIA', adp: 324.1 },
      { name: 'Ainias Smith', position: 'WR', team: 'PHI', adp: 326.4 },
      { name: 'Johnny Wilson', position: 'WR', team: 'PHI', adp: 328.3 },
      { name: 'Javon Baker', position: 'WR', team: 'NE', adp: 330.2 },
      { name: 'Jalen McMillan', position: 'WR', team: 'TB', adp: 332.1 },
      { name: 'Ryan Williams', position: 'WR', team: 'ARI', adp: 334.4 },
      { name: 'Devaughn Vele', position: 'WR', team: 'DEN', adp: 336.3 },
      { name: 'Jamari Thrash', position: 'WR', team: 'CLE', adp: 338.2 },
      
      // Rookie RBs
      { name: 'Tyrone Tracy Jr.', position: 'RB', team: 'NYG', adp: 340.1 },
      { name: 'Cody Schrader', position: 'RB', team: 'SF', adp: 342.4 },
      { name: 'Rasheen Ali', position: 'RB', team: 'BAL', adp: 344.3 },
      { name: 'Dylan Laube', position: 'RB', team: 'LV', adp: 346.2 },
      { name: 'Kendall Milton', position: 'RB', team: 'PHI', adp: 348.1 },
      { name: 'Michael Wiley', position: 'RB', team: 'WAS', adp: 350.4 },
      { name: 'Daijun Edwards', position: 'RB', team: 'LV', adp: 352.3 },
      { name: 'George Holani', position: 'RB', team: 'SEA', adp: 354.2 },
      { name: 'Jase McClellan', position: 'RB', team: 'ATL', adp: 356.1 },
      { name: 'Carson Steele', position: 'RB', team: 'KC', adp: 358.4 },
      
      // Rookie TEs
      { name: 'Ja\'Tavion Sanders', position: 'TE', team: 'CAR', adp: 360.3 },
      { name: 'Ben Skowronek', position: 'TE', team: 'HOU', adp: 362.2 },
      { name: 'Erick All Jr.', position: 'TE', team: 'CIN', adp: 364.1 },
      { name: 'Theo Johnson', position: 'TE', team: 'NYG', adp: 366.4 },
      { name: 'Cade Stover', position: 'TE', team: 'HOU', adp: 368.3 },
      { name: 'AJ Barner', position: 'TE', team: 'SEA', adp: 370.2 },
      { name: 'Jared Wiley', position: 'TE', team: 'KC', adp: 372.1 },
      { name: 'Tip Reiman', position: 'TE', team: 'ARI', adp: 374.4 },
      { name: 'Mitchell Evans', position: 'TE', team: 'DET', adp: 376.3 },
      { name: 'Colston Loveland', position: 'TE', team: 'MIA', adp: 378.2 },
      
      // International Players & Special Cases
      { name: 'Louis Rees-Zammit', position: 'RB', team: 'KC', adp: 380.1 },
      { name: 'Jakob Johnson', position: 'RB', team: 'LV', adp: 382.4 },
      { name: 'Sammis Reyes', position: 'TE', team: 'WAS', adp: 384.3 },
      { name: 'Bernhard Raimann', position: 'WR', team: 'IND', adp: 386.2 }, // Converted OL
      
      // Free Agents & Recently Cut Players
      { name: 'Saquon Barkley', position: 'RB', team: 'PHI', adp: 388.1 },
      { name: 'Calvin Ridley', position: 'WR', team: 'TEN', adp: 390.4 },
      { name: 'Mike Evans', position: 'WR', team: 'TB', adp: 392.3 },
      { name: 'Chris Godwin', position: 'WR', team: 'TB', adp: 394.2 },
      { name: 'Amari Cooper', position: 'WR', team: 'CLE', adp: 396.1 },
      { name: 'Stefon Diggs', position: 'WR', team: 'HOU', adp: 398.4 },
      { name: 'Keenan Allen', position: 'WR', team: 'CHI', adp: 400.3 },
      
      // Final Deep Cuts
      { name: 'Marquez Valdes-Scantling', position: 'WR', team: 'BUF', adp: 402.2 },
      { name: 'Russell Gage', position: 'WR', team: 'TB', adp: 404.1 },
      { name: 'Jalen Reagor', position: 'WR', team: 'LAC', adp: 406.4 },
      { name: 'N\'Keal Harry', position: 'WR', team: 'MIN', adp: 408.3 },
      { name: 'Laquon Treadwell', position: 'WR', team: 'IND', adp: 410.2 },
      { name: 'Equanimeous St. Brown', position: 'WR', team: 'NO', adp: 412.1 },
      { name: 'Tre\'Quan Smith', position: 'WR', team: 'DET', adp: 414.4 },
      { name: 'Marquez Callaway', position: 'WR', team: 'NO', adp: 416.3 },
      { name: 'Olamide Zaccheaus', position: 'WR', team: 'WAS', adp: 418.2 },
      { name: 'Freddie Swain', position: 'WR', team: 'CLE', adp: 420.1 }
    ]
  });

  // Autopick function - picks best available player
  const autopick = () => {
    setMockState(prevState => {
      // Guard against multiple autopick executions
      if (prevState.isAutopickTriggered) {
        console.log('🚫 AUTOPICK: Already triggered, skipping');
        return prevState;
      }
      
      const availablePlayers = prevState.availablePlayers;
      
      if (availablePlayers.length === 0) {
        console.log('❌ No available players for autopick');
        return prevState;
      }
      
      // Sort players by ADP order (lower ADP = higher draft position = better)
      const sortedPlayers = [...availablePlayers].sort((a, b) => {
        const adpA = parseFloat(a.adp || 999);
        const adpB = parseFloat(b.adp || 999);
        return adpA - adpB;
      });
      
      // Debug: Show top 5 available players by ADP
      console.log('🔍 AUTOPICK DEBUG - Top 5 available players by ADP:');
      sortedPlayers.slice(0, 5).forEach((player, index) => {
        console.log(`${index + 1}. ${player.name} (${player.position}) - ADP: ${player.adp}`);
      });
      
      // Pick the best available player
      const autoPickedPlayer = sortedPlayers[0];
      const currentPick = prevState.currentPickNumber;
      
      // Calculate team composition for this participant at time of pick
      const round = Math.ceil(currentPick / prevState.participants.length);
      const isSnakeRound = round % 2 === 0;
      const pickIndexInRound = (currentPick - 1) % prevState.participants.length;
      const participantIndex = isSnakeRound 
        ? prevState.participants.length - 1 - pickIndexInRound 
        : pickIndexInRound;
      const participant = prevState.participants[participantIndex];
      
      // Get current picks for this participant
      const participantPicks = prevState.picks.filter(p => {
        const pRound = Math.ceil(p.pickNumber / prevState.participants.length);
        const pIsSnakeRound = pRound % 2 === 0;
        const pPickIndexInRound = (p.pickNumber - 1) % prevState.participants.length;
        const pParticipantIndex = pIsSnakeRound 
          ? prevState.participants.length - 1 - pPickIndexInRound 
          : pPickIndexInRound;
        return pParticipantIndex === participantIndex && p.player;
      });
      
      const positionCounts = {
        QB: participantPicks.filter(p => p.player.position === 'QB').length,
        RB: participantPicks.filter(p => p.player.position === 'RB').length,
        WR: participantPicks.filter(p => p.player.position === 'WR').length,
        TE: participantPicks.filter(p => p.player.position === 'TE').length
      };
      
      // Determine tracker color based on most needed position after this pick
      const maxCount = Math.max(...Object.values(positionCounts));
      const minCount = Math.min(...Object.values(positionCounts));
      let trackerColor = '#6B7280'; // Default grey
      
      if (minCount !== maxCount) {
        // Find position with least players
        for (const [position, count] of Object.entries(positionCounts)) {
          if (count === minCount) {
            const colors = {
              QB: '#F472B6',
              RB: '#0fba80',
              WR: '#FBBF25',
              TE: '#7C3AED'
            };
            trackerColor = colors[position];
            break;
          }
        }
      }

      // Create the pick object
      const newPick = {
        pickNumber: currentPick,
        player: autoPickedPlayer,
        timestamp: Date.now(),
        isAutopick: true, // Mark as autopick
        teamCompositionAtTime: trackerColor // Store the tracker color at time of pick
      };
      
      // Remove picked player from available players
      const updatedAvailablePlayers = availablePlayers.filter(p => p !== autoPickedPlayer);
      
      // Advance to next pick
      const nextPickNumber = currentPick + 1;
      
      // Determine if it's user's turn (snake draft logic)
      const nextRound = Math.ceil(nextPickNumber / prevState.participants.length);
      const isNextSnakeRound = nextRound % 2 === 0;
      const nextPickIndexInRound = (nextPickNumber - 1) % prevState.participants.length;
      const nextParticipantIndex = isNextSnakeRound 
        ? prevState.participants.length - 1 - nextPickIndexInRound 
        : nextPickIndexInRound;
      const isUserTurn = nextParticipantIndex === 0; // Assume user is first participant
      
      console.log(`⏰ AUTOPICK for ${participant?.name || 'Unknown'}: ${autoPickedPlayer.name} (${autoPickedPlayer.position}) - Pick ${currentPick}`);
      console.log(`📊 Selected by ADP: ${autoPickedPlayer.adp}`);
      console.log(`⏭️ Next up: Pick ${nextPickNumber} - ${isUserTurn ? 'Your turn' : 'CPU turn'}`);
      
      return {
        ...prevState,
        picks: [...prevState.picks, newPick],
        availablePlayers: updatedAvailablePlayers,
        currentPickNumber: nextPickNumber,
        timer: 30, // Reset timer for next pick
        isMyTurn: isUserTurn,
        isInGracePeriod: false, // Reset grace period
        isAutopickTriggered: false // Reset autopick flag
      };
    });
  };

  // Timer countdown effect with autopick on expiration
  useEffect(() => {
    let interval;
    
    // Pre-draft countdown
    if (!mockState.isDraftActive && !mockState.isPaused && mockState.timer > 0) {
      interval = setInterval(() => {
        setMockState(prevState => {
          const newTimer = Math.max(0, prevState.timer - 1);
          
          // If pre-draft timer hits 0, start the draft with smooth transition
          if (newTimer === 0) {
            // Add a longer, smoother transition delay
            setTimeout(() => {
              setIsDraftActive(true);
              setMockState(prevState => ({
                ...prevState,
                isDraftActive: true,
                timer: 30, // Reset to 30 seconds for first pick
                isMyTurn: true
              }));
            }, 2000); // Increased from 100ms to 2000ms (2 seconds)
          }
          
          return {
            ...prevState,
            timer: newTimer
          };
        });
      }, 1000);
    }
    // Active draft countdown - run for ALL turns (user and CPU)
    else if (mockState.isDraftActive && !mockState.isPaused) {
      interval = setInterval(() => {
        setMockState(prevState => {
          // Skip grace period handling here - it's handled in separate useEffect
          if (prevState.isInGracePeriod) {
            return prevState; // Don't modify state during grace period
          }
          
          // Normal countdown
          if (prevState.timer > 0) {
            const newTimer = Math.max(0, prevState.timer - 1);
            
            // If timer hits 0, start grace period (show 00 for 1 second)
            if (newTimer === 0) {
              return {
                ...prevState,
                timer: 0,
                isInGracePeriod: true,
                isAutopickTriggered: false // Reset flag for new grace period
              };
            }
            
            return {
              ...prevState,
              timer: newTimer
            };
          }
          
          return prevState;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [mockState.isDraftActive, mockState.isPaused, mockState.timer, mockState.isMyTurn]);

  // Ripple effect trigger when user is on the clock and timer reaches 10 seconds
  useEffect(() => {
    if (mockState.isMyTurn && mockState.timer === 10 && mockState.isDraftActive && !mockState.isPaused) {
      setShowRipple(true);
    }
  }, [mockState.isMyTurn, mockState.timer, mockState.isDraftActive, mockState.isPaused]);

  // Separate effect to handle grace period timeout more reliably
  useEffect(() => {
    let graceTimeout;
    
    if (mockState.isInGracePeriod && !mockState.isAutopickTriggered) {
      graceTimeout = setTimeout(() => {
        autopick();
        setMockState(prevState => ({
          ...prevState,
          isInGracePeriod: false,
          isAutopickTriggered: true
        }));
      }, 1000); // 1 second grace period
    }
    
    return () => {
      if (graceTimeout) {
        clearTimeout(graceTimeout);
      }
    };
  }, [mockState.isInGracePeriod, mockState.isAutopickTriggered]);

  // Check for multi-hour timer on mount and start immediately
  useEffect(() => {
    if (!mockState.isDraftActive && mockState.timer >= 3600) {
      // Multi-hour timer detected, start draft immediately
      setTimeout(() => {
        setIsDraftActive(true);
        setMockState(prevState => ({
          ...prevState,
          isDraftActive: true,
          timer: 30, // Reset to 30 seconds for first pick
          isMyTurn: true
        }));
      }, 100);
    }
  }, []); // Only run on mount

  const startMockDraft = () => {
    setIsDraftActive(true);
    setIsDraftPaused(false);
    setMockState(prevState => ({
      ...prevState,
      isDraftActive: true,
      isPaused: false,
      timer: 30, // Reset timer to 30 seconds
      isMyTurn: true // User gets first pick (1.01) when draft starts
    }));
    console.log('🎯 Mock draft started');
  };

  const pauseDraft = () => {
    setIsDraftPaused(true);
    setMockState(prevState => ({
      ...prevState,
      isPaused: true
    }));
    console.log('⏸️ Draft paused');
  };

  const resumeDraft = () => {
    setIsDraftPaused(false);
    setMockState(prevState => ({
      ...prevState,
      isPaused: false
    }));
    console.log('▶️ Draft resumed');
  };

  const toggleMockSpeed = () => {
    setMockDraftSpeed(!mockDraftSpeed);
    console.log(`🚀 Mock draft speed: ${!mockDraftSpeed ? 'ON' : 'OFF'}`);
  };

  const restartDraft = () => {
    setIsDraftActive(true);
    setIsDraftPaused(false);
    setMockDraftSpeed(false);
    
    // Reset mock state to beginning of draft
    setMockState(prevState => ({
      ...prevState,
      currentPickNumber: 1,
      isDraftActive: true,
      isPaused: false,
      timer: 30,
      isMyTurn: true, // User gets first pick (1.01) when draft restarts
      picks: [] // Clear all picks to start fresh
    }));
    
    console.log('🔄 Draft restarted - Pick 1.01 is now on the clock');
  };

  // Mobile-optimized handlers
  const handleDraftPlayer = (player) => {
    console.log('Draft player:', player);
    
    // Check if it's actually the user's turn
    if (!mockState.isMyTurn) {
      console.log('❌ Not your turn - cannot draft');
      return;
    }
    
    // Draft the player using the same logic as main component
    setMockState(prevState => {
      const currentPick = prevState.currentPickNumber;
      
      // Create the pick object
      const newPick = {
        pickNumber: currentPick,
        player: player,
        timestamp: Date.now(),
        teamCompositionAtTime: getTrackerColor(player, prevState, currentPick)
      };
      
      // Remove picked player from available players
      const updatedAvailablePlayers = prevState.availablePlayers.filter(p => p.name !== player.name);
      
      // Remove player from queue if they were queued
      setQueuedPlayers(prevQueue => prevQueue.filter(queuedPlayer => queuedPlayer.name !== player.name));
      
      // Advance to next pick
      const nextPickNumber = currentPick + 1;
      const nextParticipantIndex = getParticipantIndexForPick(nextPickNumber, prevState.participants.length);
      const isUserTurn = nextParticipantIndex === 0; // Assume user is first participant
      
      console.log(`✅ Drafted: ${player.name} (${player.position}) - Pick ${currentPick}`);
      console.log(`⏭️ Next up: Pick ${nextPickNumber} - ${isUserTurn ? 'Your turn' : 'CPU turn'}`);
      
      return {
        ...prevState,
        picks: [...prevState.picks, newPick],
        availablePlayers: updatedAvailablePlayers,
        currentPickNumber: nextPickNumber,
        timer: 30, // Reset timer for next pick
        isMyTurn: isUserTurn,
        isInGracePeriod: false, // Reset grace period
        isAutopickTriggered: false // Reset autopick flag
      };
    });
  };

  const handleQueuePlayer = (player) => {
    console.log('Queue player:', player);
    
    // Check if player is already queued
    const isAlreadyQueued = queuedPlayers.some(queuedPlayer => queuedPlayer.name === player.name);
    
    if (isAlreadyQueued) {
      // Remove from queue
      setQueuedPlayers(prevQueue => prevQueue.filter(queuedPlayer => queuedPlayer.name !== player.name));
      console.log(`❌ Removed ${player.name} from queue`);
    } else {
      // Add to queue
      setQueuedPlayers(prevQueue => [...prevQueue, player]);
      console.log(`✅ Added ${player.name} to queue`);
    }
  };

  // Helper function to get tracker color based on team needs
  const getTrackerColor = (player, state, pickNumber) => {
    const participantIndex = getParticipantIndexForPick(pickNumber, state.participants.length);
    
    // Get current picks for this participant
    const participantPicks = state.picks.filter(p => {
      const pParticipantIndex = getParticipantIndexForPick(p.pickNumber, state.participants.length);
      return pParticipantIndex === participantIndex && p.player;
    });
    
    const positionCounts = {
      QB: participantPicks.filter(p => p.player.position === 'QB').length,
      RB: participantPicks.filter(p => p.player.position === 'RB').length,
      WR: participantPicks.filter(p => p.player.position === 'WR').length,
      TE: participantPicks.filter(p => p.player.position === 'TE').length
    };
    
    // Add the current pick to counts
    positionCounts[player.position]++;
    
    // Determine tracker color based on most needed position after this pick
    const maxCount = Math.max(...Object.values(positionCounts));
    const minCount = Math.min(...Object.values(positionCounts));
    
    if (minCount !== maxCount) {
      // Find position with least players
      for (const [position, count] of Object.entries(positionCounts)) {
        if (count === minCount) {
          const colors = {
            QB: '#F472B6',
            RB: '#0fba80',
            WR: '#FBBF25',
            TE: '#7C3AED'
          };
          return colors[position];
        }
      }
    }
    
    return '#6B7280'; // Default grey
  };

  // Helper function to get participant index for a given pick number
  const getParticipantIndexForPick = (pickNumber, totalParticipants) => {
    const round = Math.ceil(pickNumber / totalParticipants);
    const isSnakeRound = round % 2 === 0;
    const pickIndexInRound = (pickNumber - 1) % totalParticipants;
    return isSnakeRound 
      ? totalParticipants - 1 - pickIndexInRound 
      : pickIndexInRound;
  };

  // Get user's autodraft limits from Firebase + localStorage
  const [POSITIONAL_LIMITS, setPositionalLimits] = React.useState({
    QB: 4,
    RB: 10,
    WR: 11,
    TE: 5
  });

  // Load autodraft limits on component mount
  React.useEffect(() => {
    const loadAutodraftLimits = async () => {
      try {
        const { getAutodraftLimits } = await import('../../../../../lib/autodraftLimits');
        const limits = await getAutodraftLimits();
        setPositionalLimits(limits);
        console.log('🎯 AUTODRAFT LIMITS: Loaded from Firebase/localStorage:', limits);
      } catch (error) {
        console.error('Error loading autodraft limits:', error);
        console.log('🎯 AUTODRAFT LIMITS: Using default limits');
      }
    };
    
    loadAutodraftLimits();
  }, []);

  // Function to check if a player can be drafted based on positional limits
  const canDraftPlayer = (player, state, participantIndex) => {
    // Get current picks for this participant
    const participantPicks = state.picks.filter(p => {
      const pRound = Math.ceil(p.pickNumber / state.participants.length);
      const pIsSnakeRound = pRound % 2 === 0;
      const pPickIndexInRound = (p.pickNumber - 1) % state.participants.length;
      const pParticipantIndex = pIsSnakeRound 
        ? state.participants.length - 1 - pPickIndexInRound 
        : pPickIndexInRound;
      return pParticipantIndex === participantIndex && p.player;
    });

    // Count positions already drafted
    const positionCounts = {
      QB: participantPicks.filter(p => p.player.position === 'QB').length,
      RB: participantPicks.filter(p => p.player.position === 'RB').length,
      WR: participantPicks.filter(p => p.player.position === 'WR').length,
      TE: participantPicks.filter(p => p.player.position === 'TE').length
    };

    const currentCount = positionCounts[player.position] || 0;
    const limit = POSITIONAL_LIMITS[player.position];
    const canDraft = currentCount < limit;
    
    if (!canDraft) {
      console.log(`🚫 AUTODRAFT LIMIT: Cannot draft ${player.name} (${player.position}) - already have ${currentCount}/${limit}`);
    }
    
    return canDraft;
  };

  // Autodraft algorithm - follows priority order: 1) Queue, 2) User rank, 3) ADP
  const getAutodraftPick = (availablePlayers, state, participantIndex, queuedPlayers = []) => {
    // Filter available players to only those that can be drafted (within positional limits)
    const draftablePlayers = availablePlayers.filter(player => 
      canDraftPlayer(player, state, participantIndex)
    );

    if (draftablePlayers.length === 0) {
      console.warn('⚠️ No draftable players available within positional limits');
      return null;
    }
    // Priority 1: Check if any queued players are available and draftable
    if (queuedPlayers && queuedPlayers.length > 0) {
      const queuedAvailable = queuedPlayers.find(queuedPlayer => 
        draftablePlayers.some(draftablePlayer => draftablePlayer.name === queuedPlayer.name)
      );
      if (queuedAvailable) {
        const player = draftablePlayers.find(p => p.name === queuedAvailable.name);
        console.log(`🎯 Autodraft: Picked from queue - ${player.name} (within positional limits)`);
        return player;
      }
    }

    // Priority 2: Check for custom user rankings
    // Load custom rankings (same logic as PlayerListApple)
    try {
      const { loadCustomRankings, getCustomPlayerRanking } = require('../../../../../../lib/customRankings');
      const customRankings = loadCustomRankings();
      
      if (customRankings && customRankings.length > 0) {
        // Get draftable players with custom ranks, sorted by rank
        const rankedPlayers = draftablePlayers
          .map(player => ({
            ...player,
            customRank: getCustomPlayerRanking(player.name, customRankings)
          }))
          .filter(player => player.customRank && player.customRank !== '-')
          .sort((a, b) => parseInt(a.customRank) - parseInt(b.customRank));
        
        if (rankedPlayers.length > 0) {
          console.log(`🎯 Autodraft: Picked from user rankings - ${rankedPlayers[0].name} (Rank ${rankedPlayers[0].customRank}, within positional limits)`);
          return rankedPlayers[0];
        }
      }
    } catch (error) {
      console.log('Custom rankings not available, falling back to ADP');
    }

    // Priority 3: Fall back to ADP (best available within limits)
    const adpSorted = draftablePlayers.sort((a, b) => (a.adp || 999) - (b.adp || 999));
    if (adpSorted.length > 0) {
      console.log(`🎯 Autodraft: Picked by ADP - ${adpSorted[0].name} (ADP ${adpSorted[0].adp}, within positional limits)`);
      return adpSorted[0];
    }

    // Final fallback: first draftable player
    return draftablePlayers[0];
  };

  const forcePick = () => {
    setMockState(prevState => {
      // Reset grace period if active
      if (prevState.isInGracePeriod) {
        console.log('🎯 FORCE PICK: Ending grace period');
      }
      
      // Force pick can override autopick trigger flag
      const currentPick = prevState.currentPickNumber;
      const availablePlayers = prevState.availablePlayers;
      
      if (availablePlayers.length === 0) {
        console.log('❌ No available players to pick');
        return prevState;
      }
      
      // Calculate team composition for this participant at time of pick
      const round = Math.ceil(currentPick / prevState.participants.length);
      const isSnakeRound = round % 2 === 0;
      const pickIndexInRound = (currentPick - 1) % prevState.participants.length;
      const participantIndex = isSnakeRound 
        ? prevState.participants.length - 1 - pickIndexInRound 
        : pickIndexInRound;
      
      // Implement autodraft rules - pick best available player based on team needs
      const pickedPlayer = getAutodraftPick(availablePlayers, prevState, participantIndex, queuedPlayers);
      
      // Get current picks for this participant
      const participantPicks = prevState.picks.filter(p => {
        const pRound = Math.ceil(p.pickNumber / prevState.participants.length);
        const pIsSnakeRound = pRound % 2 === 0;
        const pPickIndexInRound = (p.pickNumber - 1) % prevState.participants.length;
        const pParticipantIndex = pIsSnakeRound 
          ? prevState.participants.length - 1 - pPickIndexInRound 
          : pPickIndexInRound;
        return pParticipantIndex === participantIndex && p.player;
      });
      
      const positionCounts = {
        QB: participantPicks.filter(p => p.player.position === 'QB').length,
        RB: participantPicks.filter(p => p.player.position === 'RB').length,
        WR: participantPicks.filter(p => p.player.position === 'WR').length,
        TE: participantPicks.filter(p => p.player.position === 'TE').length
      };
      
      // Determine tracker color based on most needed position after this pick
      const maxCount = Math.max(...Object.values(positionCounts));
      const minCount = Math.min(...Object.values(positionCounts));
      let trackerColor = '#6B7280'; // Default grey
      
      if (minCount !== maxCount) {
        // Find position with least players
        for (const [position, count] of Object.entries(positionCounts)) {
          if (count === minCount) {
            const colors = {
              QB: '#F472B6',
              RB: '#0fba80',
              WR: '#FBBF25',
              TE: '#7C3AED'
            };
            trackerColor = colors[position];
            break;
          }
        }
      }

      // Create the pick object
      const newPick = {
        pickNumber: currentPick,
        player: pickedPlayer,
        timestamp: Date.now(),
        teamCompositionAtTime: trackerColor // Store the tracker color at time of pick
      };
      
      // Remove picked player from available players
      const updatedAvailablePlayers = availablePlayers.filter(p => p.name !== pickedPlayer.name);
      
      // Remove player from queue if they were queued
      setQueuedPlayers(prevQueue => prevQueue.filter(queuedPlayer => queuedPlayer.name !== pickedPlayer.name));
      
      // Advance to next pick
      const nextPickNumber = currentPick + 1;
      
      // Determine if it's user's turn (simplified - assume user is first participant)
      const nextRound = Math.ceil(nextPickNumber / prevState.participants.length);
      const isNextSnakeRound = nextRound % 2 === 0;
      const nextPickIndexInRound = (nextPickNumber - 1) % prevState.participants.length;
      const nextParticipantIndex = isNextSnakeRound 
        ? prevState.participants.length - 1 - nextPickIndexInRound 
        : nextPickIndexInRound;
      const isUserTurn = nextParticipantIndex === 0; // Assume user is first participant
      
      console.log(`🎯 Autodraft picked: ${pickedPlayer.name} (${pickedPlayer.position}) - Pick ${currentPick}`);
      console.log(`⏭️ Next up: Pick ${nextPickNumber} - ${isUserTurn ? 'Your turn' : 'CPU turn'}`);
      
      return {
        ...prevState,
        picks: [...prevState.picks, newPick],
        availablePlayers: updatedAvailablePlayers,
        currentPickNumber: nextPickNumber,
        timer: 30, // Reset timer for next pick
        isMyTurn: isUserTurn,
        isInGracePeriod: false, // Reset grace period
        isAutopickTriggered: false // Reset autopick flag
      };
    });
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <div 
        className="bg-black rounded-3xl p-1"
        style={{ 
          width: '375px', 
          height: '812px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}
      >
        <div 
          className="bg-black rounded-3xl overflow-hidden relative"
          style={{ width: '100%', height: '100%' }}
        >
          <DraftRoomApple 
            roomId="demo-apple" 
            mockState={mockState}
            setMockState={setMockState}
          />
        </div>
      </div>
      
      {/* Demo Controls */}
      <div className="ml-8 space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">iOS Draft Room</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>✅ Native iOS design patterns</p>
          <p>✅ Touch-optimized interactions</p>
          <p>✅ Gesture-driven navigation</p>
          <p>✅ Safe area handling</p>
          <p>✅ Performance-focused</p>
        </div>

        {/* Draft Control Buttons */}
        <div className="mt-6 space-y-3">
          <h3 className="text-lg font-semibold text-gray-700">Draft Controls</h3>
          
          {/* Mock Draft Button */}
          {!isDraftActive && (
            <button
              onClick={startMockDraft}
              className="w-full bg-black border border-[#60A5FA] text-white px-4 py-3 rounded-lg font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              title="Start a mock draft with 11 simulated drafters"
            >
              🎯 Start Mock Draft
            </button>
          )}

          {/* Pause/Resume Draft Button */}
          {isDraftActive && (
            <button
              onClick={isDraftPaused ? resumeDraft : pauseDraft}
              className={`w-full px-4 py-3 rounded-lg font-bold text-sm shadow-lg transition-all ${
                isDraftPaused 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
              }`}
              title={isDraftPaused ? 'Resume draft' : 'Pause draft'}
            >
              {isDraftPaused ? '▶️ Resume Draft' : '⏸️ Pause Draft'}
            </button>
          )}

          {/* Force Pick Button */}
          {isDraftActive && (
            <button
              onClick={forcePick}
              className="w-full bg-orange-500 text-white px-4 py-3 rounded-lg font-bold text-sm shadow-lg hover:bg-orange-600 transition-all"
              title="Force a pick and advance to next player"
            >
              ⚡ Force Pick
            </button>
          )}

          {/* Mock Draft Speed Toggle */}
          {isDraftActive && (
            <button
              onClick={toggleMockSpeed}
              className={`w-full px-4 py-3 rounded-lg font-bold text-sm shadow-lg transition-all ${
                mockDraftSpeed 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
              title="Toggle mock draft speed"
            >
              {mockDraftSpeed ? '🚀 Speed ON' : '⏱️ Normal Speed'}
            </button>
          )}

          {/* Restart Draft Button */}
          {isDraftActive && (
            <button
              onClick={restartDraft}
              className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-bold text-sm shadow-lg hover:bg-red-700 transition-all"
              title="Restart the draft from the beginning"
            >
              🔄 Restart Draft
            </button>
          )}

          {/* Status Display */}
          <div className="text-xs text-gray-500 mt-2">
            Status: {!isDraftActive ? 'Not Started' : isDraftPaused ? 'Paused' : 'Active'}
            {isDraftActive && mockDraftSpeed && ' (Fast Mode)'}
          </div>
        </div>
      </div>
    </div>
  );
}
