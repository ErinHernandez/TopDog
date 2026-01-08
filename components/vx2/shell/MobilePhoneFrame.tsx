/**
 * MobilePhoneFrame - Pixel-Perfect Phone Frame for Desktop Preview
 * 
 * Provides accurate iPhone frames for previewing mobile UI on desktop.
 * Each device is rendered with its exact specifications:
 * - Dynamic Island devices: Floating pill 11pt from top
 * - Notch devices: Notch attached to top edge
 * - Home button devices: Classic design with top/bottom bezels
 */

import React from 'react';
import { PHONE_FRAME, DEVICE_PRESETS, DEFAULT_DEVICE } from '../core/constants';
import type { DevicePresetId, DevicePreset } from '../core/constants';

// ============================================================================
// TYPES
// ============================================================================

export interface MobilePhoneFrameProps {
  /** Content to render inside the phone */
  children: React.ReactNode;
  /** Device preset to use (overrides width/height) */
  devicePreset?: DevicePresetId;
  /** Override width (ignored if devicePreset is set) */
  width?: number;
  /** Override height (ignored if devicePreset is set) */
  height?: number;
  /** Additional className for outer container */
  className?: string;
  /** Whether to wrap in full-screen container (default: true) */
  fullScreen?: boolean;
  /** Label to show below the device */
  label?: string;
}

// ============================================================================
// DEVICE-SPECIFIC STATUS BAR CONFIGURATIONS
// Pixel-perfect specs based on Apple HIG and real device measurements
// ============================================================================

interface StatusBarConfig {
  timeFontSize: number;
  timeFontWeight: number;
  timeLetterSpacing: number;
  iconScale: number;
  iconGap: number;
  signalWidth: number;
  signalHeight: number;
  wifiWidth: number;
  wifiHeight: number;
  batteryWidth: number;
  batteryHeight: number;
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
}

const getStatusBarConfig = (device: DevicePreset): StatusBarConfig => {
  // iPhone SE / Home Button devices - Classic compact status bar
  if (device.homeIndicatorHeight === 0) {
    return {
      timeFontSize: 12,
      timeFontWeight: 600,
      timeLetterSpacing: 0,
      iconScale: 0.65,
      iconGap: 4,
      signalWidth: 16,
      signalHeight: 10,
      wifiWidth: 14,
      wifiHeight: 10,
      batteryWidth: 22,
      batteryHeight: 10,
      paddingLeft: 6,
      paddingRight: 6,
      paddingTop: 3,
    };
  }
  
  // Dynamic Island devices (iPhone 14 Pro+)
  if (device.hasDynamicIsland) {
    // iPhone 16 Pro series has slightly different sizing
    const is16Pro = device.width >= 402;
    return {
      timeFontSize: is16Pro ? 17 : 16,
      timeFontWeight: 600,
      timeLetterSpacing: -0.4,
      iconScale: is16Pro ? 1.0 : 0.95,
      iconGap: 6,
      signalWidth: 18,
      signalHeight: 12,
      wifiWidth: 16,
      wifiHeight: 12,
      batteryWidth: 27,
      batteryHeight: 13,
      paddingLeft: is16Pro ? 24 : 21,
      paddingRight: is16Pro ? 20 : 17,
      paddingTop: 0,
    };
  }
  
  // Notch devices - varies by notch size
  const isLargeNotch = (device.notchWidth || 162) > 180;
  const isLargeScreen = device.width >= 414; // iPhone 11/XR size
  
  return {
    timeFontSize: isLargeScreen ? 15 : 14,
    timeFontWeight: 600,
    timeLetterSpacing: -0.3,
    iconScale: isLargeNotch ? 0.75 : 0.85,
    iconGap: isLargeNotch ? 3 : 4,
    signalWidth: 17,
    signalHeight: 11,
    wifiWidth: 15,
    wifiHeight: 11,
    batteryWidth: 25,
    batteryHeight: 12,
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: isLargeScreen ? 14 : 12,
  };
};

// ============================================================================
// STATUS BAR ICONS - Device-aware sizing
// ============================================================================

interface IconProps {
  config: StatusBarConfig;
}

