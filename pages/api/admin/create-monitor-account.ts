/**
 * Admin API Route: Create Monitor Account
 * 
 * POST /api/admin/create-monitor-account
 * 
 * Creates a special monitor account for UX testing with:
 * - Reserved username: "OcularPatdowns"
 * - Operating login (Firebase Auth)
 * - Fake payment method for testing
 * - Balance system for adding money
 * - Special account type (half-dev, half-user)
 * 
 * Requires admin authentication.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
 
const admin = require('firebase-admin');
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc,
  getDoc,
  serverTimestamp,
  type Firestore,
  type DocumentReference,
  type QueryDocumentSnapshot
} from 'firebase/firestore';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { verifyAdminAccess } from '../../../lib/adminAuth';
import { logger } from '../../../lib/structuredLogger';
import { 
  withErrorHandling, 
  validateMethod, 
  createErrorResponse,
  createSuccessResponse,
  ErrorType 
} from '../../../lib/apiErrorHandler';

// ============================================================================
// TYPES
// ============================================================================

export interface MonitorAccountConfig {
  username: string;
  email: string;
  password: string;
  displayName: string;
  countryCode: string;
  initialBalance: number;
}

export interface MonitorAccountResponse {
  success: boolean;
  message?: string;
  account?: {
    uid: string;
    username: string;
    email: string;
    balance: number;
    accountType: string;
  };
  error?: string;
  existingUid?: string;
  details?: {
    code?: string;
  };
}

export interface VIPReservation {
  id: string;
  username: string;
  usernameLower: string;
  reservedFor: string;
  reservedBy: string;
  reservedByEmail: string | null;
  reservedAt: ReturnType<typeof serverTimestamp>;
  expiresAt: null;
  priority: string;
  notes: string;
  claimed: boolean;
  claimedAt: ReturnType<typeof serverTimestamp> | null;
  claimedBy: string | null;
}

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  countryCode: string;
  displayName: string;
  accountType: string;
  isSpecialAccount: boolean;
  isMonitorAccount: boolean;
  balance: number;
  lastBalanceUpdate: ReturnType<typeof serverTimestamp>;
  defaultPaymentMethodId: string;
  paymentMethodType: string;
  paymentMethodBrand: string;
  paymentMethodLast4: string;
  paymentMethodExpMonth: number;
  paymentMethodExpYear: number;
  isTestPaymentMethod: boolean;
  createdAt: ReturnType<typeof serverTimestamp>;
  updatedAt: ReturnType<typeof serverTimestamp>;
  lastLogin: ReturnType<typeof serverTimestamp>;
  isActive: boolean;
  profileComplete: boolean;
  tournamentsEntered: number;
  tournamentsWon: number;
  totalWinnings: number;
  bestFinish: null;
  preferences: {
    notifications: boolean;
    emailUpdates: boolean;
    publicProfile: boolean;
    borderColor: string;
  };
  monitorAccountMetadata: {
    createdFor: string;
    canAddMoney: boolean;
    testPaymentEnabled: boolean;
    createdAt: string;
    createdBy: string;
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Get monitor account configuration from environment variables
 * SECURITY: Credentials are stored in environment, not in source code
 *
 * Required environment variables:
 * - MONITOR_ACCOUNT_USERNAME: The username for the monitor account
 * - MONITOR_ACCOUNT_EMAIL: The email for the monitor account
 * - MONITOR_ACCOUNT_PASSWORD: Generated password (use a secrets manager)
 *
 * Optional environment variables:
 * - MONITOR_ACCOUNT_DISPLAY_NAME: Display name (defaults to username)
 * - MONITOR_ACCOUNT_COUNTRY: Country code (defaults to 'US')
 * - MONITOR_ACCOUNT_INITIAL_BALANCE: Initial balance (defaults to 1000)
 */
