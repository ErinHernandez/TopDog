/**
 * Login Sandbox – Reusable login-system test area
 *
 * Wraps VX2 auth (modals + full-screen login/signup) in a phone frame with dev controls.
 * Use from pages/testing-grounds/login-sandbox or any page that needs an isolated auth playground.
 *
 * Modes:
 * - modals: SignIn, SignUp, Forgot Password, Profile modals (triggered by buttons)
 * - screens: Full-screen LoginScreenVX2 / SignUpScreenVX2 (gate-style flow)
 */

import React, { useState, useCallback } from 'react';
import type { JSX } from 'react';
import {
  AuthProvider,
  SignUpModal,
  SignInModal,
  ForgotPasswordModal,
  ProfileSettingsModal,
  LoginScreenVX2,
  SignUpScreenVX2,
  useAuth,
} from '../../components/vx2/auth';
import { BG_COLORS, TEXT_COLORS, STATE_COLORS } from '../../components/vx2/core/constants/colors';
import MobilePhoneFrame from '../../components/vx2/shell/MobilePhoneFrame';

export type LoginSandboxMode = 'modals' | 'screens';

export type ModalType = 'signup' | 'signin' | 'forgot' | 'profile' | null;

export interface LoginSandboxProps {
  /** 'modals' = modal picker; 'screens' = full-screen login/signup flow */
  defaultMode?: LoginSandboxMode;
  /** Label below the phone */
  label?: string;
}

// ============================================================================
// AUTH STATUS (dev panel)
// ============================================================================

function AuthStatus(): JSX.Element {
  const { user, profile, isAuthenticated, isLoading, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
        <p className="text-sm" style={{ color: TEXT_COLORS.muted }}>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
        <p className="text-sm" style={{ color: TEXT_COLORS.secondary }}>Not signed in</p>
      </div>
    );
  }

  return (
    <div
      className="p-3 rounded-xl space-y-2"
      style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
          style={{ backgroundColor: STATE_COLORS.success, color: '#000' }}
        >
          {profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate" style={{ color: TEXT_COLORS.primary }}>
            @{profile?.username || 'No username'}
          </p>
          <p className="text-xs truncate" style={{ color: TEXT_COLORS.secondary }}>
            {user.email || 'No email'}
          </p>
        </div>
      </div>
      <div className="pt-2 border-t border-white/10 space-y-0.5 text-xs">
        <p className="truncate" style={{ color: TEXT_COLORS.muted }}>
          UID: <span style={{ color: TEXT_COLORS.secondary }}>{user.uid}</span>
        </p>
        <p style={{ color: TEXT_COLORS.muted }}>
          Email verified:{' '}
          <span style={{ color: user.emailVerified ? STATE_COLORS.success : STATE_COLORS.warning }}>
            {user.emailVerified ? 'Yes' : 'No'}
          </span>
        </p>
      </div>
      <button
        onClick={() => signOut()}
        className="w-full py-2 rounded-lg font-medium text-sm"
        style={{
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          color: STATE_COLORS.error,
        }}
      >
        Sign Out
      </button>
    </div>
  );
}

// ============================================================================
// PHONE CONTENT: MODALS MODE
// ============================================================================

