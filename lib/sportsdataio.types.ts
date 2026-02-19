/**
 * Type definitions for SportsDataIO API integration
 */

export type DataType =
  | 'projections'
  | 'schedule'
  | 'injuries'
  | 'depthCharts'
  | 'playerStats'
  | 'teams'
  | 'news'
  | 'byeWeeks'
  | 'players'
  | 'headshots'
  | 'liveScores'
  | 'boxScores'
  | 'timeframes'
  | 'seasonStats'
  | 'weeklyStats'
  | 'redZoneStats'
  | 'playerSeasonStats'
  | 'adp'
  | 'fantasyRankings';

export interface CacheConfig {
  file: string;
  ttl: number;
}

export interface CacheInfo {
  updatedAt: string;
  ageMs: number;
  ageHours: string;
  isValid: boolean;
  playerCount: number;
}

export interface CacheStatus {
  exists: boolean;
  updatedAt?: string;
  ageMinutes?: number;
  isValid?: boolean;
  ttlMinutes?: number;
  itemCount?: number;
  error?: string;
}

export interface SportsDataIOPlayer {
  PlayerID: number;
  Name: string;
  Position: string;
  Team: string;
  [key: string]: unknown;
}

export interface TransformedPlayer {
  name: string;
  position: string;
  team: string;
  sportsDataId: number;
  proj: string;
  projections: {
    ppr: number;
    halfPpr: number;
    standard: number;
    passing: unknown;
    rushing: unknown;
    receiving: unknown;
  };
}

export interface Team {
  Key: string;
  TeamID: number;
  City: string;
  Name: string;
  FullName: string;
  Conference: string;
  Division: string;
  ByeWeek: number;
  HeadCoach?: string;
  OffensiveCoordinator?: string;
  DefensiveCoordinator?: string;
  SpecialTeamsCoach?: string;
  OffensiveScheme?: string;
  DefensiveScheme?: string;
  PrimaryColor?: string;
  SecondaryColor?: string;
  TertiaryColor?: string;
  QuaternaryColor?: string;
  WikipediaLogoUrl?: string;
  WikipediaWordMarkUrl?: string;
  StadiumDetails?: {
    StadiumID: number;
    Name: string;
    City: string;
    State: string;
    Capacity: number;
    PlayingSurface: string;
    Type: string;
    GeoLat: number;
    GeoLong: number;
  };
  DraftKingsName?: string;
  DraftKingsPlayerID?: number;
  FanDuelName?: string;
  FanDuelPlayerID?: number;
  YahooName?: string;
  YahooPlayerID?: number;
  UpcomingDraftKingsSalary?: number;
  UpcomingFanDuelSalary?: number;
  UpcomingYahooSalary?: number;
  AverageDraftPosition?: number;
  AverageDraftPositionPPR?: number;
  [key: string]: unknown;
}

export interface TransformedTeam {
  key: string;
  teamId: number;
  city: string;
  name: string;
  fullName: string;
  conference: string;
  division: string;
  byeWeek: number;
  headCoach?: string;
  offensiveCoordinator?: string;
  defensiveCoordinator?: string;
  specialTeamsCoach?: string;
  offensiveScheme?: string;
  defensiveScheme?: string;
  colors: {
    primary: string | null;
    secondary: string | null;
    tertiary: string | null;
    quaternary: string | null;
  };
  logoUrl?: string;
  wordmarkUrl?: string;
  stadium: {
    id: number;
    name: string;
    city: string;
    state: string;
    capacity: number;
    surface: string;
    type: string;
    lat: number;
    lng: number;
  } | null;
  dfs: {
    draftKingsName?: string;
    draftKingsId?: number;
    fanDuelName?: string;
    fanDuelId?: number;
    yahooName?: string;
    yahooId?: number;
  };
  upcomingSalaries: {
    draftKings?: number;
    fanDuel?: number;
    yahoo?: number;
  };
  adp?: number;
  adpPPR?: number;
}

export interface NewsItem {
  NewsID: number;
  Source: string;
  Updated: string;
  TimeAgo: string;
  Title: string;
  Content: string;
  Url: string;
  TermsOfUse: string;
  Author: string;
  Categories: string;
  PlayerID?: number;
  TeamID?: number;
  Team?: string;
  PlayerID2?: number;
  TeamID2?: number;
  Team2?: string;
  [key: string]: unknown;
}

