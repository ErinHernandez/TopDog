/**
 * Dev Access Page
 * 
 * Development access page for testing authentication and dev features.
 * Uses dynamic import with ssr: false to prevent build-time auth context issues.
 */

import type { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import React from 'react';

import { BG_COLORS, TEXT_COLORS } from '../components/vx2/core/constants/colors';


// Dynamic import with SSR disabled to prevent build-time auth errors
const DevAccessContent = dynamic(
  () => import('../components/vx2/auth').then((mod) => {
    const { AuthProvider, useAuth } = mod;
    
    // Inner component that uses auth
    function DevAccessInner() {
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
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Dev Access</h1>
          
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
                <Link href="/testing-grounds/vx2-auth-test" style={{ color: '#3B82F6' }}>
                  Auth Test Page
                </Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link href="/testing-grounds" style={{ color: '#3B82F6' }}>
                  Testing Grounds
                </Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link href="/tournaments/dev" style={{ color: '#3B82F6' }}>
                  Dev Tournaments
                </Link>
              </li>
            </ul>
          </div>
        </div>
      );
    }
    
    // Wrapper with AuthProvider
    return function DevAccessWrapper() {
      return (
        <AuthProvider>
          <DevAccessInner />
        </AuthProvider>
      );
    };
  }),
  { 
    ssr: false,
    loading: () => (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#101927',
        color: '#6B7280',
      }}>
        <div>Loading Dev Access...</div>
      </div>
    ),
  }
);

// ============================================================================
// PAGE COMPONENT
// ============================================================================

function DevAccessPage() {
  return <DevAccessContent />;
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
