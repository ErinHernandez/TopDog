/**
 * API Route: User Signup
 * 
 * POST /api/auth/signup
 * 
 * Creates a new user account with username.
 * Handles:
 * - Username validation and reservation
 * - Profile creation
 * - Country validation
 * 
 * @example
 * ```js
 * const response = await fetch('/api/auth/signup', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     uid: 'firebase-uid',
 *     username: 'newuser',
 *     email: 'user@example.com',
 *     countryCode: 'US',
 *     displayName: 'New User'
 *   })
 * });
 * ```
 */

import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { isApprovedCountry } from '../../../lib/localeCharacters.js';
import { createSignupLimiter } from '../../../lib/rateLimiter.js';
import { logger } from '../../../lib/structuredLogger.js';

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

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Create rate limiter instance
const rateLimiter = createSignupLimiter();

// Minimum response time to prevent timing attacks (milliseconds)
const MIN_RESPONSE_TIME_MS = 150;

// ============================================================================
// CONSTANTS
// ============================================================================

const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'root', 'system', 'bot',
  'moderator', 'mod', 'support', 'help', 'info',
  'api', 'www', 'web', 'app', 'mobile',
  'topdog', 'top_dog', 'top-dog', 'topdogfantasy',
  'bestball', 'best_ball', 'best-ball',
  'test', 'null', 'undefined', 'anonymous',
  'deleted', 'banned', 'suspended',
  'official', 'verified', 'staff', 'team',
]);

const USERNAME_CONSTRAINTS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 18,
};

// ============================================================================
// VALIDATION
// ============================================================================

