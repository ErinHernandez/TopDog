/**
 * ScrollTestDraft - Test Component for Draft Room Scrolling
 * 
 * This tests the scrolling behavior in draft room mobile interfaces
 * to identify specific issues.
 */

import React, { useState } from 'react';

export default function ScrollTestDraft() {
  const [activeTab, setActiveTab] = useState('roster');

  // Generate test data
  const testRosterItems = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    position: ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'FLEX'][i % 9] || 'BENCH',
    player: i < 15 ? `Drafted Player ${i + 1}` : null,
    team: 'TST'
  }));

  const testBoardItems = Array.from({ length: 216 }, (_, i) => ({
    id: i,
    round: Math.floor(i / 12) + 1,
    pick: (i % 12) + 1,
    player: i < 100 ? `Player ${i + 1}` : null
  }));

  const testInfoItems = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    title: `Info Section ${i + 1}`,
    content: `This is test content for info section ${i + 1}. It should scroll properly to the bottom.`
  }));

  return (
    <div className="h-full min-h-0 bg-[#101927] text-white flex flex-col">
      <style jsx>{`
        .draft-test-scroll::-webkit-scrollbar {
          width: 0px !important;
          height: 0px !important;
          display: none !important;
        }
        .draft-test-scroll {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
          -webkit-overflow-scrolling: touch !important;
        }
        @media (max-width: 768px) {
          .draft-test-scroll::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          .draft-test-scroll {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
            -webkit-overflow-scrolling: touch !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold">Draft Room Scroll Test</h2>
        <div className="flex space-x-2 mt-2">
          {['roster', 'board', 'info'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded text-sm ${
                activeTab === tab 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 flex flex-col">
        {activeTab === 'roster' && (
          <div className="flex-1 min-h-0 overflow-y-auto draft-test-scroll">
            <div className="p-2 pb-16">
              <div className="text-sm text-gray-400 mb-2">Roster Tab Test</div>
              {testRosterItems.map((item, index) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-2 border-b border-gray-700"
                  style={{ minHeight: '40px' }}
                >
                  <div className="flex items-center">
                    <div className="w-12 text-center text-sm font-medium">
                      {item.position}
                    </div>
                    <div className="ml-2">
                      {item.player || <span className="text-gray-500">Empty</span>}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {item.team}
                  </div>
                </div>
              ))}
              <div className="text-center text-green-500 py-4 font-bold">
                ROSTER END - You should see this when scrolled to bottom
              </div>
            </div>
          </div>
        )}

        {activeTab === 'board' && (
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto draft-test-scroll">
            <div className="p-2 pb-16" style={{ minWidth: '800px' }}>
              <div className="text-sm text-gray-400 mb-2">Board Tab Test</div>
              <div className="grid grid-cols-12 gap-1">
                {testBoardItems.map((item, index) => (
                  <div 
                    key={item.id}
                    className="border border-gray-600 p-2 text-xs text-center"
                    style={{ minHeight: '60px' }}
                  >
                    <div>R{item.round}</div>
                    <div>P{item.pick}</div>
                    <div className="mt-1 text-gray-400">
                      {item.player || 'Empty'}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center text-green-500 py-4 font-bold">
                BOARD END - You should see this when scrolled to bottom
              </div>
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="flex-1 min-h-0 overflow-y-auto draft-test-scroll">
            <div className="p-4 pb-16">
              <div className="text-sm text-gray-400 mb-4">Info Tab Test</div>
              {testInfoItems.map((item, index) => (
                <div 
                  key={item.id}
                  className="bg-gray-800/40 rounded-lg p-4 mb-4"
                >
                  <h3 className="font-medium text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-300">{item.content}</p>
                </div>
              ))}
              <div className="text-center text-green-500 py-4 font-bold">
                INFO END - You should see this when scrolled to bottom
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
