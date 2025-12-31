/**
 * VX2 Mobile App Demo Page
 * 
 * Testing grounds for the enterprise-grade VX2 mobile app framework.
 * This page showcases the new tab navigation system.
 * 
 * On mobile devices (iPhone/iPad), shows fullscreen app experience.
 * On desktop, shows phone frame preview with multi-device selector.
 */

import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AppShellVX2 } from '../../components/vx2';
import { useIsMobileDevice } from '../../hooks/useIsMobileDevice';
import { DEVICE_PRESETS, ALL_DEVICES } from '../../components/vx2/core/constants';

const DEVICE_STORAGE_KEY = 'vx2-demo-devices';
const PANEL_MINIMIZED_KEY = 'vx2-demo-panel-minimized';

export default function VX2MobileAppDemo() {
  const router = useRouter();
  const { isMobile, isLoaded } = useIsMobileDevice();
  
  // Multiple device presets state (persisted to localStorage)
  const [selectedDevices, setSelectedDevices] = React.useState(['iphone-14-pro-max']);
  
  // Panel minimized state (persisted to localStorage)
  const [isMinimized, setIsMinimized] = React.useState(false);
  
  // Load saved device preferences and panel state
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(DEVICE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(d => DEVICE_PRESETS[d])) {
          setSelectedDevices(parsed);
        }
      }
      
      const minimized = localStorage.getItem(PANEL_MINIMIZED_KEY);
      if (minimized === 'true') {
        setIsMinimized(true);
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);
  
  // Toggle minimized state
  const toggleMinimized = () => {
    setIsMinimized(prev => {
      const newValue = !prev;
      try {
        localStorage.setItem(PANEL_MINIMIZED_KEY, String(newValue));
      } catch (e) {
        // Ignore
      }
      return newValue;
    });
  };
  
  // Save device preferences when changed
  const saveDevices = (devices) => {
    try {
      localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(devices));
    } catch (e) {
      // Ignore localStorage errors
    }
  };
  
  // Toggle a device on/off
  const handleDeviceToggle = (deviceId) => {
    setSelectedDevices(prev => {
      let newDevices;
      if (prev.includes(deviceId)) {
        // Remove device (but keep at least one)
        if (prev.length > 1) {
          newDevices = prev.filter(d => d !== deviceId);
        } else {
          return prev; // Can't remove the last device
        }
      } else {
        // Add device
        newDevices = [...prev, deviceId];
      }
      saveDevices(newDevices);
      return newDevices;
    });
  };
  
  // Select only one device
  const handleSelectOnly = (deviceId) => {
    setSelectedDevices([deviceId]);
    saveDevices([deviceId]);
  };
  
  // Select all devices
  const handleSelectAll = () => {
    const allDevices = Object.keys(DEVICE_PRESETS);
    setSelectedDevices(allDevices);
    saveDevices(allDevices);
  };
  
  // Determine initial tab:
  // - If coming from draft room (session flag), go to live-drafts
  // - Otherwise, always default to lobby (even on refresh)
  const [initialTab, setInitialTab] = React.useState('lobby');
  
  React.useEffect(() => {
    if (!router.isReady || typeof window === 'undefined') return;
    
    // Check if user just came from draft room
    const cameFromDraft = sessionStorage.getItem('topdog_came_from_draft');
    
    if (cameFromDraft) {
      // Clear the flag so refresh goes to lobby
      sessionStorage.removeItem('topdog_came_from_draft');
      setInitialTab('live-drafts');
    }
    
    // Clean up URL query param if present
    if (router.query.tab) {
      router.replace('/testing-grounds/vx2-mobile-app-demo', undefined, { shallow: true });
    }
  }, [router.isReady, router.query.tab]);
  
  // Track tab changes for debugging
  const handleTabChange = (fromTab, toTab) => {
    console.log(`[VX2] Tab changed: ${fromTab || 'initial'} -> ${toTab}`);
  };

  // Show nothing until we've detected device type AND router is ready to prevent flash
  if (!isLoaded || !router.isReady) {
    return (
      <div 
        style={{ 
          minHeight: '100vh', 
          backgroundColor: '#101927',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ color: '#6B7280', fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>VX2 Mobile App Demo | TopDog</title>
        <meta name="description" content="Enterprise-grade mobile app framework demo" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>

      {/* 
        On mobile: fullscreen app (no phone frame)
        On desktop: phone frame preview 
      */}
      {isMobile ? (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          backgroundColor: '#101927',
          overflow: 'hidden',
        }}>
          <AppShellVX2
            initialTab={initialTab}
            showPhoneFrame={false}
            onTabChange={handleTabChange}
            badgeOverrides={{
              'live-drafts': 3,
            }}
          />
        </div>
      ) : (
        <div style={{ 
          position: 'relative', 
          minHeight: '100vh',
          backgroundColor: '#0a0f1a',
        }}>
          {/* Device Selector - Fixed position */}
          <div
            style={{
              position: 'fixed',
              top: 16,
              left: 16,
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#1F2937',
              padding: isMinimized ? '8px 12px' : 16,
              borderRadius: 12,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            {/* Header - always visible */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}>
              {/* Minimize/Expand button */}
              <button
                onClick={toggleMinimized}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9CA3AF',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 4,
                }}
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                <svg 
                  width="14" 
                  height="14" 
                  viewBox="0 0 14 14" 
                  fill="none"
                  style={{
                    transform: isMinimized ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <path 
                    d="M3 5L7 9L11 5" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  flex: 1,
                }}
              >
                Devices ({selectedDevices.length})
              </label>
              
              {!isMinimized && (
                <button
                  onClick={handleSelectAll}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3B82F6',
                    fontSize: 11,
                    cursor: 'pointer',
                    padding: '2px 4px',
                  }}
                >
                  All
                </button>
              )}
            </div>
            
            {/* Device checkboxes - only visible when expanded */}
            {!isMinimized && (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 8,
                marginTop: 12,
              }}>
                {/* Header */}
                <div style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: 4,
                }}>
                  Unique Configurations
                </div>
                
                {ALL_DEVICES.map((deviceId) => {
                  const device = DEVICE_PRESETS[deviceId];
                  const isSelected = selectedDevices.includes(device.id);
                  const isOnly = selectedDevices.length === 1 && isSelected;
                  
                  return (
                    <div
                      key={device.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => handleDeviceToggle(device.id)}
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          border: isSelected ? 'none' : '2px solid #4B5563',
                          backgroundColor: isSelected ? '#3B82F6' : 'transparent',
                          cursor: isOnly ? 'not-allowed' : 'pointer',
                          opacity: isOnly ? 0.6 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          padding: 0,
                        }}
                        disabled={isOnly}
                      >
                        {isSelected && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                      
                      {/* Device name */}
                      <button
                        onClick={() => handleSelectOnly(device.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: isSelected ? '#fff' : '#9CA3AF',
                          fontSize: 11,
                          cursor: 'pointer',
                          padding: '2px 0',
                          textAlign: 'left',
                          flex: 1,
                        }}
                        title={`Show only ${device.name}`}
                      >
                        {device.name}
                      </button>
                      
                      {/* Device type indicator */}
                      <span style={{
                        fontSize: 9,
                        color: device.hasDynamicIsland ? '#10B981' : device.hasNotch ? '#F59E0B' : '#6B7280',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}>
                        {device.hasDynamicIsland ? 'DI' : device.hasNotch ? 'N' : 'HB'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Device frames container - horizontal scroll */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 24,
            padding: '24px',
            paddingLeft: selectedDevices.length > 1 ? '240px' : '24px',
            minHeight: '100vh',
            overflowX: 'auto',
            overflowY: 'hidden',
            flexWrap: 'nowrap',
            scrollBehavior: 'smooth',
            paddingBottom: 40,
          }}>
            {ALL_DEVICES.filter(id => selectedDevices.includes(id)).map((deviceId) => (
              <div 
                key={deviceId} 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <AppShellVX2
                  key={`${deviceId}-${initialTab}`}
                  initialTab={initialTab}
                  showPhoneFrame={true}
                  devicePreset={deviceId}
                  onTabChange={handleTabChange}
                  badgeOverrides={{
                    'live-drafts': 3,
                  }}
                />
                {/* Device label */}
                {selectedDevices.length > 1 && (
                  <div style={{
                    marginTop: 12,
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#6B7280',
                    textAlign: 'center',
                  }}>
                    {DEVICE_PRESETS[deviceId]?.name}
                    <span style={{ 
                      display: 'block', 
                      fontSize: 10, 
                      fontWeight: 400,
                      marginTop: 2,
                    }}>
                      {DEVICE_PRESETS[deviceId]?.width}x{DEVICE_PRESETS[deviceId]?.height}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

