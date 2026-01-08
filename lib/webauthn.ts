/**
 * WebAuthn Utilities for Biometric Authentication
 * 
 * Supports Face ID, Touch ID, and other platform authenticators
 * Uses the Web Authentication API (WebAuthn)
 */

// Check if WebAuthn is supported
export function isWebAuthnSupported(): boolean {
  return !!(
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === 'function'
  );
}

// Check if platform authenticator (Face ID/Touch ID) is available
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

// Generate a random challenge
function generateChallenge(): Uint8Array {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  return challenge;
}

// Convert ArrayBuffer to base64url string
function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Convert base64url string to ArrayBuffer
function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  const binary = atob(paddedBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Stored credential interface
export interface StoredCredential {
  id: string;
  rawId: string;
  type: string;
  createdAt: number;
  deviceName?: string;
}

// Local storage key for credentials
const CREDENTIALS_STORAGE_KEY = 'topdog_webauthn_credentials';
const USER_ID_STORAGE_KEY = 'topdog_webauthn_user_id';

// Get stored credentials for a user
export function getStoredCredentials(userId: string): StoredCredential[] {
  try {
    const stored = localStorage.getItem(`${CREDENTIALS_STORAGE_KEY}_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save credential for a user
function saveCredential(userId: string, credential: StoredCredential): void {
  const credentials = getStoredCredentials(userId);
  // Check if credential already exists
  const existingIndex = credentials.findIndex(c => c.id === credential.id);
  if (existingIndex >= 0) {
    credentials[existingIndex] = credential;
  } else {
    credentials.push(credential);
  }
  localStorage.setItem(`${CREDENTIALS_STORAGE_KEY}_${userId}`, JSON.stringify(credentials));
}

// Remove credential for a user
export function removeCredential(userId: string, credentialId: string): void {
  const credentials = getStoredCredentials(userId);
  const filtered = credentials.filter(c => c.id !== credentialId);
  localStorage.setItem(`${CREDENTIALS_STORAGE_KEY}_${userId}`, JSON.stringify(filtered));
}

// Check if biometrics are enabled for a user
export function isBiometricsEnabled(userId: string): boolean {
  return getStoredCredentials(userId).length > 0;
}

// Get the last user ID that used biometrics
export function getLastBiometricUserId(): string | null {
  try {
    return localStorage.getItem(USER_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

// Set the last user ID that used biometrics
function setLastBiometricUserId(userId: string): void {
  localStorage.setItem(USER_ID_STORAGE_KEY, userId);
}

// Register result interface
export interface RegisterBiometricResult {
  success: boolean;
  credential?: StoredCredential;
  error?: string;
}

// Authenticate result interface
export interface AuthenticateBiometricResult {
  success: boolean;
  userId?: string;
  credentialId?: string;
  error?: string;
}

/**
 * Register a new biometric credential for a user
 * This should be called after the user is authenticated
 */
export async function registerBiometric(
  userId: string,
  userEmail: string,
  userName: string
): Promise<RegisterBiometricResult> {
  if (!isWebAuthnSupported()) {
    return { success: false, error: 'WebAuthn is not supported on this device' };
  }

  const available = await isPlatformAuthenticatorAvailable();
  if (!available) {
    return { success: false, error: 'Face ID/Touch ID is not available on this device' };
  }

  try {
    // Create credential options
    const challenge = generateChallenge();
    
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge: challenge.buffer as ArrayBuffer,
      rp: {
        name: 'TopDog',
        id: window.location.hostname,
      },
      user: {
        id: new TextEncoder().encode(userId),
        name: userEmail,
        displayName: userName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },   // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Use built-in authenticator (Face ID/Touch ID)
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    };

    // Create the credential
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    }) as PublicKeyCredential;

    if (!credential) {
      return { success: false, error: 'Failed to create credential' };
    }

    // Store the credential
    const storedCredential: StoredCredential = {
      id: credential.id,
      rawId: bufferToBase64url(credential.rawId),
      type: credential.type,
      createdAt: Date.now(),
      deviceName: getDeviceName(),
    };

    saveCredential(userId, storedCredential);
    setLastBiometricUserId(userId);

    return { success: true, credential: storedCredential };
  } catch (error) {
    console.error('Biometric registration error:', error);
    
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        return { success: false, error: 'Biometric authentication was cancelled' };
      }
      if (error.name === 'InvalidStateError') {
        return { success: false, error: 'Biometrics already registered for this account' };
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to register biometrics' 
    };
  }
}

/**
 * Authenticate using biometrics
 * Returns the user ID if successful
 */
export async function authenticateWithBiometric(
  userId?: string
): Promise<AuthenticateBiometricResult> {
  if (!isWebAuthnSupported()) {
    return { success: false, error: 'WebAuthn is not supported on this device' };
  }

  // If no userId provided, try to get the last one
  const targetUserId = userId || getLastBiometricUserId();
  
  if (!targetUserId) {
    return { success: false, error: 'No biometric credentials found' };
  }

  const credentials = getStoredCredentials(targetUserId);
  if (credentials.length === 0) {
    return { success: false, error: 'No biometric credentials registered for this account' };
  }

  try {
    const challenge = generateChallenge();
    
    // Convert stored credentials to allowed credentials
    const allowCredentials: PublicKeyCredentialDescriptor[] = credentials.map(cred => ({
      id: base64urlToBuffer(cred.rawId),
      type: 'public-key' as const,
      transports: ['internal'] as AuthenticatorTransport[],
    }));

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge: challenge.buffer as ArrayBuffer,
      rpId: window.location.hostname,
      allowCredentials,
      userVerification: 'required',
      timeout: 60000,
    };

    // Request authentication
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    }) as PublicKeyCredential;

    if (!assertion) {
      return { success: false, error: 'Authentication failed' };
    }

    // Update last used
    setLastBiometricUserId(targetUserId);

    return {
      success: true,
      userId: targetUserId,
      credentialId: assertion.id,
    };
  } catch (error) {
    console.error('Biometric authentication error:', error);
    
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        return { success: false, error: 'Biometric authentication was cancelled' };
      }
      if (error.name === 'SecurityError') {
        return { success: false, error: 'Security error during authentication' };
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Authentication failed' 
    };
  }
}

/**
 * Get device name for display
 */
function getDeviceName(): string {
  const ua = navigator.userAgent;
  
  if (/iPhone/.test(ua)) {
    return 'iPhone';
  }
  if (/iPad/.test(ua)) {
    return 'iPad';
  }
  if (/Mac/.test(ua)) {
    return 'Mac';
  }
  if (/Android/.test(ua)) {
    return 'Android';
  }
  if (/Windows/.test(ua)) {
    return 'Windows PC';
  }
  
  return 'Unknown Device';
}

/**
 * Get friendly name for biometric type
 */
export function getBiometricTypeName(): string {
  const ua = navigator.userAgent;
  
  if (/iPhone|iPad/.test(ua)) {
    // Newer iPhones use Face ID, older use Touch ID
    // We can't definitively detect which, so use generic term
    return 'Face ID / Touch ID';
  }
  if (/Mac/.test(ua)) {
    return 'Touch ID';
  }
  if (/Android/.test(ua)) {
    return 'Fingerprint';
  }
  if (/Windows/.test(ua)) {
    return 'Windows Hello';
  }
  
  return 'Biometrics';
}

