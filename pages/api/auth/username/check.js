/**
 * API Route: Check Username Availability
 * 
 * POST /api/auth/username/check
 * 
 * Checks if a username is available for registration.
 * Validates format and checks against:
 * - Existing users
 * - Reserved usernames
 * - VIP reservations
 * 
 * @example
 * ```js
 * const response = await fetch('/api/auth/username/check', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ username: 'johndoe', countryCode: 'US' })
 * });
 * const { isAvailable, message } = await response.json();
 * ```
 */

import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// ============================================================================
// CONSTANTS
// ============================================================================

const RESERVED_USERNAMES = new Set([
  // System
  'admin', 'administrator', 'root', 'system', 'bot',
  'moderator', 'mod', 'support', 'help', 'info',
  'api', 'www', 'web', 'app', 'mobile',
  
  // Brand
  'topdog', 'top_dog', 'top-dog', 'topdogfantasy',
  'bestball', 'best_ball', 'best-ball',
  'draftkings', 'underdog', 'sleeper', 'fanduel',
  
  // Common reserved
  'test', 'null', 'undefined', 'anonymous',
  'deleted', 'banned', 'suspended',
  
  // Reserved for future use
  'official', 'verified', 'staff', 'team',
  'news', 'blog', 'store', 'shop',
]);

const USERNAME_CONSTRAINTS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 18,
};

// ============================================================================
// VALIDATION
// ============================================================================

function validateUsernameFormat(username, countryCode = 'US') {
  const errors = [];
  const warnings = [];
  
  // Length check
  if (username.length < USERNAME_CONSTRAINTS.MIN_LENGTH) {
    errors.push(`Username must be at least ${USERNAME_CONSTRAINTS.MIN_LENGTH} characters`);
  }
  if (username.length > USERNAME_CONSTRAINTS.MAX_LENGTH) {
    errors.push(`Username must be at most ${USERNAME_CONSTRAINTS.MAX_LENGTH} characters`);
  }
  
  // No spaces
  if (/\s/.test(username)) {
    errors.push('Username cannot contain spaces');
  }
  
  // Basic character validation (alphanumeric + underscore)
  // Country-specific characters are handled separately
  const basePattern = /^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+$/;
  if (!basePattern.test(username)) {
    errors.push('Username contains invalid characters');
  }
  
  // Must start with a letter
  if (!/^[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]/.test(username)) {
    errors.push('Username must start with a letter');
  }
  
  // No consecutive underscores
  if (/__/.test(username)) {
    errors.push('Username cannot have consecutive underscores');
  }
  
  // Cannot end with underscore
  if (username.endsWith('_')) {
    warnings.push('Usernames ending with underscore are less readable');
  }
  
  // Reserved check
  if (RESERVED_USERNAMES.has(username.toLowerCase())) {
    errors.push('This username is reserved');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Use POST request' 
    });
  }
  
  try {
    const { username, countryCode = 'US' } = req.body;
    
    // Validate request
    if (!username || typeof username !== 'string') {
      return res.status(400).json({
        isAvailable: false,
        message: 'Username is required',
        error: 'INVALID_REQUEST',
      });
    }
    
    const normalizedUsername = username.toLowerCase().trim();
    
    // Step 1: Validate format
    const validation = validateUsernameFormat(normalizedUsername, countryCode);
    if (!validation.isValid) {
      return res.status(200).json({
        isAvailable: false,
        message: validation.errors[0],
        errors: validation.errors,
        warnings: validation.warnings,
        isVIPReserved: false,
      });
    }
    
    // Step 2: Check VIP reservations
    const vipQuery = query(
      collection(db, 'vip_reservations'),
      where('usernameLower', '==', normalizedUsername),
      where('claimed', '==', false)
    );
    
    const vipSnapshot = await getDocs(vipQuery);
    
    if (!vipSnapshot.empty) {
      const reservation = vipSnapshot.docs[0].data();
      
      // Check if not expired
      const expiresAt = reservation.expiresAt?.toDate?.() || reservation.expiresAt;
      if (!expiresAt || new Date(expiresAt) > new Date()) {
        return res.status(200).json({
          isAvailable: false,
          message: 'This username is reserved',
          isVIPReserved: true,
          reservedFor: reservation.reservedFor || 'VIP user',
        });
      }
    }
    
    // Step 3: Check existing users
    const usersQuery = query(
      collection(db, 'users'),
      where('username', '==', normalizedUsername)
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    
    if (!usersSnapshot.empty) {
      return res.status(200).json({
        isAvailable: false,
        message: 'This username is already taken',
        isVIPReserved: false,
      });
    }
    
    // Step 4: Username is available
    return res.status(200).json({
      isAvailable: true,
      message: 'Username is available',
      warnings: validation.warnings,
    });
    
  } catch (error) {
    console.error('Username check error:', error);
    
    return res.status(500).json({
      isAvailable: false,
      message: 'Error checking username availability',
      error: 'SERVER_ERROR',
    });
  }
}

