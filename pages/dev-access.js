import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { getAuth } from 'firebase/auth';
import { canAccessDevFeatures } from '../lib/devAuth';
import DevAccessModal from '../components/DevAccessModal';
import { useAuthContext } from '../components/vx2/auth/context/AuthContext';

export default function DevAccess() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthContext();
  const [hasDevAccess, setHasDevAccess] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);

  useEffect(() => {
    checkDevAccess();
  }, [user, isAuthenticated]);

  const checkDevAccess = async () => {
    const accessToken = sessionStorage.getItem('devAccessToken');
    
    // Get Firebase auth token to check custom claims
    let authToken = null;
    if (isAuthenticated && user) {
      try {
        const auth = getAuth();
        const tokenResult = await auth.currentUser?.getIdTokenResult(true);
        if (tokenResult) {
          authToken = tokenResult.claims;
        }
      } catch (error) {
        console.warn('[DevAccess] Failed to get auth token:', error);
      }
    }
    
    // Use proper authentication context instead of hardcoded user ID
    const userId = user?.uid || null;
    
    if (canAccessDevFeatures(userId, accessToken, authToken)) {
      setHasDevAccess(true);
    } else {
      setShowAccessModal(true);
    }
  };

  const handleAccessGranted = (accessToken) => {
    setHasDevAccess(true);
    // Redirect to development tournaments after successful access
    router.push('/tournaments/dev');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('devAccessToken');
    setHasDevAccess(false);
    router.push('/');
  };

  if (hasDevAccess) {
    return (
      <>
        <Head>
          <title>Development Access Granted - TopDog.dog</title>
          <meta name="description" content="Development access granted" />
        </Head>
        
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-white text-xl mb-4">Development Access Granted</div>
            <div className="text-gray-400 mb-6">You now have access to development features.</div>
            <div className="space-y-3">
                          <button
              onClick={() => router.push('/tournaments/dev')}
              className="block w-full px-6 py-3 rounded-lg font-bold transition-colors"
              style={{ backgroundColor: '#3B82F6', color: '#111827' }}
            >
              Go to Development Tournaments
            </button>
              <button
                onClick={handleLogout}
                className="block w-full px-6 py-3 rounded-lg font-bold bg-gray-700 text-white hover:bg-gray-600 transition-colors"
              >
                Logout Development Access
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Development Access - TopDog.dog</title>
        <meta name="description" content="Request development access" />
      </Head>
      
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Development Access</div>
          <div className="text-gray-400 mb-6">Request access to development features.</div>
                      <button
              onClick={() => setShowAccessModal(true)}
              className="px-6 py-3 rounded-lg font-bold transition-colors"
              style={{ backgroundColor: '#3B82F6', color: '#111827' }}
            >
              Request Access
            </button>
        </div>
      </div>

      <DevAccessModal
        open={showAccessModal}
        onClose={() => {
          setShowAccessModal(false);
          router.push('/');
        }}
        onAccessGranted={handleAccessGranted}
      />
    </>
  );
} 