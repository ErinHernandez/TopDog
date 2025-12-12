/**
 * PlayerDataService - Centralized Player Data Management
 * 
 * Handles fetching, caching, and updating player data across the application.
 * Designed for daily updates and multi-context usage.
 */

class PlayerDataService {
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
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers of data changes
   */
  notify(data) {
    this.subscribers.forEach(callback => callback(data));
  }

  /**
   * Check if cache is valid
   */
  isCacheValid(key) {
    const expiry = this.cacheExpiry.get(key);
    return expiry && Date.now() < expiry;
  }

  /**
   * Get cached data or fetch fresh data
   */
  async getPlayers(options = {}) {
    const cacheKey = this.generateCacheKey(options);
    
    // Return cached data if valid
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Fetch fresh data
    return this.fetchPlayers(options);
  }

  /**
   * Fetch players from API/database
   */
  async fetchPlayers(options = {}) {
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
  async refreshPlayers(options = {}) {
    const cacheKey = this.generateCacheKey(options);
    this.cacheExpiry.delete(cacheKey);
    return this.fetchPlayers(options);
  }

  /**
   * Generate cache key based on options
   */
  generateCacheKey(options) {
    const { position, team, searchTerm, sortBy } = options;
    return `players_${position || 'all'}_${team || 'all'}_${searchTerm || ''}_${sortBy || 'rank'}`;
  }

  /**
   * Mock data fetcher - replace with actual API
   */
  async mockFetchPlayers(options = {}) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock player data structure matching draft room format
    const mockPlayers = [
      {
        name: 'Josh Allen',
        position: 'QB',
        team: 'BUF',
        adp: 15.2,
        projectedPoints: 285.4,
        byeWeek: 12,
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
        stats: {
          '2023': { rushingYards: 1459, rushingTDs: 14, receivingYards: 564, receivingTDs: 7 },
          '2022': { rushingYards: 1139, rushingTDs: 8, receivingYards: 741, receivingTDs: 3 },
          'projection': { rushingYards: 1400, rushingTDs: 15, receivingYards: 600, receivingTDs: 6 }
        }
      },
      // Add more mock players...
    ];

    // Apply filters
    let filteredPlayers = [...mockPlayers];
    
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
      filteredPlayers.sort((a, b) => a.adp - b.adp);
    } else if (options.sortBy === 'projection') {
      filteredPlayers.sort((a, b) => b.projectedPoints - a.projectedPoints);
    }

    return filteredPlayers;
  }

  /**
   * Get player by name
   */
  async getPlayer(playerName) {
    const players = await this.getPlayers();
    return players.find(p => p.name === playerName);
  }

  /**
   * Get players by position
   */
  async getPlayersByPosition(position) {
    return this.getPlayers({ position });
  }

  /**
   * Search players
   */
  async searchPlayers(searchTerm) {
    return this.getPlayers({ searchTerm });
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
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

