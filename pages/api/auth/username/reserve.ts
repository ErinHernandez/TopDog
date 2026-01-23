/**
 * API Route: Reserve Username for VIP
 * 
 * POST /api/auth/username/reserve
 * 
 * Reserves a username for a VIP/influencer.
 * Requires admin authentication.
 * 
 * @example
 * ```ts
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

import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc,
  serverTimestamp,
  type Timestamp
} from 'firebase/firestore';
import { initializeApp as initializeClientApp, getApps as getClientApps } from 'firebase/app';
import { verifyAdminAccess } from '../../../../lib/adminAuth';
import { logger } from '../../../../lib/structuredLogger';
import { sanitizeUsername, sanitizeString } from '../../../../lib/inputSanitization';
import { logSecurityEvent, SecurityEventType, getClientIP } from '../../../../lib/securityLogger';
import { createAuthRateLimiter } from '../../../../lib/rateLimitConfig';
import { withCSRFProtection } from '../../../../lib/csrfProtection';
import { withRateLimit } from '../../../../lib/rateLimitConfig';
import { 
  withErrorHandling, 
  validateMethod, 
  validateBody,
  createErrorResponse,
  createSuccessResponse,
  ErrorType,
  type ApiHandler,
} from '../../../../lib/apiErrorHandler';

// Use require for firebase-admin to ensure Turbopack compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports
const admin = require('firebase-admin') as typeof import('firebase-admin');

// ============================================================================
// TYPES
// ============================================================================

export interface ReserveUsernameRequest {
  username: string;
  reservedFor: string;
  expiresInDays?: number;
  priority?: 'normal' | 'high' | 'critical';
  notes?: string;
}

export interface ReserveUsernameResponse {
  success: boolean;
  message: string;
  reservation: {
    id: string;
    username: string;
    reservedFor: string;
    expiresAt: string | null;
    priority: string;
  };
}

export interface VIPReservation {
  id: string;
  username: string;
  usernameLower: string;
  reservedFor: string;
  reservedBy: string;
  reservedByEmail: string | null;
  reservedAt: Timestamp | Date;
  expiresAt: Date | null;
  priority: 'normal' | 'high' | 'critical';
  notes: string;
  claimed: boolean;
  claimedAt: Timestamp | Date | null;
  claimedBy: string | null;
}

// ============================================================================
// FIREBASE ADMIN INITIALIZATION
// ============================================================================

// Initialize Firebase Admin (for verifying tokens)
if (admin.apps.length === 0) {
  try {
    const serviceAccountRaw = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}') as { project_id?: string; projectId?: string };
    const serviceAccount: import('firebase-admin').ServiceAccount = {
      ...serviceAccountRaw,
      projectId: serviceAccountRaw.projectId || serviceAccountRaw.project_id
    };
    if (serviceAccount.projectId) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn('Firebase Admin initialization skipped', {
      component: 'auth',
      operation: 'firebase-admin-init',
      error: errorMessage,
    });
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

async function verifyAdminToken(authHeader: string | undefined): Promise<{ isAdmin: boolean; uid: string; email: string | null }> {
  // Use centralized admin verification utility
  const result = await verifyAdminAccess(authHeader);
  return {
    isAdmin: result.isAdmin,
    uid: result.uid || '',
    email: result.email || null
  };
}

function generateReservationId(username: string): string {
  return `vip_${username.toLowerCase()}_${Date.now()}`;
}

// ============================================================================
// HANDLER
// ============================================================================

const handler = async function(
  req: NextApiRequest,
  res: NextApiResponse<ReserveUsernameResponse>
): Promise<unknown> {
  const clientIP = getClientIP(req);
  
  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
    // Validate HTTP method
    validateMethod(req, ['POST'], logger);
    
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
      
      const errorResponse = createErrorResponse(
        ErrorType.RATE_LIMIT,
        'Too many requests. Please try again later.',
        { retryAfter: Math.ceil((rateLimitResult.retryAfterMs || 60) / 1000) },
        res.getHeader('X-Request-ID') as string | undefined
      );
      return res.status(errorResponse.statusCode).json({
        success: false,
        message: errorResponse.body.error.message,
        reservation: {
          id: '',
          username: '',
          reservedFor: '',
          expiresAt: null,
          priority: 'normal'
        }
      });
    }
    
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
      
      const errorResponse = createErrorResponse(
        ErrorType.FORBIDDEN,
        'Admin access required',
        {},
        res.getHeader('X-Request-ID') as string | undefined
      );
      return res.status(errorResponse.statusCode).json({
        success: false,
        message: errorResponse.body.error.message,
        reservation: {
          id: '',
          username: '',
          reservedFor: '',
          expiresAt: null,
          priority: 'normal'
        }
      });
    }
    
    // Validate required body fields
    validateBody(req, ['username', 'reservedFor'], logger);
    
    const { 
      username, 
      reservedFor, 
      expiresInDays = DEFAULT_EXPIRY_DAYS,
      priority = 'normal',
      notes = ''
    } = req.body as ReserveUsernameRequest;
    
    // Sanitize input
    const sanitizedUsername = username ? sanitizeUsername(username) : null;
    const sanitizedReservedFor = reservedFor ? sanitizeString(reservedFor, { maxLength: 100 }) : null;
    const sanitizedNotes = notes ? sanitizeString(notes, { maxLength: 500 }) : null;
    const sanitizedExpiresInDays = typeof expiresInDays === 'number' 
      ? Math.max(1, Math.min(365, expiresInDays)) 
      : DEFAULT_EXPIRY_DAYS;
    
    // Additional validation after sanitization
    if (!sanitizedUsername) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        'Username is required and must be valid',
        {},
        res.getHeader('X-Request-ID') as string | undefined
      );
      return res.status(errorResponse.statusCode).json({
        success: false,
        message: errorResponse.body.error.message,
        reservation: {
          id: '',
          username: '',
          reservedFor: '',
          expiresAt: null,
          priority: 'normal'
        }
      });
    }
    
    if (!sanitizedReservedFor) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        'Reserved for (VIP name) is required and must be valid',
        {},
        res.getHeader('X-Request-ID') as string | undefined
      );
      return res.status(errorResponse.statusCode).json({
        success: false,
        message: errorResponse.body.error.message,
        reservation: {
          id: '',
          username: '',
          reservedFor: '',
          expiresAt: null,
          priority: 'normal'
        }
      });
    }
    
    logger.info('Processing VIP username reservation', {
      component: 'auth',
      operation: 'username-reserve',
      username: sanitizedUsername,
      reservedFor: sanitizedReservedFor,
      adminUid: adminCheck.uid,
    });
    
    const normalizedUsername = sanitizedUsername.toLowerCase().trim();
    
    // Check if username already exists or is reserved
    // Check existing users
    const usersQuery = query(
      collection(db, 'users'),
      where('username', '==', normalizedUsername)
    );
    const usersSnapshot = await getDocs(usersQuery);
    
    if (!usersSnapshot.empty) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        'This username is already registered by a user',
        { username: normalizedUsername },
        res.getHeader('X-Request-ID') as string | undefined
      );
      return res.status(409).json({
        success: false,
        message: errorResponse.body.error.message,
        reservation: {
          id: '',
          username: '',
          reservedFor: '',
          expiresAt: null,
          priority: 'normal'
        }
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
      const existing = vipSnapshot.docs[0].data() as VIPReservation;
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        `Username already reserved for ${existing.reservedFor}`,
        {
          existingReservation: {
            reservedFor: existing.reservedFor,
            reservedAt: existing.reservedAt instanceof Date 
              ? existing.reservedAt 
              : (existing.reservedAt as Timestamp)?.toDate?.() || existing.reservedAt,
            expiresAt: existing.expiresAt,
          },
        },
        res.getHeader('X-Request-ID') as string | undefined
      );
      return res.status(409).json({
        success: false,
        message: errorResponse.body.error.message,
        reservation: {
          id: '',
          username: '',
          reservedFor: '',
          expiresAt: null,
          priority: 'normal'
        }
      });
    }
    
    // Create reservation
    const reservationId = generateReservationId(normalizedUsername);
    const expiresAt = sanitizedExpiresInDays > 0 
      ? new Date(Date.now() + sanitizedExpiresInDays * 24 * 60 * 60 * 1000)
      : null;
    
    const reservation: VIPReservation = {
      id: reservationId,
      username: normalizedUsername,
      usernameLower: normalizedUsername,
      reservedFor: sanitizedReservedFor,
      reservedBy: adminCheck.uid,
      reservedByEmail: adminCheck.email,
      reservedAt: serverTimestamp() as unknown as Timestamp,
      expiresAt: expiresAt,
      priority: (['normal', 'high', 'critical'] as const).includes(priority as 'normal' | 'high' | 'critical') 
        ? (priority as 'normal' | 'high' | 'critical') 
        : 'normal',
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
    
    const response = createSuccessResponse({
      success: true,
      message: 'Username reserved successfully',
      reservation: {
        id: reservationId,
        username: normalizedUsername,
        reservedFor: sanitizedReservedFor,
        expiresAt: expiresAt?.toISOString() || null,
        priority,
      },
    }, 201, logger);
    
    return res.status(response.statusCode).json(response.body.data as ReserveUsernameResponse);
  });
};

// Export with CSRF protection and rate limiting
type CSRFHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;
export default withCSRFProtection(
  withRateLimit(handler as unknown as CSRFHandler, reserveUsernameLimiter) as unknown as CSRFHandler
);
