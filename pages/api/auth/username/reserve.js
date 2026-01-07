/**
 * API Route: Reserve Username for VIP
 * 
 * POST /api/auth/username/reserve
 * 
 * Reserves a username for a VIP/influencer.
 * Requires admin authentication.
 * 
 * @example
 * ```js
 * const response = await fetch('/api/auth/username/reserve', {
 *   method: 'POST',
 *   headers: { 
 *     'Content-Type': 'application/json',
 *     'Authorization': 'Bearer <admin-token>'
 *   },
 *   body: JSON.stringify({
 *     username: 'celebrity',
 *     reservedFor: 'John Celebrity',
 *     expiresInDays: 90,
 *     priority: 'high',
 *     notes: 'Influencer partnership'
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
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { initializeApp as initializeClientApp, getApps as getClientApps } from 'firebase/app';
import { verifyAdminAccess } from '../../../../lib/adminAuth.js';

// Use require for firebase-admin to ensure Turbopack compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports
const admin = require('firebase-admin');

// ============================================================================
// FIREBASE ADMIN INITIALIZATION
// ============================================================================

// Initialize Firebase Admin (for verifying tokens)
if (admin.apps.length === 0) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    if (serviceAccount.project_id) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  } catch (error) {
    console.warn('Firebase Admin initialization skipped:', error.message);
  }
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

const clientApp = getClientApps().length === 0 
  ? initializeClientApp(firebaseConfig) 
  : getClientApps()[0];
const db = getFirestore(clientApp);

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_RESERVATIONS_PER_ADMIN = 100;
const DEFAULT_EXPIRY_DAYS = 90;

// Create rate limiter (strict for admin operations)
const reserveUsernameLimiter = createAuthRateLimiter('usernameChange');

// ============================================================================
// HELPERS
// ============================================================================

async function verifyAdminToken(authHeader) {
  // Use centralized admin verification utility
  return await verifyAdminAccess(authHeader);
}

function generateReservationId(username) {
  return `vip_${username.toLowerCase()}_${Date.now()}`;
}

// ============================================================================
// HANDLER
// ============================================================================

const handler = async function(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Use POST request' 
    });
  }
  
  const clientIP = getClientIP(req);
  
  // Check rate limit
  const rateLimitResult = await reserveUsernameLimiter.check(req);
  
  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', reserveUsernameLimiter.config.maxRequests);
  res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
  res.setHeader('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt / 1000));
  
  if (!rateLimitResult.allowed) {
    await logSecurityEvent(
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      'medium',
      { endpoint: '/api/auth/username/reserve' },
      null,
      clientIP
    );
    
    return res.status(429).json({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(rateLimitResult.retryAfterMs / 1000),
    });
  }
  
  try {
    // Verify admin authentication
    const adminCheck = await verifyAdminToken(req.headers.authorization);
    
    if (!adminCheck.isAdmin) {
      await logSecurityEvent(
        SecurityEventType.AUTH_FAILURE,
        'high',
        { 
          endpoint: '/api/auth/username/reserve',
          reason: 'admin_access_denied'
        },
        null,
        clientIP
      );
      
      return res.status(403).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Admin access required',
      });
    }
    
    const { 
      username, 
      reservedFor, 
      expiresInDays = DEFAULT_EXPIRY_DAYS,
      priority = 'normal',
      notes = ''
    } = req.body;
    
    // Sanitize input
    const sanitizedUsername = username ? sanitizeUsername(username) : null;
    const sanitizedReservedFor = reservedFor ? sanitizeString(reservedFor, { maxLength: 100 }) : null;
    const sanitizedNotes = notes ? sanitizeString(notes, { maxLength: 500 }) : null;
    const sanitizedExpiresInDays = typeof expiresInDays === 'number' 
      ? Math.max(1, Math.min(365, expiresInDays)) 
      : DEFAULT_EXPIRY_DAYS;
    
    // Validate request
    if (!sanitizedUsername) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_REQUEST',
        message: 'Username is required',
      });
    }
    
    if (!sanitizedReservedFor) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_REQUEST',
        message: 'Reserved for (VIP name) is required and must be valid',
      });
    }
    
    const normalizedUsername = sanitizedUsername.toLowerCase().trim();
    
    // Check if username already exists or is reserved
    // Check existing users
    const usersQuery = query(
      collection(db, 'users'),
      where('username', '==', normalizedUsername)
    );
    const usersSnapshot = await getDocs(usersQuery);
    
    if (!usersSnapshot.empty) {
      return res.status(409).json({
        success: false,
        error: 'USERNAME_TAKEN',
        message: 'This username is already registered by a user',
      });
    }
    
    // Check existing VIP reservations
    const vipQuery = query(
      collection(db, 'vip_reservations'),
      where('usernameLower', '==', normalizedUsername),
      where('claimed', '==', false)
    );
    const vipSnapshot = await getDocs(vipQuery);
    
    if (!vipSnapshot.empty) {
      const existing = vipSnapshot.docs[0].data();
      return res.status(409).json({
        success: false,
        error: 'ALREADY_RESERVED',
        message: `Username already reserved for ${existing.reservedFor}`,
        existingReservation: {
          reservedFor: existing.reservedFor,
          reservedAt: existing.reservedAt?.toDate?.() || existing.reservedAt,
          expiresAt: existing.expiresAt?.toDate?.() || existing.expiresAt,
        },
      });
    }
    
    // Create reservation
    const reservationId = generateReservationId(normalizedUsername);
    const expiresAt = sanitizedExpiresInDays > 0 
      ? new Date(Date.now() + sanitizedExpiresInDays * 24 * 60 * 60 * 1000)
      : null;
    
    const reservation = {
      id: reservationId,
      username: normalizedUsername,
      usernameLower: normalizedUsername,
      reservedFor: sanitizedReservedFor,
      reservedBy: adminCheck.uid,
      reservedByEmail: adminCheck.email,
      reservedAt: serverTimestamp(),
      expiresAt: expiresAt,
      priority: ['normal', 'high', 'critical'].includes(priority) ? priority : 'normal',
      notes: sanitizedNotes || '',
      claimed: false,
      claimedAt: null,
      claimedBy: null,
    };
    
    await setDoc(doc(db, 'vip_reservations', reservationId), reservation);
    
    // Log the action
    await setDoc(doc(db, 'admin_audit_log', `${reservationId}_created`), {
      action: 'VIP_RESERVATION_CREATED',
      reservationId,
      username: normalizedUsername,
      reservedFor: sanitizedReservedFor,
      performedBy: adminCheck.uid,
      performedByEmail: adminCheck.email,
      timestamp: serverTimestamp(),
    });
    
    // Log security event
    await logSecurityEvent(
      SecurityEventType.ADMIN_ACTION,
      'high',
      { 
        action: 'username_reserved',
        username: normalizedUsername,
        reservedFor: sanitizedReservedFor
      },
      adminCheck.uid,
      clientIP
    );
    
    return res.status(201).json({
      success: true,
      message: 'Username reserved successfully',
      reservation: {
        id: reservationId,
        username: normalizedUsername,
        reservedFor: sanitizedReservedFor,
        expiresAt: expiresAt?.toISOString() || null,
        priority,
      },
    });
    
  } catch (error) {
    console.error('Username reservation error:', error);
    
    await logSecurityEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      'medium',
      { 
        endpoint: '/api/auth/username/reserve',
        error: error.message
      },
      null,
      clientIP
    );
    
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Error reserving username',
    });
  }
};

// Export with CSRF protection and rate limiting
export default withCSRFProtection(
  withRateLimit(handler, reserveUsernameLimiter)
);

