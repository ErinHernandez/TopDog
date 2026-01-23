/**
 * Dev Access Page
 * 
 * Development access page for testing authentication and dev features.
 * This page requires client-side rendering to avoid build-time auth context issues.
 */

import React from 'react';
import { AuthProvider, useAuth } from '../components/vx2/auth';
import { BG_COLORS, TEXT_COLORS } from '../components/vx2/core/constants/colors';
import type { GetServerSideProps } from 'next';

// ============================================================================
// BUILD-TIME DETECTION
// ============================================================================

/**
 * Check if we're in build/prerender phase
 * Returns safe defaults during build to prevent errors
 */
const isBuildPhase = (): boolean => {
  const phase = process.env.NEXT_PHASE;
  const isSSR = typeof window === 'undefined';
  // Check for build phase or prerender (SSR in production)
  return phase === 'phase-production-build' || 
         phase === 'phase-export' ||
         (isSSR && process.env.NODE_ENV === 'production');
};

// ============================================================================
// PAGE CONTENT COMPONENT
// ============================================================================

function DevAccessContent() {
  const { user, profile, isAuthenticated, isLoading, signOut } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: BG_COLORS.primary,
      }}>
        <div style={{ color: TEXT_COLORS.muted }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      padding: '2rem',
      backgroundColor: BG_COLORS.primary,
      color: TEXT_COLORS.primary,
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔐 Dev Access</h1>
      
      <div style={{ 
        padding: '1.5rem', 
        borderRadius: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginBottom: '1rem',
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Authentication Status</h2>
        
        {isAuthenticated && user ? (
          <div>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>Status:</strong> Authenticated
            </p>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>Email:</strong> {user.email || 'N/A'}
            </p>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>Username:</strong> {profile?.username || 'N/A'}
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>User ID:</strong> {user.uid}
            </p>
            <button
              onClick={signOut}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div>
            <p style={{ marginBottom: '1rem' }}>
              <strong>Status:</strong> Not authenticated
            </p>
            <p style={{ color: TEXT_COLORS.muted }}>
              Please sign in to access dev features.
            </p>
          </div>
        )}
      </div>

      <div style={{ 
        padding: '1.5rem', 
        borderRadius: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Development Tools</h2>
        <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem' }}>
          <li style={{ marginBottom: '0.5rem' }}>
            <a href="/testing-grounds/vx2-auth-test" style={{ color: '#3B82F6' }}>
              Auth Test Page
            </a>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <a href="/testing-grounds" style={{ color: '#3B82F6' }}>
              Testing Grounds
            </a>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <a href="/tournaments/dev" style={{ color: '#3B82F6' }}>
              Dev Tournaments
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

// ============================================================================
// WRAPPED PAGE COMPONENT
// ============================================================================

function DevAccessPage() {
  // During build phase, return a simple placeholder to prevent errors
  if (isBuildPhase()) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: BG_COLORS.primary,
        color: TEXT_COLORS.muted,
      }}>
        <div>Dev Access (Loading...)</div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <DevAccessContent />
    </AuthProvider>
  );
}

// ============================================================================
// DISABLE STATIC GENERATION
// ============================================================================

// Disable static generation - this page requires client-side auth
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};

export default DevAccessPage;
