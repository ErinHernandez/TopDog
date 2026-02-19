#!/usr/bin/env node

/**
 * Admin Claims Migration Script
 * 
 * Migrates existing admin users from UID-based authentication to Firebase custom claims.
 * This script:
 * 1. Reads admin UIDs from ADMIN_UIDS environment variable
 * 2. Sets admin custom claims for each UID
 * 3. Verifies claims were set successfully
 * 4. Reports migration status
 * 
 * Usage:
 *   ADMIN_UIDS="uid1,uid2,uid3" node scripts/migrate-admin-claims.js
 * 
 * Or with .env file:
 *   node scripts/migrate-admin-claims.js
 */

// Use require for firebase-admin to ensure compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports
const admin = require('firebase-admin');

// ============================================================================
// CONFIGURATION
// ============================================================================

// Get admin UIDs from environment variable
const ADMIN_UIDS_ENV = process.env.ADMIN_UIDS || '';
const adminUids = ADMIN_UIDS_ENV
  .split(',')
  .map((uid) => uid.trim())
  .filter(Boolean);

// Dry run mode (doesn't actually set claims, just simulates)
const DRY_RUN = process.env.DRY_RUN === 'true';

// ============================================================================
// FIREBASE ADMIN INITIALIZATION
// ============================================================================

let firebaseAdminInitialized = false;

function initializeFirebaseAdmin() {
  if (admin.apps.length === 0) {
    try {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT || '{}'
      );
      if (serviceAccount.project_id) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        firebaseAdminInitialized = true;
        console.log('✓ Firebase Admin initialized');
      } else {
        console.error(
          '✗ FIREBASE_SERVICE_ACCOUNT not configured or invalid'
        );
        process.exit(1);
      }
    } catch (error) {
      console.error('✗ Firebase Admin initialization failed:', error.message);
      process.exit(1);
    }
  } else {
    firebaseAdminInitialized = true;
  }
}

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

/**
 * Check if user has admin custom claim
 */
async function checkAdminClaim(uid) {
  try {
    const auth = admin.auth();
    const user = await auth.getUser(uid);
    return {
      hasClaim: user.customClaims?.admin === true,
      claims: user.customClaims || {},
      email: user.email,
    };
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return {
        hasClaim: false,
        error: 'User not found',
        claims: null,
        email: null,
      };
    }
    throw error;
  }
}

/**
 * Set admin custom claim for a user
 */
