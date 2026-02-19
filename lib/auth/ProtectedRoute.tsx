'use client';

/**
 * Idesaign — Protected Route Wrapper
 *
 * Redirects unauthenticated users to /login.
 * Shows a minimal loading state while auth resolves.
 *
 * Usage:
 *   import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
 *
 *   export default function DashboardPage() {
 *     return (
 *       <ProtectedRoute>
 *         <DashboardContent />
 *       </ProtectedRoute>
 *     );
 *   }
 *
 * @module lib/auth/ProtectedRoute
 */

import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Where to redirect when not authenticated (default: '/login') */
  redirectTo?: string;
}

export function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // While Firebase is resolving the auth state, show a loading spinner
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: 'var(--color-bg-base)',
          color: 'var(--color-text-secondary)',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-md)',
        }}
      >
        <LoadingSpinner />
      </div>
    );
  }

  // Not authenticated — redirect
  if (!user) {
    // Only redirect on the client (avoid SSR mismatch)
    if (typeof window !== 'undefined') {
      const returnUrl = encodeURIComponent(router.asPath);
      void router.replace(`${redirectTo}?returnUrl=${returnUrl}`);
    }
    return null;
  }

  // Authenticated — render children
  return <>{children}</>;
}

/* ----------------------------------------------------------------
   Simple loading spinner (inline — no external deps)
   ---------------------------------------------------------------- */

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        style={{ animation: 'idesaign-spin 1s linear infinite' }}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="var(--color-border-default)"
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="var(--color-accent)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <style>{`
        @keyframes idesaign-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
