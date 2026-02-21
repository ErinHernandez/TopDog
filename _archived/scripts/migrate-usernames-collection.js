#!/usr/bin/env node

/**
 * Migration Script: Populate Usernames Collection
 * 
 * This script migrates existing users to the /usernames collection
 * for O(1) username lookups.
 * 
 * Usage:
 *   node scripts/migrate-usernames-collection.js
 *   node scripts/migrate-usernames-collection.js --dry-run
 * 
 * Options:
 *   --dry-run    Preview changes without writing to database
 *   --verbose    Show detailed progress
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BATCH_SIZE = 500; // Firestore batch limit
const USERS_COLLECTION = 'users';
const USERNAMES_COLLECTION = 'usernames';

// ============================================================================
// FIREBASE ADMIN INITIALIZATION
// ============================================================================

function initializeFirebase() {
  if (getApps().length > 0) {
    return getFirestore();
  }
  
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountEnv) {
    console.error('Error: FIREBASE_SERVICE_ACCOUNT environment variable is not set');
    console.error('Please set it to your Firebase service account JSON');
    process.exit(1);
  }
  
  try {
    const serviceAccount = JSON.parse(serviceAccountEnv);
    initializeApp({
      credential: cert(serviceAccount),
    });
    return getFirestore();
  } catch (error) {
    console.error('Error initializing Firebase:', error.message);
    process.exit(1);
  }
}

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

async function migrateUsernames(db, options = {}) {
  const { dryRun = false, verbose = false } = options;
  
  console.log('\n=== Username Collection Migration ===\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`);
  console.log('');
  
  const stats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
    duplicates: 0,
  };
  
  try {
    // Get all users
    console.log('Fetching users...');
    const usersSnapshot = await db.collection(USERS_COLLECTION).get();
    stats.total = usersSnapshot.size;
    console.log(`Found ${stats.total} users\n`);
    
    if (stats.total === 0) {
      console.log('No users to migrate.');
      return stats;
    }
    
    // Process in batches
    let batch = db.batch();
    let batchCount = 0;
    const seenUsernames = new Set();
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const username = userData.username;
      
      if (!username) {
        if (verbose) {
          console.log(`  Skipped: User ${userDoc.id} has no username`);
        }
        stats.skipped++;
        continue;
      }
      
      const normalized = username.toLowerCase().trim();
      
      // Check for duplicates
      if (seenUsernames.has(normalized)) {
        console.log(`  WARNING: Duplicate username "${normalized}" for user ${userDoc.id}`);
        stats.duplicates++;
        continue;
      }
      seenUsernames.add(normalized);
      
      // Prepare username document
      const usernameRef = db.collection(USERNAMES_COLLECTION).doc(normalized);
      const usernameData = {
        uid: userDoc.id,
        username: normalized,
        createdAt: userData.createdAt || new Date(),
        previousOwner: null,
        recycledAt: null,
      };
      
      if (verbose) {
        console.log(`  Migrating: ${normalized} -> ${userDoc.id}`);
      }
      
      if (!dryRun) {
        batch.set(usernameRef, usernameData, { merge: true });
        batchCount++;
        
        // Commit batch when it reaches max size
        if (batchCount >= BATCH_SIZE) {
          console.log(`  Committing batch of ${batchCount} documents...`);
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      }
      
      stats.migrated++;
    }
    
    // Commit remaining items
    if (!dryRun && batchCount > 0) {
      console.log(`  Committing final batch of ${batchCount} documents...`);
      await batch.commit();
    }
    
    return stats;
  } catch (error) {
    console.error('Migration error:', error);
    stats.errors++;
    return stats;
  }
}

async function verifyMigration(db) {
  console.log('\n=== Verification ===\n');
  
  const usersSnapshot = await db.collection(USERS_COLLECTION).get();
  const usernamesSnapshot = await db.collection(USERNAMES_COLLECTION).get();
  
  console.log(`Users collection: ${usersSnapshot.size} documents`);
  console.log(`Usernames collection: ${usernamesSnapshot.size} documents`);
  
  // Check for missing usernames
  const usernameSet = new Set();
  usernamesSnapshot.docs.forEach(doc => {
    usernameSet.add(doc.id);
  });
  
  let missing = 0;
  for (const userDoc of usersSnapshot.docs) {
    const username = userDoc.data().username?.toLowerCase().trim();
    if (username && !usernameSet.has(username)) {
      console.log(`  Missing: ${username} (user: ${userDoc.id})`);
      missing++;
    }
  }
  
  if (missing === 0) {
    console.log('\n✅ All usernames are migrated');
  } else {
    console.log(`\n⚠️  ${missing} usernames are missing from the collection`);
  }
  
  return { missing };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');
  const verifyOnly = args.includes('--verify');
  
  const db = initializeFirebase();
  
  if (verifyOnly) {
    await verifyMigration(db);
    return;
  }
  
  const stats = await migrateUsernames(db, { dryRun, verbose });
  
  console.log('\n=== Migration Summary ===\n');
  console.log(`Total users:     ${stats.total}`);
  console.log(`Migrated:        ${stats.migrated}`);
  console.log(`Skipped:         ${stats.skipped}`);
  console.log(`Duplicates:      ${stats.duplicates}`);
  console.log(`Errors:          ${stats.errors}`);
  
  if (dryRun) {
    console.log('\n(Dry run - no changes were made)');
    console.log('Run without --dry-run to apply changes');
  } else {
    console.log('\n✅ Migration complete');
    
    // Verify
    await verifyMigration(db);
  }
}

main().catch(console.error);
