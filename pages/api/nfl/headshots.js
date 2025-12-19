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
  ErrorType,
  createErrorResponse,
} from '../../../lib/apiErrorHandler';

const MANIFEST_PATH = path.join(process.cwd(), 'public', 'players', 'manifest.json');
const PLAYER_POOL_PATH = path.join(process.cwd(), 'public', 'data', 'player-pool-2025.json');

// Check if we're in a serverless environment (Vercel, etc.)
const isServerless = typeof process.env.VERCEL !== 'undefined' || typeof process.env.AWS_LAMBDA_FUNCTION_NAME !== 'undefined';

// Load manifest once and cache it
let manifestCache = null;
let manifestCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function loadManifest() {
  // In serverless environments, file system access may be limited
  if (isServerless) {
    console.warn('Headshots API: File system access not available in serverless environment');
    return null;
  }

  const now = Date.now();
  if (manifestCache && (now - manifestCacheTime) < CACHE_TTL) {
    return manifestCache;
  }

  try {
    if (!fs.existsSync(MANIFEST_PATH)) {
      console.warn(`Manifest file not found: ${MANIFEST_PATH}`);
      return null;
    }
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
  // In serverless environments, file system access may be limited
  if (isServerless) {
    console.warn('Headshots API: File system access not available in serverless environment');
    return [];
  }

  try {
    if (!fs.existsSync(PLAYER_POOL_PATH)) {
      console.warn(`Player pool file not found: ${PLAYER_POOL_PATH}`);
      return [];
    }
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
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['GET'], logger);

    logger.info('Fetching headshots', { 
      query: { 
        team: req.query.team,
        position: req.query.position,
        name: req.query.name ? '***' : undefined, // Don't log full names
        id: req.query.id,
      }
    });

    const manifest = loadManifest();
    if (!manifest) {
      logger.warn('Headshots manifest not available', { 
        isServerless,
        path: MANIFEST_PATH 
      });
      const errorResponse = createErrorResponse(
        ErrorType.INTERNAL,
        'Headshots data not available in serverless environment',
        { 
          message: 'File system access is limited in serverless functions. Headshots are served statically from /players/ directory.',
          serverless: isServerless,
        },
        res.getHeader('X-Request-ID')
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }

    const playerPool = loadPlayerPool();
    if (!playerPool || playerPool.length === 0) {
      logger.warn('Player pool not available', { 
        isServerless,
        path: PLAYER_POOL_PATH 
      });
      const errorResponse = createErrorResponse(
        ErrorType.INTERNAL,
        'Player pool data not available',
        { 
          message: 'File system access is limited in serverless functions.',
          serverless: isServerless,
        },
        res.getHeader('X-Request-ID')
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
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
        logger.warn('Player not found', { playerName: name });
        const errorResponse = createErrorResponse(
          ErrorType.NOT_FOUND,
          `Player "${name}" not found`,
          { playerName: name },
          res.getHeader('X-Request-ID')
        );
        return res.status(errorResponse.statusCode).json(errorResponse.body);
      }

      const transformed = transformPlayerHeadshot(poolPlayer, manifest);
      if (!transformed) {
        logger.warn('Headshot not found for player', { playerName: name });
        const errorResponse = createErrorResponse(
          ErrorType.NOT_FOUND,
          `Headshot for "${name}" not found`,
          { playerName: name },
          res.getHeader('X-Request-ID')
        );
        return res.status(errorResponse.statusCode).json(errorResponse.body);
      }

      logger.debug('Headshot found', { playerName: name });
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

    logger.info('Headshots fetched successfully', { 
      count: headshots.length,
      filters: { team, position, id: !!id }
    });

    return res.status(200).json({
      ok: true,
      count: headshots.length,
      data: headshots,
    });
  });
}