/**
 * Mobile Apple Demo Page - LEGACY/DEPRECATED
 * 
 * This is the OLD iOS-optimized mobile draft room experience.
 * 
 * IMPORTANT: This demo is preserved for reference only.
 * All active development now happens in VX2:
 * - /testing-grounds/vx2-mobile-app-demo (mobile app)
 * - /testing-grounds/vx2-draft-room (draft room)
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DraftRoomAppleDemo } from '../../components/draft/v3/mobile/apple/DraftRoomApple';
import withDevAccess from '../../components/withDevAccess';

function MobileAppleDemo() {
  const [showWarning, setShowWarning] = useState(true);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevOverscroll = document.body.style.overscrollBehavior;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

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
    <div className="min-h-screen h-screen bg-gray-100 overflow-hidden relative">
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
            <strong>LEGACY DEMO</strong> - This is the old mobile demo. 
            <Link 
              href="/testing-grounds/vx2-mobile-app-demo"
              style={{ marginLeft: '8px', color: '#fff', textDecoration: 'underline' }}
            >
              Go to VX2 (current)
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
      <DraftRoomAppleDemo />
    </div>
  );
}

// Protect with dev access - requires developer authentication
export default withDevAccess(MobileAppleDemo);
