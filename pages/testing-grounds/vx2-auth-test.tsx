/**
 * Auth Components Test Page
 *
 * - Auth components and dev controls run outside the phone in the browser.
 * - A phone is shown for visual consistency; auth modals live in the web area.
 * - Not available on real mobile devices (web-only for that route).
 * Access: /testing-grounds/vx2-auth-test
 */

import React, { useState, useEffect } from 'react';
import type { JSX } from 'react';
import Link from 'next/link';
import { 
  AuthProvider,
  SignUpModal,
  SignInModal,
  ForgotPasswordModal,
  ProfileSettingsModal,
  useAuth 
} from '../../components/vx2/auth';
import { BG_COLORS, TEXT_COLORS, STATE_COLORS, BORDER_COLORS } from '../../components/vx2/core/constants/colors';
import MobilePhoneFrame from '../../components/vx2/shell/MobilePhoneFrame';
import { useIsMobileDevice } from '../../hooks/useIsMobileDevice';

type ModalType = 'signup' | 'signin' | 'forgot' | 'profile' | null;

// ============================================================================
// AUTH STATUS COMPONENT
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
    <div className="p-3 rounded-xl space-y-2" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
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
          Provider: <span style={{ color: TEXT_COLORS.secondary }}>{user.providerId}</span>
        </p>
        <p style={{ color: TEXT_COLORS.muted }}>
          Email Verified:{' '}
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
          color: STATE_COLORS.error 
        }}
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
    <div className="flex items-center justify-center gap-8 p-4 min-h-screen">
      {/* Phone: placeholder + modals under test render inside; modals go over safe area */}
      <MobilePhoneFrame contentOverSafeArea>
        <div
          className="relative w-full h-full overflow-hidden"
          style={{ backgroundColor: BG_COLORS.primary }}
        >
          {!activeModal && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
              style={{ paddingTop: '60px' }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ 
                  background: 'url(/wr_blue.png) no-repeat center center',
                  backgroundSize: 'cover',
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2
                className="text-lg font-bold mb-2 text-center"
                style={{ color: TEXT_COLORS.primary }}
              >
                Auth Components
              </h2>
              <p
                className="text-sm text-center px-2"
                style={{ color: TEXT_COLORS.secondary }}
              >
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
      <div
        className="w-80 space-y-4 flex-shrink-0 p-8 rounded-2xl"
        style={{ backgroundColor: '#1a1a2e', color: TEXT_COLORS.primary }}
      >
        {/* Header */}
        <div>
          <h1 
            className="text-xl font-bold mb-1"
            style={{ color: TEXT_COLORS.primary }}
          >
            Auth Components Test
          </h1>
          <p className="text-sm" style={{ color: TEXT_COLORS.secondary }}>
            VX2 Authentication System
          </p>
        </div>
        
        {/* Auth Status */}
        <div>
          <h2 
            className="text-sm font-semibold mb-2 uppercase tracking-wide"
            style={{ color: TEXT_COLORS.muted }}
          >
            Current Status
          </h2>
          <AuthStatus />
        </div>
        
        {/* Modal Buttons */}
        <div>
          <h2 
            className="text-sm font-semibold mb-2 uppercase tracking-wide"
            style={{ color: TEXT_COLORS.muted }}
          >
            Open Modals
          </h2>
          <div className="space-y-2">
            <button
              onClick={() => openModal('signup')}
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all"
              style={{ 
                background: activeModal === 'signup' 
                  ? 'url(/wr_blue.png) no-repeat center center'
                  : 'rgba(255,255,255,0.08)',
                backgroundSize: 'cover',
                color: activeModal === 'signup' ? '#000' : TEXT_COLORS.primary,
              }}
            >
              Sign Up Modal
            </button>
            
            <button
              onClick={() => openModal('signin')}
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all"
              style={{ 
                background: activeModal === 'signin' 
                  ? 'url(/wr_blue.png) no-repeat center center'
                  : 'rgba(255,255,255,0.08)',
                backgroundSize: 'cover',
                color: activeModal === 'signin' ? '#000' : TEXT_COLORS.primary,
              }}
            >
              Sign In Modal
            </button>
            
            <button
              onClick={() => openModal('forgot')}
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all"
              style={{ 
                background: activeModal === 'forgot' 
                  ? 'url(/wr_blue.png) no-repeat center center'
                  : 'rgba(255,255,255,0.08)',
                backgroundSize: 'cover',
                color: activeModal === 'forgot' ? '#000' : TEXT_COLORS.primary,
              }}
            >
              Forgot Password Modal
            </button>
            
            <button
              onClick={() => openModal('profile')}
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all"
              style={{ 
                background: activeModal === 'profile' 
                  ? 'url(/wr_blue.png) no-repeat center center'
                  : 'rgba(255,255,255,0.08)',
                backgroundSize: 'cover',
                color: activeModal === 'profile' ? '#000' : TEXT_COLORS.primary,
              }}
            >
              Profile Settings Modal
            </button>
          </div>
        </div>
        
        {/* Instructions */}
        <div 
          className="p-3 rounded-lg"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <h3 
            className="font-semibold mb-2 text-xs uppercase tracking-wide"
            style={{ color: TEXT_COLORS.muted }}
          >
            Testing Notes
          </h3>
          <ul 
            className="space-y-1 text-xs"
            style={{ color: TEXT_COLORS.secondary }}
          >
            <li>Firebase must be configured in .env.local</li>
            <li>Password: 8+ chars, uppercase, lowercase, number</li>
            <li>Username: 3-18 characters, starts with letter</li>
            <li>OAuth: Google and Apple sign-in available</li>
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
    setIsClient(true);
  }, []);

  if (!isClient || isMobile === null) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#1a1a2e',
        color: '#fff'
      }}>
        Loading...
      </div>
    );
  }

  // Auth Components Test is web-only — block access on real mobile devices
  if (isMobile) {
    return (
      <div 
        style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          gap: 16,
          backgroundColor: '#1a1a2e',
          color: '#fff',
          padding: 24,
          textAlign: 'center'
        }}
      >
        <p style={{ fontSize: 18, fontWeight: 600 }}>Auth Components Test is web-only</p>
        <p style={{ color: TEXT_COLORS.muted, maxWidth: 320 }}>
          Open this link on desktop to test auth modals and flows. They run outside the phone in the browser.
        </p>
        <Link 
          href="/testing-grounds" 
          style={{ 
            background: 'url(/wr_blue.png) no-repeat center center',
            backgroundSize: 'cover',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
            textDecoration: 'underline', 
            marginTop: 8 
          }}
        >
          Back to testing grounds
        </Link>
      </div>
    );
  }

  return <AuthTestPage />;
}
