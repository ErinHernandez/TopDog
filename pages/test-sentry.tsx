import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';

/**
 * Test page to verify Sentry error tracking is working
 * Visit: http://localhost:3000/test-sentry
 */
export default function TestSentryPage() {
  const [status, setStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
  }>({ type: 'idle' });

  const testClientError = () => {
    setStatus({ type: 'loading', message: 'Triggering client-side error...' });
    
    try {
      // Add context
      Sentry.setContext('test', {
        purpose: 'Verify client-side Sentry integration',
        timestamp: new Date().toISOString(),
        page: 'test-sentry',
      });

      Sentry.setUser({
        id: 'test-user',
        username: 'test-user',
      });

      // Trigger error
      throw new Error('🧪 Test client-side error from BestBall - Sentry integration test');
    } catch (error) {
      Sentry.captureException(error as Error);
      setStatus({
        type: 'success',
        message: 'Client-side error sent to Sentry! Check your dashboard.',
      });
    }
  };

  const testServerError = async () => {
    setStatus({ type: 'loading', message: 'Sending server-side error...' });
    
    try {
      const response = await fetch('/api/test-sentry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setStatus({
          type: 'success',
          message: data.message || 'Server-side error sent to Sentry!',
        });
      } else {
        setStatus({
          type: 'error',
          message: data.message || 'Failed to send error',
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: `Failed to call API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  const checkSentryConfig = () => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    const isConfigured = !!dsn;

    setStatus({
      type: isConfigured ? 'success' : 'error',
      message: isConfigured
        ? `✅ Sentry DSN is configured (${dsn?.substring(0, 30)}...)`
        : '❌ Sentry DSN not found in environment variables',
    });
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧪 Sentry Error Tracking Test</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2>Configuration Check</h2>
        <button
          onClick={checkSentryConfig}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '1rem',
          }}
        >
          Check Sentry Config
        </button>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Test Error Tracking</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={testClientError}
            disabled={status.type === 'loading'}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: status.type === 'loading' ? 'not-allowed' : 'pointer',
              opacity: status.type === 'loading' ? 0.6 : 1,
            }}
          >
            Test Client-Side Error
          </button>
          
          <button
            onClick={testServerError}
            disabled={status.type === 'loading'}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: status.type === 'loading' ? 'not-allowed' : 'pointer',
              opacity: status.type === 'loading' ? 0.6 : 1,
            }}
          >
            Test Server-Side Error
          </button>
        </div>
      </div>

      {status.message && (
        <div
          style={{
            padding: '1rem',
            marginTop: '1rem',
            borderRadius: '4px',
            backgroundColor:
              status.type === 'success'
                ? '#d1fae5'
                : status.type === 'error'
                ? '#fee2e2'
                : '#dbeafe',
            color:
              status.type === 'success'
                ? '#065f46'
                : status.type === 'error'
                ? '#991b1b'
                : '#1e40af',
            border: `1px solid ${
              status.type === 'success'
                ? '#10b981'
                : status.type === 'error'
                ? '#ef4444'
                : '#3b82f6'
            }`,
          }}
        >
          <strong>{status.type === 'loading' ? '⏳' : status.type === 'success' ? '✅' : '❌'}</strong>{' '}
          {status.message}
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
        <h3>📋 Next Steps</h3>
        <ol style={{ lineHeight: '1.8' }}>
          <li>Click one of the test buttons above</li>
          <li>Wait a few seconds</li>
          <li>
            Check your{' '}
            <a
              href="https://topdogdog.sentry.io/issues/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#0070f3', textDecoration: 'underline' }}
            >
              Sentry dashboard
            </a>
          </li>
          <li>Look for the test error in the Issues feed (should appear within 30 seconds)</li>
        </ol>
      </div>

      <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
        <p>
          <strong>DSN Status:</strong>{' '}
          {process.env.NEXT_PUBLIC_SENTRY_DSN ? (
            <span style={{ color: '#10b981' }}>✅ Configured</span>
          ) : (
            <span style={{ color: '#ef4444' }}>❌ Not configured</span>
          )}
        </p>
      </div>
    </div>
  );
}
