/**
 * Usernames Collection Manager
 * 
 * Manages a dedicated /usernames collection for faster username lookups.
 * This collection provides O(1) lookups by username (document ID = username).
 * 
 * Collection Structure:
 * /usernames/{username}
 *   - uid: string (owner's Firebase UID)
 *   - createdAt: Timestamp
 *   - previousOwner: string | null (for username recycling tracking)
 *   - recycledAt: Timestamp | null
 * 
 * @example
 * ```ts
 * import { reserveUsername, releaseUsername, isUsernameAvailable } from './usernamesCollection';
 * 
 * // Check availability (O(1) lookup)
 * const available = await isUsernameAvailable('johndoe');
 * 
 * // Reserve username during signup
 * await reserveUsername('johndoe', 'user-uid-123');
 * 
 * // Release username (for account deletion)
 * await releaseUsername('johndoe', 'user-uid-123');
 * ```
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp,
  Timestamp,
  writeBatch,
  query,
  where,
  getDocs,
  limit,
  type Transaction,
} from 'firebase/firestore';
import { db } from './firebase';
import { createScopedLogger } from './clientLogger';

const logger = createScopedLogger('[UsernamesCollection]');

// ============================================================================
// CONSTANTS
// ============================================================================

const USERNAMES_COLLECTION = 'usernames';
const USERS_COLLECTION = 'users';
const VIP_RESERVATIONS_COLLECTION = 'vip_reservations';

// Username recycling cooldown (90 days)
const RECYCLING_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000;

// ============================================================================
// TYPES
// ============================================================================

export interface UsernameAvailabilityResult {
  isAvailable: boolean;
  reason?: string;
  isVIPReserved?: boolean;
}

export interface ReserveUsernameOptions {
  transaction?: Transaction;
}

export interface ReserveUsernameResult {
  success: boolean;
  error?: string;
}

export interface ReleaseUsernameResult {
  success: boolean;
  error?: string;
}

export interface TransferUsernameResult {
  success: boolean;
  error?: string;
}

export interface BatchAvailabilityResult {
  [username: string]: UsernameAvailabilityResult;
}

export interface UsernameOwnerResult {
  uid: string | null;
  exists: boolean;
  isRecycled?: boolean;
}

export interface CleanupResult {
  cleaned: number;
}

export interface MigrationResult {
  migrated: number;
  errors: number;
}

interface UsernameDocument {
  uid: string | null;
  username: string;
  createdAt?: Timestamp | Date;
  previousOwner?: string | null;
  recycledAt?: Timestamp | Date | null;
}

interface UserDocument {
  username?: string;
  createdAt?: Timestamp | Date;
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Check if a username is available (O(1) lookup)
 * Checks both usernames collection and VIP reservations
 */
