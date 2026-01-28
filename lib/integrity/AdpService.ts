/**
 * AdpService
 *
 * Provides Average Draft Position (ADP) data for risk scoring.
 * ADP is the consensus ranking of players used to detect "reaches" and "falls".
 */

import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/structuredLogger';

interface AdpData {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  adp: number;  // Overall pick number (1-228)
  adpByPosition: number;  // Rank within position
  lastUpdated: Timestamp;
}

export class AdpService {
  private cache: Map<string, number> | null = null;
  private cacheExpiry: number = 0;
  private cacheCreatedAt: number = 0;
  private readonly CACHE_TTL = 1000 * 60 * 60; // 1 hour
  private readonly MAX_CACHE_AGE = 1000 * 60 * 60 * 2; // 2 hours absolute max

  /**
   * Get current ADP data
   * Returns Map of playerId -> ADP (overall pick number)
   */
  async getCurrentAdp(): Promise<Map<string, number>> {
    const now = Date.now();

    // Check if cache exists and is not expired
    if (this.cache && now < this.cacheExpiry) {
      return this.cache;
    }

    // Additional check: if cache is too old (absolute max age), clear it
    // This handles Cloud Function instances that persist between invocations
    if (this.cache && this.cacheCreatedAt > 0) {
      const cacheAge = now - this.cacheCreatedAt;
      if (cacheAge > this.MAX_CACHE_AGE) {
        logger.info('Clearing stale ADP cache', {
          component: 'AdpService',
          cacheAgeMs: cacheAge,
          maxAgeMs: this.MAX_CACHE_AGE,
        });
        this.cache = null;
        this.cacheExpiry = 0;
        this.cacheCreatedAt = 0;
      }
    }

    // Load from Firestore
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
    try {
      const adpRef = doc(db, 'adpData', 'current');
      const adpSnap = await getDoc(adpRef);

      if (!adpSnap.exists()) {
        logger.warn('No ADP data found in Firestore', {
          component: 'AdpService',
        });
        return new Map();
      }

      const data = adpSnap.data();
      const players: AdpData[] = data.players || [];

      // Build map
      this.cache = new Map();
      for (const player of players) {
        this.cache.set(player.playerId, player.adp);
      }
      this.cacheExpiry = now + this.CACHE_TTL;
      this.cacheCreatedAt = now;

      logger.info('ADP cache refreshed', {
        component: 'AdpService',
        playerCount: this.cache.size,
      });

      return this.cache;
    } catch (error) {
      logger.error('Failed to load ADP data', error as Error, {
        component: 'AdpService',
      });

      // Return empty map if cache is unavailable
      return new Map();
    }
  }

  /**
   * Get ADP for a specific player
   */
  async getPlayerAdp(playerId: string): Promise<number | null> {
    const adpMap = await this.getCurrentAdp();
    return adpMap.get(playerId) ?? null;
  }

  /**
   * Clear the cache (useful for testing or force refresh)
   */
  clearCache(): void {
    this.cache = null;
    this.cacheExpiry = 0;
    this.cacheCreatedAt = 0;
  }

  /**
   * Update ADP data (admin function)
   * Called when new ADP data is available (e.g., weekly update from external source)
   */
  async updateAdpData(players: AdpData[]): Promise<void> {
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
    const adpRef = doc(db, 'adpData', 'current');

    await setDoc(adpRef, {
      players,
      lastUpdated: Timestamp.now(),
      playerCount: players.length,
    });

    // Clear cache to force reload on next access
    this.clearCache();

    logger.info('ADP data updated', {
      component: 'AdpService',
      playerCount: players.length,
    });
  }

  /**
   * Import ADP data from external source
   * NOTE: Replace this with your actual ADP data source
   */
  async importFromSource(sourceUrl: string): Promise<void> {
    // Example: Fetch from external API
    // const response = await fetch(sourceUrl);
    // const data = await response.json();

    // Transform to AdpData format
    // interface SourcePlayer {
    //   id: string;
    //   name: string;
    //   position: string;
    //   team: string;
    //   averageDraftPosition: number;
    //   positionRank: number;
    // }
    // const players = data.map((p: SourcePlayer) => ({
    //   playerId: p.id,
    //   playerName: p.name,
    //   position: p.position,
    //   team: p.team,
    //   adp: p.averageDraftPosition,
    //   adpByPosition: p.positionRank,
    //   lastUpdated: Timestamp.now(),
    // }));

    // await this.updateAdpData(players);

    throw new Error('Not implemented - replace with your ADP source');
  }
}

// Singleton export
export const adpService = new AdpService();
