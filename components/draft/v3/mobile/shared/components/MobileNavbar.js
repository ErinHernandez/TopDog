/**
 * Universal Mobile Navbar
 * 
 * Platform-agnostic mobile navbar that adapts to iOS/Android
 * Auto-detects platform and applies appropriate styling
 */

import React from 'react';
import { isIOS, isAndroid } from '../../../../../lib/deviceUtils';
import MobileNavbarApple from '../../apple/components/MobileNavbarApple';
// import MobileNavbarAndroid from '../../android/components/MobileNavbarAndroid'; // Future

export default function MobileNavbar(props) {
  // Auto-detect platform and use appropriate navbar
  if (isIOS()) {
    return <MobileNavbarApple {...props} />;
  }
  
  if (isAndroid()) {
    // Will return Android navbar when built
    return <MobileNavbarApple {...props} />; // Fallback to iOS for now
  }
  
  // Fallback to iOS-style for other platforms
  return <MobileNavbarApple {...props} />;
}

/**
 * Quick Mobile Navbar Components for Common Use Cases
 */

// Simple back navigation
export function MobileNavbarBack({ title = "TopDog", backUrl = "/" }) {
  return (
    <MobileNavbar 
      title={title}
      showBack={true}
      backUrl={backUrl}
    />
  );
}

// Menu navigation (for main pages)
export function MobileNavbarMenu({ title = "TopDog" }) {
  return (
    <MobileNavbar 
      title={title}
      showBack={false}
    />
  );
}

// Transparent overlay (for fullscreen experiences)
export function MobileNavbarTransparent({ title = "TopDog" }) {
  return (
    <MobileNavbar 
      title={title}
      showBack={true}
      transparent={true}
    />
  );
}
