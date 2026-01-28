import React, { useState, useEffect } from 'react';
import type { JSX } from 'react';
import { useRouter } from 'next/router';

interface MockPlayer {
  name: string;
  position: string;
  team: string;
  adp: number;
}

interface DraftPick {
  id: string;
  player: string;
  user: string;
  pickNumber: number;
  round: number;
  position: string;
  team: string;
  adp: number;
  timestamp: Date;
}

export default function FullDraftBoardDev(): JSX.Element {
  const router = useRouter();
  const [isDraftActive, setIsDraftActive] = useState<boolean>(false);
  const [isDraftPaused, setIsDraftPaused] = useState<boolean>(false);
  const [currentPick, setCurrentPick] = useState<number>(1);
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [mockDraftSpeed, setMockDraftSpeed] = useState<boolean>(false);
  const [isRoomOwner, setIsRoomOwner] = useState<boolean>(true); // For testing purposes

  // Mock data for testing
  const mockPlayers: MockPlayer[] = [
    { name: 'Christian McCaffrey', position: 'RB', team: 'SF', adp: 1 },
    { name: 'Tyreek Hill', position: 'WR', team: 'MIA', adp: 2 },
    { name: 'CeeDee Lamb', position: 'WR', team: 'DAL', adp: 3 },
    { name: 'Bijan Robinson', position: 'RB', team: 'ATL', adp: 4 },
    { name: 'Ja\'Marr Chase', position: 'WR', team: 'CIN', adp: 5 },
    { name: 'Breece Hall', position: 'RB', team: 'NYJ', adp: 6 },
    { name: 'Amon-Ra St. Brown', position: 'WR', team: 'DET', adp: 7 },
    { name: 'Saquon Barkley', position: 'RB', team: 'PHI', adp: 8 },
    { name: 'Stefon Diggs', position: 'WR', team: 'HOU', adp: 9 },
    { name: 'Travis Kelce', position: 'TE', team: 'KC', adp: 10 },
  ];

  const mockDrafters: string[] = ['User', 'Mock1', 'Mock2', 'Mock3', 'Mock4', 'Mock5', 'Mock6', 'Mock7', 'Mock8', 'Mock9', 'Mock10', 'Mock11'];

  // Start mock draft
  const startMockDraft = (): void => {
    setIsDraftActive(true);
    setCurrentPick(1);
    setPicks([]);
    setIsDraftPaused(false);
  };

  // Pause/Resume draft
  const pauseDraft = (): void => {
    setIsDraftPaused(true);
  };

  const resumeDraft = (): void => {
    setIsDraftPaused(false);
  };

  // Simulate 12 picks
  const sim12Picks = async (): Promise<void> => {
    if (!isDraftActive) {
      alert('Draft is not currently active.');
      return;
    }

    if (isDraftPaused) {
      alert('Draft is paused. Resume first.');
      return;
    }

    // Simulate 12 picks
    for (let i = 0; i < 12 && currentPick + i <= mockPlayers.length; i++) {
      const pickNumber = currentPick + i;
      const drafterIndex = (pickNumber - 1) % mockDrafters.length;
      const drafter = mockDrafters[drafterIndex];
      const player = mockPlayers[pickNumber - 1];
      
      if (player) {
        const newPick: DraftPick = {
          id: `pick-${pickNumber}`,
          player: player.name,
          user: drafter,
          pickNumber: pickNumber,
          round: Math.ceil(pickNumber / mockDrafters.length),
          position: player.position,
          team: player.team,
          adp: player.adp,
          timestamp: new Date(),
        };
        
        setPicks(prev => [...prev, newPick]);

        // Small delay to see the picks happening
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    setCurrentPick(prev => Math.min(prev + 12, mockPlayers.length + 1));
  };

  // Make a single pick
  const makePick = (playerName: string): void => {
    if (!isDraftActive || isDraftPaused) return;
    
    const player = mockPlayers.find(p => p.name === playerName);
    if (!player) return;
    
    const drafterIndex = (currentPick - 1) % mockDrafters.length;
    const drafter = mockDrafters[drafterIndex];
    
    const newPick: DraftPick = {
      id: `pick-${currentPick}`,
      player: player.name,
      user: drafter,
      pickNumber: currentPick,
      round: Math.ceil(currentPick / mockDrafters.length),
      position: player.position,
      team: player.team,
      adp: player.adp,
      timestamp: new Date(),
    };
    
    setPicks(prev => [...prev, newPick]);
    setCurrentPick(prev => prev + 1);
  };

  // Get available players (not yet picked)
  const availablePlayers = mockPlayers.filter(player => 
    !picks.some(pick => pick.player === player.name)
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Full Draft Board - Dev Testing</h1>
        
        {/* Status Display */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{currentPick}</div>
              <div className="text-gray-400">Current Pick</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{picks.length}</div>
              <div className="text-gray-400">Picks Made</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{availablePlayers.length}</div>
              <div className="text-gray-400">Available</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {isDraftActive ? (isDraftPaused ? '⏸️ Paused' : '🟢 Active') : '🔴 Inactive'}
              </div>
              <div className="text-gray-400">Status</div>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Draft Controls</h2>
          <div className="flex flex-wrap gap-4">
            {/* Mock Draft Button */}
            {!isDraftActive && (
              <button
                onClick={startMockDraft}
                className="bg-black border border-[#60A5FA] text-white px-6 py-3 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                title="Start a mock draft with 11 simulated drafters"
              >
                🎯 Start Mock Draft
              </button>
            )}

            {/* Pause/Resume Draft Button */}
            {isDraftActive && (
              <button
                onClick={isDraftPaused ? resumeDraft : pauseDraft}
                className={`px-6 py-3 rounded-lg font-bold text-lg shadow-lg transition-all ${
                  isDraftPaused 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-yellow-500 text-white hover:bg-yellow-600'
                }`}
                title={isDraftPaused ? 'Resume draft' : 'Pause draft'}
              >
                {isDraftPaused ? '▶️ Resume Draft' : '⏸️ Pause Draft'}
              </button>
            )}

            {/* Sim 12 Picks Button */}
            {isDraftActive && !isDraftPaused && (
              <button
                onClick={sim12Picks}
                className="bg-purple-500 text-white px-6 py-3 rounded-lg font-bold text-lg shadow-lg hover:bg-purple-600 transition-all"
                title="Simulate 12 picks"
              >
                🎲 Sim 12 Picks
              </button>
            )}

            {/* Mock Draft Speed Toggle */}
            {isDraftActive && (
              <button
                onClick={() => setMockDraftSpeed(!mockDraftSpeed)}
                className={`px-6 py-3 rounded-lg font-bold text-lg shadow-lg transition-all ${
                  mockDraftSpeed 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                title="Toggle mock draft speed"
              >
                {mockDraftSpeed ? '🚀 Speed ON' : '🐌 Speed OFF'}
              </button>
            )}

            {/* Reset Button */}
            <button
              onClick={() => {
                setIsDraftActive(false);
                setIsDraftPaused(false);
                setCurrentPick(1);
                setPicks([]);
                setMockDraftSpeed(false);
              }}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg font-bold text-lg shadow-lg hover:bg-gray-700 transition-all"
            >
              🔄 Reset
            </button>
          </div>
        </div>

        {/* Draft Board */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Players */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Available Players</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availablePlayers.map((player, index) => (
                <div
                  key={player.name}
                  className="bg-gray-700 rounded-lg p-3 flex justify-between items-center hover:bg-gray-600 transition-colors cursor-pointer"
                  onClick={() => makePick(player.name)}
                >
                  <div>
                    <div className="font-semibold">{player.name}</div>
                    <div className="text-sm text-gray-400">{player.team} • {player.position}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">ADP</div>
                    <div className="font-bold">{player.adp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Draft History */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Draft History</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {picks.map((pick) => (
                <div
                  key={pick.id}
                  className="bg-gray-700 rounded-lg p-3 flex justify-between items-center"
                >
                  <div>
                    <div className="font-semibold">#{pick.pickNumber} - {pick.player}</div>
                    <div className="text-sm text-gray-400">
                      {pick.user} • {pick.team} • {pick.position} • Round {pick.round}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">ADP</div>
                    <div className="font-bold">{pick.adp}</div>
                  </div>
                </div>
              ))}
              {picks.length === 0 && (
                <div className="text-gray-400 text-center py-8">
                  No picks made yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Current Pick Info */}
        {isDraftActive && (
          <div className="bg-gray-800 rounded-lg p-6 mt-8">
            <h2 className="text-2xl font-bold mb-4">Current Pick Info</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold">Pick #{currentPick}</div>
                <div className="text-gray-400">Pick Number</div>
              </div>
              <div>
                <div className="text-lg font-semibold">
                  Round {Math.ceil(currentPick / mockDrafters.length)}
                </div>
                <div className="text-gray-400">Current Round</div>
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {mockDrafters[(currentPick - 1) % mockDrafters.length]}
                </div>
                <div className="text-gray-400">On Clock</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
