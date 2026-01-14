/**
 * PlayerList
 * 
 * Component for displaying the list of available players with filters.
 * Uses drag-drop for queue management and displays filtered/sorted players.
 * 
 * Part of Phase 3: Extract Components
 */

import React from 'react';
// @ts-expect-error - react-beautiful-dnd doesn't have type definitions
import { DragDropContext } from 'react-beautiful-dnd';
import StrictModeDroppable from '@/components/StrictModeDroppable';
import { useDraftState, useDraftDispatch } from '../context/DraftRoomContext';
import { usePlayerFilters } from '../hooks/usePlayerFilters';
import { useDraftQueue } from '../hooks/useDraftQueue';
import { PlayerCard } from './PlayerCard';
import { Player } from '../types/draft';
import { POSITION_COLORS } from '@/components/draft/v3/constants/positions';

export interface PlayerListProps {
  onPlayerClick?: (player: Player) => void;
}

/**
 * Player list component with filtering and sorting
 */
export function PlayerList({ onPlayerClick }: PlayerListProps) {
  const state = useDraftState();
  const dispatch = useDraftDispatch();
  const { filteredPlayers } = usePlayerFilters();
  const { queue, addToQueue } = useDraftQueue();

  const { filters } = state;

  // Handle drag end (for drag-drop to queue)
  const handleDragEnd = (result: any) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    // Handle dragging from available players to queue
    if (
      source.droppableId === 'available-players' &&
      destination.droppableId === 'player-queue'
    ) {
      const draggedPlayer = filteredPlayers[source.index];
      if (draggedPlayer && !queue.find((p) => p.name === draggedPlayer.name)) {
        addToQueue(draggedPlayer);
      }
      return;
    }

    // Handle reordering within queue (would be handled by QueueView component)
    // For now, just handle player to queue drag
  };

  // Handle filter changes
  const handlePositionFilter = (position: string) => {
    const currentPositions = filters.positions;
    if (position === 'ALL') {
      dispatch({ type: 'SET_FILTERS', payload: { positions: ['ALL'] } });
    } else if (currentPositions.includes(position)) {
      const newPositions = currentPositions.filter((p) => p !== position);
      dispatch({
        type: 'SET_FILTERS',
        payload: { positions: newPositions.length > 0 ? newPositions : ['ALL'] },
      });
    } else {
      const newPositions = [...currentPositions.filter((p) => p !== 'ALL'), position];
      dispatch({ type: 'SET_FILTERS', payload: { positions: newPositions } });
    }
  };

  const handleSortChange = (sortBy: 'adp' | 'rankings') => {
    if (filters.sortBy === sortBy) {
      dispatch({
        type: 'SET_FILTERS',
        payload: {
          sortDirection: filters.sortDirection === 'asc' ? 'desc' : 'asc',
        },
      });
    } else {
      dispatch({
        type: 'SET_FILTERS',
        payload: { sortBy, sortDirection: 'asc' },
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filters */}
      <div className="p-4 border-b border-gray-700">
        {/* Search */}
        <input
          type="text"
          placeholder="Search players..."
          value={filters.search}
          onChange={(e) =>
            dispatch({ type: 'SET_FILTERS', payload: { search: e.target.value } })
          }
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4"
        />

        {/* Position Filters */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => handlePositionFilter('ALL')}
            className={`px-4 py-2 rounded font-bold text-sm ${
              filters.positions.includes('ALL')
                ? 'bg-gray-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            ALL
          </button>
          {(['QB', 'RB', 'WR', 'TE'] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => handlePositionFilter(pos)}
              className={`px-4 py-2 rounded font-bold text-sm text-white ${
                filters.positions.includes(pos)
                  ? 'opacity-100'
                  : 'opacity-50 hover:opacity-75'
              }`}
              style={{
                backgroundColor: filters.positions.includes(pos)
                  ? POSITION_COLORS[pos]?.primary
                  : POSITION_COLORS[pos]?.rgba || 'rgba(0,0,0,0.3)',
              }}
            >
              {pos}
            </button>
          ))}
        </div>

        {/* Sort Buttons */}
        <div className="flex gap-4 mt-2">
          <button
            onClick={() => handleSortChange('adp')}
            className={`px-3 py-1 rounded font-bold text-sm ${
              filters.sortBy === 'adp'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            ADP {filters.sortBy === 'adp' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSortChange('rankings')}
            className={`px-3 py-1 rounded font-bold text-sm ${
              filters.sortBy === 'rankings'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Rank{' '}
            {filters.sortBy === 'rankings' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* Player List */}
      <div className="flex-1 overflow-y-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <StrictModeDroppable droppableId="available-players">
            {(provided: any) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="p-2 space-y-2"
              >
                {filteredPlayers.map((player, index) => (
                  <PlayerCard
                    key={player.name}
                    player={player}
                    index={index}
                    onPlayerClick={onPlayerClick}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </StrictModeDroppable>
        </DragDropContext>
      </div>
    </div>
  );
}
