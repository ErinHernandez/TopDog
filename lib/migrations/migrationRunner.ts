/**
 * Firestore Migration Runner
 * 
 * Provides a system for version-controlled schema changes in Firestore.
 * Supports migrations, rollbacks, and dry-run mode.
 * 
 * @module lib/migrations/migrationRunner
 */

import { getFirestore, doc, getDoc, setDoc, runTransaction } from 'firebase/firestore';

import { db } from '../firebase';
import { logger } from '../structuredLogger';

// ============================================================================
// TYPES
// ============================================================================

export interface Migration {
  /** Migration version number (must be unique and sequential) */
  version: number;
  /** Migration name/description */
  name: string;
  /** Migration function to run */
  up: (db: ReturnType<typeof getFirestore>) => Promise<void>;
  /** Rollback function (optional) */
  down?: (db: ReturnType<typeof getFirestore>) => Promise<void>;
}

export interface MigrationStatus {
  version: number;
  name: string;
  appliedAt: string;
  appliedBy?: string;
}

export interface MigrationResult {
  success: boolean;
  version: number;
  name: string;
  error?: string;
  dryRun: boolean;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const MIGRATIONS_COLLECTION = '_migrations';
const MIGRATIONS_DOC_ID = 'current';

/**
 * Get current migration version from Firestore
 */
async function getCurrentVersion(): Promise<number> {
  if (!db) {
    throw new Error('Firebase Firestore is not initialized');
  }
  try {
    const migrationDoc = await getDoc(doc(db, MIGRATIONS_COLLECTION, MIGRATIONS_DOC_ID));
    
    if (!migrationDoc.exists()) {
      return 0; // No migrations applied yet
    }
    
    const data = migrationDoc.data();
    return data.version || 0;
  } catch (error) {
    logger.error('Failed to get current migration version', error as Error);
    throw error;
  }
}

/**
 * Update current migration version in Firestore
 */
async function updateCurrentVersion(
  version: number,
  name: string,
  dryRun: boolean = false
): Promise<void> {
  if (dryRun) {
    logger.info(`[DRY RUN] Would update migration version to ${version} (${name})`);
    return;
  }

  if (!db) {
    throw new Error('Firebase Firestore is not initialized');
  }

  try {
    await setDoc(
      doc(db, MIGRATIONS_COLLECTION, MIGRATIONS_DOC_ID),
      {
        version,
        name,
        appliedAt: new Date().toISOString(),
        appliedBy: process.env.USER || 'system',
      },
      { merge: true }
    );
    
    logger.info(`Migration version updated to ${version} (${name})`);
  } catch (error) {
    logger.error('Failed to update migration version', error as Error);
    throw error;
  }
}

/**
 * Get list of applied migrations
 */
export async function getAppliedMigrations(): Promise<MigrationStatus[]> {
  if (!db) {
    throw new Error('Firebase Firestore is not initialized');
  }
  try {
    const migrationDoc = await getDoc(doc(db, MIGRATIONS_COLLECTION, MIGRATIONS_DOC_ID));
    
    if (!migrationDoc.exists()) {
      return [];
    }
    
    const data = migrationDoc.data();
    return [
      {
        version: data.version || 0,
        name: data.name || 'unknown',
        appliedAt: data.appliedAt || new Date().toISOString(),
        appliedBy: data.appliedBy,
      },
    ];
  } catch (error) {
    logger.error('Failed to get applied migrations', error as Error);
    return [];
  }
}

// ============================================================================
// MIGRATION RUNNER
// ============================================================================

/**
 * Run pending migrations
 * 
 * @param migrations - Array of migration objects (must be sorted by version)
 * @param dryRun - If true, don't actually apply migrations
 * @returns Array of migration results
 */
export async function runMigrations(
  migrations: Migration[],
  dryRun: boolean = false
): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];
  
  // Sort migrations by version
  const sortedMigrations = [...migrations].sort((a, b) => a.version - b.version);
  
  // Get current version
  const currentVersion = await getCurrentVersion();
  
  // Find pending migrations
  const pendingMigrations = sortedMigrations.filter(m => m.version > currentVersion);
  
  if (pendingMigrations.length === 0) {
    logger.info('No pending migrations');
    return results;
  }
  
  logger.info(`Found ${pendingMigrations.length} pending migration(s)`);
  
  // Run each pending migration
  for (const migration of pendingMigrations) {
    const result: MigrationResult = {
      success: false,
      version: migration.version,
      name: migration.name,
      dryRun,
    };
    
    try {
      logger.info(`Running migration ${migration.version}: ${migration.name}${dryRun ? ' (DRY RUN)' : ''}`);
      
      if (!dryRun) {
        if (!db) {
          throw new Error('Firebase Firestore is not initialized');
        }
        // Run migration in a transaction for safety
        // db is guaranteed to be non-null here due to check above
        await runTransaction(db!, async (transaction) => {
          // Verify version hasn't changed
          const currentDoc = await transaction.get(doc(db!, MIGRATIONS_COLLECTION, MIGRATIONS_DOC_ID));
          const currentVer = currentDoc.exists() ? (currentDoc.data().version || 0) : 0;
          
          if (currentVer !== currentVersion) {
            throw new Error(`Migration version mismatch: expected ${currentVersion}, got ${currentVer}`);
          }
          
          // Run migration
          // db is guaranteed to be non-null here due to check above
          await migration.up(db!);
          
          // Update version
          await updateCurrentVersion(migration.version, migration.name, false);
        });
      } else {
        // Dry run - just log what would happen
        logger.info(`[DRY RUN] Would run migration ${migration.version}: ${migration.name}`);
        if (!db) {
          throw new Error('Firebase Firestore is not initialized');
        }
        await migration.up(db); // Still run it, but don't update version
      }
      
      result.success = true;
      logger.info(`Migration ${migration.version} completed successfully`);
      
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Migration ${migration.version} failed: ${result.error}`, error as Error);
      
      // Stop on first error
      break;
    }
    
    results.push(result);
  }
  
  return results;
}

/**
 * Rollback last migration
 * 
 * @param migrations - Array of migration objects
 * @param dryRun - If true, don't actually rollback
 * @returns Migration result
 */
export async function rollbackLastMigration(
  migrations: Migration[],
  dryRun: boolean = false
): Promise<MigrationResult | null> {
  const currentVersion = await getCurrentVersion();
  
  if (currentVersion === 0) {
    logger.warn('No migrations to rollback');
    return null;
  }
  
  // Find the last applied migration
  const lastMigration = migrations.find(m => m.version === currentVersion);
  
  if (!lastMigration) {
    logger.error(`Migration version ${currentVersion} not found`);
    return {
      success: false,
      version: currentVersion,
      name: 'unknown',
      error: 'Migration not found',
      dryRun,
    };
  }
  
  if (!lastMigration.down) {
    logger.error(`Migration ${currentVersion} does not support rollback`);
    return {
      success: false,
      version: currentVersion,
      name: lastMigration.name,
      error: 'Rollback not supported',
      dryRun,
    };
  }
  
  const result: MigrationResult = {
    success: false,
    version: currentVersion,
    name: lastMigration.name,
    dryRun,
  };
  
  try {
    logger.info(`Rolling back migration ${currentVersion}: ${lastMigration.name}${dryRun ? ' (DRY RUN)' : ''}`);
    
    if (!dryRun) {
      if (!db) {
        throw new Error('Firebase Firestore is not initialized');
      }
      // db is guaranteed to be non-null here due to check above
      await runTransaction(db!, async (transaction) => {
        // Verify version
        const currentDoc = await transaction.get(doc(db!, MIGRATIONS_COLLECTION, MIGRATIONS_DOC_ID));
        const currentVer = currentDoc.exists() ? (currentDoc.data().version || 0) : 0;
        
        if (currentVer !== currentVersion) {
          throw new Error(`Migration version mismatch: expected ${currentVersion}, got ${currentVer}`);
        }
        
        // Run rollback
        // db is guaranteed to be non-null here due to check above
        await lastMigration.down!(db!);
        
        // Find previous migration
        const previousMigration = migrations
          .filter(m => m.version < currentVersion)
          .sort((a, b) => b.version - a.version)[0];
        
        // Update version
        if (previousMigration) {
          await updateCurrentVersion(previousMigration.version, previousMigration.name, false);
        } else {
          // No previous migration, set to 0
          await setDoc(
            doc(db!, MIGRATIONS_COLLECTION, MIGRATIONS_DOC_ID),
            {
              version: 0,
              name: 'initial',
              appliedAt: new Date().toISOString(),
            }
          );
        }
      });
    } else {
      logger.info(`[DRY RUN] Would rollback migration ${currentVersion}: ${lastMigration.name}`);
      if (!db) {
        throw new Error('Firebase Firestore is not initialized');
      }
      await lastMigration.down!(db);
    }
    
    result.success = true;
    logger.info(`Migration ${currentVersion} rolled back successfully`);
    
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Rollback failed: ${result.error}`, error as Error);
  }
  
  return result;
}

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<{
  currentVersion: number;
  appliedMigrations: MigrationStatus[];
  totalMigrations: number;
}> {
  const currentVersion = await getCurrentVersion();
  const appliedMigrations = await getAppliedMigrations();
  
  return {
    currentVersion,
    appliedMigrations,
    totalMigrations: appliedMigrations.length,
  };
}
