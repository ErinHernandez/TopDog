/**
 * iPhoneStatusBar - Native iPhone Status Bar Component
 * 
 * Displays native iPhone status bar elements:
 * - Time
 * - Signal strength bars
 * - WiFi icon
 * - Battery icon with percentage
 */

import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface iPhoneStatusBarProps {
  /** Current time to display (defaults to current time) */
  time?: string;
  /** Battery percentage (0-100, defaults to 79) */
  battery?: number;
  /** Signal strength bars (0-4, defaults to 4) */
  signalBars?: number;
  /** Show WiFi icon (defaults to true) */
  showWifi?: boolean;
  /** Background color (should match header) */
  backgroundColor?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_BAR_HEIGHT = 44; // Standard iPhone status bar height

// ============================================================================
// COMPONENT
// ============================================================================

export default function iPhoneStatusBar({
  time,
  battery = 79,
  signalBars = 4,
  showWifi = true,
  backgroundColor,
}: iPhoneStatusBarProps): React.ReactElement {
  // Get current time if not provided (format: 7:44)
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };
  const displayTime = time || getCurrentTime();

  // Ensure battery is between 0-100
  const batteryLevel = Math.max(0, Math.min(100, battery));
  const signalLevel = Math.max(0, Math.min(4, signalBars));

  // Use wr_blue.png background to match header, or provided backgroundColor
  const statusBarStyle: React.CSSProperties = backgroundColor
    ? { backgroundColor }
    : {
        backgroundImage: 'url(/wr_blue.png)',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: 'cover',
        backgroundOrigin: 'border-box',
        backgroundClip: 'border-box',
      };

  return (
    <div
      className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 text-white text-sm font-medium"
      style={{
        height: `${STATUS_BAR_HEIGHT}px`,
        ...statusBarStyle,
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(16px, env(safe-area-inset-right, 0px))',
        zIndex: 1000,
      }}
      role="status"
      aria-label="Status bar"
    >
      {/* Left side - Time */}
      <div
        style={{
          fontSize: '15px',
          fontWeight: 600,
          letterSpacing: '-0.5px',
        }}
      >
        {displayTime}
      </div>

      {/* Right side - Signal, WiFi, Battery */}
      <div className="flex items-center gap-1" style={{ gap: '4px' }}>
        {/* Signal bars */}
        <div className="flex items-end" style={{ gap: '2px', height: '12px' }}>
          {[1, 2, 3, 4].map((bar) => (
            <div
              key={bar}
              style={{
                width: '3px',
                height: `${3 + (bar - 1) * 2}px`,
                backgroundColor: bar <= signalLevel ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)',
                borderRadius: '0.5px',
              }}
              aria-hidden="true"
            />
          ))}
        </div>

        {/* WiFi icon */}
        {showWifi && (
          <svg
            width="16"
            height="12"
            viewBox="0 0 16 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ marginLeft: '2px' }}
            aria-hidden="true"
          >
            <path
              d="M8 9C8.55228 9 9 9.44772 9 10C9 10.5523 8.55228 11 8 11C7.44772 11 7 10.5523 7 10C7 9.44772 7.44772 9 8 9Z"
              fill="#FFFFFF"
            />
            <path
              d="M8 0C5.23858 0 2.73509 1.14688 0.929688 3.04297L2.38086 4.49414C3.79053 3.08447 5.78491 2.25 8 2.25C10.2151 2.25 12.2095 3.08447 13.6191 4.49414L15.0703 3.04297C13.2649 1.14688 10.7614 0 8 0Z"
              fill="#FFFFFF"
            />
            <path
              d="M8 4.5C6.61929 4.5 5.39453 5.05469 4.56445 5.93164L6.01562 7.38281C6.52148 6.87793 7.2207 6.5 8 6.5C8.7793 6.5 9.47852 6.87793 9.98438 7.38281L11.4355 5.93164C10.6055 5.05469 9.38071 4.5 8 4.5Z"
              fill="#FFFFFF"
            />
          </svg>
        )}

        {/* Battery icon */}
        <div className="flex items-center" style={{ marginLeft: '4px', gap: '4px' }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '-0.3px',
            }}
          >
            {batteryLevel}
          </div>
          <svg
            width="24"
            height="12"
            viewBox="0 0 24 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Battery outline */}
            <rect
              x="1"
              y="2"
              width="20"
              height="8"
              rx="1.5"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              fill="none"
            />
            {/* Battery terminal */}
            <rect
              x="22"
              y="4"
              width="1"
              height="4"
              rx="0.5"
              fill="#FFFFFF"
            />
            {/* Battery fill */}
            <rect
              x="2.5"
              y="3.5"
              width={`${(batteryLevel / 100) * 18}px`}
              height="7"
              rx="1"
              fill={batteryLevel > 20 ? '#FFFFFF' : '#FF3B30'}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

