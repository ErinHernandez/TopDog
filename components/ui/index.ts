/**
 * UI Component Library
 * 
 * Shared UI components used across the entire application.
 * Migrated from components/vx2/components/shared/ and components/shared/
 */

// Feedback components (loading, error, empty states)
export * from './feedback';

// Display components (badges, cards, progress bars)
export * from './display';

// Input components
export * from './input';

// Switch component
export { default as Switch } from './Switch';
export type { SwitchProps } from './Switch';

// Player stats card
export { default as PlayerStatsCard } from './PlayerStatsCard';
export type { PlayerStatsCardProps } from './PlayerStatsCard';

// Global error boundary
export { default as GlobalErrorBoundary } from './GlobalErrorBoundary';

// Deprecation banner
export { DeprecationBanner } from './DeprecationBanner';

// Player dropdown
export * from './PlayerDropdown';

// Player expanded card
export { PlayerExpandedCard } from './PlayerExpandedCard';
