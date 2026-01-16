/**
 * Tournament Card Element Types
 * 
 * Centralized type definitions for all atomic tournament card components.
 * These types are also exported from individual component files, but this
 * provides a single import location for convenience.
 * 
 * @module types
 */

// Re-export all component prop types
export type { TournamentBackgroundProps } from './TournamentBackground';
export type { TournamentTitleProps } from './TournamentTitle';
export type { TournamentProgressBarProps } from './TournamentProgressBar';
export type { TournamentJoinButtonProps } from './TournamentJoinButton';
export type { TournamentStatsProps } from './TournamentStats';
