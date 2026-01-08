/**
 * VX Mobile App Demo Page - LEGACY/DEPRECATED
 * 
 * This is the VX mobile app demo - an intermediate migration step.
 * 
 * IMPORTANT: This demo is preserved for reference only.
 * All active development now happens in VX2:
 * - /testing-grounds/vx2-mobile-app-demo (mobile app with sorting, new UI)
 * - /testing-grounds/vx2-draft-room (draft room)
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MobileAppVXDemo } from '../../components/vx/mobile/app';

export default function VXMobileAppDemo() {
  const [showWarning, setShowWarning] = useState(true);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Store previous styles
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevOverscroll = document.body.style.overscrollBehavior;

    // Set mobile-friendly styles
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    // Restore on cleanup
    const restore = () => {
      document.body.style.overflow = prevBodyOverflow || '';
      document.documentElement.style.overflow = prevHtmlOverflow || '';
      document.body.style.overscrollBehavior = prevOverscroll || '';
    };

    const timer = setTimeout(restore, 1000);
    return () => {
      clearTimeout(timer);
      restore();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative">
      {/* Legacy Warning Banner */}
      {showWarning && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: '#78350F',
            color: '#FCD34D',
            padding: '12px 16px',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            fontSize: '13px',
          }}
        >
          <div style={{ flex: 1 }}>
            <strong>LEGACY DEMO</strong> - This is the old VX app shell. 
            <Link 
              href="/testing-grounds/vx2-mobile-app-demo"
              style={{ marginLeft: '8px', color: '#fff', textDecoration: 'underline' }}
            >
              Go to VX2 Mobile App (current)
            </Link>
          </div>
          <button 
            onClick={() => setShowWarning(false)}
            style={{ 
              background: 'rgba(0,0,0,0.2)', 
              border: 'none', 
              color: '#FCD34D', 
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* Header Info */}
      <div className="mb-4 text-center">
        <h1 className="text-white text-xl font-bold mb-2">
          Version X Mobile App (Legacy)
        </h1>
        <p className="text-gray-400 text-sm mb-2">
          Current version:{' '}
          <Link
            href="/testing-grounds/vx2-mobile-app-demo"
            className="text-green-400 hover:underline"
          >
            VX2 Mobile App
          </Link>
        </p>
        <div className="flex gap-4 justify-center text-xs">
          <span className="text-orange-400">VX Components: /components/vx/mobile/app/</span>
          <span className="text-green-400">VX2: /components/vx2/</span>
        </div>
      </div>

      {/* VX Development Banner */}
      <div
        className="px-4 py-1 text-center text-xs font-bold flex-shrink-0 mb-4 rounded"
        style={{ backgroundColor: '#78350F', color: '#FCD34D' }}
      >
        LEGACY - VX APP (use VX2 for active development)
      </div>

      {/* Phone Frame with App */}
      <MobileAppVXDemo />

      {/* Quick Links */}
      <div className="mt-4 flex gap-4">
        <Link
          href="/testing-grounds/vx2-mobile-app-demo"
          className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-600 text-sm font-bold"
        >
          VX2 Mobile App (Current)
        </Link>
        <Link
          href="/testing-grounds/vx2-draft-room"
          className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-600 text-sm"
        >
          VX2 Draft Room
        </Link>
      </div>
    </div>
  );
}

