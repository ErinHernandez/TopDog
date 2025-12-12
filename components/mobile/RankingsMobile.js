/**
 * RankingsMobile - Legacy Export
 * 
 * @deprecated Use PlayerRankingsMobile instead
 * This file re-exports the consolidated component for backwards compatibility.
 */

import PlayerRankingsMobile from './PlayerRankingsMobile';

// Export with compact variant settings matching original RankingsMobile
export default function RankingsMobile(props) {
  return (
    <PlayerRankingsMobile
      variant="compact"
      showAllFilter={false}
      showToggleButtons={false}
      showHeader={false}
      {...props}
    />
  );
}
