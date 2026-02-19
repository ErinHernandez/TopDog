/**
 * ProfileTab - Mobile Profile Settings
 * 
 * Extracted from pages/mobile.js for maintainability
 * Shows user avatar customization box and profile menu options
 */

import { useRouter } from 'next/router';
import React from 'react';

import { useUser } from '../../../lib/userContext';

export default function ProfileTab() {
  const router = useRouter();
  const { user } = useUser();

  const menuItems = [
    {
      label: 'Payment Methods',
      path: '/mobile-payment',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    {
      label: 'Rankings',
      path: '/mobile-rankings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )
    },
    {
      label: 'Customization',
      path: '/mobile-profile-customization',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5v12a2 2 0 002 2 2 2 0 002-2V3zM17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2m-2-4h2m-2-4h2m-2 8h2" />
        </svg>
      )
    },
    {
      label: 'Autodraft Limits',
      path: '/autodraft-limits',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )
    },
    {
      label: 'Profile',
      path: '/profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )
    },
    {
      label: 'Deposit History',
      path: '/mobile-deposit-history',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    }
  ];

  return (
    <div className="flex-1 flex flex-col px-6 py-8">
      <div className="text-center mb-8">
        {/* Custom Player Box - Future Background Customization */}
        <div className="mb-4 flex justify-center">
          <div 
            className="flex-shrink-0 text-sm font-medium flex flex-col border-6"
            style={{ 
              width: '120px',
              height: '140px',
              borderWidth: '6px', 
              position: 'relative', 
              borderColor: '#ef4444',
              borderTopWidth: '32px', 
              backgroundColor: '#18181a', 
              borderRadius: '11px', 
              overflow: 'visible'
            }}
          >
            {/* Username in border area */}
            <div 
              className="absolute left-0 right-0 font-bold text-center truncate whitespace-nowrap overflow-hidden"
              style={{ 
                fontSize: '12px', 
                color: 'black',
                backgroundColor: 'transparent',
                zIndex: 9999,
                padding: '2px',
                top: '-16px', 
                transform: 'translateY(-50%)',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                maxWidth: '100%',
                width: '100%',
                textTransform: 'uppercase'
              }}
            >
              {user?.displayName || user?.email || 'Username'}
            </div>
            
            {/* Empty content area - ready for customization */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-gray-500 text-xs text-center">
                Background
                <br />
                Customization
                <br />
                Coming Soon
              </div>
            </div>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Profile</h2>
        <p className="text-gray-400">Manage your account settings</p>
      </div>
      
      {/* Menu Options */}
      <div className="space-y-4">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-between"
          >
            <span>{item.label}</span>
            {item.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

