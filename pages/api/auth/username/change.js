/**
 * API Route: Change Username
 * 
 * POST /api/auth/username/change
 * 
 * Changes a user's username with cooldown enforcement.
 * Requires authentication and respects cooldown periods.
 * 
 * @example
 * ```js
 * const response = await fetch('/api/auth/username/change', {
 *   method: 'POST',
 *   headers: { 
 *     'Content-Type': 'application/json',
 *     'Authorization': 'Bearer <token>'
 *   },
 *   body: JSON.stringify({
 *     newUsername: 'newusername',
 *     countryCode: 'US'
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
  getDoc,
  setDoc,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { withCSRFProtection } from '../../../../lib/csrfProtection.js';
import { logAuthSuccess, logAuthFailure, getClientIP } from '../../../../lib/securityLogger.js';
import { validateUsername } from '../../../../lib/usernameValidation.js';
import { checkUsernameAvailability } from '../../../../lib/usernameValidation.js';
import { usernameChangePolicy } from '../../../../lib/usernameChangePolicy.js';
import { createSignupLimiter } from '../../../../lib/rateLimiter.js';
import { logger } from '../../../../lib/structuredLogger.js';

// Use require for firebase-admin to ensure Turbopack compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports
const admin = require('firebase-admin');

// Minimum response time to prevent timing attacks (milliseconds)
const MIN_RESPONSE_TIME_MS = 150;

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================

// Track Firebase Admin initialization status
let firebaseAdminInitialized = false;
let firebaseAdminInitError = null;

// Initialize Firebase Admin (for verifying tokens)
if (admin.apps.length === 0) {
  try {
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountEnv) {
      firebaseAdminInitError = new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set');
      logger.error('Firebase Admin initialization failed', firebaseAdminInitError, {
        component: 'auth',
        operation: 'firebase-admin-init',
      });
    } else {
      const serviceAccount = JSON.parse(serviceAccountEnv);
      if (!serviceAccount.project_id) {
        firebaseAdminInitError = new Error('FIREBASE_SERVICE_ACCOUNT is missing project_id');
        logger.error('Firebase Admin initialization failed', firebaseAdminInitError, {
          component: 'auth',
          operation: 'firebase-admin-init',
        });
      } else {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        firebaseAdminInitialized = true;
      }
    }
  } catch (error) {
    firebaseAdminInitError = error;
    logger.error('Firebase Admin initialization failed', error, {
      component: 'auth',
      operation: 'firebase-admin-init',
    });
  }
} else {
  // Admin app already exists
  firebaseAdminInitialized = true;
}

// Initialize Firebase Client (for Firestore)
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

// Create rate limiter
const rateLimiter = createSignupLimiter();

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Verify authentication token and get user UID
 * @param {string} authHeader - Authorization header
 * @returns {Promise<{ uid: string | null, error?: string }>}
 */
async function verifyAuth(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) {
    return { uid: null, error: 'Missing authorization header' };
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  try {
    // For development without Firebase Admin
    if (process.env.NODE_ENV === 'development' && token === 'dev-token') {
      return { uid: 'dev-uid' };
    }
    
    // Check if Firebase Admin was initialized successfully
    if (!firebaseAdminInitialized) {
      logger.error('Firebase Admin not initialized, cannot verify token', null, {
        component: 'auth',
        operation: 'token-verification',
        error: firebaseAdminInitError?.message || 'Authentication service unavailable',
      });
      return { 
        uid: null, 
        error: firebaseAdminInitError?.message || 'Authentication service unavailable' 
      };
    }
    
    // Verify with Firebase Admin
    const adminAuth = admin.auth();
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    return { uid: decodedToken.uid };
  } catch (error) {
    logger.error('Token verification error', error, {
      component: 'auth',
      operation: 'token-verification',
    });
    return { uid: null, error: 'Invalid token' };
  }
}

// ============================================================================
// HANDLER
// ============================================================================

