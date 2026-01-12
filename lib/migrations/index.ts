/**
 * Firestore Migrations
 * 
 * Central export for migration system.
 * Import migrations from this file to run them.
 * 
 * @module lib/migrations
 */

export {
  runMigrations,
  rollbackLastMigration,
  getMigrationStatus,
  getAppliedMigrations,
  type Migration,
  type MigrationStatus,
  type MigrationResult,
} from './migrationRunner';

// ============================================================================
// MIGRATIONS
// ============================================================================

/**
 * Import all migrations here
 * Migrations should be numbered sequentially (001, 002, 003, etc.)
 */

// Example migration structure:
// import { migration001_initial_schema } from './migrations/001_initial_schema';
// import { migration002_add_user_fields } from './migrations/002_add_user_fields';

/**
 * All migrations in order
 * Add new migrations to this array
 */
export const migrations: Array<import('./migrationRunner').Migration> = [
  // Add migrations here
  // Example:
  // {
  //   version: 1,
  //   name: 'Initial schema',
  //   up: async (db) => {
  //     // Migration logic
  //   },
  //   down: async (db) => {
  //     // Rollback logic
  //   },
  // },
];