function SignalBars({ config }: IconProps) {
  const w = config.signalWidth;
  const h = config.signalHeight;
  const barW = w / 5.5;
  const gap = barW * 0.5;
  
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="#fff">
      <rect x={0} y={h * 0.64} width={barW} height={h * 0.36} rx={0.5} />
      <rect x={barW + gap} y={h * 0.36} width={barW} height={h * 0.64} rx={0.5} />
      <rect x={(barW + gap) * 2} y={h * 0.18} width={barW} height={h * 0.82} rx={0.5} />
      <rect x={(barW + gap) * 3} y={0} width={barW} height={h} rx={0.5} />
    </svg>
  );
}

function WifiIcon({ config }: IconProps) {
  const w = config.wifiWidth;
  const h = config.wifiHeight;
  
  return (
    <svg width={w} height={h} viewBox="0 0 16 12" fill="#fff">
      <path d="M8 2.4c2.7 0 5.2 1 7.1 2.8l-1.3 1.4C12.3 5 10.2 4 8 4S3.7 5 2.2 6.6L.9 5.2C2.8 3.4 5.3 2.4 8 2.4zm0 3.6c1.9 0 3.6.7 4.9 2l-1.3 1.3c-1-.9-2.2-1.4-3.6-1.4s-2.6.5-3.6 1.4L3.1 8c1.3-1.3 3-2 4.9-2zM8 9.2c1 0 1.8.4 2.4 1L8 12l-2.4-1.8c.6-.6 1.4-1 2.4-1z"/>
    </svg>
  );
}

function BatteryIcon({ config }: IconProps) {
  const w = config.batteryWidth;
  const h = config.batteryHeight;
  const borderW = h * 0.13;
  const capW = w * 0.06;
  const capH = h * 0.36;
  const innerPad = h * 0.15;
  
  return (
    <div style={{
      width: w,
      height: h,
      border: `${borderW}px solid rgba(255,255,255,0.35)`,
      borderRadius: h * 0.25,
      padding: innerPad,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
    }}>
      <div style={{ 
        width: '100%', 
        height: '100%', 
        backgroundColor: '#fff', 
        borderRadius: h * 0.1,
      }} />
      <div style={{
        position: 'absolute',
        right: -capW - borderW,
        top: '50%',
        transform: 'translateY(-50%)',
        width: capW,
        height: capH,
        backgroundColor: 'rgba(255,255,255,0.35)',
        borderRadius: `0 ${h * 0.08}px ${h * 0.08}px 0`,
      }} />
    </div>
  );
}

// ============================================================================
// DYNAMIC ISLAND STATUS BAR
// Renders status bar content around the floating Dynamic Island
// Pixel-perfect for iPhone 14 Pro, 15, 16, 16 Pro series
// ============================================================================

interface DynamicIslandStatusBarProps {
  device: DevicePreset;
  scale: number;
}

function DynamicIslandStatusBar({ device, scale }: DynamicIslandStatusBarProps): React.ReactElement {
  const config = getStatusBarConfig(device);
  const islandTop = device.islandTopOffset || 11;
  const islandWidth = device.notchWidth || 126;
  const islandHeight = device.notchHeight || 37;
  
  // iPhone 16 Pro series has slightly larger island offset
  const is16Pro = device.width >= 402;
  // Center content vertically with the middle of the Dynamic Island
  // Account for line-height by adding a small offset
  const contentTop = islandTop + (islandHeight / 2) - (config.timeFontSize / 2) + 1;
  
  return (
    <>
      {/* Dynamic Island - floating pill */}
      <div
        style={{
          position: 'absolute',
          top: islandTop,
          left: '50%',
          transform: 'translateX(-50%)',
          width: islandWidth,
          height: islandHeight,
          backgroundColor: '#000',
          borderRadius: islandHeight / 2,
          zIndex: 20000,
        }}
        aria-hidden="true"
      />
      
      {/* Status bar content positioned around island */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: device.statusBarHeight,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingTop: contentTop,
        paddingLeft: config.paddingLeft,
        paddingRight: config.paddingRight,
        zIndex: 19999,
      }}>
        {/* Time on left - SF Pro Display Semibold */}
        <span style={{
          fontSize: config.timeFontSize,
          fontWeight: config.timeFontWeight,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
          color: '#fff',
          letterSpacing: config.timeLetterSpacing,
        }}>
          9:41
        </span>
        
        {/* Icons on right */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: config.iconGap,
        }}>
          <SignalBars config={config} />
          <WifiIcon config={config} />
          <BatteryIcon config={config} />
        </div>
      </div>
    </>
  );
}

