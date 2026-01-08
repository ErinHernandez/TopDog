/**
 * VX2 Auth Components - Public Exports
 */

export { UsernameInput } from './UsernameInput';
export type { UsernameInputProps } from './UsernameInput';

export { SignUpModal } from './SignUpModal';
export type { SignUpModalProps } from './SignUpModal';

export { SignInModal } from './SignInModal';
export type { SignInModalProps } from './SignInModal';

export { ForgotPasswordModal } from './ForgotPasswordModal';
export type { ForgotPasswordModalProps } from './ForgotPasswordModal';

// PhoneAuthModal removed - phone sign-in integrated into SignInModal

export { ProfileSettingsModal } from './ProfileSettingsModal';
export type { ProfileSettingsModalProps } from './ProfileSettingsModal';

export { EnableBiometricsPrompt } from './EnableBiometricsPrompt';
export type { EnableBiometricsPromptProps } from './EnableBiometricsPrompt';

// Full-screen auth components (mandatory authentication gate)
export { AuthGateVX2 } from './AuthGateVX2';
export type { AuthGateVX2Props } from './AuthGateVX2';

export { LoginScreenVX2 } from './LoginScreenVX2';
export type { LoginScreenVX2Props } from './LoginScreenVX2';

export { SignUpScreenVX2 } from './SignUpScreenVX2';
export type { SignUpScreenVX2Props } from './SignUpScreenVX2';
