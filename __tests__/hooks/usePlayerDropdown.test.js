/**
 * Tests for hooks/usePlayerDropdown.js
 * 
 * Tier 4 components & hooks (40%+ coverage).
 * Tests focus on complex state logic and business behavior:
 * - Player data loading and refreshing
 * - Filtering and sorting logic
 * - Selection state management
 * - Cache management
 * - Auto-refresh behavior
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { usePlayerDropdown } from '../../hooks/usePlayerDropdown';

// Mock playerDataService
jest.mock('../../lib/playerData/PlayerDataService', () => {
  const mockService = {
    getPlayers: jest.fn(),
    refreshPlayers: jest.fn(),
    subscribe: jest.fn(() => jest.fn()), // Returns unsubscribe function
    clearCache: jest.fn(),
    getCacheStats: jest.fn(() => ({ hits: 10, misses: 2 })),
  };
  return {
    playerDataService: mockService,
  };
});

const { playerDataService } = require('../../lib/playerData/PlayerDataService');

describe('usePlayerDropdown', () => {
  const mockPlayers = [
    { id: '1', name: 'Patrick Mahomes', position: 'QB', team: 'KC', rank: 1 },
    { id: '2', name: 'Josh Allen', position: 'QB', team: 'BUF', rank: 2 },
    { id: '3', name: 'Christian McCaffrey', position: 'RB', team: 'SF', rank: 3 },
    { id: '4', name: 'Tyreek Hill', position: 'WR', team: 'MIA', rank: 4 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    playerDataService.getPlayers.mockResolvedValue(mockPlayers);
    playerDataService.refreshPlayers.mockResolvedValue(mockPlayers);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial Data Loading', () => {
    it('loads players on mount when no initial players provided', async () => {
      const { result } = renderHook(() =>
        usePlayerDropdown({
          position: null,
          team: null,
        })
      );

      expect(result.current.loading).toBe(true);
      expect(playerDataService.getPlayers).toHaveBeenCalled();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.players).toEqual(mockPlayers);
      expect(result.current.hasPlayers).toBe(true);
      expect(result.current.isEmpty).toBe(false);
    });

    it('uses initial players when provided', async () => {
      const { result } = renderHook(() =>
        usePlayerDropdown({
          initialPlayers: mockPlayers,
        })
      );

      expect(result.current.players).toEqual(mockPlayers);
      expect(playerDataService.getPlayers).not.toHaveBeenCalled();
      expect(result.current.hasPlayers).toBe(true);
    });

    it('handles loading errors gracefully', async () => {
      const error = new Error('Failed to load players');
      playerDataService.getPlayers.mockRejectedValue(error);

      const { result } = renderHook(() =>
        usePlayerDropdown({
          position: null,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load players');
      expect(result.current.players).toEqual([]);
      expect(result.current.isEmpty).toBe(true);
    });
  });

  describe('Filtering Logic', () => {
    it('filters players by position', async () => {
      playerDataService.getPlayers.mockResolvedValue(mockPlayers);

      const { result } = renderHook(() =>
        usePlayerDropdown({
          position: 'QB',
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(playerDataService.getPlayers).toHaveBeenCalledWith(
        expect.objectContaining({ position: 'QB' })
      );
    });

    it('filters players by team', async () => {
      playerDataService.getPlayers.mockResolvedValue(mockPlayers);

      const { result } = renderHook(() =>
        usePlayerDropdown({
          team: 'KC',
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(playerDataService.getPlayers).toHaveBeenCalledWith(
        expect.objectContaining({ team: 'KC' })
      );
    });

    it('filters players by search term', async () => {
      playerDataService.getPlayers.mockResolvedValue(mockPlayers);

      const { result } = renderHook(() =>
        usePlayerDropdown({
          searchTerm: 'Mahomes',
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(playerDataService.getPlayers).toHaveBeenCalledWith(
        expect.objectContaining({ searchTerm: 'Mahomes' })
      );
    });
  });

  describe('Sorting Logic', () => {
    it('sorts players by rank (default)', async () => {
      const unsortedPlayers = [
        { id: '3', name: 'Player C', rank: 3 },
        { id: '1', name: 'Player A', rank: 1 },
        { id: '2', name: 'Player B', rank: 2 },
      ];
      playerDataService.getPlayers.mockResolvedValue(unsortedPlayers);

      const { result } = renderHook(() =>
        usePlayerDropdown({
          sortBy: 'rank',
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const sorted = result.current.sortPlayers('rank');
      expect(sorted[0].rank).toBe(1);
      expect(sorted[1].rank).toBe(2);
      expect(sorted[2].rank).toBe(3);
    });

    it('sorts players by name', async () => {
      playerDataService.getPlayers.mockResolvedValue(mockPlayers);

      const { result } = renderHook(() =>
        usePlayerDropdown({
          sortBy: 'name',
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const sorted = result.current.sortPlayers('name');
      expect(sorted[0].name).toBe('Christian McCaffrey');
      expect(sorted[sorted.length - 1].name).toBe('Tyreek Hill');
    });
  });

  describe('Selection State Management', () => {
    it('manages selected player state', async () => {
      const { result } = renderHook(() =>
        usePlayerDropdown({
          initialPlayers: mockPlayers,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setSelectedPlayer(mockPlayers[0]);
      });

      expect(result.current.selectedPlayer).toEqual(mockPlayers[0]);
    });

    it('handles player selection via handler', async () => {
      const { result } = renderHook(() =>
        usePlayerDropdown({
          initialPlayers: mockPlayers,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handlePlayerSelect(mockPlayers[0]);
      });

      expect(result.current.selectedPlayer).toEqual(mockPlayers[0]);
    });

    it('handles player expansion and collapse', async () => {
      const { result } = renderHook(() =>
        usePlayerDropdown({
          initialPlayers: mockPlayers,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handlePlayerExpand(mockPlayers[0]);
      });

      expect(result.current.expandedPlayer).toEqual(mockPlayers[0]);

      act(() => {
        result.current.handlePlayerCollapse();
      });

      expect(result.current.expandedPlayer).toBeNull();
    });
  });

  describe('Refresh and Cache Management', () => {
    it('refreshes players on demand', async () => {
      const { result } = renderHook(() =>
        usePlayerDropdown({
          initialPlayers: mockPlayers,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.refreshPlayers();
      });

      expect(result.current.loading).toBe(true);
      expect(playerDataService.refreshPlayers).toHaveBeenCalled();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('clears cache on demand', async () => {
      const { result } = renderHook(() =>
        usePlayerDropdown({
          initialPlayers: mockPlayers,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.clearCache();
      });

      expect(playerDataService.clearCache).toHaveBeenCalled();
    });

    it('returns cache stats', async () => {
      const { result } = renderHook(() =>
        usePlayerDropdown({
          initialPlayers: mockPlayers,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const stats = result.current.getCacheStats();
      expect(stats).toEqual({ hits: 10, misses: 2 });
      expect(playerDataService.getCacheStats).toHaveBeenCalled();
    });
  });

  describe('Utility Functions', () => {
    it('finds player by name', async () => {
      const { result } = renderHook(() =>
        usePlayerDropdown({
          initialPlayers: mockPlayers,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const player = result.current.getPlayer('Patrick Mahomes');
      expect(player).toEqual(mockPlayers[0]);
    });

    it('returns undefined when player not found', async () => {
      const { result } = renderHook(() =>
        usePlayerDropdown({
          initialPlayers: mockPlayers,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const player = result.current.getPlayer('Non-existent Player');
      expect(player).toBeUndefined();
    });

    it('filters players by position', async () => {
      const { result } = renderHook(() =>
        usePlayerDropdown({
          initialPlayers: mockPlayers,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const qbs = result.current.getPlayersByPosition('QB');
      expect(qbs).toHaveLength(2);
      expect(qbs.every(p => p.position === 'QB')).toBe(true);
    });
  });

  describe('Computed Values', () => {
    it('correctly identifies when players are available', async () => {
      const { result } = renderHook(() =>
        usePlayerDropdown({
          initialPlayers: mockPlayers,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPlayers).toBe(true);
      expect(result.current.isEmpty).toBe(false);
    });

    it('correctly identifies empty state', async () => {
      playerDataService.getPlayers.mockResolvedValue([]);

      const { result } = renderHook(() =>
        usePlayerDropdown({
          position: null,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPlayers).toBe(false);
      expect(result.current.isEmpty).toBe(true);
    });
  });

  describe('Subscription Management', () => {
    it('subscribes to data service updates', async () => {
      const { result } = renderHook(() =>
        usePlayerDropdown({
          initialPlayers: mockPlayers,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(playerDataService.subscribe).toHaveBeenCalled();
    });

    it('unsubscribes on unmount', async () => {
      const unsubscribe = jest.fn();
      playerDataService.subscribe.mockReturnValue(unsubscribe);

      const { unmount } = renderHook(() =>
        usePlayerDropdown({
          initialPlayers: mockPlayers,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });
});
