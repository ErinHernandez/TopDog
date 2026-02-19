/**
 * Example Migration
 * 
 * This is a template for creating new migrations.
 * Copy this file and rename it to match your migration number and name.
 * 
 * Migration naming: {number}_{description}.ts
 * Example: 001_initial_schema.ts, 002_add_user_fields.ts
 */

import { getFirestore } from 'firebase/firestore';

import { logger } from '../../structuredLogger';
import type { Migration } from '../migrationRunner';

/**
 * Example Migration: Add user display name field
 * 
 * This migration adds a `displayName` field to all user documents
 * that don't already have one, using their username as the default.
 */
export const migration001_example: Migration = {
  version: 1,
  name: 'Add user display name field',
  
  /**
   * Migration up: Apply the migration
   */
  up: async (db: ReturnType<typeof getFirestore>) => {
    logger.info('[Migration 001] Starting: Add user display name field');
    
    // Example: Add a field to all user documents
    // In a real migration, you would:
    // 1. Query all user documents
    // 2. Check if they have the new field
    // 3. Add the field if missing
    // 4. Use batch writes for efficiency
    
    // Example code (commented out):
    // const usersRef = collection(db, 'users');
    // const usersSnapshot = await getDocs(usersRef);
    // 
    // const batch = writeBatch(db);
    // let count = 0;
    // 
    // usersSnapshot.forEach((doc) => {
    //   const data = doc.data();
    //   if (!data.displayName && data.username) {
    //     batch.update(doc.ref, { displayName: data.username });
    //     count++;
    //   }
    // });
    // 
    // if (count > 0) {
    //   await batch.commit();
    //   logger.info(`[Migration 001] Updated ${count} user documents`);
    // } else {
    //   logger.info('[Migration 001] No documents to update');
    // }
    
    logger.info('[Migration 001] Completed: Add user display name field');
  },
  
  /**
   * Migration down: Rollback the migration
   */
  down: async (db: ReturnType<typeof getFirestore>) => {
    logger.info('[Migration 001] Rolling back: Add user display name field');
    
    // Example: Remove the field or revert changes
    // In a real rollback, you would:
    // 1. Query all user documents
    // 2. Remove the field or revert to previous state
    // 3. Use batch writes for efficiency
    
    // Example code (commented out):
    // const usersRef = collection(db, 'users');
    // const usersSnapshot = await getDocs(usersRef);
    // 
    // const batch = writeBatch(db);
    // let count = 0;
    // 
    // usersSnapshot.forEach((doc) => {
    //   const data = doc.data();
    //   if (data.displayName) {
    //     batch.update(doc.ref, { displayName: deleteField() });
    //     count++;
    //   }
    // });
    // 
    // if (count > 0) {
    //   await batch.commit();
    //   logger.info(`[Migration 001] Rolled back ${count} user documents`);
    // } else {
    //   logger.info('[Migration 001] No documents to rollback');
    // }
    
    logger.info('[Migration 001] Rollback completed: Add user display name field');
  },
};
