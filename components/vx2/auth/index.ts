/**
 * VX2 Auth Module - Public API
 * 
 * Enterprise-grade authentication system for TopDog platform.
 * 
 * @example
 * ```tsx
 * import { AuthProvider, useAuth, UsernameInput } from '@/components/vx2/auth';
 * 
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <MyApp />
 *     </AuthProvider>
 *   );
 * }
 * 
 * function MyComponent() {
 *   const { user, signOut } = useAuth();
 *   // ...
 * }
 * ```
 */

// Context
export { AuthProvider, AuthContext, useAuthContext } from './context';

// Hooks
export { useAuth, useUsernameValidation } from './hooks';

// Components
export { 
  UsernameInput, 
  SignUpModal, 
  SignInModal, 
  ForgotPasswordModal,
  ProfileSettingsModal,
} from './components';
export type { 
  UsernameInputProps,
  SignUpModalProps,
  SignInModalProps,
  ForgotPasswordModalProps,
  ProfileSettingsModalProps,
} from './components';

// Types
export type {
  // User types
  AuthProvider as AuthProviderType,
  AuthStatus,
  ProfileCompleteness,
  AuthUser,
  UserProfile,
  UserPreferences,
  
  // State types
  AuthState,
  AuthAction,
  AuthError,
  
  // Operation types
  EmailSignUpData,
  EmailSignInData,
  PhoneAuthData,
  PhoneVerifyData,
  OAuthSignInData,
  ProfileUpdateData,
  UsernameChangeData,
  
  // Result types
  AuthResult,
  SignUpResult,
  SignInResult,
  PhoneVerifyResult,
  
  // Username types
  UsernameValidationResult,
  UsernameAvailabilityResult,
  UsernameRequirements,
  
  // VIP types
  VIPReservation,
  MergeRequest,
  
  // Context types
  AuthContextValue,
  UseAuthReturn,
  UseUsernameValidationReturn,
} from './types';

// Constants
export {
  USERNAME_CONSTRAINTS,
  PASSWORD_CONSTRAINTS,
  PHONE_CONSTRAINTS,
  RATE_LIMITS,
  SESSION_CONFIG,
  VIP_CONFIG,
  VALIDATION_PATTERNS,
  AUTH_ERROR_CODES,
  AUTH_ERROR_MESSAGES,
  getAuthErrorMessage,
  AUTH_UI,
  STORAGE_KEYS,
  RESERVED_USERNAMES,
} from './constants';

// Utils
export {
  RateLimiter,
  createLoginLimiter,
  createSignupLimiter,
  createPasswordResetLimiter,
  createPhoneVerifyLimiter,
  formatRetryTime,
  useRateLimit,
  RATE_LIMIT_CONFIGS,
  SessionManager,
  setRememberMe,
  getRememberMe,
  clearRememberMe,
  useSession,
} from './utils';

