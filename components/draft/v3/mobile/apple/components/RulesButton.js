/**
 * Reusable Rules Button Component
 * 
 * Opens the same rules modal as the original, can be placed anywhere
 * Maintains the same styling and functionality
 */

import React, { useState } from 'react';
import { MOBILE_SIZES } from '../../shared/constants/mobileSizes';

export default function RulesButton({ 
  className = "",
  style = {},
  buttonText = "Rules",
  containerStyle = {}
}) {
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  return (
    <>
      {/* Rules Button */}
      <div className={`flex justify-center ${className}`} style={containerStyle}>
        <button
          onClick={() => setIsRulesModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          style={style}
        >
          {buttonText}
        </button>
      </div>

      {/* Mobile-First Rules Modal - Same as original */}
      {isRulesModalOpen && (
        <div className="absolute z-50 bg-black/80" style={{ 
          top: `${parseInt(MOBILE_SIZES.PICKS_BAR.height) * 1.35 + 68}px`, 
          left: 0, 
          right: 0, 
          bottom: 0 
        }}>
          {/* Light Blue Header Bar */}
          <div 
            className="w-full"
            style={{
              background: 'url(/wr_blue.png) no-repeat center center',
              backgroundSize: 'cover',
              height: '48px'
            }}
          />
          
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
            
            {/* Rules Content */}
            <div className="flex-1 overflow-y-auto p-4 pt-0">
              <div className="space-y-6">
                
                {/* Draft Rules Section */}
                <div className="bg-gray-800/40 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-3">Draft Rules</h3>
                  <div className="space-y-3 text-sm text-gray-300">
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-400 font-medium">•</span>
                      <span>Snake draft format - order reverses each round</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-400 font-medium">•</span>
                      <span>18 rounds total - build your complete roster</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-400 font-medium">•</span>
                      <span>90 seconds per pick (60 seconds in late rounds)</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-400 font-medium">•</span>
                      <span>Auto-draft available if you miss your pick</span>
                    </div>
                  </div>
                </div>

                {/* Scoring Rules Section */}
                <div className="bg-gray-800/40 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-3">Scoring System</h3>
                  <div className="space-y-3 text-sm text-gray-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-blue-400 font-medium mb-2">Passing</div>
                        <div className="space-y-1">
                          <div>1 pt per 25 yards</div>
                          <div>6 pts per TD</div>
                          <div>-2 pts per INT</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-blue-400 font-medium mb-2">Rushing/Receiving</div>
                        <div className="space-y-1">
                          <div>1 pt per 10 yards</div>
                          <div>6 pts per TD</div>
                          <div>1 pt per reception (PPR)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tournament Structure */}
                <div className="bg-gray-800/40 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-3">Tournament Structure</h3>
                  <div className="space-y-3 text-sm text-gray-300">
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-400 font-medium">•</span>
                      <span>Best Ball format - optimal lineup set automatically</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-400 font-medium">•</span>
                      <span>No trades, waivers, or lineup management needed</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-400 font-medium">•</span>
                      <span>Advancement based on cumulative scoring</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-400 font-medium">•</span>
                      <span>Multiple rounds leading to championship</span>
                    </div>
                  </div>
                </div>

                {/* Prize Information */}
                <div className="bg-gray-800/40 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-3">Prize Structure</h3>
                  <div className="space-y-3 text-sm text-gray-300">
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-400 font-medium">•</span>
                      <span>Total prize pool: $15,000,000</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-400 font-medium">•</span>
                      <span>1st Place: $3,000,000</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-400 font-medium">•</span>
                      <span>Top 150 finishers receive prizes</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-400 font-medium">•</span>
                      <span>See full payout structure in tournament details</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
