/**
 * ScrollTestNonDraft - Test Component for Non-Draft Room Scrolling
 * 
 * This tests the scrolling behavior in non-draft mobile interfaces
 * to establish a baseline for comparison.
 */

import React from 'react';

export default function ScrollTestNonDraft() {
  // Generate test data
  const testItems = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    name: `Test Player ${i + 1}`,
    position: ['QB', 'RB', 'WR', 'TE'][i % 4],
    team: 'TST',
    value: Math.floor(Math.random() * 100)
  }));

  return (
    <div className="h-full min-h-0 bg-[#101927] text-white flex flex-col">
      <style jsx>{`
        .test-scroll::-webkit-scrollbar {
          width: 0px !important;
          height: 0px !important;
          display: none !important;
        }
        .test-scroll {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
          -webkit-overflow-scrolling: touch !important;
        }
        @media (max-width: 768px) {
          .test-scroll::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          .test-scroll {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
            -webkit-overflow-scrolling: touch !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold">Non-Draft Scroll Test</h2>
        <p className="text-sm text-gray-400">Testing baseline scrolling behavior</p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto test-scroll">
        <div className="p-4 pb-16">
          {testItems.map((item, index) => (
            <div 
              key={item.id}
              className={`p-3 border-b border-gray-700 ${
                index === testItems.length - 1 ? 'border-b-0 pb-8' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-400">{item.position} • {item.team}</div>
                </div>
                <div className="text-sm text-gray-400">
                  Value: {item.value}
                </div>
              </div>
            </div>
          ))}
          <div className="text-center text-gray-500 py-4">
            End of list - you should see this text when scrolled to bottom
          </div>
        </div>
      </div>
    </div>
  );
}
