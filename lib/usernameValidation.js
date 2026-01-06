import { getAllowedCharacters, getLocaleDescription } from './localeCharacters';

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
// Structure: { username: { reservedFor, reservedBy, reservedAt, notes, claimed } }
// ============================================================================

const VIP_RESERVATIONS = new Map();

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
 * @returns {{ success: boolean, error?: string, reservation?: VIPReservation }}
 */
export function reserveUsernameForVIP({
  username,
  reservedFor,
  reservedBy,
  notes = '',
  expiresAt = null,
}) {
  if (!username || !reservedFor || !reservedBy) {
    return { success: false, error: 'Missing required fields: username, reservedFor, reservedBy' };
  }

  const normalizedUsername = username.toUpperCase().trim();
  
  // Validate username format
  const validation = validateUsername(normalizedUsername, 'US');
  if (!validation.isValid) {
    return { success: false, error: `Invalid username: ${validation.errors.join(', ')}` };
  }
  
  // Check if already reserved
  if (VIP_RESERVATIONS.has(normalizedUsername)) {
    const existing = VIP_RESERVATIONS.get(normalizedUsername);
    return { 
      success: false, 
      error: `Username already reserved for: ${existing.reservedFor}` 
    };
  }
  
  // Check if it's a system reserved name
  if (RESERVED_USERNAMES.includes(normalizedUsername.toLowerCase())) {
    return { success: false, error: 'This username is a system reserved name' };
  }
  
  const reservation = {
    username: normalizedUsername,
    reservedFor,
    reservedBy,
    reservedAt: new Date(),
    expiresAt,
    notes,
    claimed: false,
    claimedByUid: null,
    claimedAt: null,
  };
  
  VIP_RESERVATIONS.set(normalizedUsername, reservation);
  
  return { success: true, reservation };
}

/**
 * Reserve multiple usernames for VIPs in bulk
 * @param {Array<{username: string, reservedFor: string, notes?: string, expiresAt?: Date}>} reservations
 * @param {string} reservedBy - Admin making the reservations
 * @returns {{ success: number, failed: Array<{username: string, error: string}> }}
 */
