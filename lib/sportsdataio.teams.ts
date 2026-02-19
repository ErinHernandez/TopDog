/**
 * Teams data service for SportsDataIO
 */

import { serverLogger } from './logger/serverLogger';
import { fetchWithCache } from './sportsdataio.cache';
import { Team, TransformedTeam } from './sportsdataio.types';

const BASE_URL = 'https://api.sportsdata.io/v3/nfl';

/**
 * Fetch teams (basic)
 */
export async function fetchTeams(apiKey: string): Promise<Team[]> {
  const url = `${BASE_URL}/scores/json/Teams?key=${apiKey}`;
  serverLogger.debug('Fetching teams');

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Teams API error: ${response.status}`);

  const data = await response.json();
  serverLogger.debug('Fetched teams', { count: Array.isArray(data) ? data.length : 0 });
  return data as Team[];
}

/**
 * Fetch all teams with full details
 */
export async function fetchAllTeams(apiKey: string): Promise<Team[]> {
  const url = `${BASE_URL}/scores/json/TeamsBasic?key=${apiKey}`;
  serverLogger.debug('Fetching all teams with full details');

  const response = await fetch(url);
  if (!response.ok) throw new Error(`All Teams API error: ${response.status}`);

  const data = await response.json();
  serverLogger.debug('Fetched all teams', { count: Array.isArray(data) ? data.length : 0 });
  return data as Team[];
}

/**
 * Get teams with caching
 */
export async function getTeams(apiKey: string, forceRefresh: boolean = false): Promise<Team[]> {
  return fetchWithCache('teams', () => fetchAllTeams(apiKey), forceRefresh) as Promise<Team[]>;
}

/**
 * Transform team data to clean format
 */
export function transformTeam(team: Team): TransformedTeam | null {
  // Skip non-NFL teams (like AFC/NFC All-Pros)
  if (!team.Conference || team.Conference === 'None' || team.Division === 'None') {
    return null;
  }

  return {
    key: team.Key,
    teamId: team.TeamID,
    city: team.City,
    name: team.Name,
    fullName: team.FullName,
    conference: team.Conference,
    division: team.Division,
    byeWeek: team.ByeWeek,

    // Coaching staff
    headCoach: team.HeadCoach,
    offensiveCoordinator: team.OffensiveCoordinator,
    defensiveCoordinator: team.DefensiveCoordinator,
    specialTeamsCoach: team.SpecialTeamsCoach,

    // Schemes
    offensiveScheme: team.OffensiveScheme,
    defensiveScheme: team.DefensiveScheme,

    // Colors
    colors: {
      primary: team.PrimaryColor ? `#${team.PrimaryColor}` : null,
      secondary: team.SecondaryColor ? `#${team.SecondaryColor}` : null,
      tertiary: team.TertiaryColor ? `#${team.TertiaryColor}` : null,
      quaternary: team.QuaternaryColor ? `#${team.QuaternaryColor}` : null,
    },

    // Logos
    logoUrl: team.WikipediaLogoUrl,
    wordmarkUrl: team.WikipediaWordMarkUrl,

    // Stadium
    stadium: team.StadiumDetails ? {
      id: team.StadiumDetails.StadiumID,
      name: team.StadiumDetails.Name,
      city: team.StadiumDetails.City,
      state: team.StadiumDetails.State,
      capacity: team.StadiumDetails.Capacity,
      surface: team.StadiumDetails.PlayingSurface,
      type: team.StadiumDetails.Type,
      lat: team.StadiumDetails.GeoLat,
      lng: team.StadiumDetails.GeoLong,
    } : null,

    // DFS Info
    dfs: {
      draftKingsName: team.DraftKingsName?.trim(),
      draftKingsId: team.DraftKingsPlayerID,
      fanDuelName: team.FanDuelName,
      fanDuelId: team.FanDuelPlayerID,
      yahooName: team.YahooName,
      yahooId: team.YahooPlayerID,
    },

    // Upcoming game salaries
    upcomingSalaries: {
      draftKings: team.UpcomingDraftKingsSalary,
      fanDuel: team.UpcomingFanDuelSalary,
      yahoo: team.UpcomingYahooSalary,
    },

    // ADP (for team defense)
    adp: team.AverageDraftPosition,
    adpPPR: team.AverageDraftPositionPPR,
  };
}

/**
 * Get teams as a map by abbreviation
 */
export async function getTeamsMap(
  apiKey: string,
  forceRefresh: boolean = false
): Promise<Map<string, TransformedTeam>> {
  const teams = await getTeams(apiKey, forceRefresh);
  const map = new Map<string, TransformedTeam>();

  teams.forEach(team => {
    const transformed = transformTeam(team);
    if (transformed) {
      map.set(team.Key, transformed);
    }
  });

  return map;
}

/**
 * Get a single team by abbreviation
 */
export async function getTeamByKey(
  apiKey: string,
  teamKey: string,
  forceRefresh: boolean = false
): Promise<TransformedTeam | null> {
  const teams = await getTeams(apiKey, forceRefresh);
  const team = teams.find(t => t.Key === teamKey.toUpperCase());
  return team ? transformTeam(team) : null;
}
