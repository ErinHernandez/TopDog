/**
 * CleanPlayerList - CSS Grid Layout Approach
 * 
 * This component uses CSS Grid instead of nested flexbox containers
 * to eliminate layout conflicts that cause badge centering issues.
 */

import React, { useState } from 'react';
import CleanPositionBadge from './CleanPositionBadge';

const CleanPlayerList = () => {
  const [sortDirection, setSortDirection] = useState('asc');

  // Mock player data matching the current app
  const mockPlayers = [
    { name: "Ja'Marr Chase", position: "WR", team: "CIN", adp: 1.1 },
    { name: "Bijan Robinson", position: "RB", team: "ATL", adp: 2.8 },
    { name: "Justin Jefferson", position: "WR", team: "MIN", adp: 3.1 },
    { name: "Saquon Barkley", position: "RB", team: "PHI", adp: 3.7 },
    { name: "Amon-Ra St. Brown", position: "WR", team: "DET", adp: 4.1 },
    { name: "Puka Nacua", position: "WR", team: "LAR", adp: 4.3 },
    { name: "Jahmyr Gibbs", position: "RB", team: "DET", adp: 5.4 },
    { name: "Lamar Jackson", position: "QB", team: "BAL", adp: 6.2 },
    { name: "Travis Kelce", position: "TE", team: "KC", adp: 7.1 },
    { name: "Tyreek Hill", position: "WR", team: "MIA", adp: 8.3 }
  ];

  return (
    <div className="clean-player-list">
      {/* Header */}
      <div className="clean-header">
        <div className="clean-header-content">
          <span>RANK</span>
          <span></span> {/* Badge column */}
          <span>PLAYER</span>
          <span 
            onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
            style={{ cursor: 'pointer' }}
          >
            {sortDirection === 'asc' || sortDirection === 'desc' ? 'ADP' : 'RANK'}
          </span>
        </div>
      </div>

      {/* Player List */}
      <div className="clean-players-container">
        {mockPlayers.map((player, index) => (
          <CleanPlayerRow 
            key={`${player.name}-${index}`}
            player={player}
            index={index}
            sortDirection={sortDirection}
          />
        ))}
      </div>

      {/* Styles */}
      <style jsx>{`
        .clean-player-list {
          height: 100%;
          background: #101927;
          color: white;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .clean-header {
          padding: 8px 16px;
          border-bottom: 1px solid #374151;
        }

        .clean-header-content {
          display: grid;
          grid-template-columns: 32px 32px 1fr 60px;
          gap: 8px;
          align-items: center;
          font-size: 11px;
          font-weight: 600;
          color: #9CA3AF;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .clean-players-container {
          overflow-y: auto;
          height: calc(100% - 60px);
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .clean-players-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

const CleanPlayerRow = ({ player, index, sortDirection }) => {
  const [isPressed, setIsPressed] = useState(false);

  // Format ADP display based on sort direction
  const getADPDisplay = () => {
    if (sortDirection === 'name_asc' || sortDirection === 'name_desc') {
      return Math.floor(player.adp); // Show as whole number for "RANK"
    }
    return player.adp.toFixed(1); // Show decimal for "ADP"
  };

  return (
    <div 
      className={`clean-player-row ${isPressed ? 'pressed' : ''}`}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      {/* Rank */}
      <div className="clean-rank">
        {index + 1}
      </div>

      {/* Position Badge - Clean container, no positioning hacks */}
      <div className="clean-badge-container">
        <CleanPositionBadge position={player.position} size="small" />
      </div>

      {/* Player Info */}
      <div className="clean-player-info">
        <div className="clean-player-name">
          {player.name}
        </div>
        <div className="clean-player-team">
          {player.team}
        </div>
      </div>

      {/* ADP/Rank */}
      <div className="clean-adp">
        {getADPDisplay()}
      </div>

      {/* Styles */}
      <style jsx>{`
        .clean-player-row {
          display: grid;
          grid-template-columns: 32px 32px 1fr 60px;
          gap: 8px;
          align-items: center;
          padding: 8px 16px;
          border-bottom: 1px solid #1F2937;
          transition: background-color 0.15s ease;
          cursor: pointer;
        }

        .clean-player-row:hover {
          background-color: #1F2937;
        }

        .clean-player-row.pressed {
          background-color: #374151;
        }

        .clean-rank {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background-color: #374151;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          color: white;
        }

        .clean-badge-container {
          /* Simple container - no positioning tricks */
          width: 24px;
          height: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .clean-player-info {
          min-width: 0; /* Allow text truncation */
        }

        .clean-player-name {
          font-size: 14px;
          font-weight: 500;
          color: white;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .clean-player-team {
          font-size: 11px;
          color: #9CA3AF;
          margin-top: 1px;
        }

        .clean-adp {
          text-align: center;
          font-size: 13px;
          font-weight: 500;
          color: white;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
        }
      `}</style>
    </div>
  );
};

export default CleanPlayerList;
