/**
 * VX2 Live Drafts Tab
 *
 * Exports both the legacy LiveDraftsTabVX2 and the new unified DraftsTabVX2
 * which includes the premium slow drafts experience.
 */

// Legacy fast drafts tab
export { default as LiveDraftsTabVX2 } from './LiveDraftsTabVX2';
export type { LiveDraftsTabVX2Props } from './LiveDraftsTabVX2';

// New unified drafts tab with fast/slow switcher
export { default as DraftsTabVX2 } from './DraftsTabVX2';
export type { DraftsTabVX2Props } from './DraftsTabVX2';

// Re-export slow drafts for direct access
export { SlowDraftsTabVX2 } from '../slow-drafts';
