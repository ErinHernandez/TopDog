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

import type { NextApiRequest, NextApiResponse } from 'next';
import * as fs from 'fs';
import * as path from 'path';
import { getPlayerId } from '../../../lib/playerPhotos';
import { FANTASY_POSITIONS } from '../../../lib/playerModel';
import { 
  withErrorHandling, 
  validateMethod, 
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
  type ApiLogger,
} from '../../../lib/apiErrorHandler';

// ============================================================================
// TYPES
// ============================================================================

export interface Manifest {
  images?: Record<string, {
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export interface PoolPlayer {
  id?: string;
  name: string;
  team?: string;
  position?: string;
  [key: string]: unknown;
}

export interface PlayerHeadshot {
  playerId: string;
  name: string;
  team: string | undefined;
  position: string | undefined;
  headshotUrl: string;
}

export interface HeadshotsResponse {
  count?: number;
  data: PlayerHeadshot | PlayerHeadshot[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MANIFEST_PATH = path.join(process.cwd(), 'public', 'players', 'manifest.json');
const PLAYER_POOL_PATH = path.join(process.cwd(), 'public', 'data', 'player-pool-2025.json');

// Load manifest once and cache it
let manifestCache: Manifest | null = null;
let manifestCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper to get base URL for fetching static files
function getBaseUrl(req: NextApiRequest): string {
  // Server-side: construct from request headers
  // In Vercel, use x-forwarded-proto and x-forwarded-host
  const protocol = req.headers['x-forwarded-proto'] || (req.headers['x-forwarded-host'] ? 'https' : 'http');
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  return `${protocol}://${host}`;
}

async function loadManifest(req: NextApiRequest, logger: ApiLogger): Promise<Manifest | null> {
  const now = Date.now();
  if (manifestCache && (now - manifestCacheTime) < CACHE_TTL) {
    return manifestCache;
  }

  try {
    // Try filesystem first (works in local dev and build time)
    try {
      if (fs.existsSync && fs.existsSync(MANIFEST_PATH)) {
        const manifestData = fs.readFileSync(MANIFEST_PATH, 'utf8');
        manifestCache = JSON.parse(manifestData) as Manifest;
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
      logger.warn('Headshots manifest not found', { url: manifestUrl });
      return null;
    }
    
    const manifestData = await response.json() as Manifest;
    manifestCache = manifestData;
    manifestCacheTime = now;
    return manifestCache;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error loading headshots manifest', error instanceof Error ? error : new Error(errorMessage));
    return null;
  }
}

async function loadPlayerPool(req: NextApiRequest, logger: ApiLogger): Promise<PoolPlayer[] | null> {
  try {
    // Try filesystem first (works in local dev and build time)
    try {
      if (fs.existsSync && fs.existsSync(PLAYER_POOL_PATH)) {
        const poolData = fs.readFileSync(PLAYER_POOL_PATH, 'utf8');
        const parsed = JSON.parse(poolData) as PoolPlayer[] | { players?: PoolPlayer[] };
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
      logger.warn('Player pool not found', { url: poolUrl });
      return null;
    }
    
    const parsed = await response.json() as PoolPlayer[] | { players?: PoolPlayer[] };
    // Handle both array format and {players: []} format
    const playersArray = Array.isArray(parsed) ? parsed : parsed?.players || [];
    return playersArray;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error loading player pool', error instanceof Error ? error : new Error(errorMessage));
    return null;
  }
}

function getHeadshotUrl(playerId: string): string {
  // Return WebP URL - browser will handle fallback if needed
  return `/players/${playerId}.webp`;
}

function transformPlayerHeadshot(poolPlayer: PoolPlayer, manifest: Manifest | null): PlayerHeadshot | null {
  const playerId = getPlayerId(poolPlayer.name);
  if (!playerId) {
    return null;
  }
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

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HeadshotsResponse>
): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
    validateMethod(req, ['GET'], logger);

    logger.info('Fetching headshots', { query: req.query });

    const manifest = await loadManifest(req, logger);
    if (!manifest) {
      const error = createErrorResponse(ErrorType.INTERNAL, 'Headshots manifest not available');
      return res.status(error.statusCode).json(error.body as unknown as HeadshotsResponse);
    }

    const playerPool = await loadPlayerPool(req, logger);
    if (!playerPool || (Array.isArray(playerPool) && playerPool.length === 0)) {
      const error = createErrorResponse(
        ErrorType.INTERNAL, 
        playerPool === null ? 'Failed to load player pool file' : 'Player pool is empty'
      );
      return res.status(error.statusCode).json(error.body as unknown as HeadshotsResponse);
    }

    const { team, position, name, id } = req.query;

    // Single player lookup by name
    if (name) {
      const playerId = getPlayerId(name as string);
      const poolPlayer = playerPool.find((p: PoolPlayer) => {
        const poolId = getPlayerId(p.name);
        return poolId === playerId || p.name.toLowerCase() === (name as string).toLowerCase();
      });

      if (!poolPlayer) {
      const error = createErrorResponse(ErrorType.NOT_FOUND, `Player "${name}" not found`);
      return res.status(error.statusCode).json(error.body as unknown as HeadshotsResponse);
      }

      const transformed = transformPlayerHeadshot(poolPlayer, manifest);
      if (!transformed) {
        const error = createErrorResponse(ErrorType.NOT_FOUND, `Headshot for "${name}" not found`);
        return res.status(error.statusCode).json(error.body as unknown as HeadshotsResponse);
      }

      const response = createSuccessResponse({ data: transformed }, 200, logger);
      return res.status(response.statusCode).json(response.body.data as unknown as HeadshotsResponse);
    }

    // Get all players (with headshot URLs)
    let players = playerPool.filter((p: PoolPlayer) => 
      p.position && typeof p.position === 'string' && (FANTASY_POSITIONS as readonly string[]).includes(p.position)
    );

    // Filter by team
    if (team) {
      const teamUpper = (team as string).toUpperCase();
      players = players.filter((p: PoolPlayer) => p.team === teamUpper);
    }

    // Filter by position
    if (position) {
      const positions = (position as string).toUpperCase().split(',');
      players = players.filter((p: PoolPlayer) => p.position && positions.includes(p.position));
    }

    // Filter by ID
    if (id) {
      const idStr = id as string;
      players = players.filter((p: PoolPlayer) => (p.id || getPlayerId(p.name)) === idStr);
    }

    // Transform using manifest
    const headshots = players
      .map((p: PoolPlayer) => transformPlayerHeadshot(p, manifest))
      .filter((h): h is PlayerHeadshot => h !== null); // Remove players without headshots

    // Sort by name
    headshots.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    const response = createSuccessResponse({
      count: headshots.length,
      data: headshots,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body.data as unknown as HeadshotsResponse);
  });
}
