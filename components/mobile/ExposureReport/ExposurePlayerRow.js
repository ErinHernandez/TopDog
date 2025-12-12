/**
 * ExposurePlayerRow - Individual player row in the exposure report
 * 
 * Extracted from ExposureReportMobile for maintainability.
 */

import React from 'react';
import PositionBadge from '../../draft/v3/mobile/apple/components/PositionBadge';
import { getPlayerPhotoUrl } from '../../../lib/playerPhotos';
import { BYE_WEEKS } from '../../../lib/nflConstants';

export default function ExposurePlayerRow({
  player,
  index,
  isFirst,
  isLast,
  showShares,
  onToggleShares,
  headshotsMap
}) {
  const photoUrl = headshotsMap[player.name] || getPlayerPhotoUrl(player.name, player.team, player.position, 40);
  const byeWeek = BYE_WEEKS[player.team] || 'TBD';
  const exposurePercent = Math.round((player.exposure / 210) * 100);

  return (
    <div 
      className={`px-2 border-b border-gray-700 ${
        isFirst ? 'border-t border-gray-700' : ''
      } ${
        isLast ? 'pt-1 pb-4' : 'py-1'
      }`}
      style={{ minHeight: '32px' }}
    >
      <div className="flex items-center justify-between">
        {/* Left Side - Player Photo and Info */}
        <div className="flex items-center flex-1 min-w-0">
          {/* Player Photo */}
          <div 
            className="flex-shrink-0 rounded-full overflow-hidden"
            style={{ width: '36px', height: '36px', marginLeft: '8px', marginRight: '10px' }}
          >
            <img 
              src={photoUrl}
              alt={player.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = `/logos/nfl/${player.team?.toLowerCase()}.png`;
              }}
            />
          </div>
          
          {/* Player Info */}
          <div className="min-w-0 flex-1" style={{ marginLeft: '2px' }}>
            <div className="flex items-center overflow-hidden">
              <h3 className="font-medium text-white truncate max-w-[200px] text-sm">
                {player.name}
              </h3>
            </div>
            
            {/* Position Badge and Team Info */}
            <div className="text-xs text-gray-400 mt-1 flex items-center">
              <div style={{ position: 'relative', width: '25px', height: '16px', marginRight: '6px' }}>
                <PositionBadge position={player.position} width="25px" height="16px" />
              </div>
              <span>{player.team} ({byeWeek})</span>
            </div>
          </div>
        </div>

        {/* Right Side - Shares and Percentage Toggle */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="text-sm font-medium text-white text-right" style={{ minWidth: '80px', marginRight: '10px' }}>
            <span 
              className="cursor-pointer hover:text-blue-300 transition-colors inline-block text-center"
              style={{ width: '40px' }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleShares(player.name);
              }}
            >
              {showShares ? `shares: ${player.leagues}` : `${exposurePercent}%`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

