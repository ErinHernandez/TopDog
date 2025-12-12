/**
 * VX Mobile App Demo Page
 * 
 * Testing page for the VX mobile app (outside draft room)
 * Original preserved at: /mobile
 */

import React, { useEffect } from 'react';
import Link from 'next/link';
import { MobileAppVXDemo } from '../../components/vx/mobile/app';

export default function VXMobileAppDemo() {
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
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      {/* Header Info */}
      <div className="mb-4 text-center">
        <h1 className="text-white text-xl font-bold mb-2">
          Version X Mobile App Development
        </h1>
        <p className="text-gray-400 text-sm mb-2">
          Original preserved at:{' '}
          <Link
            href="/mobile"
            className="text-blue-400 hover:underline"
          >
            /mobile
          </Link>
        </p>
        <div className="flex gap-4 justify-center text-xs">
          <span className="text-purple-400">VX Components: /components/vx/mobile/app/</span>
          <span className="text-yellow-400">Original: /components/mobile/</span>
        </div>
      </div>

      {/* VX Development Banner */}
      <div
        className="px-4 py-1 text-center text-xs font-bold flex-shrink-0 mb-4 rounded"
        style={{ backgroundColor: '#7C3AED', color: 'white' }}
      >
        VX APP DEV - Original: /mobile
      </div>

      {/* Phone Frame with App */}
      <MobileAppVXDemo />

      {/* Quick Links */}
      <div className="mt-4 flex gap-4">
        <Link
          href="/mobile"
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
        >
          View Original
        </Link>
        <Link
          href="/testing-grounds/vx-mobile-demo"
          className="px-4 py-2 bg-teal-700 text-white rounded hover:bg-teal-600 text-sm"
        >
          VX Draft Room
        </Link>
        <a
          href="/docs/VERSION_X_ARCHITECTURE_PLAN.md"
          className="px-4 py-2 bg-purple-700 text-white rounded hover:bg-purple-600 text-sm"
          target="_blank"
        >
          VX Plan
        </a>
      </div>
    </div>
  );
}

