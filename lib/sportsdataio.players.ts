/**
 * Players and Headshots service for SportsDataIO
 */

import { serverLogger } from './logger/serverLogger';
import { fetchWithCache } from './sportsdataio.cache';
import { SportsDataIOPlayer } from './sportsdataio.types';

const BASE_URL = 'https://api.sportsdata.io/v3/nfl';

/**
 * Fetch all NFL players
 */
export async function fetchPlayers(apiKey: string): Promise<SportsDataIOPlayer[]> {
  const url = `${BASE_URL}/scores/json/Players?key=${apiKey}`;
  serverLogger.debug('Fetching all players');

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Players API error: ${response.status}`);

  const data = await response.json();
  serverLogger.debug('Fetched all players', { count: Array.isArray(data) ? data.length : 0 });
  return data as SportsDataIOPlayer[];
}

/**
 * Get all players with caching
 */
export async function getPlayers(apiKey: string, forceRefresh: boolean = false): Promise<SportsDataIOPlayer[]> {
  return fetchWithCache('players', () => fetchPlayers(apiKey), forceRefresh) as Promise<SportsDataIOPlayer[]>;
}

/**
 * Fetch player headshots (dedicated headshot endpoint)
 */
export async function fetchHeadshots(apiKey: string): Promise<Array<{
  PlayerID: number;
  Name: string;
  Team: string;
  Position: string;
  PreferredHostedHeadshotUrl?: string;
  HeadshotUrl?: string;
  PreferredHostedHeadshotBackgroundUrl?: string;
  Updated?: string;
  [key: string]: unknown;
}>> {
  const url = `${BASE_URL}/scores/json/Headshots?key=${apiKey}`;
  serverLogger.debug('Fetching headshots');

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Headshots API error: ${response.status}`);

  const data = await response.json();
  serverLogger.debug('Fetched headshots', { count: Array.isArray(data) ? data.length : 0 });
  return data as Array<{
    PlayerID: number;
    Name: string;
    Team: string;
    Position: string;
    PreferredHostedHeadshotUrl?: string;
    HeadshotUrl?: string;
    PreferredHostedHeadshotBackgroundUrl?: string;
    Updated?: string;
    [key: string]: unknown;
  }>;
}

/**
 * Get headshots with caching (7 day TTL - headshots rarely change)
 */
export async function getHeadshots(
  apiKey: string,
  forceRefresh: boolean = false
): Promise<Array<{
  PlayerID: number;
  Name: string;
  Team: string;
  Position: string;
  PreferredHostedHeadshotUrl?: string;
  HeadshotUrl?: string;
  PreferredHostedHeadshotBackgroundUrl?: string;
  Updated?: string;
  [key: string]: unknown;
}>> {
  return fetchWithCache('headshots', () => fetchHeadshots(apiKey), forceRefresh) as Promise<Array<{
    PlayerID: number;
    Name: string;
    Team: string;
    Position: string;
    PreferredHostedHeadshotUrl?: string;
    HeadshotUrl?: string;
    PreferredHostedHeadshotBackgroundUrl?: string;
    Updated?: string;
    [key: string]: unknown;
  }>>;
}

/**
 * Get headshots as a map by player ID
 */
export async function getHeadshotsMap(
  apiKey: string,
  forceRefresh: boolean = false
): Promise<Map<number, {
  playerId: number;
  name: string;
  team: string;
  position: string;
  headshotUrl?: string;
  backgroundUrl?: string;
  updatedAt?: string;
}>> {
  const headshots = await getHeadshots(apiKey, forceRefresh);
  const map = new Map();

  headshots.forEach(h => {
    if (h.PlayerID) {
      map.set(h.PlayerID, {
        playerId: h.PlayerID,
        name: h.Name,
        team: h.Team,
        position: h.Position,
        headshotUrl: h.PreferredHostedHeadshotUrl || h.HeadshotUrl,
        backgroundUrl: h.PreferredHostedHeadshotBackgroundUrl,
        updatedAt: h.Updated,
      });
    }
  });

  return map;
}

/**
 * Get players as a map by player ID
 */
export async function getPlayersMap(
  apiKey: string,
  forceRefresh: boolean = false
): Promise<Map<number, SportsDataIOPlayer>> {
  const players = await getPlayers(apiKey, forceRefresh);
  const map = new Map<number, SportsDataIOPlayer>();

  players.forEach(player => {
    if (player.PlayerID) {
      map.set(player.PlayerID, player);
    }
  });

  return map;
}

/**
 * Get player headshot URL by name
 */
export async function getPlayerHeadshot(
  apiKey: string,
  playerName: string,
  forceRefresh: boolean = false
): Promise<string | null> {
  const headshots = await getHeadshots(apiKey, forceRefresh);
  const normalizedName = playerName.toLowerCase();

  const headshot = headshots.find(h =>
    h.Name && h.Name.toLowerCase() === normalizedName
  );

  return headshot ? (headshot.PreferredHostedHeadshotUrl || headshot.HeadshotUrl || null) : null;
}

/**
 * Get player by ID
 */
export async function getPlayerById(
  apiKey: string,
  playerId: number,
  forceRefresh: boolean = false
): Promise<SportsDataIOPlayer | null> {
  const players = await getPlayers(apiKey, forceRefresh);
  return players.find(p => p.PlayerID === playerId) || null;
}
