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
import { 
  withErrorHandling, 
  validateMethod, 
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from '../../../lib/apiErrorHandler';

const MANIFEST_PATH = path.join(process.cwd(), 'public', 'players', 'manifest.json');
const PLAYER_POOL_PATH = path.join(process.cwd(), 'public', 'data', 'player-pool-2025.json');

// Load manifest once and cache it
let manifestCache = null;
let manifestCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper to get base URL for fetching static files
function getBaseUrl(req) {
  // Server-side: construct from request headers
  // In Vercel, use x-forwarded-proto and x-forwarded-host
  const protocol = req.headers['x-forwarded-proto'] || (req.headers['x-forwarded-host'] ? 'https' : 'http');
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  return `${protocol}://${host}`;
}

async function loadManifest(req, logger) {
  const now = Date.now();
  if (manifestCache && (now - manifestCacheTime) < CACHE_TTL) {
    return manifestCache;
  }

  try {
    // Try filesystem first (works in local dev and build time)
    try {
      if (fs.existsSync && fs.existsSync(MANIFEST_PATH)) {
        const manifestData = fs.readFileSync(MANIFEST_PATH, 'utf8');
        manifestCache = JSON.parse(manifestData);
        manifestCacheTime = now;
        return manifestCache;
      }
    } catch (fsError) {
      // Filesystem access not available (e.g., in serverless), fall through to HTTP fetch
    }
    
    // Fallback to HTTP fetch (works in serverless environments)
    const baseUrl = getBaseUrl(req);
    const manifestUrl = `${baseUrl}/players/manifest.json`;
    const response = await fetch(manifestUrl);
    
    if (!response.ok) {
      logger?.warn('Headshots manifest not found', { url: manifestUrl });
      return null;
    }
    
    const manifestData = await response.json();
    manifestCache = manifestData;
    manifestCacheTime = now;
    return manifestCache;
  } catch (error) {
    logger?.error('Error loading headshots manifest', { error: error.message });
    return null;
  }
}

async function loadPlayerPool(req, logger) {
  try {
    // Try filesystem first (works in local dev and build time)
    try {
      if (fs.existsSync && fs.existsSync(PLAYER_POOL_PATH)) {
        const poolData = fs.readFileSync(PLAYER_POOL_PATH, 'utf8');
        const parsed = JSON.parse(poolData);
        // Handle both array format and {players: []} format
        const playersArray = Array.isArray(parsed) ? parsed : parsed?.players || [];
        return playersArray;
      }
    } catch (fsError) {
      // Filesystem access not available (e.g., in serverless), fall through to HTTP fetch
    }
    
    // Fallback to HTTP fetch (works in serverless environments)
    const baseUrl = getBaseUrl(req);
    const poolUrl = `${baseUrl}/data/player-pool-2025.json`;
    const response = await fetch(poolUrl);
    
    if (!response.ok) {
      logger?.warn('Player pool not found', { url: poolUrl });
      return null;
    }
    
    const parsed = await response.json();
    // Handle both array format and {players: []} format
    const playersArray = Array.isArray(parsed) ? parsed : parsed?.players || [];
    return playersArray;
  } catch (error) {
    logger?.error('Error loading player pool', { error: error.message });
    return null;
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
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['GET'], logger);

    logger.info('Fetching headshots', { query: req.query });

    const manifest = await loadManifest(req, logger);
    if (!manifest) {
      const error = createErrorResponse(ErrorType.INTERNAL, 'Headshots manifest not available', 500, logger);
      return res.status(error.statusCode).json(error.body);
    }

    const playerPool = await loadPlayerPool(req, logger);
    if (!playerPool || (Array.isArray(playerPool) && playerPool.length === 0)) {
      const error = createErrorResponse(
        ErrorType.INTERNAL, 
        playerPool === null ? 'Failed to load player pool file' : 'Player pool is empty', 
        500, 
        logger
      );
      return res.status(error.statusCode).json(error.body);
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
        const error = createErrorResponse(ErrorType.NOT_FOUND, `Player "${name}" not found`, 404, logger);
        return res.status(error.statusCode).json(error.body);
      }

      const transformed = transformPlayerHeadshot(poolPlayer, manifest);
      if (!transformed) {
        const error = createErrorResponse(ErrorType.NOT_FOUND, `Headshot for "${name}" not found`, 404, logger);
        return res.status(error.statusCode).json(error.body);
      }

      const response = createSuccessResponse({ data: transformed }, 200, logger);
      return res.status(response.statusCode).json(response.body);
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

    const response = createSuccessResponse({
      count: headshots.length,
      data: headshots,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
}