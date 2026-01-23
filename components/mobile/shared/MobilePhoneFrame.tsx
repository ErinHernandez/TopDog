/**
 * MobilePhoneFrame - iPhone-style phone frame wrapper
 * 
 * Provides consistent mobile phone preview styling across all mobile pages.
 * Use this to wrap mobile page content for desktop preview.
 * 
 * @example
 * ```tsx
 * <MobilePhoneFrame>
 *   <div className="h-full bg-[#101927] text-white">
 *     Your content here
 *   </div>
 * </MobilePhoneFrame>
 * ```
 */

import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface MobilePhoneFrameProps {
  /** Content to display inside the phone frame */
  children: React.ReactNode;
  /** Frame width (default: "375px") */
  width?: string;
  /** Frame height (default: "812px") */
  height?: string;
  /** Additional CSS classes */
  className?: string;
}

export interface MobilePhoneContentProps {
  /** Content to display */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const MobilePhoneFrame: React.FC<MobilePhoneFrameProps> = ({ 
  children, 
  width = '375px', 
  height = '812px',
  className = '',
}): React.ReactElement => {
  return (
    <div className={`bg-gray-900 min-h-screen flex items-center justify-center p-4 ${className}`}>
      <div 
        className="bg-black rounded-3xl p-1"
        style={{ 
          width,
          height,
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        }}
      >
        <div 
          className="bg-black rounded-3xl overflow-hidden relative"
          style={{ width: '100%', height: '100%' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * MobilePhoneContent - Inner content wrapper with standard TopDog styling
 * 
 * Use inside MobilePhoneFrame for consistent app background and layout.
 */
export const MobilePhoneContent: React.FC<MobilePhoneContentProps> = ({ 
  children, 
  className = '' 
}): React.ReactElement => {
  return (
    <div className={`h-full bg-[#101927] text-white flex flex-col ${className}`}>
      {children}
    </div>
  );
};

export default MobilePhoneFrame;
