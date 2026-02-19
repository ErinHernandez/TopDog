/**
 * TournamentModalMobile - Mobile Tournament Entry Modal
 *
 * Based on the provided screenshots, this modal includes:
 * - Tournament header with title and basic info
 * - Entry fee, entrants, and prize information
 * - Draft speed selection
 * - Number of entries input with max limit
 * - Autopilot toggle
 * - Basic tournament info section
 * - Prize breakdown table
 * - Roster requirements
 * - All rules and Enter buttons
 */

import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

import { createScopedLogger } from '../../lib/clientLogger';

import TournamentRulesModal from './modals/TournamentRulesModal';


const logger = createScopedLogger('[TournamentModal]');

export default function TournamentModalMobile({ open, onClose, tournamentType = 'topdog' }) {
  const router = useRouter();
  const [numberOfEntries, setNumberOfEntries] = useState(1);
  const [autopilotEnabled, setAutopilotEnabled] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [open]);

  // Get tournament config based on type
  const getTournamentConfig = () => {
    switch (tournamentType) {
      default: // topdog
        return {
          name: 'THE TOPDOG',
          subtitle: 'NFL Best Ball Championship',
          entryFee: 25,
          entrants: 1062,
          totalPrizes: 15000000,
          type: 'topdog',
          route: 'topdog',
          maxEntries: 150,
          fill: '95.2%',
          sport: 'NFL',
          slate: 'Best Ball Season Long',
          gameType: 'Best Ball',
          maxEntriesPerUser: 150
        };
    }
  };

  const config = getTournamentConfig();

  // Prize breakdown data - TopDog specific
  const prizeBreakdown = [
    { place: '1st', prize: '$8,000,000', place2: '2nd', prize2: '$4,000,000' },
    { place: '3rd', prize: '$2,000,000', place2: '4th', prize2: '$1,000,000' },
    { place: '5th', prize: '$500,000', place2: '6th', prize2: '$250,000' },
    { place: '7th', prize: '$125,000', place2: '8th', prize2: '$100,000' },
    { place: '9th', prize: '$75,000', place2: '10th', prize2: '$50,000' },
    { place: '11 - 15th', prize: '$25,000', place2: '16 - 20th', prize2: '$15,000' },
    { place: '21 - 30th', prize: '$10,000', place2: '31 - 50th', prize2: '$5,000' },
    { place: '51 - 100th', prize: '$2,500', place2: '101 - 200th', prize2: '$1,000' },
    { place: '201 - 500th', prize: '$500', place2: '501 - 1000th', prize2: '$250' },
    { place: '1001+', prize: '$100', place2: '', prize2: '' }
  ];

  // Scoring categories
  const scoringCategories = [
    { category: 'Reception 0.5', category2: 'Receiving TD 6.0' },
    { category: 'Receiving Yard 0.1', category2: 'Rushing TD 6.0' },
    { category: 'Rushing Yard 0.1', category2: 'Passing Yard 0.04' },
    { category: 'Passing TD 4.0', category2: 'Interception -1.0' },
    { category: '2-PT Conversion 2.0', category2: 'Fumble Lost -2.0' }
  ];

  // Roster requirements - TopDog format: QB, 2 RB, 3 WR, TE, 2 FLEX, 9 Bench
  const rosterRequirements = [
    { position: 'QB', count: 1, color: '#F472B6' },
    { position: 'RB', count: 2, color: '#0fba80' },
    { position: 'WR', count: 3, color: '#4285F4' },
    { position: 'TE', count: 1, color: '#7C3AED' },
    { position: 'FLEX', count: 2, color: '#9CA3AF' },
    { position: 'Bench', count: 9, color: '#6B7280' }
  ];

  const handleEnterTournament = async () => {
    setIsJoining(true);
    try {
      // Navigate to draft room - for now just navigate to the demo
      router.push('/testing-grounds/mobile-apple-demo');
    } catch (error) {
      logger.error('Error entering tournament', error);
    } finally {
      setIsJoining(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="absolute inset-0 z-50 bg-black bg-opacity-75">
        <div 
          className="bg-gray-900 w-full h-full overflow-hidden"
          style={{ 
            width: '100%',
            height: '100%'
          }}
        >
          {/* Header */}
          <div className="relative px-6 py-4 border-b border-gray-700" style={{
            background: 'url(/wr_blue.png) no-repeat center center',
            backgroundSize: 'cover'
          }}>
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-1">The TopDog International</h2>
              <div className="h-4 mb-3"></div>
              <div className="h-8"></div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="mobile-no-scrollbar overflow-y-auto" style={{ height: 'calc(100% - 264px)' }}>
            <div className="p-6 space-y-6">
              
              {/* Prize and Entry Info */}
              <div className="bg-yellow-600 rounded-lg p-4 text-center">
                <div className="text-black font-bold text-lg">Best Ball Championship - $8M to first!</div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">${config.entryFee}</div>
                  <div className="text-gray-400 text-sm">Entry</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{config.entrants.toLocaleString()}</div>
                  <div className="text-gray-400 text-sm">Entrants</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">${(config.totalPrizes / 1000000).toFixed(0)}M</div>
                  <div className="text-gray-400 text-sm">Prizes</div>
                </div>
              </div>

              {/* Draft Speed Selection */}
              <div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <div className="text-white font-medium">30 seconds per pick</div>
                </div>
              </div>

              {/* Number of Entries */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white font-medium">Number of entries</label>
                  <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">?</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="1"
                    max={config.maxEntries}
                    value={numberOfEntries}
                    onChange={(e) => setNumberOfEntries(Math.min(config.maxEntries, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  />
                  <div className="text-gray-400 text-sm">Max: {config.maxEntries}</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 text-sm">Autopilot</span>
                    <button
                      onClick={() => setAutopilotEnabled(!autopilotEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        autopilotEnabled ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        autopilotEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Basic Tournament Info */}
              <div>
                <h3 className="text-white font-bold mb-3">Basic tournament info</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sport</span>
                    <span className="text-white">{config.sport}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Fill</span>
                    <span className="text-white">{config.fill}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Slate</span>
                    <span className="text-white">{config.slate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Game type</span>
                    <span className="text-white">{config.gameType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max entries</span>
                    <span className="text-white">{config.maxEntriesPerUser}</span>
                  </div>
                </div>
              </div>

              {/* Prize Breakdown */}
              <div>
                <h3 className="text-white font-bold mb-3">Prize breakdown</h3>
                <div className="space-y-2">
                  {prizeBreakdown.map((row, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 text-sm">
                      <div className="text-gray-400">{row.place}</div>
                      <div className="text-white">{row.prize}</div>
                      <div className="text-gray-400">{row.place2}</div>
                      <div className="text-white">{row.prize2}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scoring */}
              <div>
                <h3 className="text-white font-bold mb-3">Scoring</h3>
                <div className="space-y-2">
                  {scoringCategories.map((row, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-white">{row.category}</div>
                      <div className="text-white">{row.category2}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Roster */}
              <div>
                <h3 className="text-white font-bold mb-3">Roster</h3>
                <div className="grid grid-cols-2 gap-4">
                  {rosterRequirements.map((pos, index) => (
                    <div key={index} className="text-white">
                      {pos.position}: {pos.count}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Footer Buttons */}
          <div className="border-t border-gray-700 p-4 space-y-3">
            <button
              onClick={handleEnterTournament}
              disabled={isJoining}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors"
            >
              {isJoining ? 'Entering...' : 'Enter'}
            </button>
            <button
              onClick={() => setIsRulesModalOpen(true)}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              All rules
            </button>
          </div>
        </div>
      </div>

      {/* Rules Modal - Extracted Component */}
      <TournamentRulesModal 
        open={isRulesModalOpen} 
        onClose={() => setIsRulesModalOpen(false)} 
      />
    </>
  );
}
