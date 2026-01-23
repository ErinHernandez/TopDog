/**
 * VX2 AuthGateVX2 - Full-Screen Authentication Gate
 * 
 * Enterprise-grade auth gate that:
 * - Completely blocks app access until authenticated
 * - Shows full-screen login (NOT a modal)
 * - Handles sign-up flow seamlessly
 * - Signs out anonymous users automatically
 * - Shows loading state during auth initialization
 * - Supports dev auth override for testing (via DevNav toggle)
 * - DEV BYPASS: Auto-login on mobile devices (for dev purposes)
 * - DEV BYPASS: Auto-login on Vercel deployments (until further notice)
 * 
 * This is the ONLY entry point to the app for unauthenticated users.
 * No close button, no escape - must authenticate to access the app.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { BG_COLORS, TEXT_COLORS, STATE_COLORS } from '../../core/constants/colors';
import { LoginScreenVX2 } from './LoginScreenVX2';
import { SignUpScreenVX2 } from './SignUpScreenVX2';
import { useIsMobileDevice } from '../../../../hooks/useIsMobileDevice';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEV_AUTH_OVERRIDE_KEY = 'devnav-auth-override';

// ============================================================================
// TYPES
// ============================================================================

export interface AuthGateVX2Props {
  /** App content - only rendered when authenticated */
  children: React.ReactNode;
}

type AuthView = 'login' | 'signup';
type DevAuthOverride = 'logged-in' | 'logged-out' | null;

// ============================================================================
// LOADING SPINNER
// ============================================================================

function LoadingSpinner(): React.ReactElement {
  return (
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ backgroundColor: BG_COLORS.primary }}
    >
      {/* TopDog Logo */}
      <img 
        src="/logo.png" 
        alt="TopDog" 
        style={{ height: 56, marginBottom: 32 }}
      />
      
      {/* Spinner */}
      <div 
        className="animate-spin rounded-full h-8 w-8 border-3"
        style={{ 
          borderColor: `${STATE_COLORS.active} transparent transparent transparent`,
          borderWidth: 3,
        }}
      />
      
      {/* Loading text */}
      <p 
        className="mt-4"
        style={{ color: TEXT_COLORS.muted, fontSize: 15 }}
      >
        Loading...
      </p>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AuthGateVX2({ children }: AuthGateVX2Props): React.ReactElement {
  const { state: authState, signOut } = useAuth();
  const isMobileRaw = useIsMobileDevice();
  const isMobileLoaded = isMobileRaw !== null;
  const isMobile = isMobileRaw === true;
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [devAuthOverride, setDevAuthOverride] = useState<DevAuthOverride>(null);
  const [isVercelDeployment, setIsVercelDeployment] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Track mount state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Check if running on Vercel deployment (runtime, not build)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if hostname contains vercel.app (client-side detection)
      const hostname = window.location.hostname;
      const isVercelHost = hostname.includes('vercel.app') || 
                          hostname.endsWith('.vercel.app') ||
                          hostname.includes('.vercel-dns.com');
      setIsVercelDeployment(isVercelHost);
    }
  }, []);
  
  // Load dev auth override on mount and listen for changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Load initial value from localStorage
    try {
      const saved = localStorage.getItem(DEV_AUTH_OVERRIDE_KEY);
      if (saved === 'logged-in' || saved === 'logged-out') {
        setDevAuthOverride(saved);
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    
    // Listen for changes from DevNav
    const handleOverrideChange = (event: CustomEvent<string>) => {
      const value = event.detail;
      if (value === 'logged-in' || value === 'logged-out') {
        setDevAuthOverride(value);
      }
    };
    
    window.addEventListener('devAuthOverrideChange', handleOverrideChange as EventListener);
    return () => {
      window.removeEventListener('devAuthOverrideChange', handleOverrideChange as EventListener);
    };
  }, []);
  
  // Handle anonymous users - sign them out automatically (only if not bypassing auth)
  // Only run this after mobile detection is loaded to avoid race conditions
  useEffect(() => {
    // Wait for mobile detection to complete before making auth decisions
    if (!isMobileLoaded) return;
    
    // Don't sign out if we're bypassing auth for mobile/Vercel
    const bypassAuth = isMobile || isVercelDeployment;
    if (!bypassAuth && authState.user?.isAnonymous) {
      signOut();
    }
  }, [authState.user?.isAnonymous, signOut, isMobile, isMobileLoaded, isVercelDeployment]);
  
  // Handle successful authentication
  const handleAuthSuccess = useCallback(() => {
    // Auth state will update automatically via context
    // Just reset view for next time
    setCurrentView('login');
  }, []);
  
  // Switch between login and signup
  const handleSwitchToSignUp = useCallback(() => {
    setCurrentView('signup');
  }, []);
  
  const handleSwitchToLogin = useCallback(() => {
    setCurrentView('login');
  }, []);
  
  // ========== AUTH STATE RENDERING ==========
  
  // 0. Dev auth override - bypass real auth for testing
  if (devAuthOverride === 'logged-in') {
    return <>{children}</>;
  }
  
  // CRITICAL: During initial render (before mount or before mobile detection is loaded), 
  // always show loading spinner to ensure server and client render the same thing during hydration
  // The server always has isInitializing=true from createBuildTimeSafeDefaults()
  // We show loading during initial render to guarantee hydration match
  // On server: isMounted is false, so we show loading
  // On client: wait for both isMounted and isMobileLoaded before proceeding
  const isReady = isMounted && (typeof window === 'undefined' || isMobileLoaded);
  if (!isReady) {
    return <LoadingSpinner />;
  }
  
  // Guard: Ensure we don't render children until fully ready to prevent hydration mismatch
  // This ensures server and client render the same initial state
  
  // DEV BYPASS: Auto-login on mobile devices (for dev purposes)
  // DEV BYPASS: Auto-login on Vercel deployments (until further notice)
  // Only use mobile detection and Vercel detection after mount and mobile detection is loaded
  // to prevent hydration mismatch
  const bypassAuth = (isMobileLoaded && isMobile) || isVercelDeployment;
  
  if (bypassAuth) {
    return <>{children}</>;
  }
  
  // If dev override is 'logged-out', always show auth screens regardless of real auth state
  const showAuthScreens = devAuthOverride === 'logged-out' || (!authState.user || authState.user.isAnonymous);
  
  // 1. Still initializing - show loading spinner (only if no dev override)
  if (!devAuthOverride && authState.isInitializing) {
    return <LoadingSpinner />;
  }
  
  // 2. Loading after initialization (e.g., signing in)
  if (!devAuthOverride && authState.isLoading && !authState.user) {
    return <LoadingSpinner />;
  }
  
  // 3. Authenticated with real user - render app content (unless dev override)
  if (!showAuthScreens && authState.user && !authState.user.isAnonymous) {
    return <>{children}</>;
  }
  
  // 4. Not authenticated - show login or signup screen
  if (currentView === 'signup') {
    return (
      <SignUpScreenVX2
        onSwitchToLogin={handleSwitchToLogin}
        onSuccess={handleAuthSuccess}
      />
    );
  }
  
  return (
    <LoginScreenVX2
      onSwitchToSignUp={handleSwitchToSignUp}
      onSuccess={handleAuthSuccess}
    />
  );
}

export default AuthGateVX2;

