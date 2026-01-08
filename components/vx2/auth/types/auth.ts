/**
 * VX2 Auth Types
 * 
 * Type definitions for the authentication system.
 * Follows VX2 enterprise patterns with full type safety.
 */

// ============================================================================
// USER TYPES
// ============================================================================

/**
 * Authentication provider types
 * Includes both our internal provider types and Firebase provider ID strings
 * Note: No third-party OAuth (Google/Apple) per industry standard for DFS platforms
 */
export type AuthProvider = 'email' | 'phone' | 'anonymous' | 'password';

/**
 * User authentication status
 */
export type AuthStatus = 
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'error';

/**
 * User profile completeness level
 */
export type ProfileCompleteness = 
  | 'minimal'     // Just anonymous
  | 'basic'       // Has username
  | 'verified'    // Email/phone verified
  | 'complete';   // All profile fields

/**
 * Core user data from Firebase Auth
 */
export interface AuthUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  providerId: AuthProvider;
  createdAt: Date;
  lastLoginAt: Date;
}

/**
 * Extended user profile from Firestore
 */
export interface UserProfile {
  uid: string;
  username: string;
  email: string | null;
  firstName?: string;
  lastName?: string;
  displayName: string;
  countryCode?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  profileComplete: boolean;
  
  // Stats
  tournamentsEntered: number;
  tournamentsWon: number;
  totalWinnings: number;
  bestFinish: number | null;
  lastLogin: Date;
  
  // Settings
  preferences: UserPreferences;
  
  // VIP status
  isVIP?: boolean;
  vipTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  reservedUsername?: string;
}

/**
 * User preferences
 */
export interface UserPreferences {
  notifications: boolean;
  emailUpdates: boolean;
  publicProfile: boolean;
  borderColor: string;
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  /** Enable Dynamic Island / Live Activity for draft timer */
  dynamicIslandEnabled?: boolean;
}

// ============================================================================
// AUTH STATE TYPES
// ============================================================================

/**
 * Complete auth state
 */
export interface AuthState {
  /** Current auth status */
  status: AuthStatus;
  /** Firebase auth user */
  user: AuthUser | null;
  /** Extended profile from Firestore */
  profile: UserProfile | null;
  /** Loading states */
  isLoading: boolean;
  isInitializing: boolean;
  /** Error state */
  error: AuthError | null;
  /** Profile completeness */
  profileCompleteness: ProfileCompleteness;
}

/**
 * Auth error type
 */
export interface AuthError {
  code: string;
  message: string;
  field?: string;
  originalError?: unknown;
}

// ============================================================================
// AUTH ACTION TYPES
// ============================================================================

export type AuthAction =
  | { type: 'AUTH_STATE_CHANGED'; payload: { user: AuthUser | null } }
  | { type: 'PROFILE_LOADED'; payload: { profile: UserProfile } }
  | { type: 'PROFILE_UPDATED'; payload: { profile: Partial<UserProfile> } }
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_ERROR'; payload: { error: AuthError } }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SIGN_OUT' }
  | { type: 'INITIALIZATION_COMPLETE' };

// ============================================================================
// AUTH OPERATION TYPES
// ============================================================================

/**
 * Email/password sign up data
 */
export interface EmailSignUpData {
  email: string;
  password: string;
  username: string;
  displayName?: string;
  secondaryMethod?: {
    type: 'phone' | 'email';
    value: string;
  };
}

/**
 * Email/password sign in data
 */
export interface EmailSignInData {
  email: string;
  password: string;
}

/**
 * Phone auth data
 */
export interface PhoneAuthData {
  phoneNumber: string;
  countryCode: string;
}

/**
 * Phone verification data
 */
export interface PhoneVerifyData {
  verificationId: string;
  code: string;
  username?: string;
}

/**
 * Profile update data
 */
export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  countryCode?: string;
  preferences?: Partial<UserPreferences>;
}

/**
 * Username change data
 */
export interface UsernameChangeData {
  newUsername: string;
  reason?: string;
}

// ============================================================================
// AUTH RESULT TYPES
// ============================================================================

/**
 * Generic auth operation result
 */
export interface AuthResult<T = void> {
  success: boolean;
  data?: T;
  error?: AuthError;
}

