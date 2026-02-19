/**
 * LobbyTab - Mobile Tournament Lobby
 * 
 * Extracted from pages/mobile.js for maintainability
 * Shows available tournaments for joining
 */

import React from 'react';

import { MOBILE_SIZES } from '../../draft/v3/mobile/shared/constants/mobileSizes';
import TournamentCardMobile from '../TournamentCardMobile';

export default function LobbyTab({ onJoinClick }) {
  return (
    <div className="flex-1 py-4 flex flex-col">
      {/* Tournament Cards */}
      <div className="space-y-4 mt-6">
        <TournamentCardMobile
          title="THE TOPDOG INTERNATIONAL"
          entryFee="$25"
          totalEntries="571,480"
          firstPlacePrize="$2M"
          onJoinClick={onJoinClick}
          className="border-8 border-teal-500"
          style={{ marginTop: MOBILE_SIZES.TOUCH_TARGET_MIN }}
        />
        
        {/* Additional tournament cards can be added here */}
      </div>
    </div>
  );
}