function ModalsModeContent({
  activeModal,
  onOpenModal,
  onCloseModal,
}: {
  activeModal: ModalType;
  onOpenModal: (m: ModalType) => void;
  onCloseModal: () => void;
}): JSX.Element {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ backgroundColor: BG_COLORS.primary }}
    >
      {!activeModal && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-6"
          style={{ paddingTop: '60px' }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: 'rgba(96, 165, 250, 0.15)' }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke={STATE_COLORS.active}
              strokeWidth="2"
            >
              <path
                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold mb-2 text-center" style={{ color: TEXT_COLORS.primary }}>
            Auth Modals
          </h2>
          <p className="text-sm text-center" style={{ color: TEXT_COLORS.secondary }}>
            Use the controls panel to open Sign In, Sign Up, Forgot Password, or Profile
          </p>
        </div>
      )}
      <SignUpModal
        isOpen={activeModal === 'signup'}
        onClose={onCloseModal}
        onSwitchToSignIn={() => onOpenModal('signin')}
        onSuccess={() => {}}
      />
      <SignInModal
        isOpen={activeModal === 'signin'}
        onClose={onCloseModal}
        onSwitchToSignUp={() => onOpenModal('signup')}
        onForgotPassword={() => onOpenModal('forgot')}
        onSuccess={() => {}}
      />
      <ForgotPasswordModal
        isOpen={activeModal === 'forgot'}
        onClose={onCloseModal}
        onBackToSignIn={() => onOpenModal('signin')}
      />
      <ProfileSettingsModal
        isOpen={activeModal === 'profile'}
        onClose={onCloseModal}
        onAccountDeleted={() => {}}
      />
    </div>
  );
}

// ============================================================================
// PHONE CONTENT: FULL-SCREEN LOGIN/SIGNUP
// ============================================================================

function ScreensModeContent({
  currentView,
  onSwitchToLogin,
  onSwitchToSignUp,
  onSuccess,
}: {
  currentView: 'login' | 'signup';
  onSwitchToLogin: () => void;
  onSwitchToSignUp: () => void;
  onSuccess: () => void;
}): JSX.Element {
  if (currentView === 'signup') {
    return (
      <div className="w-full h-full overflow-auto" style={{ backgroundColor: BG_COLORS.primary }}>
        <SignUpScreenVX2
          onSwitchToLogin={onSwitchToLogin}
          onSuccess={onSuccess}
        />
      </div>
    );
  }
  return (
    <div className="w-full h-full overflow-auto" style={{ backgroundColor: BG_COLORS.primary }}>
      <LoginScreenVX2
        onSwitchToSignUp={onSwitchToSignUp}
        onSuccess={onSuccess}
        onForgotPassword={undefined}
      />
    </div>
  );
}

// ============================================================================
// MAIN SANDBOX (must be used inside AuthProvider)
// ============================================================================

