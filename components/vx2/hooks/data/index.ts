/**
 * Data Hooks
 * 
 * Hooks for fetching and managing application data.
 * All hooks follow the same pattern:
 * - Return { data, isLoading, error, refetch }
 * - Handle loading, error, and empty states
 * - Use mock data that can be swapped for API calls
 */

export { useTournaments } from './useTournaments';
export type { 
  Tournament, 
  UseTournamentsResult,
} from './useTournaments';

export { useLiveDrafts } from './useLiveDrafts';
export type { 
  LiveDraft, 
  DraftStatus,
  UseLiveDraftsResult,
} from './useLiveDrafts';

export { useMyTeams } from './useMyTeams';
export type { 
  MyTeam, 
  TeamPlayer,
  Position,
  UseMyTeamsResult,
} from './useMyTeams';

export { useExposure } from './useExposure';
export type { 
  ExposurePlayer,
  ExposureSortBy,
  SortOrder,
  ExposureFilters,
  UseExposureOptions,
  UseExposureResult,
} from './useExposure';

export { useTransactionHistory } from './useTransactionHistory';
export type { 
  Transaction,
  TransactionType,
  TransactionStatus,
  TransactionFilters,
  UseTransactionHistoryResult,
} from './useTransactionHistory';

export { useUser } from './useUser';
export type { 
  UserProfile,
  UseUserResult,
} from './useUser';

