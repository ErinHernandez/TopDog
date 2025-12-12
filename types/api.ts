/**
 * API Response Type Definitions
 * 
 * Types for all API responses, including SportsDataIO external API
 * and internal Next.js API routes.
 */

import type { 
  FantasyPosition, 
  NFLTeam,
  PlayerListItem,
  PlayerWithHeadshot,
  InjuryReport,
  PlayerNews,
  NFLTeamInfo,
  PlayerStats,
  ADPData,
} from './player';


// ============================================================================
// GENERIC API RESPONSE
// ============================================================================

/** Standard API response wrapper */
export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  count?: number;
  total?: number;
  error?: string;
}

/** Paginated API response */
export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}


// ============================================================================
// SPORTSDATAIO RAW TYPES
// ============================================================================

/**
 * Raw player data from SportsDataIO
 * These match the API response format exactly
 */
export interface SportsDataIOPlayer {
  PlayerID: number;
  Team: string;
  Number: number | null;
  FirstName: string;
  LastName: string;
  Name: string;
  Position: string;
  Status: string;
  Height: string | null;
  Weight: number | null;
  BirthDate: string | null;
  Age: number | null;
  College: string | null;
  Experience: number | null;
  FantasyPosition: string | null;
  Active: boolean;
  PositionCategory: string | null;
  PhotoUrl: string | null;
  ByeWeek: number | null;
  UpcomingGameOpponent: string | null;
  UpcomingGameWeek: number | null;
  ShortName: string | null;
  AverageDraftPosition: number | null;
  AverageDraftPositionPPR: number | null;
  AverageDraftPositionRookie: number | null;
  AverageDraftPositionDynasty: number | null;
  AverageDraftPosition2QB: number | null;
  InjuryStatus: string | null;
  InjuryBodyPart: string | null;
  InjuryStartDate: string | null;
  InjuryNotes: string | null;
  LastUpdated: string | null;
}

/**
 * Raw projection data from SportsDataIO
 */
export interface SportsDataIOProjection {
  PlayerID: number;
  Name: string;
  Team: string;
  Position: string;
  FantasyPoints: number | null;
  FantasyPointsPPR: number | null;
  FantasyPointsHalfPPR: number | null;
  PassingAttempts: number | null;
  PassingCompletions: number | null;
  PassingYards: number | null;
  PassingTouchdowns: number | null;
  PassingInterceptions: number | null;
  RushingAttempts: number | null;
  RushingYards: number | null;
  RushingTouchdowns: number | null;
  ReceivingTargets: number | null;
  Receptions: number | null;
  ReceivingYards: number | null;
  ReceivingTouchdowns: number | null;
  Fumbles: number | null;
  FumblesLost: number | null;
}

/**
 * Raw season stats from SportsDataIO
 */
export interface SportsDataIOSeasonStats {
  PlayerID: number;
  Name: string;
  Team: string;
  Position: string;
  Played: number | null;
  FantasyPoints: number | null;
  FantasyPointsPPR: number | null;
  FantasyPointsHalfPPR: number | null;
  PassingAttempts: number | null;
  PassingCompletions: number | null;
  PassingYards: number | null;
  PassingTouchdowns: number | null;
  PassingInterceptions: number | null;
  PassingRating: number | null;
  PassingYardsPerAttempt: number | null;
  PassingCompletionPercentage: number | null;
  RushingAttempts: number | null;
  RushingYards: number | null;
  RushingTouchdowns: number | null;
  RushingYardsPerAttempt: number | null;
  RushingLong: number | null;
  ReceivingTargets: number | null;
  Receptions: number | null;
  ReceivingYards: number | null;
  ReceivingTouchdowns: number | null;
  ReceivingYardsPerReception: number | null;
  ReceivingLong: number | null;
  Fumbles: number | null;
  FumblesLost: number | null;
  OffensiveSnapsPlayed: number | null;
  OffensiveTeamSnaps: number | null;
}

/**
 * Raw game stats from SportsDataIO
 */
export interface SportsDataIOGameStats extends SportsDataIOSeasonStats {
  Week: number;
  Opponent: string;
  HomeOrAway: 'HOME' | 'AWAY';
  ScoreID: number;
  GameDate: string;
}

/**
 * Raw ADP data from SportsDataIO
 */
export interface SportsDataIOADP {
  PlayerID: number;
  Name: string;
  Team: string;
  Position: string;
  AverageDraftPosition: number | null;
  AverageDraftPositionPPR: number | null;
  AverageDraftPosition2QB: number | null;
  AverageDraftPositionDynasty: number | null;
  AverageDraftPositionRookie: number | null;
  PositionRank: number | null;
  OverallRank: number | null;
  ByeWeek: number | null;
  ProjectedFantasyPoints: number | null;
  ProjectedFantasyPointsPPR: number | null;
  LastUpdated: string | null;
  _derived?: boolean;
}

/**
 * Raw injury data from SportsDataIO
 */
export interface SportsDataIOInjury {
  PlayerID: number;
  Name: string;
  Team: string;
  Position: string;
  InjuryStatus: string | null;
  BodyPart: string | null;
  Notes: string | null;
  PracticeStatus: string | null;
  LastUpdated: string | null;
}

/**
 * Raw news data from SportsDataIO
 */
