/**
 * VX2 Draft Logic - Adapters Barrel Export
 */

import { MockAdapter, createMockAdapter as _createMockAdapter } from './mockAdapter';

// Re-export
export { MockAdapter };
export const createMockAdapter = _createMockAdapter;

// Re-export adapter type from types
export type { DraftAdapter, AdapterMode } from '../types';

/**
 * Create an adapter based on mode
 */
export function createAdapter(mode: 'mock' | 'firebase' | 'local' = 'mock') {
  switch (mode) {
    case 'mock':
      return _createMockAdapter();
    case 'firebase':
      // TODO: Implement Firebase adapter
      console.warn('[DraftLogic] Firebase adapter not implemented, using mock');
      return _createMockAdapter();
    case 'local':
      // TODO: Implement local adapter
      console.warn('[DraftLogic] Local adapter not implemented, using mock');
      return _createMockAdapter();
    default:
      return _createMockAdapter();
  }
}

