import React, { useState, useEffect } from 'react';
import { UserRegistrationService } from '../lib/userRegistration';
import RegistrationModal from './RegistrationModal';

export default function AuthModal({ open, onClose, onAuthSuccess }) {
  const [showRegistration, setShowRegistration] = useState(false);
  const [user, setUser] = useState(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);

  // Check if user needs to complete profile setup
  useEffect(() => {
    const checkUserProfile = async () => {
      if (open && user) {
        setIsCheckingProfile(true);
        try {
          const isComplete = await UserRegistrationService.isProfileComplete(user.uid);
          if (!isComplete) {
            setShowRegistration(true);
          } else {
            // User has complete profile, proceed with auth success
            onAuthSuccess?.(user);
            onClose();
          }
        } catch (error) {
          console.error('Error checking user profile:', error);
          // If we can't check profile, assume incomplete and show registration
          setShowRegistration(true);
        } finally {
          setIsCheckingProfile(false);
        }
      }
    };

    checkUserProfile();
  }, [open, user, onAuthSuccess, onClose]);

  const handleSignIn = async () => {
    try {
      // For now, simulate authentication
      // In a real app, this would trigger Firebase auth
      const mockUser = {
        uid: 'user_' + Date.now(),
        email: null
      };
      
      setUser(mockUser);
      
      // Check if user needs to complete profile
      const isComplete = await UserRegistrationService.isProfileComplete(mockUser.uid);
      if (!isComplete) {
        setShowRegistration(true);
      } else {
        onAuthSuccess?.(mockUser);
        onClose();
      }
    } catch (error) {
      console.error('Authentication error:', error);
      alert('Authentication failed. Please try again.');
    }
  };

  const handleRegistrationSuccess = (userProfile) => {
    setShowRegistration(false);
    onAuthSuccess?.(user);
    onClose();
  };

  if (!open) return null;

  if (showRegistration) {
    return (
      <RegistrationModal
        open={showRegistration}
        onClose={() => setShowRegistration(false)}
        onRegistrationSuccess={handleRegistrationSuccess}
        user={user}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-white mb-4">Authentication Required</h2>
        <p className="text-gray-300 mb-6">
          Please sign in to join tournaments.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSignIn}
            disabled={isCheckingProfile}
            className="px-4 py-2 bg-[#3B82F6] text-white rounded hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
          >
            {isCheckingProfile ? 'Checking...' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
} 