export interface SportsDataIONews {
  NewsID: number;
  PlayerID: number | null;
  Team: string | null;
  Title: string;
  Content: string;
  Url: string | null;
  Source: string;
  TermsOfUse: string | null;
  Author: string | null;
  Categories: string | null;
  TimeAgo: string | null;
  Updated: string;
  OriginalSource: string | null;
  OriginalSourceUrl: string | null;
}

/**
 * Raw team data from SportsDataIO
 */
export interface SportsDataIOTeam {
  TeamID: number;
  Key: string;
  City: string;
  Name: string;
  FullName: string;
  Conference: string;
  Division: string;
  PrimaryColor: string | null;
  SecondaryColor: string | null;
  TertiaryColor: string | null;
  QuaternaryColor: string | null;
  WikipediaLogoUrl: string | null;
  WikipediaWordMarkUrl: string | null;
  ByeWeek: number | null;
  StadiumID: number | null;
  HeadCoach: string | null;
  OffensiveCoordinator: string | null;
  DefensiveCoordinator: string | null;
  SpecialTeamsCoach: string | null;
  OffensiveScheme: string | null;
  DefensiveScheme: string | null;
}


// ============================================================================
// INTERNAL API RESPONSE TYPES
// ============================================================================

/** /api/nfl/players response */
export interface PlayersApiResponse extends ApiResponse<PlayerWithHeadshot[]> {
  count: number;
  total: number;
}

/** /api/nfl/headshots response */
export interface HeadshotsApiResponse extends ApiResponse<PlayerWithHeadshot[]> {
  count: number;
}

/** /api/nfl/stats/season response */
export interface SeasonStatsApiResponse extends ApiResponse<TransformedPlayerStats[]> {
  season: number;
  count: number;
  total: number;
}

/** Transformed player stats (from API) */
export interface TransformedPlayerStats {
  playerId: number;
  name: string;
  team: string;
  position: FantasyPosition;
  games: number;
  fantasyPoints: number;
  fantasyPointsPPR: number;
  fantasyPointsHalfPPR: number;
  fantasyPointsPerGame: string;
  passing: {
    attempts: number;
    completions: number;
    yards: number;
    touchdowns: number;
    interceptions: number;
    rating: number;
    yardsPerAttempt: number;
    completionPct: number;
  };
  rushing: {
    attempts: number;
    yards: number;
    touchdowns: number;
    yardsPerAttempt: number;
    long: number;
  };
  receiving: {
    targets: number;
    receptions: number;
    yards: number;
    touchdowns: number;
    yardsPerReception: number;
    long: number;
    catchPct: number | string;
  };
  fumbles: number;
  fumblesLost: number;
  offensiveSnaps: number;
  offensiveSnapsPct: string;
}

/** /api/nfl/fantasy/adp response */
export interface ADPApiResponse extends ApiResponse<TransformedADP[]> {
  scoringType: string;
  count: number;
}

/** Transformed ADP (from API) */
export interface TransformedADP {
  playerId: number;
  name: string;
  team: string;
  position: FantasyPosition;
  adp: number | null;
  adpPPR: number | null;
  adpHalfPPR: number | null;
  adpDynasty: number | null;
  adpRookie: number | null;
  positionRank: number | null;
  overallRank: number | null;
  byeWeek: number | null;
  projectedPoints: number | null;
  projectedPointsPPR: number | null;
  lastUpdated: string | null;
  isDerived: boolean;
}

/** /api/nfl/injuries response */
export interface InjuriesApiResponse extends ApiResponse<InjuryReport[]> {
  count: number;
}

/** /api/nfl/news response */
export interface NewsApiResponse extends ApiResponse<PlayerNews[]> {
  count: number;
}

/** /api/nfl/teams response */
export interface TeamsApiResponse extends ApiResponse<NFLTeamInfo[]> {
  count: number;
}


// ============================================================================
// SWR HOOK RETURN TYPES
// ============================================================================

/** Base SWR hook return type */
export interface SWRHookResult<T> {
  data: T;
  isLoading: boolean;
  isValidating: boolean;
  error: Error | undefined;
  mutate: () => void;
}

/** Headshots hook return */
export interface UseHeadshotsResult extends SWRHookResult<PlayerWithHeadshot[]> {
  headshots: PlayerWithHeadshot[];
  headshotsMap: Record<string, string>;
}

/** Players hook return */
export interface UsePlayersResult extends SWRHookResult<PlayerWithHeadshot[]> {
  players: PlayerWithHeadshot[];
}

/** Season stats hook return */
export interface UseSeasonStatsResult extends SWRHookResult<TransformedPlayerStats[]> {
  stats: TransformedPlayerStats[];
}

/** ADP hook return */
export interface UseADPResult extends SWRHookResult<TransformedADP[]> {
  adp: TransformedADP[];
}

/** Injuries hook return */
export interface UseInjuriesResult extends SWRHookResult<InjuryReport[]> {
  injuries: InjuryReport[];
  injuriesMap: Record<string, InjuryReport>;
}

/** News hook return */
export interface UseNewsResult extends SWRHookResult<PlayerNews[]> {
  news: PlayerNews[];
}

/** Teams hook return */
export interface UseTeamsResult extends SWRHookResult<NFLTeamInfo[]> {
  teams: NFLTeamInfo[];
  teamsMap: Record<string, NFLTeamInfo>;
}

