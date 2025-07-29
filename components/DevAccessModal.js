import React, { useState } from 'react';
import { canAccessDevFeatures, getDevAccessToken } from '../lib/devAuth';

export default function DevAccessModal({ open, onClose, onAccessGranted }) {
  const [accessToken, setAccessToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate access token
      const hasAccess = canAccessDevFeatures('Not Todd Middleton', accessToken);
      
      if (hasAccess) {
        // Store access token in session storage for this session
        sessionStorage.setItem('devAccessToken', accessToken);
        onAccessGranted(accessToken);
        onClose();
      } else {
        setError('Invalid access token. Please check your credentials.');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAccess = () => {
    const demoToken = getDevAccessToken();
    setAccessToken(demoToken);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-70" onClick={onClose}></div>
      <div className="relative bg-gray-900 rounded-xl shadow-2xl p-8 z-10 max-w-md w-full mx-4 border border-gray-700">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-6 text-3xl text-gray-400 hover:text-white"
        >
          ×
        </button>
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#3B82F6' }}>
            Development Access
          </h2>
          <p className="text-gray-300 text-sm">
            Enter your development access token to view development tournaments
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2 text-sm font-medium">
              Access Token
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-[#3B82F6] focus:outline-none"
              placeholder="Enter development access token"
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#3B82F6', color: '#111827' }}
            >
              {isLoading ? 'Verifying...' : 'Access Development'}
            </button>
            <button
              type="button"
              onClick={handleDemoAccess}
              className="px-4 py-3 rounded-lg font-bold bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            >
              Demo
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-sm font-semibold mb-2" style={{ color: '#3B82F6' }}>
            Development Features
          </h3>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Create and manage development tournaments</li>
            <li>• Test new tournament formats and features</li>
            <li>• Access development-only functionality</li>
            <li>• Preview upcoming tournament types</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 