function validateUsername(username) {
  const errors = [];
  
  if (!username || typeof username !== 'string') {
    errors.push('Username is required');
    return { isValid: false, errors };
  }
  
  const trimmed = username.trim().toLowerCase();
  
  if (trimmed.length < USERNAME_CONSTRAINTS.MIN_LENGTH) {
    errors.push(`Username must be at least ${USERNAME_CONSTRAINTS.MIN_LENGTH} characters`);
  }
  
  if (trimmed.length > USERNAME_CONSTRAINTS.MAX_LENGTH) {
    errors.push(`Username must be at most ${USERNAME_CONSTRAINTS.MAX_LENGTH} characters`);
  }
  
  if (/\s/.test(trimmed)) {
    errors.push('Username cannot contain spaces');
  }
  
  // Allow letters (including extended Latin), numbers, underscores
  if (!/^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+$/.test(trimmed)) {
    errors.push('Username contains invalid characters');
  }
  
  if (!/^[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]/.test(trimmed)) {
    errors.push('Username must start with a letter');
  }
  
  if (/__/.test(trimmed)) {
    errors.push('Username cannot have consecutive underscores');
  }
  
  if (RESERVED_USERNAMES.has(trimmed)) {
    errors.push('This username is reserved');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    normalized: trimmed,
  };
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(req, res) {
  const startTime = Date.now();
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Use POST request' 
    });
  }
  
  try {
    // Step 0: Rate limiting
    const rateLimitResult = await rateLimiter.check(req);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', '3');
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
    res.setHeader('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt / 1000));
    
    if (!rateLimitResult.allowed) {
      // Ensure consistent timing even for rate-limited requests to prevent timing attacks
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_RESPONSE_TIME_MS) {
        await new Promise(resolve => setTimeout(resolve, MIN_RESPONSE_TIME_MS - elapsed));
      }
      
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many signup attempts. Please try again later.',
        retryAfter: Math.ceil(rateLimitResult.retryAfterMs / 1000), // seconds
      });
    }
    
    const { 
      uid, 
      username, 
      email, 
      countryCode = 'US',
      displayName 
    } = req.body;
    
    // Validate UID
    if (!uid || typeof uid !== 'string') {
      // Ensure consistent timing
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_RESPONSE_TIME_MS) {
        await new Promise(resolve => setTimeout(resolve, MIN_RESPONSE_TIME_MS - elapsed));
      }
      
      return res.status(400).json({
        success: false,
        error: 'INVALID_REQUEST',
        message: 'Invalid request',
      });
    }
    
    // Validate country
    if (!isApprovedCountry(countryCode)) {
      // Ensure consistent timing
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_RESPONSE_TIME_MS) {
        await new Promise(resolve => setTimeout(resolve, MIN_RESPONSE_TIME_MS - elapsed));
      }
      
      return res.status(403).json({
        success: false,
        error: 'COUNTRY_NOT_ALLOWED',
        message: 'This service is not available in your country',
      });
    }
    
    // Validate username
    const validation = validateUsername(username);
    if (!validation.isValid) {
      // Generic error message to prevent enumeration
      // Ensure consistent timing
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_RESPONSE_TIME_MS) {
        await new Promise(resolve => setTimeout(resolve, MIN_RESPONSE_TIME_MS - elapsed));
      }
      
      return res.status(400).json({
        success: false,
        error: 'INVALID_USERNAME',
        message: 'Username unavailable',
        errors: validation.errors,
      });
    }
    
    const normalizedUsername = validation.normalized;
    
    // Use transaction for atomic operations
    const result = await runTransaction(db, async (transaction) => {
      // Check if username exists
      const usersQuery = query(
        collection(db, 'users'),
        where('username', '==', normalizedUsername)
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      if (!usersSnapshot.empty) {
        throw new Error('USERNAME_TAKEN');
      }
      
      // Check VIP reservation
      const vipQuery = query(
        collection(db, 'vip_reservations'),
        where('usernameLower', '==', normalizedUsername),
        where('claimed', '==', false)
      );
      const vipSnapshot = await getDocs(vipQuery);
      
      if (!vipSnapshot.empty) {
        const reservation = vipSnapshot.docs[0].data();
        const expiresAt = reservation.expiresAt?.toDate?.() || reservation.expiresAt;
        
        // Check if not expired
        if (!expiresAt || new Date(expiresAt) > new Date()) {
          throw new Error('USERNAME_VIP_RESERVED');
        }
      }
      
      // Create user profile
      const userProfile = {
        uid,
        username: normalizedUsername,
        email: email || null,
        countryCode,
        displayName: displayName || normalizedUsername,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        isActive: true,
        profileComplete: true,
        tournamentsEntered: 0,
        tournamentsWon: 0,
        totalWinnings: 0,
        bestFinish: null,
        preferences: {
          notifications: true,
          emailUpdates: true,
          publicProfile: true,
          borderColor: '#4285F4',
        },
      };
      
      const userRef = doc(db, 'users', uid);
      transaction.set(userRef, userProfile);
      
      return userProfile;
    });
    
    return res.status(201).json({
      success: true,
      message: 'User profile created successfully',
      profile: {
        uid: result.uid,
        username: result.username,
        displayName: result.displayName,
        countryCode: result.countryCode,
      },
    });
    
  } catch (error) {
    logger.error('Signup error', error, {
      component: 'auth',
      operation: 'signup',
    });
    
    // Ensure consistent timing even on errors
    const elapsed = Date.now() - startTime;
    if (elapsed < MIN_RESPONSE_TIME_MS) {
      await new Promise(resolve => setTimeout(resolve, MIN_RESPONSE_TIME_MS - elapsed));
    }
    
    // Handle specific errors with generic messages to prevent enumeration
    if (error.message === 'USERNAME_TAKEN') {
      return res.status(409).json({
        success: false,
        error: 'USERNAME_TAKEN',
        message: 'Username unavailable',
      });
    }
    
    if (error.message === 'USERNAME_VIP_RESERVED') {
      return res.status(403).json({
        success: false,
        error: 'USERNAME_VIP_RESERVED',
        message: 'Username unavailable',
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Error creating user profile',
    });
  }
}

