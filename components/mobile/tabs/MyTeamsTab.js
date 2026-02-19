/**
 * MyTeamsTab - Mobile My Teams Component
 * 
 * Shows user's drafted teams with search, filtering, and roster view.
 * Refactored to use extracted sub-components for maintainability.
 */

import React, { useState } from 'react';

import { usePlayerData } from '../../../lib/playerDataContext';

import { TeamDetailsView, TeamListView, MOCK_TEAMS } from './MyTeams';

export default function MyTeamsTab({ 
  selectedTeam, 
  setSelectedTeam, 
  setDraftBoardTeam, 
  setShowDraftBoard 
}) {
  // Get player data from centralized context
  const { allPlayers } = usePlayerData();
  
  // Teams state (will be replaced with Firebase data)
  const [teams, setTeams] = useState(MOCK_TEAMS);

  // Team Details View
  if (selectedTeam) {
    return (
      <TeamDetailsView
        team={selectedTeam}
        teams={teams}
        setTeams={setTeams}
        setDraftBoardTeam={setDraftBoardTeam}
        setShowDraftBoard={setShowDraftBoard}
      />
    );
  }

  // Team List View
  return (
    <TeamListView
      teams={teams}
      allPlayers={allPlayers}
      onTeamSelect={setSelectedTeam}
    />
  );
}
