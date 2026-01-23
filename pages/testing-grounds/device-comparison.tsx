/**
 * Device Comparison Page
 * 
 * Shows multiple iPhone models side by side for testing how the UI
 * displays across different device sizes and form factors.
 * 
 * Devices shown:
 * - iPhone SE (no island, home button)
 * - iPhone 15 (standard, Dynamic Island)
 * - iPhone 16 Pro Max (large, Dynamic Island)
 */

import React, { useState } from 'react';
import type { JSX } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { TabNavigationProvider } from '../../components/vx2/core';
import { TabBarVX2, TabContentVX2 } from '../../components/vx2/navigation';
import MobilePhoneFrame from '../../components/vx2/shell/MobilePhoneFrame';
import { BG_COLORS, DEVICE_PRESETS } from '../../components/vx2/core/constants';
import type { TabId } from '../../components/vx2/core/types';

interface InnerShellProps {
  badgeOverrides?: Record<string, number>;
}

interface DeviceFrameProps {
  devicePreset: keyof typeof DEVICE_PRESETS;
  initialTab?: TabId;
}

interface Tab {
  id: string;
  label: string;
}

// ============================================================================
// INNER SHELL (Tab navigation content)
// ============================================================================

function InnerShell({ badgeOverrides }: InnerShellProps): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: BG_COLORS.primary,
        position: 'relative',
      }}
    >
      {/* Main content area */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <TabContentVX2 />
      </div>
      
      {/* Tab Bar */}
      <TabBarVX2 badgeOverrides={badgeOverrides} />
    </div>
  );
}

// ============================================================================
// DEVICE FRAME WRAPPER
// ============================================================================

function DeviceFrame({ devicePreset, initialTab = 'lobby' }: DeviceFrameProps): JSX.Element {
  return (
    <TabNavigationProvider initialTab={initialTab}>
      <MobilePhoneFrame>
        <InnerShell badgeOverrides={{ 'live-drafts': 3 }} />
      </MobilePhoneFrame>
    </TabNavigationProvider>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

function DeviceComparisonPage(): JSX.Element {
  const [selectedTab, setSelectedTab] = useState<TabId>('lobby');
  
  const tabs: Tab[] = [
    { id: 'lobby', label: 'Lobby' },
    { id: 'live-drafts', label: 'Live Drafts' },
    { id: 'my-teams', label: 'My Teams' },
    { id: 'account', label: 'Account' },
  ];

  return (
    <>
      <Head>
        <title>Device Comparison | TopDog Dev</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0f1a',
        padding: '24px',
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          <h1 style={{
            color: '#fff',
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '8px',
          }}>
            iPhone Device Comparison
          </h1>
          <p style={{
            color: '#6B7280',
            fontSize: '14px',
          }}>
            Compare how the UI displays across different iPhone models
          </p>
        </div>
        
        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '32px',
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as TabId)}
              style={{
                padding: '8px 16px',
                backgroundColor: selectedTab === tab.id ? '#3B82F6' : '#1F2937',
                color: selectedTab === tab.id ? '#fff' : '#9CA3AF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Device Grid */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: '40px',
          flexWrap: 'wrap',
        }}>
          {/* iPhone SE - Home Button */}
          <DeviceFrame 
            key={`se-${selectedTab}`}
            devicePreset="iphone-se" 
            initialTab={selectedTab}
          />
          
          {/* iPhone 13 - Notch */}
          <DeviceFrame 
            key={`13-${selectedTab}`}
            devicePreset="iphone-13" 
            initialTab={selectedTab}
          />
          
          {/* iPhone 14 Pro Max - Dynamic Island Large */}
          <DeviceFrame 
            key={`14pm-${selectedTab}`}
            devicePreset="iphone-14-pro-max" 
            initialTab={selectedTab}
          />
        </div>
        
        {/* Device Info Cards */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          marginTop: '48px',
          flexWrap: 'wrap',
        }}>
          {Object.values(DEVICE_PRESETS).map(device => (
            <div
              key={device.id}
              style={{
                backgroundColor: '#1F2937',
                borderRadius: '12px',
                padding: '16px 20px',
                minWidth: '200px',
              }}
            >
              <h3 style={{
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '8px',
              }}>
                {device.name}
              </h3>
              <div style={{ fontSize: '12px', color: '#9CA3AF', lineHeight: 1.6 }}>
                <div>Screen: {device.width} x {device.height}</div>
                <div>
                  Type: {device.hasDynamicIsland ? 'Dynamic Island' : device.hasNotch ? 'Notch' : 'Home Button'}
                </div>
                <div>Status Bar: {device.statusBarHeight}px</div>
                <div>Home Area: {device.homeIndicatorHeight || 0}px</div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Back Link */}
        <div style={{
          textAlign: 'center',
          marginTop: '48px',
        }}>
          <Link
            href="/testing-grounds/vx2-mobile-app-demo"
            style={{
              color: '#3B82F6',
              fontSize: '14px',
              textDecoration: 'none',
            }}
          >
            Back to VX2 App Demo
          </Link>
        </div>
      </div>
    </>
  );
}

export default DeviceComparisonPage;
