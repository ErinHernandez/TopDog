import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { canAccessDevFeatures } from '../lib/devAuth';
import DevAccessModal from '../components/DevAccessModal';

export default function DevAccess() {
  const router = useRouter();
  const [hasDevAccess, setHasDevAccess] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);

  useEffect(() => {
    checkDevAccess();
  }, []);

  const checkDevAccess = () => {
    const accessToken = sessionStorage.getItem('devAccessToken');
    const userId = 'Not Todd Middleton'; // Replace with real user ID in production
    
    if (canAccessDevFeatures(userId, accessToken)) {
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