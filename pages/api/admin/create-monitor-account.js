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

const admin = require('firebase-admin');
const { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc,
  getDoc,
  serverTimestamp 
} = require('firebase/firestore');
const { initializeApp, getApps } = require('firebase/app');
const { verifyAdminAccess } = require('../../../lib/adminAuth');
const { logger } = require('../../../lib/structuredLogger');
const { 
  withErrorHandling, 
  validateMethod, 
  createErrorResponse,
  createSuccessResponse,
  ErrorType 
} = require('../../../lib/apiErrorHandler');

// ============================================================================
// CONFIGURATION
// ============================================================================

const MONITOR_ACCOUNT_CONFIG = {
  username: 'ocularpatdowns', // Will be normalized to lowercase
  email: 'ffnsfwff@gmail.com',
  password: 'xx',
  displayName: 'OcularPatdowns',
  countryCode: 'US',
  initialBalance: 1000.00, // Starting balance in dollars
};

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
    logger.error('Firebase Admin initialization failed', error, {
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

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(req, res) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['POST'], logger);
    
    // Verify admin authentication
    const adminCheck = await verifyAdminAccess(req.headers.authorization);
    
    if (!adminCheck.isAdmin) {
      const errorResponse = createErrorResponse(
        ErrorType.FORBIDDEN,
        'Admin access required',
        {},
        res.getHeader('X-Request-ID')
      );
      return res.status(errorResponse.statusCode).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: errorResponse.body.message,
      });
    }
    
    const { username, email, password, displayName, countryCode, initialBalance } = MONITOR_ACCOUNT_CONFIG;
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
        const existingUser = usersSnapshot.docs[0].data();
        const errorResponse = createErrorResponse(
          ErrorType.VALIDATION,
          'Username is already taken by an existing user',
          { existingUid: existingUser.uid },
          res.getHeader('X-Request-ID')
        );
        return res.status(errorResponse.statusCode).json({
          success: false,
          error: 'USERNAME_TAKEN',
          message: errorResponse.body.message,
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
        const vipReservation = {
          id: vipReservationId,
          username: normalizedUsername,
          usernameLower: normalizedUsername,
          reservedFor: 'UX Monitor Account',
          reservedBy: adminCheck.uid,
          reservedByEmail: adminCheck.email,
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
      let firebaseUser;
      
      try {
        firebaseUser = await admin.auth().createUser({
          email,
          password,
          displayName: displayName || normalizedUsername,
          emailVerified: true, // Auto-verify for monitor account
        });
        logger.info('Firebase Auth user created', { uid: firebaseUser.uid });
      } catch (error) {
        if (error.code === 'auth/email-already-exists') {
          logger.info('Firebase Auth user already exists, fetching...');
          firebaseUser = await admin.auth().getUserByEmail(email);
          logger.info('Found existing Firebase Auth user', { uid: firebaseUser.uid });
        } else {
          throw error;
        }
      }
      
      const uid = firebaseUser.uid;
      
      // Step 4: Create Firestore user profile
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      const userProfile = {
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
          createdBy: adminCheck.uid,
        },
      };
      
      await setDoc(userRef, userProfile, { merge: true });
      logger.info('User profile created/updated', { uid });
      
      // Step 5: Claim VIP reservation
      if (!vipSnapshot.empty) {
        const existingReservation = vipSnapshot.docs[0];
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
      
      return res.status(response.statusCode).json(response.body);
      
    } catch (error) {
      logger.error('Error creating monitor account', error, {
        component: 'admin',
        operation: 'create-monitor-account',
      });
      
      const errorResponse = createErrorResponse(
        ErrorType.INTERNAL_ERROR,
        error.message || 'Failed to create monitor account',
        { errorCode: error.code },
        res.getHeader('X-Request-ID')
      );
      
      return res.status(errorResponse.statusCode).json({
        success: false,
        error: 'CREATION_FAILED',
        message: errorResponse.body.message,
        details: error.code ? { code: error.code } : undefined,
      });
    }
  });
}
