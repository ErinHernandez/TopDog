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
 * ```js
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
  getFirestore,
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
  limit
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

// Initialize Firebase if not already initialized
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// ============================================================================
// CONSTANTS
// ============================================================================

const USERNAMES_COLLECTION = 'usernames';
const USERS_COLLECTION = 'users';
const VIP_RESERVATIONS_COLLECTION = 'vip_reservations';

// Username recycling cooldown (90 days)
const RECYCLING_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000;

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Check if a username is available (O(1) lookup)
 * Checks both usernames collection and VIP reservations
 * @param {string} username - Username to check
 * @returns {Promise<{ isAvailable: boolean, reason?: string, isVIPReserved?: boolean }>}
 */
export async function isUsernameAvailable(username) {
  const normalized = username.toLowerCase().trim();
  
  try {
    // Check usernames collection (O(1) lookup by document ID)
    const usernameRef = doc(db, USERNAMES_COLLECTION, normalized);
    const usernameDoc = await getDoc(usernameRef);
    
    if (usernameDoc.exists()) {
      const data = usernameDoc.data();
      
      // Check if username is in recycling cooldown
      if (data.recycledAt) {
        const recycledTime = data.recycledAt?.toMillis?.() || data.recycledAt;
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
      const expiresAt = reservation.expiresAt?.toDate?.() || reservation.expiresAt;
      
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
    console.error('Error checking username availability:', error);
    return { isAvailable: false, reason: 'Error checking availability' };
  }
}

/**
 * Reserve a username for a user (atomic operation)
 * Should be called during signup transaction
 * @param {string} username - Username to reserve
 * @param {string} uid - User's Firebase UID
 * @param {Object} [options] - Optional settings
 * @param {import('firebase/firestore').Transaction} [options.transaction] - Firestore transaction
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function reserveUsername(username, uid, options = {}) {
  const normalized = username.toLowerCase().trim();
  const usernameRef = doc(db, USERNAMES_COLLECTION, normalized);
  
  try {
    if (options.transaction) {
      // Use provided transaction
      const usernameDoc = await options.transaction.get(usernameRef);
      
      if (usernameDoc.exists()) {
        const data = usernameDoc.data();
        // Allow if recycled and cooldown expired
        if (!data.recycledAt) {
          throw new Error('USERNAME_TAKEN');
        }
        const recycledTime = data.recycledAt?.toMillis?.() || data.recycledAt;
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
        const data = usernameDoc.data();
        if (!data.recycledAt) {
          throw new Error('USERNAME_TAKEN');
        }
        const recycledTime = data.recycledAt?.toMillis?.() || data.recycledAt;
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
    console.error('Error reserving username:', error);
    return { 
      success: false, 
      error: error.message === 'USERNAME_TAKEN' ? 'Username is already taken' :
             error.message === 'USERNAME_IN_COOLDOWN' ? 'Username is in recycling cooldown' :
             error.message 
    };
  }
}

/**
 * Release a username (for account deletion or username change)
 * Puts username in recycling cooldown period
 * @param {string} username - Username to release
 * @param {string} uid - User's Firebase UID (must match current owner)
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function releaseUsername(username, uid) {
  const normalized = username.toLowerCase().trim();
  const usernameRef = doc(db, USERNAMES_COLLECTION, normalized);
  
  try {
    await runTransaction(db, async (transaction) => {
      const usernameDoc = await transaction.get(usernameRef);
      
      if (!usernameDoc.exists()) {
        throw new Error('USERNAME_NOT_FOUND');
      }
      
      const data = usernameDoc.data();
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
    console.error('Error releasing username:', error);
    return { 
      success: false, 
      error: error.message === 'USERNAME_NOT_FOUND' ? 'Username not found' :
             error.message === 'NOT_OWNER' ? 'Not authorized to release this username' :
             error.message 
    };
  }
}

/**
 * Transfer a username to a new owner (for username changes)
 * @param {string} oldUsername - Current username
 * @param {string} newUsername - New username
 * @param {string} uid - User's Firebase UID
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function transferUsername(oldUsername, newUsername, uid) {
  const normalizedOld = oldUsername.toLowerCase().trim();
  const normalizedNew = newUsername.toLowerCase().trim();
  
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
        const data = newDoc.data();
        if (!data.recycledAt) {
          throw new Error('NEW_USERNAME_TAKEN');
        }
        const recycledTime = data.recycledAt?.toMillis?.() || data.recycledAt;
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
    console.error('Error transferring username:', error);
    return { 
      success: false, 
      error: error.message === 'NOT_OWNER' ? 'Not authorized to change this username' :
             error.message === 'NEW_USERNAME_TAKEN' ? 'New username is already taken' :
             error.message === 'NEW_USERNAME_IN_COOLDOWN' ? 'New username is in recycling cooldown' :
             error.message 
    };
  }
}

/**
 * Check multiple usernames availability in batch
 * @param {string[]} usernames - Array of usernames to check
 * @returns {Promise<{ [username: string]: { isAvailable: boolean, reason?: string } }>}
 */
export async function checkBatchAvailability(usernames) {
  const results = {};
  
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
 * @param {string} username - Username to lookup
 * @returns {Promise<{ uid: string | null, exists: boolean }>}
 */
export async function getUsernameOwner(username) {
  const normalized = username.toLowerCase().trim();
  const usernameRef = doc(db, USERNAMES_COLLECTION, normalized);
  
  try {
    const usernameDoc = await getDoc(usernameRef);
    
    if (!usernameDoc.exists()) {
      return { uid: null, exists: false };
    }
    
    const data = usernameDoc.data();
    return { 
      uid: data.uid, 
      exists: true,
      isRecycled: !!data.recycledAt 
    };
  } catch (error) {
    console.error('Error getting username owner:', error);
    return { uid: null, exists: false };
  }
}

/**
 * Clean up expired recycled usernames
 * Should be called periodically (e.g., via cron job)
 * @returns {Promise<{ cleaned: number }>}
 */
export async function cleanupRecycledUsernames() {
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
    console.error('Error cleaning up recycled usernames:', error);
    return { cleaned: 0 };
  }
}

/**
 * Migrate existing users to usernames collection
 * One-time migration script
 * @returns {Promise<{ migrated: number, errors: number }>}
 */
export async function migrateExistingUsernames() {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const usersSnapshot = await getDocs(usersRef);
    
    let migrated = 0;
    let errors = 0;
    
    const batch = writeBatch(db);
    let batchCount = 0;
    const MAX_BATCH_SIZE = 500;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
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
        console.error(`Error migrating username ${username}:`, error);
        errors++;
      }
    }
    
    // Commit remaining items
    if (batchCount > 0) {
      await batch.commit();
    }
    
    return { migrated, errors };
  } catch (error) {
    console.error('Error migrating usernames:', error);
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
