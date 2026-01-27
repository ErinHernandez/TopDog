/**
 * PayPal OAuth Account Linking
 *
 * Handles OAuth flow for linking user's PayPal account for withdrawals.
 * Users MUST link via OAuth - no manual email entry allowed for security.
 */

import { serverLogger } from '../logger/serverLogger';
import { getDb } from '../firebase-utils';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { captureError } from '../errorTracking';
import { getPayPalConfig, paypalApiRequest } from './paypalClient';
import type {
  LinkedPayPalAccount,
  PayPalOAuthState,
  PayPalUserInfo,
} from './paypalTypes';
import crypto from 'crypto';

// ============================================================================
// OAUTH STATE MANAGEMENT
// ============================================================================

/**
 * Generate a secure random state for CSRF protection
 */
function generateSecureState(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Store OAuth state for verification
 */
async function storeOAuthState(
  userId: string,
  state: string,
  redirectUri: string
): Promise<void> {
  const db = getDb();
  const stateRef = doc(db, 'paypal_oauth_states', state);

  const oauthState: PayPalOAuthState = {
    userId,
    state,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    redirectUri,
  };

  await setDoc(stateRef, oauthState);
}

/**
 * Verify and consume OAuth state
 * Returns user ID if valid, null otherwise
 */
export async function verifyAndConsumeOAuthState(state: string): Promise<string | null> {
  const db = getDb();
  const stateRef = doc(db, 'paypal_oauth_states', state);
  const stateDoc = await getDoc(stateRef);

  if (!stateDoc.exists()) {
    serverLogger.warn('OAuth state not found', null, { state: state.substring(0, 8) + '...' });
    return null;
  }

  const stateData = stateDoc.data() as PayPalOAuthState;

  // Check expiration
  if (new Date(stateData.expiresAt) < new Date()) {
    serverLogger.warn('OAuth state expired', null, { userId: stateData.userId });
    await deleteDoc(stateRef);
    return null;
  }

  // Consume the state (delete it)
  await deleteDoc(stateRef);

  return stateData.userId;
}

// ============================================================================
// OAUTH URL GENERATION
// ============================================================================

/**
 * Generate PayPal OAuth authorization URL
 */
export async function getPayPalOAuthUrl(
  userId: string,
  redirectUri?: string
): Promise<string> {
  const config = getPayPalConfig();

  if (!config.clientId) {
    throw new Error('PayPal client ID not configured');
  }

  const finalRedirectUri =
    redirectUri || `${process.env.NEXT_PUBLIC_BASE_URL}/api/paypal/oauth/callback`;

  const state = generateSecureState();
  await storeOAuthState(userId, state, finalRedirectUri);

  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: finalRedirectUri,
    state,
  });

  const baseUrl =
    process.env.NODE_ENV === 'production'
      ? 'https://www.paypal.com/signin/authorize'
      : 'https://www.sandbox.paypal.com/signin/authorize';

  return `${baseUrl}?${params.toString()}`;
}

