/**
 * Auth Components Test Page
 *
 * - Auth components and dev controls run outside the phone in the browser.
 * - A phone is shown for visual consistency; auth modals live in the web area.
 * - Not available on real mobile devices (web-only for that route).
 * Access: /testing-grounds/vx2-auth-test
 */

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import type { JSX } from 'react';

import {
  AuthProvider,
  SignUpModal,
  SignInModal,
  ForgotPasswordModal,
  ProfileSettingsModal,
  useAuth
} from '../../components/vx2/auth';
import MobilePhoneFrame from '../../components/vx2/shell/MobilePhoneFrame';
import { useIsMobileDevice } from '../../hooks/useIsMobileDevice';

import styles from './vx2-auth-test.module.css';

type ModalType = 'signup' | 'signin' | 'forgot' | 'profile' | null;

// ============================================================================
// AUTH STATUS COMPONENT
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
          Provider: <span className={styles.authStatusDetailValue}>{user.providerId}</span>
        </p>
        <p className={styles.authStatusDetailRow}>
          Email Verified:{' '}
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
// MAIN TEST PAGE
// ============================================================================

function AuthTestContent(): JSX.Element {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  
  const openModal = (modal: ModalType): void => setActiveModal(modal);
  const closeModal = (): void => setActiveModal(null);
  
  return (
    <div className={styles.mainContainer}>
      {/* Phone: placeholder + modals under test render inside; modals go over safe area */}
      <MobilePhoneFrame contentOverSafeArea>
        <div className={styles.phoneContentContainer}>
          {!activeModal && (
            <div className={styles.emptyStateContent}>
              <div className={styles.emptyStateIcon}>
                <svg className={styles.emptyStateIconSvg} viewBox="0 0 24 24" fill="none" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/>
                </svg>
              </div>
              <h2 className={styles.emptyStateTitle}>
                Auth Components
              </h2>
              <p className={styles.emptyStateDescription}>
                Select a modal from the controls panel to preview it here
              </p>
            </div>
          )}

          <SignUpModal
            isOpen={activeModal === 'signup'}
            onClose={closeModal}
            onSwitchToSignIn={() => openModal('signin')}
            onSuccess={() => {
              closeModal();
            }}
            contentTopInset={0}
          />

          <SignInModal
            isOpen={activeModal === 'signin'}
            onClose={closeModal}
            onSwitchToSignUp={() => openModal('signup')}
            onForgotPassword={() => openModal('forgot')}
            onSuccess={() => {
              closeModal();
            }}
            contentTopInset={0}
          />

          <ForgotPasswordModal
            isOpen={activeModal === 'forgot'}
            onClose={closeModal}
            onBackToSignIn={() => openModal('signin')}
          />

          <ProfileSettingsModal
            isOpen={activeModal === 'profile'}
            onClose={closeModal}
            onAccountDeleted={() => {}}
            contentTopInset={0}
          />
        </div>
      </MobilePhoneFrame>

      {/* Components test panel — outside phone */}
      <div className={styles.controlsPanel}>
        {/* Header */}
        <div className={styles.controlsHeader}>
          <h1 className={styles.controlsTitle}>
            Auth Components Test
          </h1>
          <p className={styles.controlsSubtitle}>
            VX2 Authentication System
          </p>
        </div>

        {/* Auth Status */}
        <div className={styles.controlsSection}>
          <h2 className={styles.controlsSectionTitle}>
            Current Status
          </h2>
          <AuthStatus />
        </div>

        {/* Modal Buttons */}
        <div className={styles.controlsSection}>
          <h2 className={styles.controlsSectionTitle}>
            Open Modals
          </h2>
          <div className="space-y-2">
            <button
              onClick={() => openModal('signup')}
              className={`${styles.modalButton} ${
                activeModal === 'signup' ? styles.modalButtonActive : styles.modalButtonInactive
              }`}
            >
              Sign Up Modal
            </button>

            <button
              onClick={() => openModal('signin')}
              className={`${styles.modalButton} ${
                activeModal === 'signin' ? styles.modalButtonActive : styles.modalButtonInactive
              }`}
            >
              Sign In Modal
            </button>

            <button
              onClick={() => openModal('forgot')}
              className={`${styles.modalButton} ${
                activeModal === 'forgot' ? styles.modalButtonActive : styles.modalButtonInactive
              }`}
            >
              Forgot Password Modal
            </button>

            <button
              onClick={() => openModal('profile')}
              className={`${styles.modalButton} ${
                activeModal === 'profile' ? styles.modalButtonActive : styles.modalButtonInactive
              }`}
            >
              Profile Settings Modal
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className={styles.notesBox}>
          <h3 className={styles.notesTitle}>
            Testing Notes
          </h3>
          <ul className={styles.notesList}>
            <li className={styles.notesItem}>Firebase must be configured in .env.local</li>
            <li className={styles.notesItem}>Password: 8+ chars, uppercase, lowercase, number</li>
            <li className={styles.notesItem}>Username: 3-18 characters, starts with letter</li>
            <li className={styles.notesItem}>OAuth: Google and Apple sign-in available</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// WRAPPED EXPORT
// ============================================================================

function AuthTestPage(): JSX.Element {
  return (
    <AuthProvider>
      <AuthTestContent />
    </AuthProvider>
  );
}

// Disable SSR for this page to prevent hydration issues with modals and Firebase Auth
export default function Page(): JSX.Element {
  const [isClient, setIsClient] = useState<boolean>(false);
  const isMobile = useIsMobileDevice();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional setState in effect
    setIsClient(true);
  }, []);

  if (!isClient || isMobile === null) {
    return (
      <div className={styles.loadingScreen}>
        Loading...
      </div>
    );
  }

  // Auth Components Test is web-only — block access on real mobile devices
  if (isMobile) {
    return (
      <div className={styles.mobileBlockScreen}>
        <p className={styles.mobileBlockMessage}>Auth Components Test is web-only</p>
        <p className={styles.mobileBlockDescription}>
          Open this link on desktop to test auth modals and flows. They run outside the phone in the browser.
        </p>
        <Link
          href="/testing-grounds"
          className={styles.backLink}
        >
          Back to testing grounds
        </Link>
      </div>
    );
  }

  return <AuthTestPage />;
}
