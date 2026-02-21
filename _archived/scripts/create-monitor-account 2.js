/**
 * Create Monitor Account Script
 * 
 * Creates a special account for UX monitoring with:
 * - Reserved username: "OcularPatdowns"
 * - Operating login (Firebase Auth)
 * - Fake payment method for testing
 * - Balance system for adding money
 * - Special account type (half-dev, half-user)
 * 
 * Usage:
 *   node scripts/create-monitor-account.js
 * 
 * Requirements:
 *   - FIREBASE_SERVICE_ACCOUNT environment variable set
 *   - Firebase Admin SDK initialized
 */

// Try to load dotenv if available (optional)
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv not available, assume env vars are already set
}

const admin = require('firebase-admin');
const { getFirestore, collection, doc, setDoc, getDoc, query, where, getDocs, serverTimestamp } = require('firebase/firestore');
const { initializeApp, getApps } = require('firebase/app');

// ============================================================================
// CONFIGURATION
// ============================================================================

const MONITOR_ACCOUNT_CONFIG = {
  username: 'ocularpatdowns', // Will be normalized to lowercase
  email: 'ffnsfwff@gmail.com', // Change as needed
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
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    process.exit(1);
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

console.log('✅ Firebase Client initialized');

// ============================================================================
// MAIN SCRIPT
// ============================================================================

async function createMonitorAccount() {
  const { username, email, password, displayName, countryCode, initialBalance } = MONITOR_ACCOUNT_CONFIG;
  const normalizedUsername = username.toLowerCase().trim();
  
  try {
    console.log('\n📋 Creating Monitor Account...');
    console.log(`   Username: ${normalizedUsername}`);
    console.log(`   Email: ${email}`);
    console.log(`   Initial Balance: $${initialBalance}`);
    
    // Step 1: Check if username is already taken
    console.log('\n🔍 Step 1: Checking username availability...');
    const usersQuery = query(
      collection(db, 'users'),
      where('username', '==', normalizedUsername)
    );
    const usersSnapshot = await getDocs(usersQuery);
    
    if (!usersSnapshot.empty) {
      console.log('⚠️  Username is already taken by an existing user');
      const existingUser = usersSnapshot.docs[0].data();
      console.log(`   Existing UID: ${existingUser.uid}`);
      console.log('   If you want to update this account, you may need to delete it first or use a different username.');
      return;
    }
    
    // Step 2: Create VIP reservation for the username
    console.log('\n🔒 Step 2: Creating VIP reservation...');
    const vipReservationId = `vip_${normalizedUsername}_${Date.now()}`;
    const vipReservation = {
      id: vipReservationId,
      username: normalizedUsername,
      usernameLower: normalizedUsername,
      reservedFor: 'UX Monitor Account',
      reservedBy: 'system',
      reservedByEmail: 'system@topdog.com',
      reservedAt: serverTimestamp(),
      expiresAt: null, // Never expires
      priority: 'critical',
      notes: 'Reserved for UX monitoring and testing. Do not release.',
      claimed: false,
      claimedAt: null,
      claimedBy: null,
    };
    
    // Check if reservation already exists
    const vipQuery = query(
      collection(db, 'vip_reservations'),
      where('usernameLower', '==', normalizedUsername),
      where('claimed', '==', false)
    );
    const vipSnapshot = await getDocs(vipQuery);
    
    if (!vipSnapshot.empty) {
      console.log('⚠️  VIP reservation already exists (not claimed)');
    } else {
      await setDoc(doc(db, 'vip_reservations', vipReservationId), vipReservation);
      console.log('✅ VIP reservation created');
    }
    
    // Step 3: Create Firebase Auth user
    console.log('\n👤 Step 3: Creating Firebase Auth user...');
    let firebaseUser;
    
    try {
      firebaseUser = await admin.auth().createUser({
        email,
        password,
        displayName,
        emailVerified: true, // Auto-verify for monitor account
      });
      console.log(`✅ Firebase Auth user created (UID: ${firebaseUser.uid})`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('⚠️  Firebase Auth user already exists, fetching...');
        firebaseUser = await admin.auth().getUserByEmail(email);
        console.log(`✅ Found existing Firebase Auth user (UID: ${firebaseUser.uid})`);
      } else {
        throw error;
      }
    }
    
    const uid = firebaseUser.uid;
    
    // Step 4: Create Firestore user profile
    console.log('\n📝 Step 4: Creating Firestore user profile...');
    
    // Check if profile already exists
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      console.log('⚠️  User profile already exists, updating...');
      const existingData = userDoc.data();
      console.log(`   Current username: ${existingData.username || 'none'}`);
      
      if (existingData.username !== normalizedUsername) {
        console.log(`   ⚠️  Warning: Existing account has different username.`);
        console.log(`   You may want to delete this account first or use a different email.`);
      }
    }
    
    // Create/update user profile
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
      },
    };
    
    await setDoc(userRef, userProfile, { merge: true });
    console.log('✅ User profile created/updated');
    
    // Step 5: Claim VIP reservation
    console.log('\n✅ Step 5: Claiming VIP reservation...');
    const vipReservationRef = doc(db, 'vip_reservations', vipReservationId);
    await setDoc(vipReservationRef, {
      claimed: true,
      claimedBy: uid,
      claimedAt: serverTimestamp(),
    }, { merge: true });
    console.log('✅ VIP reservation claimed');
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Monitor Account Created Successfully!');
    console.log('='.repeat(60));
    console.log(`\n📋 Account Details:`);
    console.log(`   Username: ${normalizedUsername}`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   UID: ${uid}`);
    console.log(`   Balance: $${initialBalance}`);
    console.log(`   Payment Method: Test Card (4242)`);
    console.log(`\n🔐 Login Credentials:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`\n💡 Notes:`);
    console.log(`   - Username is reserved and out of circulation`);
    console.log(`   - Account type: monitor (half-dev, half-user)`);
    console.log(`   - Fake payment method saved for testing`);
    console.log(`   - Balance can be updated directly in Firestore`);
    console.log(`   - Use this account for UX monitoring and testing`);
    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ Error creating monitor account:', error);
    console.error('   Error details:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    process.exit(1);
  }
}

// Run the script
createMonitorAccount()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
