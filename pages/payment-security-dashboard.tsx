// Payment Security Dashboard Page
import React, { useState, useEffect } from 'react';
import PaymentSecurityDashboard from '../components/PaymentSecurityDashboard';
import { paymentSystem } from '../lib/paymentSystemIntegration';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import type { GetServerSideProps } from 'next';
import { createScopedLogger } from '@/lib/clientLogger';

const logger = createScopedLogger('[PaymentSecurityDashboard]');

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

interface SystemStatus {
  initialized: boolean;
  processors: {
    healthy: number;
    total: number;
    healthPercentage: number;
  };
  activeTransactions: number;
  fraud: {
    blockRate?: number;
  };
}

// Disable static generation - this page requires client-side auth
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};

// Explicit runtime configuration to prevent static generation
export const config = {
  runtime: 'nodejs',
};

// Safe auth hook that handles SSR
function useSafeAuth() {
  const [authState, setAuthState] = useState<AuthState>({ user: null, isAuthenticated: false });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Only use auth on client side - use Firebase auth directly
    // We don't use AuthContext here to avoid build-time issues
    if (typeof window !== 'undefined') {
      try {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setAuthState({
            user: user,
            isAuthenticated: !!user
          });
        });
        return () => unsubscribe();
      } catch (e) {
        // Firebase not initialized, set default state
        setAuthState({
          user: null,
          isAuthenticated: false
        });
      }
    }
  }, []);

  return { ...authState, mounted };
}

// Build-time detection helper
const isBuildPhase = (): boolean => {
  const phase = process.env.NEXT_PHASE;
  return phase === 'phase-production-build' || phase === 'phase-export';
};

interface VerifyAdminResponse {
  isAdmin: boolean;
  error?: string;
}

export default function PaymentSecurityDashboardPage() {
  const { user, isAuthenticated, mounted } = useSafeAuth();
  
  // Prevent execution during build/prerender phase (after hooks are called)
  if (typeof window === 'undefined' && isBuildPhase()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Payment Security Dashboard...</p>
        </div>
      </div>
    );
  }

  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mounted) return;
    
    const checkAdminAccess = async () => {
      // In development, allow access for testing (but still try to verify)
      if (process.env.NODE_ENV === 'development') {
        if (user) {
          try {
            const auth = getAuth();
            const token = await auth.currentUser?.getIdToken();
            if (token) {
              const response = await fetch('/api/auth/verify-admin', {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              
              if (response.ok) {
                const data = await response.json() as VerifyAdminResponse;
                if (data.isAdmin) {
                  // Admin verified, continue
                } else {
                  // In dev, still allow but warn
                  logger.warn('User is not admin, but allowing in dev mode');
                }
              }
            }
          } catch (err) {
            logger.warn('Admin check error, allowing in dev mode', { error: String(err) });
          }
        }
      } else {
        // Production: strict admin verification required
        if (!isAuthenticated || !user) {
          setError('Authentication required. Please sign in.');
          setLoading(false);
          return;
        }
        
        try {
          const auth = getAuth();
          const token = await auth.currentUser?.getIdToken();
          
          if (!token) {
            setError('Authentication token required.');
            setLoading(false);
            return;
          }
          
          const response = await fetch('/api/auth/verify-admin', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (!response.ok) {
            const data = await response.json() as VerifyAdminResponse;
            setError(data.error || 'Access denied. Admin privileges required.');
            setLoading(false);
            return;
          }
          
          const data = await response.json() as VerifyAdminResponse;
          if (!data.isAdmin) {
            setError('Access denied. Admin privileges required.');
            setLoading(false);
            return;
          }
          
          // Admin verified, continue
        } catch (err) {
          logger.error('Admin verification error', err instanceof Error ? err : new Error(String(err)));
          setError('Failed to verify admin access. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Initialize system status
      try {
        const status = paymentSystem.getSystemStatus();
        setSystemStatus(status as SystemStatus);
        setLoading(false);
      } catch (err) {
        setError('Failed to load payment system status');
        setLoading(false);
      }
    };
    
    checkAdminAccess();
  }, [user, isAuthenticated, mounted]);

  // Show loading state during SSR or while checking auth
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Payment Security Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* System Status Banner */}
      {systemStatus && (
        <div className={`w-full p-3 text-center text-sm font-medium ${
          systemStatus.initialized && systemStatus.processors.healthPercentage > 90
            ? 'bg-green-100 text-green-800'
            : systemStatus.processors.healthPercentage > 70
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
        }`}>
          🛡️ Payment System Status: {systemStatus.initialized ? 'OPERATIONAL' : 'INITIALIZING'} | 
          {systemStatus.processors.healthy}/{systemStatus.processors.total} Processors Healthy ({systemStatus.processors.healthPercentage.toFixed(1)}%) |
          {systemStatus.activeTransactions} Active Transactions |
          Fraud Rate: {systemStatus.fraud.blockRate?.toFixed(2) || '0.00'}%
        </div>
      )}
      
      {/* Main Dashboard */}
      <PaymentSecurityDashboard />
      
      {/* Development Notice */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-lg shadow-lg text-sm">
          <div className="flex items-center">
            <span className="mr-2">🔧</span>
            <div>
              <div className="font-medium">Development Mode</div>
              <div className="text-blue-200">Security dashboard active</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
