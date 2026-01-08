import { getAllowedCharacters, getLocaleDescription } from './localeCharacters';
import { 
  getFirestore,
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  query, 
  where, 
  getDocs,
  serverTimestamp,
  Timestamp
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

// Username validation rules
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 18;

// Reserved usernames that cannot be used (system/platform names)
const RESERVED_USERNAMES = [
  'admin', 'administrator', 'mod', 'moderator', 'support', 'help', 'info',
  'system', 'root', 'guest', 'anonymous', 'user', 'test', 'demo',
  'newuser', 'newusername', 'user123', 'test123', 'demo123',
  'topdog', 'topdogdog', 'official', 'staff', 'team',
  'underdog', 'draftkings', 'fanduel', 'sleeper', 'yahoo',
];

// ============================================================================
// VIP USERNAME RESERVATIONS
// ============================================================================
// Reserved for influencers, streamers, partners, and other VIPs.
// These usernames are blocked from public registration but can be
// assigned to specific users via admin functions.
//
// NOTE: All VIP reservations are stored in Firestore collection 'vip_reservations'
// No in-memory storage to ensure consistency across server instances.
// ============================================================================

const VIP_RESERVATIONS_COLLECTION = 'vip_reservations';

/**
 * VIP Reservation Entry
 * @typedef {Object} VIPReservation
 * @property {string} username - The reserved username (uppercase)
 * @property {string} reservedFor - Name/identifier of the VIP (e.g., "JohnDoe - Twitch Streamer")
 * @property {string} reservedBy - Admin who made the reservation
 * @property {Date} reservedAt - When the reservation was made
 * @property {Date|null} expiresAt - When the reservation expires (null = never)
 * @property {string} notes - Additional notes about the reservation
 * @property {boolean} claimed - Whether the VIP has claimed the username
 * @property {string|null} claimedByUid - UID of user who claimed it (if claimed)
 * @property {Date|null} claimedAt - When it was claimed
 */

/**
 * Reserve a username for a VIP/influencer
 * @param {Object} options - Reservation options
 * @param {string} options.username - Username to reserve
 * @param {string} options.reservedFor - Who the username is reserved for
 * @param {string} options.reservedBy - Admin making the reservation
 * @param {string} [options.notes] - Additional notes
 * @param {Date|null} [options.expiresAt] - Expiration date (null = never)
 * @returns {Promise<{ success: boolean, error?: string, reservation?: VIPReservation }>}
 */
export async function reserveUsernameForVIP({
  username,
  reservedFor,
  reservedBy,
  notes = '',
  expiresAt = null,
}) {
  if (!username || !reservedFor || !reservedBy) {
    return { success: false, error: 'Missing required fields: username, reservedFor, reservedBy' };
  }

  const normalizedUsername = username.toLowerCase().trim();
  
  // Validate username format
  const validation = validateUsername(normalizedUsername, 'US');
  if (!validation.isValid) {
    return { success: false, error: `Invalid username: ${validation.errors.join(', ')}` };
  }
  
  // Check if it's a system reserved name
  if (RESERVED_USERNAMES.includes(normalizedUsername.toLowerCase())) {
    return { success: false, error: 'This username is a system reserved name' };
  }
  
  try {
    // Check if already reserved in Firestore
    const vipRef = collection(db, VIP_RESERVATIONS_COLLECTION);
    const vipQuery = query(
      vipRef,
      where('usernameLower', '==', normalizedUsername),
      where('claimed', '==', false)
    );
    const vipSnapshot = await getDocs(vipQuery);
    
    if (!vipSnapshot.empty) {
      const existing = vipSnapshot.docs[0].data();
      return { 
        success: false, 
        error: `Username already reserved for: ${existing.reservedFor}` 
      };
    }
    
    // Create reservation in Firestore
    const reservationId = `vip_${normalizedUsername}_${Date.now()}`;
    const reservationRef = doc(db, VIP_RESERVATIONS_COLLECTION, reservationId);
    
    const reservation = {
      id: reservationId,
      username: normalizedUsername,
      usernameLower: normalizedUsername,
      reservedFor: reservedFor.trim(),
      reservedBy: reservedBy.trim(),
      reservedAt: serverTimestamp(),
      expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
      notes: notes.trim(),
      claimed: false,
      claimedByUid: null,
      claimedAt: null,
    };
    
    await setDoc(reservationRef, reservation);
    
    return { 
      success: true, 
      reservation: {
        ...reservation,
        reservedAt: new Date(),
        expiresAt: expiresAt,
      }
    };
  } catch (error) {
    console.error('Error reserving VIP username:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reserve multiple usernames for VIPs in bulk
 * @param {Array<{username: string, reservedFor: string, notes?: string, expiresAt?: Date}>} reservations
 * @param {string} reservedBy - Admin making the reservations
 * @returns {Promise<{ success: number, failed: Array<{username: string, error: string}> }>}
 */
export async function bulkReserveUsernamesForVIP(reservations, reservedBy) {
  const results = { success: 0, failed: [] };
  
  for (const r of reservations) {
    const result = await reserveUsernameForVIP({
      username: r.username,
      reservedFor: r.reservedFor,
      reservedBy,
      notes: r.notes || '',
      expiresAt: r.expiresAt || null,
    });
    
    if (result.success) {
      results.success++;
    } else {
      results.failed.push({ username: r.username, error: result.error });
    }
  }
  
  return results;
}

/**
 * Remove a VIP reservation
 * @param {string} username - Username to unreserve
 * @param {string} removedBy - Admin removing the reservation
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function removeVIPReservation(username, removedBy) {
  const normalizedUsername = username.toLowerCase().trim();
  
  try {
    // Find reservation in Firestore
    const vipRef = collection(db, VIP_RESERVATIONS_COLLECTION);
    const vipQuery = query(
      vipRef,
      where('usernameLower', '==', normalizedUsername),
      where('claimed', '==', false)
    );
    const vipSnapshot = await getDocs(vipQuery);
    
    if (vipSnapshot.empty) {
      return { success: false, error: 'Username is not reserved' };
    }
    
    const reservationDoc = vipSnapshot.docs[0];
    const reservation = reservationDoc.data();
    
    if (reservation.claimed) {
      return { 
        success: false, 
        error: `Cannot remove - username already claimed by UID: ${reservation.claimedByUid}` 
      };
    }
    
    // Delete reservation
    await deleteDoc(reservationDoc.ref);
    console.log(`VIP reservation removed: ${normalizedUsername} by ${removedBy}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error removing VIP reservation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if a username is reserved for a VIP
 * @param {string} username
 * @returns {Promise<{ isReserved: boolean, reservation?: VIPReservation, isExpired?: boolean }>}
 */
export async function checkVIPReservation(username) {
  const normalizedUsername = username.toLowerCase().trim();
  
  try {
    const vipRef = collection(db, VIP_RESERVATIONS_COLLECTION);
    const vipQuery = query(
      vipRef,
      where('usernameLower', '==', normalizedUsername),
      where('claimed', '==', false)
    );
    const vipSnapshot = await getDocs(vipQuery);
    
    if (vipSnapshot.empty) {
      return { isReserved: false };
    }
    
    const reservationDoc = vipSnapshot.docs[0];
    const data = reservationDoc.data();
    
    // Convert Firestore timestamps to Date objects
    const reservation = {
      ...data,
      reservedAt: data.reservedAt?.toDate?.() || data.reservedAt,
      expiresAt: data.expiresAt?.toDate?.() || data.expiresAt,
      claimedAt: data.claimedAt?.toDate?.() || data.claimedAt,
    };
    
    // Check if reservation has expired
    if (reservation.expiresAt && new Date() > reservation.expiresAt) {
      return { isReserved: false, isExpired: true, reservation };
    }
    
    return { isReserved: true, reservation };
  } catch (error) {
    console.error('Error checking VIP reservation:', error);
    return { isReserved: false };
  }
}

/**
 * Claim a reserved username for a VIP
 * Called when the VIP actually registers with their reserved username
 * @param {string} username
 * @param {string} uid - Firebase UID of the claiming user
 * @param {string} [verificationCode] - Optional verification code for extra security
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function claimVIPUsername(username, uid, verificationCode = null) {
  const normalizedUsername = username.toLowerCase().trim();
  
  try {
    const check = await checkVIPReservation(normalizedUsername);
    
    if (!check.isReserved) {
      return { success: false, error: 'Username is not reserved for VIP' };
    }
    
    if (check.reservation.claimed) {
      return { success: false, error: 'Username has already been claimed' };
    }
    
    // Update the reservation in Firestore
    const vipRef = collection(db, VIP_RESERVATIONS_COLLECTION);
    const vipQuery = query(
      vipRef,
      where('usernameLower', '==', normalizedUsername),
      where('claimed', '==', false)
    );
    const vipSnapshot = await getDocs(vipQuery);
    
    if (vipSnapshot.empty) {
      return { success: false, error: 'Reservation not found' };
    }
    
    const reservationRef = vipSnapshot.docs[0].ref;
    await setDoc(reservationRef, {
      claimed: true,
      claimedByUid: uid,
      claimedAt: serverTimestamp(),
    }, { merge: true });
    
    console.log(`VIP username claimed: ${normalizedUsername} by UID: ${uid}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error claiming VIP username:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all VIP reservations
 * @param {Object} [filters] - Optional filters
 * @param {boolean} [filters.claimedOnly] - Only return claimed reservations
 * @param {boolean} [filters.unclaimedOnly] - Only return unclaimed reservations
 * @param {boolean} [filters.expiredOnly] - Only return expired reservations
 * @returns {Promise<VIPReservation[]>}
 */
export async function getAllVIPReservations(filters = {}) {
  try {
    const vipRef = collection(db, VIP_RESERVATIONS_COLLECTION);
    let vipQuery = vipRef;
    
    // Apply filters
    if (filters.claimedOnly) {
      vipQuery = query(vipRef, where('claimed', '==', true));
    } else if (filters.unclaimedOnly) {
      vipQuery = query(vipRef, where('claimed', '==', false));
    }
    
    const vipSnapshot = await getDocs(vipQuery);
    const now = new Date();
    
    const reservations = vipSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        reservedAt: data.reservedAt?.toDate?.() || data.reservedAt,
        expiresAt: data.expiresAt?.toDate?.() || data.expiresAt,
        claimedAt: data.claimedAt?.toDate?.() || data.claimedAt,
      };
    });
    
    return reservations.filter(r => {
      if (filters.expiredOnly) {
        if (!r.expiresAt || now <= r.expiresAt) return false;
      }
      return true;
    });
  } catch (error) {
    console.error('Error getting VIP reservations:', error);
    return [];
  }
}

/**
 * Get VIP reservation statistics
 * @returns {Promise<{ total: number, claimed: number, unclaimed: number, expired: number }>}
 */
export async function getVIPReservationStats() {
  try {
    const reservations = await getAllVIPReservations();
    const now = new Date();
    
    return {
      total: reservations.length,
      claimed: reservations.filter(r => r.claimed).length,
      unclaimed: reservations.filter(r => !r.claimed).length,
      expired: reservations.filter(r => r.expiresAt && now > r.expiresAt && !r.claimed).length,
    };
  } catch (error) {
    console.error('Error getting VIP reservation stats:', error);
    return {
      total: 0,
      claimed: 0,
      unclaimed: 0,
      expired: 0,
    };
  }
}

/**
 * Clean up expired unclaimed reservations
 * @returns {Promise<{ removed: number, usernames: string[] }>}
 */
export async function cleanupExpiredVIPReservations() {
  try {
    const unclaimed = await getAllVIPReservations({ unclaimedOnly: true });
    const now = new Date();
    const removed = [];
    
    for (const reservation of unclaimed) {
      if (reservation.expiresAt && now > reservation.expiresAt) {
        // Delete from Firestore
        const vipRef = collection(db, VIP_RESERVATIONS_COLLECTION);
        const vipQuery = query(
          vipRef,
          where('usernameLower', '==', reservation.usernameLower),
          where('claimed', '==', false)
        );
        const vipSnapshot = await getDocs(vipQuery);
        
        if (!vipSnapshot.empty) {
          await deleteDoc(vipSnapshot.docs[0].ref);
          removed.push(reservation.username);
        }
      }
    }
    
    return { removed: removed.length, usernames: removed };
  } catch (error) {
    console.error('Error cleaning up expired VIP reservations:', error);
    return { removed: 0, usernames: [] };
  }
}

/**
 * Export VIP reservations to JSON (for backup/migration)
 * @returns {Promise<string>}
 */
export async function exportVIPReservations() {
  try {
    const reservations = await getAllVIPReservations();
    return JSON.stringify(reservations, null, 2);
  } catch (error) {
    console.error('Error exporting VIP reservations:', error);
    return JSON.stringify([], null, 2);
  }
}

/**
 * Import VIP reservations from JSON (for backup/migration)
 * @param {string} json
 * @returns {Promise<{ imported: number, failed: number }>}
 */
export async function importVIPReservations(json) {
  try {
    const entries = JSON.parse(json);
    let imported = 0;
    let failed = 0;
    
    for (const reservation of entries) {
      try {
        // Check if already exists
        const check = await checkVIPReservation(reservation.username || reservation.usernameLower);
        if (check.isReserved) {
          failed++;
          continue;
        }
        
        // Import reservation
        const result = await reserveUsernameForVIP({
          username: reservation.username || reservation.usernameLower,
          reservedFor: reservation.reservedFor,
          reservedBy: reservation.reservedBy || 'import',
          notes: reservation.notes || '',
          expiresAt: reservation.expiresAt ? new Date(reservation.expiresAt) : null,
        });
        
        if (result.success) {
          imported++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Error importing reservation for ${reservation.username}:`, error);
        failed++;
      }
    }
    
    return { imported, failed };
  } catch (error) {
    console.error('Error importing VIP reservations:', error);
    return { imported: 0, failed: 0, error: error.message };
  }
}

/**
 * Validate username format (client-side validation)
 * Does NOT check availability or VIP reservations - those require server calls
 * @param {string} username
 * @param {string} countryCode
 * @param {Object} [options]
 * @param {boolean} [options.skipVIPCheck] - Skip VIP reservation check (for admin use)
 * @returns {{ isValid: boolean, errors: string[], isVIPReserved?: boolean }}
 */
export function validateUsername(username, countryCode = 'US', options = {}) {
  const errors = [];
  let isVIPReserved = false;
  
  // Check length
  if (!username || username.length < USERNAME_MIN_LENGTH) {
    errors.push(`Username must be at least ${USERNAME_MIN_LENGTH} characters long`);
  }
  
  if (username && username.length > USERNAME_MAX_LENGTH) {
    errors.push(`Username must be no more than ${USERNAME_MAX_LENGTH} characters long`);
  }
  
  // Check if username is system reserved
  if (username && RESERVED_USERNAMES.includes(username.toLowerCase())) {
    errors.push('This username is reserved and cannot be used');
  }
  
  // Note: VIP reservation check removed from client-side validation
  // VIP checks should be done server-side via API to ensure consistency
  // Client-side validation only checks format, not availability or VIP status
  
  // Get allowed characters for the country
  const allowedChars = getAllowedCharacters(countryCode);
  
  // Check each character
  if (username) {
    for (let i = 0; i < username.length; i++) {
      const char = username[i];
      if (!allowedChars.includes(char)) {
        errors.push(`Character '${char}' is not allowed in usernames for your country`);
        break; // Only show first invalid character error
      }
    }
  }
  
  // Check for any spaces (not allowed)
  if (username && username.includes(' ')) {
    errors.push('Username cannot contain any spaces');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    isVIPReserved,
  };
}

/**
 * Check if username is available (database + VIP reservation check)
 * @param {string} username
 * @param {Object} [options]
 * @param {boolean} [options.skipVIPCheck] - Skip VIP check (for admin assigning VIP usernames)
 * @param {string} [options.vipClaimUid] - UID attempting to claim a VIP reservation
 * @returns {Promise<{ isAvailable: boolean, message: string, isVIPReserved?: boolean, vipReservation?: VIPReservation }>}
 */
export async function checkUsernameAvailability(username, options = {}) {
  try {
    const normalizedUsername = username.toLowerCase().trim();
    
    // Check VIP reservations first (unless skipped)
    if (!options.skipVIPCheck) {
      const vipCheck = await checkVIPReservation(normalizedUsername);
      
      if (vipCheck.isReserved && !vipCheck.reservation.claimed) {
        // Username is reserved for a VIP
        // If a vipClaimUid is provided, this might be the VIP claiming their username
        if (options.vipClaimUid) {
          // Allow VIP to proceed - actual claim happens during registration
          return {
            isAvailable: true,
            message: 'Username is reserved for you',
            isVIPReserved: true,
            vipReservation: vipCheck.reservation,
          };
        }
        
        return {
          isAvailable: false,
          message: 'This username is reserved',
          isVIPReserved: true,
        };
      }
    }
    
    // Check database for existing users
    const { db } = await import('./firebase');
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', normalizedUsername));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return {
        isAvailable: false,
        message: 'Username is already taken'
      };
    }
    
    // Also check the usernames collection (for reserved usernames)
    const usernamesRef = collection(db, 'usernames');
    const usernameDoc = await getDocs(query(usernamesRef, where('username', '==', normalizedUsername)));
    
    if (!usernameDoc.empty) {
      return {
        isAvailable: false,
        message: 'Username is already taken'
      };
    }
    
    return {
      isAvailable: true,
      message: 'Username is available'
    };
  } catch (error) {
    console.error('Error checking username availability:', error);
    return {
      isAvailable: false,
      message: 'Error checking username availability'
    };
  }
}

// Function to get username requirements for a country
export function getUsernameRequirements(countryCode = 'US') {
  const description = getLocaleDescription(countryCode);
  return {
    minLength: USERNAME_MIN_LENGTH,
    maxLength: USERNAME_MAX_LENGTH,
    allowedCharacters: getAllowedCharacters(countryCode),
    description: description,
    rules: [
      `Must be ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters long`,
      'Cannot contain any spaces',
      'Cannot be a reserved username',
      `Character set: ${description}`
    ]
  };
}

// Function to sanitize username (remove extra spaces, etc.)
export function sanitizeUsername(username) {
  if (!username) return '';
  
  // Remove leading/trailing spaces and replace multiple spaces with single space
  return username.trim().replace(/\s+/g, ' ');
}

// Function to format username for display (capitalize first letter)
export function formatUsername(username) {
  if (!username) return '';
  
  const sanitized = sanitizeUsername(username);
  return sanitized.charAt(0).toUpperCase() + sanitized.slice(1).toLowerCase();
} 