// ============================================================================
// NOTCH STATUS BAR
// Renders status bar with notch extending from top
// Pixel-perfect for iPhone 11, 12, 13, 14 (non-Pro) series
// Large notch: 209pt (iPhone 11, 12 series) - less ear space
// Small notch: 162pt (iPhone 13, 14 series) - more ear space
// ============================================================================

interface NotchStatusBarProps {
  device: DevicePreset;
  scale: number;
}

function NotchStatusBar({ device, scale }: NotchStatusBarProps): React.ReactElement {
  const config = getStatusBarConfig(device);
  const notchWidth = device.notchWidth || 162;
  const notchHeight = device.notchHeight || 34;
  const earWidth = (device.width - notchWidth) / 2;
  const isLargeNotch = notchWidth > 180;
  
  // Notch corner radius varies by model
  const notchRadius = isLargeNotch ? notchHeight * 0.5 : notchHeight * 0.6;
  
  return (
    <>
      {/* Notch - extends from top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: notchWidth,
          height: notchHeight,
          backgroundColor: '#000',
          borderRadius: `0 0 ${notchRadius}px ${notchRadius}px`,
          zIndex: 20000,
        }}
        aria-hidden="true"
      />
      
      {/* Left ear - time */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: earWidth,
        height: device.statusBarHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: config.paddingTop,
        zIndex: 19999,
      }}>
        <span style={{
          fontSize: config.timeFontSize,
          fontWeight: config.timeFontWeight,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
          color: '#fff',
          letterSpacing: config.timeLetterSpacing,
        }}>
          9:41
        </span>
      </div>
      
      {/* Right ear - icons */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: earWidth,
        height: device.statusBarHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: config.iconGap,
        paddingTop: config.paddingTop,
        zIndex: 19999,
      }}>
        <SignalBars config={config} />
        <WifiIcon config={config} />
        <BatteryIcon config={config} />
      </div>
    </>
  );
}

// ============================================================================
// HOME BUTTON STATUS BAR
// Classic iPhone status bar for iPhone SE / 8 / 7 / 6s
// 20pt status bar height, centered time, classic iOS layout
// ============================================================================

interface HomeButtonStatusBarProps {
  device: DevicePreset;
  scale: number;
}

function HomeButtonStatusBar({ device, scale }: HomeButtonStatusBarProps): React.ReactElement {
  const config = getStatusBarConfig(device);
  
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: device.statusBarHeight,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingLeft: config.paddingLeft,
      paddingRight: config.paddingRight,
      paddingTop: config.paddingTop,
      backgroundColor: 'transparent',
      zIndex: 19999,
    }}>
      {/* Left: Signal + Carrier */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 4,
        flex: 1,
      }}>
        <SignalBars config={config} />
        <span style={{ 
          fontSize: 12, 
          fontWeight: 400,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', 
          color: '#fff',
          letterSpacing: 0,
        }}>
          TopDog
        </span>
      </div>
      
      {/* Center: Time - classic format with AM/PM */}
      <span style={{
        fontSize: config.timeFontSize,
        fontWeight: config.timeFontWeight,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
        color: '#fff',
        letterSpacing: config.timeLetterSpacing,
      }}>
        9:41 AM
      </span>
      
      {/* Right: Battery percentage + icon */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-end',
        gap: 4,
        flex: 1,
      }}>
        <span style={{ 
          fontSize: 12, 
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          color: '#fff' 
        }}>
          100%
        </span>
        <BatteryIcon config={config} />
      </div>
    </div>
  );
}

// ============================================================================
// HOME INDICATOR
// ============================================================================

interface HomeIndicatorProps {
  device: DevicePreset;
}

function HomeIndicator({ device }: HomeIndicatorProps): React.ReactElement | null {
  // No home indicator for home button devices
  if (device.homeIndicatorHeight === 0) {
    return null;
  }
  
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 134,
        height: 5,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 3,
        zIndex: 20000,
      }}
      aria-hidden="true"
    />
  );
}

// ============================================================================
// HOME BUTTON
// Physical home button for iPhone SE
// ============================================================================

interface HomeButtonProps {
  device: DevicePreset;
  scale: number;
}