export async function isUsernameAvailable(
  username: string
): Promise<UsernameAvailabilityResult> {
  const normalized = username.toLowerCase().trim();
  
  if (!db) {
    return { isAvailable: false, reason: 'Database not available' };
  }

  try {
    // Check usernames collection (O(1) lookup by document ID)
    const usernameRef = doc(db, USERNAMES_COLLECTION, normalized);
    const usernameDoc = await getDoc(usernameRef);
    
    if (usernameDoc.exists()) {
      const data = usernameDoc.data() as UsernameDocument;
      
      // Check if username is in recycling cooldown
      if (data.recycledAt) {
        const recycledTime = data.recycledAt instanceof Timestamp
          ? data.recycledAt.toMillis()
          : data.recycledAt instanceof Date
          ? data.recycledAt.getTime()
          : typeof data.recycledAt === 'number'
          ? data.recycledAt
          : Date.now();
        const now = Date.now();
        
        if (now - recycledTime < RECYCLING_COOLDOWN_MS) {
          return { 
            isAvailable: false, 
            reason: 'Username is in recycling cooldown period' 
          };
        }
        // Cooldown expired, username can be reused
        // Clean up the recycled entry
        await deleteDoc(usernameRef);
      } else {
        return { 
          isAvailable: false, 
          reason: 'Username is already taken' 
        };
      }
    }
    
    // Check VIP reservations
    const vipRef = collection(db, VIP_RESERVATIONS_COLLECTION);
    const vipQuery = query(
      vipRef,
      where('usernameLower', '==', normalized),
      where('claimed', '==', false)
    );
    const vipSnapshot = await getDocs(vipQuery);
    
    if (!vipSnapshot.empty) {
      const reservation = vipSnapshot.docs[0].data();
      const expiresAt = reservation.expiresAt instanceof Timestamp
        ? reservation.expiresAt.toDate()
        : reservation.expiresAt instanceof Date
        ? reservation.expiresAt
        : null;
      
      // Check if not expired
      if (!expiresAt || new Date(expiresAt) > new Date()) {
        return { 
          isAvailable: false, 
          reason: 'Username is reserved',
          isVIPReserved: true 
        };
      }
    }
    
    return { isAvailable: true };
  } catch (error) {
    logger.error('Error checking username availability', error instanceof Error ? error : new Error(String(error)));
    return { isAvailable: false, reason: 'Error checking availability' };
  }
}

/**
 * Reserve a username for a user (atomic operation)
 * Should be called during signup transaction
 */
export async function reserveUsername(
  username: string,
  uid: string,
  options: ReserveUsernameOptions = {}
): Promise<ReserveUsernameResult> {
  const normalized = username.toLowerCase().trim();
  
  if (!db) {
    return { success: false, error: 'Database not available' };
  }

  const usernameRef = doc(db, USERNAMES_COLLECTION, normalized);
  
  try {
    if (options.transaction) {
      // Use provided transaction
      const usernameDoc = await options.transaction.get(usernameRef);
      
      if (usernameDoc.exists()) {
        const data = usernameDoc.data() as UsernameDocument;
        // Allow if recycled and cooldown expired
        if (!data.recycledAt) {
          throw new Error('USERNAME_TAKEN');
        }
        const recycledTime = data.recycledAt instanceof Timestamp
          ? data.recycledAt.toMillis()
          : data.recycledAt instanceof Date
          ? data.recycledAt.getTime()
          : typeof data.recycledAt === 'number'
          ? data.recycledAt
          : Date.now();
        if (Date.now() - recycledTime < RECYCLING_COOLDOWN_MS) {
          throw new Error('USERNAME_IN_COOLDOWN');
        }
      }
      
      options.transaction.set(usernameRef, {
        uid,
        username: normalized,
        createdAt: serverTimestamp(),
        previousOwner: null,
        recycledAt: null,
      });
      
      return { success: true };
    }
    
    // Standalone operation with transaction
    await runTransaction(db, async (transaction) => {
      const usernameDoc = await transaction.get(usernameRef);
      
      if (usernameDoc.exists()) {
        const data = usernameDoc.data() as UsernameDocument;
        if (!data.recycledAt) {
          throw new Error('USERNAME_TAKEN');
        }
        const recycledTime = data.recycledAt instanceof Timestamp
          ? data.recycledAt.toMillis()
          : data.recycledAt instanceof Date
          ? data.recycledAt.getTime()
          : typeof data.recycledAt === 'number'
          ? data.recycledAt
          : Date.now();
        if (Date.now() - recycledTime < RECYCLING_COOLDOWN_MS) {
          throw new Error('USERNAME_IN_COOLDOWN');
        }
      }
      
      transaction.set(usernameRef, {
        uid,
        username: normalized,
        createdAt: serverTimestamp(),
        previousOwner: null,
        recycledAt: null,
      });
    });
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error reserving username', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: errorMessage === 'USERNAME_TAKEN' ? 'Username is already taken' :
             errorMessage === 'USERNAME_IN_COOLDOWN' ? 'Username is in recycling cooldown' :
             errorMessage
    };
  }
}