function getMonitorAccountConfig(): MonitorAccountConfig {
  const username = process.env.MONITOR_ACCOUNT_USERNAME;
  const email = process.env.MONITOR_ACCOUNT_EMAIL;
  const password = process.env.MONITOR_ACCOUNT_PASSWORD;

  if (!username || !email || !password) {
    throw new Error(
      'Monitor account configuration missing. Required environment variables: ' +
        'MONITOR_ACCOUNT_USERNAME, MONITOR_ACCOUNT_EMAIL, MONITOR_ACCOUNT_PASSWORD'
    );
  }

  return {
    username: username.toLowerCase().trim(),
    email,
    password,
    displayName: process.env.MONITOR_ACCOUNT_DISPLAY_NAME || username,
    countryCode: process.env.MONITOR_ACCOUNT_COUNTRY || 'US',
    initialBalance: parseFloat(process.env.MONITOR_ACCOUNT_INITIAL_BALANCE || '1000'),
  };
}

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================

// Initialize Firebase Admin (for Auth)
if (admin.apps.length === 0) {
  try {
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountEnv) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set');
    }
    
    const serviceAccount = JSON.parse(serviceAccountEnv);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Firebase Admin initialization failed', new Error(errorMessage), {
      component: 'admin',
      operation: 'create-monitor-account',
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

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db: Firestore = getFirestore(app);

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MonitorAccountResponse>
): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['POST'], logger);
    
    // Verify admin authentication
    const authHeader = req.headers.authorization;
    const adminCheck = await verifyAdminAccess(authHeader);
    
    if (!adminCheck.isAdmin) {
      const errorResponse = createErrorResponse(
        ErrorType.FORBIDDEN,
        'Admin access required'
      );
      return res.status(errorResponse.statusCode).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: errorResponse.body.error.message,
      });
    }
    
    // Get configuration from environment variables (not hardcoded)
    let monitorConfig: MonitorAccountConfig;
    try {
      monitorConfig = getMonitorAccountConfig();
    } catch (configError) {
      const errorResponse = createErrorResponse(
        ErrorType.CONFIGURATION,
        configError instanceof Error ? configError.message : 'Configuration error'
      );
      return res.status(errorResponse.statusCode).json({
        success: false,
        error: 'CONFIG_ERROR',
        message: errorResponse.body.error.message,
      });
    }

    const { username, email, password, displayName, countryCode, initialBalance } = monitorConfig;
    const normalizedUsername = username.toLowerCase().trim();
    
    logger.info('Creating monitor account', {
      component: 'admin',
      operation: 'create-monitor-account',
      username: normalizedUsername,
      email,
      adminUid: adminCheck.uid,
    });
    
    try {
      // Step 1: Check if username is already taken
      const usersQuery = query(
        collection(db, 'users'),
        where('username', '==', normalizedUsername)
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      if (!usersSnapshot.empty) {
        const existingUser = usersSnapshot.docs[0].data() as { uid?: string };
        const errorResponse = createErrorResponse(
          ErrorType.VALIDATION,
          'Username is already taken by an existing user',
          { existingUid: existingUser.uid }
        );
        return res.status(errorResponse.statusCode).json({
          success: false,
          error: 'USERNAME_TAKEN',
          message: errorResponse.body.error.message,
          existingUid: existingUser.uid,
        });
      }
      
      // Step 2: Create VIP reservation for the username
      const vipReservationId = `vip_${normalizedUsername}_${Date.now()}`;
      
      // Check if reservation already exists
      const vipQuery = query(
        collection(db, 'vip_reservations'),
        where('usernameLower', '==', normalizedUsername),
        where('claimed', '==', false)
      );
      const vipSnapshot = await getDocs(vipQuery);
      
      if (vipSnapshot.empty) {
        const vipReservation: VIPReservation = {
          id: vipReservationId,
          username: normalizedUsername,
          usernameLower: normalizedUsername,
          reservedFor: 'UX Monitor Account',
          reservedBy: adminCheck.uid || '',
          reservedByEmail: adminCheck.email || null,
          reservedAt: serverTimestamp(),
          expiresAt: null, // Never expires
          priority: 'critical',
          notes: 'Reserved for UX monitoring and testing. Do not release.',
          claimed: false,
          claimedAt: null,
          claimedBy: null,
        };
        
        await setDoc(doc(db, 'vip_reservations', vipReservationId), vipReservation);
        logger.info('VIP reservation created', { reservationId: vipReservationId });
      } else {
        logger.info('VIP reservation already exists', { existing: true });
      }
      
      // Step 3: Create Firebase Auth user
      let firebaseUser: import('firebase-admin').auth.UserRecord;
      
      try {
        firebaseUser = await admin.auth().createUser({
          email,
          password,
          displayName: displayName || normalizedUsername,
          emailVerified: true, // Auto-verify for monitor account
        });
        logger.info('Firebase Auth user created', { uid: firebaseUser.uid });
      } catch (error) {
        const authError = error as { code?: string };
        if (authError.code === 'auth/email-already-exists') {
          logger.info('Firebase Auth user already exists, fetching...');
          firebaseUser = await admin.auth().getUserByEmail(email);
          logger.info('Found existing Firebase Auth user', { uid: firebaseUser.uid });
        } else {
          throw error;
        }
      }
      
      const uid = firebaseUser.uid;
      
      // Step 4: Create Firestore user profile
      const userRef: DocumentReference = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      const userProfile: UserProfile = {
        uid,
        username: normalizedUsername,
        email: email,
        countryCode: countryCode,
        displayName: displayName || normalizedUsername,
        
        // Account type: half-dev, half-user
        accountType: 'monitor',
        isSpecialAccount: true,
        isMonitorAccount: true,
        
        // Balance system
        balance: initialBalance,
        lastBalanceUpdate: serverTimestamp(),
        
        // Fake payment method for testing
        defaultPaymentMethodId: 'pm_monitor_test_card',
        paymentMethodType: 'card',
        paymentMethodBrand: 'visa',
        paymentMethodLast4: '4242',
        paymentMethodExpMonth: 12,
        paymentMethodExpYear: 2025,
        isTestPaymentMethod: true,
        
        // Standard profile fields
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        isActive: true,
        profileComplete: true,
        
        // Initial stats
        tournamentsEntered: 0,
        tournamentsWon: 0,
        totalWinnings: 0,
        bestFinish: null,
        
        // Preferences
        preferences: {
          notifications: true,
          emailUpdates: true,
          publicProfile: false, // Keep private for monitor account
          borderColor: '#4285F4',
        },
        
        // Monitor account metadata
        monitorAccountMetadata: {
          createdFor: 'UX monitoring and testing',
          canAddMoney: true,
          testPaymentEnabled: true,
          createdAt: new Date().toISOString(),
          createdBy: adminCheck.uid || '',
        },
      };
      
      await setDoc(userRef, userProfile, { merge: true });
      logger.info('User profile created/updated', { uid });
      
      // Step 5: Claim VIP reservation
      if (!vipSnapshot.empty) {
        const existingReservation: QueryDocumentSnapshot = vipSnapshot.docs[0];
        await setDoc(existingReservation.ref, {
          claimed: true,
          claimedBy: uid,
          claimedAt: serverTimestamp(),
        }, { merge: true });
      } else {
        await setDoc(doc(db, 'vip_reservations', vipReservationId), {
          claimed: true,
          claimedBy: uid,
          claimedAt: serverTimestamp(),
        }, { merge: true });
      }
      logger.info('VIP reservation claimed', { uid });
      
      const response = createSuccessResponse({
        success: true,
        message: 'Monitor account created successfully',
        account: {
          uid,
          username: normalizedUsername,
          email,
          balance: initialBalance,
          accountType: 'monitor',
        },
      }, 201, logger);
      
      return res.status(response.statusCode).json(response.body.data as MonitorAccountResponse);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as { code?: string }).code;
      
      logger.error('Error creating monitor account', new Error(errorMessage), {
        component: 'admin',
        operation: 'create-monitor-account',
      });
      
      const errorResponse = createErrorResponse(
        ErrorType.INTERNAL,
        errorMessage || 'Failed to create monitor account',
        { errorCode }
      );
      
      return res.status(errorResponse.statusCode).json({
        success: false,
        error: 'CREATION_FAILED',
        message: errorResponse.body.error.message,
        details: errorCode ? { code: errorCode } : undefined,
      });
    }
  });
}
