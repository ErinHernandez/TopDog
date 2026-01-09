import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link'
import { useRouter } from 'next/router';
import { getAuth } from 'firebase/auth';
import { useUser } from '../lib/userContext';
import { DevLink, DevButton, DevSection, DevText } from '../lib/devLinking';

export default function Navbar() {
  const router = useRouter();
  const { user, userBalance } = useUser();
  
  // All hooks must be called before any early returns
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [showDevDropdown, setShowDevDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const devDropdownRef = useRef(null)
  const [draftAnimation, setDraftAnimation] = useState({ shouldAnimate: false, isPulsing: false })
  const [hasStartedPulsing, setHasStartedPulsing] = useState(false)


  // Listen for draft animation events
  useEffect(() => {
    const handleDraftAnimation = (event) => {
      setDraftAnimation(event.detail);
    };

    window.addEventListener('draftAnimation', handleDraftAnimation);
    return () => window.removeEventListener('draftAnimation', handleDraftAnimation);
  }, [])

  // Track when pulsing has actually started
  useEffect(() => {
    if (draftAnimation.shouldAnimate && draftAnimation.isPulsing) {
      setHasStartedPulsing(true);
    }
    if (!draftAnimation.shouldAnimate) {
      setHasStartedPulsing(false);
    }
  }, [draftAnimation])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false)
      }
      if (devDropdownRef.current && !devDropdownRef.current.contains(event.target)) {
        setShowDevDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Don't render navbar on any mobile pages - AFTER all hooks
  if (router.pathname.startsWith('/mobile')) {
    return null;
  }

  // Button label logic
  const balance = userBalance?.balance || 0
  const depositButtonLabel = balance > 0
    ? `$${balance.toFixed(2)}`
    : 'Deposit'

  const handleLogoClick = (e) => {
    e.preventDefault();
    setShowDevDropdown(!showDevDropdown);
  };

  return (
    <>
      <header 
        className="w-full z-50 zoom-resistant" 
        style={{ 
          background: 'url(/wr_blue.png) no-repeat center center',
          backgroundSize: 'cover',
          transform: (() => {
            if (draftAnimation.shouldEngorge) {
              return 'rotate(0deg) translateZ(0)'; // Stay stationary during engorgement (15s-11s)
            } else if (hasStartedPulsing) {
              if (draftAnimation.isPulsing) {
                return 'rotate(8deg) translateZ(0)'; // Pulse to max rotation (navbar bottom edge)
              } else {
                return 'rotate(5deg) translateZ(0)'; // Smaller baseline rotation, pulses up to 8deg
              }
            } else {
              return 'rotate(0deg) translateZ(0)'; // Normal state
            }
          })(),
          transformOrigin: 'bottom right', // Rotate around bottom right corner (gravity effect)
          transition: draftAnimation.shouldEngorge ? 'none' : (hasStartedPulsing ? 'transform 0.5s ease-in-out' : 'none'),
          position: 'relative',
          minWidth: '100vw',
          overflow: 'visible',
          // Extend background behind status bar using safe area inset (reduced for tighter spacing)
          paddingTop: 'max(0px, calc(env(safe-area-inset-top, 0px) - 20px))',
        }}
      >
        <nav className="shadow-lg text-black zoom-resistant" style={{ background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', width: '100vw', marginLeft: '0', transform: 'translateZ(0)', position: 'relative', minWidth: '100vw', overflow: 'visible' }}>
        <div className="container mx-auto zoom-resistant" style={{ overflow: 'visible', maxWidth: '100vw', paddingLeft: '20px', paddingRight: '20px', transform: 'translateZ(0)', position: 'relative', minWidth: '100%', width: '100%' }}>
          <div className="flex justify-between items-center h-16 min-w-0 zoom-resistant" style={{ position: 'relative', minWidth: '100%', overflow: 'visible', width: '100%' }}>
            <div className="flex items-center flex-shrink-0" style={{ marginLeft: '16px', paddingLeft: '16px', position: 'relative', minWidth: 'fit-content', overflow: 'visible' }}>
              <div className="relative" ref={devDropdownRef}>
                <Link 
                  href="/" 
                  className="flex-shrink-0 flex items-center" 
                  style={{ 
                    paddingLeft: '0px', 
                    paddingRight: '0px', 
                    paddingTop: '7px', 
                    paddingBottom: '7px',
                    minWidth: 'fit-content',
                    marginLeft: '0px',
                    position: 'relative',
                    overflow: 'visible'
                  }}
                  onClick={handleLogoClick}
                >
                  <img 
                    src="/logo.png" 
                    alt="TopDog.dog Logo" 
                    className="h-12 sm:h-14 md:h-16 lg:h-20 w-auto" 
                    style={{
                      cursor: 'pointer',
                      filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))',
                      transition: 'all 0.3s ease',
                      minHeight: '48px',
                      maxHeight: '80px',
                      position: 'relative',
                      overflow: 'visible',
                      marginTop: '2px'
                    }}
                  />
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      marginLeft: '8px',
                      marginRight: '4px',
                      minWidth: '24px',
                      width: '24px',
                      height: '24px',
                      flexShrink: 0
                    }}
                  >
                    <path
                      d="M12 2L3 7V10C3 15.55 6.84 20.74 12 22C17.16 20.74 21 15.55 21 10V7L12 2Z"
                      fill="#FBBF25"
                      stroke="#18181b"
                      strokeWidth="1"
                    />
                    <path
                      d="M12 2V8M12 8L8 10M12 8L16 10"
                      stroke="#18181b"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M9 12L15 12"
                      stroke="#18181b"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span 
                    className="ml-2 sm:ml-4 md:ml-6 lg:ml-8 text-xl font-medium hidden sm:inline" 
                    style={{ 
                      fontSize: '1.5rem', 
                      WebkitTextStroke: '0.12px #18181b', 
                      color: '#ffffff',
                      whiteSpace: 'nowrap',
                      position: 'relative',
                      overflow: 'visible'
                    }}
                  >
                    TopDog.dog
                  </span>
                </Link>
                
                {/* Dev Dropdown */}
                {showDevDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-72 sm:w-80 rounded-lg shadow-xl py-2 z-50 max-h-96 overflow-y-auto" style={{ background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', border: '2px solid #59c5bf' }}>
                    <div className="px-4 py-2 border-b" style={{ borderColor: '#59c5bf' }}>
                      <h3 className="text-sm font-semibold" style={{ background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Development Tools</h3>
                    </div>
                    
                    <div className="py-1">
                      <Link href="/dev-access" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
                        🔐 Dev Access
                      </Link>
                      <Link href="/tournaments/dev" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
                        🏆 Dev Tournaments
                      </Link>
                      <Link href="/dev-linking-demo" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
                        🔗 Dev Linking Demo
                      </Link>
                      <Link href="/globe-cursor-demo" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
                        🌍 Globe Cursor Demo
                      </Link>
                      <Link href="/test-cursor" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
                        🧪 Cursor Test
                      </Link>
                    </div>

                    {/* Public Pages Section */}
                    <div className="px-4 py-2 border-t" style={{ borderColor: '#59c5bf' }}>
                      <h4 className="text-xs font-semibold mb-2" style={{ background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Public Pages</h4>
                      <div className="space-y-1">
                        <Link href="/" className="block px-4 py-1 text-xs text-gray-300 hover:bg-gray-800 hover:text-white">
                          🏠 Home
                        </Link>
                        <Link href="/tournaments" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Tournaments
                        </Link>
                        <Link href="/tournaments/topdog" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          TopDog Tournaments
                        </Link>
                        <Link href="/leaderboard" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Leaderboard
                        </Link>
                        <Link href="/rankings" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Rankings
                        </Link>
                        <Link href="/statistics" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Statistics
                        </Link>
                        <Link href="/rules" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Rules
                        </Link>
                        <Link href="/my-teams" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          My Teams
                        </Link>
                        <Link href="/exposure" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Exposure Report
                        </Link>
                        <Link href="/deposit" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Deposit
                        </Link>
                        <Link href="/deposit-history" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Deposit History
                        </Link>
                        <Link href="/profile" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Profile
                        </Link>
                        <Link href="/terms" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Terms
                        </Link>
                      </div>
                    </div>

                    {/* Research Section */}
                    <div className="px-4 py-2 border-t" style={{ borderColor: '#59c5bf' }}>
                      <h4 className="text-xs font-semibold mb-2" style={{ background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Research</h4>
                      <div className="space-y-1">
                        <Link href="/unregulated-analysis" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Unregulated Analysis
                        </Link>
                        <Link href="/location-research" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Location Research
                        </Link>
                        <Link href="/location-data-2.0" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Location Data 2.0
                        </Link>
                        <Link href="/ireland" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Ireland
                        </Link>
                      </div>
                    </div>

                    {/* Dev/Admin Pages Section */}
                    <div className="px-4 py-2 border-t" style={{ borderColor: '#59c5bf' }}>
                      <h4 className="text-xs font-semibold mb-2" style={{ background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Dev/Admin Pages</h4>
                      <div className="space-y-1">
                        <Link href="/admin/dashboard" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Admin Dashboard
                        </Link>
                        <Link href="/admin/compliance-manager" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Compliance Manager
                        </Link>
                        <Link href="/admin/location-management" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Location Management
                        </Link>
                        <Link href="/admin/payment-methods" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Payment Methods
                        </Link>
                        <Link href="/admin/clear-picks" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Clear Picks
                        </Link>
                        <Link href="/admin/init-dev-tournaments" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Init Dev Tournaments
                        </Link>
                        <Link href="/tournaments/dev" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Dev Tournaments
                        </Link>
                        <Link href="/testing-grounds" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Testing Grounds
                        </Link>
                        <Link href="/animation-dev" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Animation Dev
                        </Link>
                        <Link href="/payout-visualization-dev" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Payout Visualization
                        </Link>
                        <Link href="/payout-visualization-dev-2.0" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Payout Visualization 2.0
                        </Link>
                        <Link href="/payout-visualization-dev-3.0" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Payout Visualization 3.0
                        </Link>
                        <Link href="/dev-card-test" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Dev Card Test
                        </Link>
                        <Link href="/test-container" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Test Container
                        </Link>
                        <Link href="/draft/topdog-copy1" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Draft TopDog Copy 1
                        </Link>
                        <Link href="/draft/topdog-copy2" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Draft TopDog Copy 2
                        </Link>
                        <Link href="/dev-access" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Dev Access
                        </Link>
                        <Link href="/customer-support" className="block px-4 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7]">
                          Customer Support
                        </Link>
                      </div>
                    </div>
                    
                    <div className="px-4 py-2 border-t" style={{ borderColor: '#59c5bf' }}>
                      <div className="text-xs" style={{ color: '#59c5bf' }}>
                        <div>Dev Mode Active</div>
                        <div style={{ background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Click logo to toggle</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Navigation - Always Visible, Fixed Layout */}
            <div 
              className="flex items-center space-x-2 sm:space-x-4 md:space-x-8 justify-end flex-shrink-0"
              style={{
                transform: (() => {
                  if (draftAnimation.shouldEngorge) {
                    return 'rotate(0deg)'; // Stay stationary during engorgement
                  } else if (hasStartedPulsing) {
                    if (draftAnimation.isPulsing) {
                      return 'rotate(-8deg)'; // Counter-rotate to stay fixed
                    } else {
                      return 'rotate(-5deg)'; // Counter-rotate to stay fixed
                    }
                  } else {
                    return 'rotate(0deg)'; // Normal state
                  }
                })(),
                transformOrigin: 'bottom right',
                transition: draftAnimation.shouldEngorge ? 'none' : (hasStartedPulsing ? 'transform 0.5s ease-in-out' : 'none'),
                minWidth: 'fit-content',
                position: 'relative',
                overflow: 'visible',
                width: 'auto'
              }}
            >
                {/* Deposit Button - Only visible on homepage */}
                {router.pathname === '/' && (
                  <button
                    onClick={() => router.push('/mobile-payment')}
                    className="hover:text-accent px-3 sm:px-4 md:px-6 py-2 rounded-md text-base font-medium flex items-center cursor-pointer bg-[#111827] text-white hover:bg-[#1f2937] transition-colors border border-[#111827]"
                    style={{ 
                      fontSize: '1.25rem', 
                      WebkitTextStroke: '0.12px #18181b', 
                      pointerEvents: 'auto',
                      position: 'relative',
                      overflow: 'visible',
                      transform: 'translateZ(0)',
                      minWidth: 'fit-content'
                    }}
                  >
                    <span className="hidden md:inline">{depositButtonLabel}</span>
                    <span className="md:hidden">💰</span>
                  </button>
                )}

                {/* Profile Dropdown */}
                <div className="relative zoom-resistant" ref={dropdownRef} style={{ position: 'relative', overflow: 'visible', transform: 'translateZ(0)' }}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowProfileDropdown(!showProfileDropdown);
                    }}
                    className="hover:text-accent px-1 sm:px-2 md:px-3 py-2 rounded-md text-base font-medium flex items-center cursor-pointer"
                    style={{ 
                      fontSize: '1.25rem', 
                      WebkitTextStroke: '0.12px #18181b', 
                      color: '#ffffff', 
                      pointerEvents: 'auto',
                      backgroundColor: 'transparent',
                      position: 'relative',
                      overflow: 'visible',
                      transform: 'translateZ(0)',
                      minWidth: 'fit-content'
                    }}
                  >
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-64 rounded-3xl shadow-2xl py-1 z-50 zoom-resistant" style={{ 
                      zIndex: 9999, 
                      position: 'absolute', 
                      overflow: 'visible', 
                      transform: 'translateZ(0)', 
                      top: '100%', 
                      right: '0', 
                      minWidth: '256px', 
                      maxWidth: '320px',
                      backgroundColor: '#111827',
                      border: '1px solid #374151'
                    }}>
                      {/* Main Profile Section */}
                      <div className="px-4 py-2 border-b border-gray-600 zoom-resistant" style={{ position: 'relative', overflow: 'visible', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        <h4 className="text-xs font-semibold mb-2" style={{ 
                          position: 'relative', 
                          overflow: 'visible',
                          background: 'url(/wr_blue.png) no-repeat center center',
                          backgroundSize: 'cover',
                          WebkitBackgroundClip: 'text',
                          backgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>Profile & Account</h4>
                        <Link href="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7] transition-colors">
                          Profile
                        </Link>
                        <Link href="/my-teams" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7] transition-colors">
                          My Teams
                        </Link>
                        <Link href="/deposit" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7] transition-colors">
                          Deposit
                        </Link>
                        <Link href="/deposit-history" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7] transition-colors">
                          Transaction History
                        </Link>
                      </div>

                      {/* Analytics Section */}
                      <div className="px-4 py-2 border-b border-gray-600 zoom-resistant" style={{ position: 'relative', overflow: 'visible', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        <h4 className="text-xs font-semibold mb-2" style={{ 
                          position: 'relative', 
                          overflow: 'visible',
                          background: 'url(/wr_blue.png) no-repeat center center',
                          backgroundSize: 'cover',
                          WebkitBackgroundClip: 'text',
                          backgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>Analytics</h4>
                        <Link href="/statistics" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7] transition-colors">
                          Statistics
                        </Link>
                        <Link href="/rankings" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7] transition-colors">
                          Rankings
                        </Link>
                        <Link href="/exposure" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7] transition-colors">
                          Exposure Report
                        </Link>
                      </div>

                      {/* Research Section */}
                      <div className="px-4 py-2 border-b border-gray-600 zoom-resistant" style={{ position: 'relative', overflow: 'visible', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        <h4 className="text-xs font-semibold mb-2" style={{ 
                          position: 'relative', 
                          overflow: 'visible',
                          background: 'url(/wr_blue.png) no-repeat center center',
                          backgroundSize: 'cover',
                          WebkitBackgroundClip: 'text',
                          backgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>Research</h4>
                        <Link href="/unregulated-analysis" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7] transition-colors">
                          Unregulated Analysis
                        </Link>
                        <Link href="/location-research" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7] transition-colors">
                          Location Research
                        </Link>
                        <Link href="/ireland" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7] transition-colors">
                          Ireland
                        </Link>
                      </div>

                      {/* About Section */}
                      <div className="px-4 py-2 border-b border-gray-600 zoom-resistant" style={{ position: 'relative', overflow: 'visible', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        <h4 className="text-xs font-semibold mb-2" style={{ 
                          position: 'relative', 
                          overflow: 'visible',
                          background: 'url(/wr_blue.png) no-repeat center center',
                          backgroundSize: 'cover',
                          WebkitBackgroundClip: 'text',
                          backgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>About</h4>
                        <Link href="/our-mission" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7] transition-colors">
                          Our Mission
                        </Link>
                      </div>

                      {/* Development Section (if dev access) */}
                      {(
                        <div className="px-4 py-2 zoom-resistant" style={{ position: 'relative', overflow: 'visible' }}>
                          <h4 className="text-xs font-semibold mb-2" style={{ 
                            position: 'relative', 
                            overflow: 'visible',
                            background: 'url(/wr_blue.png) no-repeat center center',
                            backgroundSize: 'cover',
                            WebkitBackgroundClip: 'text',
                            backgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}>Development</h4>
                          <Link href="/tournaments/dev" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7] transition-colors">
                            Dev Tournaments
                          </Link>
                          <Link href="/dev-access" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7] transition-colors">
                            Dev Access
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                

            </div>
          </div>
        </div>
        </nav>
      </header>

    </>
  )
} 