/**
 * Release a username (for account deletion or username change)
 * Puts username in recycling cooldown period
 */
export async function releaseUsername(
  username: string,
  uid: string
): Promise<ReleaseUsernameResult> {
  const normalized = username.toLowerCase().trim();
  
  if (!db) {
    return { success: false, error: 'Database not available' };
  }

  const usernameRef = doc(db, USERNAMES_COLLECTION, normalized);
  
  try {
    await runTransaction(db, async (transaction) => {
      const usernameDoc = await transaction.get(usernameRef);
      
      if (!usernameDoc.exists()) {
        throw new Error('USERNAME_NOT_FOUND');
      }
      
      const data = usernameDoc.data() as UsernameDocument;
      if (data.uid !== uid) {
        throw new Error('NOT_OWNER');
      }
      
      // Mark as recycled instead of deleting
      // This prevents immediate reuse
      transaction.update(usernameRef, {
        uid: null,
        previousOwner: uid,
        recycledAt: serverTimestamp(),
      });
    });
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error releasing username', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: errorMessage === 'USERNAME_NOT_FOUND' ? 'Username not found' :
             errorMessage === 'NOT_OWNER' ? 'Not authorized to release this username' :
             errorMessage
    };
  }
}

/**
 * Transfer a username to a new owner (for username changes)
 */
export async function transferUsername(
  oldUsername: string,
  newUsername: string,
  uid: string
): Promise<TransferUsernameResult> {
  const normalizedOld = oldUsername.toLowerCase().trim();
  const normalizedNew = newUsername.toLowerCase().trim();
  
  if (!db) {
    return { success: false, error: 'Database not available' };
  }

  const oldUsernameRef = doc(db, USERNAMES_COLLECTION, normalizedOld);
  const newUsernameRef = doc(db, USERNAMES_COLLECTION, normalizedNew);
  
  try {
    await runTransaction(db, async (transaction) => {
      // Check old username ownership
      const oldDoc = await transaction.get(oldUsernameRef);
      if (!oldDoc.exists() || oldDoc.data().uid !== uid) {
        throw new Error('NOT_OWNER');
      }
      
      // Check new username availability
      const newDoc = await transaction.get(newUsernameRef);
      if (newDoc.exists()) {
        const data = newDoc.data() as UsernameDocument;
        if (!data.recycledAt) {
          throw new Error('NEW_USERNAME_TAKEN');
        }
        const recycledTime = data.recycledAt instanceof Timestamp
          ? data.recycledAt.toMillis()
          : data.recycledAt instanceof Date
          ? data.recycledAt.getTime()
          : typeof data.recycledAt === 'number'
          ? data.recycledAt
          : Date.now();
        if (Date.now() - recycledTime < RECYCLING_COOLDOWN_MS) {
          throw new Error('NEW_USERNAME_IN_COOLDOWN');
        }
      }
      
      // Release old username (put in recycling)
      transaction.update(oldUsernameRef, {
        uid: null,
        previousOwner: uid,
        recycledAt: serverTimestamp(),
      });
      
      // Reserve new username
      transaction.set(newUsernameRef, {
        uid,
        username: normalizedNew,
        createdAt: serverTimestamp(),
        previousOwner: null,
        recycledAt: null,
      });
    });
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error transferring username', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: errorMessage === 'NOT_OWNER' ? 'Not authorized to change this username' :
             errorMessage === 'NEW_USERNAME_TAKEN' ? 'New username is already taken' :
             errorMessage === 'NEW_USERNAME_IN_COOLDOWN' ? 'New username is in recycling cooldown' :
             errorMessage
    };
  }
}

/**
 * Check multiple usernames availability in batch
 */
