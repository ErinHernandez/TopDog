/**
 * Create First Dev User
 *
 * Creates a normal user account for local/dev use. This user:
 * - Uses real Firebase Auth + Firestore (same as any signup).
 * - Is NOT recognized as a dev account anywhere: no special bypass, no synthetic
 *   balance, no dev-user-t style handling. TopDog treats this as a regular user.
 * - Acts as "the first user" for dev (e.g. seed user when using emulators or dev project).
 *
 * Usage:
 *   node scripts/create-first-dev-user.js
 *
 * Requirements:
 *   - .env.local or env with FIREBASE_SERVICE_ACCOUNT and NEXT_PUBLIC_FIREBASE_*
 *   - Run against your dev Firebase project or Auth/Firestore emulators
 */

try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv not available
}

const admin = require('firebase-admin');
const {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} = require('firebase/firestore');
const { initializeApp, getApps } = require('firebase/app');

// ============================================================================
// CONFIGURATION — first dev user (normal user, not a “dev account” in app)
// ============================================================================

const FIRST_DEV_USER_CONFIG = {
  email: 'teddygurskis@gmail.com',
  password: 'pP_20047913',
  username: 'OcularPatDowns', // stored normalized as ocularpatdowns
  countryCode: 'US',
};

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================

if (admin.apps.length === 0) {
  try {
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountEnv) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set');
    }
    const serviceAccount = JSON.parse(serviceAccountEnv);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    process.exit(1);
  }
}

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
// MAIN
// ============================================================================

async function createFirstDevUser() {
  const { email, password, username, countryCode } = FIRST_DEV_USER_CONFIG;
  const normalizedUsername = username.trim().toLowerCase();

  try {
    console.log('\n📋 Creating first dev user (normal user, not a dev account in app)...');
    console.log(`   Email: ${email}`);
    console.log(`   Username: ${normalizedUsername} (display: ${username})`);

    // 1. Check username availability (usernames collection + users)
    const usernameRef = doc(db, 'usernames', normalizedUsername);
    const usernameDoc = await getDoc(usernameRef);
    if (usernameDoc.exists()) {
      const data = usernameDoc.data();
      console.log(`⚠️  Username "${normalizedUsername}" already taken (uid: ${data?.uid}). Aborting.`);
      process.exit(1);
    }
    const usersSnap = await getDocs(
      query(collection(db, 'users'), where('username', '==', normalizedUsername))
    );
    if (!usersSnap.empty) {
      console.log(`⚠️  Username "${normalizedUsername}" already in users collection. Aborting.`);
      process.exit(1);
    }

    // 2. Create Firebase Auth user
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        email,
        password,
        displayName: username,
        emailVerified: true,
      });
      console.log(`✅ Firebase Auth user created (UID: ${firebaseUser.uid})`);
    } catch (err) {
      if (err.code === 'auth/email-already-exists') {
        firebaseUser = await admin.auth().getUserByEmail(email);
        console.log(`⚠️  Firebase Auth user already exists (UID: ${firebaseUser.uid}), will upsert profile.`);
      } else {
        throw err;
      }
    }

    const uid = firebaseUser.uid;

    // 3. User profile — standard shape, no dev/monitor/special flags
    const userRef = doc(db, 'users', uid);
    const userProfile = {
      uid,
      username: normalizedUsername,
      email,
      countryCode,
      displayName: username,
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
    await setDoc(userRef, userProfile, { merge: true });
    console.log('✅ User profile written to users/' + uid);

    // 4. Usernames collection for lookups
    await setDoc(usernameRef, {
      uid,
      username: normalizedUsername,
      createdAt: serverTimestamp(),
      previousOwner: null,
      recycledAt: null,
    });
    console.log('✅ Username record written to usernames/' + normalizedUsername);

    console.log('\n' + '='.repeat(60));
    console.log('✅ First dev user ready (normal user – not a dev account in TopDog)');
    console.log('='.repeat(60));
    console.log('\n🔐 Login with:');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Username: ${normalizedUsername}`);
    console.log('\n💡 This account is not treated as a dev account during login.');
    console.log('   Use it like any other user; no special bypass or synthetic balance.\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message || error);
    if (error.code) console.error('   Code:', error.code);
    process.exit(1);
  }
}

createFirstDevUser()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
