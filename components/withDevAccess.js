/**
 * Development Access Protection HOC
 * 
 * Wraps pages that should only be accessible to developers.
 * In production, requires Firebase Auth with developer custom claim.
 * In development, allows access with dev token or developer claim.
 * 
 * Usage:
 *   export default withDevAccess(MyDevPage);
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { canAccessDevFeatures } from '../lib/devAuth';

// ============================================================================
// ACCESS DENIED COMPONENT
// ============================================================================

function AccessDenied({ onRequestAccess }) {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#0f172a' }}
    >
      <div 
        className="max-w-md w-full p-6 rounded-xl text-center"
        style={{ backgroundColor: '#1e293b' }}
      >
        <div 
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
        >
          <svg 
            className="w-8 h-8" 
            fill="none" 
            stroke="#ef4444" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-6V4m0 0L8 8m4-4l4 4" 
            />
          </svg>
        </div>
        
        <h1 
          className="text-xl font-bold mb-2"
          style={{ color: '#f1f5f9' }}
        >
          Development Access Required
        </h1>
        
        <p 
          className="text-sm mb-6"
          style={{ color: '#94a3b8' }}
        >
          This page is restricted to authorized developers only.
          {process.env.NODE_ENV === 'production' && (
            <span className="block mt-2">
              Contact an administrator to request developer access.
            </span>
          )}
        </p>
        
        <div className="space-y-3">
          {process.env.NODE_ENV !== 'production' && (
            <button
              onClick={onRequestAccess}
              className="w-full py-3 px-4 rounded-lg font-semibold transition-colors"
              style={{ 
                backgroundColor: '#3b82f6', 
                color: '#ffffff' 
              }}
            >
              Request Dev Access
            </button>
          )}
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-3 px-4 rounded-lg font-semibold transition-colors"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              color: '#94a3b8' 
            }}
          >
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// LOADING COMPONENT
// ============================================================================

function LoadingAccess() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#0f172a' }}
    >
      <div className="text-center">
        <div 
          className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: '#3b82f6', borderTopColor: 'transparent' }}
        />
        <p style={{ color: '#94a3b8' }}>Verifying access...</p>
      </div>
    </div>
  );
}

// ============================================================================
// HOC
// ============================================================================

/**
 * Higher-Order Component that protects pages requiring developer access
 * @param {React.ComponentType} WrappedComponent - Component to protect
 * @param {Object} options - Configuration options
 * @param {boolean} options.allowInDev - Allow access in development without auth (default: false)
 * @returns {React.ComponentType} Protected component
 */
export default function withDevAccess(WrappedComponent, options = {}) {
  const { allowInDev = false } = options;
  
  function ProtectedComponent(props) {
    const router = useRouter();
    const [accessState, setAccessState] = useState({
      isLoading: true,
      hasAccess: false,
      user: null,
    });
    
    useEffect(() => {
      let unsubscribe = () => {};
      
      const checkAccess = async () => {
        // In development with allowInDev, skip auth check
        if (process.env.NODE_ENV === 'development' && allowInDev) {
          setAccessState({
            isLoading: false,
            hasAccess: true,
            user: null,
          });
          return;
        }
        
        try {
          const auth = getAuth();
          
          unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
              // No user - check for dev access token in session storage
              const devToken = typeof window !== 'undefined' 
                ? sessionStorage.getItem('devAccessToken') 
                : null;
              
              if (devToken && canAccessDevFeatures(null, devToken, null)) {
                setAccessState({
                  isLoading: false,
                  hasAccess: true,
                  user: null,
                });
              } else {
                setAccessState({
                  isLoading: false,
                  hasAccess: false,
                  user: null,
                });
              }
              return;
            }
            
            // User is authenticated - check for developer claim
            try {
              const tokenResult = await user.getIdTokenResult(true);
              const claims = tokenResult.claims;
              
              // Check dev access token from session storage as fallback
              const devToken = typeof window !== 'undefined' 
                ? sessionStorage.getItem('devAccessToken') 
                : null;
              
              const hasAccess = canAccessDevFeatures(user.uid, devToken, claims);
              
              setAccessState({
                isLoading: false,
                hasAccess,
                user,
              });
            } catch (error) {
              console.error('[withDevAccess] Error checking claims:', error);
              setAccessState({
                isLoading: false,
                hasAccess: false,
                user,
              });
            }
          });
        } catch (error) {
          console.error('[withDevAccess] Auth error:', error);
          setAccessState({
            isLoading: false,
            hasAccess: false,
            user: null,
          });
        }
      };
      
      checkAccess();
      
      return () => unsubscribe();
    }, []);
    
    // Handle request access
    const handleRequestAccess = () => {
      router.push('/dev-access');
    };
    
    // Loading state
    if (accessState.isLoading) {
      return <LoadingAccess />;
    }
    
    // Access denied
    if (!accessState.hasAccess) {
      return <AccessDenied onRequestAccess={handleRequestAccess} />;
    }
    
    // Access granted - render the protected component
    return <WrappedComponent {...props} />;
  }
  
  // Copy display name for debugging
  ProtectedComponent.displayName = `withDevAccess(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;
  
  return ProtectedComponent;
}

// ============================================================================
// NAMED EXPORT FOR FLEXIBILITY
// ============================================================================

export { withDevAccess };