function HomeButton({ device, scale }: HomeButtonProps): React.ReactElement | null {
  // Only show for home button devices (no safe area bottom)
  if (device.homeIndicatorHeight !== 0) {
    return null;
  }
  
  const buttonSize = 44 * scale;
  const ringSize = 48 * scale;
  
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 8 * scale,
        left: '50%',
        transform: 'translateX(-50%)',
        width: ringSize,
        height: ringSize,
        borderRadius: '50%',
        border: `2px solid rgba(255,255,255,0.2)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: buttonSize,
          height: buttonSize,
          borderRadius: '50%',
          backgroundColor: 'rgba(0,0,0,0.3)',
        }}
      />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MobilePhoneFrame({
  children,
  devicePreset,
  width: customWidth,
  height: customHeight,
  className = '',
  fullScreen = true,
  label,
}: MobilePhoneFrameProps): React.ReactElement {
  
  // Get device configuration
  const device = devicePreset 
    ? DEVICE_PRESETS[devicePreset] 
    : null;
  
  const width = device?.width ?? customWidth ?? PHONE_FRAME.width;
  const height = device?.height ?? customHeight ?? PHONE_FRAME.height;
  const scale = device?.scale ?? 1;
  const screenRadius = device?.screenRadius ?? 47;
  const bezelWidth = device?.bezelWidth ?? PHONE_FRAME.framePadding;
  const isHomeButton = device ? device.homeIndicatorHeight === 0 : false;
  
  // Home button phones need extra space at bottom for the button
  const bottomBezel = isHomeButton ? 60 : bezelWidth;
  const topBezel = isHomeButton ? 24 : bezelWidth;
  
  const frameContent = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Phone bezel */}
      <div 
        style={{ 
          width: (width + (bezelWidth * 2)) * scale,
          height: (height + topBezel + bottomBezel) * scale,
          backgroundColor: '#000',
          borderRadius: (screenRadius + bezelWidth) * scale,
          padding: `${topBezel * scale}px ${bezelWidth * scale}px ${bottomBezel * scale}px`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255,255,255,0.1)',
          position: 'relative',
        }}
      >
        {/* Screen area */}
        <div 
          className="overflow-hidden relative"
          style={{ 
            width: width * scale,
            height: height * scale,
            borderRadius: screenRadius * scale,
            backgroundColor: '#101927',
          }}
        >
          {/* Inner scaled content */}
          <div
            style={{
              width: width,
              height: height,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              position: 'relative',
              backgroundColor: '#000',
            }}
          >
            {/* Safe area background (wr_blue pattern) */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: device?.statusBarHeight ?? 47,
                backgroundImage: 'url(/wr_blue.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center top',
                zIndex: 1,
              }}
            />
            
            {/* Device-specific status bar */}
            {device?.hasDynamicIsland && (
              <DynamicIslandStatusBar device={device} scale={scale} />
            )}
            {device?.hasNotch && (
              <NotchStatusBar device={device} scale={scale} />
            )}
            {device && !device.hasDynamicIsland && !device.hasNotch && (
              <HomeButtonStatusBar device={device} scale={scale} />
            )}
            
            {/* Fallback for no device preset */}
            {!device && (
              <div
                style={{
                  position: 'absolute',
                  top: 11,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 126,
                  height: 37,
                  backgroundColor: '#000',
                  borderRadius: 19,
                  zIndex: 20000,
                }}
                aria-hidden="true"
              />
            )}
            
            {/* Content wrapper - starts below safe area */}
            <div 
              style={{ 
                position: 'absolute',
                top: device?.statusBarHeight ?? 47,
                left: 0,
                right: 0,
                bottom: 0,
                overflow: 'hidden',
              }}
            >
              {children}
            </div>
            
            {/* Home indicator (Face ID devices) */}
            {device && <HomeIndicator device={device} />}
                  </div>
                </div>
        
        {/* Home button (Touch ID devices) */}
        {device && <HomeButton device={device} scale={scale} />}
              </div>
      
      {/* Device label */}
      {label && (
        <div style={{
          marginTop: 12,
          fontSize: 13,
          fontWeight: 600,
          color: '#9CA3AF',
          textAlign: 'center',
        }}>
          {label}
            </div>
          )}
        </div>
  );
  
  if (!fullScreen) {
    return frameContent;
  }
  
  return (
    <div 
      className={`min-h-screen flex items-center justify-center p-4 ${className}`}
      style={{ backgroundColor: '#0a0f1a' }}
    >
      {frameContent}
    </div>
  );
}
