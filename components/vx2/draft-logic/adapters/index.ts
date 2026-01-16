/**
 * VX2 Draft Logic - Adapters Barrel Export
 */

import { MockAdapter, createMockAdapter as _createMockAdapter } from './mockAdapter';
import { FirebaseAdapter, createFirebaseAdapter as _createFirebaseAdapter } from './firebaseAdapter';
import { createScopedLogger } from '../../../../lib/clientLogger';

const logger = createScopedLogger('[DraftLogic]');

// Re-export adapters
export { MockAdapter };
export { FirebaseAdapter };
export const createMockAdapter = _createMockAdapter;
export const createFirebaseAdapter = _createFirebaseAdapter;

// Re-export adapter type from types
export type { DraftAdapter, AdapterMode } from '../types';

/**
 * Create an adapter based on mode
 *
 * @param mode - The adapter mode to use
 *   - 'mock': In-memory mock data for testing/demos
 *   - 'firebase': Real-time Firestore adapter for production
 *   - 'local': LocalStorage adapter for offline support (not yet implemented)
 */
export function createAdapter(mode: 'mock' | 'firebase' | 'local' = 'mock') {
  switch (mode) {
    case 'mock':
      return _createMockAdapter();
    case 'firebase':
      logger.info('Using Firebase adapter');
      return _createFirebaseAdapter();
    case 'local':
      // TODO: Implement local adapter for offline support
      logger.warn('Local adapter not implemented, using mock');
      return _createMockAdapter();
    default:
      return _createMockAdapter();
  }
}