export interface Injury {
  InjuryID: number;
  PlayerID: number;
  Name: string;
  Position: string;
  Team: string;
  Opponent: string;
  BodyPart: string;
  Status: string;
  Practice: string;
  PracticeStatus: string;
  Updated: string;
  DeclaredInactive: boolean;
  [key: string]: unknown;
}

export interface DepthChart {
  PlayerID: number;
  Name: string;
  Position: string;
  DepthOrder: number;
  Team: string;
  [key: string]: unknown;
}

export interface GameScore {
  ScoreID: number;
  GameKey: string;
  Season: number;
  SeasonType: number;
  Week: number;
  Date: string;
  DateTime?: string;
  HomeTeam: string;
  AwayTeam: string;
  HomeTeamName: string;
  AwayTeamName: string;
  HomeScore?: number;
  AwayScore?: number;
  HomeScoreQuarter1?: number;
  HomeScoreQuarter2?: number;
  HomeScoreQuarter3?: number;
  HomeScoreQuarter4?: number;
  HomeScoreOvertime?: number;
  AwayScoreQuarter1?: number;
  AwayScoreQuarter2?: number;
  AwayScoreQuarter3?: number;
  AwayScoreQuarter4?: number;
  AwayScoreOvertime?: number;
  Status: string;
  Quarter?: string;
  TimeRemaining?: string;
  Possession?: string;
  Down?: number;
  Distance?: number;
  YardLine?: number;
  YardLineTerritory?: string;
  RedZone?: boolean;
  Channel?: string;
  StadiumDetails?: {
    Name: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface TransformedGameScore {
  gameId: number;
  gameKey: string;
  season: number;
  seasonType: number;
  week: number;
  date: string;
  dateTime?: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore?: number;
  awayScore?: number;
  homeScoreQuarter1?: number;
  homeScoreQuarter2?: number;
  homeScoreQuarter3?: number;
  homeScoreQuarter4?: number;
  homeScoreOvertime?: number;
  awayScoreQuarter1?: number;
  awayScoreQuarter2?: number;
  awayScoreQuarter3?: number;
  awayScoreQuarter4?: number;
  awayScoreOvertime?: number;
  status: string;
  quarter?: string;
  timeRemaining?: string;
  possession?: string;
  down?: number;
  distance?: number;
  yardLine?: number;
  yardLineTerritory?: string;
  redZone?: boolean;
  channel?: string;
  stadium?: string;
  isLive: boolean;
  isFinal: boolean;
  isScheduled: boolean;
  isOvertime: boolean;
}

export interface LiveFantasyScore {
  playerId: number;
  name: string;
  team: string;
  position: string;
  opponent: string;
  homeOrAway: string;
  gameId: number;
  fantasyPoints: number;
  fantasyPointsPPR: number;
  fantasyPointsHalfPPR: number;
  passingYards: number;
  passingTouchdowns: number;
  passingInterceptions: number;
  rushingYards: number;
  rushingTouchdowns: number;
  receptions: number;
  receivingYards: number;
  receivingTouchdowns: number;
  fumbles: number;
}

export interface ADPData {
  PlayerID: number;
  Name: string;
  Position: string;
  Team: string;
  AverageDraftPosition?: number;
  AverageDraftPositionPPR?: number;
  AuctionValue?: number;
  AuctionValuePPR?: number;
  [key: string]: unknown;
}

export interface TransformedADP {
  playerId: number;
  name: string;
  position: string;
  team: string;
  adp?: number;
  adpPPR?: number;
  auctionValue?: number;
  auctionValuePPR?: number;
}

export interface FantasyPlayer {
  playerId: number;
  name: string;
  team: string;
  position: string;
  byeWeek?: number;
  adp?: number | null;
  adpPPR?: number | null;
  projectedPoints?: number | null;
  projectedPointsPPR?: number | null;
  overallRank: number;
  positionRank?: number | null;
  auctionValue?: number | null;
  auctionValuePPR?: number | null;
  status?: string;
  injuryStatus?: string | null;
  isDerived: boolean;
}

export interface ADPByPositionOptions {
  limit?: number;
  scoringType?: string;
}

export interface FantasyPlayersOptions {
  position?: string;
  limit?: number;
  forceRefresh?: boolean;
}
