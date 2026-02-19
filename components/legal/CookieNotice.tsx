/**
 * Cookie Notice Banner Component
 *
 * Simple informational banner about essential cookies and data collection.
 * NOT a consent toggle - all cookies are essential and mandatory.
 * Stores dismissal status in localStorage to show only once per device.
 */

import React, { useEffect, useState } from 'react';

const COOKIE_NOTICE_DISMISSED_KEY = 'topdog_cookie_notice_dismissed';

const CookieNotice: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    const isDismissedInStorage = localStorage.getItem(COOKIE_NOTICE_DISMISSED_KEY);
    setIsDismissed(!!isDismissedInStorage);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(COOKIE_NOTICE_DISMISSED_KEY, 'true');
    setIsDismissed(true);
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
        padding: '16px 20px',
        fontSize: '13px',
        zIndex: 9999,
        borderTop: '1px solid #333',
        boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ flex: 1, lineHeight: '1.5' }}>
          This site uses essential cookies for authentication and security. By using TopDog Studio, you agree to our{' '}
          <a href="/legal/terms" style={{ color: '#66b3ff', textDecoration: 'none', fontWeight: 'bold' }}>
            Terms of Service
          </a>{' '}
          which covers data collection practices. See our{' '}
          <a href="/legal/privacy" style={{ color: '#66b3ff', textDecoration: 'none', fontWeight: 'bold' }}>
            Privacy Policy
          </a>
          .
        </div>
        <button
          onClick={handleDismiss}
          style={{
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'background-color 0.2s ease',
          }}
          onMouseOver={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = '#0052a3';
          }}
          onMouseOut={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = '#0066cc';
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
};

export default CookieNotice;