async function setAdminClaim(uid, email = null) {
  try {
    const auth = admin.auth();
    
    if (DRY_RUN) {
      console.log(`[DRY RUN] Would set admin claim for ${uid} (${email || 'no email'})`);
      return { success: true, dryRun: true };
    }
    
    // Get existing claims to preserve them
    const user = await auth.getUser(uid);
    const existingClaims = user.customClaims || {};
    
    // Set admin claim while preserving existing claims
    await auth.setCustomUserClaims(uid, {
      ...existingClaims,
      admin: true,
    });
    
    return { success: true, dryRun: false };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
}

/**
 * Verify admin claim was set successfully
 */
async function verifyAdminClaim(uid) {
  const check = await checkAdminClaim(uid);
  return check.hasClaim;
}

/**
 * Migrate a single admin user
 */
async function migrateAdmin(uid) {
  console.log(`\nMigrating admin: ${uid}`);
  console.log('─'.repeat(50));
  
  // Check current status
  const currentStatus = await checkAdminClaim(uid);
  
  if (currentStatus.error === 'User not found') {
    console.log(`  ✗ User not found: ${uid}`);
    return {
      uid,
      success: false,
      error: 'User not found',
      alreadyHadClaim: false,
      email: null,
    };
  }
  
  if (currentStatus.hasClaim) {
    console.log(`  ✓ Already has admin claim (${currentStatus.email || 'no email'})`);
    return {
      uid,
      success: true,
      error: null,
      alreadyHadClaim: true,
      email: currentStatus.email,
    };
  }
  
  // Set admin claim
  const result = await setAdminClaim(uid, currentStatus.email);
  
  if (!result.success) {
    console.log(`  ✗ Failed to set admin claim: ${result.error}`);
    return {
      uid,
      success: false,
      error: result.error,
      alreadyHadClaim: false,
      email: currentStatus.email,
    };
  }
  
  // Verify claim was set
  if (!DRY_RUN) {
    // Wait a moment for Firebase to propagate
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const verified = await verifyAdminClaim(uid);
    if (verified) {
      console.log(`  ✓ Admin claim set successfully (${currentStatus.email || 'no email'})`);
      return {
        uid,
        success: true,
        error: null,
        alreadyHadClaim: false,
        email: currentStatus.email,
      };
    } else {
      console.log(`  ⚠ Admin claim set but verification failed`);
      return {
        uid,
        success: false,
        error: 'Verification failed',
        alreadyHadClaim: false,
        email: currentStatus.email,
      };
    }
  } else {
    console.log(`  ✓ [DRY RUN] Would set admin claim (${currentStatus.email || 'no email'})`);
    return {
      uid,
      success: true,
      error: null,
      alreadyHadClaim: false,
      email: currentStatus.email,
      dryRun: true,
    };
  }
}

/**
 * Main migration function
 */
async function migrateAdmins() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Admin Claims Migration Script');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No claims will be set');
    console.log('');
  }
  
  // Initialize Firebase Admin
  initializeFirebaseAdmin();
  
  if (!firebaseAdminInitialized) {
    console.error('✗ Cannot proceed without Firebase Admin');
    process.exit(1);
  }
  
  // Check if admin UIDs provided
  if (adminUids.length === 0) {
    console.error('✗ No admin UIDs provided');
    console.error('');
    console.error('Usage:');
    console.error('  ADMIN_UIDS="uid1,uid2,uid3" node scripts/migrate-admin-claims.js');
    console.error('  Or set ADMIN_UIDS in .env file');
    console.error('');
    console.error('For dry run (simulation):');
    console.error('  DRY_RUN=true ADMIN_UIDS="uid1,uid2" node scripts/migrate-admin-claims.js');
    process.exit(1);
  }
  
  console.log(`Found ${adminUids.length} admin UID(s) to migrate:`);
  adminUids.forEach((uid, index) => {
    console.log(`  ${index + 1}. ${uid}`);
  });
  console.log('');
  
  // Migrate each admin
  const results = [];
  for (const uid of adminUids) {
    const result = await migrateAdmin(uid);
    results.push(result);
  }
  
  // Print summary
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Migration Summary');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const alreadyHadClaim = results.filter((r) => r.alreadyHadClaim);
  const newlySet = results.filter((r) => r.success && !r.alreadyHadClaim);
  
  console.log(`Total admins: ${results.length}`);
  console.log(`✓ Successful: ${successful.length}`);
  console.log(`  - Already had claim: ${alreadyHadClaim.length}`);
  console.log(`  - Newly set: ${newlySet.length}`);
  console.log(`✗ Failed: ${failed.length}`);
  console.log('');
  
  if (failed.length > 0) {
    console.log('Failed migrations:');
    failed.forEach((result) => {
      console.log(`  ✗ ${result.uid}: ${result.error}`);
    });
    console.log('');
  }
  
  if (successful.length === results.length) {
    console.log('✅ All admins migrated successfully!');
    if (DRY_RUN) {
      console.log('');
      console.log('⚠️  This was a dry run. Run without DRY_RUN=true to actually set claims.');
    } else {
      console.log('');
      console.log('📝 Next steps:');
      console.log('  1. Verify all admins can access admin features');
      console.log('  2. Have admins sign out and sign back in to refresh tokens');
      console.log('  3. After verification, update lib/adminAuth.js to remove UID fallback');
    }
  } else {
    console.log('⚠️  Some migrations failed. Please review errors above.');
    process.exit(1);
  }
  
  console.log('');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

if (require.main === module) {
  migrateAdmins()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('');
      console.error('✗ Migration failed:', error.message);
      console.error('');
      if (error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    });
}

module.exports = { migrateAdmins, setAdminClaim, checkAdminClaim };
