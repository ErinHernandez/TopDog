/**
 * VX2 Draft Logic - Adapters Barrel Export
 */

import { MockAdapter, createMockAdapter as _createMockAdapter } from './mockAdapter';
import { createScopedLogger } from '../../../../lib/clientLogger';

const logger = createScopedLogger('[DraftLogic]');

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
      logger.warn('Firebase adapter not implemented, using mock');
      return _createMockAdapter();
    case 'local':
      // TODO: Implement local adapter
      logger.warn('Local adapter not implemented, using mock');
      return _createMockAdapter();
    default:
      return _createMockAdapter();
  }
}

