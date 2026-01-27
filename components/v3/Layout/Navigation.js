/**
 * Navigation - V3 Unified Navigation Component
 * Consistent navigation across desktop and mobile
 */

import React from 'react';
import Link from 'next/link';
import { theme } from '../../../lib/theme';
import { createScopedLogger } from '../../../lib/clientLogger';

const logger = createScopedLogger('[Navigation]');

const Navigation = ({ activeTab = null }) => {
  const navigationItems = [
    { id: 'lobby', label: 'Draft Lobby', href: '/' },
    { id: 'teams', label: 'My Teams', href: '/my-teams' },
    { id: 'exposure', label: 'Exposure Report', href: '/exposure' },
    { id: 'rankings', label: 'Rankings', href: '/rankings' },
    { id: 'profile', label: 'Profile', href: '/profile' }
  ];

  const getLinkStyles = (isActive) => ({
    fontSize: '1.07rem',
    WebkitTextStroke: '0.12px #18181b',
    background: 'url(/wr_blue.png) no-repeat center center',
    backgroundSize: 'cover',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    borderBottom: isActive ? '2px solid #F59E0B' : 'none',
    paddingBottom: '4px'
  });

  return (
    <section 
      className="bg-white border-b border-gray-200 zoom-resistant"
      style={{ 
        width: '100vw', 
        height: '53.5px', 
        overflow: 'hidden', 
        margin: '0', 
        padding: '0',
        transform: 'translateZ(0)'
      }}
    >
      <div className="w-full px-4 zoom-resistant">
        <div 
          className="flex justify-between items-center zoom-resistant"
          style={{ 
            marginTop: '0px', 
            marginBottom: '0px', 
            height: '53.5px', 
            width: '100%',
            transform: 'translateZ(0)'
          }}
        >
          {/* Navigation Links */}
          <div className="flex space-x-8" style={{ marginTop: '2px' }}>
            {navigationItems.map((item) => {
              const isActive = activeTab === item.id;
              
              return isActive ? (
                <span
                  key={item.id}
                  className="font-medium text-base"
                  style={getLinkStyles(true)}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  key={item.id}
                  href={item.href}
                  className="font-medium text-base transition-colors hover:opacity-80"
                  style={getLinkStyles(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* User Balance Display */}
            <div className="text-sm text-gray-600 font-medium">
              Balance: <span className="text-green-600 font-semibold">$0.00</span>
            </div>
            
            {/* Deposit Button */}
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
              onClick={() => {
                // TODO: Implement deposit modal opening
                logger.debug('Deposit button clicked - modal not yet implemented');
              }}
            >
              Deposit
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Navigation;
