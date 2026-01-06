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
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { initializeApp as initializeClientApp, getApps as getClientApps } from 'firebase/app';

// ============================================================================
// FIREBASE ADMIN INITIALIZATION
// ============================================================================

// Initialize Firebase Admin (for verifying tokens)
if (getApps().length === 0) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    if (serviceAccount.project_id) {
      initializeApp({
        credential: cert(serviceAccount),
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

const ADMIN_UIDS = new Set([
  // Add admin UIDs here or fetch from environment
  process.env.ADMIN_UID_1,
  process.env.ADMIN_UID_2,
].filter(Boolean));

const MAX_RESERVATIONS_PER_ADMIN = 100;
const DEFAULT_EXPIRY_DAYS = 90;

// ============================================================================
// HELPERS
// ============================================================================

async function verifyAdminToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) {
    return { isAdmin: false, error: 'Missing authorization header' };
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  try {
    // For development without Firebase Admin
    if (process.env.NODE_ENV === 'development' && token === 'dev-admin-token') {
      return { isAdmin: true, uid: 'dev-admin', email: 'admin@dev.local' };
    }
    
    // Verify with Firebase Admin
    const adminAuth = getAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Check if user is admin
    if (ADMIN_UIDS.has(decodedToken.uid) || decodedToken.admin === true) {
      return { 
        isAdmin: true, 
        uid: decodedToken.uid, 
        email: decodedToken.email 
      };
    }
    
    return { isAdmin: false, error: 'User is not an admin' };
    
  } catch (error) {
    console.error('Token verification error:', error);
    return { isAdmin: false, error: 'Invalid token' };
  }
}

function generateReservationId(username) {
  return `vip_${username.toLowerCase()}_${Date.now()}`;
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
    // Verify admin authentication
    const adminCheck = await verifyAdminToken(req.headers.authorization);
    
    if (!adminCheck.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: adminCheck.error || 'Admin access required',
      });
    }
    
    const { 
      username, 
      reservedFor, 
      expiresInDays = DEFAULT_EXPIRY_DAYS,
      priority = 'normal',
      notes = ''
    } = req.body;
    
    // Validate request
    if (!username || typeof username !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_REQUEST',
        message: 'Username is required',
      });
    }
    
    if (!reservedFor || typeof reservedFor !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_REQUEST',
        message: 'Reserved for (VIP name) is required',
      });
    }
    
    const normalizedUsername = username.toLowerCase().trim();
    
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
    const expiresAt = expiresInDays > 0 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;
    
    const reservation = {
      id: reservationId,
      username: normalizedUsername,
      usernameLower: normalizedUsername,
      reservedFor: reservedFor.trim(),
      reservedBy: adminCheck.uid,
      reservedByEmail: adminCheck.email,
      reservedAt: serverTimestamp(),
      expiresAt: expiresAt,
      priority: ['normal', 'high', 'critical'].includes(priority) ? priority : 'normal',
      notes: notes.trim(),
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
      reservedFor: reservedFor.trim(),
      performedBy: adminCheck.uid,
      performedByEmail: adminCheck.email,
      timestamp: serverTimestamp(),
    });
    
    return res.status(201).json({
      success: true,
      message: `Username "${normalizedUsername}" reserved for ${reservedFor}`,
      reservation: {
        id: reservationId,
        username: normalizedUsername,
        reservedFor: reservedFor.trim(),
        expiresAt: expiresAt?.toISOString() || null,
        priority,
      },
    });
    
  } catch (error) {
    console.error('Username reservation error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Error reserving username',
    });
  }
}

