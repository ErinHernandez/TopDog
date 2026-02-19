/**
 * Metadata services - News, Bye Weeks
 */

import { serverLogger } from './logger/serverLogger';
import { fetchWithCache } from './sportsdataio.cache';
import { NewsItem } from './sportsdataio.types';

const BASE_URL = 'https://api.sportsdata.io/v3/nfl';

// ============================================================================
// NEWS
// ============================================================================

/**
 * Fetch latest NFL news
 */
export async function fetchNews(apiKey: string): Promise<NewsItem[]> {
  const url = `${BASE_URL}/scores/json/News?key=${apiKey}`;
  serverLogger.debug('Fetching news');

  const response = await fetch(url);
  if (!response.ok) throw new Error(`News API error: ${response.status}`);

  const data = await response.json();
  serverLogger.debug('Fetched news', { itemCount: Array.isArray(data) ? data.length : 0 });
  return data as NewsItem[];
}

/**
 * Get news with caching (15 min TTL)
 */
export async function getNews(apiKey: string, forceRefresh: boolean = false): Promise<NewsItem[]> {
  return fetchWithCache('news', () => fetchNews(apiKey), forceRefresh) as Promise<NewsItem[]>;
}

/**
 * Get player-specific news
 */
export async function getPlayerNews(
  apiKey: string,
  playerName: string,
  forceRefresh: boolean = false
): Promise<NewsItem[]> {
  const news = await getNews(apiKey, forceRefresh);
  const normalizedName = playerName.toLowerCase();

  return news.filter(item => {
    const title = (item.Title || '').toLowerCase();
    const content = (item.Content || '').toLowerCase();
    return title.includes(normalizedName) || content.includes(normalizedName);
  });
}

// ============================================================================
// BYE WEEKS
// ============================================================================

/**
 * Fetch bye weeks for a season
 */
export async function fetchByeWeeks(
  apiKey: string,
  season: number = new Date().getFullYear()
): Promise<Array<{ Team: string; Week: number }>> {
  const url = `${BASE_URL}/scores/json/Byes/${season}?key=${apiKey}`;
  serverLogger.debug('Fetching bye weeks', { season });

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Bye Weeks API error: ${response.status}`);

  const data = await response.json();
  serverLogger.debug('Fetched bye weeks', { entryCount: Array.isArray(data) ? data.length : 0 });
  return data as Array<{ Team: string; Week: number }>;
}

/**
 * Get bye weeks with caching
 */
export async function getByeWeeks(
  apiKey: string,
  season: number = new Date().getFullYear(),
  forceRefresh: boolean = false
): Promise<Array<{ Team: string; Week: number }>> {
  return fetchWithCache('byeWeeks', () => fetchByeWeeks(apiKey, season), forceRefresh) as Promise<Array<{ Team: string; Week: number }>>;
}

/**
 * Get bye weeks as a map by team
 */
export async function getByeWeeksMap(
  apiKey: string,
  season: number = new Date().getFullYear(),
  forceRefresh: boolean = false
): Promise<Map<string, number>> {
  const byes = await getByeWeeks(apiKey, season, forceRefresh);
  const map = new Map<string, number>();

  byes.forEach(bye => {
    map.set(bye.Team, bye.Week);
  });

  return map;
}
