/**
 * Mobile Homepage
 * 
 * REDIRECTS TO VX2 - The old mobile components are deprecated.
 * All new development happens in /components/vx2/
 * 
 * To access the legacy mobile demo (for reference only):
 * /testing-grounds/mobile-apple-demo
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function MobileHomepage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to VX2 mobile app demo
    router.replace('/testing-grounds/vx2-mobile-app-demo');
  }, [router]);
  
  // Show loading state while redirecting
  return (
    <div 
      style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#101927',
        color: '#fff',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '14px', opacity: 0.7 }}>Redirecting to VX2...</div>
      </div>
    </div>
  );
}
