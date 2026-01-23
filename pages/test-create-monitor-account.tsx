/**
 * Test Page: Create Monitor Account
 * 
 * Simple test page to create the OcularPatdowns monitor account.
 * Uses development admin token for authentication.
 * 
 * BLOCKED IN PRODUCTION: This page is not accessible in production builds.
 */

import React, { useState } from 'react';
import type { GetServerSideProps } from 'next';

interface MonitorAccount {
  username: string;
  uid: string;
  balance: number;
  accountType: string;
}

interface CreateAccountResult {
  success: boolean;
  account?: MonitorAccount;
  message?: string;
  error?: string;
}

// Block this page in production
export const getServerSideProps: GetServerSideProps = async () => {
  if (process.env.NODE_ENV === 'production') {
    return { notFound: true };
  }
  return { props: {} };
};

export default function TestCreateMonitorAccount() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateAccountResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateAccount = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/create-monitor-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev-admin-token', // Development token
        },
      });

      const data = await response.json() as CreateAccountResult;

      if (response.ok && data.success) {
        setResult(data);
      } else {
        setError(data.message || data.error || 'Failed to create account');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Create Monitor Account Test</h1>
      <p>This page will create the OcularPatdowns monitor account.</p>
      
      <div style={{ marginTop: '2rem' }}>
        <button
          onClick={handleCreateAccount}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: '#4285F4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Creating...' : 'Create Monitor Account'}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            color: '#c00',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: '#efe',
            border: '1px solid #cfc',
            borderRadius: '4px',
            color: '#060',
          }}
        >
          <strong>Success!</strong>
          <pre style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
          
          {result.account && (
            <div style={{ marginTop: '1rem' }}>
              <h3>Account Details:</h3>
              <ul>
                <li><strong>Username:</strong> {result.account.username}</li>
                <li><strong>Email:</strong> ffnsfwff@gmail.com</li>
                <li><strong>Password:</strong> xx</li>
                <li><strong>UID:</strong> {result.account.uid}</li>
                <li><strong>Balance:</strong> ${result.account.balance}</li>
                <li><strong>Account Type:</strong> {result.account.accountType}</li>
              </ul>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '3rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h3>What this creates:</h3>
        <ul>
          <li>✅ Firebase Auth account (ffnsfwff@gmail.com / xx)</li>
          <li>✅ Reserved username "OcularPatdowns" via VIP reservation</li>
          <li>✅ Firestore user profile with $1000 balance</li>
          <li>✅ Fake payment method for testing</li>
          <li>✅ Monitor account type (half-dev, half-user)</li>
        </ul>
      </div>
    </div>
  );
}
