/**
 * DevNav - Shared navigation component for testing grounds
 * 
 * Provides consistent navigation across all dev/testing pages:
 * - Compare with links
 * - Back/Forward browser navigation
 */

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function DevNav() {
  const router = useRouter();

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        backgroundColor: '#1F2937',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        zIndex: 9999,
        minWidth: 200,
      }}
    >
      {/* Compare with Links */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: '#9CA3AF', fontSize: 11, marginBottom: 8 }}>Compare with:</div>
        <Link 
          href="/testing-grounds/mobile-apple-demo"
          style={{
            display: 'block',
            padding: '6px 10px',
            backgroundColor: router.pathname === '/testing-grounds/mobile-apple-demo' ? '#4B3621' : '#78350F',
            color: '#FCD34D',
            borderRadius: 6,
            fontSize: 12,
            marginBottom: 4,
            textDecoration: 'none',
          }}
        >
          Mobile Demo (Original)
        </Link>
        <Link 
          href="/testing-grounds/vx-mobile-demo"
          style={{
            display: 'block',
            padding: '6px 10px',
            backgroundColor: router.pathname === '/testing-grounds/vx-mobile-demo' ? '#374151' : '#111827',
            color: '#D1D5DB',
            borderRadius: 6,
            fontSize: 12,
            marginBottom: 4,
            textDecoration: 'none',
          }}
        >
          VX Draft Room (Original)
        </Link>
        <Link 
          href="/testing-grounds/vx2-mobile-app-demo"
          style={{
            display: 'block',
            padding: '6px 10px',
            backgroundColor: router.pathname === '/testing-grounds/vx2-mobile-app-demo' ? '#374151' : '#111827',
            color: '#D1D5DB',
            borderRadius: 6,
            fontSize: 12,
            marginBottom: 4,
            textDecoration: 'none',
          }}
        >
          VX2 App Shell
        </Link>
        <Link 
          href="/testing-grounds/card-sandbox"
          style={{
            display: 'block',
            padding: '6px 10px',
            backgroundColor: router.pathname === '/testing-grounds/card-sandbox' ? '#1E3A5F' : '#1E3A8A',
            color: '#93C5FD',
            borderRadius: 6,
            fontSize: 12,
            marginBottom: 4,
            textDecoration: 'none',
          }}
        >
          Card Sandbox
        </Link>
        <Link 
          href="/testing-grounds/navbar-sandbox"
          style={{
            display: 'block',
            padding: '6px 10px',
            backgroundColor: router.pathname === '/testing-grounds/navbar-sandbox' ? '#4C1D95' : '#5B21B6',
            color: '#C4B5FD',
            borderRadius: 6,
            fontSize: 12,
            marginBottom: 4,
            textDecoration: 'none',
          }}
        >
          Navbar Sandbox
        </Link>
        <Link 
          href="/testing-grounds/vx2-draft-room"
          style={{
            display: 'block',
            padding: '6px 10px',
            backgroundColor: router.pathname === '/testing-grounds/vx2-draft-room' ? '#1F4D3A' : '#14532D',
            color: '#86EFAC',
            borderRadius: 6,
            fontSize: 12,
            textDecoration: 'none',
          }}
        >
          VX2 Draft Room
        </Link>
      </div>
      
      {/* Browser Navigation */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 12,
          paddingTop: 12,
          borderTop: '1px solid #374151',
        }}
      >
        <button 
          onClick={() => router.back()}
          style={{
            width: 40,
            height: 40,
            backgroundColor: '#374151',
            color: '#D1D5DB',
            border: 'none',
            borderRadius: '50%',
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Go back"
        >
          &lt;
        </button>
        <button 
          onClick={() => window.history.forward()}
          style={{
            width: 40,
            height: 40,
            backgroundColor: '#374151',
            color: '#D1D5DB',
            border: 'none',
            borderRadius: '50%',
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Go forward"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}

