/**
 * RankingsPageMobile - Legacy Export
 * 
 * @deprecated Use PlayerRankingsMobile instead
 * This file re-exports the consolidated component for backwards compatibility.
 */

import React from 'react';
import PlayerRankingsMobile from './PlayerRankingsMobile';

// Export with full variant settings matching original RankingsPageMobile
export default function RankingsPageMobile(props) {
  return (
    <PlayerRankingsMobile
      variant="full"
      showAllFilter={true}
      showToggleButtons={true}
      showHeader={true}
      {...props}
    />
  );
}