export function bulkReserveUsernamesForVIP(reservations, reservedBy) {
  const results = { success: 0, failed: [] };
  
  for (const r of reservations) {
    const result = reserveUsernameForVIP({
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
 * @returns {{ success: boolean, error?: string }}
 */
export function removeVIPReservation(username, removedBy) {
  const normalizedUsername = username.toUpperCase().trim();
  
  if (!VIP_RESERVATIONS.has(normalizedUsername)) {
    return { success: false, error: 'Username is not reserved' };
  }
  
  const reservation = VIP_RESERVATIONS.get(normalizedUsername);
  
  if (reservation.claimed) {
    return { 
      success: false, 
      error: `Cannot remove - username already claimed by UID: ${reservation.claimedByUid}` 
    };
  }
  
  VIP_RESERVATIONS.delete(normalizedUsername);
  console.log(`VIP reservation removed: ${normalizedUsername} by ${removedBy}`);
  
  return { success: true };
}

/**
 * Check if a username is reserved for a VIP
 * @param {string} username
 * @returns {{ isReserved: boolean, reservation?: VIPReservation, isExpired?: boolean }}
 */
export function checkVIPReservation(username) {
  const normalizedUsername = username.toUpperCase().trim();
  
  if (!VIP_RESERVATIONS.has(normalizedUsername)) {
    return { isReserved: false };
  }
  
  const reservation = VIP_RESERVATIONS.get(normalizedUsername);
  
  // Check if reservation has expired
  if (reservation.expiresAt && new Date() > reservation.expiresAt) {
    return { isReserved: false, isExpired: true, reservation };
  }
  
  return { isReserved: true, reservation };
}

/**
 * Claim a reserved username for a VIP
 * Called when the VIP actually registers with their reserved username
 * @param {string} username
 * @param {string} uid - Firebase UID of the claiming user
 * @param {string} [verificationCode] - Optional verification code for extra security
 * @returns {{ success: boolean, error?: string }}
 */
export function claimVIPUsername(username, uid, verificationCode = null) {
  const normalizedUsername = username.toUpperCase().trim();
  
  const check = checkVIPReservation(normalizedUsername);
  
  if (!check.isReserved) {
    return { success: false, error: 'Username is not reserved for VIP' };
  }
  
  if (check.reservation.claimed) {
    return { success: false, error: 'Username has already been claimed' };
  }
  
  // Update the reservation
  const reservation = VIP_RESERVATIONS.get(normalizedUsername);
  reservation.claimed = true;
  reservation.claimedByUid = uid;
  reservation.claimedAt = new Date();
  
  console.log(`VIP username claimed: ${normalizedUsername} by UID: ${uid}`);
  
  return { success: true };
}

/**
 * Get all VIP reservations
 * @param {Object} [filters] - Optional filters
 * @param {boolean} [filters.claimedOnly] - Only return claimed reservations
 * @param {boolean} [filters.unclaimedOnly] - Only return unclaimed reservations
 * @param {boolean} [filters.expiredOnly] - Only return expired reservations
 * @returns {VIPReservation[]}
 */
export function getAllVIPReservations(filters = {}) {
  const reservations = Array.from(VIP_RESERVATIONS.values());
  
  return reservations.filter(r => {
    if (filters.claimedOnly && !r.claimed) return false;
    if (filters.unclaimedOnly && r.claimed) return false;
    if (filters.expiredOnly) {
      if (!r.expiresAt || new Date() <= r.expiresAt) return false;
    }
    return true;
  });
}

/**
 * Get VIP reservation statistics
 * @returns {{ total: number, claimed: number, unclaimed: number, expired: number }}
 */
export function getVIPReservationStats() {
  const reservations = Array.from(VIP_RESERVATIONS.values());
  const now = new Date();
  
  return {
    total: reservations.length,
    claimed: reservations.filter(r => r.claimed).length,
    unclaimed: reservations.filter(r => !r.claimed).length,
    expired: reservations.filter(r => r.expiresAt && now > r.expiresAt && !r.claimed).length,
  };
}

/**
 * Clean up expired unclaimed reservations
 * @returns {{ removed: number, usernames: string[] }}
 */
export function cleanupExpiredVIPReservations() {
  const now = new Date();
  const removed = [];
  
  for (const [username, reservation] of VIP_RESERVATIONS.entries()) {
    if (reservation.expiresAt && now > reservation.expiresAt && !reservation.claimed) {
      VIP_RESERVATIONS.delete(username);
      removed.push(username);
    }
  }
  
  return { removed: removed.length, usernames: removed };
}

/**
 * Export VIP reservations to JSON (for backup/migration)
 * @returns {string}
 */
export function exportVIPReservations() {
  const reservations = Array.from(VIP_RESERVATIONS.entries());
  return JSON.stringify(reservations, null, 2);
}

/**
 * Import VIP reservations from JSON (for backup/migration)
 * @param {string} json
 * @returns {{ imported: number, failed: number }}
 */
export function importVIPReservations(json) {
  try {
    const entries = JSON.parse(json);
    let imported = 0;
    let failed = 0;
    
    for (const [username, reservation] of entries) {
      if (!VIP_RESERVATIONS.has(username)) {
        // Convert date strings back to Date objects
        reservation.reservedAt = new Date(reservation.reservedAt);
        if (reservation.expiresAt) reservation.expiresAt = new Date(reservation.expiresAt);
        if (reservation.claimedAt) reservation.claimedAt = new Date(reservation.claimedAt);
        
        VIP_RESERVATIONS.set(username, reservation);
        imported++;
      } else {
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
  
  // Check if username is VIP reserved (unless skipped for admin)
  if (username && !options.skipVIPCheck) {
    const vipCheck = checkVIPReservation(username);
    if (vipCheck.isReserved && !vipCheck.reservation.claimed) {
      errors.push('This username is reserved');
      isVIPReserved = true;
    }
  }
  
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
    const normalizedUsername = username.toUpperCase().trim();
    
    // Check VIP reservations first (unless skipped)
    if (!options.skipVIPCheck) {
      const vipCheck = checkVIPReservation(normalizedUsername);
      
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