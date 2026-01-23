/**
 * PlayerDataService - Centralized Player Data Management
 * 
 * Handles fetching, caching, and updating player data across the application.
 * Designed for daily updates and multi-context usage.
 */

import type { PlayerPoolEntry } from '../playerPool';

// ============================================================================
// TYPES
// ============================================================================

export interface PlayerDataOptions {
  position?: string | null;
  team?: string | null;
  searchTerm?: string;
  sortBy?: string;
}

export interface PlayerDataUpdate {
  players: PlayerPoolEntry[];
  lastUpdate: number;
}

export type PlayerDataCallback = (data: PlayerDataUpdate) => void;

export interface CacheStats {
  cacheSize: number;
  lastUpdate: number | null;
  isLoading: boolean;
}

export interface PlayerWithStats extends PlayerPoolEntry {
  projectedPoints?: number;
  byeWeek?: number;
  stats?: Record<string, {
    passingYards?: number;
    passingTDs?: number;
    rushingYards?: number;
    rushingTDs?: number;
    receivingYards?: number;
    receivingTDs?: number;
    [key: string]: unknown;
  }>;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

class PlayerDataService {
  private cache: Map<string, PlayerPoolEntry[]>;
  private cacheExpiry: Map<string, number>;
  private readonly CACHE_DURATION: number;
  private subscribers: Set<PlayerDataCallback>;
  private isLoading: boolean;
  private lastUpdate: number | null;

  constructor() {
    this.cache = new Map();
    this.cacheExpiry = new Map();
    this.CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    this.subscribers = new Set();
    this.isLoading = false;
    this.lastUpdate = null;
  }

  /**
   * Subscribe to player data updates
   */
  subscribe(callback: PlayerDataCallback): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers of data changes
   */
  private notify(data: PlayerDataUpdate): void {
    this.subscribers.forEach(callback => callback(data));
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry !== undefined && Date.now() < expiry;
  }

  /**
   * Get cached data or fetch fresh data
   */
  async getPlayers(options: PlayerDataOptions = {}): Promise<PlayerPoolEntry[]> {
    const cacheKey = this.generateCacheKey(options);
    
    // Return cached data if valid
    if (this.isCacheValid(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      return cached || [];
    }

    // Fetch fresh data
    return this.fetchPlayers(options);
  }

  /**
   * Fetch players from API/database
   */
  async fetchPlayers(options: PlayerDataOptions = {}): Promise<PlayerPoolEntry[]> {
    if (this.isLoading) {
      // Return existing cache while loading
      const cacheKey = this.generateCacheKey(options);
      return this.cache.get(cacheKey) || [];
    }

    this.isLoading = true;
    
    try {
      // Mock API call - replace with actual data source
      const players = await this.mockFetchPlayers(options);
      
      // Cache the results
      const cacheKey = this.generateCacheKey(options);
      this.cache.set(cacheKey, players);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);
      this.lastUpdate = Date.now();
      
      // Notify subscribers
      this.notify({ players, lastUpdate: this.lastUpdate });
      
      return players;
    } catch (error) {
      console.error('Failed to fetch players:', error);
      // Return cached data as fallback
      const cacheKey = this.generateCacheKey(options);
      return this.cache.get(cacheKey) || [];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Force refresh player data
   */
  async refreshPlayers(options: PlayerDataOptions = {}): Promise<PlayerPoolEntry[]> {
    const cacheKey = this.generateCacheKey(options);
    this.cacheExpiry.delete(cacheKey);
    return this.fetchPlayers(options);
  }

  /**
   * Generate cache key based on options
   */
  private generateCacheKey(options: PlayerDataOptions): string {
    const { position, team, searchTerm, sortBy } = options;
    return `players_${position || 'all'}_${team || 'all'}_${searchTerm || ''}_${sortBy || 'rank'}`;
  }

  /**
   * Mock data fetcher - replace with actual API
   */
  private async mockFetchPlayers(options: PlayerDataOptions = {}): Promise<PlayerPoolEntry[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock player data structure matching draft room format
    const mockPlayers: PlayerWithStats[] = [
      {
        name: 'Josh Allen',
        position: 'QB',
        team: 'BUF',
        adp: 15.2,
        projectedPoints: 285.4,
        byeWeek: 12,
        bye: 12,
        proj: 285.4,
        stats: {
          '2023': { passingYards: 4306, passingTDs: 29, rushingYards: 524, rushingTDs: 15 },
          '2022': { passingYards: 4283, passingTDs: 35, rushingYards: 762, rushingTDs: 7 },
          'projection': { passingYards: 4200, passingTDs: 32, rushingYards: 600, rushingTDs: 12 }
        }
      },
      {
        name: 'Christian McCaffrey',
        position: 'RB',
        team: 'SF',
        adp: 3.1,
        projectedPoints: 312.8,
        byeWeek: 9,
        bye: 9,
        proj: 312.8,
        stats: {
          '2023': { rushingYards: 1459, rushingTDs: 14, receivingYards: 564, receivingTDs: 7 },
          '2022': { rushingYards: 1139, rushingTDs: 8, receivingYards: 741, receivingTDs: 3 },
          'projection': { rushingYards: 1400, rushingTDs: 15, receivingYards: 600, receivingTDs: 6 }
        }
      },
      // Add more mock players...
    ];

    // Apply filters
    let filteredPlayers: PlayerPoolEntry[] = [...mockPlayers];
    
    if (options.position) {
      filteredPlayers = filteredPlayers.filter(p => p.position === options.position);
    }
    
    if (options.team) {
      filteredPlayers = filteredPlayers.filter(p => p.team === options.team);
    }
    
    if (options.searchTerm) {
      const term = options.searchTerm.toLowerCase();
      filteredPlayers = filteredPlayers.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.team.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (options.sortBy === 'adp') {
      filteredPlayers.sort((a, b) => (a.adp || 999) - (b.adp || 999));
    } else if (options.sortBy === 'projection') {
      filteredPlayers.sort((a, b) => {
        const aProj = (a as PlayerWithStats).projectedPoints || 0;
        const bProj = (b as PlayerWithStats).projectedPoints || 0;
        return bProj - aProj;
      });
    }

    return filteredPlayers;
  }

  /**
   * Get player by name
   */
  async getPlayer(playerName: string): Promise<PlayerPoolEntry | undefined> {
    const players = await this.getPlayers();
    return players.find(p => p.name === playerName);
  }

  /**
   * Get players by position
   */
  async getPlayersByPosition(position: string): Promise<PlayerPoolEntry[]> {
    return this.getPlayers({ position });
  }

  /**
   * Search players
   */
  async searchPlayers(searchTerm: string): Promise<PlayerPoolEntry[]> {
    return this.getPlayers({ searchTerm });
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    return {
      cacheSize: this.cache.size,
      lastUpdate: this.lastUpdate,
      isLoading: this.isLoading
    };
  }
}

// Export singleton instance
export const playerDataService = new PlayerDataService();
export default playerDataService;
