/**
 * VX2 Draft Logic - Adapters Barrel Export
 */

import { createScopedLogger } from '../../../../lib/clientLogger';

import { FirebaseAdapter, createFirebaseAdapter as _createFirebaseAdapter } from './firebaseAdapter';
import { LocalAdapter, createLocalAdapter as _createLocalAdapter } from './localAdapter';
import { MockAdapter, createMockAdapter as _createMockAdapter } from './mockAdapter';


const logger = createScopedLogger('[DraftLogic]');

// Re-export adapters
export { MockAdapter };
export { FirebaseAdapter };
export { LocalAdapter };
export const createMockAdapter = _createMockAdapter;
export const createFirebaseAdapter = _createFirebaseAdapter;
export const createLocalAdapter = _createLocalAdapter;

// Re-export adapter type from types
export type { DraftAdapter, AdapterMode } from '../types';

/**
 * Create an adapter based on mode
 *
 * @param mode - The adapter mode to use
 *   - 'mock': In-memory mock data for testing/demos
 *   - 'firebase': Real-time Firestore adapter for production
 *   - 'local': LocalStorage adapter for offline support
 */
export function createAdapter(mode: 'mock' | 'firebase' | 'local' = 'mock') {
  switch (mode) {
    case 'mock':
      return _createMockAdapter();
    case 'firebase':
      logger.info('Using Firebase adapter');
      return _createFirebaseAdapter();
    case 'local':
      logger.info('Using Local adapter for offline support');
      return _createLocalAdapter();
    default:
      return _createMockAdapter();
  }
}