/**
 * Sign up result with user data
 */
export interface SignUpResult extends AuthResult<AuthUser> {
  needsEmailVerification?: boolean;
  needsProfileCompletion?: boolean;
}

/**
 * Sign in result
 */
export interface SignInResult extends AuthResult<AuthUser> {
  isNewUser?: boolean;
  linkedAccounts?: AuthProvider[];
}

/**
 * Phone verification result
 */
export interface PhoneVerifyResult extends AuthResult<AuthUser> {
  verificationId?: string;
}

// ============================================================================
// USERNAME VALIDATION TYPES
// ============================================================================

/**
 * Username validation result
 */
export interface UsernameValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
}

/**
 * Username availability result
 */
export interface UsernameAvailabilityResult {
  isAvailable: boolean;
  message: string;
  isVIPReserved?: boolean;
  reservedFor?: string;
  similarUsernames?: string[];
  suggestions?: string[]; // Suggested alternative usernames when unavailable
  warnings?: string[]; // Warnings about similar usernames or other issues
}

/**
 * Username requirements for a country
 */
export interface UsernameRequirements {
  minLength: number;
  maxLength: number;
  allowedCharacters: string;
  allowedCharactersDescription: string;
  examples: string[];
}

// ============================================================================
// VIP TYPES
// ============================================================================

/**
 * VIP reservation data
 */
export interface VIPReservation {
  username: string;
  reservedFor: string;
  reservedBy: string;
  reservedAt: Date;
  expiresAt: Date | null;
  claimed: boolean;
  claimedAt?: Date;
  claimedBy?: string;
  notes?: string;
  priority: 'normal' | 'high' | 'critical';
}

/**
 * Account merge request
 */
export interface MergeRequest {
  id: string;
  existingUserId: string;
  existingUsername: string;
  reservedUsername: string;
  reservationId: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: Date;
  createdBy: string;
  approvedAt?: Date;
  approvedBy?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  completedAt?: Date;
  userAccepted?: boolean;
  userAcceptedAt?: Date;
  notes?: string;
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

/**
 * Auth context value provided to consumers
 */
export interface AuthContextValue {
  // State
  state: AuthState;
  user: AuthUser | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
  
  // Auth actions
  signUpWithEmail: (data: EmailSignUpData) => Promise<SignUpResult>;
  signInWithEmail: (data: EmailSignInData) => Promise<SignInResult>;
  signInWithPhone: (data: PhoneAuthData) => Promise<PhoneVerifyResult>;
  verifyPhoneCode: (data: PhoneVerifyData) => Promise<SignInResult>;
  signInAnonymously: () => Promise<SignInResult>;
  signOut: () => Promise<AuthResult>;
  
  // Profile actions
  updateProfile: (data: ProfileUpdateData) => Promise<AuthResult>;
  changeUsername: (data: UsernameChangeData) => Promise<AuthResult>;
  deleteAccount: () => Promise<AuthResult>;
  
  // Email actions
  sendVerificationEmail: () => Promise<AuthResult>;
  sendPasswordResetEmail: (email: string) => Promise<AuthResult>;
  
  // Account linking
  linkEmailPassword: (email: string, password: string) => Promise<AuthResult>;
  linkPhoneNumber: (phoneNumber: string) => Promise<PhoneVerifyResult>;
  
  // Utilities
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

/**
 * useAuth hook return type
 */
export type UseAuthReturn = AuthContextValue;

/**
 * useUsernameValidation hook return type
 */
export interface UseUsernameValidationReturn {
  // State
  username: string;
  countryCode: string;
  validation: UsernameValidationResult | null;
  availability: UsernameAvailabilityResult | null;
  requirements: UsernameRequirements;
  isValidating: boolean;
  isCheckingAvailability: boolean;
  
  // Actions
  setUsername: (value: string) => void;
  setCountryCode: (code: string) => void;
  validateNow: () => Promise<UsernameValidationResult>;
  checkAvailabilityNow: () => Promise<UsernameAvailabilityResult>;
  reset: () => void;
  
  // Computed
  isValid: boolean;
  isAvailable: boolean;
  canSubmit: boolean;
  errorMessage: string | null;
}