export async function checkBatchAvailability(
  usernames: string[]
): Promise<BatchAvailabilityResult> {
  const results: BatchAvailabilityResult = {};
  
  // Normalize all usernames
  const normalized = usernames.map(u => u.toLowerCase().trim());
  
  // Check each username (could be optimized with getAll if available)
  const promises = normalized.map(async (username) => {
    const result = await isUsernameAvailable(username);
    results[username] = result;
  });
  
  await Promise.all(promises);
  
  return results;
}

/**
 * Get username owner
 */
export async function getUsernameOwner(
  username: string
): Promise<UsernameOwnerResult> {
  const normalized = username.toLowerCase().trim();
  
  if (!db) {
    return { uid: null, exists: false };
  }

  const usernameRef = doc(db, USERNAMES_COLLECTION, normalized);
  
  try {
    const usernameDoc = await getDoc(usernameRef);
    
    if (!usernameDoc.exists()) {
      return { uid: null, exists: false };
    }
    
    const data = usernameDoc.data() as UsernameDocument;
    return { 
      uid: data.uid, 
      exists: true,
      isRecycled: !!data.recycledAt 
    };
  } catch (error) {
    logger.error('Error getting username owner', error instanceof Error ? error : new Error(String(error)));
    return { uid: null, exists: false };
  }
}

/**
 * Clean up expired recycled usernames
 * Should be called periodically (e.g., via cron job)
 */
export async function cleanupRecycledUsernames(): Promise<CleanupResult> {
  if (!db) {
    return { cleaned: 0 };
  }

  try {
    const cutoffTime = Timestamp.fromMillis(Date.now() - RECYCLING_COOLDOWN_MS);
    
    const usernamesRef = collection(db, USERNAMES_COLLECTION);
    const recycledQuery = query(
      usernamesRef,
      where('recycledAt', '!=', null),
      where('recycledAt', '<', cutoffTime),
      limit(100) // Process in batches
    );
    
    const snapshot = await getDocs(recycledQuery);
    
    if (snapshot.empty) {
      return { cleaned: 0 };
    }
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    return { cleaned: snapshot.docs.length };
  } catch (error) {
    logger.error('Error cleaning up recycled usernames', error instanceof Error ? error : new Error(String(error)));
    return { cleaned: 0 };
  }
}

/**
 * Migrate existing users to usernames collection
 * One-time migration script
 */
export async function migrateExistingUsernames(): Promise<MigrationResult> {
  if (!db) {
    return { migrated: 0, errors: 1 };
  }

  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const usersSnapshot = await getDocs(usersRef);
    
    let migrated = 0;
    let errors = 0;
    
    const batch = writeBatch(db);
    let batchCount = 0;
    const MAX_BATCH_SIZE = 500;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data() as UserDocument;
      const username = userData.username;
      
      if (!username) continue;
      
      const normalized = username.toLowerCase().trim();
      const usernameRef = doc(db, USERNAMES_COLLECTION, normalized);
      
      try {
        batch.set(usernameRef, {
          uid: userDoc.id,
          username: normalized,
          createdAt: userData.createdAt || serverTimestamp(),
          previousOwner: null,
          recycledAt: null,
        }, { merge: true }); // Use merge to avoid overwriting if exists
        
        batchCount++;
        migrated++;
        
        // Commit batch when it reaches max size
        if (batchCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          batchCount = 0;
        }
      } catch (error) {
        logger.error('Error migrating username', error instanceof Error ? error : new Error(String(error)), { username });
        errors++;
      }
    }
    
    // Commit remaining items
    if (batchCount > 0) {
      await batch.commit();
    }
    
    return { migrated, errors };
  } catch (error) {
    logger.error('Error migrating usernames', error instanceof Error ? error : new Error(String(error)));
    return { migrated: 0, errors: 1 };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  isUsernameAvailable,
  reserveUsername,
  releaseUsername,
  transferUsername,
  checkBatchAvailability,
  getUsernameOwner,
  cleanupRecycledUsernames,
  migrateExistingUsernames,
};
