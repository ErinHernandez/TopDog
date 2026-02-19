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
import MobilePhoneFrame from '../../components/vx2/shell/MobilePhoneFrame';

import styles from './LoginSandbox.module.css';

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
      <div className={styles.authStatusLoading}>
        <p className={styles.authStatusLoadingText}>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className={styles.authStatusNotSignedIn}>
        <p className={styles.authStatusNotSignedInText}>Not signed in</p>
      </div>
    );
  }

  return (
    <div className={styles.authStatusSignedIn}>
      <div className="flex items-center gap-2">
        <div className={styles.authStatusAvatar}>
          {profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
        </div>
        <div className={styles.authStatusUserInfo}>
          <p className={styles.authStatusUsername}>
            @{profile?.username || 'No username'}
          </p>
          <p className={styles.authStatusEmail}>
            {user.email || 'No email'}
          </p>
        </div>
      </div>
      <div className={styles.authStatusDetails}>
        <p className={styles.authStatusDetailRow}>
          UID: <span className={styles.authStatusDetailValue}>{user.uid}</span>
        </p>
        <p className={styles.authStatusDetailRow}>
          Email verified:{' '}
          <span style={{ color: user.emailVerified ? 'var(--color-state-success)' : 'var(--color-state-warning)' }}>
            {user.emailVerified ? 'Yes' : 'No'}
          </span>
        </p>
      </div>
      <button
        onClick={() => signOut()}
        className={styles.authStatusSignOutButton}
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
    <div className={styles.modalsContainer}>
      {!activeModal && (
        <div className={styles.modalsEmptyState}>
          <div className={styles.modalsIcon}>
            <svg
              className={styles.modalsIconSvg}
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-state-active)"
              strokeWidth="2"
            >
              <path
                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className={styles.modalsTitle}>
            Auth Modals
          </h2>
          <p className={styles.modalsDescription}>
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
      <div className={styles.screensContainer}>
        <SignUpScreenVX2
          onSwitchToLogin={onSwitchToLogin}
          onSuccess={onSuccess}
        />
      </div>
    );
  }
  return (
    <div className={styles.screensContainer}>
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
    <div className={styles.mainSandbox}>
      <div className={styles.phoneWrapper}>
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
          <span className={styles.phoneLabel}>
            {label}
          </span>
        )}
      </div>

      <div className={styles.controlsPanel}>
        <div className={styles.controlsHeader}>
          <h1 className={styles.controlsTitle}>
            Login System Sandbox
          </h1>
          <p className={styles.controlsSubtitle}>
            VX2 auth: modals or full-screen flows
          </p>
        </div>

        <div className={styles.controlsSection}>
          <h2 className={styles.controlsSectionTitle}>
            Mode
          </h2>
          <div className={styles.modeButtonsContainer}>
            <button
              onClick={() => setMode('modals')}
              className={`${styles.modeButton} ${
                mode === 'modals' ? styles.modeButtonActive : styles.modeButtonInactive
              }`}
            >
              Modals
            </button>
            <button
              onClick={() => setMode('screens')}
              className={`${styles.modeButton} ${
                mode === 'screens' ? styles.modeButtonActive : styles.modeButtonInactive
              }`}
            >
              Full-screen
            </button>
          </div>
        </div>

        {mode === 'screens' && (
          <div className={styles.controlsSection}>
            <h2 className={styles.controlsSectionTitle}>
              Screen
            </h2>
            <div className={styles.screenButtonsContainer}>
              <button
                onClick={() => setScreenView('login')}
                className={`${styles.screenButton} ${
                  screenView === 'login' ? styles.screenButtonActive : styles.screenButtonInactive
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setScreenView('signup')}
                className={`${styles.screenButton} ${
                  screenView === 'signup' ? styles.screenButtonActive : styles.screenButtonInactive
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>
        )}

        {mode === 'modals' && (
          <div className={styles.controlsSection}>
            <h2 className={styles.controlsSectionTitle}>
              Open modal
            </h2>
            <div className={styles.modalButtonsContainer}>
              {(['signin', 'signup', 'forgot', 'profile'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => openModal(m)}
                  className={`${styles.modalButton} ${
                    activeModal === m ? styles.modalButtonActive : styles.modalButtonInactive
                  }`}
                >
                  {m === 'signin' ? 'Sign In' : m === 'signup' ? 'Sign Up' : m === 'forgot' ? 'Forgot Password' : 'Profile'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.controlsSection}>
          <h2 className={styles.controlsSectionTitle}>
            Auth status
          </h2>
          <AuthStatus />
        </div>

        <div className={styles.notesBox}>
          <h3 className={styles.notesTitle}>
            Notes
          </h3>
          <ul className={styles.notesList}>
            <li className={styles.notesItem}>Firebase must be configured in .env.local</li>
            <li className={styles.notesItem}>Password: 8+ chars, upper, lower, number</li>
            <li className={styles.notesItem}>Username: 3–18 chars, starts with letter</li>
            <li className={styles.notesItem}>Modals = overlay; Screens = gate-style login/signup</li>
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
