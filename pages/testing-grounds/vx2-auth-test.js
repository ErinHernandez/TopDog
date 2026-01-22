/**
 * Auth Components Test Page
 * 
 * Test page for the VX2 authentication system.
 * Access at: /testing-grounds/vx2-auth-test
 */

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { 
  SignUpModal, 
  SignInModal, 
  ForgotPasswordModal, 
  ProfileSettingsModal,
  useAuth 
} from '../../components/vx2/auth';

// Make AuthProvider client-only to prevent hydration issues
const AuthProvider = dynamic(
  () => import('../../components/vx2/auth').then(mod => ({ default: mod.AuthProvider })),
  { 
    ssr: false,
    loading: () => (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#1a1a2e',
        color: '#fff'
      }}>
        <div>Loading auth...</div>
      </div>
    )
  }
);
import { BG_COLORS, TEXT_COLORS, STATE_COLORS } from '../../components/vx2/core/constants/colors';
import MobilePhoneFrame from '../../components/vx2/shell/MobilePhoneFrame';

// ============================================================================
// AUTH STATUS COMPONENT
// ============================================================================

function AuthStatus() {
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

function AuthTestContent() {
  const [activeModal, setActiveModal] = useState(null);
  
  const openModal = (modal) => setActiveModal(modal);
  const closeModal = () => setActiveModal(null);
  
  return (
    <div 
      className="min-h-screen flex items-center justify-center gap-8 p-8"
      style={{ backgroundColor: '#1a1a2e' }}
    >
      {/* Phone Frame - Left Side */}
      <MobilePhoneFrame devicePreset="iphone-14-pro-max" label="Auth Test">
        {/* Phone content container - relative positioned for absolute modals */}
        <div 
          className="relative w-full h-full overflow-hidden"
          style={{ backgroundColor: BG_COLORS.primary }}
        >
          {/* Default state message when no modal is open */}
          {!activeModal && (
            <div 
              className="absolute inset-0 flex flex-col items-center justify-center p-6"
              style={{ paddingTop: '60px' }}
            >
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: 'rgba(96, 165, 250, 0.15)' }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={STATE_COLORS.active} strokeWidth="2">
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
                className="text-sm text-center"
                style={{ color: TEXT_COLORS.secondary }}
              >
                Select a modal from the controls panel to preview it here
              </p>
            </div>
          )}
          
          {/* Modals - render inside phone frame */}
          <SignUpModal
            isOpen={activeModal === 'signup'}
            onClose={closeModal}
            onSwitchToSignIn={() => openModal('signin')}
            onSuccess={() => console.log('Sign up successful!')}
          />
          
          <SignInModal
            isOpen={activeModal === 'signin'}
            onClose={closeModal}
            onSwitchToSignUp={() => openModal('signup')}
            onForgotPassword={() => openModal('forgot')}
            onSuccess={() => console.log('Sign in successful!')}
          />
          
          <ForgotPasswordModal
            isOpen={activeModal === 'forgot'}
            onClose={closeModal}
            onBackToSignIn={() => openModal('signin')}
          />
          
          
          <ProfileSettingsModal
            isOpen={activeModal === 'profile'}
            onClose={closeModal}
            onAccountDeleted={() => console.log('Account deleted!')}
          />
        </div>
      </MobilePhoneFrame>
      
      {/* Dev Controls Panel - Right Side */}
      <div 
        className="w-80 space-y-4"
        style={{ color: TEXT_COLORS.primary }}
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
                backgroundColor: activeModal === 'signup' ? STATE_COLORS.active : 'rgba(96, 165, 250, 0.2)',
                color: activeModal === 'signup' ? '#000' : STATE_COLORS.active,
              }}
            >
              Sign Up Modal
            </button>
            
            <button
              onClick={() => openModal('signin')}
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all"
              style={{ 
                backgroundColor: activeModal === 'signin' ? STATE_COLORS.active : 'rgba(255,255,255,0.08)',
                color: activeModal === 'signin' ? '#000' : TEXT_COLORS.primary,
              }}
            >
              Sign In Modal
            </button>
            
            <button
              onClick={() => openModal('forgot')}
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all"
              style={{ 
                backgroundColor: activeModal === 'forgot' ? STATE_COLORS.active : 'rgba(255,255,255,0.08)',
                color: activeModal === 'forgot' ? '#000' : TEXT_COLORS.primary,
              }}
            >
              Forgot Password Modal
            </button>
            
            <button
              onClick={() => openModal('profile')}
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all"
              style={{ 
                backgroundColor: activeModal === 'profile' ? STATE_COLORS.active : 'rgba(255,255,255,0.08)',
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

function AuthTestPage() {
  return (
    <AuthProvider>
      <AuthTestContent />
    </AuthProvider>
  );
}

// Make entire page client-only to prevent hydration issues
// This page has complex components (MobilePhoneFrame, modals) that can cause mismatches
// Use a wrapper function to properly export the dynamic component
function ClientAuthTestPage() {
  return <AuthTestPage />;
}

export default dynamic(() => Promise.resolve(ClientAuthTestPage), { 
  ssr: false,
  loading: () => (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#1a1a2e',
      color: '#fff'
    }}>
      <div>Loading auth test page...</div>
    </div>
  )
});
