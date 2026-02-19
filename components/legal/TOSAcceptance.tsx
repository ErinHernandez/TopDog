/**
 * Terms of Service Acceptance Gate Component
 *
 * Displays ToS and Privacy Policy acceptance requirement before user can access the editor.
 * Records acceptance with timestamp and version to Firestore.
 * Uses Firebase Auth context for user identification.
 */

import React, { useState } from 'react';
import type { User } from 'firebase/auth';

interface TOSAcceptanceProps {
  onAccept: () => void;
  tosVersion?: string;
}

const DEFAULT_TOS_VERSION = '1.0.0';

const TOSAcceptance: React.FC<TOSAcceptanceProps> = ({ onAccept, tosVersion = DEFAULT_TOS_VERSION }) => {
  const [tosAccepted, setTosAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!tosAccepted || !privacyAccepted) {
      setError('You must accept both Terms of Service and Privacy Policy to continue.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/tos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: tosVersion,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record ToS acceptance');
      }

      onAccept();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          maxWidth: '600px',
          width: '100%',
          padding: '40px',
        }}
      >
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
          Welcome to TopDog Studio
        </h1>

        <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px', lineHeight: '1.6' }}>
          To use TopDog Studio, you must accept our Terms of Service and Privacy Policy. TopDog Studio is a free
          image editor. We collect anonymized behavioral data to improve our service, as described in our Terms of
          Service.
        </p>

        <div
          style={{
            backgroundColor: '#f9f9f9',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            padding: '20px',
            marginBottom: '24px',
            maxHeight: '300px',
            overflowY: 'auto',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>Key Information</h2>
          <ul style={{ fontSize: '13px', color: '#555', lineHeight: '1.8', listStyleType: 'disc', paddingLeft: '20px' }}>
            <li>TopDog Studio is completely free to use</li>
            <li>We collect anonymized behavioral telemetry data to understand how you use the editor</li>
            <li>You have the right to request your personal data at any time (CCPA)</li>
            <li>You have the right to request deletion of your account and data (GDPR)</li>
            <li>We comply with GDPR and CCPA privacy regulations</li>
            <li>Anonymized data may be used to improve our product</li>
          </ul>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              cursor: 'pointer',
              marginBottom: '16px',
            }}
          >
            <input
              type="checkbox"
              checked={tosAccepted}
              onChange={(e) => setTosAccepted(e.target.checked)}
              style={{ marginRight: '12px', marginTop: '2px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '13px', color: '#333' }}>
              I accept the{' '}
              <a href="/legal/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>
                Terms of Service
              </a>
              , including the mandatory data collection practices described therein
            </span>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              style={{ marginRight: '12px', marginTop: '2px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '13px', color: '#333' }}>
              I accept the{' '}
              <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>
                Privacy Policy
              </a>
              , including GDPR Article 17 (right to erasure) and CCPA consumer rights
            </span>
          </label>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
              padding: '12px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#c33',
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleAccept}
          disabled={isLoading || !tosAccepted || !privacyAccepted}
          style={{
            width: '100%',
            padding: '12px 20px',
            backgroundColor: tosAccepted && privacyAccepted ? '#0066cc' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: tosAccepted && privacyAccepted && !isLoading ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.3s ease',
          }}
        >
          {isLoading ? 'Processing...' : 'Accept and Continue'}
        </button>

        <p style={{ fontSize: '11px', color: '#999', marginTop: '20px', textAlign: 'center' }}>
          Version {tosVersion}
        </p>
      </div>
    </div>
  );
};

export default TOSAcceptance;
