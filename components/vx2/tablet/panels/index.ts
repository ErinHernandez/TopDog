/**
 * Tablet Panel Components
 * 
 * Components for the three-panel layout system.
 */

export { default as PanelContainer, PanelHeader } from './PanelContainer';
export { default as PanelDivider } from './PanelDivider';

// Re-export types
export type {
  PanelContainerProps,
  PanelDividerProps,
  PanelId,
  PanelDimensions,
  PanelVisibility,
} from '../../core/types/tablet';

