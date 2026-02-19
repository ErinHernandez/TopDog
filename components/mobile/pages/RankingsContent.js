/**
 * RankingsContent - Mobile Rankings Content
 * 
 * Extracted from pages/mobile-rankings.js for maintainability.
 * Displays player rankings with the RankingsMobile component.
 */

import React from 'react';

import RankingsMobile from '../RankingsMobile';
import MobilePhoneFrame, { MobilePhoneContent } from '../shared/MobilePhoneFrame';

export default function RankingsContent() {
  return (
    <MobilePhoneFrame>
      <MobilePhoneContent>
        {/* Mobile Header */}
        <div 
          className="text-white px-4 py-3 flex items-center justify-between flex-shrink-0"
          style={{ 
            background: 'url(/wr_blue.png) no-repeat center center',
            backgroundSize: 'cover'
          }}
        >
          <h1 className="text-xl font-semibold">Player Rankings</h1>
          <button
            onClick={() => window.history.back()}
            className="p-1 hover:bg-blue-700 rounded-md transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Rankings Content */}
        <div className="flex-1 min-h-0">
          <RankingsMobile />
        </div>
      </MobilePhoneContent>
    </MobilePhoneFrame>
  );
}

