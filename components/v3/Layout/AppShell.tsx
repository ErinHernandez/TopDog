/**
 * AppShell - V3 Main Application Layout Component
 * 
 * Provides consistent layout structure across all pages.
 * Includes navigation, subheaders, and content container.
 * 
 * @example
 * ```tsx
 * <AppShell title="My Page" showSubHeader={true}>
 *   <YourContent />
 * </AppShell>
 * ```
 */

import React from 'react';
import Head from 'next/head';
import Navigation from './Navigation';
import SubHeader from './SubHeader';
import { theme } from '../../../lib/theme';

// ============================================================================
// TYPES
// ============================================================================

export interface AppShellProps {
  /** Page content */
  children: React.ReactNode;
  /** Page title (default: "TopDog Fantasy Sports") */
  title?: string;
  /** Page description (default: "Premium fantasy sports platform") */
  description?: string;
  /** Whether to show subheader bars (default: true) */
  showSubHeader?: boolean;
  /** Active navigation tab (null or undefined for none) */
  activeTab?: string | null;
  /** Additional CSS classes */
  className?: string;
  /** Maximum width of content container (default: "1200px") */
  containerMaxWidth?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const AppShell: React.FC<AppShellProps> = ({ 
  children, 
  title = 'TopDog Fantasy Sports', 
  description = 'Premium fantasy sports platform',
  showSubHeader = true,
  activeTab = null,
  className = '',
  containerMaxWidth = '1200px',
}): React.ReactElement => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Preload critical assets */}
        <link rel="preload" href="/wr_blue.png" as="image" type="image/png" fetchPriority="high" />
        <link rel="preload" href="/logo.png" as="image" type="image/png" />
        
        {/* Performance optimizations */}
        <meta name="theme-color" content={theme.colors.primary[600]} />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      </Head>

      <div 
        className={`min-h-screen text-white overflow-x-auto ${className}`}
        style={{ 
          background: 'url(/wr_blue.png) repeat-y',
          backgroundSize: '200% 100%',
          backgroundPosition: 'center center',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Top Blue Bar */}
        {showSubHeader && <SubHeader position="top" />}
        
        {/* Navigation */}
        <Navigation activeTab={activeTab ?? null} />
        
        {/* Bottom Blue Bar */}
        {showSubHeader && <SubHeader position="bottom" />}
        
        {/* Main Content */}
        <main className="relative">
          <div 
            className="container mx-auto px-4 pt-8"
            style={{ maxWidth: containerMaxWidth }}
          >
            {children}
          </div>
        </main>
      </div>
    </>
  );
};

export default AppShell;
