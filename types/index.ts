/**
 * Type Definitions Index
 * 
 * Central export for all type definitions.
 * 
 * Usage:
 *   import type { PlayerFull, ApiResponse, SportsDataIOPlayer } from '@/types';
 */

// Player types
export type {
  // Position types
  FantasyPosition,
  Position,
  FlexPosition,
  NFLTeam,
  
  // Stat types
  PassingStats,
  RushingStats,
  ReceivingStats,
  FantasyPoints,
  PlayerStats,
  
  // Projection types
  Projections,
  SportsDataProjections,
  
  // ADP types
  ADPData,
  
  // Player types
  PlayerBase,
  PlayerWithHeadshot,
  PlayerListItem,
  PlayerPoolEntry,
  PlayerFull,
  PlayerMeta,
  
  // Injury types
  InjuryReport,
  InjuryStatus,
  
  // News types
  PlayerNews,
  
  // Team types
  NFLTeamInfo,
  
  // Draft types
  DraftPick,
  RosterSlot,
  
  // Utility types
  HeadshotsMap,
  InjuriesMap,
  TeamsMap,
  ByeWeeksMap,
  PositionCounts,
  
  // Filter/Sort types
  SortDirection,
  SortField,
  PlayerFilterOptions,
  PlayerPool,
} from './player';

// API types
export type {
  // Generic API types
  ApiResponse,
  PaginatedApiResponse,
  
  // SportsDataIO raw types
  SportsDataIOPlayer,
  SportsDataIOProjection,
  SportsDataIOSeasonStats,
  SportsDataIOGameStats,
  SportsDataIOADP,
  SportsDataIOInjury,
  SportsDataIONews,
  SportsDataIOTeam,
  
  // Internal API response types
  PlayersApiResponse,
  HeadshotsApiResponse,
  SeasonStatsApiResponse,
  TransformedPlayerStats,
  ADPApiResponse,
  TransformedADP,
  InjuriesApiResponse,
  NewsApiResponse,
  TeamsApiResponse,
  
  // SWR hook types
  SWRHookResult,
  UseHeadshotsResult,
  UsePlayersResult,
  UseSeasonStatsResult,
  UseADPResult,
  UseInjuriesResult,
  UseNewsResult,
  UseTeamsResult,
} from './api';

