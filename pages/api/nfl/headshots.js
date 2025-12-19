/**
 * NFL Player Headshots API
 * 
 * GET /api/nfl/headshots
 * Query params:
 *   - team: Filter by team abbreviation
 *   - position: Filter by position (QB, RB, WR, TE)
 *   - name: Get headshot for specific player name
 *   - id: Get headshot for specific player ID
 * 
 * Returns headshot URLs for players from local files.
 * Headshots are stored in /public/players/ directory.
 */

import fs from 'fs';
import path from 'path';
import { getPlayerId } from '../../../lib/playerPhotos';
import { FANTASY_POSITIONS } from '../../../lib/playerModel';

const MANIFEST_PATH = path.join(process.cwd(), 'public', 'players', 'manifest.json');
const PLAYER_POOL_PATH = path.join(process.cwd(), 'public', 'data', 'player-pool-2025.json');

// Load manifest once and cache it
let manifestCache = null;
let manifestCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function loadManifest() {
  const now = Date.now();
  if (manifestCache && (now - manifestCacheTime) < CACHE_TTL) {
    return manifestCache;
  }

  try {
    const manifestData = fs.readFileSync(MANIFEST_PATH, 'utf8');
    manifestCache = JSON.parse(manifestData);
    manifestCacheTime = now;
    return manifestCache;
  } catch (error) {
    console.error('Error loading headshots manifest:', error);
    return null;
  }
}

function loadPlayerPool() {
  try {
    const poolData = fs.readFileSync(PLAYER_POOL_PATH, 'utf8');
    return JSON.parse(poolData);
  } catch (error) {
    console.error('Error loading player pool:', error);
    return [];
  }
}

function getHeadshotUrl(playerId) {
  // Return WebP URL - browser will handle fallback if needed
  return `/players/${playerId}.webp`;
}

function transformPlayerHeadshot(poolPlayer, manifest) {
  const playerId = getPlayerId(poolPlayer.name);
  const manifestEntry = manifest?.images?.[playerId];
  
  if (!manifestEntry) {
    return null;
  }

  return {
    playerId: poolPlayer.id || playerId,
    name: poolPlayer.name,
    team: poolPlayer.team,
    position: poolPlayer.position,
    headshotUrl: getHeadshotUrl(playerId),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const manifest = loadManifest();
    if (!manifest) {
      return res.status(500).json({ error: 'Headshots manifest not available' });
    }

    const playerPool = loadPlayerPool();
    if (!playerPool || playerPool.length === 0) {
      return res.status(500).json({ error: 'Player pool not available' });
    }

    const { team, position, name, id } = req.query;

    // Single player lookup by name
    if (name) {
      const playerId = getPlayerId(name);
      const poolPlayer = playerPool.find(p => {
        const poolId = getPlayerId(p.name);
        return poolId === playerId || p.name.toLowerCase() === name.toLowerCase();
      });

      if (!poolPlayer) {
        return res.status(404).json({ 
          ok: false, 
          error: `Player "${name}" not found` 
        });
      }

      const transformed = transformPlayerHeadshot(poolPlayer, manifest);
      if (!transformed) {
        return res.status(404).json({ 
          ok: false, 
          error: `Headshot for "${name}" not found` 
        });
      }

      return res.status(200).json({
        ok: true,
        data: transformed,
      });
    }

    // Get all players (with headshot URLs)
    let players = playerPool.filter(p => 
      FANTASY_POSITIONS.includes(p.position)
    );

    // Filter by team
    if (team) {
      players = players.filter(p => p.team === team.toUpperCase());
    }

    // Filter by position
    if (position) {
      const positions = position.toUpperCase().split(',');
      players = players.filter(p => positions.includes(p.position));
    }

    // Filter by ID
    if (id) {
      players = players.filter(p => (p.id || getPlayerId(p.name)) === id);
    }

    // Transform using manifest
    const headshots = players
      .map(p => transformPlayerHeadshot(p, manifest))
      .filter(Boolean); // Remove players without headshots

    // Sort by name
    headshots.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return res.status(200).json({
      ok: true,
      count: headshots.length,
      data: headshots,
    });
  } catch (err) {
    console.error('Headshots API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}