const handler = async function(req, res) {
  const startTime = Date.now();
  const clientIP = getClientIP(req);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Use POST request' 
    });
  }
  
  try {
    // Step 0: Rate limiting
    const rateLimitResult = await rateLimiter.check(req);
    
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
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(rateLimitResult.retryAfterMs / 1000),
      });
    }
    
    // Step 1: Verify authentication
    const authResult = await verifyAuth(req.headers.authorization);
    if (!authResult.uid) {
      // Log authentication failure
      await logAuthFailure(null, clientIP, authResult.error || 'Missing or invalid token', {
        endpoint: '/api/auth/username/change',
      });
      
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: authResult.error || 'Authentication required',
      });
    }
    
    const { newUsername, countryCode = 'US' } = req.body;
    
    // Step 2: Validate request
    if (!newUsername || typeof newUsername !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_REQUEST',
        message: 'New username is required',
      });
    }
    
    // Step 3: Check cooldown policy
    const canChange = await usernameChangePolicy.canChangeUsername(authResult.uid);
    if (!canChange.allowed) {
      return res.status(403).json({
        success: false,
        error: 'COOLDOWN_ACTIVE',
        message: canChange.reason || 'Username change cooldown is active',
        retryAfterDays: canChange.retryAfterDays,
        retryAfterDate: canChange.retryAfterDate?.toISOString(),
      });
    }
    
    // Step 4: Validate new username format
    const validation = validateUsername(newUsername, countryCode);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_USERNAME',
        message: 'Username unavailable',
        errors: validation.errors,
      });
    }
    
    const normalizedNewUsername = newUsername.toLowerCase().trim();
    
    // Step 5: Check if new username is available
    const availability = await checkUsernameAvailability(normalizedNewUsername);
    if (!availability.isAvailable) {
      return res.status(409).json({
        success: false,
        error: 'USERNAME_TAKEN',
        message: 'Username unavailable',
        suggestions: availability.suggestions,
      });
    }
    
    // Step 6: Get current user data
    const userRef = doc(db, 'users', authResult.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }
    
    const userData = userDoc.data();
    const oldUsername = userData.username;
    
    // Step 7: Check if username is actually changing
    if (oldUsername === normalizedNewUsername) {
      return res.status(400).json({
        success: false,
        error: 'NO_CHANGE',
        message: 'New username is the same as current username',
      });
    }
    
    // Step 8: Atomic username change transaction
    // Note: Username availability was already checked above.
    // We can't query inside transactions, so we rely on the pre-check.
    // The transaction ensures atomicity of the user document update.
    await runTransaction(db, async (transaction) => {
      // Re-read user document to get latest data
      const currentUserDoc = await transaction.get(userRef);
      if (!currentUserDoc.exists()) {
        throw new Error('USER_NOT_FOUND');
      }
      
      const currentUserData = currentUserDoc.data();
      
      // Double-check username hasn't changed (defense against race conditions)
      if (currentUserData.username !== oldUsername) {
        throw new Error('USERNAME_CHANGED');
      }
      
      // Update user profile
      const currentChangeCount = currentUserData.usernameChangeCount || 0;
      transaction.update(userRef, {
        username: normalizedNewUsername,
        previousUsername: oldUsername,
        lastUsernameChange: serverTimestamp(),
        usernameChangeCount: currentChangeCount + 1,
        updatedAt: serverTimestamp(),
      });
      
      // Create audit record
      const auditRef = doc(collection(db, 'username_change_audit'), `${authResult.uid}_${Date.now()}`);
      transaction.set(auditRef, {
        uid: authResult.uid,
        oldUsername,
        newUsername: normalizedNewUsername,
        changeType: 'user_request',
        changedBy: authResult.uid,
        changedAt: serverTimestamp(),
        reason: 'User requested username change',
        metadata: {
          changeCount: currentChangeCount + 1,
          countryCode,
        },
      });
    });
    
    // Step 9: Get updated cooldown info
    const cooldownInfo = await usernameChangePolicy.getCooldownInfo(authResult.uid);
    
    // Log successful username change
    await logAuthSuccess(authResult.uid, clientIP, {
      endpoint: '/api/auth/username/change',
      oldUsername,
      newUsername: normalizedNewUsername,
    });
    
    return res.status(200).json({
      success: true,
      message: 'Username changed successfully',
      username: normalizedNewUsername,
      previousUsername: oldUsername,
      cooldownInfo: {
        cooldownDays: cooldownInfo.cooldownDays,
        retryAfterDate: cooldownInfo.retryAfterDate?.toISOString(),
      },
    });
    
  } catch (error) {
    logger.error('Username change error', error, {
      component: 'auth',
      operation: 'username-change',
    });
    
    if (error.message === 'USERNAME_TAKEN') {
      return res.status(409).json({
        success: false,
        error: 'USERNAME_TAKEN',
        message: 'Username unavailable',
      });
    }
    
    if (error.message === 'USERNAME_CHANGED') {
      return res.status(409).json({
        success: false,
        error: 'USERNAME_CHANGED',
        message: 'Username was changed by another process. Please refresh and try again.',
      });
    }
    
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Error changing username',
    });
  }
};

// Export with CSRF protection
export default withCSRFProtection(handler);

