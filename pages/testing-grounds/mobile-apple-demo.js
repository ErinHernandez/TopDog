/**
 * Mobile Apple Demo Page
 * 
 * Test the iOS-optimized mobile draft room experience
 */

import React, { useEffect } from 'react';
import { DraftRoomAppleDemo } from '../../components/draft/v3/mobile/apple/DraftRoomApple';

export default function MobileAppleDemo() {
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
    <div className="min-h-screen h-screen bg-gray-100 overflow-hidden">
      <DraftRoomAppleDemo />
    </div>
  );
}