// ============================================================================
// TOKEN EXCHANGE
// ============================================================================

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<{ access_token: string; token_type: string; expires_in: number }> {
  const config = getPayPalConfig();

  if (!config.clientId || !config.clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  const response = await fetch(`${config.apiBase}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    serverLogger.error('PayPal token exchange failed', undefined, {
      status: response.status,
      errorText,
    });
    throw new Error('Failed to exchange authorization code');
  }

  return response.json();
}

/**
 * Get user info from PayPal using access token
 */
async function getPayPalUserInfo(accessToken: string): Promise<PayPalUserInfo> {
  const config = getPayPalConfig();

  const response = await fetch(`${config.apiBase}/v1/identity/openidconnect/userinfo?schema=openid`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    serverLogger.error('PayPal user info request failed', undefined, {
      status: response.status,
      errorText,
    });
    throw new Error('Failed to get PayPal user info');
  }

  return response.json();
}

// ============================================================================
// OAUTH CALLBACK HANDLING
// ============================================================================

/**
 * Handle PayPal OAuth callback and link account
 */
export async function handlePayPalOAuthCallback(
  code: string,
  state: string
): Promise<LinkedPayPalAccount> {
  // 1. Verify state and get userId
  const userId = await verifyAndConsumeOAuthState(state);
  if (!userId) {
    throw new Error('Invalid or expired OAuth state');
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/paypal/oauth/callback`;

  try {
    // 2. Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code, redirectUri);

    // 3. Get user info from PayPal
    const userInfo = await getPayPalUserInfo(tokenResponse.access_token);

    if (!userInfo.email || !userInfo.payer_id) {
      throw new Error('PayPal account missing required information');
    }

    // 4. Check if this PayPal account is already linked to another user
    const existingLink = await findLinkedAccountByPayPalId(userInfo.payer_id);
    if (existingLink && existingLink.userId !== userId) {
      throw new Error('This PayPal account is already linked to another TopDog account');
    }

    // 5. Store linked account
    const linkedAccount = await storeLinkedPayPalAccount({
      userId,
      paypalAccountId: userInfo.payer_id,
      paypalEmail: userInfo.email,
      verified: true, // OAuth-linked accounts are automatically verified
    });

    serverLogger.info('PayPal account linked via OAuth', {
      userId,
      paypalEmail: userInfo.email,
    });

    return linkedAccount;
  } catch (error) {
    await captureError(error as Error, {
      tags: { component: 'paypal', operation: 'oauthCallback' },
      extra: { userId },
    });
    throw error;
  }
}

// ============================================================================
// LINKED ACCOUNT MANAGEMENT
// ============================================================================

/**
 * Store a linked PayPal account
 */
async function storeLinkedPayPalAccount(input: {
  userId: string;
  paypalAccountId: string;
  paypalEmail: string;
  verified: boolean;
}): Promise<LinkedPayPalAccount> {
  const db = getDb();
  const linkedAccountsRef = collection(db, 'linked_paypal_accounts');

  // Check if user already has a linked account with this PayPal ID
  const existingQuery = query(
    linkedAccountsRef,
    where('userId', '==', input.userId),
    where('paypalAccountId', '==', input.paypalAccountId)
  );
  const existingDocs = await getDocs(existingQuery);

  if (!existingDocs.empty) {
    // Update existing link
    const existingDoc = existingDocs.docs[0];
    await updateDoc(existingDoc.ref, {
      paypalEmail: input.paypalEmail,
      verified: input.verified,
      lastUsedAt: serverTimestamp(),
    });

    return {
      id: existingDoc.id,
      ...input,
      linkedAt: existingDoc.data().linkedAt,
      isPrimary: existingDoc.data().isPrimary ?? true,
    } as LinkedPayPalAccount;
  }

  // Check if user has any existing linked accounts
  const userAccountsQuery = query(
    linkedAccountsRef,
    where('userId', '==', input.userId)
  );
  const userAccountsDocs = await getDocs(userAccountsQuery);
  const isPrimary = userAccountsDocs.empty; // First account is primary

  // Create new linked account
  const linkedAccount: Omit<LinkedPayPalAccount, 'id'> = {
    userId: input.userId,
    paypalAccountId: input.paypalAccountId,
    paypalEmail: input.paypalEmail,
    linkedAt: new Date().toISOString(),
    verified: input.verified,
    isPrimary,
  };

  const docRef = await addDoc(linkedAccountsRef, linkedAccount);

  return {
    id: docRef.id,
    ...linkedAccount,
  };
}

/**
 * Get all linked PayPal accounts for a user
 */
export async function getLinkedPayPalAccounts(
  userId: string
): Promise<LinkedPayPalAccount[]> {
  const db = getDb();
  const linkedAccountsRef = collection(db, 'linked_paypal_accounts');

  const accountsQuery = query(
    linkedAccountsRef,
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(accountsQuery);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as LinkedPayPalAccount[];
}

/**
 * Get a specific linked PayPal account
 */
export async function getLinkedPayPalAccount(
  userId: string,
  accountId: string
): Promise<LinkedPayPalAccount | null> {
  const db = getDb();
  const accountRef = doc(db, 'linked_paypal_accounts', accountId);
  const accountDoc = await getDoc(accountRef);

  if (!accountDoc.exists()) {
    return null;
  }

  const data = accountDoc.data();
  if (data.userId !== userId) {
    return null; // Account doesn't belong to this user
  }

  return {
    id: accountDoc.id,
    ...data,
  } as LinkedPayPalAccount;
}

/**
 * Get the primary linked PayPal account for a user
 */
export async function getPrimaryLinkedPayPalAccount(
  userId: string
): Promise<LinkedPayPalAccount | null> {
  const db = getDb();
  const linkedAccountsRef = collection(db, 'linked_paypal_accounts');

  const primaryQuery = query(
    linkedAccountsRef,
    where('userId', '==', userId),
    where('isPrimary', '==', true)
  );

  const snapshot = await getDocs(primaryQuery);

  if (snapshot.empty) {
    // No primary, get any linked account
    const accounts = await getLinkedPayPalAccounts(userId);
    return accounts[0] || null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as LinkedPayPalAccount;
}

/**
 * Find a linked account by PayPal account ID
 */
async function findLinkedAccountByPayPalId(
  paypalAccountId: string
): Promise<LinkedPayPalAccount | null> {
  const db = getDb();
  const linkedAccountsRef = collection(db, 'linked_paypal_accounts');

  const accountQuery = query(
    linkedAccountsRef,
    where('paypalAccountId', '==', paypalAccountId)
  );

  const snapshot = await getDocs(accountQuery);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as LinkedPayPalAccount;
}

/**
 * Set a linked account as primary
 */
export async function setPrimaryLinkedAccount(
  userId: string,
  accountId: string
): Promise<void> {
  const db = getDb();
  const linkedAccountsRef = collection(db, 'linked_paypal_accounts');

  // Verify account belongs to user
  const accountRef = doc(db, 'linked_paypal_accounts', accountId);
  const accountDoc = await getDoc(accountRef);

  if (!accountDoc.exists() || accountDoc.data().userId !== userId) {
    throw new Error('Account not found');
  }

  // Get all user's accounts and update
  const userAccountsQuery = query(
    linkedAccountsRef,
    where('userId', '==', userId)
  );
  const userAccountsDocs = await getDocs(userAccountsQuery);

  // Set all to non-primary
  for (const docSnapshot of userAccountsDocs.docs) {
    await updateDoc(docSnapshot.ref, { isPrimary: false });
  }

  // Set target as primary
  await updateDoc(accountRef, { isPrimary: true });
}

/**
 * Unlink a PayPal account
 */
export async function unlinkPayPalAccount(
  userId: string,
  accountId: string
): Promise<void> {
  const db = getDb();
  const accountRef = doc(db, 'linked_paypal_accounts', accountId);
  const accountDoc = await getDoc(accountRef);

  if (!accountDoc.exists()) {
    throw new Error('Account not found');
  }

  if (accountDoc.data().userId !== userId) {
    throw new Error('Account does not belong to this user');
  }

  await deleteDoc(accountRef);

  serverLogger.info('PayPal account unlinked', {
    userId,
    accountId,
  });
}