function LoginSandboxInner({
  defaultMode = 'modals',
  label = 'Login Sandbox',
}: LoginSandboxProps): JSX.Element {
  const [mode, setMode] = useState<LoginSandboxMode>(defaultMode);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [screenView, setScreenView] = useState<'login' | 'signup'>('login');

  const openModal = useCallback((m: ModalType) => setActiveModal(m), []);
  const closeModal = useCallback(() => setActiveModal(null), []);

  return (
    <div
      className="min-h-screen flex items-center justify-center gap-8 p-8"
      style={{ backgroundColor: '#1a1a2e' }}
    >
      <div className="flex flex-col items-center gap-3">
        <MobilePhoneFrame>
          {mode === 'modals' ? (
            <ModalsModeContent
              activeModal={activeModal}
              onOpenModal={openModal}
              onCloseModal={closeModal}
            />
          ) : (
            <ScreensModeContent
              currentView={screenView}
              onSwitchToLogin={() => setScreenView('login')}
              onSwitchToSignUp={() => setScreenView('signup')}
              onSuccess={() => {}}
            />
          )}
        </MobilePhoneFrame>
        {label && (
          <span className="text-sm" style={{ color: TEXT_COLORS.muted }}>
            {label}
          </span>
        )}
      </div>

      <div className="w-80 space-y-4" style={{ color: TEXT_COLORS.primary }}>
        <div>
          <h1 className="text-xl font-bold mb-1" style={{ color: TEXT_COLORS.primary }}>
            Login System Sandbox
          </h1>
          <p className="text-sm" style={{ color: TEXT_COLORS.secondary }}>
            VX2 auth: modals or full-screen flows
          </p>
        </div>

        <div>
          <h2
            className="text-sm font-semibold mb-2 uppercase tracking-wide"
            style={{ color: TEXT_COLORS.muted }}
          >
            Mode
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('modals')}
              className="flex-1 py-2 rounded-lg font-semibold text-sm"
              style={{
                backgroundColor: mode === 'modals' ? STATE_COLORS.active : 'rgba(255,255,255,0.08)',
                color: mode === 'modals' ? '#000' : TEXT_COLORS.primary,
              }}
            >
              Modals
            </button>
            <button
              onClick={() => setMode('screens')}
              className="flex-1 py-2 rounded-lg font-semibold text-sm"
              style={{
                backgroundColor: mode === 'screens' ? STATE_COLORS.active : 'rgba(255,255,255,0.08)',
                color: mode === 'screens' ? '#000' : TEXT_COLORS.primary,
              }}
            >
              Full-screen
            </button>
          </div>
        </div>

        {mode === 'screens' && (
          <div>
            <h2
              className="text-sm font-semibold mb-2 uppercase tracking-wide"
              style={{ color: TEXT_COLORS.muted }}
            >
              Screen
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setScreenView('login')}
                className="flex-1 py-2 rounded-lg font-semibold text-sm"
                style={{
                  backgroundColor:
                    screenView === 'login' ? STATE_COLORS.active : 'rgba(255,255,255,0.08)',
                  color: screenView === 'login' ? '#000' : TEXT_COLORS.primary,
                }}
              >
                Login
              </button>
              <button
                onClick={() => setScreenView('signup')}
                className="flex-1 py-2 rounded-lg font-semibold text-sm"
                style={{
                  backgroundColor:
                    screenView === 'signup' ? STATE_COLORS.active : 'rgba(255,255,255,0.08)',
                  color: screenView === 'signup' ? '#000' : TEXT_COLORS.primary,
                }}
              >
                Sign Up
              </button>
            </div>
          </div>
        )}

        {mode === 'modals' && (
          <div>
            <h2
              className="text-sm font-semibold mb-2 uppercase tracking-wide"
              style={{ color: TEXT_COLORS.muted }}
            >
              Open modal
            </h2>
            <div className="space-y-2">
              {(['signin', 'signup', 'forgot', 'profile'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => openModal(m)}
                  className="w-full py-2.5 rounded-lg font-semibold text-sm capitalize"
                  style={{
                    backgroundColor: activeModal === m ? STATE_COLORS.active : 'rgba(255,255,255,0.08)',
                    color: activeModal === m ? '#000' : TEXT_COLORS.primary,
                  }}
                >
                  {m === 'signin' ? 'Sign In' : m === 'signup' ? 'Sign Up' : m === 'forgot' ? 'Forgot Password' : 'Profile'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2
            className="text-sm font-semibold mb-2 uppercase tracking-wide"
            style={{ color: TEXT_COLORS.muted }}
          >
            Auth status
          </h2>
          <AuthStatus />
        </div>

        <div
          className="p-3 rounded-lg"
          style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h3
            className="font-semibold mb-2 text-xs uppercase tracking-wide"
            style={{ color: TEXT_COLORS.muted }}
          >
            Notes
          </h3>
          <ul className="space-y-1 text-xs" style={{ color: TEXT_COLORS.secondary }}>
            <li>Firebase must be configured in .env.local</li>
            <li>Password: 8+ chars, upper, lower, number</li>
            <li>Username: 3–18 chars, starts with letter</li>
            <li>Modals = overlay; Screens = gate-style login/signup</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EXPORT: wrap with AuthProvider so the sandbox is self-contained
// ============================================================================

export default function LoginSandbox(props: LoginSandboxProps): JSX.Element {
  return (
    <LoginSandboxAuthWrapper>
      <LoginSandboxInner {...props} />
    </LoginSandboxAuthWrapper>
  );
}

function LoginSandboxAuthWrapper({ children }: { children: React.ReactNode }): JSX.Element {
  return <AuthProvider>{children}</AuthProvider>;
}
